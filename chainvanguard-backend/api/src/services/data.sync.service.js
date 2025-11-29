import fabricService from "./fabric.service.js";
import ipfsService from "./ipfs.service.js";
import crypto from "crypto";

/**
 * DataSyncService - Orchestrates blockchain-first data flow
 *
 * Data Flow:
 * 1. User Action → Blockchain (source of truth)
 * 2. Blockchain → IPFS (distributed storage)
 * 3. Blockchain + IPFS → MongoDB (cache for fast reads)
 *
 * All data (except notifications and wishlist) goes to blockchain + IPFS first
 * MongoDB is a smart cache that can be verified against blockchain
 */
class DataSyncService {
  constructor() {
    this.fabricService = fabricService;
    this.ipfsService = ipfsService;
  }

  /**
   * Generate SHA-256 hash for data integrity
   * @param {Object|String} data - Data to hash
   * @returns {String} SHA-256 hash
   */
  generateHash(data) {
    const dataString = typeof data === "string" ? data : JSON.stringify(data);
    return crypto.createHash("sha256").update(dataString).digest("hex");
  }

  /**
   * Generate SHA-256 hash for image buffer
   * @param {Buffer} buffer - Image buffer
   * @returns {String} SHA-256 hash
   */
  generateImageHash(buffer) {
    return crypto.createHash("sha256").update(buffer).digest("hex");
  }

  /**
   * Core method: Store data in blockchain-first pattern
   *
   * @param {String} contractType - Contract type: 'user', 'product', 'order', 'inventory', 'vendorRequest', 'vendorInventory'
   * @param {String} functionName - Blockchain function name (e.g., 'createUser', 'createProduct')
   * @param {Object} data - Complete data object to store
   * @param {Object} options - Additional options
   * @param {Boolean} options.skipIPFS - Skip IPFS storage (default: false)
   * @param {Array<String>} options.excludeFromIPFS - Fields to exclude from IPFS (passwords, etc.)
   *
   * @returns {Object} {success, blockchainTx, ipfsHash, ipfsUrl, dataHash}
   */
  async storeData(contractType, functionName, data, options = {}) {
    try {
      const {
        skipIPFS = false,
        excludeFromIPFS = ["password", "passwordHash", "mnemonic"],
      } = options;

      // Step 1: Generate data hash for integrity
      const dataHash = this.generateHash(data);

      // Step 2: Upload to IPFS (distributed storage)
      let ipfsHash = null;
      let ipfsUrl = null;

      if (!skipIPFS) {
        // Prepare data for IPFS (exclude sensitive fields)
        const ipfsData = { ...data };
        excludeFromIPFS.forEach((field) => {
          delete ipfsData[field];
        });

        // Add metadata
        ipfsData._metadata = {
          uploadedAt: new Date().toISOString(),
          dataHash: dataHash,
          contractType: contractType,
        };

        const ipfsResult = await this.ipfsService.uploadJSON(
          ipfsData,
          `${contractType}-${data.id || Date.now()}.json`
        );

        if (!ipfsResult.success) {
          console.error("❌ IPFS upload failed:", ipfsResult.error);
          // Continue anyway - blockchain is source of truth
        } else {
          ipfsHash = ipfsResult.ipfsHash;
          ipfsUrl = ipfsResult.ipfsUrl;
          console.log(`✅ IPFS: ${ipfsHash}`);
        }
      }

      // Step 3: Store in Blockchain (source of truth)
      // Add IPFS hash and data hash to blockchain data
      const blockchainData = {
        ...data,
        ipfsHash: ipfsHash || "",
        dataHash: dataHash,
      };

      // Convert data to blockchain arguments
      const args = this._prepareBlockchainArgs(blockchainData);

      // Invoke blockchain transaction
      const blockchainTx = await this.fabricService.invoke(
        contractType,
        functionName,
        args
      );

      console.log(`✅ Blockchain: ${blockchainTx.transactionId || "stored"}`);

      return {
        success: true,
        blockchainTx: blockchainTx,
        ipfsHash: ipfsHash,
        ipfsUrl: ipfsUrl,
        dataHash: dataHash,
        message: "Data stored on blockchain and IPFS",
      };
    } catch (error) {
      console.error(`❌ DataSync Error [${contractType}]:`, error.message);
      throw error;
    }
  }

  /**
   * Store user data (blockchain-first)
   */
  async storeUser(userData) {
    // NEVER store password on blockchain/IPFS
    const { password, ...safeUserData } = userData;

    return this.storeData("user", "createUser", safeUserData, {
      excludeFromIPFS: ["password", "passwordHash", "mnemonic"],
    });
  }

  /**
   * Store product data (blockchain-first)
   * Images are on Cloudinary, only image hashes go to blockchain/IPFS
   */
  async storeProduct(productData, imageHashes = []) {
    const dataWithImageHashes = {
      ...productData,
      imageHashes: imageHashes, // SHA-256 hashes of Cloudinary images
    };

    return this.storeData(
      "product",
      "recordProductCreation",
      dataWithImageHashes
    );
  }

  /**
   * Store order data (blockchain-first)
   */
  async storeOrder(orderData) {
    return this.storeData("order", "recordOrderCreation", orderData);
  }

  /**
   * Store inventory data (blockchain-first)
   */
  async storeInventory(inventoryData) {
    return this.storeData(
      "inventory",
      "recordInventoryAddition",
      inventoryData
    );
  }

  /**
   * Store vendor request data (blockchain-first)
   */
  async storeVendorRequest(vendorRequestData) {
    return this.storeData(
      "vendorRequest",
      "recordVendorRequestCreation",
      vendorRequestData
    );
  }

  /**
   * Store vendor inventory data (blockchain-first)
   */
  async storeVendorInventory(vendorInventoryData) {
    return this.storeData(
      "vendorInventory",
      "recordVendorInventoryCreation",
      vendorInventoryData
    );
  }

  /**
   * Update data (blockchain-first)
   * Similar to store but uses update functions
   */
  async updateData(contractType, functionName, data, options = {}) {
    return this.storeData(contractType, functionName, data, options);
  }

  /**
   * Retrieve data from blockchain
   * MongoDB should be synced, but blockchain is source of truth
   */
  async getData(contractType, functionName, args) {
    try {
      const result = await this.fabricService.query(
        contractType,
        functionName,
        args
      );

      return {
        success: true,
        data: result,
        source: "blockchain",
      };
    } catch (error) {
      console.error(
        `❌ Blockchain Query Error [${contractType}]:`,
        error.message
      );
      throw error;
    }
  }

  /**
   * Verify MongoDB data against blockchain
   * Use this to ensure MongoDB cache is in sync
   */
  async verifyData(contractType, id, mongoData) {
    try {
      // Get data from blockchain
      const blockchainResult = await this.getData(
        contractType,
        `get${this._capitalize(contractType)}`,
        [id]
      );

      const blockchainData = blockchainResult.data;

      // Compare hashes
      const mongoHash = this.generateHash(mongoData);
      const blockchainHash = blockchainData.dataHash;

      if (mongoHash === blockchainHash) {
        return {
          verified: true,
          message: "MongoDB data matches blockchain",
        };
      } else {
        return {
          verified: false,
          message: "MongoDB data does NOT match blockchain",
          blockchainData: blockchainData,
        };
      }
    } catch (error) {
      console.error("Verification error:", error.message);
      return {
        verified: false,
        error: error.message,
      };
    }
  }

  /**
   * Sync MongoDB from blockchain
   * Use this to rebuild MongoDB cache from blockchain
   */
  async syncFromBlockchain(contractType, Model) {
    try {
      console.log(`🔄 Syncing ${contractType} from blockchain...`);

      // Get all records from blockchain
      const blockchainResult = await this.getData(
        contractType,
        `getAll${this._capitalize(contractType)}s`,
        []
      );

      const records = blockchainResult.data;

      let syncCount = 0;
      for (const record of records) {
        // Update or create in MongoDB
        await Model.findOneAndUpdate({ _id: record.id }, record, {
          upsert: true,
          new: true,
        });
        syncCount++;
      }

      console.log(`✅ Synced ${syncCount} ${contractType} records`);

      return {
        success: true,
        syncedCount: syncCount,
      };
    } catch (error) {
      console.error(`❌ Sync Error [${contractType}]:`, error.message);
      throw error;
    }
  }

  /**
   * Helper: Prepare blockchain arguments
   * Converts object to array of string arguments for Fabric
   */
  _prepareBlockchainArgs(data) {
    // Most chaincode functions accept JSON string as single argument
    return [JSON.stringify(data)];
  }

  /**
   * Helper: Capitalize first letter
   */
  _capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

export default new DataSyncService();
