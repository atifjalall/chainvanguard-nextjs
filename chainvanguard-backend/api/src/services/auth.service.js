// api/src/services/auth.service.js
import User from "../models/User.js";
import BlockchainLog from "../models/BlockchainLog.js";
import WalletService from "./wallet.service.js";
import fabricService from "./fabric.service.js";
import sessionService from "./session.service.js";
import dataSyncService from "./data.sync.service.js"; // ✅ NEW: Blockchain-first data sync
import ipfsService from "./ipfs.service.js"; // ✅ NEW: IPFS storage
import pkg from "jsonwebtoken";
const { sign } = pkg;
import crypto from "crypto";
import logger from "../utils/logger.js";
import notificationService from "./notification.service.js";

class AuthService {
  constructor() {
    this.walletService = new WalletService();
    this.JWT_SECRET =
      process.env.JWT_SECRET || "your-secret-key-change-in-production";
    this.JWT_EXPIRES_IN = "7d";
  }

  // ============================================
  // REGISTRATION
  // ============================================

  /**
   * Register new user
   */
  async register(userData) {
    try {
      // 1. Check blockchain health FIRST
      console.log("🔍 Checking blockchain network health...");
      await fabricService.ensureBlockchainConnected();
      console.log("✅ Blockchain network is active");

      // 2. Generate wallet
      console.log(`🔐 Generating wallet for: ${userData.name}`);
      const wallet = await this.walletService.generateWallet();
      // 2. Hash password
      const passwordHash = await this.walletService.hashPassword(
        userData.password
      );

      // 3. Encrypt mnemonic
      const encryptedMnemonic = this.encryptMnemonic(
        wallet.mnemonic,
        userData.password
      );

      // 4. Create user in MongoDB
      const newUser = new User({
        walletAddress: wallet.address,
        walletName: userData.walletName || "My Wallet",
        passwordHash,
        encryptedMnemonic,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        address: userData.address,
        city: userData.city,
        state: userData.state,
        country: userData.country,
        postalCode: userData.postalCode,
        companyName: userData.companyName,
        businessType: userData.businessType,
        businessAddress: userData.businessAddress,
        registrationNumber: userData.registrationNumber,
        taxId: userData.taxId,
        organizationMSP: this.getMSPForRole(userData.role),
        fabricRegistered: false,
        isActive: true,
        isVerified: true, // ✅ Mark as verified since OTP was already verified before registration
        emailVerifiedAt: new Date(), // ✅ Set verification timestamp
        isAuthenticated: false,
      });

      await newUser.save();
      console.log(`✅ User saved to MongoDB: ${newUser._id}`);

      await notificationService.createNotification({
        userId: newUser._id,
        userRole: newUser.role,
        type: "account_verified",
        category: "account",
        title: "Welcome to ChainVanguard!",
        message: `Welcome ${newUser.name}! Your account has been created successfully. Start exploring our platform.`,
        priority: "medium",
        actionType: "update_profile",
        actionUrl: `/profile`,
      });

      // 🆕 LOG REGISTRATION
      await logger.logAuth({
        type: "user_registered",
        action: "User registered successfully",
        userId: newUser._id,
        userDetails: {
          walletAddress: wallet.address,
          role: userData.role,
          name: userData.name,
          email: userData.email,
        },
        status: "success",
        data: {
          role: userData.role,
          walletName: userData.walletName,
        },
      });

      // 5. Register on blockchain (REQUIRED - synchronous)
      console.log("📝 Registering user on blockchain...");
      await this.registerOnBlockchain(newUser);
      console.log("✅ User registered on blockchain successfully");

      await notificationService.createNotification({
        userId: newUser._id,
        userRole: newUser.role,
        type: "account_verified",
        category: "account",
        title: "Welcome to ChainVanguard!",
        message: `Welcome ${newUser.name}! Your account has been created successfully.`,
        priority: "medium",
        actionType: "update_profile",
        actionUrl: `/profile`,
      });

      // 6. Generate verification code
      const verificationCode = this.generateVerificationCode();
      await sessionService.storeVerificationCode(
        newUser.email,
        verificationCode
      );

      // 7. Send verification email (implement later)
      // await emailService.sendVerificationEmail(newUser.email, verificationCode);

      return {
        user: this.sanitizeUser(newUser),
        wallet: {
          address: wallet.address,
          mnemonic: wallet.mnemonic, // Only return once!
        },
        verificationCode, // For testing - remove in production
      };
    } catch (error) {
      console.error("❌ Registration failed:", error);
      throw error;
    }
  }

  async registerOnBlockchain(user) {
    try {
      console.log("📝 Recording user registration on blockchain...");

      await fabricService.connect();

      // ✅ NEW: Store user data on IPFS for disaster recovery
      console.log("📤 Uploading user data to IPFS...");

      // Prepare user data for IPFS (exclude sensitive fields)
      const userDataForIPFS = {
        userId: user._id.toString(),
        walletAddress: user.walletAddress,
        walletName: user.walletName,
        passwordHash: user.passwordHash, // Keep for login verification
        encryptedMnemonic: user.encryptedMnemonic, // Keep encrypted
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        city: user.city,
        state: user.state,
        country: user.country,
        postalCode: user.postalCode,
        companyName: user.companyName,
        businessType: user.businessType,
        businessAddress: user.businessAddress,
        registrationNumber: user.registrationNumber,
        taxId: user.taxId,
        organizationMSP: user.organizationMSP,
        isActive: user.isActive,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      // Upload to IPFS
      const userDataBuffer = Buffer.from(JSON.stringify(userDataForIPFS, null, 2));
      const ipfsResult = await ipfsService.pinFileToIPFS(
        userDataBuffer,
        `user-${user.walletAddress}.json`,
        {
          type: "user_registration",
          userId: user._id.toString(),
          walletAddress: user.walletAddress,
          role: user.role,
        }
      );

      if (!ipfsResult.success) {
        throw new Error(`IPFS upload failed: ${ipfsResult.error}`);
      }

      console.log(`✅ User data uploaded to IPFS: ${ipfsResult.ipfsHash}`);

      // ✅ Store IMMUTABLE user registration data on blockchain with IPFS CID
      const fabricUserData = {
        userId: user._id.toString(),
        walletAddress: user.walletAddress, // ✅ Immutable
        role: user.role, // ✅ Rarely changes (tracked separately if it does)
        userDataCID: ipfsResult.ipfsHash, // ✅ IPFS CID for user data (for recovery)
        kycHash: user.kycHash || null, // ✅ IPFS hash of KYC documents (if uploaded)
        registeredAt: user.createdAt,
      };

      const result = await fabricService.recordUserRegistration(fabricUserData);

      user.fabricRegistered = true;
      user.fabricUserId = user.walletAddress;
      user.blockchainTxId = result.txId || "success";
      user.userDataCID = ipfsResult.ipfsHash; // Store CID in MongoDB for quick access
      await user.save();

      console.log(`✅ User registered on blockchain: ${user.name}`);

      // 🪙 Create token account and mint initial 1M tokens
      try {
        console.log("🪙 Creating token account and minting initial tokens...");
        await fabricService.createTokenAccount(
          user._id.toString(),
          user.walletAddress,
          0
        );
        await fabricService.mintTokens(
          user._id.toString(),
          1000000,
          "Welcome bonus - Initial token distribution"
        );
        console.log("✅ Token account created with 1M CVT");
      } catch (tokenError) {
        console.error("⚠️ Token account creation failed:", tokenError.message);
        // Don't fail registration if token creation fails
      }
    } catch (error) {
      console.error("❌ Blockchain + IPFS registration error:", error);
      throw error;
    } finally {
      // Always disconnect from Fabric after operation
      await fabricService.disconnect();
    }
  }

  // ============================================
  // LOGIN
  // ============================================

  async login(walletAddress, password, ipAddress) {
    try {
      const rateLimit = await sessionService.checkRateLimit(
        `login:${ipAddress}`,
        5,
        300000
      );
      if (!rateLimit.allowed) {
        throw new Error(
          `Too many login attempts. Try again in ${Math.ceil(
            rateLimit.resetIn / 60
          )} minutes.`
        );
      }

      const user = await User.findOne({
        walletAddress: { $regex: new RegExp(`^${walletAddress}$`, "i") },
      });

      if (!user) throw new Error("Invalid credentials");

      const isValid = await this.walletService.verifyPassword(
        password,
        user.passwordHash
      );
      if (!isValid) throw new Error("Invalid credentials");

      if (!user.isActive)
        throw new Error("Account is deactivated. Please contact support.");

      user.isAuthenticated = true;
      user.lastLoginAt = new Date();
      await user.save();

      await sessionService.createSession(user._id.toString(), user);

      this.recordLoginOnBlockchain(user._id.toString()).catch((err) => {
        console.warn("⚠️ Blockchain login recording failed:", err);
      });

      const token = this.generateToken(user);

      await sessionService.resetRateLimit(`login:${ipAddress}`);

      // 🆕 LOG LOGIN
      await logger.logAuth({
        type: "user_login",
        action: "User logged in successfully",
        userId: user._id,
        userDetails: {
          walletAddress: user.walletAddress,
          role: user.role,
          name: user.name,
          email: user.email,
        },
        status: "success",
        data: {
          ipAddress,
          loginTime: new Date(),
        },
      });

      return {
        token,
        user: this.sanitizeUser(user),
      };
    } catch (error) {
      console.error("❌ Login failed:", error);
      throw error;
    }
  }

  async recordLoginOnBlockchain(userId) {
    // ⚠️ DEPRECATED: Login tracking is mutable and should NOT be on blockchain
    // Login events are now tracked in MongoDB only
    console.log(
      `ℹ️ Login tracking moved to MongoDB only (not blockchain): ${userId}`
    );
    return;
  }

  // ============================================
  // LOGOUT
  // ============================================

  async logout(userId, token) {
    try {
      await User.findByIdAndUpdate(userId, { isAuthenticated: false });
      await sessionService.deleteSession(userId);
      await sessionService.blacklistToken(token);
      console.log(`✅ User logged out: ${userId}`);

      // 🆕 LOG LOGOUT
      const user = await User.findById(userId);
      if (user) {
        await logger.logAuth({
          type: "user_logout",
          action: "User logged out",
          userId: user._id,
          userDetails: {
            walletAddress: user.walletAddress,
            role: user.role,
            name: user.name,
            email: user.email,
          },
          status: "success",
        });

        // Log logout to DB and Fabric blockchain
        const logData = {
          transactionId: `logout-${Date.now()}`,
          type: "auth-event",
          action: "user-logout",
          status: "success",
          performedBy: userId,
          userId: userId,
          entityId: userId,
          entityType: "user",
          metadata: {
            walletAddress: user.walletAddress,
            role: user.role,
            name: user.name,
            email: user.email,
          },
          timestamp: new Date(),
        };

        try {
          await BlockchainLog.create(logData);
          console.log("✅ Logout logged to DB");
        } catch (logErr) {
          console.warn("⚠️ Failed to log logout to DB:", logErr);
        }

        try {
          await fabricService.createBlockchainLog(
            logData.transactionId,
            logData
          );
          console.log("✅ Logout logged to Fabric blockchain");
        } catch (fabricErr) {
          console.warn(
            "⚠️ Failed to log logout to Fabric blockchain:",
            fabricErr.message
          );
        }
      }

      return { success: true };
    } catch (error) {
      console.error("❌ Logout failed:", error);
      throw error;
    }
  }

  // ============================================
  // EMAIL VERIFICATION
  // ============================================

  async verifyEmail(email, code) {
    try {
      const verification = await sessionService.verifyCode(email, code);
      if (!verification.valid) throw new Error(verification.message);

      const user = await User.findOneAndUpdate(
        { email },
        { isVerified: true, emailVerifiedAt: new Date() },
        { new: true }
      );

      if (!user) throw new Error("User not found");

      // 🆕 LOG EMAIL VERIFICATION
      await logger.logAuth({
        type: "email_verified",
        action: "User email verified",
        userId: user._id,
        userDetails: {
          walletAddress: user.walletAddress,
          role: user.role,
          name: user.name,
          email: user.email,
        },
        status: "success",
      });

      console.log(`✅ Email verified for: ${email}`);
      return this.sanitizeUser(user);
    } catch (error) {
      console.error("❌ Email verification failed:", error);
      throw error;
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  generateToken(user) {
    return sign(
      {
        userId: user._id.toString(),
        walletAddress: user.walletAddress,
        role: user.role,
      },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }

  generateVerificationCode() {
    return crypto.randomInt(100000, 999999).toString();
  }

  encryptMnemonic(mnemonic, password) {
    const algorithm = "aes-256-cbc";
    const key = crypto.scryptSync(password, "salt", 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(mnemonic, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
  }

  getMSPForRole(role) {
    const mspMapping = {
      supplier: "Org1MSP",
      vendor: "Org1MSP",
      customer: "Org2MSP",
      expert: "Org1MSP", // Changed from "expert"
    };
    return mspMapping[role] || "Org1MSP";
  }

  sanitizeUser(user) {
    const userObj = user.toObject ? user.toObject() : user;
    delete userObj.passwordHash;
    delete userObj.encryptedMnemonic;
    delete userObj.__v;
    return userObj;
  }

  async sendPasswordResetNotification(userId, userRole) {
    await notificationService.createNotification({
      userId,
      userRole,
      type: "security_alert",
      category: "security",
      title: "Password Reset Requested",
      message:
        "A password reset was requested for your account. If this wasn't you, please contact support immediately.",
      priority: "high",
      isUrgent: true,
    });
  }
}

export default new AuthService();
