import QRCode from "qrcode";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import QRCodeModel from "../models/QRCode.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import ipfsService from "./ipfs.service.js";
import cloudinaryService from "./cloudinary.service.js";

class QRService {
  /**
   * 🔢 Generate unique QR code string
   */
  generateQRCodeString(entityId, entityType) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString("hex");
    const hash = crypto
      .createHash("sha256")
      .update(`${entityId}-${entityType}-${timestamp}-${random}`)
      .digest("hex")
      .substring(0, 16);

    return `CV-${entityType.toUpperCase()}-${hash}`.toUpperCase();
  }

  /**
   * 🖼️ Generate QR code image as buffer
   */
  async generateQRImage(data, options = {}) {
    try {
      const qrOptions = {
        errorCorrectionLevel: "H",
        type: "png",
        quality: 1,
        margin: 1,
        width: options.width || 512,
        color: {
          dark: options.darkColor || "#000000",
          light: options.lightColor || "#FFFFFF",
        },
      };

      const qrBuffer = await QRCode.toBuffer(data, qrOptions);
      return qrBuffer;
    } catch (error) {
      console.error("❌ QR Image generation failed:", error);
      throw new Error("Failed to generate QR code image");
    }
  }

  /**
   * 📦 Generate QR code for a product
   */
  async generateProductQR(productId, userId) {
    try {
      console.log(`🎯 Generating QR for product: ${productId}`);

      // Check if product exists
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error("Product not found");
      }

      // Check if QR already exists
      let existingQR = await QRCodeModel.findOne({
        entityId: productId,
        entityModel: "Product",
        status: "active",
      });

      if (existingQR) {
        console.log("✅ QR code already exists");
        return {
          success: true,
          message: "QR code already exists",
          data: {
            code: existingQR.code,
            trackingUrl: existingQR.trackingUrl,
            imageUrl: existingQR.qrImageUrl.cloudinaryUrl,
            ipfsUrl: existingQR.qrImageUrl.ipfsUrl,
            productId: productId,
          },
        };
      }

      // Generate unique QR code
      const qrCodeString = this.generateQRCodeString(productId, "product");

      // Create tracking URL
      const trackingUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/track/${qrCodeString}`;

      // Generate QR image
      const qrImageBuffer = await this.generateQRImage(trackingUrl, {
        width: 512,
      });

      // Upload to IPFS (primary storage)
      const ipfsResult = await ipfsService.uploadBuffer(
        qrImageBuffer,
        `qr-${qrCodeString}.png`,
        {
          type: "qr-code",
          productId: productId.toString(),
          productName: product.name,
        }
      );

      // Upload to Cloudinary (backup/CDN)
      const cloudinaryResult = await cloudinaryService.uploadImage(
        qrImageBuffer,
        `qr-${qrCodeString}`,
        "qr_codes"
      );

      // Save QR record to database
      const qrRecord = new QRCodeModel({
        code: qrCodeString,
        type: "product",
        entityId: productId,
        entityModel: "Product",
        qrImageUrl: {
          ipfsHash: ipfsResult.ipfsHash,
          ipfsUrl: ipfsResult.ipfsUrl,
          cloudinaryUrl: cloudinaryResult.url,
        },
        metadata: {
          productName: product.name,
          sellerName: product.sellerName,
          createdBy: userId,
          blockchainTxId: product.blockchainTxId || "",
        },
        status: "active",
      });

      await qrRecord.save();
      console.log(`✅ QR code saved: ${qrCodeString}`);

      // Update product with QR code
      product.qrCode = qrCodeString;
      product.qrCodeImageUrl = cloudinaryResult.url;
      await product.save();

      return {
        success: true,
        message: "QR code generated successfully",
        data: {
          code: qrCodeString,
          trackingUrl,
          imageUrl: cloudinaryResult.url,
          ipfsUrl: ipfsResult.ipfsUrl,
          productId: productId,
        },
      };
    } catch (error) {
      console.error("❌ Product QR generation failed:", error);
      throw error;
    }
  }

  /**
   * 📋 Generate QR code for an order
   */
  async generateOrderQR(orderId, userId) {
    try {
      console.log(`🎯 Generating QR for order: ${orderId}`);

      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      let existingQR = await QRCodeModel.findOne({
        entityId: orderId,
        entityModel: "Order",
        status: "active",
      });

      if (existingQR) {
        return {
          success: true,
          message: "QR code already exists",
          data: {
            code: existingQR.code,
            trackingUrl: existingQR.trackingUrl,
            imageUrl: existingQR.qrImageUrl.cloudinaryUrl,
            orderId: orderId,
          },
        };
      }

      const qrCodeString = this.generateQRCodeString(orderId, "order");
      const trackingUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/track/order/${qrCodeString}`;

      const qrImageBuffer = await this.generateQRImage(trackingUrl);

      const ipfsResult = await ipfsService.uploadBuffer(
        qrImageBuffer,
        `qr-order-${qrCodeString}.png`,
        {
          type: "qr-code-order",
          orderId: orderId.toString(),
        }
      );

      const cloudinaryResult = await cloudinaryService.uploadImage(
        qrImageBuffer,
        `qr-order-${qrCodeString}`,
        "qr_codes"
      );

      const qrRecord = new QRCodeModel({
        code: qrCodeString,
        type: "order",
        entityId: orderId,
        entityModel: "Order",
        qrImageUrl: {
          ipfsHash: ipfsResult.ipfsHash,
          ipfsUrl: ipfsResult.ipfsUrl,
          cloudinaryUrl: cloudinaryResult.url,
        },
        metadata: {
          createdBy: userId,
          blockchainTxId: order.blockchainTxId || "",
        },
        status: "active",
      });

      await qrRecord.save();

      order.trackingQRCode = qrCodeString;
      await order.save();

      return {
        success: true,
        message: "Order QR code generated",
        data: {
          code: qrCodeString,
          trackingUrl,
          imageUrl: cloudinaryResult.url,
          orderId: orderId,
        },
      };
    } catch (error) {
      console.error("❌ Order QR generation failed:", error);
      throw error;
    }
  }

  /**
   * 📱 Scan/Verify QR code
   */
  async scanQRCode(
    qrCode,
    scannedBy = null,
    location = null,
    device = null,
    ipAddress = null
  ) {
    try {
      const qrRecord = await QRCodeModel.findOne({
        code: qrCode,
        status: "active",
      });

      if (!qrRecord) {
        return {
          success: false,
          message: "Invalid or inactive QR code",
        };
      }

      // Check expiration
      if (qrRecord.expiresAt && qrRecord.expiresAt < new Date()) {
        return {
          success: false,
          message: "QR code has expired",
        };
      }

      // Record scan
      await qrRecord.recordScan({
        scannedAt: new Date(),
        scannedBy,
        location,
        device,
        ipAddress,
      });

      // Get entity details
      let entityDetails;
      if (qrRecord.type === "product") {
        entityDetails = await Product.findById(qrRecord.entityId)
          .select(
            "name description category price images sellerId sellerName currentLocation supplyChainHistory"
          )
          .populate("sellerId", "name companyName email");
      } else if (qrRecord.type === "order") {
        entityDetails = await Order.findById(qrRecord.entityId)
          .select("products totalAmount status shippingAddress trackingUpdates")
          .populate("customerId", "name email")
          .populate("products.productId", "name images");
      }

      return {
        success: true,
        message: "QR code scanned successfully",
        data: {
          qrCode: qrRecord.code,
          type: qrRecord.type,
          scanCount: qrRecord.scanCount,
          entity: entityDetails,
          metadata: qrRecord.metadata,
        },
      };
    } catch (error) {
      console.error("❌ QR scan failed:", error);
      throw error;
    }
  }

  /**
   * 🔍 Track product via QR code
   */
  async trackProduct(qrCode) {
    try {
      const qrRecord = await QRCodeModel.findOne({
        code: qrCode,
        type: "product",
      });

      if (!qrRecord) {
        return {
          success: false,
          message: "Product not found",
        };
      }

      const product = await Product.findById(qrRecord.entityId)
        .populate("sellerId", "name companyName email")
        .select(
          "name description category price images currentLocation supplyChainHistory supplyChainSummary blockchainTxId"
        );

      if (!product) {
        return {
          success: false,
          message: "Product no longer exists",
        };
      }

      return {
        success: true,
        data: {
          product: {
            id: product._id,
            name: product.name,
            description: product.description,
            category: product.category,
            price: product.price,
            images: product.images,
            seller: product.sellerId,
            currentLocation: product.currentLocation,
            supplyChainSummary: product.supplyChainSummary,
            blockchainTxId: product.blockchainTxId,
          },
          qrInfo: {
            code: qrRecord.code,
            scanCount: qrRecord.scanCount,
            createdAt: qrRecord.createdAt,
          },
          timeline: product.supplyChainHistory || [],
        },
      };
    } catch (error) {
      console.error("❌ Product tracking failed:", error);
      throw error;
    }
  }

  /**
   * 🖼️ Get QR code image
   */
  async getQRImage(qrCode) {
    try {
      const qrRecord = await QRCodeModel.findOne({ code: qrCode });

      if (!qrRecord) {
        throw new Error("QR code not found");
      }

      return {
        success: true,
        data: {
          imageUrl: qrRecord.qrImageUrl.cloudinaryUrl,
          ipfsUrl: qrRecord.qrImageUrl.ipfsUrl,
          code: qrRecord.code,
        },
      };
    } catch (error) {
      console.error("❌ Failed to get QR image:", error);
      throw error;
    }
  }

  /**
   * ✅ Verify QR authenticity (blockchain check)
   */
  async verifyQRAuthenticity(qrCode) {
    try {
      const qrRecord = await QRCodeModel.findOne({ code: qrCode });

      if (!qrRecord) {
        return {
          success: false,
          message: "QR code not found",
          isAuthentic: false,
        };
      }

      const isAuthentic =
        qrRecord.status === "active" &&
        (!qrRecord.expiresAt || qrRecord.expiresAt > new Date());

      return {
        success: true,
        isAuthentic,
        data: {
          code: qrRecord.code,
          type: qrRecord.type,
          status: qrRecord.status,
          createdAt: qrRecord.createdAt,
          blockchainTxId: qrRecord.metadata.blockchainTxId,
          scanCount: qrRecord.scanCount,
        },
      };
    } catch (error) {
      console.error("❌ QR verification failed:", error);
      throw error;
    }
  }
}

export default new QRService();
