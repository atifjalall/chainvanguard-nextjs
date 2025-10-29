import mongoose from "mongoose";
import Inventory from "../models/Inventory.js";
import Notification from "../models/Notifications.js";
import User from "../models/User.js";
import FabricService from "./fabric.service.js";
import ipfsService from "./ipfs.service.js";
import cloudinaryService from "./cloudinary.service.js";
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

      const ipfsHash = await ipfsService.uploadJSON(ipfsMetadata);
      inventory.ipfsHash = ipfsHash;

      // Store on blockchain
      const blockchainData = {
        inventoryId: inventory._id.toString(),
        name: inventory.name,
        category: inventory.category,
        supplierId: userId,
        supplierName: supplier.name || supplier.email,
        quantity: inventory.quantity,
        price: inventory.price,
        ipfsHash,
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
}

export default new InventoryService();
