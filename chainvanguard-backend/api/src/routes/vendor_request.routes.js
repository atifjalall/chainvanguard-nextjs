import express from "express";
import vendorRequestService from "../services/vendor_request.service.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";

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
 * DELETE /api/vendor-requests/:id
 * Cancel request
 * Access: Vendor only
 */
router.delete(
  "/:id",
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
      console.error("❌ DELETE /api/vendor-requests/:id error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to cancel request",
      });
    }
  }
);

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
      const result = await vendorRequestService.getRequestStats(
        req.userId,
        "supplier"
      );

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
      res.status(500).json({ success: false, message: error.message });
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

      const VendorRequest = (await import("../models/VendorRequest.js"))
        .default;

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
