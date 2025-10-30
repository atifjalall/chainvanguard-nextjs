import express from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import Order from '../models/Order.js';
import VendorRequest from '../models/VendorRequest.js';
import Inventory from '../models/Inventory.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

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
  '/supplier/stats',
  authenticate,
  authorizeRoles('supplier'),
  async (req, res) => {
    try {
      const supplierId = req.userId;
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
        activeOrders
      ] = await Promise.all([
        // Pending vendor requests
        VendorRequest.countDocuments({
          supplierId,
          status: 'pending'
        }),
        
        // Low stock items (quantity < 10)
        Inventory.countDocuments({
          supplierId,
          quantity: { $lt: 10 },
          status: 'active'
        }),
        
        // Today's revenue
        Order.aggregate([
          {
            $match: {
              sellerId: supplierId,
              createdAt: { $gte: today },
              status: { $in: ['delivered', 'completed'] }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$totalAmount' }
            }
          }
        ]),
        
        // This week's orders
        Order.countDocuments({
          sellerId: supplierId,
          createdAt: { $gte: weekAgo }
        }),
        
        // Recent transactions (last 5 orders)
        Order.find({
          sellerId: supplierId
        })
          .populate('buyerId', 'name email companyName')
          .sort({ createdAt: -1 })
          .limit(5)
          .select('orderNumber totalAmount status createdAt buyerId items'),
        
        // Total unique active vendors (who have placed orders)
        Order.distinct('buyerId', {
          sellerId: supplierId
        }).then(ids => ids.length),
        
        // Total inventory items
        Inventory.countDocuments({
          supplierId,
          status: 'active'
        }),
        
        // Active orders (pending + processing)
        Order.countDocuments({
          sellerId: supplierId,
          status: { $in: ['pending', 'processing'] }
        })
      ]);

      // Format recent transactions
      const formattedTransactions = recentTransactions.map(order => ({
        id: order._id,
        orderNumber: order.orderNumber,
        vendor: order.buyerId ? {
          id: order.buyerId._id,
          name: order.buyerId.name,
          email: order.buyerId.email,
          companyName: order.buyerId.companyName
        } : null,
        amount: order.totalAmount,
        status: order.status,
        itemCount: order.items?.length || 0,
        date: order.createdAt
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
          recentTransactions: formattedTransactions
        },
        timestamp: new Date()
      });
    } catch (error) {
      console.error('❌ GET /api/dashboard/supplier/stats error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get dashboard stats'
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
  '/supplier/revenue',
  authenticate,
  authorizeRoles('supplier'),
  async (req, res) => {
    try {
      const supplierId = req.userId;
      const { timeframe = 'month' } = req.query;
      
      let startDate = new Date();
      
      switch (timeframe) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
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
            status: { $in: ['delivered', 'completed'] }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            revenue: { $sum: '$totalAmount' },
            orderCount: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        }
      ]);

      res.json({
        success: true,
        timeframe,
        revenueData
      });
    } catch (error) {
      console.error('❌ GET /api/dashboard/supplier/revenue error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get revenue data'
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
  '/vendor/stats',
  authenticate,
  authorizeRoles('vendor'),
  async (req, res) => {
    try {
      const vendorId = req.userId;
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
        processingOrders
      ] = await Promise.all([
        // Today's sales revenue
        Order.aggregate([
          {
            $match: {
              sellerId: vendorId,
              createdAt: { $gte: today },
              status: { $in: ['delivered', 'completed'] }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$totalAmount' }
            }
          }
        ]),
        
        // Pending orders (as seller)
        Order.countDocuments({
          sellerId: vendorId,
          status: 'pending'
        }),
        
        // Low stock products (stock < 10)
        Product.countDocuments({
          vendorId,
          stock: { $lt: 10 },
          status: 'active'
        }),
        
        // New customer orders (this week)
        Order.countDocuments({
          sellerId: vendorId,
          createdAt: { $gte: weekAgo },
          status: 'pending'
        }),
        
        // Recent sales (last 5)
        Order.find({
          sellerId: vendorId
        })
          .populate('buyerId', 'name email')
          .sort({ createdAt: -1 })
          .limit(5)
          .select('orderNumber totalAmount status createdAt buyerId items'),
        
        // Approved purchase requests (ready for checkout)
        VendorRequest.countDocuments({
          vendorId,
          status: 'approved'
        }),
        
        // Total active products
        Product.countDocuments({
          vendorId,
          status: 'active'
        }),
        
        // Total unique customers
        Order.distinct('buyerId', {
          sellerId: vendorId
        }).then(ids => ids.length),
        
        // Processing orders
        Order.countDocuments({
          sellerId: vendorId,
          status: 'processing'
        })
      ]);

      // Format recent sales
      const formattedSales = recentSales.map(order => ({
        id: order._id,
        orderNumber: order.orderNumber,
        customer: order.buyerId ? {
          id: order.buyerId._id,
          name: order.buyerId.name,
          email: order.buyerId.email
        } : null,
        amount: order.totalAmount,
        status: order.status,
        itemCount: order.items?.length || 0,
        date: order.createdAt
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
          recentSales: formattedSales
        },
        timestamp: new Date()
      });
    } catch (error) {
      console.error('❌ GET /api/dashboard/vendor/stats error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get dashboard stats'
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
  '/vendor/sales',
  authenticate,
  authorizeRoles('vendor'),
  async (req, res) => {
    try {
      const vendorId = req.userId;
      const { timeframe = 'month' } = req.query;
      
      let startDate = new Date();
      
      switch (timeframe) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
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
            status: { $in: ['delivered', 'completed'] }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            sales: { $sum: '$totalAmount' },
            orderCount: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        }
      ]);

      res.json({
        success: true,
        timeframe,
        salesData
      });
    } catch (error) {
      console.error('❌ GET /api/dashboard/vendor/sales error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get sales data'
      });
    }
  }
);

/**
 * GET /api/dashboard/vendor/inventory-summary
 * Get vendor's inventory summary (purchased from suppliers)
 */
router.get(
  '/vendor/inventory-summary',
  authenticate,
  authorizeRoles('vendor'),
  async (req, res) => {
    try {
      const vendorId = req.userId;

      // Get all delivered orders where vendor was buyer
      const inventoryOrders = await Order.find({
        buyerId: vendorId,
        status: { $in: ['delivered', 'completed'] }
      }).populate('items.inventoryId');

      // Calculate summary
      let totalItemsReceived = 0;
      let totalSpent = 0;
      const suppliers = new Set();

      inventoryOrders.forEach(order => {
        totalSpent += order.totalAmount;
        suppliers.add(order.sellerId.toString());
        order.items.forEach(item => {
          totalItemsReceived += item.quantity;
        });
      });

      res.json({
        success: true,
        summary: {
          totalItemsReceived,
          totalSpent,
          totalSuppliers: suppliers.size,
          totalOrders: inventoryOrders.length
        }
      });
    } catch (error) {
      console.error('❌ GET /api/dashboard/vendor/inventory-summary error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get inventory summary'
      });
    }
  }
);

export default router;