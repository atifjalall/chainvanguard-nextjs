import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Fix inconsistent cart counts in database
 * Run this script to fix carts where totalItems doesn't match items.length
 */
async function fixCartCounts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find all active carts
    const carts = await Cart.find({ status: "active" });
    console.log(`📊 Found ${carts.length} active carts`);

    let fixedCount = 0;

    for (const cart of carts) {
      const actualItemCount = cart.items.length;
      const actualQuantity = cart.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      const actualSubtotal = cart.items.reduce(
        (sum, item) => sum + item.subtotal,
        0
      );

      // Check if counts are inconsistent
      if (
        cart.totalItems !== actualItemCount ||
        cart.totalQuantity !== actualQuantity ||
        cart.subtotal !== actualSubtotal
      ) {
        console.log(`🔧 Fixing cart ${cart._id}:`);
        console.log(`   - totalItems: ${cart.totalItems} → ${actualItemCount}`);
        console.log(
          `   - totalQuantity: ${cart.totalQuantity} → ${actualQuantity}`
        );
        console.log(`   - subtotal: ${cart.subtotal} → ${actualSubtotal}`);

        // Update cart
        cart.totalItems = actualItemCount;
        cart.totalQuantity = actualQuantity;
        cart.subtotal = actualSubtotal;

        // Recalculate unique sellers
        const uniqueSellers = new Set(
          cart.items.map((item) => item.sellerId.toString())
        );
        cart.totalSellers = uniqueSellers.size;

        await cart.save();
        fixedCount++;
      }
    }

    console.log(`✅ Fixed ${fixedCount} carts`);
    console.log("✅ Database cleanup complete");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error fixing cart counts:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
fixCartCounts();
