import ipfsConfig from "../config/ipfs.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class IPFSService {
  constructor() {
    this.ipfs = ipfsConfig;
  }

  // Upload file to IPFS
  async uploadFile(filePath, metadata = {}) {
    try {
      const fileName = path.basename(filePath);
      const result = await this.ipfs.uploadFile(filePath, fileName, metadata);

      if (result.success) {
        console.log(`✅ File uploaded to IPFS: ${result.ipfsHash}`);
        return {
          success: true,
          ipfsHash: result.ipfsHash,
          ipfsUrl: result.ipfsUrl,
          pinSize: result.pinSize,
          timestamp: result.timestamp,
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("IPFS upload error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Upload buffer to IPFS (from memory)
  async uploadBuffer(buffer, fileName, metadata = {}) {
    try {
      console.log(`📦 Preparing buffer upload to IPFS: ${fileName}, size: ${buffer.length} bytes`);

      // Write buffer to temp file
      const tempDir = path.join(__dirname, "../../../temp");
      await fs.mkdir(tempDir, { recursive: true });

      const tempFilePath = path.join(tempDir, fileName);
      console.log(`💾 Writing buffer to temp file: ${tempFilePath}`);
      await fs.writeFile(tempFilePath, buffer);

      // Upload to IPFS
      console.log(`🚀 Uploading temp file to IPFS...`);
      const result = await this.ipfs.uploadFile(tempFilePath, fileName, metadata);

      // Clean up temp file
      await fs
        .unlink(tempFilePath)
        .catch((err) => console.error("Temp file cleanup error:", err));

      console.log(`🧹 Temp file cleaned up`);
      return result;
    } catch (error) {
      console.error("❌ IPFS buffer upload error:", error.message);
      console.error("Stack:", error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Upload JSON data to IPFS with enhanced metadata
   * Used for storing complete entity data (users, products, orders, etc.)
   * @param {Object} jsonData - Complete data object
   * @param {String} fileName - File name for IPFS
   * @param {Object} additionalMetadata - Extra metadata to include
   * @returns {Object} {success, ipfsHash, ipfsUrl, pinSize, timestamp}
   */
  async uploadJSON(jsonData, fileName, additionalMetadata = {}) {
    try {
      // Enrich data with metadata if not already present
      const enrichedData = {
        ...jsonData,
        _ipfsMetadata: {
          uploadedAt: new Date().toISOString(),
          fileName: fileName,
          ...additionalMetadata,
          ...(jsonData._ipfsMetadata || {}),
        },
      };

      const result = await this.ipfs.uploadJSON(enrichedData, fileName);

      if (result.success) {
        console.log(
          `✅ JSON uploaded to IPFS: ${result.ipfsHash} (${fileName})`
        );
        return {
          success: true,
          ipfsHash: result.ipfsHash,
          ipfsUrl: result.ipfsUrl,
          pinSize: result.pinSize,
          timestamp: result.timestamp,
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("IPFS JSON upload error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Upload entity data to IPFS (users, products, orders, etc.)
   * Wrapper method with entity-specific handling
   */
  async uploadEntityData(entityType, entityData, entityId) {
    const fileName = `${entityType}-${entityId}-${Date.now()}.json`;
    const metadata = {
      entityType: entityType,
      entityId: entityId,
      version: "1.0",
    };

    return this.uploadJSON(entityData, fileName, metadata);
  }

  // Upload product certificate
  async uploadCertificate(buffer, productId, certificateType = "certificate") {
    const fileName = `certificate-${productId}-${certificateType}-${Date.now()}.pdf`;
    const metadata = {
      productId: productId,
      type: certificateType,
      uploadedAt: new Date().toISOString(),
    };

    return this.uploadBuffer(buffer, fileName, metadata);
  }

  // Retrieve file from IPFS
  async getFile(ipfsHash) {
    try {
      const result = await this.ipfs.getFile(ipfsHash);

      if (result.success) {
        return {
          success: true,
          data: result.data,
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("IPFS retrieval error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Unpin file from IPFS
  async unpinFile(ipfsHash) {
    try {
      const result = await this.ipfs.unpinFile(ipfsHash);

      if (result.success) {
        console.log(`✅ File unpinned from IPFS: ${ipfsHash}`);
        return { success: true };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("IPFS unpin error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Generate IPFS gateway URL
  getGatewayUrl(ipfsHash) {
    return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
  }

  // ========================================
  // BACKUP/RESTORE SPECIFIC METHODS
  // ========================================

  /**
   * Pin file to IPFS via Pinata
   * Used for backup files
   * @param {Buffer|string} data - File data (buffer or file path)
   * @param {string} filename - File name
   * @param {object} metadata - Additional metadata
   * @returns {object} {success, ipfsHash (CID), pinSize, timestamp, pinataId}
   */
  async pinFileToIPFS(data, filename, metadata = {}) {
    try {
      console.log(`📌 Pinning file to IPFS: ${filename}`);

      let result;
      if (Buffer.isBuffer(data)) {
        // Upload from buffer
        result = await this.uploadBuffer(data, filename, metadata);
      } else {
        // Upload from file path
        result = await this.uploadFile(data, metadata);
      }

      if (result.success) {
        console.log(`✅ File pinned successfully: ${result.ipfsHash}`);
        return {
          success: true,
          ipfsHash: result.ipfsHash, // CID
          pinSize: result.pinSize,
          timestamp: result.timestamp,
          pinataId: result.pinataId || result.ipfsHash, // Pinata uses CID as ID
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("❌ Pin file to IPFS error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Download file from IPFS
   * Used for backup restoration
   * @param {string} cid - IPFS CID
   * @returns {object} {success, data: Buffer}
   */
  async downloadFromIPFS(cid) {
    try {
      console.log(`📥 Downloading from IPFS: ${cid}`);

      const result = await this.getFile(cid);

      if (result.success) {
        console.log(`✅ Downloaded successfully from IPFS`);
        return {
          success: true,
          data: result.data,
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("❌ Download from IPFS error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get list of all pinned files from Pinata
   * @returns {object} {success, pins: Array}
   */
  async getPinList() {
    try {
      console.log("📋 Getting pin list from Pinata...");

      // This would require direct Pinata API access
      // For now, we'll return a placeholder
      // In production, implement using Pinata SDK's pinList method

      console.warn("⚠️ getPinList not yet implemented - requires Pinata SDK");

      return {
        success: true,
        pins: [],
        message: "Method not yet implemented",
      };
    } catch (error) {
      console.error("❌ Get pin list error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get storage usage statistics
   * @returns {object} {used: bytes, limit: bytes, percentage: number}
   */
  async getStorageUsage() {
    try {
      console.log("📊 Calculating storage usage...");

      // This would require direct Pinata API access
      // For now, return estimated values
      // In production, implement using Pinata SDK

      const PINATA_FREE_LIMIT = 1073741824; // 1 GB in bytes

      return {
        success: true,
        used: 0, // To be calculated from pin list
        limit: PINATA_FREE_LIMIT,
        percentage: 0,
        message: "Actual usage calculation not yet implemented",
      };
    } catch (error) {
      console.error("❌ Get storage usage error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Unpin file from Pinata (cleanup)
   * @param {string} pinataIdOrCid - Pinata pin ID or IPFS CID
   * @returns {object} {success: boolean}
   */
  async unpinFromPinata(pinataIdOrCid) {
    try {
      console.log(`🗑️ Unpinning from Pinata: ${pinataIdOrCid}`);

      const result = await this.unpinFile(pinataIdOrCid);

      if (result.success) {
        console.log(`✅ Unpinned successfully`);
        return { success: true };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("❌ Unpin from Pinata error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default new IPFSService();
