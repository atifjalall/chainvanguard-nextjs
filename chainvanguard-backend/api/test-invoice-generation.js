import mongoose from "mongoose";
import dotenv from "dotenv";
import invoiceService from "./src/services/invoice.service.js";
import VendorRequest from "./src/models/VendorRequest.js";
import User from "./src/models/User.js";

dotenv.config();

async function testInvoiceGeneration() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Find a recent vendor request with payment
    console.log("🔍 Finding a paid vendor request...");
    const vendorRequest = await VendorRequest.findOne({
      paidAt: { $exists: true, $ne: null }
    })
      .sort({ paidAt: -1 })
      .populate("vendorId")
      .populate("supplierId");

    if (!vendorRequest) {
      console.log("❌ No paid vendor requests found. Please create and pay for a vendor request first.");
      process.exit(1);
    }

    console.log("✅ Found vendor request:", {
      requestNumber: vendorRequest.requestNumber,
      total: vendorRequest.total,
      vendor: vendorRequest.vendorId?.name || "N/A",
      supplier: vendorRequest.supplierId?.name || "N/A",
      paidAt: vendorRequest.paidAt
    });

    console.log("\n🧾 Generating invoice...\n");

    const invoice = await invoiceService.generateVendorRequestInvoice(
      vendorRequest,
      vendorRequest.vendorId,
      vendorRequest.supplierId
    );

    console.log("\n✅ Invoice generated successfully!");
    console.log({
      invoiceNumber: invoice.invoiceNumber,
      type: invoice.type,
      total: invoice.total,
      ipfsHash: invoice.ipfsHash || "NONE",
      ipfsUrl: invoice.ipfsUrl || "NONE",
      mongoId: invoice._id
    });

    if (invoice.ipfsHash) {
      console.log("\n🎉 SUCCESS! Invoice PDF uploaded to IPFS/Pinata");
      console.log(`View on IPFS: ${invoice.ipfsUrl}`);
    } else {
      console.log("\n⚠️ Invoice created in MongoDB but NOT uploaded to IPFS");
      console.log("Check the logs above for IPFS upload errors");
    }

  } catch (error) {
    console.error("\n❌ Error during test:", error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 MongoDB connection closed");
  }
}

testInvoiceGeneration();
