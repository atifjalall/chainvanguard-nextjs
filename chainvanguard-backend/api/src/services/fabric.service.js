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
    this.tokenContract = null; // ✅ ADD THIS
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
        `   Contracts: UserContract, ProductContract, OrderContract, InventoryContract, VendorRequestContract, TokenContract`
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

  async registerUser(userData) {
    try {
      console.log(`📝 Registering user on blockchain: ${userData.name}`);

      if (!this.userContract) {
        throw new Error("Not connected to Fabric network");
      }

      const walletAddress = String(userData.walletAddress || "");
      const name = String(userData.name || "");
      const email = String(userData.email || "");
      const role = String(userData.role || "");
      const organizationMSP = String(userData.organizationMSP || "Org1MSP");
      const companyName = String(userData.companyName || "");
      const businessAddress = String(userData.businessAddress || "");
      const businessType = String(userData.businessType || "");

      if (!walletAddress || !name || !email || !role) {
        throw new Error(
          "Missing required user fields for blockchain registration"
        );
      }

      console.log("📦 Blockchain registration data:", {
        walletAddress,
        name,
        email,
        role,
        organizationMSP,
        companyName,
        businessAddress,
        businessType,
      });

      const result = await this.retryOperation(
        async () => {
          return await this.userContract.submitTransaction(
            "registerUser",
            walletAddress,
            name,
            email,
            role,
            organizationMSP,
            walletAddress,
            companyName,
            businessAddress,
            businessType
          );
        },
        3,
        2000
      );

      console.log("✅ User registered on blockchain");

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      console.log("📦 Blockchain response:", resultStr);

      if (!resultStr || resultStr.trim() === "") {
        console.log("⚠️ Empty response from chaincode, user likely created");
        return { success: true, userId: walletAddress };
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Failed to register user on blockchain:", error);
      throw error;
    }
  }

  async getUser(userId) {
    try {
      if (!this.userContract) {
        throw new Error("Not connected to Fabric network");
      }

      const result = await this.userContract.evaluateTransaction(
        "getUser",
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
      console.error("❌ Failed to get user from blockchain:", error);
      throw error;
    }
  }

  async updateUser(userId, updateData) {
    try {
      if (!this.userContract) {
        throw new Error("Not connected to Fabric network");
      }

      const result = await this.userContract.submitTransaction(
        "updateUser",
        userId,
        updateData.name || "",
        updateData.email || "",
        updateData.companyName || "",
        updateData.businessAddress || ""
      );

      console.log("✅ User updated on blockchain");

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Failed to update user on blockchain:", error);
      throw error;
    }
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

  async recordLogin(userId) {
    try {
      if (!this.userContract) {
        throw new Error("Not connected to Fabric network");
      }

      await this.userContract.submitTransaction(
        "recordLogin",
        userId
      );
      console.log(`✅ Login recorded on blockchain for: ${userId}`);
    } catch (error) {
      console.warn("⚠️ Failed to record login on blockchain:", error.message);
    }
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
      // Account might already exist
      if (error.message.includes("already exists")) {
        console.log("⚠️ Token account already exists");
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
  // PRODUCT METHODS (keep existing)
  // ========================================

  async createProduct(productData) {
    try {
      console.log("📝 Creating product on blockchain...");

      if (!this.productContract) {
        throw new Error("Product contract not initialized");
      }

      if (!productData || !productData.productId) {
        throw new Error("Product data missing productId");
      }

      console.log("📦 Sending to blockchain:", {
        productId: productData.productId,
        name: productData.name,
        category: productData.category,
      });

      const result = await this.productContract.submitTransaction(
        "createProduct",
        JSON.stringify(productData)
      );

      console.log("✅ Product created on blockchain");

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Blockchain createProduct error:", error);
      console.error("Error details:", {
        message: error.message,
        details: error.details,
      });
      throw error;
    }
  }

  async getProduct(productId) {
    try {
      console.log(`📝 Getting product from blockchain: ${productId}`);

      if (!this.productContract) {
        throw new Error("Product contract not initialized");
      }

      const result = await this.productContract.evaluateTransaction(
        "readProduct",
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
      console.error("❌ Blockchain getProduct error:", error);
      throw error;
    }
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

  async updateProduct(productId, updateData) {
    try {
      console.log(`📝 Updating product on blockchain: ${productId}`);

      if (!this.productContract) {
        throw new Error("Product contract not initialized");
      }

      const data =
        typeof updateData === "string"
          ? updateData
          : JSON.stringify(updateData);

      const result = await this.productContract.submitTransaction(
        "updateProduct",
        productId,
        data
      );

      console.log("✅ Product updated on blockchain");

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Blockchain updateProduct error:", error);
      throw error;
    }
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

  async verifyProduct(productId, verificationData) {
    try {
      console.log(`📝 Verifying product: ${productId}`);

      if (!this.productContract) {
        throw new Error("Product contract not initialized");
      }

      const result = await this.productContract.submitTransaction(
        "verifyProduct",
        productId,
        JSON.stringify(verificationData)
      );

      console.log("✅ Product verified on blockchain");

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Blockchain verifyProduct error:", error);
      throw error;
    }
  }

  async transferProduct(productId, transferData) {
    try {
      console.log(`📝 Transferring product: ${productId}`);

      if (!this.productContract) {
        throw new Error("Product contract not initialized");
      }

      const result = await this.productContract.submitTransaction(
        "transferProduct",
        productId,
        JSON.stringify(transferData)
      );

      console.log("✅ Product transferred on blockchain");

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Blockchain transferProduct error:", error);
      throw error;
    }
  }

  async archiveProduct(productId, deletedBy) {
    try {
      console.log(`📝 Archiving product: ${productId}`);

      if (!this.productContract) {
        throw new Error("Product contract not initialized");
      }

      const result = await this.productContract.submitTransaction(
        "archiveProduct",
        productId,
        deletedBy
      );

      console.log("✅ Product archived on blockchain");

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Blockchain archiveProduct error:", error);
      throw error;
    }
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

  async createOrder(orderData) {
    try {
      console.log("📝 Creating order on blockchain...");

      if (!this.orderContract) {
        await this.initOrderContract();
      }

      const result = await this.orderContract.submitTransaction(
        "createOrder",
        JSON.stringify(orderData)
      );

      console.log("✅ Order created on blockchain");

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Blockchain createOrder error:", error);
      throw error;
    }
  }

  async getOrder(orderId) {
    try {
      console.log(`📝 Getting order from blockchain: ${orderId}`);

      if (!this.orderContract) {
        await this.initOrderContract();
      }

      const result = await this.orderContract.evaluateTransaction(
        "readOrder",
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
      console.error("❌ Blockchain getOrder error:", error);
      throw error;
    }
  }

  async updateOrderStatus(orderId, updateData) {
    try {
      console.log(`📝 Updating order status: ${orderId}`);

      if (!this.orderContract) {
        await this.initOrderContract();
      }

      const result = await this.orderContract.submitTransaction(
        "updateOrderStatus",
        orderId,
        JSON.stringify(updateData)
      );

      console.log("✅ Order status updated on blockchain");

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      return JSON.parse(resultStr);
    } catch (error) {
      console.error("❌ Blockchain updateOrderStatus error:", error);
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

  async createVendorRequest(requestData) {
    try {
      console.log(
        `📝 Creating vendor request on blockchain: ${requestData.requestNumber}`
      );

      if (!this.vendorRequestContract) {
        await this.initVendorRequestContract();
      }

      const result = await this.vendorRequestContract.submitTransaction(
        "createVendorRequest",
        JSON.stringify(requestData)
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
      console.log("✅ Vendor request created on blockchain:", parsedResult);

      return parsedResult;
    } catch (error) {
      console.error("❌ Blockchain createVendorRequest error:", error);
      throw error;
    }
  }

  async approveVendorRequest(requestId, approverId, timestamp, notes = "") {
    try {
      console.log(`✅ Approving vendor request ${requestId} on blockchain`);

      if (!this.vendorRequestContract) {
        await this.initVendorRequestContract();
      }

      const result = await this.vendorRequestContract.submitTransaction(
        "approveVendorRequest",
        requestId,
        approverId,
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
      console.log("✅ Vendor request approved on blockchain:", parsedResult);

      return parsedResult;
    } catch (error) {
      console.error("❌ Blockchain approveVendorRequest error:", error);
      throw error;
    }
  }

  async rejectVendorRequest(requestId, rejecterId, timestamp, reason) {
    try {
      console.log(`❌ Rejecting vendor request ${requestId} on blockchain`);

      if (!this.vendorRequestContract) {
        await this.initVendorRequestContract();
      }

      if (!reason || reason.trim() === "") {
        throw new Error("Rejection reason is required");
      }

      const result = await this.vendorRequestContract.submitTransaction(
        "rejectVendorRequest",
        requestId,
        rejecterId,
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
      console.log("✅ Vendor request rejected on blockchain:", parsedResult);

      return parsedResult;
    } catch (error) {
      console.error("❌ Blockchain rejectVendorRequest error:", error);
      throw error;
    }
  }

  async cancelVendorRequest(requestId, vendorId, timestamp, notes = "") {
    try {
      console.log(`🚫 Cancelling vendor request ${requestId} on blockchain`);

      if (!this.vendorRequestContract) {
        await this.initVendorRequestContract();
      }

      const result = await this.vendorRequestContract.submitTransaction(
        "cancelVendorRequest",
        requestId,
        vendorId,
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
      console.log("✅ Vendor request cancelled on blockchain:", parsedResult);

      return parsedResult;
    } catch (error) {
      console.error("❌ Blockchain cancelVendorRequest error:", error);
      throw error;
    }
  }

  async updateVendorRequestStatus(
    requestId,
    newStatus,
    updatedBy,
    timestamp,
    notes = ""
  ) {
    try {
      console.log(
        `🔄 Updating vendor request ${requestId} status to ${newStatus} on blockchain`
      );

      if (!this.vendorRequestContract) {
        await this.initVendorRequestContract();
      }

      const result = await this.vendorRequestContract.submitTransaction(
        "updateVendorRequestStatus",
        requestId,
        newStatus,
        updatedBy,
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
        "✅ Vendor request status updated on blockchain:",
        parsedResult
      );

      return parsedResult;
    } catch (error) {
      console.error("❌ Blockchain updateVendorRequestStatus error:", error);
      throw error;
    }
  }

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
}

export default new FabricService();
