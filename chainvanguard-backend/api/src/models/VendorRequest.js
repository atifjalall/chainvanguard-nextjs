import mongoose from "mongoose";
import crypto from "crypto";

const vendorRequestSchema = new mongoose.Schema(
  {
    // Request identification
    requestNumber: {
      type: String,
      unique: true,
    },

    // Parties involved
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Request items (from inventory)
    items: [
      {
        inventoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Inventory",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        pricePerUnit: {
          type: Number,
          required: true,
          min: 0,
        },
        subtotal: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    // Totals
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },

    // Request status
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled", "completed"],
      default: "pending",
      index: true,
    },

    // Notes and details
    vendorNotes: {
      type: String,
      maxlength: 500,
    },
    supplierNotes: {
      type: String,
      maxlength: 500,
    },

    // Approval/rejection
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rejectionReason: {
      type: String,
      maxlength: 500,
    },

    // Auto-approval setting
    autoApproved: {
      type: Boolean,
      default: false,
    },

    // Order reference (after payment)
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },

    // Shipping address (saved when vendor pays)
    shippingAddress: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
      addressLine1: { type: String, default: "" },
      addressLine2: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      country: { type: String, default: "" },
      postalCode: { type: String, default: "" },
      latitude: { type: Number },
      longitude: { type: Number },
      addressType: {
        type: String,
        enum: ["home", "office", "other", ""],
        default: "",
      },
    },

    // Payment timestamp
    paidAt: {
      type: Date,
    },

    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },

    // Blockchain tracking
    blockchainTxId: {
      type: String,
      sparse: true,
      index: true,
    },
    blockchainVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    blockchainRequestId: {
      type: String,
      default: "",
      sparse: true,
    },

    blockchainLastSynced: {
      type: Date,
      default: null,
    },

    blockchainSyncAttempts: {
      type: Number,
      default: 0,
    },

    blockchainSyncError: {
      type: String,
      default: "",
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["pending", "approved", "rejected", "cancelled", "completed"],
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        changedByRole: {
          type: String,
          enum: ["vendor", "supplier"],
        },
        notes: {
          type: String,
          default: "",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
vendorRequestSchema.index({ vendorId: 1, status: 1 });
vendorRequestSchema.index({ supplierId: 1, status: 1 });
// requestNumber has unique: true which creates an index
vendorRequestSchema.index({ createdAt: -1 });
vendorRequestSchema.index({ status: 1, createdAt: -1 });

vendorRequestSchema.index({ blockchainVerified: 1, status: 1 });
// blockchainTxId has index: true in schema
vendorRequestSchema.index({ vendorId: 1, blockchainVerified: 1 });
vendorRequestSchema.index({ supplierId: 1, blockchainVerified: 1 });

// Auto-generate request number before saving
vendorRequestSchema.pre("save", async function (next) {
  if (!this.requestNumber) {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const time = now.getTime().toString().slice(-5);
    const randomPart = crypto.randomBytes(2).toString("hex").toUpperCase();
    this.requestNumber = `REQ-${year}${month}${day}-${time}${randomPart}`;
  }
  next();
});

// Virtual for request age
vendorRequestSchema.virtual("requestAge").get(function () {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24)); // in days
});

// Method to check if request can be cancelled
vendorRequestSchema.methods.canBeCancelled = function () {
  return this.status === "pending";
};

// Method to check if request can be approved/rejected
vendorRequestSchema.methods.canBeReviewed = function () {
  return this.status === "pending";
};

// Static method to get request statistics
vendorRequestSchema.statics.getStatsBySupplier = async function (
  supplierId,
  timeframe = "month"
) {
  const now = new Date();
  let startDate = new Date();

  switch (timeframe) {
    case "week":
      startDate.setDate(now.getDate() - 7);
      break;
    case "month":
      startDate.setMonth(now.getMonth() - 1);
      break;
    case "year":
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate = new Date(0);
  }

  const stats = await this.aggregate([
    {
      $match: {
        supplierId: mongoose.Types.ObjectId(supplierId),
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalValue: { $sum: "$total" },
      },
    },
  ]);

  return stats;
};

// ============================================
// METHODS - Add instance methods for blockchain sync
// ============================================

/**
 * Mark request as verified on blockchain
 */
vendorRequestSchema.methods.markBlockchainVerified = function (txId) {
  this.blockchainVerified = true;
  this.blockchainTxId = txId;
  this.blockchainLastSynced = new Date();
  this.blockchainSyncError = "";
  return this.save();
};

/**
 * Mark blockchain sync failed
 */
vendorRequestSchema.methods.markBlockchainSyncFailed = function (error) {
  this.blockchainSyncAttempts = (this.blockchainSyncAttempts || 0) + 1;
  this.blockchainSyncError = error.message || error.toString();
  this.blockchainLastSynced = new Date();
  return this.save();
};

/**
 * Check if request needs blockchain sync
 */
vendorRequestSchema.methods.needsBlockchainSync = function () {
  // Needs sync if not verified or if sync failed less than 5 times
  return !this.blockchainVerified && (this.blockchainSyncAttempts || 0) < 5;
};

// ============================================
// STATICS - Add static methods for bulk operations
// ============================================

/**
 * Find all requests that need blockchain sync
 */
vendorRequestSchema.statics.findNeedingBlockchainSync = function () {
  return this.find({
    blockchainVerified: false,
    blockchainSyncAttempts: { $lt: 5 },
  }).limit(100);
};

/**
 * Get blockchain verification stats
 */
vendorRequestSchema.statics.getBlockchainStats = async function () {
  const total = await this.countDocuments();
  const verified = await this.countDocuments({ blockchainVerified: true });
  const needsSync = await this.countDocuments({
    blockchainVerified: false,
    blockchainSyncAttempts: { $lt: 5 },
  });
  const failed = await this.countDocuments({
    blockchainVerified: false,
    blockchainSyncAttempts: { $gte: 5 },
  });

  return {
    total,
    verified,
    needsSync,
    failed,
    verificationRate: total > 0 ? ((verified / total) * 100).toFixed(2) : 0,
  };
};

// ============================================
// PRE-SAVE HOOK - Add status history tracking
// ============================================

vendorRequestSchema.pre("save", function (next) {
  // Track status changes in statusHistory
  if (this.isModified("status") && !this.isNew) {
    if (!this.statusHistory) {
      this.statusHistory = [];
    }

    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      changedBy: this.reviewedBy || this.vendorId,
      notes: this.supplierNotes || `Status changed to ${this.status}`,
    });
  }

  next();
});

export default mongoose.model("VendorRequest", vendorRequestSchema);
