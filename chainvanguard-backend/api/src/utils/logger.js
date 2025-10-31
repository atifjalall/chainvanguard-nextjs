import BlockchainLog from "../models/BlockchainLog.js";
import fabricService from "../services/fabric.service.js";

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
      // 1. Save to MongoDB first
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
        console.log(`📝 Log created in MongoDB: ${type} - ${action}`);

        // 2. Save to blockchain asynchronously (fire and forget)
        this._saveToBlockchain(logEntry).catch((err) => {
          console.warn("⚠️ Blockchain log save failed:", err.message);
        });
      }

      return logEntry;
    } catch (error) {
      console.error("❌ Logger error:", error);
      // Never throw - logging failures should not break main operations
      return null;
    }
  }

  /**
   * Save log to blockchain (async, non-blocking)
   * @param {Object} logEntry - MongoDB log entry
   */
  async _saveToBlockchain(logEntry) {
    try {
      await fabricService.createBlockchainLog(logEntry._id.toString(), {
        type: logEntry.type,
        entityType: logEntry.entityType,
        entityId: logEntry.entityId,
        action: logEntry.action,
        performedBy: logEntry.performedBy,
        status: logEntry.status,
        data: logEntry.data,
        timestamp: logEntry.timestamp,
      });
      console.log(`⛓️ Log saved to blockchain: ${logEntry._id}`);
    } catch (error) {
      throw error;
    }
  }

  // ========================================
  // AUTHENTICATION LOGGING
  // ========================================

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

  // ========================================
  // PRODUCT LOGGING
  // ========================================

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

  // ========================================
  // ORDER LOGGING
  // ========================================

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

  // ========================================
  // WALLET/PAYMENT LOGGING
  // ========================================

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

  // ========================================
  // CART LOGGING
  // ========================================

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

  // ========================================
  // INVENTORY LOGGING
  // ========================================

  /**
   * General inventory logging
   */
  async logInventory({
    action,
    type,
    inventoryId,
    userId,
    userDetails,
    status = "success",
    data = {},
    previousState = null,
    newState = null,
    error = null,
    txHash = "",
    blockNumber = 0,
    metadata = {},
  }) {
    return this.log({
      type,
      entityType: "inventory",
      entityId: inventoryId,
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
      metadata,
    });
  }

  /**
   * Log inventory creation
   */
  async logInventoryCreated({
    inventoryId,
    userId,
    userDetails,
    inventoryData,
    txHash = "",
  }) {
    return this.logInventory({
      action: `Inventory created: ${inventoryData.name}`,
      type: "inventory_created",
      inventoryId,
      userId,
      userDetails,
      status: "success",
      data: {
        name: inventoryData.name,
        sku: inventoryData.sku,
        category: inventoryData.category,
        subcategory: inventoryData.subcategory,
        initialQuantity: inventoryData.quantity,
        price: inventoryData.price,
        supplierId: inventoryData.supplierId,
        supplierName: inventoryData.supplierName,
      },
      txHash,
    });
  }

  /**
   * Log inventory update
   */
  async logInventoryUpdated({
    inventoryId,
    userId,
    userDetails,
    previousState,
    newState,
    changedFields,
    txHash = "",
  }) {
    return this.logInventory({
      action: `Inventory updated`,
      type: "inventory_updated",
      inventoryId,
      userId,
      userDetails,
      status: "success",
      data: {
        changedFields,
      },
      previousState,
      newState,
      txHash,
    });
  }

  /**
   * Log inventory movement (restock, sale, adjustment, etc.)
   */
  async logInventoryMovement({
    inventoryId,
    movementType,
    quantity,
    previousQuantity,
    newQuantity,
    userId,
    userDetails,
    relatedOrderId = null,
    reason = "",
    notes = "",
    txHash = "",
  }) {
    // Map movement type to log type
    const typeMap = {
      restock: "inventory_restocked",
      sale: "inventory_consumed",
      purchase: "inventory_consumed",
      adjustment: "inventory_adjusted",
      transfer: "inventory_transferred",
      damage: "inventory_damaged",
      reservation: "inventory_reserved",
      release: "inventory_released",
    };

    const logType = typeMap[movementType] || "inventory_adjusted";

    return this.logInventory({
      action: `Inventory movement: ${movementType} (${quantity > 0 ? "+" : ""}${quantity} units)`,
      type: logType,
      inventoryId,
      userId,
      userDetails,
      status: "success",
      data: {
        movementType,
        quantity,
        previousQuantity,
        newQuantity,
        relatedOrderId,
        reason,
        notes,
      },
      previousState: { quantity: previousQuantity },
      newState: { quantity: newQuantity },
      txHash,
    });
  }

  /**
   * Log inventory quality check
   */
  async logInventoryQualityCheck({
    inventoryId,
    inspectorId,
    inspectorDetails,
    qualityCheckData,
    status = "success",
    txHash = "",
  }) {
    return this.logInventory({
      action: `Quality check: ${qualityCheckData.status} (Score: ${qualityCheckData.qualityScore || "N/A"})`,
      type: "inventory_quality_check",
      inventoryId,
      userId: inspectorId,
      userDetails: inspectorDetails,
      status,
      data: {
        inspectionDate: qualityCheckData.inspectionDate,
        qualityStatus: qualityCheckData.status,
        batchNumber: qualityCheckData.batchNumber,
        checkedQuantity: qualityCheckData.checkedQuantity,
        passedQuantity: qualityCheckData.passedQuantity,
        rejectedQuantity: qualityCheckData.rejectedQuantity,
        defectTypes: qualityCheckData.defectTypes,
        qualityScore: qualityCheckData.qualityScore,
        findings: qualityCheckData.findings,
      },
      txHash,
    });
  }

  /**
   * Log inventory low stock alert
   */
  async logInventoryLowStock({
    inventoryId,
    currentQuantity,
    minStockLevel,
    reorderLevel,
    userId = null,
    userDetails = null,
  }) {
    return this.logInventory({
      action: `Low stock alert: ${currentQuantity} units remaining`,
      type: "inventory_low_stock_alert",
      inventoryId,
      userId,
      userDetails,
      status: "success",
      data: {
        currentQuantity,
        minStockLevel,
        reorderLevel,
        alertTriggeredAt: new Date(),
      },
    });
  }

  /**
   * Log inventory out of stock
   */
  async logInventoryOutOfStock({
    inventoryId,
    inventoryName,
    userId = null,
    userDetails = null,
  }) {
    return this.logInventory({
      action: `Out of stock: ${inventoryName}`,
      type: "inventory_out_of_stock",
      inventoryId,
      userId,
      userDetails,
      status: "success",
      data: {
        inventoryName,
        outOfStockAt: new Date(),
      },
    });
  }

  /**
   * Log inventory reorder alert
   */
  async logInventoryReorder({
    inventoryId,
    triggeredBy,
    userDetails,
    alertData,
    status = "success",
  }) {
    return this.logInventory({
      action: `Reorder alert: ${alertData.reorderQuantity} units needed`,
      type: "inventory_reorder_triggered",
      inventoryId,
      userId: triggeredBy,
      userDetails,
      status,
      data: {
        quantityAtTrigger: alertData.quantityAtTrigger,
        reorderQuantity: alertData.reorderQuantity,
        reorderLevel: alertData.reorderLevel,
        alertStatus: alertData.status,
        triggeredAt: new Date(),
      },
    });
  }

  /**
   * Log inventory batch creation/operations
   */
  async logInventoryBatch({
    inventoryId,
    batchData,
    userId,
    userDetails,
    action = "Batch created",
    type = "inventory_batch_created",
    txHash = "",
  }) {
    return this.logInventory({
      action: `${action}: ${batchData.batchNumber}`,
      type,
      inventoryId,
      userId,
      userDetails,
      status: "success",
      data: {
        batchNumber: batchData.batchNumber,
        quantity: batchData.quantity,
        manufactureDate: batchData.manufactureDate,
        expiryDate: batchData.expiryDate,
        supplierId: batchData.supplierId,
        supplierName: batchData.supplierName,
        costPerUnit: batchData.costPerUnit,
        batchStatus: batchData.status,
      },
      txHash,
    });
  }

  /**
   * Log inventory location change
   */
  async logInventoryLocationChange({
    inventoryId,
    userId,
    userDetails,
    previousLocation,
    newLocation,
    quantity,
  }) {
    return this.logInventory({
      action: `Location changed: ${previousLocation.warehouse} → ${newLocation.warehouse}`,
      type: "inventory_location_changed",
      inventoryId,
      userId,
      userDetails,
      status: "success",
      data: {
        quantity,
        previousLocation,
        newLocation,
      },
      previousState: { location: previousLocation },
      newState: { location: newLocation },
    });
  }

  /**
   * Log inventory status change
   */
  async logInventoryStatusChange({
    inventoryId,
    userId,
    userDetails,
    previousStatus,
    newStatus,
    reason = "",
  }) {
    return this.logInventory({
      action: `Status changed: ${previousStatus} → ${newStatus}`,
      type: "inventory_status_changed",
      inventoryId,
      userId,
      userDetails,
      status: "success",
      data: {
        previousStatus,
        newStatus,
        reason,
      },
      previousState: { status: previousStatus },
      newState: { status: newStatus },
    });
  }

  // ========================================
  // NOTIFICATION LOGGING
  // ========================================

  /**
   * General notification logging
   */
  async logNotification({
    action,
    type,
    notificationId,
    recipientId,
    recipientDetails,
    status = "success",
    data = {},
    error = null,
    metadata = {},
  }) {
    return this.log({
      type,
      entityType: "notification",
      entityId: notificationId,
      action,
      performedBy: recipientId,
      userDetails: recipientDetails,
      status,
      data,
      error,
      metadata,
    });
  }

  /**
   * Log notification creation
   */
  async logNotificationCreated({
    notificationId,
    recipientId,
    recipientDetails,
    notificationData,
  }) {
    return this.logNotification({
      action: `Notification created: ${notificationData.type}`,
      type: "notification_created",
      notificationId,
      recipientId,
      recipientDetails,
      status: "success",
      data: {
        notificationType: notificationData.type,
        category: notificationData.category,
        priority: notificationData.priority,
        title: notificationData.title,
        message: notificationData.message,
        relatedEntity: notificationData.relatedEntity,
      },
    });
  }

  /**
   * Log notification sent
   */
  async logNotificationSent({
    notificationId,
    recipientId,
    recipientDetails,
    notificationData,
    channels,
    status = "success",
  }) {
    return this.logNotification({
      action: `Notification sent: ${notificationData.type}`,
      type: "notification_sent",
      notificationId,
      recipientId,
      recipientDetails,
      status,
      data: {
        notificationType: notificationData.type,
        category: notificationData.category,
        priority: notificationData.priority,
        title: notificationData.title,
        channels: {
          inApp: channels.inApp?.enabled,
          email: channels.email?.enabled,
          sms: channels.sms?.enabled,
          push: channels.push?.enabled,
        },
        sentChannels: {
          inApp: channels.inApp?.sent,
          email: channels.email?.sent,
          sms: channels.sms?.sent,
          push: channels.push?.sent,
        },
        sentAt: new Date(),
      },
    });
  }

  /**
   * Log notification delivery status
   */
  async logNotificationDelivery({
    notificationId,
    recipientId,
    recipientDetails,
    channel,
    deliveryStatus,
    error = null,
  }) {
    return this.logNotification({
      action: `Notification ${deliveryStatus} via ${channel}`,
      type: "notification_delivered",
      notificationId,
      recipientId,
      recipientDetails,
      status: deliveryStatus === "delivered" ? "success" : "failed",
      data: {
        channel,
        deliveryStatus,
        deliveredAt: deliveryStatus === "delivered" ? new Date() : null,
      },
      error,
    });
  }

  /**
   * Log notification read by user
   */
  async logNotificationRead({
    notificationId,
    recipientId,
    recipientDetails,
    readAt,
  }) {
    return this.logNotification({
      action: "Notification read",
      type: "notification_read",
      notificationId,
      recipientId,
      recipientDetails,
      status: "success",
      data: {
        readAt: readAt || new Date(),
      },
    });
  }

  /**
   * Log notification archived
   */
  async logNotificationArchived({
    notificationId,
    recipientId,
    recipientDetails,
  }) {
    return this.logNotification({
      action: "Notification archived",
      type: "notification_archived",
      notificationId,
      recipientId,
      recipientDetails,
      status: "success",
      data: {
        archivedAt: new Date(),
      },
    });
  }

  /**
   * Log notification deleted
   */
  async logNotificationDeleted({
    notificationId,
    recipientId,
    recipientDetails,
  }) {
    return this.logNotification({
      action: "Notification deleted",
      type: "notification_deleted",
      notificationId,
      recipientId,
      recipientDetails,
      status: "success",
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Log notification clicked
   */
  async logNotificationClicked({
    notificationId,
    recipientId,
    recipientDetails,
    actionUrl,
  }) {
    return this.logNotification({
      action: "Notification clicked",
      type: "notification_clicked",
      notificationId,
      recipientId,
      recipientDetails,
      status: "success",
      data: {
        clickedAt: new Date(),
        actionUrl,
      },
    });
  }

  /**
   * Log notification action taken
   */
  async logNotificationAction({
    notificationId,
    recipientId,
    recipientDetails,
    actionType,
    actionTaken,
  }) {
    return this.logNotification({
      action: `Action taken: ${actionType}`,
      type: "notification_action_taken",
      notificationId,
      recipientId,
      recipientDetails,
      status: "success",
      data: {
        actionType,
        actionTaken,
        actionTakenAt: new Date(),
      },
    });
  }

  /**
   * Log notification failed
   */
  async logNotificationFailed({
    notificationId,
    recipientId,
    recipientDetails,
    channel,
    error,
  }) {
    return this.logNotification({
      action: `Notification failed via ${channel}`,
      type: "notification_failed",
      notificationId,
      recipientId,
      recipientDetails,
      status: "failed",
      data: {
        channel,
        failedAt: new Date(),
      },
      error: error?.message || error,
    });
  }

  // ========================================
  // QUERY METHODS
  // ========================================

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

  /**
   * Get inventory logs for a supplier
   */
  async getInventoryLogsBySupplier(supplierId, filters = {}) {
    return BlockchainLog.getLogs({
      ...filters,
      entityType: "inventory",
      performedBy: supplierId,
    });
  }

  /**
   * Get notification logs for a user
   */
  async getNotificationLogsByUser(userId, filters = {}) {
    return BlockchainLog.getLogs({
      ...filters,
      entityType: "notification",
      performedBy: userId,
    });
  }

  /**
   * Get all inventory movements
   */
  async getInventoryMovements(inventoryId, filters = {}) {
    return BlockchainLog.getLogs({
      ...filters,
      entityType: "inventory",
      entityId: inventoryId,
      type: {
        $in: [
          "inventory_restocked",
          "inventory_consumed",
          "inventory_adjusted",
          "inventory_transferred",
          "inventory_damaged",
          "inventory_reserved",
          "inventory_released",
        ],
      },
    });
  }

  /**
   * Get quality check history
   */
  async getQualityCheckHistory(inventoryId) {
    return BlockchainLog.getLogs({
      entityType: "inventory",
      entityId: inventoryId,
      type: "inventory_quality_check",
    });
  }

  // ========================================
  // UTILITY LOGGING METHODS
  // ========================================

  /**
   * Log an error
   */
  error(message, error = null, context = {}) {
    console.error(`❌ ERROR: ${message}`, {
      error: error?.message || error,
      stack: error?.stack,
      ...context,
    });
  }

  /**
   * Log an info message
   */
  info(message, context = {}) {
    console.log(`ℹ️ INFO: ${message}`, context);
  }

  /**
   * Log a warning
   */
  warn(message, context = {}) {
    console.warn(`⚠️ WARNING: ${message}`, context);
  }

  /**
   * Log a debug message
   */
  debug(message, context = {}) {
    if (process.env.NODE_ENV === "development") {
      console.debug(`🐛 DEBUG: ${message}`, context);
    }
  }

  /**
   * Log a success message
   */
  success(message, context = {}) {
    console.log(`✅ SUCCESS: ${message}`, context);
  }

  // ========================================
  // VENDOR REQUEST LOGGING
  // ========================================

  /**
   * Log vendor request activity
   */
  async logVendorRequest({
    action,
    type,
    requestId,
    requestNumber = null,
    vendorId = null,
    supplierId = null,
    total = null,
    status = null,
    itemCount = null,
    rejectionReason = null,
    data = {},
  }) {
    return this.log({
      type,
      entityType: "vendor_request",
      entityId: requestId,
      action,
      performedBy: vendorId || supplierId,
      status: "success",
      data: {
        requestNumber,
        vendorId,
        supplierId,
        total,
        status,
        itemCount,
        rejectionReason,
        ...data,
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });
  }
}

export default new Logger();
