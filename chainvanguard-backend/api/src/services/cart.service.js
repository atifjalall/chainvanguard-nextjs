// api/src/services/cart.service.js
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import redisService from "./redis.service.js";
import logger from "../utils/logger.js";
import notificationService from "./notification.service.js";
class CartService {
  // ========================================
  // GET CART
  // ========================================

  /**
   * Get user's cart (authenticated or guest)
   */
  async getCart(userId = null, sessionId = null) {
    try {
      let cart;

      if (userId) {
        // Authenticated user
        cart = await Cart.findOrCreateForUser(userId);
      } else if (sessionId) {
        // Guest user
        cart = await Cart.findOrCreateForGuest(sessionId);
      } else {
        throw new Error("User ID or Session ID is required");
      }

      // Populate product details
      await cart.populate([
        {
          path: "items.productId",
          select:
            "name price images status quantity reservedQuantity apparelDetails shippingCost freeShipping estimatedDeliveryDays sellerId",
        },
        {
          path: "items.sellerId",
          select: "name companyName",
        },
        {
          path: "savedItems.productId",
          select: "name price images status",
        },
      ]);

      // Explicitly calculate subtotal and totalAmount from items
      cart.subtotal = cart.items.reduce((sum, item) => {
        return sum + item.price * item.quantity;
      }, 0);
      cart.totalAmount = cart.subtotal;

      // Check for Redis cache
      const cacheKey = userId
        ? `cart:user:${userId}`
        : `cart:guest:${sessionId}`;

      // ✅ Use items.length for unique item count
      const totalItems = cart.items.length;
      await redisService.set(
        cacheKey,
        JSON.stringify({
          totalItems: totalItems,
          subtotal: cart.subtotal || 0,
          totalQuantity: cart.totalQuantity || 0,
        }),
        300 // 5 minutes TTL
      );

      return cart;
    } catch (error) {
      console.error("❌ Get cart error:", error);
      throw error;
    }
  }

  // ========================================
  // ADD TO CART
  // ========================================

  /**
   * Add item to cart or update quantity if exists
   */
  async addToCart(userId, sessionId, itemData) {
    try {
      console.log("🛒 Adding item to cart...");

      // 1. Get cart
      let cart;
      if (userId) {
        cart = await Cart.findOrCreateForUser(userId);
      } else if (sessionId) {
        cart = await Cart.findOrCreateForGuest(sessionId);
      } else {
        throw new Error("User ID or Session ID is required");
      }

      // 2. Get product details
      const product = await Product.findById(itemData.productId).populate(
        "sellerId",
        "name companyName walletAddress"
      );

      if (!product) {
        throw new Error("Product not found");
      }

      // 3. Validate product availability
      if (product.status !== "active") {
        throw new Error(
          `Product "${product.name}" is not available for purchase`
        );
      }

      // 4. Check stock availability
      const availableQty = product.quantity - (product.reservedQuantity || 0);
      if (availableQty < itemData.quantity) {
        throw new Error(
          `Insufficient stock for "${product.name}". Available: ${availableQty}, Requested: ${itemData.quantity}`
        );
      }

      if (availableQty > 0 && availableQty <= product.minStockLevel) {
        await notificationService.createNotification({
          userId: product.sellerId,
          userRole: "vendor",
          type: "low_stock",
          category: "inventory",
          title: "Low Stock Alert",
          message: `"${product.name}" is running low. Current stock: ${availableQty}`,
          productId: product._id,
          priority: "high",
          isUrgent: true,
          actionType: "view_product",
          actionUrl: `/products/${product._id}`,
        });
      }

      // 5. Validate apparel selections if provided
      if (itemData.selectedSize) {
        const validSizes = [
          "XXS",
          "XS",
          "S",
          "M",
          "L",
          "XL",
          "XXL",
          "XXXL",
          "Free Size",
        ];
        if (!validSizes.includes(itemData.selectedSize)) {
          throw new Error(`Invalid size: ${itemData.selectedSize}`);
        }
      }

      // 6. Build cart item data
      const cartItemData = {
        productId: product._id,
        productName: product.name,
        productImage: product.images.length > 0 ? product.images[0].url : "",
        sku: product.sku,
        sellerId: product.sellerId._id,
        sellerName: product.sellerId.companyName || product.sellerId.name,
        selectedSize:
          itemData.selectedSize || product.apparelDetails?.size || "",
        selectedColor:
          itemData.selectedColor || product.apparelDetails?.color || "",
        selectedFit: itemData.selectedFit || product.apparelDetails?.fit || "",
        price: product.price,
        quantity: itemData.quantity,
        subtotal: product.price * itemData.quantity,
        isAvailable: true,
        availableQuantity: availableQty,
        stockStatus:
          availableQty <= product.minStockLevel ? "low_stock" : "in_stock",
      };

      // 7. Add to cart (will update if exists)
      await cart.addItem(cartItemData);

      // 🆕 CALCULATE AND SET TOTAL
      cart.totalAmount = cart.items.reduce((sum, item) => {
        return sum + item.price * item.quantity;
      }, 0);

      // 8. Populate and return updated cart
      await cart.populate([
        {
          path: "items.productId",
          select: "name price images status",
        },
      ]);

      // 9. Invalidate cache
      const cacheKey = userId
        ? `cart:user:${userId}`
        : `cart:guest:${sessionId}`;
      await redisService.del(cacheKey);

      console.log(`✅ Item added to cart: ${product.name}`);

      // 🆕 LOG CART ACTION
      await logger.logCart({
        type: "cart_item_added",
        action: `Item added to cart: ${product.name}`,
        cartId: cart._id,
        userId,
        status: "success",
        data: {
          productId: product._id,
          productName: product.name,
          quantity: itemData.quantity,
          price: product.price,
        },
      });

      return {
        success: true,
        message: "Item added to cart successfully",
        cart: {
          items: cart.items,
          totalItems: cart.totalItems,
          totalQuantity: cart.totalQuantity,
          subtotal: cart.subtotal,
        },
      };
    } catch (error) {
      console.error("❌ Add to cart error:", error);
      throw error;
    }
  }

  // ========================================
  // UPDATE ITEM QUANTITY
  // ========================================

  /**
   * Update item quantity in cart
   */
  async updateItemQuantity(userId, sessionId, itemId, quantity) {
    try {
      console.log(`🛒 Updating cart item quantity: ${itemId} -> ${quantity}`);

      // 1. Get cart
      const cart = await this.getCart(userId, sessionId);

      if (!cart) {
        throw new Error("Cart not found");
      }

      // 2. Find item
      const item = cart.items.id(itemId);
      if (!item) {
        throw new Error("Item not found in cart");
      }

      // 3. If quantity is 0, remove item
      if (quantity === 0) {
        return this.removeFromCart(userId, sessionId, itemId);
      }

      // 4. Validate stock availability
      const product = await Product.findById(item.productId);
      if (!product) {
        throw new Error("Product not found");
      }

      const availableQty = product.quantity - (product.reservedQuantity || 0);
      if (availableQty < quantity) {
        throw new Error(
          `Insufficient stock. Available: ${availableQty}, Requested: ${quantity}`
        );
      }

      // 5. Update quantity
      await cart.updateItemQuantity(itemId, quantity);

      // 6. Populate and return
      await cart.populate("items.productId", "name price images");

      // 7. Invalidate cache
      const cacheKey = userId
        ? `cart:user:${userId}`
        : `cart:guest:${sessionId}`;
      await redisService.del(cacheKey);

      console.log(`✅ Item quantity updated`);

      // 🆕 LOG CART ACTION
      await logger.logCart({
        type: "cart_item_updated",
        action: `Cart item quantity updated: ${item.productName}`,
        cartId: cart._id,
        userId,
        status: "success",
        data: {
          itemId,
          productId: item.productId,
          productName: item.productName,
          quantity,
        },
      });

      return {
        success: true,
        message: "Item quantity updated successfully",
        cart: {
          items: cart.items,
          totalItems: cart.totalItems,
          totalQuantity: cart.totalQuantity,
          subtotal: cart.subtotal,
        },
      };
    } catch (error) {
      console.error("❌ Update item quantity error:", error);
      throw error;
    }
  }

  // ========================================
  // REMOVE FROM CART
  // ========================================

  /**
   * Remove item from cart
   */
  async removeFromCart(userId, sessionId, itemId) {
    try {
      console.log(`🛒 Removing item from cart: ${itemId}`);

      // 1. Get cart
      const cart = await this.getCart(userId, sessionId);

      if (!cart) {
        throw new Error("Cart not found");
      }

      // 2. Remove item
      const item = cart.items.id(itemId);
      await cart.removeItem(itemId);

      // 3. Populate and return
      await cart.populate("items.productId", "name price images");

      // 4. Invalidate cache
      const cacheKey = userId
        ? `cart:user:${userId}`
        : `cart:guest:${sessionId}`;
      await redisService.del(cacheKey);

      console.log(`✅ Item removed from cart`);

      // 🆕 LOG CART ACTION
      await logger.logCart({
        type: "cart_item_removed",
        action: `Item removed from cart: ${item ? item.productName : itemId}`,
        cartId: cart._id,
        userId,
        status: "success",
        data: {
          itemId,
          productId: item ? item.productId : undefined,
          productName: item ? item.productName : undefined,
        },
      });

      return {
        success: true,
        message: "Item removed from cart successfully",
        cart: {
          items: cart.items,
          totalItems: cart.totalItems,
          totalQuantity: cart.totalQuantity,
          subtotal: cart.subtotal,
        },
      };
    } catch (error) {
      console.error("❌ Remove from cart error:", error);
      throw error;
    }
  }

  // ========================================
  // CLEAR CART
  // ========================================

  /**
   * Clear all items from cart
   */
  async clearCart(userId, sessionId) {
    try {
      console.log("🛒 Clearing cart...");

      // 1. Find cart directly without caching
      let cart;
      if (userId) {
        cart = await Cart.findOne({ userId });
      } else if (sessionId) {
        cart = await Cart.findOne({ sessionId });
      } else {
        throw new Error("User ID or Session ID is required");
      }

      if (!cart) {
        throw new Error("Cart not found");
      }

      // 2. Clear cart - explicitly set all values
      cart.items = [];
      cart.savedItems = [];
      cart.totalItems = 0; // ✅ EXPLICITLY SET TO 0
      cart.totalQuantity = 0; // ✅ EXPLICITLY SET TO 0
      cart.subtotal = 0; // ✅ EXPLICITLY SET TO 0
      cart.totalSellers = 0; // ✅ EXPLICITLY SET TO 0
      cart.appliedCoupon = {
        code: "",
        discount: 0,
        discountType: "",
      };

      // Force save with validation
      await cart.save({ validateBeforeSave: true });

      // 3. Invalidate cache AND set it to empty values
      const cacheKey = userId
        ? `cart:user:${userId}`
        : `cart:guest:${sessionId}`;
      await redisService.del(cacheKey);

      // 4. Set cache with empty values to prevent stale data
      await redisService.set(
        cacheKey,
        JSON.stringify({
          totalItems: 0,
          totalQuantity: 0,
          subtotal: 0,
          discount: 0,
          total: 0,
        }),
        300 // 5 minutes TTL
      );

      console.log("✅ Cart cleared successfully");

      // 🆕 LOG CART ACTION
      await logger.logCart({
        type: "cart_cleared",
        action: "Cart cleared",
        cartId: cart._id,
        userId,
        status: "success",
      });

      return {
        success: true,
        message: "Cart cleared successfully",
        cart: {
          items: [],
          totalItems: 0,
          totalQuantity: 0,
          subtotal: 0,
        },
      };
    } catch (error) {
      console.error("❌ Clear cart error:", error);
      throw error;
    }
  }

  // ========================================
  // SAVE FOR LATER
  // ========================================

  /**
   * Move item from cart to saved items
   */
  async saveForLater(userId, sessionId, itemId, notes = "") {
    try {
      console.log(`💾 Saving item for later: ${itemId}`);

      // 1. Get cart
      const cart = await this.getCart(userId, sessionId);

      if (!cart) {
        throw new Error("Cart not found");
      }

      // 2. Save for later
      await cart.saveForLater(itemId, notes);

      // 3. Populate and return
      await cart.populate([
        {
          path: "items.productId",
          select: "name price images",
        },
        {
          path: "savedItems.productId",
          select: "name price images status",
        },
      ]);

      // 4. Invalidate cache
      const cacheKey = userId
        ? `cart:user:${userId}`
        : `cart:guest:${sessionId}`;
      await redisService.del(cacheKey);

      console.log("✅ Item saved for later");

      return {
        success: true,
        message: "Item saved for later successfully",
        cart: {
          items: cart.items,
          savedItems: cart.savedItems,
          totalItems: cart.totalItems,
          subtotal: cart.subtotal,
        },
      };
    } catch (error) {
      console.error("❌ Save for later error:", error);
      throw error;
    }
  }

  /**
   * Move item from saved items back to cart
   */
  async moveToCart(userId, sessionId, savedItemId) {
    try {
      console.log(`🛒 Moving saved item to cart: ${savedItemId}`);

      // 1. Get cart
      const cart = await this.getCart(userId, sessionId);

      if (!cart) {
        throw new Error("Cart not found");
      }

      // 2. Move to cart
      await cart.moveToCart(savedItemId);

      // 3. Populate and return
      await cart.populate([
        {
          path: "items.productId",
          select: "name price images",
        },
        {
          path: "savedItems.productId",
          select: "name price images status",
        },
      ]);

      // 4. Invalidate cache
      const cacheKey = userId
        ? `cart:user:${userId}`
        : `cart:guest:${sessionId}`;
      await redisService.del(cacheKey);

      console.log("✅ Saved item moved to cart");

      return {
        success: true,
        message: "Item moved to cart successfully",
        cart: {
          items: cart.items,
          savedItems: cart.savedItems,
          totalItems: cart.totalItems,
          subtotal: cart.subtotal,
        },
      };
    } catch (error) {
      console.error("❌ Move to cart error:", error);
      throw error;
    }
  }

  /**
   * Remove item from saved items
   */
  async removeSavedItem(userId, sessionId, savedItemId) {
    try {
      console.log(`🗑️ Removing saved item: ${savedItemId}`);

      // 1. Get cart
      const cart = await this.getCart(userId, sessionId);

      if (!cart) {
        throw new Error("Cart not found");
      }

      // 2. Find and remove saved item
      const savedItem = cart.savedItems.id(savedItemId);
      if (!savedItem) {
        throw new Error("Saved item not found");
      }

      savedItem.remove();
      await cart.save();

      // 3. Invalidate cache
      const cacheKey = userId
        ? `cart:user:${userId}`
        : `cart:guest:${sessionId}`;
      await redisService.del(cacheKey);

      console.log("✅ Saved item removed");

      return {
        success: true,
        message: "Saved item removed successfully",
        savedItems: cart.savedItems,
      };
    } catch (error) {
      console.error("❌ Remove saved item error:", error);
      throw error;
    }
  }

  /**
   * Get all saved items
   */
  async getSavedItems(userId, sessionId) {
    try {
      const cart = await this.getCart(userId, sessionId);

      if (!cart) {
        return [];
      }

      await cart.populate("savedItems.productId", "name price images status");

      return cart.savedItems;
    } catch (error) {
      console.error("❌ Get saved items error:", error);
      throw error;
    }
  }

  // ========================================
  // COUPON MANAGEMENT
  // ========================================

  /**
   * Apply coupon code to cart
   */
  async applyCoupon(userId, sessionId, couponCode) {
    try {
      console.log(`🎟️ Applying coupon: ${couponCode}`);

      // 1. Get cart
      const cart = await this.getCart(userId, sessionId);

      if (!cart) {
        throw new Error("Cart not found");
      }

      if (cart.isEmpty) {
        throw new Error("Cannot apply coupon to empty cart");
      }

      // 2. Validate coupon (simplified - in real app, check database)
      const validCoupons = {
        SAVE10: { discount: 10, type: "percentage" },
        SAVE20: { discount: 20, type: "percentage" },
        FLAT50: { discount: 50, type: "fixed" },
        WELCOME15: { discount: 15, type: "percentage" },
      };

      const coupon = validCoupons[couponCode];
      if (!coupon) {
        throw new Error("Invalid coupon code");
      }

      // 3. Calculate discount
      let discountAmount = 0;
      if (coupon.type === "percentage") {
        discountAmount = (cart.subtotal * coupon.discount) / 100;
      } else {
        discountAmount = coupon.discount;
      }

      // 4. Apply coupon
      await cart.applyCoupon(couponCode, discountAmount, coupon.type);

      // 5. Invalidate cache
      const cacheKey = userId
        ? `cart:user:${userId}`
        : `cart:guest:${sessionId}`;
      await redisService.del(cacheKey);

      console.log(`✅ Coupon applied: ${couponCode} (-$${discountAmount})`);

      return {
        success: true,
        message: `Coupon "${couponCode}" applied successfully`,
        discount: discountAmount,
        cart: {
          subtotal: cart.subtotal,
          discount: discountAmount,
          total: cart.subtotal - discountAmount,
          appliedCoupon: cart.appliedCoupon,
        },
      };
    } catch (error) {
      console.error("❌ Apply coupon error:", error);
      throw error;
    }
  }

  /**
   * Remove coupon from cart
   */
  async removeCoupon(userId, sessionId) {
    try {
      console.log("🎟️ Removing coupon...");

      // 1. Get cart
      const cart = await this.getCart(userId, sessionId);

      if (!cart) {
        throw new Error("Cart not found");
      }

      // 2. Remove coupon
      await cart.removeCoupon();

      // 3. Invalidate cache
      const cacheKey = userId
        ? `cart:user:${userId}`
        : `cart:guest:${sessionId}`;
      await redisService.del(cacheKey);

      console.log("✅ Coupon removed");

      return {
        success: true,
        message: "Coupon removed successfully",
        cart: {
          subtotal: cart.subtotal,
          discount: 0,
          total: cart.subtotal,
        },
      };
    } catch (error) {
      console.error("❌ Remove coupon error:", error);
      throw error;
    }
  }

  // ========================================
  // CART VALIDATION
  // ========================================

  /**
   * Validate cart items (check stock availability, prices)
   */
  async validateCart(userId, sessionId) {
    try {
      console.log("✅ Validating cart...");

      // 1. Get cart
      const cart = await this.getCart(userId, sessionId);

      if (!cart) {
        throw new Error("Cart not found");
      }

      // 2. Validate items
      const validation = await cart.validateItems();

      console.log(`✅ Cart validation complete. Valid: ${validation.isValid}`);

      return {
        success: true,
        isValid: validation.isValid,
        unavailableItems: validation.unavailableItems,
        cart: {
          items: cart.items,
          totalItems: cart.totalItems,
          subtotal: cart.subtotal,
        },
      };
    } catch (error) {
      console.error("❌ Validate cart error:", error);
      throw error;
    }
  }

  // ========================================
  // CART SUMMARY
  // ========================================

  /**
   * Get cart summary (quick info)
   */
  async getCartSummary(userId, sessionId) {
    try {
      // Check cache first
      const cacheKey = userId
        ? `cart:user:${userId}`
        : `cart:guest:${sessionId}`;
      const cached = await redisService.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      // Get from database
      const cart = await this.getCart(userId, sessionId);

      if (!cart) {
        return {
          totalItems: 0,
          totalQuantity: 0,
          subtotal: 0,
          discount: 0,
          total: 0,
        };
      }

      const summary = {
        totalItems: cart.items.length, // ✅ Use items.length for unique count
        totalQuantity: cart.totalQuantity,
        subtotal: cart.subtotal,
        discount: cart.appliedCoupon?.discount || 0,
        total: cart.subtotal - (cart.appliedCoupon?.discount || 0),
        totalSellers: cart.totalSellers,
        hasUnavailableItems: cart.hasUnavailableItems,
      };

      // Cache for 5 minutes
      await redisService.set(cacheKey, JSON.stringify(summary), 300);

      return summary;
    } catch (error) {
      console.error("❌ Get cart summary error:", error);
      throw error;
    }
  }

  /**
   * Get cart item count (for navbar badge)
   */
  async getCartItemCount(userId, sessionId) {
    try {
      // ✅ Get fresh cart data instead of cached summary
      const cart = await this.getCart(userId, sessionId);

      // ✅ Return actual items.length, not cached value
      const count = cart?.items?.length || 0;

      console.log(
        `[CART COUNT] User: ${userId || sessionId}, Count: ${count}, Items: ${cart?.items?.length || 0}`
      );

      return count;
    } catch (error) {
      console.error("❌ Get cart item count error:", error);
      return 0;
    }
  }

  // ========================================
  // CART MERGING (Guest to User)
  // ========================================

  /**
   * Merge guest cart into user cart (called after login)
   */
  async mergeGuestCart(guestSessionId, userId) {
    try {
      console.log(`🔄 Merging guest cart into user cart...`);

      // 1. Merge carts
      const userCart = await Cart.mergeGuestCart(guestSessionId, userId);

      if (!userCart) {
        console.log("⚠️ No guest cart to merge");
        return {
          success: true,
          message: "No guest cart found to merge",
          cart: await this.getCart(userId, null),
        };
      }

      // 2. Populate cart
      await userCart.populate([
        {
          path: "items.productId",
          select: "name price images status",
        },
        {
          path: "savedItems.productId",
          select: "name price images status",
        },
      ]);

      // 3. Invalidate caches
      await redisService.del(`cart:guest:${guestSessionId}`);
      await redisService.del(`cart:user:${userId}`);

      console.log(`✅ Guest cart merged into user cart`);

      return {
        success: true,
        message: "Cart merged successfully",
        cart: {
          items: userCart.items,
          savedItems: userCart.savedItems,
          totalItems: userCart.totalItems,
          subtotal: userCart.subtotal,
        },
      };
    } catch (error) {
      console.error("❌ Merge guest cart error:", error);
      throw error;
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Clean up expired carts (cron job)
   */
  async cleanupExpiredCarts() {
    try {
      const deletedCount = await Cart.cleanupExpiredCarts();
      console.log(`✅ Cleaned up ${deletedCount} expired carts`);
      return deletedCount;
    } catch (error) {
      console.error("❌ Cleanup expired carts error:", error);
      throw error;
    }
  }

  /**
   * Find abandoned carts (for marketing)
   */
  async findAbandonedCarts(hoursSinceActivity = 24) {
    try {
      const abandonedCarts = await Cart.findAbandoned(hoursSinceActivity);
      console.log(`📊 Found ${abandonedCarts.length} abandoned carts`);
      return abandonedCarts;
    } catch (error) {
      console.error("❌ Find abandoned carts error:", error);
      throw error;
    }
  }

  /**
   * Send cart abandoned notification
   */
  async notifyAbandonedCart(userId) {
    try {
      const cart = await Cart.findOne({ userId }).populate(
        "items.productId",
        "name price images"
      );

      if (!cart || cart.items.length === 0) return;

      await notificationService.createNotification({
        userId,
        userRole: "customer",
        type: "cart_abandoned",
        category: "cart",
        title: "Complete Your Purchase",
        message: `You have ${cart.totalItems} items waiting in your cart. Complete your purchase now!`,
        priority: "low",
        actionType: "view_order",
        actionUrl: `/cart`,
      });
    } catch (error) {
      logger.error("Error sending abandoned cart notification:", error);
    }
  }
}

export default new CartService();
