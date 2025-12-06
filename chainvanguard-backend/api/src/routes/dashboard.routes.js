import express from "express";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";
import Order from "../models/Order.js";
import VendorRequest from "../models/VendorRequest.js";
import Inventory from "../models/Inventory.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { initializeSafeMode, queryCollection, countDocuments, populateField } from "../utils/safeMode/lokiService.js";

const router = express.Router();

// ========================================
// SUPPLIER DASHBOARD
// ========================================

/**
 * GET /api/dashboard/supplier/stats
 * Get supplier dashboard statistics
 * Returns:
 * - Pending vendor requests count
 * - Low stock alerts count
 * - Today's revenue
 * - This week's orders count
 * - Total active vendors
 * - Recent transactions (last 5)
 */
router.get(
  "/supplier/stats",
  authenticate,
  authorizeRoles("supplier"),
  async (req, res) => {
    try {
      const supplierId = req.userId;

      // SAFE MODE: Load stats from LokiJS backup
      if (req.safeMode) {
        await initializeSafeMode(supplierId, 100);

        // Get orders from backup
        const orders = queryCollection(supplierId, 'orders', { sellerId: supplierId });
        const vendorRequests = queryCollection(supplierId, 'vendorRequests', { supplierId });
        const inventory = queryCollection(supplierId, 'inventory', { supplierId, status: 'active' });

        // Calculate basic stats from backup data
        const pendingRequests = vendorRequests.filter(vr => vr.status === 'pending').length;
        const lowStockCount = inventory.filter(inv => inv.quantity < 10).length;
        const totalVendors = new Set(orders.map(o => o.buyerId?.toString())).size;
        const activeOrders = orders.filter(o => ['pending', 'processing'].includes(o.status)).length;

        // Recent transactions (last 5 orders)
        let recentOrders = orders
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);

        // Populate buyer information from users collection
        recentOrders = populateField(supplierId, recentOrders, 'buyerId', 'users', ['_id', 'name', 'email', 'companyName']);

        return res.json({
          success: true,
          safeMode: true,
          stats: {
            pendingRequests,
            lowStockAlerts: lowStockCount,
            todayRevenue: 0, // Can't calculate date-specific in safe mode
            weekOrders: 0,
            totalVendors,
            totalInventoryItems: inventory.length,
            activeOrders,
            recentTransactions: recentOrders.map(order => ({
              id: order._id,
              orderNumber: order.orderNumber,
              vendor: order.buyerId ? {
                id: order.buyerId._id,
                name: order.buyerId.name,
                email: order.buyerId.email,
                companyName: order.buyerId.companyName,
              } : null,
              amount: order.totalAmount,
              status: order.status,
              itemCount: order.items?.length || 0,
              date: order.createdAt,
            })),
          },
          timestamp: new Date(),
          warning: 'Viewing backup data. Some stats (today/week revenue) unavailable during maintenance.'
        });
      }

      // NORMAL MODE: Full stats from MongoDB
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Parallel queries for better performance
      const [
        pendingRequestsCount,
        lowStockCount,
        todayRevenue,
        weekOrders,
        recentTransactions,
        totalVendors,
        totalInventoryItems,
        activeOrders,
      ] = await Promise.all([
        // Pending vendor requests
        VendorRequest.countDocuments({
          supplierId,
          status: "pending",
        }),

        // Low stock items (quantity < 10)
        Inventory.countDocuments({
          supplierId,
          quantity: { $lt: 10 },
          status: "active",
        }),

        // Today's revenue
        Order.aggregate([
          {
            $match: {
              sellerId: supplierId,
              createdAt: { $gte: today },
              status: { $in: ["delivered", "completed"] },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$totalAmount" },
            },
          },
        ]),

        // This week's orders
        Order.countDocuments({
          sellerId: supplierId,
          createdAt: { $gte: weekAgo },
        }),

        // Recent transactions (last 5 orders)
        Order.find({
          sellerId: supplierId,
        })
          .populate("buyerId", "name email companyName")
          .sort({ createdAt: -1 })
          .limit(5)
          .select("orderNumber totalAmount status createdAt buyerId items"),

        // Total unique active vendors (who have placed orders)
        Order.distinct("buyerId", {
          sellerId: supplierId,
        }).then((ids) => ids.length),

        // Total inventory items
        Inventory.countDocuments({
          supplierId,
          status: "active",
        }),

        // Active orders (pending + processing)
        Order.countDocuments({
          sellerId: supplierId,
          status: { $in: ["pending", "processing"] },
        }),
      ]);

      // Format recent transactions
      const formattedTransactions = recentTransactions.map((order) => ({
        id: order._id,
        orderNumber: order.orderNumber,
        vendor: order.buyerId
          ? {
              id: order.buyerId._id,
              name: order.buyerId.name,
              email: order.buyerId.email,
              companyName: order.buyerId.companyName,
            }
          : null,
        amount: order.totalAmount,
        status: order.status,
        itemCount: order.items?.length || 0,
        date: order.createdAt,
      }));

      res.json({
        success: true,
        stats: {
          pendingRequests: pendingRequestsCount,
          lowStockAlerts: lowStockCount,
          todayRevenue: todayRevenue[0]?.total || 0,
          weekOrders,
          totalVendors,
          totalInventoryItems,
          activeOrders,
          recentTransactions: formattedTransactions,
        },
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("❌ GET /api/dashboard/supplier/stats error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get dashboard stats",
      });
    }
  }
);

/**
 * GET /api/dashboard/supplier/revenue
 * Get supplier revenue analytics
 * Query params: timeframe (week, month, year)
 */
router.get(
  "/supplier/revenue",
  authenticate,
  authorizeRoles("supplier"),
  async (req, res) => {
    try {
      const supplierId = req.userId;
      const { timeframe = "month" } = req.query;

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

      const revenueData = await Order.aggregate([
        {
          $match: {
            sellerId: supplierId,
            createdAt: { $gte: startDate },
            status: { $in: ["delivered", "completed"] },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
            },
            revenue: { $sum: "$totalAmount" },
            orderCount: { $sum: 1 },
          },
        },
        {
          $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
        },
      ]);

      res.json({
        success: true,
        timeframe,
        revenueData,
      });
    } catch (error) {
      console.error("❌ GET /api/dashboard/supplier/revenue error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get revenue data",
      });
    }
  }
);

// ========================================
// VENDOR DASHBOARD
// ========================================

/**
 * GET /api/dashboard/vendor/stats
 * Get vendor dashboard statistics
 * Returns:
 * - Today's sales
 * - Pending orders (as seller)
 * - Low stock products
 * - New customer orders (this week)
 * - Approved purchase requests (ready for checkout)
 * - Recent sales (last 5)
 */
router.get(
  "/vendor/stats",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const vendorId = req.userId;

      // SAFE MODE: Load stats from LokiJS backup
      if (req.safeMode) {
        await initializeSafeMode(vendorId, 100);

        // Get data from backup
        const orders = queryCollection(vendorId, 'orders', { sellerId: vendorId });
        const products = queryCollection(vendorId, 'products', { vendorId, status: 'active' });
        const vendorRequests = queryCollection(vendorId, 'vendorRequests', { vendorId });

        // Calculate stats
        const pendingOrders = orders.filter(o => o.status === 'pending').length;
        const processingOrders = orders.filter(o => o.status === 'processing').length;
        const lowStockProducts = products.filter(p => p.stock < 10).length;
        const approvedRequests = vendorRequests.filter(vr => vr.status === 'approved').length;
        const totalCustomers = new Set(orders.map(o => o.buyerId?.toString())).size;

        // Recent sales
        let recentOrders = orders
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);

        // Populate customer information from users collection
        recentOrders = populateField(vendorId, recentOrders, 'buyerId', 'users', ['_id', 'name', 'email']);

        return res.json({
          success: true,
          safeMode: true,
          stats: {
            todaySales: 0, // Can't calculate date-specific
            pendingOrders,
            processingOrders,
            lowStockProducts,
            newCustomerOrders: 0,
            approvedRequests,
            totalProducts: products.length,
            totalCustomers,
            recentSales: recentOrders.map(order => ({
              id: order._id,
              orderNumber: order.orderNumber,
              customer: order.buyerId ? {
                id: order.buyerId._id,
                name: order.buyerId.name,
                email: order.buyerId.email,
              } : null,
              amount: order.totalAmount,
              status: order.status,
              itemCount: order.items?.length || 0,
              date: order.createdAt,
            })),
          },
          timestamp: new Date(),
          warning: 'Viewing backup data. Some stats (today sales, new orders) unavailable during maintenance.'
        });
      }

      // NORMAL MODE: Full stats from MongoDB
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const [
        todaySales,
        pendingOrdersCount,
        lowStockProducts,
        newCustomerOrders,
        recentSales,
        approvedRequests,
        totalProducts,
        totalCustomers,
        processingOrders,
      ] = await Promise.all([
        // Today's sales revenue
        Order.aggregate([
          {
            $match: {
              sellerId: vendorId,
              createdAt: { $gte: today },
              status: { $in: ["delivered", "completed"] },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$totalAmount" },
            },
          },
        ]),

        // Pending orders (as seller)
        Order.countDocuments({
          sellerId: vendorId,
          status: "pending",
        }),

        // Low stock products (stock < 10)
        Product.countDocuments({
          vendorId,
          stock: { $lt: 10 },
          status: "active",
        }),

        // New customer orders (this week)
        Order.countDocuments({
          sellerId: vendorId,
          createdAt: { $gte: weekAgo },
          status: "pending",
        }),

        // Recent sales (last 5)
        Order.find({
          sellerId: vendorId,
        })
          .populate("buyerId", "name email")
          .sort({ createdAt: -1 })
          .limit(5)
          .select("orderNumber totalAmount status createdAt buyerId items"),

        // Approved purchase requests (ready for checkout)
        VendorRequest.countDocuments({
          vendorId,
          status: "approved",
        }),

        // Total active products
        Product.countDocuments({
          vendorId,
          status: "active",
        }),

        // Total unique customers
        Order.distinct("buyerId", {
          sellerId: vendorId,
        }).then((ids) => ids.length),

        // Processing orders
        Order.countDocuments({
          sellerId: vendorId,
          status: "processing",
        }),
      ]);

      // Format recent sales
      const formattedSales = recentSales.map((order) => ({
        id: order._id,
        orderNumber: order.orderNumber,
        customer: order.buyerId
          ? {
              id: order.buyerId._id,
              name: order.buyerId.name,
              email: order.buyerId.email,
            }
          : null,
        amount: order.totalAmount,
        status: order.status,
        itemCount: order.items?.length || 0,
        date: order.createdAt,
      }));

      res.json({
        success: true,
        stats: {
          todaySales: todaySales[0]?.total || 0,
          pendingOrders: pendingOrdersCount,
          processingOrders,
          lowStockProducts,
          newCustomerOrders,
          approvedRequests,
          totalProducts,
          totalCustomers,
          recentSales: formattedSales,
        },
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("❌ GET /api/dashboard/vendor/stats error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get dashboard stats",
      });
    }
  }
);

/**
 * GET /api/dashboard/vendor/sales
 * Get vendor sales analytics
 * Query params: timeframe (week, month, year)
 */
router.get(
  "/vendor/sales",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const vendorId = req.userId;
      const { timeframe = "month" } = req.query;

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

      const salesData = await Order.aggregate([
        {
          $match: {
            sellerId: vendorId,
            createdAt: { $gte: startDate },
            status: { $in: ["delivered", "completed"] },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
            },
            sales: { $sum: "$totalAmount" },
            orderCount: { $sum: 1 },
          },
        },
        {
          $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
        },
      ]);

      res.json({
        success: true,
        timeframe,
        salesData,
      });
    } catch (error) {
      console.error("❌ GET /api/dashboard/vendor/sales error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get sales data",
      });
    }
  }
);

/**
 * GET /api/dashboard/vendor/inventory-summary
 * Get vendor's inventory summary (purchased from suppliers)
 */
router.get(
  "/vendor/inventory-summary",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const vendorId = req.userId;

      // Get all delivered orders where vendor was buyer
      const inventoryOrders = await Order.find({
        buyerId: vendorId,
        status: { $in: ["delivered", "completed"] },
      }).populate("items.inventoryId");

      // Calculate summary
      let totalItemsReceived = 0;
      let totalSpent = 0;
      const suppliers = new Set();

      inventoryOrders.forEach((order) => {
        totalSpent += order.totalAmount;
        suppliers.add(order.sellerId.toString());
        order.items.forEach((item) => {
          totalItemsReceived += item.quantity;
        });
      });

      res.json({
        success: true,
        summary: {
          totalItemsReceived,
          totalSpent,
          totalSuppliers: suppliers.size,
          totalOrders: inventoryOrders.length,
        },
      });
    } catch (error) {
      console.error(
        "❌ GET /api/dashboard/vendor/inventory-summary error:",
        error
      );
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get inventory summary",
      });
    }
  }
);

export default router;
