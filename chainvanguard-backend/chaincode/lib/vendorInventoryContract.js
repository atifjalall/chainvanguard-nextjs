/* eslint-disable @typescript-eslint/no-require-imports */
const { Contract } = require("fabric-contract-api");

/**
 * VendorInventoryContract - Event-Based Vendor Inventory Management
 *
 * This contract tracks vendor's purchased inventory from suppliers.
 * Vendor inventory is created when a vendor request is PAID.
 *
 * Events Stored:
 * - VENDOR_INVENTORY_CREATED: Vendor receives inventory from supplier
 * - VENDOR_INVENTORY_USED: Vendor uses inventory for production/orders
 *
 * NOT Stored on Blockchain:
 * - Current remaining quantity (changes constantly - MongoDB only)
 * - Used quantity (changes frequently)
 * - Reserved quantity (changes frequently)
 * - Stock levels (mutable)
 *
 * Note: Like supplier inventory, we only track SIGNIFICANT events!
 */
class VendorInventoryContract extends Contract {

  // ========================================
  // INITIALIZATION
  // ========================================

  /**
   * Initialize vendor inventory ledger
   */
  async initLedger(ctx) {
    console.info("============= START : Initialize Vendor Inventory Ledger ===========");
    console.info("Vendor Inventory ledger initialized for event-based storage");
    console.info("============= END : Initialize Vendor Inventory Ledger ===========");
    return JSON.stringify({
      message: "Vendor Inventory ledger initialized successfully (event-based)",
    });
  }

  // ========================================
  // VENDOR INVENTORY CREATED EVENT
  // ========================================

  /**
   * Record vendor inventory creation event
   *
   * This is triggered when:
   * 1. Vendor request is APPROVED
   * 2. Vendor PAYS for the request
   * 3. Supplier transfers inventory to vendor
   *
   * Stores immutable data:
   * - vendorInventoryId
   * - vendorId, supplierId
   * - sourceInventoryId (supplier's inventory)
   * - Initial quantity received
   * - Purchase price
   * - orderId (order created for this purchase)
   * - vendorRequestId (original request)
   *
   * Does NOT store:
   * - Current remaining quantity (changes constantly)
   * - Used quantity (changes frequently)
   *
   * @param {Context} ctx - Transaction context
   * @param {string} eventDataJSON - Vendor inventory creation event data
   * @returns {string} Vendor inventory creation event
   */
  async recordVendorInventoryCreation(ctx, eventDataJSON) {
    console.info("============= START : Record Vendor Inventory Creation ===========");

    let eventData;
    try {
      eventData = JSON.parse(eventDataJSON);
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }

    // Validate required fields
    if (!eventData.vendorInventoryId) {
      throw new Error("vendorInventoryId is required");
    }
    if (!eventData.vendorId) {
      throw new Error("vendorId is required");
    }
    if (!eventData.supplierId) {
      throw new Error("supplierId is required");
    }
    if (!eventData.sourceInventoryId) {
      throw new Error("sourceInventoryId is required");
    }
    if (!eventData.orderId) {
      throw new Error("orderId (purchase order) is required");
    }

    // Check if vendor inventory already exists
    const existingInventory = await this.getVendorInventoryCreationEvent(ctx, eventData.vendorInventoryId);
    if (existingInventory) {
      throw new Error(`Vendor inventory ${eventData.vendorInventoryId} already exists on blockchain`);
    }

    // Get transaction metadata
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(txTimestamp.seconds.low * 1000).toISOString();
    const txId = ctx.stub.getTxID();

    // Create vendor inventory creation event (IMMUTABLE SNAPSHOT)
    const vendorInventoryCreationEvent = {
      docType: "event",
      eventType: "VENDOR_INVENTORY_CREATED",
      eventId: `${eventData.vendorInventoryId}_CREATED_${txTimestamp.seconds.low}`,

      // Vendor inventory identification
      vendorInventoryId: eventData.vendorInventoryId,
      name: eventData.name,
      category: eventData.category || "",
      subcategory: eventData.subcategory || "",

      // Vendor information
      vendorId: eventData.vendorId,
      vendorName: eventData.vendorName || "",
      vendorWalletAddress: eventData.vendorWalletAddress || "",

      // Supplier information
      supplierId: eventData.supplierId,
      supplierName: eventData.supplierName || "",
      supplierWalletAddress: eventData.supplierWalletAddress || "",

      // Source inventory (supplier's inventory)
      sourceInventoryId: eventData.sourceInventoryId,

      // Received quantity (immutable snapshot at creation)
      receivedQuantity: eventData.quantity || 0,
      unit: eventData.unit || "",

      // Purchase details (immutable)
      pricePerUnit: eventData.pricePerUnit || 0,
      totalCost: eventData.totalCost || 0,
      currency: eventData.currency || "CVT",

      // References
      orderId: eventData.orderId,  // Purchase order
      vendorRequestId: eventData.vendorRequestId || "",  // Original vendor request

      // Material/textile details (if applicable)
      materialType: eventData.materialType || "",
      textileDetails: eventData.textileDetails || {},

      // Physical properties
      weight: eventData.weight || 0,
      dimensions: eventData.dimensions || "",

      // Blockchain metadata
      timestamp: timestamp,
      txId: txId,
      createdAt: eventData.createdAt || timestamp,
    };

    // Store vendor inventory creation event on ledger
    await ctx.stub.putState(
      vendorInventoryCreationEvent.eventId,
      Buffer.from(JSON.stringify(vendorInventoryCreationEvent))
    );

    // Emit event
    await ctx.stub.setEvent(
      "VendorInventoryCreated",
      Buffer.from(
        JSON.stringify({
          vendorInventoryId: eventData.vendorInventoryId,
          vendorId: eventData.vendorId,
          supplierId: eventData.supplierId,
          receivedQuantity: eventData.quantity,
          orderId: eventData.orderId,
          timestamp: timestamp,
        })
      )
    );

    console.info(`✅ Vendor inventory creation event recorded: ${eventData.vendorInventoryId} - ${eventData.name} (Vendor: ${eventData.vendorId}, Qty: ${eventData.quantity})`);
    console.info("============= END : Record Vendor Inventory Creation ===========");

    return JSON.stringify(vendorInventoryCreationEvent);
  }

  // ========================================
  // VENDOR INVENTORY USAGE EVENT
  // ========================================

  /**
   * Record vendor inventory usage event
   *
   * This is triggered when vendor uses inventory for:
   * - Creating/producing products
   * - Fulfilling customer orders
   *
   * @param {Context} ctx - Transaction context
   * @param {string} eventDataJSON - Usage event data
   * @returns {string} Usage event
   */
  async recordVendorInventoryUsage(ctx, eventDataJSON) {
    console.info("============= START : Record Vendor Inventory Usage ===========");

    let eventData;
    try {
      eventData = JSON.parse(eventDataJSON);
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }

    // Validate required fields
    if (!eventData.vendorInventoryId) {
      throw new Error("vendorInventoryId is required");
    }
    if (!eventData.usedQuantity) {
      throw new Error("usedQuantity is required");
    }
    if (!eventData.usedBy) {
      throw new Error("usedBy (vendor ID) is required");
    }
    if (!eventData.purpose) {
      throw new Error("usage purpose is required (e.g., 'product_creation', 'order_fulfillment')");
    }

    // Verify vendor inventory exists
    const inventoryExists = await this.getVendorInventoryCreationEvent(ctx, eventData.vendorInventoryId);
    if (!inventoryExists) {
      throw new Error(`Vendor inventory ${eventData.vendorInventoryId} does not exist on blockchain`);
    }

    // Get transaction metadata
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(txTimestamp.seconds.low * 1000).toISOString();
    const txId = ctx.stub.getTxID();

    // Create vendor inventory usage event
    const usageEvent = {
      docType: "event",
      eventType: "VENDOR_INVENTORY_USED",
      eventId: `${eventData.vendorInventoryId}_USED_${txTimestamp.seconds.low}`,

      vendorInventoryId: eventData.vendorInventoryId,
      usedBy: eventData.usedBy,
      usedQuantity: eventData.usedQuantity,
      unit: eventData.unit || "",

      // Usage details
      purpose: eventData.purpose,  // product_creation, order_fulfillment, etc.
      productId: eventData.productId || null,  // If used for product creation
      orderId: eventData.orderId || null,  // If used for order fulfillment
      notes: eventData.notes || "",

      timestamp: timestamp,
      txId: txId,
    };

    // Store usage event
    await ctx.stub.putState(
      usageEvent.eventId,
      Buffer.from(JSON.stringify(usageEvent))
    );

    // Emit event
    await ctx.stub.setEvent(
      "VendorInventoryUsed",
      Buffer.from(
        JSON.stringify({
          vendorInventoryId: eventData.vendorInventoryId,
          usedQuantity: eventData.usedQuantity,
          purpose: eventData.purpose,
          timestamp: timestamp,
        })
      )
    );

    console.info(`✅ Vendor inventory usage event recorded: ${eventData.vendorInventoryId} (${eventData.usedQuantity} used for ${eventData.purpose})`);
    console.info("============= END : Record Vendor Inventory Usage ===========");

    return JSON.stringify(usageEvent);
  }

  // ========================================
  // QUERY FUNCTIONS
  // ========================================

  /**
   * Get vendor inventory creation event
   *
   * @param {Context} ctx - Transaction context
   * @param {string} vendorInventoryId - Vendor Inventory ID
   * @returns {object|null} Vendor inventory creation event or null
   */
  async getVendorInventoryCreationEvent(ctx, vendorInventoryId) {
    const queryString = {
      selector: {
        docType: "event",
        eventType: "VENDOR_INVENTORY_CREATED",
        vendorInventoryId: vendorInventoryId,
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
   * Get complete vendor inventory event history
   *
   * @param {Context} ctx - Transaction context
   * @param {string} vendorInventoryId - Vendor Inventory ID
   * @returns {string} Array of all vendor inventory events
   */
  async getVendorInventoryEventHistory(ctx, vendorInventoryId) {
    console.info(`============= START : Get Vendor Inventory Event History for ${vendorInventoryId} ===========`);

    const queryString = {
      selector: {
        docType: "event",
        vendorInventoryId: vendorInventoryId,
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

    console.info(`✅ Retrieved ${allResults.length} events for vendor inventory ${vendorInventoryId}`);
    console.info("============= END : Get Vendor Inventory Event History ===========");

    return JSON.stringify(allResults);
  }

  /**
   * Query vendor inventory by vendor
   *
   * @param {Context} ctx - Transaction context
   * @param {string} vendorId - Vendor ID
   * @returns {string} Array of vendor inventory creation events
   */
  async queryVendorInventoryByVendor(ctx, vendorId) {
    console.info(`============= START : Query Vendor Inventory By Vendor ${vendorId} ===========`);

    const queryString = {
      selector: {
        docType: "event",
        eventType: "VENDOR_INVENTORY_CREATED",
        vendorId: vendorId,
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

    console.info(`✅ Found ${allResults.length} vendor inventory items for vendor ${vendorId}`);
    console.info("============= END : Query Vendor Inventory By Vendor ===========");

    return JSON.stringify(allResults);
  }

  /**
   * Query vendor inventory by supplier
   *
   * @param {Context} ctx - Transaction context
   * @param {string} supplierId - Supplier ID
   * @returns {string} Array of vendor inventory creation events
   */
  async queryVendorInventoryBySupplier(ctx, supplierId) {
    console.info(`============= START : Query Vendor Inventory By Supplier ${supplierId} ===========`);

    const queryString = {
      selector: {
        docType: "event",
        eventType: "VENDOR_INVENTORY_CREATED",
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

    console.info(`✅ Found ${allResults.length} vendor inventory items from supplier ${supplierId}`);
    console.info("============= END : Query Vendor Inventory By Supplier ===========");

    return JSON.stringify(allResults);
  }

  /**
   * Get usage history for vendor inventory
   *
   * @param {Context} ctx - Transaction context
   * @param {string} vendorInventoryId - Vendor Inventory ID
   * @returns {string} Array of usage events
   */
  async getVendorInventoryUsageHistory(ctx, vendorInventoryId) {
    console.info(`============= START : Get Vendor Inventory Usage History for ${vendorInventoryId} ===========`);

    const queryString = {
      selector: {
        docType: "event",
        eventType: "VENDOR_INVENTORY_USED",
        vendorInventoryId: vendorInventoryId,
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

    console.info(`✅ Retrieved ${allResults.length} usage events for vendor inventory ${vendorInventoryId}`);
    console.info("============= END : Get Vendor Inventory Usage History ===========");

    return JSON.stringify(allResults);
  }

  /**
   * Check if vendor inventory exists
   *
   * @param {Context} ctx - Transaction context
   * @param {string} vendorInventoryId - Vendor Inventory ID
   * @returns {boolean} True if vendor inventory exists
   */
  async vendorInventoryExists(ctx, vendorInventoryId) {
    const creationEvent = await this.getVendorInventoryCreationEvent(ctx, vendorInventoryId);
    return creationEvent !== null;
  }

  // ========================================
  // DEPRECATED METHODS (for backward compatibility)
  // ========================================

  /**
   * @deprecated Use recordVendorInventoryCreation instead
   */
  async createVendorInventory(ctx, vendorInventoryDataJson) {
    throw new Error("createVendorInventory() is deprecated. Use recordVendorInventoryCreation() instead.");
  }

  /**
   * @deprecated Quantity updates are mutable, should be in MongoDB only
   */
  async updateVendorInventoryQuantity(ctx, vendorInventoryId, newQuantity) {
    throw new Error("updateVendorInventoryQuantity() is deprecated. Quantity updates are mutable and should only be in MongoDB. Use recordVendorInventoryUsage() to track usage.");
  }

  /**
   * @deprecated Use getVendorInventoryEventHistory instead
   */
  async getVendorInventory(ctx, vendorInventoryId) {
    console.warn("⚠️ getVendorInventory() is deprecated. Use getVendorInventoryEventHistory() instead.");
    const creationEvent = await this.getVendorInventoryCreationEvent(ctx, vendorInventoryId);
    if (!creationEvent) {
      throw new Error(`Vendor inventory ${vendorInventoryId} does not exist`);
    }
    return JSON.stringify(creationEvent);
  }
}

module.exports = VendorInventoryContract;
