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
      // Write buffer to temp file
      const tempDir = path.join(__dirname, "../../../temp");
      await fs.mkdir(tempDir, { recursive: true });

      const tempFilePath = path.join(tempDir, fileName);
      await fs.writeFile(tempFilePath, buffer);

      // Upload to IPFS
      const result = await this.uploadFile(tempFilePath, metadata);

      // Clean up temp file
      await fs
        .unlink(tempFilePath)
        .catch((err) => console.error("Temp file cleanup error:", err));

      return result;
    } catch (error) {
      console.error("IPFS buffer upload error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Upload JSON data to IPFS
  async uploadJSON(jsonData, fileName) {
    try {
      const result = await this.ipfs.uploadJSON(jsonData, fileName);

      if (result.success) {
        console.log(`✅ JSON uploaded to IPFS: ${result.ipfsHash}`);
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
}

export default new IPFSService();
