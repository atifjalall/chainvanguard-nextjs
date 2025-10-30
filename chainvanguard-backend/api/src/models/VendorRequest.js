import mongoose from "mongoose";

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

    // Blockchain tracking
    blockchainTxId: {
      type: String,
      sparse: true,
    },
    blockchainVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
vendorRequestSchema.index({ vendorId: 1, status: 1 });
vendorRequestSchema.index({ supplierId: 1, status: 1 });
vendorRequestSchema.index({ requestNumber: 1 });
vendorRequestSchema.index({ createdAt: -1 });
vendorRequestSchema.index({ status: 1, createdAt: -1 });

// Auto-generate request number before saving
vendorRequestSchema.pre("save", async function (next) {
  if (!this.requestNumber) {
    const count = await mongoose.model("VendorRequest").countDocuments();
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    this.requestNumber = `REQ-${year}${month}-${String(count + 1).padStart(6, "0")}`;
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

export default mongoose.model("VendorRequest", vendorRequestSchema);
