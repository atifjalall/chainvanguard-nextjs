import cron from "node-cron";
import backupService from "../services/backup.service.js";
import backupAlertService from "../services/backup.alert.service.js";

/**
 * BackupCron
 * Automated backup scheduler with real-time monitoring and alerts
 *
 * SCHEDULE:
 * - Full backup: Daily at midnight (00:00)
 * - Incremental backup: Every 6 hours (00:00, 06:00, 12:00, 18:00)
 * - Storage monitor: Every hour
 *
 * RETENTION POLICY:
 * - Keep only 1 latest full backup
 * - Keep incrementals for last 3 days
 * - Automatic cleanup after each backup
 *
 * FEATURES:
 * - Real-time status tracking
 * - Alert notifications to admins
 * - Storage monitoring
 * - Error handling with fallbacks
 */
class BackupCron {
  constructor() {
    this.fullBackupJob = null;
    this.incrementalBackupJob = null;
    this.storageMonitorJob = null;
    this.isRunning = false;

    // Status tracking
    this.status = {
      lastFullBackup: null,
      lastIncrementalBackup: null,
      nextFullBackup: null,
      nextIncrementalBackup: null,
      lastError: null,
      backupsCompleted: 0,
      backupsFailed: 0,
      storageUsage: null,
      uptime: null,
      startedAt: null,
    };
  }

  /**
   * Start backup scheduler
   */
  start() {
    if (this.isRunning) {
      console.log("⚠️  Backup scheduler is already running");
      return;
    }

    console.log("\n========================================");
    console.log("📅 BACKUP SCHEDULER STARTING");
    console.log("========================================\n");

    this.status.startedAt = new Date();

    // Full backup: Daily at midnight
    this.fullBackupJob = cron.schedule(
      "0 0 * * *",
      async () => {
        await this._runFullBackup();
      },
      {
        scheduled: true,
        timezone: "UTC",
      }
    );

    // Incremental backup: Every 6 hours
    this.incrementalBackupJob = cron.schedule(
      "0 */6 * * *",
      async () => {
        await this._runIncrementalBackup();
      },
      {
        scheduled: true,
        timezone: "UTC",
      }
    );

    // Storage monitor: Every hour
    this.storageMonitorJob = cron.schedule(
      "0 * * * *",
      async () => {
        await this._monitorStorage();
      },
      {
        scheduled: true,
        timezone: "UTC",
      }
    );

    this.isRunning = true;

    // Calculate next run times
    this._updateNextRunTimes();

    console.log("✅ Backup scheduler started successfully");
    console.log("\n📋 SCHEDULE:");
    console.log("   Full backup:        Daily at 00:00 UTC (cron: 0 0 * * *)");
    console.log("   Incremental backup: Every 6 hours (cron: 0 */6 * * *)");
    console.log("   Storage monitor:    Every hour (cron: 0 * * * *)");
    console.log("\n📦 RETENTION POLICY:");
    console.log("   Full backups:       Keep 1 latest");
    console.log("   Incremental backups: Keep last 3 days");
    console.log("\n💾 STORAGE:");
    console.log("   IPFS Provider:      Pinata");
    console.log("   Storage Limit:      1 GB");
    console.log("   Blockchain:         Hyperledger Fabric");
    console.log("\n🔔 ALERTS:");
    console.log("   Success notifications: Enabled");
    console.log("   Failure alerts:        Enabled");
    console.log("   Storage warnings:      Enabled (80% threshold)");
    console.log("\n========================================\n");

    // Initial storage check
    this._monitorStorage();
  }

  /**
   * Stop backup scheduler
   */
  stop() {
    if (!this.isRunning) {
      console.log("⚠️  Backup scheduler is not running");
      return;
    }

    console.log("\n🛑 Stopping backup scheduler...");

    if (this.fullBackupJob) {
      this.fullBackupJob.stop();
      this.fullBackupJob = null;
    }

    if (this.incrementalBackupJob) {
      this.incrementalBackupJob.stop();
      this.incrementalBackupJob = null;
    }

    if (this.storageMonitorJob) {
      this.storageMonitorJob.stop();
      this.storageMonitorJob = null;
    }

    this.isRunning = false;

    console.log("✅ Backup scheduler stopped\n");
  }

  /**
   * Get scheduler status (for dashboard)
   */
  getStatus() {
    // Calculate uptime
    if (this.status.startedAt) {
      const uptime = Date.now() - this.status.startedAt.getTime();
      this.status.uptime = this._formatUptime(uptime);
    }

    return {
      isRunning: this.isRunning,
      schedules: {
        fullBackup: {
          cron: "0 0 * * *",
          description: "Daily at 00:00 UTC",
          nextRun: this.status.nextFullBackup,
          lastRun: this.status.lastFullBackup,
        },
        incrementalBackup: {
          cron: "0 */6 * * *",
          description: "Every 6 hours",
          nextRun: this.status.nextIncrementalBackup,
          lastRun: this.status.lastIncrementalBackup,
        },
      },
      statistics: {
        backupsCompleted: this.status.backupsCompleted,
        backupsFailed: this.status.backupsFailed,
        successRate:
          this.status.backupsCompleted + this.status.backupsFailed > 0
            ? (
                (this.status.backupsCompleted /
                  (this.status.backupsCompleted + this.status.backupsFailed)) *
                100
              ).toFixed(2) + "%"
            : "N/A",
        uptime: this.status.uptime,
        startedAt: this.status.startedAt,
      },
      storage: this.status.storageUsage,
      lastError: this.status.lastError,
    };
  }

  /**
   * Get detailed status with recent alerts
   */
  getDetailedStatus() {
    const basicStatus = this.getStatus();
    const recentAlerts = backupAlertService.getAlertHistory(10);
    const alertStats = backupAlertService.getAlertStats();

    return {
      ...basicStatus,
      alerts: {
        recent: recentAlerts,
        statistics: alertStats,
      },
    };
  }

  /**
   * Manually trigger full backup
   */
  async triggerFullBackupNow(triggeredBy = "MANUAL") {
    console.log("\n🔄 Manual full backup triggered from scheduler");
    console.log(`   Triggered by: ${triggeredBy}`);

    try {
      // Send start alert
      await backupAlertService.sendScheduledBackupStartedAlert("FULL");

      const result = await backupService.createFullBackup(triggeredBy);

      // Update status
      this.status.lastFullBackup = {
        timestamp: new Date(),
        backupId: result.backupId,
        success: true,
      };
      this.status.backupsCompleted++;

      // Send success alert
      await backupAlertService.sendBackupSuccessAlert(result);

      console.log("✅ Manual full backup completed");
      return result;
    } catch (error) {
      // Update status
      this.status.backupsFailed++;
      this.status.lastError = {
        timestamp: new Date(),
        type: "FULL_BACKUP",
        message: error.message,
      };

      // Send failure alert
      await backupAlertService.sendBackupFailureAlert("MANUAL_FULL", error);

      console.error("❌ Manual full backup failed:", error);
      throw error;
    }
  }

  /**
   * Manually trigger incremental backup
   */
  async triggerIncrementalBackupNow() {
    console.log("\n🔄 Manual incremental backup triggered from scheduler");

    try {
      // Send start alert
      await backupAlertService.sendScheduledBackupStartedAlert("INCREMENTAL");

      const result = await backupService.createIncrementalBackup();

      if (result.skipped) {
        console.log("⏭️  Incremental backup skipped (no changes)");
        return result;
      }

      // Update status
      this.status.lastIncrementalBackup = {
        timestamp: new Date(),
        backupId: result.backupId,
        success: true,
      };
      this.status.backupsCompleted++;

      // Send success alert
      await backupAlertService.sendBackupSuccessAlert(result);

      console.log("✅ Manual incremental backup completed");
      return result;
    } catch (error) {
      // Update status
      this.status.backupsFailed++;
      this.status.lastError = {
        timestamp: new Date(),
        type: "INCREMENTAL_BACKUP",
        message: error.message,
      };

      // Send failure alert
      await backupAlertService.sendBackupFailureAlert(
        "MANUAL_INCREMENTAL",
        error
      );

      console.error("❌ Manual incremental backup failed:", error);
      throw error;
    }
  }

  /**
   * Force storage check
   */
  async checkStorageNow() {
    console.log("\n📊 Manual storage check triggered");
    return await this._monitorStorage();
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit = 50) {
    return backupAlertService.getAlertHistory(limit);
  }

  /**
   * Get recent alerts by severity
   */
  getCriticalAlerts(limit = 20) {
    return backupAlertService.getCriticalAlerts(limit);
  }

  // ========================================
  // PRIVATE METHODS
  // ========================================

  /**
   * Run scheduled full backup
   */
  async _runFullBackup() {
    console.log("\n🔄 SCHEDULED FULL BACKUP STARTED");
    console.log(`   Time: ${new Date().toISOString()}`);
    console.log(`   Trigger: CRON (Daily at 00:00)\n`);

    try {
      // Send start alert
      await backupAlertService.sendScheduledBackupStartedAlert("FULL");

      const result = await backupService.createFullBackup("CRON");

      // Update status
      this.status.lastFullBackup = {
        timestamp: new Date(),
        backupId: result.backupId,
        success: true,
      };
      this.status.backupsCompleted++;
      this._updateNextRunTimes();

      // Send success alert
      await backupAlertService.sendBackupSuccessAlert(result);

      console.log("\n✅ SCHEDULED FULL BACKUP COMPLETED");
      console.log(`   Backup ID: ${result.backupId}`);
      console.log(`   CID: ${result.cid}`);
      console.log(`   Duration: ${result.metadata.duration}`);
      console.log(
        `   Size: ${this._formatBytes(result.metadata.compressedSize)}`
      );
      console.log(`   ✓ Compression: ${result.metadata.compressionRatio}\n`);

      // Trigger frontend notification refresh via WebSocket or SSE if available
      // For now, notifications will be picked up on next poll (30s)
      console.log("   📡 Backup notification sent to admins");
    } catch (error) {
      // Update status
      this.status.backupsFailed++;
      this.status.lastError = {
        timestamp: new Date(),
        type: "FULL_BACKUP",
        message: error.message,
      };

      // Send failure alert
      await backupAlertService.sendBackupFailureAlert("SCHEDULED_FULL", error);

      console.error("\n❌ SCHEDULED FULL BACKUP FAILED");
      console.error(`   Error: ${error.message}`);
      console.error(`   Stack: ${error.stack}\n`);
    }
  }

  /**
   * Run scheduled incremental backup
   */
  async _runIncrementalBackup() {
    console.log("\n🔄 SCHEDULED INCREMENTAL BACKUP STARTED");
    console.log(`   Time: ${new Date().toISOString()}`);
    console.log(`   Trigger: CRON (Every 6 hours)\n`);

    try {
      // Send start alert
      await backupAlertService.sendScheduledBackupStartedAlert("INCREMENTAL");

      const result = await backupService.createIncrementalBackup();

      if (result.skipped) {
        console.log("\n⏭️  SCHEDULED INCREMENTAL BACKUP SKIPPED");
        console.log(`   Reason: ${result.message}\n`);
        return;
      }

      // Update status
      this.status.lastIncrementalBackup = {
        timestamp: new Date(),
        backupId: result.backupId,
        success: true,
      };
      this.status.backupsCompleted++;
      this._updateNextRunTimes();

      // Send success alert
      await backupAlertService.sendBackupSuccessAlert(result);

      console.log("\n✅ SCHEDULED INCREMENTAL BACKUP COMPLETED");
      console.log(`   Backup ID: ${result.backupId}`);
      console.log(`   CID: ${result.cid}`);
      console.log(`   Duration: ${result.metadata.duration}`);
      console.log(`   Changes: ${result.metadata.totalChanges}\n`);

      // Trigger frontend notification refresh
      console.log("   📡 Backup notification sent to admins");
    } catch (error) {
      // Update status
      this.status.backupsFailed++;
      this.status.lastError = {
        timestamp: new Date(),
        type: "INCREMENTAL_BACKUP",
        message: error.message,
      };

      console.error("\n❌ SCHEDULED INCREMENTAL BACKUP FAILED");
      console.error(`   Error: ${error.message}`);
      console.error(`   Stack: ${error.stack}\n`);

      // If incremental backup fails, it might be because there's no full backup
      if (error.message.includes("No previous backup found")) {
        console.log("\n🔄 Creating full backup as fallback...\n");

        try {
          await this._runFullBackup();
        } catch (fallbackError) {
          console.error("\n❌ Fallback full backup also failed");
          console.error(`   Error: ${fallbackError.message}\n`);

          // Send critical alert
          await backupAlertService.sendBackupFailureAlert(
            "FALLBACK_FULL",
            fallbackError
          );
        }
      } else {
        // Send failure alert for other errors
        await backupAlertService.sendBackupFailureAlert(
          "SCHEDULED_INCREMENTAL",
          error
        );
      }
    }
  }

  /**
   * Monitor storage usage
   */
  async _monitorStorage() {
    try {
      const stats = await backupService.getStorageStats();

      // Update status
      this.status.storageUsage = {
        ...stats,
        lastChecked: new Date(),
      };

      const usage = parseFloat(stats.usagePercentage);

      // Send alerts based on thresholds
      if (usage >= 90) {
        // Critical: >= 90%
        await backupAlertService.sendStorageCriticalAlert(stats);
        console.warn(`🚨 CRITICAL: Storage usage at ${usage}%`);
      } else if (usage >= 80) {
        // Warning: >= 80%
        await backupAlertService.sendStorageWarningAlert(stats);
        console.warn(`⚠️  WARNING: Storage usage at ${usage}%`);
      } else {
        console.log(`✅ Storage check: ${usage}% used (healthy)`);
      }

      return stats;
    } catch (error) {
      console.error("❌ Storage monitoring failed:", error);
      this.status.lastError = {
        timestamp: new Date(),
        type: "STORAGE_MONITOR",
        message: error.message,
      };
    }
  }

  /**
   * Update next run times
   */
  _updateNextRunTimes() {
    const now = new Date();

    // Next full backup (next midnight UTC)
    const nextFull = new Date(now);
    nextFull.setUTCHours(24, 0, 0, 0);
    this.status.nextFullBackup = nextFull;

    // Next incremental (next 6-hour mark)
    const nextInc = new Date(now);
    const hours = now.getUTCHours();
    const nextHour = Math.ceil((hours + 1) / 6) * 6;
    if (nextHour >= 24) {
      nextInc.setUTCDate(nextInc.getUTCDate() + 1);
      nextInc.setUTCHours(0, 0, 0, 0);
    } else {
      nextInc.setUTCHours(nextHour, 0, 0, 0);
    }
    this.status.nextIncrementalBackup = nextInc;
  }

  /**
   * Format uptime duration
   */
  _formatUptime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Format bytes
   */
  _formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }
}

// Export singleton instance
export default new BackupCron();
