/* eslint-disable @typescript-eslint/no-require-imports */
const { Contract } = require("fabric-contract-api");

/**
 * ============================================
 * VENDOR REQUEST SMART CONTRACT
 * Manages vendor requests/transactions on blockchain
 * ============================================
 */
class VendorRequestContract extends Contract {
  constructor() {
    super("vendorRequest");
  }

  /**
   * Initialize the ledger with empty state
   */
  async initLedger(ctx) {
    console.log("Vendor Request Contract initialized");
    return JSON.stringify({ message: "Vendor Request ledger initialized" });
  }

  /**
   * Create a new vendor request on blockchain
   */
  async createVendorRequest(ctx, vendorRequestDataJson) {
    try {
      const requestData = JSON.parse(vendorRequestDataJson);

      // Validate required fields
      if (
        !requestData.requestId ||
        !requestData.requestNumber ||
        !requestData.vendorId ||
        !requestData.supplierId
      ) {
        throw new Error("Missing required vendor request fields");
      }

      // Check if request already exists
      const existingData = await ctx.stub.getState(requestData.requestId);
      if (existingData && existingData.length > 0) {
        throw new Error(
          `Vendor request ${requestData.requestId} already exists`
        );
      }

      // Create vendor request record
      const vendorRequest = {
        requestId: requestData.requestId,
        requestNumber: requestData.requestNumber,
        vendorId: requestData.vendorId,
        vendorName: requestData.vendorName || "",
        supplierId: requestData.supplierId,
        supplierName: requestData.supplierName || "",
        items: requestData.items || [],
        subtotal: requestData.subtotal || 0,
        tax: requestData.tax || 0,
        total: requestData.total || 0,
        status: requestData.status || "pending",
        vendorNotes: requestData.vendorNotes || "",
        supplierNotes: requestData.supplierNotes || "",
        autoApproved: requestData.autoApproved || false,
        statusHistory: [
          {
            status: requestData.status || "pending",
            timestamp: requestData.timestamp || new Date().toISOString(),
            changedBy: requestData.vendorId,
            notes: "Request created",
          },
        ],
        createdAt: requestData.timestamp || new Date().toISOString(),
        updatedAt: requestData.timestamp || new Date().toISOString(),
        reviewedAt: requestData.reviewedAt || null,
        isCompleted: false,
        isLocked: false,
        docType: "vendorRequest",
      };

      // Store on ledger
      await ctx.stub.putState(
        requestData.requestId,
        Buffer.from(JSON.stringify(vendorRequest))
      );

      // Create composite key for querying by supplier
      const supplierIndexKey = ctx.stub.createCompositeKey(
        "supplier~vendorRequest",
        [requestData.supplierId, requestData.requestId]
      );
      await ctx.stub.putState(supplierIndexKey, Buffer.from("\u0000"));

      // Create composite key for querying by vendor
      const vendorIndexKey = ctx.stub.createCompositeKey(
        "vendor~vendorRequest",
        [requestData.vendorId, requestData.requestId]
      );
      await ctx.stub.putState(vendorIndexKey, Buffer.from("\u0000"));

      // Emit event
      ctx.stub.setEvent(
        "VendorRequestCreated",
        Buffer.from(vendorRequestDataJson)
      );

      console.log(
        `Vendor request created: ${requestData.requestId} by vendor ${requestData.vendorId}`
      );

      return JSON.stringify({
        success: true,
        message: "Vendor request created on blockchain",
        requestId: requestData.requestId,
        txId: ctx.stub.getTxID(),
      });
    } catch (error) {
      console.error("Error creating vendor request:", error);
      throw new Error(`Failed to create vendor request: ${error.message}`);
    }
  }

  /**
   * Approve a vendor request
   */
  async approveVendorRequest(ctx, requestId, approverId, timestamp) {
    const notes = ""; // Notes handled internally
    try {
      // Get existing request
      const requestBytes = await ctx.stub.getState(requestId);
      if (!requestBytes || requestBytes.length === 0) {
        throw new Error(`Vendor request ${requestId} not found`);
      }

      const request = JSON.parse(requestBytes.toString());

      // Check if locked
      if (request.isLocked) {
        throw new Error("Cannot modify locked request");
      }

      // Check current status
      if (request.status !== "pending") {
        throw new Error(
          `Cannot approve request with status: ${request.status}`
        );
      }

      // Update request
      request.status = "approved";
      request.reviewedAt = timestamp || new Date().toISOString();
      request.reviewedBy = approverId;
      request.supplierNotes = notes;
      request.updatedAt = timestamp || new Date().toISOString();

      // Add to status history
      request.statusHistory.push({
        status: "approved",
        timestamp: timestamp || new Date().toISOString(),
        changedBy: approverId,
        notes: notes || "Request approved",
      });

      // Save updated request
      await ctx.stub.putState(requestId, Buffer.from(JSON.stringify(request)));

      // Emit event
      ctx.stub.setEvent(
        "VendorRequestApproved",
        Buffer.from(
          JSON.stringify({
            requestId: requestId,
            approvedBy: approverId,
            timestamp: timestamp,
          })
        )
      );

      console.log(`Vendor request ${requestId} approved by ${approverId}`);

      return JSON.stringify({
        success: true,
        message: "Vendor request approved",
        requestId: requestId,
        txId: ctx.stub.getTxID(),
      });
    } catch (error) {
      console.error("Error approving vendor request:", error);
      throw new Error(`Failed to approve vendor request: ${error.message}`);
    }
  }

  /**
   * Reject a vendor request
   */
  async rejectVendorRequest(ctx, requestId, rejecterId, timestamp) {
    const reason = ""; // Reason handled internally
    try {
      // Get existing request
      const requestBytes = await ctx.stub.getState(requestId);
      if (!requestBytes || requestBytes.length === 0) {
        throw new Error(`Vendor request ${requestId} not found`);
      }

      const request = JSON.parse(requestBytes.toString());

      // Check if locked
      if (request.isLocked) {
        throw new Error("Cannot modify locked request");
      }

      // Check current status
      if (request.status !== "pending") {
        throw new Error(`Cannot reject request with status: ${request.status}`);
      }

      if (!reason || reason.trim() === "") {
        throw new Error("Rejection reason is required");
      }

      // Update request
      request.status = "rejected";
      request.reviewedAt = timestamp || new Date().toISOString();
      request.reviewedBy = rejecterId;
      request.supplierNotes = reason;
      request.rejectionReason = reason;
      request.updatedAt = timestamp || new Date().toISOString();

      // Add to status history
      request.statusHistory.push({
        status: "rejected",
        timestamp: timestamp || new Date().toISOString(),
        changedBy: rejecterId,
        notes: reason,
      });

      // Save updated request
      await ctx.stub.putState(requestId, Buffer.from(JSON.stringify(request)));

      // Emit event
      ctx.stub.setEvent(
        "VendorRequestRejected",
        Buffer.from(
          JSON.stringify({
            requestId: requestId,
            rejectedBy: rejecterId,
            timestamp: timestamp,
            reason: reason,
          })
        )
      );

      console.log(`Vendor request ${requestId} rejected by ${rejecterId}`);

      return JSON.stringify({
        success: true,
        message: "Vendor request rejected",
        requestId: requestId,
        txId: ctx.stub.getTxID(),
      });
    } catch (error) {
      console.error("Error rejecting vendor request:", error);
      throw new Error(`Failed to reject vendor request: ${error.message}`);
    }
  }

  /**
   * Cancel a vendor request (by vendor)
   */
  async cancelVendorRequest(ctx, requestId, vendorId, timestamp) {
    const notes = ""; // Notes handled internally
    try {
      // Get existing request
      const requestBytes = await ctx.stub.getState(requestId);
      if (!requestBytes || requestBytes.length === 0) {
        throw new Error(`Vendor request ${requestId} not found`);
      }

      const request = JSON.parse(requestBytes.toString());

      // Check if locked
      if (request.isLocked) {
        throw new Error("Cannot modify locked request");
      }

      // Check if vendor owns this request
      if (request.vendorId !== vendorId) {
        throw new Error("Unauthorized - only vendor can cancel their request");
      }

      // Check current status
      if (request.status !== "pending") {
        throw new Error(`Cannot cancel request with status: ${request.status}`);
      }

      // Update request
      request.status = "cancelled";
      request.updatedAt = timestamp || new Date().toISOString();
      if (notes) {
        request.vendorNotes = notes;
      }

      // Add to status history
      request.statusHistory.push({
        status: "cancelled",
        timestamp: timestamp || new Date().toISOString(),
        changedBy: vendorId,
        notes: notes || "Request cancelled by vendor",
      });

      // Save updated request
      await ctx.stub.putState(requestId, Buffer.from(JSON.stringify(request)));

      // Emit event
      ctx.stub.setEvent(
        "VendorRequestCancelled",
        Buffer.from(
          JSON.stringify({
            requestId: requestId,
            cancelledBy: vendorId,
            timestamp: timestamp,
          })
        )
      );

      console.log(`Vendor request ${requestId} cancelled by ${vendorId}`);

      return JSON.stringify({
        success: true,
        message: "Vendor request cancelled",
        requestId: requestId,
        txId: ctx.stub.getTxID(),
      });
    } catch (error) {
      console.error("Error cancelling vendor request:", error);
      throw new Error(`Failed to cancel vendor request: ${error.message}`);
    }
  }

  /**
   * Update request status
   */
  async updateVendorRequestStatus(
    ctx,
    requestId,
    newStatus,
    updatedBy,
    timestamp,
    notes = ""
  ) {
    try {
      // Get existing request
      const requestBytes = await ctx.stub.getState(requestId);
      if (!requestBytes || requestBytes.length === 0) {
        throw new Error(`Vendor request ${requestId} not found`);
      }

      const request = JSON.parse(requestBytes.toString());

      // Check if locked
      if (request.isLocked) {
        throw new Error("Cannot modify locked request");
      }

      // Validate status
      const validStatuses = [
        "pending",
        "approved",
        "rejected",
        "cancelled",
        "completed",
      ];
      if (!validStatuses.includes(newStatus)) {
        throw new Error(`Invalid status: ${newStatus}`);
      }

      // Update request
      request.status = newStatus;
      request.updatedAt = timestamp || new Date().toISOString();
      if (notes) {
        request.supplierNotes = notes;
      }

      // Add to status history
      request.statusHistory.push({
        status: newStatus,
        timestamp: timestamp || new Date().toISOString(),
        changedBy: updatedBy,
        notes: notes || `Status updated to ${newStatus}`,
      });

      // Save updated request
      await ctx.stub.putState(requestId, Buffer.from(JSON.stringify(request)));

      // Emit event
      ctx.stub.setEvent(
        "VendorRequestStatusUpdated",
        Buffer.from(
          JSON.stringify({
            requestId: requestId,
            newStatus: newStatus,
            updatedBy: updatedBy,
            timestamp: timestamp,
          })
        )
      );

      console.log(
        `Vendor request ${requestId} status updated to ${newStatus} by ${updatedBy}`
      );

      return JSON.stringify({
        success: true,
        message: "Vendor request status updated",
        requestId: requestId,
        newStatus: newStatus,
        txId: ctx.stub.getTxID(),
      });
    } catch (error) {
      console.error("Error updating vendor request status:", error);
      throw new Error(
        `Failed to update vendor request status: ${error.message}`
      );
    }
  }

  /**
   * Complete and lock vendor request
   */
  async completeVendorRequest(
    ctx,
    requestId,
    completedBy,
    timestamp,
    notes = ""
  ) {
    try {
      // Get existing request
      const requestBytes = await ctx.stub.getState(requestId);
      if (!requestBytes || requestBytes.length === 0) {
        throw new Error(`Vendor request ${requestId} not found`);
      }

      const request = JSON.parse(requestBytes.toString());

      // Check if already locked
      if (request.isLocked) {
        throw new Error("Request is already locked");
      }

      // Update request
      request.status = "completed";
      request.completedAt = timestamp || new Date().toISOString();
      request.isCompleted = true;
      request.isLocked = true; // Lock from further modifications
      request.updatedAt = timestamp || new Date().toISOString();
      if (notes) {
        request.supplierNotes = notes;
      }

      // Add to status history
      request.statusHistory.push({
        status: "completed",
        timestamp: timestamp || new Date().toISOString(),
        changedBy: completedBy,
        notes: notes || "Request completed and locked",
      });

      // Save updated request
      await ctx.stub.putState(requestId, Buffer.from(JSON.stringify(request)));

      // Emit event
      ctx.stub.setEvent(
        "VendorRequestCompleted",
        Buffer.from(
          JSON.stringify({
            requestId: requestId,
            completedBy: completedBy,
            timestamp: timestamp,
            isLocked: true,
          })
        )
      );

      console.log(
        `Vendor request ${requestId} completed and locked by ${completedBy}`
      );

      return JSON.stringify({
        success: true,
        message: "Vendor request completed and locked",
        requestId: requestId,
        isLocked: true,
        txId: ctx.stub.getTxID(),
      });
    } catch (error) {
      console.error("Error completing vendor request:", error);
      throw new Error(`Failed to complete vendor request: ${error.message}`);
    }
  }

  /**
   * Get vendor request by ID
   */
  async getVendorRequest(ctx, requestId) {
    try {
      const requestBytes = await ctx.stub.getState(requestId);
      if (!requestBytes || requestBytes.length === 0) {
        throw new Error(`Vendor request ${requestId} not found`);
      }

      return requestBytes.toString();
    } catch (error) {
      console.error("Error getting vendor request:", error);
      throw new Error(`Failed to get vendor request: ${error.message}`);
    }
  }

  /**
   * Get all vendor requests by supplier
   */
  async getVendorRequestsBySupplier(ctx, supplierId) {
    try {
      const iterator = await ctx.stub.getStateByPartialCompositeKey(
        "supplier~vendorRequest",
        [supplierId]
      );

      const requestList = [];

      let result = await iterator.next();
      while (!result.done) {
        const compositeKey = result.value.key;
        const splitKey = ctx.stub.splitCompositeKey(compositeKey);
        const requestId = splitKey.attributes[1];

        // Get the actual request data
        const requestBytes = await ctx.stub.getState(requestId);
        if (requestBytes && requestBytes.length > 0) {
          const request = JSON.parse(requestBytes.toString());
          requestList.push(request);
        }

        result = await iterator.next();
      }

      await iterator.close();

      return JSON.stringify(requestList);
    } catch (error) {
      console.error("Error getting vendor requests by supplier:", error);
      throw new Error(
        `Failed to get vendor requests by supplier: ${error.message}`
      );
    }
  }

  /**
   * Get all vendor requests by vendor
   */
  async getVendorRequestsByVendor(ctx, vendorId) {
    try {
      const iterator = await ctx.stub.getStateByPartialCompositeKey(
        "vendor~vendorRequest",
        [vendorId]
      );

      const requestList = [];

      let result = await iterator.next();
      while (!result.done) {
        const compositeKey = result.value.key;
        const splitKey = ctx.stub.splitCompositeKey(compositeKey);
        const requestId = splitKey.attributes[1];

        // Get the actual request data
        const requestBytes = await ctx.stub.getState(requestId);
        if (requestBytes && requestBytes.length > 0) {
          const request = JSON.parse(requestBytes.toString());
          requestList.push(request);
        }

        result = await iterator.next();
      }

      await iterator.close();

      return JSON.stringify(requestList);
    } catch (error) {
      console.error("Error getting vendor requests by vendor:", error);
      throw new Error(
        `Failed to get vendor requests by vendor: ${error.message}`
      );
    }
  }

  /**
   * Get vendor request history (all changes)
   */
  async getVendorRequestHistory(ctx, requestId) {
    try {
      const iterator = await ctx.stub.getHistoryForKey(requestId);

      const history = [];

      let result = await iterator.next();
      while (!result.done) {
        const record = {
          txId: result.value.txId,
          timestamp: result.value.timestamp,
          isDelete: result.value.isDelete,
          value: result.value.value.toString(),
        };
        history.push(record);
        result = await iterator.next();
      }

      await iterator.close();

      return JSON.stringify(history);
    } catch (error) {
      console.error("Error getting vendor request history:", error);
      throw new Error(`Failed to get vendor request history: ${error.message}`);
    }
  }

  /**
   * Query vendor requests by status
   */
  async getVendorRequestsByStatus(ctx, supplierId, status) {
    try {
      const query = {
        selector: {
          supplierId: supplierId,
          status: status,
          docType: "vendorRequest",
        },
      };

      const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));

      const requestList = [];

      let result = await iterator.next();
      while (!result.done) {
        const request = JSON.parse(result.value.value.toString());
        requestList.push(request);
        result = await iterator.next();
      }

      await iterator.close();

      return JSON.stringify(requestList);
    } catch (error) {
      console.error("Error getting vendor requests by status:", error);
      throw new Error(
        `Failed to get vendor requests by status: ${error.message}`
      );
    }
  }

  /**
   * Query all vendor requests (for admin/debugging)
   */
  async queryAllVendorRequests(ctx) {
    try {
      const query = {
        selector: {
          docType: "vendorRequest",
        },
      };

      const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));

      const allRequests = [];

      let result = await iterator.next();
      while (!result.done) {
        const request = JSON.parse(result.value.value.toString());
        allRequests.push(request);
        result = await iterator.next();
      }

      await iterator.close();

      return JSON.stringify(allRequests);
    } catch (error) {
      console.error("Error querying all vendor requests:", error);
      throw new Error(`Failed to query all vendor requests: ${error.message}`);
    }
  }
}

module.exports = VendorRequestContract;
