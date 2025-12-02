import zlib from "zlib";
import { promisify } from "util";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import VendorRequest from "../models/VendorRequest.js";
import BackupLog from "../models/BackupLog.js";
import ipfsService from "./ipfs.service.js";
import BlockchainLog from "../models/BlockchainLog.js";

const gunzip = promisify(zlib.gunzip);

/**
 * RestoreService
 * Handles restoration of MongoDB from IPFS backups
 *
 * DISASTER RECOVERY SCENARIO:
 * 1. MongoDB is deleted/corrupted
 * 2. Query Hyperledger blockchain for backup CIDs
 * 3. Download backup from IPFS using CID
 * 4. Decompress and restore to MongoDB
 * 5. Verify restoration
 */
class RestoreService {
  constructor() {
    this.COLLECTIONS = {
      orders: Order,
      users: User,
      products: Product,
      vendorRequests: VendorRequest,
    };

    // Retry configuration
    this.MAX_RETRIES = 3;
    this.RETRY_DELAY = 2000; // 2 seconds
  }

  // ========================================
  // RESTORE FROM FULL BACKUP
  // ========================================

  /**
   * Restore from full backup only
   * Use this for simple restoration without incrementals
   *
   * @param {string} backupId - Backup ID to restore from
   * @param {object} options - Restoration options
   * @returns {object} Restoration report
   */
  async restoreFromFullBackup(backupId, options = {}) {
    const startTime = Date.now();
    console.log(`🔄 Starting restoration from backup: ${backupId}`);

    // Create blockchain log for restore start
    await BlockchainLog.createLog({
      type: "restore_started",
      entityType: "restore",
      entityId: null,
      action: `Restore started from backup: ${backupId}`,
      status: "pending",
      data: {
        backupId,
        options,
      },
    });

    try {
      // Step 1: Get backup metadata
      console.log("📋 Step 1: Getting backup metadata...");
      const backup = await this._getBackupMetadata(backupId);

      if (!backup) {
        throw new Error(`Backup ${backupId} not found`);
      }

      if (backup.type !== "FULL") {
        throw new Error(
          `Backup ${backupId} is not a full backup. Use restoreFromBackupChain() for incremental backups.`
        );
      }

      console.log(
        `   ✓ Backup found: ${backup.type} backup from ${backup.timestamp}`
      );
      console.log(`   CID: ${backup.cid}`);

      // Step 2: Download from IPFS (with retries)
      console.log("📥 Step 2: Downloading from IPFS...");
      const compressed = await this._downloadWithRetry(backup.cid);
      console.log(`   ✓ Downloaded ${this._formatBytes(compressed.length)}`);

      // Step 3: Decompress
      console.log("🗜️  Step 3: Decompressing...");
      const decompressed = await gunzip(compressed);
      console.log(
        `   ✓ Decompressed ${this._formatBytes(decompressed.length)}`
      );

      // Step 4: Parse JSON
      console.log("📝 Step 4: Parsing backup data...");
      const backupData = JSON.parse(decompressed.toString());
      console.log(`   ✓ Backup version: ${backupData.version || "1.0"}`);
      console.log(`   ✓ Backup timestamp: ${backupData.timestamp}`);

      // Step 5: Verify backup integrity
      console.log("✓ Step 5: Verifying backup integrity...");
      this._verifyBackupData(backupData);
      console.log(`   ✓ Backup data is valid`);

      // Step 6: Drop existing collections (if not in safe mode)
      if (!options.safeMode) {
        console.log("🗑️  Step 6: Dropping existing collections...");
        await this._dropCollections();
        console.log(`   ✓ Collections dropped`);
      } else {
        console.log("⚠️  Step 6: Skipped (safe mode enabled)");
      }

      // Step 7: Restore collections
      console.log("💾 Step 7: Restoring collections...");
      const restorationReport = await this._restoreCollections(
        backupData.collections
      );
      console.log(`   ✓ Collections restored`);

      // Step 8: Rebuild indexes
      console.log("🔧 Step 8: Rebuilding indexes...");
      await this._rebuildIndexes();
      console.log(`   ✓ Indexes rebuilt`);

      // Step 9: Verify restoration
      console.log("✅ Step 9: Verifying restoration...");
      const verification = await this._verifyRestoration(
        backupData.metadata.collections
      );
      console.log(
        `   ✓ Verification ${verification.valid ? "passed" : "failed"}`
      );

      const duration = Date.now() - startTime;
      console.log(
        `✅ Restoration completed in ${(duration / 1000).toFixed(2)}s`
      );

      const result = {
        success: true,
        backupId,
        restorationReport,
        verification,
        duration: `${(duration / 1000).toFixed(2)}s`,
        timestamp: new Date().toISOString(),
      };

      // Create blockchain log for successful restore
      const backupLog = await BackupLog.findOne({ backupId }).lean();
      await BlockchainLog.createLog({
        type: "restore_completed",
        entityType: "restore",
        entityId: backupLog?._id,
        action: `Restore completed successfully from backup: ${backupId}`,
        status: "success",
        data: {
          backupId,
          collections: restorationReport.collections,
          totalRestored: restorationReport.totalDocuments,
          duration: `${(duration / 1000).toFixed(2)}s`,
        },
        executionTime: duration,
      });

      return result;
    } catch (error) {
      console.error("❌ Restoration failed:", error);

      // Create blockchain log for failed restore
      await BlockchainLog.createLog({
        type: "restore_failed",
        entityType: "restore",
        entityId: null,
        action: `Restore failed from backup: ${backupId}`,
        status: "failed",
        error: error.message,
        data: {
          backupId,
          error: error.message,
        },
        executionTime: Date.now() - startTime,
      });

      throw error;
    }
  }

  // ========================================
  // RESTORE WITH INCREMENTALS
  // ========================================

  /**
   * Restore from full backup + incremental chain
   * Use this for point-in-time recovery
   *
   * @param {string} backupId - Target backup ID (can be full or incremental)
   * @returns {object} Restoration report
   */
  async restoreFromBackupChain(backupId) {
    const startTime = Date.now();
    console.log(`🔄 Starting chain restoration to: ${backupId}`);

    try {
      // Step 1: Build restoration chain
      console.log("📋 Step 1: Building restoration chain...");
      const chain = await this._getRestorationChain(backupId);
      console.log(`   ✓ Restoration chain: ${chain.length} backups`);

      for (let i = 0; i < chain.length; i++) {
        console.log(
          `      ${i + 1}. ${chain[i].type} - ${chain[i].backupId} (${chain[i].timestamp})`
        );
      }

      // Step 2: Restore full backup first
      console.log("\n🔄 Step 2: Restoring full backup...");
      const fullBackup = chain[0];

      if (fullBackup.type !== "FULL") {
        throw new Error("First backup in chain must be a full backup");
      }

      await this.restoreFromFullBackup(fullBackup.backupId, {
        safeMode: false,
      });

      // Step 3: Apply incrementals in order
      console.log("\n🔄 Step 3: Applying incremental backups...");
      for (let i = 1; i < chain.length; i++) {
        const incremental = chain[i];
        console.log(
          `\n   Applying incremental ${i}/${chain.length - 1}: ${incremental.backupId}`
        );

        await this._applyIncrementalBackup(incremental);
      }

      const duration = Date.now() - startTime;
      console.log(
        `\n✅ Chain restoration completed in ${(duration / 1000).toFixed(2)}s`
      );

      return {
        success: true,
        targetBackupId: backupId,
        chainLength: chain.length,
        duration: `${(duration / 1000).toFixed(2)}s`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ Chain restoration failed:", error);
      throw error;
    }
  }

  // ========================================
  // EMERGENCY RECOVERY (MongoDB Down)
  // ========================================

  /**
   * Emergency recovery when MongoDB is completely unavailable
   * Queries blockchain directly for backups
   *
   * @returns {object} Recovery report
   */
  async emergencyRecovery() {
    const startTime = Date.now();
    console.log("🚨 Starting emergency recovery...");

    // Create blockchain log for emergency recovery start
    await BlockchainLog.createLog({
      type: "emergency_recovery_started",
      entityType: "system",
      entityId: null,
      action: "Emergency recovery started",
      status: "pending",
      data: {
        reason: "MongoDB unavailable",
      },
    });

    try {
      // Step 1: Get backups from blockchain
      console.log("⛓️  Step 1: Querying blockchain for backups...");
      const backups = await fabricService.getAllBackupsFromBlockchain();
      console.log(`   ✓ Found ${backups.length} backups on blockchain`);

      if (backups.length === 0) {
        throw new Error("No backups found on blockchain");
      }

      // Step 2: Get latest full backup
      const latestFull = backups.find((b) => b.type === "FULL");

      if (!latestFull) {
        throw new Error("No full backups found on blockchain");
      }

      console.log(`\n   📦 Latest full backup:`);
      console.log(`      Backup ID: ${latestFull.backupId}`);
      console.log(`      CID: ${latestFull.cid}`);
      console.log(`      Timestamp: ${latestFull.timestamp}`);

      // Step 3: Attempt restoration
      console.log(`\n🔄 Step 3: Attempting restoration...`);

      // Download from IPFS
      const compressed = await this._downloadWithRetry(latestFull.cid);
      const decompressed = await gunzip(compressed);
      const backupData = JSON.parse(decompressed.toString());

      // Restore collections
      await this._dropCollections();
      const restorationReport = await this._restoreCollections(
        backupData.collections
      );
      await this._rebuildIndexes();

      const duration = Date.now() - startTime;

      // Create blockchain log for successful recovery
      await BlockchainLog.createLog({
        type: "emergency_recovery_completed",
        entityType: "system",
        entityId: null,
        action: "Emergency recovery completed successfully",
        status: "success",
        data: {
          backupUsed: latestBackup.backupId,
          duration: `${(duration / 1000).toFixed(2)}s`,
        },
        executionTime: duration,
      });

      console.log("\n✅ EMERGENCY RECOVERY SUCCESSFUL");
      console.log(`   Restored from: ${latestFull.backupId}`);
      console.log(
        `   Collections restored: ${Object.keys(restorationReport).length}`
      );

      return {
        success: true,
        mode: "EMERGENCY",
        backupId: latestFull.backupId,
        cid: latestFull.cid,
        restorationReport,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ Emergency recovery failed:", error);

      // Create blockchain log for failed recovery
      await BlockchainLog.createLog({
        type: "emergency_recovery_failed",
        entityType: "system",
        entityId: null,
        action: "Emergency recovery failed",
        status: "failed",
        error: error.message,
        data: {
          error: error.message,
        },
        executionTime: Date.now() - startTime,
      });

      throw error;
    }
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Get backup metadata (try MongoDB first, then blockchain)
   */
  async _getBackupMetadata(backupId) {
    try {
      // Try MongoDB first (fast)
      const backup = await BackupLog.findOne({ backupId }).lean();

      if (backup) {
        console.log("   ✓ Metadata retrieved from MongoDB");
        return backup;
      }
    } catch (mongoError) {
      console.warn("   ⚠️  MongoDB unavailable, querying blockchain...");
    }

    // Fallback to blockchain (disaster recovery)
    try {
      const backup = await fabricService.getBackupByIdFromBlockchain(backupId);
      console.log("   ✓ Metadata retrieved from blockchain");
      return backup;
    } catch (blockchainError) {
      console.error(
        "   ❌ Failed to get metadata from blockchain:",
        blockchainError
      );
      return null;
    }
  }

  /**
   * Download from IPFS with retries
   */
  async _downloadWithRetry(cid) {
    let lastError;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(`   Attempt ${attempt}/${this.MAX_RETRIES}...`);

        const result = await ipfsService.downloadFromIPFS(cid);

        if (!result.success) {
          throw new Error(result.error);
        }

        return result.data;
      } catch (error) {
        lastError = error;
        console.warn(`   ⚠️  Attempt ${attempt} failed: ${error.message}`);

        if (attempt < this.MAX_RETRIES) {
          const delay = this.RETRY_DELAY * Math.pow(2, attempt - 1);
          console.log(`   Retrying in ${delay / 1000}s...`);
          await this._sleep(delay);
        }
      }
    }

    throw new Error(
      `Failed to download from IPFS after ${this.MAX_RETRIES} attempts: ${lastError.message}`
    );
  }

  /**
   * Verify backup data structure
   */
  _verifyBackupData(backupData) {
    if (!backupData.collections) {
      throw new Error("Invalid backup: missing collections");
    }

    if (!backupData.metadata) {
      throw new Error("Invalid backup: missing metadata");
    }

    if (backupData.type !== "FULL" && backupData.type !== "INCREMENTAL") {
      throw new Error("Invalid backup: invalid type");
    }
  }

  /**
   * Drop all collections
   */
  async _dropCollections() {
    for (const [name, Model] of Object.entries(this.COLLECTIONS)) {
      try {
        await Model.collection.drop();
        console.log(`      ✓ Dropped ${name}`);
      } catch (error) {
        if (error.message.includes("ns not found")) {
          console.log(`      - ${name} (already empty)`);
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Restore collections from backup data
   */
  async _restoreCollections(collections) {
    const report = {};

    for (const [name, Model] of Object.entries(this.COLLECTIONS)) {
      if (!collections[name] || collections[name].length === 0) {
        console.log(`      - ${name}: No data to restore`);
        report[name] = { inserted: 0 };
        continue;
      }

      try {
        const result = await Model.insertMany(collections[name], {
          ordered: false,
        });

        report[name] = {
          inserted: result.length,
        };

        console.log(`      ✓ ${name}: ${result.length} documents restored`);
      } catch (error) {
        console.error(
          `      ❌ ${name}: Restoration failed - ${error.message}`
        );
        report[name] = {
          inserted: 0,
          error: error.message,
        };
      }
    }

    return report;
  }

  /**
   * Apply incremental backup (changes only)
   */
  async _applyIncrementalBackup(incremental) {
    // Download and decompress
    const compressed = await this._downloadWithRetry(incremental.cid);
    const decompressed = await gunzip(compressed);
    const backupData = JSON.parse(decompressed.toString());

    // Apply changes to each collection
    for (const [name, Model] of Object.entries(this.COLLECTIONS)) {
      const changes = backupData.changes[name];

      if (!changes || !changes.documents) {
        continue;
      }

      const result = await this._applyChanges(Model, name, changes.documents);

      console.log(
        `      ✓ ${name}: +${result.inserted} ~${result.updated} -${result.deleted}`
      );
    }
  }

  /**
   * Apply changes (created, updated, deleted) to a collection
   */
  async _applyChanges(Model, name, changes) {
    let inserted = 0;
    let updated = 0;
    let deleted = 0;

    // Insert created documents
    if (changes.created && changes.created.length > 0) {
      const result = await Model.insertMany(changes.created, {
        ordered: false,
      });
      inserted = result.length;
    }

    // Update modified documents
    if (changes.updated && changes.updated.length > 0) {
      for (const doc of changes.updated) {
        await Model.findByIdAndUpdate(doc._id, doc, { upsert: true });
        updated++;
      }
    }

    // Delete removed documents
    if (changes.deleted && changes.deleted.length > 0) {
      const ids = changes.deleted.map((doc) => doc._id);
      await Model.deleteMany({ _id: { $in: ids } });
      deleted = changes.deleted.length;
    }

    return { inserted, updated, deleted };
  }

  /**
   * Rebuild indexes
   */
  async _rebuildIndexes() {
    for (const [name, Model] of Object.entries(this.COLLECTIONS)) {
      try {
        await Model.syncIndexes();
        console.log(`      ✓ ${name}: Indexes rebuilt`);
      } catch (error) {
        console.warn(
          `      ⚠️  ${name}: Index rebuild failed - ${error.message}`
        );
      }
    }
  }

  /**
   * Verify restoration by comparing document counts
   */
  async _verifyRestoration(expectedCounts) {
    const differences = [];
    let valid = true;

    for (const [name, Model] of Object.entries(this.COLLECTIONS)) {
      const actualCount = await Model.countDocuments();
      const expectedCount = expectedCounts[name]?.count || 0;

      if (actualCount !== expectedCount) {
        valid = false;
        differences.push({
          collection: name,
          expected: expectedCount,
          actual: actualCount,
          difference: actualCount - expectedCount,
        });

        console.log(
          `      ⚠️  ${name}: Expected ${expectedCount}, got ${actualCount}`
        );
      } else {
        console.log(`      ✓ ${name}: ${actualCount} documents`);
      }
    }

    return {
      valid,
      differences,
    };
  }

  /**
   * Get restoration chain from blockchain
   */
  async _getRestorationChain(backupId) {
    // Try MongoDB first
    let backup;
    try {
      backup = await BackupLog.findOne({ backupId }).lean();
    } catch (mongoError) {
      // Fallback to blockchain
      backup = await fabricService.getBackupByIdFromBlockchain(backupId);
    }

    if (!backup) {
      throw new Error(`Backup ${backupId} not found`);
    }

    const chain = [];

    // If incremental, find parent full backup
    if (backup.type === "INCREMENTAL") {
      // Find parent full backup
      let parent;
      try {
        parent = await BackupLog.findOne({
          backupId: backup.parentBackup,
        }).lean();
      } catch (mongoError) {
        parent = await fabricService.getBackupByIdFromBlockchain(
          backup.parentBackup
        );
      }

      if (!parent) {
        throw new Error(`Parent backup ${backup.parentBackup} not found`);
      }

      chain.push(parent);

      // Find all incrementals between parent and target
      try {
        const incrementals = await BackupLog.find({
          parentBackup: parent.backupId,
          timestamp: { $lte: new Date(backup.timestamp) },
          status: "ACTIVE",
        })
          .sort({ timestamp: 1 })
          .lean();

        chain.push(...incrementals);
      } catch (mongoError) {
        const incrementals =
          await fabricService.getIncrementalChainFromBlockchain(
            parent.backupId
          );

        // Filter by timestamp
        const filtered = incrementals.filter(
          (inc) => new Date(inc.timestamp) <= new Date(backup.timestamp)
        );

        chain.push(...filtered);
      }
    } else {
      // It's already a full backup
      chain.push(backup);
    }

    return chain;
  }

  /**
   * List available backups for restoration
   */
  async listAvailableBackups(options = {}) {
    try {
      // Try MongoDB first
      const backups = await BackupLog.find({ status: "ACTIVE" })
        .sort({ timestamp: -1 })
        .limit(options.limit || 50)
        .lean();

      return {
        source: "mongodb",
        backups,
      };
    } catch (mongoError) {
      console.warn("MongoDB unavailable, querying blockchain...");

      // Fallback to blockchain
      const backups = await fabricService.getAllBackupsFromBlockchain();

      return {
        source: "blockchain",
        backups,
      };
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  _formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }
}

export default new RestoreService();
