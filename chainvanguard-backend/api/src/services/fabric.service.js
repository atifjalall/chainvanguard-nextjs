// chainvanguard-backend/api/src/services/fabric.service.js
import * as grpc from "@grpc/grpc-js";
import { connect, signers, hash } from "@hyperledger/fabric-gateway";
import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";
import * as crypto from "crypto";

class FabricService {
  constructor() {
    this.gateway = null;
    this.network = null;
    this.contract = null;
    this.userContract = null; // For user management
    this.productContract = null; // For product management
    this.orderContract = null; // For order management
    this.client = null;
  }

  async connect() {
    try {
      console.log("🔹 Connecting to Fabric using Gateway SDK...");

      // Configuration
      const channelName = "supply-chain-channel";
      const userChaincodeName = "user"; // ✅ Matches deployed chaincode
      const productChaincodeName = "product"; // ✅ Matches deployed chaincode
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
      console.log(`📝 Getting order history: ${orderId}`);

      if (!this.orderContract) {
        await this.initOrderContract();
      }

      const result = await this.orderContract.evaluateTransaction(
        "OrderContract:getOrderHistory",
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
}

export default FabricService;
