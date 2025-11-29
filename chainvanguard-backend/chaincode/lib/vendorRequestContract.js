/* eslint-disable @typescript-eslint/no-require-imports */
const { Contract } = require("fabric-contract-api");

/**
 * VendorRequestContract - Event-Based Vendor Request Management
 *
 * This contract uses event-sourcing pattern for B2B vendor-supplier transactions.
 * MongoDB stores current state, blockchain stores complete workflow history.
 *
 * Events Stored:
 * - REQUEST_CREATED: Vendor creates purchase request to supplier
 * - REQUEST_APPROVED: Supplier approves the request
 * - REQUEST_REJECTED: Supplier rejects the request
 * - REQUEST_PAID: Vendor pays for the approved request (IMPORTANT!)
 * - REQUEST_COMPLETED: Request fulfilled and locked
 * - REQUEST_CANCELLED: Request cancelled
 *
 * NOT Stored on Blockchain:
 * - Internal notes updates (mutable)
 * - Estimated delivery dates (can change)
 */
class VendorRequestContract extends Contract {

  // ========================================
  // INITIALIZATION
  // ========================================

  /**
   * Initialize vendor request ledger
   */
  async initLedger(ctx) {
    console.info("============= START : Initialize Vendor Request Ledger ===========");
    console.info("Vendor Request ledger initialized for event-based storage");
    console.info("============= END : Initialize Vendor Request Ledger ===========");
    return JSON.stringify({
      message: "Vendor Request ledger initialized successfully (event-based)",
    });
  }

  // ========================================
  // REQUEST CREATION EVENT
  // ========================================

  /**
   * Record vendor request creation event (IMMUTABLE SNAPSHOT)
   *
   * Stores immutable data:
   * - requestId, requestNumber
   * - vendorId, supplierId
   * - items (snapshot at request time)
   * - pricing (subtotal, tax, total)
   * - createdAt timestamp
   *
   * Does NOT store:
   * - Current status (mutable - tracked via events)
   * - Notes updates (mutable)
   *
   * @param {Context} ctx - Transaction context
   * @param {string} eventDataJSON - Request creation event data
   * @returns {string} Request creation event
   */
  async recordVendorRequestCreation(ctx, eventDataJSON) {
    console.info("============= START : Record Vendor Request Creation ===========");

    let eventData;
    try {
      eventData = JSON.parse(eventDataJSON);
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }

    // Validate required fields
    if (!eventData.requestId) {
      throw new Error("requestId is required");
    }
    if (!eventData.requestNumber) {
      throw new Error("requestNumber is required");
    }
    if (!eventData.vendorId) {
      throw new Error("vendorId is required");
    }
    if (!eventData.supplierId) {
      throw new Error("supplierId is required");
    }
    if (!eventData.items || eventData.items.length === 0) {
      throw new Error("Request must contain at least one item");
    }

    // Check if request already exists
    const existingRequest = await this.getRequestCreationEvent(ctx, eventData.requestId);
    if (existingRequest) {
      throw new Error(`Vendor request ${eventData.requestId} already exists on blockchain`);
    }

    // Get transaction metadata
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(txTimestamp.seconds.low * 1000).toISOString();
    const txId = ctx.stub.getTxID();

    // Create request creation event (IMMUTABLE SNAPSHOT)
    const requestCreationEvent = {
      docType: "event",
      eventType: "REQUEST_CREATED",
      eventId: `${eventData.requestId}_CREATED_${txTimestamp.seconds.low}`,

      // Request identification
      requestId: eventData.requestId,
      requestNumber: eventData.requestNumber,

      // Parties involved
      vendorId: eventData.vendorId,
      vendorName: eventData.vendorName || "",
      vendorWalletAddress: eventData.vendorWalletAddress || "",

      supplierId: eventData.supplierId,
      supplierName: eventData.supplierName || "",
      supplierWalletAddress: eventData.supplierWalletAddress || "",

      // Items snapshot (immutable)
      items: eventData.items.map(item => ({
        inventoryId: item.inventoryId,
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit,
        subtotal: item.subtotal,
      })),

      // Pricing (immutable)
      subtotal: eventData.subtotal,
      tax: eventData.tax || 0,
      total: eventData.total,
      currency: eventData.currency || "CVT",

      // Initial status
      initialStatus: eventData.status || "pending",
      autoApproved: eventData.autoApproved || false,

      // Blockchain metadata
      timestamp: timestamp,
      txId: txId,
      createdAt: eventData.createdAt || timestamp,
    };

    // Store request creation event on ledger
    await ctx.stub.putState(
      requestCreationEvent.eventId,
      Buffer.from(JSON.stringify(requestCreationEvent))
    );

    // Emit event
    await ctx.stub.setEvent(
      "VendorRequestCreated",
      Buffer.from(
        JSON.stringify({
          requestId: eventData.requestId,
          requestNumber: eventData.requestNumber,
          vendorId: eventData.vendorId,
          supplierId: eventData.supplierId,
          total: eventData.total,
          timestamp: timestamp,
        })
      )
    );

    console.info(`✅ Vendor request creation event recorded: ${eventData.requestNumber} (Total: ${eventData.total} ${requestCreationEvent.currency})`);
    console.info("============= END : Record Vendor Request Creation ===========");

    return JSON.stringify(requestCreationEvent);
  }

  // ========================================
  // REQUEST APPROVAL EVENT
  // ========================================

  /**
   * Record vendor request approval event (by supplier)
   *
   * @param {Context} ctx - Transaction context
   * @param {string} eventDataJSON - Approval event data
   * @returns {string} Approval event
   */
  async recordVendorRequestApproval(ctx, eventDataJSON) {
    console.info("============= START : Record Vendor Request Approval ===========");

    let eventData;
    try {
      eventData = JSON.parse(eventDataJSON);
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }

    // Validate required fields
    if (!eventData.requestId) {
      throw new Error("requestId is required");
    }
    if (!eventData.approvedBy) {
      throw new Error("approvedBy (supplier ID) is required");
    }

    // Verify request exists
    const requestExists = await this.getRequestCreationEvent(ctx, eventData.requestId);
    if (!requestExists) {
      throw new Error(`Vendor request ${eventData.requestId} does not exist on blockchain`);
    }

    // Get transaction metadata
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(txTimestamp.seconds.low * 1000).toISOString();
    const txId = ctx.stub.getTxID();

    // Create approval event
    const approvalEvent = {
      docType: "event",
      eventType: "REQUEST_APPROVED",
      eventId: `${eventData.requestId}_APPROVED_${txTimestamp.seconds.low}`,

      requestId: eventData.requestId,
      approvedBy: eventData.approvedBy,
      supplierNotes: eventData.supplierNotes || "",
      autoApproved: eventData.autoApproved || false,

      timestamp: timestamp,
      txId: txId,
    };

    // Store approval event
    await ctx.stub.putState(
      approvalEvent.eventId,
      Buffer.from(JSON.stringify(approvalEvent))
    );

    // Emit event
    await ctx.stub.setEvent(
      "VendorRequestApproved",
      Buffer.from(
        JSON.stringify({
          requestId: eventData.requestId,
          approvedBy: eventData.approvedBy,
          timestamp: timestamp,
        })
      )
    );

    console.info(`✅ Vendor request approval event recorded: ${eventData.requestId}`);
    console.info("============= END : Record Vendor Request Approval ===========");

    return JSON.stringify(approvalEvent);
  }

  // ========================================
  // REQUEST REJECTION EVENT
  // ========================================

  /**
   * Record vendor request rejection event (by supplier)
   *
   * @param {Context} ctx - Transaction context
   * @param {string} eventDataJSON - Rejection event data
   * @returns {string} Rejection event
   */
  async recordVendorRequestRejection(ctx, eventDataJSON) {
    console.info("============= START : Record Vendor Request Rejection ===========");

    let eventData;
    try {
      eventData = JSON.parse(eventDataJSON);
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }

    // Validate required fields
    if (!eventData.requestId) {
      throw new Error("requestId is required");
    }
    if (!eventData.rejectedBy) {
      throw new Error("rejectedBy (supplier ID) is required");
    }
    if (!eventData.reason) {
      throw new Error("rejection reason is required");
    }

    // Verify request exists
    const requestExists = await this.getRequestCreationEvent(ctx, eventData.requestId);
    if (!requestExists) {
      throw new Error(`Vendor request ${eventData.requestId} does not exist on blockchain`);
    }

    // Get transaction metadata
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(txTimestamp.seconds.low * 1000).toISOString();
    const txId = ctx.stub.getTxID();

    // Create rejection event
    const rejectionEvent = {
      docType: "event",
      eventType: "REQUEST_REJECTED",
      eventId: `${eventData.requestId}_REJECTED_${txTimestamp.seconds.low}`,

      requestId: eventData.requestId,
      rejectedBy: eventData.rejectedBy,
      reason: eventData.reason,

      timestamp: timestamp,
      txId: txId,
    };

    // Store rejection event
    await ctx.stub.putState(
      rejectionEvent.eventId,
      Buffer.from(JSON.stringify(rejectionEvent))
    );

    // Emit event
    await ctx.stub.setEvent(
      "VendorRequestRejected",
      Buffer.from(
        JSON.stringify({
          requestId: eventData.requestId,
          rejectedBy: eventData.rejectedBy,
          reason: eventData.reason,
          timestamp: timestamp,
        })
      )
    );

    console.info(`✅ Vendor request rejection event recorded: ${eventData.requestId} (Reason: ${eventData.reason})`);
    console.info("============= END : Record Vendor Request Rejection ===========");

    return JSON.stringify(rejectionEvent);
  }

  // ========================================
  // REQUEST PAYMENT EVENT (CRITICAL!)
  // ========================================

  /**
   * Record vendor request payment event
   *
   * THIS IS THE CRITICAL EVENT THAT ANSWERS YOUR QUESTION!
   *
   * When vendor pays for an approved request:
   * - Records payment amount
   * - Links to created order
   * - Captures payment method
   * - Timestamps the payment
   *
   * This creates an immutable financial audit trail.
   *
   * @param {Context} ctx - Transaction context
   * @param {string} eventDataJSON - Payment event data
   * @returns {string} Payment event
   */
  async recordVendorRequestPayment(ctx, eventDataJSON) {
    console.info("============= START : Record Vendor Request Payment ===========");

    let eventData;
    try {
      eventData = JSON.parse(eventDataJSON);
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }

    // Validate required fields
    if (!eventData.requestId) {
      throw new Error("requestId is required");
    }
    if (!eventData.vendorId) {
      throw new Error("vendorId is required");
    }
    if (!eventData.amount) {
      throw new Error("payment amount is required");
    }
    if (!eventData.orderId) {
      throw new Error("orderId (created from payment) is required");
    }

    // Verify request exists
    const requestExists = await this.getRequestCreationEvent(ctx, eventData.requestId);
    if (!requestExists) {
      throw new Error(`Vendor request ${eventData.requestId} does not exist on blockchain`);
    }

    // Get transaction metadata
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(txTimestamp.seconds.low * 1000).toISOString();
    const txId = ctx.stub.getTxID();

    // Create payment event (IMMUTABLE FINANCIAL RECORD)
    const paymentEvent = {
      docType: "event",
      eventType: "REQUEST_PAID",
      eventId: `${eventData.requestId}_PAID_${txTimestamp.seconds.low}`,

      // Request and payment details
      requestId: eventData.requestId,
      vendorId: eventData.vendorId,
      supplierId: eventData.supplierId,

      // Payment information
      amount: eventData.amount,
      paymentMethod: eventData.paymentMethod || "wallet",
      orderId: eventData.orderId,  // Link to created order

      // Optional payment metadata
      transactionRef: eventData.transactionRef || "",
      walletTxId: eventData.walletTxId || "",

      // Blockchain metadata
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
      "VendorRequestPaid",
      Buffer.from(
        JSON.stringify({
          requestId: eventData.requestId,
          vendorId: eventData.vendorId,
          amount: eventData.amount,
          orderId: eventData.orderId,
          timestamp: timestamp,
        })
      )
    );

    console.info(`✅ Vendor request payment event recorded: ${eventData.requestId} (Amount: ${eventData.amount}, Order: ${eventData.orderId})`);
    console.info("============= END : Record Vendor Request Payment ===========");

    return JSON.stringify(paymentEvent);
  }

  // ========================================
  // REQUEST COMPLETION EVENT
  // ========================================

  /**
   * Record vendor request completion event (locks the request)
   *
   * @param {Context} ctx - Transaction context
   * @param {string} eventDataJSON - Completion event data
   * @returns {string} Completion event
   */
  async recordVendorRequestCompletion(ctx, eventDataJSON) {
    console.info("============= START : Record Vendor Request Completion ===========");

    let eventData;
    try {
      eventData = JSON.parse(eventDataJSON);
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }

    // Validate required fields
    if (!eventData.requestId) {
      throw new Error("requestId is required");
    }
    if (!eventData.completedBy) {
      throw new Error("completedBy (supplier ID) is required");
    }

    // Verify request exists
    const requestExists = await this.getRequestCreationEvent(ctx, eventData.requestId);
    if (!requestExists) {
      throw new Error(`Vendor request ${eventData.requestId} does not exist on blockchain`);
    }

    // Get transaction metadata
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(txTimestamp.seconds.low * 1000).toISOString();
    const txId = ctx.stub.getTxID();

    // Create completion event (FINAL EVENT - LOCKS REQUEST)
    const completionEvent = {
      docType: "event",
      eventType: "REQUEST_COMPLETED",
      eventId: `${eventData.requestId}_COMPLETED_${txTimestamp.seconds.low}`,

      requestId: eventData.requestId,
      completedBy: eventData.completedBy,
      notes: eventData.notes || "",
      locked: true,  // Marks request as immutable

      timestamp: timestamp,
      txId: txId,
    };

    // Store completion event
    await ctx.stub.putState(
      completionEvent.eventId,
      Buffer.from(JSON.stringify(completionEvent))
    );

    // Emit event
    await ctx.stub.setEvent(
      "VendorRequestCompleted",
      Buffer.from(
        JSON.stringify({
          requestId: eventData.requestId,
          completedBy: eventData.completedBy,
          locked: true,
          timestamp: timestamp,
        })
      )
    );

    console.info(`✅ Vendor request completion event recorded: ${eventData.requestId} (LOCKED)`);
    console.info("============= END : Record Vendor Request Completion ===========");

    return JSON.stringify(completionEvent);
  }

  // ========================================
  // REQUEST CANCELLATION EVENT
  // ========================================

  /**
   * Record vendor request cancellation event
   *
   * @param {Context} ctx - Transaction context
   * @param {string} eventDataJSON - Cancellation event data
   * @returns {string} Cancellation event
   */
  async recordVendorRequestCancellation(ctx, eventDataJSON) {
    console.info("============= START : Record Vendor Request Cancellation ===========");

    let eventData;
    try {
      eventData = JSON.parse(eventDataJSON);
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }

    // Validate required fields
    if (!eventData.requestId) {
      throw new Error("requestId is required");
    }
    if (!eventData.cancelledBy) {
      throw new Error("cancelledBy is required");
    }
    if (!eventData.reason) {
      throw new Error("cancellation reason is required");
    }

    // Verify request exists
    const requestExists = await this.getRequestCreationEvent(ctx, eventData.requestId);
    if (!requestExists) {
      throw new Error(`Vendor request ${eventData.requestId} does not exist on blockchain`);
    }

    // Get transaction metadata
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(txTimestamp.seconds.low * 1000).toISOString();
    const txId = ctx.stub.getTxID();

    // Create cancellation event
    const cancellationEvent = {
      docType: "event",
      eventType: "REQUEST_CANCELLED",
      eventId: `${eventData.requestId}_CANCELLED_${txTimestamp.seconds.low}`,

      requestId: eventData.requestId,
      cancelledBy: eventData.cancelledBy,
      cancelledByRole: eventData.cancelledByRole || "vendor",
      reason: eventData.reason,

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
      "VendorRequestCancelled",
      Buffer.from(
        JSON.stringify({
          requestId: eventData.requestId,
          cancelledBy: eventData.cancelledBy,
          reason: eventData.reason,
          timestamp: timestamp,
        })
      )
    );

    console.info(`✅ Vendor request cancellation event recorded: ${eventData.requestId} (Reason: ${eventData.reason})`);
    console.info("============= END : Record Vendor Request Cancellation ===========");

    return JSON.stringify(cancellationEvent);
  }

  // ========================================
  // QUERY FUNCTIONS
  // ========================================

  /**
   * Get request creation event
   *
   * @param {Context} ctx - Transaction context
   * @param {string} requestId - Request ID
   * @returns {object|null} Request creation event or null
   */
  async getRequestCreationEvent(ctx, requestId) {
    const queryString = {
      selector: {
        docType: "event",
        eventType: "REQUEST_CREATED",
        requestId: requestId,
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
   * Get complete request event history (ALL EVENTS)
   *
   * Returns creation, approval, payment, completion, etc.
   *
   * @param {Context} ctx - Transaction context
   * @param {string} requestId - Request ID
   * @returns {string} Array of all request events in chronological order
   */
  async getRequestEventHistory(ctx, requestId) {
    console.info(`============= START : Get Request Event History for ${requestId} ===========`);

    const queryString = {
      selector: {
        docType: "event",
        requestId: requestId,
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

    console.info(`✅ Retrieved ${allResults.length} events for request ${requestId}`);
    console.info("============= END : Get Request Event History ===========");

    return JSON.stringify(allResults);
  }

  /**
   * Query requests by vendor
   *
   * @param {Context} ctx - Transaction context
   * @param {string} vendorId - Vendor ID
   * @returns {string} Array of request creation events
   */
  async queryRequestsByVendor(ctx, vendorId) {
    console.info(`============= START : Query Requests By Vendor ${vendorId} ===========`);

    const queryString = {
      selector: {
        docType: "event",
        eventType: "REQUEST_CREATED",
        vendorId: vendorId,
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

    console.info(`✅ Found ${allResults.length} requests for vendor ${vendorId}`);
    console.info("============= END : Query Requests By Vendor ===========");

    return JSON.stringify(allResults);
  }

  /**
   * Query requests by supplier
   *
   * @param {Context} ctx - Transaction context
   * @param {string} supplierId - Supplier ID
   * @returns {string} Array of request creation events
   */
  async queryRequestsBySupplier(ctx, supplierId) {
    console.info(`============= START : Query Requests By Supplier ${supplierId} ===========`);

    const queryString = {
      selector: {
        docType: "event",
        eventType: "REQUEST_CREATED",
        supplierId: supplierId,
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

    console.info(`✅ Found ${allResults.length} requests for supplier ${supplierId}`);
    console.info("============= END : Query Requests By Supplier ===========");

    return JSON.stringify(allResults);
  }

  /**
   * Get all requests (creation events)
   *
   * @param {Context} ctx - Transaction context
   * @returns {string} Array of all request creation events
   */
  async getAllRequests(ctx) {
    console.info("============= START : Get All Requests ===========");

    const queryString = {
      selector: {
        docType: "event",
        eventType: "REQUEST_CREATED",
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

    console.info(`✅ Retrieved ${allResults.length} requests`);
    console.info("============= END : Get All Requests ===========");

    return JSON.stringify(allResults);
  }

  /**
   * Check if request exists
   *
   * @param {Context} ctx - Transaction context
   * @param {string} requestId - Request ID
   * @returns {boolean} True if request exists
   */
  async requestExists(ctx, requestId) {
    const creationEvent = await this.getRequestCreationEvent(ctx, requestId);
    return creationEvent !== null;
  }

  // ========================================
  // DEPRECATED METHODS (for backward compatibility)
  // ========================================

  /**
   * @deprecated Use recordVendorRequestCreation instead
   */
  async createVendorRequest(ctx, vendorRequestDataJson) {
    throw new Error("createVendorRequest() is deprecated. Use recordVendorRequestCreation() instead.");
  }

  /**
   * @deprecated Use recordVendorRequestApproval instead
   */
  async approveVendorRequest(ctx, requestId, supplierId, timestamp, notes) {
    throw new Error("approveVendorRequest() is deprecated. Use recordVendorRequestApproval() instead.");
  }

  /**
   * @deprecated Use recordVendorRequestRejection instead
   */
  async rejectVendorRequest(ctx, requestId, supplierId, timestamp, reason) {
    throw new Error("rejectVendorRequest() is deprecated. Use recordVendorRequestRejection() instead.");
  }

  /**
   * @deprecated Use recordVendorRequestCancellation instead
   */
  async cancelVendorRequest(ctx, requestId, vendorId, timestamp, reason) {
    throw new Error("cancelVendorRequest() is deprecated. Use recordVendorRequestCancellation() instead.");
  }

  /**
   * @deprecated Use recordVendorRequestCompletion instead
   */
  async completeVendorRequest(ctx, requestId, supplierId, timestamp, notes) {
    throw new Error("completeVendorRequest() is deprecated. Use recordVendorRequestCompletion() instead.");
  }

  /**
   * @deprecated Use getRequestEventHistory instead
   */
  async getVendorRequest(ctx, requestId) {
    console.warn("⚠️ getVendorRequest() is deprecated. Use getRequestEventHistory() instead.");
    const creationEvent = await this.getRequestCreationEvent(ctx, requestId);
    if (!creationEvent) {
      throw new Error(`Vendor request ${requestId} does not exist`);
    }
    return JSON.stringify(creationEvent);
  }

  /**
   * @deprecated Use getRequestEventHistory instead
   */
  async getVendorRequestHistory(ctx, requestId) {
    console.warn("⚠️ getVendorRequestHistory() is deprecated. Use getRequestEventHistory() instead.");
    return await this.getRequestEventHistory(ctx, requestId);
  }

  /**
   * @deprecated Status updates are now separate events
   */
  async updateVendorRequestStatus(ctx, requestId, status, supplierId, timestamp, notes) {
    throw new Error("updateVendorRequestStatus() is deprecated. Use specific event methods: recordVendorRequestApproval(), recordVendorRequestRejection(), etc.");
  }
}

module.exports = VendorRequestContract;
