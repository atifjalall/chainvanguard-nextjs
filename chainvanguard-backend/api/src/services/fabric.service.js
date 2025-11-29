// chainvanguard-backend/api/src/services/fabric.service.js
import * as grpc from "@grpc/grpc-js";
import { connect, signers, hash } from "@hyperledger/fabric-gateway";
import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";
import * as crypto from "crypto";
import BlockchainLog from "../models/BlockchainLog.js";
import notificationService from "./notification.service.js";

class FabricService {
  constructor() {
    this.gateway = null;
    this.network = null;
    this.contract = null;
    this.userContract = null;
    this.productContract = null;
    this.orderContract = null;
    this.inventoryContract = null;
    this.vendorInventoryContract = null;
    this.vendorRequestContract = null;
    this.tokenContract = null;
    this.client = null;
  }

  async connect() {
    try {
      console.log("🔹 Connecting to Fabric using Gateway SDK...");

      const channelName = "supply-chain-channel";
      const chaincodeName = "chainvanguard";
      const mspId = "Org1MSP";

      const fabricSamplesPath = resolve(
        process.env.HOME,
        "Desktop",
        "fabric-samples",
        "test-network"
      );

      const cryptoPath = resolve(
        fabricSamplesPath,
        "organizations",
        "peerOrganizations",
        "org1.example.com"
      );

      const keyDirectoryPath = resolve(
        cryptoPath,
        "users",
        "Admin@org1.example.com",
        "msp",
        "keystore"
      );

      const certDirectoryPath = resolve(
        cryptoPath,
        "users",
        "Admin@org1.example.com",
        "msp",
        "signcerts"
      );

      const tlsCertPath = resolve(
        cryptoPath,
        "peers",
        "peer0.org1.example.com",
        "tls",
        "ca.crt"
      );

      console.log("📁 Using absolute paths from fabric-samples");

      const tlsRootCert = readFileSync(tlsCertPath);
      const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
      this.client = new grpc.Client("localhost:7051", tlsCredentials, {
        "grpc.ssl_target_name_override": "peer0.org1.example.com",
      });
      console.log("✅ gRPC client created for Org1");

      const identity = await this.newIdentity(certDirectoryPath, mspId);
      console.log("✅ Identity loaded");

      const signer = await this.newSigner(keyDirectoryPath);
      console.log("✅ Signer created");

      this.gateway = connect({
        client: this.client,
        identity,
        signer,
        hash: hash.sha256,
        evaluateOptions: () => {
          return { deadline: Date.now() + 5000 };
        },
        endorseOptions: () => {
          return {
            deadline: Date.now() + 15000,
          };
        },
        submitOptions: () => {
          return { deadline: Date.now() + 5000 };
        },
        commitStatusOptions: () => {
          return { deadline: Date.now() + 60000 };
        },
      });
      console.log("✅ Gateway connected");

      this.network = this.gateway.getNetwork(channelName);

      this.userContract = this.network.getContract(
        chaincodeName,
        "UserContract"
      );
      this.productContract = this.network.getContract(
        chaincodeName,
        "ProductContract"
      );
      this.orderContract = this.network.getContract(
        chaincodeName,
        "OrderContract"
      );
      this.inventoryContract = this.network.getContract(
        chaincodeName,
        "InventoryContract"
      );
      this.vendorInventoryContract = this.network.getContract(
        chaincodeName,
        "VendorInventoryContract"
      );
      this.vendorRequestContract = this.network.getContract(
        chaincodeName,
        "VendorRequestContract"
      );
      this.tokenContract = this.network.getContract(
        chaincodeName,
        "TokenContract"
      );

      this.contract = this.userContract;

      console.log("✅ Successfully connected to Fabric network");
      console.log(`   Channel: ${channelName}`);
      console.log(`   Chaincode: ${chaincodeName}`);
      console.log(
        `   Contracts: UserContract, ProductContract, OrderContract, InventoryContract, VendorInventoryContract, VendorRequestContract, TokenContract`
      );

      return true;
    } catch (error) {
      console.error("❌ Failed to connect to Fabric network:", error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.gateway) {
        this.gateway.close();
        console.log("✅ Gateway disconnected");
      }

      if (this.client) {
        this.client = null;
      }

      console.log("✅ Disconnected from Fabric");
    } catch (error) {
      console.error("❌ Error disconnecting from Fabric:", error);
    }
  }

  /**
   * Check if blockchain network is connected and healthy
   * @returns {Promise<{connected: boolean, message: string}>}
   */
  async checkHealth() {
    try {
      // If gateway not initialized, try to connect first
      if (!this.gateway || !this.userContract) {
        console.log("🔄 Gateway not initialized, attempting to connect...");
        try {
          await this.connect();
          return {
            connected: true,
            message: "Blockchain network connected successfully",
          };
        } catch (connectError) {
          console.error("❌ Failed to connect to blockchain:", connectError);
          return {
            connected: false,
            message: `Blockchain network is not responding. Please ensure Hyperledger Fabric is running. Error: ${connectError.message}`,
          };
        }
      }

      // Gateway exists, verify it's still responsive
      return {
        connected: true,
        message: "Blockchain network is running and healthy",
      };
    } catch (error) {
      console.error("❌ Blockchain health check failed:", error);
      return {
        connected: false,
        message: `Blockchain network error: ${error.message}. Please ensure Hyperledger Fabric is running.`,
      };
    }
  }

  /**
   * Ensures blockchain is connected before operation
   * Throws error if blockchain is not available
   */
  async ensureBlockchainConnected() {
    const health = await this.checkHealth();

    if (!health.connected) {
      throw new Error(health.message);
    }

    return true;
  }

  async retryOperation(operation, maxRetries = 3, delayMs = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === maxRetries - 1) throw error;

        console.log(`⚠️ Attempt ${i + 1} failed, retrying in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2;
      }
    }
  }

  // ========================================
  // 🆕 EVENT-BASED USER METHODS
  // ========================================

  /**
   * Record user registration event (IMMUTABLE IDENTITY ONLY)
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Registration event
   */
  async recordUserRegistration(userData) {
    try {
      console.log(`📝 Recording user registration on blockchain: ${userData.name || userData.walletAddress}`);

      if (!this.userContract) {
        throw new Error("Not connected to Fabric network");
      }

      // Validate required fields
      if (!userData.walletAddress || !userData.role) {
        throw new Error("Missing required fields: walletAddress and role");
      }

      // Only send IMMUTABLE fields
      const registrationEvent = {
        userId: userData.userId || userData._id?.toString() || userData.walletAddress,
        walletAddress: userData.walletAddress,
        role: userData.role,
        kycHash: userData.kycHash || null,
        registeredAt: userData.createdAt || new Date().toISOString(),
      };

      console.log("📦 Registration event:", {
        userId: registrationEvent.userId,
        walletAddress: registrationEvent.walletAddress,
        role: registrationEvent.role,
      });

      const result = await this.retryOperation(
        async () => {
          return await this.userContract.submitTransaction(
            "recordUserRegistration",  // ✅ NEW METHOD
            JSON.stringify(registrationEvent)
          );
        },
        3,
        2000
      );

      console.log("✅ User registration event recorded on blockchain");

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      if (!resultStr || resultStr.trim() === "") {
        return { success: true, userId: registrationEvent.userId };
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Failed to record user registration:", error);
      throw error;
    }
  }

  /**
   * @deprecated Use recordUserRegistration() instead
   */
  async registerUser(userData) {
    console.warn("⚠️ registerUser() is deprecated. Use recordUserRegistration() instead.");
    return this.recordUserRegistration(userData);
  }

  /**
   * Record user role change event
   */
  async recordUserRoleChange(userId, oldRole, newRole, changedBy, reason = "") {
    try {
      if (!this.userContract) {
        throw new Error("Not connected to Fabric network");
      }

      const event = {
        userId: userId.toString(),
        oldRole,
        newRole,
        changedBy: changedBy.toString(),
        reason,
        timestamp: new Date().toISOString(),
      };

      const result = await this.userContract.submitTransaction(
        "recordRoleChange",
        JSON.stringify(event)
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      console.log("✅ User role change event recorded");
      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Failed to record role change:", error);
      throw error;
    }
  }

  /**
   * Record KYC verification event
   */
  async recordKYCVerification(userId, kycHash, verifiedBy, verificationLevel = "basic") {
    try {
      if (!this.userContract) {
        throw new Error("Not connected to Fabric network");
      }

      const event = {
        userId: userId.toString(),
        kycHash,
        verifiedBy: verifiedBy.toString(),
        verificationLevel,
        notes: "",
        timestamp: new Date().toISOString(),
      };

      const result = await this.userContract.submitTransaction(
        "recordKYCVerification",
        JSON.stringify(event)
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      console.log("✅ KYC verification event recorded");
      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Failed to record KYC verification:", error);
      throw error;
    }
  }

  /**
   * Get user event history from blockchain
   */
  async getUserEventHistory(userId) {
    try {
      if (!this.userContract) {
        throw new Error("Not connected to Fabric network");
      }

      const result = await this.userContract.evaluateTransaction(
        "getUserEventHistory",
        userId
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Failed to get user event history:", error);
      throw error;
    }
  }

  /**
   * @deprecated Use getUserEventHistory() instead
   */
  async getUser(userId) {
    console.warn("⚠️ getUser() is deprecated. Use getUserEventHistory() instead.");
    return this.getUserEventHistory(userId);
  }

  /**
   * @deprecated User updates are mutable - use specific event methods instead
   */
  async updateUser(userId, updateData) {
    throw new Error(
      "updateUser() is deprecated. User data like email/phone/name is mutable and should only be in MongoDB. " +
      "For immutable events, use: recordUserRoleChange(), recordKYCVerification(), recordUserDeactivation()"
    );
  }

  async getAllUsers() {
    try {
      if (!this.userContract) {
        throw new Error("Not connected to Fabric network");
      }

      const result = await this.userContract.evaluateTransaction(
        "getAllUsers"
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Failed to get all users:", error);
      throw error;
    }
  }

  async getUsersByRole(role) {
    try {
      if (!this.userContract) {
        throw new Error("Not connected to Fabric network");
      }

      const result = await this.userContract.evaluateTransaction(
        "getUsersByRole",
        role
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Failed to get users by role:", error);
      throw error;
    }
  }

  async getUserStats() {
    try {
      if (!this.userContract) {
        throw new Error("Not connected to Fabric network");
      }

      const result = await this.userContract.evaluateTransaction(
        "getUserStats"
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Failed to get user stats:", error);
      throw error;
    }
  }

  /**
   * @deprecated Login tracking is mutable and should NOT be on blockchain
   */
  async recordLogin(userId) {
    console.warn("⚠️ recordLogin() is deprecated. Login tracking is mutable and should only be in MongoDB, not blockchain.");
    return;
  }

  async incrementUserTransactionCount(userId) {
    try {
      if (!this.userContract) {
        throw new Error("Not connected to Fabric network");
      }

      await this.userContract.submitTransaction(
        "incrementTransactionCount",
        userId
      );
      console.log(`✅ Transaction count incremented for: ${userId}`);
    } catch (error) {
      console.warn("⚠️ Failed to increment transaction count:", error.message);
    }
  }

  async newIdentity(certDirectoryPath, mspId) {
    const files = readdirSync(certDirectoryPath);
    const certPath = resolve(certDirectoryPath, files[0]);
    const credentials = readFileSync(certPath);
    return { mspId, credentials };
  }

  async newSigner(keyDirectoryPath) {
    const files = readdirSync(keyDirectoryPath);
    const keyPath = resolve(keyDirectoryPath, files[0]);
    const privateKeyPem = readFileSync(keyPath);
    const privateKey = crypto.createPrivateKey(privateKeyPem);
    return signers.newPrivateKeySigner(privateKey);
  }

  // ========================================
  // 💰 TOKEN CONTRACT METHODS
  // ========================================

  /**
   * Initialize token ledger (call once on deployment)
   */
  async initTokenLedger() {
    try {
      console.log("🪙 Initializing token ledger...");

      if (!this.tokenContract) {
        await this.ensureContract("token");
      }

      const result = await this.tokenContract.submitTransaction(
        "initLedger"
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      const parsed = JSON.parse(resultStr);
      console.log("✅ Token ledger initialized:", parsed);

      return parsed;
    } catch (error) {
      console.error("❌ Token init failed:", error);
      throw error;
    }
  }

  /**
   * Create token account for user
   */
  async createTokenAccount(userId, walletAddress, initialBalance = 0) {
    try {
      console.log(`🪙 Creating token account for user: ${userId}`);

      if (!this.tokenContract) {
        await this.ensureContract("token");
      }

      const result = await this.tokenContract.submitTransaction(
        "createAccount",
        userId,
        walletAddress,
        initialBalance.toString()
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      const parsed = JSON.parse(resultStr);
      console.log("✅ Token account created:", parsed);

      return parsed;
    } catch (error) {
      // Account might already exist - check both error message and details
      const errorMessage = error.message || "";
      const errorDetails = error.details
        ? JSON.stringify(error.details)
        : "";
      const fullErrorText = errorMessage + errorDetails;

      if (
        fullErrorText.includes("already exists") ||
        fullErrorText.includes("Account already exists")
      ) {
        console.log("⚠️ Token account already exists (race condition handled)");
        return { success: true, message: "Account already exists" };
      }
      console.error("❌ Create token account failed:", error);
      throw error;
    }
  }

  /**
   * Get token balance from blockchain
   */
  async getTokenBalance(userId) {
    try {
      if (!this.tokenContract) {
        await this.ensureContract("token");
      }

      const result = await this.tokenContract.evaluateTransaction(
        "balanceOf",
        userId
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      const parsed = JSON.parse(resultStr);
      return parsed;
    } catch (error) {
      console.error("❌ Get token balance failed:", error);
      throw error;
    }
  }

  /**
   * Get full token account info
   */
  async getTokenAccount(userId) {
    try {
      if (!this.tokenContract) {
        await this.ensureContract("token");
      }

      const result = await this.tokenContract.evaluateTransaction(
        "getAccount",
        userId
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Get token account failed:", error);
      throw error;
    }
  }

  /**
   * Transfer tokens between users
   */
  async transferTokens(fromUserId, toUserId, amount, description = "") {
    try {
      console.log(
        `🪙 Transferring ${amount} CVT from ${fromUserId} to ${toUserId}`
      );

      if (!this.tokenContract) {
        await this.ensureContract("token");
      }

      const result = await this.tokenContract.submitTransaction(
        "transfer",
        fromUserId,
        toUserId,
        amount.toString(),
        description
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      const parsed = JSON.parse(resultStr);
      console.log("✅ Token transfer completed:", parsed);

      return parsed;
    } catch (error) {
      console.error("❌ Token transfer failed:", error);
      throw error;
    }
  }

  /**
   * Mint tokens (add balance)
   */
  async mintTokens(userId, amount, reason = "Deposit") {
    try {
      console.log(`🪙 Minting ${amount} CVT for user: ${userId}`);

      if (!this.tokenContract) {
        await this.ensureContract("token");
      }

      const result = await this.tokenContract.submitTransaction(
        "mint",
        userId,
        amount.toString(),
        reason
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      const parsed = JSON.parse(resultStr);
      console.log("✅ Tokens minted:", parsed);

      return parsed;
    } catch (error) {
      console.error("❌ Mint tokens failed:", error);
      throw error;
    }
  }

  /**
   * Burn tokens (reduce balance)
   */
  async burnTokens(userId, amount, reason = "Withdrawal") {
    try {
      console.log(`🪙 Burning ${amount} CVT from user: ${userId}`);

      if (!this.tokenContract) {
        await this.ensureContract("token");
      }

      const result = await this.tokenContract.submitTransaction(
        "burn",
        userId,
        amount.toString(),
        reason
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      const parsed = JSON.parse(resultStr);
      console.log("✅ Tokens burned:", parsed);

      return parsed;
    } catch (error) {
      console.error("❌ Burn tokens failed:", error);
      throw error;
    }
  }

  /**
   * Get token info (name, symbol, total supply)
   */
  async getTokenInfo() {
    try {
      if (!this.tokenContract) {
        await this.ensureContract("token");
      }

      const result = await this.tokenContract.evaluateTransaction(
        "getTokenInfo"
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Get token info failed:", error);
      throw error;
    }
  }

  /**
   * Get account transaction history from blockchain
   */
  async getTokenHistory(userId) {
    try {
      if (!this.tokenContract) {
        await this.ensureContract("token");
      }

      const result = await this.tokenContract.evaluateTransaction(
        "getAccountHistory",
        userId
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Get token history failed:", error);
      throw error;
    }
  }

  // ========================================
  // 🆕 EVENT-BASED PRODUCT METHODS
  // ========================================

  /**
   * Record product creation event (IMMUTABLE SNAPSHOT)
   */
  async recordProductCreation(productData) {
    try {
      console.log("📝 Recording product creation on blockchain...");

      if (!this.productContract) {
        throw new Error("Product contract not initialized");
      }

      if (!productData || !productData.productId) {
        throw new Error("Product data missing productId");
      }

      // Only send IMMUTABLE fields
      const creationEvent = {
        productId: productData.productId,
        name: productData.name,
        category: productData.category,
        subcategory: productData.subcategory || "",
        sellerId: productData.sellerId || productData.vendorId,
        sellerName: productData.sellerName || "",
        sellerRole: productData.sellerRole || "vendor",
        originalPrice: productData.price,  // Price at creation
        currency: productData.currency || "CVT",
        imageHash: productData.ipfsImageHash || null,  // IPFS hash
        certificateHash: productData.certificateHash || null,
        metadataHash: productData.metadataHash || null,  // ✅ IPFS metadata snapshot hash
        createdAt: productData.createdAt || new Date().toISOString(),
      };

      console.log("📦 Product creation event:", {
        productId: creationEvent.productId,
        name: creationEvent.name,
        category: creationEvent.category,
        metadataHash: creationEvent.metadataHash,
      });

      const result = await this.productContract.submitTransaction(
        "recordProductCreation",  // ✅ NEW METHOD
        JSON.stringify(creationEvent)
      );

      console.log("✅ Product creation event recorded on blockchain");

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Failed to record product creation:", error);
      throw error;
    }
  }

  /**
   * @deprecated Use recordProductCreation() instead
   */
  async createProduct(productData) {
    console.warn("⚠️ createProduct() is deprecated. Use recordProductCreation() instead.");
    return this.recordProductCreation(productData);
  }

  /**
   * Get product event history from blockchain
   */
  async getProductEventHistory(productId) {
    try {
      if (!this.productContract) {
        throw new Error("Product contract not initialized");
      }

      const result = await this.productContract.evaluateTransaction(
        "getProductEventHistory",
        productId
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Failed to get product event history:", error);
      throw error;
    }
  }

  /**
   * @deprecated Use getProductEventHistory() instead
   */
  async getProduct(productId) {
    console.warn("⚠️ getProduct() is deprecated. Use getProductEventHistory() instead.");
    return this.getProductEventHistory(productId);
  }

  async getAllProducts() {
    try {
      console.log("📝 Getting all products from blockchain...");

      if (!this.productContract) {
        throw new Error("Product contract not initialized");
      }

      const result = await this.productContract.evaluateTransaction(
        "getAllProducts"
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Blockchain getAllProducts error:", error);
      throw error;
    }
  }

  /**
   * @deprecated Product updates (price, quantity, status) are mutable - MongoDB only
   */
  async updateProduct(productId, updateData) {
    throw new Error(
      "updateProduct() is deprecated. Price/quantity/status updates are mutable and should only be in MongoDB. " +
      "For immutable events, use: recordProductVerification(), recordOwnershipTransfer()"
    );
  }

  async getProductHistory(productId) {
    try {
      console.log(`📝 Getting product history: ${productId}`);

      if (!this.productContract) {
        throw new Error("Product contract not initialized");
      }

      const result = await this.productContract.evaluateTransaction(
        "getProductHistory",
        productId
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Blockchain getProductHistory error:", error);
      throw error;
    }
  }

  async queryProductsBySeller(sellerId) {
    try {
      console.log(`📝 Querying products by seller: ${sellerId}`);

      if (!this.productContract) {
        throw new Error("Product contract not initialized");
      }

      const result = await this.productContract.evaluateTransaction(
        "queryProductsBySeller",
        sellerId
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Blockchain queryProductsBySeller error:", error);
      throw error;
    }
  }

  async queryProductsByCategory(category) {
    try {
      console.log(`📝 Querying products by category: ${category}`);

      if (!this.productContract) {
        throw new Error("Product contract not initialized");
      }

      const result = await this.productContract.evaluateTransaction(
        "queryProductsByCategory",
        category
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Blockchain queryProductsByCategory error:", error);
      throw error;
    }
  }

  async queryVerifiedProducts() {
    try {
      console.log("📝 Querying verified products...");

      if (!this.productContract) {
        throw new Error("Product contract not initialized");
      }

      const result = await this.productContract.evaluateTransaction(
        "queryVerifiedProducts"
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Blockchain queryVerifiedProducts error:", error);
      throw error;
    }
  }

  /**
   * Record product verification event
   */
  async recordProductVerification(productId, verificationData) {
    try {
      if (!this.productContract) {
        throw new Error("Product contract not initialized");
      }

      const event = {
        productId,
        verifiedBy: verificationData.expertId || verificationData.verifiedBy,
        verifiedByName: verificationData.expertName || "",
        certificateHash: verificationData.certificateHash || null,
        notes: verificationData.notes || "",
        verificationLevel: verificationData.verificationLevel || "standard",
        timestamp: new Date().toISOString(),
      };

      const result = await this.productContract.submitTransaction(
        "recordProductVerification",  // ✅ NEW METHOD
        JSON.stringify(event)
      );

      console.log("✅ Product verification event recorded");

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Failed to record product verification:", error);
      throw error;
    }
  }

  /**
   * @deprecated Use recordProductVerification() instead
   */
  async verifyProduct(productId, verificationData) {
    console.warn("⚠️ verifyProduct() is deprecated. Use recordProductVerification() instead.");
    return this.recordProductVerification(productId, verificationData);
  }

  /**
   * Record product ownership transfer event
   * @param {string} productId - Product ID
   * @param {object} transferData - Transfer details (fromOwner, toOwner, etc.)
   * @returns {object} Ownership transfer event
   */
  async recordOwnershipTransfer(productId, transferData) {
    try {
      console.log(`📝 Recording ownership transfer for product: ${productId}`);

      if (!this.productContract) {
        throw new Error("Product contract not initialized");
      }

      const event = {
        productId,
        fromOwner: transferData.fromOwner || transferData.fromOwnerId,
        toOwner: transferData.toOwner || transferData.toOwnerId,
        transferPrice: transferData.transferPrice || null,
        transferReason: transferData.transferReason || "sale",
        orderId: transferData.orderId || null,
        notes: transferData.notes || "",
        timestamp: new Date().toISOString(),
      };

      const result = await this.productContract.submitTransaction(
        "recordOwnershipTransfer",
        JSON.stringify(event)
      );

      console.log("✅ Product ownership transfer event recorded");

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Blockchain recordOwnershipTransfer error:", error);
      throw error;
    }
  }

  /**
   * @deprecated Use recordOwnershipTransfer instead
   */
  async transferProduct(productId, transferData) {
    throw new Error("transferProduct() is deprecated. Use recordOwnershipTransfer() instead.");
  }

  /**
   * Record product archival/deletion event
   * @param {string} productId - Product ID
   * @param {string} deletedBy - User ID who deleted the product
   * @returns {object} Archival event
   */
  async recordProductArchival(productId, deletedBy) {
    try {
      console.log(`📝 Recording product archival: ${productId}`);

      if (!this.productContract) {
        throw new Error("Product contract not initialized");
      }

      const event = {
        productId,
        deletedBy,
        reason: "archived",
        timestamp: new Date().toISOString(),
      };

      const result = await this.productContract.submitTransaction(
        "recordProductArchival",
        JSON.stringify(event)
      );

      console.log("✅ Product archival event recorded");

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Blockchain recordProductArchival error:", error);
      throw error;
    }
  }

  /**
   * @deprecated Use recordProductArchival instead
   */
  async archiveProduct(productId, deletedBy) {
    throw new Error("archiveProduct() is deprecated. Use recordProductArchival() instead.");
  }

  async productExists(productId) {
    try {
      console.log(`📝 Checking if product exists: ${productId}`);

      if (!this.productContract) {
        throw new Error("Product contract not initialized");
      }

      const result = await this.productContract.evaluateTransaction(
        "productExists",
        productId
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      return resultStr === "true" || resultStr === true;
    } catch (error) {
      console.error("❌ Blockchain productExists error:", error);
      return false;
    }
  }

  // ========================================
  // ORDER METHODS (keep existing)
  // ========================================

  async initOrderContract() {
    if (!this.network) {
      await this.connect();
    }
    this.orderContract = this.network.getContract("order");
    console.log("✅ Order contract initialized");
  }

  /**
   * Record order creation event
   * @param {object} orderData - Order data (immutable fields only)
   * @returns {object} Order creation event
   */
  async recordOrderCreation(orderData) {
    try {
      console.log("📝 Recording order creation on blockchain...");

      if (!this.orderContract) {
        await this.initOrderContract();
      }

      // Only send immutable fields to blockchain
      const event = {
        orderId: orderData.orderId,
        orderNumber: orderData.orderNumber, // Required by chaincode
        customerId: orderData.customerId,
        customerName: orderData.customerName || "",
        customerWalletAddress: orderData.customerWalletAddress || "",

        // Seller/Vendor information (required by chaincode)
        sellerId: orderData.sellerId || orderData.vendorId,
        sellerName: orderData.sellerName || orderData.vendorName || "",
        sellerWalletAddress: orderData.sellerWalletAddress || orderData.vendorWalletAddress || "",
        sellerRole: orderData.sellerRole || "vendor",

        // Items snapshot (immutable at creation)
        items: orderData.items || [],

        // Pricing at creation (immutable snapshot)
        subtotal: orderData.subtotal || 0,
        shippingCost: orderData.shippingCost || 0,
        tax: orderData.tax || 0,
        total: orderData.total || orderData.totalAmount || 0,
        currency: orderData.currency || "CVT",

        // Initial payment method
        paymentMethod: orderData.paymentMethod || "",

        // Shipping address snapshot (immutable at creation)
        shippingAddress: orderData.shippingAddress || {},

        // Initial status
        initialStatus: orderData.status || "pending",

        // References
        transactionHash: orderData.transactionHash || null,
        ipfsHash: orderData.ipfsHash || null,

        timestamp: new Date().toISOString(),
        createdAt: orderData.createdAt || new Date().toISOString(),
      };

      const result = await this.orderContract.submitTransaction(
        "recordOrderCreation",
        JSON.stringify(event)
      );

      console.log("✅ Order creation event recorded on blockchain");

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Blockchain recordOrderCreation error:", error);
      throw error;
    }
  }

  /**
   * @deprecated Use recordOrderCreation instead
   */
  async createOrder(orderData) {
    throw new Error("createOrder() is deprecated. Use recordOrderCreation() instead.");
  }

  /**
   * Get order event history
   * @param {string} orderId - Order ID
   * @returns {object[]} Array of all order events (creation, payments, status changes)
   */
  async getOrderEventHistory(orderId) {
    try {
      console.log(`📝 Getting order event history from blockchain: ${orderId}`);

      if (!this.orderContract) {
        await this.initOrderContract();
      }

      const result = await this.orderContract.evaluateTransaction(
        "getOrderEventHistory",
        orderId
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Blockchain getOrderEventHistory error:", error);
      throw error;
    }
  }

  /**
   * @deprecated Use getOrderEventHistory instead
   */
  async getOrder(orderId) {
    console.warn("⚠️ getOrder() is deprecated. Use getOrderEventHistory() instead.");
    return this.getOrderEventHistory(orderId);
  }

  /**
   * Record order status change event
   * THIS ANSWERS THE USER'S QUESTION: "if order status changes we will store a new copy?"
   * Answer: YES, but we store small STATUS CHANGE EVENTS (~350 bytes), NOT full order copies (~5KB)
   *
   * @param {string} orderId - Order ID
   * @param {object} updateData - Status change data
   * @returns {object} Status change event
   */
  async recordOrderStatusChange(orderId, updateData) {
    try {
      console.log(`📝 Recording order status change: ${orderId}`);

      if (!this.orderContract) {
        await this.initOrderContract();
      }

      // Only send status change details (small event!)
      const event = {
        orderId,
        oldStatus: updateData.oldStatus || updateData.previousStatus || "",
        newStatus: updateData.newStatus || updateData.status,
        changedBy: updateData.changedBy || updateData.updatedBy || "",
        trackingNumber: updateData.trackingNumber || null,
        notes: updateData.notes || "",
        timestamp: new Date().toISOString(),
      };

      const result = await this.orderContract.submitTransaction(
        "recordOrderStatusChange",
        JSON.stringify(event)
      );

      console.log("✅ Order status change event recorded on blockchain");

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Blockchain recordOrderStatusChange error:", error);
      throw error;
    }
  }

  /**
   * @deprecated Use recordOrderStatusChange instead
   */
  async updateOrderStatus(orderId, updateData) {
    throw new Error("updateOrderStatus() is deprecated. Use recordOrderStatusChange() instead.");
  }

  /**
   * Record order payment event
   * NEW METHOD for recording when customer pays for an order
   *
   * @param {string} orderId - Order ID
   * @param {object} paymentData - Payment details
   * @returns {object} Payment event
   */
  async recordOrderPayment(orderId, paymentData) {
    try {
      console.log(`📝 Recording order payment: ${orderId}`);

      if (!this.orderContract) {
        await this.initOrderContract();
      }

      const event = {
        orderId,
        paidBy: paymentData.paidBy || paymentData.customerId,
        amount: paymentData.amount || paymentData.totalAmount,
        currency: paymentData.currency || "CVT",
        paymentMethod: paymentData.paymentMethod || "",
        transactionHash: paymentData.transactionHash || null,
        notes: paymentData.notes || "",
        timestamp: new Date().toISOString(),
      };

      const result = await this.orderContract.submitTransaction(
        "recordOrderPayment",
        JSON.stringify(event)
      );

      console.log("✅ Order payment event recorded on blockchain");

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Blockchain recordOrderPayment error:", error);
      throw error;
    }
  }

  /**
   * Record order cancellation event
   * @param {string} orderId - Order ID
   * @param {object} cancellationData - Cancellation details
   * @returns {object} Cancellation event
   */
  async recordOrderCancellation(orderId, cancellationData) {
    try {
      console.log(`📝 Recording order cancellation: ${orderId}`);

      if (!this.orderContract) {
        await this.initOrderContract();
      }

      const event = {
        orderId,
        cancelledBy: cancellationData.cancelledBy || cancellationData.userId,
        reason: cancellationData.reason || "",
        refundAmount: cancellationData.refundAmount || null,
        timestamp: new Date().toISOString(),
      };

      const result = await this.orderContract.submitTransaction(
        "recordOrderCancellation",
        JSON.stringify(event)
      );

      console.log("✅ Order cancellation event recorded on blockchain");

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Blockchain recordOrderCancellation error:", error);
      throw error;
    }
  }

  async getOrderHistory(orderId) {
    try {
      await this.ensureContract("order");

      console.log(`📝 Getting order history: ${orderId}`);

      const result = await this.orderContract.evaluateTransaction(
        "GetOrderHistory",
        orderId
      );

      const history = JSON.parse(result.toString());

      if (Array.isArray(history)) {
        return history.map((entry) => ({
          ...entry,
          timestamp: entry.timestamp
            ? new Date(entry.timestamp).toISOString()
            : new Date().toISOString(),
        }));
      }

      return history;
    } catch (error) {
      console.error("❌ Blockchain getOrderHistory error:", error);
      throw error;
    }
  }

  async getAllOrders() {
    try {
      console.log("📝 Getting all orders from blockchain...");

      if (!this.orderContract) {
        await this.initOrderContract();
      }

      const result = await this.orderContract.evaluateTransaction(
        "getAllOrders"
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Blockchain getAllOrders error:", error);
      throw error;
    }
  }

  async queryOrdersByCustomer(customerId) {
    try {
      console.log(`📝 Querying orders by customer: ${customerId}`);

      if (!this.orderContract) {
        await this.initOrderContract();
      }

      const result = await this.orderContract.evaluateTransaction(
        "queryOrdersByCustomer",
        customerId
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Blockchain queryOrdersByCustomer error:", error);
      throw error;
    }
  }

  async queryOrdersBySeller(sellerId) {
    try {
      console.log(`📝 Querying orders by seller: ${sellerId}`);

      if (!this.orderContract) {
        await this.initOrderContract();
      }

      const result = await this.orderContract.evaluateTransaction(
        "queryOrdersBySeller",
        sellerId
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Blockchain queryOrdersBySeller error:", error);
      throw error;
    }
  }

  async recordOwnershipTransfer(orderId, transferData) {
    try {
      console.log(`📝 Recording ownership transfer for order: ${orderId}`);

      if (!this.orderContract) {
        await this.initOrderContract();
      }

      const result = await this.orderContract.submitTransaction(
        "recordOwnershipTransfer",
        orderId,
        JSON.stringify(transferData)
      );

      console.log("✅ Ownership transfer recorded on blockchain");

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Blockchain recordOwnershipTransfer error:", error);
      throw error;
    }
  }

  async cancelOrder(orderId, cancellationData) {
    try {
      console.log(`📝 Cancelling order: ${orderId}`);

      if (!this.orderContract) {
        await this.initOrderContract();
      }

      const result = await this.orderContract.submitTransaction(
        "cancelOrder",
        orderId,
        JSON.stringify(cancellationData)
      );

      console.log("✅ Order cancelled on blockchain");

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Blockchain cancelOrder error:", error);
      throw error;
    }
  }

  async submitTransaction(contractName, functionName, ...args) {
    const startTime = Date.now();
    let logData = {
      transactionId: `${contractName}-${functionName}-${Date.now()}`,
      chaincodeName: contractName,
      functionName: functionName,
      type: this._determineTransactionType(contractName, functionName),
      action: functionName,
      status: "pending",
      requestData: args,
    };

    try {
      await this.connect();
      const contract = this.network.getContract(contractName);
      const result = await contract.submitTransaction(functionName, ...args);
      const parsedResult = JSON.parse(result.toString());

      const executionTime = Date.now() - startTime;

      logData.status = "success";
      logData.executionTime = executionTime;
      logData.responseData = parsedResult;
      logData.transactionId = parsedResult.txId || logData.transactionId;
      logData.blockHash = parsedResult.blockHash;

      BlockchainLog.createLog(logData).catch((err) =>
        console.warn("⚠️ Failed to log transaction:", err.message)
      );

      return parsedResult;
    } catch (error) {
      const executionTime = Date.now() - startTime;

      logData.status = "failed";
      logData.executionTime = executionTime;
      logData.errorMessage = error.message;
      logData.errorStack = error.stack;

      BlockchainLog.createLog(logData).catch((err) =>
        console.warn("⚠️ Failed to log transaction:", err.message)
      );

      console.error(`❌ Submit transaction failed:`, error);
      throw error;
    }
  }

  _determineTransactionType(contractName, functionName) {
    const typeMap = {
      ProductContract: "product-creation",
      OrderContract: "order-creation",
      UserContract: "user-registration",
    };

    if (functionName.includes("transfer")) return "product-transfer";
    if (functionName.includes("update"))
      return `${contractName.replace("Contract", "").toLowerCase()}-update`;

    return typeMap[contractName] || "system-event";
  }

  // ========================================
  // BLOCKCHAIN LOGGING
  // ========================================

  async createBlockchainLog(logId, logData) {
    try {
      if (!this.orderContract) {
        await this.initOrderContract();
      }

      const result = await this.orderContract.submitTransaction(
        "createLog",
        logId,
        JSON.stringify(logData)
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      try {
        return JSON.parse(resultStr);
      } catch (parseError) {
        console.warn("⚠️ Blockchain log saved but response parse failed");
        return { success: true, logId };
      }
    } catch (error) {
      console.warn("⚠️ Failed to create blockchain log:", error.message);
      return null;
    }
  }

  async ensureContract(contractType = "order") {
    if (!this.gateway || !this.network) {
      await this.connect();
    }

    const chaincodeName = "chainvanguard";

    switch (contractType.toLowerCase()) {
      case "user":
        if (!this.userContract) {
          this.userContract = this.network.getContract(
            chaincodeName,
            "UserContract"
          );
          console.log("✅ User contract initialized");
        }
        break;
      case "product":
        if (!this.productContract) {
          this.productContract = this.network.getContract(
            chaincodeName,
            "ProductContract"
          );
          console.log("✅ Product contract initialized");
        }
        break; // ✅ ADD THIS!
      case "order":
        if (!this.orderContract) {
          this.orderContract = this.network.getContract(
            chaincodeName,
            "OrderContract"
          );
          console.log("✅ Order contract initialized");
        }
        break;
      case "inventory":
        if (!this.inventoryContract) {
          this.inventoryContract = this.network.getContract(
            chaincodeName,
            "InventoryContract"
          );
          console.log("✅ InventoryContract contract initialized");
        }
        break;
      case "vendorinventory":
      case "vendor-inventory":
        if (!this.vendorInventoryContract) {
          this.vendorInventoryContract = this.network.getContract(
            chaincodeName,
            "VendorInventoryContract"
          );
          console.log("✅ VendorInventoryContract initialized");
        }
        break;
      case "vendorrequest":
      case "vendor-request":
        if (!this.vendorRequestContract) {
          this.vendorRequestContract = this.network.getContract(
            chaincodeName,
            "VendorRequestContract"
          );
          console.log("✅ Vendor Request contract initialized");
        }
        break;
      case "token":
        if (!this.tokenContract) {
          this.tokenContract = this.network.getContract(
            chaincodeName,
            "TokenContract"
          );
          console.log("✅ Token contract initialized");
        }
        break;
      default:
        throw new Error(`Unknown contract type: ${contractType}`);
    }
  }

  async invoke(contractName, functionName, ...args) {
    const startTime = Date.now();

    const normalizedContractName = contractName
      .replace(/Contract$/i, "")
      .toLowerCase();

    let logData = {
      type: "blockchain_transaction",
      entityType: "system",
      chaincodeName: normalizedContractName,
      functionName: functionName,
      action: `${normalizedContractName}.${functionName}`,
      status: "pending",
      data: {
        contractName: normalizedContractName,
        functionName,
        args: args,
      },
    };

    try {
      console.log(`📝 Invoking ${normalizedContractName}.${functionName}...`);
      console.log(`📦 Args:`, args);

      await this.ensureContract(normalizedContractName);

      let contract;
      switch (normalizedContractName) {
        case "user":
          contract = this.userContract;
          break;
        case "product":
          contract = this.productContract;
          break;
        case "order":
          contract = this.orderContract;
          break;
        case "inventory":
          if (!this.inventoryContract) {
            this.inventoryContract = this.network.getContract(
              "chainvanguard",
              "InventoryContract"
            );
          }
          contract = this.inventoryContract;
          break;
        case "vendorinventory":
        case "vendor-inventory":
          if (!this.vendorInventoryContract) {
            this.vendorInventoryContract = this.network.getContract(
              "chainvanguard",
              "VendorInventoryContract"
            );
          }
          contract = this.vendorInventoryContract;
          break;
        case "vendorrequest":
        case "vendor-request":
          if (!this.vendorRequestContract) {
            this.vendorRequestContract = this.network.getContract(
              "chainvanguard",
              "VendorRequestContract"
            );
          }
          contract = this.vendorRequestContract;
          break;
        case "token":
          contract = this.tokenContract;
          break;
        default:
          throw new Error(`Unknown contract: ${normalizedContractName}`);
      }

      if (!contract) {
        throw new Error(`Contract ${normalizedContractName} not initialized`);
      }

      const result = await contract.submitTransaction(functionName, ...args);

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else if (Buffer.isBuffer(result)) {
        resultStr = result.toString("utf8");
      } else {
        resultStr = result.toString();
      }

      console.log(`📋 Raw chaincode response:`, resultStr);

      let parsedResult;
      try {
        parsedResult = JSON.parse(resultStr);
      } catch (parseError) {
        console.warn("⚠️ Response is not JSON, wrapping in object");
        parsedResult = {
          success: true,
          result: resultStr,
          message: resultStr,
        };
      }

      const executionTime = Date.now() - startTime;

      logData.status = "success";
      logData.executionTime = executionTime;
      logData.data.response = parsedResult;
      logData.txHash = parsedResult.txId || "";
      logData.blockNumber = parsedResult.blockNumber || 0;

      BlockchainLog.createLog(logData).catch((err) =>
        console.warn("⚠️ Failed to log transaction:", err.message)
      );

      console.log(
        `✅ ${normalizedContractName}.${functionName} completed in ${executionTime}ms`
      );

      if (parsedResult.txId) {
        return parsedResult.txId;
      }

      return parsedResult;
    } catch (error) {
      const executionTime = Date.now() - startTime;

      logData.status = "failed";
      logData.executionTime = executionTime;
      logData.error = error.message;
      logData.data.errorStack = error.stack;

      BlockchainLog.createLog(logData).catch((err) =>
        console.warn("⚠️ Failed to log error:", err.message)
      );

      console.error(
        `❌ Invoke ${normalizedContractName}.${functionName} failed:`,
        error.message
      );
      console.error(`📋 Error details:`, error.details || error);

      throw error;
    }
  }

  async evaluate(contractName, functionName, ...args) {
    try {
      const normalizedContractName = contractName
        .replace(/Contract$/i, "")
        .toLowerCase();

      console.log(`📖 Evaluating ${normalizedContractName}.${functionName}...`);

      await this.ensureContract(normalizedContractName);

      let contract;
      switch (normalizedContractName) {
        case "user":
          contract = this.userContract;
          break;
        case "product":
          contract = this.productContract;
          break;
        case "order":
          contract = this.orderContract;
          break;
        case "InventoryContract":
          if (!this.inventoryContract) {
            this.inventoryContract = this.network.getContract(
              "chainvanguard",
              "InventoryContract"
            );
          }
          contract = this.inventoryContract;
          break;
        case "token":
          contract = this.tokenContract;
          break;
        default:
          throw new Error(`Unknown contract: ${normalizedContractName}`);
      }

      if (!contract) {
        throw new Error(`Contract ${normalizedContractName} not initialized`);
      }

      const result = await contract.evaluateTransaction(functionName, ...args);

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      let parsedResult;
      try {
        parsedResult = JSON.parse(resultStr);
      } catch (e) {
        parsedResult = { result: resultStr };
      }

      console.log(
        `✅ ${normalizedContractName}.${functionName} evaluated successfully`
      );

      return parsedResult;
    } catch (error) {
      const normalizedContractName = contractName
        .replace(/Contract$/i, "")
        .toLowerCase();
      console.error(
        `❌ Evaluate ${normalizedContractName}.${functionName} failed:`,
        error.message
      );
      throw error;
    }
  }

  // ========================================
  // VENDOR REQUEST CONTRACT METHODS (keep existing)
  // ========================================

  async initVendorRequestContract() {
    try {
      if (!this.gateway) {
        await this.connect();
      }

      const network = await this.gateway.getNetwork("supply-chain-channel");
      this.vendorRequestContract = network.getContract(
        "chainvanguard",
        "VendorRequestContract"
      );

      console.log("✅ Vendor Request Contract initialized");
      return this.vendorRequestContract;
    } catch (error) {
      console.error("❌ Error initializing vendor request contract:", error);
      throw error;
    }
  }

  /**
   * Record vendor request creation event
   * @param {object} requestData - Vendor request data
   * @returns {object} Vendor request creation event
   */
  async recordVendorRequestCreation(requestData) {
    try {
      console.log(
        `📝 Recording vendor request creation on blockchain: ${requestData.requestNumber}`
      );

      if (!this.vendorRequestContract) {
        await this.initVendorRequestContract();
      }

      // Only send immutable fields to blockchain
      const event = {
        requestId: requestData.requestId,
        requestNumber: requestData.requestNumber,
        vendorId: requestData.vendorId,
        vendorName: requestData.vendorName || "",
        vendorWalletAddress: requestData.vendorWalletAddress || "",

        supplierId: requestData.supplierId,
        supplierName: requestData.supplierName || "",
        supplierWalletAddress: requestData.supplierWalletAddress || "",

        // Multi-item support (immutable snapshot)
        items: requestData.items || [],
        subtotal: requestData.subtotal || 0,
        tax: requestData.tax || 0,
        total: requestData.total || 0,
        currency: requestData.currency || "CVT",

        // Initial status
        initialStatus: requestData.initialStatus || requestData.status || "pending",

        // Timestamps
        createdAt: requestData.createdAt || new Date().toISOString(),
        timestamp: new Date().toISOString(),
      };

      const result = await this.vendorRequestContract.submitTransaction(
        "recordVendorRequestCreation",
        JSON.stringify(event)
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else if (Buffer.isBuffer(result)) {
        resultStr = result.toString("utf8");
      } else {
        resultStr = result.toString();
      }

      const parsedResult = JSON.parse(resultStr);
      console.log("✅ Vendor request creation event recorded on blockchain:", parsedResult);

      return parsedResult;
    } catch (error) {
      console.error("❌ Blockchain recordVendorRequestCreation error:", error);
      throw error;
    }
  }

  /**
   * @deprecated Use recordVendorRequestCreation instead
   */
  async createVendorRequest(requestData) {
    throw new Error("createVendorRequest() is deprecated. Use recordVendorRequestCreation() instead.");
  }

  /**
   * Record vendor request approval event
   * @param {string} requestId - Request ID
   * @param {string} approverId - Supplier ID who approved
   * @param {string} timestamp - Approval timestamp
   * @param {string} notes - Approval notes
   * @returns {object} Approval event
   */
  async recordVendorRequestApproval(requestId, approverId, timestamp, notes = "") {
    try {
      console.log(`✅ Recording vendor request approval ${requestId} on blockchain`);

      if (!this.vendorRequestContract) {
        await this.initVendorRequestContract();
      }

      const event = {
        requestId,
        approvedBy: approverId,
        notes: notes || "",
        timestamp: timestamp || new Date().toISOString(),
      };

      const result = await this.vendorRequestContract.submitTransaction(
        "recordVendorRequestApproval",
        JSON.stringify(event)
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else if (Buffer.isBuffer(result)) {
        resultStr = result.toString("utf8");
      } else {
        resultStr = result.toString();
      }

      const parsedResult = JSON.parse(resultStr);
      console.log("✅ Vendor request approval event recorded on blockchain:", parsedResult);

      return parsedResult;
    } catch (error) {
      console.error("❌ Blockchain recordVendorRequestApproval error:", error);
      throw error;
    }
  }

  /**
   * @deprecated Use recordVendorRequestApproval instead
   */
  async approveVendorRequest(requestId, approverId, timestamp, notes = "") {
    throw new Error("approveVendorRequest() is deprecated. Use recordVendorRequestApproval() instead.");
  }

  /**
   * Record vendor request rejection event
   * @param {string} requestId - Request ID
   * @param {string} rejecterId - Supplier ID who rejected
   * @param {string} timestamp - Rejection timestamp
   * @param {string} reason - Rejection reason
   * @returns {object} Rejection event
   */
  async recordVendorRequestRejection(requestId, rejecterId, timestamp, reason) {
    try {
      console.log(`❌ Recording vendor request rejection ${requestId} on blockchain`);

      if (!this.vendorRequestContract) {
        await this.initVendorRequestContract();
      }

      if (!reason || reason.trim() === "") {
        throw new Error("Rejection reason is required");
      }

      const event = {
        requestId,
        rejectedBy: rejecterId,
        reason: reason,
        timestamp: timestamp || new Date().toISOString(),
      };

      const result = await this.vendorRequestContract.submitTransaction(
        "recordVendorRequestRejection",
        JSON.stringify(event)
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else if (Buffer.isBuffer(result)) {
        resultStr = result.toString("utf8");
      } else {
        resultStr = result.toString();
      }

      const parsedResult = JSON.parse(resultStr);
      console.log("✅ Vendor request rejection event recorded on blockchain:", parsedResult);

      return parsedResult;
    } catch (error) {
      console.error("❌ Blockchain recordVendorRequestRejection error:", error);
      throw error;
    }
  }

  /**
   * @deprecated Use recordVendorRequestRejection instead
   */
  async rejectVendorRequest(requestId, rejecterId, timestamp, reason) {
    throw new Error("rejectVendorRequest() is deprecated. Use recordVendorRequestRejection() instead.");
  }

  /**
   * THIS ANSWERS THE USER'S SECOND QUESTION: "when vendor pays for inventory will that also be recorded?"
   * Answer: YES! This is a CRITICAL event for the financial audit trail.
   *
   * Record vendor request payment event (when vendor pays supplier)
   * @param {string} requestId - Request ID
   * @param {object} paymentData - Payment details
   * @returns {object} Payment event
   */
  async recordVendorRequestPayment(requestId, paymentData) {
    try {
      console.log(`💰 Recording vendor request payment ${requestId} on blockchain`);

      if (!this.vendorRequestContract) {
        await this.initVendorRequestContract();
      }

      const event = {
        requestId,
        paidBy: paymentData.vendorId || paymentData.paidBy,
        amount: paymentData.amount || paymentData.totalCost,
        currency: paymentData.currency || "CVT",
        paymentMethod: paymentData.paymentMethod || "",
        transactionHash: paymentData.transactionHash || null,
        orderId: paymentData.orderId || null, // Created order
        vendorInventoryId: paymentData.vendorInventoryId || null, // Created vendor inventory
        timestamp: new Date().toISOString(),
      };

      const result = await this.vendorRequestContract.submitTransaction(
        "recordVendorRequestPayment",
        JSON.stringify(event)
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else if (Buffer.isBuffer(result)) {
        resultStr = result.toString("utf8");
      } else {
        resultStr = result.toString();
      }

      const parsedResult = JSON.parse(resultStr);
      console.log("✅ Vendor request payment event recorded on blockchain:", parsedResult);

      return parsedResult;
    } catch (error) {
      console.error("❌ Blockchain recordVendorRequestPayment error:", error);
      throw error;
    }
  }

  /**
   * Record vendor request cancellation event
   * @param {string} requestId - Request ID
   * @param {string} vendorId - Vendor ID who cancelled
   * @param {string} timestamp - Cancellation timestamp
   * @param {string} notes - Cancellation notes
   * @returns {object} Cancellation event
   */
  async recordVendorRequestCancellation(requestId, vendorId, timestamp, notes = "") {
    try {
      console.log(`🚫 Recording vendor request cancellation ${requestId} on blockchain`);

      if (!this.vendorRequestContract) {
        await this.initVendorRequestContract();
      }

      const event = {
        requestId,
        cancelledBy: vendorId,
        notes: notes || "",
        timestamp: timestamp || new Date().toISOString(),
      };

      const result = await this.vendorRequestContract.submitTransaction(
        "recordVendorRequestCancellation",
        JSON.stringify(event)
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else if (Buffer.isBuffer(result)) {
        resultStr = result.toString("utf8");
      } else {
        resultStr = result.toString();
      }

      const parsedResult = JSON.parse(resultStr);
      console.log("✅ Vendor request cancellation event recorded on blockchain:", parsedResult);

      return parsedResult;
    } catch (error) {
      console.error("❌ Blockchain recordVendorRequestCancellation error:", error);
      throw error;
    }
  }

  /**
   * @deprecated Use recordVendorRequestCancellation instead
   */
  async cancelVendorRequest(requestId, vendorId, timestamp, notes = "") {
    throw new Error("cancelVendorRequest() is deprecated. Use recordVendorRequestCancellation() instead.");
  }

  /**
   * @deprecated Status updates are mutable. Use specific event methods:
   * - recordVendorRequestApproval()
   * - recordVendorRequestRejection()
   * - recordVendorRequestPayment()
   * - recordVendorRequestCancellation()
   * - recordVendorRequestCompletion()
   */
  async updateVendorRequestStatus(
    requestId,
    newStatus,
    updatedBy,
    timestamp,
    notes = ""
  ) {
    throw new Error("updateVendorRequestStatus() is deprecated. Use specific event methods: recordVendorRequestApproval(), recordVendorRequestPayment(), etc.");
  }

  /**
   * Record vendor request completion event
   * @param {string} requestId - Request ID
   * @param {string} completedBy - Who completed the request
   * @param {string} timestamp - Completion timestamp
   * @param {string} notes - Completion notes
   * @returns {object} Completion event
   */
  async recordVendorRequestCompletion(requestId, completedBy, timestamp, notes = "") {
    try {
      console.log(
        `🔒 Recording vendor request completion ${requestId} on blockchain`
      );

      if (!this.vendorRequestContract) {
        await this.initVendorRequestContract();
      }

      const event = {
        requestId,
        completedBy,
        notes: notes || "",
        timestamp: timestamp || new Date().toISOString(),
      };

      const result = await this.vendorRequestContract.submitTransaction(
        "recordVendorRequestCompletion",
        JSON.stringify(event)
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else if (Buffer.isBuffer(result)) {
        resultStr = result.toString("utf8");
      } else {
        resultStr = result.toString();
      }

      const parsedResult = JSON.parse(resultStr);
      console.log(
        "✅ Vendor request completion event recorded on blockchain:",
        parsedResult
      );

      return parsedResult;
    } catch (error) {
      console.error("❌ Blockchain recordVendorRequestCompletion error:", error);
      throw error;
    }
  }

  /**
   * @deprecated Use recordVendorRequestCompletion instead
   */
  async completeVendorRequest(requestId, completedBy, timestamp, notes = "") {
    try {
      console.log(
        `🔒 Completing and locking vendor request ${requestId} on blockchain`
      );

      if (!this.vendorRequestContract) {
        await this.initVendorRequestContract();
      }

      const result = await this.vendorRequestContract.submitTransaction(
        "completeVendorRequest",
        requestId,
        completedBy,
        timestamp || new Date().toISOString()
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else if (Buffer.isBuffer(result)) {
        resultStr = result.toString("utf8");
      } else {
        resultStr = result.toString();
      }

      const parsedResult = JSON.parse(resultStr);
      console.log(
        "✅ Vendor request completed and locked on blockchain:",
        parsedResult
      );

      return parsedResult;
    } catch (error) {
      console.error("❌ Blockchain completeVendorRequest error:", error);
      throw error;
    }
  }

  async getVendorRequest(requestId) {
    try {
      if (!this.vendorRequestContract) {
        await this.initVendorRequestContract();
      }

      const result = await this.vendorRequestContract.evaluateTransaction(
        "getVendorRequest",
        requestId
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else if (Buffer.isBuffer(result)) {
        resultStr = result.toString("utf8");
      } else {
        resultStr = result.toString();
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Blockchain getVendorRequest error:", error);
      throw error;
    }
  }

  async getVendorRequestHistory(requestId) {
    try {
      console.log(
        `📜 Getting vendor request ${requestId} history from blockchain`
      );

      if (!this.vendorRequestContract) {
        await this.initVendorRequestContract();
      }

      const result = await this.vendorRequestContract.evaluateTransaction(
        "getVendorRequestHistory",
        requestId
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else if (Buffer.isBuffer(result)) {
        resultStr = result.toString("utf8");
      } else {
        resultStr = result.toString();
      }

      const history = JSON.parse(resultStr);
      console.log(
        `✅ Retrieved ${history.length} history records from blockchain`
      );

      return history;
    } catch (error) {
      console.error("❌ Blockchain getVendorRequestHistory error:", error);
      throw error;
    }
  }

  async queryVendorRequestsBySupplier(supplierId) {
    try {
      console.log(
        `🔍 Querying vendor requests for supplier ${supplierId} from blockchain`
      );

      if (!this.vendorRequestContract) {
        await this.initVendorRequestContract();
      }

      const result = await this.vendorRequestContract.evaluateTransaction(
        "getVendorRequestsBySupplier",
        supplierId
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else if (Buffer.isBuffer(result)) {
        resultStr = result.toString("utf8");
      } else {
        resultStr = result.toString();
      }

      const requests = JSON.parse(resultStr);
      console.log(
        `✅ Found ${requests.length} vendor requests from blockchain`
      );

      return requests;
    } catch (error) {
      console.error(
        "❌ Blockchain queryVendorRequestsBySupplier error:",
        error
      );
      throw error;
    }
  }

  async queryVendorRequestsByVendor(vendorId) {
    try {
      console.log(
        `🔍 Querying vendor requests for vendor ${vendorId} from blockchain`
      );

      if (!this.vendorRequestContract) {
        await this.initVendorRequestContract();
      }

      const result = await this.vendorRequestContract.evaluateTransaction(
        "getVendorRequestsByVendor",
        vendorId
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else if (Buffer.isBuffer(result)) {
        resultStr = result.toString("utf8");
      } else {
        resultStr = result.toString();
      }

      const requests = JSON.parse(resultStr);
      console.log(
        `✅ Found ${requests.length} vendor requests from blockchain`
      );

      return requests;
    } catch (error) {
      console.error("❌ Blockchain queryVendorRequestsByVendor error:", error);
      throw error;
    }
  }

  async queryVendorRequestsByStatus(supplierId, status) {
    try {
      console.log(
        `🔍 Querying ${status} vendor requests for supplier ${supplierId} from blockchain`
      );

      if (!this.vendorRequestContract) {
        await this.initVendorRequestContract();
      }

      const result = await this.vendorRequestContract.evaluateTransaction(
        "getVendorRequestsByStatus",
        supplierId,
        status
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else if (Buffer.isBuffer(result)) {
        resultStr = result.toString("utf8");
      } else {
        resultStr = result.toString();
      }

      const requests = JSON.parse(resultStr);
      console.log(
        `✅ Found ${requests.length} ${status} vendor requests from blockchain`
      );

      return requests;
    } catch (error) {
      console.error("❌ Blockchain queryVendorRequestsByStatus error:", error);
      throw error;
    }
  }

  // ========================================
  // VENDOR INVENTORY CONTRACT METHODS
  // ========================================

  /**
   * Create vendor inventory on blockchain
   */
  // ========================================
  // VENDOR INVENTORY METHODS (event-based)
  // ========================================

  /**
   * Record vendor inventory creation event
   * This is triggered when vendor pays for and receives inventory from supplier
   *
   * @param {object} vendorInventoryData - Vendor inventory data
   * @returns {object} Vendor inventory creation event
   */
  async recordVendorInventoryCreation(vendorInventoryData) {
    try {
      console.log(
        `📦 Recording vendor inventory creation on blockchain: ${vendorInventoryData.vendorInventoryId}`
      );

      if (!this.vendorInventoryContract) {
        await this.ensureContract("vendorinventory");
      }

      // Only send immutable fields
      const event = {
        vendorInventoryId: vendorInventoryData.vendorInventoryId,
        name: vendorInventoryData.name,
        category: vendorInventoryData.category || "",
        subcategory: vendorInventoryData.subcategory || "",

        vendorId: vendorInventoryData.vendorId,
        vendorName: vendorInventoryData.vendorName || "",
        vendorWalletAddress: vendorInventoryData.vendorWalletAddress || "",

        supplierId: vendorInventoryData.supplierId,
        supplierName: vendorInventoryData.supplierName || "",
        supplierWalletAddress: vendorInventoryData.supplierWalletAddress || "",

        sourceInventoryId: vendorInventoryData.sourceInventoryId,

        // Received quantity (immutable snapshot at creation)
        quantity: vendorInventoryData.quantity || vendorInventoryData.receivedQuantity,
        unit: vendorInventoryData.unit || "",

        // Purchase details (immutable)
        pricePerUnit: vendorInventoryData.pricePerUnit || 0,
        totalCost: vendorInventoryData.totalCost || 0,
        currency: vendorInventoryData.currency || "CVT",

        orderId: vendorInventoryData.orderId,
        vendorRequestId: vendorInventoryData.vendorRequestId || "",

        materialType: vendorInventoryData.materialType || "",
        textileDetails: vendorInventoryData.textileDetails || {},
        weight: vendorInventoryData.weight || 0,
        dimensions: vendorInventoryData.dimensions || "",

        createdAt: vendorInventoryData.createdAt || new Date().toISOString(),
      };

      const result = await this.vendorInventoryContract.submitTransaction(
        "recordVendorInventoryCreation",
        JSON.stringify(event)
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else if (Buffer.isBuffer(result)) {
        resultStr = result.toString("utf8");
      } else {
        resultStr = result.toString();
      }

      const parsedResult = JSON.parse(resultStr);
      console.log("✅ Vendor inventory creation event recorded on blockchain:", parsedResult);

      return parsedResult;
    } catch (error) {
      console.error("❌ Blockchain recordVendorInventoryCreation error:", error);
      throw error;
    }
  }

  /**
   * @deprecated Use recordVendorInventoryCreation instead
   */
  async createVendorInventory(vendorInventoryData) {
    throw new Error("createVendorInventory() is deprecated. Use recordVendorInventoryCreation() instead.");
  }

  /**
   * Record vendor inventory usage event
   * @param {string} vendorInventoryId - Vendor inventory ID
   * @param {object} usageData - Usage details
   * @returns {object} Usage event
   */
  async recordVendorInventoryUsage(vendorInventoryId, usageData) {
    try {
      console.log(
        `📦 Recording vendor inventory usage on blockchain: ${vendorInventoryId}`
      );

      if (!this.vendorInventoryContract) {
        await this.ensureContract("vendorinventory");
      }

      const event = {
        vendorInventoryId,
        usedBy: usageData.usedBy || usageData.vendorId,
        usedQuantity: usageData.usedQuantity || usageData.quantity,
        unit: usageData.unit || "",
        purpose: usageData.purpose, // product_creation, order_fulfillment, etc.
        productId: usageData.productId || null,
        orderId: usageData.orderId || null,
        notes: usageData.notes || "",
      };

      const result = await this.vendorInventoryContract.submitTransaction(
        "recordVendorInventoryUsage",
        JSON.stringify(event)
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else if (Buffer.isBuffer(result)) {
        resultStr = result.toString("utf8");
      } else {
        resultStr = result.toString();
      }

      const parsedResult = JSON.parse(resultStr);
      console.log("✅ Vendor inventory usage event recorded on blockchain:", parsedResult);

      return parsedResult;
    } catch (error) {
      console.error("❌ Blockchain recordVendorInventoryUsage error:", error);
      throw error;
    }
  }

  /**
   * @deprecated Quantity updates are mutable. Use recordVendorInventoryUsage instead
   */
  async updateVendorInventory(vendorInventoryData) {
    throw new Error("updateVendorInventory() is deprecated. Quantity updates are mutable. Use recordVendorInventoryUsage() to track usage.");
  }

  /**
   * Get vendor inventory event history
   * @param {string} vendorInventoryId - Vendor inventory ID
   * @returns {object[]} Array of all vendor inventory events
   */
  async getVendorInventoryEventHistory(vendorInventoryId) {
    try {
      if (!this.vendorInventoryContract) {
        await this.ensureContract("vendorinventory");
      }

      const result = await this.vendorInventoryContract.evaluateTransaction(
        "getVendorInventoryEventHistory",
        vendorInventoryId
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else if (Buffer.isBuffer(result)) {
        resultStr = result.toString("utf8");
      } else {
        resultStr = result.toString();
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Blockchain getVendorInventoryEventHistory error:", error);
      throw error;
    }
  }

  /**
   * @deprecated Use getVendorInventoryEventHistory instead
   */
  async getVendorInventory(vendorInventoryId) {
    console.warn("⚠️ getVendorInventory() is deprecated. Use getVendorInventoryEventHistory() instead.");
    return this.getVendorInventoryEventHistory(vendorInventoryId);
  }

  /**
   * Query vendor inventory creation events by vendor
   * @param {string} vendorId - Vendor ID
   * @returns {object[]} Array of vendor inventory creation events
   */
  async queryVendorInventoryByVendor(vendorId) {
    try {
      console.log(
        `🔍 Querying vendor inventory for vendor ${vendorId} from blockchain`
      );

      if (!this.vendorInventoryContract) {
        await this.ensureContract("vendorinventory");
      }

      const result = await this.vendorInventoryContract.evaluateTransaction(
        "queryVendorInventoryByVendor",
        vendorId
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else if (Buffer.isBuffer(result)) {
        resultStr = result.toString("utf8");
      } else {
        resultStr = result.toString();
      }

      const inventory = JSON.parse(resultStr);
      console.log(
        `✅ Found ${inventory.length} vendor inventory items from blockchain`
      );

      return inventory;
    } catch (error) {
      console.error("❌ Blockchain queryVendorInventoryByVendor error:", error);
      throw error;
    }
  }

  /**
   * @deprecated Use queryVendorInventoryByVendor instead
   */
  async getVendorInventoryByVendor(vendorId) {
    console.warn("⚠️ getVendorInventoryByVendor() is deprecated. Use queryVendorInventoryByVendor() instead.");
    return this.queryVendorInventoryByVendor(vendorId);
  }

  // ========================================
  // INVOICE METHODS
  // ========================================

  /**
   * Record invoice issuance event on blockchain
   * @param {object} invoiceData - Invoice details
   * @returns {object} Blockchain transaction result
   */
  async recordInvoiceIssued(invoiceData) {
    try {
      console.log(`📄 Recording invoice issuance on blockchain: ${invoiceData.invoiceNumber}`);

      // For now, we'll use the order contract for invoice events
      // In production, you might want a dedicated InvoiceContract
      if (!this.orderContract) {
        await this.ensureContract("order");
      }

      // Create invoice event for blockchain
      const event = {
        docType: "event",
        eventType: "INVOICE_ISSUED",
        invoiceId: invoiceData.invoiceId,
        invoiceNumber: invoiceData.invoiceNumber,
        invoiceType: invoiceData.type,
        fromUserId: invoiceData.fromUserId,
        toUserId: invoiceData.toUserId,
        total: invoiceData.total,
        currency: invoiceData.currency || "CVT",
        ipfsHash: invoiceData.ipfsHash,
        issueDate: invoiceData.issueDate,
        timestamp: new Date().toISOString(),
      };

      // Use createLog method to record on blockchain
      const txId = `INVOICE_${invoiceData.invoiceNumber}_${Date.now()}`;
      const result = await this.orderContract.submitTransaction(
        "createLog",
        txId,
        JSON.stringify(event)
      );

      console.log(`✅ Invoice recorded on blockchain: ${invoiceData.invoiceNumber}`);

      return {
        success: true,
        txId: txId,
        invoiceNumber: invoiceData.invoiceNumber,
      };
    } catch (error) {
      console.error("❌ Blockchain recordInvoiceIssued error:", error);
      throw error;
    }
  }
}

export default new FabricService();
