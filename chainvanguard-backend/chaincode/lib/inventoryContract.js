/* eslint-disable @typescript-eslint/no-require-imports */
const { Contract } = require("fabric-contract-api");

/**
 * ============================================
 * INVENTORY SMART CONTRACT
 * Manages inventory items on blockchain
 * ============================================
 */
class InventoryContract extends Contract {
  constructor() {
    super("inventory");
  }

  /**
   * Initialize the ledger with empty state
   */
  async initLedger(ctx) {
    console.log("Inventory Contract initialized");
    return JSON.stringify({ message: "Inventory ledger initialized" });
  }

  /**
   * Create a new inventory item on blockchain
   */
  async createInventoryItem(ctx, inventoryDataJson) {
    try {
      const inventoryData = JSON.parse(inventoryDataJson);

      // Validate required fields
      if (
        !inventoryData.inventoryId ||
        !inventoryData.name ||
        !inventoryData.supplierId
      ) {
        throw new Error("Missing required inventory fields");
      }

      // Check if inventory already exists
      const existingData = await ctx.stub.getState(inventoryData.inventoryId);
      if (existingData && existingData.length > 0) {
        throw new Error(
          `Inventory item ${inventoryData.inventoryId} already exists`
        );
      }

      // Create inventory record
      const inventory = {
        inventoryId: inventoryData.inventoryId,
        name: inventoryData.name,
        category: inventoryData.category || "",
        subcategory: inventoryData.subcategory || "",
        supplierId: inventoryData.supplierId,
        supplierName: inventoryData.supplierName || "",
        quantity: inventoryData.quantity || 0,
        price: inventoryData.price || 0,
        ipfsHash: inventoryData.ipfsHash || "",
        status: "active",
        movements: [],
        transfers: [],
        qualityChecks: [],
        createdAt: inventoryData.timestamp || new Date().toISOString(),
        updatedAt: inventoryData.timestamp || new Date().toISOString(), // Use same timestamp as createdAt for determinism
        docType: "inventory",
      };

      // Store on ledger
      await ctx.stub.putState(
        inventoryData.inventoryId,
        Buffer.from(JSON.stringify(inventory))
      );

      // Create composite key for querying by supplier
      const supplierIndexKey = ctx.stub.createCompositeKey(
        "supplier~inventory",
        [inventoryData.supplierId, inventoryData.inventoryId]
      );
      await ctx.stub.putState(supplierIndexKey, Buffer.from("\u0000"));

      // Emit event
      ctx.stub.setEvent("InventoryCreated", Buffer.from(inventoryDataJson));

      console.log(
        `Inventory item created: ${inventoryData.inventoryId} by ${inventoryData.supplierId}`
      );

      return JSON.stringify({
        success: true,
        message: "Inventory item created on blockchain",
        inventoryId: inventoryData.inventoryId,
        txId: ctx.stub.getTxID(),
      });
    } catch (error) {
      console.error("Error creating inventory item:", error);
      throw new Error(`Failed to create inventory item: ${error.message}`);
    }
  }

  /**
   * Update an existing inventory item
   */
  async updateInventoryItem(ctx, inventoryDataJson) {
    try {
      const updateData = JSON.parse(inventoryDataJson);

      if (!updateData.inventoryId) {
        throw new Error("Inventory ID is required");
      }

      // Get existing inventory
      const inventoryBytes = await ctx.stub.getState(updateData.inventoryId);
      if (!inventoryBytes || inventoryBytes.length === 0) {
        throw new Error(`Inventory item ${updateData.inventoryId} not found`);
      }

      const inventory = JSON.parse(inventoryBytes.toString());

      // Update fields
      if (updateData.name) inventory.name = updateData.name;
      if (updateData.quantity !== undefined)
        inventory.quantity = updateData.quantity;
      if (updateData.price !== undefined) inventory.price = updateData.price;
      if (updateData.status) inventory.status = updateData.status;

      inventory.updatedAt = updateData.updatedAt || new Date().toISOString();

      // Store updated inventory
      await ctx.stub.putState(
        updateData.inventoryId,
        Buffer.from(JSON.stringify(inventory))
      );

      // Emit event
      ctx.stub.setEvent("InventoryUpdated", Buffer.from(inventoryDataJson));

      return JSON.stringify({
        success: true,
        message: "Inventory item updated on blockchain",
        inventoryId: updateData.inventoryId,
        txId: ctx.stub.getTxID(),
      });
    } catch (error) {
      console.error("Error updating inventory item:", error);
      throw new Error(`Failed to update inventory item: ${error.message}`);
    }
  }

  /**
   * Add stock to inventory
   */
  async addStock(ctx, inventoryId, quantityStr, notes) {
    try {
      const quantity = parseInt(quantityStr);

      if (quantity <= 0) {
        throw new Error("Quantity must be positive");
      }

      // Get inventory
      const inventoryBytes = await ctx.stub.getState(inventoryId);
      if (!inventoryBytes || inventoryBytes.length === 0) {
        throw new Error(`Inventory item ${inventoryId} not found`);
      }

      const inventory = JSON.parse(inventoryBytes.toString());

      const previousQuantity = inventory.quantity;
      inventory.quantity = previousQuantity + quantity;

      // Get deterministic transaction timestamp
      const txTimestamp = ctx.stub.getTxTimestamp();
      const timestampStr = new Date(
        txTimestamp.seconds.low * 1000
      ).toISOString();

      // Add movement record
      const movement = {
        type: "restock",
        quantity: quantity,
        previousQuantity: previousQuantity,
        newQuantity: inventory.quantity,
        notes: notes || "",
        timestamp: timestampStr,
        txId: ctx.stub.getTxID(),
      };

      if (!inventory.movements) inventory.movements = [];
      inventory.movements.push(movement);

      inventory.updatedAt = timestampStr;

      // Store updated inventory
      await ctx.stub.putState(
        inventoryId,
        Buffer.from(JSON.stringify(inventory))
      );

      // Emit event
      ctx.stub.setEvent(
        "StockAdded",
        Buffer.from(
          JSON.stringify({
            inventoryId,
            quantity,
            newTotal: inventory.quantity,
          })
        )
      );

      return JSON.stringify({
        success: true,
        message: "Stock added successfully",
        previousQuantity: previousQuantity,
        addedQuantity: quantity,
        newQuantity: inventory.quantity,
        txId: ctx.stub.getTxID(),
      });
    } catch (error) {
      console.error("Error adding stock:", error);
      throw new Error(`Failed to add stock: ${error.message}`);
    }
  }

  /**
   * Reduce stock from inventory
   */
  async reduceStock(ctx, inventoryId, quantityStr, reason) {
    try {
      const quantity = parseInt(quantityStr);

      if (quantity <= 0) {
        throw new Error("Quantity must be positive");
      }

      // Get inventory
      const inventoryBytes = await ctx.stub.getState(inventoryId);
      if (!inventoryBytes || inventoryBytes.length === 0) {
        throw new Error(`Inventory item ${inventoryId} not found`);
      }

      const inventory = JSON.parse(inventoryBytes.toString());

      if (inventory.quantity < quantity) {
        throw new Error(
          `Insufficient stock. Available: ${inventory.quantity}, Requested: ${quantity}`
        );
      }

      const previousQuantity = inventory.quantity;
      inventory.quantity = previousQuantity - quantity;

      // Get deterministic transaction timestamp
      const txTimestamp = ctx.stub.getTxTimestamp();
      const timestampStr = new Date(
        txTimestamp.seconds.low * 1000
      ).toISOString();

      // Add movement record
      const movement = {
        type: reason || "sale",
        quantity: -quantity,
        previousQuantity: previousQuantity,
        newQuantity: inventory.quantity,
        timestamp: timestampStr,
        txId: ctx.stub.getTxID(),
      };

      if (!inventory.movements) inventory.movements = [];
      inventory.movements.push(movement);

      inventory.updatedAt = timestampStr;

      // Store updated inventory
      await ctx.stub.putState(
        inventoryId,
        Buffer.from(JSON.stringify(inventory))
      );

      // Emit event
      ctx.stub.setEvent(
        "StockReduced",
        Buffer.from(
          JSON.stringify({
            inventoryId,
            quantity,
            reason,
            newTotal: inventory.quantity,
          })
        )
      );

      return JSON.stringify({
        success: true,
        message: "Stock reduced successfully",
        previousQuantity: previousQuantity,
        reducedQuantity: quantity,
        newQuantity: inventory.quantity,
        txId: ctx.stub.getTxID(),
      });
    } catch (error) {
      console.error("Error reducing stock:", error);
      throw new Error(`Failed to reduce stock: ${error.message}`);
    }
  }

  /**
   * Transfer inventory from supplier to vendor
   */
  async transferInventory(ctx, transferDataJson) {
    try {
      const transferData = JSON.parse(transferDataJson);

      // Validate required fields
      if (
        !transferData.inventoryId ||
        !transferData.fromId ||
        !transferData.toId ||
        !transferData.quantity
      ) {
        throw new Error("Missing required transfer fields");
      }

      // Get inventory
      const inventoryBytes = await ctx.stub.getState(transferData.inventoryId);
      if (!inventoryBytes || inventoryBytes.length === 0) {
        throw new Error(`Inventory item ${transferData.inventoryId} not found`);
      }

      const inventory = JSON.parse(inventoryBytes.toString());

      // Verify ownership
      if (inventory.supplierId !== transferData.fromId) {
        throw new Error("Only the supplier can transfer this inventory");
      }

      // Check quantity
      if (inventory.quantity < transferData.quantity) {
        throw new Error("Insufficient quantity for transfer");
      }

      // Get deterministic transaction timestamp
      const txTimestamp = ctx.stub.getTxTimestamp();
      const timestampStr = new Date(
        txTimestamp.seconds.low * 1000
      ).toISOString();

      // Create transfer record
      const transfer = {
        fromId: transferData.fromId,
        fromRole: transferData.fromRole || "supplier",
        toId: transferData.toId,
        toRole: transferData.toRole || "vendor",
        quantity: transferData.quantity,
        price: transferData.price || 0,
        totalAmount: transferData.totalAmount || 0,
        timestamp: transferData.timestamp || timestampStr,
        txId: ctx.stub.getTxID(),
        status: "completed",
      };

      if (!inventory.transfers) inventory.transfers = [];
      inventory.transfers.push(transfer);

      // Add movement record
      const movement = {
        type: "transfer",
        quantity: -transferData.quantity,
        previousQuantity: inventory.quantity,
        newQuantity: inventory.quantity - transferData.quantity,
        notes: `Transferred to vendor ${transferData.toId}`,
        timestamp: timestampStr,
        txId: ctx.stub.getTxID(),
      };

      if (!inventory.movements) inventory.movements = [];
      inventory.movements.push(movement);

      // Reduce quantity
      inventory.quantity -= transferData.quantity;
      inventory.updatedAt = timestampStr;

      // Store updated inventory
      await ctx.stub.putState(
        transferData.inventoryId,
        Buffer.from(JSON.stringify(inventory))
      );

      // Emit event
      ctx.stub.setEvent("InventoryTransferred", Buffer.from(transferDataJson));

      return JSON.stringify({
        success: true,
        message: "Inventory transferred successfully",
        transfer: transfer,
        txId: ctx.stub.getTxID(),
      });
    } catch (error) {
      console.error("Error transferring inventory:", error);
      throw new Error(`Failed to transfer inventory: ${error.message}`);
    }
  }

  /**
   * Get inventory item by ID
   */
  async getInventory(ctx, inventoryId) {
    try {
      const inventoryBytes = await ctx.stub.getState(inventoryId);
      if (!inventoryBytes || inventoryBytes.length === 0) {
        throw new Error(`Inventory item ${inventoryId} not found`);
      }

      return inventoryBytes.toString();
    } catch (error) {
      console.error("Error getting inventory:", error);
      throw new Error(`Failed to get inventory: ${error.message}`);
    }
  }

  /**
   * Get all inventory items by supplier
   */
  async getInventoryBySupplier(ctx, supplierId) {
    try {
      const iterator = await ctx.stub.getStateByPartialCompositeKey(
        "supplier~inventory",
        [supplierId]
      );

      const inventoryList = [];

      let result = await iterator.next();
      while (!result.done) {
        const compositeKey = result.value.key;
        const splitKey = ctx.stub.splitCompositeKey(compositeKey);
        const inventoryId = splitKey.attributes[1];

        // Get the actual inventory data
        const inventoryBytes = await ctx.stub.getState(inventoryId);
        if (inventoryBytes && inventoryBytes.length > 0) {
          const inventory = JSON.parse(inventoryBytes.toString());
          inventoryList.push(inventory);
        }

        result = await iterator.next();
      }

      await iterator.close();

      return JSON.stringify(inventoryList);
    } catch (error) {
      console.error("Error getting inventory by supplier:", error);
      throw new Error(`Failed to get inventory by supplier: ${error.message}`);
    }
  }

  /**
   * Get inventory history (all changes)
   */
  async getInventoryHistory(ctx, inventoryId) {
    try {
      const iterator = await ctx.stub.getHistoryForKey(inventoryId);

      const history = [];

      let result = await iterator.next();
      while (!result.done) {
        const record = {
          txId: result.value.txId,
          timestamp: result.value.timestamp,
          isDelete: result.value.isDelete,
        };

        if (!result.value.isDelete && result.value.value) {
          record.value = JSON.parse(result.value.value.toString());
        }

        history.push(record);
        result = await iterator.next();
      }

      await iterator.close();

      return JSON.stringify(history);
    } catch (error) {
      console.error("Error getting inventory history:", error);
      throw new Error(`Failed to get inventory history: ${error.message}`);
    }
  }

  /**
   * Delete (discontinue) inventory item
   */
  async deleteInventoryItem(ctx, inventoryId) {
    try {
      const inventoryBytes = await ctx.stub.getState(inventoryId);
      if (!inventoryBytes || inventoryBytes.length === 0) {
        throw new Error(`Inventory item ${inventoryId} not found`);
      }

      const inventory = JSON.parse(inventoryBytes.toString());

      // Get deterministic transaction timestamp
      const txTimestamp = ctx.stub.getTxTimestamp();
      const timestampStr = new Date(
        txTimestamp.seconds.low * 1000
      ).toISOString();

      inventory.status = "discontinued";
      inventory.updatedAt = timestampStr;

      // Store updated (soft deleted) inventory
      await ctx.stub.putState(
        inventoryId,
        Buffer.from(JSON.stringify(inventory))
      );

      // Emit event
      ctx.stub.setEvent(
        "InventoryDeleted",
        Buffer.from(JSON.stringify({ inventoryId }))
      );

      return JSON.stringify({
        success: true,
        message: "Inventory item discontinued",
        inventoryId: inventoryId,
        txId: ctx.stub.getTxID(),
      });
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      throw new Error(`Failed to delete inventory item: ${error.message}`);
    }
  }

  /**
   * Query all inventory items
   * LevelDB-compatible version using getStateByRange
   */
  async queryAllInventory(ctx) {
    try {
      const inventoryList = [];

      // Use getStateByRange to iterate through all keys (LevelDB compatible)
      const iterator = await ctx.stub.getStateByRange("", "");

      let result = await iterator.next();
      while (!result.done) {
        if (result.value && result.value.value) {
          try {
            const strValue = Buffer.from(result.value.value).toString("utf8");
            const record = JSON.parse(strValue);

            // Only include records with docType = "inventory"
            if (record.docType === "inventory") {
              inventoryList.push(record);
            }
          } catch (err) {
            // Skip non-JSON or invalid records
            console.log(`Skipping invalid record at key ${result.value.key}`);
          }
        }
        result = await iterator.next();
      }

      await iterator.close();

      return JSON.stringify(inventoryList);
    } catch (error) {
      console.error("Error querying all inventory:", error);
      throw new Error(`Failed to query all inventory: ${error.message}`);
    }
  }

  /**
   * Add quality check record
   */
  async addQualityCheck(ctx, inventoryId, qualityCheckJson) {
    try {
      const qualityCheck = JSON.parse(qualityCheckJson);

      const inventoryBytes = await ctx.stub.getState(inventoryId);
      if (!inventoryBytes || inventoryBytes.length === 0) {
        throw new Error(`Inventory item ${inventoryId} not found`);
      }

      const inventory = JSON.parse(inventoryBytes.toString());

      // Get deterministic transaction timestamp
      const txTimestamp = ctx.stub.getTxTimestamp();
      const timestampStr = new Date(
        txTimestamp.seconds.low * 1000
      ).toISOString();

      qualityCheck.timestamp = timestampStr;
      qualityCheck.txId = ctx.stub.getTxID();

      if (!inventory.qualityChecks) inventory.qualityChecks = [];
      inventory.qualityChecks.push(qualityCheck);

      inventory.updatedAt = timestampStr;

      await ctx.stub.putState(
        inventoryId,
        Buffer.from(JSON.stringify(inventory))
      );

      ctx.stub.setEvent(
        "QualityCheckAdded",
        Buffer.from(JSON.stringify({ inventoryId, qualityCheck }))
      );

      return JSON.stringify({
        success: true,
        message: "Quality check added",
        txId: ctx.stub.getTxID(),
      });
    } catch (error) {
      console.error("Error adding quality check:", error);
      throw new Error(`Failed to add quality check: ${error.message}`);
    }
  }
}

module.exports = InventoryContract;
