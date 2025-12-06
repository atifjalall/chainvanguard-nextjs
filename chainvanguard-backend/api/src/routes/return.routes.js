import express from "express";
import returnService from "../services/return.service.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";
import Return from "../models/Return.js";
import Product from "../models/Product.js";
import notificationService from "../services/notification.service.js";
import { initializeSafeMode, queryCollection, countDocuments } from "../utils/safeMode/lokiService.js";

const router = express.Router();

/**
 * ========================================
 * RETURN ROUTES
 * ========================================
 * Manage product returns and refunds
 */

// ========================================
// CUSTOMER ENDPOINTS
// ========================================

/**
 * POST /api/returns
 * Create a new return request
 * Access: Customer only
 *
 * Body:
 * - orderId: Order ID
 * - items: Array of items to return
 * - reason: Return reason
 * - reasonDetails: Detailed explanation
 * - images: Optional images
 */
router.post("/", authenticate, authorizeRoles("customer"), async (req, res) => {
  try {
    const result = await returnService.createReturn(req.userId, req.body);

    res.status(201).json(result);
  } catch (error) {
    console.error("❌ Create return error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create return request",
    });
  }
});

/**
 * GET /api/returns/customer
 * Get customer's return requests
 * Access: Customer only
 *
 * Query Params:
 * - status: Filter by status
 * - page: Page number
 * - limit: Items per page
 * - sortBy: Sort field
 * - sortOrder: Sort order (asc/desc)
 */
router.get(
  "/customer",
  authenticate,
  authorizeRoles("customer"),
  async (req, res) => {
    try {
      // SAFE MODE: Query LokiJS in-memory database
      if (req.safeMode) {
        // Initialize safe mode (loads data into LokiJS from IPFS/Redis cache)
        await initializeSafeMode(req.userId, 100);

        // Build query
        const query = { userId: req.userId };
        if (req.query.status) {
          query.status = req.query.status;
        }

        // Build options
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const options = {
          sort: { [sortBy]: sortOrder },
          skip,
          limit
        };

        // Query LokiJS with MongoDB-like syntax
        const returns = queryCollection(req.userId, 'returns', query, options);
        const total = countDocuments(req.userId, 'returns', query);

        return res.json({
          success: true,
          returns,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          },
          safeMode: true,
          warning: 'Viewing backup data from last snapshot. Write operations are disabled during maintenance.'
        });
      }

      // NORMAL MODE: Query MongoDB
      const filters = {
        status: req.query.status,
        page: req.query.page,
        limit: req.query.limit,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      };

      const result = await returnService.getCustomerReturns(
        req.userId,
        filters
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("❌ Get customer returns error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve returns",
      });
    }
  }
);

// ========================================
// VENDOR ENDPOINTS
// ========================================

/**
 * GET /api/returns/vendor
 * Get vendor's return requests
 * Access: Vendor only
 *
 * Query Params:
 * - status: Filter by status
 * - page: Page number
 * - limit: Items per page
 * - sortBy: Sort field
 * - sortOrder: Sort order (asc/desc)
 * - search: Search by return number, customer name, order number
 * - startDate: Filter from date
 * - endDate: Filter to date
 */
router.get(
  "/vendor",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      // SAFE MODE: Query LokiJS in-memory database
      if (req.safeMode) {
        // Initialize safe mode (loads data into LokiJS from IPFS/Redis cache)
        await initializeSafeMode(req.userId, 100);

        // Build query
        const query = { vendorId: req.userId };

        if (req.query.status) {
          query.status = req.query.status;
        }

        // Date range filter (LokiJS supports $gte, $lte operators)
        if (req.query.startDate || req.query.endDate) {
          query.createdAt = {};
          if (req.query.startDate) {
            query.createdAt.$gte = new Date(req.query.startDate);
          }
          if (req.query.endDate) {
            query.createdAt.$lte = new Date(req.query.endDate);
          }
        }

        // For search, we'll need to manually filter after query (LokiJS doesn't support $or with $regex easily)
        let returns = queryCollection(req.userId, 'returns', query);

        // Apply search filter manually
        if (req.query.search) {
          const searchLower = req.query.search.toLowerCase();
          returns = returns.filter(r =>
            r.returnNumber?.toLowerCase().includes(searchLower) ||
            r.customerName?.toLowerCase().includes(searchLower) ||
            r.orderNumber?.toLowerCase().includes(searchLower)
          );
        }

        // Manual sorting and pagination
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        returns.sort((a, b) => {
          const aVal = a[sortBy];
          const bVal = b[sortBy];
          if (aVal < bVal) return -sortOrder;
          if (aVal > bVal) return sortOrder;
          return 0;
        });

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const total = returns.length;
        const paginatedReturns = returns.slice(skip, skip + limit);

        return res.json({
          success: true,
          returns: paginatedReturns,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          },
          safeMode: true,
          warning: 'Viewing backup data from last snapshot. Write operations are disabled during maintenance.'
        });
      }

      // NORMAL MODE: Query MongoDB
      const filters = {
        status: req.query.status,
        page: req.query.page,
        limit: req.query.limit,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
        search: req.query.search,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };

      const result = await returnService.getVendorReturns(req.userId, filters);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("❌ Get vendor returns error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve returns",
      });
    }
  }
);

/**
 * GET /api/returns/vendor/stats
 * Get return statistics for vendor
 * Access: Vendor only
 *
 * Query Params:
 * - timeframe: 'week', 'month', 'year', 'all' (default: 'all')
 */
router.get(
  "/vendor/stats",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const timeframe = req.query.timeframe || "all";

      const stats = await returnService.getReturnStatistics(
        req.userId,
        timeframe
      );

      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      console.error("❌ Get return stats error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve return statistics",
      });
    }
  }
);

/**
 * PATCH /api/returns/:id/approve
 * Approve return request
 * Access: Vendor only
 *
 * Body:
 * - reviewNotes: Optional approval notes
 * - refundAmount: Optional custom refund amount
 * - restockingFee: Optional restocking fee
 * - shippingRefund: Optional shipping refund
 */
router.patch(
  "/:id/approve",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const { reviewNotes, refundAmount, restockingFee, shippingRefund } =
        req.body;

      // Call service with individual parameters, not object
      const result = await returnService.approveReturn(
        req.params.id,
        req.userId,
        reviewNotes,
        refundAmount,
        restockingFee,
        shippingRefund
      );

      res.json(result);
    } catch (error) {
      console.error("❌ Approve return error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to approve return",
      });
    }
  }
);

/**
 * PATCH /api/returns/:id/reject
 * Reject return request
 * Access: Vendor only
 *
 * Body:
 * - rejectionReason: Reason for rejection (required)
 */
router.patch(
  "/:id/reject",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const { rejectionReason } = req.body;

      if (!rejectionReason) {
        return res.status(400).json({
          success: false,
          message: "Rejection reason is required",
        });
      }

      const result = await returnService.rejectReturn(
        req.params.id,
        req.userId,
        rejectionReason
      );

      res.json(result);
    } catch (error) {
      console.error("❌ Reject return error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to reject return",
      });
    }
  }
);

/**
 * PATCH /api/returns/:id/item-received
 * Mark return as item received
 * Access: Vendor only
 *
 * Body:
 * - notes: Optional notes
 */
router.patch(
  "/:id/item-received",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const { notes } = req.body;

      const returnRequest = await Return.findById(req.params.id);

      if (!returnRequest) {
        return res.status(404).json({
          success: false,
          message: "Return request not found",
        });
      }

      // Verify vendor ownership
      if (returnRequest.vendorId.toString() !== req.userId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized to access this return",
        });
      }

      // Check status
      if (returnRequest.status !== "approved") {
        return res.status(400).json({
          success: false,
          message: `Cannot mark as received. Current status: ${returnRequest.status}`,
        });
      }

      // Update status
      returnRequest.status = "item_received";
      returnRequest.statusHistory.push({
        status: "item_received",
        timestamp: new Date(),
        updatedBy: req.userId,
        notes: notes || "Item received by vendor",
      });

      await returnRequest.save();

      // Send notification directly
      await notificationService.createNotification({
        userId: returnRequest.vendorId,
        userRole: "vendor",
        type: "return_item_received",
        category: "return",
        title: "Return Item Marked as Received",
        message: `Return ${returnRequest.returnNumber} has been marked as received. Please inspect the item and process accordingly.`,
        priority: "normal",
        actionType: "view_return",
        actionUrl: `/vendor/returns/${returnRequest._id}`,
        relatedEntity: {
          entityType: "return",
          entityId: returnRequest._id,
          entityData: {
            returnNumber: returnRequest.returnNumber,
            customerName: returnRequest.customerName,
          },
        },
      });

      res.json({
        success: true,
        message: "Marked as item received",
        return: returnRequest,
      });
    } catch (error) {
      console.error("❌ Mark item received error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to mark item as received",
      });
    }
  }
);

/**
 * ========================================
 * RESTOCK INVENTORY AFTER INSPECTION
 * ========================================
 * PATCH /api/returns/:id/restock
 * Access: Vendor only
 *
 * Handles inventory restocking based on item condition:
 * - 'good': Adds quantity back to available stock
 * - 'damaged': Adds to damaged inventory tracking
 * - 'unsellable': Records as write-off (no stock change)
 *
 * Body:
 * - condition: 'good' | 'damaged' | 'unsellable' (required)
 * - notes: Inspection notes (optional)
 */
router.patch(
  "/:id/restock",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { condition, notes } = req.body;
      const userId = req.userId;

      // Validate condition
      if (!["good", "damaged", "unsellable"].includes(condition)) {
        return res.status(400).json({
          success: false,
          message: "Invalid condition. Must be: good, damaged, or unsellable",
        });
      }

      // Get return details
      const returnRequest = await Return.findById(id)
        .populate("customerId", "name email")
        .populate("vendorId", "name email companyName");

      if (!returnRequest) {
        return res.status(404).json({
          success: false,
          message: "Return request not found",
        });
      }

      // Verify user is the vendor
      if (returnRequest.vendorId._id.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized to process this return",
        });
      }

      // Check if return is in correct status
      if (returnRequest.status !== "item_received") {
        return res.status(400).json({
          success: false,
          message: `Cannot restock. Return must be in 'item_received' status. Current status: ${returnRequest.status}`,
        });
      }

      // Process each item based on condition
      const restockResults = [];

      for (const item of returnRequest.items) {
        const product = await Product.findById(item.productId);

        if (!product) {
          console.error(`❌ Product ${item.productId} not found`);
          restockResults.push({
            productId: item.productId,
            productName: item.productName,
            status: "error",
            message: "Product not found",
          });
          continue;
        }

        const oldQuantity = product.quantity;
        const oldDamagedQty = product.damagedQuantity || 0;

        if (condition === "good") {
          // Add back to available stock
          product.quantity += item.quantity;
          product.returnedQuantity =
            (product.returnedQuantity || 0) + item.quantity;

          // Update status if was out of stock
          if (product.status === "out_of_stock" && product.quantity > 0) {
            product.status = "active";
          }

          console.log(
            `✅ Restocked ${item.quantity} units of "${product.name}" (${oldQuantity} → ${product.quantity})`
          );

          restockResults.push({
            productId: item.productId,
            productName: item.productName,
            status: "success",
            action: "restocked",
            oldQuantity,
            newQuantity: product.quantity,
            quantityAdded: item.quantity,
          });
        } else if (condition === "damaged") {
          // Add to damaged inventory
          product.damagedQuantity = oldDamagedQty + item.quantity;
          product.returnedQuantity =
            (product.returnedQuantity || 0) + item.quantity;

          console.log(
            `⚠️ Added ${item.quantity} damaged units of "${product.name}" (Damaged: ${oldDamagedQty} → ${product.damagedQuantity})`
          );

          restockResults.push({
            productId: item.productId,
            productName: item.productName,
            status: "success",
            action: "marked_damaged",
            oldDamagedQuantity: oldDamagedQty,
            newDamagedQuantity: product.damagedQuantity,
            quantityAdded: item.quantity,
          });
        } else if (condition === "unsellable") {
          // Just log it, no stock changes
          product.returnedQuantity =
            (product.returnedQuantity || 0) + item.quantity;

          console.log(
            `❌ Marked ${item.quantity} units of "${product.name}" as unsellable write-off`
          );

          restockResults.push({
            productId: item.productId,
            productName: item.productName,
            status: "success",
            action: "written_off",
            quantityWrittenOff: item.quantity,
          });
        }

        await product.save();
      }

      // Update return status to inspected
      returnRequest.status = "inspected";
      returnRequest.inspection = {
        inspectedBy: userId,
        inspectedAt: new Date(),
        condition: condition,
        notes: notes || "",
        approved: condition === "good",
      };

      // Add to status history
      returnRequest.statusHistory.push({
        status: "inspected",
        timestamp: new Date(),
        updatedBy: userId,
        notes: `Inspected as ${condition}. ${notes || ""}`,
      });

      await returnRequest.save();

      // Populate return for response
      const populatedReturn = await Return.findById(id)
        .populate("customerId", "name email")
        .populate("vendorId", "name email companyName")
        .populate("reviewedBy", "name");

      // Send notification directly
      const conditionMessages = {
        good: "Your item has been inspected and is in good condition. Refund will be processed shortly.",
        damaged:
          "Your item has been inspected and shows damage. The refund amount may be adjusted.",
        unsellable:
          "Unfortunately, your item is unsellable and cannot be restocked. Refund processing may be affected.",
      };

      const message =
        conditionMessages[condition] ||
        "Your returned item has been inspected.";

      await notificationService.createNotification({
        userId: populatedReturn.customerId._id,
        userRole: "customer",
        type: "return_inspected",
        category: "return",
        title: "Return Item Inspected",
        message: `${message} (Return: ${populatedReturn.returnNumber})`,
        priority: "normal",
        actionType: "view_return",
        actionUrl: `/customer/returns/${populatedReturn._id}`,
        relatedEntity: {
          entityType: "return",
          entityId: populatedReturn._id,
          entityData: {
            returnNumber: populatedReturn.returnNumber,
            condition: condition,
            refundAmount: populatedReturn.refundAmount,
          },
        },
      });

      res.json({
        success: true,
        message: `Return inspected and inventory updated (${condition})`,
        return: populatedReturn,
        restockResults,
      });
    } catch (error) {
      console.error("❌ Restock inventory error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to restock inventory",
      });
    }
  }
);

/**
 * PATCH /api/returns/:id/refund
 * Process refund (after inspection)
 * Access: Vendor or Expert
 *
 * Body:
 * - notes: Optional refund notes
 */
router.patch(
  "/:id/refund",
  authenticate,
  authorizeRoles("vendor", "expert"),
  async (req, res) => {
    try {
      const { notes } = req.body;

      const result = await returnService.processRefund(
        req.params.id,
        req.userId,
        notes
      );

      res.json(result);
    } catch (error) {
      console.error("❌ Process refund error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to process refund",
      });
    }
  }
);

// ========================================
// SHARED ENDPOINTS
// ========================================

/**
 * GET /api/returns/:id
 * Get return request details
 * Access: Customer (own returns), Vendor (own returns), Expert (all)
 */
router.get("/:id", authenticate, async (req, res) => {
  try {
    const returnRequest = await returnService.getReturnById(
      req.params.id,
      req.userId,
      req.userRole
    );

    res.json({
      success: true,
      return: returnRequest,
    });
  } catch (error) {
    console.error("❌ Get return error:", error);

    if (error.message === "Return request not found") {
      return res.status(404).json({
        success: false,
        message: "Return request not found",
      });
    }

    if (error.message === "Unauthorized") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve return request",
    });
  }
});

/**
 * PATCH /api/returns/:id/cancel
 * Cancel a return request
 * Access: Customer (own returns), Vendor (own returns)
 *
 * Body:
 * - reason: Cancellation reason
 */
router.patch(
  "/:id/cancel",
  authenticate,
  authorizeRoles("customer", "vendor"),
  async (req, res) => {
    try {
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: "Cancellation reason is required",
        });
      }

      const returnRequest = await Return.findById(req.params.id);

      if (!returnRequest) {
        return res.status(404).json({
          success: false,
          message: "Return request not found",
        });
      }

      // Verify ownership
      const isCustomer = returnRequest.customerId.toString() === req.userId;
      const isVendor = returnRequest.vendorId.toString() === req.userId;

      if (!isCustomer && !isVendor) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized to cancel this return",
        });
      }

      // Check if can be cancelled
      if (!["requested", "approved"].includes(returnRequest.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot cancel return in ${returnRequest.status} status`,
        });
      }

      returnRequest.status = "cancelled";
      returnRequest.cancellationReason = reason;
      returnRequest.statusHistory.push({
        status: "cancelled",
        timestamp: new Date(),
        updatedBy: req.userId,
        notes: reason,
      });

      await returnRequest.save();

      // Send notification directly
      const isCustomerCancelling =
        req.userId === returnRequest.customerId.toString();

      if (isCustomerCancelling) {
        // Notify vendor
        await notificationService.createNotification({
          userId: returnRequest.vendorId,
          userRole: "vendor",
          type: "return_cancelled_by_customer",
          category: "return",
          title: "Return Request Cancelled",
          message: `${returnRequest.customerName} has cancelled return request ${returnRequest.returnNumber}.`,
          priority: "low",
          actionType: "view_return",
          actionUrl: `/vendor/returns/${returnRequest._id}`,
          relatedEntity: {
            entityType: "return",
            entityId: returnRequest._id,
            entityData: {
              returnNumber: returnRequest.returnNumber,
              customerName: returnRequest.customerName,
              cancellationReason: returnRequest.cancellationReason,
            },
          },
        });
      } else {
        // Notify customer
        await notificationService.createNotification({
          userId: returnRequest.customerId,
          userRole: "customer",
          type: "return_cancelled",
          category: "return",
          title: "Return Request Cancelled",
          message: `Your return request ${returnRequest.returnNumber} has been cancelled by ${returnRequest.vendorName}.`,
          priority: "normal",
          actionType: "view_return",
          actionUrl: `/customer/returns/${returnRequest._id}`,
          relatedEntity: {
            entityType: "return",
            entityId: returnRequest._id,
            entityData: {
              returnNumber: returnRequest.returnNumber,
              cancellationReason: returnRequest.cancellationReason,
            },
          },
        });
      }

      res.json({
        success: true,
        message: "Return request cancelled",
        return: returnRequest,
      });
    } catch (error) {
      console.error("❌ Cancel return error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to cancel return",
      });
    }
  }
);

export default router;
