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
    // RETURN & DEFECT TRACKING
    // ========================================
    damagedQuantity: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    returnedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    writeOffQuantity: {
      type: Number,
      default: 0,
      min: 0,
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
        // Traditional Pakistani
        "Kurta",
        "Shalwar Kameez",
        "Lawn Suits",
        "Sarees",
        "Lehenga",
        "Dupatta",
        "Shawls",
        // Accessories
        "Scarves",
        "Belts",
        "Hats",
        "Bags",
        "Ties",
        "Handbags",
        "Clutches",
        // Footwear
        "Shoes",
        "Sneakers",
        "Boots",
        "Sandals",
        "Heels",
        "Flats",
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
      enum: [
        "Casual",
        "Formal",
        "Sports",
        "Party",
        "Traditional",
        "Workwear",
        "Evening",
        "Bridal",
        "School",
        "Activewear",
      ],
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
      // Size & Fit - EXPANDED for Kids
      size: {
        type: String,
        enum: [
          // Standard Adult Sizes
          "XXS",
          "XS",
          "S",
          "M",
          "L",
          "XL",
          "XXL",
          "XXXL",
          "Free Size",
          // Kids Sizes - Toddler
          "2T",
          "3T",
          "4T",
          // Kids Sizes - Numeric
          "5",
          "6",
          "7",
          "8",
          "10",
          "12",
          "13",
          "14",
          "16",
          // Shoe Sizes
          "1",
          "2",
          "3",
          "4",
          "9",
          "11",
        ],
        required: true,
        index: true,
      },
      fit: {
        type: String,
        enum: [
          // Clothing Fit Types
          "Slim Fit",
          "Regular Fit",
          "Loose Fit",
          "Oversized",
          "Athletic Fit",
          "Relaxed Fit",
          "Bodycon",
          "A-Line",
          "Comfortable Fit",
          // Footwear Fit Types
          "Standard Fit",
          "Wide Fit",
          "Narrow Fit",
          "True to Size",
        ],
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
          "Floral",
          "Abstract",
          "Geometric",
          "Polka Dot",
          "Embroidered",
          "Plaid",
          "Digital Print",
          "Cartoon",
          "Animal Print",
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
          "Soft Cotton",
          "Lace",
          "Lawn",
          "Khaddar",
          "Karandi",
          "Organza",
          "Net",
        ],
        default: "Cotton",
      },
      fabricWeight: {
        type: String,
        default: "",
      },
      careInstructions: {
        type: String,
        default: "Machine wash cold, tumble dry low",
      },

      // Design Details
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
          "Scoop Neck",
          "Square Neck",
        ],
        default: "Crew Neck",
      },
      sleeveLength: {
        type: String,
        enum: [
          "Sleeveless",
          "Short Sleeve",
          "3/4 Sleeve",
          "Long Sleeve",
          "Cap Sleeve",
        ],
        default: "Short Sleeve",
      },
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
    // INVENTORY
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
    minStockLevel: {
      type: Number,
      min: 0,
      default: 10,
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
    // IMAGES
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
          enum: ["front", "back", "side", "detail", "worn", "tag"],
          default: "front",
        },
        isMain: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // ========================================
    // PHYSICAL PROPERTIES
    // ========================================
    weight: {
      type: Number,
      min: 0,
    },
    dimensions: {
      type: String,
    },

    // ========================================
    // TAGS & METADATA
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
      default: "",
    },

    // ========================================
    // STATUS
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
    isNewArrival: {
      type: Boolean,
      default: false,
      index: true,
    },
    isBestseller: {
      type: Boolean,
      default: false,
      index: true,
    },

    // ========================================
    // CERTIFICATIONS
    // ========================================
    isSustainable: {
      type: Boolean,
      default: false,
    },
    certifications: {
      type: [String],
      default: [],
    },

    // ========================================
    // RATINGS & REVIEWS
    // ========================================
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
    reviews: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        userName: String,
        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
        comment: String,
        verifiedPurchase: {
          type: Boolean,
          default: false,
        },
        images: [String],
        helpful: {
          type: Number,
          default: 0,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ========================================
    // SALES & VIEWS
    // ========================================
    totalSold: {
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
    lastViewedAt: {
      type: Date,
    },
    lastSoldAt: {
      type: Date,
    },

    // ========================================
    // MATERIALS USED (Optional - for traceability)
    // ========================================
    materialsUsed: [
      {
        vendorInventoryId: {
          type: Schema.Types.ObjectId,
          ref: "VendorInventory",
        },
        inventoryName: {
          type: String,
          default: "",
        },
        supplierName: {
          type: String,
          default: "",
        },
        supplierId: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        quantityUsed: {
          type: Number,
          min: 0,
        },
        unit: {
          type: String,
          default: "",
        },
        inventoryQRCode: {
          type: String,
          default: "",
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ========================================
    // BLOCKCHAIN
    // ========================================
    blockchainProductId: {
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

    // ========================================
    // SHIPPING
    // ========================================
    freeShipping: {
      type: Boolean,
      default: false,
    },
    shippingCost: {
      type: Number,
      min: 0,
      default: 0,
    },
    estimatedDeliveryDays: {
      type: Number,
      min: 0,
      default: 7,
    },

    // ========================================
    // DATES
    // ========================================
    lastRestockedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ========================================
// INDEXES
// ========================================
productSchema.index({ name: "text", description: "text", tags: "text" });
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ sellerId: 1, status: 1 });
productSchema.index({ price: 1, status: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ totalSold: -1 });
productSchema.index({ averageRating: -1 });

// ========================================
// VIRTUALS
// ========================================

// Available quantity (total - reserved)
productSchema.virtual("availableQuantity").get(function () {
  return this.quantity - (this.reservedQuantity || 0);
});

// Stock status
productSchema.virtual("stockStatus").get(function () {
  const available = this.quantity - (this.reservedQuantity || 0);
  if (available <= 0) return "out_of_stock";
  if (available <= this.minStockLevel) return "low_stock";
  return "in_stock";
});

// Total inventory value including damaged (damaged at 50% value)
productSchema.virtual("totalInventoryValue").get(function () {
  const availableValue = this.quantity * this.price;
  const damagedValue = (this.damagedQuantity || 0) * (this.price * 0.5);
  return availableValue + damagedValue;
});

// Product URL
productSchema.virtual("url").get(function () {
  return `/products/${this.slug || this._id}`;
});

// ========================================
// MIDDLEWARE
// ========================================

// Generate SKU before save
productSchema.pre("save", function (next) {
  if (!this.sku && this.isNew) {
    // Generate SKU format: CAT-TIMESTAMP-RANDOM
    const categoryPrefix = this.category.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.sku = `${categoryPrefix}-${timestamp}-${random}`;
  }
  next();
});

// Generate slug before save
productSchema.pre("save", function (next) {
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

// Update stock status before save
productSchema.pre("save", function (next) {
  if (this.quantity <= 0) {
    this.status = "out_of_stock";
  } else if (
    this.status === "out_of_stock" &&
    this.quantity > this.minStockLevel
  ) {
    this.status = "active";
  }
  next();
});

// ========================================
// METHODS
// ========================================

// Check if product is in stock
productSchema.methods.isInStock = function (requestedQuantity = 1) {
  return this.availableQuantity >= requestedQuantity;
};

// Reserve quantity
productSchema.methods.reserveQuantity = async function (quantity) {
  if (!this.isInStock(quantity)) {
    throw new Error("Insufficient stock");
  }
  this.reservedQuantity = (this.reservedQuantity || 0) + quantity;
  return this.save();
};

// Release reserved quantity
productSchema.methods.releaseReservedQuantity = async function (quantity) {
  this.reservedQuantity = Math.max((this.reservedQuantity || 0) - quantity, 0);
  return this.save();
};

// Update stock after purchase
productSchema.methods.updateStockAfterPurchase = async function (quantity) {
  this.quantity -= quantity;
  this.reservedQuantity = Math.max((this.reservedQuantity || 0) - quantity, 0);
  this.totalSold += quantity;
  this.lastSoldAt = new Date();
  return this.save();
};

// Handle return restocking
productSchema.methods.restockFromReturn = async function (quantity, condition) {
  if (condition === "good") {
    this.quantity += quantity;
    this.returnedQuantity = (this.returnedQuantity || 0) + quantity;

    // Update status if was out of stock
    if (this.status === "out_of_stock" && this.quantity > 0) {
      this.status = "active";
    }
  } else if (condition === "damaged") {
    this.damagedQuantity = (this.damagedQuantity || 0) + quantity;
    this.returnedQuantity = (this.returnedQuantity || 0) + quantity;
  } else if (condition === "unsellable") {
    this.writeOffQuantity = (this.writeOffQuantity || 0) + quantity;
    this.returnedQuantity = (this.returnedQuantity || 0) + quantity;
  }

  this.lastRestockedAt = new Date();
  return this.save();
};

// Add review
productSchema.methods.addReview = async function (reviewData) {
  this.reviews.push(reviewData);

  // Recalculate average rating
  const totalRating = this.reviews.reduce((sum, r) => sum + r.rating, 0);
  this.averageRating = totalRating / this.reviews.length;
  this.totalReviews = this.reviews.length;

  return this.save();
};

export default model("Product", productSchema);
