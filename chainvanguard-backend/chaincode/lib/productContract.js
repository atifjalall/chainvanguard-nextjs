/* eslint-disable @typescript-eslint/no-require-imports */
"use strict";

const { Contract } = require("fabric-contract-api");

class ProductContract extends Contract {

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

    // Build blockchain product record with ALL comprehensive data
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

      // Apparel Details (ALL fields)
      apparelDetails: {
        size: product.apparelDetails?.size || "",
        fit: product.apparelDetails?.fit || "",
        color: product.apparelDetails?.color || "",
        pattern: product.apparelDetails?.pattern || "",
        material: product.apparelDetails?.material || "",
        fabricType: product.apparelDetails?.fabricType || "",
        fabricWeight: product.apparelDetails?.fabricWeight || "",
        fabricComposition: product.apparelDetails?.fabricComposition || "",
        neckline: product.apparelDetails?.neckline || "",
        sleeveLength: product.apparelDetails?.sleeveLength || "",
        careInstructions: product.apparelDetails?.careInstructions || "",
        washingTemperature: product.apparelDetails?.washingTemperature || "",
        ironingInstructions: product.apparelDetails?.ironingInstructions || "",
        dryCleanOnly: product.apparelDetails?.dryCleanOnly || false,
        measurements: product.apparelDetails?.measurements || {},
      },

      // Pricing Details
      price: product.price || 0,
      originalPrice: product.originalPrice || 0,
      currency: product.currency || "USD",
      discount: product.discount || 0,
      finalPrice: product.finalPrice || product.price || 0,

      // Inventory
      stockQuantity: product.stockQuantity || 0,
      minStockLevel: product.minStockLevel || 0,
      maxStockLevel: product.maxStockLevel || 0,
      reorderPoint: product.reorderPoint || 0,
      availableQuantity: product.availableQuantity || 0,

      // Images (with metadata)
      images: (product.images || []).map((img) => ({
        url: img.url || img,
        caption: img.caption || "",
        isMain: img.isMain || false,
        order: img.order || 0,
        ipfsHash: img.ipfsHash || "",
      })),

      // Manufacturing Details (ALL fields)
      manufacturingDetails: {
        manufacturerName: product.manufacturingDetails?.manufacturerName || "",
        manufactureDate: product.manufacturingDetails?.manufactureDate || null,
        expiryDate: product.manufacturingDetails?.expiryDate || null,
        batchNumber: product.manufacturingDetails?.batchNumber || "",
        productionCountry:
          product.manufacturingDetails?.productionCountry || "",
        productionFacility:
          product.manufacturingDetails?.productionFacility || "",
        productionLine: product.manufacturingDetails?.productionLine || "",
      },

      // Certifications (comprehensive data)
      certificates: (product.certificates || []).map((cert) => ({
        name: cert.name || "",
        type: cert.type || "",
        certificateNumber: cert.certificateNumber || "",
        issuingAuthority: cert.issuingAuthority || "",
        issueDate: cert.issueDate || null,
        expiryDate: cert.expiryDate || null,
        ipfsHash: cert.ipfsHash || "",
        certificateUrl: cert.certificateUrl || "",
        verificationUrl: cert.verificationUrl || "",
      })),

      // Specifications
      specifications: product.specifications || {},

      // Sustainability (ALL fields)
      sustainability: {
        isOrganic: product.sustainability?.isOrganic || false,
        isFairTrade: product.sustainability?.isFairTrade || false,
        isRecycled: product.sustainability?.isRecycled || false,
        isCarbonNeutral: product.sustainability?.isCarbonNeutral || false,
        isEcoFriendly: product.sustainability?.isEcoFriendly || false,
        isVegan: product.sustainability?.isVegan || false,
        carbonFootprint: product.sustainability?.carbonFootprint || 0,
        sustainabilityScore: product.sustainability?.sustainabilityScore || 0,
        sustainabilityCertifications:
          product.sustainability?.sustainabilityCertifications || [],
      },

      // Quality
      qualityGrade: product.qualityGrade || "",
      qualityScore: product.qualityScore || 0,
      qualityChecks: product.qualityChecks || [],

      // Supply Chain
      supplyChainSummary: product.supplyChainSummary || "",
      supplyChainStages: product.supplyChainStages || [],

      // Location
      currentLocation: {
        facility: product.currentLocation?.facility || "",
        address: product.currentLocation?.address || "",
        city: product.currentLocation?.city || "",
        state: product.currentLocation?.state || "",
        country: product.currentLocation?.country || "",
        postalCode: product.currentLocation?.postalCode || "",
        coordinates: product.currentLocation?.coordinates || {},
      },

      // Status
      status: product.status || "active",
      isVerified: product.isVerified || false,
      verifiedBy: product.verifiedBy || null,
      verifiedAt: product.verifiedAt || null,
      blockchainVerified: true,
      isFeatured: product.isFeatured || false,
      isPublished: product.isPublished || false,
      publishedAt: product.publishedAt || null,

      // SEO
      seoTags: product.seoTags || [],
      seoKeywords: product.seoKeywords || [],
      metaDescription: product.metaDescription || "",

      // Shipping
      shippingDetails: {
        weight: product.shippingDetails?.weight || 0,
        dimensions: product.shippingDetails?.dimensions || {},
        shippingClass: product.shippingDetails?.shippingClass || "",
        handlingTime: product.shippingDetails?.handlingTime || 0,
        freeShipping: product.shippingDetails?.freeShipping || false,
      },

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

    // Update Basic Info
    if (updates.name && updates.name !== product.name) {
      changes.push(`Name updated`);
      product.name = updates.name;
    }

    if (updates.description !== undefined && updates.description !== product.description) {
      changes.push(`Description updated`);
      product.description = updates.description;
    }

    if (updates.category && updates.category !== product.category) {
      changes.push(`Category updated`);
      product.category = updates.category;
    }

    if (updates.subcategory !== undefined) {
      product.subcategory = updates.subcategory;
    }

    if (updates.brand !== undefined) {
      product.brand = updates.brand;
    }

    // Update Apparel Details
    if (updates.apparelDetails) {
      changes.push(`Apparel details updated`);
      product.apparelDetails = {
        ...product.apparelDetails,
        ...updates.apparelDetails,
      };
    }

    // Update Pricing
    if (updates.price !== undefined && updates.price !== product.price) {
      changes.push(`Price: ${product.price} → ${updates.price}`);
      product.price = updates.price;
    }

    if (updates.originalPrice !== undefined) {
      product.originalPrice = updates.originalPrice;
    }

    if (updates.discount !== undefined) {
      product.discount = updates.discount;
    }

    if (updates.finalPrice !== undefined) {
      product.finalPrice = updates.finalPrice;
    }

    // Update Inventory
    if (updates.stockQuantity !== undefined) {
      changes.push(`Stock quantity updated`);
      product.stockQuantity = updates.stockQuantity;
    }

    if (updates.availableQuantity !== undefined) {
      product.availableQuantity = updates.availableQuantity;
    }

    if (updates.minStockLevel !== undefined) {
      product.minStockLevel = updates.minStockLevel;
    }

    if (updates.maxStockLevel !== undefined) {
      product.maxStockLevel = updates.maxStockLevel;
    }

    if (updates.reorderPoint !== undefined) {
      product.reorderPoint = updates.reorderPoint;
    }

    // Update Images
    if (updates.images) {
      changes.push(`Images updated`);
      product.images = updates.images;
    }

    // Update Manufacturing Details
    if (updates.manufacturingDetails) {
      changes.push(`Manufacturing details updated`);
      product.manufacturingDetails = {
        ...product.manufacturingDetails,
        ...updates.manufacturingDetails,
      };
    }

    // Update Certificates
    if (updates.certificates) {
      changes.push(`Certificates updated`);
      product.certificates = updates.certificates;
    }

    // Update Specifications
    if (updates.specifications) {
      changes.push(`Specifications updated`);
      product.specifications = updates.specifications;
    }

    // Update Sustainability
    if (updates.sustainability) {
      changes.push(`Sustainability info updated`);
      product.sustainability = {
        ...product.sustainability,
        ...updates.sustainability,
      };
    }

    // Update Quality
    if (updates.qualityGrade !== undefined) {
      product.qualityGrade = updates.qualityGrade;
    }

    if (updates.qualityScore !== undefined) {
      product.qualityScore = updates.qualityScore;
    }

    if (updates.qualityChecks) {
      product.qualityChecks = updates.qualityChecks;
    }

    // Update Supply Chain Info
    if (updates.supplyChainSummary !== undefined) {
      product.supplyChainSummary = updates.supplyChainSummary;
    }

    if (updates.supplyChainStages) {
      product.supplyChainStages = updates.supplyChainStages;
    }

    // Update SEO
    if (updates.seoTags) {
      product.seoTags = updates.seoTags;
    }

    if (updates.seoKeywords) {
      product.seoKeywords = updates.seoKeywords;
    }

    if (updates.metaDescription !== undefined) {
      product.metaDescription = updates.metaDescription;
    }

    // Update Shipping Details
    if (updates.shippingDetails) {
      changes.push(`Shipping details updated`);
      product.shippingDetails = {
        ...product.shippingDetails,
        ...updates.shippingDetails,
      };
    }

    // Update Status
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
      product.verifiedBy = updates.verifiedBy || null;
      product.verifiedAt = updates.isVerified ? timestamp : null;

      // Add to verification history
      if (updates.isVerified) {
        product.verificationHistory.push({
          verifiedBy: updates.verifiedBy || "unknown",
          timestamp: timestamp,
          transactionId: txId,
        });
      }
    }

    if (updates.isFeatured !== undefined) {
      product.isFeatured = updates.isFeatured;
    }

    if (updates.isPublished !== undefined) {
      product.isPublished = updates.isPublished;
      if (updates.isPublished && !product.publishedAt) {
        product.publishedAt = timestamp;
      }
    }

    // Update Location
    if (updates.currentLocation) {
      changes.push(`Location updated`);
      product.currentLocation = {
        ...product.currentLocation,
        ...updates.currentLocation,
      };

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

    // Update IPFS Hash
    if (updates.ipfsHash !== undefined) {
      product.ipfsHash = updates.ipfsHash;
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
      currency: transfer.currency || "CVT",
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
