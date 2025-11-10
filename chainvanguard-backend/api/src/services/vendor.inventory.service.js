import VendorInventory from "../models/VendorInventory.js";
import Order from "../models/Order.js";
import VendorRequest from "../models/VendorRequest.js";
import Inventory from "../models/Inventory.js";
import User from "../models/User.js";
import fabricService from "./fabric.service.js";
import notificationService from "./notification.service.js";
import logger from "../utils/logger.js";

class VendorInventoryService {
  // ========================================
  // AUTO-CREATE INVENTORY FROM DELIVERED ORDER
  // ========================================
  async createFromDeliveredOrder(orderId, vendorId) {
    try {
      logger.info(`Creating vendor inventory from delivered order ${orderId}`);

      // Get order details
      const order = await Order.findById(orderId)
        .populate("sellerId", "name email companyName contactPhone")
        .populate("items.productId");

      if (!order) {
        throw new Error("Order not found");
      }

      // Verify order is delivered and vendor is the buyer
      if (order.customerId.toString() !== vendorId.toString()) {
        throw new Error("Order does not belong to this vendor");
      }

      if (!["delivered", "completed"].includes(order.status)) {
        throw new Error("Order must be delivered before creating inventory");
      }

      // Check if inventory already created for this order
      const existingInventory = await VendorInventory.findOne({ orderId });
      if (existingInventory) {
        logger.warn(`Inventory already exists for order ${orderId}`);
        return { alreadyExists: true, inventory: existingInventory };
      }

      // Get vendor request if exists
      const vendorRequest = await VendorRequest.findOne({
        orderId: orderId,
      });

      // Get vendor details
      const vendor = await User.findById(vendorId);

      // Create inventory records for each item
      const inventoryRecords = [];

      for (const item of order.items) {
        // For vendor request orders, productId actually contains the inventory ID
        const inventoryIdToLookup =
          item.productId?._id || item.productId || item.inventoryId;

        if (!inventoryIdToLookup) {
          logger.warn(`No inventory ID found for item in order ${orderId}`);
          continue;
        }

        const inventoryItem = await Inventory.findById(inventoryIdToLookup);

        if (!inventoryItem) {
          logger.warn(
            `Inventory item not found for ID: ${inventoryIdToLookup}`
          );
          continue;
        }

        const inventoryRecord = new VendorInventory({
          vendorId: vendorId,
          vendorName: vendor.name || vendor.companyName || "Vendor",
          vendorRequestId: vendorRequest?._id,
          orderId: order._id,
          supplier: {
            supplierId: order.sellerId._id,
            supplierName:
              order.sellerId.companyName || order.sellerId.name || "Supplier",
            contactEmail: order.sellerId.email || "",
            contactPhone: order.sellerId.contactPhone || "",
          },
          inventoryItem: {
            inventoryId: inventoryItem._id,
            name: inventoryItem.name,
            sku: inventoryItem.sku || "",
            category: inventoryItem.category,
            subcategory: inventoryItem.subcategory || "",
            description: inventoryItem.description || "",
            images: inventoryItem.images || [],
            specifications: inventoryItem.specifications || {},
          },
          quantity: {
            received: item.quantity,
            used: 0,
            current: item.quantity,
            reserved: 0,
            damaged: 0,
            unit: inventoryItem.unit || "units",
          },
          cost: {
            perUnit: item.price,
            totalCost: item.subtotal,
            currency: order.currency || "PKR",
          },
          dates: {
            purchased: vendorRequest?.createdAt || order.createdAt,
            approved: vendorRequest?.approvedAt,
            received: order.deliveredAt || order.updatedAt,
          },
          location: {
            warehouse: "Main Warehouse",
            section: "",
            bin: "",
          },
          reorderLevel: Math.floor(item.quantity * 0.2), // 20% of initial quantity
          reorderQuantity: item.quantity, // Suggest reordering the same amount
          status: "active",
          blockchain: {
            txId: "",
            verified: false,
          },
        });

        // Add initial movement record
        inventoryRecord.movements.push({
          type: "received",
          quantity: item.quantity,
          previousQuantity: 0,
          newQuantity: item.quantity,
          performedBy: vendorId,
          performedByRole: "vendor",
          relatedOrderId: order._id,
          reason: `Received from ${order.sellerId.companyName || order.sellerId.name}`,
          notes: `Order ${order.orderNumber}`,
          timestamp: new Date(),
        });

        await inventoryRecord.save();
        inventoryRecords.push(inventoryRecord);

        logger.info(
          `Created vendor inventory record: ${inventoryRecord._id} for ${inventoryItem.name}`
        );
      }

      // Record on blockchain
      // TODO: Implement fabricService.recordInventoryMovement function
      /*
      try {
        for (const record of inventoryRecords) {
          const txId = await fabricService.recordInventoryMovement({
            inventoryId: record._id.toString(),
            vendorId: vendorId.toString(),
            supplierId: record.supplier.supplierId.toString(),
            orderId: orderId.toString(),
            itemName: record.inventoryItem.name,
            quantity: record.quantity.received,
            movementType: "received",
            timestamp: new Date().toISOString(),
            notes: `Received from order ${order.orderNumber}`,
          });

          if (txId) {
            record.blockchain.txId = txId;
            record.blockchain.verified = true;
            record.blockchain.lastVerified = new Date();
            await record.save();
          }
        }
      } catch (blockchainError) {
        logger.error("Blockchain recording failed:", blockchainError);
        // Continue even if blockchain fails
      }
      */

      // Send notification to vendor
      await notificationService.createNotification({
        userId: vendorId,
        userRole: "vendor",
        type: "stock_updated",
        category: "inventory",
        title: "Raw Materials Received",
        message: `${inventoryRecords.length} items have been added to your inventory from order ${order.orderNumber}`,
        priority: "high",
        relatedEntity: {
          entityType: "order",
          entityId: orderId,
        },
      });

      return {
        success: true,
        count: inventoryRecords.length,
        inventory: inventoryRecords,
      };
    } catch (error) {
      logger.error("Error creating vendor inventory from order:", error);
      throw error;
    }
  }

  // ========================================
  // GET VENDOR'S INVENTORY
  // ========================================
  async getVendorInventory(vendorId, filters = {}, options = {}) {
    try {
      const { supplierId, category, status, lowStock, search } = filters;

      const {
        page = 1,
        limit = 20,
        sortBy = "dates.received",
        sortOrder = "desc",
      } = options;

      const query = { vendorId };

      // Apply filters
      if (supplierId) query["supplier.supplierId"] = supplierId;
      if (category) query["inventoryItem.category"] = category;
      if (status) query.status = status;
      if (lowStock === "true" || lowStock === true) {
        query.$expr = {
          $and: [
            { $gt: ["$reorderLevel", 0] },
            { $lte: ["$quantity.current", "$reorderLevel"] },
          ],
        };
      }
      if (search) {
        query.$or = [
          { "inventoryItem.name": { $regex: search, $options: "i" } },
          { "inventoryItem.sku": { $regex: search, $options: "i" } },
          { notes: { $regex: search, $options: "i" } },
        ];
      }

      // Count total
      const total = await VendorInventory.countDocuments(query);

      // Get inventory
      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

      const inventory = await VendorInventory.find(query)
        .populate("supplier.supplierId", "name email companyName contactPhone")
        .populate("orderId", "orderNumber totalAmount createdAt")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();

      return {
        inventory,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error("Error getting vendor inventory:", error);
      throw error;
    }
  }

  // ========================================
  // GET INVENTORY BY ID
  // ========================================
  async getInventoryById(inventoryId, vendorId) {
    try {
      const inventory = await VendorInventory.findOne({
        _id: inventoryId,
        vendorId: vendorId,
      })
        .populate("supplier.supplierId", "name email companyName contactPhone")
        .populate("orderId", "orderNumber totalAmount createdAt status")
        .populate("vendorRequestId", "requestNumber status")
        .populate("usageHistory.productId", "name sku")
        .lean();

      if (!inventory) {
        throw new Error("Inventory not found");
      }

      return inventory;
    } catch (error) {
      logger.error("Error getting inventory by ID:", error);
      throw error;
    }
  }

  // ========================================
  // GET INVENTORY STATS
  // ========================================
  async getInventoryStats(vendorId) {
    try {
      const stats = await VendorInventory.getInventoryStats(vendorId);

      // Get category breakdown
      const categoryBreakdown =
        await VendorInventory.getValueByCategory(vendorId);

      // Get top suppliers
      const topSuppliers = await VendorInventory.getTopSuppliers(vendorId, 5);

      // Get recent additions
      const recentAdditions = await VendorInventory.find({ vendorId })
        .sort({ "dates.received": -1 })
        .limit(5)
        .select("inventoryItem.name quantity.received dates.received")
        .lean();

      return {
        summary: stats,
        categoryBreakdown,
        topSuppliers,
        recentAdditions,
      };
    } catch (error) {
      logger.error("Error getting inventory stats:", error);
      throw error;
    }
  }

  // ========================================
  // GET LOW STOCK ALERTS
  // ========================================
  async getLowStockAlerts(vendorId) {
    try {
      const lowStockItems = await VendorInventory.getLowStockItems(vendorId);

      // Calculate reorder suggestions
      const suggestions = lowStockItems.map((item) => ({
        ...item,
        suggestedReorderQuantity:
          item.reorderQuantity || item.quantity.received,
        daysUntilDepleted: this.calculateDaysUntilDepleted(item),
      }));

      return suggestions;
    } catch (error) {
      logger.error("Error getting low stock alerts:", error);
      throw error;
    }
  }

  // Calculate days until depleted based on usage
  calculateDaysUntilDepleted(inventory) {
    if (!inventory.dates.lastUsed || inventory.quantity.used === 0) {
      return null;
    }

    const daysSinceReceived =
      (new Date() - new Date(inventory.dates.received)) / (1000 * 60 * 60 * 24);
    const dailyUsageRate = inventory.quantity.used / daysSinceReceived;

    if (dailyUsageRate === 0) return null;

    return Math.floor(inventory.quantity.current / dailyUsageRate);
  }

  // ========================================
  // ADJUST STOCK
  // ========================================
  async adjustStock(inventoryId, vendorId, adjustmentData) {
    try {
      const { quantityChange, reason, notes } = adjustmentData;

      const inventory = await VendorInventory.findOne({
        _id: inventoryId,
        vendorId: vendorId,
      });

      if (!inventory) {
        throw new Error("Inventory not found");
      }

      await inventory.adjustStock(quantityChange, reason, vendorId, notes);

      // Record on blockchain
      try {
        const txId = await fabricService.recordInventoryMovement({
          inventoryId: inventoryId.toString(),
          vendorId: vendorId.toString(),
          itemName: inventory.inventoryItem.name,
          quantity: quantityChange,
          movementType: "adjustment",
          timestamp: new Date().toISOString(),
          notes: `${reason}: ${notes}`,
        });

        if (txId) {
          inventory.blockchain.txId = txId;
          inventory.blockchain.verified = true;
          inventory.blockchain.lastVerified = new Date();
          await inventory.save();
        }
      } catch (blockchainError) {
        logger.error("Blockchain recording failed:", blockchainError);
      }

      logger.info(
        `Stock adjusted for inventory ${inventoryId}: ${quantityChange}`
      );

      return inventory;
    } catch (error) {
      logger.error("Error adjusting stock:", error);
      throw error;
    }
  }

  // ========================================
  // RESERVE QUANTITY FOR PRODUCTION
  // ========================================
  async reserveQuantity(inventoryId, vendorId, reservationData) {
    try {
      const { quantity, orderId, notes } = reservationData;

      const inventory = await VendorInventory.findOne({
        _id: inventoryId,
        vendorId: vendorId,
      });

      if (!inventory) {
        throw new Error("Inventory not found");
      }

      await inventory.reserveQuantity(quantity, orderId);

      logger.info(
        `Reserved ${quantity} units of inventory ${inventoryId} for ${orderId || "production"}`
      );

      return inventory;
    } catch (error) {
      logger.error("Error reserving quantity:", error);
      throw error;
    }
  }

  // ========================================
  // RELEASE RESERVED QUANTITY
  // ========================================
  async releaseReservedQuantity(inventoryId, vendorId, quantity) {
    try {
      const inventory = await VendorInventory.findOne({
        _id: inventoryId,
        vendorId: vendorId,
      });

      if (!inventory) {
        throw new Error("Inventory not found");
      }

      await inventory.releaseReservedQuantity(quantity);

      logger.info(
        `Released ${quantity} units from reservation for inventory ${inventoryId}`
      );

      return inventory;
    } catch (error) {
      logger.error("Error releasing reserved quantity:", error);
      throw error;
    }
  }

  // ========================================
  // USE IN PRODUCTION
  // ========================================
  async useInProduction(inventoryId, vendorId, usageData) {
    try {
      const { quantity, productId, productName, notes } = usageData;

      const inventory = await VendorInventory.findOne({
        _id: inventoryId,
        vendorId: vendorId,
      });

      if (!inventory) {
        throw new Error("Inventory not found");
      }

      await inventory.useInProduction(quantity, productId, productName, notes);

      // Record on blockchain
      try {
        const txId = await fabricService.recordInventoryMovement({
          inventoryId: inventoryId.toString(),
          vendorId: vendorId.toString(),
          itemName: inventory.inventoryItem.name,
          quantity: -quantity,
          movementType: "used",
          productId: productId?.toString(),
          timestamp: new Date().toISOString(),
          notes: `Used in production: ${productName || "product"}`,
        });

        if (txId) {
          inventory.blockchain.txId = txId;
          inventory.blockchain.verified = true;
          inventory.blockchain.lastVerified = new Date();
          await inventory.save();
        }
      } catch (blockchainError) {
        logger.error("Blockchain recording failed:", blockchainError);
      }

      logger.info(
        `Used ${quantity} units of inventory ${inventoryId} in production`
      );

      return inventory;
    } catch (error) {
      logger.error("Error using in production:", error);
      throw error;
    }
  }

  // ========================================
  // MARK AS DAMAGED
  // ========================================
  async markAsDamaged(inventoryId, vendorId, damageData) {
    try {
      const { quantity, reason, notes } = damageData;

      const inventory = await VendorInventory.findOne({
        _id: inventoryId,
        vendorId: vendorId,
      });

      if (!inventory) {
        throw new Error("Inventory not found");
      }

      await inventory.markAsDamaged(quantity, reason, notes);

      // Record on blockchain
      try {
        const txId = await fabricService.recordInventoryMovement({
          inventoryId: inventoryId.toString(),
          vendorId: vendorId.toString(),
          itemName: inventory.inventoryItem.name,
          quantity: -quantity,
          movementType: "damaged",
          timestamp: new Date().toISOString(),
          notes: `Damaged: ${reason}`,
        });

        if (txId) {
          inventory.blockchain.txId = txId;
          inventory.blockchain.verified = true;
          inventory.blockchain.lastVerified = new Date();
          await inventory.save();
        }
      } catch (blockchainError) {
        logger.error("Blockchain recording failed:", blockchainError);
      }

      logger.info(
        `Marked ${quantity} units as damaged for inventory ${inventoryId}`
      );

      return inventory;
    } catch (error) {
      logger.error("Error marking as damaged:", error);
      throw error;
    }
  }

  // ========================================
  // GET MOVEMENTS HISTORY
  // ========================================
  async getMovementsHistory(inventoryId, vendorId) {
    try {
      const inventory = await VendorInventory.findOne({
        _id: inventoryId,
        vendorId: vendorId,
      })
        .select("movements inventoryItem.name")
        .populate("movements.performedBy", "name")
        .populate("movements.relatedProductId", "name")
        .populate("movements.relatedOrderId", "orderNumber")
        .lean();

      if (!inventory) {
        throw new Error("Inventory not found");
      }

      return inventory.movements || [];
    } catch (error) {
      logger.error("Error getting movements history:", error);
      throw error;
    }
  }

  // ========================================
  // GET BY SUPPLIER
  // ========================================
  async getBySupplier(vendorId, supplierId) {
    try {
      const inventory = await VendorInventory.getBySupplier(
        vendorId,
        supplierId
      );

      // Calculate total spending with this supplier
      const totalSpent = inventory.reduce(
        (sum, item) => sum + item.cost.totalCost,
        0
      );

      return {
        inventory,
        summary: {
          totalItems: inventory.length,
          totalSpent,
          supplierName: inventory[0]?.supplier?.supplierName || "Unknown",
        },
      };
    } catch (error) {
      logger.error("Error getting inventory by supplier:", error);
      throw error;
    }
  }

  // ========================================
  // UPDATE QUALITY STATUS
  // ========================================
  async updateQualityStatus(inventoryId, vendorId, qualityData) {
    try {
      const { status, notes } = qualityData;

      const inventory = await VendorInventory.findOne({
        _id: inventoryId,
        vendorId: vendorId,
      });

      if (!inventory) {
        throw new Error("Inventory not found");
      }

      await inventory.updateQualityStatus(status, notes);

      logger.info(
        `Updated quality status for inventory ${inventoryId}: ${status}`
      );

      return inventory;
    } catch (error) {
      logger.error("Error updating quality status:", error);
      throw error;
    }
  }

  // ========================================
  // GET REORDER SUGGESTIONS
  // ========================================
  async getReorderSuggestions(vendorId) {
    try {
      const lowStockItems = await this.getLowStockAlerts(vendorId);

      // Group by supplier for easier reordering
      const bySupplier = {};

      lowStockItems.forEach((item) => {
        const supplierId = item.supplier.supplierId.toString();
        if (!bySupplier[supplierId]) {
          bySupplier[supplierId] = {
            supplier: item.supplier,
            items: [],
            totalCost: 0,
          };
        }

        const suggestedCost = item.suggestedReorderQuantity * item.cost.perUnit;

        bySupplier[supplierId].items.push({
          inventoryId: item._id,
          name: item.inventoryItem.name,
          currentQuantity: item.quantity.current,
          reorderLevel: item.reorderLevel,
          suggestedQuantity: item.suggestedReorderQuantity,
          costPerUnit: item.cost.perUnit,
          totalCost: suggestedCost,
        });

        bySupplier[supplierId].totalCost += suggestedCost;
      });

      return Object.values(bySupplier);
    } catch (error) {
      logger.error("Error getting reorder suggestions:", error);
      throw error;
    }
  }

  // ========================================
  // SEARCH INVENTORY
  // ========================================
  async searchInventory(vendorId, searchQuery) {
    try {
      const inventory = await VendorInventory.find({
        vendorId,
        $or: [
          { "inventoryItem.name": { $regex: searchQuery, $options: "i" } },
          { "inventoryItem.sku": { $regex: searchQuery, $options: "i" } },
          { "inventoryItem.category": { $regex: searchQuery, $options: "i" } },
          { notes: { $regex: searchQuery, $options: "i" } },
        ],
      })
        .populate("supplier.supplierId", "name companyName")
        .limit(20)
        .lean();

      return inventory;
    } catch (error) {
      logger.error("Error searching inventory:", error);
      throw error;
    }
  }
}

export default new VendorInventoryService();
