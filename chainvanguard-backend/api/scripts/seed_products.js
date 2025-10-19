import dotenv from "dotenv";
import { connectMongoDB } from "../src/config/database.js";
import Product from "../src/models/Product.js";
import User from "../src/models/User.js";
import mongoose from "mongoose";

dotenv.config();

// Sample products data
const sampleProducts = [
  {
    name: "Organic Cotton T-Shirt - White",
    description:
      "Premium 100% organic cotton t-shirt with a modern fit. Perfect for everyday wear. Soft, breathable, and eco-friendly.",
    category: "Men",
    subcategory: "T-Shirts",
    productType: "Casual",
    brand: "EcoWear",
    price: 29.99,
    currency: "USD",
    costPrice: 12.5,
    wholesalePrice: 20.0,
    quantity: 500,
    minStockLevel: 50,
    apparelDetails: {
      size: "M",
      color: "White",
      material: "100% Organic Cotton",
      fit: "Regular Fit",
      pattern: "Solid",
      fabricType: "Jersey Knit",
      fabricWeight: "180 GSM",
      neckline: "Crew Neck",
      sleeveLength: "Short Sleeve",
      careInstructions: "Machine wash cold, tumble dry low, do not bleach",
      washingTemperature: "30°C",
      ironingInstructions: "Low heat",
      dryCleanOnly: false,
      measurements: {
        chest: 102,
        length: 71,
        shoulder: 46,
        unit: "cm",
      },
    },
    manufacturingDetails: {
      manufacturerName: "GreenTextiles Ltd",
      batchNumber: "BATCH-2024-Q4-001",
      productionCountry: "India",
      productionFacility: "Factory A, Tirupur",
    },
    sustainability: {
      isOrganic: true,
      isFairTrade: true,
      isRecycled: false,
    },
    tags: ["organic", "cotton", "eco-friendly", "sustainable", "fair-trade"],
    season: "All Season",
    isFeatured: true,
    isPublished: true,
    status: "active",
  },
  {
    name: "Classic Denim Jeans - Blue",
    description:
      "High-quality denim jeans with a comfortable fit. Durable and stylish for everyday wear.",
    category: "Men",
    subcategory: "Jeans",
    productType: "Casual",
    brand: "DenimCo",
    price: 59.99,
    currency: "USD",
    quantity: 300,
    minStockLevel: 30,
    apparelDetails: {
      size: "L",
      color: "Blue",
      material: "98% Cotton, 2% Elastane",
      fit: "Slim Fit",
      pattern: "Solid",
      careInstructions: "Machine wash warm, tumble dry medium",
    },
    tags: ["denim", "jeans", "casual", "blue"],
    season: "All Season",
    status: "active",
    isPublished: true,
  },
  {
    name: "Premium Wool Sweater - Gray",
    description:
      "Luxurious merino wool sweater for cold weather. Soft and warm.",
    category: "Men",
    subcategory: "Sweaters",
    productType: "Casual",
    brand: "WoolCraft",
    price: 79.99,
    currency: "USD",
    quantity: 150,
    apparelDetails: {
      size: "L",
      color: "Gray",
      material: "100% Merino Wool",
      fit: "Regular Fit",
      pattern: "Solid",
      neckline: "Crew Neck",
      sleeveLength: "Long Sleeve",
    },
    tags: ["wool", "sweater", "winter", "warm"],
    season: "Winter",
    status: "active",
    isPublished: true,
  },
  {
    name: "Cotton Polo Shirt - Navy",
    description: "Classic cotton polo shirt with modern fit.",
    category: "Men",
    subcategory: "Shirts",
    productType: "Casual",
    brand: "PoloMaster",
    price: 39.99,
    currency: "USD",
    quantity: 200,
    apparelDetails: {
      size: "M",
      color: "Navy",
      material: "100% Cotton",
      fit: "Slim Fit",
      pattern: "Solid",
      neckline: "Collar",
      sleeveLength: "Short Sleeve",
    },
    tags: ["polo", "casual", "cotton"],
    season: "Summer",
    status: "active",
    isPublished: true,
  },
  {
    name: "Floral Summer Dress - Pink",
    description: "Light and breezy summer dress with floral pattern.",
    category: "Women",
    subcategory: "Dresses",
    productType: "Casual",
    brand: "FloraFashion",
    price: 49.99,
    currency: "USD",
    quantity: 180,
    apparelDetails: {
      size: "M",
      color: "Pink",
      material: "100% Cotton",
      fit: "Regular Fit",
      pattern: "Printed",
      sleeveLength: "Sleeveless",
    },
    tags: ["dress", "summer", "floral", "women"],
    season: "Summer",
    status: "active",
    isPublished: true,
    isFeatured: true,
  },
  {
    name: "Sports Hoodie - Black",
    description: "Comfortable hoodie perfect for workouts and casual wear.",
    category: "Unisex",
    subcategory: "Hoodies",
    productType: "Sports",
    brand: "ActiveWear",
    price: 44.99,
    currency: "USD",
    quantity: 250,
    apparelDetails: {
      size: "L",
      color: "Black",
      material: "80% Cotton, 20% Polyester",
      fit: "Regular Fit",
      pattern: "Solid",
    },
    tags: ["hoodie", "sports", "activewear", "unisex"],
    season: "All Season",
    status: "active",
    isPublished: true,
  },
  {
    name: "Kids T-Shirt - Multicolor",
    description: "Fun and colorful t-shirt for kids. Soft and comfortable.",
    category: "Kids",
    subcategory: "T-Shirts",
    productType: "Casual",
    brand: "KidStyle",
    price: 19.99,
    currency: "USD",
    quantity: 400,
    apparelDetails: {
      size: "8",
      color: "Multicolor",
      material: "100% Cotton",
      fit: "Regular Fit",
      pattern: "Printed",
      sleeveLength: "Short Sleeve",
    },
    tags: ["kids", "colorful", "fun", "cotton"],
    season: "All Season",
    status: "active",
    isPublished: true,
  },
  {
    name: "Business Formal Shirt - White",
    description: "Professional dress shirt for business occasions.",
    category: "Men",
    subcategory: "Shirts",
    productType: "Formal",
    brand: "ExecutiveWear",
    price: 54.99,
    currency: "USD",
    quantity: 120,
    apparelDetails: {
      size: "L",
      color: "White",
      material: "Cotton Blend",
      fit: "Slim Fit",
      pattern: "Solid",
      neckline: "Collar",
      sleeveLength: "Long Sleeve",
    },
    tags: ["formal", "business", "shirt", "white"],
    season: "All Season",
    status: "active",
    isPublished: true,
  },
];

// Seed function
async function seedProducts() {
  try {
    console.log("🌱 Starting product seeding...\n");

    // Connect to MongoDB
    await connectMongoDB();

    // Find a supplier user
    const supplier = await User.findOne({ role: "supplier" });

    if (!supplier) {
      console.error("❌ No supplier found in database!");
      console.log("\nPlease run auth tests first to create test users:");
      console.log("  ./scripts/test_auth_complete.sh\n");
      process.exit(1);
    }

    console.log(`✅ Found supplier: ${supplier.name} (${supplier.email})`);
    console.log(`   Wallet: ${supplier.walletAddress}\n`);

    // Clear existing products (optional)
    const existingCount = await Product.countDocuments();
    if (existingCount > 0) {
      console.log(`🗑️  Found ${existingCount} existing products`);
      console.log("   Clearing old products...");
      await Product.deleteMany({});
      console.log("   ✅ Cleared\n");
    }

    // Create products
    console.log(`📦 Creating ${sampleProducts.length} sample products...\n`);

    for (let i = 0; i < sampleProducts.length; i++) {
      const productData = sampleProducts[i];

      const product = new Product({
        ...productData,
        sellerId: supplier._id,
        sellerName: supplier.name,
        sellerWalletAddress: supplier.walletAddress,
        sellerRole: supplier.role,
      });

      await product.save();

      console.log(
        `   ${i + 1}. ✅ ${product.name} (${product.category} → ${product.subcategory})`
      );
      console.log(`      SKU: ${product.sku}`);
      console.log(`      Price: $${product.price}`);
      console.log(`      Stock: ${product.quantity} units\n`);
    }

    // Summary
    const totalProducts = await Product.countDocuments();
    const categories = await Product.distinct("category");

    console.log("=".repeat(70));
    console.log("✅ Product Seeding Complete!");
    console.log("=".repeat(70));
    console.log(`\n📊 Summary:`);
    console.log(`   Total Products: ${totalProducts}`);
    console.log(`   Categories: ${categories.join(", ")}`);
    console.log(`   Seller: ${supplier.name}\n`);

    console.log("🎉 Database is ready for testing!\n");
    console.log("Run tests with:");
    console.log("  ./scripts/test_products_complete.sh\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
}

// Run seeder
seedProducts();
