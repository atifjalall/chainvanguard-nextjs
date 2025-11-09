// api/src/services/auth.service.js
import User from "../models/User.js";
import WalletService from "./wallet.service.js";
import fabricService from "./fabric.service.js";
import sessionService from "./session.service.js";
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
      // 1. Generate wallet
      console.log(`🔐 Generating wallet for: ${userData.name}`);
      const wallet = this.walletService.generateWallet();

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
        isVerified: false,
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

      // 5. Register on blockchain (async)
      this.registerOnBlockchain(newUser).catch((err) => {
        console.error("⚠️ Blockchain registration failed (will retry):", err);
      });

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
      await fabricService.connect();

      const fabricUserData = {
        walletAddress: user.walletAddress,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationMSP: user.organizationMSP,
        companyName: user.companyName || "",
        businessAddress: user.businessAddress || "",
        businessType: user.businessType || "",
      };

      const result = await fabricService.registerUser(fabricUserData);

      user.fabricRegistered = true;
      user.fabricUserId = user.walletAddress;
      user.blockchainTxId = result.txId || "success";
      await user.save();

      console.log(`✅ User registered on blockchain: ${user.name}`);
    } catch (error) {
      console.error("❌ Blockchain registration error:", error);
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

      this.recordLoginOnBlockchain(user.walletAddress).catch((err) => {
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

  async recordLoginOnBlockchain(walletAddress) {
    try {
      // ✅ FIX #2: Changed from connectToNetwork() to connect()
      await fabricService.connect();
      await fabricService.recordLogin(walletAddress);
      console.log(`✅ Login recorded on blockchain for: ${walletAddress}`);
    } catch (error) {
      console.error("❌ Failed to record login on blockchain:", error);
    } finally {
      await fabricService.disconnect();
    }
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
