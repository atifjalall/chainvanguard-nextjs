import { Schema, model } from "mongoose";

const orderItemSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  productName: { type: String, required: true },
  productImage: { type: String, default: "" },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
  sellerId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

const orderSchema = new Schema(
  {
    // Order Info
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Customer Info
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerWallet: { type: String, required: true },

    // Items
    items: [orderItemSchema],

    // Pricing
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    shippingCost: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },

    // Shipping Address
    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
      postalCode: { type: String, required: true },
      phone: { type: String, required: true },
    },

    // Payment
    paymentMethod: {
      type: String,
      enum: ["wallet", "escrow"],
      default: "wallet",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    transactionHash: { type: String, default: "" },

    // Order Status
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },

    // Tracking
    trackingNumber: { type: String, default: "" },
    carrier: { type: String, default: "" },
    estimatedDelivery: { type: Date, default: null },

    // Blockchain
    blockchainOrderId: { type: String, unique: true, sparse: true },
    blockchainTxId: { type: String, default: "" },

    // Timestamps
    confirmedAt: { type: Date, default: null },
    shippedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },

    // Notes
    customerNotes: { type: String, default: "" },
    adminNotes: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

// Indexes
orderSchema.index({ customerId: 1, status: 1 });
orderSchema.index({ "items.sellerId": 1 });
orderSchema.index({ createdAt: -1 });

// Generate order number before saving
orderSchema.pre("save", async function (next) {
  if (!this.orderNumber) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }
  next();
});

// Calculate total sellers
orderSchema.virtual("totalSellers").get(function () {
  const sellers = new Set(this.items.map((item) => item.sellerId.toString()));
  return sellers.size;
});

orderSchema.set("toJSON", { virtuals: true });
orderSchema.set("toObject", { virtuals: true });

export default model("Order", orderSchema);
