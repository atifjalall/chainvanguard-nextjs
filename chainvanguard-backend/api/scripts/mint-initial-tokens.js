#!/usr/bin/env node

// ========================================
// Mint 1 Million Tokens to All Users
// ========================================

import mongoose from "mongoose";
import User from "../src/models/User.js";
import fabricService from "../src/services/fabric.service.js";
import dotenv from "dotenv";

dotenv.config();

const INITIAL_TOKEN_AMOUNT = 1000000; // 1 Million CVT

async function mintTokensToAllUsers() {
  try {
    console.log("========================================");
    console.log("🪙 Minting Initial Tokens to All Users");
    console.log("========================================\n");

    // Connect to MongoDB
    const mongoUri =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/chainvanguard";
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB\n");

    // Connect to Fabric
    await fabricService.connect();
    console.log("✅ Connected to Fabric\n");

    // Get all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        console.log(`\n🔄 Processing user: ${user.name} (${user.walletAddress})`);

        // 1. Create token account if doesn't exist
        console.log("  📝 Checking token account...");
        try {
          await fabricService.createTokenAccount(
            user._id.toString(),
            user.walletAddress,
            0 // Start with 0, then mint
          );
          console.log("  ✅ Token account created");
        } catch (error) {
          if (
            error.message.includes("already exists") ||
            error.details?.[0]?.message?.includes("already exists")
          ) {
            console.log("  ℹ️ Token account already exists");
          } else {
            throw error;
          }
        }

        // 2. Check current balance
        const balanceResult = await fabricService.getTokenBalance(
          user._id.toString()
        );
        const currentBalance = balanceResult.balance || 0;
        console.log(`  💰 Current balance: ${currentBalance} CVT`);

        // 3. Skip minting if user already has tokens
        if (currentBalance >= INITIAL_TOKEN_AMOUNT) {
          console.log(`  ℹ️ User already has ${currentBalance} CVT, skipping mint`);
          successCount++;
          continue;
        }

        // 4. Mint tokens (only what's needed)
        const amountToMint = INITIAL_TOKEN_AMOUNT - currentBalance;
        console.log(`  🪙 Minting ${amountToMint} CVT...`);
        await fabricService.mintTokens(
          user._id.toString(),
          amountToMint,
          "Initial token distribution - Welcome bonus"
        );

        // 5. Verify new balance
        const newBalanceResult = await fabricService.getTokenBalance(
          user._id.toString()
        );
        const newBalance = newBalanceResult.balance || 0;
        console.log(`  ✅ New balance: ${newBalance} CVT`);

        successCount++;
      } catch (error) {
        console.error(`  ❌ Error for user ${user.name}:`, error.message);
        errorCount++;
      }
    }

    console.log("\n========================================");
    console.log("📊 Summary");
    console.log("========================================");
    console.log(`Total users: ${users.length}`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log("========================================\n");
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  } finally {
    await fabricService.disconnect();
    await mongoose.disconnect();
    console.log("👋 Disconnected from services");
    process.exit(0);
  }
}

// Run the script
mintTokensToAllUsers();
