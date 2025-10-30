import mongoose from "mongoose";

/**
 * ========================================
 * RETURN MODEL
 * ========================================
 * Manages product returns and refunds
 */

const returnItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    condition: {
      type: String,
      enum: ["unopened", "opened_unused", "defective", "damaged", "other"],
      default: "unopened",
    },
  },
  { _id: false }
);

const returnSchema = new mongoose.Schema(
  {
    // Return identification
    returnNumber: {
      type: String,
      unique: true,
      required: true,
    },

    // Related order
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
    },

    // Parties involved
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      required: true,
    },

    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    vendorName: {
      type: String,
      required: true,
    },

    // Return items
    items: [returnItemSchema],

    // Return reason
    reason: {
      type: String,
      enum: [
        "defective",
        "damaged",
        "wrong_item",
        "not_as_described",
        "changed_mind",
        "size_issue",
        "quality_issue",
        "late_delivery",
        "other",
      ],
      required: true,
    },
    reasonDetails: {
      type: String,
      required: true,
      maxlength: 1000,
    },

    // Return status
    status: {
      type: String,
      enum: [
        "requested",
        "pending_approval",
        "approved",
        "rejected",
        "item_received",
        "inspected",
        "refund_processing",
        "refunded",
        "completed",
        "cancelled",
      ],
      default: "requested",
      index: true,
    },

    // Financial details
    returnAmount: {
      type: Number,
      required: true,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    restockingFee: {
      type: Number,
      default: 0,
    },
    shippingRefund: {
      type: Number,
      default: 0,
    },

    // Return method
    returnMethod: {
      type: String,
      enum: ["ship_back", "drop_off", "pickup"],
      default: "ship_back",
    },

    // Shipping information (if applicable)
    returnShipping: {
      trackingNumber: String,
      carrier: String,
      shippingLabel: String, // URL to shipping label
      shippedAt: Date,
      estimatedDelivery: Date,
      actualDelivery: Date,
    },

    // Images/Evidence
    images: [
      {
        url: String,
        caption: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Inspection details
    inspection: {
      inspectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      inspectedAt: Date,
      condition: {
        type: String,
        enum: ["as_described", "better", "worse", "unacceptable"],
      },
      notes: String,
      approved: Boolean,
    },

    // Approval/Rejection
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: Date,
    reviewNotes: String,

    rejectionReason: String,

    // Refund details
    refundMethod: {
      type: String,
      enum: ["wallet", "original_payment", "store_credit"],
      default: "wallet",
    },
    refundedAt: Date,
    refundTransactionId: String,

    // Blockchain
    blockchainTxId: String,
    blockchainVerified: {
      type: Boolean,
      default: false,
    },

    // Status history
    statusHistory: [
      {
        status: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        notes: String,
      },
    ],

    // Deadlines
    approvalDeadline: Date,
    returnDeadline: Date,

    // Resolution
    resolution: {
      type: String,
      enum: [
        "",
        "full_refund",
        "partial_refund",
        "replacement",
        "store_credit",
        "rejected",
      ],
      default: "",
    },
    resolutionNotes: String,

    // Flags
    isDisputed: {
      type: Boolean,
      default: false,
    },
    requiresApproval: {
      type: Boolean,
      default: true,
    },
    isAutomated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ========================================
// INDEXES
// ========================================

returnSchema.index({ customerId: 1, status: 1 });
returnSchema.index({ vendorId: 1, status: 1 });
returnSchema.index({ orderId: 1 });
returnSchema.index({ returnNumber: 1 });
returnSchema.index({ createdAt: -1 });
returnSchema.index({ status: 1, createdAt: -1 });

// ========================================
// VIRTUALS
// ========================================

// Check if return is overdue
returnSchema.virtual("isOverdue").get(function () {
  if (!this.returnDeadline) return false;
  return new Date() > this.returnDeadline && this.status === "approved";
});

// Return window (days)
returnSchema.virtual("returnWindow").get(function () {
  if (!this.createdAt || !this.returnDeadline) return 0;
  const diffTime = Math.abs(this.returnDeadline - this.createdAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// ========================================
// MIDDLEWARE
// ========================================

// Auto-generate return number
returnSchema.pre("save", async function (next) {
  if (!this.returnNumber) {
    const count = await mongoose.model("Return").countDocuments();
    this.returnNumber = `RET-${String(count + 1).padStart(6, "0")}-${new Date().getFullYear()}`;
  }
  next();
});

// Add status to history when status changes
returnSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
    });
  }
  next();
});

// Set deadlines on creation
returnSchema.pre("save", function (next) {
  if (this.isNew) {
    // Approval deadline: 2 days
    this.approvalDeadline = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

    // Return deadline: 14 days from approval
    if (this.status === "approved") {
      this.returnDeadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    }
  }
  next();
});

// ========================================
// METHODS
// ========================================

// Add status history entry
returnSchema.methods.addStatusHistory = function (
  status,
  updatedBy,
  notes = ""
) {
  this.statusHistory.push({
    status,
    timestamp: new Date(),
    updatedBy,
    notes,
  });
};

// Check if return is eligible
returnSchema.methods.isEligible = function () {
  return ["requested", "pending_approval"].includes(this.status);
};

// Calculate refund amount
returnSchema.methods.calculateRefundAmount = function () {
  let refund = this.returnAmount;

  // Deduct restocking fee
  refund -= this.restockingFee;

  // Add shipping refund if applicable
  if (this.reason === "defective" || this.reason === "wrong_item") {
    refund += this.shippingRefund;
  }

  this.refundAmount = Math.max(refund, 0);
  return this.refundAmount;
};

// ========================================
// STATICS
// ========================================

// Get return statistics
returnSchema.statics.getStatistics = async function (
  vendorId,
  timeframe = "month"
) {
  const dateFilter = getDateFilter(timeframe);

  const stats = await this.aggregate([
    {
      $match: {
        vendorId: mongoose.Types.ObjectId(vendorId),
        createdAt: dateFilter,
      },
    },
    {
      $group: {
        _id: null,
        totalReturns: { $sum: 1 },
        approvedReturns: {
          $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
        },
        rejectedReturns: {
          $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
        },
        totalRefunded: {
          $sum: {
            $cond: [{ $eq: ["$status", "refunded"] }, "$refundAmount", 0],
          },
        },
        avgRefundAmount: { $avg: "$refundAmount" },
      },
    },
  ]);

  return (
    stats[0] || {
      totalReturns: 0,
      approvedReturns: 0,
      rejectedReturns: 0,
      totalRefunded: 0,
      avgRefundAmount: 0,
    }
  );
};

// Helper function
function getDateFilter(timeframe) {
  const now = new Date();
  switch (timeframe) {
    case "week":
      return { $gte: new Date(now.setDate(now.getDate() - 7)) };
    case "month":
      return { $gte: new Date(now.setMonth(now.getMonth() - 1)) };
    case "year":
      return { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) };
    default:
      return { $gte: new Date(0) };
  }
}

export default mongoose.model("Return", returnSchema);
