import axios from "axios";
import FormData from "form-data";
import fs from "fs";

class IPFSService {
  constructor() {
    this.pinataApiKey = process.env.PINATA_API_KEY;
    this.pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY;
    this.pinataJWT = process.env.PINATA_JWT;
    this.pinataBaseUrl = "https://api.pinata.cloud";
    this.gatewayUrl = "https://gateway.pinata.cloud/ipfs";
  }

  async testConnection() {
    try {
      const url = `${this.pinataBaseUrl}/data/testAuthentication`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${this.pinataJWT}`,
        },
      });

      console.log("✅ Pinata (IPFS) connected successfully");
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error("❌ Pinata connection error:", error.message);
      return { success: false, error: error.message };
    }
  }

  async uploadFile(filePath, fileName, metadata = {}) {
    try {
      const formData = new FormData();
      formData.append("file", fs.createReadStream(filePath));

      const pinataMetadata = JSON.stringify({
        name: fileName,
        keyvalues: metadata,
      });
      formData.append("pinataMetadata", pinataMetadata);

      const pinataOptions = JSON.stringify({
        cidVersion: 1,
      });
      formData.append("pinataOptions", pinataOptions);

      const url = `${this.pinataBaseUrl}/pinning/pinFileToIPFS`;
      const response = await axios.post(url, formData, {
        maxBodyLength: "Infinity",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
          Authorization: `Bearer ${this.pinataJWT}`,
        },
      });

      return {
        success: true,
        ipfsHash: response.data.IpfsHash,
        ipfsUrl: `${this.gatewayUrl}/${response.data.IpfsHash}`,
        pinSize: response.data.PinSize,
        timestamp: response.data.Timestamp,
      };
    } catch (error) {
      console.error("❌ IPFS upload error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async uploadJSON(jsonData, fileName) {
    try {
      const url = `${this.pinataBaseUrl}/pinning/pinJSONToIPFS`;
      const data = {
        pinataContent: jsonData,
        pinataMetadata: {
          name: fileName,
        },
        pinataOptions: {
          cidVersion: 1,
        },
      };

      const response = await axios.post(url, data, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.pinataJWT}`,
        },
      });

      return {
        success: true,
        ipfsHash: response.data.IpfsHash,
        ipfsUrl: `${this.gatewayUrl}/${response.data.IpfsHash}`,
        pinSize: response.data.PinSize,
        timestamp: response.data.Timestamp,
      };
    } catch (error) {
      console.error("❌ IPFS JSON upload error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getFile(ipfsHash) {
    try {
      const url = `${this.gatewayUrl}/${ipfsHash}`;
      const response = await axios.get(url);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("❌ IPFS retrieval error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async unpinFile(ipfsHash) {
    try {
      const url = `${this.pinataBaseUrl}/pinning/unpin/${ipfsHash}`;
      await axios.delete(url, {
        headers: {
          Authorization: `Bearer ${this.pinataJWT}`,
        },
      });

      return {
        success: true,
        message: "File unpinned successfully",
      };
    } catch (error) {
      console.error("❌ IPFS unpin error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default new IPFSService();
