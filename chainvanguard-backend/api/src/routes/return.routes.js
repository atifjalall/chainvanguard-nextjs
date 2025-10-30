import express from "express";
import returnService from "../services/return.service.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * ========================================
 * RETURN ROUTES
 * ========================================
 * Manage product returns and refunds
 */

// ========================================
// CUSTOMER ENDPOINTS
// ========================================

/**
 * POST /api/returns
 * Create a new return request
 * Access: Customer only
 *
 * Body:
 * - orderId: Order ID
 * - items: Array of items to return
 * - reason: Return reason
 * - reasonDetails: Detailed explanation
 * - images: Optional images
 */
router.post("/", authenticate, authorizeRoles("customer"), async (req, res) => {
  try {
    const result = await returnService.createReturn(req.userId, req.body);

    res.status(201).json(result);
  } catch (error) {
    console.error("❌ Create return error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create return request",
    });
  }
});

/**
 * GET /api/returns/customer
 * Get customer's return requests
 * Access: Customer only
 *
 * Query Params:
 * - status: Filter by status
 * - page: Page number
 * - limit: Items per page
 * - sortBy: Sort field
 * - sortOrder: Sort order (asc/desc)
 */
router.get(
  "/customer",
  authenticate,
  authorizeRoles("customer"),
  async (req, res) => {
    try {
      const filters = {
        status: req.query.status,
        page: req.query.page,
        limit: req.query.limit,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      };

      const result = await returnService.getCustomerReturns(
        req.userId,
        filters
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("❌ Get customer returns error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve returns",
      });
    }
  }
);

// ========================================
// VENDOR ENDPOINTS
// ========================================

/**
 * GET /api/returns/vendor
 * Get vendor's return requests
 * Access: Vendor only
 *
 * Query Params:
 * - status: Filter by status
 * - page: Page number
 * - limit: Items per page
 * - sortBy: Sort field
 * - sortOrder: Sort order (asc/desc)
 * - startDate: Filter from date
 * - endDate: Filter to date
 */
router.get(
  "/vendor",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const filters = {
        status: req.query.status,
        page: req.query.page,
        limit: req.query.limit,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };

      const result = await returnService.getVendorReturns(req.userId, filters);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("❌ Get vendor returns error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve returns",
      });
    }
  }
);

/**
 * POST /api/returns/:id/approve
 * Approve return request
 * Access: Vendor only
 *
 * Body:
 * - notes: Optional approval notes
 */
router.post(
  "/:id/approve",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const { notes } = req.body;

      const result = await returnService.approveReturn(
        req.params.id,
        req.userId,
        notes
      );

      res.json(result);
    } catch (error) {
      console.error("❌ Approve return error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to approve return",
      });
    }
  }
);

/**
 * POST /api/returns/:id/reject
 * Reject return request
 * Access: Vendor only
 *
 * Body:
 * - rejectionReason: Reason for rejection (required)
 */
router.post(
  "/:id/reject",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const { rejectionReason } = req.body;

      if (!rejectionReason) {
        return res.status(400).json({
          success: false,
          message: "Rejection reason is required",
        });
      }

      const result = await returnService.rejectReturn(
        req.params.id,
        req.userId,
        rejectionReason
      );

      res.json(result);
    } catch (error) {
      console.error("❌ Reject return error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to reject return",
      });
    }
  }
);

/**
 * GET /api/returns/vendor/stats
 * Get return statistics for vendor
 * Access: Vendor only
 *
 * Query Params:
 * - timeframe: 'week', 'month', 'year', 'all' (default: 'month')
 */
router.get(
  "/vendor/stats",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const timeframe = req.query.timeframe || "month";

      const stats = await returnService.getReturnStatistics(
        req.userId,
        timeframe
      );

      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      console.error("❌ Get return stats error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve return statistics",
      });
    }
  }
);

// ========================================
// EXPERT/ADMIN ENDPOINTS
// ========================================

/**
 * POST /api/returns/:id/refund
 * Process refund (after inspection)
 * Access: Expert only
 *
 * Body:
 * - inspectionNotes: Notes from inspection
 */
router.post(
  "/:id/refund",
  authenticate,
  authorizeRoles("expert"),
  async (req, res) => {
    try {
      const { inspectionNotes } = req.body;

      const result = await returnService.processRefund(
        req.params.id,
        req.userId,
        inspectionNotes
      );

      res.json(result);
    } catch (error) {
      console.error("❌ Process refund error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to process refund",
      });
    }
  }
);

// ========================================
// SHARED ENDPOINTS
// ========================================

/**
 * GET /api/returns/:id
 * Get return request details
 * Access: Customer (own returns), Vendor (own returns), Expert (all)
 */
router.get("/:id", authenticate, async (req, res) => {
  try {
    const returnRequest = await returnService.getReturnById(
      req.params.id,
      req.userId,
      req.userRole
    );

    res.json({
      success: true,
      return: returnRequest,
    });
  } catch (error) {
    console.error("❌ Get return error:", error);

    if (error.message === "Return request not found") {
      return res.status(404).json({
        success: false,
        message: "Return request not found",
      });
    }

    if (error.message === "Unauthorized") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve return request",
    });
  }
});

/**
 * PATCH /api/returns/:id/status
 * Update return status
 * Access: Vendor, Expert
 *
 * Body:
 * - status: New status
 * - notes: Optional notes
 */
router.patch(
  "/:id/status",
  authenticate,
  authorizeRoles("vendor", "expert"),
  async (req, res) => {
    try {
      const { status, notes } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Status is required",
        });
      }

      // Implement status update logic here
      res.json({
        success: true,
        message: "Status updated successfully",
      });
    } catch (error) {
      console.error("❌ Update return status error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update status",
      });
    }
  }
);

export default router;
