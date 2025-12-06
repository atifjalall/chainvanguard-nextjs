import express from "express";
import wishlistService from "../services/wishlist.service.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticate);

/**
 * GET /api/wishlist
 * Get user's wishlist
 * Access: Authenticated users (customers mainly)
 */
router.get("/", async (req, res) => {
  try {
    // SAFE MODE: Wishlist unavailable (not backed up)
    if (req.safeMode) {
      return res.json({
        success: true,
        safeMode: true,
        wishlist: {
          items: [],
          totalItems: 0
        },
        message: "Wishlist temporarily unavailable during maintenance",
        warning: "Your wishlist data is safe and will be restored when maintenance completes."
      });
    }

    const result = await wishlistService.getWishlist(req.userId);

    res.json(result);
  } catch (error) {
    console.error("❌ GET /api/wishlist error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get wishlist",
    });
  }
});

/**
 * GET /api/wishlist/stats
 * Get wishlist statistics
 * Access: Authenticated users
 */
router.get("/stats", async (req, res) => {
  try {
    const result = await wishlistService.getWishlistStats(req.userId);

    res.json(result);
  } catch (error) {
    console.error("❌ GET /api/wishlist/stats error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get wishlist statistics",
    });
  }
});

/**
 * POST /api/wishlist/add
 * Add product to wishlist
 * Access: Authenticated users
 * Body: { productId, notes?, notifyOnPriceDrop?, notifyOnBackInStock? }
 */
router.post("/add", async (req, res) => {
  try {
    const { productId, notes, notifyOnPriceDrop, notifyOnBackInStock } =
      req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const result = await wishlistService.addToWishlist(req.userId, productId, {
      notes,
      notifyOnPriceDrop,
      notifyOnBackInStock,
    });

    res.json(result);
  } catch (error) {
    console.error("❌ POST /api/wishlist/add error:", error);

    if (error.message === "Product not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Product already in wishlist") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to add to wishlist",
    });
  }
});

/**
 * GET /api/wishlist/check/:productId
 * Check if product is in wishlist
 * Access: Authenticated users
 */
router.get("/check/:productId", async (req, res) => {
  try {
    const result = await wishlistService.isInWishlist(
      req.userId,
      req.params.productId
    );

    res.json(result);
  } catch (error) {
    console.error("❌ GET /api/wishlist/check/:productId error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to check wishlist",
    });
  }
});

/**
 * PATCH /api/wishlist/:productId
 * Update wishlist item
 * Access: Authenticated users
 * Body: { notes?, notifyOnPriceDrop?, notifyOnBackInStock? }
 */
router.patch("/:productId", async (req, res) => {
  try {
    const { notes, notifyOnPriceDrop, notifyOnBackInStock } = req.body;

    const updates = {};
    if (notes !== undefined) updates.notes = notes;
    if (notifyOnPriceDrop !== undefined)
      updates.notifyOnPriceDrop = notifyOnPriceDrop;
    if (notifyOnBackInStock !== undefined)
      updates.notifyOnBackInStock = notifyOnBackInStock;

    const result = await wishlistService.updateWishlistItem(
      req.userId,
      req.params.productId,
      updates
    );

    res.json(result);
  } catch (error) {
    console.error("❌ PATCH /api/wishlist/:productId error:", error);

    if (
      error.message === "Wishlist not found" ||
      error.message === "Product not found in wishlist"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to update wishlist item",
    });
  }
});

/**
 * DELETE /api/wishlist/:productId
 * Remove product from wishlist
 * Access: Authenticated users
 */
router.delete("/:productId", async (req, res) => {
  try {
    const result = await wishlistService.removeFromWishlist(
      req.userId,
      req.params.productId
    );

    res.json(result);
  } catch (error) {
    console.error("❌ DELETE /api/wishlist/:productId error:", error);

    if (
      error.message === "Wishlist not found" ||
      error.message === "Product not found in wishlist"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to remove from wishlist",
    });
  }
});

/**
 * DELETE /api/wishlist
 * Clear entire wishlist
 * Access: Authenticated users
 */
router.delete("/", async (req, res) => {
  try {
    const result = await wishlistService.clearWishlist(req.userId);

    res.json(result);
  } catch (error) {
    console.error("❌ DELETE /api/wishlist error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to clear wishlist",
    });
  }
});

/**
 * POST /api/wishlist/move-to-cart
 * Move wishlist items to cart
 * Access: Authenticated users
 * Body: { productIds: [string] }
 */
router.post("/move-to-cart", async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Product IDs array is required",
      });
    }

    const result = await wishlistService.moveToCart(req.userId, productIds);

    res.json(result);
  } catch (error) {
    console.error("❌ POST /api/wishlist/move-to-cart error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to move items to cart",
    });
  }
});

export default router;
