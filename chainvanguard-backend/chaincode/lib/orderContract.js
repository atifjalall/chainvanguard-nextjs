// chainvanguard-backend/chaincode/lib/orderContract.js
/* eslint-disable @typescript-eslint/no-require-imports */
"use strict";

const { Contract } = require("fabric-contract-api");

class OrderContract extends Contract {
  constructor() {
    super("OrderContract");
  }

  // ========================================
  // INITIALIZATION
  // ========================================

  /**
   * Initialize ledger with sample data (optional)
   */
  async initLedger(ctx) {
    console.info("============= START : Initialize Order Ledger ===========");
    console.info("Order ledger initialized");
    console.info("============= END : Initialize Order Ledger ===========");
    return JSON.stringify({
      message: "Order ledger initialized successfully",
    });
  }

  // ========================================
  // CREATE ORDER
  // ========================================

  /**
   * Create a new order on the blockchain
   * @param {Context} ctx - Transaction context
   * @param {string} orderData - JSON string of order data
   * @returns {string} Created order
   */
  async createOrder(ctx, orderData) {
    console.info("============= START : Create Order ===========");

    // Parse order data
    const order = JSON.parse(orderData);

    // Validate required fields
    if (!order.orderId) {
      throw new Error("Order ID is required");
    }
    if (!order.orderNumber) {
      throw new Error("Order number is required");
    }
    if (!order.customerId) {
      throw new Error("Customer ID is required");
    }
    if (!order.sellerId) {
      throw new Error("Seller ID is required");
    }
    if (!order.items || order.items.length === 0) {
      throw new Error("Order must contain at least one item");
    }

    // Check if order already exists
    const exists = await this.orderExists(ctx, order.orderId);
    if (exists) {
      throw new Error(`Order ${order.orderId} already exists on blockchain`);
    }

    // Get transaction metadata
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(txTimestamp.seconds.low * 1000).toISOString();
    const txId = ctx.stub.getTxID();

    // Build blockchain order record
    const blockchainOrder = {
      docType: "order",

      // Order Identity
      orderId: order.orderId,
      orderNumber: order.orderNumber,

      // Customer Information
      customerId: order.customerId,
      customerName: order.customerName || "",
      customerEmail: order.customerEmail || "",
      customerWallet: order.customerWallet || "",

      // Seller Information
      sellerId: order.sellerId,
      sellerName: order.sellerName || "",
      sellerWallet: order.sellerWallet || "",
      sellerRole: order.sellerRole || "vendor",

      // Order Items (simplified for blockchain)
      items: order.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
      })),

      // Pricing
      subtotal: order.subtotal || 0,
      shippingCost: order.shippingCost || 0,
      tax: order.tax || 0,
      discount: order.discount || 0,
      total: order.total,
      currency: order.currency || "PKR",

      // Payment
      paymentMethod: order.paymentMethod || "wallet",
      paymentStatus: order.paymentStatus || "pending",
      transactionHash: order.transactionHash || "",

      // Shipping Address (essential info only)
      shippingAddress: {
        city: order.shippingAddress?.city || "",
        state: order.shippingAddress?.state || "",
        country: order.shippingAddress?.country || "",
        postalCode: order.shippingAddress?.postalCode || "",
      },

      // Order Status
      status: order.status || "pending",

      // Order History
      orderHistory: [
        {
          status: "pending",
          action: "Order placed on blockchain",
          performedBy: order.customerId,
          performedByRole: "customer",
          timestamp: timestamp,
          transactionId: txId,
          notes: "Order created",
        },
      ],

      // Supply Chain Events
      supplyChainEvents: [
        {
          stage: "order_placed",
          location: order.shippingAddress?.city || "",
          description: "Order successfully placed",
          performedBy: order.customerId,
          timestamp: timestamp,
          transactionId: txId,
        },
      ],

      // Product Ownership Transfers
      ownershipTransfers: [],

      // Blockchain Metadata
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: order.customerId,
      createdByRole: "customer",
      lastModifiedBy: order.customerId,
      totalTransactions: 1,
      blockchainVerified: true,
      chaincodeName: "OrderContract",
      transactionId: txId,
    };

    // Save order to ledger
    await ctx.stub.putState(
      order.orderId,
      Buffer.from(JSON.stringify(blockchainOrder))
    );

    // Emit event
    await ctx.stub.setEvent(
      "OrderCreated",
      Buffer.from(
        JSON.stringify({
          orderId: order.orderId,
          orderNumber: order.orderNumber,
          customerId: order.customerId,
          sellerId: order.sellerId,
          total: order.total,
          timestamp: timestamp,
        })
      )
    );

    console.info(`✅ Order ${order.orderNumber} created on blockchain`);
    console.info("============= END : Create Order ===========");

    return JSON.stringify({
      success: true,
      orderId: blockchainOrder.orderId,
      orderNumber: blockchainOrder.orderNumber,
      txId: txId,
      timestamp: timestamp,
    });
  }

  // ========================================
  // READ ORDER
  // ========================================

  /**
   * Read an order by ID
   * @param {Context} ctx - Transaction context
   * @param {string} orderId - Order ID
   * @returns {string} Order data
   */
  async readOrder(ctx, orderId) {
    console.info(`============= START : Read Order ${orderId} ===========`);

    const orderBytes = await ctx.stub.getState(orderId);
    if (!orderBytes || orderBytes.length === 0) {
      throw new Error(`Order ${orderId} does not exist`);
    }

    console.info("============= END : Read Order ===========");
    return orderBytes.toString();
  }

  /**
   * Check if order exists
   * @param {Context} ctx - Transaction context
   * @param {string} orderId - Order ID
   * @returns {boolean} True if exists
   */
  async orderExists(ctx, orderId) {
    const orderBytes = await ctx.stub.getState(orderId);
    return orderBytes && orderBytes.length > 0;
  }

  /**
   * Get all orders
   * @param {Context} ctx - Transaction context
   * @returns {string} Array of all orders
   */
  async getAllOrders(ctx) {
    console.info("============= START : Get All Orders ===========");

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
        if (record.docType === "order") {
          allResults.push(record);
        }
      } catch (err) {
        console.log(err);
      }
      result = await iterator.next();
    }

    await iterator.close();
    console.info(`✅ Retrieved ${allResults.length} orders`);
    console.info("============= END : Get All Orders ===========");

    return JSON.stringify(allResults);
  }

  // ========================================
  // UPDATE ORDER STATUS
  // ========================================

  /**
   * Update order status
   * @param {Context} ctx - Transaction context
   * @param {string} orderId - Order ID
   * @param {string} updateData - JSON string of update data
   * @returns {string} Updated order
   */
  async updateOrderStatus(ctx, orderId, updateData) {
    console.info("============= START : Update Order Status ===========");

    // Check if order exists
    const exists = await this.orderExists(ctx, orderId);
    if (!exists) {
      throw new Error(`Order ${orderId} does not exist`);
    }

    // Get existing order
    const orderBytes = await ctx.stub.getState(orderId);
    const order = JSON.parse(orderBytes.toString());

    // Parse update data
    const updates = JSON.parse(updateData);

    // Get transaction metadata
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(txTimestamp.seconds.low * 1000).toISOString();
    const txId = ctx.stub.getTxID();

    const changes = [];

    // Update status
    if (updates.status && updates.status !== order.status) {
      changes.push(`Status: ${order.status} → ${updates.status}`);
      order.status = updates.status;

      // Add to order history
      order.orderHistory.push({
        status: updates.status,
        action: `Order status changed to ${updates.status}`,
        performedBy: updates.performedBy || order.sellerId,
        performedByRole: updates.performedByRole || "seller",
        timestamp: timestamp,
        transactionId: txId,
        notes: updates.notes || "",
      });

      // Add supply chain event
      order.supplyChainEvents.push({
        stage: updates.status,
        location: updates.location || order.shippingAddress.city,
        description: updates.description || `Order ${updates.status}`,
        performedBy: updates.performedBy || order.sellerId,
        timestamp: timestamp,
        transactionId: txId,
      });
    }

    // Update payment status
    if (updates.paymentStatus) {
      changes.push(
        `Payment: ${order.paymentStatus} → ${updates.paymentStatus}`
      );
      order.paymentStatus = updates.paymentStatus;
    }

    // Update tracking information
    if (updates.trackingNumber) {
      order.trackingNumber = updates.trackingNumber;
      changes.push(`Tracking number added: ${updates.trackingNumber}`);
    }

    if (updates.courierName) {
      order.courierName = updates.courierName;
      changes.push(`Courier: ${updates.courierName}`);
    }

    // Update metadata
    order.updatedAt = timestamp;
    order.lastModifiedBy = updates.performedBy || order.sellerId;
    order.totalTransactions += 1;

    // Save updated order
    await ctx.stub.putState(orderId, Buffer.from(JSON.stringify(order)));

    // Emit event
    await ctx.stub.setEvent(
      "OrderUpdated",
      Buffer.from(
        JSON.stringify({
          orderId: orderId,
          orderNumber: order.orderNumber,
          changes: changes,
          newStatus: order.status,
          timestamp: timestamp,
        })
      )
    );

    console.info(
      `✅ Order ${order.orderNumber} updated: ${changes.join(", ")}`
    );
    console.info("============= END : Update Order Status ===========");

    return JSON.stringify(order);
  }

  // ========================================
  // RECORD PRODUCT OWNERSHIP TRANSFER
  // ========================================

  /**
   * Record product ownership transfer for an order
   * @param {Context} ctx - Transaction context
   * @param {string} orderId - Order ID
   * @param {string} transferData - JSON string of transfer data
   * @returns {string} Updated order
   */
  async recordOwnershipTransfer(ctx, orderId, transferData) {
    console.info("============= START : Record Ownership Transfer ===========");

    // Check if order exists
    const exists = await this.orderExists(ctx, orderId);
    if (!exists) {
      throw new Error(`Order ${orderId} does not exist`);
    }

    // Get existing order
    const orderBytes = await ctx.stub.getState(orderId);
    const order = JSON.parse(orderBytes.toString());

    // Parse transfer data
    const transfer = JSON.parse(transferData);

    // Get transaction metadata
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(txTimestamp.seconds.low * 1000).toISOString();
    const txId = ctx.stub.getTxID();

    // Add ownership transfer record
    order.ownershipTransfers.push({
      productId: transfer.productId,
      productName: transfer.productName,
      fromOwnerId: transfer.fromOwnerId || order.sellerId,
      fromOwnerRole: transfer.fromOwnerRole || "seller",
      toOwnerId: transfer.toOwnerId || order.customerId,
      toOwnerRole: transfer.toOwnerRole || "customer",
      transferType: transfer.transferType || "sale",
      timestamp: timestamp,
      transactionId: txId,
    });

    // Update metadata
    order.updatedAt = timestamp;
    order.totalTransactions += 1;

    // Save updated order
    await ctx.stub.putState(orderId, Buffer.from(JSON.stringify(order)));

    // Emit event
    await ctx.stub.setEvent(
      "OwnershipTransferred",
      Buffer.from(
        JSON.stringify({
          orderId: orderId,
          orderNumber: order.orderNumber,
          productId: transfer.productId,
          fromOwner: transfer.fromOwnerId,
          toOwner: transfer.toOwnerId,
          timestamp: timestamp,
        })
      )
    );

    console.info(
      `✅ Ownership transfer recorded for order ${order.orderNumber}`
    );
    console.info("============= END : Record Ownership Transfer ===========");

    return JSON.stringify({
      success: true,
      orderId: order.orderId,
      transferTxId: txId,
    });
  }

  // ========================================
  // CANCEL ORDER
  // ========================================

  /**
   * Cancel an order
   * @param {Context} ctx - Transaction context
   * @param {string} orderId - Order ID
   * @param {string} cancellationData - JSON string of cancellation data
   * @returns {string} Updated order
   */
  async cancelOrder(ctx, orderId, cancellationData) {
    console.info("============= START : Cancel Order ===========");

    // Check if order exists
    const exists = await this.orderExists(ctx, orderId);
    if (!exists) {
      throw new Error(`Order ${orderId} does not exist`);
    }

    // Get existing order
    const orderBytes = await ctx.stub.getState(orderId);
    const order = JSON.parse(orderBytes.toString());

    // Validate cancellation
    if (!["pending", "confirmed"].includes(order.status)) {
      throw new Error(
        `Order ${orderId} cannot be cancelled. Current status: ${order.status}`
      );
    }

    // Parse cancellation data
    const cancellation = JSON.parse(cancellationData);

    // Get transaction metadata
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(txTimestamp.seconds.low * 1000).toISOString();
    const txId = ctx.stub.getTxID();

    // Update order status
    order.status = "cancelled";
    order.paymentStatus = "refunded";

    // Add to order history
    order.orderHistory.push({
      status: "cancelled",
      action: "Order cancelled",
      performedBy: cancellation.cancelledBy || order.customerId,
      performedByRole: cancellation.cancelledByRole || "customer",
      timestamp: timestamp,
      transactionId: txId,
      notes: cancellation.reason || "No reason provided",
    });

    // Add supply chain event
    order.supplyChainEvents.push({
      stage: "cancelled",
      location: order.shippingAddress.city,
      description: `Order cancelled: ${cancellation.reason}`,
      performedBy: cancellation.cancelledBy || order.customerId,
      timestamp: timestamp,
      transactionId: txId,
    });

    // Update metadata
    order.updatedAt = timestamp;
    order.lastModifiedBy = cancellation.cancelledBy || order.customerId;
    order.totalTransactions += 1;

    // Save updated order
    await ctx.stub.putState(orderId, Buffer.from(JSON.stringify(order)));

    // Emit event
    await ctx.stub.setEvent(
      "OrderCancelled",
      Buffer.from(
        JSON.stringify({
          orderId: orderId,
          orderNumber: order.orderNumber,
          reason: cancellation.reason,
          timestamp: timestamp,
        })
      )
    );

    console.info(`✅ Order ${order.orderNumber} cancelled`);
    console.info("============= END : Cancel Order ===========");

    return JSON.stringify(order);
  }

  // ========================================
  // QUERY ORDERS
  // ========================================

  /**
   * Query orders by customer
   * @param {Context} ctx - Transaction context
   * @param {string} customerId - Customer ID
   * @returns {string} Array of orders
   */
  async queryOrdersByCustomer(ctx, customerId) {
    console.info("============= START : Query Orders By Customer ===========");

    const queryString = {
      selector: {
        docType: "order",
        customerId: customerId,
      },
      sort: [{ createdAt: "desc" }],
    };

    const resultsIterator = await ctx.stub.getQueryResult(
      JSON.stringify(queryString)
    );
    const results = await this._getAllResults(resultsIterator);

    console.info(
      `✅ Found ${results.length} orders for customer ${customerId}`
    );
    console.info("============= END : Query Orders By Customer ===========");

    return JSON.stringify(results);
  }

  /**
   * Query orders by seller
   * @param {Context} ctx - Transaction context
   * @param {string} sellerId - Seller ID
   * @returns {string} Array of orders
   */
  async queryOrdersBySeller(ctx, sellerId) {
    console.info("============= START : Query Orders By Seller ===========");

    const queryString = {
      selector: {
        docType: "order",
        sellerId: sellerId,
      },
      sort: [{ createdAt: "desc" }],
    };

    const resultsIterator = await ctx.stub.getQueryResult(
      JSON.stringify(queryString)
    );
    const results = await this._getAllResults(resultsIterator);

    console.info(`✅ Found ${results.length} orders for seller ${sellerId}`);
    console.info("============= END : Query Orders By Seller ===========");

    return JSON.stringify(results);
  }

  /**
   * Query orders by status
   * @param {Context} ctx - Transaction context
   * @param {string} status - Order status
   * @returns {string} Array of orders
   */
  async queryOrdersByStatus(ctx, status) {
    console.info("============= START : Query Orders By Status ===========");

    const queryString = {
      selector: {
        docType: "order",
        status: status,
      },
      sort: [{ createdAt: "desc" }],
    };

    const resultsIterator = await ctx.stub.getQueryResult(
      JSON.stringify(queryString)
    );
    const results = await this._getAllResults(resultsIterator);

    console.info(`✅ Found ${results.length} orders with status ${status}`);
    console.info("============= END : Query Orders By Status ===========");

    return JSON.stringify(results);
  }

  // ========================================
  // GET ORDER HISTORY
  // ========================================

  /**
   * Get order history (all blockchain transactions)
   * @param {Context} ctx - Transaction context
   * @param {string} orderId - Order ID
   * @returns {string} Transaction history
   */
  async getOrderHistory(ctx, orderId) {
    console.info("============= START : Get Order History ===========");

    const historyIterator = await ctx.stub.getHistoryForKey(orderId);
    const history = [];

    let result = await historyIterator.next();
    while (!result.done) {
      if (result.value) {
        const txTimestamp = result.value.timestamp;
        const timestamp = new Date(
          txTimestamp.seconds.low * 1000
        ).toISOString();

        const record = {
          txId: result.value.txId,
          timestamp: timestamp,
          isDelete: result.value.isDelete,
        };

        if (!result.value.isDelete) {
          try {
            record.value = JSON.parse(result.value.value.toString("utf8"));
          } catch (err) {
            console.error(err);
            record.value = result.value.value.toString("utf8");
          }
        }

        history.push(record);
      }
      result = await historyIterator.next();
    }

    await historyIterator.close();

    console.info(`✅ Retrieved ${history.length} historical records`);
    console.info("============= END : Get Order History ===========");

    return JSON.stringify(history);
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Get all results from an iterator
   * @param {*} iterator - Results iterator
   * @returns {Array} Array of results
   */
  async _getAllResults(iterator) {
    const allResults = [];

    let result = await iterator.next();
    while (!result.done) {
      const strValue = Buffer.from(result.value.value.toString()).toString(
        "utf8"
      );
      let record;
      try {
        record = JSON.parse(strValue);
        allResults.push(record);
      } catch (err) {
        console.log(err);
      }
      result = await iterator.next();
    }

    await iterator.close();
    return allResults;
  }

  // ========================================
  // BLOCKCHAIN LOGGING
  // ========================================

  /**
   * Create a log entry on blockchain
   * @param {Context} ctx
   * @param {string} logId - Unique log ID
   * @param {string} logData - JSON string of log data
   */
  async createLog(ctx, logId, logData) {
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(
      txTimestamp.seconds.toInt() * 1000
    ).toISOString();

    const parsedData = JSON.parse(logData);

    const log = {
      docType: "log",
      logId: logId,
      ...parsedData,
      blockchainTimestamp: timestamp,
    };

    await ctx.stub.putState(logId, Buffer.from(JSON.stringify(log)));

    return JSON.stringify(log);
  }

  /**
   * Get a log entry
   * @param {Context} ctx
   * @param {string} logId
   */
  async getLog(ctx, logId) {
    const logAsBytes = await ctx.stub.getState(logId);

    if (!logAsBytes || logAsBytes.length === 0) {
      throw new Error(`Log ${logId} does not exist`);
    }

    return logAsBytes.toString();
  }
}

module.exports = OrderContract;
