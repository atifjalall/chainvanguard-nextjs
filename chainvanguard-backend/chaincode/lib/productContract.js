/* eslint-disable @typescript-eslint/no-require-imports */
"use strict";

const { Contract } = require("fabric-contract-api");

class ProductContract extends Contract {
  constructor() {
    super("ProductContract");
  }

  // ========================================
  // INITIALIZATION
  // ========================================

  /**
   * Initialize ledger with sample data (optional)
   */
  async initLedger(ctx) {
    console.info("============= START : Initialize Ledger ===========");
    console.info("Product ledger initialized");
    console.info("============= END : Initialize Ledger ===========");
    return JSON.stringify({
      message: "Product ledger initialized successfully",
    });
  }

  // ========================================
  // CREATE PRODUCT
  // ========================================

  /**
   * Create a new product on the blockchain
   * @param {Context} ctx - Transaction context
   * @param {string} productData - JSON string of product data
   * @returns {string} Created product
   */
  async createProduct(ctx, productData) {
    console.info("============= START : Create Product ===========");

    // Parse product data
    const product = JSON.parse(productData);

    // Validate required fields
    if (!product.productId) {
      throw new Error("Product ID is required");
    }
    if (!product.name) {
      throw new Error("Product name is required");
    }
    if (!product.sellerId) {
      throw new Error("Seller ID is required");
    }
    if (!product.category) {
      throw new Error("Category is required");
    }

    // Check if product already exists
    const exists = await this.productExists(ctx, product.productId);
    if (exists) {
      throw new Error(
        `Product ${product.productId} already exists on blockchain`
      );
    }

    // Get transaction metadata
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(txTimestamp.seconds.low * 1000).toISOString();
    const txId = ctx.stub.getTxID();

    // Build blockchain product record
    const blockchainProduct = {
      docType: "product",

      // Identity
      productId: product.productId,
      sku: product.sku || "",
      qrCode: product.qrCode || "",

      // Basic Info
      name: product.name,
      description: product.description || "",
      category: product.category,
      subcategory: product.subcategory || "",
      brand: product.brand || "",

      // Seller Info
      sellerId: product.sellerId,
      sellerName: product.sellerName || "",
      sellerWalletAddress: product.sellerWalletAddress || "",
      sellerRole: product.sellerRole || "supplier",

      // Ownership (for tracking transfers)
      currentOwnerId: product.sellerId,
      currentOwnerRole: product.sellerRole || "supplier",
      originalCreator: product.sellerId,

      // Apparel Details (essential info only)
      apparelDetails: {
        size: product.apparelDetails?.size || "",
        color: product.apparelDetails?.color || "",
        material: product.apparelDetails?.material || "",
        fit: product.apparelDetails?.fit || "",
        pattern: product.apparelDetails?.pattern || "",
      },

      // Manufacturing
      manufacturingDetails: {
        manufacturerName: product.manufacturingDetails?.manufacturerName || "",
        manufactureDate: product.manufacturingDetails?.manufactureDate || null,
        batchNumber: product.manufacturingDetails?.batchNumber || "",
        productionCountry:
          product.manufacturingDetails?.productionCountry || "",
        productionFacility:
          product.manufacturingDetails?.productionFacility || "",
      },

      // Certifications (IPFS hashes only)
      certificates: (product.certificates || []).map((cert) => ({
        name: cert.name,
        type: cert.type,
        certificateNumber: cert.certificateNumber || "",
        ipfsHash: cert.ipfsHash,
        issueDate: cert.issueDate || null,
        expiryDate: cert.expiryDate || null,
      })),

      // Sustainability flags
      sustainability: {
        isOrganic: product.sustainability?.isOrganic || false,
        isFairTrade: product.sustainability?.isFairTrade || false,
        isRecycled: product.sustainability?.isRecycled || false,
        isCarbonNeutral: product.sustainability?.isCarbonNeutral || false,
      },

      // Status
      status: product.status || "active",
      isVerified: product.isVerified || false,
      blockchainVerified: true,

      // Supply Chain History
      supplyChainHistory: [
        {
          stage: "created",
          action: "Product created on blockchain",
          performedBy: product.sellerId,
          performedByRole: product.sellerRole || "supplier",
          location: product.currentLocation?.facility || "",
          country: product.currentLocation?.country || "",
          timestamp: timestamp,
          transactionId: txId,
          blockNumber: ctx.stub.getTxID(),
          verified: true,
        },
      ],

      // Transaction history (for ownership transfers)
      transferHistory: [],

      // Verification history
      verificationHistory: [],

      // IPFS hash (for full product data backup)
      ipfsHash: product.ipfsHash || "",

      // Blockchain metadata
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: product.sellerId,
      lastModifiedBy: product.sellerId,
      txId: txId,
      totalTransactions: 1,
    };

    // Save to ledger
    await ctx.stub.putState(
      product.productId,
      Buffer.from(JSON.stringify(blockchainProduct))
    );

    // Emit event
    await ctx.stub.setEvent(
      "ProductCreated",
      Buffer.from(
        JSON.stringify({
          productId: product.productId,
          name: product.name,
          sellerId: product.sellerId,
          timestamp: timestamp,
        })
      )
    );

    console.info(`✅ Product ${product.productId} created successfully`);
    console.info("============= END : Create Product ===========");

    return JSON.stringify(blockchainProduct);
  }

  // ========================================
  // READ PRODUCT
  // ========================================

  /**
   * Read a product from the blockchain
   * @param {Context} ctx - Transaction context
   * @param {string} productId - Product ID
   * @returns {string} Product data
   */
  async readProduct(ctx, productId) {
    console.info(`Reading product: ${productId}`);

    const productBytes = await ctx.stub.getState(productId);

    if (!productBytes || productBytes.length === 0) {
      throw new Error(`Product ${productId} does not exist on blockchain`);
    }

    return productBytes.toString();
  }

  /**
   * Check if product exists
   * @param {Context} ctx - Transaction context
   * @param {string} productId - Product ID
   * @returns {boolean} True if exists
   */
  async productExists(ctx, productId) {
    const productBytes = await ctx.stub.getState(productId);
    return productBytes && productBytes.length > 0;
  }

  // ========================================
  // UPDATE PRODUCT
  // ========================================

  /**
   * Update product information
   * @param {Context} ctx - Transaction context
   * @param {string} productId - Product ID
   * @param {string} updateData - JSON string of updates
   * @returns {string} Updated product
   */
  async updateProduct(ctx, productId, updateData) {
    console.info("============= START : Update Product ===========");

    // Check if product exists
    const exists = await this.productExists(ctx, productId);
    if (!exists) {
      throw new Error(`Product ${productId} does not exist`);
    }

    // Get existing product
    const productBytes = await ctx.stub.getState(productId);
    const product = JSON.parse(productBytes.toString());

    // Parse update data
    const updates = JSON.parse(updateData);

    // Get transaction metadata
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(txTimestamp.seconds.low * 1000).toISOString();
    const txId = ctx.stub.getTxID();

    // Track what changed
    const changes = [];

    // Update allowed fields
    if (updates.status && updates.status !== product.status) {
      changes.push(`Status: ${product.status} → ${updates.status}`);
      product.status = updates.status;
    }

    if (
      updates.isVerified !== undefined &&
      updates.isVerified !== product.isVerified
    ) {
      changes.push(`Verified: ${product.isVerified} → ${updates.isVerified}`);
      product.isVerified = updates.isVerified;

      // Add to verification history
      if (updates.isVerified) {
        product.verificationHistory.push({
          verifiedBy: updates.verifiedBy || "unknown",
          timestamp: timestamp,
          transactionId: txId,
        });
      }
    }

    if (updates.currentLocation) {
      changes.push(`Location updated`);
      product.supplyChainHistory.push({
        stage: "location_updated",
        action: "Product location updated",
        performedBy: updates.updatedBy || product.currentOwnerId,
        performedByRole: updates.updatedByRole || product.currentOwnerRole,
        location: updates.currentLocation.facility || "",
        country: updates.currentLocation.country || "",
        timestamp: timestamp,
        transactionId: txId,
        verified: true,
      });
    }

    // Add supply chain event if provided
    if (updates.supplyChainEvent) {
      const event = updates.supplyChainEvent;
      product.supplyChainHistory.push({
        stage: event.stage || "updated",
        action: event.action || "Product updated",
        performedBy: event.performedBy || product.currentOwnerId,
        performedByRole: event.performedByRole || product.currentOwnerRole,
        location: event.location || "",
        country: event.country || "",
        details: event.details || "",
        timestamp: timestamp,
        transactionId: txId,
        verified: true,
      });
      changes.push(`Supply chain event: ${event.stage}`);
    }

    // Update metadata
    product.updatedAt = timestamp;
    product.lastModifiedBy = updates.updatedBy || product.currentOwnerId;
    product.totalTransactions += 1;

    // Save updated product
    await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));

    // Emit event
    await ctx.stub.setEvent(
      "ProductUpdated",
      Buffer.from(
        JSON.stringify({
          productId: productId,
          changes: changes,
          timestamp: timestamp,
        })
      )
    );

    console.info(`✅ Product ${productId} updated: ${changes.join(", ")}`);
    console.info("============= END : Update Product ===========");

    return JSON.stringify(product);
  }

  // ========================================
  // TRANSFER OWNERSHIP
  // ========================================

  /**
   * Transfer product ownership (Supplier → Vendor → Customer)
   * @param {Context} ctx - Transaction context
   * @param {string} productId - Product ID
   * @param {string} transferData - JSON string of transfer data
   * @returns {string} Updated product
   */
  async transferProduct(ctx, productId, transferData) {
    console.info("============= START : Transfer Product ===========");

    // Check if product exists
    const exists = await this.productExists(ctx, productId);
    if (!exists) {
      throw new Error(`Product ${productId} does not exist`);
    }

    // Get existing product
    const productBytes = await ctx.stub.getState(productId);
    const product = JSON.parse(productBytes.toString());

    // Parse transfer data
    const transfer = JSON.parse(transferData);

    // Validate transfer data
    if (!transfer.newOwnerId) {
      throw new Error("New owner ID is required");
    }
    if (!transfer.newOwnerRole) {
      throw new Error("New owner role is required");
    }

    // Get transaction metadata
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(txTimestamp.seconds.low * 1000).toISOString();
    const txId = ctx.stub.getTxID();

    // Record transfer in history
    const transferRecord = {
      fromOwnerId: product.currentOwnerId,
      fromOwnerRole: product.currentOwnerRole,
      toOwnerId: transfer.newOwnerId,
      toOwnerRole: transfer.newOwnerRole,
      transferType: transfer.transferType || "sale",
      price: transfer.price || 0,
      currency: transfer.currency || "PKR",
      location: transfer.location || "",
      timestamp: timestamp,
      transactionId: txId,
    };

    product.transferHistory.push(transferRecord);

    // Update current owner
    product.currentOwnerId = transfer.newOwnerId;
    product.currentOwnerRole = transfer.newOwnerRole;

    // Add to supply chain history
    product.supplyChainHistory.push({
      stage: "ownership_transferred",
      action: `Ownership transferred from ${product.currentOwnerRole} to ${transfer.newOwnerRole}`,
      performedBy: transfer.transferredBy || transfer.newOwnerId,
      performedByRole: transfer.newOwnerRole,
      location: transfer.location || "",
      details: `Transfer type: ${transfer.transferType || "sale"}`,
      timestamp: timestamp,
      transactionId: txId,
      verified: true,
    });

    // Update status if sold to customer
    if (transfer.newOwnerRole === "customer") {
      product.status = "sold";
    }

    // Update metadata
    product.updatedAt = timestamp;
    product.lastModifiedBy = transfer.transferredBy || transfer.newOwnerId;
    product.totalTransactions += 1;

    // Save updated product
    await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));

    // Emit event
    await ctx.stub.setEvent(
      "ProductTransferred",
      Buffer.from(
        JSON.stringify({
          productId: productId,
          from: product.transferHistory[product.transferHistory.length - 1]
            .fromOwnerId,
          to: transfer.newOwnerId,
          timestamp: timestamp,
        })
      )
    );

    console.info(
      `✅ Product ${productId} transferred to ${transfer.newOwnerId}`
    );
    console.info("============= END : Transfer Product ===========");

    return JSON.stringify(product);
  }

  // ========================================
  // VERIFY PRODUCT
  // ========================================

  /**
   * Verify product authenticity (Expert only)
   * @param {Context} ctx - Transaction context
   * @param {string} productId - Product ID
   * @param {string} verificationData - JSON string of verification data
   * @returns {string} Updated product
   */
  async verifyProduct(ctx, productId, verificationData) {
    console.info("============= START : Verify Product ===========");

    const exists = await this.productExists(ctx, productId);
    if (!exists) {
      throw new Error(`Product ${productId} does not exist`);
    }

    const productBytes = await ctx.stub.getState(productId);
    const product = JSON.parse(productBytes.toString());

    const verification = JSON.parse(verificationData);

    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(txTimestamp.seconds.low * 1000).toISOString();
    const txId = ctx.stub.getTxID();

    // Update verification status
    product.isVerified = true;
    product.blockchainVerified = true;

    // Add to verification history
    product.verificationHistory.push({
      verifiedBy: verification.verifiedBy,
      verifiedByName: verification.verifiedByName || "",
      verificationNotes: verification.notes || "",
      timestamp: timestamp,
      transactionId: txId,
    });

    // Add to supply chain history
    product.supplyChainHistory.push({
      stage: "verified",
      action: "Product verified by blockchain expert",
      performedBy: verification.verifiedBy,
      performedByRole: "expert",
      details: verification.notes || "",
      timestamp: timestamp,
      transactionId: txId,
      verified: true,
    });

    product.updatedAt = timestamp;
    product.totalTransactions += 1;

    await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));

    await ctx.stub.setEvent(
      "ProductVerified",
      Buffer.from(
        JSON.stringify({
          productId: productId,
          verifiedBy: verification.verifiedBy,
          timestamp: timestamp,
        })
      )
    );

    console.info(`✅ Product ${productId} verified`);
    console.info("============= END : Verify Product ===========");

    return JSON.stringify(product);
  }

  // ========================================
  // DELETE/ARCHIVE PRODUCT
  // ========================================

  /**
   * Archive product (soft delete)
   * @param {Context} ctx - Transaction context
   * @param {string} productId - Product ID
   * @param {string} deletedBy - User ID who deleted
   * @returns {string} Updated product
   */
  async archiveProduct(ctx, productId, deletedBy) {
    console.info("============= START : Archive Product ===========");

    const exists = await this.productExists(ctx, productId);
    if (!exists) {
      throw new Error(`Product ${productId} does not exist`);
    }

    const productBytes = await ctx.stub.getState(productId);
    const product = JSON.parse(productBytes.toString());

    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(txTimestamp.seconds.low * 1000).toISOString();

    product.status = "archived";
    product.archivedAt = timestamp;
    product.archivedBy = deletedBy;
    product.updatedAt = timestamp;

    await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));

    console.info(`✅ Product ${productId} archived`);
    console.info("============= END : Archive Product ===========");

    return JSON.stringify(product);
  }

  // ========================================
  // QUERY FUNCTIONS
  // ========================================

  /**
   * Get all products
   */
  async getAllProducts(ctx) {
    const allResults = [];
    const iterator = await ctx.stub.getStateByRange("", "");

    let result = await iterator.next();
    while (!result.done) {
      const strValue = Buffer.from(result.value.value.toString()).toString(
        "utf8"
      );
      try {
        const record = JSON.parse(strValue);
        if (record.docType === "product") {
          allResults.push(record);
        }
      } catch (err) {
        console.error("Error parsing record:", err);
      }
      result = await iterator.next();
    }

    await iterator.close();
    return JSON.stringify(allResults);
  }

  /**
   * Get product history (all transactions)
   */
  async getProductHistory(ctx, productId) {
    console.info("============= START : Get Product History ===========");

    const iterator = await ctx.stub.getHistoryForKey(productId);
    const allResults = [];

    let result = await iterator.next();
    while (!result.done) {
      // Safely parse timestamp
      let timestamp;
      try {
        if (result.value.timestamp) {
          // Handle different timestamp formats
          const seconds =
            result.value.timestamp.seconds?.low ||
            result.value.timestamp.seconds ||
            0;
          const nanos = result.value.timestamp.nanos || 0;

          if (seconds > 0) {
            timestamp = new Date(
              seconds * 1000 + nanos / 1000000
            ).toISOString();
          } else {
            timestamp = new Date().toISOString(); // Fallback to current time
          }
        } else {
          timestamp = new Date().toISOString(); // Fallback to current time
        }
      } catch (err) {
        console.error("Error parsing timestamp:", err);
        timestamp = new Date().toISOString(); // Fallback to current time
      }

      const jsonRes = {
        txId: result.value.txId,
        timestamp: timestamp,
        isDelete: result.value.isDelete,
      };

      if (!result.value.isDelete && result.value.value) {
        try {
          jsonRes.value = JSON.parse(result.value.value.toString("utf8"));
        } catch (err) {
          console.error("Error parsing value:", err);
          jsonRes.value = null;
        }
      }

      allResults.push(jsonRes);
      result = await iterator.next();
    }

    await iterator.close();
    console.info("============= END : Get Product History ===========");

    return JSON.stringify(allResults);
  }

  /**
   * Query products by seller
   */
  async queryProductsBySeller(ctx, sellerId) {
    const queryString = {
      selector: {
        docType: "product",
        currentOwnerId: sellerId,
        status: { $ne: "archived" },
      },
    };

    return await this.getQueryResultForQueryString(
      ctx,
      JSON.stringify(queryString)
    );
  }

  /**
   * Query products by category
   */
  async queryProductsByCategory(ctx, category) {
    const queryString = {
      selector: {
        docType: "product",
        category: category,
        status: "active",
      },
    };

    return await this.getQueryResultForQueryString(
      ctx,
      JSON.stringify(queryString)
    );
  }

  /**
   * Query verified products
   */
  async queryVerifiedProducts(ctx) {
    const queryString = {
      selector: {
        docType: "product",
        isVerified: true,
        blockchainVerified: true,
      },
    };

    return await this.getQueryResultForQueryString(
      ctx,
      JSON.stringify(queryString)
    );
  }

  /**
   * Helper function for CouchDB queries
   */
  async getQueryResultForQueryString(ctx, queryString) {
    const iterator = await ctx.stub.getQueryResult(queryString);
    const allResults = [];

    let result = await iterator.next();
    while (!result.done) {
      const strValue = Buffer.from(result.value.value.toString()).toString(
        "utf8"
      );
      const record = JSON.parse(strValue);
      allResults.push(record);
      result = await iterator.next();
    }

    await iterator.close();
    return JSON.stringify(allResults);
  }
}

module.exports = ProductContract;
