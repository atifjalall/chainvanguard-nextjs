import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

class CloudinaryService {
  constructor() {
    this.folder = process.env.CLOUDINARY_FOLDER || "chainvanguard";
  }

  // Upload image from buffer
  async uploadImage(buffer, folder = "products") {
    return new Promise((resolve, reject) => {
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
            });
          }
        }
      );

      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  }

  // Upload multiple images
  async uploadMultipleImages(files, folder = "products") {
    try {
      const uploadPromises = files.map((file) =>
        this.uploadImage(file.buffer, folder)
      );
      return await Promise.all(uploadPromises);
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
