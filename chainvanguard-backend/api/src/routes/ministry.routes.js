import express from "express";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

// Ministry/Supplier routes require supplier role
router.use(authenticate);
router.use(authorizeRoles("supplier"));

/**
 * GET /api/ministry/overview
 * Industry overview and statistics
 */
router.get("/overview", async (req, res) => {
  try {
    const [
      totalVendors,
      totalProducts,
      totalOrders,
      totalRevenue,
      activeProducts,
    ] = await Promise.all([
      User.countDocuments({ role: "vendor", isActive: true }),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Product.countDocuments({ status: "active" }),
    ]);

    // Get products by category
    const productsByCategory = await Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    // Get orders by status
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        industry: {
          totalVendors,
          totalProducts,
          activeProducts,
          totalOrders,
          totalRevenue: totalRevenue[0]?.total || 0,
        },
        productsByCategory: productsByCategory.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        ordersByStatus: ordersByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error("❌ Get ministry overview failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get industry overview",
    });
  }
});

/**
 * GET /api/ministry/vendors
 * List of all vendors with performance metrics
 */
router.get("/vendors", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = "name",
      sortOrder = "asc",
    } = req.query;

    const query = { role: "vendor" };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { companyName: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const vendors = await User.find(query)
      .select("name email companyName phone isActive createdAt")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await User.countDocuments(query);

    // Get metrics for each vendor
    const vendorsWithMetrics = await Promise.all(
      vendors.map(async (vendor) => {
        const [productsCount, ordersCount, revenue] = await Promise.all([
          Product.countDocuments({ sellerId: vendor._id }),
          Order.countDocuments({ "products.sellerId": vendor._id }),
          Order.aggregate([
            { $match: { "products.sellerId": vendor._id } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
          ]),
        ]);

        return {
          ...vendor,
          metrics: {
            totalProducts: productsCount,
            totalOrders: ordersCount,
            totalRevenue: revenue[0]?.total || 0,
          },
        };
      })
    );

    res.json({
      success: true,
      data: vendorsWithMetrics,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("❌ Get vendors failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get vendors list",
    });
  }
});

export default router;
