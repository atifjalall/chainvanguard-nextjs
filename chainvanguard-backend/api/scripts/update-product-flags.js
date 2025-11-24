/**
 * Script to update product flags (isFeatured, isNewArrival) in MongoDB
 * Run this from the chainvanguard-backend/api directory:
 * node scripts/update-product-flags.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

// Product Schema (simplified)
const productSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model("Product", productSchema);

async function updateProductFlags() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Get all active products
    const allProducts = await Product.find({ status: "active" }).sort({
      createdAt: -1,
    });

    console.log(`\n📦 Found ${allProducts.length} active products`);

    if (allProducts.length === 0) {
      console.log(
        "❌ No active products found. Please create some products first."
      );
      process.exit(0);
    }

    // Mark first 10 products as featured
    const featuredCount = Math.min(10, allProducts.length);
    console.log(`\n⭐ Marking first ${featuredCount} products as featured...`);

    for (let i = 0; i < featuredCount; i++) {
      await Product.findByIdAndUpdate(allProducts[i]._id, {
        isFeatured: true,
      });
      console.log(`  ✓ ${i + 1}. ${allProducts[i].name}`);
    }

    // Mark first 5 products as new arrivals (most recent)
    const newArrivalCount = Math.min(5, allProducts.length);
    console.log(
      `\n🆕 Marking first ${newArrivalCount} products as new arrivals...`
    );

    for (let i = 0; i < newArrivalCount; i++) {
      await Product.findByIdAndUpdate(allProducts[i]._id, {
        isNewArrival: true,
      });
      console.log(`  ✓ ${i + 1}. ${allProducts[i].name}`);
    }

    console.log("\n✅ Product flags updated successfully!");

    // Show summary
    const featuredProducts = await Product.countDocuments({
      status: "active",
      isFeatured: true,
    });
    const newArrivalProducts = await Product.countDocuments({
      status: "active",
      isNewArrival: true,
    });

    console.log("\n📊 Summary:");
    console.log(`  - Featured Products: ${featuredProducts}`);
    console.log(`  - New Arrivals: ${newArrivalProducts}`);
    console.log(`  - Total Active Products: ${allProducts.length}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error updating product flags:", error);
    process.exit(1);
  }
}

updateProductFlags();
