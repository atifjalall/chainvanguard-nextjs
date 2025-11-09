import VendorRequest from "../models/VendorRequest.js";
import Inventory from "../models/Inventory.js";
import User from "../models/User.js";
import notificationService from "./notification.service.js";
import logger from "../utils/logger.js";
import mongoose from "mongoose";
import loyaltyService from "./loyalty.service.js";
import fabricService from "./fabric.service.js";
// Added imports
import Order from "../models/Order.js";
import walletBalanceService from "./wallet.balance.service.js";
import inventoryService from "./inventory.service.js";
class VendorRequestService {
  /**
   * Create a new purchase request
   */
  async createRequest(vendorId, { supplierId, items, vendorNotes }) {
    try {
      // Validate that vendor exists
      const vendor = await User.findById(vendorId);
      if (!vendor || vendor.role !== "vendor") {
        throw new Error("Invalid vendor");
      }

      // Validate that supplier exists
      const supplier = await User.findById(supplierId);
      if (!supplier || supplier.role !== "supplier") {
        throw new Error("Invalid supplier");
      }

      // Validate inventory items and calculate totals
      let subtotal = 0;
      const requestItems = [];

      for (const item of items) {
        const inventory = await Inventory.findById(item.inventoryId);

        if (!inventory) {
          throw new Error(`Inventory item not found: ${item.inventoryId}`);
        }

        // Ensure all items are from the same supplier
        if (inventory.supplierId.toString() !== supplierId) {
          throw new Error("All items must be from the same supplier");
        }

        // Check stock availability
        if (inventory.quantity < item.quantity) {
          throw new Error(
            `Insufficient stock for ${inventory.name}. Available: ${inventory.quantity}`
          );
        }

        const itemSubtotal = inventory.pricePerUnit * item.quantity;
        subtotal += itemSubtotal;

        requestItems.push({
          inventoryId: item.inventoryId,
          quantity: item.quantity,
          pricePerUnit: inventory.pricePerUnit,
          subtotal: itemSubtotal,
        });
      }

      // Calculate tax and total
      const tax = subtotal * 0.1; // 10% tax
      const total = subtotal + tax;

      // Check if supplier has auto-approve enabled
      const autoApprove =
        supplier.supplierSettings?.autoApproveRequests || false;

      // Create request
      const request = new VendorRequest({
        vendorId,
        supplierId,
        items: requestItems,
        subtotal,
        tax,
        total,
        vendorNotes,
        status: autoApprove ? "approved" : "pending",
        autoApproved: autoApprove,
      });

      if (autoApprove) {
        request.reviewedAt = new Date();
        request.reviewedBy = supplierId;
      }

      await request.save();

      // ✅ ADD: Record to blockchain
      try {
        const blockchainData = {
          requestId: request._id.toString(),
          requestNumber: request.requestNumber,
          vendorId: vendorId.toString(),
          vendorName: vendor.name || vendor.email || vendor.companyName || "",
          supplierId: supplierId.toString(),
          supplierName:
            supplier.name || supplier.email || supplier.companyName || "",
          items: request.items.map((item) => ({
            inventoryId: item.inventoryId.toString(),
            inventoryName: "",
            quantity: item.quantity,
            pricePerUnit: item.pricePerUnit,
            inventoryId: item.inventoryId,
            subtotal: item.subtotal,
          })),
          subtotal: request.subtotal,
          tax: request.tax,
          total: request.total,
          status: request.status,
          vendorNotes: request.vendorNotes || "",
          supplierNotes: request.supplierNotes || "",
          autoApproved: request.autoApproved || false,
          timestamp: new Date().toISOString(),
        };

        const blockchainResult =
          await fabricService.createVendorRequest(blockchainData);

        // Update MongoDB with blockchain confirmation
        request.blockchainVerified = true;
        request.blockchainTxId =
          blockchainResult.txId || blockchainResult.requestId || "";
        await request.save();

        console.log(
          "✅ Vendor request recorded on blockchain:",
          blockchainResult
        );
      } catch (blockchainError) {
        console.error("⚠️ Blockchain recording failed:", blockchainError);
        // Continue - don't fail the request if blockchain fails
      }

      // ✅ ADD: Notify vendor about request creation
      await notificationService.createNotification({
        userId: vendorId,
        userRole: "vendor",
        type: "vendor_request_created",
        category: "vendor_requests",
        title: "Request Submitted",
        message: `Your request #${request.requestNumber} for ${request.items.length} items has been submitted to ${supplier.name || supplier.companyName}`,
        priority: "medium",
        actionType: "view_order",
        actionUrl: `/vendor/requests/${request._id}`,
        relatedEntity: {
          entityType: "vendor_request",
          entityId: request._id,
          entityData: {
            requestNumber: request.requestNumber,
            total: request.total,
            itemCount: request.items.length,
          },
        },
      });

      // ✅ ADD: Notify supplier about new request
      await notificationService.createNotification({
        userId: supplierId,
        userRole: "supplier",
        type: "vendor_request_created",
        category: "vendor_requests",
        title: "New Vendor Request",
        message: `New inventory request #${request.requestNumber} received from ${vendor.name || vendor.companyName}. Total: $${request.total.toFixed(2)}`,
        priority: "high",
        isUrgent: true,
        actionType: "view_order",
        actionUrl: `/supplier/requests/${request._id}`,
        relatedEntity: {
          entityType: "vendor_request",
          entityId: request._id,
        },
      });

      // ✅ ADD: If auto-approved, notify vendor
      if (autoApprove) {
        await notificationService.createNotification({
          userId: vendorId,
          userRole: "vendor",
          type: "vendor_request_approved",
          category: "vendor_requests",
          title: "Request Auto-Approved",
          message: `Your request #${request.requestNumber} has been automatically approved`,
          priority: "high",
          actionType: "view_order",
          actionUrl: `/vendor/requests/${request._id}`,
        });
      }

      // Existing blockchain logging
      try {
        await logger.logVendorRequest({
          action: "Vendor request created",
          type: "vendor_request_created",
          requestId: request._id.toString(),
          requestNumber: request.requestNumber,
          vendorId: vendorId.toString(),
          supplierId: supplierId.toString(),
          total,
          status: request.status,
          itemCount: requestItems.length,
        });
      } catch (error) {
        console.error("❌ Blockchain logging failed:", error);
      }

      await notificationService.createNotification({
        userId: request.vendorId,
        userRole: "vendor",
        type: "vendor_request_created",
        category: "vendor_requests",
        title: "New Vendor Request",
        message: `New vendor request #${request.requestNumber} has been created`,
        priority: "high",
        relatedEntity: {
          entityType: "vendor_request",
          entityId: request._id,
        },
      });

      // Populate and return
      await request.populate([
        { path: "vendorId", select: "name email companyName walletAddress" },
        { path: "supplierId", select: "name email companyName walletAddress" },
        {
          path: "items.inventoryId",
          select: "name category unit pricePerUnit",
        },
      ]);

      return {
        success: true,
        message: autoApprove
          ? "Request created and auto-approved!"
          : "Request created successfully!",
        request,
      };
    } catch (error) {
      console.error("❌ Create request error:", error);
      throw error;
    }
  }

  /**
   * Get vendor's requests
   */
  async getVendorRequests(vendorId, filters = {}) {
    try {
      const {
        status,
        supplierId,
        page = 1,
        limit = 20,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = filters;

      const query = { vendorId };

      if (status) {
        query.status = status;
      }

      if (supplierId) {
        query.supplierId = supplierId;
      }

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      const [requests, totalCount] = await Promise.all([
        VendorRequest.find(query)
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .populate("vendorId", "name email companyName")
          .populate("supplierId", "name email companyName")
          .populate("items.inventoryId", "name category unit pricePerUnit")
          .lean(),
        VendorRequest.countDocuments(query),
      ]);

      return {
        success: true,
        requests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      };
    } catch (error) {
      console.error("❌ Get vendor requests error:", error);
      throw error;
    }
  }

  /**
   * Approve request (Supplier only)
   */
  async approveRequest(requestId, supplierId, supplierNotes = "") {
    try {
      const request = await VendorRequest.findById(requestId);

      if (!request) {
        throw new Error("Request not found");
      }

      if (request.supplierId.toString() !== supplierId) {
        throw new Error(
          "Unauthorized - only the supplier can approve this request"
        );
      }

      if (request.status !== "pending") {
        throw new Error(
          `Cannot approve request with status: ${request.status}`
        );
      }

      // Update request
      request.status = "approved";
      request.reviewedAt = new Date();
      request.reviewedBy = supplierId;
      request.supplierNotes = supplierNotes;

      await request.save();

      // ✅ ADD: Record approval to blockchain
      try {
        const blockchainResult = await fabricService.approveVendorRequest(
          requestId,
          supplierId.toString(),
          new Date().toISOString(),
          supplierNotes || ""
        );

        // Update MongoDB with blockchain confirmation
        if (!request.blockchainVerified) {
          request.blockchainVerified = true;
        }
        if (blockchainResult.txId) {
          request.blockchainTxId = blockchainResult.txId;
        }
        await request.save();

        await notificationService.createNotification({
          userId: request.vendorId,
          userRole: "vendor",
          type: "vendor_request_approved",
          category: "vendor_requests",
          title: "Request Approved",
          message: `Your request #${request.requestNumber} has been approved by supplier`,
          priority: "high",
          actionType: "view_order",
          actionUrl: `/vendor/requests/${request._id}`,
          relatedEntity: {
            entityType: "vendor_request",
            entityId: request._id,
          },
        });

        console.log("✅ Approval recorded on blockchain:", blockchainResult);
      } catch (blockchainError) {
        console.error(
          "⚠️ Blockchain approval recording failed:",
          blockchainError
        );
      }

      // Existing blockchain logging
      try {
        await logger.logVendorRequest({
          action: "Vendor request approved",
          type: "vendor_request_approved",
          requestId: request._id.toString(),
          requestNumber: request.requestNumber,
          supplierId: supplierId.toString(),
          status: "approved",
        });
      } catch (error) {
        console.error("❌ Blockchain logging failed:", error);
      }

      await notificationService.createNotification({
        userId: request.vendorId,
        userRole: "vendor",
        type: "vendor_request_approved",
        category: "vendor_requests",
        title: "Request Approved",
        message: `Your vendor request #${request.requestNumber} has been approved`,
        priority: "high",
        relatedEntity: {
          entityType: "vendor_request",
          entityId: request._id,
        },
      });

      await request.populate([
        { path: "vendorId", select: "name email companyName" },
        { path: "supplierId", select: "name email companyName" },
        {
          path: "items.inventoryId",
          select: "name category unit pricePerUnit",
        },
      ]);

      return {
        success: true,
        message: "Request approved successfully",
        request,
      };
    } catch (error) {
      console.error("❌ Approve request error:", error);
      throw error;
    }
  }

  /**
   * Reject request (Supplier only)
   */
  async rejectRequest(requestId, supplierId, rejectionReason) {
    try {
      const request = await VendorRequest.findById(requestId);

      if (!request) {
        throw new Error("Request not found");
      }

      if (request.supplierId.toString() !== supplierId) {
        throw new Error(
          "Unauthorized - only the supplier can reject this request"
        );
      }

      if (request.status !== "pending") {
        throw new Error(`Cannot reject request with status: ${request.status}`);
      }

      if (!rejectionReason || rejectionReason.trim() === "") {
        throw new Error("Rejection reason is required");
      }

      // Update request
      request.status = "rejected";
      request.reviewedAt = new Date();
      request.reviewedBy = supplierId;
      request.rejectionReason = rejectionReason;

      await request.save();

      // ✅ ADD: Record rejection to blockchain
      try {
        const blockchainResult = await fabricService.rejectVendorRequest(
          requestId,
          supplierId.toString(),
          new Date().toISOString(),
          rejectionReason
        );

        // Update MongoDB with blockchain confirmation
        if (!request.blockchainVerified) {
          request.blockchainVerified = true;
        }
        if (blockchainResult.txId) {
          request.blockchainTxId = blockchainResult.txId;
        }
        await request.save();

        await notificationService.createNotification({
          userId: request.vendorId,
          userRole: "vendor",
          type: "vendor_request_rejected",
          category: "vendor_requests",
          title: "Request Declined",
          message: `Your request #${request.requestNumber} has been declined by supplier. Reason: ${notes || "Not specified"}`,
          priority: "high",
          actionType: "view_order",
          actionUrl: `/vendor/requests/${request._id}`,
          relatedEntity: {
            entityType: "vendor_request",
            entityId: request._id,
          },
        });

        console.log("✅ Rejection recorded on blockchain:", blockchainResult);
      } catch (blockchainError) {
        console.error(
          "⚠️ Blockchain rejection recording failed:",
          blockchainError
        );
      }

      // Existing blockchain logging
      try {
        await logger.logVendorRequest({
          action: "Vendor request rejected",
          type: "vendor_request_rejected",
          requestId: request._id.toString(),
          requestNumber: request.requestNumber,
          supplierId: supplierId.toString(),
          status: "rejected",
          rejectionReason,
        });
      } catch (error) {
        console.error("❌ Blockchain logging failed:", error);
      }

      await notificationService.createNotification({
        userId: request.vendorId,
        userRole: "vendor",
        type: "vendor_request_rejected",
        category: "vendor_requests",
        title: "Request Rejected",
        message: `Your vendor request #${request.requestNumber} has been rejected`,
        priority: "high",
        relatedEntity: {
          entityType: "vendor_request",
          entityId: request._id,
        },
      });

      await request.populate([
        { path: "vendorId", select: "name email companyName" },
        { path: "supplierId", select: "name email companyName" },
        {
          path: "items.inventoryId",
          select: "name category unit pricePerUnit",
        },
      ]);

      return {
        success: true,
        message: "Request rejected",
        request,
      };
    } catch (error) {
      console.error("❌ Reject request error:", error);
      throw error;
    }
  }

  /**
   * Cancel request (Vendor only)
   */
  async cancelRequest(requestId, vendorId) {
    try {
      const request = await VendorRequest.findById(requestId);

      if (!request) {
        throw new Error("Request not found");
      }

      if (request.vendorId.toString() !== vendorId) {
        throw new Error(
          "Unauthorized - only the vendor can cancel this request"
        );
      }

      if (request.status !== "pending") {
        throw new Error(`Cannot cancel request with status: ${request.status}`);
      }

      // Update request
      request.status = "cancelled";
      request.cancelledAt = new Date();

      await request.save();

      // ✅ ADD: Record cancellation to blockchain
      try {
        const blockchainResult = await fabricService.cancelVendorRequest(
          requestId,
          vendorId.toString(),
          new Date().toISOString(),
          "Request cancelled by vendor"
        );

        // Update MongoDB with blockchain confirmation
        if (!request.blockchainVerified) {
          request.blockchainVerified = true;
        }
        if (blockchainResult.txId) {
          request.blockchainTxId = blockchainResult.txId;
        }
        await request.save();

        await notificationService.createNotification({
          userId: request.items[0].supplierId, // or get unique supplier IDs
          userRole: "supplier",
          type: "vendor_request_cancelled",
          category: "vendor_requests",
          title: "Request Cancelled",
          message: `Vendor request #${request.requestNumber} was cancelled by vendor`,
          priority: "medium",
          relatedEntity: {
            entityType: "vendor_request",
            entityId: request._id,
          },
        });

        console.log(
          "✅ Cancellation recorded on blockchain:",
          blockchainResult
        );
      } catch (blockchainError) {
        console.error(
          "⚠️ Blockchain cancellation recording failed:",
          blockchainError
        );
      }

      // Existing blockchain logging
      try {
        await logger.logVendorRequest({
          action: "Vendor request cancelled",
          type: "vendor_request_cancelled",
          requestId: request._id.toString(),
          requestNumber: request.requestNumber,
          vendorId: vendorId.toString(),
          status: "cancelled",
        });
      } catch (error) {
        console.error("❌ Blockchain logging failed:", error);
      }

      // Get vendor info for notification
      const vendor = await User.findById(vendorId);

      await notificationService.createNotification({
        userId: request.supplierId,
        userRole: "supplier",
        type: "vendor_request_cancelled",
        title: "Request Cancelled",
        message: `Vendor ${vendor.name} cancelled purchase request ${request.requestNumber}`,
        category: "vendor_requests",
        priority: "low",
        relatedEntity: {
          entityType: "vendor_request",
          entityId: request._id,
        },
        action: {
          type: "view_request",
          url: `/supplier/requests/${request._id}`,
        },
        metadata: {
          requestId: request._id.toString(),
          requestNumber: request.requestNumber,
        },
      });

      await request.populate([
        { path: "vendorId", select: "name email companyName" },
        { path: "supplierId", select: "name email companyName" },
        {
          path: "items.inventoryId",
          select: "name category unit pricePerUnit",
        },
      ]);

      return {
        success: true,
        message: "Request cancelled successfully",
        request,
      };
    } catch (error) {
      console.error("❌ Cancel request error:", error);
      throw error;
    }
  }

  /**
   * Get request by ID
   */
  async getRequestById(requestId, userId) {
    try {
      const request = await VendorRequest.findById(requestId)
        .populate("vendorId", "name email companyName walletAddress")
        .populate("supplierId", "name email companyName walletAddress")
        .populate("items.inventoryId", "name category unit pricePerUnit")
        .lean();

      if (!request) {
        throw new Error("Request not found");
      }

      // Check authorization
      const isVendor = request.vendorId._id.toString() === userId;
      const isSupplier = request.supplierId._id.toString() === userId;

      if (!isVendor && !isSupplier) {
        throw new Error("Unauthorized to view this request");
      }

      return {
        success: true,
        request,
      };
    } catch (error) {
      console.error("❌ Get request by ID error:", error);
      throw error;
    }
  }

  /**
   * Get supplier's incoming requests
   */
  async getSupplierRequests(supplierId, filters = {}) {
    try {
      const {
        status,
        vendorId,
        page = 1,
        limit = 20,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = filters;

      const query = { supplierId };

      if (status) {
        query.status = status;
      }

      if (vendorId) {
        query.vendorId = vendorId;
      }

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      const [requests, totalCount] = await Promise.all([
        VendorRequest.find(query)
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .populate("vendorId", "name email companyName")
          .populate("supplierId", "name email companyName")
          .populate("items.inventoryId", "name category unit pricePerUnit")
          .lean(),
        VendorRequest.countDocuments(query),
      ]);

      return {
        success: true,
        requests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      };
    } catch (error) {
      console.error("❌ Get supplier requests error:", error);
      throw error;
    }
  }

  /**
   * Get request statistics for vendor
   */
  async getVendorStats(vendorId) {
    try {
      const [total, pending, approved, rejected, cancelled] = await Promise.all(
        [
          VendorRequest.countDocuments({ vendorId }),
          VendorRequest.countDocuments({ vendorId, status: "pending" }),
          VendorRequest.countDocuments({ vendorId, status: "approved" }),
          VendorRequest.countDocuments({ vendorId, status: "rejected" }),
          VendorRequest.countDocuments({ vendorId, status: "cancelled" }),
        ]
      );

      return {
        success: true,
        stats: {
          total,
          pending,
          approved,
          rejected,
          cancelled,
        },
      };
    } catch (error) {
      console.error("❌ Get vendor stats error:", error);
      throw error;
    }
  }

  /**
   * Get request statistics for supplier
   */
  async getSupplierStats(supplierId) {
    try {
      const [total, pending, approved, rejected] = await Promise.all([
        VendorRequest.countDocuments({ supplierId }),
        VendorRequest.countDocuments({ supplierId, status: "pending" }),
        VendorRequest.countDocuments({ supplierId, status: "approved" }),
        VendorRequest.countDocuments({ supplierId, status: "rejected" }),
      ]);

      return {
        success: true,
        stats: {
          total,
          pending,
          approved,
          rejected,
        },
      };
    } catch (error) {
      console.error("❌ Get supplier stats error:", error);
      throw error;
    }
  }

  /**
   * Get supplier settings
   */
  async getSupplierSettings(supplierId) {
    try {
      const supplier = await User.findById(supplierId).lean();

      if (!supplier) {
        throw new Error("Supplier not found");
      }

      return {
        success: true,
        settings: {
          autoApproveRequests:
            supplier.supplierSettings?.autoApproveRequests || false,
        },
      };
    } catch (error) {
      console.error("❌ Get supplier settings error:", error);
      throw error;
    }
  }

  /**
   * Toggle auto-approve setting
   */
  async toggleAutoApprove(supplierId) {
    try {
      const supplier = await User.findById(supplierId);

      if (!supplier) {
        throw new Error("Supplier not found");
      }

      // Initialize supplierSettings if it doesn't exist
      if (!supplier.supplierSettings) {
        supplier.supplierSettings = {
          autoApproveRequests: false,
        };
      }

      // Toggle the setting
      supplier.supplierSettings.autoApproveRequests =
        !supplier.supplierSettings.autoApproveRequests;

      await supplier.save();

      return {
        success: true,
        autoApprove: supplier.supplierSettings.autoApproveRequests,
      };
    } catch (error) {
      console.error("❌ Toggle auto-approve error:", error);
      throw error;
    }
  }

  /**
   * Get request statistics for a vendor
   */
  async getRequestStats(vendorId) {
    try {
      const stats = await VendorRequest.aggregate([
        { $match: { vendorId: new mongoose.Types.ObjectId(vendorId) } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalAmount: { $sum: "$total" },
          },
        },
      ]);

      const result = {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0,
        fulfilled: 0,
        totalAmount: 0,
      };

      stats.forEach((stat) => {
        result[stat._id] = stat.count;
        result.total += stat.count;
        result.totalAmount += stat.totalAmount;
      });

      return result;
    } catch (error) {
      console.error("Error getting request stats:", error);
      throw error;
    }
  }

  /**
   * Get auto-approve status for supplier
   */
  async getAutoApproveStatus(supplierId) {
    try {
      const supplier = await User.findById(supplierId);

      if (!supplier) {
        throw new Error("Supplier not found");
      }

      // Get from supplier settings or default to false
      const autoApprove = supplier.settings?.autoApproveRequests || false;

      return {
        supplierId: supplier._id,
        autoApprove,
        updatedAt: supplier.settings?.updatedAt || supplier.updatedAt,
      };
    } catch (error) {
      console.error("Error getting auto-approve status:", error);
      throw error;
    }
  }

  /**
   * Update supplier settings
   */
  async updateSupplierSettings(supplierId, settings) {
    try {
      const supplier = await User.findById(supplierId);

      if (!supplier) {
        throw new Error("Supplier not found");
      }

      // Initialize supplierSettings if it doesn't exist
      if (!supplier.supplierSettings) {
        supplier.supplierSettings = {};
      }

      // Update settings
      if (settings.autoApproveRequests !== undefined) {
        supplier.supplierSettings.autoApproveRequests =
          settings.autoApproveRequests;
      }

      if (settings.minOrderValue !== undefined) {
        supplier.supplierSettings.minOrderValue = settings.minOrderValue;
      }

      if (settings.discountForRewards !== undefined) {
        supplier.supplierSettings.discountForRewards =
          settings.discountForRewards;
      }

      if (settings.rewardPointsRate !== undefined) {
        supplier.supplierSettings.rewardPointsRate = settings.rewardPointsRate;
      }

      await supplier.save();

      return {
        success: true,
        settings: supplier.supplierSettings,
      };
    } catch (error) {
      console.error("❌ Update supplier settings error:", error);
      throw error;
    }
  }

  /**
   * Update request status
   */
  async updateRequestStatus(requestId, supplierId, newStatus, notes) {
    const request = await VendorRequest.findById(requestId);

    if (!request) {
      throw new Error("Request not found");
    }

    if (request.supplierId.toString() !== supplierId) {
      throw new Error("Unauthorized");
    }

    if (request.isCompleted) {
      throw new Error("Cannot modify completed transaction");
    }

    const validStatuses = [
      "pending",
      "approved",
      "rejected",
      "cancelled",
      "completed",
    ];
    if (!validStatuses.includes(newStatus)) {
      throw new Error("Invalid status");
    }

    request.status = newStatus;
    if (notes) {
      request.supplierNotes = notes;
    }
    request.updatedAt = new Date();

    await request.save();

    // ✅ ADD: Record status update to blockchain
    try {
      const blockchainResult = await fabricService.updateVendorRequestStatus(
        requestId,
        newStatus,
        supplierId.toString(),
        new Date().toISOString(),
        notes || ""
      );

      if (!request.blockchainVerified) {
        request.blockchainVerified = true;
      }
      if (blockchainResult.txId) {
        request.blockchainTxId = blockchainResult.txId;
      }
      await request.save();

      console.log("✅ Status update recorded on blockchain:", blockchainResult);
    } catch (blockchainError) {
      console.error(
        "⚠️ Blockchain status update recording failed:",
        blockchainError
      );
    }

    return {
      success: true,
      message: "Status updated successfully",
      request,
    };
  }

  /**
   * Complete and lock transaction
   */
  async completeTransaction(requestId, supplierId, notes) {
    const request = await VendorRequest.findById(requestId);

    if (!request) {
      throw new Error("Request not found");
    }

    if (request.supplierId.toString() !== supplierId) {
      throw new Error("Unauthorized");
    }

    if (request.status !== "approved" && request.status !== "completed") {
      throw new Error("Can only complete approved transactions");
    }

    request.status = "completed";
    request.isCompleted = true;
    request.completedAt = new Date();
    if (notes) {
      request.supplierNotes = notes;
    }

    await request.save();

    // ✅ ADD: Record completion to blockchain (locks the request)
    try {
      const blockchainResult = await fabricService.completeVendorRequest(
        requestId,
        supplierId.toString(),
        new Date().toISOString(),
        notes || "Transaction completed"
      );

      if (!request.blockchainVerified) {
        request.blockchainVerified = true;
      }
      if (blockchainResult.txId) {
        request.blockchainTxId = blockchainResult.txId;
      }
      await request.save();

      console.log(
        "✅ Transaction completed and locked on blockchain:",
        blockchainResult
      );
    } catch (blockchainError) {
      console.error(
        "⚠️ Blockchain completion recording failed:",
        blockchainError
      );
    }

    // Log to blockchain
    try {
      await logger.logVendorRequest({
        action: "Vendor request completed",
        type: "vendor_request_completed",
        requestId: request._id.toString(),
        requestNumber: request.requestNumber,
        supplierId: supplierId.toString(),
        status: "completed",
      });
    } catch (error) {
      console.error("❌ Blockchain logging failed:", error);
    }

    // Send notification
    await notificationService.createNotification({
      userId: request.vendorId,
      userRole: "vendor",
      type: "vendor_request_completed",
      category: "vendor_requests",
      title: "Transaction Completed",
      message: `Transaction #${request.requestNumber} has been completed`,
      priority: "high",
      relatedEntity: {
        entityType: "vendor_request",
        entityId: request._id,
      },
    });

    await request.populate([
      { path: "vendorId", select: "name email companyName" },
      { path: "supplierId", select: "name email companyName" },
      {
        path: "items.inventoryId",
        select: "name category unit pricePerUnit",
      },
    ]);

    return {
      success: true,
      message: "Transaction completed successfully and locked on blockchain",
      request,
    };
  }

  /**
   * Process payment and create order for approved vendor request
   * ✅ COMPLETE VERSION with all required Order model fields
   */
  async processPaymentAndCreateOrder(requestId, vendorId, shippingAddress) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Get and validate request
      const vendorRequest = await VendorRequest.findById(requestId)
        .populate("vendorId", "name email walletAddress companyName phone")
        .populate("supplierId", "name email walletAddress companyName phone")
        .populate("items.inventoryId")
        .session(session);

      if (!vendorRequest) {
        throw new Error("Vendor request not found");
      }

      // 2. Verify vendor ownership
      if (vendorRequest.vendorId._id.toString() !== vendorId.toString()) {
        throw new Error("Unauthorized: This request does not belong to you");
      }

      // 3. Verify status is approved
      if (vendorRequest.status !== "approved") {
        throw new Error(
          `Cannot pay for request with status: ${vendorRequest.status}`
        );
      }

      // 4. Check if already paid
      if (vendorRequest.orderId) {
        throw new Error("Payment already processed for this request");
      }

      // 5. Verify vendor has sufficient funds
      const walletBalance = await walletBalanceService.getBalance(vendorId);
      if (walletBalance < vendorRequest.total) {
        throw new Error(
          `Insufficient wallet balance. Required: $${vendorRequest.total}, Available: $${walletBalance}`
        );
      }

      // 6. Process wallet payment
      await walletBalanceService.processPayment(
        vendorId,
        null,
        vendorRequest.total,
        `Payment for vendor request ${vendorRequest.requestNumber}`,
        session
      );

      logger.info(
        `💰 Payment processed: $${vendorRequest.total} for request ${vendorRequest.requestNumber}`
      );

      // 7. Create order with ALL REQUIRED FIELDS
      const Order = (await import("../models/Order.js")).default;

      const order = new Order({
        // ========================================
        // CUSTOMER INFO (Vendor is the customer)
        // ========================================
        customerId: vendorRequest.vendorId._id,
        customerName: vendorRequest.vendorId.name,
        customerEmail: vendorRequest.vendorId.email,
        customerPhone: vendorRequest.vendorId.phone || "",
        customerWalletAddress: vendorRequest.vendorId.walletAddress,

        // ========================================
        // SELLER INFO (Supplier is the seller)
        // ========================================
        sellerId: vendorRequest.supplierId._id,
        sellerName:
          vendorRequest.supplierId.companyName || vendorRequest.supplierId.name,
        sellerWalletAddress: vendorRequest.supplierId.walletAddress,
        sellerRole: "supplier",

        // ========================================
        // ORDER ITEMS - WITH REQUIRED SELLER ID
        // ========================================
        items: vendorRequest.items.map((item) => ({
          productId: item.inventoryId._id,
          productName: item.inventoryId.name || "Raw Material",
          sku: item.inventoryId.sku || "",
          quantity: item.quantity,
          price: item.pricePerUnit,
          subtotal: item.subtotal,
          inventoryId: item.inventoryId._id,

          sellerId: vendorRequest.supplierId._id,
          sellerName:
            vendorRequest.supplierId.companyName ||
            vendorRequest.supplierId.name,
          sellerWalletAddress: vendorRequest.supplierId.walletAddress,

          // Product snapshot
          productSnapshot: {
            category: item.inventoryId.category || "",
            subcategory: item.inventoryId.subcategory || "",
            brand: item.inventoryId.brand || "",
            images: item.inventoryId.images || [],
          },
        })),

        // ========================================
        // PRICING
        // ========================================
        subtotal: vendorRequest.subtotal,
        shippingCost: 0, // Vendor-supplier usually negotiated
        tax: vendorRequest.tax,
        discount: 0,
        discountCode: "",
        total: vendorRequest.total,
        originalAmount: vendorRequest.total,
        discountAmount: 0,
        discountPercentage: 0,
        currency: "USD",

        // ========================================
        // PAYMENT INFO
        // ========================================
        paymentMethod: "wallet",
        paymentStatus: "paid",
        paidAt: new Date(),

        // ========================================
        // SHIPPING ADDRESS (REQUIRED FIELDS)
        // ========================================
        shippingAddress: {
          name: shippingAddress.name,
          phone: shippingAddress.phone,
          addressLine1: shippingAddress.addressLine1,
          addressLine2: shippingAddress.addressLine2 || "",
          city: shippingAddress.city,
          state: shippingAddress.state,
          country: shippingAddress.country,
          postalCode: shippingAddress.postalCode,
          latitude: shippingAddress.latitude || null,
          longitude: shippingAddress.longitude || null,
          addressType: shippingAddress.addressType || "office",
        },

        // ========================================
        // BILLING ADDRESS (same as shipping)
        // ========================================
        billingAddress: {
          name: shippingAddress.name,
          phone: shippingAddress.phone,
          addressLine1: shippingAddress.addressLine1,
          addressLine2: shippingAddress.addressLine2 || "",
          city: shippingAddress.city,
          state: shippingAddress.state,
          country: shippingAddress.country,
          postalCode: shippingAddress.postalCode,
        },

        // ========================================
        // SHIPPING DETAILS
        // ========================================
        shippingMethod: "standard",
        estimatedDeliveryDate: null,
        actualDeliveryDate: null,
        trackingNumber: "",
        trackingUrl: "",
        courierName: "Other",

        // ========================================
        // STATUS
        // ========================================
        status: "pending",

        // ========================================
        // NOTES
        // ========================================
        customerNotes: `Order from vendor request ${vendorRequest.requestNumber}`,
        sellerNotes: vendorRequest.vendorNotes || "",
        adminNotes: "",

        // ========================================
        // ADDITIONAL FIELDS
        // ========================================
        isGift: false,
        giftMessage: "",
        specialInstructions: "",
        urgentOrder: false,

        // Link to vendor request
        vendorRequestId: vendorRequest._id,
      });

      // Add status history
      order.statusHistory.push({
        status: "pending",
        changedBy: vendorId,
        changedByRole: "vendor",
        timestamp: new Date(),
        notes: "Order created from approved vendor request",
      });

      // Add supply chain event
      order.supplyChainEvents.push({
        stage: "order_placed",
        location: shippingAddress.city || "",
        description: `Order placed for vendor request ${vendorRequest.requestNumber}`,
        timestamp: new Date(),
        performedBy: vendorId,
      });

      await order.save({ session });

      logger.info(
        `📦 Order created: ${order.orderNumber} for request ${vendorRequest.requestNumber}`
      );

      // 8. Reserve inventory
      for (const item of vendorRequest.items) {
        await inventoryService.reserveQuantity(
          item.inventoryId._id,
          item.quantity,
          session
        );
      }

      logger.info("📊 Inventory reserved for order");

      // 9. Link order to vendor request
      vendorRequest.orderId = order._id;
      vendorRequest.paidAt = new Date();
      await vendorRequest.save({ session });

      // 10. Update wallet transaction with orderId
      await walletBalanceService.updateTransactionOrderId(
        vendorId,
        order._id,
        session
      );

      // 11. Send notifications
      await notificationService.createNotification({
        userId: vendorRequest.supplierId._id,
        userRole: "supplier",
        type: "order_placed",
        category: "vendor_requests",
        title: "New Order from Vendor",
        message: `Vendor ${vendorRequest.vendorId.name} has paid for request ${vendorRequest.requestNumber}. Order ${order.orderNumber} created.`,
        priority: "high",
        relatedEntity: {
          entityType: "order",
          entityId: order._id,
        },
        metadata: {
          vendorRequestId: vendorRequest._id,
          requestNumber: vendorRequest.requestNumber,
          orderNumber: order.orderNumber,
          totalAmount: order.total,
          itemCount: order.items.length,
        },
      });

      await notificationService.createNotification({
        userId: vendorId,
        userRole: "vendor",
        type: "payment_received",
        category: "vendor_requests",
        title: "Payment Successful",
        message: `Payment of $${order.total} processed successfully. Order ${order.orderNumber} created and will be processed by supplier.`,
        priority: "high",
        relatedEntity: {
          entityType: "order",
          entityId: order._id,
        },
        metadata: {
          vendorRequestId: vendorRequest._id,
          requestNumber: vendorRequest.requestNumber,
          orderNumber: order.orderNumber,
          totalAmount: order.total,
          paymentMethod: "wallet",
        },
      });

      await session.commitTransaction();

      return {
        success: true,
        message: "Payment processed and order created successfully",
        data: {
          vendorRequest: vendorRequest,
          order: {
            _id: order._id,
            orderNumber: order.orderNumber,
            total: order.total,
            status: order.status,
            paymentStatus: order.paymentStatus,
            paidAt: order.paidAt,
            items: order.items.map((item) => ({
              productName: item.productName,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.subtotal,
            })),
          },
          payment: {
            amount: order.total,
            method: "wallet",
            status: "paid",
            paidAt: order.paidAt,
            transactionRef: vendorRequest.requestNumber,
          },
        },
      };
    } catch (error) {
      await session.abortTransaction();
      logger.error("Error processing payment and creating order:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  // New: Get vendor's approved requests (ready for payment)
  async getApprovedRequests(vendorId) {
    try {
      const approvedRequests = await VendorRequest.find({
        vendorId: vendorId,
        status: "approved",
        orderId: { $exists: false },
      })
        .populate("supplierId", "name email companyName contactPhone")
        .populate(
          "items.inventoryId",
          "name category pricePerUnit unit stockStatus"
        )
        .sort({ reviewedAt: -1 });

      const requestsWithAge = approvedRequests.map((request) => {
        const daysSinceApproval = request.reviewedAt
          ? Math.floor(
              (new Date() - new Date(request.reviewedAt)) /
                (1000 * 60 * 60 * 24)
            )
          : 0;

        return {
          ...request.toObject(),
          daysSinceApproval,
          isUrgent: daysSinceApproval > 3,
        };
      });

      return {
        success: true,
        count: approvedRequests.length,
        data: requestsWithAge,
        message:
          approvedRequests.length > 0
            ? `${approvedRequests.length} approved request(s) ready for payment`
            : "No approved requests pending payment",
      };
    } catch (error) {
      logger.error("Error getting approved requests:", error);
      throw error;
    }
  }

  // New: Cancel approved request (vendor opts not to pay)
  async cancelApprovedRequest(requestId, vendorId, cancellationReason) {
    try {
      const vendorRequest = await VendorRequest.findById(requestId).populate(
        "supplierId",
        "name email companyName"
      );

      if (!vendorRequest) {
        throw new Error("Vendor request not found");
      }

      if (vendorRequest.vendorId.toString() !== vendorId.toString()) {
        throw new Error("Unauthorized: This request does not belong to you");
      }

      if (vendorRequest.status !== "approved") {
        throw new Error("Can only cancel approved requests");
      }

      if (vendorRequest.orderId) {
        throw new Error("Cannot cancel - payment already processed");
      }

      vendorRequest.status = "cancelled";
      vendorRequest.cancellationReason = cancellationReason;
      vendorRequest.cancelledAt = new Date();
      vendorRequest.cancelledBy = vendorId;

      vendorRequest.statusHistory.push({
        status: "cancelled",
        timestamp: new Date(),
        changedBy: vendorId,
        notes: cancellationReason,
      });

      await vendorRequest.save();

      logger.info(
        `❌ Vendor request ${vendorRequest.requestNumber} cancelled by vendor`
      );

      // Notify supplier
      await notificationService.createNotification({
        userId: vendorRequest.supplierId._id,
        userRole: "supplier",
        type: "order_cancelled",
        category: "orders",
        title: "Vendor Request Cancelled",
        message: `Vendor cancelled approved request ${vendorRequest.requestNumber}. Reason: ${cancellationReason}`,
        priority: "low",
        relatedEntity: {
          entityType: "vendor_request",
          entityId: vendorRequest._id,
        },
        metadata: {
          vendorRequestId: vendorRequest._id,
          requestNumber: vendorRequest.requestNumber,
          reason: cancellationReason,
          cancelledAt: vendorRequest.cancelledAt,
          totalAmount: vendorRequest.total,
        },
      });

      return {
        success: true,
        message: "Request cancelled successfully",
        data: vendorRequest,
      };
    } catch (error) {
      logger.error("Error cancelling request:", error);
      throw error;
    }
  }

  /**
   * ✅ NEW: Get request history from blockchain
   */
  async getRequestHistory(requestId, userId, userRole) {
    try {
      // Get request from MongoDB
      const request = await VendorRequest.findById(requestId);

      if (!request) {
        throw new Error("Request not found");
      }

      // Check authorization
      if (userRole === "vendor" && request.vendorId.toString() !== userId) {
        throw new Error("Unauthorized - not your request");
      }

      if (userRole === "supplier" && request.supplierId.toString() !== userId) {
        throw new Error("Unauthorized - not your request");
      }

      // Get blockchain history
      let blockchainHistory = [];
      try {
        blockchainHistory =
          await fabricService.getVendorRequestHistory(requestId);
        console.log(
          `✅ Retrieved ${blockchainHistory.length} blockchain history records`
        );
      } catch (blockchainError) {
        console.error("⚠️ Failed to get blockchain history:", blockchainError);
        // Continue with empty history
      }

      return {
        success: true,
        request: {
          id: request._id,
          requestNumber: request.requestNumber,
          status: request.status,
          total: request.total,
          createdAt: request.createdAt,
          blockchainVerified: request.blockchainVerified,
          blockchainTxId: request.blockchainTxId,
        },
        blockchainHistory: blockchainHistory,
      };
    } catch (error) {
      console.error("❌ Get request history error:", error);
      throw error;
    }
  }
}

export default new VendorRequestService();
