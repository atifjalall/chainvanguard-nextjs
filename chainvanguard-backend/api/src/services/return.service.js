import Return from "../models/Return.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import walletBalanceService from "./wallet.balance.service.js";
import notificationService from "./notification.service.js";
import blockchainService from "./blockchain.service.js";
import mongoose from "mongoose";

/**
 * ========================================
 * RETURN SERVICE
 * ========================================
 * Manage product returns and refunds
 */

class ReturnService {
  // ========================================
  // CREATE RETURN
  // ========================================

  /**
   * Create a new return request
   */
  async createReturn(customerId, returnData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { orderId, items, reason, reasonDetails, images } = returnData;

      // Validate order
      const order = await Order.findById(orderId).session(session);

      if (!order) {
        throw new Error("Order not found");
      }

      if (order.customerId.toString() !== customerId) {
        throw new Error("Unauthorized: This is not your order");
      }

      if (!["delivered", "completed"].includes(order.status)) {
        throw new Error("Only delivered orders can be returned");
      }

      // Check if already returned
      const existingReturn = await Return.findOne({
        orderId,
        status: { $nin: ["cancelled", "rejected"] },
      }).session(session);

      if (existingReturn) {
        throw new Error("A return request already exists for this order");
      }

      // Check return window (usually 30 days)
      const returnWindow = 30; // days
      const orderDeliveryDate = order.actualDeliveryDate || order.createdAt;
      const daysSinceDelivery = Math.ceil(
        (new Date() - orderDeliveryDate) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceDelivery > returnWindow) {
        throw new Error(
          `Return window has expired. Returns must be initiated within ${returnWindow} days of delivery`
        );
      }

      // Validate return items
      const returnItems = [];
      let returnAmount = 0;

      for (const item of items) {
        const orderItem = order.items.find(
          (i) => i.productId.toString() === item.productId
        );

        if (!orderItem) {
          throw new Error(`Product ${item.productId} not found in order`);
        }

        if (item.quantity > orderItem.quantity) {
          throw new Error(
            `Cannot return more than ${orderItem.quantity} units of ${orderItem.productName}`
          );
        }

        const itemSubtotal = orderItem.price * item.quantity;
        returnAmount += itemSubtotal;

        returnItems.push({
          productId: item.productId,
          productName: orderItem.productName,
          quantity: item.quantity,
          price: orderItem.price,
          subtotal: itemSubtotal,
          reason: item.reason || reason,
          condition: item.condition || "unopened",
        });
      }

      // Get vendor details
      const vendor = await User.findById(order.sellerId).session(session);

      // Calculate refund details
      let refundAmount = returnAmount;
      let restockingFee = 0;
      let shippingRefund = 0;

      // Apply restocking fee for certain reasons (except defective/wrong item)
      if (
        !["defective", "damaged", "wrong_item", "not_as_described"].includes(
          reason
        )
      ) {
        restockingFee = returnAmount * 0.1; // 10% restocking fee
        refundAmount -= restockingFee;
      }

      // Refund shipping for vendor's fault
      if (
        [
          "defective",
          "damaged",
          "wrong_item",
          "not_as_described",
          "late_delivery",
        ].includes(reason)
      ) {
        shippingRefund = order.shippingCost || 0;
        refundAmount += shippingRefund;
      }

      // Generate returnNumber before saving
      const returnNumber = `RTN-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 6)
        .toUpperCase()}`;
      returnData.returnNumber = returnNumber;

      // Create return request
      const returnRequest = new Return({
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerId,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        vendorId: order.sellerId,
        vendorName: vendor.name,
        items: returnItems,
        reason,
        reasonDetails,
        returnAmount,
        refundAmount,
        restockingFee,
        shippingRefund,
        images: images || [],
        status: "requested",
        returnNumber,
      });

      await returnRequest.save({ session });

      await notificationService.createNotification({
        userId: customerId,
        userRole: "customer",
        type: "order_returned",
        category: "order",
        title: "Return Request Submitted",
        message: `Your return request for order #${order.orderNumber} has been submitted`,
        orderId: order._id,
        priority: "high",
        actionType: "view_order",
        actionUrl: `/returns/${returnRequest._id}`,
        relatedEntity: {
          entityType: "order",
          entityId: order._id,
        },
      });

      // Notify vendor
      await notificationService.createNotification({
        userId: order.sellerId,
        userRole: "vendor",
        type: "order_returned",
        category: "order",
        title: "Return Request Received",
        message: `Return request received for order #${order.orderNumber}`,
        orderId: order._id,
        priority: "high",
        actionType: "view_order",
        actionUrl: `/returns/${returnRequest._id}`,
      });

      // Update order status
      order.returnRequested = true;
      order.returnReason = reason;
      order.returnStatus = "requested";
      await order.save({ session });

      // Log to blockchain
      try {
        const txId = await blockchainService.logTransaction({
          type: "return_requested",
          returnId: returnRequest._id,
          orderId: order._id,
          customerId,
          vendorId: order.sellerId,
          returnAmount,
          reason,
        });

        returnRequest.blockchainTxId = txId;
        returnRequest.blockchainVerified = true;
        await returnRequest.save({ session });
      } catch (error) {
        console.error("Blockchain logging failed:", error);
      }

      // Send notification to vendor
      try {
        await notificationService.createNotification({
          recipientId: order.sellerId,
          title: "New Return Request",
          message: `Customer ${order.customerName} requested a return for order ${order.orderNumber}`,
          category: "returns",
          priority: "high",
          action: {
            type: "view_return",
            url: `/vendor/returns/${returnRequest._id}`,
          },
          metadata: {
            returnId: returnRequest._id,
            orderId: order._id,
            returnAmount,
          },
        });
      } catch (error) {
        console.error("Notification failed:", error);
      }

      await session.commitTransaction();

      return {
        success: true,
        message: "Return request submitted successfully",
        return: await returnRequest.populate(["customerId", "vendorId"]),
      };
    } catch (error) {
      await session.abortTransaction();
      console.error("❌ Create return error:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ========================================
  // GET RETURNS
  // ========================================

  /**
   * Get customer's returns
   */
  async getCustomerReturns(customerId, filters = {}) {
    const {
      status,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    const query = { customerId };

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const [returns, total] = await Promise.all([
      Return.find(query)
        .populate("vendorId", "name email companyName")
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Return.countDocuments(query),
    ]);

    return {
      returns,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get vendor's returns
   */
  async getVendorReturns(vendorId, filters = {}) {
    const {
      status,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
      startDate,
      endDate,
    } = filters;

    const query = { vendorId };

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const [returns, total] = await Promise.all([
      Return.find(query)
        .populate("customerId", "name email phone city")
        .populate("orderId", "orderNumber total createdAt")
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Return.countDocuments(query),
    ]);

    return {
      returns,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get return by ID
   */
  async getReturnById(returnId, userId, userRole) {
    const returnRequest = await Return.findById(returnId)
      .populate("customerId", "name email phone walletAddress")
      .populate("vendorId", "name email companyName walletAddress")
      .populate("orderId", "orderNumber total createdAt deliveryDate items");

    if (!returnRequest) {
      throw new Error("Return request not found");
    }

    // Check authorization
    if (userRole === "customer") {
      if (returnRequest.customerId._id.toString() !== userId) {
        throw new Error("Unauthorized");
      }
    } else if (userRole === "vendor") {
      if (returnRequest.vendorId._id.toString() !== userId) {
        throw new Error("Unauthorized");
      }
    }
    // Experts can view all returns

    return returnRequest;
  }

  // ========================================
  // APPROVE/REJECT RETURN
  // ========================================

  /**
   * Approve return request
   */
  async approveReturn(returnId, vendorId, notes = "") {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const returnRequest = await Return.findById(returnId).session(session);

      if (!returnRequest) {
        throw new Error("Return request not found");
      }

      if (returnRequest.vendorId.toString() !== vendorId) {
        throw new Error("Unauthorized");
      }

      if (returnRequest.status !== "requested") {
        throw new Error("Only requested returns can be approved");
      }

      returnRequest.status = "approved";
      returnRequest.reviewedBy = vendorId;
      returnRequest.reviewedAt = new Date();
      returnRequest.reviewNotes = notes;
      returnRequest.returnDeadline = new Date(
        Date.now() + 14 * 24 * 60 * 60 * 1000
      ); // 14 days

      returnRequest.addStatusHistory("approved", vendorId, notes);

      await returnRequest.save({ session });

      await notificationService.createNotification({
        userId: returnRequest.customerId,
        userRole: "customer",
        type: "order_refunded",
        category: "payment",
        title: "Return Approved",
        message: `Your return request has been approved. Refund of $${returnRequest.refundAmount.toFixed(2)} will be processed shortly`,
        orderId: returnRequest.orderId,
        priority: "high",
      });

      // Update order
      await Order.findByIdAndUpdate(
        returnRequest.orderId,
        { returnStatus: "approved" },
        { session }
      );

      // Notify customer
      await notificationService.createNotification({
        recipientId: returnRequest.customerId,
        title: "Return Approved",
        message: `Your return request for order ${returnRequest.orderNumber} has been approved`,
        category: "returns",
        priority: "high",
        action: {
          type: "view_return",
          url: `/customer/returns/${returnRequest._id}`,
        },
      });

      await session.commitTransaction();

      return {
        success: true,
        message: "Return approved successfully",
        return: returnRequest,
      };
    } catch (error) {
      await session.abortTransaction();
      console.error("❌ Approve return error:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Reject return request
   */
  async rejectReturn(returnId, vendorId, rejectionReason) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const returnRequest = await Return.findById(returnId).session(session);

      if (!returnRequest) {
        throw new Error("Return request not found");
      }

      if (returnRequest.vendorId.toString() !== vendorId) {
        throw new Error("Unauthorized");
      }

      if (returnRequest.status !== "requested") {
        throw new Error("Only requested returns can be rejected");
      }

      returnRequest.status = "rejected";
      returnRequest.reviewedBy = vendorId;
      returnRequest.reviewedAt = new Date();
      returnRequest.rejectionReason = rejectionReason;

      returnRequest.addStatusHistory("rejected", vendorId, rejectionReason);

      await returnRequest.save({ session });

      await notificationService.createNotification({
        userId: returnRequest.customerId,
        userRole: "customer",
        type: "general",
        category: "order",
        title: "Return Request Declined",
        message: `Your return request has been declined. Reason: ${reason}`,
        orderId: returnRequest.orderId,
        priority: "high",
      });

      // Update order
      await Order.findByIdAndUpdate(
        returnRequest.orderId,
        { returnStatus: "rejected" },
        { session }
      );

      // Notify customer
      await notificationService.createNotification({
        recipientId: returnRequest.customerId,
        title: "Return Rejected",
        message: `Your return request for order ${returnRequest.orderNumber} was rejected`,
        category: "returns",
        priority: "medium",
        metadata: {
          reason: rejectionReason,
        },
      });

      await session.commitTransaction();

      return {
        success: true,
        message: "Return rejected",
        return: returnRequest,
      };
    } catch (error) {
      await session.abortTransaction();
      console.error("❌ Reject return error:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ========================================
  // PROCESS REFUND
  // ========================================

  /**
   * Process refund (after item received and inspected)
   */
  async processRefund(returnId, expertId, inspectionNotes) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const returnRequest = await Return.findById(returnId).session(session);

      if (!returnRequest) {
        throw new Error("Return request not found");
      }

      if (
        returnRequest.status !== "item_received" &&
        returnRequest.status !== "inspected"
      ) {
        throw new Error("Item must be received and inspected before refund");
      }

      // Calculate final refund amount
      returnRequest.calculateRefundAmount();

      // Process wallet refund
      await walletBalanceService.addBalance(
        returnRequest.customerId,
        returnRequest.refundAmount,
        `Refund for return ${returnRequest.returnNumber}`,
        session
      );

      returnRequest.status = "refunded";
      returnRequest.refundedAt = new Date();
      returnRequest.refundTransactionId = `REF-${Date.now()}`;
      returnRequest.resolution = "full_refund";

      returnRequest.inspection = {
        inspectedBy: expertId,
        inspectedAt: new Date(),
        notes: inspectionNotes,
        approved: true,
      };

      returnRequest.addStatusHistory("refunded", expertId, "Refund processed");

      await returnRequest.save({ session });

      // Update order
      await Order.findByIdAndUpdate(
        returnRequest.orderId,
        {
          returnStatus: "completed",
          paymentStatus: "refunded",
          refundAmount: returnRequest.refundAmount,
          refundedAt: new Date(),
        },
        { session }
      );

      // Notify customer
      await notificationService.createNotification({
        recipientId: returnRequest.customerId,
        title: "Refund Processed",
        message: `Your refund of $${returnRequest.refundAmount} has been processed`,
        category: "returns",
        priority: "high",
      });

      await session.commitTransaction();

      return {
        success: true,
        message: "Refund processed successfully",
        refundAmount: returnRequest.refundAmount,
        return: returnRequest,
      };
    } catch (error) {
      await session.abortTransaction();
      console.error("❌ Process refund error:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ========================================
  // STATISTICS
  // ========================================

  /**
   * Get return statistics for vendor
   */
  async getReturnStatistics(vendorId, timeframe = "month") {
    return await Return.getStatistics(vendorId, timeframe);
  }
}

export default new ReturnService();
