import express from "express";
import analyticsService from "../services/analytics.service.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * ========================================
 * ANALYTICS ROUTES
 * ========================================
 * Comprehensive analytics for suppliers and vendors
 */

/**
 * GET /api/analytics/supplier
 * Get supplier analytics dashboard
 * Access: Supplier only
 *
 * Query Params:
 * - timeframe: 'week', 'month', 'quarter', 'year', 'all' (default: 'month')
 *
 * Returns:
 * - Revenue trends (daily/monthly breakdown)
 * - Top vendors by spending
 * - Inventory statistics by category
 * - Vendor request statistics
 * - Order trends over time
 */
router.get(
  "/supplier",
  authenticate,
  authorizeRoles("supplier"),
  async (req, res) => {
    try {
      const timeframe = req.query.timeframe || "month";

      // Validate timeframe
      const validTimeframes = ["week", "month", "quarter", "year", "all"];
      if (!validTimeframes.includes(timeframe)) {
        return res.status(400).json({
          success: false,
          message: `Invalid timeframe. Must be one of: ${validTimeframes.join(", ")}`,
        });
      }

      const analytics = await analyticsService.getSupplierAnalytics(
        req.userId,
        timeframe
      );

      res.json(analytics);
    } catch (error) {
      console.error("❌ Get supplier analytics error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve supplier analytics",
      });
    }
  }
);

/**
 * GET /api/analytics/vendor
 * Get vendor analytics dashboard
 * Access: Vendor only
 *
 * Query Params:
 * - timeframe: 'week', 'month', 'quarter', 'year', 'all' (default: 'month')
 *
 * Returns:
 * - Sales trends (daily/monthly breakdown)
 * - Top selling products
 * - Top customers by spending
 * - Category performance statistics
 * - Order trends over time
 */
router.get(
  "/vendor",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const timeframe = req.query.timeframe || "month";

      // Validate timeframe
      const validTimeframes = ["week", "month", "quarter", "year", "all"];
      if (!validTimeframes.includes(timeframe)) {
        return res.status(400).json({
          success: false,
          message: `Invalid timeframe. Must be one of: ${validTimeframes.join(", ")}`,
        });
      }

      const analytics = await analyticsService.getVendorAnalytics(
        req.userId,
        timeframe
      );

      res.json(analytics);
    } catch (error) {
      console.error("❌ Get vendor analytics error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve vendor analytics",
      });
    }
  }
);

/**
 * GET /api/analytics/product/:productId
 * Get individual product performance analytics
 * Access: Vendor only
 *
 * Query Params:
 * - timeframe: 'week', 'month', 'quarter', 'year' (default: 'month')
 *
 * Returns:
 * - Daily/monthly sales data
 * - Revenue trends
 * - Units sold
 */
router.get(
  "/product/:productId",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const timeframe = req.query.timeframe || "month";
      const { productId } = req.params;

      if (!productId) {
        return res.status(400).json({
          success: false,
          message: "Product ID is required",
        });
      }

      const performance = await analyticsService.getProductPerformance(
        req.userId,
        productId,
        timeframe
      );

      res.json(performance);
    } catch (error) {
      console.error("❌ Get product performance error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve product performance",
      });
    }
  }
);

/**
 * GET /api/analytics/comparison
 * Get sales comparison between time periods
 * Access: Vendor only
 *
 * Query Params:
 * - current: Current period ('week', 'month', 'quarter', 'year')
 * - previous: Previous period ('week', 'month', 'quarter', 'year')
 *
 * Returns:
 * - Current period totals
 * - Previous period totals
 * - Growth percentages
 */
router.get(
  "/comparison",
  authenticate,
  authorizeRoles("vendor", "supplier"),
  async (req, res) => {
    try {
      const current = req.query.current || "month";
      const previous = req.query.previous || "month";

      const comparison = await analyticsService.getSalesComparison(
        req.userId,
        current,
        previous
      );

      res.json(comparison);
    } catch (error) {
      console.error("❌ Get sales comparison error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve sales comparison",
      });
    }
  }
);

/**
 * GET /api/analytics/export
 * Export analytics data as CSV/JSON
 * Access: Vendor, Supplier
 *
 * Query Params:
 * - format: 'csv' or 'json' (default: 'json')
 * - type: 'revenue', 'orders', 'products', 'customers'
 * - timeframe: 'week', 'month', 'quarter', 'year', 'all'
 */
router.get(
  "/export",
  authenticate,
  authorizeRoles("vendor", "supplier"),
  async (req, res) => {
    try {
      const format = req.query.format || "json";
      const type = req.query.type || "revenue";
      const timeframe = req.query.timeframe || "month";

      // Get analytics data based on user role
      const role = req.userRole;
      let data;

      if (role === "supplier") {
        data = await analyticsService.getSupplierAnalytics(
          req.userId,
          timeframe
        );
      } else {
        data = await analyticsService.getVendorAnalytics(req.userId, timeframe);
      }

      if (format === "csv") {
        // Convert to CSV format
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=analytics-${type}-${timeframe}.csv`
        );

        // Simple CSV conversion (you can enhance this)
        const csvData = JSON.stringify(data.analytics[type] || data);
        res.send(csvData);
      } else {
        // Return JSON
        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=analytics-${type}-${timeframe}.json`
        );
        res.json(data);
      }
    } catch (error) {
      console.error("❌ Export analytics error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to export analytics",
      });
    }
  }
);

/**
 * GET /api/analytics/summary
 * Get quick summary statistics
 * Access: Vendor, Supplier
 *
 * Returns:
 * - Today's stats
 * - This week's stats
 * - This month's stats
 * - Quick comparisons
 */
router.get(
  "/summary",
  authenticate,
  authorizeRoles("vendor", "supplier"),
  async (req, res) => {
    try {
      const role = req.userRole;

      // Get data for multiple timeframes in parallel
      const [today, week, month] = await Promise.all([
        role === "supplier"
          ? analyticsService.getSupplierAnalytics(req.userId, "week")
          : analyticsService.getVendorAnalytics(req.userId, "week"),
        role === "supplier"
          ? analyticsService.getSupplierAnalytics(req.userId, "week")
          : analyticsService.getVendorAnalytics(req.userId, "week"),
        role === "supplier"
          ? analyticsService.getSupplierAnalytics(req.userId, "month")
          : analyticsService.getVendorAnalytics(req.userId, "month"),
      ]);

      // Extract summary data
      const summary = {
        today: {
          revenue: today.analytics.revenue?.totals?.totalRevenue || 0,
          orders: today.analytics.revenue?.totals?.totalOrders || 0,
        },
        week: {
          revenue:
            week.analytics.revenue?.totals?.totalRevenue ||
            week.analytics.sales?.totals?.totalRevenue ||
            0,
          orders:
            week.analytics.revenue?.totals?.totalOrders ||
            week.analytics.sales?.totals?.totalOrders ||
            0,
        },
        month: {
          revenue:
            month.analytics.revenue?.totals?.totalRevenue ||
            month.analytics.sales?.totals?.totalRevenue ||
            0,
          orders:
            month.analytics.revenue?.totals?.totalOrders ||
            month.analytics.sales?.totals?.totalOrders ||
            0,
        },
      };

      res.json({
        success: true,
        summary,
      });
    } catch (error) {
      console.error("❌ Get analytics summary error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve analytics summary",
      });
    }
  }
);

export default router;
