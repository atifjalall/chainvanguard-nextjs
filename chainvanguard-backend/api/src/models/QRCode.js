import mongoose from "mongoose";

const QRCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["product", "order", "batch", "inventory"],
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "entityModel",
    },
    entityModel: {
      type: String,
      required: true,
      enum: ["Product", "Order", "Inventory"],
    },
    qrImageUrl: {
      ipfsHash: String,
      ipfsUrl: String,
      cloudinaryUrl: String,
    },
    scanHistory: [
      {
        scannedAt: { type: Date, default: Date.now },
        scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        location: {
          latitude: Number,
          longitude: Number,
          address: String,
        },
        device: String,
        ipAddress: String,
      },
    ],
    metadata: {
      productName: String,
      inventoryName: String, // ✅ Added for inventory
      supplierName: String, // ✅ Added for inventory
      category: String, // ✅ Added for inventory
      sellerName: String,
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      blockchainTxId: String,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "expired"],
      default: "active",
    },
    expiresAt: Date,
    scanCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
QRCodeSchema.index({ code: 1, type: 1 });
QRCodeSchema.index({ entityId: 1, entityModel: 1 });
QRCodeSchema.index({ "metadata.blockchainTxId": 1 });
QRCodeSchema.index({ status: 1, expiresAt: 1 });

// Virtual for tracking URL
QRCodeSchema.virtual("trackingUrl").get(function () {
  return `${process.env.FRONTEND_URL || "http://localhost:3001"}/track/${this.code}`;
});

// Method to increment scan count
QRCodeSchema.methods.recordScan = async function (scanData) {
  this.scanHistory.push(scanData);
  this.scanCount += 1;
  return this.save();
};

export default mongoose.model("QRCode", QRCodeSchema);
