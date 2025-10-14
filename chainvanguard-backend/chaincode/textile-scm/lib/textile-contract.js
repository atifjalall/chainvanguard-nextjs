"use strict";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Contract } = require("fabric-contract-api");

class TextileContract extends Contract {
  async InitLedger(ctx) {
    console.info("============= START : Initialize Ledger ===========");

    // Use deterministic timestamp
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestampISO = new Date(txTimestamp.seconds.low * 1000).toISOString();

    const products = [
      {
        id: "PROD001",
        name: "Cotton Fabric Roll",
        category: "Raw Material",
        description: "High quality cotton fabric",
        quantity: 100,
        price: 500,
        supplierId: "SUP001",
        status: "active",
        ipfsHash: "",
        timestamp: timestampISO,
        docType: "product",
      },
    ];

    for (const product of products) {
      await ctx.stub.putState(product.id, Buffer.from(JSON.stringify(product)));
      console.info(`Product ${product.id} initialized`);
    }

    console.info("============= END : Initialize Ledger ===========");
  }

  // Fully deterministic createProduct
  async createProduct(
    ctx,
    productId,
    name,
    category,
    quantity,
    price,
    supplierId,
    ipfsHash,
    description
  ) {
    console.info("============= START : Create Product ===========");

    const productAsBytes = await ctx.stub.getState(productId);
    if (productAsBytes && productAsBytes.length > 0) {
      throw new Error(`Product ${productId} already exists`);
    }

    // Get deterministic timestamp from transaction
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestampISO = new Date(txTimestamp.seconds.low * 1000).toISOString();

    const product = {
      id: productId,
      name,
      category,
      description: description || "",
      quantity: parseInt(quantity),
      price: parseFloat(price),
      supplierId,
      status: "active",
      ipfsHash: ipfsHash || "",
      timestamp: timestampISO,
      docType: "product",
    };

    await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));

    // Use transaction ID for log (deterministic)
    const txId = ctx.stub.getTxID();
    const logId = `LOG_${productId}_${txId}`;
    const log = {
      logId,
      action: "CREATE_PRODUCT",
      performedBy: supplierId,
      timestamp: timestampISO,
      details: { productId, name },
      docType: "log",
    };
    await ctx.stub.putState(logId, Buffer.from(JSON.stringify(log)));

    console.info("============= END : Create Product ===========");
    return JSON.stringify(product);
  }

  async QueryProduct(ctx, productId) {
    const productAsBytes = await ctx.stub.getState(productId);
    if (!productAsBytes || productAsBytes.length === 0) {
      throw new Error(`Product ${productId} does not exist`);
    }
    return productAsBytes.toString();
  }

  async GetAllProducts(ctx) {
    const iterator = await ctx.stub.getStateByRange("", "");
    const allResults = [];

    let result = await iterator.next();
    while (!result.done) {
      const strValue = Buffer.from(result.value.value).toString();
      try {
        const record = JSON.parse(strValue);
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

  async addInfo(ctx, txId, productId, buyerId, sellerId, quantity, amount) {
    console.info("============= START : Add Transaction ===========");

    const productAsBytes = await ctx.stub.getState(productId);
    if (!productAsBytes || productAsBytes.length === 0) {
      throw new Error(`Product ${productId} does not exist`);
    }

    // Use deterministic timestamp
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestampISO = new Date(txTimestamp.seconds.low * 1000).toISOString();

    const transaction = {
      txId,
      productId,
      buyerId,
      sellerId,
      quantity: parseInt(quantity),
      amount: parseFloat(amount),
      status: "completed",
      timestamp: timestampISO,
      docType: "transaction",
    };

    await ctx.stub.putState(txId, Buffer.from(JSON.stringify(transaction)));

    console.info("============= END : Add Transaction ===========");
    return JSON.stringify(transaction);
  }

  async updateInfo(ctx, productId, quantity, status) {
    console.info("============= START : Update Product ===========");

    const productAsBytes = await ctx.stub.getState(productId);
    if (!productAsBytes || productAsBytes.length === 0) {
      throw new Error(`Product ${productId} does not exist`);
    }

    // Use deterministic timestamp
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestampISO = new Date(txTimestamp.seconds.low * 1000).toISOString();

    const product = JSON.parse(productAsBytes.toString());
    product.quantity = parseInt(quantity);
    product.status = status;
    product.lastModified = timestampISO;

    await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));

    console.info("============= END : Update Product ===========");
    return JSON.stringify(product);
  }

  async GetProductHistory(ctx, productId) {
    const iterator = await ctx.stub.getHistoryForKey(productId);
    const history = [];

    let result = await iterator.next();
    while (!result.done) {
      if (result.value) {
        const record = {
          txId: result.value.txId,
          timestamp: result.value.timestamp,
          isDelete: result.value.isDelete,
          value: Buffer.from(result.value.value).toString(),
        };
        history.push(record);
      }
      result = await iterator.next();
    }
    await iterator.close();
    return JSON.stringify(history);
  }

  async logsPre(ctx, startTime, endTime) {
    console.info("============= START : Get Logs ===========");

    const iterator = await ctx.stub.getStateByRange("", "");
    const allLogs = [];

    let result = await iterator.next();
    while (!result.done) {
      const strValue = Buffer.from(result.value.value).toString();
      try {
        const record = JSON.parse(strValue);
        if (record.docType === "log") {
          if (startTime && endTime) {
            const logTime = new Date(record.timestamp).getTime();
            const start = new Date(startTime).getTime();
            const end = new Date(endTime).getTime();
            if (logTime >= start && logTime <= end) {
              allLogs.push(record);
            }
          } else {
            allLogs.push(record);
          }
        }
      } catch (err) {
        console.log(err);
      }
      result = await iterator.next();
    }
    await iterator.close();

    console.info("============= END : Get Logs ===========");
    return JSON.stringify(allLogs);
  }
}

module.exports = TextileContract;
