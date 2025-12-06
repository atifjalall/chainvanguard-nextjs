import Notification from "../models/Notifications.js";
import User from "../models/User.js";

/**
 * BackupAlertService
 * Handles notifications and alerts for backup system
 * Sends alerts to admins and ministry users
 */
class BackupAlertService {
  constructor() {
    this.alertHistory = [];
    this.maxHistorySize = 100;
  }

  // ========================================
  // ALERT METHODS
  // ========================================

  /**
   * Send backup success alert
   */
  async sendBackupSuccessAlert(backupData) {
    const message = {
      type: "backup_completed", // Match Notification schema enum
      title: "Backup Completed Successfully",
      message: `Backup ${backupData.backupId} completed successfully`,
      details: {
        backupId: backupData.backupId,
        type: backupData.type || "FULL",
        cid: backupData.cid,
        size: backupData.metadata?.compressedSize,
        duration: backupData.metadata?.duration,
        timestamp: new Date().toISOString(),
      },
      severity: "info",
    };

    await this._sendToAdmins(message);
    this._addToHistory(message);

    console.log("📧 Backup success alert sent");

    return message;
  }

  /**
   * Send backup failure alert
   */
  async sendBackupFailureAlert(backupId, error) {
    const message = {
      type: "backup_failed", // Match Notification schema enum
      title: "Backup Failed",
      message: `Backup ${backupId} failed: ${error.message}`,
      details: {
        backupId,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      },
      severity: "error",
    };

    await this._sendToAdmins(message);
    this._addToHistory(message);

    console.error("📧 Backup failure alert sent");

    return message;
  }

  /**
   * Send restore success alert
   */
  async sendRestoreSuccessAlert(restoreData) {
    const message = {
      type: "RESTORE_SUCCESS",
      title: "✅ Restore Completed Successfully",
      message: `Database restored from backup ${restoreData.backupId}`,
      details: {
        backupId: restoreData.backupId,
        duration: restoreData.duration,
        timestamp: new Date().toISOString(),
      },
      severity: "success",
    };

    await this._sendToAdmins(message);
    this._addToHistory(message);

    console.log("📧 Restore success alert sent");

    return message;
  }

  /**
   * Send restore failure alert
   */
  async sendRestoreFailureAlert(backupId, error) {
    const message = {
      type: "RESTORE_FAILURE",
      title: "Restore Failed",
      message: `Restore from backup ${backupId} failed: ${error.message}`,
      details: {
        backupId,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      },
      severity: "critical",
    };

    await this._sendToAdmins(message);
    this._addToHistory(message);

    console.error("📧 Restore failure alert sent");

    return message;
  }

  /**
   * Send storage warning alert
   */
  async sendStorageWarningAlert(stats) {
    const message = {
      type: "STORAGE_WARNING",
      title: "Storage Usage High",
      message: `Backup storage usage is at ${stats.usagePercentage}%`,
      details: {
        usagePercentage: stats.usagePercentage,
        totalSize: stats.totalSize,
        storageLimit: stats.storageLimit,
        totalBackups: stats.totalBackups,
        timestamp: new Date().toISOString(),
      },
      severity: "warning",
    };

    await this._sendToAdmins(message);
    this._addToHistory(message);

    console.warn("📧 Storage warning alert sent");

    return message;
  }

  /**
   * Send storage critical alert
   */
  async sendStorageCriticalAlert(stats) {
    const message = {
      type: "STORAGE_CRITICAL",
      title: "🚨 Storage Usage Critical",
      message: `Backup storage usage is at ${stats.usagePercentage}% - Immediate action required!`,
      details: {
        usagePercentage: stats.usagePercentage,
        totalSize: stats.totalSize,
        storageLimit: stats.storageLimit,
        totalBackups: stats.totalBackups,
        timestamp: new Date().toISOString(),
      },
      severity: "critical",
    };

    await this._sendToAdmins(message);
    this._addToHistory(message);

    console.error("📧 Storage critical alert sent");

    return message;
  }

  /**
   * Send emergency recovery alert
   */
  async sendEmergencyRecoveryAlert() {
    const message = {
      type: "EMERGENCY_RECOVERY",
      title: "Emergency Recovery Activated",
      message: "MongoDB unavailable - Emergency recovery mode activated",
      details: {
        timestamp: new Date().toISOString(),
        action: "System attempting to query blockchain for backups",
      },
      severity: "critical",
    };

    await this._sendToAdmins(message);
    this._addToHistory(message);

    console.error("📧 Emergency recovery alert sent");

    return message;
  }

  /**
   * Send cleanup completion alert
   */
  async sendCleanupAlert(cleanupResult) {
    const message = {
      type: "CLEANUP_COMPLETED",
      title: "🧹 Backup Cleanup Completed",
      message: `Cleaned up ${cleanupResult.deleted || 0} old backups`,
      details: {
        deleted: cleanupResult.deleted || 0,
        timestamp: new Date().toISOString(),
      },
      severity: "info",
    };

    await this._sendToAdmins(message);
    this._addToHistory(message);

    console.log("📧 Cleanup alert sent");

    return message;
  }

  /**
   * Send scheduled backup started alert
   */
  async sendScheduledBackupStartedAlert(type) {
    const message = {
      type: "BACKUP_STARTED",
      title: `${type} Backup Started`,
      message: `Scheduled ${type.toLowerCase()} backup started`,
      details: {
        type,
        timestamp: new Date().toISOString(),
      },
      severity: "info",
    };

    // Don't send to admins for every start (too noisy)
    this._addToHistory(message);

    console.log(`📧 Backup started alert logged`);

    return message;
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Send notification to all admin and expert users
   */
  async _sendToAdmins(message) {
    try {
      // Find all admin and expert users
      const adminUsers = await User.find({
        role: { $in: ["admin", "expert"] },
      }).lean();

      if (adminUsers.length === 0) {
        console.warn("⚠️ No admin/expert users found to send alerts");
        return;
      }

      // Create notifications for each admin
      const notifications = adminUsers.map((user) => ({
        userId: user._id,
        userRole: user.role, // REQUIRED field - must match user's role
        type: message.type, // Use the actual backup notification type (backup_completed, backup_failed, etc.)
        title: message.title,
        message: message.message,
        metadata: {
          backupType: message.type,
          ...message.details,
          severity: message.severity,
        },
        isRead: false, // Correct field name is 'isRead', not 'read'
        category: "backup", // Correct category for backup notifications
        priority:
          message.severity === "critical" || message.severity === "error"
            ? "urgent"
            : message.severity === "warning"
              ? "high"
              : message.severity === "info"
                ? "medium"
                : "low",
      }));

      await Notification.insertMany(notifications);

      console.log(
        `✅ Sent backup alert to ${adminUsers.length} admin/expert users`
      );
    } catch (error) {
      console.error("❌ Failed to send alerts to admins:", error);
      console.error("Error details:", error.message);
      // Don't throw - alerting failures shouldn't break backup
    }
  }

  /**
   * Add alert to history
   */
  _addToHistory(message) {
    this.alertHistory.unshift({
      ...message,
      timestamp: new Date().toISOString(),
    });

    // Keep only last N alerts
    if (this.alertHistory.length > this.maxHistorySize) {
      this.alertHistory = this.alertHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit = 50) {
    return this.alertHistory.slice(0, limit);
  }

  /**
   * Get recent alerts by type
   */
  getAlertsByType(type, limit = 20) {
    return this.alertHistory
      .filter((alert) => alert.type === type)
      .slice(0, limit);
  }

  /**
   * Get critical alerts
   */
  getCriticalAlerts(limit = 20) {
    return this.alertHistory
      .filter((alert) => alert.severity === "critical")
      .slice(0, limit);
  }

  /**
   * Clear alert history
   */
  clearHistory() {
    this.alertHistory = [];
    console.log("🗑️ Alert history cleared");
  }

  /**
   * Get alert statistics
   */
  getAlertStats() {
    const total = this.alertHistory.length;
    const byType = {};
    const bySeverity = {};

    this.alertHistory.forEach((alert) => {
      byType[alert.type] = (byType[alert.type] || 0) + 1;
      bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
    });

    return {
      total,
      byType,
      bySeverity,
      recent: this.alertHistory.slice(0, 5),
    };
  }
}

export default new BackupAlertService();
