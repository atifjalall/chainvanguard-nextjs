import { connectMongoDB, redisClient } from "../src/config/database.js";
import { testCloudinaryConnection } from "../src/config/cloudinary.js";
import ipfsService from "../src/config/ipfs.js";

async function testAllServices() {
  console.log("\n🧪 Testing all services...\n");
  console.log("=".repeat(60));

  let passedTests = 0;
  let totalTests = 4;

  // Test MongoDB
  console.log("\n1️⃣  Testing MongoDB...");
  try {
    await connectMongoDB();
    console.log("✅ MongoDB: PASSED");
    passedTests++;
  } catch (error) {
    console.error("❌ MongoDB: FAILED -", error.message);
  }

  // Test Redis
  console.log("\n2️⃣  Testing Redis...");
  try {
    const pong = await redisClient.ping();
    if (pong === "PONG") {
      console.log("✅ Redis: PASSED");
      passedTests++;
    } else {
      console.error("❌ Redis: FAILED - Invalid response");
    }
  } catch (error) {
    console.error("❌ Redis: FAILED -", error.message);
  }

  // Test Cloudinary
  console.log("\n3️⃣  Testing Cloudinary...");
  try {
    const result = await testCloudinaryConnection();
    if (result) {
      console.log("✅ Cloudinary: PASSED");
      passedTests++;
    } else {
      console.error("❌ Cloudinary: FAILED");
    }
  } catch (error) {
    console.error("❌ Cloudinary: FAILED -", error.message);
  }

  // Test IPFS
  console.log("\n4️⃣  Testing IPFS/Pinata...");
  try {
    const result = await ipfsService.testConnection();
    if (result.success) {
      console.log("✅ IPFS: PASSED");
      passedTests++;
    } else {
      console.error("❌ IPFS: FAILED -", result.error);
    }
  } catch (error) {
    console.error("❌ IPFS: FAILED -", error.message);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log(
    `\n📊 Test Results: ${passedTests}/${totalTests} services passed`
  );

  if (passedTests === totalTests) {
    console.log("🎉 All services are operational!\n");
  } else {
    console.log(
      `⚠️  ${totalTests - passedTests} service(s) failed. Check logs above.\n`
    );
  }

  process.exit(passedTests === totalTests ? 0 : 1);
}

testAllServices();
