import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";
import notificationService from "./notification.service.js";

class WishlistService {
  /**
   * Get user's wishlist
   */
  async getWishlist(userId) {
    try {
      let wishlist = await Wishlist.findOne({ userId }).populate({
        path: "items.productId",
        select:
          "name price images category subcategory stock status seller description",
        populate: {
          path: "seller",
          select: "name companyName",
        },
      });

      if (!wishlist) {
        wishlist = new Wishlist({ userId, items: [] });
        await wishlist.save();
      }

      // Filter out deleted or null products
      const validItems = wishlist.items.filter(
        (item) => item.productId !== null
      );

      if (validItems.length !== wishlist.items.length) {
        wishlist.items = validItems;
        await wishlist.save();
      }

      return {
        success: true,
        wishlist,
        itemCount: validItems.length,
      };
    } catch (error) {
      console.error("❌ Get wishlist error:", error);
      throw error;
    }
  }

  /**
   * Add product to wishlist
   */
  async addToWishlist(userId, productId, options = {}) {
    try {
      const {
        notes,
        notifyOnPriceDrop = false,
        notifyOnBackInStock = false,
      } = options;

      // Check if product exists
      const product = await Product.findById(productId);

      if (!product) {
        throw new Error("Product not found");
      }

      if (product.status !== "active") {
        throw new Error("This product is not available");
      }

      // Get or create wishlist
      let wishlist = await Wishlist.findOne({ userId });

      if (!wishlist) {
        wishlist = new Wishlist({ userId, items: [] });
      }

      // Check if already in wishlist
      const exists = wishlist.items.some(
        (item) => item.productId.toString() === productId
      );

      if (exists) {
        throw new Error("Product already in wishlist");
      }

      // Add to wishlist
      wishlist.items.push({
        productId,
        notes,
        addedAt: new Date(),
        priceWhenAdded: product.price,
        notifyOnPriceDrop,
        notifyOnBackInStock,
      });

      await wishlist.save();

      // Populate the wishlist for response
      await wishlist.populate({
        path: "items.productId",
        select: "name price images category stock status seller",
        populate: {
          path: "seller",
          select: "name companyName",
        },
      });

      return {
        success: true,
        message: "Added to wishlist",
        wishlist,
        itemCount: wishlist.items.length,
      };
    } catch (error) {
      console.error("❌ Add to wishlist error:", error);
      throw error;
    }
  }

  /**
   * Remove product from wishlist
   */
  async removeFromWishlist(userId, productId) {
    try {
      const wishlist = await Wishlist.findOne({ userId });

      if (!wishlist) {
        throw new Error("Wishlist not found");
      }

      const initialLength = wishlist.items.length;

      wishlist.items = wishlist.items.filter(
        (item) => item.productId.toString() !== productId
      );

      if (wishlist.items.length === initialLength) {
        throw new Error("Product not found in wishlist");
      }

      await wishlist.save();

      return {
        success: true,
        message: "Removed from wishlist",
        itemCount: wishlist.items.length,
      };
    } catch (error) {
      console.error("❌ Remove from wishlist error:", error);
      throw error;
    }
  }

  /**
   * Update wishlist item
   */
  async updateWishlistItem(userId, productId, updates) {
    try {
      const wishlist = await Wishlist.findOne({ userId });

      if (!wishlist) {
        throw new Error("Wishlist not found");
      }

      const item = wishlist.items.find(
        (item) => item.productId.toString() === productId
      );

      if (!item) {
        throw new Error("Product not found in wishlist");
      }

      // Update allowed fields
      if (updates.notes !== undefined) item.notes = updates.notes;
      if (updates.notifyOnPriceDrop !== undefined)
        item.notifyOnPriceDrop = updates.notifyOnPriceDrop;
      if (updates.notifyOnBackInStock !== undefined)
        item.notifyOnBackInStock = updates.notifyOnBackInStock;

      await wishlist.save();

      return {
        success: true,
        message: "Wishlist item updated",
        item,
      };
    } catch (error) {
      console.error("❌ Update wishlist item error:", error);
      throw error;
    }
  }

  /**
   * Clear entire wishlist
   */
  async clearWishlist(userId) {
    try {
      const wishlist = await Wishlist.findOne({ userId });

      if (!wishlist) {
        throw new Error("Wishlist not found");
      }

      wishlist.items = [];
      await wishlist.save();

      return {
        success: true,
        message: "Wishlist cleared",
      };
    } catch (error) {
      console.error("❌ Clear wishlist error:", error);
      throw error;
    }
  }

  /**
   * Move wishlist items to cart
   */
  async moveToCart(userId, productIds) {
    try {
      const wishlist = await Wishlist.findOne({ userId });

      if (!wishlist) {
        throw new Error("Wishlist not found");
      }

      if (!productIds || productIds.length === 0) {
        throw new Error("No products specified");
      }

      // Get product details
      const products = [];
      for (const productId of productIds) {
        const item = wishlist.items.find(
          (item) => item.productId.toString() === productId
        );

        if (item) {
          const product = await Product.findById(productId);
          if (product && product.status === "active" && product.stock > 0) {
            products.push({
              productId,
              name: product.name,
              price: product.price,
              available: true,
            });
          } else {
            products.push({
              productId,
              name: product?.name || "Unknown",
              available: false,
              reason: !product
                ? "Not found"
                : product.status !== "active"
                  ? "Not available"
                  : "Out of stock",
            });
          }
        }
      }

      return {
        success: true,
        products,
        message: "Products ready to add to cart",
      };
    } catch (error) {
      console.error("❌ Move to cart error:", error);
      throw error;
    }
  }

  /**
   * Check for price drops and notify users
   */
  async checkPriceDrops() {
    try {
      const wishlists = await Wishlist.find({
        "items.notifyOnPriceDrop": true,
      }).populate("items.productId");

      for (const wishlist of wishlists) {
        for (const item of wishlist.items) {
          if (item.notifyOnPriceDrop && item.productId) {
            const currentPrice = item.productId.price;
            const originalPrice = item.priceWhenAdded;

            // If price dropped by more than 5%
            if (currentPrice < originalPrice * 0.95) {
              const discountPercent = Math.round(
                ((originalPrice - currentPrice) / originalPrice) * 100
              );

              await notificationService.createNotification({
                recipientId: wishlist.userId,
                title: "🔥 Price Drop Alert!",
                message: `${item.productId.name} is now ${discountPercent}% cheaper! Was PKR ${originalPrice}, now PKR ${currentPrice}`,
                category: "wishlist",
                priority: "medium",
                action: {
                  type: "view_product",
                  url: `/products/${item.productId._id}`,
                },
                metadata: {
                  productId: item.productId._id.toString(),
                  originalPrice,
                  currentPrice,
                  discountPercent,
                },
              });

              // Update price
              item.priceWhenAdded = currentPrice;
            }
          }
        }

        await wishlist.save();
      }

      return {
        success: true,
        message: "Price drop check completed",
      };
    } catch (error) {
      console.error("❌ Check price drops error:", error);
      throw error;
    }
  }

  /**
   * Check if product is in user's wishlist
   */
  async isInWishlist(userId, productId) {
    try {
      const wishlist = await Wishlist.findOne({ userId });

      if (!wishlist) {
        return { success: true, inWishlist: false };
      }

      const exists = wishlist.items.some(
        (item) => item.productId.toString() === productId
      );

      return {
        success: true,
        inWishlist: exists,
      };
    } catch (error) {
      console.error("❌ Check wishlist error:", error);
      throw error;
    }
  }

  /**
   * Get wishlist statistics
   */
  async getWishlistStats(userId) {
    try {
      const wishlist = await Wishlist.findOne({ userId }).populate(
        "items.productId",
        "price category stock status"
      );

      if (!wishlist) {
        return {
          success: true,
          stats: {
            totalItems: 0,
            totalValue: 0,
            availableItems: 0,
            outOfStockItems: 0,
            categoryCounts: {},
          },
        };
      }

      const validItems = wishlist.items.filter((item) => item.productId);

      const stats = {
        totalItems: validItems.length,
        totalValue: validItems.reduce(
          (sum, item) => sum + (item.productId?.price || 0),
          0
        ),
        availableItems: validItems.filter(
          (item) =>
            item.productId?.status === "active" && item.productId?.stock > 0
        ).length,
        outOfStockItems: validItems.filter(
          (item) => item.productId?.stock === 0
        ).length,
        categoryCounts: {},
      };

      // Count by category
      validItems.forEach((item) => {
        if (item.productId?.category) {
          const cat = item.productId.category;
          stats.categoryCounts[cat] = (stats.categoryCounts[cat] || 0) + 1;
        }
      });

      return {
        success: true,
        stats,
      };
    } catch (error) {
      console.error("❌ Get wishlist stats error:", error);
      throw error;
    }
  }
}

export default new WishlistService();
