import express from "express";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";
import VendorRequest from "../models/VendorRequest.js";
import User from "../models/User.js";
import mongoose from "mongoose";

const router = express.Router();

/**
 * ========================================
 * SUPPLIER VENDOR MANAGEMENT ROUTES
 * For suppliers to view and manage vendors who purchase from them
 * ========================================
 */

/**
 * GET /api/vendor-customers
 * Get list of supplier's vendors (businesses that buy from supplier)
 * Query params: page, limit, search, sortBy, sortOrder, minOrders, minAmount, status
 */
router.get("/", authenticate, authorizeRoles("supplier"), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = "totalAmount",
      sortOrder = "desc",
      minOrders,
      minAmount,
      status = "active",
    } = req.query;

    const skip = (page - 1) * limit;

    // Get unique vendor IDs who have made requests to this supplier
    const vendorIds = await VendorRequest.distinct("vendorId", {
      supplierId: req.userId,
    });

    if (vendorIds.length === 0) {
      return res.json({
        success: true,
        customers: [],
        vendors: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0,
        },
      });
    }

    // Build query for vendors
    const query = {
      _id: { $in: vendorIds },
      role: "vendor",
    };

    // Add status filter
    if (status && status !== "all") {
      query.isActive = status === "active";
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { companyName: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    // Get vendors (customers of the supplier)
    const [vendors, total] = await Promise.all([
      User.find(query).select(
        "name email phone companyName address city state country isActive createdAt"
      ),
      User.countDocuments(query),
    ]);

    // Get statistics for each vendor
    const vendorsWithStats = await Promise.all(
      vendors.map(async (vendor) => {
        const requests = await VendorRequest.find({
          supplierId: req.userId,
          vendorId: vendor._id,
        })
          .sort({ createdAt: -1 })
          .lean();

        const stats = {
          totalRequests: requests.length,
          totalAmount: 0,
          avgRequestValue: 0,
          approvedCount: 0,
          pendingCount: 0,
          rejectedCount: 0,
          completedCount: 0,
          cancelledCount: 0,
        };

        // Calculate statistics
        requests.forEach((request) => {
          stats.totalAmount += request.total || 0;

          switch (request.status) {
            case "approved":
              stats.approvedCount++;
              break;
            case "pending":
              stats.pendingCount++;
              break;
            case "rejected":
              stats.rejectedCount++;
              break;
            case "completed":
              stats.completedCount++;
              break;
            case "cancelled":
              stats.cancelledCount++;
              break;
          }
        });

        stats.avgRequestValue =
          stats.totalRequests > 0 ? stats.totalAmount / stats.totalRequests : 0;

        const approvalRate =
          stats.totalRequests > 0
            ? ((stats.approvedCount / stats.totalRequests) * 100).toFixed(1)
            : 0;

        return {
          _id: vendor._id,
          id: vendor._id,
          vendorId: vendor._id,
          name: vendor.name,
          vendorName: vendor.name,
          email: vendor.email,
          phone: vendor.phone,
          companyName: vendor.companyName,
          address: vendor.address,
          city: vendor.city,
          state: vendor.state,
          country: vendor.country,
          isActive: vendor.isActive,
          memberSince: vendor.createdAt,
          totalOrders: stats.totalRequests,
          totalAmount: stats.totalAmount,
          stats: {
            ...stats,
            approvalRate,
            lastRequestDate: requests[0]?.createdAt || null,
          },
        };
      })
    );

    // Apply filters
    let filteredVendors = vendorsWithStats;

    if (minOrders) {
      filteredVendors = filteredVendors.filter(
        (v) => v.stats.totalRequests >= parseInt(minOrders)
      );
    }

    if (minAmount) {
      filteredVendors = filteredVendors.filter(
        (v) => v.stats.totalAmount >= parseFloat(minAmount)
      );
    }

    // Sort vendors
    if (sortBy === "totalAmount" || sortBy === "totalOrders") {
      filteredVendors.sort((a, b) => {
        const aValue =
          sortBy === "totalAmount"
            ? a.stats.totalAmount
            : a.stats.totalRequests;
        const bValue =
          sortBy === "totalAmount"
            ? b.stats.totalAmount
            : b.stats.totalRequests;
        return sortOrder === "desc" ? bValue - aValue : aValue - bValue;
      });
    } else if (sortBy === "name") {
      filteredVendors.sort((a, b) => {
        return sortOrder === "desc"
          ? b.name.localeCompare(a.name)
          : a.name.localeCompare(b.name);
      });
    }

    // Paginate
    const paginatedVendors = filteredVendors.slice(
      skip,
      skip + parseInt(limit)
    );

    res.json({
      success: true,
      customers: paginatedVendors,
      vendors: paginatedVendors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredVendors.length,
        pages: Math.ceil(filteredVendors.length / limit),
      },
    });
  } catch (error) {
    console.error("❌ GET /api/vendor-customers error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get vendor customers",
    });
  }
});

/**
 * GET /api/vendor-customers/analytics/top-vendors
 * Get top performing vendors
 */
router.get(
  "/analytics/top-vendors",
  authenticate,
  authorizeRoles("supplier"),
  async (req, res) => {
    try {
      const { limit = 10 } = req.query;

      const topVendors = await VendorRequest.aggregate([
        {
          $match: {
            supplierId: new mongoose.Types.ObjectId(req.userId),
            status: { $in: ["approved", "completed"] },
          },
        },
        {
          $group: {
            _id: "$vendorId",
            totalAmount: { $sum: "$total" },
            totalRequests: { $sum: 1 },
            avgRequestValue: { $avg: "$total" },
          },
        },
        {
          $sort: { totalAmount: -1 },
        },
        {
          $limit: parseInt(limit),
        },
      ]);

      // Populate vendor details
      const vendorsWithDetails = await Promise.all(
        topVendors.map(async (item) => {
          const vendor = await User.findById(item._id)
            .select("name email companyName")
            .lean();

          return {
            vendorId: item._id,
            vendorName: vendor?.name || "Unknown",
            companyName: vendor?.companyName,
            totalAmount: item.totalAmount,
            totalRequests: item.totalRequests,
            avgRequestValue: item.avgRequestValue,
          };
        })
      );

      res.json({
        success: true,
        vendors: vendorsWithDetails,
      });
    } catch (error) {
      console.error(
        "❌ GET /api/vendor-customers/analytics/top-vendors error:",
        error
      );
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get top vendors",
      });
    }
  }
);

/**
 * GET /api/vendor-customers/:vendorId
 * Get detailed vendor information and request history
 */
router.get(
  "/:vendorId",
  authenticate,
  authorizeRoles("supplier"),
  async (req, res) => {
    try {
      const { vendorId } = req.params;

      // Verify vendor exists and has requests with this supplier
      const requestCount = await VendorRequest.countDocuments({
        supplierId: req.userId,
        vendorId: vendorId,
      });

      if (requestCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Vendor not found or has no requests with you",
        });
      }

      // Get vendor details
      const vendor = await User.findById(vendorId)
        .select(
          "name email phone companyName address city state country postalCode isActive role createdAt"
        )
        .lean();

      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: "Vendor user not found in database",
        });
      }

      // Optional: Verify it's actually a vendor role
      if (vendor.role && vendor.role !== "vendor") {
        return res.status(404).json({
          success: false,
          message: "User is not a vendor",
        });
      }

      // Get all requests from this vendor
      const requests = await VendorRequest.find({
        supplierId: req.userId,
        vendorId: vendorId,
      })
        .populate("items.inventoryId", "name")
        .sort({ createdAt: -1 })
        .lean();

      // Calculate statistics
      const stats = {
        totalRequests: requests.length,
        totalAmount: 0,
        avgRequestValue: 0,
        approvedCount: 0,
        pendingCount: 0,
        rejectedCount: 0,
        completedCount: 0,
        cancelledCount: 0,
      };

      requests.forEach((request) => {
        stats.totalAmount += request.total || 0;

        switch (request.status) {
          case "approved":
            stats.approvedCount++;
            break;
          case "pending":
            stats.pendingCount++;
            break;
          case "rejected":
            stats.rejectedCount++;
            break;
          case "completed":
            stats.completedCount++;
            break;
          case "cancelled":
            stats.cancelledCount++;
            break;
        }
      });

      stats.avgRequestValue =
        stats.totalRequests > 0 ? stats.totalAmount / stats.totalRequests : 0;

      const approvalRate =
        stats.totalRequests > 0
          ? ((stats.approvedCount / stats.totalRequests) * 100).toFixed(1)
          : 0;

      // Request status breakdown
      const requestsByStatus = {
        pending: stats.pendingCount,
        approved: stats.approvedCount,
        rejected: stats.rejectedCount,
        completed: stats.completedCount,
        cancelled: stats.cancelledCount,
      };

      // Recent requests (last 10)
      const recentRequests = requests.slice(0, 10).map((request) => ({
        id: request._id,
        requestNumber: request.requestNumber,
        amount: request.total,
        status: request.status,
        itemCount: request.items?.length || 0,
        date: request.createdAt,
      }));

      res.json({
        success: true,
        customer: {
          id: vendor._id,
          name: vendor.name,
          email: vendor.email,
          phone: vendor.phone,
          companyName: vendor.companyName,
          address: {
            street: vendor.address,
            city: vendor.city,
            state: vendor.state,
            country: vendor.country,
            postalCode: vendor.postalCode,
          },
          isActive: vendor.isActive,
          memberSince: vendor.createdAt,
        },
        vendor: {
          id: vendor._id,
          name: vendor.name,
          email: vendor.email,
          phone: vendor.phone,
          companyName: vendor.companyName,
          address: {
            street: vendor.address,
            city: vendor.city,
            state: vendor.state,
            country: vendor.country,
            postalCode: vendor.postalCode,
          },
          isActive: vendor.isActive,
          memberSince: vendor.createdAt,
        },
        statistics: {
          ...stats,
          approvalRate,
          firstRequestDate: requests[requests.length - 1]?.createdAt,
          lastRequestDate: requests[0]?.createdAt,
          requestsByStatus,
        },
        stats: {
          ...stats,
          approvalRate,
          firstRequestDate: requests[requests.length - 1]?.createdAt,
          lastRequestDate: requests[0]?.createdAt,
          requestsByStatus,
        },
        recentRequests,
      });
    } catch (error) {
      console.error("❌ GET /api/vendor-customers/:vendorId error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get vendor details",
      });
    }
  }
);

/**
 * GET /api/vendor-customers/:vendorId/orders
 * Get all requests/orders from a specific vendor
 * Query params: page, limit, status
 */
router.get(
  "/:vendorId/orders",
  authenticate,
  authorizeRoles("supplier"),
  async (req, res) => {
    try {
      const { vendorId } = req.params;
      const { page = 1, limit = 20, status } = req.query;

      const skip = (page - 1) * limit;

      // Build query
      const query = {
        supplierId: req.userId,
        vendorId: vendorId,
      };

      if (status) {
        query.status = status;
      }

      // Get requests
      const [requests, total] = await Promise.all([
        VendorRequest.find(query)
          .populate("items.inventoryId", "name")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        VendorRequest.countDocuments(query),
      ]);

      res.json({
        success: true,
        orders: requests.map((request) => ({
          id: request._id,
          requestNumber: request.requestNumber,
          orderNumber: request.requestNumber,
          amount: request.total,
          status: request.status,
          itemCount: request.items?.length || 0,
          orderDate: request.createdAt,
          date: request.createdAt,
          lastUpdate: request.updatedAt,
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error(
        "❌ GET /api/vendor-customers/:vendorId/orders error:",
        error
      );
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get vendor orders",
      });
    }
  }
);

export default router;
