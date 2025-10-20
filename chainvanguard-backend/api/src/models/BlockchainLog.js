// chainvanguard-backend/api/src/models/BlockchainLog.js
import { Schema, model } from "mongoose";

const blockchainLogSchema = new Schema(
  {
    // Transaction Type
    type: {
      type: String,
      enum: [
        "product_created",
        "product_updated",
        "product_transferred",
        "order_created",
        "order_updated",
        "payment",
        "refund",
        "user_registered",
        "wallet_created",
        "wallet_transaction",
        "transfer",
        "consensus",
        "audit",
      ],
      required: true,
      index: true,
    },

    // Entity Type
    entityType: {
      type: String,
      enum: ["product", "order", "user", "wallet", "payment", "transfer"],
      required: true,
    },

    // Entity ID
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    // Transaction Hash
    txHash: {
      type: String,
      default: "",
    },

    // Block Number
    blockNumber: {
      type: Number,
      default: 0,
    },

    // Transaction Status
    status: {
      type: String,
      enum: ["pending", "confirmed", "failed"],
      default: "pending",
    },

    // User who performed the action
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    // Transaction Data
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },

    // Error information if failed
    error: {
      type: String,
      default: "",
    },

    // Additional metadata
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
blockchainLogSchema.index({ type: 1, createdAt: -1 });
blockchainLogSchema.index({ entityId: 1, entityType: 1 });
blockchainLogSchema.index({ performedBy: 1, createdAt: -1 });
blockchainLogSchema.index({ status: 1 });

// Static method to log transaction
blockchainLogSchema.statics.logTransaction = async function (logData) {
  try {
    const log = new this(logData);
    await log.save();
    return log;
  } catch (error) {
    console.error("Failed to create blockchain log:", error);
    throw error;
  }
};

const BlockchainLog = model("BlockchainLog", blockchainLogSchema);

export default BlockchainLog;
