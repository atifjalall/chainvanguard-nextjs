import express from "express";
import inventoryService from "../services/inventory.service.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";
import { uploadProductFiles } from "../middleware/upload.middleware.js";
import { parseJsonFields } from "../middleware/parse-json-fields.js";
import logger from "../utils/logger.js";
import { initializeSafeMode, queryCollection, countDocuments } from "../utils/safeMode/lokiService.js";

const router = express.Router();

// ========================================
// IMPORTANT: SPECIFIC ROUTES MUST COME BEFORE PARAMETERIZED ROUTES
// ========================================

// ========================================
// GET ALL INVENTORY ITEMS
// ========================================
router.get("/", authenticate, async (req, res) => {
  try {
    // SAFE MODE: Load from LokiJS backup
    if (req.safeMode) {
      await initializeSafeMode(req.user.userId, 100);

      // Build query - if supplier, only show their inventory
      const query = {};
      if (req.user.role === "supplier") {
        query.supplierId = req.user.userId;
      } else if (req.query.supplierId) {
        query.supplierId = req.query.supplierId;
      }

      if (req.query.category) query.category = req.query.category;
      if (req.query.status) query.status = req.query.status;

      // Query LokiJS
      let inventory = queryCollection(req.user.userId, 'inventory', query);

      // Apply lowStock filter manually
      if (req.query.lowStock === 'true') {
        inventory = inventory.filter(i => i.quantity <= (i.lowStockThreshold || 10));
      }

      // Sorting and pagination
      const sortBy = req.query.sortBy || 'createdAt';
      const sortOrder = req.query.sortOrder || 'desc';
      inventory.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
      });

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      const total = inventory.length;
      const paginatedInventory = inventory.slice(skip, skip + limit);

      return res.json({
        success: true,
        safeMode: true,
        data: paginatedInventory,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
        warning: 'Viewing backup data. Some filters may be limited during maintenance.'
      });
    }

    // NORMAL MODE: Full MongoDB access
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

    // Return items and pagination at top-level for frontend compatibility
    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
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
// Now supports safe mode - falls back to backup data when MongoDB is down
// ========================================
router.get("/my-inventory", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "supplier") {
      return res.status(403).json({
        success: false,
        message: "Only suppliers can access this endpoint",
      });
    }

    // Check if in safe mode
    if (req.safeMode) {
      console.warn('⚠️  Safe mode active - using LokiJS for inventory');

      // Initialize safe mode (loads data into LokiJS from IPFS/Redis cache)
      await initializeSafeMode(req.user.userId, 100);

      // Build query
      const query = { supplierId: req.user.userId };

      if (req.query.category) {
        query.category = req.query.category;
      }
      if (req.query.status) {
        query.status = req.query.status;
      }

      // Query LokiJS first for basic filters
      let inventory = queryCollection(req.user.userId, 'inventory', query);

      // Apply lowStock filter manually (requires comparison logic)
      if (req.query.lowStock === 'true') {
        inventory = inventory.filter(i => i.quantity <= (i.lowStockThreshold || 10));
      }

      // Manual sorting and pagination
      const sortBy = req.query.sortBy || 'createdAt';
      const sortOrder = req.query.sortOrder || 'desc';
      inventory.sort((a, b) => {
        const aVal = a[sortBy] || a.createdAt;
        const bVal = b[sortBy] || b.createdAt;
        return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
      });

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      const total = inventory.length;
      const paginatedInventory = inventory.slice(skip, skip + limit);

      return res.json({
        success: true,
        data: paginatedInventory,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
        safeMode: true,
        warning: 'Viewing backup data from last snapshot. Data may not be up-to-date.',
      });
    }

    // Normal mode - MongoDB is healthy
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
      data: result.items,
      pagination: result.pagination,
      safeMode: false,
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
// GET INVENTORY STATS (Global)
// ========================================
router.get("/stats", authenticate, async (req, res) => {
  try {
    if (
      req.user.role !== "supplier" &&
      req.user.role !== "expert" &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // If supplier, get their stats only; otherwise get global stats
    const supplierId = req.user.role === "supplier" ? req.user.userId : null;
    const stats = await inventoryService.getInventoryStats(supplierId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("Error in GET /inventory/stats:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching inventory stats",
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
// GET VENDOR'S CURRENT INVENTORY
// ========================================
router.get(
  "/vendor/current",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const Order = (await import("../models/Order.js")).default;

      // Get all delivered orders where vendor was buyer
      const orders = await Order.find({
        customerId: req.userId,
        sellerRole: "supplier",
        status: { $in: ["delivered", "completed"] },
      })
        .populate("sellerId", "name companyName")
        .populate("items.productId")
        .sort({ createdAt: -1 });

      // Calculate inventory summary
      const inventoryMap = new Map();

      orders.forEach((order) => {
        order.items.forEach((item) => {
          if (!item.productId) return;

          const key = item.productId._id.toString();

          if (!inventoryMap.has(key)) {
            inventoryMap.set(key, {
              product: item.productId,
              supplier: order.sellerId,
              totalReceived: 0,
              lastPurchaseDate: order.createdAt,
              totalSpent: 0,
            });
          }

          const entry = inventoryMap.get(key);
          entry.totalReceived += item.quantity;
          entry.totalSpent += item.subtotal;

          if (order.createdAt > entry.lastPurchaseDate) {
            entry.lastPurchaseDate = order.createdAt;
          }
        });
      });

      const currentInventory = Array.from(inventoryMap.values());

      res.json({
        success: true,
        inventory: currentInventory,
        summary: {
          totalItems: currentInventory.length,
          totalOrders: orders.length,
          totalSpent: currentInventory.reduce(
            (sum, item) => sum + item.totalSpent,
            0
          ),
        },
      });
    } catch (error) {
      console.error("❌ GET /api/inventory/vendor/current error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get current inventory",
      });
    }
  }
);

// ========================================
// SCAN INVENTORY QR CODE (PUBLIC)
// ========================================
router.post("/inventory/scan", async (req, res) => {
  try {
    const { qrCode, location, device, purpose, notes } = req.body;

    if (!qrCode) {
      return res.status(400).json({
        success: false,
        message: "QR code is required",
      });
    }

    const result = await inventoryService.scanInventoryQR(qrCode, {
      scannedBy: req.userId || null,
      scannerRole: req.user?.role || "guest",
      location,
      device,
      ipAddress: req.ip,
      purpose,
      notes,
    });

    res.json(result);
  } catch (error) {
    console.error("Error scanning inventory QR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to scan QR code",
    });
  }
});

// ========================================
// TRACK INVENTORY VIA QR CODE (PUBLIC)
// ========================================
router.get("/inventory/track/:qrCode", async (req, res) => {
  try {
    const result = await inventoryService.trackInventoryByQR(req.params.qrCode);

    res.json(result);
  } catch (error) {
    console.error("Error tracking inventory:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to track inventory",
    });
  }
});

// ========================================
// PARAMETERIZED ROUTES - MUST COME LAST
// ========================================

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
// GENERATE QR CODE FOR INVENTORY
// ========================================
router.post(
  "/:id/generate-qr",
  authenticate,
  authorizeRoles("supplier"),
  async (req, res) => {
    try {
      const result = await inventoryService.generateInventoryQR(
        req.params.id,
        req.user.userId
      );

      res.json(result);
    } catch (error) {
      console.error("Error generating inventory QR:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to generate QR code",
      });
    }
  }
);

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
    "supplierContact",
    "tags",
    "suitableFor",
    "sustainabilityCertifications",
    "complianceStandards",
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

      // ✅ LOG TO DEBUG
      logger.info("📥 Received inventory creation request", {
        userId: req.user.userId,
        name: req.body.name,
        filesReceived: req.files?.images?.length || 0,
        hasFiles: !!req.files,
        filesStructure: req.files ? Object.keys(req.files) : [],
      });

      // Prepare inventory data
      const inventoryData = { ...req.body };

      let uploadedImages = [];

      if (req.files?.images && req.files.images.length > 0) {
        try {
          const cloudinaryService = (
            await import("../services/cloudinary.service.js")
          ).default;

          logger.info(
            `📤 Uploading ${req.files.images.length} images to Cloudinary...`
          );

          const uploadResults = await cloudinaryService.uploadMultipleImages(
            req.files.images,
            "inventory"
          );

          // Format images correctly for the database
          uploadedImages = uploadResults.map((result, index) => ({
            url: result.url,
            cloudinaryId: result.publicId,
            publicId: result.publicId,
            isMain: index === 0,
            viewType: index === 0 ? "front" : "detail",
          }));

          logger.info(
            `✅ Successfully uploaded ${uploadedImages.length} images`,
            {
              firstImageUrl: uploadedImages[0]?.url,
              allUrls: uploadedImages.map((img) => img.url),
            }
          );
        } catch (uploadError) {
          logger.error("❌ Image upload failed:", uploadError);
          return res.status(500).json({
            success: false,
            message: "Failed to upload images",
            error: uploadError.message,
          });
        }
      } else {
        logger.warn("⚠️  No image files received in request", {
          reqFiles: req.files,
          reqFilesKeys: req.files ? Object.keys(req.files) : [],
        });
      }

      // ✅ ASSIGN UPLOADED IMAGES TO INVENTORY DATA
      inventoryData.images = uploadedImages;

      // Set supplier info from authenticated user
      inventoryData.supplierId = req.user.userId;
      inventoryData.supplierName = req.user.name;
      inventoryData.supplierWalletAddress = req.user.walletAddress;

      logger.info(
        `📦 Creating inventory with ${inventoryData.images.length} images`,
        {
          hasImages: inventoryData.images.length > 0,
          imageCount: inventoryData.images.length,
        }
      );

      // ✅ CREATE INVENTORY (images already in inventoryData)
      const inventory = await inventoryService.createInventoryItem(
        inventoryData,
        req.user.userId
      );

      logger.info("✅ Inventory item created successfully", {
        inventoryId: inventory._id,
        userId: req.user.userId,
        finalImageCount: inventory.images?.length || 0,
        finalImages: inventory.images?.map((img) => img.url),
      });

      res.status(201).json({
        success: true,
        message: "Inventory item created successfully",
        data: inventory,
      });
    } catch (error) {
      logger.error("❌ Error in POST /inventory:", {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
      });

      res.status(500).json({
        success: false,
        message: error.message || "Error creating inventory item",
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
);

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
    "supplierContact",
    "storageLocations",
    "tags",
    "suitableFor",
    "imagesToDelete", // Add this
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

    const { vendorId, quantity, pricePerUnit } = req.body;

    if (!vendorId || !quantity || !pricePerUnit) {
      return res.status(400).json({
        success: false,
        message: "Vendor ID, quantity, and price per unit are required",
      });
    }

    const result = await inventoryService.sellToVendor(
      req.params.id,
      vendorId,
      Number(quantity),
      Number(pricePerUnit)
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
