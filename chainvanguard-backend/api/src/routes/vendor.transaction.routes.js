import express from "express";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";
import VendorRequest from "../models/VendorRequest.js";
import Order from "../models/Order.js";
import VendorInventory from "../models/VendorInventory.js";
import mongoose from "mongoose";

const router = express.Router();

// ========================================
// VENDOR TRANSACTION & ORDER TRACKING
// ========================================

/**
 * GET /api/vendor/transactions
 * Get all vendor transactions (requests + orders)
 * Combines vendor requests with their related orders
 * Access: Vendor only
 *
 * Query params:
 * - status: filter by request status (pending/approved/rejected/cancelled/completed)
 * - orderStatus: filter by order status (pending/processing/shipped/delivered/cancelled)
 * - page: page number (default: 1)
 * - limit: items per page (default: 20)
 * - sortBy: field to sort by (default: createdAt)
 * - sortOrder: asc/desc (default: desc)
 * - startDate: filter from date
 * - endDate: filter to date
 * - supplierId: filter by supplier
 */
router.get(
  "/transactions",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const {
        status,
        orderStatus,
        page = 1,
        limit = 20,
        sortBy = "createdAt",
        sortOrder = "desc",
        startDate,
        endDate,
        supplierId,
      } = req.query;

      const vendorId = req.userId;
      const skip = (page - 1) * limit;

      // Build query for vendor requests
      const query = { vendorId: new mongoose.Types.ObjectId(vendorId) };

      if (status) {
        query.status = status;
      }

      if (supplierId) {
        try {
          query.supplierId = new mongoose.Types.ObjectId(supplierId);
        } catch (error) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid supplier ID" });
        }
      }

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      // Get transactions with order and inventory info
      const transactions = await VendorRequest.aggregate([
        {
          $match: query,
        },
        {
          $lookup: {
            from: "users",
            localField: "supplierId",
            foreignField: "_id",
            as: "supplier",
          },
        },
        {
          $unwind: {
            path: "$supplier",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "orders",
            localField: "orderId",
            foreignField: "_id",
            as: "orderDetails",
          },
        },
        {
          $unwind: {
            path: "$orderDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "vendorinventories",
            localField: "orderId",
            foreignField: "orderId",
            as: "inventory",
          },
        },
        // Add order status filter if provided
        ...(orderStatus
          ? [
              {
                $match: {
                  "orderDetails.status": orderStatus,
                },
              },
            ]
          : []),
        {
          $sort: {
            [sortBy]: sortOrder === "asc" ? 1 : -1,
          },
        },
        {
          $facet: {
            metadata: [{ $count: "total" }],
            data: [{ $skip: skip }, { $limit: parseInt(limit) }],
          },
        },
      ]);

      const total = transactions[0].metadata[0]?.total || 0;
      const data = transactions[0].data || [];

      // Format response
      const formattedTransactions = data.map((transaction) => ({
        // Request Info
        requestId: transaction._id,
        requestNumber: transaction.requestNumber,
        requestStatus: transaction.status,
        requestDate: transaction.createdAt,

        // Supplier Info
        supplier: {
          id: transaction.supplier?._id,
          name: transaction.supplier?.name,
          email: transaction.supplier?.email,
          companyName: transaction.supplier?.companyName,
        },

        // Financial Info
        amount: {
          subtotal: transaction.subtotal,
          tax: transaction.tax,
          total: transaction.total,
        },

        // Items
        items: transaction.items,
        itemCount: transaction.items?.length || 0,

        // Notes
        vendorNotes: transaction.vendorNotes,
        supplierNotes: transaction.supplierNotes,

        // Approval Info
        reviewedAt: transaction.reviewedAt,
        rejectionReason: transaction.rejectionReason,

        // Order Info (if exists)
        order: transaction.orderDetails
          ? {
              orderId: transaction.orderDetails._id,
              orderNumber: transaction.orderDetails.orderNumber,
              status: transaction.orderDetails.status,
              createdAt: transaction.orderDetails.createdAt,
              updatedAt: transaction.orderDetails.updatedAt,

              // Shipping info
              shippingAddress: transaction.orderDetails.shippingAddress,
              trackingNumber: transaction.orderDetails.trackingNumber,
              trackingUrl: transaction.orderDetails.trackingUrl,
              courierName: transaction.orderDetails.courierName,
              estimatedDeliveryDate:
                transaction.orderDetails.estimatedDeliveryDate,
              actualDeliveryDate: transaction.orderDetails.actualDeliveryDate,

              // Status history
              statusHistory: transaction.orderDetails.statusHistory,

              // Current status info
              currentStatus: {
                status: transaction.orderDetails.status,
                lastUpdate: transaction.orderDetails.updatedAt,
              },
            }
          : null,

        // Inventory Info (auto-created from delivered orders)
        inventory: transaction.inventory
          ? {
              created: transaction.inventory.length > 0,
              itemCount: transaction.inventory.length,
              items: transaction.inventory.map((inv) => ({
                inventoryId: inv._id,
                name: inv.inventoryItem?.name,
                quantity: inv.quantity?.current,
                status: inv.status,
              })),
            }
          : {
              created: false,
              itemCount: 0,
              items: [],
            },

        // Blockchain Info
        blockchain: {
          verified: transaction.blockchainVerified,
          txId: transaction.blockchainTxId,
        },

        // Timestamps
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      }));

      res.json({
        success: true,
        data: formattedTransactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("❌ GET /api/vendor/transactions error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get transactions",
      });
    }
  }
);

/**
 * GET /api/vendor/transactions/stats
 * Get vendor transaction statistics
 * Access: Vendor only
 */
router.get(
  "/transactions/stats",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const vendorId = new mongoose.Types.ObjectId(req.userId);
      const { timeframe = "month" } = req.query;

      // Calculate date range
      let startDate = new Date();
      switch (timeframe) {
        case "week":
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case "year":
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(startDate.getMonth() - 1);
      }

      // Aggregate statistics
      const stats = await VendorRequest.aggregate([
        {
          $match: {
            vendorId: new mongoose.Types.ObjectId(vendorId),
            createdAt: { $gte: startDate },
          },
        },
        {
          $facet: {
            // Count by status
            statusCounts: [
              {
                $group: {
                  _id: "$status",
                  count: { $sum: 1 },
                  totalAmount: { $sum: "$total" },
                },
              },
            ],

            // Total spent
            totalSpent: [
              {
                $match: {
                  status: { $in: ["approved", "completed"] },
                  orderId: { $exists: true },
                },
              },
              {
                $group: {
                  _id: null,
                  total: { $sum: "$total" },
                },
              },
            ],

            // Recent transactions
            recentTransactions: [
              { $sort: { createdAt: -1 } },
              { $limit: 5 },
              {
                $lookup: {
                  from: "users",
                  localField: "supplierId",
                  foreignField: "_id",
                  as: "supplier",
                },
              },
              { $unwind: "$supplier" },
            ],

            // Pending requests
            pendingRequests: [
              {
                $match: {
                  status: "pending",
                },
              },
              { $count: "count" },
            ],

            // Orders in transit
            ordersInTransit: [
              {
                $match: {
                  status: "approved",
                  orderId: { $exists: true },
                },
              },
              {
                $lookup: {
                  from: "orders",
                  localField: "orderId",
                  foreignField: "_id",
                  as: "order",
                },
              },
              { $unwind: "$order" },
              {
                $match: {
                  "order.status": { $in: ["processing", "shipped"] },
                },
              },
              { $count: "count" },
            ],
          },
        },
      ]);

      const result = stats[0];

      // Format status counts
      const statusBreakdown = {};
      result.statusCounts.forEach((item) => {
        statusBreakdown[item._id] = {
          count: item.count,
          totalAmount: item.totalAmount,
        };
      });

      res.json({
        success: true,
        stats: {
          statusBreakdown,
          totalSpent: result.totalSpent[0]?.total || 0,
          pendingRequests: result.pendingRequests[0]?.count || 0,
          ordersInTransit: result.ordersInTransit[0]?.count || 0,
          recentTransactions: result.recentTransactions.map((tx) => ({
            requestId: tx._id,
            requestNumber: tx.requestNumber,
            supplier: tx.supplier.name,
            amount: tx.total,
            status: tx.status,
            date: tx.createdAt,
          })),
        },
        timeframe,
      });
    } catch (error) {
      console.error("❌ GET /api/vendor/transactions/stats error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get transaction statistics",
      });
    }
  }
);

/**
 * GET /api/vendor/transactions/:requestId
 * Get detailed transaction information
 * Shows request, order, and inventory details
 * Access: Vendor only
 */
router.get(
  "/transactions/:requestId",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const { requestId } = req.params;
      const vendorId = req.userId;

      // Get request with all related data
      const request = await VendorRequest.findOne({
        _id: requestId,
        vendorId,
      })
        .populate("supplierId", "name email companyName phone")
        .populate("items.inventoryId", "name description sku category")
        .populate("reviewedBy", "name email");

      if (!request) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found",
        });
      }

      // Get order details if exists
      let order = null;
      let inventory = [];

      if (request.orderId) {
        order = await Order.findById(request.orderId)
          .populate("sellerId", "name email companyName")
          .populate("statusHistory.updatedBy", "name email role");

        // Get vendor inventory created from this order
        inventory = await VendorInventory.find({
          orderId: request.orderId,
          vendorId,
        }).populate("supplier.supplierId", "name companyName");
      }

      // Build detailed response
      const response = {
        success: true,
        data: {
          // Request Details
          request: {
            id: request._id,
            requestNumber: request.requestNumber,
            status: request.status,
            createdAt: request.createdAt,
            updatedAt: request.updatedAt,

            // Supplier
            supplier: {
              id: request.supplierId._id,
              name: request.supplierId.name,
              email: request.supplierId.email,
              companyName: request.supplierId.companyName,
              phone: request.supplierId.phone,
            },

            // Items
            items: request.items.map((item) => ({
              inventoryId: item.inventoryId._id,
              name: item.inventoryId.name,
              description: item.inventoryId.description,
              sku: item.inventoryId.sku,
              category: item.inventoryId.category,
              quantity: item.quantity,
              pricePerUnit: item.pricePerUnit,
              subtotal: item.subtotal,
            })),

            // Amounts
            subtotal: request.subtotal,
            tax: request.tax,
            total: request.total,

            // Notes
            vendorNotes: request.vendorNotes,
            supplierNotes: request.supplierNotes,

            // Review Info
            reviewedAt: request.reviewedAt,
            reviewedBy: request.reviewedBy
              ? {
                  id: request.reviewedBy._id,
                  name: request.reviewedBy.name,
                  email: request.reviewedBy.email,
                }
              : null,
            rejectionReason: request.rejectionReason,

            // Blockchain
            blockchainVerified: request.blockchainVerified,
            blockchainTxId: request.blockchainTxId,

            // Status History
            statusHistory: request.statusHistory,
          },

          // Order Details (if exists)
          order: order
            ? {
                id: order._id,
                orderNumber: order.orderNumber,
                status: order.status,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,

                // Seller
                seller: {
                  id: order.sellerId._id,
                  name: order.sellerId.name,
                  email: order.sellerId.email,
                  companyName: order.sellerId.companyName,
                },

                // Amounts
                subtotal: order.subtotal,
                tax: order.tax,
                shippingFee: order.shippingFee,
                totalAmount: order.totalAmount,

                // Shipping
                shippingAddress: order.shippingAddress,
                shippingMethod: order.shippingMethod,
                trackingNumber: order.trackingNumber,
                trackingUrl: order.trackingUrl,
                courierName: order.courierName,
                estimatedDeliveryDate: order.estimatedDeliveryDate,
                actualDeliveryDate: order.actualDeliveryDate,

                // Payment
                paymentMethod: order.paymentMethod,
                paymentStatus: order.paymentStatus,
                paidAt: order.paidAt,

                // Status History with timeline
                statusHistory: order.statusHistory.map((status) => ({
                  status: status.status,
                  timestamp: status.timestamp,
                  updatedBy: status.updatedBy
                    ? {
                        name: status.updatedBy.name,
                        email: status.updatedBy.email,
                        role: status.updatedBy.role,
                      }
                    : null,
                  comment: status.comment,
                })),

                // Supply chain events
                supplyChainEvents: order.supplyChainEvents,

                // Blockchain
                blockchainTxId: order.blockchainTxId,
              }
            : null,

          // Vendor Inventory (auto-created from delivered orders)
          inventory: {
            created: inventory.length > 0,
            itemCount: inventory.length,
            items: inventory.map((inv) => ({
              id: inv._id,
              inventoryItem: {
                name: inv.inventoryItem.name,
                description: inv.inventoryItem.description,
                sku: inv.inventoryItem.sku,
                category: inv.inventoryItem.category,
              },
              quantity: {
                received: inv.quantity.received,
                current: inv.quantity.current,
                used: inv.quantity.used,
                reserved: inv.quantity.reserved,
              },
              pricing: inv.pricing,
              status: inv.status,
              supplier: {
                name: inv.supplier.supplierName,
                supplierId: inv.supplier.supplierId,
              },
              dates: inv.dates,
              movements: inv.movements,
            })),
          },

          // Transaction Timeline
          timeline: buildTransactionTimeline(request, order, inventory),
        },
      };

      res.json(response);
    } catch (error) {
      console.error("❌ GET /api/vendor/transactions/:requestId error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get transaction details",
      });
    }
  }
);

/**
 * GET /api/vendor/orders/tracking
 * Get all orders with tracking information
 * Access: Vendor only
 */
router.get(
  "/orders/tracking",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const vendorId = req.userId;
      const { status, page = 1, limit = 20 } = req.query;

      const skip = (page - 1) * limit;

      // Get all vendor requests with orders
      const query = {
        vendorId: new mongoose.Types.ObjectId(vendorId),
        orderId: { $exists: true, $ne: null },
      };

      const orders = await VendorRequest.aggregate([
        { $match: query },
        {
          $lookup: {
            from: "orders",
            localField: "orderId",
            foreignField: "_id",
            as: "order",
          },
        },
        { $unwind: "$order" },
        // Filter by order status if provided
        ...(status
          ? [
              {
                $match: {
                  "order.status": status,
                },
              },
            ]
          : []),
        {
          $lookup: {
            from: "users",
            localField: "supplierId",
            foreignField: "_id",
            as: "supplier",
          },
        },
        { $unwind: "$supplier" },
        { $sort: { "order.createdAt": -1 } },
        {
          $facet: {
            metadata: [{ $count: "total" }],
            data: [{ $skip: skip }, { $limit: parseInt(limit) }],
          },
        },
      ]);

      const total = orders[0].metadata[0]?.total || 0;
      const data = orders[0].data || [];

      const formattedOrders = data.map((item) => ({
        requestNumber: item.requestNumber,
        orderNumber: item.order.orderNumber,
        orderId: item.order._id,
        status: item.order.status,

        supplier: {
          name: item.supplier.name,
          companyName: item.supplier.companyName,
        },

        amount: item.order.totalAmount,
        itemCount: item.order.items?.length || 0,

        // Tracking info
        tracking: {
          number: item.order.trackingNumber,
          url: item.order.trackingUrl,
          courier: item.order.courierName,
          estimatedDelivery: item.order.estimatedDeliveryDate,
          actualDelivery: item.order.actualDeliveryDate,
        },

        // Shipping address
        shippingAddress: item.order.shippingAddress,

        // Dates
        orderDate: item.order.createdAt,
        lastUpdate: item.order.updatedAt,

        // Status progress
        statusProgress: calculateStatusProgress(item.order.status),
      }));

      res.json({
        success: true,
        data: formattedOrders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("❌ GET /api/vendor/orders/tracking error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get order tracking",
      });
    }
  }
);

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Build transaction timeline
 */
function buildTransactionTimeline(request, order, inventory) {
  const timeline = [];

  // Request created
  timeline.push({
    stage: "request_created",
    title: "Request Created",
    description: `Purchase request ${request.requestNumber} submitted`,
    timestamp: request.createdAt,
    status: "completed",
  });

  // Request reviewed
  if (request.reviewedAt) {
    timeline.push({
      stage: "request_reviewed",
      title:
        request.status === "approved"
          ? "Request Approved"
          : request.status === "rejected"
            ? "Request Rejected"
            : "Request Reviewed",
      description:
        request.status === "approved"
          ? "Supplier approved the request"
          : request.status === "rejected"
            ? `Request rejected: ${request.rejectionReason}`
            : "Supplier reviewed the request",
      timestamp: request.reviewedAt,
      status: "completed",
    });
  }

  if (order) {
    // Payment completed
    if (order.paidAt) {
      timeline.push({
        stage: "payment_completed",
        title: "Payment Completed",
        description: `Order ${order.orderNumber} created and paid`,
        timestamp: order.paidAt,
        status: "completed",
      });
    }

    // Order status updates
    if (order.statusHistory && order.statusHistory.length > 0) {
      order.statusHistory.forEach((status) => {
        timeline.push({
          stage: `order_${status.status}`,
          title: `Order ${status.status.charAt(0).toUpperCase() + status.status.slice(1)}`,
          description: status.comment || `Order marked as ${status.status}`,
          timestamp: status.timestamp,
          status: "completed",
        });
      });
    }

    // Add expected delivery
    if (order.status === "shipped" && order.estimatedDeliveryDate) {
      timeline.push({
        stage: "expected_delivery",
        title: "Expected Delivery",
        description: "Estimated delivery date",
        timestamp: order.estimatedDeliveryDate,
        status:
          order.status === "delivered" || order.actualDeliveryDate
            ? "completed"
            : "pending",
      });
    }
  }

  // Inventory created
  if (inventory && inventory.length > 0) {
    const oldestInventory = inventory.reduce((oldest, item) =>
      item.dates.received < oldest.dates.received ? item : oldest
    );

    timeline.push({
      stage: "inventory_created",
      title: "Inventory Created",
      description: `${inventory.length} items added to your inventory`,
      timestamp: oldestInventory.dates.received,
      status: "completed",
    });
  }

  // Sort timeline
  timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return timeline;
}

/**
 * Calculate status progress percentage
 */
function calculateStatusProgress(status) {
  const statusSteps = {
    pending: 20,
    processing: 40,
    shipped: 60,
    delivered: 100,
    cancelled: 0,
  };

  return {
    percentage: statusSteps[status] || 0,
    currentStep: status,
    steps: [
      {
        name: "pending",
        label: "Pending",
        completed: ["processing", "shipped", "delivered"].includes(status),
      },
      {
        name: "processing",
        label: "Processing",
        completed: ["shipped", "delivered"].includes(status),
      },
      {
        name: "shipped",
        label: "Shipped",
        completed: ["delivered"].includes(status),
      },
      {
        name: "delivered",
        label: "Delivered",
        completed: status === "delivered",
      },
    ],
  };
}

export default router;
