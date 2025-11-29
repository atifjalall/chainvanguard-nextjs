/* eslint-disable @typescript-eslint/no-require-imports */
const { Contract } = require("fabric-contract-api");

/**
 * InventoryContract - Event-Based Supplier Inventory Management
 *
 * This contract uses event-sourcing for SUPPLIER inventory (raw materials/products).
 * MongoDB stores current quantities, blockchain stores significant events only.
 *
 * Events Stored:
 * - INVENTORY_ADDED: New inventory item added by supplier
 * - INVENTORY_TRANSFERRED: Transfer to vendor (via vendor request)
 * - QUALITY_CHECK: Quality inspection events
 *
 * NOT Stored on Blockchain:
 * - Current quantity (changes constantly - MongoDB only)
 * - Reserved quantity (changes frequently)
 * - Used quantity (changes frequently)
 * - Price updates (can change)
 * - Stock levels (mutable)
 *
 * Note: For inventory, we only track SIGNIFICANT events, not quantity changes!
 */
class InventoryContract extends Contract {

  // ========================================
  // INITIALIZATION
  // ========================================

  /**
   * Initialize inventory ledger
   */
  async initLedger(ctx) {
    console.info("============= START : Initialize Inventory Ledger ===========");
    console.info("Inventory ledger initialized for event-based storage");
    console.info("============= END : Initialize Inventory Ledger ===========");
    return JSON.stringify({
      message: "Inventory ledger initialized successfully (event-based)",
    });
  }

  // ========================================
  // INVENTORY ADDED EVENT
  // ========================================

  /**
   * Record inventory addition event (when supplier adds new inventory)
   *
   * Stores immutable data:
   * - inventoryId, name, category
   * - supplierId
   * - Initial quantity at time of addition
   * - Initial price per unit
   * - createdAt timestamp
   *
   * Does NOT store:
   * - Current quantity (changes constantly)
   * - Current price (can be updated)
   * - Stock levels (mutable)
   *
   * @param {Context} ctx - Transaction context
   * @param {string} eventDataJSON - Inventory addition event data
   * @returns {string} Inventory addition event
   */
  async recordInventoryAddition(ctx, eventDataJSON) {
    console.info("============= START : Record Inventory Addition ===========");

    let eventData;
    try {
      eventData = JSON.parse(eventDataJSON);
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }

    // Validate required fields
    if (!eventData.inventoryId) {
      throw new Error("inventoryId is required");
    }
    if (!eventData.name) {
      throw new Error("Inventory name is required");
    }
    if (!eventData.supplierId) {
      throw new Error("supplierId is required");
    }

    // Check if inventory already exists
    const existingInventory = await this.getInventoryAdditionEvent(ctx, eventData.inventoryId);
    if (existingInventory) {
      throw new Error(`Inventory ${eventData.inventoryId} already exists on blockchain`);
    }

    // Get transaction metadata
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(txTimestamp.seconds.low * 1000).toISOString();
    const txId = ctx.stub.getTxID();

    // Create inventory addition event (IMMUTABLE SNAPSHOT)
    const inventoryAdditionEvent = {
      docType: "event",
      eventType: "INVENTORY_ADDED",
      eventId: `${eventData.inventoryId}_ADDED_${txTimestamp.seconds.low}`,

      // Inventory identification
      inventoryId: eventData.inventoryId,
      name: eventData.name,
      category: eventData.category || "",
      subcategory: eventData.subcategory || "",

      // Supplier information
      supplierId: eventData.supplierId,
      supplierName: eventData.supplierName || "",
      supplierWalletAddress: eventData.supplierWalletAddress || "",

      // Initial quantities (snapshot at creation)
      initialQuantity: eventData.quantity || 0,
      unit: eventData.unit || "",

      // Initial pricing (snapshot at creation)
      initialPricePerUnit: eventData.pricePerUnit || 0,
      currency: eventData.currency || "CVT",

      // Material/textile details (if applicable)
      materialType: eventData.materialType || "",
      textileDetails: eventData.textileDetails || {},

      // Physical properties
      weight: eventData.weight || 0,
      dimensions: eventData.dimensions || "",

      // IPFS metadata reference
      metadataHash: eventData.metadataHash || null,  // ✅ IPFS metadata snapshot hash

      // Blockchain metadata
      timestamp: timestamp,
      txId: txId,
      createdAt: eventData.createdAt || timestamp,
    };

    // Store inventory addition event on ledger
    await ctx.stub.putState(
      inventoryAdditionEvent.eventId,
      Buffer.from(JSON.stringify(inventoryAdditionEvent))
    );

    // Emit event
    await ctx.stub.setEvent(
      "InventoryAdded",
      Buffer.from(
        JSON.stringify({
          inventoryId: eventData.inventoryId,
          name: eventData.name,
          supplierId: eventData.supplierId,
          initialQuantity: eventData.quantity,
          timestamp: timestamp,
        })
      )
    );

    console.info(`✅ Inventory addition event recorded: ${eventData.inventoryId} - ${eventData.name} (Qty: ${eventData.quantity})`);
    console.info("============= END : Record Inventory Addition ===========");

    return JSON.stringify(inventoryAdditionEvent);
  }

  // ========================================
  // INVENTORY TRANSFER EVENT
  // ========================================

  /**
   * Record inventory transfer event (supplier → vendor)
   *
   * This is triggered when a vendor request is paid and inventory is transferred.
   *
   * @param {Context} ctx - Transaction context
   * @param {string} eventDataJSON - Transfer event data
   * @returns {string} Transfer event
   */
  async recordInventoryTransfer(ctx, eventDataJSON) {
    console.info("============= START : Record Inventory Transfer ===========");

    let eventData;
    try {
      eventData = JSON.parse(eventDataJSON);
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }

    // Validate required fields
    if (!eventData.inventoryId) {
      throw new Error("inventoryId is required");
    }
    if (!eventData.supplierId) {
      throw new Error("supplierId is required");
    }
    if (!eventData.vendorId) {
      throw new Error("vendorId is required");
    }
    if (!eventData.quantity) {
      throw new Error("transfer quantity is required");
    }
    if (!eventData.orderId) {
      throw new Error("orderId is required");
    }

    // Verify inventory exists
    const inventoryExists = await this.getInventoryAdditionEvent(ctx, eventData.inventoryId);
    if (!inventoryExists) {
      throw new Error(`Inventory ${eventData.inventoryId} does not exist on blockchain`);
    }

    // Get transaction metadata
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(txTimestamp.seconds.low * 1000).toISOString();
    const txId = ctx.stub.getTxID();

    // Create inventory transfer event
    const transferEvent = {
      docType: "event",
      eventType: "INVENTORY_TRANSFERRED",
      eventId: `${eventData.inventoryId}_TRANSFER_${txTimestamp.seconds.low}`,

      inventoryId: eventData.inventoryId,
      inventoryName: eventData.inventoryName || "",

      // Transfer details
      fromSupplierId: eventData.supplierId,
      toVendorId: eventData.vendorId,
      quantity: eventData.quantity,
      unit: eventData.unit || "",
      pricePerUnit: eventData.pricePerUnit || 0,
      totalCost: eventData.totalCost || 0,

      // References
      orderId: eventData.orderId,  // Order created for this transfer
      vendorRequestId: eventData.vendorRequestId || "",  // Original vendor request
      vendorInventoryId: eventData.vendorInventoryId || "",  // Created vendor inventory

      // Blockchain metadata
      timestamp: timestamp,
      txId: txId,
    };

    // Store transfer event
    await ctx.stub.putState(
      transferEvent.eventId,
      Buffer.from(JSON.stringify(transferEvent))
    );

    // Emit event
    await ctx.stub.setEvent(
      "InventoryTransferred",
      Buffer.from(
        JSON.stringify({
          inventoryId: eventData.inventoryId,
          fromSupplier: eventData.supplierId,
          toVendor: eventData.vendorId,
          quantity: eventData.quantity,
          orderId: eventData.orderId,
          timestamp: timestamp,
        })
      )
    );

    console.info(`✅ Inventory transfer event recorded: ${eventData.inventoryId} (${eventData.quantity} ${eventData.unit} → Vendor ${eventData.vendorId})`);
    console.info("============= END : Record Inventory Transfer ===========");

    return JSON.stringify(transferEvent);
  }

  // ========================================
  // QUALITY CHECK EVENT
  // ========================================

  /**
   * Record quality check event
   *
   * @param {Context} ctx - Transaction context
   * @param {string} eventDataJSON - Quality check event data
   * @returns {string} Quality check event
   */
  async recordQualityCheck(ctx, eventDataJSON) {
    console.info("============= START : Record Quality Check ===========");

    let eventData;
    try {
      eventData = JSON.parse(eventDataJSON);
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }

    // Validate required fields
    if (!eventData.inventoryId) {
      throw new Error("inventoryId is required");
    }
    if (!eventData.checkedBy) {
      throw new Error("checkedBy (inspector ID) is required");
    }
    if (!eventData.status) {
      throw new Error("quality check status is required");
    }

    // Verify inventory exists
    const inventoryExists = await this.getInventoryAdditionEvent(ctx, eventData.inventoryId);
    if (!inventoryExists) {
      throw new Error(`Inventory ${eventData.inventoryId} does not exist on blockchain`);
    }

    // Get transaction metadata
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(txTimestamp.seconds.low * 1000).toISOString();
    const txId = ctx.stub.getTxID();

    // Create quality check event
    const qualityCheckEvent = {
      docType: "event",
      eventType: "QUALITY_CHECK",
      eventId: `${eventData.inventoryId}_QC_${txTimestamp.seconds.low}`,

      inventoryId: eventData.inventoryId,
      checkedBy: eventData.checkedBy,
      inspectorName: eventData.inspectorName || "",
      status: eventData.status,  // passed, failed, conditional
      rating: eventData.rating || null,
      notes: eventData.notes || "",
      certificateHash: eventData.certificateHash || null,  // IPFS hash

      timestamp: timestamp,
      txId: txId,
    };

    // Store quality check event
    await ctx.stub.putState(
      qualityCheckEvent.eventId,
      Buffer.from(JSON.stringify(qualityCheckEvent))
    );

    // Emit event
    await ctx.stub.setEvent(
      "QualityCheckRecorded",
      Buffer.from(
        JSON.stringify({
          inventoryId: eventData.inventoryId,
          checkedBy: eventData.checkedBy,
          status: eventData.status,
          timestamp: timestamp,
        })
      )
    );

    console.info(`✅ Quality check event recorded: ${eventData.inventoryId} (Status: ${eventData.status})`);
    console.info("============= END : Record Quality Check ===========");

    return JSON.stringify(qualityCheckEvent);
  }

  // ========================================
  // QUERY FUNCTIONS
  // ========================================

  /**
   * Get inventory addition event
   *
   * @param {Context} ctx - Transaction context
   * @param {string} inventoryId - Inventory ID
   * @returns {object|null} Inventory addition event or null
   */
  async getInventoryAdditionEvent(ctx, inventoryId) {
    const queryString = {
      selector: {
        docType: "event",
        eventType: "INVENTORY_ADDED",
        inventoryId: inventoryId,
      },
    };

    const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
    const result = await iterator.next();

    if (!result.done && result.value) {
      const strValue = Buffer.from(result.value.value.toString()).toString("utf8");
      await iterator.close();
      return JSON.parse(strValue);
    }

    await iterator.close();
    return null;
  }

  /**
   * Get complete inventory event history
   *
   * @param {Context} ctx - Transaction context
   * @param {string} inventoryId - Inventory ID
   * @returns {string} Array of all inventory events
   */
  async getInventoryEventHistory(ctx, inventoryId) {
    console.info(`============= START : Get Inventory Event History for ${inventoryId} ===========`);

    const queryString = {
      selector: {
        docType: "event",
        inventoryId: inventoryId,
      },
      sort: [{ timestamp: "asc" }],
    };

    const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
    const allResults = [];

    let result = await iterator.next();
    while (!result.done) {
      const strValue = Buffer.from(result.value.value.toString()).toString("utf8");
      try {
        const record = JSON.parse(strValue);
        allResults.push(record);
      } catch (err) {
        console.error("Error parsing event:", err);
      }
      result = await iterator.next();
    }

    await iterator.close();

    console.info(`✅ Retrieved ${allResults.length} events for inventory ${inventoryId}`);
    console.info("============= END : Get Inventory Event History ===========");

    return JSON.stringify(allResults);
  }

  /**
   * Query inventory by supplier
   *
   * @param {Context} ctx - Transaction context
   * @param {string} supplierId - Supplier ID
   * @returns {string} Array of inventory addition events
   */
  async queryInventoryBySupplier(ctx, supplierId) {
    console.info(`============= START : Query Inventory By Supplier ${supplierId} ===========`);

    const queryString = {
      selector: {
        docType: "event",
        eventType: "INVENTORY_ADDED",
        supplierId: supplierId,
      },
    };

    const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
    const allResults = [];

    let result = await iterator.next();
    while (!result.done) {
      const strValue = Buffer.from(result.value.value.toString()).toString("utf8");
      try {
        const record = JSON.parse(strValue);
        allResults.push(record);
      } catch (err) {
        console.error("Error parsing event:", err);
      }
      result = await iterator.next();
    }

    await iterator.close();

    console.info(`✅ Found ${allResults.length} inventory items for supplier ${supplierId}`);
    console.info("============= END : Query Inventory By Supplier ===========");

    return JSON.stringify(allResults);
  }

  /**
   * Get transfer history for inventory
   *
   * @param {Context} ctx - Transaction context
   * @param {string} inventoryId - Inventory ID
   * @returns {string} Array of transfer events
   */
  async getInventoryTransferHistory(ctx, inventoryId) {
    console.info(`============= START : Get Inventory Transfer History for ${inventoryId} ===========`);

    const queryString = {
      selector: {
        docType: "event",
        eventType: "INVENTORY_TRANSFERRED",
        inventoryId: inventoryId,
      },
      sort: [{ timestamp: "asc" }],
    };

    const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
    const allResults = [];

    let result = await iterator.next();
    while (!result.done) {
      const strValue = Buffer.from(result.value.value.toString()).toString("utf8");
      try {
        const record = JSON.parse(strValue);
        allResults.push(record);
      } catch (err) {
        console.error("Error parsing event:", err);
      }
      result = await iterator.next();
    }

    await iterator.close();

    console.info(`✅ Retrieved ${allResults.length} transfer events for inventory ${inventoryId}`);
    console.info("============= END : Get Inventory Transfer History ===========");

    return JSON.stringify(allResults);
  }

  /**
   * Check if inventory exists
   *
   * @param {Context} ctx - Transaction context
   * @param {string} inventoryId - Inventory ID
   * @returns {boolean} True if inventory exists
   */
  async inventoryExists(ctx, inventoryId) {
    const additionEvent = await this.getInventoryAdditionEvent(ctx, inventoryId);
    return additionEvent !== null;
  }

  // ========================================
  // DEPRECATED METHODS (for backward compatibility)
  // ========================================

  /**
   * @deprecated Use recordInventoryAddition instead
   */
  async createInventoryItem(ctx, inventoryDataJson) {
    throw new Error("createInventoryItem() is deprecated. Use recordInventoryAddition() instead.");
  }

  /**
   * @deprecated Quantity updates are mutable, should be in MongoDB only
   */
  async updateInventoryQuantity(ctx, inventoryId, newQuantity) {
    throw new Error("updateInventoryQuantity() is deprecated. Quantity updates are mutable and should only be in MongoDB. Use recordInventoryTransfer() for transfers.");
  }

  /**
   * @deprecated Use getInventoryEventHistory instead
   */
  async getInventoryItem(ctx, inventoryId) {
    console.warn("⚠️ getInventoryItem() is deprecated. Use getInventoryEventHistory() instead.");
    const additionEvent = await this.getInventoryAdditionEvent(ctx, inventoryId);
    if (!additionEvent) {
      throw new Error(`Inventory ${inventoryId} does not exist`);
    }
    return JSON.stringify(additionEvent);
  }
}

module.exports = InventoryContract;
