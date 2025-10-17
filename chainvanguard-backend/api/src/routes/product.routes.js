import express from "express";
import productService from "../services/product.service.js";
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

/**
 * PUBLIC ROUTES (No authentication required)
 */

// GET /api/products - Get all products (with filters)
router.get("/", async (req, res) => {
  try {
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      category: req.query.category,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
      status: req.query.status || "active",
      isFeatured: req.query.isFeatured,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
    };

    const result = await productService.getAllProducts(filters);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("GET /products error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET /api/products/featured - Get featured products
router.get("/featured", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const products = await productService.getFeaturedProducts(limit);

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("GET /products/featured error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET /api/products/search - Search products
router.get("/search", async (req, res) => {
  try {
    const { q, ...filters } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const result = await productService.searchProducts(q, filters);

    res.json({
      success: true,
      query: q,
      ...result,
    });
  } catch (error) {
    console.error("GET /products/search error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET /api/products/:id - Get single product
router.get("/:id", async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("GET /products/:id error:", error);

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

// GET /api/products/:id/history - Get product blockchain history
router.get("/:id/history", async (req, res) => {
  try {
    const history = await productService.getProductHistory(req.params.id);

    res.json(history);
  } catch (error) {
    console.error("GET /products/:id/history error:", error);

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
 * PROTECTED ROUTES (Authentication required)
 */

// POST /api/products - Create new product (Vendors & Suppliers only)
router.post(
  "/",
  verifyToken,
  requireVerification,
  checkRole("vendor", "supplier"),
  uploadProductFiles,
  handleUploadError,
  async (req, res) => {
    try {
      // Validate required fields
      const { name, description, category, price, quantity } = req.body;

      if (!name || !description || !category || !price || !quantity) {
        return res.status(400).json({
          success: false,
          message:
            "Missing required fields: name, description, category, price, quantity",
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
      console.error("POST /products error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// PUT /api/products/:id - Update product
router.put(
  "/:id",
  verifyToken,
  requireVerification,
  checkRole("vendor", "supplier"),
  uploadProductFiles,
  handleUploadError,
  async (req, res) => {
    try {
      const product = await productService.updateProduct(
        req.params.id,
        req.body,
        req.files,
        req.userId
      );

      res.json({
        success: true,
        message: "Product updated successfully",
        product,
      });
    } catch (error) {
      console.error("PUT /products/:id error:", error);

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

// DELETE /api/products/:id - Delete product (soft delete)
router.delete(
  "/:id",
  verifyToken,
  requireVerification,
  checkRole("vendor", "supplier", "expert"),
  async (req, res) => {
    try {
      const result = await productService.deleteProduct(
        req.params.id,
        req.userId,
        req.userRole
      );

      res.json(result);
    } catch (error) {
      console.error("DELETE /products/:id error:", error);

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

// GET /api/products/seller/:sellerId - Get seller's products
router.get("/seller/:sellerId", async (req, res) => {
  try {
    const filters = {
      ...req.query,
      sellerId: req.params.sellerId,
    };

    const result = await productService.getSellerProducts(
      req.params.sellerId,
      filters
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("GET /products/seller/:sellerId error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
