import express from "express";
import loyaltyService from "../services/loyalty.service.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

// ========================================
// CUSTOMER ENDPOINTS (B2C)
// ========================================

/**
 * GET /api/loyalty/status
 * Get customer's loyalty points status
 * (For customers buying from vendors)
 */
router.get(
  "/status",
  authenticate,
  authorizeRoles("customer"),
  async (req, res) => {
    try {
      const result = await loyaltyService.getCustomerLoyaltyStatus(req.userId);
      res.json(result);
    } catch (error) {
      console.error("❌ GET /api/loyalty/status error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get loyalty status",
      });
    }
  }
);

// ========================================
// VENDOR ENDPOINTS (B2B)
// ========================================

/**
 * GET /api/loyalty/my-points
 * Get vendor's loyalty points status with a specific supplier
 * Query params: supplierId (required)
 */
router.get(
  "/my-points",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const { supplierId } = req.query;

      if (!supplierId) {
        return res.status(400).json({
          success: false,
          message: "Supplier ID is required as query parameter",
        });
      }

      const result = await loyaltyService.getVendorLoyaltyStatus(
        req.userId,
        supplierId
      );

      res.json(result);
    } catch (error) {
      console.error("❌ GET /api/loyalty/my-points error:", error);

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || "Failed to get loyalty status",
      });
    }
  }
);

/**
 * POST /api/loyalty/calculate-discount
 * Calculate discount for vendor's order based on loyalty points
 * Body: { supplierId, orderAmount }
 */
router.post(
  "/calculate-discount",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const { supplierId, orderAmount } = req.body;

      if (!supplierId || !orderAmount) {
        return res.status(400).json({
          success: false,
          message: "Supplier ID and order amount are required",
        });
      }

      if (orderAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Order amount must be greater than 0",
        });
      }

      const result = await loyaltyService.calculateDiscount(
        req.userId,
        supplierId,
        orderAmount
      );

      res.json({
        success: true,
        discount: result,
      });
    } catch (error) {
      console.error("❌ POST /api/loyalty/calculate-discount error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to calculate discount",
      });
    }
  }
);

// ========================================
// SUPPLIER ENDPOINTS
// ========================================

/**
 * GET /api/loyalty/settings
 * Get supplier's discount settings
 */
router.get(
  "/settings",
  authenticate,
  authorizeRoles("supplier"),
  async (req, res) => {
    try {
      const User = (await import("../models/User.js")).default;
      const supplier = await User.findById(req.userId);

      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: "Supplier not found",
        });
      }

      res.json({
        success: true,
        settings: supplier.discountSettings || {
          pointsRequired: 1000,
          discountPercentage: 10,
          enabled: true,
        },
      });
    } catch (error) {
      console.error("❌ GET /api/loyalty/settings error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get settings",
      });
    }
  }
);

/**
 * PUT /api/loyalty/settings
 * Update supplier's discount settings
 * Body: { pointsRequired, discountPercentage, enabled }
 */
router.put(
  "/settings",
  authenticate,
  authorizeRoles("supplier"),
  async (req, res) => {
    try {
      const { pointsRequired, discountPercentage, enabled } = req.body;

      const result = await loyaltyService.updateDiscountSettings(req.userId, {
        pointsRequired,
        discountPercentage,
        enabled,
      });

      res.json(result);
    } catch (error) {
      console.error("❌ PUT /api/loyalty/settings error:", error);

      if (error.message.includes("must be")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || "Failed to update settings",
      });
    }
  }
);

/**
 * GET /api/loyalty/vendors
 * Get all vendors with their loyalty points
 * Query params: page, limit, sortBy, sortOrder
 */
router.get(
  "/vendors",
  authenticate,
  authorizeRoles("supplier"),
  async (req, res) => {
    try {
      const filters = {
        page: req.query.page,
        limit: req.query.limit,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      };

      const result = await loyaltyService.getSupplierVendorsWithPoints(
        req.userId,
        filters
      );

      res.json(result);
    } catch (error) {
      console.error("❌ GET /api/loyalty/vendors error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get vendors",
      });
    }
  }
);

/**
 * GET /api/loyalty/vendor/:vendorId/points
 * Get specific vendor's points detail and order history
 */
router.get(
  "/vendor/:vendorId/points",
  authenticate,
  authorizeRoles("supplier"),
  async (req, res) => {
    try {
      const result = await loyaltyService.getVendorPointsDetail(
        req.userId,
        req.params.vendorId
      );

      res.json(result);
    } catch (error) {
      console.error(
        "❌ GET /api/loyalty/vendor/:vendorId/points error:",
        error
      );

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || "Failed to get vendor points",
      });
    }
  }
);

/**
 * POST /api/loyalty/vendor/:vendorId/adjust-points
 * Manually adjust vendor's loyalty points
 * Body: { points (positive or negative), reason }
 */
router.post(
  "/vendor/:vendorId/adjust-points",
  authenticate,
  authorizeRoles("supplier"),
  async (req, res) => {
    try {
      const { points, reason } = req.body;

      if (points === undefined || points === 0) {
        return res.status(400).json({
          success: false,
          message: "Points value is required and must be non-zero",
        });
      }

      if (!reason || reason.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Reason is required for point adjustment",
        });
      }

      const result = await loyaltyService.adjustVendorPoints(
        req.userId,
        req.params.vendorId,
        parseInt(points),
        reason
      );

      res.json(result);
    } catch (error) {
      console.error(
        "❌ POST /api/loyalty/vendor/:vendorId/adjust-points error:",
        error
      );

      if (
        error.message.includes("not found") ||
        error.message.includes("only adjust")
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || "Failed to adjust points",
      });
    }
  }
);

/**
 * GET /api/loyalty/vendor/:vendorId/eligibility
 * Check if vendor is eligible for discount
 */
router.get(
  "/vendor/:vendorId/eligibility",
  authenticate,
  authorizeRoles("supplier"),
  async (req, res) => {
    try {
      const User = (await import("../models/User.js")).default;
      const vendor = await User.findById(req.params.vendorId);
      const supplier = await User.findById(req.userId);

      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: "Vendor not found",
        });
      }

      const pointsRequired = supplier.discountSettings?.pointsRequired || 1000;
      const isEligible = (vendor.loyaltyPoints || 0) >= pointsRequired;

      res.json({
        success: true,
        eligibility: {
          eligible: isEligible,
          currentPoints: vendor.loyaltyPoints || 0,
          pointsRequired,
          pointsNeeded: Math.max(
            0,
            pointsRequired - (vendor.loyaltyPoints || 0)
          ),
          discountPercentage:
            supplier.discountSettings?.discountPercentage || 10,
        },
      });
    } catch (error) {
      console.error(
        "❌ GET /api/loyalty/vendor/:vendorId/eligibility error:",
        error
      );
      res.status(500).json({
        success: false,
        message: error.message || "Failed to check eligibility",
      });
    }
  }
);

export default router;
