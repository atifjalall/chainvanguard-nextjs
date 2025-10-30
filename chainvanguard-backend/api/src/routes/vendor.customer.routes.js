import express from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * GET /api/vendor/customers
 * Get list of vendor's customers with statistics
 * Query params: page, limit, search, sortBy, sortOrder
 */
router.get(
  '/',
  authenticate,
  authorizeRoles('vendor'),
  async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search,
        sortBy = 'totalSpent',
        sortOrder = 'desc'
      } = req.query;
      
      const skip = (page - 1) * limit;

      // Get unique customer IDs from orders
      const customerIds = await Order.distinct('buyerId', {
        sellerId: req.userId
      });

      if (customerIds.length === 0) {
        return res.json({
          success: true,
          customers: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          }
        });
      }

      // Build query
      const query = {
        _id: { $in: customerIds },
        role: 'customer'
      };

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }

      // Get customers
      const [customers, total] = await Promise.all([
        User.find(query)
          .select('name email phone address city state country createdAt')
          .skip(skip)
          .limit(parseInt(limit)),
        User.countDocuments(query)
      ]);

      // Get order stats for each customer
      const customersWithStats = await Promise.all(
        customers.map(async (customer) => {
          const [orders, orderStats] = await Promise.all([
            Order.find({
              sellerId: req.userId,
              buyerId: customer._id
            }).sort({ createdAt: -1 }),
            Order.aggregate([
              {
                $match: {
                  sellerId: new mongoose.Types.ObjectId(req.userId),
                  buyerId: new mongoose.Types.ObjectId(customer._id)
                }
              },
              {
                $group: {
                  _id: null,
                  totalOrders: { $sum: 1 },
                  totalSpent: { $sum: '$totalAmount' },
                  avgOrderValue: { $avg: '$totalAmount' }
                }
              }
            ])
          ]);

          const stats = orderStats[0] || {
            totalOrders: 0,
            totalSpent: 0,
            avgOrderValue: 0
          };

          return {
            id: customer._id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            city: customer.city,
            state: customer.state,
            country: customer.country,
            memberSince: customer.createdAt,
            stats: {
              totalOrders: stats.totalOrders,
              totalSpent: stats.totalSpent,
              avgOrderValue: stats.avgOrderValue,
              lastOrderDate: orders[0]?.createdAt || null
            }
          };
        })
      );

      // Sort customers by the requested field
      if (sortBy === 'totalSpent' || sortBy === 'totalOrders') {
        customersWithStats.sort((a, b) => {
          const aValue = a.stats[sortBy] || 0;
          const bValue = b.stats[sortBy] || 0;
          return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
        });
      }

      res.json({
        success: true,
        customers: customersWithStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('❌ GET /api/vendor/customers error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get customers'
      });
    }
  }
);

/**
 * GET /api/vendor/customers/:customerId
 * Get detailed customer information and order history
 */
router.get(
  '/:customerId',
  authenticate,
  authorizeRoles('vendor'),
  async (req, res) => {
    try {
      const { customerId } = req.params;

      // Verify customer exists and has orders with this vendor
      const customerOrders = await Order.countDocuments({
        sellerId: req.userId,
        buyerId: customerId
      });

      if (customerOrders === 0) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found or has no orders with you'
        });
      }

      // Get customer details
      const customer = await User.findById(customerId)
        .select('name email phone address city state country postalCode createdAt');

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }

      // Get all orders from this customer
      const orders = await Order.find({
        sellerId: req.userId,
        buyerId: customerId
      }).sort({ createdAt: -1 });

      // Calculate statistics
      const totalOrders = orders.length;
      const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

      // Order status breakdown
      const ordersByStatus = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});

      // Recent orders (last 10)
      const recentOrders = orders.slice(0, 10).map(order => ({
        id: order._id,
        orderNumber: order.orderNumber,
        amount: order.totalAmount,
        status: order.status,
        itemCount: order.items?.length || 0,
        date: order.createdAt
      }));

      res.json({
        success: true,
        customer: {
          id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: {
            street: customer.address,
            city: customer.city,
            state: customer.state,
            country: customer.country,
            postalCode: customer.postalCode
          },
          memberSince: customer.createdAt
        },
        statistics: {
          totalOrders,
          totalSpent,
          avgOrderValue,
          firstOrderDate: orders[orders.length - 1]?.createdAt,
          lastOrderDate: orders[0]?.createdAt,
          ordersByStatus
        },
        recentOrders
      });
    } catch (error) {
      console.error('❌ GET /api/vendor/customers/:customerId error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get customer details'
      });
    }
  }
);

/**
 * GET /api/vendor/customers/:customerId/orders
 * Get all orders from a specific customer
 * Query params: page, limit, status
 */
router.get(
  '/:customerId/orders',
  authenticate,
  authorizeRoles('vendor'),
  async (req, res) => {
    try {
      const { customerId } = req.params;
      const { 
        page = 1, 
        limit = 20, 
        status 
      } = req.query;
      
      const skip = (page - 1) * limit;

      // Build query
      const query = {
        sellerId: req.userId,
        buyerId: customerId
      };

      if (status) {
        query.status = status;
      }

      // Get orders
      const [orders, total] = await Promise.all([
        Order.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .select('orderNumber totalAmount status items createdAt updatedAt'),
        Order.countDocuments(query)
      ]);

      res.json({
        success: true,
        orders: orders.map(order => ({
          id: order._id,
          orderNumber: order.orderNumber,
          amount: order.totalAmount,
          status: order.status,
          itemCount: order.items?.length || 0,
          orderDate: order.createdAt,
          lastUpdate: order.updatedAt
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('❌ GET /api/vendor/customers/:customerId/orders error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get customer orders'
      });
    }
  }
);

/**
 * GET /api/vendor/customers/stats/summary
 * Get overall customer statistics summary
 */
router.get(
  '/stats/summary',
  authenticate,
  authorizeRoles('vendor'),
  async (req, res) => {
    try {
      // Get unique customer count
      const customerIds = await Order.distinct('buyerId', {
        sellerId: req.userId
      });

      const totalCustomers = customerIds.length;

      if (totalCustomers === 0) {
        return res.json({
          success: true,
          summary: {
            totalCustomers: 0,
            totalRevenue: 0,
            avgCustomerValue: 0,
            newCustomersThisMonth: 0
          }
        });
      }

      // Get revenue stats
      const revenueStats = await Order.aggregate([
        {
          $match: {
            sellerId: new mongoose.Types.ObjectId(req.userId),
            status: { $in: ['delivered', 'completed'] }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' }
          }
        }
      ]);

      const totalRevenue = revenueStats[0]?.totalRevenue || 0;
      const avgCustomerValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

      // New customers this month
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      const newCustomersThisMonth = await Order.distinct('buyerId', {
        sellerId: req.userId,
        createdAt: { $gte: monthAgo }
      }).then(ids => ids.length);

      res.json({
        success: true,
        summary: {
          totalCustomers,
          totalRevenue,
          avgCustomerValue,
          newCustomersThisMonth
        }
      });
    } catch (error) {
      console.error('❌ GET /api/vendor/customers/stats/summary error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get customer summary'
      });
    }
  }
);

/**
 * GET /api/vendor/customers/:customerId/contact
 * Get customer contact information
 */
router.get(
  '/:customerId/contact',
  authenticate,
  authorizeRoles('vendor'),
  async (req, res) => {
    try {
      const { customerId } = req.params;

      // Verify this is the vendor's customer
      const hasOrders = await Order.exists({
        sellerId: req.userId,
        buyerId: customerId
      });

      if (!hasOrders) {
        return res.status(403).json({
          success: false,
          message: 'You can only access contact info for your customers'
        });
      }

      const customer = await User.findById(customerId)
        .select('name email phone');

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }

      res.json({
        success: true,
        contact: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone
        }
      });
    } catch (error) {
      console.error('❌ GET /api/vendor/customers/:customerId/contact error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get contact info'
      });
    }
  }
);

export default router;