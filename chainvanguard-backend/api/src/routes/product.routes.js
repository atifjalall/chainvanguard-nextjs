import express from "express";
import mongoose from "mongoose";
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

import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { initializeSafeMode, queryCollection, countDocuments } from "../utils/safeMode/lokiService.js";

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
    // SAFE MODE: Simplified product listing (requires sellerId)
    if (req.safeMode) {
      const sellerId = req.query.sellerId || req.userId;

      if (!sellerId) {
        return res.status(400).json({
          success: false,
          message: "Seller ID required for product listing in safe mode",
          safeMode: true,
          note: "Please filter by specific seller in safe mode"
        });
      }

      await initializeSafeMode(sellerId, 100);

      // Build simple query
      const query = { sellerId };
      if (req.query.category) {
        query.category = req.query.category;
      }
      if (req.query.status) {
        query.status = req.query.status;
      }

      // Get products with pagination
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      const sortBy = req.query.sortBy || 'createdAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

      const options = {
        sort: { [sortBy]: sortOrder },
        skip,
        limit
      };

      const products = queryCollection(sellerId, 'products', query, options);
      const total = countDocuments(sellerId, 'products', query);

      return res.json({
        success: true,
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        safeMode: true,
        warning: 'Viewing backup data. Some filters not available in safe mode.'
      });
    }

    // NORMAL MODE: Full filtering
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
      isNewArrival: req.query.isNewArrival === "true" ? true : undefined,
      isBestseller: req.query.isBestseller === "true" ? true : undefined,
      isVerified: req.query.isVerified === "true" ? true : undefined,

      // Season filter
      season: req.query.season,

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
      // SAFE MODE: Extract from backup if MongoDB is down
      if (req.safeMode) {
        const sellerId = req.userRole === "expert" ? undefined : req.userId;

        // If expert, cannot view all products in safe mode (would need full backup scan)
        if (!sellerId) {
          return res.json({
            success: true,
            count: 0,
            products: [],
            safeMode: true,
            warning: 'Expert view of all products not available in safe mode. Only individual seller data is accessible.'
          });
        }

        // Initialize safe mode
        await initializeSafeMode(sellerId, 100);

        // Query LokiJS for seller's products
        const query = { sellerId };
        let products = queryCollection(sellerId, 'products', query);

        // Filter for low stock manually (requires comparison logic)
        const lowStockProducts = products.filter(p => {
          const threshold = p.lowStockThreshold || 10;
          return p.stockQuantity < threshold;
        });

        return res.json({
          success: true,
          count: lowStockProducts.length,
          products: lowStockProducts,
          safeMode: true,
          warning: 'Viewing backup data from last snapshot. Write operations are disabled during maintenance.'
        });
      }

      // NORMAL MODE: Query MongoDB
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

    // SAFE MODE: Query LokiJS in-memory database
    if (req.safeMode) {
      await initializeSafeMode(sellerId, 100);

      // Build query
      const query = { sellerId };
      if (req.query.category) {
        query.category = req.query.category;
      }
      if (req.query.status) {
        query.status = req.query.status;
      }

      // Build options
      const sortBy = req.query.sortBy || 'createdAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const options = {
        sort: { [sortBy]: sortOrder },
        skip,
        limit
      };

      // Query LokiJS
      const products = queryCollection(sellerId, 'products', query, options);
      const total = countDocuments(sellerId, 'products', query);

      return res.json({
        success: true,
        sellerId,
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        safeMode: true,
        warning: 'Viewing backup data from last snapshot. Write operations are disabled during maintenance.'
      });
    }

    // NORMAL MODE: Query MongoDB
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

    // SAFE MODE: Query LokiJS (read-only, no view increment)
    if (req.safeMode) {
      // Try to determine sellerId from query or use first available product
      // In safe mode, we need to know which user's data to query
      const sellerId = req.query.sellerId || req.userId;

      if (!sellerId) {
        return res.status(400).json({
          success: false,
          message: "Seller ID required in safe mode",
          safeMode: true
        });
      }

      await initializeSafeMode(sellerId, 100);

      // Query LokiJS for the specific product
      const products = queryCollection(sellerId, 'products', { _id: id });
      const product = products.length > 0 ? products[0] : null;

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found in backup",
          safeMode: true
        });
      }

      return res.json({
        success: true,
        product,
        safeMode: true,
        warning: 'Viewing backup data. View count not updated during maintenance.'
      });
    }

    // NORMAL MODE: Query MongoDB with view increment
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
    const result = await productService.getProductHistory(id);

    // Check if we got a response (success or failure)
    if (result.success === false && result.message === "Product not found") {
      return res.status(404).json(result);
    }

    // Return the result (success: true with history, or success: false with error)
    const statusCode = result.success ? 200 : 500;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error("GET /api/products/:id/history error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve product history",
      error: error.message,
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

/**
 * GET /api/products/vendor/:vendorId/store
 * Get vendor's public storefront information
 * Access: Public (no auth required)
 */
/**
 * GET /api/products/vendor/:vendorId/store
 * Get vendor's public storefront information
 * Access: Public (no auth required)
 */
router.get("/vendor/:vendorId/store", async (req, res) => {
  try {
    const vendor = await User.findById(req.params.vendorId).select(
      "name companyName email phone city state country businessType vendorSettings createdAt role"
    );

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    if (vendor.role !== "vendor") {
      return res.status(404).json({
        success: false,
        message: "User is not a vendor",
      });
    }

    // Get vendor statistics
    const [productCount, totalSales, recentOrders, avgRating] =
      await Promise.all([
        // Count ALL products by this vendor (not just active ones)
        Product.countDocuments({
          $or: [
            { seller: req.params.vendorId },
            { seller: new mongoose.Types.ObjectId(req.params.vendorId) },
            { sellerId: req.params.vendorId },
            { sellerId: new mongoose.Types.ObjectId(req.params.vendorId) },
            { vendorId: req.params.vendorId },
            { vendorId: new mongoose.Types.ObjectId(req.params.vendorId) },
          ],
        }),

        // Count delivered orders
        Order.aggregate([
          {
            $match: {
              sellerId: new mongoose.Types.ObjectId(req.params.vendorId),
              status: "delivered",
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              totalRevenue: { $sum: "$total" },
            },
          },
        ]),

        // Get recent orders count (last 30 days)
        Order.countDocuments({
          sellerId: new mongoose.Types.ObjectId(req.params.vendorId),
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        }),

        // TODO: Calculate from reviews when review system is implemented
        Promise.resolve(4.5),
      ]);

    console.log("📊 Vendor Stats:", {
      vendorId: req.params.vendorId,
      productCount,
      totalSales: totalSales[0]?.total || 0,
      recentOrders,
    });

    // Get top categories
    const topCategories = await Product.aggregate([
      {
        $match: {
          $or: [
            { seller: new mongoose.Types.ObjectId(req.params.vendorId) },
            { sellerId: new mongoose.Types.ObjectId(req.params.vendorId) },
            { vendorId: new mongoose.Types.ObjectId(req.params.vendorId) },
          ],
        },
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      success: true,
      store: {
        vendor: {
          id: vendor._id,
          name: vendor.name,
          companyName: vendor.companyName,
          businessType: vendor.businessType,
          location: `${vendor.city}, ${vendor.state}, ${vendor.country}`
            .replace(/, ,/g, ",")
            .replace(/^, |, $/g, ""),
          memberSince: vendor.createdAt,
          description: vendor.vendorSettings?.storeDescription || "",
          banner: vendor.vendorSettings?.storeBanner || "",
          operatingHours:
            vendor.vendorSettings?.operatingHours || "Mon-Fri: 9AM-6PM",
          socialLinks: vendor.vendorSettings?.socialLinks || {},
        },
        stats: {
          productCount,
          totalSales: totalSales[0]?.total || 0,
          totalRevenue: totalSales[0]?.totalRevenue || 0,
          recentOrders,
          avgRating,
          topCategories: topCategories.map((cat) => ({
            category: cat._id,
            productCount: cat.count,
          })),
        },
      },
    });
  } catch (error) {
    console.error("❌ GET /api/products/vendor/:vendorId/store error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get vendor store",
    });
  }
});

/**
 * GET /api/products/vendor/:vendorId/categories
 * Get vendor's product categories with counts
 * Access: Public
 */
router.get("/vendor/:vendorId/categories", async (req, res) => {
  try {
    const categories = await Product.aggregate([
      {
        $match: {
          seller: new mongoose.Types.ObjectId(req.params.vendorId),
          status: "active",
        },
      },
      {
        $group: {
          _id: {
            category: "$category",
            subcategory: "$subcategory",
          },
          count: { $sum: 1 },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
      {
        $group: {
          _id: "$_id.category",
          subcategories: {
            $push: {
              name: "$_id.subcategory",
              count: "$count",
              priceRange: {
                min: "$minPrice",
                max: "$maxPrice",
              },
            },
          },
          totalProducts: { $sum: "$count" },
        },
      },
      { $sort: { totalProducts: -1 } },
    ]);

    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error(
      "❌ GET /api/products/vendor/:vendorId/categories error:",
      error
    );
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get vendor categories",
    });
  }
});

/**
 * GET /api/products/vendor/:vendorId/products
 * Get vendor's products with filtering
 * Access: Public (no auth required)
 */
router.get("/vendor/:vendorId/products", async (req, res) => {
  try {
    const {
      category,
      subcategory,
      minPrice,
      maxPrice,
      search,
      inStock,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    console.log("🔍 Fetching products for vendor:", req.params.vendorId);
    console.log("📋 Query params:", req.query);

    // Build query - Try both 'seller' and 'sellerId' fields
    const query = {
      $or: [
        { seller: req.params.vendorId },
        { seller: new mongoose.Types.ObjectId(req.params.vendorId) },
        { sellerId: req.params.vendorId },
        { sellerId: new mongoose.Types.ObjectId(req.params.vendorId) },
        { vendorId: req.params.vendorId },
        { vendorId: new mongoose.Types.ObjectId(req.params.vendorId) },
      ],
      status: "active",
    };

    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;

    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ],
      });
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (inStock === "true") {
      query.quantity = { $gt: 0 };
    }

    console.log("🔎 MongoDB Query:", JSON.stringify(query, null, 2));

    // Pagination and sorting
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const [products, total] = await Promise.all([
      Product.find(query)
        .select(
          "name price images category subcategory quantity stock description createdAt seller sellerId vendorId"
        )
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(query),
    ]);

    console.log("✅ Products found:", products.length);
    console.log("📦 First product:", products[0]);

    // Map stock field to quantity if needed
    const mappedProducts = products.map((product) => ({
      ...product,
      stock: product.stock || product.quantity || 0,
    }));

    res.json({
      success: true,
      products: mappedProducts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      filters: {
        category,
        subcategory,
        minPrice,
        maxPrice,
        search,
        inStock,
      },
    });
  } catch (error) {
    console.error(
      "❌ GET /api/products/vendor/:vendorId/products error:",
      error
    );
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get vendor products",
    });
  }
});

/**
 * GET /api/products/vendor/:vendorId/categories
 * Get vendor's product categories with counts
 * Access: Public
 */
router.get("/vendor/:vendorId/categories", async (req, res) => {
  try {
    const categories = await Product.aggregate([
      {
        $match: {
          seller: mongoose.Types.ObjectId(req.params.vendorId),
          status: "active",
        },
      },
      {
        $group: {
          _id: {
            category: "$category",
            subcategory: "$subcategory",
          },
          count: { $sum: 1 },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
      {
        $group: {
          _id: "$_id.category",
          subcategories: {
            $push: {
              name: "$_id.subcategory",
              count: "$count",
              priceRange: {
                min: "$minPrice",
                max: "$maxPrice",
              },
            },
          },
          totalProducts: { $sum: "$count" },
        },
      },
      { $sort: { totalProducts: -1 } },
    ]);

    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error(
      "❌ GET /api/products/vendor/:vendorId/categories error:",
      error
    );
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get vendor categories",
    });
  }
});

export default router;
