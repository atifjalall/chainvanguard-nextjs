import FabricService from "../src/services/fabric.service.js";
import Product from "../src/models/Product.js";
import { connectMongoDB } from "../src/config/database.js";
import dotenv from "dotenv";

dotenv.config();

async function verifyBlockchain() {
  const fabricService = new FabricService();

  try {
    console.log("🔍 Blockchain Verification");
    console.log("==========================\n");

    // Connect to MongoDB
    await connectMongoDB();
    console.log("✅ MongoDB connected\n");

    // Get products from MongoDB
    const mongoProducts = await Product.find();
    console.log(`📊 Products in MongoDB: ${mongoProducts.length}\n`);

    if (mongoProducts.length === 0) {
      console.log("⚠️  No products found in MongoDB");
      console.log("   Create products first with the test script\n");
      process.exit(0);
    }

    // Show MongoDB products
    console.log("MongoDB Products:");
    mongoProducts.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name}`);
      console.log(`      ID: ${p._id}`);
      console.log(`      SKU: ${p.sku}`);
      console.log(
        `      Blockchain Verified: ${p.blockchainVerified || false}`
      );
      console.log(`      Blockchain TX: ${p.blockchainTxId || "N/A"}\n`);
    });

    // Try to connect to Fabric
    console.log("🔗 Connecting to Hyperledger Fabric...");
    try {
      await fabricService.connect();
      console.log("✅ Fabric connection successful\n");
    } catch (error) {
      console.error("❌ Fabric connection failed:");
      console.error(`   Error: ${error.message}\n`);
      console.log("Troubleshooting:");
      console.log(
        "   1. Check if network is running: docker ps | grep hyperledger"
      );
      console.log("   2. Check connection profile: ls connection-profiles/");
      console.log(
        "   3. Check chaincode deployment: docker logs peer0.org1.example.com\n"
      );
      process.exit(1);
    }

    // Get products from blockchain
    console.log("📦 Fetching products from blockchain...");
    try {
      const blockchainProducts = await fabricService.getAllProducts();
      console.log(`✅ Products on blockchain: ${blockchainProducts.length}\n`);

      if (blockchainProducts.length > 0) {
        console.log("Blockchain Products:");
        blockchainProducts.forEach((p, i) => {
          console.log(`   ${i + 1}. ${p.name}`);
          console.log(`      ID: ${p.id}`);
          console.log(`      SKU: ${p.sku}`);
          console.log(`      Price: $${p.price}`);
          console.log(`      Stock: ${p.quantity}\n`);
        });
      } else {
        console.log("⚠️  No products found on blockchain");
        console.log("\n   Products exist in MongoDB but not on blockchain!");
        console.log(
          "   This means blockchain recording failed during creation.\n"
        );
        console.log("To fix this, run:");
        console.log("   node scripts/sync_to_blockchain.js\n");
      }
    } catch (error) {
      console.error("❌ Error fetching from blockchain:");
      console.error(`   ${error.message}\n`);

      if (error.message.includes("chaincode")) {
        console.log("Possible Issues:");
        console.log("   1. Chaincode not deployed");
        console.log("   2. Wrong chaincode name");
        console.log("   3. Channel not joined\n");
        console.log("Deploy chaincode:");
        console.log("   cd ../network");
        console.log("   ./network.sh deployCC\n");
      }
    }

    // Summary
    console.log("=".repeat(50));
    console.log("📊 SUMMARY");
    console.log("=".repeat(50));
    console.log(`MongoDB Products:     ${mongoProducts.length}`);
    console.log(
      `Verified on Chain:    ${mongoProducts.filter((p) => p.blockchainVerified).length}`
    );
    console.log(
      `Not Verified:         ${mongoProducts.filter((p) => !p.blockchainVerified).length}`
    );
    console.log("");

    fabricService.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Verification error:", error);
    process.exit(1);
  }
}

verifyBlockchain();
