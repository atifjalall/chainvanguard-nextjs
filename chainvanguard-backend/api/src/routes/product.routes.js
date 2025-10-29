import express from "express";
import productService from "../services/product.service.js";
import { parseJsonFields } from "../middleware/parse-json-fields.js";
import {
  verifyToken,
  checkRole,
  requireVerification,
} from "../middleware/auth.middleware.js";
import {
  uploadProductFiles,
  handleUploadError,
} from "../middleware/upload.middleware.js";

const router = express.Router();

// ========================================
// PUBLIC ROUTES (No authentication required)
// ========================================

/**
 * GET /api/products
 * Get all products with advanced filters
 * Query params: page, limit, search, category, subcategory, size, color,
 * minPrice, maxPrice, status, isFeatured, sortBy, sortOrder
 */
router.get("/", async (req, res) => {
  try {
    const filters = {
      // Pagination
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,

      // Search
      search: req.query.search,

      // Category filters
      category: req.query.category,
      subcategory: req.query.subcategory,
      productType: req.query.productType,

      // Apparel filters
      size: req.query.size,
      color: req.query.color,
      material: req.query.material,
      fit: req.query.fit,
      pattern: req.query.pattern,
      brand: req.query.brand,

      // Price range
      minPrice: parseFloat(req.query.minPrice) || undefined,
      maxPrice: parseFloat(req.query.maxPrice) || undefined,

      // Status filters
      status: req.query.status || "active",
      isFeatured: req.query.isFeatured === "true" ? true : undefined,
      isVerified: req.query.isVerified === "true" ? true : undefined,

      // Seller filter
      sellerId: req.query.sellerId,
      sellerRole: req.query.sellerRole,

      // Sustainability filters
      isOrganic: req.query.isOrganic === "true" ? true : undefined,
      isFairTrade: req.query.isFairTrade === "true" ? true : undefined,
      isRecycled: req.query.isRecycled === "true" ? true : undefined,

      // Sort
      sortBy: req.query.sortBy || "createdAt",
      sortOrder: req.query.sortOrder || "desc",

      // Tags
      tags: req.query.tags,
    };

    const result = await productService.getAllProducts(filters);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("GET /api/products error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

/**
 * GET /api/products/featured
 * Get featured products
 */
router.get("/featured", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;

    const products = await productService.getFeaturedProducts(limit, category);

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("GET /api/products/featured error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/products/new-arrivals
 * Get newest products
 */
router.get("/new-arrivals", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const category = req.query.category;

    const products = await productService.getNewArrivals(limit, category);

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("GET /api/products/new-arrivals error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/products/trending
 * Get trending products (most sold/viewed)
 */
router.get("/trending", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const timeframe = req.query.timeframe || "week"; // week, month, all

    const products = await productService.getTrendingProducts(limit, timeframe);

    res.json({
      success: true,
      count: products.length,
      timeframe,
      products,
    });
  } catch (error) {
    console.error("GET /api/products/trending error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/products/search
 * Search products with text query
 */
router.get("/search", async (req, res) => {
  try {
    const { q, ...filters } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search query 'q' is required",
      });
    }

    const result = await productService.searchProducts(q, {
      ...filters,
      page: parseInt(filters.page) || 1,
      limit: parseInt(filters.limit) || 20,
    });

    res.json({
      success: true,
      query: q,
      ...result,
    });
  } catch (error) {
    console.error("GET /api/products/search error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/products/low-stock
 * Get low stock products (Protected - Seller only)
 */
router.get(
  "/low-stock",
  verifyToken,
  checkRole("vendor", "supplier", "expert"),
  async (req, res) => {
    try {
      const sellerId = req.userRole === "expert" ? undefined : req.userId;
      const products = await productService.getLowStockProducts(sellerId);

      res.json({
        success: true,
        count: products.length,
        products,
      });
    } catch (error) {
      console.error("GET /api/products/low-stock error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/products/by-category/:category
 * Get products by category
 */
router.get("/by-category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const filters = {
      ...req.query,
      category,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
    };

    const result = await productService.getProductsByCategory(
      category,
      filters
    );

    res.json({
      success: true,
      category,
      ...result,
    });
  } catch (error) {
    console.error("GET /api/products/by-category error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/products/by-seller/:sellerId
 * Get products by seller
 */
router.get("/by-seller/:sellerId", async (req, res) => {
  try {
    const { sellerId } = req.params;
    const filters = {
      ...req.query,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sortBy: req.query.sortBy || "createdAt",
      sortOrder: req.query.sortOrder || "desc",
    };

    const result = await productService.getSellerProducts(sellerId, filters);

    res.json({
      success: true,
      sellerId,
      ...result,
    });
  } catch (error) {
    console.error("GET /api/products/by-seller error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/products/:id
 * Get single product by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const incrementView = req.query.view === "true";

    const product = await productService.getProductById(id, incrementView);

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("GET /api/products/:id error:", error);

    if (error.message === "Product not found") {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/products/:id/history
 * Get product blockchain history
 */
router.get("/:id/history", async (req, res) => {
  try {
    const { id } = req.params;
    const history = await productService.getProductHistory(id);

    res.json({
      success: true,
      productId: id,
      ...history,
    });
  } catch (error) {
    console.error("GET /api/products/:id/history error:", error);

    if (error.message === "Product not found") {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/products/:id/related
 * Get related products
 */
router.get("/:id/related", async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 8;

    const products = await productService.getRelatedProducts(id, limit);

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("GET /api/products/:id/related error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// PROTECTED ROUTES (Authentication required)

/**
 * POST /api/products
 * Create new product (Vendors & Suppliers only)
 */
router.post(
  "/",
  verifyToken,
  requireVerification,
  checkRole("vendor", "supplier"),
  uploadProductFiles,
  parseJsonFields(["apparelDetails"]),
  handleUploadError,
  async (req, res) => {
    try {
      // Validate required fields
      const requiredFields = [
        "name",
        "description",
        "category",
        "subcategory",
        "price",
        "quantity",
      ];

      const missingFields = requiredFields.filter((field) => !req.body[field]);

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
          missingFields,
        });
      }

      // Validate apparel-specific fields
      if (!req.body.apparelDetails?.size) {
        return res.status(400).json({
          success: false,
          message: "Size is required for apparel products",
        });
      }

      if (!req.body.apparelDetails?.color) {
        return res.status(400).json({
          success: false,
          message: "Color is required for apparel products",
        });
      }

      if (!req.body.apparelDetails?.material) {
        return res.status(400).json({
          success: false,
          message: "Material is required for apparel products",
        });
      }

      // Create product
      const result = await productService.createProduct(
        req.body,
        req.files,
        req.userId
      );

      res.status(201).json(result);
    } catch (error) {
      console.error("POST /api/products error:", error);

      if (error.message.includes("validation failed")) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          error: error.message,
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
 * PUT /api/products/:id
 * Update product (Owner only)
 */
router.put(
  "/:id",
  verifyToken,
  requireVerification,
  checkRole("vendor", "supplier"),
  uploadProductFiles,
  parseJsonFields(["apparelDetails"]),
  handleUploadError,
  async (req, res) => {
    try {
      console.log("========================================");
      console.log("📝 UPDATE PRODUCT REQUEST");
      console.log("========================================");
      console.log("Product ID:", req.params.id);
      console.log("User ID:", req.userId);

      // Log files
      if (req.files) {
        console.log("📁 Files received:");
        Object.keys(req.files).forEach((key) => {
          console.log(`  - ${key}: ${req.files[key].length} files`);
          req.files[key].forEach((file, idx) => {
            console.log(
              `    ${idx + 1}. ${file.originalname} (${(file.size / 1024).toFixed(2)} KB)`
            );
          });
        });
      } else {
        console.log("📁 No files received");
      }

      // Log body keys
      console.log("📄 Body fields:", Object.keys(req.body));

      // Parse arrays
      if (req.body["tags[]"]) {
        req.body.tags = Array.isArray(req.body["tags[]"])
          ? req.body["tags[]"]
          : [req.body["tags[]"]];
        delete req.body["tags[]"];
      }

      if (req.body["certifications[]"]) {
        req.body.certifications = Array.isArray(req.body["certifications[]"])
          ? req.body["certifications[]"]
          : [req.body["certifications[]"]];
        delete req.body["certifications[]"];
      }

      if (req.body["removeImages[]"]) {
        req.body.removeImages = Array.isArray(req.body["removeImages[]"])
          ? req.body["removeImages[]"]
          : [req.body["removeImages[]"]];
        delete req.body["removeImages[]"];
        console.log("🗑️  Images to remove:", req.body.removeImages);
      }

      console.log("========================================");

      const product = await productService.updateProduct(
        req.params.id,
        req.body,
        req.files,
        req.userId
      );

      console.log("✅ Product update completed successfully");
      console.log("========================================");

      res.json({
        success: true,
        message: "Product updated successfully",
        product,
      });
    } catch (error) {
      console.error("❌ PUT /api/products/:id error:", error);

      if (error.message === "Product not found") {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      if (
        error.message.includes("Unauthorized") ||
        error.message.includes("not authorized")
      ) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to update this product",
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
 * PATCH /api/products/:id/stock
 * Update product stock quantity (Owner only)
 */
router.patch(
  "/:id/stock",
  verifyToken,
  requireVerification,
  checkRole("vendor", "supplier"),
  async (req, res) => {
    try {
      const { quantity } = req.body;

      if (quantity === undefined || quantity < 0) {
        return res.status(400).json({
          success: false,
          message: "Valid quantity is required",
        });
      }

      const product = await productService.updateStock(
        req.params.id,
        quantity,
        req.userId
      );

      res.json({
        success: true,
        message: "Stock updated successfully",
        product: {
          id: product._id,
          name: product.name,
          quantity: product.quantity,
          availableQuantity: product.availableQuantity,
          stockStatus: product.stockStatus,
        },
      });
    } catch (error) {
      console.error("PATCH /api/products/:id/stock error:", error);

      if (error.message === "Product not found") {
        return res.status(404).json({
          success: false,
          message: "Product not found",
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
 * PATCH /api/products/:id/status
 * Update product status (Owner only)
 */
router.patch(
  "/:id/status",
  verifyToken,
  requireVerification,
  checkRole("vendor", "supplier", "expert"),
  async (req, res) => {
    try {
      const { status } = req.body;
      const validStatuses = [
        "draft",
        "active",
        "out_of_stock",
        "discontinued",
        "pending_verification",
        "archived",
      ];

      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Valid status is required",
          validStatuses,
        });
      }

      const product = await productService.updateProductStatus(
        req.params.id,
        status,
        req.userId,
        req.userRole
      );

      res.json({
        success: true,
        message: "Product status updated successfully",
        product: {
          id: product._id,
          name: product.name,
          status: product.status,
        },
      });
    } catch (error) {
      console.error("PATCH /api/products/:id/status error:", error);

      if (error.message === "Product not found") {
        return res.status(404).json({
          success: false,
          message: "Product not found",
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
 * POST /api/products/:id/images
 * Upload additional product images
 */
router.post(
  "/:id/images",
  verifyToken,
  requireVerification,
  checkRole("vendor", "supplier"),
  uploadProductFiles,
  handleUploadError,
  async (req, res) => {
    try {
      if (!req.files || !req.files.images) {
        return res.status(400).json({
          success: false,
          message: "No images provided",
        });
      }

      const product = await productService.addProductImages(
        req.params.id,
        req.files.images,
        req.userId
      );

      res.json({
        success: true,
        message: "Images uploaded successfully",
        images: product.images,
      });
    } catch (error) {
      console.error("POST /api/products/:id/images error:", error);

      if (error.message === "Product not found") {
        return res.status(404).json({
          success: false,
          message: "Product not found",
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
 * DELETE /api/products/:id/images/:imageId
 * Delete a product image
 */
router.delete(
  "/:id/images/:imageId",
  verifyToken,
  requireVerification,
  checkRole("vendor", "supplier"),
  async (req, res) => {
    try {
      const product = await productService.deleteProductImage(
        req.params.id,
        req.params.imageId,
        req.userId
      );

      res.json({
        success: true,
        message: "Image deleted successfully",
        images: product.images,
      });
    } catch (error) {
      console.error("DELETE /api/products/:id/images/:imageId error:", error);

      if (error.message === "Product not found") {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      if (error.message === "Image not found") {
        return res.status(404).json({
          success: false,
          message: "Image not found",
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
 * DELETE /api/products/:id
 * Delete product (soft delete - mark as archived)
 */
router.delete(
  "/:id",
  verifyToken,
  requireVerification,
  checkRole("vendor", "supplier", "expert"),
  async (req, res) => {
    try {
      const hardDelete = req.query.hard === "true" && req.userRole === "expert";

      const result = await productService.deleteProduct(
        req.params.id,
        req.userId,
        req.userRole,
        hardDelete
      );

      res.json(result);
    } catch (error) {
      console.error("DELETE /api/products/:id error:", error);

      if (error.message === "Product not found") {
        return res.status(404).json({
          success: false,
          message: "Product not found",
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
 * POST /api/products/:id/verify
 * Verify product (Expert only)
 */
router.post(
  "/:id/verify",
  verifyToken,
  checkRole("expert"),
  async (req, res) => {
    try {
      const product = await productService.verifyProduct(
        req.params.id,
        req.userId
      );

      res.json({
        success: true,
        message: "Product verified successfully",
        product: {
          id: product._id,
          name: product.name,
          isVerified: product.isVerified,
          blockchainVerified: product.blockchainVerified,
        },
      });
    } catch (error) {
      console.error("POST /api/products/:id/verify error:", error);

      if (error.message === "Product not found") {
        return res.status(404).json({
          success: false,
          message: "Product not found",
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
 * GET /api/products/stats/overview
 * Get product statistics (Protected)
 */
router.get(
  "/stats/overview",
  verifyToken,
  checkRole("vendor", "supplier", "expert"),
  async (req, res) => {
    try {
      const sellerId = req.userRole === "expert" ? undefined : req.userId;
      const stats = await productService.getProductStats(sellerId);

      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      console.error("GET /api/products/stats/overview error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

export default router;
