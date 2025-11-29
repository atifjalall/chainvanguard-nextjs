// chainvanguard-backend/chaincode/lib/orderContract.js
/* eslint-disable @typescript-eslint/no-require-imports */
"use strict";

const { Contract } = require("fabric-contract-api");

/**
 * OrderContract - Event-Based Order Management
 *
 * This contract uses event-sourcing pattern where orders are represented as a series of events.
 * MongoDB stores current state, blockchain stores complete event history.
 *
 * Events Stored:
 * - ORDER_CREATED: Order placement with immutable snapshot of items, totals, parties
 * - ORDER_PAID: Payment confirmation event
 * - ORDER_STATUS_CHANGED: Status transition events (confirmed, shipped, delivered, etc.)
 * - ORDER_CANCELLED: Cancellation event
 *
 * NOT Stored on Blockchain:
 * - Estimated delivery dates (can change)
 * - Internal notes (mutable)
 * - Customer service updates (mutable)
 */
class OrderContract extends Contract {

  // ========================================
  // INITIALIZATION
  // ========================================

  /**
   * Initialize order ledger
   */
  async initLedger(ctx) {
    console.info("============= START : Initialize Order Ledger ===========");
    console.info("Order ledger initialized for event-based storage");
    console.info("============= END : Initialize Order Ledger ===========");
    return JSON.stringify({
      message: "Order ledger initialized successfully (event-based)",
    });
  }

  // ========================================
  // ORDER CREATION EVENT
  // ========================================

  /**
   * Record order creation event (IMMUTABLE SNAPSHOT)
   *
   * Stores immutable data:
   * - orderId, orderNumber
   * - customerId, vendorId/sellerId
   * - items (snapshot at order time)
   * - pricing (subtotal, shipping, tax, total)
   * - shipping address
   * - payment method
   * - createdAt timestamp
   *
   * Does NOT store:
   * - Current status (mutable - tracked via events)
   * - Tracking updates (mutable)
   * - Estimated delivery (can change)
   *
   * @param {Context} ctx - Transaction context
   * @param {string} eventDataJSON - Order creation event data
   * @returns {string} Order creation event
   */
  async recordOrderCreation(ctx, eventDataJSON) {
    console.info("============= START : Record Order Creation ===========");

    let eventData;
    try {
      eventData = JSON.parse(eventDataJSON);
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }

    // Validate required fields
    if (!eventData.orderId) {
      throw new Error("orderId is required");
    }
    if (!eventData.orderNumber) {
      throw new Error("orderNumber is required");
    }
    if (!eventData.customerId) {
      throw new Error("customerId is required");
    }
    if (!eventData.sellerId && !eventData.vendorId) {
      throw new Error("sellerId or vendorId is required");
    }
    if (!eventData.items || eventData.items.length === 0) {
      throw new Error("Order must contain at least one item");
    }

    // Check if order already exists
    const existingOrder = await this.getOrderCreationEvent(ctx, eventData.orderId);
    if (existingOrder) {
      throw new Error(`Order ${eventData.orderId} already exists on blockchain`);
    }

    // Get transaction metadata
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(txTimestamp.seconds.low * 1000).toISOString();
    const txId = ctx.stub.getTxID();

    const sellerId = eventData.sellerId || eventData.vendorId;

    // Create order creation event (IMMUTABLE SNAPSHOT)
    const orderCreationEvent = {
      docType: "event",
      eventType: "ORDER_CREATED",
      eventId: `${eventData.orderId}_CREATED_${txTimestamp.seconds.low}`,

      // Order identification
      orderId: eventData.orderId,
      orderNumber: eventData.orderNumber,

      // Parties involved
      customerId: eventData.customerId,
      customerName: eventData.customerName || "",
      customerWalletAddress: eventData.customerWalletAddress || "",

      sellerId: sellerId,
      sellerName: eventData.sellerName || "",
      sellerWalletAddress: eventData.sellerWalletAddress || "",
      sellerRole: eventData.sellerRole || "vendor",

      // Items snapshot (immutable)
      items: eventData.items.map(item => ({
        productId: item.productId,
        productName: item.productName || "",
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
      })),

      // Pricing (immutable)
      subtotal: eventData.subtotal,
      shippingCost: eventData.shippingCost || 0,
      tax: eventData.tax || 0,
      discount: eventData.discount || 0,
      total: eventData.total,
      currency: eventData.currency || "CVT",

      // Payment information
      paymentMethod: eventData.paymentMethod || "wallet",

      // Shipping address (immutable)
      shippingAddress: {
        city: eventData.shippingAddress?.city || "",
        state: eventData.shippingAddress?.state || "",
        country: eventData.shippingAddress?.country || "",
        postalCode: eventData.shippingAddress?.postalCode || "",
      },

      // Blockchain metadata
      timestamp: timestamp,
      txId: txId,
      createdAt: eventData.createdAt || timestamp,
    };

    // Store order creation event on ledger
    await ctx.stub.putState(
      orderCreationEvent.eventId,
      Buffer.from(JSON.stringify(orderCreationEvent))
    );

    // Emit event
    await ctx.stub.setEvent(
      "OrderCreated",
      Buffer.from(
        JSON.stringify({
          orderId: eventData.orderId,
          orderNumber: eventData.orderNumber,
          customerId: eventData.customerId,
          sellerId: sellerId,
          total: eventData.total,
          timestamp: timestamp,
        })
      )
    );

    console.info(`✅ Order creation event recorded: ${eventData.orderNumber} (Total: ${eventData.total} ${orderCreationEvent.currency})`);
    console.info("============= END : Record Order Creation ===========");

    return JSON.stringify(orderCreationEvent);
  }

  // ========================================
  // ORDER PAYMENT EVENT
  // ========================================

  /**
   * Record order payment event
   *
   * @param {Context} ctx - Transaction context
   * @param {string} eventDataJSON - Payment event data
   * @returns {string} Payment event
   */
  async recordOrderPayment(ctx, eventDataJSON) {
    console.info("============= START : Record Order Payment ===========");

    let eventData;
    try {
      eventData = JSON.parse(eventDataJSON);
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }

    // Validate required fields
    if (!eventData.orderId) {
      throw new Error("orderId is required");
    }
    if (!eventData.amount) {
      throw new Error("payment amount is required");
    }
    if (!eventData.paymentMethod) {
      throw new Error("paymentMethod is required");
    }

    // Verify order exists
    const orderExists = await this.getOrderCreationEvent(ctx, eventData.orderId);
    if (!orderExists) {
      throw new Error(`Order ${eventData.orderId} does not exist on blockchain`);
    }

    // Get transaction metadata
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(txTimestamp.seconds.low * 1000).toISOString();
    const txId = ctx.stub.getTxID();

    // Create payment event
    const paymentEvent = {
      docType: "event",
      eventType: "ORDER_PAID",
      eventId: `${eventData.orderId}_PAID_${txTimestamp.seconds.low}`,

      orderId: eventData.orderId,
      amount: eventData.amount,
      paymentMethod: eventData.paymentMethod,
      transactionRef: eventData.transactionRef || "",
      paidBy: eventData.paidBy || eventData.customerId || "",

      timestamp: timestamp,
      txId: txId,
    };

    // Store payment event
    await ctx.stub.putState(
      paymentEvent.eventId,
      Buffer.from(JSON.stringify(paymentEvent))
    );

    // Emit event
    await ctx.stub.setEvent(
      "OrderPaid",
      Buffer.from(
        JSON.stringify({
          orderId: eventData.orderId,
          amount: eventData.amount,
          paymentMethod: eventData.paymentMethod,
          timestamp: timestamp,
        })
      )
    );

    console.info(`✅ Order payment event recorded: ${eventData.orderId} (Amount: ${eventData.amount})`);
    console.info("============= END : Record Order Payment ===========");

    return JSON.stringify(paymentEvent);
  }

  // ========================================
  // ORDER STATUS CHANGE EVENT
  // ========================================

  /**
   * Record order status change event
   *
   * This is the KEY method for tracking order lifecycle:
   * - pending → confirmed → shipped → delivered
   *
   * Each status change is a NEW EVENT (not an update)
   *
   * @param {Context} ctx - Transaction context
   * @param {string} eventDataJSON - Status change event data
   * @returns {string} Status change event
   */
  async recordOrderStatusChange(ctx, eventDataJSON) {
    console.info("============= START : Record Order Status Change ===========");

    let eventData;
    try {
      eventData = JSON.parse(eventDataJSON);
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }

    // Validate required fields
    if (!eventData.orderId) {
      throw new Error("orderId is required");
    }
    if (!eventData.newStatus) {
      throw new Error("newStatus is required");
    }
    if (!eventData.changedBy) {
      throw new Error("changedBy (user ID) is required");
    }

    // Verify order exists
    const orderExists = await this.getOrderCreationEvent(ctx, eventData.orderId);
    if (!orderExists) {
      throw new Error(`Order ${eventData.orderId} does not exist on blockchain`);
    }

    // Validate status
    const validStatuses = [
      "pending", "confirmed", "processing", "shipped",
      "out_for_delivery", "delivered", "cancelled", "returned"
    ];
    if (!validStatuses.includes(eventData.newStatus)) {
      throw new Error(
        `Invalid status: ${eventData.newStatus}. Valid statuses are: ${validStatuses.join(", ")}`
      );
    }

    // Get transaction metadata
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(txTimestamp.seconds.low * 1000).toISOString();
    const txId = ctx.stub.getTxID();

    // Create status change event (SMALL EVENT, NOT FULL ORDER)
    const statusChangeEvent = {
      docType: "event",
      eventType: "ORDER_STATUS_CHANGED",
      eventId: `${eventData.orderId}_STATUS_${txTimestamp.seconds.low}`,

      orderId: eventData.orderId,
      oldStatus: eventData.oldStatus || "",
      newStatus: eventData.newStatus,
      changedBy: eventData.changedBy,
      changedByRole: eventData.changedByRole || "vendor",

      // Optional metadata for specific status changes
      trackingNumber: eventData.trackingNumber || null,
      courier: eventData.courier || null,
      location: eventData.location || "",
      notes: eventData.notes || "",

      timestamp: timestamp,
      txId: txId,
    };

    // Store status change event
    await ctx.stub.putState(
      statusChangeEvent.eventId,
      Buffer.from(JSON.stringify(statusChangeEvent))
    );

    // Emit event
    await ctx.stub.setEvent(
      "OrderStatusChanged",
      Buffer.from(
        JSON.stringify({
          orderId: eventData.orderId,
          oldStatus: eventData.oldStatus,
          newStatus: eventData.newStatus,
          timestamp: timestamp,
        })
      )
    );

    console.info(`✅ Order status change event recorded: ${eventData.orderId} (${eventData.oldStatus || 'unknown'} → ${eventData.newStatus})`);
    console.info("============= END : Record Order Status Change ===========");

    return JSON.stringify(statusChangeEvent);
  }

  // ========================================
  // ORDER CANCELLATION EVENT
  // ========================================

  /**
   * Record order cancellation event
   *
   * @param {Context} ctx - Transaction context
   * @param {string} eventDataJSON - Cancellation event data
   * @returns {string} Cancellation event
   */
  async recordOrderCancellation(ctx, eventDataJSON) {
    console.info("============= START : Record Order Cancellation ===========");

    let eventData;
    try {
      eventData = JSON.parse(eventDataJSON);
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }

    // Validate required fields
    if (!eventData.orderId) {
      throw new Error("orderId is required");
    }
    if (!eventData.cancelledBy) {
      throw new Error("cancelledBy is required");
    }
    if (!eventData.reason) {
      throw new Error("cancellation reason is required");
    }

    // Verify order exists
    const orderExists = await this.getOrderCreationEvent(ctx, eventData.orderId);
    if (!orderExists) {
      throw new Error(`Order ${eventData.orderId} does not exist on blockchain`);
    }

    // Get transaction metadata
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(txTimestamp.seconds.low * 1000).toISOString();
    const txId = ctx.stub.getTxID();

    // Create cancellation event
    const cancellationEvent = {
      docType: "event",
      eventType: "ORDER_CANCELLED",
      eventId: `${eventData.orderId}_CANCELLED_${txTimestamp.seconds.low}`,

      orderId: eventData.orderId,
      cancelledBy: eventData.cancelledBy,
      cancelledByRole: eventData.cancelledByRole || "customer",
      reason: eventData.reason,
      refundAmount: eventData.refundAmount || 0,
      refundStatus: eventData.refundStatus || "pending",

      timestamp: timestamp,
      txId: txId,
    };

    // Store cancellation event
    await ctx.stub.putState(
      cancellationEvent.eventId,
      Buffer.from(JSON.stringify(cancellationEvent))
    );

    // Emit event
    await ctx.stub.setEvent(
      "OrderCancelled",
      Buffer.from(
        JSON.stringify({
          orderId: eventData.orderId,
          reason: eventData.reason,
          timestamp: timestamp,
        })
      )
    );

    console.info(`✅ Order cancellation event recorded: ${eventData.orderId} (Reason: ${eventData.reason})`);
    console.info("============= END : Record Order Cancellation ===========");

    return JSON.stringify(cancellationEvent);
  }

  // ========================================
  // QUERY FUNCTIONS
  // ========================================

  /**
   * Get order creation event
   *
   * @param {Context} ctx - Transaction context
   * @param {string} orderId - Order ID
   * @returns {object|null} Order creation event or null
   */
  async getOrderCreationEvent(ctx, orderId) {
    const queryString = {
      selector: {
        docType: "event",
        eventType: "ORDER_CREATED",
        orderId: orderId,
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
   * Get complete order event history (ALL EVENTS)
   *
   * Returns creation, payment, all status changes, cancellation, etc.
   *
   * @param {Context} ctx - Transaction context
   * @param {string} orderId - Order ID
   * @returns {string} Array of all order events in chronological order
   */
  async getOrderEventHistory(ctx, orderId) {
    console.info(`============= START : Get Order Event History for ${orderId} ===========`);

    const queryString = {
      selector: {
        docType: "event",
        orderId: orderId,
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

    console.info(`✅ Retrieved ${allResults.length} events for order ${orderId}`);
    console.info("============= END : Get Order Event History ===========");

    return JSON.stringify(allResults);
  }

  /**
   * Query orders by customer
   *
   * @param {Context} ctx - Transaction context
   * @param {string} customerId - Customer ID
   * @returns {string} Array of order creation events
   */
  async queryOrdersByCustomer(ctx, customerId) {
    console.info(`============= START : Query Orders By Customer ${customerId} ===========`);

    const queryString = {
      selector: {
        docType: "event",
        eventType: "ORDER_CREATED",
        customerId: customerId,
      },
      sort: [{ timestamp: "desc" }],
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

    console.info(`✅ Found ${allResults.length} orders for customer ${customerId}`);
    console.info("============= END : Query Orders By Customer ===========");

    return JSON.stringify(allResults);
  }

  /**
   * Query orders by seller/vendor
   *
   * @param {Context} ctx - Transaction context
   * @param {string} sellerId - Seller/Vendor ID
   * @returns {string} Array of order creation events
   */
  async queryOrdersBySeller(ctx, sellerId) {
    console.info(`============= START : Query Orders By Seller ${sellerId} ===========`);

    const queryString = {
      selector: {
        docType: "event",
        eventType: "ORDER_CREATED",
        sellerId: sellerId,
      },
      sort: [{ timestamp: "desc" }],
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

    console.info(`✅ Found ${allResults.length} orders for seller ${sellerId}`);
    console.info("============= END : Query Orders By Seller ===========");

    return JSON.stringify(allResults);
  }

  /**
   * Get all orders (creation events)
   *
   * @param {Context} ctx - Transaction context
   * @returns {string} Array of all order creation events
   */
  async getAllOrders(ctx) {
    console.info("============= START : Get All Orders ===========");

    const queryString = {
      selector: {
        docType: "event",
        eventType: "ORDER_CREATED",
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

    console.info(`✅ Retrieved ${allResults.length} orders`);
    console.info("============= END : Get All Orders ===========");

    return JSON.stringify(allResults);
  }

  /**
   * Check if order exists
   *
   * @param {Context} ctx - Transaction context
   * @param {string} orderId - Order ID
   * @returns {boolean} True if order exists
   */
  async orderExists(ctx, orderId) {
    const creationEvent = await this.getOrderCreationEvent(ctx, orderId);
    return creationEvent !== null;
  }

  // ========================================
  // DEPRECATED METHODS (for backward compatibility)
  // ========================================

  /**
   * @deprecated Use getOrderEventHistory instead
   */
  async readOrder(ctx, orderId) {
    console.warn("⚠️ readOrder() is deprecated. Use getOrderEventHistory() instead.");
    const creationEvent = await this.getOrderCreationEvent(ctx, orderId);
    if (!creationEvent) {
      throw new Error(`Order ${orderId} does not exist`);
    }
    return JSON.stringify(creationEvent);
  }

  /**
   * @deprecated Use recordOrderCreation instead
   */
  async createOrder(ctx, orderData) {
    throw new Error("createOrder() is deprecated. Use recordOrderCreation() instead.");
  }

  /**
   * @deprecated Use recordOrderStatusChange instead
   */
  async updateOrderStatus(ctx, orderId, updateData) {
    throw new Error("updateOrderStatus() is deprecated. Use recordOrderStatusChange() instead.");
  }

  /**
   * @deprecated Use recordOrderCancellation instead
   */
  async cancelOrder(ctx, orderId, cancellationData) {
    throw new Error("cancelOrder() is deprecated. Use recordOrderCancellation() instead.");
  }

  /**
   * @deprecated Use getOrderEventHistory instead
   */
  async getOrderHistory(ctx, orderId) {
    console.warn("⚠️ getOrderHistory() is deprecated. Use getOrderEventHistory() instead.");
    return await this.getOrderEventHistory(ctx, orderId);
  }

  /**
   * @deprecated Ownership transfer is now in ProductContract
   */
  async recordOwnershipTransfer(ctx, orderId, transferData) {
    throw new Error("recordOwnershipTransfer() is deprecated. Use ProductContract.recordOwnershipTransfer() instead.");
  }

  /**
   * @deprecated Query by status is inefficient with event-sourcing (query MongoDB instead)
   */
  async queryOrdersByStatus(ctx, status) {
    throw new Error("queryOrdersByStatus() is deprecated. Query current status from MongoDB, not blockchain. Blockchain stores event history, not current state.");
  }

  // ========================================
  // BLOCKCHAIN LOGGING (for backward compatibility)
  // ========================================

  /**
   * Create a generic log entry on blockchain
   * (Used by legacy logging system)
   *
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
