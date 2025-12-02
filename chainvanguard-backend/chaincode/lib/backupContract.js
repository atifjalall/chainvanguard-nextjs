/* eslint-disable @typescript-eslint/no-require-imports */
"use strict";

const { Contract } = require("fabric-contract-api");

class BackupContract extends Contract {
  // ========================================
  // HELPER FUNCTIONS
  // ========================================

  /**
   * Get deterministic timestamp from transaction
   */
  _getTimestamp(ctx) {
    const timestamp = ctx.stub.getTxTimestamp();
    const milliseconds =
      timestamp.seconds.low * 1000 +
      Math.floor(timestamp.nanos / 1000000);
    return new Date(milliseconds).toISOString();
  }

  // ========================================
  // CORE BACKUP METHODS
  // ========================================

  /**
   * Log backup to blockchain (called after IPFS upload)
   * This creates an immutable record of backup metadata on the blockchain
   *
   * @param {Context} ctx - Transaction context
   * @param {string} backupData - JSON string containing backup metadata
   * @returns {object} Transaction result
   */
  async logBackup(ctx, backupData) {
    console.info("============= START : Log Backup ===========");

    const data = JSON.parse(backupData);

    // Validate required fields
    if (!data.backupId || !data.type || !data.cid || !data.timestamp) {
      throw new Error("Missing required fields: backupId, type, cid, timestamp");
    }

    // Validate backup type
    if (data.type !== "FULL" && data.type !== "INCREMENTAL") {
      throw new Error("Invalid backup type. Must be FULL or INCREMENTAL");
    }

    // Check if backup already exists
    const exists = await ctx.stub.getState(data.backupId);
    if (exists && exists.length > 0) {
      throw new Error(`Backup with ID ${data.backupId} already exists`);
    }

    // Create backup record
    const backup = {
      docType: "BACKUP_LOG",
      backupId: data.backupId,
      type: data.type,
      cid: data.cid,
      pinataId: data.pinataId || "",
      timestamp: data.timestamp,
      status: "ACTIVE",
      metadata: data.metadata || {},

      // For incrementals
      parentBackup: data.parentBackup || null,
      parentCid: data.parentCid || null,
      changes: data.changes || null,

      // Blockchain metadata
      txId: ctx.stub.getTxID(),
      createdAt: this._getTimestamp(ctx),
      createdBy: ctx.clientIdentity.getID(),
    };

    // Save to blockchain
    await ctx.stub.putState(
      data.backupId,
      Buffer.from(JSON.stringify(backup))
    );

    console.info(` Backup logged: ${data.backupId} (${data.type})`);
    console.info("============= END : Log Backup ===========");

    return {
      success: true,
      backupId: data.backupId,
      txId: backup.txId,
      timestamp: backup.createdAt,
    };
  }

  /**
   * Get all active backups (sorted by timestamp DESC)
   *
   * @param {Context} ctx - Transaction context
   * @returns {Array} Array of active backups
   */
  async getAllBackups(ctx) {
    console.info("============= START : Get All Backups ===========");

    const query = {
      selector: {
        docType: "BACKUP_LOG",
        status: "ACTIVE",
      },
    };

    const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
    let backups = await this._getAllResults(iterator);

    // Sort in-memory by timestamp DESC (newest first)
    backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    console.info(` Found ${backups.length} active backups`);
    console.info("============= END : Get All Backups ===========");

    return backups;
  }

  /**
   * Get latest full backup
   *
   * @param {Context} ctx - Transaction context
   * @returns {object|null} Latest full backup or null
   */
  async getLatestFullBackup(ctx) {
    console.info("============= START : Get Latest Full Backup ===========");

    const query = {
      selector: {
        docType: "BACKUP_LOG",
        type: "FULL",
        status: "ACTIVE",
      },
    };

    const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
    let backups = await this._getAllResults(iterator);

    // Sort in-memory by timestamp DESC and get latest
    backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const latestBackup = backups.length > 0 ? backups[0] : null;

    console.info(
      latestBackup
        ? ` Latest full backup: ${latestBackup.backupId}`
        : "� No full backups found"
    );
    console.info("============= END : Get Latest Full Backup ===========");

    return latestBackup;
  }

  /**
   * Get incremental chain for restoration
   * Returns all incrementals linked to a parent backup
   *
   * @param {Context} ctx - Transaction context
   * @param {string} parentBackupId - Parent backup ID
   * @returns {Array} Array of incremental backups in chronological order
   */
  async getIncrementalChain(ctx, parentBackupId) {
    console.info("============= START : Get Incremental Chain ===========");

    const query = {
      selector: {
        docType: "BACKUP_LOG",
        type: "INCREMENTAL",
        parentBackup: parentBackupId,
        status: "ACTIVE",
      },
      sort: [{ timestamp: "asc" }], // Chronological order for restoration
    };

    const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
    const incrementals = await this._getAllResults(iterator);

    console.info(
      ` Found ${incrementals.length} incrementals for parent: ${parentBackupId}`
    );
    console.info("============= END : Get Incremental Chain ===========");

    return incrementals;
  }

  /**
   * Get backups by date range
   *
   * @param {Context} ctx - Transaction context
   * @param {string} startDate - Start date (ISO string)
   * @param {string} endDate - End date (ISO string)
   * @returns {Array} Array of backups in date range
   */
  async getBackupsByDateRange(ctx, startDate, endDate) {
    console.info("============= START : Get Backups By Date Range ===========");

    const query = {
      selector: {
        docType: "BACKUP_LOG",
        timestamp: {
          $gte: startDate,
          $lte: endDate,
        },
      },
      sort: [{ timestamp: "desc" }],
    };

    const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
    const backups = await this._getAllResults(iterator);

    console.info(
      ` Found ${backups.length} backups between ${startDate} and ${endDate}`
    );
    console.info("============= END : Get Backups By Date Range ===========");

    return backups;
  }

  /**
   * Mark backup as deleted (for cleanup tracking)
   * NOTE: This doesn't actually delete the blockchain record (immutable!)
   * It just marks the status as DELETED
   *
   * @param {Context} ctx - Transaction context
   * @param {string} backupId - Backup ID to mark as deleted
   * @returns {object} Updated backup object
   */
  async markBackupDeleted(ctx, backupId) {
    console.info("============= START : Mark Backup Deleted ===========");

    const backupBytes = await ctx.stub.getState(backupId);
    if (!backupBytes || backupBytes.length === 0) {
      throw new Error(`Backup ${backupId} does not exist`);
    }

    const backup = JSON.parse(backupBytes.toString());

    if (backup.status === "DELETED") {
      console.warn(`� Backup ${backupId} already marked as deleted`);
      return backup;
    }

    // Update status to DELETED
    backup.status = "DELETED";
    backup.deletedAt = this._getTimestamp(ctx);
    backup.deletedBy = ctx.clientIdentity.getID();
    backup.deleteTxId = ctx.stub.getTxID();

    // Save updated record
    await ctx.stub.putState(backupId, Buffer.from(JSON.stringify(backup)));

    console.info(` Backup ${backupId} marked as DELETED`);
    console.info("============= END : Mark Backup Deleted ===========");

    return backup;
  }

  /**
   * Get single backup by ID
   *
   * @param {Context} ctx - Transaction context
   * @param {string} backupId - Backup ID
   * @returns {object|null} Backup object or null
   */
  async getBackupById(ctx, backupId) {
    console.info(`============= START : Get Backup By ID: ${backupId} ===========`);

    const backupBytes = await ctx.stub.getState(backupId);
    if (!backupBytes || backupBytes.length === 0) {
      console.warn(`� Backup ${backupId} not found`);
      return null;
    }

    const backup = JSON.parse(backupBytes.toString());

    console.info(` Backup found: ${backupId}`);
    console.info("============= END : Get Backup By ID ===========");

    return backup;
  }

  /**
   * Get backup statistics
   *
   * @param {Context} ctx - Transaction context
   * @returns {object} Backup statistics
   */
  async getBackupStats(ctx) {
    console.info("============= START : Get Backup Stats ===========");

    const allQuery = {
      selector: {
        docType: "BACKUP_LOG",
      },
    };

    const iterator = await ctx.stub.getQueryResult(JSON.stringify(allQuery));
    const allBackups = await this._getAllResults(iterator);

    const stats = {
      total: allBackups.length,
      active: allBackups.filter((b) => b.status === "ACTIVE").length,
      deleted: allBackups.filter((b) => b.status === "DELETED").length,
      fullBackups: allBackups.filter((b) => b.type === "FULL").length,
      incrementalBackups: allBackups.filter((b) => b.type === "INCREMENTAL")
        .length,
      activeFullBackups: allBackups.filter(
        (b) => b.type === "FULL" && b.status === "ACTIVE"
      ).length,
      activeIncrementalBackups: allBackups.filter(
        (b) => b.type === "INCREMENTAL" && b.status === "ACTIVE"
      ).length,
      oldestBackup:
        allBackups.length > 0
          ? allBackups.reduce((oldest, b) =>
              b.timestamp < oldest.timestamp ? b : oldest
            ).timestamp
          : null,
      newestBackup:
        allBackups.length > 0
          ? allBackups.reduce((newest, b) =>
              b.timestamp > newest.timestamp ? b : newest
            ).timestamp
          : null,
    };

    console.info(` Backup stats calculated:`, stats);
    console.info("============= END : Get Backup Stats ===========");

    return stats;
  }

  /**
   * Get backups by type
   *
   * @param {Context} ctx - Transaction context
   * @param {string} type - Backup type (FULL or INCREMENTAL)
   * @returns {Array} Array of backups of specified type
   */
  async getBackupsByType(ctx, type) {
    console.info(`============= START : Get Backups By Type: ${type} ===========`);

    if (type !== "FULL" && type !== "INCREMENTAL") {
      throw new Error("Invalid backup type. Must be FULL or INCREMENTAL");
    }

    const query = {
      selector: {
        docType: "BACKUP_LOG",
        type: type,
        status: "ACTIVE",
      },
      sort: [{ timestamp: "desc" }],
    };

    const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
    const backups = await this._getAllResults(iterator);

    console.info(` Found ${backups.length} ${type} backups`);
    console.info("============= END : Get Backups By Type ===========");

    return backups;
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Get all results from iterator
   * Internal utility method
   */
  async _getAllResults(iterator) {
    const allResults = [];

    while (true) {
      const res = await iterator.next();

      if (res.value && res.value.value.toString()) {
        const jsonRes = {};
        jsonRes.Key = res.value.key;

        try {
          jsonRes.Record = JSON.parse(res.value.value.toString("utf8"));
        } catch (err) {
          console.log(err);
          jsonRes.Record = res.value.value.toString("utf8");
        }

        allResults.push(jsonRes.Record);
      }

      if (res.done) {
        await iterator.close();
        return allResults;
      }
    }
  }

  /**
   * Check if backup exists
   *
   * @param {Context} ctx - Transaction context
   * @param {string} backupId - Backup ID
   * @returns {boolean} True if exists, false otherwise
   */
  async backupExists(ctx, backupId) {
    const backupBytes = await ctx.stub.getState(backupId);
    return backupBytes && backupBytes.length > 0;
  }
}

module.exports = BackupContract;
