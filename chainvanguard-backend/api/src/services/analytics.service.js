import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Inventory from "../models/Inventory.js";
import mongoose from "mongoose";

/**
 * ========================================
 * ANALYTICS SERVICE
 * ========================================
 * Comprehensive analytics for suppliers and vendors
 */

class AnalyticsService {
  // ========================================
  // SUPPLIER ANALYTICS
  // ========================================

  /**
   * Get comprehensive supplier analytics
   */
  async getSupplierAnalytics(supplierId, timeframe = "month") {
    try {
      const dateFilter = this.getDateFilter(timeframe);

      const [
        revenue,
        topVendors,
        inventoryStats,
        requestStats,
        orderTrends,
        topProducts,
        categoryRevenue,
        topInventoryItems,
      ] = await Promise.all([
        this.getSupplierRevenue(supplierId, dateFilter),
        this.getTopVendors(supplierId, dateFilter),
        this.getInventoryStats(supplierId),
        this.getRequestStats(supplierId, dateFilter),
        this.getOrderTrends(supplierId, dateFilter, timeframe),
        this.getTopSupplyProducts(supplierId, dateFilter),
        this.getCategoryRevenue(supplierId, dateFilter),
        this.getTopInventoryItems(supplierId, dateFilter, 5),
      ]);

      return {
        success: true,
        timeframe,
        analytics: {
          revenue,
          topVendors,
          inventoryStats,
          requestStats,
          orderTrends,
          topProducts,
          categoryRevenue,
          topInventoryItems,
        },
      };
    } catch (error) {
      console.error("❌ Get supplier analytics error:", error);
      throw error;
    }
  }

  /**
   * Get supplier revenue trends
   * FIXED: Uses VendorRequest collection instead of Order
   */
  async getSupplierRevenue(supplierId, dateFilter) {
    // Get VendorRequest model
    let VendorRequest;
    try {
      VendorRequest = mongoose.model("VendorRequest");
    } catch (e) {
      // Model not registered yet, return empty data
      return {
        daily: [],
        totals: {
          totalRevenue: 0,
          totalOrders: 0,
          avgOrderValue: 0,
        },
      };
    }

    const revenue = await VendorRequest.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(supplierId),
          status: "completed", // Only count completed orders
          createdAt: dateFilter,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
          avgOrderValue: { $avg: "$total" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Calculate totals
    const totals = revenue.reduce(
      (acc, day) => ({
        totalRevenue: acc.totalRevenue + day.revenue,
        totalOrders: acc.totalOrders + day.orders,
      }),
      { totalRevenue: 0, totalOrders: 0 }
    );

    return {
      daily: revenue,
      totals: {
        ...totals,
        avgOrderValue:
          totals.totalOrders > 0 ? totals.totalRevenue / totals.totalOrders : 0,
      },
    };
  }

  /**
   * Get top vendors by revenue
   * FIXED: Uses VendorRequest collection and groups by vendorId
   */
  async getTopVendors(supplierId, dateFilter) {
    // Get VendorRequest model
    let VendorRequest;
    try {
      VendorRequest = mongoose.model("VendorRequest");
    } catch (e) {
      return [];
    }

    const topVendors = await VendorRequest.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(supplierId),
          status: "completed", // Only count completed orders
          createdAt: dateFilter,
        },
      },
      {
        $group: {
          _id: "$vendorId", // Group by vendor, not customer
          totalSpent: { $sum: "$total" },
          orderCount: { $sum: 1 },
          lastOrderDate: { $max: "$createdAt" },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "vendor",
        },
      },
      { $unwind: "$vendor" },
      {
        $project: {
          _id: 1,
          name: "$vendor.name",
          email: "$vendor.email",
          companyName: "$vendor.companyName",
          totalSpent: 1,
          orderCount: 1,
          lastOrderDate: 1,
          avgOrderValue: { $divide: ["$totalSpent", "$orderCount"] },
        },
      },
    ]);

    return topVendors;
  }

  /**
   * Get inventory statistics
   */
  async getInventoryStats(supplierId) {
    const inventoryStats = await Inventory.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(supplierId),
        },
      },
      {
        $group: {
          _id: "$category",
          totalValue: {
            $sum: { $multiply: ["$quantity", "$pricePerUnit"] },
          },
          itemCount: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          avgPrice: { $avg: "$pricePerUnit" },
          minStock: {
            $sum: { $cond: [{ $lte: ["$quantity", "$minStockLevel"] }, 1, 0] },
          },
        },
      },
      { $sort: { totalValue: -1 } },
    ]);

    // Get overall totals
    const overallStats = await Inventory.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(supplierId),
        },
      },
      {
        $group: {
          _id: null,
          totalInventoryValue: {
            $sum: { $multiply: ["$quantity", "$pricePerUnit"] },
          },
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          lowStockItems: {
            $sum: { $cond: [{ $lte: ["$quantity", "$minStockLevel"] }, 1, 0] },
          },
          outOfStockItems: {
            $sum: { $cond: [{ $eq: ["$quantity", 0] }, 1, 0] },
          },
        },
      },
    ]);

    return {
      byCategory: inventoryStats,
      overall: overallStats[0] || {
        totalInventoryValue: 0,
        totalItems: 0,
        totalQuantity: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
      },
    };
  }

  /**
   * Get vendor request statistics
   */
  async getRequestStats(supplierId, dateFilter) {
    // Import VendorRequest model dynamically to avoid circular dependencies
    let VendorRequest;
    try {
      VendorRequest = mongoose.model("VendorRequest");
    } catch (e) {
      // Model not registered yet
      return {
        byStatus: [],
        totals: {
          totalRequests: 0,
          totalValue: 0,
          approvalRate: 0,
        },
      };
    }

    const requestStats = await VendorRequest.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(supplierId),
          createdAt: dateFilter,
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalValue: { $sum: "$total" },
        },
      },
    ]);

    // Calculate totals
    const totals = requestStats.reduce(
      (acc, stat) => ({
        totalRequests: acc.totalRequests + stat.count,
        totalValue: acc.totalValue + stat.totalValue,
        approved: acc.approved + (stat._id === "approved" ? stat.count : 0),
        rejected: acc.rejected + (stat._id === "rejected" ? stat.count : 0),
      }),
      { totalRequests: 0, totalValue: 0, approved: 0, rejected: 0 }
    );

    totals.approvalRate =
      totals.totalRequests > 0
        ? ((totals.approved / totals.totalRequests) * 100).toFixed(2)
        : 0;

    return {
      byStatus: requestStats,
      totals,
    };
  }

  /**
   * Get order trends over time
   * FIXED: Uses VendorRequest collection for supplier trends
   */
  async getOrderTrends(supplierId, dateFilter, timeframe) {
    // Get VendorRequest model
    let VendorRequest;
    try {
      VendorRequest = mongoose.model("VendorRequest");
    } catch (e) {
      return [];
    }

    const groupByFormat = this.getGroupByFormat(timeframe);

    const trends = await VendorRequest.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(supplierId),
          createdAt: dateFilter,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: groupByFormat, date: "$createdAt" },
          },
          totalOrders: { $sum: 1 },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          completedOrders: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, 1, 0], // Only completed
            },
          },
          cancelledOrders: {
            $sum: {
              $cond: [{ $in: ["$status", ["cancelled", "rejected"]] }, 1, 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return trends;
  }

  // ========================================
  // VENDOR ANALYTICS
  // ========================================

  /**
   * Get comprehensive vendor analytics
   */
  async getVendorAnalytics(vendorId, timeframe = "month") {
    try {
      const dateFilter = this.getDateFilter(timeframe);

      const [sales, topProducts, topCustomers, categoryStats, orderTrends] =
        await Promise.all([
          this.getVendorSales(vendorId, dateFilter),
          this.getTopProducts(vendorId, dateFilter),
          this.getTopCustomers(vendorId, dateFilter),
          this.getCategoryPerformance(vendorId, dateFilter),
          this.getVendorOrderTrends(vendorId, dateFilter, timeframe),
        ]);

      return {
        success: true,
        timeframe,
        analytics: {
          sales,
          topProducts,
          topCustomers,
          categoryStats,
          orderTrends,
        },
      };
    } catch (error) {
      console.error("❌ Get vendor analytics error:", error);
      throw error;
    }
  }

  /**
   * Get vendor sales trends
   */
  async getVendorSales(vendorId, dateFilter) {
    const sales = await Order.aggregate([
      {
        $match: {
          sellerId: new mongoose.Types.ObjectId(vendorId),
          status: { $in: ["delivered", "completed"] },
          createdAt: dateFilter,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
          avgOrderValue: { $avg: "$total" },
          itemsSold: { $sum: { $size: "$items" } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Calculate totals
    const totals = sales.reduce(
      (acc, day) => ({
        totalRevenue: acc.totalRevenue + day.revenue,
        totalOrders: acc.totalOrders + day.orders,
        totalItems: acc.totalItems + day.itemsSold,
      }),
      { totalRevenue: 0, totalOrders: 0, totalItems: 0 }
    );

    return {
      daily: sales,
      totals: {
        ...totals,
        avgOrderValue:
          totals.totalOrders > 0 ? totals.totalRevenue / totals.totalOrders : 0,
      },
    };
  }

  /**
   * Get top selling products
   */
  async getTopProducts(vendorId, dateFilter) {
    const topProducts = await Order.aggregate([
      {
        $match: {
          sellerId: new mongoose.Types.ObjectId(vendorId),
          status: { $in: ["delivered", "completed"] },
          createdAt: dateFilter,
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          revenue: {
            $sum: { $multiply: ["$items.quantity", "$items.price"] },
          },
          unitsSold: { $sum: "$items.quantity" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $project: {
          _id: 1,
          name: "$product.name",
          category: "$product.category",
          image: { $arrayElemAt: ["$product.images", 0] },
          revenue: 1,
          unitsSold: 1,
          orderCount: 1,
          avgPrice: { $divide: ["$revenue", "$unitsSold"] },
        },
      },
    ]);

    return topProducts;
  }

  /**
   * Get top customers
   */
  async getTopCustomers(vendorId, dateFilter) {
    const topCustomers = await Order.aggregate([
      {
        $match: {
          sellerId: new mongoose.Types.ObjectId(vendorId),
          status: { $in: ["delivered", "completed"] },
          createdAt: dateFilter,
        },
      },
      {
        $group: {
          _id: "$customerId",
          totalSpent: { $sum: "$total" },
          orderCount: { $sum: 1 },
          lastOrderDate: { $max: "$createdAt" },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: "$customer" },
      {
        $project: {
          _id: 1,
          name: "$customer.name",
          email: "$customer.email",
          city: "$customer.city",
          totalSpent: 1,
          orderCount: 1,
          lastOrderDate: 1,
          avgOrderValue: { $divide: ["$totalSpent", "$orderCount"] },
        },
      },
    ]);

    return topCustomers;
  }

  /**
   * Get category performance statistics
   */
  async getCategoryPerformance(vendorId, dateFilter) {
    const categoryStats = await Order.aggregate([
      {
        $match: {
          sellerId: new mongoose.Types.ObjectId(vendorId),
          status: { $in: ["delivered", "completed"] },
          createdAt: dateFilter,
        },
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.category",
          revenue: {
            $sum: { $multiply: ["$items.quantity", "$items.price"] },
          },
          orders: { $sum: 1 },
          unitsSold: { $sum: "$items.quantity" },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    // Calculate total for percentages
    const totalRevenue = categoryStats.reduce(
      (sum, cat) => sum + cat.revenue,
      0
    );

    return categoryStats.map((cat) => ({
      ...cat,
      revenuePercentage:
        totalRevenue > 0 ? ((cat.revenue / totalRevenue) * 100).toFixed(2) : 0,
    }));
  }

  /**
   * Get vendor order trends over time
   */
  async getVendorOrderTrends(vendorId, dateFilter, timeframe) {
    const groupByFormat = this.getGroupByFormat(timeframe);

    const trends = await Order.aggregate([
      {
        $match: {
          sellerId: new mongoose.Types.ObjectId(vendorId),
          createdAt: dateFilter,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: groupByFormat, date: "$createdAt" },
          },
          totalOrders: { $sum: 1 },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          completedOrders: {
            $sum: {
              $cond: [{ $in: ["$status", ["delivered", "completed"]] }, 1, 0],
            },
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return trends;
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Get date filter based on timeframe
   */
  getDateFilter(timeframe) {
    const now = new Date();
    let startDate;

    switch (timeframe) {
      case "week":
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case "month":
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case "quarter":
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case "year":
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      case "all":
      default:
        startDate = new Date(0); // All time
    }

    return { $gte: startDate };
  }

  /**
   * Get group by format for aggregation
   */
  getGroupByFormat(timeframe) {
    switch (timeframe) {
      case "week":
      case "month":
        return "%Y-%m-%d"; // Daily
      case "quarter":
      case "year":
        return "%Y-%m"; // Monthly
      default:
        return "%Y-%m-%d"; // Daily
    }
  }

  /**
   * Get product performance metrics
   */
  async getProductPerformance(vendorId, productId, timeframe = "month") {
    try {
      const dateFilter = this.getDateFilter(timeframe);

      const performance = await Order.aggregate([
        {
          $match: {
            sellerId: new mongoose.Types.ObjectId(vendorId),
            "items.productId": new mongoose.Types.ObjectId(productId),
            status: { $in: ["delivered", "completed"] },
            createdAt: dateFilter,
          },
        },
        { $unwind: "$items" },
        {
          $match: {
            "items.productId": new mongoose.Types.ObjectId(productId),
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            revenue: {
              $sum: { $multiply: ["$items.quantity", "$items.price"] },
            },
            unitsSold: { $sum: "$items.quantity" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      return {
        success: true,
        performance,
      };
    } catch (error) {
      console.error("❌ Get product performance error:", error);
      throw error;
    }
  }

  /**
   * Get sales comparison between timeframes
   */
  async getSalesComparison(vendorId, currentPeriod, previousPeriod) {
    try {
      const [current, previous] = await Promise.all([
        this.getVendorSales(vendorId, this.getDateFilter(currentPeriod)),
        this.getVendorSales(vendorId, this.getDateFilter(previousPeriod)),
      ]);

      const growth = {
        revenue: this.calculateGrowth(
          current.totals.totalRevenue,
          previous.totals.totalRevenue
        ),
        orders: this.calculateGrowth(
          current.totals.totalOrders,
          previous.totals.totalOrders
        ),
        avgOrderValue: this.calculateGrowth(
          current.totals.avgOrderValue,
          previous.totals.avgOrderValue
        ),
      };

      return {
        success: true,
        current: current.totals,
        previous: previous.totals,
        growth,
      };
    } catch (error) {
      console.error("❌ Get sales comparison error:", error);
      throw error;
    }
  }

  /**
   * Calculate percentage growth
   */
  calculateGrowth(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return (((current - previous) / previous) * 100).toFixed(2);
  }

  /**
   * Get top supply products from completed vendor requests
   */
  async getTopSupplyProducts(supplierId, dateFilter) {
    let VendorRequest;
    try {
      VendorRequest = mongoose.model("VendorRequest");
    } catch (e) {
      return [];
    }

    const topProducts = await VendorRequest.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(supplierId),
          status: "completed",
          createdAt: dateFilter,
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.inventoryId",
          revenue: {
            $sum: { $multiply: ["$items.quantity", "$items.pricePerUnit"] },
          },
          totalSupplied: { $sum: "$items.quantity" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "inventories",
          localField: "_id",
          foreignField: "_id",
          as: "inventory",
        },
      },
      { $unwind: "$inventory" },
      {
        $project: {
          _id: 1,
          name: "$inventory.name",
          category: "$inventory.category",
          image: { $arrayElemAt: ["$inventory.images", 0] },
          revenue: 1,
          totalSupplied: 1,
          orderCount: 1,
          currentStock: "$inventory.quantity",
          avgOrderSize: { $divide: ["$totalSupplied", "$orderCount"] },
          quantity: "$inventory.quantity",
          reservedQuantity: "$inventory.reservedQuantity",
          damagedQuantity: "$inventory.damagedQuantity",
          committedQuantity: "$inventory.committedQuantity",
        },
      },
    ]);

    return topProducts;
  }

  /**
   * Get category revenue distribution from completed vendor requests
   */
  async getCategoryRevenue(supplierId, dateFilter) {
    let VendorRequest;
    try {
      VendorRequest = mongoose.model("VendorRequest");
    } catch (e) {
      return [];
    }

    const categoryStats = await VendorRequest.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(supplierId),
          status: "completed",
          createdAt: dateFilter,
        },
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "inventories",
          localField: "items.inventoryId",
          foreignField: "_id",
          as: "inventory",
        },
      },
      { $unwind: "$inventory" },
      {
        $group: {
          _id: "$inventory.category",
          revenue: {
            $sum: { $multiply: ["$items.quantity", "$items.pricePerUnit"] },
          },
          itemCount: { $sum: 1 },
          totalQuantity: { $sum: "$items.quantity" },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    return categoryStats;
  }

  /**
   * Get top selling inventory items for supplier
   */
  async getTopInventoryItems(supplierId, dateFilter, limit = 5) {
    try {
      const topItems = await Order.aggregate([
        {
          $match: {
            sellerId: mongoose.Types.ObjectId(supplierId),
            status: { $in: ["delivered", "completed"] },
            createdAt: dateFilter,
          },
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            productName: { $first: "$items.productName" },
            totalSold: { $sum: "$items.quantity" },
            revenue: { $sum: "$items.subtotal" },
            orderCount: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "inventories", // or "products" depending on your setup
            localField: "_id",
            foreignField: "_id",
            as: "itemDetails",
          },
        },
        { $unwind: { path: "$itemDetails", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            name: "$productName",
            category: "$itemDetails.category",
            totalSold: 1,
            revenue: 1,
            currentStock: "$itemDetails.quantity",
            status: {
              $cond: [
                {
                  $gte: ["$itemDetails.quantity", "$itemDetails.minStockLevel"],
                },
                "active",
                {
                  $cond: [
                    { $gt: ["$itemDetails.quantity", 0] },
                    "low_stock",
                    "out_of_stock",
                  ],
                },
              ],
            },
            lastSold: new Date(),
            averageRating: { $ifNull: ["$itemDetails.averageRating", 4.5] },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: limit },
      ]);

      return topItems;
    } catch (error) {
      console.error("Error getting top inventory items:", error);
      return [];
    }
  }
}

export default new AnalyticsService();
