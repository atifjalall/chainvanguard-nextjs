import { Schema, model } from "mongoose";

const blockchainLogSchema = new Schema(
  {
    type: {
      type: String,
      enum: [
        // Product Actions
        "product_created",
        "product_updated",
        "product_deleted",
        "product_transferred",
        "product_status_changed",
        "product_image_uploaded",
        "product_review_added",
        "product_restocked",

        // Order Actions
        "order_created",
        "order_updated",
        "order_cancelled",
        "order_status_changed",
        "order_delivered",
        "order_refunded",

        // Payment & Wallet Actions
        "payment_processed",
        "payment_failed",
        "refund_issued",
        "wallet_created",
        "wallet_transaction",
        "wallet_funds_added",
        "wallet_transfer",
        "refund_processed",
        "refund_failed",

        // User & Auth Actions
        "user_registered",
        "user_login",
        "user_logout",
        "password_changed",
        "password_reset",
        "email_verified",
        "profile_updated",

        // Cart Actions
        "cart_item_added",
        "cart_item_removed",
        "cart_item_updated",
        "cart_cleared",

        // Inventory Actions
        "inventory_created",
        "inventory_updated",
        "inventory_deleted",
        "inventory_restocked",
        "inventory_consumed",
        "inventory_reserved",
        "inventory_released",
        "inventory_adjusted",
        "inventory_transferred",
        "inventory_damaged",
        "inventory_quality_check",
        "inventory_low_stock_alert",
        "inventory_out_of_stock",
        "inventory_reorder_triggered",
        "inventory_batch_created",
        "inventory_batch_expired",
        "inventory_location_changed",
        "inventory_status_changed",

        // Notification Actions
        "notification_created",
        "notification_sent",
        "notification_delivered",
        "notification_read",
        "notification_archived",
        "notification_deleted",
        "notification_failed",
        "notification_clicked",
        "notification_action_taken",

        // Backup & Restore Actions
        "backup_started",
        "backup_completed",
        "backup_failed",
        "backup_deleted",
        "backup_verified",
        "restore_started",
        "restore_completed",
        "restore_failed",
        "backup_cleanup_completed",
        "emergency_recovery_started",
        "emergency_recovery_completed",

        // Blockchain Actions
        "blockchain_transaction",
        "consensus_update",
        "smart_contract_invoked",
        "audit_log",

        // System Actions
        "system_health_check",
        "fault_detected",
        "security_alert",

        // Vendor Specific Actions
        "vendor_request_created",
        "vendor_request_updated",
        "vendor_request_approved",
        "vendor_request_rejected",
        "vendor_request_cancelled",
        "vendor_request_fulfilled",
        "vendor_request_completed",
        "vendor_request_status_changed",
      ],
      required: true,
      index: true,
    },

    // Entity Type - EXPANDED
    entityType: {
      type: String,
      enum: [
        "product",
        "order",
        "user",
        "wallet",
        "payment",
        "transfer",
        "cart",
        "auth",
        "inventory",
        "notification",
        "batch",
        "quality_check",
        "system",
        "vendor_request",
        "backup",
        "restore",
      ],
      required: true,
    },

    // Entity ID (can be null for system-wide actions)
    entityId: {
      type: Schema.Types.ObjectId,
      index: true,
    },

    // Transaction Hash (for blockchain transactions)
    txHash: {
      type: String,
      default: "",
    },

    // Block Number (for blockchain transactions)
    blockNumber: {
      type: Number,
      default: 0,
    },

    // Action Status
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "success",
    },

    // User who performed the action
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    // User details (denormalized for quick access)
    userDetails: {
      walletAddress: String,
      role: String,
      name: String,
      email: String,
    },

    // Action description
    action: {
      type: String,
      required: true,
    },

    // Detailed data about the action
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },

    // Previous state (for updates)
    previousState: {
      type: Schema.Types.Mixed,
    },

    // New state (for updates)
    newState: {
      type: Schema.Types.Mixed,
    },

    // Error information if failed
    error: {
      type: String,
      default: "",
    },

    // IP Address
    ipAddress: {
      type: String,
    },

    // User Agent
    userAgent: {
      type: String,
    },

    // Additional metadata
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },

    // Execution time (in ms)
    executionTime: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
blockchainLogSchema.index({ type: 1, createdAt: -1 });
blockchainLogSchema.index({ entityId: 1, entityType: 1 });
blockchainLogSchema.index({ performedBy: 1, createdAt: -1 });
blockchainLogSchema.index({ status: 1, createdAt: -1 });
blockchainLogSchema.index({ "userDetails.walletAddress": 1 });
blockchainLogSchema.index({ createdAt: -1 });

// Static method to create log
blockchainLogSchema.statics.createLog = async function (logData) {
  try {
    const log = new this(logData);
    await log.save();
    return log;
  } catch (error) {
    console.error("❌ Failed to create log:", error);
    return null;
  }
};

// Static method to get logs with filters
blockchainLogSchema.statics.getLogs = async function (filters = {}) {
  const {
    page = 1,
    limit = 100,
    type,
    status,
    entityType,
    performedBy,
    startDate,
    endDate,
  } = filters;

  const query = {};

  if (type) query.type = type;
  if (status) query.status = status;
  if (entityType) query.entityType = entityType;
  if (performedBy) query.performedBy = performedBy;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    this.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("performedBy", "name email walletAddress role")
      .lean(),
    this.countDocuments(query),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

// Static method to get logs for specific entity
blockchainLogSchema.statics.getEntityLogs = async function (
  entityId,
  entityType
) {
  return this.find({ entityId, entityType })
    .sort({ createdAt: -1 })
    .populate("performedBy", "name email walletAddress role")
    .lean();
};

const BlockchainLog = model("BlockchainLog", blockchainLogSchema);

export default BlockchainLog;
