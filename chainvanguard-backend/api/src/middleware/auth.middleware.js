import pkg from "jsonwebtoken";
import User from "../models/User.js";
import sessionService from "../services/session.service.js";
import { isMongoHealthy } from "../utils/safeMode/mongoHealth.js";
import { extractUserByWallet } from "../utils/safeMode/ipfsExtractor.js";
import mongoose from "mongoose";

const { verify } = pkg;

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

/**
 * Main Authentication Middleware
 * Verifies JWT token + checks Redis session + validates MongoDB user
 */
export const authenticate = async (req, res, next) => {
  try {
    // 1. Extract token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    // 2. Check if token is blacklisted (Redis)
    const isBlacklisted = await sessionService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        error: "Token has been revoked",
      });
    }

    // 3. Verify JWT token
    let decoded;
    try {
      decoded = verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error:
          error.name === "TokenExpiredError"
            ? "Token expired"
            : "Invalid token",
      });
    }

    const userId = decoded?.id || decoded?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Invalid token payload",
      });
    }

    // 4. Check session in Redis (fast check)
    const session = await sessionService.getSession(decoded.userId);
    if (!session) {
      return res.status(401).json({
        success: false,
        error: "Session expired",
      });
    }

    // 5. Get user from MongoDB OR backup data (in safe mode)
    let user = null;
    const mongoHealthy = mongoose.connection.readyState === 1;

    if (mongoHealthy) {
      // Normal mode - get from MongoDB
      user = await User.findById(decoded.userId).select(
        "-passwordHash -encryptedMnemonic"
      );
    } else {
      // Safe mode - get from backup data
      console.log(`⚠️  Safe mode: Getting user from backup for auth middleware`);

      try {
        // Extract user by wallet address from backup
        const walletAddress = decoded.walletAddress;

        if (walletAddress) {
          const backupUser = await extractUserByWallet(walletAddress);

          if (backupUser) {
            // Transform backup user to match expected format
            user = {
              _id: backupUser._id,
              walletAddress: backupUser.walletAddress,
              role: backupUser.role,
              email: backupUser.email,
              name: backupUser.name,
              isVerified: backupUser.isVerified,
              isActive: backupUser.isActive !== false, // Default to true if not set
              forceLogoutAt: backupUser.forceLogoutAt,
              tokenVersion: backupUser.tokenVersion
            };

            console.log(`✅ User loaded from backup: ${user.email}`);
          }
        }
      } catch (backupError) {
        console.error('❌ Failed to load user from backup:', backupError.message);
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User not found",
      });
    }

    // If the account was disabled — explicitly reject and communicate
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        error: "Account disabled. Contact support or log in again.",
      });
    }

    // Token iat is seconds — compare with forceLogoutAt (ms)
    if (user.forceLogoutAt) {
      const tokenIat = (decoded?.iat || 0) * 1000; // convert to ms
      const forceAt = new Date(user.forceLogoutAt).getTime();
      if (tokenIat < forceAt) {
        return res.status(401).json({
          success: false,
          error: "Session invalidated. Please log in again.",
        });
      }
    }

    // If token version is present in token — check mismatch
    if (
      decoded?.tokenVersion !== undefined &&
      user.tokenVersion !== undefined
    ) {
      if (decoded.tokenVersion !== user.tokenVersion) {
        return res.status(401).json({
          success: false,
          error: "Session invalidated. Please log in again.",
        });
      }
    }

    // 7. Refresh session activity (async - don't block)
    sessionService.refreshSession(decoded.userId).catch((err) => {
      console.warn("⚠️ Failed to refresh session:", err);
    });

    // 8. Attach user info to request
    req.user = {
      userId: user._id.toString(),
      walletAddress: user.walletAddress,
      role: user.role,
      email: user.email,
      name: user.name,
      isVerified: user.isVerified,
      isActive: user.isActive,
    };
    req.userId = user._id.toString();
    req.userRole = user.role;
    req.walletAddress = user.walletAddress;
    req.token = token;

    next();
  } catch (error) {
    console.error("❌ Auth middleware error:", error);
    res.status(500).json({
      success: false,
      error: "Authentication failed",
    });
  }
};

/**
 * Alias for backward compatibility
 */
export const verifyToken = authenticate;

/**
 * 👮 Role-Based Access Control
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const rolesArray = allowedRoles.flat(); // ADD THIS LINE

    if (!req.userId || !req.userRole) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    if (!rolesArray.includes(req.userRole)) {
      // CHANGE allowedRoles to rolesArray
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${rolesArray.join(" or ")}`,
      });
    }

    next();
  };
};

/**
 * Alias for backward compatibility
 */
export const checkRole = (...allowedRoles) => {
  return authorizeRoles(allowedRoles);
};

/**
 * 📧 Email Verification Check
 */
export const requireVerification = (req, res, next) => {
  if (!req.user?.isVerified) {
    return res.status(403).json({
      success: false,
      error: "Email verification required",
      emailVerificationRequired: true,
    });
  }
  next();
};

/**
 * Optional Authentication (for public routes)
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(); // Continue without auth
    }

    const token = authHeader.split(" ")[1];
    const decoded = verify(token, JWT_SECRET);

    // Get user from MongoDB OR backup data (in safe mode)
    let user = null;
    const mongoHealthy = mongoose.connection.readyState === 1;

    if (mongoHealthy) {
      // Normal mode - get from MongoDB
      user = await User.findById(decoded.userId).select(
        "-passwordHash -encryptedMnemonic"
      );
    } else {
      // Safe mode - get from backup data
      try {
        const walletAddress = decoded.walletAddress;
        if (walletAddress) {
          const backupUser = await extractUserByWallet(walletAddress);
          if (backupUser) {
            user = {
              _id: backupUser._id,
              walletAddress: backupUser.walletAddress,
              role: backupUser.role,
              email: backupUser.email,
              name: backupUser.name,
              isActive: backupUser.isActive !== false
            };
          }
        }
      } catch (backupError) {
        // Fail silently for optional auth
      }
    }

    if (user && user.isActive) {
      req.user = {
        userId: user._id.toString(),
        walletAddress: user.walletAddress,
        role: user.role,
        email: user.email,
        name: user.name,
      };
      req.userId = user._id.toString();
      req.userRole = user.role;
      req.walletAddress = user.walletAddress;
    }

    next();
  } catch {
    next(); // If token invalid, continue without auth
  }
};

/**
 * 🚦 Rate Limiting Middleware
 */
export const rateLimitMiddleware = (maxAttempts = 100, windowMs = 60000) => {
  return async (req, res, next) => {
    try {
      const identifier = req.userId || req.ip || "anonymous";
      const rateLimit = await sessionService.checkRateLimit(
        `api:${identifier}`,
        maxAttempts,
        windowMs
      );

      if (!rateLimit.allowed) {
        return res.status(429).json({
          success: false,
          error: "Too many requests",
          retryAfter: Math.ceil(rateLimit.resetIn / 1000),
        });
      }

      // Add rate limit info to response headers
      res.setHeader("X-RateLimit-Limit", maxAttempts);
      res.setHeader("X-RateLimit-Remaining", rateLimit.remaining);
      res.setHeader("X-RateLimit-Reset", Math.ceil(rateLimit.resetIn / 1000));

      next();
    } catch (error) {
      console.error("❌ Rate limit middleware error:", error);
      next(); // Fail open - allow request
    }
  };
};

// Export default object for flexibility
export default {
  authenticate,
  verifyToken,
  authorizeRoles,
  checkRole,
  requireVerification,
  optionalAuth,
  rateLimitMiddleware,
};
