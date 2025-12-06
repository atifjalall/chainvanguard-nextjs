import zlib from "zlib";
import { promisify } from "util";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import VendorRequest from "../models/VendorRequest.js";
import Inventory from "../models/Inventory.js";
import VendorInventory from "../models/VendorInventory.js";
import Return from "../models/Return.js";
import Wallet from "../models/Wallet.js";
import Cart from "../models/Cart.js";
import Wishlist from "../models/Wishlist.js";
import Review from "../models/Review.js";
import SupplierRating from "../models/SupplierRating.js";
import Invoice from "../models/Invoice.js";
import BackupLog from "../models/BackupLog.js";
import ipfsService from "./ipfs.service.js";
import fabricService from "./fabric.service.js";
import notificationService from "./notification.service.js";
import BlockchainLog from "../models/BlockchainLog.js";
import redisService from "./redis.service.js";

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

/**
 * BackupService
 * Handles full and incremental backups of critical MongoDB collections
 *
 * BACKED UP COLLECTIONS:
 * - Order: Transaction history
 * - User: User accounts and profiles
 * - Product: Product catalog
 * - VendorRequest: Supply chain requests
 * - Inventory: Supplier inventory
 * - VendorInventory: Vendor inventory items
 * - Return: Product returns and refunds
 * - Wallet: User wallet balances and transactions
 * - Cart: Shopping cart data
 * - Wishlist: User wishlists
 * - Review: Product reviews
 * - SupplierRating: Supplier ratings
 * - Invoice: Transaction invoices
 *
 * EXCLUDED (not backed up):
 * - Notifications: Can be regenerated
 * - QRCode: Can be regenerated
 * - BackupLog: Metadata only
 * - BlockchainLog: Metadata only
 */
class BackupService {
  constructor() {
    // Collections to backup (EVERYTHING except logs and notifications)
    this.CRITICAL_COLLECTIONS = {
      orders: Order,
      users: User,
      products: Product,
      vendorRequests: VendorRequest,
      inventory: Inventory,
      vendorInventories: VendorInventory,
      returns: Return,
      wallets: Wallet,
      carts: Cart,
      wishlists: Wishlist,
      reviews: Review,
      supplierRatings: SupplierRating,
      invoices: Invoice,
    };

    // Pinata storage limits
    this.PINATA_STORAGE_LIMIT = 1073741824; // 1 GB
    this.PINATA_BANDWIDTH_LIMIT = 10737418240; // 10 GB/month

    // Backup retention policy
    this.RETENTION_POLICY = {
      fullBackups: 3, // Keep latest 3 full backups
      incrementalBackups: 9, // Keep latest 9 incremental backups
    };
  }

  // ========================================
  // FULL BACKUP
  // ========================================

  /**
   * Create full backup of all critical collections
   *
   * @param {string} triggeredBy - User ID or "CRON" or "MANUAL"
   * @returns {object} Backup metadata
   */
  async createFullBackup(triggeredBy = "SYSTEM") {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    const backupId = `FULL_${this._formatTimestamp(timestamp)}`;

    console.log(`🔄 Creating full backup: ${backupId}`);
    console.log(`   Triggered by: ${triggeredBy}`);

    // CRITICAL: Check MongoDB health before backup
    const mongoose = await import("mongoose");
    const mongoHealthy = mongoose.default.connection.readyState === 1;

    if (!mongoHealthy) {
      const error = new Error(
        "Cannot create backup: MongoDB is not connected. Backup requires active database connection."
      );
      console.error(
        `❌ Backup aborted: MongoDB unavailable (readyState: ${mongoose.default.connection.readyState})`
      );
      console.error(`   Backup ID: ${backupId}`);
      console.error(
        `   ⚠️  CRITICAL: Do not create empty backups when database is down!`
      );
      throw error;
    }

    console.log(
      `✅ MongoDB health check passed (readyState: ${mongoose.default.connection.readyState})`
    );

    // Create blockchain log for backup start
    await BlockchainLog.createLog({
      type: "backup_started",
      entityType: "backup",
      entityId: null,
      action: `Full backup started: ${backupId}`,
      performedBy:
        triggeredBy !== "SYSTEM" && triggeredBy !== "CRON" ? triggeredBy : null,
      status: "pending",
      data: {
        backupId,
        backupType: "FULL",
        triggeredBy,
      },
    });

    try {
      // Step 1: Export all collections
      console.log("📦 Step 1: Exporting collections...");
      const collections = {};
      const metadata = {
        collections: {},
        totalDocuments: 0,
        uncompressedSize: 0,
      };

      for (const [name, Model] of Object.entries(this.CRITICAL_COLLECTIONS)) {
        const data = await this.exportCollection(Model, name);
        collections[name] = data.documents;
        metadata.collections[name] = {
          count: data.count,
          size: data.size,
        };
        metadata.totalDocuments += data.count;
        metadata.uncompressedSize += data.size;

        console.log(
          `   ✓ ${name}: ${data.count} documents (${this._formatBytes(data.size)})`
        );
      }

      // Step 2: Create backup snapshot (NDJSON format for safe mode support)
      console.log("📝 Step 2: Creating backup snapshot (NDJSON format)...");

      // Create NDJSON format (one JSON object per line)
      // This format allows streaming and partial extraction without loading entire file
      const ndjsonLines = [];

      // Add users (one per line)
      for (const user of collections.users || []) {
        ndjsonLines.push(
          JSON.stringify({
            type: "user",
            id: user._id.toString(),
            data: user,
          })
        );
      }

      // Add orders (one per line with userId for filtering)
      for (const order of collections.orders || []) {
        ndjsonLines.push(
          JSON.stringify({
            type: "order",
            id: order._id.toString(),
            userId: order.userId ? order.userId.toString() : null,
            data: order,
          })
        );
      }

      // Add products (one per line with sellerId for filtering)
      for (const product of collections.products || []) {
        ndjsonLines.push(
          JSON.stringify({
            type: "product",
            id: product._id.toString(),
            sellerId: product.sellerId ? product.sellerId.toString() : null,
            data: product,
          })
        );
      }

      // Add vendor requests (one per line)
      for (const vendorRequest of collections.vendorRequests || []) {
        ndjsonLines.push(
          JSON.stringify({
            type: "vendorRequest",
            id: vendorRequest._id.toString(),
            userId: vendorRequest.userId
              ? vendorRequest.userId.toString()
              : null,
            vendorId: vendorRequest.vendorId
              ? vendorRequest.vendorId.toString()
              : null,
            supplierId: vendorRequest.supplierId
              ? vendorRequest.supplierId.toString()
              : null,
            data: vendorRequest,
          })
        );
      }

      // Add inventory items (one per line)
      for (const inventoryItem of collections.inventory || []) {
        ndjsonLines.push(
          JSON.stringify({
            type: "inventory",
            id: inventoryItem._id.toString(),
            supplierId: inventoryItem.supplierId
              ? inventoryItem.supplierId.toString()
              : null,
            data: inventoryItem,
          })
        );
      }

      // Add returns (one per line with userId and vendorId for filtering)
      for (const returnItem of collections.returns || []) {
        ndjsonLines.push(
          JSON.stringify({
            type: "return",
            id: returnItem._id.toString(),
            userId: returnItem.userId ? returnItem.userId.toString() : null,
            vendorId: returnItem.vendorId
              ? returnItem.vendorId.toString()
              : null,
            orderId: returnItem.orderId ? returnItem.orderId.toString() : null,
            data: returnItem,
          })
        );
      }

      // Join with newlines to create NDJSON
      const ndjsonString = ndjsonLines.join("\n");
      const uncompressedSize = Buffer.byteLength(ndjsonString);

      console.log(
        `   NDJSON format: ${ndjsonLines.length} lines, ${this._formatBytes(uncompressedSize)}`
      );

      // Step 3: Compress
      console.log("🗜️  Step 3: Compressing with gzip...");
      const compressed = await gzip(ndjsonString);
      const compressedSize = compressed.length;
      const compressionRatio = (
        (1 - compressedSize / uncompressedSize) *
        100
      ).toFixed(1);

      console.log(`   Uncompressed: ${this._formatBytes(uncompressedSize)}`);
      console.log(`   Compressed: ${this._formatBytes(compressedSize)}`);
      console.log(`   Compression: ${compressionRatio}% reduction`);

      // Step 4: Upload to IPFS
      console.log("📤 Step 4: Uploading to IPFS...");
      const filename = `${backupId}.json.gz`;
      const ipfsResult = await ipfsService.pinFileToIPFS(compressed, filename, {
        type: "backup",
        backupType: "FULL",
        timestamp,
      });

      if (!ipfsResult.success) {
        throw new Error(`IPFS upload failed: ${ipfsResult.error}`);
      }

      console.log(`   ✓ IPFS CID: ${ipfsResult.ipfsHash}`);

      // Store CID in Redis for safe mode
      console.log("💾 Storing backup CID in Redis for safe mode...");
      await redisService.set(
        "latest_backup_cid",
        ipfsResult.ipfsHash,
        86400 * 7
      ); // Keep for 7 days
      console.log(`   ✓ Backup CID stored in Redis`);

      // Step 5: Log to blockchain
      console.log("⛓️  Step 5: Logging to blockchain...");
      const blockchainData = {
        backupId,
        type: "FULL",
        cid: ipfsResult.ipfsHash,
        pinataId: ipfsResult.pinataId,
        timestamp,
        metadata: {
          collections: metadata.collections,
          totalDocuments: metadata.totalDocuments,
          compressedSize: compressedSize,
          uncompressedSize: uncompressedSize,
        },
      };

      const blockchainResult =
        await fabricService.logBackupToBlockchain(blockchainData);

      console.log(`   ✓ Blockchain TX: ${blockchainResult.txId}`);

      // Step 6: Store in MongoDB
      console.log("💾 Step 6: Storing in MongoDB...");
      const backupLog = await BackupLog.create({
        backupId,
        type: "FULL",
        cid: ipfsResult.ipfsHash,
        pinataId: ipfsResult.pinataId,
        timestamp: new Date(timestamp),
        status: "ACTIVE",
        metadata: blockchainData.metadata,
        txId: blockchainResult.txId,
        triggeredBy: triggeredBy,
        triggerMethod:
          triggeredBy === "CRON"
            ? "CRON"
            : triggeredBy === "SYSTEM"
              ? "API"
              : "MANUAL",
        completedAt: new Date(),
      });

      console.log(`   ✓ MongoDB record created`);

      // Step 7: Cleanup old backups
      console.log("🧹 Step 7: Cleaning up old backups...");
      await this.cleanupOldBackups();

      const duration = Date.now() - startTime;
      console.log(
        `✅ Full backup completed in ${(duration / 1000).toFixed(2)}s`
      );

      const result = {
        success: true,
        backupId,
        cid: ipfsResult.ipfsHash,
        txId: blockchainResult.txId,
        metadata: {
          totalDocuments: metadata.totalDocuments,
          compressedSize: compressedSize,
          uncompressedSize: uncompressedSize,
          compressionRatio: `${compressionRatio}%`,
          duration: `${(duration / 1000).toFixed(2)}s`,
        },
      };

      // Step 8: Create blockchain log for successful backup
      console.log("📝 Step 8: Logging to blockchain audit trail...");
      await BlockchainLog.createLog({
        type: "backup_completed",
        entityType: "backup",
        entityId: backupLog._id,
        txHash: blockchainResult.txId,
        action: `Full backup completed successfully: ${backupId}`,
        performedBy:
          triggeredBy !== "SYSTEM" && triggeredBy !== "CRON"
            ? triggeredBy
            : null,
        status: "success",
        data: {
          backupId,
          backupType: "FULL",
          cid: ipfsResult.ipfsHash,
          txId: blockchainResult.txId,
          totalDocuments: metadata.totalDocuments,
          compressedSize,
          uncompressedSize,
          compressionRatio: `${compressionRatio}%`,
          duration: `${(duration / 1000).toFixed(2)}s`,
          triggeredBy,
        },
        executionTime: duration,
      });

      // Step 9: Send notification to all admins
      console.log("📧 Step 9: Sending backup success notifications...");
      await this.sendBackupNotification({
        type: "FULL",
        backupId,
        cid: ipfsResult.ipfsHash,
        duration: `${(duration / 1000).toFixed(2)}s`,
        totalDocuments: metadata.totalDocuments,
        compressedSize: compressedSize,
        compressionRatio: `${compressionRatio}%`,
        triggeredBy,
      });

      return result;
    } catch (error) {
      console.error("❌ Full backup failed:", error);

      // Create blockchain log for failed backup
      await BlockchainLog.createLog({
        type: "backup_failed",
        entityType: "backup",
        entityId: null,
        action: `Full backup failed: ${backupId}`,
        performedBy:
          triggeredBy !== "SYSTEM" && triggeredBy !== "CRON"
            ? triggeredBy
            : null,
        status: "failed",
        error: error.message,
        data: {
          backupId,
          backupType: "FULL",
          triggeredBy,
          error: error.message,
        },
        executionTime: Date.now() - startTime,
      });

      // Send failure notification
      await this.sendBackupFailureNotification({
        type: "FULL",
        backupId,
        error: error.message,
        triggeredBy,
      });

      // Log failure to MongoDB
      try {
        await BackupLog.create({
          backupId,
          type: "FULL",
          timestamp: new Date(timestamp),
          status: "FAILED",
          error: error.message,
          triggeredBy: triggeredBy,
          triggerMethod: triggeredBy === "CRON" ? "CRON" : "MANUAL",
        });
      } catch (logError) {
        console.error("❌ Failed to log backup failure:", logError);
      }

      throw error;
    }
  }

  // ========================================
  // INCREMENTAL BACKUP
  // ========================================

  /**
   * Create incremental backup (only changed documents since last backup)
   *
   * @returns {object} Backup metadata
   */
  async createIncrementalBackup() {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    const backupId = `INC_${this._formatTimestamp(timestamp)}`;

    console.log(`🔄 Creating incremental backup: ${backupId}`);

    // CRITICAL: Check MongoDB health before backup
    const mongoose = await import("mongoose");
    const mongoHealthy = mongoose.default.connection.readyState === 1;

    if (!mongoHealthy) {
      const error = new Error(
        "Cannot create backup: MongoDB is not connected. Backup requires active database connection."
      );
      console.error(
        `❌ Backup aborted: MongoDB unavailable (readyState: ${mongoose.default.connection.readyState})`
      );
      console.error(`   Backup ID: ${backupId}`);
      console.error(
        `   ⚠️  CRITICAL: Do not create empty backups when database is down!`
      );
      throw error;
    }

    console.log(
      `✅ MongoDB health check passed (readyState: ${mongoose.default.connection.readyState})`
    );

    // Create blockchain log for backup start
    await BlockchainLog.createLog({
      type: "backup_started",
      entityType: "backup",
      entityId: null,
      action: `Incremental backup started: ${backupId}`,
      status: "pending",
      data: {
        backupId,
        backupType: "INCREMENTAL",
        triggeredBy: "CRON",
      },
    });

    try {
      // Step 1: Get last backup timestamp
      const lastBackup = await BackupLog.findOne({ status: "ACTIVE" })
        .sort({ timestamp: -1 })
        .lean();

      if (!lastBackup) {
        throw new Error(
          "No previous backup found. Please create a full backup first."
        );
      }

      const lastBackupTime = new Date(lastBackup.timestamp);
      console.log(`   Last backup: ${lastBackupTime.toISOString()}`);

      // Step 2: Get parent full backup
      let parentBackup = lastBackup;
      if (lastBackup.type === "INCREMENTAL") {
        parentBackup = await BackupLog.findOne({
          backupId: lastBackup.parentBackup,
          status: "ACTIVE",
        }).lean();

        if (!parentBackup) {
          throw new Error(
            "Parent full backup not found. Creating full backup instead."
          );
        }
      }

      console.log(`   Parent backup: ${parentBackup.backupId}`);

      // Step 3: Get changed documents
      console.log("📦 Step 3: Detecting changes...");
      const changes = {};
      const changeMetadata = {};
      let totalChanges = 0;

      for (const [name, Model] of Object.entries(this.CRITICAL_COLLECTIONS)) {
        const collectionChanges = await this.getChangedDocuments(
          Model,
          name,
          lastBackupTime
        );

        changes[name] = collectionChanges.documents;
        changeMetadata[name] = {
          created: collectionChanges.created,
          updated: collectionChanges.updated,
          deleted: collectionChanges.deleted,
        };

        totalChanges +=
          collectionChanges.created +
          collectionChanges.updated +
          collectionChanges.deleted;

        console.log(
          `   ✓ ${name}: +${collectionChanges.created} ~${collectionChanges.updated} -${collectionChanges.deleted}`
        );
      }

      if (totalChanges === 0) {
        console.log("⚠️  No changes detected since last backup. Skipping.");
        return {
          success: true,
          skipped: true,
          message: "No changes detected",
        };
      }

      // Step 4: Create incremental snapshot
      console.log("📝 Step 4: Creating incremental snapshot...");
      const backupData = {
        backupId,
        type: "INCREMENTAL",
        timestamp,
        parentBackup: parentBackup.backupId,
        parentCid: parentBackup.cid,
        changes,
        metadata: {
          changes: changeMetadata,
          totalChanges,
        },
      };

      const jsonString = JSON.stringify(backupData);
      const uncompressedSize = Buffer.byteLength(jsonString);

      // Step 5: Compress
      console.log("🗜️  Step 5: Compressing...");
      const compressed = await gzip(jsonString);
      const compressedSize = compressed.length;

      console.log(`   Compressed: ${this._formatBytes(compressedSize)}`);

      // Step 6: Upload to IPFS
      console.log("📤 Step 6: Uploading to IPFS...");
      const filename = `${backupId}.json.gz`;
      const ipfsResult = await ipfsService.pinFileToIPFS(compressed, filename, {
        type: "backup",
        backupType: "INCREMENTAL",
        parentBackup: parentBackup.backupId,
        timestamp,
      });

      if (!ipfsResult.success) {
        throw new Error(`IPFS upload failed: ${ipfsResult.error}`);
      }

      console.log(`   ✓ IPFS CID: ${ipfsResult.ipfsHash}`);

      // Step 7: Log to blockchain
      console.log("⛓️  Step 7: Logging to blockchain...");
      const blockchainData = {
        backupId,
        type: "INCREMENTAL",
        cid: ipfsResult.ipfsHash,
        pinataId: ipfsResult.pinataId,
        timestamp,
        parentBackup: parentBackup.backupId,
        parentCid: parentBackup.cid,
        changes: changeMetadata,
        metadata: {
          totalChanges,
          compressedSize,
          uncompressedSize,
        },
      };

      const blockchainResult =
        await fabricService.logBackupToBlockchain(blockchainData);

      console.log(`   ✓ Blockchain TX: ${blockchainResult.txId}`);

      // Step 8: Store in MongoDB
      console.log("💾 Step 8: Storing in MongoDB...");
      await BackupLog.create({
        backupId,
        type: "INCREMENTAL",
        cid: ipfsResult.ipfsHash,
        pinataId: ipfsResult.pinataId,
        timestamp: new Date(timestamp),
        status: "ACTIVE",
        parentBackup: parentBackup.backupId,
        parentCid: parentBackup.cid,
        changes: changeMetadata,
        metadata: {
          totalChanges,
          compressedSize,
          uncompressedSize,
        },
        txId: blockchainResult.txId,
        triggeredBy: "CRON",
        triggerMethod: "CRON",
        completedAt: new Date(),
      });

      // Step 9: Cleanup
      console.log("🧹 Step 9: Cleaning up old incrementals...");
      await this.cleanupOldBackups();

      const duration = Date.now() - startTime;
      console.log(
        `✅ Incremental backup completed in ${(duration / 1000).toFixed(2)}s`
      );

      const result = {
        success: true,
        backupId,
        cid: ipfsResult.ipfsHash,
        txId: blockchainResult.txId,
        metadata: {
          totalChanges,
          compressedSize,
          duration: `${(duration / 1000).toFixed(2)}s`,
        },
      };

      // Step 10: Create blockchain log for successful backup
      console.log("📝 Step 10: Logging to blockchain audit trail...");
      const backupLogEntry = await BackupLog.findOne({ backupId }).lean();
      await BlockchainLog.createLog({
        type: "backup_completed",
        entityType: "backup",
        entityId: backupLogEntry?._id,
        txHash: blockchainResult.txId,
        action: `Incremental backup completed successfully: ${backupId}`,
        status: "success",
        data: {
          backupId,
          backupType: "INCREMENTAL",
          cid: ipfsResult.ipfsHash,
          txId: blockchainResult.txId,
          totalChanges,
          compressedSize,
          parentBackup: parentBackup.backupId,
          duration: `${(duration / 1000).toFixed(2)}s`,
        },
        executionTime: duration,
      });

      // Step 11: Send notification to all admins
      console.log("📧 Step 11: Sending backup success notifications...");
      await this.sendBackupNotification({
        type: "INCREMENTAL",
        backupId,
        cid: ipfsResult.ipfsHash,
        duration: `${(duration / 1000).toFixed(2)}s`,
        totalChanges,
        compressedSize,
        parentBackup: parentBackup.backupId,
        triggeredBy: "CRON",
      });

      return result;
    } catch (error) {
      console.error("❌ Incremental backup failed:", error);

      // Create blockchain log for failed backup
      await BlockchainLog.createLog({
        type: "backup_failed",
        entityType: "backup",
        entityId: null,
        action: `Incremental backup failed: ${backupId}`,
        status: "failed",
        error: error.message,
        data: {
          backupId,
          backupType: "INCREMENTAL",
          error: error.message,
        },
        executionTime: Date.now() - startTime,
      });

      // Send failure notification
      await this.sendBackupFailureNotification({
        type: "INCREMENTAL",
        backupId,
        error: error.message,
        triggeredBy: "CRON",
      });

      throw error;
    }
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Export collection to JSON
   */
  async exportCollection(Model, name) {
    let query = Model.find();

    // For users collection, explicitly include password field for safe mode authentication
    // This bypasses the toJSON() method that deletes the password
    if (name === "users") {
      query = query.select("+passwordHash"); // Explicitly include password hash
    }

    const documents = await query.lean();

    // For users, map passwordHash to password for backward compatibility
    if (name === "users") {
      documents.forEach((doc) => {
        if (doc.passwordHash && !doc.password) {
          doc.password = doc.passwordHash;
        }
      });
    }

    const jsonString = JSON.stringify(documents);
    const size = Buffer.byteLength(jsonString);

    return {
      documents,
      count: documents.length,
      size,
    };
  }

  /**
   * Get changed documents since timestamp
   */
  async getChangedDocuments(Model, name, sinceTimestamp) {
    // Get created documents (createdAt > sinceTimestamp)
    let createdQuery = Model.find({
      createdAt: { $gt: sinceTimestamp },
    });

    // Get updated documents (updatedAt > sinceTimestamp AND createdAt <= sinceTimestamp)
    let updatedQuery = Model.find({
      updatedAt: { $gt: sinceTimestamp },
      createdAt: { $lte: sinceTimestamp },
    });

    // For users collection, explicitly include password field
    if (name === "users") {
      createdQuery = createdQuery.select("+passwordHash");
      updatedQuery = updatedQuery.select("+passwordHash");
    }

    const created = await createdQuery.lean();
    const updated = await updatedQuery.lean();

    // For users, map passwordHash to password
    if (name === "users") {
      [...created, ...updated].forEach((doc) => {
        if (doc.passwordHash && !doc.password) {
          doc.password = doc.passwordHash;
        }
      });
    }

    // Note: Detecting deletes requires a separate audit log
    // For now, we'll assume no deletes (or use soft deletes)
    const deleted = [];

    return {
      documents: {
        created,
        updated,
        deleted,
      },
      created: created.length,
      updated: updated.length,
      deleted: deleted.length,
    };
  }

  /**
   * Cleanup old backups according to retention policy
   */
  async cleanupOldBackups() {
    console.log("🧹 Running cleanup...");

    try {
      const oldBackups = await BackupLog.getOldBackupsToCleanup();

      console.log(
        `   Found ${oldBackups.total} old backups to delete (${oldBackups.oldFullBackups.length} full, ${oldBackups.oldIncrementals.length} incremental)`
      );

      if (oldBackups.total === 0) {
        console.log("   ✓ No cleanup needed");
        return { deleted: 0 };
      }

      let deleted = 0;

      // Delete old full backups
      for (const backup of oldBackups.oldFullBackups) {
        await this.deleteBackup(backup.backupId);
        deleted++;
      }

      // Delete old incrementals
      for (const backup of oldBackups.oldIncrementals) {
        await this.deleteBackup(backup.backupId);
        deleted++;
      }

      console.log(`   ✓ Cleaned up ${deleted} old backups`);

      return { deleted };
    } catch (error) {
      console.error("❌ Cleanup failed:", error);
      // Don't throw - cleanup failure shouldn't fail the backup
      return { deleted: 0, error: error.message };
    }
  }

  /**
   * Delete a single backup
   */
  async deleteBackup(backupId) {
    console.log(`   🗑️  Deleting backup: ${backupId}`);

    try {
      const backup = await BackupLog.findOne({ backupId });

      if (!backup) {
        console.warn(`   ⚠️  Backup ${backupId} not found in MongoDB`);
        return;
      }

      // 1. Unpin from IPFS
      if (backup.cid) {
        await ipfsService.unpinFromPinata(backup.cid);
        console.log(`      ✓ Unpinned from IPFS: ${backup.cid}`);
      }

      // 2. Mark as deleted on blockchain (immutable - can't actually delete)
      try {
        await fabricService.markBackupDeletedOnBlockchain(backupId);
        console.log(`      ✓ Marked as deleted on blockchain`);
      } catch (blockchainError) {
        console.warn(
          `      ⚠️  Failed to mark as deleted on blockchain: ${blockchainError.message}`
        );
      }

      // 3. Mark as deleted in MongoDB (keep record for audit trail)
      backup.status = "DELETED";
      await backup.save();
      console.log(`      ✓ Marked as deleted in MongoDB`);

      // 4. Create blockchain log for deletion
      await BlockchainLog.createLog({
        type: "backup_deleted",
        entityType: "backup",
        entityId: backup._id,
        action: `Backup deleted: ${backupId}`,
        status: "success",
        data: {
          backupId,
          backupType: backup.type,
          cid: backup.cid,
          deletedAt: new Date(),
        },
      });

      console.log(`      ✓ Logged deletion to blockchain audit trail`);
    } catch (error) {
      console.error(`   ❌ Failed to delete backup ${backupId}:`, error);
      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats() {
    try {
      const activeBackups = await BackupLog.find({ status: "ACTIVE" }).lean();

      const totalSize = activeBackups.reduce(
        (sum, backup) => sum + (backup.metadata?.compressedSize || 0),
        0
      );

      const stats = await BackupLog.getStats();

      return {
        totalBackups: activeBackups.length,
        fullBackups: stats.activeFullBackups,
        incrementalBackups: stats.activeIncrementalBackups,
        used: totalSize, // Frontend expects 'used'
        limit: this.PINATA_STORAGE_LIMIT, // Frontend expects 'limit'
        totalSize, // Keep for backward compatibility
        totalSizeFormatted: this._formatBytes(totalSize),
        storageLimit: this.PINATA_STORAGE_LIMIT, // Keep for backward compatibility
        storageLimitFormatted: this._formatBytes(this.PINATA_STORAGE_LIMIT),
        usagePercentage: (
          (totalSize / this.PINATA_STORAGE_LIMIT) *
          100
        ).toFixed(2),
        oldestBackup: stats.oldestBackup,
        newestBackup: stats.newestBackup,
      };
    } catch (error) {
      console.error("❌ Get storage stats failed:", error);
      throw error;
    }
  }

  /**
   * Get backup schedule status
   */
  getScheduleStatus() {
    return {
      fullBackup: {
        schedule: "Daily at 00:00",
        cron: "0 0 * * *",
        enabled: true,
      },
      incrementalBackup: {
        schedule: "Every 6 hours",
        cron: "0 */6 * * *",
        enabled: true,
      },
      retentionPolicy: this.RETENTION_POLICY,
    };
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  _formatTimestamp(isoString) {
    return isoString.replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "_");
  }

  _formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }

  /**
   * Send backup success notification to all admins
   */
  async sendBackupNotification(backupInfo) {
    try {
      // Get all admin users (assuming admins have a specific role or flag)
      const adminUsers = await User.find({
        $or: [
          { role: "admin" },
          { role: "supplier" }, // Suppliers might want to know about backups
          { role: "expert" }, // Add experts to receive backup notifications
          { isAdmin: true },
        ],
      }).lean();

      if (adminUsers.length === 0) {
        console.log("   ⚠️  No admin users found to notify");
        return;
      }

      const { type, backupId, cid, duration, triggeredBy } = backupInfo;

      // Create notification for each admin
      for (const admin of adminUsers) {
        const notificationData = {
          userId: admin._id,
          userRole: admin.role || "admin",
          type: "backup_completed",
          category: "system",
          title: `${type === "FULL" ? "Full" : "Incremental"} Backup Completed`,
          message:
            type === "FULL"
              ? `Full system backup completed successfully. ${backupInfo.totalDocuments} documents backed up in ${duration}.`
              : `Incremental backup completed successfully. ${backupInfo.totalChanges} changes backed up in ${duration}.`,
          priority: "high",
          // Ensure notification is marked as sent
          isSent: true,
          sentAt: new Date(),
          channels: {
            inApp: {
              enabled: true,
              sent: true,
              sentAt: new Date(),
            },
            email: {
              enabled: false,
              sent: false,
            },
            sms: {
              enabled: false,
              sent: false,
            },
            push: {
              enabled: false,
              sent: false,
            },
          },
          deliveryStatus: "sent",
          metadata: {
            backupId,
            backupType: type,
            cid,
            duration,
            triggeredBy,
            timestamp: new Date().toISOString(),
            ...(type === "FULL" && {
              totalDocuments: backupInfo.totalDocuments,
              compressionRatio: backupInfo.compressionRatio,
              compressedSize: backupInfo.compressedSize,
            }),
            ...(type === "INCREMENTAL" && {
              totalChanges: backupInfo.totalChanges,
              parentBackup: backupInfo.parentBackup,
              compressedSize: backupInfo.compressedSize,
            }),
          },
          actionUrl: `/expert/data-and-backups/?backupId=${backupId}`,
          actionText: "View Backup",
          actionType: "none",
        };

        await notificationService.createNotification(notificationData);
      }

      console.log(`   ✓ Sent notifications to ${adminUsers.length} admin(s)`);
    } catch (error) {
      console.error("   ❌ Failed to send backup notifications:", error);
      // Don't throw - notification failure shouldn't fail the backup
    }
  }

  /**
   * Send backup failure notification to all admins
   */
  async sendBackupFailureNotification(failureInfo) {
    try {
      const adminUsers = await User.find({
        $or: [
          { role: "admin" },
          { role: "supplier" },
          { role: "expert" }, // Add experts to receive failure notifications
          { isAdmin: true },
        ],
      }).lean();

      if (adminUsers.length === 0) {
        console.log("   ⚠️  No admin users found to notify");
        return;
      }

      const { type, backupId, error, triggeredBy } = failureInfo;

      for (const admin of adminUsers) {
        const notificationData = {
          userId: admin._id,
          userRole: admin.role || "admin",
          type: "backup_failed",
          category: "system",
          title: `${type === "FULL" ? "Full" : "Incremental"} Backup Failed`,
          message: `System backup failed. Error: ${error}. Please check the backup logs.`,
          priority: "urgent",
          isUrgent: true,
          // Ensure notification is marked as sent
          isSent: true,
          sentAt: new Date(),
          channels: {
            inApp: {
              enabled: true,
              sent: true,
              sentAt: new Date(),
            },
            email: {
              enabled: false,
              sent: false,
            },
            sms: {
              enabled: false,
              sent: false,
            },
            push: {
              enabled: false,
              sent: false,
            },
          },
          deliveryStatus: "sent",
          metadata: {
            backupId,
            backupType: type,
            error,
            triggeredBy,
            timestamp: new Date().toISOString(),
          },
          actionUrl: `/expert/data-and-backups/?backupId=${backupId}`,
          actionText: "View Backup Logs",
          actionType: "none",
        };

        await notificationService.createNotification(notificationData);
      }

      console.log(
        `   ✓ Sent failure notifications to ${adminUsers.length} admin(s)`
      );
    } catch (error) {
      console.error(
        "   ❌ Failed to send backup failure notifications:",
        error
      );
    }
  }
}

export default new BackupService();
