import mongoose from "mongoose";
import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";
import notificationService from "./notification.service.js";

class WishlistService {
  /**
   * Get user's wishlist
   * FIXED: Handles both Product and Inventory items
   */
  async getWishlist(userId) {
    try {
      // Get wishlist WITHOUT populate first
      let wishlist = await Wishlist.findOne({ userId });

      if (!wishlist) {
        wishlist = new Wishlist({ userId, items: [] });
        await wishlist.save();

        return {
          success: true,
          wishlist,
          itemCount: 0,
        };
      }

      // Manually populate items - check both Product and Inventory
      const Inventory = mongoose.model("Inventory");
      const populatedItems = [];
      const invalidItemIds = [];

      for (const item of wishlist.items) {
        const productId = item.productId;

        // Try Product first
        let product = await Product.findById(productId)
          .populate("sellerId", "name companyName")
          .select(
            "name price images category subcategory quantity status sellerId description"
          );

        // If not found in Product, try Inventory
        if (!product) {
          product = await Inventory.findById(productId)
            .populate("supplierId", "name companyName")
            .select(
              "name pricePerUnit images category subcategory quantity status supplierId description"
            );

          if (product) {
            // Normalize Inventory fields to match Product structure
            product.price = product.pricePerUnit;
            product.sellerId = product.supplierId;
          }
        }

        // If found in either collection, add to populated items
        if (product) {
          populatedItems.push({
            ...item.toObject(),
            productId: product,
          });
        } else {
          // Mark for removal if not found in either collection
          invalidItemIds.push(productId);
        }
      }

      // If there are invalid items, remove them atomically
      if (invalidItemIds.length > 0) {
        console.log(
          "🗑️ Removing invalid items from wishlist:",
          invalidItemIds.length
        );

        wishlist = await Wishlist.findOneAndUpdate(
          { userId },
          { $pull: { items: { productId: { $in: invalidItemIds } } } },
          { new: true }
        );

        // Re-populate after cleanup
        const cleanedItems = [];
        for (const item of wishlist.items) {
          const productId = item.productId;

          let product = await Product.findById(productId)
            .populate("sellerId", "name companyName")
            .select(
              "name price images category subcategory quantity status sellerId description"
            );

          if (!product) {
            product = await Inventory.findById(productId)
              .populate("supplierId", "name companyName")
              .select(
                "name pricePerUnit images category subcategory quantity status supplierId description"
              );

            if (product) {
              product.price = product.pricePerUnit;
              product.sellerId = product.supplierId;
            }
          }

          if (product) {
            cleanedItems.push({
              ...item.toObject(),
              productId: product,
            });
          }
        }

        // Create response with populated items
        const responseWishlist = {
          ...wishlist.toObject(),
          items: cleanedItems,
        };

        return {
          success: true,
          wishlist: responseWishlist,
          itemCount: cleanedItems.length,
        };
      }

      // Create response with populated items
      const responseWishlist = {
        ...wishlist.toObject(),
        items: populatedItems,
      };

      return {
        success: true,
        wishlist: responseWishlist,
        itemCount: populatedItems.length,
      };
    } catch (error) {
      console.error("❌ Get wishlist error:", error);
      throw error;
    }
  }

  /**
   * Add product to wishlist
   * FIXED: Uses atomic $push operation
   */
  async addToWishlist(userId, productId, options = {}) {
    try {
      const {
        notes,
        notifyOnPriceDrop = false,
        notifyOnBackInStock = false,
      } = options;

      // Check if product exists (try Product first, then Inventory)
      let product = await Product.findById(productId);
      let isInventory = false;

      if (!product) {
        // Check if it's an inventory item
        const Inventory = mongoose.model("Inventory");
        product = await Inventory.findById(productId);
        isInventory = true;
      }

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
        await wishlist.save();
      }

      // Check if already in wishlist
      const exists = wishlist.items.some(
        (item) => item.productId.toString() === productId
      );

      if (exists) {
        throw new Error("Product already in wishlist");
      }

      // Use atomic update to add item - prevents version conflicts
      const newItem = {
        productId,
        notes,
        addedAt: new Date(),
        priceWhenAdded: product.price || product.pricePerUnit || 0,
        notifyOnPriceDrop,
        notifyOnBackInStock,
      };

      wishlist = await Wishlist.findOneAndUpdate(
        { userId },
        { $push: { items: newItem } },
        { new: true }
      ).populate({
        path: "items.productId",
        select: "name price images category quantity status sellerId",
        populate: {
          path: "sellerId",
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
   * FIXED: Uses atomic $pull operation
   */
  async removeFromWishlist(userId, productId) {
    try {
      // Use atomic update to remove item - prevents version conflicts
      const wishlist = await Wishlist.findOneAndUpdate(
        { userId },
        { $pull: { items: { productId: productId } } },
        { new: true }
      );

      if (!wishlist) {
        throw new Error("Wishlist not found");
      }

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
   * FIXED: Uses atomic positional $ operator
   */
  async updateWishlistItem(userId, productId, updates) {
    try {
      // Build the update object dynamically
      const updateObj = {};
      if (updates.notes !== undefined) {
        updateObj["items.$.notes"] = updates.notes;
      }
      if (updates.notifyOnPriceDrop !== undefined) {
        updateObj["items.$.notifyOnPriceDrop"] = updates.notifyOnPriceDrop;
      }
      if (updates.notifyOnBackInStock !== undefined) {
        updateObj["items.$.notifyOnBackInStock"] = updates.notifyOnBackInStock;
      }

      // Use atomic update with positional operator - prevents version conflicts
      const wishlist = await Wishlist.findOneAndUpdate(
        { userId, "items.productId": productId },
        { $set: updateObj },
        { new: true }
      );

      if (!wishlist) {
        throw new Error("Wishlist or product not found");
      }

      const item = wishlist.items.find(
        (item) => item.productId.toString() === productId
      );

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
   * FIXED: Uses atomic $set operation
   */
  async clearWishlist(userId) {
    try {
      // Use atomic update to clear all items - prevents version conflicts
      const wishlist = await Wishlist.findOneAndUpdate(
        { userId },
        { $set: { items: [] } },
        { new: true }
      );

      if (!wishlist) {
        throw new Error("Wishlist not found");
      }

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
          if (product && product.status === "active" && product.quantity > 0) {
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
   * FIXED: Uses atomic updates for price changes
   */
  async checkPriceDrops() {
    try {
      const wishlists = await Wishlist.find({
        "items.notifyOnPriceDrop": true,
      }).populate("items.productId");

      for (const wishlist of wishlists) {
        const updates = [];

        for (let i = 0; i < wishlist.items.length; i++) {
          const item = wishlist.items[i];

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

              // Track which items need price updates
              updates.push({
                productId: item.productId._id,
                newPrice: currentPrice,
              });
            }
          }
        }

        // Use atomic bulk update for all price changes
        if (updates.length > 0) {
          for (const update of updates) {
            await Wishlist.findOneAndUpdate(
              {
                _id: wishlist._id,
                "items.productId": update.productId,
              },
              {
                $set: { "items.$.priceWhenAdded": update.newPrice },
              }
            );
          }
        }
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
        "price category quantity status"
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
            item.productId?.status === "active" && item.productId?.quantity > 0
        ).length,
        outOfStockItems: validItems.filter(
          (item) => item.productId?.quantity === 0
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

  /**
   * Notify price drop for wishlist items
   */
  async notifyPriceDrop(productId, oldPrice, newPrice) {
    try {
      const wishlists = await Wishlist.find({ "items.productId": productId });
      const product = await Product.findById(productId);

      for (const wishlist of wishlists) {
        await notificationService.createNotification({
          userId: wishlist.userId,
          userRole: "customer",
          type: "product_price_changed",
          category: "product",
          title: "Price Drop Alert!",
          message: `"${product.name}" price dropped from $${oldPrice.toFixed(2)} to $${newPrice.toFixed(2)}`,
          productId: product._id,
          priority: "medium",
          actionType: "view_product",
          actionUrl: `/products/${product._id}`,
        });
      }
    } catch (error) {
      console.error("Error notifying price drop:", error);
    }
  }
}

export default new WishlistService();
