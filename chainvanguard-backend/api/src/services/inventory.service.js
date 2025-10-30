import mongoose from "mongoose";
import Inventory from "../models/Inventory.js";
import Notification from "../models/Notifications.js";
import User from "../models/User.js";
import FabricService from "./fabric.service.js";
import ipfsService from "./ipfs.service.js";
import cloudinaryService from "./cloudinary.service.js";
import qrService from "./qr.service.js";
import redisService from "./redis.service.js";
import logger from "../utils/logger.js";

// ========================================
// INVENTORY SERVICE
// ========================================
class InventoryService {
  constructor() {
    this.fabricService = new FabricService();
  }

  // ========================================
  // CREATE INVENTORY ITEM
  // ========================================
  async createInventoryItem(data, userId, files = {}) {
    try {
      logger.info("Creating new inventory item", { userId, name: data.name });

      // Validate supplier
      const supplier = await User.findById(userId);
      if (!supplier || supplier.role !== "supplier") {
        throw new Error("Only suppliers can create inventory items");
      }

      // Handle image uploads
      let imageUrls = [];
      if (files.images && files.images.length > 0) {
        imageUrls = await cloudinaryService.uploadMultiple(files.images, {
          folder: "inventory",
          resource_type: "image",
        });
      }

      // Handle document uploads
      let documents = [];
      if (files.documents && files.documents.length > 0) {
        documents = await cloudinaryService.uploadMultiple(files.documents, {
          folder: "inventory/documents",
          resource_type: "raw",
        });
      }

      // Prepare inventory data
      const inventoryData = {
        ...data,
        supplierId: userId,
        supplierName: supplier.name || supplier.email,
        images: imageUrls.map((url) => ({ url, isPrimary: false })),
        documents: documents.map((doc, index) => ({
          name: data.documentNames?.[index] || `Document ${index + 1}`,
          url: doc.url,
          type: data.documentTypes?.[index] || "specification",
        })),
      };

      // Set first image as primary
      if (inventoryData.images.length > 0) {
        inventoryData.images[0].isPrimary = true;
      }

      // Create inventory item
      const inventory = await Inventory.create(inventoryData);

      // Upload metadata to IPFS
      const ipfsMetadata = {
        name: inventory.name,
        description: inventory.description,
        category: inventory.category,
        subcategory: inventory.subcategory,
        supplier: inventory.supplierName,
        quantity: inventory.quantity,
        price: inventory.price,
        unit: inventory.unit,
        createdAt: inventory.createdAt,
      };

      // Generate fileName for IPFS upload
      const ipfsFileName = `inventory-metadata-${inventory._id.toString()}.json`;
      const ipfsResult = await ipfsService.uploadJSON(
        ipfsMetadata,
        ipfsFileName
      );

      // Handle IPFS result properly
      if (ipfsResult.success) {
        inventory.ipfsHash = ipfsResult.ipfsHash;
      } else {
        console.warn("⚠️  IPFS metadata upload failed:", ipfsResult.error);
        inventory.ipfsHash = ""; // Set empty string instead of error object
      }

      // Store on blockchain
      const blockchainData = {
        inventoryId: inventory._id.toString(),
        name: inventory.name,
        category: inventory.category,
        supplierId: userId,
        supplierName: supplier.name || supplier.email,
        quantity: inventory.quantity,
        price: inventory.price,
        ipfsHash: inventory.ipfsHash || "",
        timestamp: new Date().toISOString(),
      };

      // NEW:
      try {
        const blockchainResult = await this.fabricService.invoke(
          "inventory",
          "createInventoryItem",
          JSON.stringify(blockchainData)
        );

        // Handle both direct txId string or object with txId property
        if (typeof blockchainResult === "string") {
          inventory.blockchainTxId = blockchainResult;
        } else if (blockchainResult && blockchainResult.txId) {
          inventory.blockchainTxId = blockchainResult.txId;
        }

        await inventory.save();

        if (inventory._id) {
          // Generate QR in background - don't block response
          this.generateInventoryQR(inventory._id.toString(), userId)
            .then((qrResult) => {
              if (qrResult.success) {
                console.log(
                  `✅ QR code generated for inventory: ${inventory._id}`
                );
              }
            })
            .catch((error) => {
              console.error(
                `⚠️  QR generation failed for ${inventory._id}:`,
                error.message
              );
              // Don't fail - QR can be generated later via API
            });
        }

        logger.success("Inventory saved to blockchain", {
          txId: inventory.blockchainTxId,
        });
      } catch (blockchainError) {
        logger.warn(
          "⚠️ Blockchain storage failed, but inventory saved to database",
          {
            error: blockchainError.message,
            inventoryId: inventory._id,
          }
        );
      }

      // Create notification for supplier
      await this.createNotification({
        userId,
        userRole: "supplier",
        type: "stock_updated",
        category: "inventory",
        title: "Inventory Item Created",
        message: `New inventory item "${inventory.name}" has been created successfully.`,
        inventoryId: inventory._id,
        priority: "medium",
      });

      // Clear cache
      await redisService.del(`inventory:supplier:${userId}`);
      await redisService.del("inventory:all");

      logger.info("Inventory item created successfully", {
        inventoryId: inventory._id,
      });

      return inventory;
    } catch (error) {
      logger.error("Error creating inventory item:", error);
      throw error;
    }
  }

  // ========================================
  // GET ALL INVENTORY ITEMS (with filters)
  // ========================================
  async getAllInventory(filters = {}, options = {}) {
    try {
      const {
        supplierId,
        category,
        subcategory,
        status,
        minPrice,
        maxPrice,
        search,
        lowStock,
      } = filters;

      const {
        page = 1,
        limit = 20,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = options;

      // Build query
      const query = {};

      if (supplierId) query.supplierId = supplierId;
      if (category) query.category = category;
      if (subcategory) query.subcategory = subcategory;
      if (status) query.status = status;

      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
      }

      if (search) {
        query.$text = { $search: search };
      }

      if (lowStock === "true") {
        query.$expr = {
          $lte: [
            {
              $subtract: [
                "$quantity",
                { $add: ["$reservedQuantity", "$committedQuantity"] },
              ],
            },
            "$reorderLevel",
          ],
        };
      }

      // Check cache
      const cacheKey = `inventory:list:${JSON.stringify(query)}:${page}:${limit}`;
      const cached = await redisService.get(cacheKey);
      if (cached) {
        logger.info("Returning cached inventory list");
        return cached;
      }

      // Pagination
      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      // Execute query
      const [items, total] = await Promise.all([
        Inventory.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate("supplierId", "name email companyName")
          .lean(),
        Inventory.countDocuments(query),
      ]);

      const result = {
        items,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };

      // Cache for 5 minutes
      await redisService.set(cacheKey, result, 300);

      return result;
    } catch (error) {
      logger.error("Error fetching inventory:", error);
      throw error;
    }
  }

  // ========================================
  // GET INVENTORY BY ID
  // ========================================
  async getInventoryById(inventoryId) {
    try {
      // Check cache
      const cacheKey = `inventory:${inventoryId}`;
      const cached = await redisService.get(cacheKey);
      if (cached) return cached;

      const inventory = await Inventory.findById(inventoryId)
        .populate("supplierId", "name email companyName phone")
        .lean();

      if (!inventory) {
        throw new Error("Inventory item not found");
      }

      // Cache for 10 minutes
      await redisService.set(cacheKey, inventory, 600);

      return inventory;
    } catch (error) {
      logger.error("Error fetching inventory by ID:", error);
      throw error;
    }
  }

  // ========================================
  // UPDATE INVENTORY ITEM
  // ========================================
  async updateInventoryItem(inventoryId, userId, updates, files = {}) {
    try {
      logger.info("Updating inventory item", { inventoryId, userId });

      const inventory = await Inventory.findById(inventoryId);
      if (!inventory) {
        throw new Error("Inventory item not found");
      }

      // Check ownership
      if (inventory.supplierId.toString() !== userId) {
        throw new Error("Unauthorized to update this inventory item");
      }

      // Handle new image uploads
      if (files.images && files.images.length > 0) {
        const newImages = await cloudinaryService.uploadMultiple(files.images, {
          folder: "inventory",
          resource_type: "image",
        });
        inventory.images.push(
          ...newImages.map((url) => ({ url, isPrimary: false }))
        );
      }

      // Handle new document uploads
      if (files.documents && files.documents.length > 0) {
        const newDocuments = await cloudinaryService.uploadMultiple(
          files.documents,
          {
            folder: "inventory/documents",
            resource_type: "raw",
          }
        );
        inventory.documents.push(
          ...newDocuments.map((doc, index) => ({
            name:
              updates.documentNames?.[index] ||
              `Document ${inventory.documents.length + index + 1}`,
            url: doc.url,
            type: updates.documentTypes?.[index] || "specification",
          }))
        );
      }

      // Update fields
      Object.keys(updates).forEach((key) => {
        if (
          key !== "images" &&
          key !== "documents" &&
          key !== "documentNames" &&
          key !== "documentTypes"
        ) {
          inventory[key] = updates[key];
        }
      });

      // Track quantity changes
      if (updates.quantity !== undefined) {
        const quantityDiff = updates.quantity - inventory.quantity;
        inventory.addMovement("adjustment", quantityDiff, userId, "supplier", {
          reason: updates.adjustmentReason || "Manual adjustment",
        });
      }

      await inventory.save();

      // Update blockchain
      const blockchainData = {
        inventoryId: inventory._id.toString(),
        name: inventory.name,
        quantity: inventory.quantity,
        price: inventory.price,
        status: inventory.status,
        updatedAt: new Date().toISOString(),
      };

      await this.fabricService.invoke(
        "inventory",
        "updateInventoryItem",
        JSON.stringify(blockchainData)
      );

      // Clear cache
      await redisService.del(`inventory:${inventoryId}`);
      await redisService.del(`inventory:supplier:${userId}`);

      logger.info("Inventory item updated successfully", { inventoryId });

      return inventory;
    } catch (error) {
      logger.error("Error updating inventory:", error);
      throw error;
    }
  }

  // ========================================
  // DELETE INVENTORY ITEM
  // ========================================
  async deleteInventoryItem(inventoryId, userId) {
    try {
      const inventory = await Inventory.findById(inventoryId);
      if (!inventory) {
        throw new Error("Inventory item not found");
      }

      // Check ownership
      if (inventory.supplierId.toString() !== userId) {
        throw new Error("Unauthorized to delete this inventory item");
      }

      // Check if item is in use (has pending orders, etc.)
      if (inventory.reservedQuantity > 0 || inventory.committedQuantity > 0) {
        throw new Error(
          "Cannot delete inventory item with reserved or committed quantities"
        );
      }

      // Soft delete
      inventory.status = "discontinued";
      inventory.isActive = false;
      await inventory.save();

      // Update blockchain
      await this.fabricService.invoke(
        "inventory",
        "deleteInventoryItem",
        inventoryId
      );

      // Clear cache
      await redisService.del(`inventory:${inventoryId}`);
      await redisService.del(`inventory:supplier:${userId}`);

      logger.info("Inventory item deleted", { inventoryId });

      return { message: "Inventory item deleted successfully" };
    } catch (error) {
      logger.error("Error deleting inventory:", error);
      throw error;
    }
  }

  // ========================================
  // ADD STOCK (Restock)
  // ========================================
  async addStock(inventoryId, userId, quantity, notes = "", batchData = null) {
    try {
      logger.info("Adding stock", { inventoryId, quantity });

      const inventory = await Inventory.findById(inventoryId);
      if (!inventory) {
        throw new Error("Inventory item not found");
      }

      // Check ownership
      if (inventory.supplierId.toString() !== userId) {
        throw new Error("Unauthorized");
      }

      // Add batch if provided
      if (batchData) {
        inventory.batches.push({
          ...batchData,
          quantity,
          receivedDate: new Date(),
        });
      }

      // Update stock
      inventory.addStock(quantity, userId, "supplier", notes);
      await inventory.save();

      // Update blockchain
      await this.fabricService.invoke(
        "inventory",
        "addStock",
        inventoryId,
        quantity.toString(),
        notes
      );

      // Create notification
      await this.createNotification({
        userId,
        userRole: "supplier",
        type: "stock_updated",
        category: "inventory",
        title: "Stock Added",
        message: `${quantity} units added to "${inventory.name}". New stock: ${inventory.quantity}`,
        inventoryId: inventory._id,
        priority: "medium",
      });

      // Clear cache
      await redisService.del(`inventory:${inventoryId}`);
      await redisService.del(`inventory:supplier:${userId}`);

      return inventory;
    } catch (error) {
      logger.error("Error adding stock:", error);
      throw error;
    }
  }

  // ========================================
  // REDUCE STOCK (Sale/Usage)
  // ========================================
  async reduceStock(
    inventoryId,
    userId,
    quantity,
    reason = "sale",
    notes = ""
  ) {
    try {
      logger.info("Reducing stock", { inventoryId, quantity, reason });

      const inventory = await Inventory.findById(inventoryId);
      if (!inventory) {
        throw new Error("Inventory item not found");
      }

      // Check available stock
      if (inventory.availableQuantity < quantity) {
        throw new Error(
          `Insufficient stock. Available: ${inventory.availableQuantity}`
        );
      }

      // Reduce stock
      inventory.reduceStock(quantity, userId, "supplier", reason);
      await inventory.save();

      // Update blockchain
      await this.fabricService.invoke(
        "inventory",
        "reduceStock",
        inventoryId,
        quantity.toString(),
        reason
      );

      // Check if low stock alert needed
      if (inventory.needsReorder()) {
        await this.createLowStockAlert(inventory);
      }

      // Clear cache
      await redisService.del(`inventory:${inventoryId}`);

      return inventory;
    } catch (error) {
      logger.error("Error reducing stock:", error);
      throw error;
    }
  }

  // ========================================
  // SELL INVENTORY TO VENDOR
  // ========================================
  async sellToVendor(inventoryId, vendorId, quantity, price) {
    try {
      logger.info("Selling inventory to vendor", {
        inventoryId,
        vendorId,
        quantity,
      });

      const inventory = await Inventory.findById(inventoryId);
      if (!inventory) {
        throw new Error("Inventory item not found");
      }

      const vendor = await User.findById(vendorId);
      if (!vendor || vendor.role !== "vendor") {
        throw new Error("Invalid vendor");
      }

      // Check stock
      if (inventory.availableQuantity < quantity) {
        throw new Error("Insufficient stock");
      }

      // Reduce inventory stock
      inventory.reduceStock(quantity, inventory.supplierId, "supplier", "sale");

      // Add to vendor sales tracking
      if (!inventory.vendorSales) inventory.vendorSales = [];
      inventory.vendorSales.push({
        vendorId,
        vendorName: vendor.name || vendor.email,
        quantity,
        pricePerUnit: price,
        totalAmount: quantity * price,
        saleDate: new Date(),
      });

      await inventory.save();

      // Create blockchain transaction
      const txData = {
        inventoryId: inventory._id.toString(),
        fromId: inventory.supplierId.toString(),
        fromRole: "supplier",
        toId: vendorId,
        toRole: "vendor",
        quantity,
        price,
        totalAmount: quantity * price,
        timestamp: new Date().toISOString(),
      };

      await this.fabricService.invoke(
        "inventory",
        "transferInventory",
        JSON.stringify(txData)
      );

      // Notify vendor
      await this.createNotification({
        userId: vendorId,
        userRole: "vendor",
        type: "stock_updated",
        category: "inventory",
        title: "Inventory Purchased",
        message: `You have purchased ${quantity} units of "${inventory.name}" from supplier.`,
        inventoryId: inventory._id,
        priority: "high",
      });

      // Notify supplier
      await this.createNotification({
        userId: inventory.supplierId,
        userRole: "supplier",
        type: "stock_updated",
        category: "inventory",
        title: "Inventory Sold",
        message: `${quantity} units of "${inventory.name}" sold to ${vendor.name || vendor.email}.`,
        inventoryId: inventory._id,
        priority: "medium",
      });

      // Clear cache
      await redisService.del(`inventory:${inventoryId}`);

      return {
        inventory,
        transaction: txData,
        message: "Inventory sold successfully",
      };
    } catch (error) {
      logger.error("Error selling inventory:", error);
      throw error;
    }
  }

  // ========================================
  // GET LOW STOCK ITEMS
  // ========================================
  async getLowStockItems(supplierId = null) {
    try {
      const items = await Inventory.getLowStockItems(supplierId);
      return items;
    } catch (error) {
      logger.error("Error fetching low stock items:", error);
      throw error;
    }
  }

  // ========================================
  // CREATE LOW STOCK ALERT
  // ========================================
  async createLowStockAlert(inventory) {
    try {
      // Create reorder alert in inventory
      const alert = inventory.createReorderAlert();
      await inventory.save();

      // Create notification for supplier
      await this.createNotification({
        userId: inventory.supplierId,
        userRole: "supplier",
        type: "low_stock",
        category: "inventory",
        title: "Low Stock Alert",
        message: `"${inventory.name}" is running low. Current stock: ${inventory.availableQuantity}, Reorder level: ${inventory.reorderLevel}`,
        inventoryId: inventory._id,
        priority: "high",
        isUrgent: true,
        actionType: "check_inventory",
        actionUrl: `/inventory/${inventory._id}`,
      });

      logger.info("Low stock alert created", { inventoryId: inventory._id });
    } catch (error) {
      logger.error("Error creating low stock alert:", error);
      throw error;
    }
  }

  // ========================================
  // ADD QUALITY CHECK
  // ========================================
  async addQualityCheck(inventoryId, userId, checkData) {
    try {
      const inventory = await Inventory.findById(inventoryId);
      if (!inventory) {
        throw new Error("Inventory item not found");
      }

      const user = await User.findById(userId);
      const qualityCheck = {
        ...checkData,
        inspector: userId,
        inspectorName: user.name || user.email,
        inspectionDate: new Date(),
      };

      await inventory.addQualityCheck(qualityCheck);

      // If quality check failed, create alert
      if (checkData.status === "failed") {
        await this.createNotification({
          userId: inventory.supplierId,
          userRole: "supplier",
          type: "quality_issue_detected",
          category: "inventory",
          title: "Quality Check Failed",
          message: `Quality check failed for "${inventory.name}". ${checkData.rejectedQuantity} units rejected.`,
          inventoryId: inventory._id,
          priority: "high",
        });
      }

      // Clear cache
      await redisService.del(`inventory:${inventoryId}`);

      return inventory;
    } catch (error) {
      logger.error("Error adding quality check:", error);
      throw error;
    }
  }

  // ========================================
  // GET INVENTORY ANALYTICS
  // ========================================
  async getInventoryAnalytics(supplierId) {
    try {
      const cacheKey = `inventory:analytics:${supplierId}`;
      const cached = await redisService.get(cacheKey);
      if (cached) return cached;

      const [totalValue, itemCount, lowStockCount, movements] =
        await Promise.all([
          Inventory.getTotalValueBySupplier(supplierId),
          Inventory.countDocuments({ supplierId }),
          Inventory.getLowStockItems(supplierId).then((items) => items.length),
          Inventory.aggregate([
            { $match: { supplierId: supplierId } },
            { $unwind: "$movements" },
            {
              $group: {
                _id: "$movements.type",
                count: { $sum: 1 },
                totalQuantity: { $sum: "$movements.quantity" },
              },
            },
          ]),
        ]);

      const analytics = {
        totalValue: totalValue.totalValue,
        totalItems: itemCount,
        lowStockItems: lowStockCount,
        movements: movements.reduce((acc, m) => {
          acc[m._id] = {
            count: m.count,
            totalQuantity: m.totalQuantity,
          };
          return acc;
        }, {}),
      };

      // Cache for 15 minutes
      await redisService.set(cacheKey, analytics, 900);

      return analytics;
    } catch (error) {
      logger.error("Error fetching inventory analytics:", error);
      throw error;
    }
  }

  // ========================================
  // GET INVENTORY HISTORY FROM BLOCKCHAIN
  // ========================================
  async getInventoryHistory(inventoryId) {
    try {
      const history = await this.fabricService.evaluate(
        "inventory",
        "getInventoryHistory",
        inventoryId
      );

      // Handle empty or invalid responses
      if (!history) {
        return [];
      }

      // If already an array/object, return it
      if (typeof history === "object") {
        return Array.isArray(history) ? history : [history];
      }

      // If string, check if empty and parse
      if (typeof history === "string") {
        if (history.trim() === "" || history.trim() === "[]") {
          return [];
        }
        return JSON.parse(history);
      }

      return [];
    } catch (error) {
      logger.error("Error fetching inventory history:", error);

      // If item not found on blockchain, return empty array
      if (error.message && error.message.includes("not found")) {
        return [];
      }

      throw error;
    }
  }

  // ========================================
  // CREATE NOTIFICATION (Helper)
  // ========================================
  async createNotification(notificationData) {
    try {
      const notification = await Notification.create(notificationData);
      return notification;
    } catch (error) {
      logger.error("Error creating notification:", error);
      // Don't throw - notification failure shouldn't break main operation
    }
  }

  // ========================================
  // SEARCH INVENTORY
  // ========================================
  async searchInventory(searchTerm, filters = {}) {
    try {
      const query = {
        $text: { $search: searchTerm },
        ...filters,
      };

      const items = await Inventory.find(query)
        .select("name description category subcategory price quantity images")
        .limit(20)
        .lean();

      return items;
    } catch (error) {
      logger.error("Error searching inventory:", error);
      throw error;
    }
  }

  // ========================================
  // FIX 1: RESERVE QUANTITY (around line 350)
  // ========================================
  async reserveQuantity(inventoryId, quantity, orderId, userId) {
    try {
      const inventory = await Inventory.findById(inventoryId);

      if (!inventory) {
        throw new Error("Inventory item not found");
      }

      // Validate quantity
      if (quantity <= 0) {
        throw new Error("Quantity must be positive");
      }

      const availableQuantity = inventory.quantity - inventory.reservedQuantity;

      if (availableQuantity < quantity) {
        throw new Error(
          `Insufficient available quantity. Available: ${availableQuantity}, Requested: ${quantity}`
        );
      }

      // Reserve the quantity
      inventory.reservedQuantity += quantity;

      // ✅ FIXED: Properly create movement with required fields
      const movement = {
        type: "reservation",
        quantity: -quantity, // Negative because it's reserved
        previousQuantity: inventory.quantity,
        newQuantity: inventory.quantity, // Total quantity doesn't change, just reserved
        reason: `Reserved for order`,
        performedBy: userId || inventory.supplierId, // ✅ Use actual user ID
        performedByRole: "system", // ✅ Now valid after schema fix
        relatedOrderId: mongoose.Types.ObjectId.isValid(orderId)
          ? new mongoose.Types.ObjectId(orderId)
          : null, // ✅ Convert to ObjectId or null
        timestamp: new Date(),
        notes: `Reserved ${quantity} units for order`,
      };

      inventory.movements.push(movement);
      await inventory.save();

      // Clear cache
      await redisService.del(`inventory:${inventoryId}`);
      await redisService.del(`inventory:list:*`);

      logger.info("Quantity reserved successfully", {
        inventoryId,
        quantity,
        orderId,
      });

      return inventory;
    } catch (error) {
      logger.error("Error reserving quantity:", error);
      throw error;
    }
  }

  // ========================================
  // FIX 2: RELEASE RESERVED QUANTITY (around line 400)
  // ========================================
  async releaseReservedQuantity(inventoryId, quantity, orderId, userId) {
    try {
      const inventory = await Inventory.findById(inventoryId);

      if (!inventory) {
        throw new Error("Inventory item not found");
      }

      // Validate quantity
      if (quantity <= 0) {
        throw new Error("Quantity must be positive");
      }

      if (inventory.reservedQuantity < quantity) {
        throw new Error(
          `Cannot release more than reserved. Reserved: ${inventory.reservedQuantity}, Requested: ${quantity}`
        );
      }

      // Release the quantity
      inventory.reservedQuantity -= quantity;

      // ✅ FIXED: Properly create movement with required fields
      const movement = {
        type: "release",
        quantity: quantity, // Positive because it's being released
        previousQuantity: inventory.quantity,
        newQuantity: inventory.quantity, // Total quantity doesn't change
        reason: `Released from reservation`,
        performedBy: userId || inventory.supplierId, // ✅ Use actual user ID
        performedByRole: "system", // ✅ Now valid after schema fix
        relatedOrderId: mongoose.Types.ObjectId.isValid(orderId)
          ? new mongoose.Types.ObjectId(orderId)
          : null, // ✅ Convert to ObjectId or null
        timestamp: new Date(),
        notes: `Released ${quantity} units from reservation`,
      };

      inventory.movements.push(movement);
      await inventory.save();

      // Clear cache
      await redisService.del(`inventory:${inventoryId}`);
      await redisService.del(`inventory:list:*`);

      logger.info("Reserved quantity released successfully", {
        inventoryId,
        quantity,
        orderId,
      });

      return inventory;
    } catch (error) {
      logger.error("Error releasing quantity:", error);
      throw error;
    }
  }

  async generateInventoryQR(inventoryId, userId) {
    try {
      console.log(`🎯 Generating QR for inventory: ${inventoryId}`);

      // Check if inventory exists
      const inventory = await Inventory.findById(inventoryId);
      if (!inventory) {
        throw new Error("Inventory item not found");
      }

      // Check if QR already exists
      if (inventory.qrCode && inventory.qrCodeGenerated) {
        console.log("✅ QR code already exists");
        return {
          success: true,
          message: "QR code already exists",
          data: {
            code: inventory.qrCode,
            imageUrl: inventory.qrCodeImageUrl,
          },
        };
      }

      // Generate unique QR code string
      const qrCodeString = qrService.generateQRCodeString(
        inventoryId,
        "inventory"
      );

      // Create tracking URL
      const trackingUrl = `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/track/inventory/${qrCodeString}`;

      // Generate QR image
      const qrImageBuffer = await qrService.generateQRImage(trackingUrl, {
        width: 512,
      });

      let ipfsResult = null;
      let cloudinaryResult = null;

      // Try IPFS upload (non-critical - can fail)
      try {
        ipfsResult = await ipfsService.uploadBuffer(
          qrImageBuffer,
          `qr-inventory-${qrCodeString}.png`,
          {
            type: "qr-code-inventory",
            inventoryId: inventoryId.toString(),
            inventoryName: inventory.name,
            supplierId: inventory.supplierId.toString(),
          }
        );
        console.log("✅ IPFS upload successful");
      } catch (ipfsError) {
        console.warn(
          "⚠️  IPFS upload failed (non-critical):",
          ipfsError.message
        );
        // Continue without IPFS - Cloudinary is enough
        ipfsResult = {
          success: false,
          ipfsHash: "",
          ipfsUrl: "",
        };
      }

      // Try Cloudinary upload (critical - must succeed)
      try {
        cloudinaryResult = await cloudinaryService.uploadImage(
          qrImageBuffer,
          `qr-inventory-${qrCodeString}`,
          "qr_codes/inventory"
        );
        console.log("✅ Cloudinary upload successful");
      } catch (cloudinaryError) {
        console.error("❌ Cloudinary upload failed:", cloudinaryError.message);
        throw new Error("Failed to store QR code image");
      }

      // Save QR record to QRCode collection
      const QRCodeModel = (await import("../models/QRCode.js")).default;

      const qrRecord = new QRCodeModel({
        code: qrCodeString,
        type: "inventory",
        entityId: inventoryId,
        entityModel: "Inventory",
        qrImageUrl: {
          ipfsHash: ipfsResult.ipfsHash || "",
          ipfsUrl: ipfsResult.ipfsUrl || "",
          cloudinaryUrl: cloudinaryResult.url,
        },
        metadata: {
          inventoryName: inventory.name,
          supplierName: inventory.supplierName,
          category: inventory.category,
          createdBy: userId,
          blockchainTxId: inventory.blockchainTxId || "",
        },
        status: "active",
      });

      await qrRecord.save();

      // Update inventory with QR code
      inventory.qrCode = qrCodeString;
      inventory.qrCodeImageUrl = cloudinaryResult.url;
      inventory.qrCodeGenerated = true;
      inventory.qrMetadata = {
        generatedAt: new Date(),
        generatedBy: userId,
        ipfsHash: ipfsResult.ipfsHash || "",
        cloudinaryUrl: cloudinaryResult.url,
        trackingUrl: trackingUrl,
      };

      await inventory.save();

      console.log(`✅ QR code generated successfully: ${qrCodeString}`);

      return {
        success: true,
        message: "QR code generated successfully",
        data: {
          code: qrCodeString,
          trackingUrl,
          imageUrl: cloudinaryResult.url,
          ipfsUrl: ipfsResult.ipfsUrl || "",
          inventoryId: inventoryId,
        },
      };
    } catch (error) {
      console.error("❌ Inventory QR generation failed:", error);
      throw error;
    }
  }

  /**
   * Scan inventory QR code
   */
  async scanInventoryQR(qrCode, scanData) {
    try {
      const { scannedBy, location, device, ipAddress, purpose, notes } =
        scanData;

      // Find inventory by QR code
      const inventory = await Inventory.findOne({ qrCode })
        .populate("supplierId", "name companyName email walletAddress")
        .populate("scanHistory.scannedBy", "name email role");

      if (!inventory) {
        throw new Error("Inventory not found for this QR code");
      }

      // Record scan
      inventory.scanHistory.push({
        scannedAt: new Date(),
        scannedBy: scannedBy || null,
        scannerRole: scanData.scannerRole || "guest",
        location,
        purpose: purpose || "tracking",
        device,
        ipAddress,
        notes,
      });

      inventory.totalScans += 1;
      inventory.lastScannedAt = new Date();
      inventory.lastScannedBy = scannedBy || null;

      await inventory.save();

      // Log to blockchain (optional - don't block on failure)
      try {
        await this.fabricService.invoke(
          "inventory",
          "recordInventoryScan",
          JSON.stringify({
            inventoryId: inventory._id.toString(),
            qrCode,
            scannedAt: new Date().toISOString(),
            scannedBy: scannedBy?.toString() || "guest",
            location,
            purpose,
          })
        );
      } catch (bcError) {
        console.warn(
          "⚠️  Blockchain logging failed (non-critical):",
          bcError.message
        );
      }

      return {
        success: true,
        message: "QR code scanned successfully",
        data: {
          inventory: {
            id: inventory._id,
            name: inventory.name,
            category: inventory.category,
            quantity: inventory.quantity,
            supplier: inventory.supplierId,
            qualityScore: inventory.qualityChecks?.[0]?.qualityScore || null,
            certifications: inventory.certifications,
            batches: inventory.batches,
          },
          scanInfo: {
            scanCount: inventory.totalScans,
            lastScanned: inventory.lastScannedAt,
            trackingUrl: inventory.qrMetadata?.trackingUrl,
          },
        },
      };
    } catch (error) {
      console.error("❌ Inventory QR scan failed:", error);
      throw error;
    }
  }

  /**
   * Get inventory tracking info via QR
   */
  async trackInventoryByQR(qrCode) {
    try {
      const inventory = await Inventory.findOne({ qrCode })
        .populate("supplierId", "name companyName email")
        .populate("scanHistory.scannedBy", "name role")
        .select(
          "name category quantity batches movements qualityChecks certifications supplierId createdAt qrMetadata totalScans"
        );

      if (!inventory) {
        return {
          success: false,
          message: "Inventory not found",
        };
      }

      // Get blockchain history (optional - don't fail if unavailable)
      let blockchainHistory = [];
      try {
        const bcHistory = await this.fabricService.query(
          "inventory",
          "getInventoryHistory",
          inventory._id.toString()
        );
        blockchainHistory = JSON.parse(bcHistory);
      } catch (error) {
        console.warn("Could not fetch blockchain history:", error.message);
      }

      return {
        success: true,
        data: {
          inventory: {
            id: inventory._id,
            name: inventory.name,
            category: inventory.category,
            currentQuantity: inventory.quantity,
            supplier: inventory.supplierId,
            createdAt: inventory.createdAt,
            totalScans: inventory.totalScans,
            qrCode: inventory.qrCode,
            qrImageUrl: inventory.qrCodeImageUrl,
          },
          batches: inventory.batches.map((b) => ({
            batchNumber: b.batchNumber,
            quantity: b.quantity,
            manufactureDate: b.manufactureDate,
            expiryDate: b.expiryDate,
            status: b.status,
          })),
          qualityChecks: inventory.qualityChecks.map((qc) => ({
            inspectionDate: qc.inspectionDate,
            status: qc.status,
            qualityScore: qc.qualityScore,
            findings: qc.findings,
          })),
          movements: inventory.movements.slice(-10).map((m) => ({
            type: m.type,
            quantity: m.quantity,
            timestamp: m.timestamp,
            performedByRole: m.performedByRole,
          })),
          certifications: inventory.certifications,
          scanHistory: inventory.scanHistory.slice(-5).map((s) => ({
            scannedAt: s.scannedAt,
            location: s.location,
            purpose: s.purpose,
          })),
          blockchainHistory: blockchainHistory.slice(-10),
        },
      };
    } catch (error) {
      console.error("❌ Track inventory failed:", error);
      throw error;
    }
  }
}

export default new InventoryService();
