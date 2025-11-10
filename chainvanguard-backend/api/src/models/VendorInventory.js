import { Schema, model } from "mongoose";

// ========================================
// VENDOR INVENTORY MODEL
// Tracks raw materials/components purchased by vendors from suppliers
// ========================================

// ========================================
// MOVEMENT SUB-SCHEMA
// Tracks all stock movements
// ========================================
const movementSchema = new Schema({
  type: {
    type: String,
    enum: [
      "received", // Initial receipt from supplier
      "used", // Used in production
      "adjustment", // Manual adjustment
      "reserved", // Reserved for production order
      "released", // Released from reservation
      "returned", // Returned to supplier
      "damaged", // Marked as damaged/defective
      "transferred", // Transferred between locations
    ],
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  previousQuantity: {
    type: Number,
    required: true,
  },
  newQuantity: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    default: "",
  },
  performedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  relatedProductId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
  },
  relatedOrderId: {
    type: Schema.Types.ObjectId,
    ref: "Order",
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
    default: "",
  },
  transactionHash: {
    type: String,
    default: "",
  },
});

// ========================================
// MAIN VENDOR INVENTORY SCHEMA
// ========================================
const vendorInventorySchema = new Schema(
  {
    // ========================================
    // VENDOR INFORMATION
    // ========================================
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    vendorName: {
      type: String,
      required: true,
    },

    // ========================================
    // PURCHASE INFORMATION
    // ========================================
    vendorRequestId: {
      type: Schema.Types.ObjectId,
      ref: "VendorRequest",
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    // ========================================
    // SUPPLIER INFORMATION
    // ========================================
    supplier: {
      supplierId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
      supplierName: {
        type: String,
        required: true,
      },
      contactEmail: {
        type: String,
        default: "",
      },
      contactPhone: {
        type: String,
        default: "",
      },
    },

    // ========================================
    // INVENTORY ITEM DETAILS
    // From supplier's inventory
    // ========================================
    inventoryItem: {
      inventoryId: {
        type: Schema.Types.ObjectId,
        ref: "Inventory",
        required: true,
        index: true,
      },
      name: {
        type: String,
        required: true,
        index: true,
      },
      sku: {
        type: String,
        default: "",
        index: true,
      },
      category: {
        type: String,
        required: true,
        index: true,
      },
      subcategory: {
        type: String,
        default: "",
      },
      description: {
        type: String,
        default: "",
      },
      images: [
        {
          url: String,
          alt: String,
        },
      ],
      specifications: {
        type: Schema.Types.Mixed,
        default: {},
      },
    },

    // ========================================
    // QUANTITY TRACKING
    // ========================================
    quantity: {
      received: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      used: {
        type: Number,
        default: 0,
        min: 0,
      },
      current: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      reserved: {
        type: Number,
        default: 0,
        min: 0,
      },
      damaged: {
        type: Number,
        default: 0,
        min: 0,
      },
      unit: {
        type: String,
        required: true,
        default: "units",
      },
    },

    // ========================================
    // COST TRACKING
    // ========================================
    cost: {
      perUnit: {
        type: Number,
        required: true,
        min: 0,
      },
      totalCost: {
        type: Number,
        required: true,
        min: 0,
      },
      currency: {
        type: String,
        default: "PKR",
      },
    },

    // ========================================
    // DATE TRACKING
    // ========================================
    dates: {
      purchased: {
        type: Date,
        required: true,
      },
      approved: {
        type: Date,
      },
      received: {
        type: Date,
        required: true,
        default: Date.now,
      },
      lastUsed: {
        type: Date,
      },
      expiryDate: {
        type: Date,
      },
    },

    // ========================================
    // STORAGE LOCATION
    // ========================================
    location: {
      warehouse: {
        type: String,
        default: "Main Warehouse",
      },
      section: {
        type: String,
        default: "",
      },
      bin: {
        type: String,
        default: "",
      },
    },

    // ========================================
    // REORDER SETTINGS
    // ========================================
    reorderLevel: {
      type: Number,
      min: 0,
      default: 0,
    },
    reorderQuantity: {
      type: Number,
      min: 0,
      default: 0,
    },

    // ========================================
    // QUALITY & BATCH INFO
    // ========================================
    batchNumber: {
      type: String,
      default: "",
      index: true,
    },
    qualityStatus: {
      type: String,
      enum: ["pending", "passed", "failed", "conditional"],
      default: "pending",
    },
    qualityCheckDate: {
      type: Date,
    },
    qualityNotes: {
      type: String,
      default: "",
    },

    // ========================================
    // BLOCKCHAIN INTEGRATION
    // ========================================
    blockchain: {
      txId: {
        type: String,
        default: "",
        index: true,
      },
      blockHash: {
        type: String,
        default: "",
      },
      verified: {
        type: Boolean,
        default: false,
      },
      lastVerified: {
        type: Date,
      },
      contractAddress: {
        type: String,
        default: "",
      },
    },

    // ========================================
    // STATUS & NOTES
    // ========================================
    status: {
      type: String,
      enum: ["active", "depleted", "discontinued", "expired", "returned"],
      default: "active",
      index: true,
    },
    notes: {
      type: String,
      default: "",
    },

    // ========================================
    // MOVEMENT HISTORY
    // ========================================
    movements: [movementSchema],

    // ========================================
    // USAGE TRACKING
    // For linking to products created (future BOM)
    // ========================================
    usageHistory: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
        },
        productName: {
          type: String,
        },
        quantityUsed: {
          type: Number,
          required: true,
        },
        usedAt: {
          type: Date,
          default: Date.now,
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ========================================
// INDEXES FOR PERFORMANCE
// ========================================
vendorInventorySchema.index({ vendorId: 1, status: 1 });
vendorInventorySchema.index({ "supplier.supplierId": 1 });
vendorInventorySchema.index({ "inventoryItem.inventoryId": 1 });
vendorInventorySchema.index({ orderId: 1 });
vendorInventorySchema.index({ "inventoryItem.category": 1 });
vendorInventorySchema.index({ "quantity.current": 1 });
vendorInventorySchema.index({ "dates.received": -1 });
vendorInventorySchema.index({ "inventoryItem.name": "text", notes: "text" });
vendorInventorySchema.index({ createdAt: -1 });

// ========================================
// VIRTUALS
// ========================================

// Available quantity (current minus reserved)
vendorInventorySchema.virtual("availableQuantity").get(function () {
  return Math.max(
    0,
    this.quantity.current -
      (this.quantity.reserved || 0) -
      (this.quantity.damaged || 0)
  );
});

// Is low stock
vendorInventorySchema.virtual("isLowStock").get(function () {
  return this.quantity.current <= this.reorderLevel && this.reorderLevel > 0;
});

// Is depleted
vendorInventorySchema.virtual("isDepleted").get(function () {
  return this.quantity.current <= 0;
});

// Total value of current stock
vendorInventorySchema.virtual("currentValue").get(function () {
  return this.quantity.current * this.cost.perUnit;
});

// Usage percentage
vendorInventorySchema.virtual("usagePercentage").get(function () {
  if (this.quantity.received === 0) return 0;
  return Math.round((this.quantity.used / this.quantity.received) * 100);
});

// Days in inventory
vendorInventorySchema.virtual("daysInInventory").get(function () {
  if (!this.dates.received) return 0;
  const now = new Date();
  const received = new Date(this.dates.received);
  const diffTime = Math.abs(now - received);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Is expired
vendorInventorySchema.virtual("isExpired").get(function () {
  if (!this.dates.expiryDate) return false;
  return new Date() > new Date(this.dates.expiryDate);
});

// ========================================
// MIDDLEWARE
// ========================================

// Auto-update status based on quantity
vendorInventorySchema.pre("save", function (next) {
  // Update status based on current quantity
  if (this.quantity.current <= 0 && this.status === "active") {
    this.status = "depleted";
  }

  // Check expiry
  if (
    this.dates.expiryDate &&
    new Date() > new Date(this.dates.expiryDate) &&
    this.status === "active"
  ) {
    this.status = "expired";
  }

  next();
});

// Update lastUsed when quantity.used changes
vendorInventorySchema.pre("save", function (next) {
  if (this.isModified("quantity.used") && this.quantity.used > 0) {
    this.dates.lastUsed = new Date();
  }
  next();
});

// ========================================
// INSTANCE METHODS
// ========================================

// Check if has sufficient quantity
vendorInventorySchema.methods.hasSufficientQuantity = function (
  requestedQuantity
) {
  return this.availableQuantity >= requestedQuantity;
};

// Reserve quantity for production
vendorInventorySchema.methods.reserveQuantity = async function (
  quantity,
  orderId = null
) {
  if (!this.hasSufficientQuantity(quantity)) {
    throw new Error("Insufficient quantity available");
  }

  const previousQuantity = this.quantity.reserved;
  this.quantity.reserved = (this.quantity.reserved || 0) + quantity;

  // Add movement record
  this.movements.push({
    type: "reserved",
    quantity: quantity,
    previousQuantity: previousQuantity,
    newQuantity: this.quantity.reserved,
    relatedOrderId: orderId,
    performedBy: this.vendorId,
    reason: orderId
      ? `Reserved for order ${orderId}`
      : "Reserved for production",
    timestamp: new Date(),
  });

  return this.save();
};

// Release reserved quantity
vendorInventorySchema.methods.releaseReservedQuantity = async function (
  quantity
) {
  const previousQuantity = this.quantity.reserved;
  this.quantity.reserved = Math.max(
    0,
    (this.quantity.reserved || 0) - quantity
  );

  // Add movement record
  this.movements.push({
    type: "released",
    quantity: -quantity,
    previousQuantity: previousQuantity,
    newQuantity: this.quantity.reserved,
    performedBy: this.vendorId,
    reason: "Released from reservation",
    timestamp: new Date(),
  });

  return this.save();
};

// Use material in production
vendorInventorySchema.methods.useInProduction = async function (
  quantity,
  productId = null,
  productName = "",
  notes = ""
) {
  if (this.quantity.current < quantity) {
    throw new Error("Insufficient quantity to use");
  }

  // Release from reserved if it was reserved
  if (this.quantity.reserved >= quantity) {
    this.quantity.reserved -= quantity;
  }

  const previousCurrent = this.quantity.current;
  this.quantity.current -= quantity;
  this.quantity.used = (this.quantity.used || 0) + quantity;
  this.dates.lastUsed = new Date();

  // Add movement record
  this.movements.push({
    type: "used",
    quantity: -quantity,
    previousQuantity: previousCurrent,
    newQuantity: this.quantity.current,
    relatedProductId: productId,
    performedBy: this.vendorId,
    reason: productName
      ? `Used in production of ${productName}`
      : "Used in production",
    notes: notes,
    timestamp: new Date(),
  });

  // Add to usage history
  if (productId) {
    this.usageHistory.push({
      productId: productId,
      productName: productName,
      quantityUsed: quantity,
      usedAt: new Date(),
      notes: notes,
    });
  }

  return this.save();
};

// Adjust stock (for corrections, damages, etc.)
vendorInventorySchema.methods.adjustStock = async function (
  quantityChange,
  reason = "",
  performedBy = null,
  notes = ""
) {
  const previousQuantity = this.quantity.current;
  this.quantity.current = Math.max(0, this.quantity.current + quantityChange);

  // Add movement record
  this.movements.push({
    type: "adjustment",
    quantity: quantityChange,
    previousQuantity: previousQuantity,
    newQuantity: this.quantity.current,
    performedBy: performedBy || this.vendorId,
    reason: reason,
    notes: notes,
    timestamp: new Date(),
  });

  return this.save();
};

// Mark as damaged
vendorInventorySchema.methods.markAsDamaged = async function (
  quantity,
  reason = "",
  notes = ""
) {
  if (this.quantity.current < quantity) {
    throw new Error("Cannot mark more items as damaged than current quantity");
  }

  const previousCurrent = this.quantity.current;
  this.quantity.current -= quantity;
  this.quantity.damaged = (this.quantity.damaged || 0) + quantity;

  // Add movement record
  this.movements.push({
    type: "damaged",
    quantity: -quantity,
    previousQuantity: previousCurrent,
    newQuantity: this.quantity.current,
    performedBy: this.vendorId,
    reason: reason || "Marked as damaged",
    notes: notes,
    timestamp: new Date(),
  });

  return this.save();
};

// Check if needs reorder
vendorInventorySchema.methods.needsReorder = function () {
  return this.isLowStock && this.reorderLevel > 0;
};

// Add quality check
vendorInventorySchema.methods.updateQualityStatus = async function (
  status,
  notes = ""
) {
  this.qualityStatus = status;
  this.qualityCheckDate = new Date();
  this.qualityNotes = notes;
  return this.save();
};

// ========================================
// STATIC METHODS
// ========================================

// Get vendor's inventory with filters
vendorInventorySchema.statics.getVendorInventory = function (
  vendorId,
  filters = {}
) {
  const query = { vendorId };

  // Apply filters
  if (filters.supplierId) {
    query["supplier.supplierId"] = filters.supplierId;
  }
  if (filters.category) {
    query["inventoryItem.category"] = filters.category;
  }
  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.lowStock) {
    query.$expr = { $lte: ["$quantity.current", "$reorderLevel"] };
  }
  if (filters.search) {
    query.$text = { $search: filters.search };
  }

  return this.find(query)
    .populate("supplier.supplierId", "name email companyName")
    .populate("orderId", "orderNumber totalAmount createdAt")
    .sort({ "dates.received": -1 });
};

// Get low stock items for vendor
vendorInventorySchema.statics.getLowStockItems = function (vendorId) {
  return this.find({
    vendorId,
    status: { $in: ["active", "low_stock"] },
    $expr: {
      $and: [
        { $gt: ["$reorderLevel", 0] },
        { $lte: ["$quantity.current", "$reorderLevel"] },
      ],
    },
  })
    .populate("supplier.supplierId", "name email companyName contactPhone")
    .sort({ "quantity.current": 1 });
};

// Get inventory stats for vendor
vendorInventorySchema.statics.getInventoryStats = async function (vendorId) {
  const result = await this.aggregate([
    { $match: { vendorId: vendorId, status: { $ne: "discontinued" } } },
    {
      $group: {
        _id: null,
        totalItems: { $sum: 1 },
        totalValue: {
          $sum: { $multiply: ["$quantity.current", "$cost.perUnit"] },
        },
        totalQuantity: { $sum: "$quantity.current" },
        totalUsed: { $sum: "$quantity.used" },
        lowStockCount: {
          $sum: {
            $cond: [{ $lte: ["$quantity.current", "$reorderLevel"] }, 1, 0],
          },
        },
        depletedCount: {
          $sum: {
            $cond: [{ $eq: ["$quantity.current", 0] }, 1, 0],
          },
        },
      },
    },
  ]);

  return (
    result[0] || {
      totalItems: 0,
      totalValue: 0,
      totalQuantity: 0,
      totalUsed: 0,
      lowStockCount: 0,
      depletedCount: 0,
    }
  );
};

// Get inventory by supplier
vendorInventorySchema.statics.getBySupplier = function (vendorId, supplierId) {
  return this.find({
    vendorId,
    "supplier.supplierId": supplierId,
    status: { $ne: "discontinued" },
  }).sort({ "dates.received": -1 });
};

// Get inventory value by category
vendorInventorySchema.statics.getValueByCategory = async function (vendorId) {
  return this.aggregate([
    { $match: { vendorId: vendorId, status: { $ne: "discontinued" } } },
    {
      $group: {
        _id: "$inventoryItem.category",
        totalValue: {
          $sum: { $multiply: ["$quantity.current", "$cost.perUnit"] },
        },
        itemCount: { $sum: 1 },
        totalQuantity: { $sum: "$quantity.current" },
      },
    },
    { $sort: { totalValue: -1 } },
  ]);
};

// Get top suppliers by spending
vendorInventorySchema.statics.getTopSuppliers = async function (
  vendorId,
  limit = 5
) {
  return this.aggregate([
    { $match: { vendorId: vendorId } },
    {
      $group: {
        _id: "$supplier.supplierId",
        supplierName: { $first: "$supplier.supplierName" },
        totalSpent: { $sum: "$cost.totalCost" },
        itemCount: { $sum: 1 },
        totalQuantity: { $sum: "$quantity.received" },
        lastPurchase: { $max: "$dates.purchased" },
      },
    },
    { $sort: { totalSpent: -1 } },
    { $limit: limit },
  ]);
};

export default model("VendorInventory", vendorInventorySchema);
