import { Schema, model } from "mongoose";

const productSchema = new Schema(
  {
    // Basic Info
    name: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    subcategory: { type: String, default: "" },

    // Seller Info
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sellerName: { type: String, required: true },
    sellerWalletAddress: { type: String, required: true },

    // Pricing
    price: { type: Number, required: true, min: 0, index: true },
    currency: { type: String, default: "USD" },
    costPrice: { type: Number, default: 0 }, // For suppliers
    markup: { type: Number, default: 0 }, // Percentage

    // Inventory
    quantity: { type: Number, required: true, min: 0 },
    sku: { type: String, unique: true, sparse: true },
    barcode: { type: String, default: "" },
    minStockLevel: { type: Number, default: 10 },

    // Images (Cloudinary) - Display images
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        ipfsHash: { type: String, default: "" }, // Also store on IPFS for verification
        isMain: { type: Boolean, default: false },
      },
    ],

    // Documents (IPFS) - Verification documents
    certificates: [
      {
        name: { type: String, required: true },
        type: {
          type: String,
          enum: ["quality", "origin", "compliance", "certificate", "other"],
          default: "certificate",
        },
        ipfsHash: { type: String, required: true },
        ipfsUrl: { type: String, required: true },
        cloudinaryUrl: { type: String, default: "" }, // Backup on Cloudinary
        uploadedAt: { type: Date, default: Date.now },
        fileSize: { type: Number, default: 0 },
        mimeType: { type: String, default: "application/pdf" },
      },
    ],

    // Supply Chain
    origin: { type: String, default: "" },
    manufacturer: { type: String, default: "" },
    batchNumber: { type: String, default: "" },
    manufactureDate: { type: Date, default: null },
    expiryDate: { type: Date, default: null },

    // Specifications
    specifications: {
      weight: { type: Number, default: 0 },
      weightUnit: { type: String, default: "kg" },
      dimensions: {
        length: { type: Number, default: 0 },
        width: { type: Number, default: 0 },
        height: { type: Number, default: 0 },
        unit: { type: String, default: "cm" },
      },
      color: { type: String, default: "" },
      material: { type: String, default: "" },
      customFields: { type: Schema.Types.Mixed, default: {} },
    },

    // Blockchain
    blockchainProductId: { type: String, unique: true, sparse: true },
    blockchainTxId: { type: String, default: "" },
    blockchainVerified: { type: Boolean, default: false },

    // Status
    status: {
      type: String,
      enum: [
        "draft",
        "active",
        "out_of_stock",
        "discontinued",
        "pending_verification",
      ],
      default: "active",
      index: true,
    },
    isVerified: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },

    // Statistics
    views: { type: Number, default: 0 },
    totalSold: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },

    // SEO
    slug: { type: String, unique: true, sparse: true },
    tags: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

// Compound Indexes for complex queries
productSchema.index({ sellerId: 1, status: 1 });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ status: 1, isVerified: 1, isFeatured: 1 });
productSchema.index({ createdAt: -1 });

// Text index for search
productSchema.index({
  name: "text",
  description: "text",
  tags: "text",
  category: "text",
});

// Generate SKU before saving
productSchema.pre("save", async function (next) {
  if (!this.sku) {
    this.sku = `PRD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  // Generate slug
  if (!this.slug) {
    this.slug =
      this.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" +
      Date.now();
  }

  next();
});

// Update out_of_stock status automatically
productSchema.pre("save", function (next) {
  if (this.quantity === 0 && this.status === "active") {
    this.status = "out_of_stock";
  } else if (this.quantity > 0 && this.status === "out_of_stock") {
    this.status = "active";
  }
  next();
});

// Virtual for stock status
productSchema.virtual("stockStatus").get(function () {
  if (this.quantity === 0) return "out_of_stock";
  if (this.quantity <= this.minStockLevel) return "low_stock";
  return "in_stock";
});

// Ensure virtuals are included in JSON
productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

export default model("Product", productSchema);
