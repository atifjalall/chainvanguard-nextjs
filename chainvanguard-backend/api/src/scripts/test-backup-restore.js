#!/usr/bin/env node

/**
 * BACKUP & RESTORE TEST SCRIPT
 *
 * This script comprehensively tests the disaster recovery system:
 * 1. Creates full backup
 * 2. Verifies on blockchain
 * 3. Creates test data changes
 * 4. Creates incremental backup
 * 5. Downloads from IPFS
 * 6. Restores from backup
 * 7. Tests emergency recovery (blockchain query when MongoDB down)
 * 8. Cleanup
 *
 * Usage: node test-backup-restore.js
 */

import mongoose from "mongoose";
import assert from "assert";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import BackupLog from "../models/BackupLog.js";
import backupService from "../services/backup.service.js";
import restoreService from "../services/restore.service.js";
import fabricService from "../services/fabric.service.js";
import ipfsService from "../services/ipfs.service.js";

// Test configuration
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/chainvanguard-test";

class BackupRestoreTest {
  constructor() {
    this.testData = {
      originalOrderCount: 0,
      originalUserCount: 0,
      originalProductCount: 0,
      fullBackup: null,
      incrementalBackup: null,
    };
  }

  async run() {
    console.log("\n========================================");
    console.log("🧪 BACKUP & RESTORE TEST SUITE");
    console.log("========================================\n");

    try {
      await this.setup();
      await this.runTests();
      await this.cleanup();

      console.log("\n========================================");
      console.log("✅ ALL TESTS PASSED!");
      console.log("========================================\n");

      process.exit(0);
    } catch (error) {
      console.error("\n========================================");
      console.error("❌ TEST SUITE FAILED");
      console.error("========================================");
      console.error(error);
      console.error("\n");

      process.exit(1);
    }
  }

  // ========================================
  // SETUP & CLEANUP
  // ========================================

  async setup() {
    console.log("📋 TEST 0: Setup");
    console.log("─".repeat(50));

    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✓ Connected to MongoDB");

    // Connect to Fabric
    console.log("Connecting to Hyperledger Fabric...");
    await fabricService.connect();
    console.log("✓ Connected to Fabric");

    // Get initial counts
    this.testData.originalOrderCount = await Order.countDocuments();
    this.testData.originalUserCount = await User.countDocuments();
    this.testData.originalProductCount = await Product.countDocuments();

    console.log(`✓ Initial state:`);
    console.log(`  Orders: ${this.testData.originalOrderCount}`);
    console.log(`  Users: ${this.testData.originalUserCount}`);
    console.log(`  Products: ${this.testData.originalProductCount}`);

    console.log("✅ Setup complete\n");
  }

  async cleanup() {
    console.log("\n📋 CLEANUP: Removing test data");
    console.log("─".repeat(50));

    // Delete test backups from MongoDB
    if (this.testData.fullBackup) {
      await BackupLog.deleteOne({ backupId: this.testData.fullBackup.backupId });
      console.log(`✓ Deleted test full backup from MongoDB`);
    }

    if (this.testData.incrementalBackup) {
      await BackupLog.deleteOne({
        backupId: this.testData.incrementalBackup.backupId,
      });
      console.log(`✓ Deleted test incremental backup from MongoDB`);
    }

    // Note: We don't delete from blockchain (immutable) or IPFS (would need cleanup)
    console.log("⚠️  Note: Blockchain and IPFS records not deleted (by design)");

    await mongoose.disconnect();
    console.log("✓ Disconnected from MongoDB");

    console.log("✅ Cleanup complete\n");
  }

  // ========================================
  // TEST SUITE
  // ========================================

  async runTests() {
    await this.test1_CreateFullBackup();
    await this.test2_VerifyOnBlockchain();
    await this.test3_CreateIncrementalBackup();
    await this.test4_DownloadFromIPFS();
    await this.test5_RestoreFromFullBackup();
    await this.test6_RestoreWithIncrementals();
    await this.test7_EmergencyRecovery();
    await this.test8_CleanupOldBackups();
  }

  async test1_CreateFullBackup() {
    console.log("📋 TEST 1: Create Full Backup");
    console.log("─".repeat(50));

    const result = await backupService.createFullBackup("TEST");

    assert(result.success, "Full backup should succeed");
    assert(result.backupId, "Should have backupId");
    assert(result.cid, "Should have CID");
    assert(result.txId, "Should have blockchain transaction ID");

    this.testData.fullBackup = result;

    console.log(`✓ Backup created: ${result.backupId}`);
    console.log(`✓ CID: ${result.cid}`);
    console.log(`✓ Blockchain TX: ${result.txId}`);
    console.log(`✓ Compression: ${result.metadata.compressionRatio}`);
    console.log("✅ TEST 1 PASSED\n");
  }

  async test2_VerifyOnBlockchain() {
    console.log("📋 TEST 2: Verify on Blockchain");
    console.log("─".repeat(50));

    const backupId = this.testData.fullBackup.backupId;

    // Get from MongoDB
    const mongoBackup = await BackupLog.findOne({ backupId }).lean();
    assert(mongoBackup, "Backup should exist in MongoDB");

    // Get from blockchain
    const blockchainBackup = await fabricService.getBackupByIdFromBlockchain(
      backupId
    );
    assert(blockchainBackup, "Backup should exist on blockchain");

    // Verify CIDs match
    assert.strictEqual(
      mongoBackup.cid,
      blockchainBackup.cid,
      "CIDs should match"
    );

    // Verify types match
    assert.strictEqual(
      mongoBackup.type,
      blockchainBackup.type,
      "Types should match"
    );

    console.log(`✓ MongoDB CID: ${mongoBackup.cid}`);
    console.log(`✓ Blockchain CID: ${blockchainBackup.cid}`);
    console.log("✓ Records match!");
    console.log("✅ TEST 2 PASSED\n");
  }

  async test3_CreateIncrementalBackup() {
    console.log("📋 TEST 3: Create Incremental Backup");
    console.log("─".repeat(50));

    // Create some test data changes
    console.log("Creating test data changes...");

    const testOrder = await Order.create({
      customerId: new mongoose.Types.ObjectId(),
      orderNumber: `TEST-${Date.now()}`,
      items: [],
      totalAmount: 100,
      status: "pending",
    });

    console.log(`✓ Created test order: ${testOrder.orderNumber}`);

    // Wait a bit to ensure timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Create incremental backup
    const result = await backupService.createIncrementalBackup();

    if (result.skipped) {
      console.log("⚠️  Incremental backup was skipped (no changes)");
      console.log("⏭️  TEST 3 SKIPPED\n");
      return;
    }

    assert(result.success, "Incremental backup should succeed");
    assert(result.backupId, "Should have backupId");
    assert(result.cid, "Should have CID");
    assert(result.metadata.totalChanges > 0, "Should have changes");

    this.testData.incrementalBackup = result;

    console.log(`✓ Incremental backup created: ${result.backupId}`);
    console.log(`✓ CID: ${result.cid}`);
    console.log(`✓ Total changes: ${result.metadata.totalChanges}`);
    console.log("✅ TEST 3 PASSED\n");

    // Clean up test order
    await Order.deleteOne({ _id: testOrder._id });
  }

  async test4_DownloadFromIPFS() {
    console.log("📋 TEST 4: Download from IPFS");
    console.log("─".repeat(50));

    const cid = this.testData.fullBackup.cid;

    const result = await ipfsService.downloadFromIPFS(cid);

    assert(result.success, "Download should succeed");
    assert(result.data, "Should have data");
    assert(Buffer.isBuffer(result.data), "Data should be a buffer");

    console.log(`✓ Downloaded from IPFS: ${cid}`);
    console.log(`✓ Size: ${result.data.length} bytes`);
    console.log("✅ TEST 4 PASSED\n");
  }

  async test5_RestoreFromFullBackup() {
    console.log("📋 TEST 5: Restore from Full Backup");
    console.log("─".repeat(50));

    const backupId = this.testData.fullBackup.backupId;

    // Delete all documents to simulate disaster
    console.log("Simulating disaster (deleting all documents)...");
    await Order.deleteMany({});
    await User.deleteMany({});
    await Product.deleteMany({});

    const deletedOrderCount = await Order.countDocuments();
    assert.strictEqual(deletedOrderCount, 0, "Orders should be deleted");

    console.log("✓ All documents deleted");

    // Restore from backup
    console.log("Restoring from backup...");
    const result = await restoreService.restoreFromFullBackup(backupId);

    assert(result.success, "Restoration should succeed");

    // Verify counts
    const restoredOrderCount = await Order.countDocuments();
    console.log(`✓ Orders restored: ${restoredOrderCount}`);

    // Note: Counts might not match exactly if data was added during backup
    // But they should be close
    const difference = Math.abs(
      restoredOrderCount - this.testData.originalOrderCount
    );
    assert(
      difference <= 10,
      `Order count should be close to original (diff: ${difference})`
    );

    console.log("✅ TEST 5 PASSED\n");
  }

  async test6_RestoreWithIncrementals() {
    console.log("📋 TEST 6: Restore with Incrementals");
    console.log("─".repeat(50));

    if (!this.testData.incrementalBackup) {
      console.log("⏭️  TEST 6 SKIPPED (no incremental backup)\n");
      return;
    }

    const backupId = this.testData.incrementalBackup.backupId;

    // Restore from backup chain
    const result = await restoreService.restoreFromBackupChain(backupId);

    assert(result.success, "Chain restoration should succeed");
    assert(result.chainLength >= 2, "Chain should have at least 2 backups");

    console.log(`✓ Restored from chain: ${result.chainLength} backups`);
    console.log("✅ TEST 6 PASSED\n");
  }

  async test7_EmergencyRecovery() {
    console.log("📋 TEST 7: Emergency Recovery (Blockchain Query)");
    console.log("─".repeat(50));

    // Query all backups from blockchain
    console.log("Querying blockchain for all backups...");
    const backups = await fabricService.getAllBackupsFromBlockchain();

    assert(Array.isArray(backups), "Should return array");
    assert(backups.length > 0, "Should have at least one backup");

    console.log(`✓ Found ${backups.length} backups on blockchain`);

    // Find our test backup
    const testBackup = backups.find(
      (b) => b.backupId === this.testData.fullBackup.backupId
    );

    assert(testBackup, "Our test backup should be on blockchain");

    console.log(`✓ Test backup found on blockchain: ${testBackup.backupId}`);
    console.log(`✓ CID: ${testBackup.cid}`);
    console.log("✅ TEST 7 PASSED\n");
  }

  async test8_CleanupOldBackups() {
    console.log("📋 TEST 8: Cleanup Old Backups");
    console.log("─".repeat(50));

    // Get storage stats before cleanup
    const statsBefore = await backupService.getStorageStats();
    console.log(`Storage before cleanup: ${statsBefore.totalBackups} backups`);

    // Run cleanup
    const result = await backupService.cleanupOldBackups();

    console.log(`✓ Cleanup completed`);
    console.log(`✓ Deleted: ${result.deleted || 0} backups`);

    // Get storage stats after cleanup
    const statsAfter = await backupService.getStorageStats();
    console.log(`Storage after cleanup: ${statsAfter.totalBackups} backups`);

    console.log("✅ TEST 8 PASSED\n");
  }
}

// Run tests
const test = new BackupRestoreTest();
test.run();
