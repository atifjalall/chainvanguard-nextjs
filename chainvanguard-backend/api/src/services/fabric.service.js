// chainvanguard-backend/api/src/services/fabric.service.js
import * as grpc from "@grpc/grpc-js";
import { connect, signers, hash } from "@hyperledger/fabric-gateway";
import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";
import * as crypto from "crypto";
import BlockchainLog from "../models/BlockchainLog.js";

class FabricService {
  constructor() {
    this.gateway = null;
    this.network = null;
    this.contract = null;
    this.userContract = null; // For user management
    this.productContract = null; // For product management
    this.orderContract = null; // For order management
    this.inventoryContract = null;
    this.client = null;
  }

  async connect() {
    try {
      console.log("🔹 Connecting to Fabric using Gateway SDK...");

      // Configuration
      const channelName = "supply-chain-channel";
      const userChaincodeName = "user";
      const productChaincodeName = "product";
      const mspId = "Org1MSP";

      // Use ABSOLUTE paths to fabric-samples
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

      // Create gRPC client for Org1 peer
      const tlsRootCert = readFileSync(tlsCertPath);
      const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
      this.client = new grpc.Client("localhost:7051", tlsCredentials, {
        "grpc.ssl_target_name_override": "peer0.org1.example.com",
      });
      console.log("✅ gRPC client created for Org1");

      // Get identity and signer
      const identity = await this.newIdentity(certDirectoryPath, mspId);
      console.log("✅ Identity loaded");

      const signer = await this.newSigner(keyDirectoryPath);
      console.log("✅ Signer created");

      // Connect to gateway
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

      // Get network and contracts
      this.network = this.gateway.getNetwork(channelName);

      this.userContract = this.network.getContract(userChaincodeName);
      this.productContract = this.network.getContract(productChaincodeName);
      this.orderContract = this.network.getContract("order"); // ← ADD THIS LINE

      // Backward compatibility
      this.contract = this.userContract;

      console.log("✅ Successfully connected to Fabric network");
      console.log(`   Channel: ${channelName}`);
      console.log(`   User Chaincode: ${userChaincodeName}`);
      console.log(`   Product Chaincode: ${productChaincodeName}`);
      console.log(`   Order Chaincode: order`); // ← ADD THIS LINE

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

      // ❌ REMOVE THIS - it's closing MongoDB too!
      // if (this.client) {
      //   this.client.close();
      // }

      // ✅ Only close the gRPC client, not all clients
      if (this.client) {
        // Just set to null, gRPC will handle cleanup
        this.client = null;
      }

      console.log("✅ Disconnected from Fabric");
    } catch (error) {
      console.error("❌ Error disconnecting from Fabric:", error);
    }
  }

  async retryOperation(operation, maxRetries = 3, delayMs = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === maxRetries - 1) throw error;

        console.log(`⚠️ Attempt ${i + 1} failed, retrying in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
      }
    }
  }

  async registerUser(userData) {
    try {
      console.log(`📝 Registering user on blockchain: ${userData.name}`);

      if (!this.userContract) {
        throw new Error("Not connected to Fabric network");
      }

      // ✅ FIX: Ensure ALL values are strings, never undefined/null
      const walletAddress = String(userData.walletAddress || "");
      const name = String(userData.name || "");
      const email = String(userData.email || "");
      const role = String(userData.role || "");
      const organizationMSP = String(userData.organizationMSP || "Org1MSP");
      const companyName = String(userData.companyName || "");
      const businessAddress = String(userData.businessAddress || "");
      const businessType = String(userData.businessType || "");

      // Validate required fields
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
            walletAddress, // userId
            name,
            email,
            role,
            organizationMSP,
            walletAddress, // Duplicate for signature verification
            companyName,
            businessAddress,
            businessType
          );
        },
        3,
        2000
      );

      console.log("✅ User registered on blockchain");

      // Convert Uint8Array to string properly
      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      console.log("📦 Blockchain response:", resultStr);

      // Handle empty or malformed response
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

      const result = await this.userContract.evaluateTransaction("getAllUsers");

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

      const result =
        await this.userContract.evaluateTransaction("getUserStats");

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

      await this.userContract.submitTransaction("recordLogin", userId);
      console.log(`✅ Login recorded on blockchain for: ${userId}`);
    } catch (error) {
      console.warn("⚠️ Failed to record login on blockchain:", error.message);
      // Don't throw - login should still work if blockchain recording fails
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
  // PRODUCT METHODS
  // ========================================

  /**
   * Create a new product on the blockchain
   * @param {Object} productData - Product data to store
   * @returns {Object} Created product from blockchain
   */
  async createProduct(productData) {
    try {
      console.log("📝 Creating product on blockchain...");

      if (!this.productContract) {
        throw new Error("Product contract not initialized");
      }

      // Validate product data
      if (!productData || !productData.productId) {
        throw new Error("Product data missing productId");
      }

      console.log("📦 Sending to blockchain:", {
        productId: productData.productId,
        name: productData.name,
        category: productData.category,
      });

      // Call ProductContract with namespace
      const result = await this.productContract.submitTransaction(
        "ProductContract:createProduct",
        JSON.stringify(productData)
      );

      console.log("✅ Product created on blockchain");

      // Parse response
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

  /**
   * Get a product by ID from the blockchain
   * @param {string} productId - Product ID
   * @returns {Object} Product data
   */
  async getProduct(productId) {
    try {
      console.log(`📝 Getting product from blockchain: ${productId}`);

      if (!this.productContract) {
        throw new Error("Product contract not initialized");
      }

      const result = await this.productContract.evaluateTransaction(
        "ProductContract:readProduct",
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

  /**
   * Get all products from the blockchain
   * @returns {Array} Array of all products
   */
  async getAllProducts() {
    try {
      console.log("📝 Getting all products from blockchain...");

      if (!this.productContract) {
        throw new Error("Product contract not initialized");
      }

      const result = await this.productContract.evaluateTransaction(
        "ProductContract:getAllProducts"
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
   * Update a product on the blockchain
   * @param {string} productId - Product ID
   * @param {Object} updateData - Update data
   * @returns {Object} Updated product
   */
  async updateProduct(productId, updateData) {
    try {
      console.log(`📝 Updating product on blockchain: ${productId}`);

      if (!this.productContract) {
        throw new Error("Product contract not initialized");
      }

      // Ensure updateData is properly formatted
      const data =
        typeof updateData === "string"
          ? updateData
          : JSON.stringify(updateData);

      const result = await this.productContract.submitTransaction(
        "ProductContract:updateProduct",
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

  /**
   * Get product history from the blockchain
   * @param {string} productId - Product ID
   * @returns {Array} Transaction history
   */
  async getProductHistory(productId) {
    try {
      console.log(`📝 Getting product history: ${productId}`);

      if (!this.productContract) {
        throw new Error("Product contract not initialized");
      }

      const result = await this.productContract.evaluateTransaction(
        "ProductContract:getProductHistory",
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

  /**
   * Query products by seller
   * @param {string} sellerId - Seller ID
   * @returns {Array} Array of products
   */
  async queryProductsBySeller(sellerId) {
    try {
      console.log(`📝 Querying products by seller: ${sellerId}`);

      if (!this.productContract) {
        throw new Error("Product contract not initialized");
      }

      const result = await this.productContract.evaluateTransaction(
        "ProductContract:queryProductsBySeller",
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

  /**
   * Query products by category
   * @param {string} category - Product category
   * @returns {Array} Array of products
   */
  async queryProductsByCategory(category) {
    try {
      console.log(`📝 Querying products by category: ${category}`);

      if (!this.productContract) {
        throw new Error("Product contract not initialized");
      }

      const result = await this.productContract.evaluateTransaction(
        "ProductContract:queryProductsByCategory",
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

  /**
   * Query verified products
   * @returns {Array} Array of verified products
   */
  async queryVerifiedProducts() {
    try {
      console.log("📝 Querying verified products...");

      if (!this.productContract) {
        throw new Error("Product contract not initialized");
      }

      const result = await this.productContract.evaluateTransaction(
        "ProductContract:queryVerifiedProducts"
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
   * Verify a product (Expert only)
   * @param {string} productId - Product ID
   * @param {Object} verificationData - Verification details
   * @returns {Object} Verified product
   */
  async verifyProduct(productId, verificationData) {
    try {
      console.log(`📝 Verifying product: ${productId}`);

      if (!this.productContract) {
        throw new Error("Product contract not initialized");
      }

      const result = await this.productContract.submitTransaction(
        "ProductContract:verifyProduct",
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

  /**
   * Transfer product ownership
   * @param {string} productId - Product ID
   * @param {Object} transferData - Transfer details
   * @returns {Object} Updated product
   */
  async transferProduct(productId, transferData) {
    try {
      console.log(`📝 Transferring product: ${productId}`);

      if (!this.productContract) {
        throw new Error("Product contract not initialized");
      }

      const result = await this.productContract.submitTransaction(
        "ProductContract:transferProduct",
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

  /**
   * Archive a product
   * @param {string} productId - Product ID
   * @param {string} deletedBy - User who archived the product
   * @returns {Object} Archived product
   */
  async archiveProduct(productId, deletedBy) {
    try {
      console.log(`📝 Archiving product: ${productId}`);

      if (!this.productContract) {
        throw new Error("Product contract not initialized");
      }

      const result = await this.productContract.submitTransaction(
        "ProductContract:archiveProduct",
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

  /**
   * Check if a product exists on the blockchain
   * @param {string} productId - Product ID
   * @returns {boolean} True if product exists
   */
  async productExists(productId) {
    try {
      console.log(`📝 Checking if product exists: ${productId}`);

      if (!this.productContract) {
        throw new Error("Product contract not initialized");
      }

      const result = await this.productContract.evaluateTransaction(
        "ProductContract:productExists",
        productId
      );

      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      // Parse boolean result
      return resultStr === "true" || resultStr === true;
    } catch (error) {
      console.error("❌ Blockchain productExists error:", error);
      return false;
    }
  }

  // ========================================
  // ORDER METHODS
  // ========================================

  /**
   * Initialize order contract
   */
  async initOrderContract() {
    if (!this.network) {
      await this.connect();
    }
    this.orderContract = this.network.getContract("order");
    console.log("✅ Order contract initialized");
  }

  /**
   * Create order on blockchain
   * @param {Object} orderData - Order data
   * @returns {Object} Created order
   */
  async createOrder(orderData) {
    try {
      console.log("📝 Creating order on blockchain...");

      if (!this.orderContract) {
        await this.initOrderContract();
      }

      const result = await this.orderContract.submitTransaction(
        "OrderContract:createOrder",
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

  /**
   * Get order by ID
   * @param {string} orderId - Order ID
   * @returns {Object} Order data
   */
  async getOrder(orderId) {
    try {
      console.log(`📝 Getting order from blockchain: ${orderId}`);

      if (!this.orderContract) {
        await this.initOrderContract();
      }

      const result = await this.orderContract.evaluateTransaction(
        "OrderContract:readOrder",
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

  /**
   * Update order status
   * @param {string} orderId - Order ID
   * @param {Object} updateData - Update data
   * @returns {Object} Updated order
   */
  async updateOrderStatus(orderId, updateData) {
    try {
      console.log(`📝 Updating order status: ${orderId}`);

      if (!this.orderContract) {
        await this.initOrderContract();
      }

      const result = await this.orderContract.submitTransaction(
        "OrderContract:updateOrderStatus",
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

  /**
   * Get order history
   * @param {string} orderId - Order ID
   * @returns {Array} Transaction history
   */
  async getOrderHistory(orderId) {
    try {
      await this.ensureContract("order"); // ✅ Now this exists

      console.log(`📝 Getting order history: ${orderId}`);

      const result = await this.orderContract.evaluateTransaction(
        "GetOrderHistory",
        orderId
      );

      const history = JSON.parse(result.toString());

      // Format dates properly
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

  /**
   * Get all orders
   * @returns {Array} All orders
   */
  async getAllOrders() {
    try {
      console.log("📝 Getting all orders from blockchain...");

      if (!this.orderContract) {
        await this.initOrderContract();
      }

      const result = await this.orderContract.evaluateTransaction(
        "OrderContract:getAllOrders"
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

  /**
   * Query orders by customer
   * @param {string} customerId - Customer ID
   * @returns {Array} Customer orders
   */
  async queryOrdersByCustomer(customerId) {
    try {
      console.log(`📝 Querying orders by customer: ${customerId}`);

      if (!this.orderContract) {
        await this.initOrderContract();
      }

      const result = await this.orderContract.evaluateTransaction(
        "OrderContract:queryOrdersByCustomer",
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

  /**
   * Query orders by seller
   * @param {string} sellerId - Seller ID
   * @returns {Array} Seller orders
   */
  async queryOrdersBySeller(sellerId) {
    try {
      console.log(`📝 Querying orders by seller: ${sellerId}`);

      if (!this.orderContract) {
        await this.initOrderContract();
      }

      const result = await this.orderContract.evaluateTransaction(
        "OrderContract:queryOrdersBySeller",
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

  /**
   * Record product ownership transfer
   * @param {string} orderId - Order ID
   * @param {Object} transferData - Transfer details
   * @returns {Object} Result
   */
  async recordOwnershipTransfer(orderId, transferData) {
    try {
      console.log(`📝 Recording ownership transfer for order: ${orderId}`);

      if (!this.orderContract) {
        await this.initOrderContract();
      }

      const result = await this.orderContract.submitTransaction(
        "OrderContract:recordOwnershipTransfer",
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

  /**
   * Cancel order
   * @param {string} orderId - Order ID
   * @param {Object} cancellationData - Cancellation details
   * @returns {Object} Updated order
   */
  async cancelOrder(orderId, cancellationData) {
    try {
      console.log(`📝 Cancelling order: ${orderId}`);

      if (!this.orderContract) {
        await this.initOrderContract();
      }

      const result = await this.orderContract.submitTransaction(
        "OrderContract:cancelOrder",
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

  // Replace the submitTransaction method in your FabricService class
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

      // Log successful transaction (non-blocking)
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

      // Log failed transaction (non-blocking)
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

  // Helper method to determine transaction type
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

  /**
   * Create a log entry on blockchain
   * @param {string} logId - MongoDB log ID
   * @param {Object} logData - Log data object
   */
  async createBlockchainLog(logId, logData) {
    try {
      if (!this.orderContract) {
        await this.initOrderContract();
      }

      const result = await this.orderContract.submitTransaction(
        "OrderContract:createLog",
        logId,
        JSON.stringify(logData)
      );

      // Convert result to string properly
      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else {
        resultStr = result.toString();
      }

      // Try to parse as JSON
      try {
        return JSON.parse(resultStr);
      } catch (parseError) {
        // If JSON parse fails, log is still saved, just return success
        console.warn("⚠️ Blockchain log saved but response parse failed");
        return { success: true, logId };
      }
    } catch (error) {
      // Don't throw - logging should never break the app
      console.warn("⚠️ Failed to create blockchain log:", error.message);
      return null;
    }
  }

  /**
   * Ensure contract is initialized
   */
  async ensureContract(contractType = "order") {
    if (!this.gateway || !this.network) {
      await this.connect();
    }

    switch (contractType) {
      case "user":
        if (!this.userContract) {
          this.userContract = this.network.getContract("user");
        }
        break;
      case "product":
        if (!this.productContract) {
          this.productContract = this.network.getContract("product");
        }
        break;
      case "order":
        if (!this.orderContract) {
          this.orderContract = this.network.getContract("order");
        }
        break;
      default:
        throw new Error(`Unknown contract type: ${contractType}`);
    }
  }

  /**
   * Generic invoke method for calling any chaincode function
   * FIXED: Properly handles chaincode responses
   */
  async invoke(contractName, functionName, ...args) {
    const startTime = Date.now();

    // Normalize contract name - remove "Contract" suffix if present
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

      // Ensure the contract is initialized
      await this.ensureContract(normalizedContractName);

      // Get the appropriate contract
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
              "inventory",
              "inventory"
            );
          }
          contract = this.inventoryContract;
          break;
        default:
          throw new Error(`Unknown contract: ${normalizedContractName}`);
      }

      if (!contract) {
        throw new Error(`Contract ${normalizedContractName} not initialized`);
      }

      // Submit transaction
      const result = await contract.submitTransaction(functionName, ...args);

      // Parse result - chaincode returns Buffer/Uint8Array
      let resultStr;
      if (result instanceof Uint8Array) {
        resultStr = Buffer.from(result).toString("utf8");
      } else if (Buffer.isBuffer(result)) {
        resultStr = result.toString("utf8");
      } else {
        resultStr = result.toString();
      }

      console.log(`📋 Raw chaincode response:`, resultStr);

      // Try to parse as JSON
      let parsedResult;
      try {
        parsedResult = JSON.parse(resultStr);
      } catch (parseError) {
        // If not JSON, return the string wrapped in an object
        console.warn("⚠️ Response is not JSON, wrapping in object");
        parsedResult = {
          success: true,
          result: resultStr,
          message: resultStr,
        };
      }

      const executionTime = Date.now() - startTime;

      // Log successful transaction (non-blocking)
      logData.status = "success";
      logData.executionTime = executionTime;
      logData.data.response = parsedResult;
      logData.txHash = parsedResult.txId || ctx.stub?.getTxID?.() || "";
      logData.blockNumber = parsedResult.blockNumber || 0;

      BlockchainLog.createLog(logData).catch((err) =>
        console.warn("⚠️ Failed to log transaction:", err.message)
      );

      console.log(
        `✅ ${normalizedContractName}.${functionName} completed in ${executionTime}ms`
      );

      // Return the txId if it exists, otherwise return the whole result
      if (parsedResult.txId) {
        return parsedResult.txId;
      }

      return parsedResult;
    } catch (error) {
      const executionTime = Date.now() - startTime;

      // Log failed transaction (non-blocking)
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

  /**
   * Generic evaluate method for read-only queries
   * @param {string} contractName - Contract name
   * @param {string} functionName - Function to call
   * @param {Array} args - Arguments for the function
   * @returns {Promise<Object>} Result from chaincode
   */
  async evaluate(contractName, functionName, ...args) {
    try {
      // Normalize contract name
      const normalizedContractName = contractName
        .replace(/Contract$/i, "")
        .toLowerCase();

      console.log(`📖 Evaluating ${normalizedContractName}.${functionName}...`);

      // Ensure the contract is initialized
      await this.ensureContract(normalizedContractName);

      // Get the appropriate contract
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
              "inventory",
              "inventory"
            );
          }
          contract = this.inventoryContract;
          break;
        default:
          throw new Error(`Unknown contract: ${normalizedContractName}`);
      }

      if (!contract) {
        throw new Error(`Contract ${normalizedContractName} not initialized`);
      }

      // Evaluate transaction (read-only)
      const result = await contract.evaluateTransaction(functionName, ...args);

      // Parse result
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

  // Helper method to determine transaction type
  _determineTransactionType(contractName, functionName) {
    const normalized = contractName.replace(/Contract$/i, "").toLowerCase();

    if (functionName.toLowerCase().includes("create")) {
      return `${normalized}_created`;
    }
    if (functionName.toLowerCase().includes("update")) {
      return `${normalized}_updated`;
    }
    if (
      functionName.toLowerCase().includes("delete") ||
      functionName.toLowerCase().includes("archive")
    ) {
      return `${normalized}_deleted`;
    }
    if (functionName.toLowerCase().includes("transfer")) {
      return `${normalized}_transferred`;
    }

    return "blockchain_transaction";
  }

  /**
   * Generic evaluate method for read-only queries
   * @param {string} contractName - Contract name
   * @param {string} functionName - Function to call
   * @param {Array} args - Arguments for the function
   * @returns {Promise<Object>} Result from chaincode
   */
  async evaluate(contractName, functionName, ...args) {
    try {
      console.log(`📖 Evaluating ${contractName}.${functionName}...`);

      // Ensure the contract is initialized
      await this.ensureContract(contractName);

      // Get the appropriate contract
      let contract;
      switch (contractName.toLowerCase()) {
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
              "inventory",
              "inventory"
            );
          }
          contract = this.inventoryContract;
          break;
        default:
          throw new Error(`Unknown contract: ${contractName}`);
      }

      if (!contract) {
        throw new Error(`Contract ${contractName} not initialized`);
      }

      // Evaluate transaction (read-only)
      const result = await contract.evaluateTransaction(functionName, ...args);

      // Parse result
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

      console.log(`✅ ${contractName}.${functionName} evaluated successfully`);

      return parsedResult;
    } catch (error) {
      console.error(
        `❌ Evaluate ${contractName}.${functionName} failed:`,
        error.message
      );
      throw error;
    }
  }

  // Update the ensureContract method to include inventory
  async ensureContract(contractType = "order") {
    if (!this.gateway || !this.network) {
      await this.connect();
    }

    switch (contractType.toLowerCase()) {
      case "user":
        if (!this.userContract) {
          this.userContract = this.network.getContract("user");
          console.log("✅ User contract initialized");
        }
        break;
      case "product":
        if (!this.productContract) {
          this.productContract = this.network.getContract("product");
          console.log("✅ Product contract initialized");
        }
        break;
      case "order":
        if (!this.orderContract) {
          this.orderContract = this.network.getContract("order");
          console.log("✅ Order contract initialized");
        }
        break;
      case "inventory":
        if (!this.inventoryContract) {
          this.inventoryContract = this.network.getContract(
            "inventory",
            "inventory"
          );
          console.log("✅ Inventory contract initialized");
        }
        break;
      default:
        throw new Error(`Unknown contract type: ${contractType}`);
    }
  }

  /**
   * ========================================
   * VENDOR REQUEST CONTRACT METHODS
   * Add these methods to the FabricService class
   * ========================================
   */

  /**
   * Initialize vendor request contract
   */
  async initVendorRequestContract() {
    try {
      if (!this.gateway) {
        await this.connect();
      }

      const network = await this.gateway.getNetwork("supply-chain-channel");
      this.vendorRequestContract = network.getContract(
        "vendor-request",
        "vendorRequest"
      );

      console.log("✅ Vendor Request Contract initialized");
      return this.vendorRequestContract;
    } catch (error) {
      console.error("❌ Error initializing vendor request contract:", error);
      throw error;
    }
  }

  /**
   * Create vendor request on blockchain
   */
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

      // Parse result
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

  /**
   * Approve vendor request on blockchain
   */
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

      // Parse result
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

  /**
   * Reject vendor request on blockchain
   */
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

      // Parse result
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

  /**
   * Cancel vendor request on blockchain (by vendor)
   */
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

      // Parse result
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

  /**
   * Update vendor request status on blockchain
   */
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
        timestamp || new Date().toISOString(),
      );

      // Parse result
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

  /**
   * Complete and lock vendor request on blockchain
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
        timestamp || new Date().toISOString(),
      );

      // Parse result
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

  /**
   * Get vendor request from blockchain
   */
  async getVendorRequest(requestId) {
    try {
      if (!this.vendorRequestContract) {
        await this.initVendorRequestContract();
      }

      const result = await this.vendorRequestContract.evaluateTransaction(
        "getVendorRequest",
        requestId
      );

      // Parse result
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

  /**
   * Get vendor request history from blockchain (audit trail)
   */
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

      // Parse result
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

  /**
   * Query vendor requests by supplier
   */
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

      // Parse result
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

  /**
   * Query vendor requests by vendor
   */
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

      // Parse result
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

  /**
   * Query vendor requests by status
   */
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

      // Parse result
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

// Export a singleton instance
export default new FabricService();
