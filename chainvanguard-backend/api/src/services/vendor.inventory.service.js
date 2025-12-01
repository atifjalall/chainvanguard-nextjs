import VendorInventory from "../models/VendorInventory.js";
import Order from "../models/Order.js";
import VendorRequest from "../models/VendorRequest.js";
import Inventory from "../models/Inventory.js";
import User from "../models/User.js";
import fabricService from "./fabric.service.js";
import notificationService from "./notification.service.js";
import ipfsService from "./ipfs.service.js";
import dataSyncService from "./data.sync.service.js";
import logger from "../utils/logger.js";

class VendorInventoryService {
  // ========================================
  // AUTO-CREATE INVENTORY FROM DELIVERED ORDER
  // This is the ONLY place where vendor inventory goes to blockchain
  // Triggered when: Vendor pays → Order delivered → Inventory received
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
            currency: order.currency || "USD",
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

      // 🔥 CRITICAL DEBUG: Add log BEFORE any checks
      logger.info(
        `🔥 CHECKPOINT 1: Finished creating ${inventoryRecords.length} inventory records`
      );
      logger.info(
        `🔥 CHECKPOINT 2: About to check if we should record on blockchain`
      );

      // 🔍 DEBUG: Check if we reach blockchain recording section
      logger.info(
        `🔍 DEBUG: About to start blockchain recording. inventoryRecords.length = ${inventoryRecords.length}`
      );
      logger.info(
        `🔍 DEBUG: inventoryRecords = ${JSON.stringify(inventoryRecords.map((r) => r._id))}`
      );

      // ========================================
      // 📝 RECORD VENDOR INVENTORY CREATION ON BLOCKCHAIN
      // ========================================
      logger.info(
        `📝 Starting blockchain recording for ${inventoryRecords.length} vendor inventory items...`
      );

      for (const record of inventoryRecords) {
        logger.info(
          `🔗 Processing blockchain recording for inventory: ${record._id}`
        );

        try {
          // Prepare IMMUTABLE creation event for blockchain
          const blockchainData = {
            vendorInventoryId: record._id.toString(),
            vendorId: record.vendorId.toString(),
            vendorName: record.vendorName,
            vendorRequestId: record.vendorRequestId
              ? record.vendorRequestId.toString()
              : null,
            orderId: record.orderId.toString(),

            // Supplier info (immutable)
            supplierId: record.supplier.supplierId.toString(),
            supplierName: record.supplier.supplierName,

            // Source inventory info (immutable)
            sourceInventoryId: record.inventoryItem.inventoryId.toString(),
            name: record.inventoryItem.name,
            sku: record.inventoryItem.sku,
            category: record.inventoryItem.category,
            subcategory: record.inventoryItem.subcategory,

            // ✅ Immutable snapshot at creation (quantity vendor received)
            quantity: record.quantity.received,
            unit: record.quantity.unit,
            pricePerUnit: record.cost.perUnit,
            totalCost: record.cost.totalCost,
            currency: record.cost.currency,

            // Dates (immutable)
            receivedAt: record.dates.received
              ? record.dates.received.toISOString()
              : new Date().toISOString(),
            createdAt: record.createdAt
              ? record.createdAt.toISOString()
              : new Date().toISOString(),
          };

          logger.info(`🔗 Blockchain data prepared:`);
          logger.info(JSON.stringify(blockchainData, null, 2));
          logger.info(
            `📡 Calling fabricService.recordVendorInventoryCreation...`
          );

          // ✅ Store CREATION EVENT on blockchain (immutable)
          const blockchainResult =
            await fabricService.recordVendorInventoryCreation(blockchainData);

          logger.info(`📦 Blockchain response received:`);
          logger.info(JSON.stringify(blockchainResult, null, 2));

          if (blockchainResult && blockchainResult.txId) {
            record.blockchain.txId = blockchainResult.txId;
            record.blockchain.verified = true;
            record.blockchain.lastVerified = new Date();
            await record.save();
            logger.info(
              `✅ Vendor inventory ${record._id} creation event stored on blockchain: ${blockchainResult.txId}`
            );
          } else if (blockchainResult && blockchainResult.eventId) {
            record.blockchain.txId = blockchainResult.eventId;
            record.blockchain.verified = true;
            record.blockchain.lastVerified = new Date();
            await record.save();
            logger.info(
              `✅ Vendor inventory ${record._id} creation event stored on blockchain: ${blockchainResult.eventId}`
            );
          } else {
            logger.warn(`⚠️ Blockchain response missing txId/eventId:`);
            logger.warn(JSON.stringify(blockchainResult));
          }
        } catch (blockchainError) {
          logger.error(
            `❌ Error recording vendor inventory ${record._id} on blockchain:`
          );
          logger.error(`❌ Error message: ${blockchainError.message}`);
          logger.error(`❌ Error stack: ${blockchainError.stack}`);
          // ⚠️ Continue even if blockchain fails (MongoDB is source of truth)
        }

        // 🧾 AUTO-GENERATE DELIVERY RECEIPT after inventory is received
        try {
          const invoiceService = (await import("./invoice.service.js")).default;

          // Get supplier details
          const supplier = await User.findById(record.supplier.supplierId);

          if (vendor && supplier) {
            await invoiceService.generateInventoryReceipt(
              record,
              vendor,
              supplier
            );
            logger.info(
              `✅ Delivery receipt auto-generated for inventory: ${record._id}`
            );
          }
        } catch (invoiceError) {
          logger.error(
            "⚠️ Failed to generate delivery receipt (non-critical):",
            invoiceError.message
          );
          // Continue even if invoice generation fails
        }
      }

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
  // ✅ NO blockchain sync - adjustments are mutable
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

      // ✅ NO blockchain sync - quantity changes are mutable (MongoDB only)

      logger.info(
        `Stock adjusted for inventory ${inventoryId}: ${quantityChange} (MongoDB only)`
      );

      return inventory;
    } catch (error) {
      logger.error("Error adjusting stock:", error);
      throw error;
    }
  }

  // ========================================
  // RESERVE QUANTITY FOR PRODUCTION
  // ✅ NO blockchain sync - reservations are mutable
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

      // ✅ NO blockchain sync - reservations are mutable (MongoDB only)

      logger.info(
        `Reserved ${quantity} units of inventory ${inventoryId} (MongoDB only)`
      );

      return inventory;
    } catch (error) {
      logger.error("Error reserving quantity:", error);
      throw error;
    }
  }

  // ========================================
  // RELEASE RESERVED QUANTITY
  // ✅ NO blockchain sync - reservations are mutable
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

      // ✅ NO blockchain sync - reservations are mutable (MongoDB only)

      logger.info(`Released ${quantity} units from reservation (MongoDB only)`);

      return inventory;
    } catch (error) {
      logger.error("Error releasing reserved quantity:", error);
      throw error;
    }
  }

  // ========================================
  // USE IN PRODUCTION
  // ✅ NO blockchain sync - usage is mutable
  // If you want to track usage on blockchain in the future,
  // use fabricService.recordVendorInventoryUsage() for significant events
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

      // ✅ NO blockchain sync - usage tracking is mutable (MongoDB only)
      // 💡 Future: Could record SIGNIFICANT usage events (e.g., bulk production runs)
      // using fabricService.recordVendorInventoryUsage() if needed for audit

      logger.info(
        `Used ${quantity} units of inventory ${inventoryId} in production (MongoDB only)`
      );

      return inventory;
    } catch (error) {
      logger.error("Error using in production:", error);
      throw error;
    }
  }

  // ========================================
  // MARK AS DAMAGED
  // ✅ NO blockchain sync - damage tracking is mutable
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

      // ✅ NO blockchain sync - damage tracking is mutable (MongoDB only)

      logger.info(`Marked ${quantity} units as damaged (MongoDB only)`);

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
  // ✅ NO blockchain sync - quality status is mutable
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

      // ✅ NO blockchain sync - quality status is mutable (MongoDB only)

      logger.info(
        `Updated quality status for inventory ${inventoryId}: ${status} (MongoDB only)`
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

  // ========================================
  // SOFT DELETE INVENTORY
  // ✅ NO blockchain sync - status changes are mutable
  // ========================================
  async deleteInventory(inventoryId, vendorId) {
    try {
      const inventory = await VendorInventory.findOne({
        _id: inventoryId,
        vendorId: vendorId,
      });

      if (!inventory) {
        throw new Error("Inventory not found or access denied");
      }

      // Check if inventory has been used
      if (inventory.quantity.used > 0) {
        throw new Error(
          "Cannot delete inventory that has been used in production"
        );
      }

      // Check if inventory has reserved quantity
      if (inventory.quantity.reserved > 0) {
        throw new Error("Cannot delete inventory with reserved quantity");
      }

      // ⚠️ SOFT DELETE - Mark as inactive (nothing deleted from blockchain)
      inventory.status = "inactive";
      await inventory.save();

      // ✅ NO blockchain sync - status changes are mutable (MongoDB only)

      // Send notification
      await notificationService.createNotification({
        userId: vendorId,
        userRole: "vendor",
        type: "inventory_deleted",
        category: "inventory",
        title: "Inventory Deactivated",
        message: `${inventory.inventoryItem.name} has been marked as inactive`,
        priority: "medium",
      });

      logger.info(
        `Soft deleted (marked inactive) inventory ${inventoryId} (MongoDB only)`
      );

      return { success: true };
    } catch (error) {
      logger.error("Error deleting inventory:", error);
      throw error;
    }
  }
}

export default new VendorInventoryService();
