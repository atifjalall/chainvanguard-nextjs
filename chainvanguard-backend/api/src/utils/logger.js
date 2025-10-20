import BlockchainLog from "../models/BlockchainLog.js";

class Logger {
  /**
   * Create a comprehensive log entry
   * @param {Object} logData - Log information
   * @returns {Promise<Object|null>} Created log or null if failed
   */
  async log({
    type,
    entityType,
    entityId = null,
    action,
    performedBy = null,
    userDetails = null,
    status = "success",
    data = {},
    previousState = null,
    newState = null,
    error = null,
    txHash = "",
    blockNumber = 0,
    ipAddress = null,
    userAgent = null,
    metadata = {},
    executionTime = null,
  }) {
    try {
      const logEntry = await BlockchainLog.createLog({
        type,
        entityType,
        entityId,
        action,
        performedBy,
        userDetails,
        status,
        data,
        previousState,
        newState,
        error,
        txHash,
        blockNumber,
        ipAddress,
        userAgent,
        metadata,
        executionTime,
      });

      if (logEntry) {
        console.log(`📝 Log created: ${type} - ${action}`);
      }

      return logEntry;
    } catch (error) {
      console.error("❌ Logger error:", error);
      // Never throw - logging failures should not break main operations
      return null;
    }
  }

  /**
   * Log authentication actions
   */
  async logAuth({
    action,
    type,
    userId = null,
    userDetails = null,
    status = "success",
    data = {},
    error = null,
    req = null,
  }) {
    return this.log({
      type,
      entityType: "auth",
      entityId: userId,
      action,
      performedBy: userId,
      userDetails,
      status,
      data,
      error,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.headers?.["user-agent"],
    });
  }

  /**
   * Log product actions
   */
  async logProduct({
    action,
    type,
    productId,
    userId,
    userDetails,
    status = "success",
    data = {},
    previousState = null,
    newState = null,
    error = null,
    txHash = "",
    blockNumber = 0,
  }) {
    return this.log({
      type,
      entityType: "product",
      entityId: productId,
      action,
      performedBy: userId,
      userDetails,
      status,
      data,
      previousState,
      newState,
      error,
      txHash,
      blockNumber,
    });
  }

  /**
   * Log order actions
   */
  async logOrder({
    action,
    type,
    orderId,
    userId,
    userDetails,
    status = "success",
    data = {},
    previousState = null,
    newState = null,
    error = null,
    txHash = "",
    blockNumber = 0,
  }) {
    return this.log({
      type,
      entityType: "order",
      entityId: orderId,
      action,
      performedBy: userId,
      userDetails,
      status,
      data,
      previousState,
      newState,
      error,
      txHash,
      blockNumber,
    });
  }

  /**
   * Log wallet/payment actions
   */
  async logWallet({
    action,
    type,
    walletId = null,
    userId,
    userDetails,
    status = "success",
    data = {},
    error = null,
    txHash = "",
  }) {
    return this.log({
      type,
      entityType: "wallet",
      entityId: walletId,
      action,
      performedBy: userId,
      userDetails,
      status,
      data,
      error,
      txHash,
    });
  }

  /**
   * Log cart actions
   */
  async logCart({
    action,
    type,
    cartId = null,
    userId = null,
    userDetails = null,
    status = "success",
    data = {},
    error = null,
  }) {
    return this.log({
      type,
      entityType: "cart",
      entityId: cartId,
      action,
      performedBy: userId,
      userDetails,
      status,
      data,
      error,
    });
  }

  /**
   * Get logs with filters
   */
  async getLogs(filters) {
    return BlockchainLog.getLogs(filters);
  }

  /**
   * Get logs for specific entity
   */
  async getEntityLogs(entityId, entityType) {
    return BlockchainLog.getEntityLogs(entityId, entityType);
  }
}

export default new Logger();
