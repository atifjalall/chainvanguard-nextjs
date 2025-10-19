import express from "express";
import orderService from "../services/order.service.js";
import {
  verifyToken,
  checkRole,
  requireVerification,
  optionalAuth,
} from "../middleware/auth.middleware.js";

const router = express.Router();

// ========================================
// CUSTOMER ENDPOINTS
// ========================================

/**
 * POST /api/orders
 * Create new order (Customer only)
 * Body: { items, shippingAddress, billingAddress?, paymentMethod, customerNotes?, isGift?, giftMessage? }
 */
router.post(
  "/",
  verifyToken,
  requireVerification,
  checkRole("customer"),
  async (req, res) => {
    try {
      const {
        items,
        shippingAddress,
        billingAddress,
        paymentMethod,
        customerNotes,
        specialInstructions,
        isGift,
        giftMessage,
        discountCode,
        urgentOrder,
      } = req.body;

      // Validation
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Order must contain at least one item",
        });
      }

      if (!shippingAddress) {
        return res.status(400).json({
          success: false,
          message: "Shipping address is required",
        });
      }

      if (!paymentMethod) {
        return res.status(400).json({
          success: false,
          message: "Payment method is required",
        });
      }

      // Validate shipping address fields
      const requiredAddressFields = [
        "name",
        "phone",
        "addressLine1",
        "city",
        "state",
        "country",
        "postalCode",
      ];
      const missingFields = requiredAddressFields.filter(
        (field) => !shippingAddress[field]
      );

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Missing required shipping address fields",
          missingFields,
        });
      }

      // Validate items structure
      for (const item of items) {
        if (!item.productId || !item.quantity || item.quantity < 1) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid item structure. Each item must have productId and quantity >= 1",
          });
        }
      }

      // Create order
      const result = await orderService.createOrder(
        {
          items,
          shippingAddress,
          billingAddress: billingAddress || shippingAddress,
          paymentMethod,
          customerNotes,
          specialInstructions,
          isGift,
          giftMessage,
          discountCode,
          urgentOrder,
        },
        req.userId
      );

      res.status(201).json(result);
    } catch (error) {
      console.error("POST /api/orders error:", error);

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (
        error.message.includes("out of stock") ||
        error.message.includes("insufficient")
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/orders
 * Get customer's orders with filters
 * Query params: status, page, limit, sortBy, sortOrder
 */
router.get(
  "/",
  verifyToken,
  requireVerification,
  checkRole("customer"),
  async (req, res) => {
    try {
      const filters = {
        status: req.query.status,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        sortBy: req.query.sortBy || "createdAt",
        sortOrder: req.query.sortOrder || "desc",
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };

      const result = await orderService.getCustomerOrders(req.userId, filters);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("GET /api/orders error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ========================================
// SELLER/VENDOR ENDPOINTS
// ========================================

/**
 * GET /api/orders/seller
 * Get seller's orders (orders where they are the seller)
 * Query params: status, page, limit, sortBy, sortOrder
 */
router.get(
  "/seller",
  verifyToken,
  requireVerification,
  checkRole("vendor", "supplier"),
  async (req, res) => {
    try {
      const filters = {
        status: req.query.status,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        sortBy: req.query.sortBy || "createdAt",
        sortOrder: req.query.sortOrder || "desc",
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };

      const result = await orderService.getSellerOrders(req.userId, filters);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("GET /api/orders/seller error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/orders/seller/stats
 * Get seller's order statistics
 */
router.get(
  "/seller/stats",
  verifyToken,
  requireVerification,
  checkRole("vendor", "supplier"),
  async (req, res) => {
    try {
      const timeframe = req.query.timeframe || "month"; // week, month, year, all

      const stats = await orderService.getSellerStats(req.userId, timeframe);

      res.json({
        success: true,
        timeframe,
        stats,
      });
    } catch (error) {
      console.error("GET /api/orders/seller/stats error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ========================================
// ADMIN/EXPERT ENDPOINTS
// ========================================

/**
 * GET /api/orders/all
 * Get all orders (Expert only)
 * Query params: status, customerId, sellerId, page, limit, sortBy, sortOrder
 */
router.get(
  "/all",
  verifyToken,
  requireVerification,
  checkRole("expert"),
  async (req, res) => {
    try {
      const filters = {
        status: req.query.status,
        customerId: req.query.customerId,
        sellerId: req.query.sellerId,
        paymentStatus: req.query.paymentStatus,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50,
        sortBy: req.query.sortBy || "createdAt",
        sortOrder: req.query.sortOrder || "desc",
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };

      const result = await orderService.getAllOrders(filters);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("GET /api/orders/all error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/orders/stats
 * Get overall order statistics (Expert only)
 */
router.get(
  "/stats",
  verifyToken,
  requireVerification,
  checkRole("expert"),
  async (req, res) => {
    try {
      const timeframe = req.query.timeframe || "month";

      const stats = await orderService.getOverallStats(timeframe);

      res.json({
        success: true,
        timeframe,
        stats,
      });
    } catch (error) {
      console.error("GET /api/orders/stats error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/orders/platform/stats
 * Get platform-wide order statistics (Expert only)
 */
router.get(
  "/platform/stats",
  verifyToken,
  checkRole("expert"),
  async (req, res) => {
    try {
      const stats = await orderService.getPlatformStats();

      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      console.error("GET /api/orders/platform/stats error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ========================================
// PUBLIC/UTILITY ENDPOINTS
// ========================================

/**
 * GET /api/orders/tracking/:orderNumber
 * Public order tracking by order number (no auth required)
 * Customer can track with order number + email verification
 */
router.get("/tracking/:orderNumber", optionalAuth, async (req, res) => {
  try {
    const { email } = req.query;

    // If no auth token, require email verification
    if (!req.userId && !email) {
      return res.status(400).json({
        success: false,
        message: "Email is required for guest tracking",
      });
    }

    const tracking = await orderService.trackOrderByNumber(
      req.params.orderNumber,
      email,
      req.userId
    );

    res.json({
      success: true,
      ...tracking,
    });
  } catch (error) {
    console.error("GET /api/orders/tracking/:orderNumber error:", error);

    if (error.message === "Order not found") {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (error.message.includes("Email does not match")) {
      return res.status(403).json({
        success: false,
        message: "Invalid email for this order",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/orders/invoice/:id
 * Download order invoice (PDF)
 */
router.get(
  "/invoice/:id",
  verifyToken,
  requireVerification,
  async (req, res) => {
    try {
      const invoice = await orderService.generateInvoice(
        req.params.id,
        req.userId,
        req.userRole
      );

      res.json({
        success: true,
        invoice,
      });
    } catch (error) {
      console.error("GET /api/orders/invoice/:id error:", error);

      if (error.message === "Order not found") {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      if (error.message.includes("Unauthorized")) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ========================================
// CUSTOMER ENDPOINTS (/:id routes)
// ========================================

/**
 * GET /api/orders/:id
 * Get single order details
 */
router.get("/:id", verifyToken, requireVerification, async (req, res) => {
  try {
    const order = await orderService.getOrderById(
      req.params.id,
      req.userId,
      req.userRole
    );

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("GET /api/orders/:id error:", error);

    if (error.message === "Order not found") {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (
      error.message.includes("Unauthorized") ||
      error.message.includes("Access denied")
    ) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * POST /api/orders/:id/cancel
 * Cancel order (Customer only - within cancellation window)
 */
router.post(
  "/:id/cancel",
  verifyToken,
  requireVerification,
  checkRole("customer"),
  async (req, res) => {
    try {
      const { reason } = req.body;

      if (!reason || reason.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Cancellation reason is required",
        });
      }

      const result = await orderService.cancelOrder(
        req.params.id,
        req.userId,
        reason
      );

      res.json(result);
    } catch (error) {
      console.error("POST /api/orders/:id/cancel error:", error);

      if (error.message === "Order not found") {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      if (
        error.message.includes("cannot be cancelled") ||
        error.message.includes("Unauthorized")
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/orders/:id/track
 * Track order (Customer can track their own orders)
 */
router.get("/:id/track", verifyToken, requireVerification, async (req, res) => {
  try {
    const tracking = await orderService.trackOrder(
      req.params.id,
      req.userId,
      req.userRole
    );

    res.json({
      success: true,
      ...tracking,
    });
  } catch (error) {
    console.error("GET /api/orders/:id/track error:", error);

    if (error.message === "Order not found") {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (error.message.includes("Unauthorized")) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * POST /api/orders/:id/return
 * Request order return (Customer only)
 */
router.post(
  "/:id/return",
  verifyToken,
  requireVerification,
  checkRole("customer"),
  async (req, res) => {
    try {
      const { reason, items } = req.body;

      if (!reason || reason.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Return reason is required",
        });
      }

      const result = await orderService.requestReturn(
        req.params.id,
        req.userId,
        reason,
        items
      );

      res.json(result);
    } catch (error) {
      console.error("POST /api/orders/:id/return error:", error);

      if (error.message === "Order not found") {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      if (
        error.message.includes("not eligible") ||
        error.message.includes("Unauthorized")
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/orders/:id/review
 * Submit order review (Customer only - after delivery)
 */
router.post(
  "/:id/review",
  verifyToken,
  requireVerification,
  checkRole("customer"),
  async (req, res) => {
    try {
      const { rating, comment } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating must be between 1 and 5",
        });
      }

      const result = await orderService.submitReview(
        req.params.id,
        req.userId,
        rating,
        comment
      );

      res.json(result);
    } catch (error) {
      console.error("POST /api/orders/:id/review error:", error);

      if (error.message === "Order not found") {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      if (
        error.message.includes("already reviewed") ||
        error.message.includes("not delivered")
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ========================================
// SELLER/VENDOR ENDPOINTS (/:id routes)
// ========================================

/**
 * PATCH /api/orders/:id/status
 * Update order status (Seller/Vendor only)
 * Body: { status, notes? }
 */
router.patch(
  "/:id/status",
  verifyToken,
  requireVerification,
  checkRole("vendor", "supplier"),
  async (req, res) => {
    try {
      const { status, notes } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Status is required",
        });
      }

      const validStatuses = [
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
      }

      const result = await orderService.updateOrderStatus(
        req.params.id,
        status,
        req.userId,
        req.userRole,
        notes
      );

      res.json(result);
    } catch (error) {
      console.error("PATCH /api/orders/:id/status error:", error);

      if (error.message === "Order not found") {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      if (
        error.message.includes("Unauthorized") ||
        error.message.includes("not authorized")
      ) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes("Invalid status transition")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/**
 * PATCH /api/orders/:id/shipping
 * Update shipping information (Seller/Vendor only)
 * Body: { trackingNumber?, courierName?, estimatedDeliveryDate?, trackingUrl? }
 */
router.patch(
  "/:id/shipping",
  verifyToken,
  requireVerification,
  checkRole("vendor", "supplier"),
  async (req, res) => {
    try {
      const {
        trackingNumber,
        courierName,
        estimatedDeliveryDate,
        trackingUrl,
      } = req.body;

      if (!trackingNumber && !courierName && !estimatedDeliveryDate) {
        return res.status(400).json({
          success: false,
          message: "At least one shipping field is required",
        });
      }

      const result = await orderService.updateShippingInfo(
        req.params.id,
        {
          trackingNumber,
          courierName,
          estimatedDeliveryDate,
          trackingUrl,
        },
        req.userId,
        req.userRole
      );

      res.json(result);
    } catch (error) {
      console.error("PATCH /api/orders/:id/shipping error:", error);

      if (error.message === "Order not found") {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      if (error.message.includes("Unauthorized")) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/orders/:id/confirm
 * Confirm order (Seller/Vendor only)
 * Body: { estimatedDeliveryDate?, notes? }
 */
router.post(
  "/:id/confirm",
  verifyToken,
  requireVerification,
  checkRole("vendor", "supplier"),
  async (req, res) => {
    try {
      const { estimatedDeliveryDate, notes } = req.body;

      const result = await orderService.confirmOrder(
        req.params.id,
        req.userId,
        req.userRole,
        estimatedDeliveryDate,
        notes
      );

      res.json(result);
    } catch (error) {
      console.error("POST /api/orders/:id/confirm error:", error);

      if (error.message === "Order not found") {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      if (
        error.message.includes("Unauthorized") ||
        error.message.includes("already confirmed")
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/orders/:id/ship
 * Mark order as shipped (Seller/Vendor only)
 * Body: { trackingNumber, courierName, estimatedDeliveryDate?, notes? }
 */
router.post(
  "/:id/ship",
  verifyToken,
  requireVerification,
  checkRole("vendor", "supplier"),
  async (req, res) => {
    try {
      const { trackingNumber, courierName, estimatedDeliveryDate, notes } =
        req.body;

      if (!trackingNumber || !courierName) {
        return res.status(400).json({
          success: false,
          message: "Tracking number and courier name are required",
        });
      }

      const result = await orderService.markAsShipped(
        req.params.id,
        {
          trackingNumber,
          courierName,
          estimatedDeliveryDate,
        },
        req.userId,
        req.userRole,
        notes
      );

      res.json(result);
    } catch (error) {
      console.error("POST /api/orders/:id/ship error:", error);

      if (error.message === "Order not found") {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      if (
        error.message.includes("Unauthorized") ||
        error.message.includes("cannot be shipped")
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ========================================
// ADMIN/EXPERT ENDPOINTS (/:id routes)
// ========================================

/**
 * POST /api/orders/:id/refund
 * Process refund (Expert only)
 * Body: { refundAmount, refundReason, refundMethod }
 */
router.post(
  "/:id/refund",
  verifyToken,
  requireVerification,
  checkRole("expert"),
  async (req, res) => {
    try {
      const { refundAmount, refundReason, refundMethod } = req.body;

      if (!refundAmount || refundAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid refund amount is required",
        });
      }

      if (!refundReason || refundReason.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Refund reason is required",
        });
      }

      const result = await orderService.processRefund(
        req.params.id,
        refundAmount,
        refundReason,
        refundMethod || "wallet",
        req.userId
      );

      res.json(result);
    } catch (error) {
      console.error("POST /api/orders/:id/refund error:", error);

      if (error.message === "Order not found") {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      if (error.message.includes("exceeds order total")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/**
 * PATCH /api/orders/:id/return/approve
 * Approve return request (Expert/Seller)
 * Body: { approved, notes? }
 */
router.patch(
  "/:id/return/approve",
  verifyToken,
  requireVerification,
  checkRole("expert", "vendor", "supplier"),
  async (req, res) => {
    try {
      const { approved, notes } = req.body;

      if (typeof approved !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "Approval decision (approved: true/false) is required",
        });
      }

      const result = await orderService.approveReturn(
        req.params.id,
        approved,
        req.userId,
        req.userRole,
        notes
      );

      res.json(result);
    } catch (error) {
      console.error("PATCH /api/orders/:id/return/approve error:", error);

      if (error.message === "Order not found") {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      if (
        error.message.includes("Unauthorized") ||
        error.message.includes("No return request")
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ========================================
// BLOCKCHAIN ENDPOINTS (/:id routes)
// ========================================

/**
 * GET /api/orders/:id/blockchain
 * Get order blockchain history
 */
router.get(
  "/:id/blockchain",
  verifyToken,
  requireVerification,
  async (req, res) => {
    try {
      const history = await orderService.getOrderBlockchainHistory(
        req.params.id,
        req.userId,
        req.userRole
      );

      res.json({
        success: true,
        orderId: req.params.id,
        ...history,
      });
    } catch (error) {
      console.error("GET /api/orders/:id/blockchain error:", error);

      if (error.message === "Order not found") {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      if (error.message.includes("Unauthorized")) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/orders/:id/transfer
 * Transfer product ownership on blockchain (Triggered automatically on order creation)
 * This is mainly for manual retries or expert override
 */
router.post(
  "/:id/transfer",
  verifyToken,
  requireVerification,
  checkRole("expert"),
  async (req, res) => {
    try {
      const result = await orderService.transferProductOwnership(
        req.params.id,
        req.userId
      );

      res.json(result);
    } catch (error) {
      console.error("POST /api/orders/:id/transfer error:", error);

      if (error.message === "Order not found") {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

export default router;
