import mongoose from "mongoose";

const BlockchainLogSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "product-creation",
        "product-transfer",
        "order-creation",
        "order-update",
        "user-registration",
        "consensus-event",
        "system-event",
        "security-event",
        "error",
      ],
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["success", "failed", "pending"],
      default: "success",
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    userRole: {
      type: String,
      enum: ["supplier", "vendor", "customer", "expert"],
    },
    entityId: {
      type: String,
      index: true,
    },
    entityType: {
      type: String,
      enum: ["product", "order", "user", "system"],
    },
    chaincodeName: {
      type: String,
      enum: ["ProductContract", "OrderContract", "UserContract"],
    },
    functionName: String,

    // Request/Response data
    requestData: mongoose.Schema.Types.Mixed,
    responseData: mongoose.Schema.Types.Mixed,

    // Blockchain details
    blockNumber: Number,
    blockHash: String,

    // Performance metrics
    executionTime: Number, // in milliseconds
    gasUsed: Number,

    // Error details (if failed)
    errorMessage: String,
    errorStack: String,

    // Network info
    ipAddress: String,
    userAgent: String,

    // Metadata
    metadata: mongoose.Schema.Types.Mixed,

    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
BlockchainLogSchema.index({ transactionId: 1, timestamp: -1 });
BlockchainLogSchema.index({ type: 1, status: 1, timestamp: -1 });
BlockchainLogSchema.index({ userId: 1, timestamp: -1 });
BlockchainLogSchema.index({ entityId: 1, entityType: 1 });

// TTL index - auto-delete logs older than 90 days
BlockchainLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

// Static method to log transaction
BlockchainLogSchema.statics.logTransaction = async function (logData) {
  try {
    const log = new this(logData);
    await log.save();
    return log;
  } catch (error) {
    console.error("Failed to create blockchain log:", error);
    return null;
  }
};

// Static method to get recent logs
BlockchainLogSchema.statics.getRecentLogs = async function (
  filters = {},
  limit = 100
) {
  const query = {};

  if (filters.type) query.type = filters.type;
  if (filters.status) query.status = filters.status;
  if (filters.userId) query.userId = filters.userId;
  if (filters.startDate || filters.endDate) {
    query.timestamp = {};
    if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
    if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
  }

  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate("userId", "name email role")
    .lean();
};

export default mongoose.model("BlockchainLog", BlockchainLogSchema);
