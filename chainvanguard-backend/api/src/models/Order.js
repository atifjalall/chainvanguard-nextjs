import { Schema, model } from "mongoose";

// ========================================
// ORDER ITEM SUB-SCHEMA
// ========================================
const orderItemSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  productName: { type: String, required: true },
  sku: { type: String, default: "" },

  inventoryId: {
    type: Schema.Types.ObjectId,
    ref: "Inventory",
    index: true,
  },

  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true, min: 0 },

  // Product snapshot at time of order (important for historical records)
  productSnapshot: {
    category: { type: String, default: "" },
    subcategory: { type: String, default: "" },
    brand: { type: String, default: "" },

    apparelDetails: {
      size: { type: String, default: "" },
      color: { type: String, default: "" },
      material: { type: String, default: "" },
      fit: { type: String, default: "" },
    },

    images: [
      {
        url: { type: String, default: "" },
        isMain: { type: Boolean, default: false },
      },
    ],

    blockchainProductId: { type: String, default: "" },
  },

  trackingQRCode: {
    type: String,
    index: true,
  },

  // Seller info for this item
  sellerId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sellerName: { type: String, default: "" },
  sellerWalletAddress: { type: String, default: "" },
});

// ========================================
// STATUS HISTORY SUB-SCHEMA
// ========================================
const statusHistorySchema = new Schema({
  status: {
    type: String,
    enum: [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ],
    required: true,
  },
  changedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  changedByRole: {
    type: String,
    enum: ["customer", "vendor", "supplier", "expert"],
  },
  timestamp: { type: Date, default: Date.now },
  notes: { type: String, default: "" },
});

// ========================================
// SUPPLY CHAIN EVENT SUB-SCHEMA
// ========================================
const supplyChainEventSchema = new Schema({
  stage: {
    type: String,
    enum: [
      "order_placed",
      "confirmed",
      "payment_confirmed",
      "preparing",
      "processing",
      "packed",
      "shipped",
      "in_transit",
      "out_for_delivery",
      "delivered",
      "cancelled",
      "refunded",
      "returned",
    ],
    required: true,
  },
  location: { type: String, default: "" },
  description: { type: String, default: "" },
  timestamp: { type: Date, default: Date.now },
  performedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number },
  },
});

// ========================================
// NOTIFICATION SUB-SCHEMA
// ========================================
const notificationSchema = new Schema({
  type: {
    type: String,
    enum: [
      "order_confirmed",
      "order_processing",
      "order_shipped",
      "order_delivered",
      "payment_success",
      "preparing",
      "shipped",
      "in_transit",
      "delivered",
      "cancelled",
      "refund_processed",
    ],
  },
  sentAt: { type: Date, default: Date.now },
  channel: {
    type: String,
    enum: ["email", "sms", "push"],
  },
  status: {
    type: String,
    enum: ["sent", "delivered", "failed"],
    default: "sent",
  },
});

// ========================================
// MAIN ORDER SCHEMA
// ========================================
const orderSchema = new Schema(
  {
    // ========================================
    // ORDER IDENTITY
    // ========================================
    orderNumber: {
      type: String,
      unique: true,
      index: true,
    },

    // ========================================
    // CUSTOMER INFORMATION
    // ========================================
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, default: "" },
    customerWalletAddress: { type: String, required: true },

    // ========================================
    // SELLER INFORMATION (Primary/First Seller)
    // ========================================
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sellerName: { type: String, required: true },
    sellerWalletAddress: { type: String, required: true },
    sellerRole: {
      type: String,
      enum: ["vendor", "supplier"],
      required: true,
    },

    // ========================================
    // ORDER ITEMS
    // ========================================
    items: [orderItemSchema],

    // ========================================
    // PRICING BREAKDOWN
    // ========================================
    subtotal: { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    discountCode: { type: String, default: "" },
    total: { type: Number, required: true, min: 0 }, // Final amount
    originalAmount: { type: Number, default: 0 }, // Amount before discount
    discountAmount: { type: Number, default: 0 }, // Discount applied
    discountPercentage: { type: Number, default: 0 }, // Discount percentage
    currency: { type: String, default: "CVT" },

    // ========================================
    // PAYMENT INFORMATION
    // ========================================
    paymentMethod: {
      type: String,
      enum: [
        "wallet",
        "card",
        "cod",
        "bank_transfer",
        "credit_card",
        "debit_card",
        "crypto",
      ],
      default: "wallet",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "partially_refunded"],
      default: "pending",
      index: true,
    },
    paymentIntentId: { type: String, default: "" }, // From payment gateway
    transactionHash: { type: String, default: "" }, // Blockchain transaction
    paidAt: { type: Date, default: null },

    // ========================================
    // SHIPPING ADDRESS (COMPLETE)
    // ========================================
    shippingAddress: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine1: { type: String, required: true },
      addressLine2: { type: String, default: "" },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
      postalCode: { type: String, required: true },
      latitude: { type: Number },
      longitude: { type: Number },
      addressType: {
        type: String,
        enum: ["home", "office", "other"],
        default: "home",
      },
    },

    // ========================================
    // BILLING ADDRESS (if different)
    // ========================================
    billingAddress: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
      addressLine1: { type: String, default: "" },
      addressLine2: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      country: { type: String, default: "" },
      postalCode: { type: String, default: "" },
    },

    // ========================================
    // SHIPPING DETAILS
    // ========================================
    shippingMethod: {
      type: String,
      enum: ["standard", "express", "overnight", "pickup"],
      default: "standard",
    },
    estimatedDeliveryDate: { type: Date, default: null },
    actualDeliveryDate: { type: Date, default: null },
    trackingNumber: { type: String, default: "" },
    trackingUrl: { type: String, default: "" },
    courierName: {
      type: String,
      enum: [
        "FedEx",
        "UPS",
        "USPS",
        "DHL",
        "Local",
        "Other",
        "TCS",
        "Leopard",
        "",
      ],
      default: "",
    },

    // ========================================
    // ORDER STATUS & WORKFLOW
    // ========================================
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      default: "pending",
      index: true,
    },
    statusHistory: [statusHistorySchema],

    // ========================================
    // IMPORTANT TIMESTAMPS
    // ========================================
    confirmedAt: { type: Date, default: null },
    processingAt: { type: Date, default: null },
    shippedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },

    // ========================================
    // CANCELLATION/REFUND
    // ========================================
    cancellationReason: { type: String, default: "" },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    refundAmount: { type: Number, default: 0 },
    refundReason: { type: String, default: "" },
    refundMethod: {
      type: String,
      enum: ["wallet", "original", ""],
      default: "",
    },

    // Cancellation request (for processing orders)
    cancellationRequest: {
      requested: { type: Boolean, default: false },
      requestedAt: { type: Date },
      requestedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      reason: { type: String, default: "" },
      reasonDetails: { type: String, default: "" },
      status: {
        type: String,
        enum: ["", "pending", "approved", "rejected"],
        default: "",
      },
      reviewedAt: { type: Date },
      reviewedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      reviewNotes: { type: String, default: "" },
    },

    // ========================================
    // BLOCKCHAIN INTEGRATION
    // ========================================
    blockchainOrderId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    blockchainTxId: { type: String, default: "" },
    blockchainVerified: { type: Boolean, default: false },

    // Track each product ownership transfer
    ownershipTransferTxIds: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
        },
        txId: { type: String, default: "" },
        timestamp: { type: Date, default: Date.now },
      },
    ],

    // ========================================
    // ORDER TRACKING & SUPPLY CHAIN
    // ========================================
    supplyChainEvents: [supplyChainEventSchema],

    // ========================================
    // CUSTOMER COMMUNICATION
    // ========================================
    customerNotes: { type: String, default: "" }, // Notes from customer
    sellerNotes: { type: String, default: "" }, // Internal notes from seller
    adminNotes: { type: String, default: "" }, // Admin/Expert notes

    // ========================================
    // NOTIFICATIONS
    // ========================================
    notifications: [notificationSchema],

    // ========================================
    // RETURN/EXCHANGE
    // ========================================
    isReturnable: { type: Boolean, default: true },
    returnDeadline: { type: Date, default: null },
    returnRequested: { type: Boolean, default: false },
    returnReason: { type: String, default: "" },
    returnStatus: {
      type: String,
      enum: ["", "requested", "approved", "rejected", "completed"],
      default: "",
    },

    // ========================================
    // REVIEWS
    // ========================================
    isReviewed: { type: Boolean, default: false },
    reviewSubmittedAt: { type: Date, default: null },

    // ========================================
    // ANALYTICS
    // ========================================
    deviceType: {
      type: String,
      enum: ["mobile", "desktop", "tablet", ""],
      default: "",
    },
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    referralSource: { type: String, default: "" },

    // ========================================
    // ADDITIONAL METADATA
    // ========================================
    giftMessage: { type: String, default: "" },
    isGift: { type: Boolean, default: false },
    specialInstructions: { type: String, default: "" },
    urgentOrder: { type: Boolean, default: false },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// ========================================
// INDEXES FOR PERFORMANCE
// ========================================
orderSchema.index({ customerId: 1, status: 1 });
orderSchema.index({ sellerId: 1, status: 1 });
orderSchema.index({ "items.sellerId": 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ trackingNumber: 1 });

// ========================================
// VIRTUALS
// ========================================

// Total number of items
orderSchema.virtual("totalItems").get(function () {
  if (!this.items || !Array.isArray(this.items)) return 0;
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Calculate total sellers
orderSchema.virtual("totalSellers").get(function () {
  if (!this.items || !Array.isArray(this.items)) return 0;
  const sellers = new Set(this.items.map((item) => item.sellerId.toString()));
  return sellers.size;
});

// Check if order is cancellable
orderSchema.virtual("canCancel").get(function () {
  return ["pending", "confirmed"].includes(this.status);
});

// Check if order is returnable
orderSchema.virtual("canReturn").get(function () {
  if (!this.isReturnable || this.status !== "delivered") return false;
  if (!this.returnDeadline) return false;
  return new Date() <= this.returnDeadline;
});

// Days since order placed
orderSchema.virtual("daysSinceOrder").get(function () {
  const now = new Date();
  const created = this.createdAt;
  const diffTime = Math.abs(now - created);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// ========================================
// PRE-SAVE HOOKS
// ========================================

// Generate order number before saving
orderSchema.pre("save", async function (next) {
  if (!this.orderNumber) {
    let unique = false;
    while (!unique) {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 6).toUpperCase();
      const potential = `ORD-${timestamp}-${random}`;
      const exists = await this.constructor.findOne({ orderNumber: potential });
      if (!exists) {
        this.orderNumber = potential;
        unique = true;
      }
    }
  }

  if (this.deliveredAt && !this.returnDeadline && this.isReturnable) {
    const deadline = new Date(this.deliveredAt);
    deadline.setDate(deadline.getDate() + 30);
    this.returnDeadline = deadline;
  }

  next();
});

// ========================================
// METHODS
// ========================================

// Add status history entry
orderSchema.methods.addStatusHistory = function (
  status,
  userId,
  userRole,
  notes = ""
) {
  this.statusHistory.push({
    status,
    changedBy: userId,
    changedByRole: userRole,
    notes,
    timestamp: new Date(),
  });
};

// Add supply chain event
orderSchema.methods.addSupplyChainEvent = function (eventData) {
  this.supplyChainEvents.push({
    ...eventData,
    timestamp: new Date(),
  });
};

// Add notification
orderSchema.methods.addNotification = function (type, channel) {
  this.notifications.push({
    type,
    channel,
    sentAt: new Date(),
    status: "sent",
  });
};

// ========================================
// STATICS
// ========================================

// Get orders by status
orderSchema.statics.getByStatus = function (status, limit = 20) {
  return this.find({ status })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("customerId", "name email walletAddress")
    .populate("sellerId", "name email walletAddress");
};

// Get customer orders
orderSchema.statics.getCustomerOrders = function (customerId, filters = {}) {
  const query = { customerId };

  if (filters.status) {
    query.status = filters.status;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .populate("items.productId", "name images price")
    .populate("sellerId", "name companyName");
};

// Get seller orders
orderSchema.statics.getSellerOrders = function (sellerId, filters = {}) {
  const query = {
    $or: [{ sellerId }, { "items.sellerId": sellerId }],
  };

  if (filters.status) {
    query.status = filters.status;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .populate("customerId", "name email phone")
    .populate("items.productId", "name images");
};

// ========================================
// ENABLE VIRTUALS IN JSON/OBJECT
// ========================================
orderSchema.set("toJSON", { virtuals: true });
orderSchema.set("toObject", { virtuals: true });

export default model("Order", orderSchema);
