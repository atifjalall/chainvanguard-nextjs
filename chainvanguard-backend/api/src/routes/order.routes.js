import express from "express";
import orderService from "../services/order.service.js";
import {
  verifyToken,
  checkRole,
  requireVerification,
  optionalAuth,
  authenticate,
  authorizeRoles,
} from "../middleware/auth.middleware.js";
import Order from "../models/Order.js";
import walletBalanceService from "../services/wallet.balance.service.js";

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
router.get("/", verifyToken, requireVerification, async (req, res) => {
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

    // 🆕 ROLE-BASED QUERY LOGIC
    let query = {};
    if (req.userRole === "customer") {
      query.customerId = req.userId;
    } else if (req.userRole === "vendor" || req.userRole === "supplier") {
      query.sellerId = req.userId;
    } else if (req.userRole === "expert") {
      // Experts can see all, but add filters if needed
      query = {};
    } else {
      return res.status(403).json({
        success: false,
        message: "Unauthorized role",
      });
    }

    // Apply additional filters
    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.createdAt.$lte = new Date(filters.endDate);
      }
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const sortBy = filters.sortBy || "createdAt";
    const sortOrder = filters.sortOrder === "asc" ? 1 : -1;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .populate("items.productId", "name images price status")
        .populate("sellerId", "name companyName email"),
      Order.countDocuments(query),
    ]);

    // 🆕 STANDARDIZED RESPONSE
    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/orders error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

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
// ENHANCED ORDER TRACKING ENDPOINTS (static routes moved up)
// ========================================

/**
 * GET /api/orders/history
 * Get comprehensive order history with advanced filters
 */
router.get("/history", verifyToken, requireVerification, async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      paymentStatus: req.query.paymentStatus,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      minAmount: req.query.minAmount ? parseFloat(req.query.minAmount) : null,
      maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount) : null,
      search: req.query.search,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sortBy: req.query.sortBy || "createdAt",
      sortOrder: req.query.sortOrder || "desc",
    };

    const result = await orderService.getOrderHistory(req.userId, filters);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("GET /api/orders/history error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/orders/stats/customer
 * Get customer's order statistics
 */
router.get(
  "/stats/customer",
  verifyToken,
  requireVerification,
  async (req, res) => {
    try {
      const stats = await orderService.getCustomerOrderStats(req.userId);

      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      console.error("GET /api/orders/stats/customer error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ========================================
// CUSTOMER ENDPOINTS (/:id routes) - MOVED TO END
// ========================================

/**
 * GET /api/orders/:id
 * Get single order details
 */
router.get("/:id", verifyToken, requireVerification, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customerId", "name email walletAddress")
      .populate("sellerId", "name walletAddress");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check authorization based on role
    const isCustomer = order.customerId._id.toString() === req.userId;
    const isSeller =
      order.sellerId._id.toString() === req.userId ||
      order.items.some((item) => item.sellerId.toString() === req.userId);
    const isExpert = req.userRole === "expert";

    if (!isCustomer && !isSeller && !isExpert) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You don't have access to this order",
      });
    }

    // 🆕 STANDARDIZED RESPONSE
    res.json({
      success: true,
      data: {
        order: {
          ...order.toObject(),
          id: order._id.toString(),
          _id: order._id.toString(),
        },
      },
    });
  } catch (error) {
    console.error("[ORDER ROUTE] Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching order",
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
// SELLER/VENDOR ENDPOINTS (/:id routes) - MOVED TO END
// ========================================

/**
 * PATCH /api/orders/:id/status
 * Update order status (Seller/Vendor/Expert only)
 */
router.patch("/:id/status", authenticate, async (req, res) => {
  try {
    const {
      status,
      notes,
      trackingNumber,
      carrier,
      estimatedDelivery,
      deliveryDate,
    } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    // If shipping, add tracking info
    if (status === "shipped" && trackingNumber) {
      const order = await Order.findById(req.params.id);
      if (order) {
        order.trackingNumber = trackingNumber;
        order.courierName = carrier || "Standard";
        if (estimatedDelivery) {
          order.estimatedDeliveryDate = new Date(estimatedDelivery);
        }
        order.trackingUrl = orderService.generateTrackingUrl(
          order.courierName,
          trackingNumber
        );
        await order.save();
      }
    }

    const result = await orderService.updateOrderStatus(
      req.params.id,
      status,
      req.userId,
      req.userRole,
      notes,
      { trackingNumber, carrier, estimatedDelivery }
    );

    res.json(result);
  } catch (error) {
    console.error("PATCH /api/orders/:id/status error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update order status",
    });
  }
});

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

/**
 * POST /api/orders/:id/refund
 * Process manual refund (Supplier/Ministry or Vendor only - they are the sellers)
 */
router.post(
  "/:id/refund",
  verifyToken,
  requireVerification,
  checkRole("supplier", "vendor"),
  async (req, res) => {
    try {
      const { amount, reason } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid refund amount is required",
        });
      }

      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // ✅ Verify this seller owns the order
      const isSeller =
        order.sellerId.toString() === req.userId ||
        order.items.some((item) => item.sellerId.toString() === req.userId);

      if (!isSeller) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized: You can only refund orders you sold",
        });
      }

      // Check if already refunded
      if (order.paymentStatus === "refunded") {
        return res.status(400).json({
          success: false,
          message: "Order has already been refunded",
        });
      }

      // Check if amount is valid
      if (amount > order.total) {
        return res.status(400).json({
          success: false,
          message: `Refund amount cannot exceed order total ($${order.total})`,
        });
      }

      // Process refund
      const refundResult = await walletBalanceService.processRefund(
        order.customerId,
        order._id,
        parseFloat(amount),
        reason || `Refund by ${req.userRole} for order ${order.orderNumber}`
      );

      // Update order
      order.paymentStatus =
        amount >= order.total ? "refunded" : "partially_refunded";
      order.refundAmount = (order.refundAmount || 0) + parseFloat(amount);
      order.refundedAt = new Date();
      order.refundReason = reason;

      order.addStatusHistory(
        order.status,
        req.userId,
        req.userRole,
        `Refund processed: $${amount} - ${reason}`
      );

      await order.save();

      res.json({
        success: true,
        message: `Refund of $${amount} processed successfully`,
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          refundAmount: order.refundAmount,
          paymentStatus: order.paymentStatus,
          newBalance: refundResult.newBalance,
        },
      });
    } catch (error) {
      console.error("POST /api/orders/:id/refund error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to process refund",
      });
    }
  }
);

/**
 * GET /api/orders/:id/tracking
 * Get comprehensive tracking details for an order
 */
router.get(
  "/:id/tracking",
  verifyToken,
  requireVerification,
  async (req, res) => {
    try {
      const trackingData = await orderService.getOrderTracking(
        req.params.id,
        req.userId,
        req.userRole
      );

      res.json({
        success: true,
        data: trackingData,
      });
    } catch (error) {
      console.error("GET /api/orders/:id/tracking error:", error);

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
 * GET /api/orders/:id/tracking/live
 * Get real-time tracking updates (polling endpoint)
 */
router.get(
  "/:id/tracking/live",
  verifyToken,
  requireVerification,
  async (req, res) => {
    try {
      const { lastEventId } = req.query;

      const liveData = await orderService.getLiveTrackingUpdates(
        req.params.id,
        req.userId,
        req.userRole,
        lastEventId
      );

      res.json({
        success: true,
        data: liveData,
      });
    } catch (error) {
      console.error("GET /api/orders/:id/tracking/live error:", error);

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

/**
 * GET /api/orders/track/:orderNumber
 * Public order tracking by order number (guest tracking)
 */
router.get("/track/:orderNumber", async (req, res) => {
  try {
    const { email } = req.query;
    const { orderNumber } = req.params;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required for order tracking",
      });
    }

    const trackingData = await orderService.trackOrderByNumber(
      orderNumber,
      email
    );

    res.json({
      success: true,
      data: trackingData,
    });
  } catch (error) {
    console.error("GET /api/orders/track/:orderNumber error:", error);

    if (error.message === "Order not found") {
      return res.status(404).json({
        success: false,
        message: "Order not found with this number",
      });
    }

    if (error.message.includes("Email does not match")) {
      return res.status(403).json({
        success: false,
        message: "Email does not match order records",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * POST /api/orders/:id/tracking/event
 * Add manual tracking event (Seller/Expert only)
 */
router.post(
  "/:id/tracking/event",
  verifyToken,
  requireVerification,
  checkRole("vendor", "supplier", "expert"),
  async (req, res) => {
    try {
      const { stage, location, description, coordinates } = req.body;

      if (!stage || !location || !description) {
        return res.status(400).json({
          success: false,
          message: "Stage, location, and description are required",
        });
      }

      const result = await orderService.addTrackingEvent(
        req.params.id,
        {
          stage,
          location,
          description,
          coordinates,
        },
        req.userId
      );

      res.json(result);
    } catch (error) {
      console.error("POST /api/orders/:id/tracking/event error:", error);

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

/**
 * PATCH /api/orders/:id/tracking/update
 * Update tracking information (Seller only)
 */
router.patch(
  "/:id/tracking/update",
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

      const result = await orderService.updateTrackingInfo(
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
      console.error("PATCH /api/orders/:id/tracking/update error:", error);

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
 * GET /api/orders/:id/tracking/map
 * Get tracking map data for visualization
 */
router.get(
  "/:id/tracking/map",
  verifyToken,
  requireVerification,
  async (req, res) => {
    try {
      const mapData = await orderService.getTrackingMapData(
        req.params.id,
        req.userId,
        req.userRole
      );

      res.json({
        success: true,
        data: mapData,
      });
    } catch (error) {
      console.error("GET /api/orders/:id/tracking/map error:", error);

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

/**
 * GET /api/orders/:id/tracking/progress
 * Get delivery progress percentage
 */
router.get(
  "/:id/tracking/progress",
  verifyToken,
  requireVerification,
  async (req, res) => {
    try {
      const progress = await orderService.getDeliveryProgress(
        req.params.id,
        req.userId,
        req.userRole
      );

      res.json({
        success: true,
        data: progress,
      });
    } catch (error) {
      console.error("GET /api/orders/:id/tracking/progress error:", error);

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

/**
 * GET /api/orders/:id/timeline
 * Get detailed order timeline with all status changes and events
 */
router.get(
  "/:id/timeline",
  verifyToken,
  requireVerification,
  async (req, res) => {
    try {
      const timeline = await orderService.getOrderTimeline(
        req.params.id,
        req.userId,
        req.userRole
      );

      res.json({
        success: true,
        data: timeline,
      });
    } catch (error) {
      console.error("GET /api/orders/:id/timeline error:", error);

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
 * GET /api/orders/:id/cancellation-eligibility
 * Check if order can be cancelled
 */
router.get(
  "/:id/cancellation-eligibility",
  verifyToken,
  requireVerification,
  async (req, res) => {
    try {
      const eligibility = await orderService.checkCancellationEligibility(
        req.params.id,
        req.userId
      );

      res.json({
        success: true,
        data: eligibility,
      });
    } catch (error) {
      console.error(
        "GET /api/orders/:id/cancellation-eligibility error:",
        error
      );

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

/**
 * POST /api/orders/:id/cancel/request
 * Request cancellation with detailed reason (for orders in processing)
 */
router.post(
  "/:id/cancel/request",
  verifyToken,
  requireVerification,
  checkRole("customer"),
  async (req, res) => {
    try {
      const { reason, reasonDetails } = req.body;

      if (!reason || reason.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Cancellation reason is required",
        });
      }

      const result = await orderService.requestOrderCancellation(
        req.params.id,
        req.userId,
        {
          reason,
          reasonDetails: reasonDetails || "",
        }
      );

      res.json(result);
    } catch (error) {
      console.error("POST /api/orders/:id/cancel/request error:", error);

      if (error.message === "Order not found") {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      if (error.message.includes("cannot request cancellation")) {
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

export default router;
