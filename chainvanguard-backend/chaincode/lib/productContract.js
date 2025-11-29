/* eslint-disable @typescript-eslint/no-require-imports */
"use strict";

const { Contract } = require("fabric-contract-api");

/**
 * ProductContract - Event-Based Product Management
 *
 * This contract uses event-sourcing pattern where only immutable events are stored.
 * MongoDB stores current state (price, quantity, status), blockchain stores event history.
 *
 * Events Stored:
 * - PRODUCT_CREATED: Product creation with immutable snapshot
 * - PRODUCT_VERIFIED: Expert verification events
 * - OWNERSHIP_TRANSFERRED: Ownership transfer events (supplier → vendor → customer)
 *
 * NOT Stored on Blockchain:
 * - Price changes (too frequent, stored in MongoDB only)
 * - Quantity updates (too frequent, stored in MongoDB only)
 * - Status changes (active/inactive - stored in MongoDB only)
 */
class ProductContract extends Contract {

  // ========================================
  // INITIALIZATION
  // ========================================

  /**
   * Initialize ledger
   */
  async initLedger(ctx) {
    console.info("============= START : Initialize Product Ledger ===========");
    console.info("Product ledger initialized for event-based storage");
    console.info("============= END : Initialize Product Ledger ===========");
    return JSON.stringify({
      message: "Product ledger initialized successfully (event-based)",
    });
  }

  // ========================================
  // PRODUCT CREATION EVENT
  // ========================================

  /**
   * Record product creation event (IMMUTABLE SNAPSHOT)
   *
   * Stores only:
   * - productId (MongoDB ID)
   * - name
   * - category
   * - vendorId/sellerId
   * - originalPrice (price at creation)
   * - imageHash (IPFS)
   * - certificateHash (IPFS - if exists)
   * - createdAt timestamp
   *
   * Does NOT store:
   * - currentPrice (can change frequently)
   * - quantity/stock (changes constantly)
   * - status (active/inactive - mutable)
   * - description (can be edited)
   *
   * @param {Context} ctx - Transaction context
   * @param {string} eventDataJSON - Product creation event data
   * @returns {string} Product creation event
   */
  async recordProductCreation(ctx, eventDataJSON) {
    console.info("============= START : Record Product Creation ===========");

    let eventData;
    try {
      eventData = JSON.parse(eventDataJSON);
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }

    // Validate required fields
    if (!eventData.productId) {
      throw new Error("productId is required");
    }
    if (!eventData.name) {
      throw new Error("Product name is required");
    }
    if (!eventData.sellerId && !eventData.vendorId) {
      throw new Error("sellerId or vendorId is required");
    }
    if (!eventData.category) {
      throw new Error("category is required");
    }

    // Check if product already exists
    const existingProduct = await this.getProductCreationEvent(ctx, eventData.productId);
    if (existingProduct) {
      throw new Error(
        `Product ${eventData.productId} already exists on blockchain`
      );
    }

    // Get transaction metadata
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(txTimestamp.seconds.low * 1000).toISOString();
    const txId = ctx.stub.getTxID();

    const sellerId = eventData.sellerId || eventData.vendorId;

    // Create product creation event (IMMUTABLE SNAPSHOT)
    const productCreationEvent = {
      docType: "event",
      eventType: "PRODUCT_CREATED",
      eventId: `${eventData.productId}_CREATED_${txTimestamp.seconds.low}`,

      // Immutable product data
      productId: eventData.productId,
      name: eventData.name,
      category: eventData.category,
      subcategory: eventData.subcategory || "",

      // Seller information (immutable at creation)
      sellerId: sellerId,
      sellerName: eventData.sellerName || "",
      sellerRole: eventData.sellerRole || "vendor",

      // Price at creation (original price)
      originalPrice: eventData.price || eventData.originalPrice || 0,
      currency: eventData.currency || "CVT",

      // IPFS references (immutable)
      imageHash: eventData.imageHash || null,  // IPFS hash of product image
      certificateHash: eventData.certificateHash || null,  // IPFS hash of certificate
      metadataHash: eventData.metadataHash || null,  // ✅ IPFS metadata snapshot hash

      // Blockchain metadata
      timestamp: timestamp,
      txId: txId,
      createdAt: eventData.createdAt || timestamp,
    };

    // Store product creation event on ledger
    await ctx.stub.putState(
      productCreationEvent.eventId,
      Buffer.from(JSON.stringify(productCreationEvent))
    );

    // Emit event
    await ctx.stub.setEvent(
      "ProductCreated",
      Buffer.from(
        JSON.stringify({
          productId: eventData.productId,
          name: eventData.name,
          sellerId: sellerId,
          category: eventData.category,
          timestamp: timestamp,
        })
      )
    );

    console.info(`✅ Product creation event recorded: ${eventData.productId} - ${eventData.name}`);
    console.info("============= END : Record Product Creation ===========");

    return JSON.stringify(productCreationEvent);
  }

  // ========================================
  // PRODUCT VERIFICATION EVENT
  // ========================================

  /**
   * Record product verification event (by blockchain expert)
   *
   * @param {Context} ctx - Transaction context
   * @param {string} eventDataJSON - Verification event data
   * @returns {string} Verification event
   */
  async recordProductVerification(ctx, eventDataJSON) {
    console.info("============= START : Record Product Verification ===========");

    let eventData;
    try {
      eventData = JSON.parse(eventDataJSON);
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }

    // Validate required fields
    if (!eventData.productId) {
      throw new Error("productId is required");
    }
    if (!eventData.verifiedBy) {
      throw new Error("verifiedBy (expert ID) is required");
    }

    // Verify product exists
    const productExists = await this.getProductCreationEvent(ctx, eventData.productId);
    if (!productExists) {
      throw new Error(`Product ${eventData.productId} does not exist on blockchain`);
    }

    // Get transaction metadata
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(txTimestamp.seconds.low * 1000).toISOString();
    const txId = ctx.stub.getTxID();

    // Create verification event
    const verificationEvent = {
      docType: "event",
      eventType: "PRODUCT_VERIFIED",
      eventId: `${eventData.productId}_VERIFIED_${txTimestamp.seconds.low}`,

      productId: eventData.productId,
      verifiedBy: eventData.verifiedBy,
      verifiedByName: eventData.verifiedByName || "",
      certificateHash: eventData.certificateHash || null,  // IPFS hash of verification certificate
      verificationNotes: eventData.notes || "",
      verificationLevel: eventData.verificationLevel || "standard",  // standard, premium, expert

      timestamp: timestamp,
      txId: txId,
    };

    // Store verification event
    await ctx.stub.putState(
      verificationEvent.eventId,
      Buffer.from(JSON.stringify(verificationEvent))
    );

    // Emit event
    await ctx.stub.setEvent(
      "ProductVerified",
      Buffer.from(
        JSON.stringify({
          productId: eventData.productId,
          verifiedBy: eventData.verifiedBy,
          timestamp: timestamp,
        })
      )
    );

    console.info(`✅ Product verification event recorded: ${eventData.productId}`);
    console.info("============= END : Record Product Verification ===========");

    return JSON.stringify(verificationEvent);
  }

  // ========================================
  // OWNERSHIP TRANSFER EVENT
  // ========================================

  /**
   * Record product ownership transfer event
   * (Supplier → Vendor → Customer)
   *
   * @param {Context} ctx - Transaction context
   * @param {string} eventDataJSON - Transfer event data
   * @returns {string} Transfer event
   */
  async recordOwnershipTransfer(ctx, eventDataJSON) {
    console.info("============= START : Record Ownership Transfer ===========");

    let eventData;
    try {
      eventData = JSON.parse(eventDataJSON);
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }

    // Validate required fields
    if (!eventData.productId) {
      throw new Error("productId is required");
    }
    if (!eventData.fromOwnerId) {
      throw new Error("fromOwnerId is required");
    }
    if (!eventData.toOwnerId) {
      throw new Error("toOwnerId is required");
    }
    if (!eventData.orderId) {
      throw new Error("orderId is required");
    }

    // Verify product exists
    const productExists = await this.getProductCreationEvent(ctx, eventData.productId);
    if (!productExists) {
      throw new Error(`Product ${eventData.productId} does not exist on blockchain`);
    }

    // Get transaction metadata
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(txTimestamp.seconds.low * 1000).toISOString();
    const txId = ctx.stub.getTxID();

    // Create ownership transfer event
    const transferEvent = {
      docType: "event",
      eventType: "OWNERSHIP_TRANSFERRED",
      eventId: `${eventData.productId}_TRANSFER_${txTimestamp.seconds.low}`,

      productId: eventData.productId,

      // From owner
      fromOwnerId: eventData.fromOwnerId,
      fromOwnerRole: eventData.fromOwnerRole || "vendor",

      // To owner
      toOwnerId: eventData.toOwnerId,
      toOwnerRole: eventData.toOwnerRole || "customer",

      // Transfer details
      transferType: eventData.transferType || "sale",  // sale, transfer, return
      orderId: eventData.orderId,  // Reference to order
      price: eventData.price || 0,
      currency: eventData.currency || "CVT",

      // Location (optional)
      location: eventData.location || "",

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
      "OwnershipTransferred",
      Buffer.from(
        JSON.stringify({
          productId: eventData.productId,
          fromOwner: eventData.fromOwnerId,
          toOwner: eventData.toOwnerId,
          orderId: eventData.orderId,
          timestamp: timestamp,
        })
      )
    );

    console.info(`✅ Ownership transfer recorded: ${eventData.productId} (${eventData.fromOwnerRole} → ${eventData.toOwnerRole})`);
    console.info("============= END : Record Ownership Transfer ===========");

    return JSON.stringify(transferEvent);
  }

  // ========================================
  // QUERY FUNCTIONS
  // ========================================

  /**
   * Get product creation event
   *
   * @param {Context} ctx - Transaction context
   * @param {string} productId - Product ID
   * @returns {object|null} Product creation event or null
   */
  async getProductCreationEvent(ctx, productId) {
    const queryString = {
      selector: {
        docType: "event",
        eventType: "PRODUCT_CREATED",
        productId: productId,
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
   * Get complete product event history
   *
   * @param {Context} ctx - Transaction context
   * @param {string} productId - Product ID
   * @returns {string} Array of all product events
   */
  async getProductEventHistory(ctx, productId) {
    console.info(`============= START : Get Product Event History for ${productId} ===========`);

    const queryString = {
      selector: {
        docType: "event",
        productId: productId,
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

    console.info(`✅ Retrieved ${allResults.length} events for product ${productId}`);
    console.info("============= END : Get Product Event History ===========");

    return JSON.stringify(allResults);
  }

  /**
   * Query products by seller
   *
   * @param {Context} ctx - Transaction context
   * @param {string} sellerId - Seller/Vendor ID
   * @returns {string} Array of product creation events
   */
  async queryProductsBySeller(ctx, sellerId) {
    console.info(`============= START : Query Products By Seller ${sellerId} ===========`);

    const queryString = {
      selector: {
        docType: "event",
        eventType: "PRODUCT_CREATED",
        sellerId: sellerId,
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

    console.info(`✅ Found ${allResults.length} products for seller ${sellerId}`);
    console.info("============= END : Query Products By Seller ===========");

    return JSON.stringify(allResults);
  }

  /**
   * Query products by category
   *
   * @param {Context} ctx - Transaction context
   * @param {string} category - Product category
   * @returns {string} Array of product creation events
   */
  async queryProductsByCategory(ctx, category) {
    console.info(`============= START : Query Products By Category ${category} ===========`);

    const queryString = {
      selector: {
        docType: "event",
        eventType: "PRODUCT_CREATED",
        category: category,
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

    console.info(`✅ Found ${allResults.length} products in category ${category}`);
    console.info("============= END : Query Products By Category ===========");

    return JSON.stringify(allResults);
  }

  /**
   * Query verified products
   *
   * @param {Context} ctx - Transaction context
   * @returns {string} Array of verified product IDs
   */
  async queryVerifiedProducts(ctx) {
    console.info("============= START : Query Verified Products ===========");

    const queryString = {
      selector: {
        docType: "event",
        eventType: "PRODUCT_VERIFIED",
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

    console.info(`✅ Found ${allResults.length} verified products`);
    console.info("============= END : Query Verified Products ===========");

    return JSON.stringify(allResults);
  }

  /**
   * Get ownership transfer history for a product
   *
   * @param {Context} ctx - Transaction context
   * @param {string} productId - Product ID
   * @returns {string} Array of ownership transfer events
   */
  async getOwnershipHistory(ctx, productId) {
    console.info(`============= START : Get Ownership History for ${productId} ===========`);

    const queryString = {
      selector: {
        docType: "event",
        eventType: "OWNERSHIP_TRANSFERRED",
        productId: productId,
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

    console.info(`✅ Retrieved ${allResults.length} ownership transfers for product ${productId}`);
    console.info("============= END : Get Ownership History ===========");

    return JSON.stringify(allResults);
  }

  /**
   * Get all products (creation events)
   *
   * @param {Context} ctx - Transaction context
   * @returns {string} Array of all product creation events
   */
  async getAllProducts(ctx) {
    console.info("============= START : Get All Products ===========");

    const queryString = {
      selector: {
        docType: "event",
        eventType: "PRODUCT_CREATED",
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

    console.info(`✅ Retrieved ${allResults.length} products`);
    console.info("============= END : Get All Products ===========");

    return JSON.stringify(allResults);
  }

  /**
   * Check if product exists
   *
   * @param {Context} ctx - Transaction context
   * @param {string} productId - Product ID
   * @returns {boolean} True if product exists
   */
  async productExists(ctx, productId) {
    const creationEvent = await this.getProductCreationEvent(ctx, productId);
    return creationEvent !== null;
  }

  // ========================================
  // DEPRECATED METHODS (for backward compatibility)
  // ========================================

  /**
   * @deprecated Use getProductEventHistory instead
   */
  async readProduct(ctx, productId) {
    console.warn("⚠️ readProduct() is deprecated. Use getProductEventHistory() instead.");
    const creationEvent = await this.getProductCreationEvent(ctx, productId);
    if (!creationEvent) {
      throw new Error(`Product ${productId} does not exist`);
    }
    return JSON.stringify(creationEvent);
  }

  /**
   * @deprecated Use recordProductCreation instead
   */
  async createProduct(ctx, productData) {
    throw new Error("createProduct() is deprecated. Use recordProductCreation() instead.");
  }

  /**
   * @deprecated Price updates should be in MongoDB only, not blockchain
   */
  async updateProduct(ctx, productId, updateData) {
    throw new Error("updateProduct() is deprecated. Price/status updates are mutable and should only be in MongoDB. Use recordProductVerification() or recordOwnershipTransfer() for immutable events.");
  }

  /**
   * @deprecated Use recordOwnershipTransfer instead
   */
  async transferProduct(ctx, productId, transferData) {
    throw new Error("transferProduct() is deprecated. Use recordOwnershipTransfer() instead.");
  }

  /**
   * @deprecated Use recordProductVerification instead
   */
  async verifyProduct(ctx, productId, verificationData) {
    throw new Error("verifyProduct() is deprecated. Use recordProductVerification() instead.");
  }

  /**
   * @deprecated Archiving is mutable, should be in MongoDB only
   */
  async archiveProduct(ctx, productId, deletedBy) {
    throw new Error("archiveProduct() is deprecated. Product status (archived/active) is mutable and should only be in MongoDB.");
  }

  /**
   * @deprecated Use getProductEventHistory instead
   */
  async getProductHistory(ctx, productId) {
    console.warn("⚠️ getProductHistory() is deprecated. Use getProductEventHistory() instead.");
    return await this.getProductEventHistory(ctx, productId);
  }
}

module.exports = ProductContract;
