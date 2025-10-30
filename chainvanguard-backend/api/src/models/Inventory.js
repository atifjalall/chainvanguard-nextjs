import { Schema, model } from "mongoose";

// ========================================
// INVENTORY MOVEMENT SUB-SCHEMA
// ========================================
const inventoryMovementSchema = new Schema({
  type: {
    type: String,
    enum: [
      "initial_stock",
      "restock",
      "purchase",
      "sale",
      "return",
      "adjustment",
      "damage",
      "transfer",
      "reservation",
      "release",
      "quality_rejection",
      "production",
      "wastage",
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
  performedByRole: {
    type: String,
    enum: ["supplier", "vendor", "expert", "customer", "system"],
    required: true,
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
// QUALITY CHECK SUB-SCHEMA
// ========================================
const qualityCheckSchema = new Schema({
  inspector: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  inspectorName: {
    type: String,
    required: true,
  },
  inspectionDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["passed", "failed", "conditional"],
    required: true,
  },
  batchNumber: {
    type: String,
    default: "",
  },
  checkedQuantity: {
    type: Number,
    required: true,
  },
  passedQuantity: {
    type: Number,
    default: 0,
  },
  rejectedQuantity: {
    type: Number,
    default: 0,
  },
  defectTypes: [
    {
      type: String,
      enum: [
        "color_mismatch",
        "fabric_defect",
        "sizing_issue",
        "stitching_problem",
        "print_error",
        "material_quality",
        "measurement_error",
        "finishing_issue",
        "other",
      ],
    },
  ],
  qualityScore: {
    type: Number,
    min: 0,
    max: 100,
  },
  findings: {
    type: String,
    default: "",
  },
  images: [
    {
      url: String,
      description: String,
    },
  ],
  nextInspectionDate: {
    type: Date,
  },
});

// ========================================
// STORAGE LOCATION SUB-SCHEMA
// ========================================
const storageLocationSchema = new Schema({
  warehouse: {
    type: String,
    required: true,
  },
  zone: {
    type: String,
    default: "",
  },
  aisle: {
    type: String,
    default: "",
  },
  rack: {
    type: String,
    default: "",
  },
  bin: {
    type: String,
    default: "",
  },
  quantityAtLocation: {
    type: Number,
    required: true,
    min: 0,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

// ========================================
// BATCH/LOT SUB-SCHEMA
// ========================================
const batchSchema = new Schema({
  batchNumber: {
    type: String,
    required: true,
    unique: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  manufactureDate: {
    type: Date,
    required: true,
  },
  expiryDate: {
    type: Date,
  },
  receivedDate: {
    type: Date,
    default: Date.now,
  },
  supplierId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  supplierName: {
    type: String,
    default: "",
  },
  costPerUnit: {
    type: Number,
    min: 0,
  },
  status: {
    type: String,
    enum: ["available", "reserved", "depleted", "quarantined", "expired"],
    default: "available",
  },
  qualityCheckId: {
    type: Schema.Types.ObjectId,
  },
  blockchainBatchId: {
    type: String,
    default: "",
  },
});

// ========================================
// REORDER ALERT SUB-SCHEMA
// ========================================
const reorderAlertSchema = new Schema({
  triggeredAt: {
    type: Date,
    default: Date.now,
  },
  quantityAtTrigger: {
    type: Number,
    required: true,
  },
  reorderQuantity: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "ordered", "received", "cancelled"],
    default: "pending",
  },
  alertSentTo: [
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      sentAt: Date,
    },
  ],
  orderedAt: {
    type: Date,
  },
  expectedDeliveryDate: {
    type: Date,
  },
  notes: {
    type: String,
    default: "",
  },
});

// ========================================
// MAIN INVENTORY SCHEMA
// ========================================
const inventorySchema = new Schema(
  {
    // ========================================
    // BASIC IDENTIFICATION (Like Product)
    // ========================================
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },

    // ========================================
    // CATEGORY SYSTEM (Textile-focused like Product)
    // ========================================
    category: {
      type: String,
      required: true,
      enum: [
        "Raw Material",
        "Fabric",
        "Yarn & Thread",
        "Dyes & Chemicals",
        "Trims & Accessories",
        "Packaging",
        "Semi-Finished",
        "Tools & Equipment",
      ],
      index: true,
    },

    subcategory: {
      type: String,
      required: true,
      enum: [
        // Raw Materials
        "Cotton Fabric",
        "Polyester Fabric",
        "Silk Fabric",
        "Wool Fabric",
        "Linen Fabric",
        "Denim Fabric",
        "Jersey Fabric",
        "Blended Fabric",
        // Yarn & Thread
        "Cotton Yarn",
        "Polyester Yarn",
        "Sewing Thread",
        "Embroidery Thread",
        // Dyes & Chemicals
        "Fabric Dye",
        "Bleach",
        "Softener",
        "Finishing Chemical",
        // Trims & Accessories
        "Buttons",
        "Zippers",
        "Elastic",
        "Lace",
        "Ribbon",
        "Labels",
        "Tags",
        // Packaging
        "Poly Bags",
        "Hangers",
        "Boxes",
        "Tissue Paper",
        // Semi-Finished
        "Cut Fabric",
        "Printed Fabric",
        "Dyed Fabric",
        "Stitched Panels",
        // Others
        "Scissors",
        "Needles",
        "Measuring Tools",
        "Other",
      ],
      index: true,
    },

    qrCode: {
      type: String,
      default: "",
      index: true,
      unique: true,
      sparse: true, // Allows null values
    },

    qrCodeImageUrl: {
      type: String,
      default: "",
    },

    qrCodeGenerated: {
      type: Boolean,
      default: false,
    },

    qrMetadata: {
      generatedAt: Date,
      generatedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      ipfsHash: String,
      cloudinaryUrl: String,
      trackingUrl: String,
    },

    // Tracking data from QR scans
    scanHistory: [
      {
        scannedAt: {
          type: Date,
          default: Date.now,
        },
        scannedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        scannerRole: {
          type: String,
          enum: [
            "supplier",
            "vendor",
            "expert",
            "ministry",
            "customer",
            "guest",
          ],
        },
        location: {
          latitude: Number,
          longitude: Number,
          address: String,
          city: String,
          country: String,
        },
        purpose: {
          type: String,
          enum: [
            "receiving",
            "quality_check",
            "transfer",
            "inspection",
            "verification",
            "tracking",
            "other",
          ],
        },
        device: String,
        ipAddress: String,
        notes: String,
      },
    ],

    totalScans: {
      type: Number,
      default: 0,
    },

    lastScannedAt: Date,
    lastScannedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    materialType: {
      type: String,
      enum: [
        "Raw Material",
        "Semi-Finished",
        "Finished Component",
        "Accessory",
        "Packaging",
        "Tool",
        "Consumable",
      ],
      default: "Raw Material",
    },

    brand: {
      type: String,
      default: "",
    },

    // ========================================
    // TEXTILE-SPECIFIC DETAILS (Like Product apparelDetails)
    // ========================================
    textileDetails: {
      // Fabric Properties
      fabricType: {
        type: String,
        enum: [
          "Cotton",
          "Polyester",
          "Silk",
          "Wool",
          "Linen",
          "Denim",
          "Jersey",
          "Chiffon",
          "Satin",
          "Velvet",
          "Fleece",
          "Rayon",
          "Nylon",
          "Spandex",
          "Blended",
          "",
        ],
        default: "",
      },
      composition: {
        type: String,
        default: "",
      },
      gsm: {
        type: Number,
        min: 0,
      },
      width: {
        type: Number,
        min: 0,
      },
      fabricWeight: {
        type: String,
        default: "",
      },

      // Color & Pattern
      color: {
        type: String,
        required: true,
        index: true,
      },
      colorCode: {
        type: String,
        default: "",
      },
      pattern: {
        type: String,
        enum: [
          "Solid",
          "Striped",
          "Checked",
          "Printed",
          "Floral",
          "Abstract",
          "Geometric",
          "Polka Dot",
          "Embroidered",
          "Plaid",
          "",
        ],
        default: "Solid",
      },

      // Processing & Care
      finish: {
        type: String,
        enum: [
          "Raw",
          "Bleached",
          "Dyed",
          "Printed",
          "Coated",
          "Plain",
          "Satin",
          "Plain Weave",
          "Twill",
          "Satin Weave",
          "Jacquard",
          "Houndstooth",
          "Tartan",
          "Chevron",
          "Geometric",
          "Abstract",
          "Digital",
          "3D",
          "Textured",
          "Metallic",
          "",
        ],
        default: "",
      },
      careInstructions: {
        type: String,
        default: "",
      },
      shrinkage: {
        type: String,
        default: "",
      },
      washability: {
        type: String,
        default: "",
      },
    },

    // ========================================
    // PRICING (Like Product)
    // ========================================
    pricePerUnit: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    costPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    originalPrice: {
      type: Number,
      min: 0,
    },
    discount: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // ========================================
    // INVENTORY & STOCK (Like Product)
    // ========================================
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    reservedQuantity: {
      type: Number,
      min: 0,
      default: 0,
    },
    committedQuantity: {
      type: Number,
      min: 0,
      default: 0,
    },
    damagedQuantity: {
      type: Number,
      min: 0,
      default: 0,
    },
    minStockLevel: {
      type: Number,
      min: 0,
      default: 10,
    },
    reorderLevel: {
      type: Number,
      required: true,
      min: 0,
      default: 20,
    },
    reorderQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 50,
    },
    maximumQuantity: {
      type: Number,
      min: 0,
    },
    safetyStockLevel: {
      type: Number,
      min: 0,
      default: 15,
    },
    unit: {
      type: String,
      required: true,
      enum: [
        "pieces",
        "meters",
        "yards",
        "kilograms",
        "grams",
        "rolls",
        "boxes",
        "liters",
        "sets",
      ],
      default: "pieces",
    },

    sku: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    // ========================================
    // IMAGES (Like Product)
    // ========================================
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        ipfsHash: {
          type: String,
        },
        cloudinaryId: {
          type: String,
        },
        publicId: {
          type: String,
        },
        viewType: {
          type: String,
          enum: [
            "front",
            "back",
            "side",
            "detail",
            "texture",
            "closeup",
            "roll",
          ],
          default: "front",
        },
        isMain: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // ========================================
    // PHYSICAL PROPERTIES (Like Product)
    // ========================================
    weight: {
      type: Number,
      min: 0,
    },
    dimensions: {
      type: String,
    },

    // ========================================
    // TAGS & METADATA (Like Product)
    // ========================================
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    season: {
      type: String,
      enum: ["Spring", "Summer", "Autumn", "Winter", "All Season"],
      default: "All Season",
    },
    countryOfOrigin: {
      type: String,
      default: "",
    },
    manufacturer: {
      type: String,
      default: "",
    },

    // ========================================
    // SUPPLIER INFORMATION (Like Product sellerId)
    // ========================================
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
    supplierWalletAddress: {
      type: String,
      default: "",
    },
    supplierContact: {
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
      address: { type: String, default: "" },
    },
    alternativeSuppliers: [
      {
        supplierId: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        supplierName: String,
        leadTime: Number,
        costPerUnit: Number,
      },
    ],

    // ========================================
    // STATUS (Like Product)
    // ========================================
    status: {
      type: String,
      enum: [
        "draft",
        "active",
        "inactive",
        "out_of_stock",
        "discontinued",
        "archived",
        "low_stock",
        "on_order",
        "quarantined",
      ],
      default: "active",
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    // ========================================
    // CERTIFICATIONS (Like Product)
    // ========================================
    isSustainable: {
      type: Boolean,
      default: false,
    },
    certifications: {
      type: [String],
      default: [],
    },
    sustainabilityCertifications: {
      type: [String],
      default: [],
    },
    complianceStandards: {
      type: [String],
      default: [],
    },

    // ========================================
    // QUALITY & RATINGS
    // ========================================
    qualityGrade: {
      type: String,
      enum: ["A", "B", "C", "Rejected", ""],
      default: "",
    },
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    totalReviews: {
      type: Number,
      min: 0,
      default: 0,
    },

    // ========================================
    // USAGE & ANALYTICS (Like Product views/sales)
    // ========================================
    totalConsumed: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalReceived: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      min: 0,
      default: 0,
    },
    views: {
      type: Number,
      min: 0,
      default: 0,
    },
    averageMonthlyConsumption: {
      type: Number,
      min: 0,
      default: 0,
    },
    turnoverRate: {
      type: Number,
      min: 0,
      default: 0,
    },
    lastViewedAt: {
      type: Date,
    },
    lastUsedAt: {
      type: Date,
    },

    // ========================================
    // BLOCKCHAIN (Like Product)
    // ========================================
    blockchainInventoryId: {
      type: String,
      index: true,
    },
    blockchainVerified: {
      type: Boolean,
      default: false,
    },
    ipfsHash: {
      type: String,
    },
    fabricTransactionId: {
      type: String,
      index: true,
    },
    traceabilityCode: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    originTransactionHash: {
      type: String,
      default: "",
    },

    // ========================================
    // STORAGE & BATCHES (Inventory-specific)
    // ========================================
    storageLocations: [storageLocationSchema],
    primaryLocation: {
      type: String,
      default: "",
    },
    batches: [batchSchema],
    isBatchTracked: {
      type: Boolean,
      default: false,
    },

    // ========================================
    // MOVEMENT HISTORY
    // ========================================
    movements: [inventoryMovementSchema],

    // ========================================
    // QUALITY CHECKS
    // ========================================
    qualityChecks: [qualityCheckSchema],
    lastQualityCheckDate: {
      type: Date,
    },

    // ========================================
    // REORDER MANAGEMENT
    // ========================================
    reorderAlerts: [reorderAlertSchema],
    autoReorderEnabled: {
      type: Boolean,
      default: false,
    },

    // ========================================
    // TIMING & LOGISTICS
    // ========================================
    leadTime: {
      type: Number,
      min: 0,
      default: 7,
    },
    estimatedDeliveryDays: {
      type: Number,
      min: 0,
      default: 7,
    },
    shelfLife: {
      type: Number,
      min: 0,
    },

    // ========================================
    // DATES (Like Product)
    // ========================================
    lastRestockedAt: {
      type: Date,
    },
    lastMovementDate: {
      type: Date,
    },

    // ========================================
    // DOCUMENTS
    // ========================================
    documents: [
      {
        name: String,
        url: String,
        type: {
          type: String,
          enum: [
            "invoice",
            "certificate",
            "test_report",
            "specification",
            "msds",
          ],
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ========================================
    // ADDITIONAL METADATA
    // ========================================
    notes: {
      type: String,
      default: "",
    },
    internalCode: {
      type: String,
      default: "",
    },
    barcode: {
      type: String,
      default: "",
      index: true,
    },
    carbonFootprint: {
      type: Number,
      min: 0,
    },
    recycledContent: {
      type: Number,
      min: 0,
      max: 100,
    },

    // ========================================
    // ALERTS & WARNINGS
    // ========================================
    alerts: [
      {
        type: {
          type: String,
          enum: [
            "low_stock",
            "expiry_warning",
            "quality_issue",
            "reorder_needed",
            "overstock",
          ],
        },
        message: String,
        severity: {
          type: String,
          enum: ["low", "medium", "high", "critical"],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        resolved: {
          type: Boolean,
          default: false,
        },
        resolvedAt: Date,
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
// INDEXES FOR PERFORMANCE (Like Product)
// ========================================
inventorySchema.index({ name: "text", description: "text", tags: "text" });
inventorySchema.index({ category: 1, subcategory: 1 });
inventorySchema.index({ supplierId: 1, status: 1 });
inventorySchema.index({ pricePerUnit: 1, status: 1 });
inventorySchema.index({ createdAt: -1 });
inventorySchema.index({ totalConsumed: -1 });
inventorySchema.index({ averageRating: -1 });
inventorySchema.index({ "textileDetails.color": 1 });
inventorySchema.index({ quantity: 1 });

// ========================================
// VIRTUALS (Like Product)
// ========================================

// Available quantity (like Product availableQuantity)
inventorySchema.virtual("availableQuantity").get(function () {
  return (
    this.quantity -
    (this.reservedQuantity || 0) -
    (this.committedQuantity || 0) -
    (this.damagedQuantity || 0)
  );
});

// Stock status (like Product stockStatus)
inventorySchema.virtual("stockStatus").get(function () {
  const available = this.availableQuantity;
  if (available <= 0) return "out_of_stock";
  if (available <= this.minStockLevel) return "low_stock";
  return "in_stock";
});

// Inventory URL (like Product url)
inventorySchema.virtual("url").get(function () {
  return `/inventory/${this.slug || this._id}`;
});

// Stock value
inventorySchema.virtual("stockValue").get(function () {
  return this.quantity * (this.pricePerUnit || 0);
});

// Days until reorder needed
inventorySchema.virtual("daysUntilReorder").get(function () {
  if (this.averageMonthlyConsumption <= 0) return null;
  const dailyConsumption = this.averageMonthlyConsumption / 30;
  const availableQty = this.availableQuantity;
  const qtyUntilReorder = availableQty - this.reorderLevel;
  return Math.floor(qtyUntilReorder / dailyConsumption);
});

// ========================================
// MIDDLEWARE (Like Product)
// ========================================

// Generate slug before save (like Product)
inventorySchema.pre("save", function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Append a random string to ensure uniqueness
    this.slug += `-${Date.now().toString(36)}`;
  }
  next();
});

// Update stock status before save (like Product)
inventorySchema.pre("save", function (next) {
  if (this.quantity <= 0) {
    this.status = "out_of_stock";
  } else if (this.quantity <= this.minStockLevel) {
    this.status = "low_stock";
  } else if (
    (this.status === "out_of_stock" || this.status === "low_stock") &&
    this.quantity > this.minStockLevel
  ) {
    this.status = "active";
  }
  next();
});

// ========================================
// METHODS (Like Product methods)
// ========================================

// Check if in stock (like Product isInStock)
inventorySchema.methods.isInStock = function (requestedQuantity = 1) {
  return this.availableQuantity >= requestedQuantity;
};

// Reserve quantity (like Product reserveQuantity)
inventorySchema.methods.reserveQuantity = async function (quantity) {
  if (!this.isInStock(quantity)) {
    throw new Error("Insufficient stock");
  }
  this.reservedQuantity = (this.reservedQuantity || 0) + quantity;
  return this.save();
};

// Release reserved quantity (like Product releaseReservedQuantity)
inventorySchema.methods.releaseReservedQuantity = async function (quantity) {
  this.reservedQuantity = Math.max((this.reservedQuantity || 0) - quantity, 0);
  return this.save();
};

// Update stock after consumption (like Product updateStockAfterPurchase)
inventorySchema.methods.updateStockAfterConsumption = async function (
  quantity
) {
  this.quantity -= quantity;
  this.reservedQuantity = Math.max((this.reservedQuantity || 0) - quantity, 0);
  this.totalConsumed += quantity;
  this.lastUsedAt = new Date();
  return this.save();
};

// Add movement
inventorySchema.methods.addMovement = function (
  type,
  quantity,
  userId,
  userRole,
  additionalData = {}
) {
  const movement = {
    type,
    quantity,
    previousQuantity: this.quantity,
    newQuantity: this.quantity + quantity,
    performedBy: userId,
    performedByRole: userRole,
    timestamp: new Date(),
    ...additionalData,
  };

  this.movements.push(movement);
  this.lastMovementDate = new Date();

  return movement;
};

// Add stock
inventorySchema.methods.addStock = function (
  quantity,
  userId,
  userRole,
  notes = ""
) {
  this.quantity += quantity;
  this.totalReceived = (this.totalReceived || 0) + quantity;
  this.lastRestockedAt = new Date();
  this.addMovement("restock", quantity, userId, userRole, { notes });
};

// Reduce stock
inventorySchema.methods.reduceStock = function (
  quantity,
  userId,
  userRole,
  reason = "sale"
) {
  if (this.availableQuantity < quantity) {
    throw new Error("Insufficient stock");
  }
  this.quantity -= quantity;
  this.totalConsumed = (this.totalConsumed || 0) + quantity;
  this.lastUsedAt = new Date();
  this.addMovement(reason, -quantity, userId, userRole);
};

// Add quality check
inventorySchema.methods.addQualityCheck = async function (checkData) {
  this.qualityChecks.push(checkData);
  this.lastQualityCheckDate = new Date();
  return this.save();
};

// Check if reorder needed
inventorySchema.methods.needsReorder = function () {
  return this.availableQuantity <= this.reorderLevel;
};

// Create reorder alert
inventorySchema.methods.createReorderAlert = function () {
  const alert = {
    triggeredAt: new Date(),
    quantityAtTrigger: this.availableQuantity,
    reorderQuantity: this.reorderQuantity,
    status: "pending",
  };
  this.reorderAlerts.push(alert);
  return alert;
};

// ========================================
// STATICS
// ========================================

// Get low stock items
inventorySchema.statics.getLowStockItems = function (supplierId = null) {
  const query = {
    $expr: {
      $lte: [
        {
          $subtract: [
            "$quantity",
            { $add: ["$reservedQuantity", "$committedQuantity"] },
          ],
        },
        "$reorderLevel",
      ],
    },
    status: { $ne: "discontinued" },
  };

  if (supplierId) {
    query.supplierId = supplierId;
  }

  return this.find(query).sort({ quantity: 1 });
};

// Get by supplier
inventorySchema.statics.getBySupplier = function (supplierId, filters = {}) {
  const query = { supplierId, ...filters };
  return this.find(query).sort({ createdAt: -1 });
};

// Get inventory value by supplier
inventorySchema.statics.getTotalValueBySupplier = async function (supplierId) {
  const result = await this.aggregate([
    { $match: { supplierId, status: { $ne: "discontinued" } } },
    {
      $group: {
        _id: "$supplierId",
        totalValue: {
          $sum: { $multiply: ["$quantity", "$pricePerUnit"] },
        },
        totalItems: { $sum: 1 },
      },
    },
  ]);
  return result[0] || { totalValue: 0, totalItems: 0 };
};

export default model("Inventory", inventorySchema);
