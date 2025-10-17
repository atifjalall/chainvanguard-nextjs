/* eslint-disable @typescript-eslint/no-require-imports */
"use strict";

const { Contract } = require("fabric-contract-api");

class ProductContract extends Contract {
  constructor() {
    super("ProductContract");
  }

  // Initialize ledger
  async initLedger(ctx) {
    console.info("============= START : Initialize Ledger ===========");
    const products = [];
    console.info("============= END : Initialize Ledger ===========");
    return JSON.stringify(products);
  }

  // Create a new product
  async createProduct(ctx, productData) {
    console.info("============= START : Create Product ===========");

    const product = JSON.parse(productData);

    // Check if product already exists
    const exists = await this.productExists(ctx, product.id);
    if (exists) {
      throw new Error(`Product ${product.id} already exists`);
    }

    // Add metadata
    product.docType = "product";

    // Get transaction timestamp (deterministic - same for all peers)
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(txTimestamp.seconds.low * 1000).toISOString();

    product.createdAt = timestamp;
    product.updatedAt = timestamp;
    product.txId = ctx.stub.getTxID();

    // Save to ledger
    await ctx.stub.putState(product.id, Buffer.from(JSON.stringify(product)));

    console.info("============= END : Create Product ===========");
    return JSON.stringify(product);
  }

  // Read a product
  async readProduct(ctx, productId) {
    const productBytes = await ctx.stub.getState(productId);
    if (!productBytes || productBytes.length === 0) {
      throw new Error(`Product ${productId} does not exist`);
    }
    return productBytes.toString();
  }

  // Update product
  async updateProduct(ctx, productId, quantity, status) {
    console.info("============= START : Update Product ===========");

    const exists = await this.productExists(ctx, productId);
    if (!exists) {
      throw new Error(`Product ${productId} does not exist`);
    }

    // Get existing product
    const productBytes = await ctx.stub.getState(productId);
    const product = JSON.parse(productBytes.toString());

    // Update fields
    if (quantity !== undefined && quantity !== "") {
      product.quantity = parseInt(quantity);
    }
    if (status !== undefined && status !== "") {
      product.status = status;
    }

    // Use transaction timestamp (deterministic)
    const txTimestamp = ctx.stub.getTxTimestamp();
    product.updatedAt = new Date(txTimestamp.seconds.low * 1000).toISOString();
    product.lastTxId = ctx.stub.getTxID();

    // Save updated product
    await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));

    console.info("============= END : Update Product ===========");
    return JSON.stringify(product);
  }

  // Delete product (mark as inactive)
  async deleteProduct(ctx, productId) {
    const exists = await this.productExists(ctx, productId);
    if (!exists) {
      throw new Error(`Product ${productId} does not exist`);
    }

    // Get product and mark as inactive
    const productBytes = await ctx.stub.getState(productId);
    const product = JSON.parse(productBytes.toString());
    product.status = "inactive";

    // Use transaction timestamp (deterministic)
    const txTimestamp = ctx.stub.getTxTimestamp();
    product.deletedAt = new Date(txTimestamp.seconds.low * 1000).toISOString();
    product.lastTxId = ctx.stub.getTxID();

    await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));
    return JSON.stringify(product);
  }

  // Check if product exists
  async productExists(ctx, productId) {
    const productBytes = await ctx.stub.getState(productId);
    return productBytes && productBytes.length > 0;
  }

  // Get all products
  async getAllProducts(ctx) {
    const allResults = [];
    const iterator = await ctx.stub.getStateByRange("", "");
    let result = await iterator.next();

    while (!result.done) {
      const strValue = Buffer.from(result.value.value.toString()).toString(
        "utf8"
      );
      let record;
      try {
        record = JSON.parse(strValue);
        if (record.docType === "product") {
          allResults.push(record);
        }
      } catch (err) {
        console.log(err);
      }
      result = await iterator.next();
    }

    await iterator.close();
    return JSON.stringify(allResults);
  }

  // Get product history
  async getProductHistory(ctx, productId) {
    console.info("============= START : Get Product History ===========");

    const iterator = await ctx.stub.getHistoryForKey(productId);
    const allResults = [];

    let result = await iterator.next();
    while (!result.done) {
      const jsonRes = {
        txId: result.value.txId,
        timestamp: result.value.timestamp,
        isDelete: result.value.isDelete,
      };

      if (!result.value.isDelete && result.value.value) {
        jsonRes.value = JSON.parse(result.value.value.toString("utf8"));
      }

      allResults.push(jsonRes);
      result = await iterator.next();
    }

    await iterator.close();
    console.info("============= END : Get Product History ===========");
    return JSON.stringify(allResults);
  }

  // Query products by seller
  async queryProductsBySeller(ctx, sellerId) {
    const queryString = {
      selector: {
        docType: "product",
        sellerId: sellerId,
      },
    };

    return await this.getQueryResultForQueryString(
      ctx,
      JSON.stringify(queryString)
    );
  }

  // Query products by category
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

  // Helper function for queries
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
