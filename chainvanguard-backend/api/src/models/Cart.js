// api/src/models/Cart.js
import { Schema, model } from "mongoose";

// ========================================
// CART ITEM SUB-SCHEMA
// ========================================
const cartItemSchema = new Schema({
  // Product Reference
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },

  // Product Snapshot (at time of adding to cart)
  productName: { type: String, required: true },
  productImage: { type: String, default: "" },
  sku: { type: String, default: "" },

  // Seller Info
  sellerId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sellerName: { type: String, default: "" },

  // Apparel Details (selected by customer)
  selectedSize: { type: String, default: "" },
  selectedColor: { type: String, default: "" },
  selectedFit: { type: String, default: "" },

  // Pricing
  price: { type: Number, required: true, min: 0 }, // Price at time of adding
  quantity: { type: Number, required: true, min: 1, default: 1 },
  subtotal: { type: Number, required: true, min: 0 },

  // Availability Check
  isAvailable: { type: Boolean, default: true },
  availableQuantity: { type: Number, default: 0 },
  stockStatus: {
    type: String,
    enum: ["in_stock", "low_stock", "out_of_stock"],
    default: "in_stock",
  },

  // Metadata
  addedAt: { type: Date, default: Date.now },
  lastCheckedAt: { type: Date, default: Date.now }, // Last stock availability check
});

// ========================================
// SAVED ITEM SUB-SCHEMA (Wishlist/Save for Later)
// ========================================
const savedItemSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  productName: { type: String, required: true },
  productImage: { type: String, default: "" },
  price: { type: Number, required: true },
  sellerId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  savedAt: { type: Date, default: Date.now },
  notes: { type: String, default: "" },
});

// ========================================
// MAIN CART SCHEMA
// ========================================
const cartSchema = new Schema(
  {
    // ========================================
    // USER IDENTIFICATION
    // ========================================
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
      sparse: true, // Allows null for guest carts
    },

    // Session ID for guest users (not logged in)
    sessionId: {
      type: String,
      index: true,
      sparse: true,
    },

    // User Type
    userType: {
      type: String,
      enum: ["registered", "guest"],
      default: "registered",
    },

    // ========================================
    // CART ITEMS
    // ========================================
    items: [cartItemSchema],

    // ========================================
    // SAVED FOR LATER (Wishlist)
    // ========================================
    savedItems: [savedItemSchema],

    // ========================================
    // CART SUMMARY
    // ========================================
    subtotal: { type: Number, default: 0, min: 0 },
    totalItems: { type: Number, default: 0, min: 0 },
    totalQuantity: { type: Number, default: 0, min: 0 },
    totalSellers: { type: Number, default: 0, min: 0 }, // Number of unique sellers

    // ========================================
    // DISCOUNT & COUPON
    // ========================================
    appliedCoupon: {
      code: { type: String, default: "" },
      discount: { type: Number, default: 0 },
      discountType: {
        type: String,
        enum: ["percentage", "fixed", ""],
        default: "",
      },
      appliedAt: { type: Date },
    },

    // ========================================
    // CART STATUS
    // ========================================
    status: {
      type: String,
      enum: ["active", "abandoned", "converted", "merged"],
      default: "active",
      index: true,
    },

    // ========================================
    // CART METADATA
    // ========================================
    // Last activity timestamp
    lastActivityAt: { type: Date, default: Date.now, index: true },

    // Cart expiry for guest users (7 days default)
    expiresAt: {
      type: Date,
      // TTL index defined in schema.index() below
    },

    // Device info
    deviceType: {
      type: String,
      enum: ["mobile", "desktop", "tablet", ""],
      default: "",
    },
    userAgent: { type: String, default: "" },
    ipAddress: { type: String, default: "" },

    // ========================================
    // ANALYTICS & TRACKING
    // ========================================
    // Where the user came from
    referralSource: { type: String, default: "" },

    // UTM parameters for marketing tracking
    utmParams: {
      source: { type: String, default: "" },
      medium: { type: String, default: "" },
      campaign: { type: String, default: "" },
    },

    // Abandoned cart tracking
    abandonedAt: { type: Date },
    reminderSent: { type: Boolean, default: false },
    reminderSentAt: { type: Date },

    // Conversion tracking
    convertedToOrderAt: { type: Date },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },

    // ========================================
    // MERGE TRACKING (Guest to Registered)
    // ========================================
    mergedFrom: { type: String, default: "" }, // Previous sessionId if merged
    mergedAt: { type: Date },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// ========================================
// INDEXES FOR PERFORMANCE
// ========================================
cartSchema.index({ userId: 1, status: 1 });
cartSchema.index({ sessionId: 1, status: 1 });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-deletion
// lastActivityAt has index: true in schema
cartSchema.index({ status: 1, lastActivityAt: 1 });
cartSchema.index({ "items.productId": 1 });

// ========================================
// VIRTUALS
// ========================================

// Check if cart is empty
cartSchema.virtual("isEmpty").get(function () {
  return this.items.length === 0;
});

// Check if cart has unavailable items
cartSchema.virtual("hasUnavailableItems").get(function () {
  return this.items.some((item) => !item.isAvailable);
});

// Get list of unique sellers
cartSchema.virtual("sellersList").get(function () {
  const sellers = new Set(this.items.map((item) => item.sellerId.toString()));
  return Array.from(sellers);
});

// Days until expiry (for guest carts)
cartSchema.virtual("daysUntilExpiry").get(function () {
  if (!this.expiresAt) return null;
  const now = new Date();
  const diffTime = this.expiresAt - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Check if cart is expired
cartSchema.virtual("isExpired").get(function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Check if cart is abandoned (no activity for 24 hours)
cartSchema.virtual("isAbandoned").get(function () {
  const hoursSinceActivity =
    (new Date() - this.lastActivityAt) / (1000 * 60 * 60);
  return hoursSinceActivity > 24;
});

// ========================================
// PRE-SAVE HOOKS
// ========================================

cartSchema.pre("save", function (next) {
  // Calculate totals - totalItems should be count of UNIQUE items, not quantities
  this.totalItems = this.items.length; // ✅ Number of unique items
  this.totalQuantity = this.items.reduce((sum, item) => sum + item.quantity, 0); // Total quantity across all items
  this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);

  // Calculate unique sellers
  const uniqueSellers = new Set(
    this.items.map((item) => item.sellerId.toString())
  );
  this.totalSellers = uniqueSellers.size;

  // Set expiry date for guest carts (7 days from creation)
  if (this.userType === "guest" && !this.expiresAt) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    this.expiresAt = expiryDate;
  }

  // Update last activity
  if (this.isModified("items") || this.isModified("savedItems")) {
    this.lastActivityAt = new Date();
  }

  // Mark as abandoned if no activity for 24 hours
  const hoursSinceActivity =
    (new Date() - this.lastActivityAt) / (1000 * 60 * 60);
  if (hoursSinceActivity > 24 && this.status === "active") {
    this.status = "abandoned";
    this.abandonedAt = new Date();
  }

  next();
});

// ========================================
// METHODS
// ========================================

/**
 * Add item to cart or update quantity if exists
 */
cartSchema.methods.addItem = async function (itemData) {
  // Check if item already exists in cart
  const existingItemIndex = this.items.findIndex(
    (item) =>
      item.productId.toString() === itemData.productId.toString() &&
      item.selectedSize === itemData.selectedSize &&
      item.selectedColor === itemData.selectedColor
  );

  if (existingItemIndex > -1) {
    // Update quantity of existing item
    this.items[existingItemIndex].quantity += itemData.quantity || 1;
    this.items[existingItemIndex].subtotal =
      this.items[existingItemIndex].price *
      this.items[existingItemIndex].quantity;
  } else {
    // Add new item
    const newItem = {
      ...itemData,
      subtotal: itemData.price * (itemData.quantity || 1),
      addedAt: new Date(),
    };
    this.items.push(newItem);
  }

  return this.save();
};

/**
 * Update item quantity
 */
cartSchema.methods.updateItemQuantity = async function (itemId, quantity) {
  const item = this.items.id(itemId);
  if (!item) {
    throw new Error("Item not found in cart");
  }

  if (quantity <= 0) {
    // Remove item if quantity is 0 or negative
    this.items.pull(itemId);
  } else {
    item.quantity = quantity;
    item.subtotal = item.price * quantity;
  }

  return this.save();
};

/**
 * Remove item from cart
 */
cartSchema.methods.removeItem = async function (itemId) {
  const item = this.items.id(itemId);
  if (!item) {
    throw new Error("Item not found in cart");
  }

  this.items.pull(itemId);
  return this.save();
};

/**
 * Clear all items from cart
 */
cartSchema.methods.clearCart = async function () {
  this.items = [];
  this.savedItems = [];
  this.totalItems = 0;
  this.totalQuantity = 0;
  this.subtotal = 0;
  this.totalSellers = 0;
  this.appliedCoupon = {
    code: "",
    discount: 0,
    discountType: "",
  };
  return this.save();
};

/**
 * Move item to saved for later
 */
cartSchema.methods.saveForLater = async function (itemId, notes = "") {
  const item = this.items.id(itemId);
  if (!item) {
    throw new Error("Item not found in cart");
  }

  // Add to saved items
  this.savedItems.push({
    productId: item.productId,
    productName: item.productName,
    productImage: item.productImage,
    price: item.price,
    sellerId: item.sellerId,
    notes: notes,
    savedAt: new Date(),
  });

  // Remove from cart items
  this.items.pull(itemId);

  return this.save();
};

/**
 * Move item from saved to cart
 */
cartSchema.methods.moveToCart = async function (savedItemId) {
  const savedItem = this.savedItems.id(savedItemId);
  if (!savedItem) {
    throw new Error("Saved item not found");
  }

  // Get full product details (would need to populate in real use)
  // For now, we'll use saved data
  await this.addItem({
    productId: savedItem.productId,
    productName: savedItem.productName,
    productImage: savedItem.productImage,
    price: savedItem.price,
    sellerId: savedItem.sellerId,
    quantity: 1,
  });

  // Remove from saved items
  this.savedItems.pull(savedItemId);

  return this.save();
};

/**
 * Apply coupon code
 */
cartSchema.methods.applyCoupon = async function (code, discount, discountType) {
  this.appliedCoupon = {
    code: code,
    discount: discount,
    discountType: discountType,
    appliedAt: new Date(),
  };

  return this.save();
};

/**
 * Remove coupon
 */
cartSchema.methods.removeCoupon = async function () {
  this.appliedCoupon = {
    code: "",
    discount: 0,
    discountType: "",
  };

  return this.save();
};

/**
 * Validate cart items availability
 */
cartSchema.methods.validateItems = async function () {
  const Product = model("Product");
  const unavailableItems = [];

  for (const item of this.items) {
    const product = await Product.findById(item.productId);

    if (!product) {
      item.isAvailable = false;
      item.stockStatus = "out_of_stock";
      unavailableItems.push(item);
      continue;
    }

    if (product.status !== "active") {
      item.isAvailable = false;
      item.stockStatus = "out_of_stock";
      unavailableItems.push(item);
      continue;
    }

    const availableQty = product.quantity - (product.reservedQuantity || 0);
    item.availableQuantity = availableQty;

    if (availableQty < item.quantity) {
      item.isAvailable = false;
      item.stockStatus = "out_of_stock";
      unavailableItems.push(item);
    } else if (availableQty <= product.minStockLevel) {
      item.stockStatus = "low_stock";
    } else {
      item.isAvailable = true;
      item.stockStatus = "in_stock";
    }

    item.lastCheckedAt = new Date();
  }

  await this.save();

  return {
    isValid: unavailableItems.length === 0,
    unavailableItems: unavailableItems,
  };
};

/**
 * Convert cart to order (mark as converted)
 */
cartSchema.methods.markAsConverted = async function (orderId) {
  this.status = "converted";
  this.convertedToOrderAt = new Date();
  this.orderId = orderId;

  return this.save();
};

// ========================================
// STATICS
// ========================================

/**
 * Find or create cart for user
 */
cartSchema.statics.findOrCreateForUser = async function (userId) {
  let cart = await this.findOne({ userId, status: "active" });

  if (!cart) {
    cart = await this.create({
      userId,
      userType: "registered",
      status: "active",
    });
  }

  return cart;
};

/**
 * Find or create cart for guest
 */
cartSchema.statics.findOrCreateForGuest = async function (sessionId) {
  let cart = await this.findOne({ sessionId, status: "active" });

  if (!cart) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);

    cart = await this.create({
      sessionId,
      userType: "guest",
      status: "active",
      expiresAt: expiryDate,
    });
  }

  return cart;
};

/**
 * Merge guest cart into user cart
 */
cartSchema.statics.mergeGuestCart = async function (sessionId, userId) {
  const guestCart = await this.findOne({ sessionId, status: "active" });
  if (!guestCart) {
    return null;
  }

  const userCart = await this.findOrCreateForUser(userId);

  // Merge items
  for (const item of guestCart.items) {
    await userCart.addItem(item.toObject());
  }

  // Merge saved items
  for (const savedItem of guestCart.savedItems) {
    userCart.savedItems.push(savedItem.toObject());
  }

  // Mark guest cart as merged
  guestCart.status = "merged";
  guestCart.mergedAt = new Date();
  await guestCart.save();

  await userCart.save();

  return userCart;
};

/**
 * Find abandoned carts
 */
cartSchema.statics.findAbandoned = async function (hoursSinceActivity = 24) {
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - hoursSinceActivity);

  return this.find({
    status: "active",
    lastActivityAt: { $lt: cutoffDate },
    totalItems: { $gt: 0 },
  });
};

/**
 * Clean up expired guest carts
 */
cartSchema.statics.cleanupExpiredCarts = async function () {
  const result = await this.deleteMany({
    userType: "guest",
    expiresAt: { $lt: new Date() },
  });

  return result.deletedCount;
};

// ========================================
// ENABLE VIRTUALS IN JSON/OBJECT
// ========================================
cartSchema.set("toJSON", { virtuals: true });
cartSchema.set("toObject", { virtuals: true });

export default model("Cart", cartSchema);
