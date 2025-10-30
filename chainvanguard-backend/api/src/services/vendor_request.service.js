import VendorRequest from "../models/VendorRequest.js";
import Inventory from "../models/Inventory.js";
import User from "../models/User.js";
import notificationService from "./notification.service.js";
import logger from "../utils/logger.js";
import mongoose from "mongoose";
import loyaltyService from "./loyalty.service.js";

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

      // ✅ FIXED: Log to blockchain using logger utility
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
        // Continue even if blockchain fails
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

      // ✅ FIXED: Log to blockchain using logger utility
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

      // ✅ FIXED: Log to blockchain using logger utility
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

      // ✅ FIXED: Log to blockchain using logger utility
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
   * Toggle auto-approve for supplier
   */
  async toggleAutoApprove(supplierId) {
    try {
      const supplier = await User.findById(supplierId);

      if (!supplier) {
        throw new Error("Supplier not found");
      }

      // Initialize settings if not exists
      if (!supplier.settings) {
        supplier.settings = {};
      }

      // Toggle the value
      const newValue = !supplier.settings.autoApproveRequests;
      supplier.settings.autoApproveRequests = newValue;
      supplier.settings.updatedAt = new Date();

      await supplier.save();

      return {
        supplierId: supplier._id,
        autoApprove: newValue,
        updatedAt: supplier.settings.updatedAt,
      };
    } catch (error) {
      console.error("Error toggling auto-approve:", error);
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
}

export default new VendorRequestService();
