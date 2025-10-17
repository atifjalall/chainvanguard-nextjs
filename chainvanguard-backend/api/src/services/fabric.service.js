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
    this.client = null;
  }

  async connect() {
    try {
      console.log("🔹 Connecting to Fabric using Gateway SDK...");

      // Configuration
      const channelName = "supply-chain-channel";
      const chaincodeName = "user-chaincode";
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

      // Connect to gateway with BOTH peers in endorsement
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
      this.contract = this.network.getContract(chaincodeName);

      this.userContract = this.network.getContract("user-chaincode");
      this.productContract = this.network.getContract(
        "product-chaincode",
        "ProductContract"
      );

      console.log("✅ Successfully connected to Fabric network");
      console.log(`   Channel: ${channelName}`);
      console.log(`   Chaincode: ${chaincodeName}`);

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

  // In your fabric.service.js, update the registerUser method

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

  // Product methods
  async createProduct(productData) {
    try {
      const result = await this.contract.submitTransaction(
        "createProduct",
        JSON.stringify(productData)
      );
      return JSON.parse(result.toString());
    } catch (error) {
      console.error("Fabric createProduct error:", error);
      throw error;
    }
  }

  async getProduct(productId) {
    try {
      const result = await this.contract.evaluateTransaction(
        "readProduct",
        productId
      );
      return JSON.parse(result.toString());
    } catch (error) {
      console.error("Fabric getProduct error:", error);
      throw error;
    }
  }

  async getAllProducts() {
    try {
      const result = await this.contract.evaluateTransaction("getAllProducts");
      return JSON.parse(result.toString());
    } catch (error) {
      console.error("Fabric getAllProducts error:", error);
      throw error;
    }
  }

  async updateProduct(productId, quantity, status) {
    try {
      const result = await this.contract.submitTransaction(
        "updateProduct",
        productId,
        quantity !== undefined ? quantity.toString() : "",
        status || ""
      );
      return JSON.parse(result.toString());
    } catch (error) {
      console.error("Fabric updateProduct error:", error);
      throw error;
    }
  }

  async getProductHistory(productId) {
    try {
      const result = await this.contract.evaluateTransaction(
        "getProductHistory",
        productId
      );
      return JSON.parse(result.toString());
    } catch (error) {
      console.error("Fabric getProductHistory error:", error);
      throw error;
    }
  }

  async queryProductsBySeller(sellerId) {
    try {
      const result = await this.contract.evaluateTransaction(
        "queryProductsBySeller",
        sellerId
      );
      return JSON.parse(result.toString());
    } catch (error) {
      console.error("Fabric queryProductsBySeller error:", error);
      throw error;
    }
  }
}

export default FabricService;
