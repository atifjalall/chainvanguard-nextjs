// api/src/routes/auth.routes.js
import express from "express";
import User from "../models/User.js";
import authService from "../services/auth.service.js";
import sessionService from "../services/session.service.js";
import WalletService from "../services/wallet.service.js";
import {
  authenticate,
  verifyToken,
  authorizeRoles,
  checkRole,
} from "../middleware/auth.middleware.js";

const router = express.Router();
const walletService = new WalletService();

// ============================================
// PUBLIC ROUTES (No Auth Required)
// ============================================

/**
 * POST /api/auth/register
 * Register new user
 */
router.post("/register", async (req, res) => {
  try {
    const {
      walletName,
      password,
      name,
      email,
      phone,
      role,
      address,
      city,
      state,
      country,
      postalCode,
      companyName,
      businessType,
      businessAddress,
      registrationNumber,
      taxId,
      acceptedTerms,
    } = req.body;

    // Validation
    if (!walletName || !password || !name || !email || !phone || !role) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    if (!address || !city || !country) {
      return res.status(400).json({
        success: false,
        error: "Address fields required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 8 characters",
      });
    }

    const validRoles = ["supplier", "vendor", "customer", "expert"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
      });
    }

    if (!acceptedTerms) {
      return res.status(400).json({
        success: false,
        error: "You must accept the terms and conditions",
      });
    }

    // Register user
    const result = await authService.register(req.body);

    res.status(201).json({
      success: true,
      message: "Registration successful!",
      data: result,
      warning: "Save your 12-word recovery phrase securely!",
    });
  } catch (error) {
    console.error("❌ Registration error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: "User already exists",
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || "Registration failed",
    });
  }
});

/**
 * GET /api/auth/check-email
 * Check if email already exists (public - no auth required)
 */
router.get("/check-email", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email parameter is required",
      });
    }

    console.log(`🔍 Checking if email exists: ${email}`);

    // Check if email exists in database
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("email");

    if (existingUser) {
      console.log(`❌ Email already exists: ${email}`);
      return res.json({
        success: true,
        exists: true,
        message: "Email is already registered",
      });
    }

    console.log(`✅ Email available: ${email}`);
    res.json({
      success: true,
      exists: false,
      message: "Email is available",
    });
  } catch (error) {
    console.error("❌ Check email error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check email availability",
    });
  }
});

/**
 * POST /api/auth/login
 * POST /api/auth/login/password (alias)
 * Login with wallet address and password
 */
const loginHandler = async (req, res) => {
  try {
    const { address, walletAddress, password } = req.body;
    const wallet = address || walletAddress;

    if (!wallet || !password) {
      return res.status(400).json({
        success: false,
        error: "Wallet address and password are required",
      });
    }

    const clientIp = req.ip || req.connection.remoteAddress;
    const result = await authService.login(wallet, password, clientIp);

    res.json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    console.error("❌ Login error:", error);

    const statusCode = error.message.includes("Too many") ? 429 : 401;

    res.status(statusCode).json({
      success: false,
      error: error.message || "Login failed",
    });
  }
};

router.post("/login", loginHandler);
router.post("/login/password", loginHandler);

/**
 * POST /api/auth/wallet/find
 * Find wallet address from mnemonic
 */
router.post("/wallet/find", async (req, res) => {
  try {
    const { mnemonic } = req.body;

    if (!mnemonic) {
      return res.status(400).json({
        success: false,
        error: "Mnemonic phrase is required",
      });
    }

    // Rate limiting
    const clientIp = req.ip || req.connection.remoteAddress;
    const rateLimit = await sessionService.checkRateLimit(
      `find:${clientIp}`,
      10,
      300000
    );

    if (!rateLimit.allowed) {
      return res.status(429).json({
        success: false,
        error: "Too many attempts. Please try again later.",
      });
    }

    // Generate wallet from mnemonic
    const wallet = await walletService.generateWalletFromMnemonic(mnemonic);

    // Find user
    const user = await User.findOne({
      walletAddress: wallet.address,
    }).select("walletAddress name email role walletName createdAt");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Wallet not found",
      });
    }

    console.log(`✅ Wallet found: ${user.walletAddress}`);

    res.json({
      success: true,
      message: "Wallet found!",
      data: {
        walletAddress: user.walletAddress,
        walletName: user.walletName,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("❌ Wallet find error:", error);
    res.status(400).json({
      success: false,
      error: error.message || "Failed to find wallet",
    });
  }
});

/**
 * POST /api/auth/wallet/recover
 * Recover wallet and reset password
 */
router.post("/wallet/recover", async (req, res) => {
  try {
    const { mnemonic, walletAddress, newPassword } = req.body;

    if (!mnemonic || !walletAddress || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Mnemonic, wallet address, and new password are required",
      });
    }

    // Rate limiting
    const clientIp = req.ip || req.connection.remoteAddress;
    const rateLimit = await sessionService.checkRateLimit(
      `recover:${clientIp}`,
      5,
      600000
    );

    if (!rateLimit.allowed) {
      return res.status(429).json({
        success: false,
        error: "Too many recovery attempts. Please try again later.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: "New password must be at least 8 characters",
      });
    }

    // Verify mnemonic generates the correct address
    const wallet = await walletService.generateWalletFromMnemonic(mnemonic);

    if (wallet.address.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(401).json({
        success: false,
        error: "Invalid mnemonic for this wallet address",
      });
    }

    // Find and update user
    const user = await User.findOne({ walletAddress: wallet.address });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Update password
    user.passwordHash = await walletService.hashPassword(newPassword);
    user.updatedAt = new Date();
    await user.save();

    console.log(`✅ Password reset for: ${user.email}`);

    res.json({
      success: true,
      message: "Password reset successful",
      data: {
        walletAddress: user.walletAddress,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("❌ Wallet recovery error:", error);
    res.status(400).json({
      success: false,
      error: error.message || "Wallet recovery failed",
    });
  }
});

/**
 * POST /api/auth/verify-email
 * Verify email with code (public - no auth required)
 */
router.post("/verify-email", async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        error: "Email and verification code are required",
      });
    }

    const user = await authService.verifyEmail(email, code);

    res.json({
      success: true,
      message: "Email verified successfully",
      data: { user },
    });
  } catch (error) {
    console.error("❌ Email verification error:", error);
    res.status(400).json({
      success: false,
      error: error.message || "Verification failed",
    });
  }
});

// ============================================
// PROTECTED ROUTES (Auth Required)
// ============================================

/**
 * GET /api/auth/me
 * GET /api/auth/profile (alias)
 * Get current user profile
 */
const getProfileHandler = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select(
      "-passwordHash -encryptedMnemonic"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("❌ Get profile error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get profile",
    });
  }
};

router.get("/me", authenticate, getProfileHandler);
router.get("/profile", authenticate, getProfileHandler);

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put("/profile", authenticate, async (req, res) => {
  try {
    const {
      phone,
      companyName,
      businessAddress,
      address,
      city,
      state,
      country,
      postalCode,
    } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Update fields
    if (phone) user.phone = phone;
    if (companyName) user.companyName = companyName;
    if (businessAddress) user.businessAddress = businessAddress;
    if (address) user.address = address;
    if (city) user.city = city;
    if (state) user.state = state;
    if (country) user.country = country;
    if (postalCode) user.postalCode = postalCode;

    user.updatedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: authService.sanitizeUser(user),
    });
  } catch (error) {
    console.error("❌ Profile update error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update profile",
    });
  }
});

/**
 * POST /api/auth/send-verification
 * Send verification code
 */
router.post("/send-verification", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        error: "Email already verified",
      });
    }

    const code = authService.generateVerificationCode();
    await sessionService.storeVerificationCode(user.email, code);

    res.json({
      success: true,
      message: "Verification code sent",
      data: { code }, // Remove in production
    });
  } catch (error) {
    console.error("❌ Send verification error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send verification code",
    });
  }
});

/**
 * PUT /api/auth/change-password
 * Change password
 */
router.put("/change-password", authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Current and new password are required",
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const isValid = await walletService.verifyPassword(
      currentPassword,
      user.passwordHash
    );

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: "Current password is incorrect",
      });
    }

    user.passwordHash = await walletService.hashPassword(newPassword);
    user.updatedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("❌ Password change error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to change password",
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post("/logout", authenticate, async (req, res) => {
  try {
    await authService.logout(req.userId, req.token);

    res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("❌ Logout error:", error);
    res.status(500).json({
      success: false,
      error: "Logout failed",
    });
  }
});

/**
 * POST /api/auth/verify
 * Verify JWT token
 */
router.post("/verify", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Token is required",
      });
    }

    const pkg = await import("jsonwebtoken");
    const { verify } = pkg.default || pkg;

    const decoded = verify(
      token,
      process.env.JWT_SECRET || "your-secret-key-change-in-production"
    );

    res.json({
      success: true,
      data: decoded,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: "Invalid token",
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post("/refresh", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const token = authService.generateToken(user);

    res.json({
      success: true,
      message: "Token refreshed",
      data: { token },
    });
  } catch (error) {
    console.error("❌ Token refresh error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to refresh token",
    });
  }
});

// ============================================
// ADMIN ROUTES (Expert Only)
// ============================================

/**
 * GET /api/auth/users
 * Get all users (Admin only)
 */
router.get(
  "/users",
  authenticate,
  authorizeRoles(["expert"]),
  async (req, res) => {
    try {
      const users = await User.find().select(
        "-passwordHash -encryptedMnemonic"
      );

      res.json({
        success: true,
        data: {
          users,
          total: users.length,
        },
      });
    } catch (error) {
      console.error("❌ Get users error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get users",
      });
    }
  }
);

/**
 * GET /api/auth/stats
 * Get user statistics (Admin only)
 */
router.get(
  "/stats",
  authenticate,
  authorizeRoles(["expert"]),
  async (req, res) => {
    try {
      const [
        totalUsers,
        suppliers,
        vendors,
        customers,
        experts,
        verifiedUsers,
        activeUsers,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: "supplier" }),
        User.countDocuments({ role: "vendor" }),
        User.countDocuments({ role: "customer" }),
        User.countDocuments({ role: "expert" }),
        User.countDocuments({ isVerified: true }),
        User.countDocuments({ isActive: true }),
      ]);

      res.json({
        success: true,
        data: {
          totalUsers,
          suppliers,
          vendors,
          customers,
          experts,
          verifiedUsers,
          activeUsers,
        },
      });
    } catch (error) {
      console.error("❌ Get stats error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get statistics",
      });
    }
  }
);

/**
 * POST /api/auth/wallet/exists
 * Check if wallet address exists in database
 */
router.post("/wallet/exists", async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: "Wallet address is required",
      });
    }

    // Check if wallet exists
    const user = await User.findOne({
      walletAddress: walletAddress.toLowerCase(),
    }).select("walletAddress walletName");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Wallet not found",
      });
    }

    console.log(`✅ Wallet exists: ${user.walletAddress}`);

    res.json({
      success: true,
      message: "Wallet found",
      data: {
        walletAddress: user.walletAddress,
        walletName: user.walletName,
      },
    });
  } catch (error) {
    console.error("❌ Wallet exists check error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check wallet",
    });
  }
});

export default router;
