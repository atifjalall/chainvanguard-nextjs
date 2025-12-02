import { Schema, model } from "mongoose";

// ========================================
// BACKUP LOG SCHEMA
// ========================================
const BackupLogSchema = new Schema(
  {
    backupId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["FULL", "INCREMENTAL"],
      required: true,
      index: true,
    },
    cid: {
      type: String,
      required: true,
    },
    pinataId: {
      type: String,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "DELETED", "FAILED"],
      default: "ACTIVE",
      index: true,
    },
    metadata: {
      collections: {
        type: Map,
        of: {
          count: Number,
          size: Number,
        },
      },
      totalDocuments: Number,
      compressedSize: Number,
      uncompressedSize: Number,
    },
    // For incrementals
    parentBackup: {
      type: String,
      index: true,
    },
    parentCid: String,
    changes: {
      type: Map,
      of: {
        created: Number,
        updated: Number,
        deleted: Number,
      },
    },
    // For full backups
    children: [
      {
        type: String, // Array of incremental backupIds
      },
    ],
    // Blockchain reference
    txId: String,
    // Audit fields
    triggeredBy: {
      type: String,
      default: "SYSTEM",
    },
    triggerMethod: {
      type: String,
      enum: ["MANUAL", "CRON", "API"],
      default: "MANUAL",
    },
    completedAt: Date,
    error: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for fast queries
BackupLogSchema.index({ type: 1, status: 1, timestamp: -1 });
BackupLogSchema.index({ parentBackup: 1 });

// ========================================
// STATIC METHODS
// ========================================

/**
 * Get latest full backup
 */
BackupLogSchema.statics.getLatestFullBackup = async function () {
  return this.findOne({ type: "FULL", status: "ACTIVE" })
    .sort({ timestamp: -1 })
    .lean();
};

/**
 * Get incrementals for a parent backup
 */
BackupLogSchema.statics.getIncrementalChain = async function (parentBackupId) {
  return this.find({
    parentBackup: parentBackupId,
    status: "ACTIVE",
  })
    .sort({ timestamp: 1 }) // Chronological order
    .lean();
};

/**
 * Get backups by date range
 */
BackupLogSchema.statics.getBackupsByDateRange = async function (
  startDate,
  endDate
) {
  return this.find({
    timestamp: {
      $gte: startDate,
      $lte: endDate,
    },
  })
    .sort({ timestamp: -1 })
    .lean();
};

/**
 * Get backup statistics
 */
BackupLogSchema.statics.getStats = async function () {
  const [stats] = await this.aggregate([
    {
      $facet: {
        total: [{ $count: "count" }],
        active: [{ $match: { status: "ACTIVE" } }, { $count: "count" }],
        deleted: [{ $match: { status: "DELETED" } }, { $count: "count" }],
        fullBackups: [{ $match: { type: "FULL" } }, { $count: "count" }],
        incrementalBackups: [
          { $match: { type: "INCREMENTAL" } },
          { $count: "count" },
        ],
        activeFullBackups: [
          { $match: { type: "FULL", status: "ACTIVE" } },
          { $count: "count" },
        ],
        activeIncrementalBackups: [
          { $match: { type: "INCREMENTAL", status: "ACTIVE" } },
          { $count: "count" },
        ],
        oldestBackup: [{ $sort: { timestamp: 1 } }, { $limit: 1 }],
        newestBackup: [{ $sort: { timestamp: -1 } }, { $limit: 1 }],
      },
    },
  ]);

  return {
    total: stats.total[0]?.count || 0,
    active: stats.active[0]?.count || 0,
    deleted: stats.deleted[0]?.count || 0,
    fullBackups: stats.fullBackups[0]?.count || 0,
    incrementalBackups: stats.incrementalBackups[0]?.count || 0,
    activeFullBackups: stats.activeFullBackups[0]?.count || 0,
    activeIncrementalBackups: stats.activeIncrementalBackups[0]?.count || 0,
    oldestBackup: stats.oldestBackup[0]?.timestamp || null,
    newestBackup: stats.newestBackup[0]?.timestamp || null,
  };
};

/**
 * Get old backups to cleanup
 * - Keep only 3 latest full backups
 * - Keep only 9 latest incremental backups
 */
BackupLogSchema.statics.getOldBackupsToCleanup = async function () {
  // Get all active full backups sorted by timestamp descending
  const allFullBackups = await this.find({
    type: "FULL",
    status: "ACTIVE",
  })
    .sort({ timestamp: -1 })
    .lean();

  // Keep first 3, mark rest for deletion
  const oldFullBackups = allFullBackups.slice(3);

  // Get all active incremental backups sorted by timestamp descending
  const allIncrementalBackups = await this.find({
    type: "INCREMENTAL",
    status: "ACTIVE",
  })
    .sort({ timestamp: -1 })
    .lean();

  // Keep first 9, mark rest for deletion
  const oldIncrementals = allIncrementalBackups.slice(9);

  return {
    oldFullBackups,
    oldIncrementals,
    total: oldFullBackups.length + oldIncrementals.length,
  };
};

export default model("BackupLog", BackupLogSchema);
