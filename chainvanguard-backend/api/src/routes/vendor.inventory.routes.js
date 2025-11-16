import express from "express";
import vendorInventoryService from "../services/vendor.inventory.service.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";
import logger from "../utils/logger.js";

const router = express.Router();

// ========================================
// GET VENDOR'S INVENTORY
// GET /api/vendor/inventory
// ========================================
router.get("/", authenticate, authorizeRoles("vendor"), async (req, res) => {
  try {
    const filters = {
      supplierId: req.query.supplierId,
      category: req.query.category,
      status: req.query.status,
      lowStock: req.query.lowStock,
      search: req.query.search,
    };

    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 20,
      sortBy: req.query.sortBy || "dates.received",
      sortOrder: req.query.sortOrder || "desc",
    };

    const result = await vendorInventoryService.getVendorInventory(
      req.user.userId,
      filters,
      options
    );

    res.json({
      success: true,
      data: result.inventory,
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error("Error in GET /vendor/inventory:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching inventory",
    });
  }
});

// ========================================
// GET INVENTORY STATS
// GET /api/vendor/inventory/stats
// ========================================
router.get(
  "/stats",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const stats = await vendorInventoryService.getInventoryStats(
        req.user.userId
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error("Error in GET /vendor/inventory/stats:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error fetching inventory stats",
      });
    }
  }
);

// ========================================
// GET LOW STOCK ALERTS
// GET /api/vendor/inventory/low-stock
// ========================================
router.get(
  "/low-stock",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const alerts = await vendorInventoryService.getLowStockAlerts(
        req.user.userId
      );

      res.json({
        success: true,
        data: alerts,
        count: alerts.length,
      });
    } catch (error) {
      logger.error("Error in GET /vendor/inventory/low-stock:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error fetching low stock alerts",
      });
    }
  }
);

// ========================================
// GET REORDER SUGGESTIONS
// GET /api/vendor/inventory/reorder-suggestions
// ========================================
router.get(
  "/reorder-suggestions",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const suggestions = await vendorInventoryService.getReorderSuggestions(
        req.user.userId
      );

      res.json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      logger.error(
        "Error in GET /vendor/inventory/reorder-suggestions:",
        error
      );
      res.status(500).json({
        success: false,
        message: error.message || "Error fetching reorder suggestions",
      });
    }
  }
);

// ========================================
// GET INVENTORY BY SUPPLIER
// GET /api/vendor/inventory/by-supplier/:supplierId
// ========================================
router.get(
  "/by-supplier/:supplierId",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const result = await vendorInventoryService.getBySupplier(
        req.user.userId,
        req.params.supplierId
      );

      res.json({
        success: true,
        data: result.inventory,
        summary: result.summary,
      });
    } catch (error) {
      logger.error("Error in GET /vendor/inventory/by-supplier:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error fetching supplier inventory",
      });
    }
  }
);

// ========================================
// SEARCH INVENTORY
// GET /api/vendor/inventory/search
// ========================================
router.get(
  "/search",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          message: "Search query is required",
        });
      }

      const results = await vendorInventoryService.searchInventory(
        req.user.userId,
        q
      );

      res.json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (error) {
      logger.error("Error in GET /vendor/inventory/search:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error searching inventory",
      });
    }
  }
);

// ========================================
// GET INVENTORY BY ID
// GET /api/vendor/inventory/:id
// ========================================
router.get("/:id", authenticate, authorizeRoles("vendor"), async (req, res) => {
  try {
    const inventory = await vendorInventoryService.getInventoryById(
      req.params.id,
      req.user.userId
    );

    res.json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    logger.error("Error in GET /vendor/inventory/:id:", error);
    res.status(404).json({
      success: false,
      message: error.message || "Inventory not found",
    });
  }
});

// ========================================
// GET MOVEMENTS HISTORY
// GET /api/vendor/inventory/:id/movements
// ========================================
router.get(
  "/:id/movements",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const movements = await vendorInventoryService.getMovementsHistory(
        req.params.id,
        req.user.userId
      );

      res.json({
        success: true,
        data: movements,
      });
    } catch (error) {
      logger.error("Error in GET /vendor/inventory/:id/movements:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error fetching movements history",
      });
    }
  }
);

// ========================================
// ADJUST STOCK
// POST /api/vendor/inventory/:id/adjust
// ========================================
router.post(
  "/:id/adjust",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const { quantityChange, reason, notes } = req.body;

      if (!quantityChange || !reason) {
        return res.status(400).json({
          success: false,
          message: "Quantity change and reason are required",
        });
      }

      const inventory = await vendorInventoryService.adjustStock(
        req.params.id,
        req.user.userId,
        { quantityChange: Number(quantityChange), reason, notes }
      );

      res.json({
        success: true,
        message: "Stock adjusted successfully",
        data: inventory,
      });
    } catch (error) {
      logger.error("Error in POST /vendor/inventory/:id/adjust:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error adjusting stock",
      });
    }
  }
);

// ========================================
// RESERVE QUANTITY
// POST /api/vendor/inventory/:id/reserve
// ========================================
router.post(
  "/:id/reserve",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const { quantity, orderId, notes } = req.body;

      if (!quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid quantity is required",
        });
      }

      const inventory = await vendorInventoryService.reserveQuantity(
        req.params.id,
        req.user.userId,
        { quantity: Number(quantity), orderId, notes }
      );

      res.json({
        success: true,
        message: "Quantity reserved successfully",
        data: inventory,
      });
    } catch (error) {
      logger.error("Error in POST /vendor/inventory/:id/reserve:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error reserving quantity",
      });
    }
  }
);

// ========================================
// RELEASE RESERVED QUANTITY
// POST /api/vendor/inventory/:id/release
// ========================================
router.post(
  "/:id/release",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const { quantity } = req.body;

      if (!quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid quantity is required",
        });
      }

      const inventory = await vendorInventoryService.releaseReservedQuantity(
        req.params.id,
        req.user.userId,
        Number(quantity)
      );

      res.json({
        success: true,
        message: "Reserved quantity released successfully",
        data: inventory,
      });
    } catch (error) {
      logger.error("Error in POST /vendor/inventory/:id/release:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error releasing quantity",
      });
    }
  }
);

// ========================================
// USE IN PRODUCTION
// POST /api/vendor/inventory/:id/use
// ========================================
router.post(
  "/:id/use",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const { quantity, productId, productName, notes } = req.body;

      if (!quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid quantity is required",
        });
      }

      const inventory = await vendorInventoryService.useInProduction(
        req.params.id,
        req.user.userId,
        { quantity: Number(quantity), productId, productName, notes }
      );

      res.json({
        success: true,
        message: "Material used in production successfully",
        data: inventory,
      });
    } catch (error) {
      logger.error("Error in POST /vendor/inventory/:id/use:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error using material in production",
      });
    }
  }
);

// ========================================
// MARK AS DAMAGED
// POST /api/vendor/inventory/:id/damaged
// ========================================
router.post(
  "/:id/damaged",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const { quantity, reason, notes } = req.body;

      if (!quantity || quantity <= 0 || !reason) {
        return res.status(400).json({
          success: false,
          message: "Valid quantity and reason are required",
        });
      }

      const inventory = await vendorInventoryService.markAsDamaged(
        req.params.id,
        req.user.userId,
        { quantity: Number(quantity), reason, notes }
      );

      res.json({
        success: true,
        message: "Items marked as damaged successfully",
        data: inventory,
      });
    } catch (error) {
      logger.error("Error in POST /vendor/inventory/:id/damaged:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error marking as damaged",
      });
    }
  }
);

// ========================================
// UPDATE QUALITY STATUS
// POST /api/vendor/inventory/:id/quality
// ========================================
router.post(
  "/:id/quality",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const { status, notes } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Quality status is required",
        });
      }

      const validStatuses = ["pending", "passed", "failed", "conditional"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
      }

      const inventory = await vendorInventoryService.updateQualityStatus(
        req.params.id,
        req.user.userId,
        { status, notes }
      );

      res.json({
        success: true,
        message: "Quality status updated successfully",
        data: inventory,
      });
    } catch (error) {
      logger.error("Error in POST /vendor/inventory/:id/quality:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error updating quality status",
      });
    }
  }
);

// ========================================
// CREATE FROM DELIVERED ORDER
// POST /api/vendor/inventory/from-order/:orderId
// ========================================
router.post(
  "/from-order/:orderId",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const result = await vendorInventoryService.createFromDeliveredOrder(
        req.params.orderId,
        req.user.userId
      );

      if (result.alreadyExists) {
        return res.status(200).json({
          success: true,
          message: "Inventory already exists for this order",
          data: result.inventory,
        });
      }

      res.status(201).json({
        success: true,
        message: `Successfully created ${result.count} inventory items`,
        data: result.inventory,
      });
    } catch (error) {
      logger.error("Error in POST /vendor/inventory/from-order:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error creating inventory from order",
      });
    }
  }
);

// ========================================
// DELETE INVENTORY ITEM
// DELETE /api/vendor/inventory/:id
// ========================================
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      await vendorInventoryService.deleteInventory(
        req.params.id,
        req.user.userId
      );

      res.json({
        success: true,
        message: "Inventory item deleted successfully",
      });
    } catch (error) {
      logger.error("Error in DELETE /vendor/inventory/:id:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error deleting inventory",
      });
    }
  }
);

export default router;
