// api/src/routes/cart.routes.js
import express from "express";
import cartService from "../services/cart.service.js";
import { verifyToken, optionalAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

// ========================================
// CART MANAGEMENT ENDPOINTS
// ========================================

/**
 * GET /api/cart
 * Get user's cart (supports both authenticated and guest users)
 * Query params: sessionId (for guest users)
 */
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { sessionId } = req.query;

    // Determine if user is authenticated or guest
    if (req.userId) {
      // Authenticated user
      const cart = await cartService.getCart(req.userId, null);
      return res.json({
        success: true,
        cart,
      });
    } else if (sessionId) {
      // Guest user
      const cart = await cartService.getCart(null, sessionId);
      return res.json({
        success: true,
        cart,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Session ID is required for guest users",
      });
    }
  } catch (error) {
    console.error("GET /api/cart error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * POST /api/cart/add
 * Add item to cart
 * Body: { productId, quantity, selectedSize?, selectedColor?, selectedFit?, sessionId? }
 */
router.post("/add", optionalAuth, async (req, res) => {
  try {
    const {
      productId,
      quantity,
      selectedSize,
      selectedColor,
      selectedFit,
      sessionId,
    } = req.body;

    // Validation
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

    // Determine user type
    const userId = req.userId || null;
    const guestSessionId = sessionId || null;

    if (!userId && !guestSessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required for guest users",
      });
    }

    const result = await cartService.addToCart(userId, guestSessionId, {
      productId,
      quantity: parseInt(quantity),
      selectedSize,
      selectedColor,
      selectedFit,
    });

    res.json(result);
  } catch (error) {
    console.error("POST /api/cart/add error:", error);

    if (
      error.message.includes("not found") ||
      error.message.includes("not available")
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message.includes("out of stock") ||
      error.message.includes("Insufficient")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * PUT /api/cart/item/:itemId
 * Update item quantity in cart
 * Body: { quantity, sessionId? }
 */
router.put("/item/:itemId", optionalAuth, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity, sessionId } = req.body;

    if (!quantity || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid quantity is required",
      });
    }

    const userId = req.userId || null;
    const guestSessionId = sessionId || null;

    if (!userId && !guestSessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required for guest users",
      });
    }

    const result = await cartService.updateItemQuantity(
      userId,
      guestSessionId,
      itemId,
      parseInt(quantity)
    );

    res.json(result);
  } catch (error) {
    console.error("PUT /api/cart/item/:itemId error:", error);

    if (
      error.message === "Cart not found" ||
      error.message === "Item not found in cart"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes("Insufficient stock")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * DELETE /api/cart/item/:itemId
 * Remove item from cart
 * Query params: sessionId (for guest users)
 */
router.delete("/item/:itemId", optionalAuth, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { sessionId } = req.query;

    const userId = req.userId || null;
    const guestSessionId = sessionId || null;

    if (!userId && !guestSessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required for guest users",
      });
    }

    const result = await cartService.removeFromCart(
      userId,
      guestSessionId,
      itemId
    );

    res.json(result);
  } catch (error) {
    console.error("DELETE /api/cart/item/:itemId error:", error);

    if (
      error.message === "Cart not found" ||
      error.message === "Item not found in cart"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * DELETE /api/cart/clear
 * Clear all items from cart
 * Query params: sessionId (for guest users)
 */
router.delete("/clear", optionalAuth, async (req, res) => {
  try {
    const { sessionId } = req.query;

    const userId = req.userId || null;
    const guestSessionId = sessionId || null;

    if (!userId && !guestSessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required for guest users",
      });
    }

    const result = await cartService.clearCart(userId, guestSessionId);

    res.json(result);
  } catch (error) {
    console.error("DELETE /api/cart/clear error:", error);

    if (error.message === "Cart not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ========================================
// SAVE FOR LATER ENDPOINTS
// ========================================

/**
 * POST /api/cart/save-for-later/:itemId
 * Move item from cart to saved items
 * Body: { notes?, sessionId? }
 */
router.post("/save-for-later/:itemId", optionalAuth, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { notes, sessionId } = req.body;

    const userId = req.userId || null;
    const guestSessionId = sessionId || null;

    if (!userId && !guestSessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required for guest users",
      });
    }

    const result = await cartService.saveForLater(
      userId,
      guestSessionId,
      itemId,
      notes
    );

    res.json(result);
  } catch (error) {
    console.error("POST /api/cart/save-for-later/:itemId error:", error);

    if (
      error.message === "Cart not found" ||
      error.message === "Item not found in cart"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * POST /api/cart/move-to-cart/:savedItemId
 * Move item from saved items to cart
 * Body: { sessionId? }
 */
router.post("/move-to-cart/:savedItemId", optionalAuth, async (req, res) => {
  try {
    const { savedItemId } = req.params;
    const { sessionId } = req.body;

    const userId = req.userId || null;
    const guestSessionId = sessionId || null;

    if (!userId && !guestSessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required for guest users",
      });
    }

    const result = await cartService.moveToCart(
      userId,
      guestSessionId,
      savedItemId
    );

    res.json(result);
  } catch (error) {
    console.error("POST /api/cart/move-to-cart/:savedItemId error:", error);

    if (
      error.message === "Cart not found" ||
      error.message === "Saved item not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * DELETE /api/cart/saved/:savedItemId
 * Remove item from saved items
 * Query params: sessionId (for guest users)
 */
router.delete("/saved/:savedItemId", optionalAuth, async (req, res) => {
  try {
    const { savedItemId } = req.params;
    const { sessionId } = req.query;

    const userId = req.userId || null;
    const guestSessionId = sessionId || null;

    if (!userId && !guestSessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required for guest users",
      });
    }

    const result = await cartService.removeSavedItem(
      userId,
      guestSessionId,
      savedItemId
    );

    res.json(result);
  } catch (error) {
    console.error("DELETE /api/cart/saved/:savedItemId error:", error);

    if (
      error.message === "Cart not found" ||
      error.message === "Saved item not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/cart/saved
 * Get all saved items (wishlist)
 * Query params: sessionId (for guest users)
 */
router.get("/saved", optionalAuth, async (req, res) => {
  try {
    const { sessionId } = req.query;

    const userId = req.userId || null;
    const guestSessionId = sessionId || null;

    if (!userId && !guestSessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required for guest users",
      });
    }

    const savedItems = await cartService.getSavedItems(userId, guestSessionId);

    res.json({
      success: true,
      savedItems,
    });
  } catch (error) {
    console.error("GET /api/cart/saved error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ========================================
// COUPON MANAGEMENT ENDPOINTS
// ========================================

/**
 * POST /api/cart/apply-coupon
 * Apply coupon/discount code to cart
 * Body: { couponCode, sessionId? }
 */
router.post("/apply-coupon", optionalAuth, async (req, res) => {
  try {
    const { couponCode, sessionId } = req.body;

    if (!couponCode || couponCode.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Coupon code is required",
      });
    }

    const userId = req.userId || null;
    const guestSessionId = sessionId || null;

    if (!userId && !guestSessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required for guest users",
      });
    }

    const result = await cartService.applyCoupon(
      userId,
      guestSessionId,
      couponCode.toUpperCase()
    );

    res.json(result);
  } catch (error) {
    console.error("POST /api/cart/apply-coupon error:", error);

    if (error.message === "Cart not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message.includes("Invalid") ||
      error.message.includes("expired")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * DELETE /api/cart/remove-coupon
 * Remove applied coupon from cart
 * Query params: sessionId (for guest users)
 */
router.delete("/remove-coupon", optionalAuth, async (req, res) => {
  try {
    const { sessionId } = req.query;

    const userId = req.userId || null;
    const guestSessionId = sessionId || null;

    if (!userId && !guestSessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required for guest users",
      });
    }

    const result = await cartService.removeCoupon(userId, guestSessionId);

    res.json(result);
  } catch (error) {
    console.error("DELETE /api/cart/remove-coupon error:", error);

    if (error.message === "Cart not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ========================================
// CART VALIDATION & UTILITIES
// ========================================

/**
 * POST /api/cart/validate
 * Validate cart items (check stock availability)
 * Body: { sessionId? }
 */
router.post("/validate", optionalAuth, async (req, res) => {
  try {
    const { sessionId } = req.body;

    const userId = req.userId || null;
    const guestSessionId = sessionId || null;

    if (!userId && !guestSessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required for guest users",
      });
    }

    const result = await cartService.validateCart(userId, guestSessionId);

    res.json(result);
  } catch (error) {
    console.error("POST /api/cart/validate error:", error);

    if (error.message === "Cart not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/cart/summary
 * Get cart summary (totals, item count, etc.)
 * Query params: sessionId (for guest users)
 */
router.get("/summary", optionalAuth, async (req, res) => {
  try {
    const { sessionId } = req.query;

    const userId = req.userId || null;
    const guestSessionId = sessionId || null;

    if (!userId && !guestSessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required for guest users",
      });
    }

    const summary = await cartService.getCartSummary(userId, guestSessionId);

    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("GET /api/cart/summary error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ========================================
// AUTHENTICATED USER ONLY ENDPOINTS
// ========================================

/**
 * POST /api/cart/merge
 * Merge guest cart into user cart (called after login)
 * Body: { guestSessionId }
 */
router.post("/merge", verifyToken, async (req, res) => {
  try {
    const { guestSessionId } = req.body;

    if (!guestSessionId) {
      return res.status(400).json({
        success: false,
        message: "Guest session ID is required",
      });
    }

    const result = await cartService.mergeGuestCart(guestSessionId, req.userId);

    res.json(result);
  } catch (error) {
    console.error("POST /api/cart/merge error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/cart/count
 * Get cart item count (quick endpoint for navbar badge)
 * Query params: sessionId (for guest users)
 */
router.get("/count", optionalAuth, async (req, res) => {
  try {
    const { sessionId } = req.query;

    const userId = req.userId || null;
    const guestSessionId = sessionId || null;

    if (!userId && !guestSessionId) {
      return res.json({
        success: true,
        count: 0,
      });
    }

    const count = await cartService.getCartItemCount(userId, guestSessionId);

    res.json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("GET /api/cart/count error:", error);
    res.json({
      success: true,
      count: 0,
    });
  }
});

export default router;
