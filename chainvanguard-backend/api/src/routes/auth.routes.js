// ============================================
// STORAGE ARCHITECTURE
// ============================================
// Local JSON (users.json):
//   - Fast authentication lookups
//   - Password hashes and encrypted mnemonics
//   - Session management (isAuthenticated, lastLoginAt)
//
// Blockchain (Hyperledger Fabric):
//   - Source of truth for user data
//   - Immutable audit trail
//   - Transparent and verifiable
//   - Admin queries (getAllUsers, getUserStats)
//
// Flow:
//   1. Registration: Save locally + sync to blockchain
//   2. Login: Check locally + record on blockchain
//   3. Admin queries: Always fetch from blockchain
// ============================================

import express from "express";
import WalletService from "../services/wallet.service.js";
import FabricService from "../services/fabric.service.js";
import fs from "fs";
import path from "path";
import CryptoJS from "crypto-js";

const router = express.Router();
const walletService = new WalletService();

// Encryption key for mnemonics (in production, use env variable)
const MNEMONIC_ENCRYPTION_KEY =
  process.env.MNEMONIC_KEY ||
  "your-secret-mnemonic-encryption-key-change-in-production";

// Temporary storage for auth challenges (in production, use Redis)
const authChallenges = new Map();

// In-memory user storage (in production, use proper database like MongoDB/PostgreSQL)
let users = [];

// Initialize user storage
const usersFilePath = path.join(process.cwd(), "data", "users.json");
try {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (fs.existsSync(usersFilePath)) {
    const usersData = fs.readFileSync(usersFilePath, "utf8");
    users = JSON.parse(usersData);
    console.log(`✅ Loaded ${users.length} users from storage`);
  } else {
    fs.writeFileSync(usersFilePath, JSON.stringify([], null, 2));
    console.log("✅ Created new users storage file");
  }
} catch (error) {
  console.error("❌ Error loading users:", error.message);
}

// Helper function to save users
const saveUsers = () => {
  try {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    console.log("✅ Users saved to storage");
  } catch (error) {
    console.error("❌ Error saving users:", error.message);
    throw new Error("Failed to save user data");
  }
};

// Helper to encrypt mnemonic (production security)
const encryptMnemonic = (mnemonic) => {
  return CryptoJS.AES.encrypt(mnemonic, MNEMONIC_ENCRYPTION_KEY).toString();
};

// Helper to decrypt mnemonic (production security)
const decryptMnemonic = (encryptedMnemonic) => {
  const bytes = CryptoJS.AES.decrypt(
    encryptedMnemonic,
    MNEMONIC_ENCRYPTION_KEY
  );
  return bytes.toString(CryptoJS.enc.Utf8);
};

// Rate limiting helper (simple implementation)
const rateLimitMap = new Map();
const checkRateLimit = (identifier, maxRequests = 5, windowMs = 60000) => {
  const now = Date.now();
  const userRequests = rateLimitMap.get(identifier) || [];
  const recentRequests = userRequests.filter(
    (timestamp) => now - timestamp < windowMs
  );

  if (recentRequests.length >= maxRequests) {
    return false;
  }

  recentRequests.push(now);
  rateLimitMap.set(identifier, recentRequests);
  return true;
};

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Access token required",
    });
  }

  try {
    const decoded = walletService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
};

// ============================================
// WALLET MANAGEMENT ENDPOINTS
// ============================================

/**
 * POST /api/auth/wallet/create
 * Generate new wallet with mnemonic
 */
router.post("/wallet/create", async (req, res) => {
  try {
    const { password } = req.body;

    // Rate limiting
    const clientIp = req.ip || req.connection.remoteAddress;
    if (!checkRateLimit(clientIp, 3, 300000)) {
      // 3 requests per 5 minutes
      return res.status(429).json({
        success: false,
        error: "Too many wallet creation attempts. Please try again later.",
      });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 8 characters long",
      });
    }

    // Generate new wallet
    const wallet = walletService.generateWallet();

    // Encrypt private key with password
    const encryptedKey = walletService.encryptPrivateKey(
      wallet.privateKey,
      password
    );

    res.status(201).json({
      success: true,
      message: "Wallet created successfully",
      data: {
        address: wallet.address,
        mnemonic: wallet.mnemonic,
        encryptedPrivateKey: encryptedKey,
      },
      warning:
        "⚠️ SAVE YOUR MNEMONIC PHRASE! This is the ONLY way to recover your wallet.",
    });
  } catch (error) {
    console.error("Create wallet error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create wallet. Please try again.",
    });
  }
});

/**
 * POST /api/auth/wallet/recover
 * Recover wallet and reset password
 *
 * Method 1: Provide mnemonic + walletAddress (most secure)
 * Method 2: Provide only mnemonic (we'll find the wallet for you)
 */
router.post("/wallet/recover", async (req, res) => {
  try {
    const { mnemonic, walletAddress, newPassword } = req.body;

    // Rate limiting
    const clientIp = req.ip || req.connection.remoteAddress;
    if (!checkRateLimit(`recover_${clientIp}`, 5, 600000)) {
      return res.status(429).json({
        success: false,
        error: "Too many recovery attempts. Please try again later.",
      });
    }

    // Validation
    if (!mnemonic || !mnemonic.trim()) {
      return res.status(400).json({
        success: false,
        error: "Mnemonic phrase is required",
      });
    }

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: "New password must be at least 8 characters long",
      });
    }

    // Validate mnemonic format
    if (!walletService.isValidMnemonic(mnemonic.trim())) {
      return res.status(400).json({
        success: false,
        error: "Invalid mnemonic phrase format",
      });
    }

    // ========================================
    // METHOD 1: Find by wallet address (if provided)
    // ========================================
    let user;

    if (walletAddress) {
      // Validate wallet address format
      if (!walletService.isValidAddress(walletAddress.trim())) {
        return res.status(400).json({
          success: false,
          error: "Invalid wallet address format",
        });
      }

      // Find user by wallet address
      user = users.find(
        (u) =>
          u.walletAddress.toLowerCase() === walletAddress.toLowerCase().trim()
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "No account found with this wallet address",
        });
      }

      // Verify mnemonic matches
      if (!user.encryptedMnemonic) {
        return res.status(400).json({
          success: false,
          error: "This account does not have a recovery phrase configured",
        });
      }

      let decryptedMnemonic;
      try {
        decryptedMnemonic = decryptMnemonic(user.encryptedMnemonic);
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: "Failed to verify recovery phrase",
        });
      }

      if (
        decryptedMnemonic.toLowerCase().trim() !== mnemonic.toLowerCase().trim()
      ) {
        return res.status(401).json({
          success: false,
          error: "Recovery phrase does not match this wallet address",
        });
      }

      console.log(
        `✅ Method 1: Mnemonic verified for wallet: ${walletAddress}`
      );
    }
    // ========================================
    // METHOD 2: Find by mnemonic only
    // ========================================
    else {
      user = users.find((u) => {
        if (!u.encryptedMnemonic) return false;
        try {
          const decryptedMnemonic = decryptMnemonic(u.encryptedMnemonic);
          return (
            decryptedMnemonic.toLowerCase().trim() ===
            mnemonic.toLowerCase().trim()
          );
        } catch {
          return false;
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "No account found with this recovery phrase",
        });
      }

      console.log(
        `✅ Method 2: Wallet found by mnemonic: ${user.walletAddress}`
      );
    }

    // ========================================
    // UPDATE PASSWORD
    // ========================================
    const newPasswordHash = await walletService.hashPassword(newPassword);

    // Recover wallet to get private key
    const wallet = walletService.recoverFromMnemonic(mnemonic);

    // Encrypt private key with new password
    const encryptedKey = walletService.encryptPrivateKey(
      wallet.privateKey,
      newPassword
    );

    // Update user's password
    user.passwordHash = newPasswordHash;
    user.updatedAt = new Date().toISOString();
    saveUsers();

    console.log(
      `✅ Password reset successful for: ${user.name} (${user.walletAddress})`
    );

    res.json({
      success: true,
      message:
        "Wallet recovered successfully. You can now login with your new password.",
      data: {
        address: user.walletAddress,
        encryptedPrivateKey: encryptedKey,
        user: {
          name: user.name,
          email: user.email,
          role: user.role,
          walletName: user.walletName,
        },
      },
    });
  } catch (error) {
    console.error("Wallet recovery error:", error);
    res.status(500).json({
      success: false,
      error: "Wallet recovery failed. Please check your recovery details.",
    });
  }
});

/**
 * POST /api/auth/wallet/find
 * Find wallet address from mnemonic phrase (Step 1 of recovery)
 * User provides only mnemonic, system returns wallet address
 */
router.post("/wallet/find", async (req, res) => {
  try {
    const { mnemonic } = req.body;

    // Rate limiting
    const clientIp = req.ip || req.connection.remoteAddress;
    if (!checkRateLimit(`find_${clientIp}`, 10, 300000)) {
      return res.status(429).json({
        success: false,
        error: "Too many search attempts. Please try again later.",
      });
    }

    // Validation
    if (!mnemonic || !mnemonic.trim()) {
      return res.status(400).json({
        success: false,
        error: "Mnemonic phrase is required",
      });
    }

    // Validate mnemonic format
    if (!walletService.isValidMnemonic(mnemonic.trim())) {
      return res.status(400).json({
        success: false,
        error: "Invalid mnemonic phrase format",
      });
    }

    // Find user by encrypted mnemonic
    const user = users.find((u) => {
      if (!u.encryptedMnemonic) return false;
      try {
        const decryptedMnemonic = decryptMnemonic(u.encryptedMnemonic);
        return (
          decryptedMnemonic.toLowerCase().trim() ===
          mnemonic.toLowerCase().trim()
        );
      } catch {
        return false;
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "No account found with this recovery phrase",
      });
    }

    console.log(`✅ Wallet found for mnemonic: ${user.walletAddress}`);

    // Return wallet info (but NOT sensitive data)
    res.json({
      success: true,
      message: "Wallet found! Use this address to reset your password.",
      data: {
        walletAddress: user.walletAddress,
        walletName: user.walletName,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      nextStep:
        "Use this wallet address with your mnemonic to reset your password at /api/auth/wallet/recover",
    });
  } catch (error) {
    console.error("Wallet find error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to find wallet. Please try again.",
    });
  }
});

// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================

/**
 * POST /api/auth/register
 * Register new user with COMPLETE profile
 *
 * Required for ALL users:
 * - walletName, password, name, email, phone, role
 * - address (physical/shipping address)
 * - country, city, state/province, postalCode
 *
 * Additional for supplier/vendor:
 * - companyName, businessType, businessAddress
 * - registrationNumber, taxId
 */
router.post("/register", async (req, res) => {
  const fabricService = new FabricService();

  try {
    const {
      // Basic Info (ALL users)
      walletName,
      password,
      name,
      email,
      phone,
      role,

      // Address Info (ALL users)
      address, // Physical/Shipping address
      city,
      state, // State/Province
      country,
      postalCode,

      // Business Info (supplier/vendor only)
      companyName,
      businessType,
      businessAddress, // Business location
      registrationNumber,
      taxId,

      // Optional
      profileImage,
      acceptedTerms,
    } = req.body;

    // ========================================
    // STEP 1: VALIDATION
    // ========================================

    // Check mandatory fields for ALL users
    if (!walletName || !password || !name || !email || !phone || !role) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: walletName, password, name, email, phone, role",
      });
    }

    // Check address fields for ALL users
    if (!address || !city || !country) {
      return res.status(400).json({
        success: false,
        error: "Address fields required: address, city, country",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 8 characters",
      });
    }

    const validRoles = ["supplier", "vendor", "customer", "bdlt-expert"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
      });
    }

    // Check if user already exists by email
    const existingUser = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "User with this email already exists",
      });
    }

    // Validate business info for supplier/vendor ONLY
    const requiresBusinessInfo = ["supplier", "vendor"].includes(role);
    if (requiresBusinessInfo) {
      if (
        !companyName ||
        !businessType ||
        !businessAddress ||
        !registrationNumber
      ) {
        return res.status(400).json({
          success: false,
          error:
            "For suppliers and vendors, required fields: companyName, businessType, businessAddress, registrationNumber",
        });
      }
    }

    if (!acceptedTerms) {
      return res.status(400).json({
        success: false,
        error: "You must accept the terms and conditions",
      });
    }

    // ========================================
    // STEP 2: AUTO-GENERATE WALLET CREDENTIALS
    // ========================================
    console.log(`🔐 Generating wallet for: ${name}`);
    const wallet = walletService.generateWallet();

    console.log(`✅ Wallet generated: ${wallet.address}`);
    console.log(`📝 Mnemonic (12 words): ${wallet.mnemonic}`);

    // ========================================
    // STEP 3: PREPARE USER DATA
    // ========================================
    const passwordHash = await walletService.hashPassword(password);
    const encryptedMnemonicForStorage = encryptMnemonic(wallet.mnemonic);

    const getMSPForRole = (userRole) => {
      const mspMap = {
        supplier: "SupplierMSP",
        vendor: "VendorMSP",
        customer: "CustomerMSP",
        "bdlt-expert": "ExpertMSP",
      };
      return mspMap[userRole] || "Org1MSP";
    };

    const user = {
      // ===== System Generated =====
      id: `USER_${Date.now()}`,
      walletAddress: wallet.address.toLowerCase(),
      passwordHash: passwordHash,
      encryptedMnemonic: encryptedMnemonicForStorage,
      networkType: "hyperledger-fabric",
      organizationMSP: getMSPForRole(role),

      // ===== User Provided - Basic Info =====
      walletName: walletName.trim(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      role: role,
      profileImage: profileImage || "",

      // ===== User Provided - Address Info =====
      address: address.trim(),
      city: city.trim(),
      state: state?.trim() || "",
      country: country.trim(),
      postalCode: postalCode?.trim() || "",

      // ===== Business Info (supplier/vendor only) =====
      companyName: companyName?.trim() || "",
      businessType: businessType?.trim() || "",
      businessAddress: businessAddress?.trim() || "",
      registrationNumber: registrationNumber?.trim() || "",
      taxId: taxId?.trim() || "",

      // ===== Financial Data =====
      balance: 0.0, // Current wallet balance
      totalRevenue: 0.0, // Total income earned
      totalExpenses: 0.0, // Total amount spent
      pendingPayments: 0.0, // Payments awaiting confirmation
      escrowBalance: 0.0, // Funds in escrow

      // ===== Transaction Statistics =====
      totalTransactions: 0, // Total number of transactions
      successfulTransactions: 0, // Completed transactions
      pendingTransactions: 0, // Transactions in progress
      failedTransactions: 0, // Failed transactions

      // ===== Sales/Purchase Data =====
      totalSales: 0, // Number of items sold (supplier/vendor)
      totalPurchases: 0, // Number of items bought
      totalOrders: 0, // Total orders placed
      completedOrders: 0, // Successfully completed orders
      cancelledOrders: 0, // Cancelled orders

      // ===== Rating & Reviews =====
      averageRating: 0.0, // Average rating (1-5)
      totalReviews: 0, // Number of reviews received

      // ===== Account Status =====
      isAuthenticated: false,
      isVerified: false, // Email/Phone verified
      isActive: true, // Account active status
      isSuspended: false, // Account suspended
      kycVerified: false, // KYC verification status

      // ===== Blockchain Integration =====
      fabricRegistered: false,
      fabricUserId: null,
      fabricError: null,
      fabricRetryCount: 0,

      // ===== Timestamps =====
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null,
      lastActivityAt: null,
      emailVerifiedAt: null,
      kycVerifiedAt: null,
    };

    // ========================================
    // STEP 4: STORE LOCALLY (FAST)
    // ========================================
    users.push(user);
    saveUsers();
    console.log(`✅ User stored locally: ${user.name} (${user.role})`);

    // ========================================
    // STEP 5: REGISTER ON FABRIC BLOCKCHAIN
    // ========================================
    let fabricRegistrationSuccess = false;
    let fabricError = null;

    try {
      await fabricService.connect();
      console.log("🔗 Connected to Fabric for user registration");

      const fabricUser = await fabricService.registerUser({
        walletAddress: user.walletAddress,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationMSP: user.organizationMSP,
        companyName: user.companyName,
        businessAddress: user.businessAddress,
        businessType: user.businessType,
        address: user.address,
        city: user.city,
        country: user.country,
      });

      console.log(
        `✅ User registered on Fabric blockchain: ${fabricUser.userId}`
      );

      user.fabricRegistered = true;
      user.fabricUserId = fabricUser.userId;
      saveUsers();

      fabricRegistrationSuccess = true;
    } catch (error) {
      console.error("❌ Fabric registration failed:", error.message);
      fabricError = error.message;

      user.fabricRegistered = false;
      user.fabricError = error.message;
      user.fabricRetryCount = 0;
      saveUsers();

      console.warn(
        "⚠️ User registered locally but not on Fabric. Will retry later."
      );
    } finally {
      await fabricService.disconnect();
    }

    // ========================================
    // STEP 6: GENERATE JWT TOKEN
    // ========================================
    const token = walletService.generateToken(wallet.address, role);

    // ========================================
    // STEP 7: PREPARE RESPONSE
    // ========================================
    const { passwordHash: _, encryptedMnemonic: __, ...userResponse } = user;

    console.log(`✅ JWT token generated`);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        user: userResponse,
        wallet: {
          address: wallet.address,
          mnemonic: wallet.mnemonic,
          balance: 0.0,
        },
        token: token,
        expiresIn: "7 days",
        blockchainStatus: {
          registered: fabricRegistrationSuccess,
          error: fabricError,
          note: fabricRegistrationSuccess
            ? "User registered on blockchain"
            : "User registered locally. Blockchain registration will be retried.",
        },
      },
      warning:
        "⚠️ CRITICAL: Save your 12-word recovery phrase in a secure location! This is the ONLY way to recover your wallet.",
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      error: "Registration failed. Please try again.",
    });
  }
});

/**
 * POST /api/auth/login/password
 * Login with Fabric blockchain integration
 *
 * Replace your existing login endpoint with this:
 */
router.post("/login/password", async (req, res) => {
  const fabricService = new FabricService();

  try {
    const { address, password } = req.body;

    // ========================================
    // STEP 1: VALIDATION & RATE LIMITING
    // ========================================
    const clientIp = req.ip || req.connection.remoteAddress;
    if (!checkRateLimit(`login_${clientIp}`, 10, 300000)) {
      return res.status(429).json({
        success: false,
        error: "Too many login attempts. Please try again later.",
      });
    }

    if (!address || !password) {
      return res.status(400).json({
        success: false,
        error: "Wallet address and password are required",
      });
    }

    if (!walletService.isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        error: "Invalid wallet address format",
      });
    }

    // ========================================
    // STEP 2: LOCAL AUTHENTICATION (FAST)
    // ========================================
    const user = users.find(
      (u) => u.walletAddress.toLowerCase() === address.toLowerCase()
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Verify password
    const isPasswordValid = await walletService.verifyPassword(
      password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // ========================================
    // STEP 3: FABRIC BLOCKCHAIN INTEGRATION
    // ========================================
    let fabricLoginRecorded = false;
    let fabricUserData = null;
    let fabricError = null;

    try {
      // Connect to Fabric
      await fabricService.connect();
      console.log(`🔗 Connected to Fabric for login: ${user.name}`);

      // Check if user needs to be registered on Fabric
      if (!user.fabricRegistered) {
        console.log(
          "⚠️ User not registered on Fabric yet. Attempting registration..."
        );

        try {
          await fabricService.registerUser({
            walletAddress: user.walletAddress,
            name: user.name,
            email: user.email,
            role: user.role,
            organizationMSP: user.organizationMSP,
            companyName: user.companyName,
            businessAddress: user.businessAddress,
            businessType: user.businessType,
          });

          user.fabricRegistered = true;
          user.fabricError = null;
          console.log("✅ User registered on Fabric during login");
        } catch (regError) {
          console.warn(
            "⚠️ Fabric registration during login failed:",
            regError.message
          );
          user.fabricError = regError.message;
          user.fabricRetryCount = (user.fabricRetryCount || 0) + 1;
        }
      }

      // Record login on blockchain
      if (user.fabricRegistered) {
        try {
          await fabricService.recordLogin(user.walletAddress);
          fabricLoginRecorded = true;
          console.log(`✅ Login recorded on Fabric for: ${user.name}`);

          // Get user data from blockchain
          fabricUserData = await fabricService.getUser(user.walletAddress);
          console.log("✅ Retrieved user data from Fabric");
        } catch (loginError) {
          console.warn(
            "⚠️ Failed to record login on Fabric:",
            loginError.message
          );
          fabricError = loginError.message;
        }
      }
    } catch (error) {
      console.warn("⚠️ Fabric connection warning:", error.message);
      fabricError = error.message;
      // Don't fail login if Fabric is unavailable
    } finally {
      await fabricService.disconnect();
    }

    // ========================================
    // STEP 4: UPDATE LOCAL USER DATA
    // ========================================
    user.lastLoginAt = new Date().toISOString();
    user.isAuthenticated = true;
    saveUsers();

    // ========================================
    // STEP 5: GENERATE JWT TOKEN
    // ========================================
    const token = walletService.generateToken(address, user.role);

    // ========================================
    // STEP 6: PREPARE RESPONSE
    // ========================================
    const { passwordHash: _, encryptedMnemonic: __, ...userResponse } = user;

    console.log(`✅ Login successful: ${user.name} (${user.role})`);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: userResponse,
        token: token,
        expiresIn: "7 days",
        blockchainStatus: {
          loginRecorded: fabricLoginRecorded,
          registered: user.fabricRegistered,
          error: fabricError,
          fabricData: fabricUserData,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Login failed. Please try again.",
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post("/logout", authenticateToken, (req, res) => {
  try {
    const user = users.find(
      (u) => u.walletAddress.toLowerCase() === req.user.address.toLowerCase()
    );

    if (user) {
      user.isAuthenticated = false;
      saveUsers();
      console.log(`✅ User logged out: ${user.name}`);
    }

    res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      error: "Logout failed",
    });
  }
});

// ============================================
// USER PROFILE ENDPOINTS
// ============================================

/**
 * GET /api/auth/profile
 * Get current user profile (requires authentication)
 */
router.get("/profile", authenticateToken, (req, res) => {
  try {
    const user = users.find(
      (u) => u.walletAddress.toLowerCase() === req.user.address.toLowerCase()
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Exclude sensitive data
    const { passwordHash: _, encryptedMnemonic: __, ...userResponse } = user;

    res.json({
      success: true,
      data: userResponse,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch profile",
    });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile (requires authentication)
 */
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, companyName, businessAddress, businessType } =
      req.body;

    const user = users.find(
      (u) => u.walletAddress.toLowerCase() === req.user.address.toLowerCase()
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Update allowed fields
    if (name) user.name = name.trim();
    if (email) user.email = email.toLowerCase().trim();
    if (phone) user.phone = phone.trim();
    if (companyName) user.companyName = companyName.trim();
    if (businessAddress) user.businessAddress = businessAddress.trim();
    if (businessType) user.businessType = businessType.trim();

    user.updatedAt = new Date().toISOString();
    saveUsers();

    const { passwordHash: _, encryptedMnemonic: __, ...userResponse } = user;

    console.log(`✅ Profile updated: ${user.name}`);

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: userResponse,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update profile",
    });
  }
});

/**
 * PUT /api/auth/change-password
 * Change user password (requires authentication)
 */
router.put("/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Current password and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: "New password must be at least 8 characters",
      });
    }

    const user = users.find(
      (u) => u.walletAddress.toLowerCase() === req.user.address.toLowerCase()
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await walletService.verifyPassword(
      currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Current password is incorrect",
      });
    }

    // Hash new password
    user.passwordHash = await walletService.hashPassword(newPassword);
    user.updatedAt = new Date().toISOString();
    saveUsers();

    console.log(`✅ Password changed: ${user.name}`);

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Password change error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to change password",
    });
  }
});

// ============================================
// TOKEN VERIFICATION
// ============================================

/**
 * POST /api/auth/verify
 * Verify JWT token
 */
router.post("/verify", (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Token is required",
      });
    }

    const decoded = walletService.verifyToken(token);

    res.json({
      success: true,
      data: decoded,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post("/refresh", authenticateToken, (req, res) => {
  try {
    const user = users.find(
      (u) => u.walletAddress.toLowerCase() === req.user.address.toLowerCase()
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Generate new token
    const newToken = walletService.generateToken(user.walletAddress, user.role);

    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        token: newToken,
        expiresIn: "7 days",
      },
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to refresh token",
    });
  }
});

// ============================================
// ADMIN ENDPOINTS (for BDLT experts)
// ============================================

/**
 * GET /api/auth/users
 * Get all users from BLOCKCHAIN (admin only)
 */
router.get("/users", authenticateToken, async (req, res) => {
  const fabricService = new FabricService();

  try {
    // Check if user is admin
    if (req.user.role !== "bdlt-expert") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Admin only.",
      });
    }

    // Fetch users from blockchain
    try {
      await fabricService.connect();
      console.log("🔗 Connected to Fabric to fetch all users");

      const blockchainUsers = await fabricService.getAllUsers();
      console.log(
        `✅ Retrieved ${blockchainUsers.length} users from blockchain`
      );

      await fabricService.disconnect();

      res.json({
        success: true,
        data: {
          users: blockchainUsers,
          total: blockchainUsers.length,
          source: "blockchain",
        },
      });
    } catch (fabricError) {
      console.error("❌ Failed to fetch from blockchain:", fabricError.message);

      // Fallback to local storage if blockchain is unavailable
      console.warn("⚠️ Falling back to local storage");

      const usersResponse = users.map(
        ({ passwordHash, encryptedMnemonic, ...user }) => user
      );

      res.json({
        success: true,
        data: {
          users: usersResponse,
          total: users.length,
          source: "local-fallback",
        },
        warning: "Data from local storage. Blockchain unavailable.",
      });
    }
  } catch (error) {
    console.error("Fetch users error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch users",
    });
  }
});

/**
 * GET /api/auth/stats
 * Get statistics from BLOCKCHAIN (admin only)
 */
router.get("/stats", authenticateToken, async (req, res) => {
  const fabricService = new FabricService();

  try {
    if (req.user.role !== "bdlt-expert") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Admin only.",
      });
    }

    // Try to get stats from blockchain first
    try {
      await fabricService.connect();
      console.log("🔗 Connected to Fabric to fetch statistics");

      const blockchainStats = await fabricService.getUserStats();
      console.log("✅ Retrieved statistics from blockchain");

      await fabricService.disconnect();

      res.json({
        success: true,
        data: {
          ...blockchainStats,
          source: "blockchain",
        },
      });
    } catch (fabricError) {
      console.error(
        "❌ Failed to fetch stats from blockchain:",
        fabricError.message
      );

      // Fallback to local storage
      console.warn("⚠️ Falling back to local storage for stats");

      const stats = {
        totalUsers: users.length,
        suppliers: users.filter((u) => u.role === "supplier").length,
        vendors: users.filter((u) => u.role === "vendor").length,
        customers: users.filter((u) => u.role === "customer").length,
        experts: users.filter((u) => u.role === "bdlt-expert").length,
        activeUsers: users.filter((u) => u.isAuthenticated).length,
        recentRegistrations: users.filter((u) => {
          const createdDate = new Date(u.createdAt);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return createdDate > weekAgo;
        }).length,
        source: "local-fallback",
      };

      res.json({
        success: true,
        data: stats,
        warning: "Data from local storage. Blockchain unavailable.",
      });
    }
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch statistics",
    });
  }
});

// ============================================
// EMAIL VERIFICATION ENDPOINTS
// ============================================

/**
 * POST /api/auth/send-verification
 * Send verification email with code
 */
router.post("/send-verification", authenticateToken, async (req, res) => {
  try {
    const user = users.find(
      (u) => u.walletAddress.toLowerCase() === req.user.address.toLowerCase()
    );

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

    // Generate 6-digit verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store verification code (in production, use Redis)
    user.verificationCode = verificationCode;
    user.verificationCodeExpiresAt = expiresAt.toISOString();
    saveUsers();

    // TODO: Send email using SendGrid/Mailgun/AWS SES
    // For now, return code in response (ONLY FOR DEVELOPMENT)
    console.log(`📧 Verification code for ${user.email}: ${verificationCode}`);

    res.json({
      success: true,
      message: `Verification code sent to ${user.email}`,
      // REMOVE THIS IN PRODUCTION - only for testing
      data: {
        code: verificationCode,
        expiresAt: expiresAt.toISOString(),
      },
      note: "Check your email for the verification code",
    });
  } catch (error) {
    console.error("Send verification error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send verification code",
    });
  }
});

/**
 * POST /api/auth/verify-email
 * Verify email with code
 */
router.post("/verify-email", authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: "Verification code is required",
      });
    }

    const user = users.find(
      (u) => u.walletAddress.toLowerCase() === req.user.address.toLowerCase()
    );

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

    // Check if code exists
    if (!user.verificationCode) {
      return res.status(400).json({
        success: false,
        error: "No verification code sent. Please request a new one.",
      });
    }

    // Check if code expired
    const now = new Date();
    const expiresAt = new Date(user.verificationCodeExpiresAt);
    if (now > expiresAt) {
      return res.status(400).json({
        success: false,
        error: "Verification code expired. Please request a new one.",
      });
    }

    // Verify code
    if (user.verificationCode !== code.trim()) {
      return res.status(401).json({
        success: false,
        error: "Invalid verification code",
      });
    }

    // Mark as verified
    user.isVerified = true;
    user.emailVerifiedAt = new Date().toISOString();
    user.verificationCode = null;
    user.verificationCodeExpiresAt = null;
    user.updatedAt = new Date().toISOString();
    saveUsers();

    console.log(`✅ Email verified for: ${user.email}`);

    res.json({
      success: true,
      message: "Email verified successfully",
      data: {
        isVerified: true,
        verifiedAt: user.emailVerifiedAt,
      },
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify email",
    });
  }
});

/**
 * POST /api/auth/resend-verification
 * Resend verification code
 */
router.post("/resend-verification", authenticateToken, async (req, res) => {
  try {
    const user = users.find(
      (u) => u.walletAddress.toLowerCase() === req.user.address.toLowerCase()
    );

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

    // Rate limiting
    const clientIp = req.ip || req.connection.remoteAddress;
    if (!checkRateLimit(`resend_${clientIp}`, 3, 600000)) {
      return res.status(429).json({
        success: false,
        error: "Too many requests. Please try again in 10 minutes.",
      });
    }

    // Generate new code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    user.verificationCode = verificationCode;
    user.verificationCodeExpiresAt = expiresAt.toISOString();
    saveUsers();

    console.log(
      `📧 Resent verification code for ${user.email}: ${verificationCode}`
    );

    res.json({
      success: true,
      message: "Verification code resent",
      // REMOVE THIS IN PRODUCTION
      data: {
        code: verificationCode,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to resend verification code",
    });
  }
});

export default router;
