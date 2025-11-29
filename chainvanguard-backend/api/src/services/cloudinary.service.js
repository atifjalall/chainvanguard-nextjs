import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import crypto from "crypto";

class CloudinaryService {
  constructor() {
    this.folder = process.env.CLOUDINARY_FOLDER || "chainvanguard";
  }

  /**
   * Generate SHA-256 hash for image buffer
   * This hash is stored on blockchain/IPFS for image integrity verification
   * @param {Buffer} buffer - Image buffer
   * @returns {String} SHA-256 hash
   */
  generateImageHash(buffer) {
    return crypto.createHash("sha256").update(buffer).digest("hex");
  }

  /**
   * Upload image from buffer with SHA-256 hash generation
   * Returns both Cloudinary URL and image hash for blockchain storage
   * @param {Buffer} buffer - Image buffer
   * @param {String} folder - Cloudinary folder
   * @returns {Object} {url, publicId, width, height, format, imageHash}
   */
  async uploadImage(buffer, folder = "products") {
    return new Promise((resolve, reject) => {
      // Generate SHA-256 hash BEFORE upload for blockchain/IPFS
      const imageHash = this.generateImageHash(buffer);

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `${this.folder}/${folder}`,
          resource_type: "auto",
          transformation: [
            { width: 1200, height: 1200, crop: "limit" },
            { quality: "auto:good" },
            { fetch_format: "auto" },
          ],
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
              format: result.format,
              imageHash: imageHash, // ✅ SHA-256 hash for blockchain/IPFS
            });
          }
        }
      );

      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  }

  /**
   * Upload multiple images with hash generation
   * Returns array of {url, publicId, width, height, format, imageHash}
   * @param {Array} files - Array of file objects with buffer property
   * @param {String} folder - Cloudinary folder
   * @returns {Array} Array of upload results with image hashes
   */
  async uploadMultipleImages(files, folder = "products") {
    try {
      const uploadPromises = files.map((file) =>
        this.uploadImage(file.buffer, folder)
      );
      const results = await Promise.all(uploadPromises);

      console.log(
        `✅ Uploaded ${results.length} images with SHA-256 hashes for blockchain`
      );

      return results; // Each result contains imageHash
    } catch (error) {
      console.error("Multiple upload error:", error);
      throw error;
    }
  }

  // Upload PDF/Document
  async uploadDocument(buffer, fileName, folder = "documents") {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `${this.folder}/${folder}`,
          resource_type: "raw",
          public_id: fileName,
          use_filename: true,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              format: result.format,
              bytes: result.bytes,
            });
          }
        }
      );

      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  }

  // Delete image
  async deleteImage(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === "ok";
    } catch (error) {
      console.error("Delete image error:", error);
      return false;
    }
  }

  // Delete multiple images
  async deleteMultipleImages(publicIds) {
    try {
      const deletePromises = publicIds.map((id) => this.deleteImage(id));
      return await Promise.all(deletePromises);
    } catch (error) {
      console.error("Multiple delete error:", error);
      return false;
    }
  }
}

export default new CloudinaryService();
