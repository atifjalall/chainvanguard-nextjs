// api/src/services/order.service.js
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import redisService from "./redis.service.js";
import FabricService from "./fabric.service.js";
import { buildPaginationResponse } from "../utils/helpers.js";

class OrderService {
  constructor() {
    this.fabricService = new FabricService();
  }

  // ========================================
  // CREATE ORDER
  // ========================================

  /**
   * Create a new order
   * Flow: Validate → Calculate → Save MongoDB → Transfer Ownership on Blockchain → Notify
   */
  async createOrder(orderData, customerId) {
    try {
      console.log("🚀 Starting order creation...");

      // 1. Get customer details
      const customer = await User.findById(customerId);
      if (!customer) {
        throw new Error("Customer not found");
      }

      if (customer.role !== "customer") {
        throw new Error("Only customers can create orders");
      }

      // 2. Validate and fetch products
      const validatedItems = await this.validateOrderItems(orderData.items);

      // 3. Calculate pricing
      const pricing = this.calculateOrderPricing(
        validatedItems,
        orderData.shippingAddress,
        orderData.discountCode
      );

      // 4. Get primary seller (first item's seller)
      const primarySeller = await User.findById(validatedItems[0].sellerId);
      if (!primarySeller) {
        throw new Error("Seller not found");
      }

      // 5. Create order object
      const order = new Order({
        // Customer info
        customerId: customer._id,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone || "",
        customerWalletAddress: customer.walletAddress,

        // Primary seller info
        sellerId: primarySeller._id,
        sellerName: primarySeller.companyName || primarySeller.name,
        sellerWalletAddress: primarySeller.walletAddress,
        sellerRole: primarySeller.role,

        // Order items
        items: validatedItems,

        // Pricing
        subtotal: pricing.subtotal,
        shippingCost: pricing.shippingCost,
        tax: pricing.tax,
        discount: pricing.discount,
        discountCode: orderData.discountCode || "",
        total: pricing.total,
        currency: "USD",

        // Addresses
        shippingAddress: orderData.shippingAddress,
        billingAddress: orderData.billingAddress || orderData.shippingAddress,

        // Payment
        paymentMethod: orderData.paymentMethod || "wallet",
        paymentStatus: "pending",

        // Status
        status: "pending",

        // Additional data
        customerNotes: orderData.customerNotes || "",
        specialInstructions: orderData.specialInstructions || "",
        isGift: orderData.isGift || false,
        giftMessage: orderData.giftMessage || "",
        urgentOrder: orderData.urgentOrder || false,

        // Analytics
        deviceType: orderData.deviceType || "",
        ipAddress: orderData.ipAddress || "",
        userAgent: orderData.userAgent || "",
      });

      // 6. Add initial status history
      order.addStatusHistory("pending", customerId, "customer", "Order placed");

      // 7. Add initial supply chain event
      order.addSupplyChainEvent({
        stage: "order_placed",
        location: orderData.shippingAddress.city,
        description: "Order successfully placed by customer",
        performedBy: customerId,
        coordinates: {
          lat: orderData.shippingAddress.latitude,
          lng: orderData.shippingAddress.longitude,
        },
      });

      // 8. Reserve product stock
      await this.reserveProductStock(validatedItems);

      // 9. Save order to MongoDB
      await order.save();
      console.log(`✅ Order saved to MongoDB: ${order.orderNumber}`);

      // 10. Record order on blockchain and transfer product ownership
      this.recordOrderOnBlockchain(order)
        .then(() => {
          console.log(`✅ Order recorded on blockchain: ${order.orderNumber}`);
          return this.transferProductsOwnership(order);
        })
        .catch((err) => {
          console.error("❌ Blockchain recording failed:", err);
        });

      // 11. Update user statistics
      await this.updateUserStats(customerId, primarySeller._id, pricing.total);

      // 12. Send notifications (async - don't wait)
      this.sendOrderNotifications(order).catch((err) =>
        console.error("⚠️ Notification error:", err)
      );

      // 13. Clear cart (if applicable)
      // await cartService.clearCart(customerId);

      return {
        success: true,
        message: "Order created successfully",
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          total: order.total,
          currency: order.currency,
          items: order.items.length,
          estimatedDelivery: order.estimatedDeliveryDate,
        },
      };
    } catch (error) {
      console.error("❌ Create order error:", error);
      throw error;
    }
  }

  /**
   * Validate order items and check stock availability
   */
  async validateOrderItems(items) {
    const validatedItems = [];

    for (const item of items) {
      // Fetch product
      const product = await Product.findById(item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      // Check if product is active
      if (product.status !== "active") {
        throw new Error(
          `Product "${product.name}" is not available for purchase`
        );
      }

      // Check stock availability
      const availableQty = product.quantity - (product.reservedQuantity || 0);
      if (availableQty < item.quantity) {
        throw new Error(
          `Insufficient stock for "${product.name}". Available: ${availableQty}, Requested: ${item.quantity}`
        );
      }

      // Get seller details
      const seller = await User.findById(product.sellerId);
      if (!seller) {
        throw new Error(`Seller not found for product: ${product.name}`);
      }

      // Build validated item
      validatedItems.push({
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        quantity: item.quantity,
        price: product.price,
        subtotal: product.price * item.quantity,

        // Product snapshot
        productSnapshot: {
          category: product.category,
          subcategory: product.subcategory,
          brand: product.brand,
          apparelDetails: {
            size: product.apparelDetails?.size || "",
            color: product.apparelDetails?.color || "",
            material: product.apparelDetails?.material || "",
            fit: product.apparelDetails?.fit || "",
          },
          images: product.images.slice(0, 3).map((img) => ({
            url: img.url,
            isMain: img.isMain,
          })),
          blockchainProductId: product.blockchainProductId || "",
        },

        // Seller info
        sellerId: seller._id,
        sellerName: seller.companyName || seller.name,
        sellerWalletAddress: seller.walletAddress,
      });
    }

    return validatedItems;
  }

  /**
   * Calculate order pricing (subtotal, tax, shipping, discount, total)
   */
  calculateOrderPricing(items, shippingAddress, discountCode) {
    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

    // Calculate shipping cost (simplified - can be made more complex)
    let shippingCost = 0;
    if (subtotal < 50) {
      shippingCost = 5.99; // Standard shipping
    } else if (subtotal < 100) {
      shippingCost = 3.99; // Reduced shipping
    }
    // Free shipping for orders over $100

    // Calculate tax (10% - simplified)
    const tax = subtotal * 0.1;

    // Apply discount (simplified - should check discount code validity)
    let discount = 0;
    if (discountCode) {
      // Example: 10% discount
      discount = subtotal * 0.1;
    }

    // Calculate total
    const total = subtotal + shippingCost + tax - discount;

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      shippingCost: parseFloat(shippingCost.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      discount: parseFloat(discount.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
    };
  }

  /**
   * Reserve product stock (increase reservedQuantity)
   */
  async reserveProductStock(items) {
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { reservedQuantity: item.quantity },
      });
    }
    console.log(`✅ Stock reserved for ${items.length} products`);
  }

  /**
   * Release product stock (decrease reservedQuantity)
   */
  async releaseProductStock(items) {
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { reservedQuantity: -item.quantity },
      });
    }
    console.log(`✅ Stock released for ${items.length} products`);
  }

  /**
   * Update user statistics
   */
  async updateUserStats(customerId, sellerId, amount) {
    try {
      // Update customer stats
      await User.findByIdAndUpdate(customerId, {
        $inc: {
          totalOrders: 1,
          totalPurchases: 1,
          totalExpenses: amount,
        },
      });

      // Update seller stats
      await User.findByIdAndUpdate(sellerId, {
        $inc: {
          totalOrders: 1,
          totalSales: 1,
          totalRevenue: amount,
        },
      });

      console.log("✅ User statistics updated");
    } catch (error) {
      console.error("⚠️ Failed to update user stats:", error);
    }
  }

  // ========================================
  // BLOCKCHAIN INTEGRATION
  // ========================================

  /**
   * Record order on blockchain
   */
  async recordOrderOnBlockchain(order) {
    try {
      console.log(`📝 Recording order on blockchain: ${order.orderNumber}`);

      await this.fabricService.connect();

      const blockchainData = {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        customerId: order.customerId.toString(),
        customerName: order.customerName,
        customerWallet: order.customerWalletAddress,
        sellerId: order.sellerId.toString(),
        sellerName: order.sellerName,
        sellerWallet: order.sellerWalletAddress,
        items: order.items.map((item) => ({
          productId: item.productId.toString(),
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
        })),
        total: order.total,
        currency: order.currency,
        status: order.status,
        paymentMethod: order.paymentMethod,
        shippingAddress: order.shippingAddress,
        timestamp: order.createdAt.toISOString(),
      };

      // Call blockchain (assuming you have createOrder method in chaincode)
      const result = await this.fabricService.createOrder(blockchainData);

      // Update order with blockchain info
      await Order.findByIdAndUpdate(order._id, {
        blockchainOrderId: result.orderId || order._id.toString(),
        blockchainTxId: result.txId || "",
        blockchainVerified: true,
      });

      console.log(`✅ Order recorded on blockchain: ${order.orderNumber}`);
    } catch (error) {
      console.error("❌ Blockchain recording error:", error);
      // Don't throw - order should succeed even if blockchain fails
    } finally {
      await this.fabricService.disconnect();
    }
  }

  /**
   * Transfer products ownership on blockchain
   */
  async transferProductsOwnership(order) {
    try {
      console.log(
        `📝 Transferring product ownership for order: ${order.orderNumber}`
      );

      await this.fabricService.connect();

      const transferPromises = order.items.map(async (item) => {
        const product = await Product.findById(item.productId);
        if (!product || !product.blockchainProductId) {
          console.warn(
            `⚠️ Product ${item.productId} not on blockchain, skipping transfer`
          );
          return null;
        }

        const transferData = {
          newOwnerId: order.customerId.toString(),
          newOwnerName: order.customerName,
          newOwnerWallet: order.customerWalletAddress,
          newOwnerRole: "customer",
          transferType: "sale",
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          price: item.price,
          quantity: item.quantity,
          timestamp: new Date().toISOString(),
        };

        try {
          const result = await this.fabricService.transferProduct(
            product.blockchainProductId,
            transferData
          );

          // Record transfer in order
          await Order.findByIdAndUpdate(order._id, {
            $push: {
              ownershipTransferTxIds: {
                productId: item.productId,
                txId: result.txId || "",
                timestamp: new Date(),
              },
            },
          });

          console.log(
            `✅ Ownership transferred for product: ${item.productName}`
          );

          return result;
        } catch (error) {
          console.error(
            `❌ Transfer failed for product ${item.productName}:`,
            error
          );
          return null;
        }
      });

      await Promise.all(transferPromises);

      console.log(
        `✅ Product ownership transfers completed for order: ${order.orderNumber}`
      );
    } catch (error) {
      console.error("❌ Product ownership transfer error:", error);
      // Don't throw - order should succeed even if transfers fail
    } finally {
      await this.fabricService.disconnect();
    }
  }

  /**
   * Get order blockchain history
   */
  async getOrderBlockchainHistory(orderId, userId, userRole) {
    try {
      const order = await this.getOrderById(orderId, userId, userRole);

      if (!order.blockchainOrderId) {
        return {
          success: false,
          message: "Order not recorded on blockchain yet",
          history: [],
        };
      }

      // Get from blockchain
      await this.fabricService.connect();
      const history = await this.fabricService.getOrderHistory(
        order.blockchainOrderId
      );
      await this.fabricService.disconnect();

      return {
        success: true,
        orderId: orderId,
        orderNumber: order.orderNumber,
        blockchainOrderId: order.blockchainOrderId,
        history: history,
      };
    } catch (error) {
      console.error("❌ Get blockchain history error:", error);
      throw error;
    }
  }

  // ========================================
  // GET ORDERS
  // ========================================

  /**
   * Get customer's orders
   */
  async getCustomerOrders(customerId, filters = {}) {
    try {
      const query = { customerId };

      // Status filter
      if (filters.status) {
        query.status = filters.status;
      }

      // Date range filter
      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) {
          query.createdAt.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          query.createdAt.$lte = new Date(filters.endDate);
        }
      }

      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const sortBy = filters.sortBy || "createdAt";
      const sortOrder = filters.sortOrder === "asc" ? 1 : -1;

      const [orders, total] = await Promise.all([
        Order.find(query)
          .sort({ [sortBy]: sortOrder })
          .skip(skip)
          .limit(limit)
          .populate("items.productId", "name images price status")
          .populate("sellerId", "name companyName email"),
        Order.countDocuments(query),
      ]);

      return buildPaginationResponse(orders, total, page, limit);
    } catch (error) {
      console.error("❌ Get customer orders error:", error);
      throw error;
    }
  }

  /**
   * Get seller's orders
   */
  async getSellerOrders(sellerId, filters = {}) {
    try {
      const query = {
        $or: [{ sellerId }, { "items.sellerId": sellerId }],
      };

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) {
          query.createdAt.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          query.createdAt.$lte = new Date(filters.endDate);
        }
      }

      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const sortBy = filters.sortBy || "createdAt";
      const sortOrder = filters.sortOrder === "asc" ? 1 : -1;

      const [orders, total] = await Promise.all([
        Order.find(query)
          .sort({ [sortBy]: sortOrder })
          .skip(skip)
          .limit(limit)
          .populate("customerId", "name email phone")
          .populate("items.productId", "name images"),
        Order.countDocuments(query),
      ]);

      return buildPaginationResponse(orders, total, page, limit);
    } catch (error) {
      console.error("❌ Get seller orders error:", error);
      throw error;
    }
  }

  /**
   * Get all orders (Expert only)
   */
  async getAllOrders(filters = {}) {
    try {
      const query = {};

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.customerId) {
        query.customerId = filters.customerId;
      }

      if (filters.sellerId) {
        query.$or = [
          { sellerId: filters.sellerId },
          { "items.sellerId": filters.sellerId },
        ];
      }

      if (filters.paymentStatus) {
        query.paymentStatus = filters.paymentStatus;
      }

      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) {
          query.createdAt.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          query.createdAt.$lte = new Date(filters.endDate);
        }
      }

      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const skip = (page - 1) * limit;

      const sortBy = filters.sortBy || "createdAt";
      const sortOrder = filters.sortOrder === "asc" ? 1 : -1;

      const [orders, total] = await Promise.all([
        Order.find(query)
          .sort({ [sortBy]: sortOrder })
          .skip(skip)
          .limit(limit)
          .populate("customerId", "name email walletAddress")
          .populate("sellerId", "name companyName email walletAddress"),
        Order.countDocuments(query),
      ]);

      return buildPaginationResponse(orders, total, page, limit);
    } catch (error) {
      console.error("❌ Get all orders error:", error);
      throw error;
    }
  }

  /**
   * Get single order by ID
   */
  async getOrderById(orderId, userId, userRole) {
    try {
      const order = await Order.findById(orderId)
        .populate("customerId", "name email phone walletAddress")
        .populate("sellerId", "name companyName email phone walletAddress")
        .populate("items.productId", "name images price status");

      if (!order) {
        throw new Error("Order not found");
      }

      // Check authorization
      const isCustomer = order.customerId._id.toString() === userId;
      const isSeller =
        order.sellerId._id.toString() === userId ||
        order.items.some((item) => item.sellerId.toString() === userId);
      const isExpert = userRole === "expert";

      if (!isCustomer && !isSeller && !isExpert) {
        throw new Error("Unauthorized: You don't have access to this order");
      }

      return order;
    } catch (error) {
      console.error("❌ Get order by ID error:", error);
      throw error;
    }
  }

  // ========================================
  // UPDATE ORDER STATUS
  // ========================================

  /**
   * Update order status
   */
  async updateOrderStatus(orderId, newStatus, userId, userRole, notes = "") {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      // Check authorization
      const isSeller =
        order.sellerId.toString() === userId ||
        order.items.some((item) => item.sellerId.toString() === userId);

      if (!isSeller && userRole !== "expert") {
        throw new Error(
          "Unauthorized: Only seller or expert can update order status"
        );
      }

      // Validate status transition
      const validTransitions = {
        pending: ["confirmed", "cancelled"],
        confirmed: ["processing", "cancelled"],
        processing: ["shipped", "cancelled"],
        shipped: ["delivered"],
        delivered: [],
        cancelled: [],
      };

      if (!validTransitions[order.status].includes(newStatus)) {
        throw new Error(
          `Invalid status transition from ${order.status} to ${newStatus}`
        );
      }

      // Update status
      const oldStatus = order.status;
      order.status = newStatus;

      // Set timestamps
      if (newStatus === "confirmed") order.confirmedAt = new Date();
      if (newStatus === "processing") order.processingAt = new Date();
      if (newStatus === "shipped") order.shippedAt = new Date();
      if (newStatus === "delivered") order.deliveredAt = new Date();
      if (newStatus === "cancelled") order.cancelledAt = new Date();

      // Add status history
      order.addStatusHistory(newStatus, userId, userRole, notes);

      // Add supply chain event
      order.addSupplyChainEvent({
        stage: newStatus,
        location: order.shippingAddress.city,
        description: `Order status changed from ${oldStatus} to ${newStatus}`,
        performedBy: userId,
      });

      // If delivered, release reserved stock and deduct actual stock
      if (newStatus === "delivered") {
        await this.confirmProductSale(order.items);
      }

      // If cancelled, release reserved stock
      if (newStatus === "cancelled") {
        await this.releaseProductStock(order.items);
      }

      await order.save();

      // Send notification
      order.addNotification(`order_${newStatus}`, "email");
      await order.save();

      console.log(
        `✅ Order ${order.orderNumber} status updated: ${oldStatus} → ${newStatus}`
      );

      return {
        success: true,
        message: `Order status updated to ${newStatus}`,
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          statusHistory: order.statusHistory,
        },
      };
    } catch (error) {
      console.error("❌ Update order status error:", error);
      throw error;
    }
  }

  /**
   * Confirm product sale (deduct stock, update product stats)
   */
  async confirmProductSale(items) {
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: {
          quantity: -item.quantity,
          reservedQuantity: -item.quantity,
          totalSold: item.quantity,
        },
        lastSoldAt: new Date(),
      });
    }
    console.log(`✅ Product sales confirmed for ${items.length} products`);
  }

  // ========================================
  // ORDER ACTIONS
  // ========================================

  /**
   * Confirm order
   */
  async confirmOrder(
    orderId,
    userId,
    userRole,
    estimatedDeliveryDate = null,
    notes = ""
  ) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      if (order.status !== "pending") {
        throw new Error("Order is already confirmed or cannot be confirmed");
      }

      // Check authorization
      const isSeller = order.sellerId.toString() === userId;
      if (!isSeller && userRole !== "expert") {
        throw new Error("Unauthorized: Only seller can confirm order");
      }

      order.status = "confirmed";
      order.confirmedAt = new Date();

      if (estimatedDeliveryDate) {
        order.estimatedDeliveryDate = new Date(estimatedDeliveryDate);
      }

      order.addStatusHistory("confirmed", userId, userRole, notes);
      order.addSupplyChainEvent({
        stage: "order_confirmed",
        location: order.shippingAddress.city,
        description: "Order confirmed by seller",
        performedBy: userId,
      });

      await order.save();

      return {
        success: true,
        message: "Order confirmed successfully",
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          confirmedAt: order.confirmedAt,
          estimatedDeliveryDate: order.estimatedDeliveryDate,
        },
      };
    } catch (error) {
      console.error("❌ Confirm order error:", error);
      throw error;
    }
  }

  /**
   * Mark order as shipped
   */
  async markAsShipped(orderId, shippingInfo, userId, userRole, notes = "") {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      if (!["confirmed", "processing"].includes(order.status)) {
        throw new Error("Order cannot be shipped at this stage");
      }

      // Check authorization
      const isSeller = order.sellerId.toString() === userId;
      if (!isSeller && userRole !== "expert") {
        throw new Error("Unauthorized: Only seller can mark order as shipped");
      }

      order.status = "shipped";
      order.shippedAt = new Date();
      order.trackingNumber = shippingInfo.trackingNumber;
      order.courierName = shippingInfo.courierName;

      if (shippingInfo.estimatedDeliveryDate) {
        order.estimatedDeliveryDate = new Date(
          shippingInfo.estimatedDeliveryDate
        );
      }

      if (shippingInfo.trackingUrl) {
        order.trackingUrl = shippingInfo.trackingUrl;
      } else {
        // Generate tracking URL based on courier
        order.trackingUrl = this.generateTrackingUrl(
          shippingInfo.courierName,
          shippingInfo.trackingNumber
        );
      }

      order.addStatusHistory("shipped", userId, userRole, notes);
      order.addSupplyChainEvent({
        stage: "shipped",
        location: order.shippingAddress.city,
        description: `Package shipped via ${shippingInfo.courierName}`,
        performedBy: userId,
      });

      await order.save();

      return {
        success: true,
        message: "Order marked as shipped",
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          trackingNumber: order.trackingNumber,
          courierName: order.courierName,
          trackingUrl: order.trackingUrl,
        },
      };
    } catch (error) {
      console.error("❌ Mark as shipped error:", error);
      throw error;
    }
  }

  /**
   * Update shipping information
   */
  async updateShippingInfo(orderId, shippingInfo, userId, userRole) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      // Check authorization
      const isSeller = order.sellerId.toString() === userId;
      if (!isSeller && userRole !== "expert") {
        throw new Error("Unauthorized: Only seller can update shipping info");
      }

      if (shippingInfo.trackingNumber) {
        order.trackingNumber = shippingInfo.trackingNumber;
      }

      if (shippingInfo.courierName) {
        order.courierName = shippingInfo.courierName;
      }

      if (shippingInfo.estimatedDeliveryDate) {
        order.estimatedDeliveryDate = new Date(
          shippingInfo.estimatedDeliveryDate
        );
      }

      if (shippingInfo.trackingUrl) {
        order.trackingUrl = shippingInfo.trackingUrl;
      }

      await order.save();

      return {
        success: true,
        message: "Shipping information updated",
        shippingInfo: {
          trackingNumber: order.trackingNumber,
          courierName: order.courierName,
          estimatedDeliveryDate: order.estimatedDeliveryDate,
          trackingUrl: order.trackingUrl,
        },
      };
    } catch (error) {
      console.error("❌ Update shipping info error:", error);
      throw error;
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId, userId, reason) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      // Check authorization
      if (order.customerId.toString() !== userId) {
        throw new Error("Unauthorized: You can only cancel your own orders");
      }

      // Check if order can be cancelled
      if (!order.canCancel) {
        throw new Error(
          "Order cannot be cancelled at this stage. Please contact support."
        );
      }

      order.status = "cancelled";
      order.cancelledAt = new Date();
      order.cancellationReason = reason;
      order.cancelledBy = userId;

      order.addStatusHistory("cancelled", userId, "customer", reason);
      order.addSupplyChainEvent({
        stage: "cancelled",
        location: order.shippingAddress.city,
        description: `Order cancelled by customer: ${reason}`,
        performedBy: userId,
      });

      // Release reserved stock
      await this.releaseProductStock(order.items);

      await order.save();

      return {
        success: true,
        message: "Order cancelled successfully",
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          cancelledAt: order.cancelledAt,
          cancellationReason: order.cancellationReason,
        },
      };
    } catch (error) {
      console.error("❌ Cancel order error:", error);
      throw error;
    }
  }

  /**
   * Request order return
   */
  async requestReturn(orderId, userId, reason, items = null) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      // Check authorization
      if (order.customerId.toString() !== userId) {
        throw new Error("Unauthorized: You can only return your own orders");
      }

      // Check if order is eligible for return
      if (!order.canReturn) {
        throw new Error(
          "Order is not eligible for return. Return period may have expired."
        );
      }

      if (order.status !== "delivered") {
        throw new Error("Only delivered orders can be returned");
      }

      order.returnRequested = true;
      order.returnReason = reason;
      order.returnStatus = "requested";

      order.addStatusHistory(
        order.status,
        userId,
        "customer",
        `Return requested: ${reason}`
      );

      await order.save();

      return {
        success: true,
        message: "Return request submitted successfully",
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          returnStatus: order.returnStatus,
          returnReason: order.returnReason,
        },
      };
    } catch (error) {
      console.error("❌ Request return error:", error);
      throw error;
    }
  }

  /**
   * Approve/Reject return request
   */
  async approveReturn(orderId, approved, userId, userRole, notes = "") {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      if (!order.returnRequested || order.returnStatus !== "requested") {
        throw new Error("No pending return request for this order");
      }

      // Check authorization
      const isSeller = order.sellerId.toString() === userId;
      if (!isSeller && userRole !== "expert") {
        throw new Error(
          "Unauthorized: Only seller or expert can approve returns"
        );
      }

      order.returnStatus = approved ? "approved" : "rejected";

      order.addStatusHistory(
        order.status,
        userId,
        userRole,
        `Return ${approved ? "approved" : "rejected"}: ${notes}`
      );

      await order.save();

      return {
        success: true,
        message: `Return request ${approved ? "approved" : "rejected"}`,
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          returnStatus: order.returnStatus,
        },
      };
    } catch (error) {
      console.error("❌ Approve return error:", error);
      throw error;
    }
  }

  /**
   * Process refund
   */
  async processRefund(
    orderId,
    refundAmount,
    refundReason,
    refundMethod,
    expertId
  ) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      if (refundAmount > order.total) {
        throw new Error("Refund amount exceeds order total");
      }

      order.paymentStatus = "refunded";
      order.refundAmount = refundAmount;
      order.refundReason = refundReason;
      order.refundMethod = refundMethod;
      order.refundedAt = new Date();

      if (order.status !== "cancelled") {
        order.status = "refunded";
      }

      order.addStatusHistory(
        "refunded",
        expertId,
        "expert",
        `Refund processed: $${refundAmount} - ${refundReason}`
      );

      await order.save();

      // Update user balances
      await User.findByIdAndUpdate(order.customerId, {
        $inc: { balance: refundAmount },
      });

      return {
        success: true,
        message: "Refund processed successfully",
        refund: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          refundAmount: order.refundAmount,
          refundMethod: order.refundMethod,
          refundedAt: order.refundedAt,
        },
      };
    } catch (error) {
      console.error("❌ Process refund error:", error);
      throw error;
    }
  }

  /**
   * Submit order review
   */
  async submitReview(orderId, userId, rating, comment = "") {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      // Check authorization
      if (order.customerId.toString() !== userId) {
        throw new Error("Unauthorized: You can only review your own orders");
      }

      if (order.status !== "delivered") {
        throw new Error("Only delivered orders can be reviewed");
      }

      if (order.isReviewed) {
        throw new Error("Order has already been reviewed");
      }

      order.isReviewed = true;
      order.reviewSubmittedAt = new Date();

      await order.save();

      // Update product ratings
      for (const item of order.items) {
        const product = await Product.findById(item.productId);
        if (product) {
          const totalReviews = product.totalReviews || 0;
          const currentRating = product.averageRating || 0;
          const newTotalReviews = totalReviews + 1;
          const newAverageRating =
            (currentRating * totalReviews + rating) / newTotalReviews;

          await Product.findByIdAndUpdate(item.productId, {
            averageRating: parseFloat(newAverageRating.toFixed(2)),
            totalReviews: newTotalReviews,
          });
        }
      }

      return {
        success: true,
        message: "Review submitted successfully",
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          isReviewed: order.isReviewed,
          reviewSubmittedAt: order.reviewSubmittedAt,
        },
      };
    } catch (error) {
      console.error("❌ Submit review error:", error);
      throw error;
    }
  }

  // ========================================
  // ORDER TRACKING
  // ========================================

  /**
   * Track order
   */
  async trackOrder(orderId, userId, userRole) {
    try {
      const order = await this.getOrderById(orderId, userId, userRole);

      return {
        orderNumber: order.orderNumber,
        status: order.status,
        trackingNumber: order.trackingNumber,
        courierName: order.courierName,
        trackingUrl: order.trackingUrl,
        estimatedDeliveryDate: order.estimatedDeliveryDate,
        actualDeliveryDate: order.actualDeliveryDate,
        currentLocation: order.supplyChainEvents.length
          ? order.supplyChainEvents[order.supplyChainEvents.length - 1].location
          : order.shippingAddress.city,
        supplyChainEvents: order.supplyChainEvents,
        statusHistory: order.statusHistory,
      };
    } catch (error) {
      console.error("❌ Track order error:", error);
      throw error;
    }
  }

  /**
   * Track order by order number (public/guest tracking)
   */
  async trackOrderByNumber(orderNumber, email, userId = null) {
    try {
      const order = await Order.findOne({ orderNumber })
        .populate("items.productId", "name images")
        .select(
          "orderNumber status trackingNumber courierName trackingUrl estimatedDeliveryDate actualDeliveryDate supplyChainEvents statusHistory customerEmail shippingAddress"
        );

      if (!order) {
        throw new Error("Order not found");
      }

      // If not authenticated, verify email
      if (!userId && email) {
        if (order.customerEmail !== email) {
          throw new Error("Email does not match order records");
        }
      }

      return {
        orderNumber: order.orderNumber,
        status: order.status,
        trackingNumber: order.trackingNumber,
        courierName: order.courierName,
        trackingUrl: order.trackingUrl,
        estimatedDeliveryDate: order.estimatedDeliveryDate,
        actualDeliveryDate: order.actualDeliveryDate,
        currentLocation: order.supplyChainEvents.length
          ? order.supplyChainEvents[order.supplyChainEvents.length - 1].location
          : order.shippingAddress.city,
        supplyChainEvents: order.supplyChainEvents,
      };
    } catch (error) {
      console.error("❌ Track order by number error:", error);
      throw error;
    }
  }

  // ========================================
  // STATISTICS & ANALYTICS
  // ========================================

  /**
   * Get seller statistics
   */
  async getSellerStats(sellerId, timeframe = "month") {
    try {
      const startDate = this.getStartDateForTimeframe(timeframe);

      const query = {
        $or: [{ sellerId }, { "items.sellerId": sellerId }],
        createdAt: { $gte: startDate },
      };

      const orders = await Order.find(query);

      const stats = {
        totalOrders: orders.length,
        pendingOrders: orders.filter((o) => o.status === "pending").length,
        confirmedOrders: orders.filter((o) => o.status === "confirmed").length,
        processingOrders: orders.filter((o) => o.status === "processing")
          .length,
        shippedOrders: orders.filter((o) => o.status === "shipped").length,
        deliveredOrders: orders.filter((o) => o.status === "delivered").length,
        cancelledOrders: orders.filter((o) => o.status === "cancelled").length,
        totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
        averageOrderValue:
          orders.length > 0
            ? orders.reduce((sum, o) => sum + o.total, 0) / orders.length
            : 0,
        totalItems: orders.reduce(
          (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
          0
        ),
      };

      return stats;
    } catch (error) {
      console.error("❌ Get seller stats error:", error);
      throw error;
    }
  }

  /**
   * Get overall statistics (Expert only)
   */
  async getOverallStats(timeframe = "month") {
    try {
      const startDate = this.getStartDateForTimeframe(timeframe);

      const query = { createdAt: { $gte: startDate } };

      const orders = await Order.find(query);

      const stats = {
        totalOrders: orders.length,
        ordersByStatus: {
          pending: orders.filter((o) => o.status === "pending").length,
          confirmed: orders.filter((o) => o.status === "confirmed").length,
          processing: orders.filter((o) => o.status === "processing").length,
          shipped: orders.filter((o) => o.status === "shipped").length,
          delivered: orders.filter((o) => o.status === "delivered").length,
          cancelled: orders.filter((o) => o.status === "cancelled").length,
        },
        totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
        averageOrderValue:
          orders.length > 0
            ? orders.reduce((sum, o) => sum + o.total, 0) / orders.length
            : 0,
        totalItems: orders.reduce(
          (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
          0
        ),
        paymentMethods: {
          wallet: orders.filter((o) => o.paymentMethod === "wallet").length,
          card: orders.filter((o) => o.paymentMethod === "card").length,
          cod: orders.filter((o) => o.paymentMethod === "cod").length,
        },
        uniqueCustomers: new Set(orders.map((o) => o.customerId.toString()))
          .size,
        uniqueSellers: new Set(orders.map((o) => o.sellerId.toString())).size,
      };

      return stats;
    } catch (error) {
      console.error("❌ Get overall stats error:", error);
      throw error;
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Generate tracking URL based on courier
   */
  generateTrackingUrl(courierName, trackingNumber) {
    const trackingUrls = {
      FedEx: `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
      UPS: `https://www.ups.com/track?tracknum=${trackingNumber}`,
      DHL: `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
      USPS: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
    };

    return trackingUrls[courierName] || "";
  }

  /**
   * Get start date for timeframe
   */
  getStartDateForTimeframe(timeframe) {
    const now = new Date();
    switch (timeframe) {
      case "week":
        return new Date(now.setDate(now.getDate() - 7));
      case "month":
        return new Date(now.setMonth(now.getMonth() - 1));
      case "year":
        return new Date(now.setFullYear(now.getFullYear() - 1));
      case "all":
        return new Date(0); // Beginning of time
      default:
        return new Date(now.setMonth(now.getMonth() - 1)); // Default to month
    }
  }

  /**
   * Send order notifications (email/SMS)
   */
  async sendOrderNotifications(order) {
    try {
      // Send email to customer
      console.log(`📧 Sending order confirmation to: ${order.customerEmail}`);

      // Send email to seller
      const seller = await User.findById(order.sellerId);
      if (seller) {
        console.log(`📧 Sending new order notification to: ${seller.email}`);
      }

      // Add notifications to order
      order.notifications.push(
        { type: "order_confirmed", channel: "email", status: "sent" },
        { type: "order_confirmed", channel: "sms", status: "sent" }
      );

      await order.save();

      // Here you would integrate with email service (SendGrid, Mailgun, etc.)
      // await emailService.sendOrderConfirmation(order);
    } catch (error) {
      console.error("⚠️ Notification sending failed:", error);
    }
  }

  /**
   * Generate invoice (placeholder - can be expanded with PDF generation)
   */
  async generateInvoice(orderId, userId, userRole) {
    try {
      const order = await this.getOrderById(orderId, userId, userRole);

      const invoice = {
        invoiceNumber: `INV-${order.orderNumber}`,
        invoiceDate: order.createdAt,
        orderNumber: order.orderNumber,
        customer: {
          name: order.customerName,
          email: order.customerEmail,
          phone: order.customerPhone,
          address: order.shippingAddress,
        },
        seller: {
          name: order.sellerName,
          // Add seller details from populated data
        },
        items: order.items.map((item) => ({
          productName: item.productName,
          sku: item.sku,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
        })),
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        tax: order.tax,
        discount: order.discount,
        total: order.total,
        currency: order.currency,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
      };

      return invoice;
    } catch (error) {
      console.error("❌ Generate invoice error:", error);
      throw error;
    }
  }

  /**
   * Transfer product ownership (manual trigger - mostly automatic)
   */
  async transferProductOwnership(orderId, expertId) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      await this.transferProductsOwnership(order);

      return {
        success: true,
        message: "Product ownership transfer initiated",
        orderId: order._id,
        orderNumber: order.orderNumber,
      };
    } catch (error) {
      console.error("❌ Transfer ownership error:", error);
      throw error;
    }
  }

  /**
   * Get platform-wide statistics (Expert only)
   */
  async getPlatformStats() {
    try {
      const totalOrders = await Order.countDocuments();
      const totalRevenue = await Order.aggregate([
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]);

      const ordersByStatus = await Order.aggregate([
        { $group: { _id: "$status", count: { $count: {} } } },
      ]);

      const recentOrders = await Order.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select("orderNumber totalAmount status createdAt");

      return {
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        ordersByStatus,
        recentOrders,
      };
    } catch (error) {
      console.error("❌ Get platform stats error:", error);
      throw error;
    }
  }
}

export default new OrderService();
