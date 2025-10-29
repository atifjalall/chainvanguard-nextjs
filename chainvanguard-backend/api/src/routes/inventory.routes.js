import express from "express";
import inventoryService from "../services/inventory.service.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { uploadProductFiles } from "../middleware/upload.middleware.js";
import { parseJsonFields } from "../middleware/parse-json-fields.js";
import logger from "../utils/logger.js";

const router = express.Router();

// ========================================
// CREATE INVENTORY ITEM
// ========================================
router.post(
  "/",
  authenticate,
  uploadProductFiles,
  parseJsonFields([
    "textileDetails",
    "dimensions",
    "specifications",
    "certifications",
    "storageLocations",
  ]),
  async (req, res) => {
    try {
      // Only suppliers can create inventory
      if (req.user.role !== "supplier") {
        return res.status(403).json({
          success: false,
          message: "Only suppliers can create inventory items",
        });
      }

      const inventory = await inventoryService.createInventoryItem(
        req.body,
        req.user.userId,
        req.files
      );

      logger.info("Inventory item created via API", {
        inventoryId: inventory._id,
        userId: req.user.userId,
      });

      res.status(201).json({
        success: true,
        message: "Inventory item created successfully",
        data: inventory,
      });
    } catch (error) {
      logger.error("Error in POST /inventory:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error creating inventory item",
      });
    }
  }
);

// ========================================
// GET ALL INVENTORY ITEMS
// ========================================
router.get("/", authenticate, async (req, res) => {
  try {
    const filters = {
      supplierId: req.query.supplierId,
      category: req.query.category,
      subcategory: req.query.subcategory,
      status: req.query.status,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
      search: req.query.search,
      lowStock: req.query.lowStock,
    };

    const options = {
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
    };

    // If supplier, filter by their ID
    if (req.user.role === "supplier") {
      filters.supplierId = req.user.userId;
    }

    const result = await inventoryService.getAllInventory(filters, options);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Error in GET /inventory:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching inventory",
    });
  }
});

// ========================================
// GET SUPPLIER'S INVENTORY
// ========================================
router.get("/my-inventory", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "supplier") {
      return res.status(403).json({
        success: false,
        message: "Only suppliers can access this endpoint",
      });
    }

    const filters = {
      supplierId: req.user.userId,
      category: req.query.category,
      status: req.query.status,
      lowStock: req.query.lowStock,
    };

    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 20,
      sortBy: req.query.sortBy || "createdAt",
      sortOrder: req.query.sortOrder || "desc",
    };

    const result = await inventoryService.getAllInventory(filters, options);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Error in GET /inventory/my-inventory:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching inventory",
    });
  }
});

// ========================================
// GET LOW STOCK ITEMS
// ========================================
router.get("/low-stock", authenticate, async (req, res) => {
  try {
    let supplierId = null;

    // If supplier, only show their low stock items
    if (req.user.role === "supplier") {
      supplierId = req.user.userId;
    } else if (req.query.supplierId) {
      supplierId = req.query.supplierId;
    }

    const items = await inventoryService.getLowStockItems(supplierId);

    res.json({
      success: true,
      data: items,
      count: items.length,
    });
  } catch (error) {
    logger.error("Error in GET /inventory/low-stock:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching low stock items",
    });
  }
});

// ========================================
// GET INVENTORY ANALYTICS
// ========================================
router.get("/analytics", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "supplier" && req.user.role !== "expert") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const supplierId =
      req.user.role === "supplier" ? req.user.userId : req.query.supplierId;

    if (!supplierId) {
      return res.status(400).json({
        success: false,
        message: "Supplier ID is required",
      });
    }

    const analytics = await inventoryService.getInventoryAnalytics(supplierId);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error("Error in GET /inventory/analytics:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching analytics",
    });
  }
});

// ========================================
// SEARCH INVENTORY
// ========================================
router.get("/search", authenticate, async (req, res) => {
  try {
    const { q, category, subcategory } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const filters = {};
    if (category) filters.category = category;
    if (subcategory) filters.subcategory = subcategory;

    const results = await inventoryService.searchInventory(q, filters);

    res.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    logger.error("Error in GET /inventory/search:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error searching inventory",
    });
  }
});

// ========================================
// GET INVENTORY BY ID
// ========================================
router.get("/:id", authenticate, async (req, res) => {
  try {
    const inventory = await inventoryService.getInventoryById(req.params.id);

    res.json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    logger.error("Error in GET /inventory/:id:", error);
    res.status(404).json({
      success: false,
      message: error.message || "Inventory item not found",
    });
  }
});

// ========================================
// GET INVENTORY HISTORY (Blockchain)
// ========================================
router.get("/:id/history", authenticate, async (req, res) => {
  try {
    const history = await inventoryService.getInventoryHistory(req.params.id);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    logger.error("Error in GET /inventory/:id/history:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching inventory history",
    });
  }
});

// ========================================
// UPDATE INVENTORY ITEM
// ========================================
router.put(
  "/:id",
  authenticate,
  uploadProductFiles,
  parseJsonFields([
    "textileDetails",
    "dimensions",
    "specifications",
    "certifications",
  ]),
  async (req, res) => {
    try {
      if (req.user.role !== "supplier") {
        return res.status(403).json({
          success: false,
          message: "Only suppliers can update inventory",
        });
      }

      const inventory = await inventoryService.updateInventoryItem(
        req.params.id,
        req.user.userId,
        req.body,
        req.files
      );

      res.json({
        success: true,
        message: "Inventory item updated successfully",
        data: inventory,
      });
    } catch (error) {
      logger.error("Error in PUT /inventory/:id:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error updating inventory item",
      });
    }
  }
);

// ========================================
// DELETE INVENTORY ITEM
// ========================================
router.delete("/:id", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "supplier") {
      return res.status(403).json({
        success: false,
        message: "Only suppliers can delete inventory",
      });
    }

    const result = await inventoryService.deleteInventoryItem(
      req.params.id,
      req.user.userId
    );

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    logger.error("Error in DELETE /inventory/:id:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error deleting inventory item",
    });
  }
});

// ========================================
// ADD STOCK (Restock)
// ========================================
router.post("/:id/add-stock", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "supplier") {
      return res.status(403).json({
        success: false,
        message: "Only suppliers can add stock",
      });
    }

    const { quantity, notes, batchData } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid quantity is required",
      });
    }

    const inventory = await inventoryService.addStock(
      req.params.id,
      req.user.userId,
      Number(quantity),
      notes,
      batchData
    );

    res.json({
      success: true,
      message: "Stock added successfully",
      data: inventory,
    });
  } catch (error) {
    logger.error("Error in POST /inventory/:id/add-stock:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error adding stock",
    });
  }
});

// ========================================
// REDUCE STOCK
// ========================================
router.post("/:id/reduce-stock", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "supplier") {
      return res.status(403).json({
        success: false,
        message: "Only suppliers can reduce stock",
      });
    }

    const { quantity, reason, notes } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid quantity is required",
      });
    }

    const inventory = await inventoryService.reduceStock(
      req.params.id,
      req.user.userId,
      Number(quantity),
      reason || "adjustment",
      notes
    );

    res.json({
      success: true,
      message: "Stock reduced successfully",
      data: inventory,
    });
  } catch (error) {
    logger.error("Error in POST /inventory/:id/reduce-stock:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error reducing stock",
    });
  }
});

// ========================================
// SELL TO VENDOR
// ========================================
router.post("/:id/sell-to-vendor", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "supplier") {
      return res.status(403).json({
        success: false,
        message: "Only suppliers can sell inventory",
      });
    }

    const { vendorId, quantity, price } = req.body;

    if (!vendorId || !quantity || !price) {
      return res.status(400).json({
        success: false,
        message: "Vendor ID, quantity, and price are required",
      });
    }

    const result = await inventoryService.sellToVendor(
      req.params.id,
      vendorId,
      Number(quantity),
      Number(price)
    );

    res.json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    logger.error("Error in POST /inventory/:id/sell-to-vendor:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error selling inventory",
    });
  }
});

// ========================================
// ADD QUALITY CHECK
// ========================================
router.post("/:id/quality-check", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "supplier" && req.user.role !== "expert") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const checkData = req.body;

    if (!checkData.status || !checkData.checkedQuantity) {
      return res.status(400).json({
        success: false,
        message: "Status and checked quantity are required",
      });
    }

    const inventory = await inventoryService.addQualityCheck(
      req.params.id,
      req.user.userId,
      checkData
    );

    res.json({
      success: true,
      message: "Quality check added successfully",
      data: inventory,
    });
  } catch (error) {
    logger.error("Error in POST /inventory/:id/quality-check:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error adding quality check",
    });
  }
});

// ========================================
// RESERVE QUANTITY
// ========================================
router.post("/:id/reserve", authenticate, async (req, res) => {
  try {
    const { quantity, orderId } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid quantity is required",
      });
    }

    const inventory = await inventoryService.reserveQuantity(
      req.params.id,
      Number(quantity),
      orderId
    );

    res.json({
      success: true,
      message: "Quantity reserved successfully",
      data: inventory,
    });
  } catch (error) {
    logger.error("Error in POST /inventory/:id/reserve:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error reserving quantity",
    });
  }
});

// ========================================
// RELEASE RESERVED QUANTITY
// ========================================
router.post("/:id/release", authenticate, async (req, res) => {
  try {
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid quantity is required",
      });
    }

    const inventory = await inventoryService.releaseReservedQuantity(
      req.params.id,
      Number(quantity)
    );

    res.json({
      success: true,
      message: "Reserved quantity released successfully",
      data: inventory,
    });
  } catch (error) {
    logger.error("Error in POST /inventory/:id/release:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error releasing quantity",
    });
  }
});

export default router;
