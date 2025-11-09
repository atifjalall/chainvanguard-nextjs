// api/src/routes/customer.browse.routes.js
import express from "express";
import customerBrowseService from "../services/customer.browse.service.js";
import { authenticate, optionalAuth } from "../middleware/auth.middleware.js";
import logger from "../utils/logger.js";

const router = express.Router();

// ========================================
// PUBLIC ROUTES (No authentication required)
// ========================================

/**
 * GET /api/customer/browse/products
 * Browse all products with advanced customer-friendly filtering
 * Query params: page, limit, search, category, subcategory, minPrice, maxPrice,
 *               size, color, brand, sortBy, sortOrder, isOrganic, isFairTrade,
 *               isRecycled, inStock, isFeatured
 */
router.get("/products", async (req, res) => {
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

      // Apparel filters
      size: req.query.size,
      color: req.query.color,
      brand: req.query.brand,
      material: req.query.material,
      fit: req.query.fit,

      // Price range
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,

      // Availability
      inStock: req.query.inStock === "true",

      // Features
      isFeatured: req.query.isFeatured === "true" ? true : undefined,
      isOrganic: req.query.isOrganic === "true" ? true : undefined,
      isFairTrade: req.query.isFairTrade === "true" ? true : undefined,
      isRecycled: req.query.isRecycled === "true" ? true : undefined,

      // Sort
      sortBy: req.query.sortBy || "createdAt",
      sortOrder: req.query.sortOrder || "desc",

      // Vendor filter
      vendorId: req.query.vendorId,
    };

    const result = await customerBrowseService.browseProducts(filters);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error("❌ GET /api/customer/browse/products error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to browse products",
    });
  }
});

/**
 * GET /api/customer/browse/products/:id
 * Get detailed product information with reviews, vendor info, and related products
 * Query params: includeReviews (boolean), includeRelated (boolean), includeVendor (boolean)
 */
router.get("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const options = {
      includeReviews: req.query.includeReviews !== "false", // Default true
      includeRelated: req.query.includeRelated !== "false", // Default true
      includeVendor: req.query.includeVendor !== "false", // Default true
      incrementView: req.query.view === "true",
    };

    const result = await customerBrowseService.getProductDetails(id, options);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error("❌ GET /api/customer/browse/products/:id error:", error);

    if (error.message === "Product not found") {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to get product details",
    });
  }
});

/**
 * GET /api/customer/browse/products/:id/related
 * Get related/recommended products based on current product
 * Query params: limit (default: 10)
 */
router.get("/products/:id/related", async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const result = await customerBrowseService.getRelatedProducts(id, limit);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error(
      "❌ GET /api/customer/browse/products/:id/related error:",
      error
    );

    if (error.message === "Product not found") {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to get related products",
    });
  }
});

/**
 * GET /api/customer/browse/vendor/:vendorId
 * Get vendor store page with profile, stats, and featured products
 */
router.get("/vendor/:vendorId", async (req, res) => {
  try {
    const { vendorId } = req.params;

    const result = await customerBrowseService.getVendorStore(vendorId);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error("❌ GET /api/customer/browse/vendor/:vendorId error:", error);

    if (error.message === "Vendor not found") {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to get vendor store",
    });
  }
});

/**
 * GET /api/customer/browse/vendor/:vendorId/products
 * Browse vendor's products with customer-friendly filters
 * Query params: category, subcategory, minPrice, maxPrice, inStock, page, limit, sortBy, sortOrder
 */
router.get("/vendor/:vendorId/products", async (req, res) => {
  try {
    const { vendorId } = req.params;
    const filters = {
      category: req.query.category,
      subcategory: req.query.subcategory,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
      inStock: req.query.inStock === "true",
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sortBy: req.query.sortBy || "createdAt",
      sortOrder: req.query.sortOrder || "desc",
    };

    const result = await customerBrowseService.getVendorProducts(
      vendorId,
      filters
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error(
      "❌ GET /api/customer/browse/vendor/:vendorId/products error:",
      error
    );

    if (error.message === "Vendor not found") {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to get vendor products",
    });
  }
});

/**
 * POST /api/customer/browse/products/compare
 * Compare multiple products side-by-side
 * Body: { productIds: string[] }
 */
router.post("/products/compare", async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: "At least 2 product IDs are required for comparison",
      });
    }

    if (productIds.length > 5) {
      return res.status(400).json({
        success: false,
        message: "Maximum 5 products can be compared at once",
      });
    }

    const result = await customerBrowseService.compareProducts(productIds);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error("❌ POST /api/customer/browse/products/compare error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to compare products",
    });
  }
});

/**
 * GET /api/customer/browse/collections/featured
 * Get featured products collection
 * Query params: limit (default: 20), category
 */
router.get("/collections/featured", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const category = req.query.category;

    const result = await customerBrowseService.getFeaturedCollection(
      limit,
      category
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error(
      "❌ GET /api/customer/browse/collections/featured error:",
      error
    );
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get featured collection",
    });
  }
});

/**
 * GET /api/customer/browse/collections/trending
 * Get trending products collection
 * Query params: limit (default: 20), timeframe (week|month|all)
 */
router.get("/collections/trending", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const timeframe = req.query.timeframe || "week";

    const result = await customerBrowseService.getTrendingCollection(
      limit,
      timeframe
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error(
      "❌ GET /api/customer/browse/collections/trending error:",
      error
    );
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get trending collection",
    });
  }
});

/**
 * GET /api/customer/browse/collections/new-arrivals
 * Get new arrivals collection
 * Query params: limit (default: 20), category
 */
router.get("/collections/new-arrivals", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const category = req.query.category;

    const result = await customerBrowseService.getNewArrivalsCollection(
      limit,
      category
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error(
      "❌ GET /api/customer/browse/collections/new-arrivals error:",
      error
    );
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get new arrivals collection",
    });
  }
});

/**
 * GET /api/customer/browse/collections/deals
 * Get products on sale/discount
 * Query params: limit (default: 20), minDiscount (percentage)
 */
router.get("/collections/deals", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const minDiscount = req.query.minDiscount
      ? parseInt(req.query.minDiscount)
      : 10;

    const result = await customerBrowseService.getDealsCollection(
      limit,
      minDiscount
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error("❌ GET /api/customer/browse/collections/deals error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get deals collection",
    });
  }
});

/**
 * GET /api/customer/browse/categories/:category
 * Get category page with products, subcategories, and filters
 * Query params: page, limit, sortBy, sortOrder
 */
router.get("/categories/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sortBy: req.query.sortBy || "createdAt",
      sortOrder: req.query.sortOrder || "desc",
    };

    const result = await customerBrowseService.getCategoryPage(
      category,
      options
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error(
      "❌ GET /api/customer/browse/categories/:category error:",
      error
    );
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get category page",
    });
  }
});

// ========================================
// AUTHENTICATED ROUTES (Customer only)
// ========================================

/**
 * POST /api/customer/browse/quick-add-cart
 * Quick add to cart from browse page
 * Requires authentication
 * Body: { productId, quantity, selectedSize?, selectedColor?, selectedFit? }
 */
router.post("/quick-add-cart", authenticate, async (req, res) => {
  try {
    const { productId, quantity, selectedSize, selectedColor, selectedFit } =
      req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Valid quantity is required",
      });
    }

    const result = await customerBrowseService.quickAddToCart(req.userId, {
      productId,
      quantity: parseInt(quantity),
      selectedSize,
      selectedColor,
      selectedFit,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error("❌ POST /api/customer/browse/quick-add-cart error:", error);

    if (error.message === "Product not found") {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (error.message === "Insufficient stock") {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock available",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to add to cart",
    });
  }
});

/**
 * POST /api/customer/browse/quick-add-wishlist
 * Quick add to wishlist from browse page
 * Requires authentication
 * Body: { productId, notes? }
 */
router.post("/quick-add-wishlist", authenticate, async (req, res) => {
  try {
    const { productId, notes } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const result = await customerBrowseService.quickAddToWishlist(
      req.userId,
      productId,
      { notes }
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error(
      "❌ POST /api/customer/browse/quick-add-wishlist error:",
      error
    );

    if (error.message === "Product not found") {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (error.message === "Product already in wishlist") {
      return res.status(400).json({
        success: false,
        message: "Product already in wishlist",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to add to wishlist",
    });
  }
});

/**
 * GET /api/customer/browse/history
 * Get customer's browsing history (recently viewed products)
 * Requires authentication
 * Query params: page, limit
 */
router.get("/history", authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await customerBrowseService.getBrowsingHistory(
      req.userId,
      page,
      limit
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error("❌ GET /api/customer/browse/history error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get browsing history",
    });
  }
});

/**
 * GET /api/customer/browse/recommendations
 * Get personalized product recommendations
 * Requires authentication
 * Query params: limit (default: 20)
 */
router.get("/recommendations", authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const result = await customerBrowseService.getPersonalizedRecommendations(
      req.userId,
      limit
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error("❌ GET /api/customer/browse/recommendations error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get recommendations",
    });
  }
});

/**
 * GET /api/customer/browse/search/suggestions
 * Get search suggestions/autocomplete
 * Query params: q (search query), limit (default: 10)
 */
router.get("/search/suggestions", async (req, res) => {
  try {
    const { q } = req.query;
    const limit = parseInt(req.query.limit) || 10;

    if (!q || q.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const result = await customerBrowseService.getSearchSuggestions(q, limit);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error(
      "❌ GET /api/customer/browse/search/suggestions error:",
      error
    );
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get search suggestions",
    });
  }
});

export default router;
