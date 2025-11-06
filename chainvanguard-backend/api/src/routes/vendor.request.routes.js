import express from "express";
import vendorRequestService from "../services/vendor.request.service.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";
import fabricService from "../services/fabric.service.js";
import VendorRequest from "../models/VendorRequest.js";

const router = express.Router();

// ========================================
// VENDOR ENDPOINTS
// ========================================

/**
 * POST /api/vendor-requests
 * Create new purchase request
 * Access: Vendor only
 */
router.post("/", authenticate, authorizeRoles("vendor"), async (req, res) => {
  try {
    const { supplierId, items, vendorNotes } = req.body;

    if (!supplierId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Supplier ID and items are required",
      });
    }

    const result = await vendorRequestService.createRequest(req.userId, {
      supplierId,
      items,
      vendorNotes,
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("❌ POST /api/vendor-requests error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create request",
    });
  }
});

/**
 * GET /api/vendor-requests/my-requests
 * Get vendor's requests
 * Access: Vendor only
 * Query params: status, supplierId, page, limit, sortBy, sortOrder
 */
router.get(
  "/my-requests",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const filters = {
        status: req.query.status,
        supplierId: req.query.supplierId,
        page: req.query.page,
        limit: req.query.limit,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      };

      const result = await vendorRequestService.getVendorRequests(
        req.userId,
        filters
      );

      res.json(result);
    } catch (error) {
      console.error("❌ GET /api/vendor-requests/my-requests error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get requests",
      });
    }
  }
);

/**
 * GET /api/vendor-requests/stats
 * Get vendor's request statistics
 * Access: Vendor only
 */
router.get(
  "/stats",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const result = await vendorRequestService.getRequestStats(
        req.userId,
        "vendor"
      );

      res.json(result);
    } catch (error) {
      console.error("❌ GET /api/vendor-requests/stats error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get statistics",
      });
    }
  }
);

/**
 * POST /api/vendor-requests/:id/cancel
 * Cancel request
 * Access: Vendor only
 */
router.post(
  "/:id/cancel",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const result = await vendorRequestService.cancelRequest(
        req.params.id,
        req.userId
      );
      res.json(result);
    } catch (error) {
      console.error("❌ POST /api/vendor-requests/:id/cancel error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// =====================================================================
// INSERT THIS CODE INTO: vendor_request_routes.js
// LOCATION: After line 133 (after /:id/cancel route)
// MUST BE BEFORE the GET /:id route (currently at line 658)
// =====================================================================

// ========================================
// VENDOR PAYMENT ENDPOINTS (NEW)
// ⚠️ MUST be BEFORE /:id route to avoid route conflicts
// ========================================

/**
 * GET /api/vendor-requests/approved
 * Get vendor's approved requests ready for payment
 * Access: Vendor only
 *
 * Returns requests that are:
 * - Status: "approved"
 * - No orderId (not yet paid)
 * - Belong to the authenticated vendor
 */
router.get(
  "/approved",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const result = await vendorRequestService.getApprovedRequests(
        req.user.userId
      );
      res.json(result);
    } catch (error) {
      console.error("❌ GET /api/vendor-requests/approved error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get approved requests",
      });
    }
  }
);

/**
 * POST /api/vendor-requests/:id/pay
 * Process payment and create order for approved request
 * Access: Vendor only
 *
 * Body: {
 *   shippingAddress: {
 *     name: string (required),
 *     phone: string (required),
 *     addressLine1: string (required),
 *     addressLine2: string (optional),
 *     city: string (required),
 *     state: string (required),
 *     postalCode: string (required),
 *     country: string (required)
 *   }
 * }
 */
router.post(
  "/:id/pay",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const { shippingAddress } = req.body;

      if (!shippingAddress) {
        return res.status(400).json({
          success: false,
          message: "Shipping address is required for payment",
        });
      }

      // Validate required address fields
      const requiredFields = [
        "name",
        "phone",
        "addressLine1",
        "city",
        "state",
        "postalCode",
        "country",
      ];
      const missingFields = requiredFields.filter(
        (field) => !shippingAddress[field]
      );

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Missing required shipping address fields",
          missingFields,
        });
      }

      const result = await vendorRequestService.processPaymentAndCreateOrder(
        req.params.id,
        req.user.userId,
        shippingAddress
      );

      res.json(result);
    } catch (error) {
      console.error("❌ POST /api/vendor-requests/:id/pay error:", error);

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (
        error.message.includes("Unauthorized") ||
        error.message.includes("does not belong")
      ) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes("Insufficient")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || "Failed to process payment",
      });
    }
  }
);

/**
 * POST /api/vendor-requests/:id/cancel-approved
 * Cancel an approved request before payment
 * Access: Vendor only
 *
 * Body: {
 *   cancellationReason: string (required)
 * }
 */
router.post(
  "/:id/cancel-approved",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const { cancellationReason } = req.body;

      if (!cancellationReason || cancellationReason.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Cancellation reason is required",
        });
      }

      const result = await vendorRequestService.cancelApprovedRequest(
        req.params.id,
        req.user.userId,
        cancellationReason
      );

      res.json(result);
    } catch (error) {
      console.error(
        "❌ POST /api/vendor-requests/:id/cancel-approved error:",
        error
      );

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes("Unauthorized")) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes("Cannot cancel")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || "Failed to cancel request",
      });
    }
  }
);

// ========================================
// End of new payment endpoints
// Continue with existing routes below...
// ========================================

// ========================================
// SUPPLIER ENDPOINTS
// ========================================

/**
 * GET /api/vendor-requests/supplier/requests
 * Get supplier's requests
 * Access: Supplier only
 * Query params: status, vendorId, page, limit, sortBy, sortOrder, startDate, endDate
 */
router.get(
  "/supplier/requests",
  authenticate,
  authorizeRoles("supplier"),
  async (req, res) => {
    try {
      const filters = {
        status: req.query.status,
        vendorId: req.query.vendorId,
        page: req.query.page,
        limit: req.query.limit,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };

      const result = await vendorRequestService.getSupplierRequests(
        req.userId,
        filters
      );

      res.json(result);
    } catch (error) {
      console.error(
        "❌ GET /api/vendor-requests/supplier/requests error:",
        error
      );
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get requests",
      });
    }
  }
);

/**
 * GET /api/vendor-requests/supplier/transactions
 * Get all transactions (alias for supplier requests list)
 */
router.get(
  "/supplier/transactions",
  authenticate,
  authorizeRoles("supplier"),
  async (req, res) => {
    try {
      const filters = {
        status: req.query.status,
        page: req.query.page,
        limit: req.query.limit,
        sortBy: req.query.sortBy || "createdAt",
        sortOrder: req.query.sortOrder || "desc",
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };

      const result = await vendorRequestService.getSupplierRequests(
        req.userId,
        filters
      );

      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/vendor-requests/supplier/stats
 * Get supplier's request statistics
 * Access: Supplier only
 */
router.get(
  "/supplier/stats",
  authenticate,
  authorizeRoles("supplier"),
  async (req, res) => {
    try {
      const result = await vendorRequestService.getSupplierStats(req.userId);

      res.json(result);
    } catch (error) {
      console.error("❌ GET /api/vendor-requests/supplier/stats error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get statistics",
      });
    }
  }
);

/**
 * POST /api/vendor-requests/:id/approve
 * Approve request
 * Access: Supplier only
 */
router.post(
  "/:id/approve",
  authenticate,
  authorizeRoles("supplier"),
  async (req, res) => {
    try {
      const { supplierNotes } = req.body;

      const result = await vendorRequestService.approveRequest(
        req.params.id,
        req.userId,
        supplierNotes
      );

      res.json(result);
    } catch (error) {
      console.error("❌ POST /api/vendor-requests/:id/approve error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to approve request",
      });
    }
  }
);

/**
 * POST /api/vendor-requests/:id/reject
 * Reject request
 * Access: Supplier only
 */
router.post(
  "/:id/reject",
  authenticate,
  authorizeRoles("supplier"),
  async (req, res) => {
    try {
      const { rejectionReason } = req.body;

      if (!rejectionReason) {
        return res.status(400).json({
          success: false,
          message: "Rejection reason is required",
        });
      }

      const result = await vendorRequestService.rejectRequest(
        req.params.id,
        req.userId,
        rejectionReason
      );

      res.json(result);
    } catch (error) {
      console.error("❌ POST /api/vendor-requests/:id/reject error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to reject request",
      });
    }
  }
);

/**
 * PATCH /api/vendor-requests/:id/status
 * Update transaction status
 * Access: Supplier only
 */
router.patch(
  "/:id/status",
  authenticate,
  authorizeRoles("supplier"),
  async (req, res) => {
    try {
      const { status, notes } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Status is required",
        });
      }

      const result = await vendorRequestService.updateRequestStatus(
        req.params.id,
        req.userId,
        status,
        notes
      );

      res.json(result);
    } catch (error) {
      console.error("❌ PATCH /api/vendor-requests/:id/status error:", error);

      if (error.message === "Request not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
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
        message: error.message || "Failed to update status",
      });
    }
  }
);

/**
 * POST /api/vendor-requests/:id/complete
 * Mark transaction as complete and lock
 * Access: Supplier only
 */
router.post(
  "/:id/complete",
  authenticate,
  authorizeRoles("supplier"),
  async (req, res) => {
    try {
      const { notes } = req.body;

      const result = await vendorRequestService.completeTransaction(
        req.params.id,
        req.userId,
        notes
      );

      res.json(result);
    } catch (error) {
      console.error("❌ POST /api/vendor-requests/:id/complete error:", error);

      if (error.message === "Request not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
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
        message: error.message || "Failed to complete transaction",
      });
    }
  }
);

/**
 * GET /api/vendor-requests/supplier/auto-approve
 * Get auto-approve setting status
 * Access: Supplier only
 */
router.get(
  "/supplier/auto-approve",
  authenticate,
  authorizeRoles("supplier"),
  async (req, res) => {
    try {
      const result = await vendorRequestService.getAutoApproveStatus(
        req.userId
      );

      res.json(result);
    } catch (error) {
      console.error(
        "❌ GET /api/vendor-requests/supplier/auto-approve error:",
        error
      );
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get auto-approve status",
      });
    }
  }
);

/**
 * PATCH /api/vendor-requests/supplier/auto-approve
 * Toggle auto-approve setting
 * Access: Supplier only
 */
router.patch(
  "/supplier/auto-approve",
  authenticate,
  authorizeRoles("supplier"),
  async (req, res) => {
    try {
      const result = await vendorRequestService.toggleAutoApprove(req.userId);

      res.json(result);
    } catch (error) {
      console.error(
        "❌ PATCH /api/vendor-requests/supplier/auto-approve error:",
        error
      );
      res.status(500).json({
        success: false,
        message: error.message || "Failed to toggle auto-approve",
      });
    }
  }
);

/**
 * GET /api/vendor-requests/supplier/settings
 * Get supplier settings (auto-approve, discounts, etc)
 * Access: Supplier only
 */
router.get(
  "/supplier/settings",
  authenticate,
  authorizeRoles("supplier"),
  async (req, res) => {
    try {
      const result = await vendorRequestService.getSupplierSettings(req.userId);

      res.json(result);
    } catch (error) {
      console.error(
        "❌ GET /api/vendor-requests/supplier/settings error:",
        error
      );
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get supplier settings",
      });
    }
  }
);

/**
 * PATCH /api/vendor-requests/supplier/settings
 * Update supplier settings
 * Access: Supplier only
 * Body: { autoApproveRequests?, minOrderValue?, discountForRewards?, rewardPointsRate? }
 */
router.patch(
  "/supplier/settings",
  authenticate,
  authorizeRoles("supplier"),
  async (req, res) => {
    try {
      const {
        autoApproveRequests,
        minOrderValue,
        discountForRewards,
        rewardPointsRate,
      } = req.body;

      const result = await vendorRequestService.updateSupplierSettings(
        req.userId,
        {
          autoApproveRequests,
          minOrderValue,
          discountForRewards,
          rewardPointsRate,
        }
      );

      res.json(result);
    } catch (error) {
      console.error(
        "❌ PATCH /api/vendor-requests/supplier/settings error:",
        error
      );
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update supplier settings",
      });
    }
  }
);

// ========================================
// BLOCKCHAIN ENDPOINTS (NEW)
// ========================================

/**
 * ✅ NEW: GET /api/vendor-requests/:id/history
 * Get blockchain history for request (audit trail)
 * Access: Supplier, Vendor (own request)
 */
router.get(
  "/:id/history",
  authenticate,
  authorizeRoles("supplier", "vendor"),
  async (req, res) => {
    try {
      const requestId = req.params.id;

      const result = await vendorRequestService.getRequestHistory(
        requestId,
        req.userId,
        req.userRole
      );

      res.json(result);
    } catch (error) {
      console.error("❌ GET /api/vendor-requests/:id/history error:", error);
      res.status(error.message.includes("Unauthorized") ? 403 : 500).json({
        success: false,
        message: error.message || "Failed to get request history",
      });
    }
  }
);

/**
 * ✅ NEW: GET /api/vendor-requests/blockchain/verify/:id
 * Verify if request exists on blockchain
 * Access: Supplier, Vendor (own request)
 */
router.get(
  "/blockchain/verify/:id",
  authenticate,
  authorizeRoles("supplier", "vendor"),
  async (req, res) => {
    try {
      const requestId = req.params.id;

      // Get from MongoDB
      const request = await VendorRequest.findById(requestId);

      if (!request) {
        return res.status(404).json({
          success: false,
          message: "Request not found",
        });
      }

      // Check authorization
      if (
        req.userRole === "vendor" &&
        request.vendorId.toString() !== req.userId
      ) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (
        req.userRole === "supplier" &&
        request.supplierId.toString() !== req.userId
      ) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Try to get from blockchain
      let blockchainData = null;
      let onBlockchain = false;

      try {
        blockchainData = await fabricService.getVendorRequest(requestId);
        onBlockchain = true;
      } catch (error) {
        console.error("Request not on blockchain:", error.message);
      }

      res.json({
        success: true,
        mongoData: {
          id: request._id,
          requestNumber: request.requestNumber,
          status: request.status,
          total: request.total,
          blockchainVerified: request.blockchainVerified,
          blockchainTxId: request.blockchainTxId,
        },
        blockchain: {
          onBlockchain: onBlockchain,
          data: blockchainData,
        },
        synced: onBlockchain && request.blockchainVerified,
      });
    } catch (error) {
      console.error(
        "❌ GET /api/vendor-requests/blockchain/verify/:id error:",
        error
      );
      res.status(500).json({
        success: false,
        message: error.message || "Failed to verify blockchain status",
      });
    }
  }
);

// ========================================
// SHARED ENDPOINTS (Vendor + Supplier)
// ========================================

/**
 * GET /api/vendor-requests/:id
 * Get request details
 * Access: Vendor or Supplier (owner only)
 */
router.get(
  "/:id",
  authenticate,
  authorizeRoles("vendor", "supplier"),
  async (req, res) => {
    try {
      const result = await vendorRequestService.getRequestById(
        req.params.id,
        req.userId
      );

      res.json(result);
    } catch (error) {
      console.error("❌ GET /api/vendor-requests/:id error:", error);

      if (error.message === "Request not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
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
        message: error.message || "Failed to get request",
      });
    }
  }
);

// ========================================
// EXPERT ENDPOINTS (Admin/Monitoring)
// ========================================

/**
 * GET /api/vendor-requests/expert/all
 * Get all requests (Expert view)
 * Access: Expert only
 */
router.get(
  "/expert/all",
  authenticate,
  authorizeRoles("expert"),
  async (req, res) => {
    try {
      const { page = 1, limit = 50, status } = req.query;

      const query = {};
      if (status) query.status = status;

      const skip = (page - 1) * limit;

      const [requests, total] = await Promise.all([
        VendorRequest.find(query)
          .populate("vendorId", "name email companyName")
          .populate("supplierId", "name email companyName")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        VendorRequest.countDocuments(query),
      ]);

      res.json({
        success: true,
        requests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("❌ GET /api/vendor-requests/expert/all error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get all requests",
      });
    }
  }
);

export default router;
