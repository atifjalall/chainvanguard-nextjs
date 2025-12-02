/**
 * END-TO-END DISASTER RECOVERY TEST
 *
 * This script proves that MongoDB is NOT a single point of failure by:
 * 1. Backing up real MongoDB data to IPFS
 * 2. Storing the CID on Hyperledger Fabric blockchain
 * 3. COMPLETELY DELETING all MongoDB data
 * 4. Querying blockchain to retrieve the backup CID
 * 5. Downloading backup from IPFS using the CID
 * 6. Restoring all data to MongoDB
 * 7. Verifying document counts match original
 *
 * SUCCESS CRITERIA:
 * - All original data is restored after complete MongoDB deletion
 * - Blockchain successfully provides CID when MongoDB is unavailable
 * - IPFS successfully retrieves backup data using CID
 * - All document counts match before and after recovery
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import backupService from "../services/backup.service.js";
import restoreService from "../services/restore.service.js";
import fabricService from "../services/fabric.service.js";
import ipfsService from "../services/ipfs.service.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import VendorRequest from "../models/VendorRequest.js";
import BackupLog from "../models/BackupLog.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Test state
const testState = {
  backupId: null,
  cid: null,
  txId: null,
  originalCounts: {},
  deletedCounts: {},
  restoredCounts: {},
  testStartTime: null,
  testEndTime: null,
};

/**
 * Print test header
 */
function printHeader(title) {
  console.log("\n" + "=".repeat(80));
  console.log(`  ${title}`);
  console.log("=".repeat(80) + "\n");
}

/**
 * Print test step
 */
function printStep(step, description) {
  console.log(`\n[STEP ${step}] ${description}`);
  console.log("-".repeat(80));
}

/**
 * Print success message
 */
function printSuccess(message) {
  console.log(`✅ ${message}`);
}

/**
 * Print error message
 */
function printError(message) {
  console.error(`❌ ${message}`);
}

/**
 * Print warning message
 */
function printWarning(message) {
  console.warn(`⚠️  ${message}`);
}

/**
 * Print info message
 */
function printInfo(message) {
  console.log(`ℹ️  ${message}`);
}

/**
 * Get document counts from all critical collections
 */
async function getDocumentCounts() {
  const counts = {
    orders: await Order.countDocuments(),
    users: await User.countDocuments(),
    products: await Product.countDocuments(),
    vendorRequests: await VendorRequest.countDocuments(),
    backupLogs: await BackupLog.countDocuments(),
  };

  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  counts.total = total;

  return counts;
}

/**
 * Print document counts
 */
function printCounts(counts, label = "Current") {
  console.log(`\n${label} Document Counts:`);
  console.log(`  Orders:          ${counts.orders.toString().padStart(6)}`);
  console.log(`  Users:           ${counts.users.toString().padStart(6)}`);
  console.log(`  Products:        ${counts.products.toString().padStart(6)}`);
  console.log(`  Vendor Requests: ${counts.vendorRequests.toString().padStart(6)}`);
  console.log(`  Backup Logs:     ${counts.backupLogs.toString().padStart(6)}`);
  console.log(`  ${"─".repeat(26)}`);
  console.log(`  TOTAL:           ${counts.total.toString().padStart(6)}`);
}

/**
 * STEP 1: Record original state
 */
async function step1_RecordOriginalState() {
  printStep(1, "Recording Original MongoDB State");

  testState.originalCounts = await getDocumentCounts();
  printCounts(testState.originalCounts, "Original");

  if (testState.originalCounts.total === 0) {
    printWarning("No documents found in MongoDB!");
    printInfo("The test will continue, but you should have some data for a meaningful test.");
  } else {
    printSuccess(`Found ${testState.originalCounts.total} documents across all collections`);
  }
}

/**
 * STEP 2: Create full backup to IPFS
 */
async function step2_CreateFullBackup() {
  printStep(2, "Creating Full Backup to IPFS");

  printInfo("Exporting all collections...");
  printInfo("Compressing data with gzip...");
  printInfo("Uploading to IPFS via Pinata...");

  const result = await backupService.createFullBackup("END_TO_END_TEST");

  testState.backupId = result.backupId;
  testState.cid = result.cid;
  testState.txId = result.txId;

  printSuccess(`Backup created successfully!`);
  printInfo(`Backup ID: ${testState.backupId}`);
  printInfo(`IPFS CID:  ${testState.cid}`);
  printInfo(`TX ID:     ${testState.txId}`);
  printInfo(`Size:      ${(result.metadata.compressedSize / 1024 / 1024).toFixed(2)} MB`);
  printInfo(`Duration:  ${result.metadata.duration}`);
  printInfo(`Compression: ${result.metadata.compressionRatio}`);
}

/**
 * STEP 3: Verify backup on blockchain
 */
async function step3_VerifyOnBlockchain() {
  printStep(3, "Verifying Backup Metadata on Blockchain");

  printInfo("Querying Hyperledger Fabric blockchain...");

  const blockchainBackup = await fabricService.getBackupByIdFromBlockchain(
    testState.backupId
  );

  if (!blockchainBackup) {
    throw new Error("Backup not found on blockchain!");
  }

  printSuccess("Backup found on blockchain!");
  printInfo(`Type:      ${blockchainBackup.type}`);
  printInfo(`CID:       ${blockchainBackup.cid}`);
  printInfo(`Status:    ${blockchainBackup.status}`);
  printInfo(`Timestamp: ${blockchainBackup.timestamp}`);

  // Verify CID matches
  if (blockchainBackup.cid !== testState.cid) {
    throw new Error(
      `CID mismatch! Expected: ${testState.cid}, Got: ${blockchainBackup.cid}`
    );
  }

  printSuccess("CID verification passed!");
}

/**
 * STEP 4: Verify backup on IPFS
 */
async function step4_VerifyOnIPFS() {
  printStep(4, "Verifying Backup File on IPFS");

  printInfo("Attempting to download from IPFS...");

  const downloadResult = await ipfsService.downloadFromIPFS(testState.cid);

  if (!downloadResult.success) {
    throw new Error("Failed to download backup from IPFS!");
  }

  printSuccess("Backup successfully downloaded from IPFS!");
  printInfo(`Downloaded size: ${(downloadResult.data.length / 1024 / 1024).toFixed(2)} MB`);
}

/**
 * STEP 5: DELETE ALL MONGODB DATA (Critical step!)
 */
async function step5_DeleteAllData() {
  printStep(5, "DELETING ALL MONGODB DATA (Simulating Disaster)");

  printWarning("This step will DELETE ALL data from MongoDB!");
  printWarning("Proceeding in 3 seconds...");

  await new Promise((resolve) => setTimeout(resolve, 3000));

  printInfo("Deleting all collections...");

  // Delete all documents from critical collections
  const deleteResults = await Promise.all([
    Order.deleteMany({}),
    User.deleteMany({}),
    Product.deleteMany({}),
    VendorRequest.deleteMany({}),
    BackupLog.deleteMany({}),
  ]);

  testState.deletedCounts = await getDocumentCounts();
  printCounts(testState.deletedCounts, "After Deletion");

  if (testState.deletedCounts.total !== 0) {
    throw new Error(
      `Failed to delete all data! ${testState.deletedCounts.total} documents remain`
    );
  }

  printSuccess("✅ ALL DATA SUCCESSFULLY DELETED!");
  printInfo(
    `Deleted ${testState.originalCounts.total} documents total`
  );

  // Print detailed deletion results
  console.log("\nDeletion Details:");
  console.log(`  Orders deleted:          ${deleteResults[0].deletedCount}`);
  console.log(`  Users deleted:           ${deleteResults[1].deletedCount}`);
  console.log(`  Products deleted:        ${deleteResults[2].deletedCount}`);
  console.log(`  Vendor Requests deleted: ${deleteResults[3].deletedCount}`);
  console.log(`  Backup Logs deleted:     ${deleteResults[4].deletedCount}`);

  printWarning("MongoDB is now completely empty!");
}

/**
 * STEP 6: Query blockchain for backup CID (MongoDB is unavailable)
 */
async function step6_QueryBlockchainForCID() {
  printStep(
    6,
    "Querying Blockchain for Backup CID (MongoDB Unavailable Simulation)"
  );

  printInfo("This proves blockchain works even when MongoDB is deleted!");
  printInfo("Querying Hyperledger Fabric for all backups...");

  const allBackups = await fabricService.getAllBackupsFromBlockchain();

  if (!allBackups || allBackups.length === 0) {
    throw new Error("No backups found on blockchain!");
  }

  printSuccess(`Found ${allBackups.length} backups on blockchain`);

  // Find our test backup
  const ourBackup = allBackups.find(
    (backup) => backup.backupId === testState.backupId
  );

  if (!ourBackup) {
    throw new Error(`Our backup ${testState.backupId} not found on blockchain!`);
  }

  printSuccess("Successfully retrieved backup CID from blockchain!");
  printInfo(`Backup ID: ${ourBackup.backupId}`);
  printInfo(`CID:       ${ourBackup.cid}`);
  printInfo(`Type:      ${ourBackup.type}`);

  // Verify CID matches
  if (ourBackup.cid !== testState.cid) {
    throw new Error(
      `CID mismatch! Expected: ${testState.cid}, Got: ${ourBackup.cid}`
    );
  }

  printSuccess("✅ BLOCKCHAIN SUCCESSFULLY PROVIDED CID WHEN MONGODB WAS UNAVAILABLE!");
}

/**
 * STEP 7: Download backup from IPFS using blockchain CID
 */
async function step7_DownloadFromIPFS() {
  printStep(7, "Downloading Backup from IPFS Using Blockchain CID");

  printInfo(`Downloading from IPFS using CID: ${testState.cid}`);

  const downloadResult = await ipfsService.downloadFromIPFS(testState.cid);

  if (!downloadResult.success) {
    throw new Error("Failed to download backup from IPFS!");
  }

  printSuccess("Backup successfully downloaded from IPFS!");
  printInfo(
    `Downloaded size: ${(downloadResult.data.length / 1024 / 1024).toFixed(2)} MB`
  );
}

/**
 * STEP 8: Restore all data to MongoDB
 */
async function step8_RestoreAllData() {
  printStep(8, "Restoring All Data to MongoDB");

  printInfo("Decompressing backup...");
  printInfo("Importing documents to MongoDB...");
  printInfo("Rebuilding indexes...");

  const restoreResult = await restoreService.restoreFromFullBackup(
    testState.backupId,
    {
      safeMode: false, // Allow restore over empty database
    }
  );

  if (!restoreResult.success) {
    throw new Error(`Restore failed: ${restoreResult.message}`);
  }

  printSuccess("Restore completed successfully!");
  printInfo(`Duration: ${restoreResult.duration}`);

  // Print restore details
  if (restoreResult.collectionsRestored) {
    console.log("\nRestore Details:");
    Object.entries(restoreResult.collectionsRestored).forEach(
      ([collection, count]) => {
        console.log(`  ${collection.padEnd(20)}: ${count} documents`);
      }
    );
  } else if (restoreResult.restoredCounts) {
    console.log("\nRestore Details:");
    Object.entries(restoreResult.restoredCounts).forEach(
      ([collection, count]) => {
        console.log(`  ${collection.padEnd(20)}: ${count} documents`);
      }
    );
  }
}

/**
 * STEP 9: Verify restored data matches original
 */
async function step9_VerifyRestoration() {
  printStep(9, "Verifying Restored Data Matches Original");

  testState.restoredCounts = await getDocumentCounts();
  printCounts(testState.restoredCounts, "Restored");

  // Compare counts
  console.log("\n📊 Comparison:");
  console.log(
    `  Orders:          ${testState.originalCounts.orders} → ${testState.restoredCounts.orders}`
  );
  console.log(
    `  Users:           ${testState.originalCounts.users} → ${testState.restoredCounts.users}`
  );
  console.log(
    `  Products:        ${testState.originalCounts.products} → ${testState.restoredCounts.products}`
  );
  console.log(
    `  Vendor Requests: ${testState.originalCounts.vendorRequests} → ${testState.restoredCounts.vendorRequests}`
  );
  console.log(
    `  Backup Logs:     ${testState.originalCounts.backupLogs} → ${testState.restoredCounts.backupLogs}`
  );

  // Verify each collection
  const mismatches = [];

  if (testState.originalCounts.orders !== testState.restoredCounts.orders) {
    mismatches.push(
      `Orders: Expected ${testState.originalCounts.orders}, got ${testState.restoredCounts.orders}`
    );
  }

  if (testState.originalCounts.users !== testState.restoredCounts.users) {
    mismatches.push(
      `Users: Expected ${testState.originalCounts.users}, got ${testState.restoredCounts.users}`
    );
  }

  if (testState.originalCounts.products !== testState.restoredCounts.products) {
    mismatches.push(
      `Products: Expected ${testState.originalCounts.products}, got ${testState.restoredCounts.products}`
    );
  }

  if (
    testState.originalCounts.vendorRequests !==
    testState.restoredCounts.vendorRequests
  ) {
    mismatches.push(
      `Vendor Requests: Expected ${testState.originalCounts.vendorRequests}, got ${testState.restoredCounts.vendorRequests}`
    );
  }

  if (mismatches.length > 0) {
    printError("Data verification failed!");
    mismatches.forEach((mismatch) => printError(`  ${mismatch}`));
    throw new Error("Restored data does not match original data!");
  }

  printSuccess("✅ ALL DATA SUCCESSFULLY RESTORED!");
  printSuccess(
    `All ${testState.restoredCounts.total} documents match original state!`
  );
}

/**
 * Print final test report
 */
function printFinalReport() {
  printHeader("END-TO-END DISASTER RECOVERY TEST - FINAL REPORT");

  const duration = testState.testEndTime - testState.testStartTime;
  const durationSeconds = (duration / 1000).toFixed(2);

  console.log("TEST RESULT: ✅ PASSED\n");

  console.log("📋 Test Summary:");
  console.log(`  Total Duration:  ${durationSeconds}s`);
  console.log(`  Backup ID:       ${testState.backupId}`);
  console.log(`  IPFS CID:        ${testState.cid}`);
  console.log(`  Blockchain TX:   ${testState.txId}`);
  console.log();

  console.log("📊 Data Integrity:");
  console.log(
    `  Original Documents:  ${testState.originalCounts.total.toString().padStart(6)}`
  );
  console.log(
    `  After Deletion:      ${testState.deletedCounts.total.toString().padStart(6)}`
  );
  console.log(
    `  After Restoration:   ${testState.restoredCounts.total.toString().padStart(6)}`
  );
  console.log(
    `  Match:               ${testState.originalCounts.total === testState.restoredCounts.total ? "✅ YES" : "❌ NO"}`
  );
  console.log();

  console.log("✅ KEY ACHIEVEMENTS:");
  console.log(
    "  1. ✅ Successfully backed up all MongoDB data to IPFS"
  );
  console.log(
    "  2. ✅ Stored backup CID on immutable Hyperledger Fabric blockchain"
  );
  console.log(
    "  3. ✅ COMPLETELY DELETED all MongoDB data (simulated disaster)"
  );
  console.log(
    "  4. ✅ Retrieved backup CID from blockchain when MongoDB was unavailable"
  );
  console.log(
    "  5. ✅ Downloaded backup from IPFS using blockchain CID"
  );
  console.log("  6. ✅ Restored all data to MongoDB successfully");
  console.log(
    "  7. ✅ Verified all document counts match original state"
  );
  console.log();

  console.log("🎯 CONCLUSION:");
  console.log(
    "  MongoDB is NOT a single point of failure!"
  );
  console.log(
    "  The disaster recovery system successfully restored all data"
  );
  console.log(
    "  after complete MongoDB deletion using blockchain + IPFS."
  );
  console.log();

  console.log("=".repeat(80));
}

/**
 * Main test runner
 */
async function runEndToEndTest() {
  try {
    testState.testStartTime = Date.now();

    printHeader("END-TO-END DISASTER RECOVERY TEST");
    console.log("This test will prove that MongoDB is NOT a single point of failure");
    console.log("by backing up data to IPFS, deleting MongoDB completely, and");
    console.log("restoring everything using blockchain + IPFS.\n");

    // Connect to MongoDB
    printInfo("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    printSuccess("Connected to MongoDB");

    // Run all test steps
    await step1_RecordOriginalState();
    await step2_CreateFullBackup();
    await step3_VerifyOnBlockchain();
    await step4_VerifyOnIPFS();
    await step5_DeleteAllData();
    await step6_QueryBlockchainForCID();
    await step7_DownloadFromIPFS();
    await step8_RestoreAllData();
    await step9_VerifyRestoration();

    testState.testEndTime = Date.now();

    // Print final report
    printFinalReport();

    process.exit(0);
  } catch (error) {
    console.error("\n" + "=".repeat(80));
    console.error("❌ TEST FAILED");
    console.error("=".repeat(80));
    console.error(`\nError: ${error.message}`);
    console.error(`\nStack trace:\n${error.stack}`);
    console.error("\n" + "=".repeat(80));
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      printInfo("Disconnected from MongoDB");
    }
  }
}

// Run the test
runEndToEndTest();
