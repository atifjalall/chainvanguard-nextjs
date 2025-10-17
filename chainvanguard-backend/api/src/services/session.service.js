// api/src/services/session.service.js
import redisService from "./redis.service.js";

class SessionService {
  constructor() {
    this.SESSION_TTL = 86400; // 24 hours
    this.VERIFICATION_CODE_TTL = 600; // 10 minutes
    this.RATE_LIMIT_TTL = 300; // 5 minutes
    this.TOKEN_BLACKLIST_TTL = 604800; // 7 days
  }

  // ============================================
  // SESSION MANAGEMENT
  // ============================================

  async createSession(userId, userData) {
    try {
      const sessionData = {
        userId,
        walletAddress: userData.walletAddress,
        role: userData.role,
        email: userData.email,
        name: userData.name,
        createdAt: new Date().toISOString(),
      };

      // ✅ FIXED: Using set() instead of setWithExpiry()
      const result = await redisService.set(
        `session:${userId}`,
        sessionData,
        this.SESSION_TTL
      );

      if (result) {
        console.log(`✅ Session created for user: ${userId}`);
      }

      return result;
    } catch (error) {
      console.error("❌ Failed to create session:", error);
      return false;
    }
  }

  async getSession(userId) {
    try {
      return await redisService.get(`session:${userId}`);
    } catch (error) {
      console.error("❌ Failed to get session:", error);
      return null;
    }
  }

  async deleteSession(userId) {
    try {
      const result = await redisService.del(`session:${userId}`);
      if (result) {
        console.log(`✅ Session deleted for user: ${userId}`);
      }
      return result;
    } catch (error) {
      console.error("❌ Failed to delete session:", error);
      return false;
    }
  }

  async refreshSession(userId) {
    try {
      const session = await this.getSession(userId);
      if (!session) return false;

      // Update session with new TTL
      return await redisService.set(
        `session:${userId}`,
        { ...session, lastActivity: new Date().toISOString() },
        this.SESSION_TTL
      );
    } catch (error) {
      console.error("❌ Failed to refresh session:", error);
      return false;
    }
  }

  // ============================================
  // VERIFICATION CODES
  // ============================================

  async storeVerificationCode(email, code) {
    try {
      const key = `verification:${email}`;
      const data = {
        code,
        email,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(
          Date.now() + this.VERIFICATION_CODE_TTL * 1000
        ).toISOString(),
        attempts: 0,
      };

      // ✅ FIXED: Using set() with TTL parameter
      const result = await redisService.set(
        key,
        data,
        this.VERIFICATION_CODE_TTL
      );

      if (result) {
        console.log(`✅ Verification code stored for: ${email}`);
      } else {
        console.error(`❌ Failed to store verification code for: ${email}`);
      }

      return result;
    } catch (error) {
      console.error("❌ Failed to store verification code:", error);
      throw error; // Re-throw so caller can handle
    }
  }

  async verifyCode(email, code) {
    try {
      const key = `verification:${email}`;
      const data = await redisService.get(key);

      if (!data) {
        return {
          valid: false,
          message: "Verification code expired or not found",
        };
      }

      // Check attempts
      if (data.attempts >= 5) {
        await redisService.del(key);
        return {
          valid: false,
          message: "Too many failed attempts. Please request a new code.",
        };
      }

      // Verify code
      if (data.code !== code.trim()) {
        data.attempts++;
        await redisService.set(key, data, this.VERIFICATION_CODE_TTL);
        return {
          valid: false,
          message: `Invalid verification code. ${5 - data.attempts} attempts remaining.`,
        };
      }

      // Code is valid - delete it
      await redisService.del(key);
      console.log(`✅ Verification code validated for: ${email}`);

      return {
        valid: true,
        message: "Verification successful",
      };
    } catch (error) {
      console.error("❌ Failed to verify code:", error);
      return {
        valid: false,
        message: "Verification failed. Please try again.",
      };
    }
  }

  // ============================================
  // RATE LIMITING
  // ============================================

  async checkRateLimit(key, maxAttempts = 5, windowMs = 300000) {
    try {
      const data = await redisService.get(key);
      const now = Date.now();

      if (!data) {
        // First attempt
        await redisService.set(
          key,
          { count: 1, startTime: now },
          Math.ceil(windowMs / 1000)
        );
        return {
          allowed: true,
          remaining: maxAttempts - 1,
          resetIn: windowMs,
        };
      }

      const timeElapsed = now - data.startTime;

      // Window expired - reset
      if (timeElapsed > windowMs) {
        await redisService.set(
          key,
          { count: 1, startTime: now },
          Math.ceil(windowMs / 1000)
        );
        return {
          allowed: true,
          remaining: maxAttempts - 1,
          resetIn: windowMs,
        };
      }

      // Check if limit exceeded
      if (data.count >= maxAttempts) {
        const resetIn = windowMs - timeElapsed;
        return {
          allowed: false,
          remaining: 0,
          resetIn,
        };
      }

      // Increment count
      data.count++;
      const remainingTime = Math.ceil((windowMs - timeElapsed) / 1000);
      await redisService.set(key, data, remainingTime);

      return {
        allowed: true,
        remaining: maxAttempts - data.count,
        resetIn: windowMs - timeElapsed,
      };
    } catch (error) {
      console.error("❌ Rate limit check failed:", error);
      // Fail open - allow request but log error
      return { allowed: true, remaining: maxAttempts, resetIn: windowMs };
    }
  }

  async resetRateLimit(key) {
    try {
      return await redisService.del(key);
    } catch (error) {
      console.error("❌ Failed to reset rate limit:", error);
      return false;
    }
  }

  // ============================================
  // TOKEN BLACKLIST
  // ============================================

  async blacklistToken(token) {
    try {
      const key = `blacklist:${token}`;
      const result = await redisService.set(
        key,
        { blacklisted: true, timestamp: new Date().toISOString() },
        this.TOKEN_BLACKLIST_TTL
      );

      if (result) {
        console.log("✅ Token blacklisted");
      }

      return result;
    } catch (error) {
      console.error("❌ Failed to blacklist token:", error);
      return false;
    }
  }

  async isTokenBlacklisted(token) {
    try {
      const key = `blacklist:${token}`;
      const result = await redisService.get(key);
      return !!result;
    } catch (error) {
      console.error("❌ Failed to check token blacklist:", error);
      return false; // Fail open
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  async clearAllSessions() {
    try {
      const keys = await redisService.client.keys("session:*");
      if (keys.length > 0) {
        await Promise.all(keys.map((key) => redisService.del(key)));
        console.log(`✅ Cleared ${keys.length} sessions`);
      }
      return true;
    } catch (error) {
      console.error("❌ Failed to clear sessions:", error);
      return false;
    }
  }

  async getActiveSessionsCount() {
    try {
      const keys = await redisService.client.keys("session:*");
      return keys.length;
    } catch (error) {
      console.error("❌ Failed to count sessions:", error);
      return 0;
    }
  }

  /**
   * Get verification code
   */
  async getVerificationCode(email) {
    try {
      const code = await redisService.get(`verify:${email}`);
      return code;
    } catch (error) {
      console.error("❌ Error getting verification code:", error);
      return null;
    }
  }

  /**
   * Delete verification code
   */
  async deleteVerificationCode(email) {
    try {
      await redisService.del(`verify:${email}`);
      console.log(`✅ Verification code deleted for: ${email}`);
    } catch (error) {
      console.error("❌ Error deleting verification code:", error);
    }
  }
}

export default new SessionService();
