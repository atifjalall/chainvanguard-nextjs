import { Schema, model } from "mongoose";

// ========================================
// PRODUCT SCHEMA - APPAREL/TEXTILE FOCUS
// ========================================
const productSchema = new Schema(
  {
    // ========================================
    // BASIC INFORMATION
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
    // CATEGORY SYSTEM (Apparel-focused)
    // ========================================
    category: {
      type: String,
      required: true,
      enum: ["Men", "Women", "Kids", "Unisex"],
      index: true,
    },

    subcategory: {
      type: String,
      required: true,
      enum: [
        // Tops
        "T-Shirts",
        "Shirts",
        "Blouses",
        "Sweaters",
        "Hoodies",
        "Jackets",
        "Coats",
        // Bottoms
        "Jeans",
        "Trousers",
        "Shorts",
        "Skirts",
        // Full Body
        "Dresses",
        "Suits",
        "Jumpsuits",
        // Accessories
        "Scarves",
        "Belts",
        "Hats",
        "Bags",
        // Footwear
        "Shoes",
        "Sneakers",
        "Boots",
        "Sandals",
        // Others
        "Activewear",
        "Sleepwear",
        "Swimwear",
        "Underwear",
      ],
      index: true,
    },

    qrCode: {
      type: String,
      index: true,
    },
    qrCodeImageUrl: {
      type: String,
    },

    productType: {
      type: String,
      enum: ["Casual", "Formal", "Sports", "Party", "Traditional", "Workwear"],
      default: "Casual",
    },

    brand: {
      type: String,
      default: "",
    },

    // ========================================
    // APPAREL-SPECIFIC ATTRIBUTES
    // ========================================
    apparelDetails: {
      // Size & Fit
      size: {
        type: String,
        enum: ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "Free Size"],
        required: true,
        index: true,
      },
      fit: {
        type: String,
        enum: ["Slim Fit", "Regular Fit", "Loose Fit", "Oversized"],
        default: "Regular Fit",
      },

      // Style Details
      color: {
        type: String,
        required: true,
        index: true,
      },
      pattern: {
        type: String,
        enum: [
          "Solid",
          "Striped",
          "Checked",
          "Printed",
          "Embroidered",
          "Other",
        ],
        default: "Solid",
      },

      // Material & Fabric
      material: {
        type: String,
        required: true,
      },
      fabricType: {
        type: String,
        default: "",
      },
      fabricWeight: {
        type: String,
        default: "",
      },
      fabricComposition: [
        {
          material: { type: String },
          percentage: { type: Number, min: 0, max: 100 },
        },
      ],

      // Style Attributes
      neckline: {
        type: String,
        enum: [
          "Crew Neck",
          "V-Neck",
          "Round Neck",
          "Collar",
          "Off-Shoulder",
          "Boat Neck",
          "Turtleneck",
          "Other",
        ],
        default: "Crew Neck",
      },
      sleeveLength: {
        type: String,
        enum: ["Sleeveless", "Short Sleeve", "3/4 Sleeve", "Long Sleeve"],
        default: "Short Sleeve",
      },

      // Care Instructions
      careInstructions: {
        type: String,
        default: "Machine wash cold, tumble dry low",
      },
      washingTemperature: {
        type: String,
        default: "30°C",
      },
      ironingInstructions: {
        type: String,
        default: "Low heat",
      },
      dryCleanOnly: {
        type: Boolean,
        default: false,
      },

      // Measurements (for size chart)
      measurements: {
        chest: { type: Number, default: 0 },
        waist: { type: Number, default: 0 },
        length: { type: Number, default: 0 },
        shoulder: { type: Number, default: 0 },
        sleeve: { type: Number, default: 0 },
        hips: { type: Number, default: 0 },
        unit: { type: String, default: "cm" },
      },
    },

    // ========================================
    // SELLER INFORMATION
    // ========================================
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sellerName: {
      type: String,
      required: true,
    },
    sellerWalletAddress: {
      type: String,
      required: true,
    },
    sellerRole: {
      type: String,
      enum: ["supplier", "vendor"],
      default: "supplier",
    },

    // ========================================
    // PRICING
    // ========================================
    price: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    currency: {
      type: String,
      default: "USD",
    },
    costPrice: {
      type: Number,
      default: 0,
    },
    wholesalePrice: {
      type: Number,
      default: 0,
    },
    markup: {
      type: Number,
      default: 0,
    },

    // ========================================
    // INVENTORY
    // ========================================
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    reservedQuantity: {
      type: Number,
      default: 0,
    },
    minStockLevel: {
      type: Number,
      default: 10,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
    },
    barcode: {
      type: String,
      default: "",
    },
    unit: {
      type: String,
      default: "piece",
    },

    // ========================================
    // IMAGES (Cloudinary + IPFS)
    // ========================================
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        ipfsHash: { type: String, default: "" },
        isMain: { type: Boolean, default: false },
        viewType: {
          type: String,
          enum: ["front", "back", "side", "detail", "worn", "tag", "other"],
          default: "front",
        },
      },
    ],

    // ========================================
    // DOCUMENTS/CERTIFICATES (IPFS)
    // ========================================
    certificates: [
      {
        name: { type: String, required: true },
        certificateNumber: { type: String, default: "" },
        type: {
          type: String,
          enum: [
            "GOTS",
            "Fair Trade",
            "OEKO-TEX",
            "ISO",
            "Origin",
            "Quality",
            "Compliance",
            "Other",
          ],
          default: "Other",
        },
        issueDate: { type: Date, default: null },
        expiryDate: { type: Date, default: null },
        ipfsHash: { type: String, required: true },
        ipfsUrl: { type: String, required: true },
        cloudinaryUrl: { type: String, default: "" },
        fileSize: { type: Number, default: 0 },
        mimeType: { type: String, default: "application/pdf" },
      },
    ],

    // ========================================
    // MANUFACTURING & ORIGIN
    // ========================================
    manufacturingDetails: {
      manufacturerId: { type: String, default: "" },
      manufacturerName: { type: String, default: "" },
      manufactureDate: { type: Date, default: null },
      batchNumber: { type: String, default: "" },
      productionCountry: { type: String, default: "" },
      productionFacility: { type: String, default: "" },
      productionLine: { type: String, default: "" },
    },

    // Physical specifications
    specifications: {
      weight: { type: Number, default: 0 },
      weightUnit: { type: String, default: "kg" },
      packageWeight: { type: Number, default: 0 },
      packageType: { type: String, default: "Poly Bag" },
      dimensions: {
        length: { type: Number, default: 0 },
        width: { type: Number, default: 0 },
        height: { type: Number, default: 0 },
        unit: { type: String, default: "cm" },
      },
    },

    // ========================================
    // SUSTAINABILITY & CERTIFICATIONS
    // ========================================
    sustainability: {
      isOrganic: { type: Boolean, default: false },
      isFairTrade: { type: Boolean, default: false },
      isRecycled: { type: Boolean, default: false },
      isCarbonNeutral: { type: Boolean, default: false },
      waterSaving: { type: Boolean, default: false },
      ethicalProduction: { type: Boolean, default: false },
    },

    qualityGrade: {
      type: String,
      enum: ["A", "B", "C", "Premium", "Standard"],
      default: "Standard",
    },

    // ========================================
    // SUPPLY CHAIN & TRACKING
    // ========================================
    currentLocation: {
      facility: { type: String, default: "" },
      address: { type: String, default: "" },
      city: { type: String, default: "" },
      country: { type: String, default: "" },
      coordinates: {
        lat: { type: Number, default: 0 },
        lng: { type: Number, default: 0 },
      },
    },

    supplyChainSummary: {
      totalStages: { type: Number, default: 0 },
      currentStage: { type: String, default: "Created" },
      lastUpdate: { type: Date, default: Date.now },
    },

    // ========================================
    // BLOCKCHAIN INTEGRATION
    // ========================================
    blockchainProductId: {
      type: String,
      unique: true,
      sparse: true,
    },
    blockchainTxId: {
      type: String,
      default: "",
    },
    blockchainVerified: {
      type: Boolean,
      default: false,
    },
    ipfsHash: {
      type: String,
      default: "",
    },
    qrCode: {
      type: String,
      default: "",
    },

    // ========================================
    // STATUS & VISIBILITY
    // ========================================
    status: {
      type: String,
      enum: [
        "draft",
        "active",
        "out_of_stock",
        "discontinued",
        "pending_verification",
        "archived",
      ],
      default: "active",
      index: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },

    // ========================================
    // SEO & MARKETING
    // ========================================
    slug: {
      type: String,
      unique: true,
      sparse: true,
    },
    tags: [{ type: String }],
    keywords: [{ type: String }],
    metaDescription: {
      type: String,
      default: "",
    },

    season: {
      type: String,
      enum: ["Spring", "Summer", "Autumn", "Winter", "All Season"],
      default: "All Season",
    },
    collection: {
      type: String,
      default: "",
    },

    // ========================================
    // STATISTICS & ANALYTICS
    // ========================================
    views: {
      type: Number,
      default: 0,
    },
    favorites: {
      type: Number,
      default: 0,
    },
    cartAdditions: {
      type: Number,
      default: 0,
    },
    totalSold: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    lastViewedAt: {
      type: Date,
      default: null,
    },
    lastSoldAt: {
      type: Date,
      default: null,
    },
    lastRestockedAt: {
      type: Date,
      default: null,
    },

    // ========================================
    // ADDITIONAL FIELDS
    // ========================================
    minimumOrderQuantity: {
      type: Number,
      default: 1,
    },
    warrantyPeriod: {
      type: String,
      default: "",
    },
    returnPolicy: {
      type: String,
      default: "30 days",
    },
    shippingDetails: {
      weight: { type: Number, default: 0 },
      dimensions: {
        length: { type: Number, default: 0 },
        width: { type: Number, default: 0 },
        height: { type: Number, default: 0 },
      },
      freeShipping: { type: Boolean, default: false },
      shippingCost: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// ========================================
// INDEXES FOR PERFORMANCE
// ========================================
productSchema.index({ sellerId: 1, status: 1 });
productSchema.index({ category: 1, subcategory: 1, status: 1 });
productSchema.index({ "apparelDetails.size": 1, "apparelDetails.color": 1 });
productSchema.index({ price: 1, status: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ totalSold: -1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ isFeatured: 1, status: 1 });

// Text search index
productSchema.index({
  name: "text",
  description: "text",
  tags: "text",
  "apparelDetails.material": "text",
  "apparelDetails.color": "text",
  brand: "text",
});

// ========================================
// VIRTUALS
// ========================================
// Available quantity (total - reserved)
productSchema.virtual("availableQuantity").get(function () {
  return Math.max(0, this.quantity - (this.reservedQuantity || 0));
});

// Stock status
productSchema.virtual("stockStatus").get(function () {
  const available = this.availableQuantity;
  if (available === 0) return "out_of_stock";
  if (available <= this.minStockLevel) return "low_stock";
  return "in_stock";
});

// Full product URL
productSchema.virtual("url").get(function () {
  return `${process.env.FRONTEND_URL}/products/${this.slug}`;
});

// ========================================
// PRE-SAVE HOOKS
// ========================================
productSchema.pre("save", async function (next) {
  try {
    // Auto-generate SKU if not provided
    if (!this.sku) {
      const category = this.category.substring(0, 3).toUpperCase();
      const subcat = this.subcategory.substring(0, 3).toUpperCase();
      const size = this.apparelDetails?.size?.substring(0, 1) || "X";
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();

      this.sku = `${category}-${subcat}-${size}-${random}`;
    }

    // Auto-generate slug
    if (!this.slug) {
      this.slug =
        this.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") +
        "-" +
        Date.now();
    }

    // Update stock status
    if (this.quantity === 0 && this.status === "active") {
      this.status = "out_of_stock";
    } else if (this.quantity > 0 && this.status === "out_of_stock") {
      this.status = "active";
    }

    // Set main image if none selected
    if (this.images.length > 0 && !this.images.some((img) => img.isMain)) {
      this.images[0].isMain = true;
    }

    // Update last restocked date if quantity increased
    if (this.isModified("quantity") && this.quantity > 0) {
      const original = this.$locals?.original?.quantity || 0;
      if (this.quantity > original) {
        this.lastRestockedAt = new Date();
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

// ========================================
// METHODS
// ========================================
// Reserve quantity for orders
productSchema.methods.reserveQuantity = async function (qty) {
  if (this.availableQuantity < qty) {
    throw new Error("Insufficient stock available");
  }
  this.reservedQuantity = (this.reservedQuantity || 0) + qty;
  return this.save();
};

// Release reserved quantity
productSchema.methods.releaseQuantity = async function (qty) {
  this.reservedQuantity = Math.max(0, (this.reservedQuantity || 0) - qty);
  return this.save();
};

// Decrement quantity after sale
productSchema.methods.decrementQuantity = async function (qty) {
  if (this.quantity < qty) {
    throw new Error("Insufficient stock");
  }
  this.quantity -= qty;
  this.totalSold += qty;
  this.lastSoldAt = new Date();
  return this.save();
};

// Increment view count
productSchema.methods.incrementViews = async function () {
  this.views += 1;
  this.lastViewedAt = new Date();
  return this.save();
};

// ========================================
// STATICS
// ========================================
// Find by SKU
productSchema.statics.findBySKU = function (sku) {
  return this.findOne({ sku: sku.toUpperCase() });
};

// Find low stock products
productSchema.statics.findLowStock = function (sellerId) {
  const query = {
    status: "active",
    $expr: { $lte: ["$quantity", "$minStockLevel"] },
  };
  if (sellerId) query.sellerId = sellerId;
  return this.find(query);
};

// Find featured products
productSchema.statics.findFeatured = function (limit = 10) {
  return this.find({ isFeatured: true, status: "active" })
    .sort({ totalSold: -1, averageRating: -1 })
    .limit(limit);
};

// ========================================
// ENSURE VIRTUALS IN JSON
// ========================================
productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

export default model("Product", productSchema);
