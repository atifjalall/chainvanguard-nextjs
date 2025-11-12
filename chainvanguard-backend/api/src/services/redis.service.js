import { redisClient } from "../config/database.js";

class RedisService {
  constructor() {
    this.client = redisClient;
    this.defaultTTL = 600; // 10 minutes
  }

  // ========================================
  // CORE REDIS OPERATIONS
  // ========================================

  // Set value with TTL
  async set(key, value, ttl = this.defaultTTL) {
    try {
      const stringValue = JSON.stringify(value);
      await this.client.setex(key, ttl, stringValue);
      return true;
    } catch (error) {
      console.error("Redis SET error:", error.message);
      return false;
    }
  }

  // Get value
  async get(key) {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error("Redis GET error:", error.message);
      return null;
    }
  }

  // Delete key
  async del(key) {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error("Redis DEL error:", error.message);
      return false;
    }
  }

  // ✅ ADD: Get keys matching a pattern
  async keys(pattern) {
    try {
      const keys = await this.client.keys(pattern);
      return keys || [];
    } catch (error) {
      console.error("Redis KEYS error:", error.message);
      return [];
    }
  }

  // Delete multiple keys by pattern
  async delPattern(pattern) {
    try {
      const keys = await this.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
        console.log(
          `✅ Deleted ${keys.length} keys matching pattern: ${pattern}`
        );
      }
      return true;
    } catch (error) {
      console.error("Redis DEL PATTERN error:", error.message);
      return false;
    }
  }

  // Get TTL (time to live) for a key
  async ttl(key) {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error("Redis TTL error:", error);
      return -1;
    }
  }

  // Get keys matching a pattern (alias for backward compatibility)
  async getKeysByPattern(pattern) {
    return this.keys(pattern);
  }

  // ========================================
  // PRODUCT CACHE MANAGEMENT (EXISTING)
  // ========================================

  // Cache product list
  async cacheProducts(filters, products, ttl = 300) {
    const key = `products:${JSON.stringify(filters)}`;
    return this.set(key, products, ttl);
  }

  // Get cached products
  async getCachedProducts(filters) {
    const key = `products:${JSON.stringify(filters)}`;
    return this.get(key);
  }

  // Cache single product
  async cacheProduct(productId, product, ttl = 600) {
    const key = `product:${productId}`;
    return this.set(key, product, ttl);
  }

  // Get cached product
  async getCachedProduct(productId) {
    const key = `product:${productId}`;
    return this.get(key);
  }

  // Invalidate product cache
  async invalidateProduct(productId) {
    try {
      // Delete specific product cache
      await this.del(`product:${productId}`);

      // Delete all product list caches
      await this.delPattern("products:*");

      // Delete seller-specific caches
      await this.delPattern("products:seller:*");

      // Delete category caches
      await this.delPattern("products:category:*");

      console.log(`✅ All caches invalidated for product: ${productId}`);
      return true;
    } catch (error) {
      console.error("Redis invalidation error:", error);
      return false;
    }
  }

  // ========================================
  // ✅ NEW: INVENTORY CACHE MANAGEMENT
  // ========================================

  /**
   * Cache single inventory item
   */
  async cacheInventoryItem(inventoryId, inventory, ttl = 600) {
    const key = `inventory:item:${inventoryId}`;
    return this.set(key, inventory, ttl);
  }

  /**
   * Get cached inventory item
   */
  async getCachedInventoryItem(inventoryId) {
    const key = `inventory:item:${inventoryId}`;
    return this.get(key);
  }

  /**
   * Cache inventory list
   */
  async cacheInventoryList(cacheKey, inventoryList, ttl = 300) {
    return this.set(cacheKey, inventoryList, ttl);
  }

  /**
   * Cache inventory stats
   */
  async cacheInventoryStats(supplierId, stats, ttl = 300) {
    const key = `inventory:stats:${supplierId || "global"}`;
    return this.set(key, stats, ttl);
  }

  /**
   * Get cached inventory stats
   */
  async getCachedInventoryStats(supplierId) {
    const key = `inventory:stats:${supplierId || "global"}`;
    return this.get(key);
  }

  /**
   * Cache inventory analytics
   */
  async cacheInventoryAnalytics(supplierId, analytics, ttl = 900) {
    const key = `inventory:analytics:${supplierId}`;
    return this.set(key, analytics, ttl);
  }

  /**
   * Get cached inventory analytics
   */
  async getCachedInventoryAnalytics(supplierId) {
    const key = `inventory:analytics:${supplierId}`;
    return this.get(key);
  }

  /**
   * Invalidate all inventory caches for a supplier
   * This is the CRITICAL method for keeping data in sync
   */
  async invalidateInventoryCaches(supplierId = null, inventoryId = null) {
    try {
      const deletedKeys = [];

      // 1. Delete specific inventory item cache
      if (inventoryId) {
        await this.del(`inventory:item:${inventoryId}`);
        deletedKeys.push(`inventory:item:${inventoryId}`);
      }

      // 2. Delete all inventory list caches for this supplier
      if (supplierId) {
        const supplierListKeys = await this.keys(
          `inventory:list:${supplierId}:*`
        );
        if (supplierListKeys.length > 0) {
          await this.client.del(...supplierListKeys);
          deletedKeys.push(...supplierListKeys);
        }

        // Delete supplier-specific stats and analytics
        await this.del(`inventory:stats:${supplierId}`);
        await this.del(`inventory:analytics:${supplierId}`);
        deletedKeys.push(
          `inventory:stats:${supplierId}`,
          `inventory:analytics:${supplierId}`
        );
      }

      // 3. Delete global/all inventory list caches (since they include all suppliers)
      const allListKeys = await this.keys("inventory:list:all:*");
      if (allListKeys.length > 0) {
        await this.client.del(...allListKeys);
        deletedKeys.push(...allListKeys);
      }

      // 4. Delete global stats
      await this.del("inventory:stats:global");
      deletedKeys.push("inventory:stats:global");

      console.log(`✅ Invalidated ${deletedKeys.length} inventory cache keys`, {
        supplierId,
        inventoryId,
        sample: deletedKeys.slice(0, 5),
      });

      return true;
    } catch (error) {
      console.error("❌ Redis inventory cache invalidation error:", error);
      return false;
    }
  }

  /**
   * Clear ALL inventory caches (use with caution - for debugging only)
   */
  async clearAllInventoryCaches() {
    try {
      const patterns = [
        "inventory:item:*",
        "inventory:list:*",
        "inventory:stats:*",
        "inventory:analytics:*",
      ];

      let totalDeleted = 0;
      for (const pattern of patterns) {
        const keys = await this.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(...keys);
          totalDeleted += keys.length;
        }
      }

      console.log(`✅ Cleared ${totalDeleted} inventory cache keys`);
      return true;
    } catch (error) {
      console.error("❌ Error clearing all inventory caches:", error);
      return false;
    }
  }

  /**
   * Get all inventory cache keys (for debugging)
   */
  async getInventoryCacheKeys() {
    try {
      const patterns = [
        "inventory:item:*",
        "inventory:list:*",
        "inventory:stats:*",
        "inventory:analytics:*",
      ];

      const allKeys = {};
      for (const pattern of patterns) {
        const keys = await this.keys(pattern);
        allKeys[pattern] = keys;
      }

      return allKeys;
    } catch (error) {
      console.error("❌ Error getting inventory cache keys:", error);
      return {};
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      const patterns = {
        products: "products:*",
        inventory: "inventory:*",
        sessions: "session:*",
      };

      const stats = {};
      for (const [name, pattern] of Object.entries(patterns)) {
        const keys = await this.keys(pattern);
        stats[name] = {
          count: keys.length,
          keys: keys.slice(0, 10), // Sample of first 10 keys
        };
      }

      return stats;
    } catch (error) {
      console.error("❌ Error getting cache stats:", error);
      return {};
    }
  }

  // ========================================
  // SESSION MANAGEMENT (EXISTING)
  // ========================================

  async setSession(userId, sessionData, ttl = 86400) {
    // 24 hours
    const key = `session:${userId}`;
    return this.set(key, sessionData, ttl);
  }

  async getSession(userId) {
    const key = `session:${userId}`;
    return this.get(key);
  }

  async deleteSession(userId) {
    const key = `session:${userId}`;
    return this.del(key);
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Check if Redis is connected
   */
  isConnected() {
    return this.client && this.client.connected;
  }

  /**
   * Flush entire database (DANGEROUS - use only in development)
   */
  async flushAll() {
    if (process.env.NODE_ENV === "production") {
      console.error("❌ Cannot flush Redis in production!");
      return false;
    }

    try {
      await this.client.flushdb();
      console.log("✅ Redis database flushed");
      return true;
    } catch (error) {
      console.error("❌ Error flushing Redis:", error);
      return false;
    }
  }

  /**
   * Get memory info
   */
  async getMemoryInfo() {
    try {
      const info = await this.client.info("memory");
      return info;
    } catch (error) {
      console.error("❌ Error getting memory info:", error);
      return null;
    }
  }
}

export default new RedisService();
