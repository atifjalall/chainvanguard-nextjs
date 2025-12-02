import express from "express";
import backupService from "../services/backup.service.js";
import restoreService from "../services/restore.service.js";
import fabricService from "../services/fabric.service.js";
import backupCron from "../jobs/backup.cron.js";
import BackupLog from "../models/BackupLog.js";
import BlockchainLog from "../models/BlockchainLog.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * ========================================
 * BACKUP & RESTORE ROUTES
 * ========================================
 * Disaster recovery system for MongoDB
 * Requires admin or expert authorization
 */

// All routes require authentication and admin/expert role
router.use(authenticate);
router.use(authorizeRoles(["admin", "expert"]));

/**
 * POST /api/backups/manual
 * Trigger manual full backup
 *
 * @body {string} triggeredBy - Optional user ID
 * @returns {object} Backup metadata
 */
router.post("/manual", async (req, res) => {
  try {
    console.log(`📝 Manual backup requested by: ${req.user.userId}`);

    const backup = await backupService.createFullBackup(
      req.user.userId.toString()
    );

    res.json({
      success: true,
      message: "Full backup completed successfully",
      data: { backup },
    });
  } catch (error) {
    console.error("❌ Manual backup failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Backup failed. Please check logs for details.",
    });
  }
});

/**
 * GET /api/backups/list
 * Get all backups (MongoDB first, blockchain fallback)
 *
 * @query {number} limit - Max number of backups to return (default: 50)
 * @query {string} type - Filter by type: FULL or INCREMENTAL
 * @returns {array} List of backups
 */
router.get("/list", async (req, res) => {
  try {
    const { limit = 50, type } = req.query;

    let backups;
    let source = "mongodb";

    try {
      // Try MongoDB first (fast)
      const query = { status: "ACTIVE" };
      if (type) {
        query.type = type.toUpperCase();
      }

      backups = await BackupLog.find(query)
        .sort({ timestamp: -1 })
        .limit(parseInt(limit))
        .lean();

      console.log(`✅ Retrieved ${backups.length} backups from MongoDB`);
    } catch (mongoError) {
      console.warn("⚠️  MongoDB unavailable, querying blockchain...");
      source = "blockchain";

      // Fallback to blockchain
      backups = await fabricService.getAllBackupsFromBlockchain();

      if (type) {
        backups = backups.filter((b) => b.type === type.toUpperCase());
      }

      backups = backups.slice(0, parseInt(limit));

      console.log(`✅ Retrieved ${backups.length} backups from blockchain`);
    }

    res.json({
      success: true,
      data: {
        source,
        count: backups.length,
        backups,
      },
    });
  } catch (error) {
    console.error("❌ List backups failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/backups/blockchain
 * Force query from blockchain (for emergency recovery)
 *
 * @returns {array} List of backups from blockchain
 */
router.get("/blockchain", async (req, res) => {
  try {
    console.log("📋 Querying backups from blockchain (emergency mode)...");

    const backups = await fabricService.getAllBackupsFromBlockchain();

    res.json({
      success: true,
      data: {
        source: "blockchain",
        message: "Retrieved from Hyperledger Fabric blockchain",
        count: backups.length,
        backups,
      },
    });
  } catch (error) {
    console.error("❌ Blockchain query failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message:
        "Failed to query blockchain. Ensure Hyperledger Fabric network is running.",
    });
  }
});

/**
 * GET /api/backups/:backupId
 * Get single backup details
 *
 * @param {string} backupId - Backup ID
 * @returns {object} Backup details
 */
router.get("/:backupId", async (req, res) => {
  try {
    const { backupId } = req.params;

    let backup;
    let source = "mongodb";

    try {
      backup = await BackupLog.findOne({ backupId }).lean();
    } catch (mongoError) {
      console.warn("⚠️  MongoDB unavailable, querying blockchain...");
      source = "blockchain";
      backup = await fabricService.getBackupByIdFromBlockchain(backupId);
    }

    if (!backup) {
      return res.status(404).json({
        success: false,
        error: "Backup not found",
      });
    }

    res.json({
      success: true,
      data: {
        source,
        backup,
      },
    });
  } catch (error) {
    console.error("❌ Get backup failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/backups/restore/:backupId
 * Restore from backup
 *
 * @param {string} backupId - Backup ID to restore from
 * @body {boolean} includeIncrementals - Restore with incremental chain (default: false)
 * @body {boolean} safeMode - Don't drop collections before restore (default: false)
 * @returns {object} Restoration report
 */
router.post("/restore/:backupId", async (req, res) => {
  try {
    const { backupId } = req.params;
    const { includeIncrementals = false, safeMode = false } = req.body;

    console.log(`🔄 Restoration requested: ${backupId}`);
    console.log(`   Include incrementals: ${includeIncrementals}`);
    console.log(`   Safe mode: ${safeMode}`);
    console.log(`   Requested by: ${req.user._id}`);

    let result;

    if (includeIncrementals) {
      result = await restoreService.restoreFromBackupChain(backupId);
    } else {
      result = await restoreService.restoreFromFullBackup(backupId, {
        safeMode,
      });
    }

    res.json({
      success: true,
      message: "Restoration completed successfully",
      data: { result },
    });
  } catch (error) {
    console.error("❌ Restoration failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Restoration failed. Please check logs for details.",
    });
  }
});

/**
 * POST /api/backups/emergency-recovery
 * Emergency recovery when MongoDB is completely unavailable
 *
 * @returns {object} Recovery report
 */
router.post("/emergency-recovery", async (req, res) => {
  try {
    console.log("🚨 EMERGENCY RECOVERY requested");
    console.log(`   Requested by: ${req.user._id}`);

    const result = await restoreService.emergencyRecovery();

    res.json({
      success: true,
      message: "Emergency recovery completed successfully",
      data: { result },
    });
  } catch (error) {
    console.error("❌ Emergency recovery failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Emergency recovery failed. Please check logs for details.",
    });
  }
});

/**
 * DELETE /api/backups/:backupId
 * Delete backup (mark as deleted)
 *
 * @param {string} backupId - Backup ID to delete
 * @returns {object} Success message
 */
router.delete("/:backupId", async (req, res) => {
  try {
    const { backupId } = req.params;

    console.log(`🗑️  Delete backup requested: ${backupId}`);
    console.log(`   Requested by: ${req.user._id}`);

    await backupService.deleteBackup(backupId);

    res.json({
      success: true,
      message: "Backup deleted successfully",
      data: { backupId },
    });
  } catch (error) {
    console.error("❌ Delete backup failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/backups/stats/storage
 * Get storage usage statistics
 *
 * @returns {object} Storage statistics
 */
router.get("/stats/storage", async (req, res) => {
  try {
    const stats = await backupService.getStorageStats();

    res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    console.error("❌ Get storage stats failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/backups/stats/blockchain
 * Get backup statistics from blockchain
 *
 * @returns {object} Backup statistics from blockchain
 */
router.get("/stats/blockchain", async (req, res) => {
  try {
    const stats = await fabricService.getBackupStatsFromBlockchain();

    res.json({
      success: true,
      data: {
        source: "blockchain",
        stats,
      },
    });
  } catch (error) {
    console.error("❌ Get blockchain stats failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/backups/schedule
 * Get backup schedule configuration
 *
 * @returns {object} Schedule configuration
 */
router.get("/schedule", async (req, res) => {
  try {
    const schedule = backupService.getScheduleStatus();

    res.json({
      success: true,
      data: { schedule },
    });
  } catch (error) {
    console.error("❌ Get schedule failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/backups/cleanup
 * Manually trigger cleanup of old backups
 *
 * @returns {object} Cleanup report
 */
router.post("/cleanup", async (req, res) => {
  try {
    console.log("🧹 Manual cleanup requested");
    console.log(`   Requested by: ${req.user._id}`);

    const result = await backupService.cleanupOldBackups();

    res.json({
      success: true,
      message: "Cleanup completed",
      data: { result },
    });
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/backups/verify/:backupId
 * Verify backup integrity (cross-check MongoDB vs blockchain)
 *
 * @param {string} backupId - Backup ID to verify
 * @returns {object} Verification result
 */
router.post("/verify/:backupId", async (req, res) => {
  try {
    const { backupId } = req.params;

    console.log(`✓ Verify backup requested: ${backupId}`);

    // Get from MongoDB
    const mongoBackup = await BackupLog.findOne({ backupId }).lean();

    // Get from blockchain
    const blockchainBackup =
      await fabricService.getBackupByIdFromBlockchain(backupId);

    if (!mongoBackup && !blockchainBackup) {
      return res.status(404).json({
        success: false,
        error: "Backup not found in MongoDB or blockchain",
      });
    }

    // Compare
    const match =
      mongoBackup &&
      blockchainBackup &&
      mongoBackup.cid === blockchainBackup.cid &&
      mongoBackup.type === blockchainBackup.type &&
      mongoBackup.status === blockchainBackup.status;

    res.json({
      success: true,
      data: {
        match,
        mongoBackup: mongoBackup || null,
        blockchainBackup: blockchainBackup || null,
        message: match
          ? "✅ Backup verified: MongoDB and blockchain records match"
          : "⚠️ Mismatch detected between MongoDB and blockchain",
      },
    });
  } catch (error) {
    console.error("❌ Verification failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ========================================
// EXPERT DASHBOARD ENDPOINTS
// ========================================

/**
 * GET /api/backups/dashboard/status
 * Get comprehensive dashboard status
 * For Expert Dashboard - Data & Backups page
 *
 * @returns {object} Complete status including scheduler, storage, alerts
 */
router.get("/dashboard/status", async (req, res) => {
  try {
    const status = backupCron.getDetailedStatus();

    res.json({
      success: true,
      data: { status },
    });
  } catch (error) {
    console.error("❌ Get dashboard status failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/backups/dashboard/alerts
 * Get recent alerts for dashboard
 *
 * @query {number} limit - Number of alerts to return (default: 50)
 * @returns {array} Recent alerts
 */
router.get("/dashboard/alerts", async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const alerts = backupCron.getAlertHistory(parseInt(limit));

    res.json({
      success: true,
      data: {
        count: alerts.length,
        alerts,
      },
    });
  } catch (error) {
    console.error("❌ Get alerts failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/backups/dashboard/critical-alerts
 * Get critical alerts only
 *
 * @query {number} limit - Number of alerts to return (default: 20)
 * @returns {array} Critical alerts
 */
router.get("/dashboard/critical-alerts", async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const alerts = backupCron.getCriticalAlerts(parseInt(limit));

    res.json({
      success: true,
      data: {
        count: alerts.length,
        alerts,
      },
    });
  } catch (error) {
    console.error("❌ Get critical alerts failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/backups/dashboard/trigger-full
 * Trigger full backup from dashboard
 *
 * @returns {object} Backup result
 */
router.post("/dashboard/trigger-full", async (req, res) => {
  try {
    console.log(`🔄 Dashboard triggered full backup`);
    console.log(`   User: ${req.user?.userId || "UNKNOWN"}`);

    const triggeredBy = req.user?.userId || "MANUAL";
    const result = await backupCron.triggerFullBackupNow(triggeredBy);

    res.json({
      success: true,
      message: "Full backup completed successfully",
      data: { backup: result },
    });
  } catch (error) {
    console.error("❌ Dashboard full backup failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/backups/dashboard/trigger-incremental
 * Trigger incremental backup from dashboard
 *
 * @returns {object} Backup result
 */
router.post("/dashboard/trigger-incremental", async (req, res) => {
  try {
    console.log(`🔄 Dashboard triggered incremental backup`);
    console.log(`   User: ${req.user.userId}`);

    const result = await backupCron.triggerIncrementalBackupNow();

    res.json({
      success: true,
      message: result.skipped
        ? "Incremental backup skipped (no changes)"
        : "Incremental backup completed successfully",
      data: { backup: result },
    });
  } catch (error) {
    console.error("❌ Dashboard incremental backup failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/backups/dashboard/check-storage
 * Force storage check from dashboard
 *
 * @returns {object} Storage statistics
 */
router.post("/dashboard/check-storage", async (req, res) => {
  try {
    console.log(`📊 Dashboard triggered storage check`);
    console.log(`   User: ${req.user.userId}`);

    const stats = await backupCron.checkStorageNow();

    res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    console.error("❌ Dashboard storage check failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/backups/dashboard/start-scheduler
 * Start backup scheduler from dashboard
 *
 * @returns {object} Success message
 */
router.post("/dashboard/start-scheduler", async (req, res) => {
  try {
    console.log(`▶️ Dashboard started backup scheduler`);
    console.log(`   User: ${req.user.userId}`);

    backupCron.start();

    res.json({
      success: true,
      message: "Backup scheduler started",
      data: { status: backupCron.getStatus() },
    });
  } catch (error) {
    console.error("❌ Start scheduler failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/backups/dashboard/stop-scheduler
 * Stop backup scheduler from dashboard
 *
 * @returns {object} Success message
 */
router.post("/dashboard/stop-scheduler", async (req, res) => {
  try {
    console.log(`⏸️ Dashboard stopped backup scheduler`);
    console.log(`   User: ${req.user.userId}`);

    backupCron.stop();

    res.json({
      success: true,
      message: "Backup scheduler stopped",
      data: { status: backupCron.getStatus() },
    });
  } catch (error) {
    console.error("❌ Stop scheduler failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/backups/audit-trail
 * Get blockchain audit trail for all backup operations
 *
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 50)
 * @query {string} type - Filter by type (backup_started, backup_completed, etc.)
 * @returns {array} Audit trail logs
 */
router.get("/audit-trail", async (req, res) => {
  try {
    const { page = 1, limit = 50, type } = req.query;

    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
      entityType: "backup",
    };

    if (type) {
      filters.type = type;
    }

    const result = await BlockchainLog.getLogs(filters);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("❌ Get audit trail failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/backups/:backupId/audit-trail
 * Get blockchain audit trail for specific backup
 *
 * @param {string} backupId - Backup ID
 * @returns {array} Audit trail logs for this backup
 */
router.get("/:backupId/audit-trail", async (req, res) => {
  try {
    const { backupId } = req.params;

    // Find the backup log entry
    const backupLog = await BackupLog.findOne({ backupId }).lean();

    if (!backupLog) {
      return res.status(404).json({
        success: false,
        error: "Backup not found",
      });
    }

    // Get all blockchain logs related to this backup
    const auditLogs = await BlockchainLog.find({
      $or: [{ entityId: backupLog._id }, { "data.backupId": backupId }],
    })
      .sort({ createdAt: -1 })
      .populate("performedBy", "name email role")
      .lean();

    res.json({
      success: true,
      data: {
        backupId,
        totalLogs: auditLogs.length,
        logs: auditLogs,
      },
    });
  } catch (error) {
    console.error("❌ Get backup audit trail failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
