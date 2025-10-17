import dotenv from "dotenv";
dotenv.config(); // ensure env vars are loaded here also

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

console.log("🔍 Cloudinary config after load:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: !!process.env.CLOUDINARY_API_KEY,
  api_secret: !!process.env.CLOUDINARY_API_SECRET,
});

// Test function
export const testCloudinaryConnection = async () => {
  try {
    // Use an uploader or a resource list, rather than ping
    const result = await cloudinary.api.resources({ max_results: 1 });
    console.log("☁️ Cloudinary connection verified", result);
    return true;
  } catch (error) {
    console.error("❌ Cloudinary connection error:", error.message);
    return false;
  }
};

export default cloudinary;
