import pkg from "jsonwebtoken";
import User from "../models/User.js";
import sessionService from "../services/session.service.js";

const { verify } = pkg;

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

/**
 * 🔐 Main Authentication Middleware
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

    // 4. Check session in Redis (fast check)
    const session = await sessionService.getSession(decoded.userId);
    if (!session) {
      return res.status(401).json({
        success: false,
        error: "Session expired",
      });
    }

    // 5. Get user from MongoDB (source of truth)
    const user = await User.findById(decoded.userId).select(
      "-passwordHash -encryptedMnemonic"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User not found",
      });
    }

    // 6. Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: "Account deactivated",
      });
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
export const authorizeRoles = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${allowedRoles.join(" or ")}`,
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
 * ⚙️ Optional Authentication (for public routes)
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(); // Continue without auth
    }

    const token = authHeader.split(" ")[1];
    const decoded = verify(token, JWT_SECRET);

    const user = await User.findById(decoded.userId).select(
      "-passwordHash -encryptedMnemonic"
    );

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
