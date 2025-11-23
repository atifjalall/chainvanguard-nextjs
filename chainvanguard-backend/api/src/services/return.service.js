import Return from "../models/Return.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import { getDateFilter } from "../utils/helpers.js";
import notificationService from "./notification.service.js";
import walletBalanceService from "./wallet.balance.service.js";
import mongoose from "mongoose";

/**
 * ========================================
 * RETURN SERVICE
 * ========================================
 * Business logic for return management
 */

class ReturnService {
  /**
   * Create a new return request
   */
  async createReturn(userId, data) {
    try {
      const { orderId, items, reason, reasonDetails, images } = data;

      // Get order
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      // Verify order belongs to customer
      if (order.customerId.toString() !== userId) {
        throw new Error("Unauthorized to return this order");
      }

      // Check if order is delivered
      if (order.status !== "delivered") {
        throw new Error("Can only return delivered orders");
      }

      // Check if already returned
      if (order.returnRequested) {
        throw new Error("Return already requested for this order");
      }

      // Check return window (30 days)
      const deliveryDate = new Date(order.deliveredAt || order.updatedAt);
      const daysSinceDelivery = Math.ceil(
        (Date.now() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceDelivery > 30) {
        throw new Error("Return window has expired (30 days)");
      }

      // Get customer info
      const customer = await User.findById(userId);

      // Calculate return amount
      let returnAmount = 0;
      const returnItems = [];

      for (const item of items) {
        const orderItem = order.items.find(
          (oi) => oi.productId.toString() === item.productId
        );

        if (!orderItem) {
          throw new Error(`Product ${item.productId} not found in order`);
        }

        if (item.quantity > orderItem.quantity) {
          throw new Error(
            `Cannot return more than ordered quantity for ${orderItem.productName}`
          );
        }

        const subtotal = orderItem.price * item.quantity;
        returnAmount += subtotal;

        returnItems.push({
          productId: item.productId,
          productName: orderItem.productName,
          quantity: item.quantity,
          price: orderItem.price,
          subtotal: subtotal,
        });
      }

      // Create return request
      const returnRequest = await Return.create({
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerId: userId,
        customerName: customer.name,
        customerEmail: customer.email,
        vendorId: order.sellerId,
        vendorName: order.sellerName,
        items: returnItems,
        reason,
        reasonDetails,
        images: images || [],
        returnAmount,
        refundAmount: returnAmount, // Default to full amount
        status: "requested",
        statusHistory: [
          {
            status: "requested",
            timestamp: new Date(),
            notes: "Return request submitted by customer",
          },
        ],
      });

      // Mark order as return requested
      order.returnRequested = true;
      order.returnStatus = "requested";
      await order.save();

      // Send notifications directly
      await notificationService.createNotification({
        userId: returnRequest.customerId,
        userRole: "customer",
        type: "return_received",
        category: "return",
        title: "Return Request Received",
        message: `Your return request ${returnRequest.returnNumber} has been received and is being reviewed by ${returnRequest.vendorName}.`,
        priority: "medium",
        actionType: "view_return",
        actionUrl: `/customer/returns/${returnRequest._id}`,
        relatedEntity: {
          entityType: "return",
          entityId: returnRequest._id,
          entityData: {
            returnNumber: returnRequest.returnNumber,
            returnAmount: returnRequest.returnAmount,
          },
        },
      });

      await notificationService.createNotification({
        userId: returnRequest.vendorId,
        userRole: "vendor",
        type: "new_return_request",
        category: "return",
        title: "New Return Request",
        message: `${returnRequest.customerName} has requested a return for order ${returnRequest.orderNumber}. Amount: CVT ${returnRequest.returnAmount}`,
        priority: "high",
        actionType: "view_return",
        actionUrl: `/vendor/returns/${returnRequest._id}`,
        relatedEntity: {
          entityType: "return",
          entityId: returnRequest._id,
          entityData: {
            returnNumber: returnRequest.returnNumber,
            customerName: returnRequest.customerName,
            returnAmount: returnRequest.returnAmount,
          },
        },
      });

      return {
        success: true,
        message: "Return request created successfully",
        return: returnRequest,
      };
    } catch (error) {
      console.error("Create return error:", error);
      throw error;
    }
  }

  /**
   * Get customer's returns
   */
  async getCustomerReturns(userId, filters = {}) {
    try {
      const {
        status,
        page = 1,
        limit = 50,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = filters;

      const query = { customerId: userId };

      if (status) {
        query.status = status;
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const total = await Return.countDocuments(query);

      const returns = await Return.find(query)
        .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("vendorId", "name email companyName");

      return {
        returns,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      };
    } catch (error) {
      console.error("Get customer returns error:", error);
      throw error;
    }
  }

  /**
   * Get vendor's returns
   */
  async getVendorReturns(userId, filters = {}) {
    try {
      const {
        status,
        page = 1,
        limit = 50,
        sortBy = "createdAt",
        sortOrder = "desc",
        search,
        startDate,
        endDate,
      } = filters;

      const query = { vendorId: userId };

      if (status) {
        query.status = status;
      }

      if (search) {
        query.$or = [
          { returnNumber: { $regex: search, $options: "i" } },
          { customerName: { $regex: search, $options: "i" } },
          { orderNumber: { $regex: search, $options: "i" } },
        ];
      }

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const total = await Return.countDocuments(query);

      const returns = await Return.find(query)
        .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("customerId", "name email")
        .populate("reviewedBy", "name");

      return {
        returns,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      };
    } catch (error) {
      console.error("Get vendor returns error:", error);
      throw error;
    }
  }

  /**
   * Get single return by ID
   */
  async getReturnById(returnId, userId, userRole) {
    try {
      const returnRequest = await Return.findById(returnId)
        .populate("customerId", "name email phone")
        .populate("vendorId", "name email companyName")
        .populate("reviewedBy", "name");

      if (!returnRequest) {
        throw new Error("Return request not found");
      }

      // Check authorization
      const isCustomer = returnRequest.customerId._id.toString() === userId;
      const isVendor = returnRequest.vendorId._id.toString() === userId;
      const isExpert = userRole === "expert";

      if (!isCustomer && !isVendor && !isExpert) {
        throw new Error("Unauthorized");
      }

      return returnRequest;
    } catch (error) {
      console.error("Get return by ID error:", error);
      throw error;
    }
  }

  /**
   * Approve return request
   * NOTE: Parameters are individual, not an object
   */
  async approveReturn(
    returnId,
    userId,
    reviewNotes = "",
    refundAmount,
    restockingFee = 0,
    shippingRefund = 0
  ) {
    try {
      const returnRequest = await Return.findById(returnId);

      if (!returnRequest) {
        throw new Error("Return request not found");
      }

      // Verify vendor
      if (returnRequest.vendorId.toString() !== userId) {
        throw new Error("Unauthorized to approve this return");
      }

      // Check status
      if (returnRequest.status !== "requested") {
        throw new Error(
          `Cannot approve return in ${returnRequest.status} status`
        );
      }

      // Calculate refund
      const finalRefundAmount =
        refundAmount !== undefined
          ? parseFloat(refundAmount)
          : returnRequest.returnAmount;

      const finalRestockingFee =
        restockingFee !== undefined ? parseFloat(restockingFee) : 0;

      const finalShippingRefund =
        shippingRefund !== undefined ? parseFloat(shippingRefund) : 0;

      // Update return
      returnRequest.status = "approved";
      returnRequest.refundAmount =
        finalRefundAmount - finalRestockingFee + finalShippingRefund;
      returnRequest.restockingFee = finalRestockingFee;
      returnRequest.shippingRefund = finalShippingRefund;
      returnRequest.reviewedBy = userId;
      returnRequest.reviewedAt = new Date();
      returnRequest.reviewNotes = reviewNotes || "";
      returnRequest.returnDeadline = new Date(
        Date.now() + 14 * 24 * 60 * 60 * 1000
      ); // 14 days

      returnRequest.statusHistory.push({
        status: "approved",
        timestamp: new Date(),
        updatedBy: userId,
        notes: reviewNotes || "Return approved by vendor",
      });

      await returnRequest.save();

      // Update order
      await Order.findByIdAndUpdate(returnRequest.orderId, {
        returnStatus: "approved",
      });

      // Send notification directly
      await notificationService.createNotification({
        userId: returnRequest.customerId,
        userRole: "customer",
        type: "return_approved",
        category: "return",
        title: "Return Request Approved",
        message: `Your return request ${returnRequest.returnNumber} has been approved! Refund amount: CVT ${returnRequest.refundAmount}. Please ship the item back within 14 days.`,
        priority: "high",
        actionType: "view_return",
        actionUrl: `/customer/returns/${returnRequest._id}`,
        relatedEntity: {
          entityType: "return",
          entityId: returnRequest._id,
          entityData: {
            returnNumber: returnRequest.returnNumber,
            refundAmount: returnRequest.refundAmount,
            returnDeadline: returnRequest.returnDeadline,
          },
        },
      });

      return {
        success: true,
        message: "Return approved successfully",
        return: returnRequest,
      };
    } catch (error) {
      console.error("Approve return error:", error);
      throw error;
    }
  }

  /**
   * Reject return request
   */
  async rejectReturn(returnId, userId, rejectionReason) {
    try {
      const returnRequest = await Return.findById(returnId);

      if (!returnRequest) {
        throw new Error("Return request not found");
      }

      // Verify vendor
      if (returnRequest.vendorId.toString() !== userId) {
        throw new Error("Unauthorized to reject this return");
      }

      // Check status
      if (returnRequest.status !== "requested") {
        throw new Error(
          `Cannot reject return in ${returnRequest.status} status`
        );
      }

      // Update return
      returnRequest.status = "rejected";
      returnRequest.rejectionReason = rejectionReason;
      returnRequest.reviewedBy = userId;
      returnRequest.reviewedAt = new Date();

      returnRequest.statusHistory.push({
        status: "rejected",
        timestamp: new Date(),
        updatedBy: userId,
        notes: rejectionReason,
      });

      await returnRequest.save();

      // Update order
      await Order.findByIdAndUpdate(returnRequest.orderId, {
        returnStatus: "rejected",
      });

      // Send notification directly
      await notificationService.createNotification({
        userId: returnRequest.customerId,
        userRole: "customer",
        type: "return_rejected",
        category: "return",
        title: "Return Request Rejected",
        message: `Your return request ${returnRequest.returnNumber} has been rejected. Reason: ${returnRequest.rejectionReason}`,
        priority: "high",
        actionType: "view_return",
        actionUrl: `/customer/returns/${returnRequest._id}`,
        relatedEntity: {
          entityType: "return",
          entityId: returnRequest._id,
          entityData: {
            returnNumber: returnRequest.returnNumber,
            rejectionReason: returnRequest.rejectionReason,
          },
        },
      });

      return {
        success: true,
        message: "Return rejected",
        return: returnRequest,
      };
    } catch (error) {
      console.error("Reject return error:", error);
      throw error;
    }
  }

  /**
   * Process refund
   */
  async processRefund(returnId, userId, notes = "") {
    try {
      const returnRequest =
        await Return.findById(returnId).populate("customerId");

      if (!returnRequest) {
        throw new Error("Return request not found");
      }

      // Check status
      if (returnRequest.status !== "inspected") {
        throw new Error(
          `Cannot process refund. Return must be inspected first. Current status: ${returnRequest.status}`
        );
      }

      // ✅ EXTRACT THE CUSTOMER ID (handle both populated and non-populated cases)
      const customerId =
        returnRequest.customerId._id || returnRequest.customerId;

      // ✅ ENSURE WALLET AND BLOCKCHAIN TOKEN ACCOUNT EXIST
      await walletBalanceService.getOrCreateWallet(customerId);

      // ✅ USE WALLET BALANCE SERVICE TO PROCESS REFUND
      // This will:
      // 1. Create wallet transaction record
      // 2. Mint tokens on blockchain
      // 3. Update wallet statistics
      // 4. Log the operation properly
      const refundResult = await walletBalanceService.processRefund(
        customerId, // ✅ Pass ID, not the populated object
        returnRequest.orderId,
        returnRequest.refundAmount,
        `Refund for return ${returnRequest.returnNumber}`,
        null // no session
      );

      console.log("✅ Wallet refund processed:", refundResult);

      // Update return status
      returnRequest.status = "refunded";
      returnRequest.refundedAt = new Date();
      returnRequest.refundTransactionId =
        refundResult.blockchainTxId || `TXN-${Date.now()}`;

      returnRequest.statusHistory.push({
        status: "refunded",
        timestamp: new Date(),
        updatedBy: userId,
        notes: notes || `Refunded ${returnRequest.refundAmount} CVT to wallet`,
      });

      await returnRequest.save();

      // Update order
      await Order.findByIdAndUpdate(returnRequest.orderId, {
        returnStatus: "refunded",
      });

      // Send notifications directly
      await notificationService.createNotification({
        userId: customerId, // ✅ Use extracted ID
        userRole: "customer",
        type: "refund_processed",
        category: "return",
        title: "Refund Processed",
        message: `Your refund of CVT ${returnRequest.refundAmount} has been processed and added to your wallet for return ${returnRequest.returnNumber}.`,
        priority: "high",
        actionType: "view_wallet",
        actionUrl: `/customer/wallet`,
        relatedEntity: {
          entityType: "return",
          entityId: returnRequest._id,
          entityData: {
            returnNumber: returnRequest.returnNumber,
            refundAmount: returnRequest.refundAmount,
            refundTransactionId: returnRequest.refundTransactionId,
          },
        },
      });

      await notificationService.createNotification({
        userId: returnRequest.vendorId,
        userRole: "vendor",
        type: "return_refund_completed",
        category: "return",
        title: "Return Refund Completed",
        message: `Refund of CVT ${returnRequest.refundAmount} has been processed for return ${returnRequest.returnNumber}. Return workflow completed.`,
        priority: "medium",
        actionType: "view_return",
        actionUrl: `/vendor/returns/${returnRequest._id}`,
        relatedEntity: {
          entityType: "return",
          entityId: returnRequest._id,
          entityData: {
            returnNumber: returnRequest.returnNumber,
            customerName: returnRequest.customerName,
            refundAmount: returnRequest.refundAmount,
          },
        },
      });

      return {
        success: true,
        message: "Refund processed successfully",
        return: returnRequest,
        refundDetails: {
          amount: returnRequest.refundAmount,
          newBalance: refundResult.newBalance,
          blockchainTxId: refundResult.blockchainTxId,
        },
      };
    } catch (error) {
      console.error("Process refund error:", error);
      throw error;
    }
  }

  /**
   * Get return statistics
   */
  async getReturnStatistics(vendorId, timeframe = "month") {
    try {
      const dateFilter = this.getDateFilter(timeframe);

      console.log("📊 Getting return stats for vendor:", vendorId);
      console.log("📊 Timeframe:", timeframe);
      console.log("📊 Date filter:", dateFilter);

      // ✅ CONVERT TO OBJECTID FOR AGGREGATION
      const vendorObjectId = new mongoose.Types.ObjectId(vendorId);
      console.log("📊 Vendor ObjectId:", vendorObjectId);

      // First, let's see what returns exist for this vendor
      const allVendorReturns = await Return.find({ vendorId: vendorObjectId }).lean();
      console.log("📊 Total returns for vendor:", allVendorReturns.length);
      console.log("📊 Return statuses:", allVendorReturns.map(r => r.status));

      const stats = await Return.aggregate([
        {
          $match: {
            vendorId: vendorObjectId, // ✅ Use ObjectId instead of string
            createdAt: dateFilter,
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            requested: {
              $sum: { $cond: [{ $eq: ["$status", "requested"] }, 1, 0] },
            },
            approved: {
              $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
            },
            rejected: {
              $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
            },
            refunded: {
              $sum: { $cond: [{ $eq: ["$status", "refunded"] }, 1, 0] },
            },
            totalRefunded: {
              $sum: {
                $cond: [{ $eq: ["$status", "refunded"] }, "$refundAmount", 0],
              },
            },
            pendingAmount: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      "$status",
                      ["requested", "approved", "item_received", "inspected"],
                    ],
                  },
                  "$returnAmount",
                  0,
                ],
              },
            },
          },
        },
      ]);

      console.log("📊 Aggregation result:", JSON.stringify(stats, null, 2));

      const result = stats[0] || {
        total: 0,
        requested: 0,
        approved: 0,
        rejected: 0,
        refunded: 0,
        totalRefunded: 0,
        pendingAmount: 0,
      };

      console.log("📊 Final stats:", result);

      return result;
    } catch (error) {
      console.error("Get return statistics error:", error);
      throw error;
    }
  }

  /**
   * Get date filter helper
   */
  getDateFilter(timeframe) {
    const now = new Date();
    switch (timeframe) {
      case "week":
        return { $gte: new Date(now.setDate(now.getDate() - 7)) };
      case "month":
        return { $gte: new Date(now.setMonth(now.getMonth() - 1)) };
      case "year":
        return { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) };
      case "all":
        return { $gte: new Date(0) };
      default:
        return { $gte: new Date(now.setMonth(now.getMonth() - 1)) };
    }
  }
}

export default new ReturnService();
