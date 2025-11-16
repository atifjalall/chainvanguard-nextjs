export const NOTIFICATION_TYPES = {
  // Vendor Requests
  VENDOR_REQUEST: {
    CREATED: "vendor_request_created",
    APPROVED: "vendor_request_approved",
    REJECTED: "vendor_request_rejected",
    CANCELLED: "vendor_request_cancelled",
    UPDATED: "vendor_request_updated",
    FULFILLED: "vendor_request_fulfilled",
    PAYMENT_RECEIVED: "vendor_request_payment_received",
    PAYMENT_CONFIRMED: "vendor_request_payment_confirmed",
  },

  // Loyalty
  LOYALTY: {
    POINTS_EARNED: "loyalty_points_earned",
    POINTS_REDEEMED: "loyalty_points_redeemed",
    DISCOUNT_ELIGIBLE: "loyalty_discount_eligible",
    VENDOR_POINTS_EARNED: "vendor_points_earned",
  },

  // Wallet
  WALLET: {
    CREATED: "wallet_created",
    RECOVERED: "wallet_recovered",
    TRANSACTION: "wallet_transaction",
  },

  // QR Codes
  QR: {
    GENERATED: "qr_generated",
    VERIFIED: "qr_verified",
    SCAN_ATTEMPTED: "qr_scan_attempted",
  },

  // Expert System
  EXPERT: {
    APPLICATION_SUBMITTED: "expert_application_submitted",
    APPROVED: "expert_approved",
    REJECTED: "expert_rejected",
    NEW_APPLICATION: "new_expert_application",
  },

  // Orders
  ORDER: {
    CREATED: "order_created",
    UPDATED: "order_updated",
    DELIVERED: "order_delivered",
    CANCELLED: "order_cancelled",
  },

  // Products
  PRODUCT: {
    CREATED: "product_created",
    UPDATED: "product_updated",
    LOW_STOCK: "product_low_stock",
    OUT_OF_STOCK: "product_out_of_stock",
  },

  // Returns
  RETURN: {
    INITIATED: "return_initiated",
    APPROVED: "return_approved",
    REJECTED: "return_rejected",
    COMPLETED: "return_completed",
  },

  // Reviews
  REVIEW: {
    CREATED: "review_created",
    RESPONDED: "review_responded",
  },

  // Cart
  CART: {
    ABANDONED: "cart_abandoned",
    ITEM_ADDED: "cart_item_added",
  },

  // Wishlist
  WISHLIST: {
    ITEM_AVAILABLE: "wishlist_item_available",
    PRICE_DROP: "wishlist_price_drop",
  },
};

export const NOTIFICATION_CATEGORIES = {
  VENDOR_REQUESTS: "vendor_requests",
  LOYALTY: "loyalty",
  WALLET: "wallet",
  QR: "qr",
  EXPERT: "expert",
  ORDERS: "orders",
  PRODUCTS: "products",
  RETURNS: "returns",
  REVIEWS: "reviews",
  CART: "cart",
  WISHLIST: "wishlist",
};
