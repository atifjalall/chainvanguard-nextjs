import QRCode from "qrcode";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import QRCodeModel from "../models/QRCode.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Inventory from "../models/Inventory.js";
import VendorInventory from "../models/VendorInventory.js";
import VendorRequest from "../models/VendorRequest.js";
import BlockchainLog from "../models/BlockchainLog.js";
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

  /**
   * 📦 Generate QR code for inventory
   */
  async generateInventoryQR(inventoryId, userId) {
    try {
      console.log(`🎯 Generating QR for inventory: ${inventoryId}`);

      const inventory = await Inventory.findById(inventoryId);
      if (!inventory) {
        throw new Error("Inventory not found");
      }

      let existingQR = await QRCodeModel.findOne({
        entityId: inventoryId,
        entityModel: "Inventory",
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
            inventoryId: inventoryId,
          },
        };
      }

      const qrCodeString = this.generateQRCodeString(inventoryId, "inventory");
      const trackingUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/track/inventory/${qrCodeString}`;

      const qrImageBuffer = await this.generateQRImage(trackingUrl, {
        width: 512,
      });

      const ipfsResult = await ipfsService.uploadBuffer(
        qrImageBuffer,
        `qr-inventory-${qrCodeString}.png`,
        {
          type: "qr-code-inventory",
          inventoryId: inventoryId.toString(),
          inventoryName: inventory.name,
        }
      );

      const cloudinaryResult = await cloudinaryService.uploadImage(
        qrImageBuffer,
        `qr-inventory-${qrCodeString}`,
        "qr_codes"
      );

      const qrRecord = new QRCodeModel({
        code: qrCodeString,
        type: "inventory",
        entityId: inventoryId,
        entityModel: "Inventory",
        qrImageUrl: {
          ipfsHash: ipfsResult.ipfsHash,
          ipfsUrl: ipfsResult.ipfsUrl,
          cloudinaryUrl: cloudinaryResult.url,
        },
        metadata: {
          inventoryName: inventory.name,
          supplierName: inventory.supplierName,
          category: inventory.category,
          createdBy: userId,
          blockchainTxId: inventory.blockchainInventoryId || "",
        },
        status: "active",
      });

      await qrRecord.save();
      console.log(`✅ Inventory QR code saved: ${qrCodeString}`);

      inventory.qrCode = qrCodeString;
      inventory.qrCodeImageUrl = cloudinaryResult.url;
      inventory.qrCodeGenerated = true;
      inventory.qrMetadata = {
        generatedAt: new Date(),
        generatedBy: userId,
        ipfsHash: ipfsResult.ipfsHash,
        cloudinaryUrl: cloudinaryResult.url,
        trackingUrl: trackingUrl,
      };
      await inventory.save();

      return {
        success: true,
        message: "Inventory QR code generated successfully",
        data: {
          code: qrCodeString,
          trackingUrl,
          imageUrl: cloudinaryResult.url,
          ipfsUrl: ipfsResult.ipfsUrl,
          inventoryId: inventoryId,
        },
      };
    } catch (error) {
      console.error("❌ Inventory QR generation failed:", error);
      throw error;
    }
  }

  /**
   * 🔍 Enhanced tracking for inventory with full history
   */
  async trackInventory(qrCode) {
    try {
      const qrRecord = await QRCodeModel.findOne({
        code: qrCode,
        type: "inventory",
      });

      if (!qrRecord) {
        return {
          success: false,
          message: "Inventory not found",
        };
      }

      const inventory = await Inventory.findById(qrRecord.entityId)
        .populate("supplierId", "name email companyName walletAddress")
        .lean();

      if (!inventory) {
        return {
          success: false,
          message: "Inventory no longer exists",
        };
      }

      // Get all vendor purchases of this inventory
      const vendorPurchases = await VendorInventory.find({
        "inventoryItem.inventoryId": inventory._id,
      })
        .populate("vendorId", "name email companyName")
        .populate("supplier.supplierId", "name email companyName")
        .select("vendorId vendorName quantity cost dates movements usageHistory")
        .lean();

      // Get blockchain logs for this inventory
      const blockchainHistory = await BlockchainLog.find({
        entityId: inventory._id,
        entityType: "inventory",
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      // Calculate current ownership distribution
      const currentOwners = [
        {
          owner: inventory.supplierName,
          ownerId: inventory.supplierId,
          role: "supplier",
          quantity: inventory.quantity,
          unit: inventory.unit,
        },
      ];

      // Add vendors who have this inventory
      vendorPurchases.forEach((purchase) => {
        if (purchase.quantity.current > 0) {
          currentOwners.push({
            owner: purchase.vendorName,
            ownerId: purchase.vendorId,
            role: "vendor",
            quantity: purchase.quantity.current,
            unit: purchase.quantity.unit,
            received: purchase.quantity.received,
            used: purchase.quantity.used,
          });
        }
      });

      // Build transfer history
      const transfers = [];

      for (const purchase of vendorPurchases) {
        transfers.push({
          to: purchase.vendorName,
          toId: purchase.vendorId,
          from: purchase.supplier.supplierName,
          fromId: purchase.supplier.supplierId,
          quantity: purchase.quantity.received,
          unit: purchase.quantity.unit,
          date: purchase.dates.purchased,
          blockchainTx: purchase.blockchain?.txId || "",
          verified: purchase.blockchain?.verified || false,
        });

        // Add usage history as "virtual transfers" to products
        if (purchase.usageHistory && purchase.usageHistory.length > 0) {
          purchase.usageHistory.forEach((usage) => {
            transfers.push({
              type: "used_in_production",
              to: usage.productName || "Product",
              toId: usage.productId,
              from: purchase.vendorName,
              fromId: purchase.vendorId,
              quantity: usage.quantityUsed,
              unit: purchase.quantity.unit,
              date: usage.usedAt,
              notes: usage.notes,
            });
          });
        }
      }

      // Calculate available quantity (Current Quantity)
      const availableQuantity =
        inventory.quantity -
        (inventory.reservedQuantity || 0) -
        (inventory.committedQuantity || 0) -
        (inventory.damagedQuantity || 0);

      return {
        success: true,
        data: {
          inventory: {
            id: inventory._id,
            name: inventory.name,
            description: inventory.description,
            category: inventory.category,
            subcategory: inventory.subcategory,
            supplier: {
              id: inventory.supplierId,
              name: inventory.supplierName,
              walletAddress: inventory.supplierWalletAddress,
            },
            totalQuantity: inventory.quantity,
            currentQuantity: availableQuantity,
            reservedQuantity: inventory.reservedQuantity || 0,
            committedQuantity: inventory.committedQuantity || 0,
            damagedQuantity: inventory.damagedQuantity || 0,
            unit: inventory.unit,
            pricePerUnit: inventory.pricePerUnit,
            images: inventory.images,
            status: inventory.status,
            blockchainVerified: inventory.blockchainVerified,
            blockchainInventoryId: inventory.blockchainInventoryId,
          },
          transfers: transfers.sort((a, b) => new Date(b.date) - new Date(a.date)),
          currentOwners,
          blockchainHistory: blockchainHistory.map((log) => ({
            type: log.type,
            action: log.action,
            date: log.createdAt,
            performedBy: log.userDetails?.name || "System",
            txHash: log.txHash,
            status: log.status,
            data: log.data,
          })),
          qrInfo: {
            code: qrRecord.code,
            scanCount: qrRecord.scanCount,
            createdAt: qrRecord.createdAt,
          },
        },
      };
    } catch (error) {
      console.error("❌ Inventory tracking failed:", error);
      throw error;
    }
  }

  /**
   * 🔍 Enhanced product tracking with materials used
   */
  async trackProductEnhanced(qrCode) {
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
        .populate("sellerId", "name companyName email walletAddress")
        .populate({
          path: "materialsUsed.vendorInventoryId",
          select: "inventoryItem quantity supplier",
          populate: {
            path: "inventoryItem.inventoryId",
            select: "name qrCode qrCodeImageUrl category supplierName",
          },
        })
        .lean();

      if (!product) {
        return {
          success: false,
          message: "Product no longer exists",
        };
      }

      // Get blockchain history for this product
      const blockchainHistory = await BlockchainLog.find({
        entityId: product._id,
        entityType: "product",
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      // Get orders/sales history
      const Order = (await import("../models/Order.js")).default;
      const salesHistory = await Order.find({
        "items.productId": product._id,
        status: { $in: ["delivered", "completed", "shipped"] },
      })
        .select("orderNumber customerId customerName items totalAmount status createdAt")
        .limit(20)
        .lean();

      // Format materials used
      const materialsUsedFormatted = product.materialsUsed?.map((material) => {
        const vendorInv = material.vendorInventoryId;
        const inventory = vendorInv?.inventoryItem?.inventoryId;

        return {
          materialName: material.inventoryName || inventory?.name || "Unknown",
          supplier: material.supplierName || inventory?.supplierName || "Unknown",
          supplierId: material.supplierId,
          quantityUsed: material.quantityUsed,
          unit: material.unit,
          addedAt: material.addedAt,
          inventoryQRCode: material.inventoryQRCode || inventory?.qrCode,
          canScanInventoryQR: !!(material.inventoryQRCode || inventory?.qrCode),
        };
      }) || [];

      return {
        success: true,
        data: {
          product: {
            id: product._id,
            name: product.name,
            description: product.description,
            category: product.category,
            subcategory: product.subcategory,
            price: product.price,
            images: product.images,
            sku: product.sku,
            vendor: {
              id: product.sellerId,
              name: product.sellerName,
              companyName: product.sellerId?.companyName,
              walletAddress: product.sellerWalletAddress,
            },
            manufacturedDate: product.createdAt,
            status: product.status,
            totalSold: product.totalSold,
            blockchainVerified: product.blockchainVerified,
            blockchainProductId: product.blockchainProductId,
          },
          materialsUsed: materialsUsedFormatted,
          blockchainHistory: blockchainHistory.map((log) => ({
            event: log.type.replace("product_", ""),
            action: log.action,
            date: log.createdAt,
            performedBy: log.userDetails?.name || "System",
            txHash: log.txHash,
            status: log.status,
          })),
          salesHistory: salesHistory.map((order) => ({
            orderNumber: order.orderNumber,
            customer: order.customerName,
            quantity: order.items.find((item) => item.productId.toString() === product._id.toString())?.quantity || 1,
            amount: order.totalAmount,
            status: order.status,
            date: order.createdAt,
          })),
          authenticity: product.blockchainVerified ? "✅ Verified" : "⏳ Pending",
          qrInfo: {
            code: qrRecord.code,
            scanCount: qrRecord.scanCount,
            createdAt: qrRecord.createdAt,
          },
        },
      };
    } catch (error) {
      console.error("❌ Enhanced product tracking failed:", error);
      throw error;
    }
  }
}

export default new QRService();
