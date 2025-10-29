import { redisClient } from "../config/database.js";

class RedisService {
  constructor() {
    this.client = redisClient;
    this.defaultTTL = 600; // 10 minutes
  }

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

  // Delete multiple keys by pattern
  async delPattern(pattern) {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      return true;
    } catch (error) {
      console.error("Redis DEL PATTERN error:", error.message);
      return false;
    }
  }

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
      await this.delPattern(`products:seller:*`);

      // Delete category caches
      await this.delPattern(`products:category:*`);

      console.log(`✅ All caches invalidated for product: ${productId}`);
      return true;
    } catch (error) {
      console.error("Redis invalidation error:", error);
      return false;
    }
  }

  // Session management
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

  /**
   * Get TTL (time to live) for a key
   */
  async ttl(key) {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error("Redis TTL error:", error);
      return -1;
    }
  }

  /**
   * Get keys matching a pattern
   */
  async getKeysByPattern(pattern) {
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      console.error("Redis keys pattern error:", error);
      return [];
    }
  }
}

export default new RedisService();
