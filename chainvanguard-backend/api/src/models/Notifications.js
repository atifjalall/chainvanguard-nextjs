import { Schema, model } from "mongoose";

// ========================================
// NOTIFICATION SCHEMA
// ========================================
const notificationSchema = new Schema(
  {
    // ========================================
    // RECIPIENT INFORMATION
    // ========================================
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userRole: {
      type: String,
      enum: ["supplier", "vendor", "customer", "expert"],
      required: true,
      index: true,
    },

    // ========================================
    // NOTIFICATION TYPE & CATEGORY
    // ========================================
    type: {
      type: String,
      enum: [
        // Order Notifications
        "order_placed",
        "order_confirmed",
        "order_processing",
        "order_shipped",
        "order_delivered",
        "order_cancelled",
        "order_refunded",
        "order_returned",

        // Payment Notifications
        "payment_received",
        "payment_pending",
        "payment_failed",
        "payment_refunded",
        "wallet_credited",
        "wallet_debited",
        "low_balance",

        // Inventory Notifications
        "low_stock",
        "out_of_stock",
        "reorder_alert",
        "stock_updated",
        "batch_expiring",
        "batch_expired",
        "inventory_adjustment",

        // Product Notifications
        "product_approved",
        "product_rejected",
        "product_out_of_stock",
        "product_back_in_stock",
        "product_price_changed",
        "product_review_received",

        // Blockchain Notifications
        "blockchain_transaction_confirmed",
        "blockchain_transaction_failed",
        "blockchain_verification_complete",
        "ownership_transferred",

        // Cart Notifications
        "cart_abandoned",
        "cart_item_price_changed",
        "cart_item_back_in_stock",

        // System Notifications
        "account_verified",
        "kyc_approved",
        "kyc_rejected",
        "security_alert",
        "maintenance_scheduled",
        "system_update",

        // Supply Chain Events
        "shipment_delayed",
        "quality_issue_detected",
        "supplier_rating_changed",
        "delivery_attempted",

        // Custom/General
        "general",
        "promotional",
        "reminder",

        // Vendor Specific
        "vendor_request_created",
        "vendor_request_approved",
        "vendor_request_rejected",
        "vendor_request_cancelled",
        "vendor_request_updated",
        "vendor_request_fulfilled",
        "vendor_request_completed",
      ],
      required: true,
      index: true,
    },

    category: {
      type: String,
      enum: [
        "order",
        "payment",
        "inventory",
        "product",
        "blockchain",
        "cart",
        "account",
        "system",
        "supply_chain",
        "security",
        "vendor_requests",
      ],
      required: true,
      index: true,
    },

    // ========================================
    // NOTIFICATION CONTENT
    // ========================================
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    shortMessage: {
      type: String,
      default: "",
    },

    // ========================================
    // PRIORITY & URGENCY
    // ========================================
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },
    isUrgent: {
      type: Boolean,
      default: false,
      index: true,
    },

    // ========================================
    // RELATED ENTITIES
    // ========================================
    relatedEntity: {
      entityType: {
        type: String,
        enum: [
          "order",
          "product",
          "inventory",
          "payment",
          "user",
          "wallet",
          "cart",
          "batch",
          "vendor_request",
          "",
        ],
        default: "",
      },
      entityId: {
        type: Schema.Types.ObjectId,
        index: true,
      },
      entityData: {
        type: Schema.Types.Mixed,
        default: {},
      },
    },

    // Specific reference fields for common entities
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      index: true,
    },
    inventoryId: {
      type: Schema.Types.ObjectId,
      ref: "Inventory",
      index: true,
    },
    transactionId: {
      type: String,
      default: "",
    },

    // ========================================
    // ACTION LINKS & CTAs
    // ========================================
    actionUrl: {
      type: String,
      default: "",
    },
    actionText: {
      type: String,
      default: "",
    },
    actionType: {
      type: String,
      enum: [
        "view_order",
        "track_shipment",
        "view_product",
        "check_inventory",
        "view_transaction",
        "update_profile",
        "verify_email",
        "contact_support",
        "reorder",
        "review_product",
        "none",
      ],
      default: "none",
    },

    // ========================================
    // DELIVERY CHANNELS
    // ========================================
    channels: {
      inApp: {
        enabled: { type: Boolean, default: true },
        sent: { type: Boolean, default: false },
        sentAt: { type: Date },
      },
      email: {
        enabled: { type: Boolean, default: false },
        sent: { type: Boolean, default: false },
        sentAt: { type: Date },
        emailId: { type: String, default: "" },
      },
      sms: {
        enabled: { type: Boolean, default: false },
        sent: { type: Boolean, default: false },
        sentAt: { type: Date },
        smsId: { type: String, default: "" },
      },
      push: {
        enabled: { type: Boolean, default: false },
        sent: { type: Boolean, default: false },
        sentAt: { type: Date },
        pushId: { type: String, default: "" },
      },
    },

    // ========================================
    // READ STATUS & INTERACTION
    // ========================================
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      index: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    archivedAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },

    // ========================================
    // INTERACTION TRACKING
    // ========================================
    clickedAt: {
      type: Date,
    },
    actionTakenAt: {
      type: Date,
    },
    actionTaken: {
      type: String,
      default: "",
    },

    // ========================================
    // SENDER INFORMATION
    // ========================================
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    senderName: {
      type: String,
      default: "System",
    },
    senderRole: {
      type: String,
      enum: ["system", "admin", "supplier", "vendor", "customer", "expert"],
      default: "system",
    },

    // ========================================
    // BLOCKCHAIN INTEGRATION
    // ========================================
    blockchainTxId: {
      type: String,
      default: "",
      index: true,
    },
    blockchainVerified: {
      type: Boolean,
      default: false,
    },

    // ========================================
    // SCHEDULING & EXPIRY
    // ========================================
    scheduledFor: {
      type: Date,
      index: true,
    },
    isSent: {
      type: Boolean,
      default: false,
      index: true,
    },
    sentAt: {
      type: Date,
      index: true,
    },
    expiresAt: {
      type: Date,
      index: true,
    },

    // ========================================
    // METADATA & EXTRAS
    // ========================================
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    images: [
      {
        url: String,
        alt: String,
      },
    ],

    // ========================================
    // DELIVERY STATUS
    // ========================================
    deliveryStatus: {
      type: String,
      enum: ["pending", "sent", "delivered", "failed", "bounced"],
      default: "pending",
      index: true,
    },
    deliveryError: {
      type: String,
      default: "",
    },
    retryCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
      min: 0,
    },

    // ========================================
    // GROUPING & BATCHING
    // ========================================
    groupId: {
      type: String,
      index: true,
    },
    batchId: {
      type: String,
      index: true,
    },

    // ========================================
    // PREFERENCES & SETTINGS
    // ========================================
    canDismiss: {
      type: Boolean,
      default: true,
    },
    autoArchiveAfterDays: {
      type: Number,
      default: 30,
    },
    requiresAcknowledgment: {
      type: Boolean,
      default: false,
    },
    acknowledgedAt: {
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
// INDEXES FOR PERFORMANCE
// ========================================
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, category: 1, isRead: 1 });
notificationSchema.index({ userId: 1, isDeleted: 1, createdAt: -1 });
notificationSchema.index({ type: 1, userId: 1 });
notificationSchema.index({ priority: 1, isRead: 1 });
notificationSchema.index({ scheduledFor: 1, isSent: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
notificationSchema.index({ groupId: 1, userId: 1 });
notificationSchema.index({ "relatedEntity.entityId": 1 });

// ========================================
// VIRTUALS
// ========================================

// Check if notification is expired
notificationSchema.virtual("isExpired").get(function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Check if notification is pending
notificationSchema.virtual("isPending").get(function () {
  return !this.isSent && !this.isDeleted;
});

// Check if notification requires action
notificationSchema.virtual("requiresAction").get(function () {
  return this.actionType !== "none" && !this.actionTaken;
});

// Get age in hours
notificationSchema.virtual("ageInHours").get(function () {
  const now = new Date();
  const created = this.createdAt;
  return Math.floor((now - created) / (1000 * 60 * 60));
});

// Get age in days
notificationSchema.virtual("ageInDays").get(function () {
  const now = new Date();
  const created = this.createdAt;
  return Math.floor((now - created) / (1000 * 60 * 60 * 24));
});

// Check if any channel was successfully sent
notificationSchema.virtual("isDelivered").get(function () {
  return (
    this.channels.inApp.sent ||
    this.channels.email.sent ||
    this.channels.sms.sent ||
    this.channels.push.sent
  );
});

// ========================================
// PRE-SAVE HOOKS
// ========================================

notificationSchema.pre("save", function (next) {
  // Auto-set sentAt if isSent is true and sentAt is not set
  if (this.isSent && !this.sentAt) {
    this.sentAt = new Date();
  }

  // Set deliveryStatus based on channel status
  if (
    this.channels.inApp.sent ||
    this.channels.email.sent ||
    this.channels.sms.sent ||
    this.channels.push.sent
  ) {
    if (this.deliveryStatus === "pending") {
      this.deliveryStatus = "sent";
    }
  }

  // Auto-expire old notifications if autoArchiveAfterDays is set
  if (!this.expiresAt && this.autoArchiveAfterDays > 0) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + this.autoArchiveAfterDays);
    this.expiresAt = expiryDate;
  }

  // Set short message if not provided
  if (!this.shortMessage && this.message) {
    this.shortMessage =
      this.message.length > 100
        ? this.message.substring(0, 97) + "..."
        : this.message;
  }

  next();
});

export default model("Notification", notificationSchema);
