import express from "express";
import Inventory from "../models/Inventory.js";
import User from "../models/User.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";
import logger from "../utils/logger.js";

const router = express.Router();

// ========================================
// BROWSE ALL SUPPLIER INVENTORY
// GET /api/inventory/browse
// Vendors browsing raw materials from all suppliers
// ========================================
router.get(
  "/browse",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const {
        supplierId,
        category,
        subcategory,
        materialType,
        fabricType,
        minPrice,
        maxPrice,
        search,
        page = 1,
        limit = 20,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      // Build query
      const query = {
        status: "active", // Only show active inventory
        $expr: {
          // Only show items with available quantity
          $gt: [
            {
              $subtract: [
                "$quantity",
                {
                  $add: [
                    "$reservedQuantity",
                    "$committedQuantity",
                    "$damagedQuantity",
                  ],
                },
              ],
            },
            0,
          ],
        },
      };

      // Apply filters
      if (supplierId) {
        query.supplierId = supplierId;
      }

      if (category) {
        query.category = category;
      }

      if (subcategory) {
        query.subcategory = subcategory;
      }

      if (materialType) {
        query.materialType = materialType;
      }

      if (fabricType) {
        query["textileDetails.fabricType"] = fabricType;
      }

      if (minPrice || maxPrice) {
        query.pricePerUnit = {};
        if (minPrice) query.pricePerUnit.$gte = Number(minPrice);
        if (maxPrice) query.pricePerUnit.$lte = Number(maxPrice);
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { sku: { $regex: search, $options: "i" } },
          { tags: { $in: [new RegExp(search, "i")] } },
        ];
      }

      // Count total
      const total = await Inventory.countDocuments(query);

      // Get inventory items
      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

      const items = await Inventory.find(query)
        .populate(
          "supplierId",
          "name email companyName contactPhone averageRating"
        )
        .select(
          "name description category subcategory sku images pricePerUnit unit " +
            "quantity reservedQuantity committedQuantity damagedQuantity minOrderQuantity " +
            "maxOrderQuantity certifications tags averageRating reviewCount " +
            "textileDetails specifications"
        )
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean();

      // Calculate available quantity for each item
      const itemsWithAvailability = items.map((item) => ({
        ...item,
        supplierName:
          item.supplierId?.companyName ||
          item.supplierId?.name ||
          "Unknown Supplier",
        availableQuantity: Math.max(
          0,
          item.quantity -
            (item.reservedQuantity || 0) -
            (item.committedQuantity || 0) -
            (item.damagedQuantity || 0)
        ),
      }));

      res.json({
        success: true,
        data: itemsWithAvailability,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error("Error in GET /inventory/browse:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error browsing inventory",
      });
    }
  }
);

// ========================================
// GET SUPPLIER PROFILE
// GET /api/inventory/browse/suppliers/:supplierId
// Get supplier profile when browsing
// ========================================
router.get(
  "/browse/suppliers/:supplierId",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const supplier = await User.findOne({
        _id: req.params.supplierId,
        role: "supplier",
      })
        .select(
          "name email companyName contactPhone businessAddress " +
            "certifications description averageRating totalReviews " +
            "createdAt profileImage"
        )
        .lean();

      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: "Supplier not found",
        });
      }

      // Get supplier's inventory count and categories
      const inventoryStats = await Inventory.aggregate([
        { $match: { supplierId: supplier._id, status: "active" } },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
            avgPrice: { $avg: "$pricePerUnit" },
          },
        },
      ]);

      const totalProducts = await Inventory.countDocuments({
        supplierId: supplier._id,
        status: "active",
      });

      res.json({
        success: true,
        data: {
          ...supplier,
          inventoryStats: {
            totalProducts,
            categories: inventoryStats,
          },
        },
      });
    } catch (error) {
      logger.error(
        "Error in GET /inventory/browse/suppliers/:supplierId:",
        error
      );
      res.status(500).json({
        success: false,
        message: error.message || "Error fetching supplier profile",
      });
    }
  }
);

// ========================================
// GET SUPPLIER'S INVENTORY
// GET /api/inventory/browse/suppliers/:supplierId/inventory
// Browse specific supplier's inventory
// ========================================
router.get(
  "/browse/suppliers/:supplierId/inventory",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const {
        category,
        subcategory,
        minPrice,
        maxPrice,
        search,
        page = 1,
        limit = 20,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      // Build query
      const query = {
        supplierId: req.params.supplierId,
        status: "active",
        $expr: {
          $gt: [
            {
              $subtract: [
                "$quantity",
                {
                  $add: [
                    "$reservedQuantity",
                    "$committedQuantity",
                    "$damagedQuantity",
                  ],
                },
              ],
            },
            0,
          ],
        },
      };

      // Apply filters
      if (category) query.category = category;
      if (subcategory) query.subcategory = subcategory;

      if (minPrice || maxPrice) {
        query.pricePerUnit = {};
        if (minPrice) query.pricePerUnit.$gte = Number(minPrice);
        if (maxPrice) query.pricePerUnit.$lte = Number(maxPrice);
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { sku: { $regex: search, $options: "i" } },
        ];
      }

      // Count total
      const total = await Inventory.countDocuments(query);

      // Get items
      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

      const items = await Inventory.find(query)
        .select(
          "name description category subcategory sku images pricePerUnit unit " +
            "quantity reservedQuantity committedQuantity damagedQuantity " +
            "minOrderQuantity maxOrderQuantity certifications tags " +
            "averageRating reviewCount textileDetails specifications"
        )
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean();

      // Calculate available quantity
      const itemsWithAvailability = items.map((item) => ({
        ...item,
        availableQuantity: Math.max(
          0,
          item.quantity -
            (item.reservedQuantity || 0) -
            (item.committedQuantity || 0) -
            (item.damagedQuantity || 0)
        ),
      }));

      res.json({
        success: true,
        data: itemsWithAvailability,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error(
        "Error in GET /inventory/browse/suppliers/:supplierId/inventory:",
        error
      );
      res.status(500).json({
        success: false,
        message: error.message || "Error fetching supplier inventory",
      });
    }
  }
);

// ========================================
// GET BROWSE CATEGORIES
// GET /api/inventory/browse/categories
// Get all available inventory categories
// ========================================
router.get(
  "/browse/categories",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const categories = await Inventory.aggregate([
        {
          $match: {
            status: "active",
            $expr: {
              $gt: [
                {
                  $subtract: [
                    "$quantity",
                    {
                      $add: [
                        "$reservedQuantity",
                        "$committedQuantity",
                        "$damagedQuantity",
                      ],
                    },
                  ],
                },
                0,
              ],
            },
          },
        },
        {
          $group: {
            _id: {
              category: "$category",
              subcategory: "$subcategory",
            },
            count: { $sum: 1 },
            avgPrice: { $avg: "$pricePerUnit" },
            minPrice: { $min: "$pricePerUnit" },
            maxPrice: { $max: "$pricePerUnit" },
          },
        },
        {
          $sort: { "_id.category": 1, "_id.subcategory": 1 },
        },
      ]);

      // Group by category
      const categoriesMap = {};
      categories.forEach((item) => {
        const category = item._id.category;
        if (!categoriesMap[category]) {
          categoriesMap[category] = {
            category,
            subcategories: [],
            totalCount: 0,
          };
        }

        categoriesMap[category].subcategories.push({
          name: item._id.subcategory,
          count: item.count,
          avgPrice: item.avgPrice,
          minPrice: item.minPrice,
          maxPrice: item.maxPrice,
        });

        categoriesMap[category].totalCount += item.count;
      });

      res.json({
        success: true,
        data: Object.values(categoriesMap),
      });
    } catch (error) {
      logger.error("Error in GET /inventory/browse/categories:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error fetching categories",
      });
    }
  }
);

// ========================================
// GET ALL SUPPLIERS
// GET /api/inventory/browse/suppliers
// List all suppliers for vendor to browse
// ========================================
router.get(
  "/browse/suppliers",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const {
        search,
        minRating,
        page = 1,
        limit = 20,
        sortBy = "name",
        sortOrder = "asc",
      } = req.query;

      // Build query
      const query = { role: "supplier" };

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { companyName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      if (minRating) {
        query.averageRating = { $gte: Number(minRating) };
      }

      // Count total
      const total = await User.countDocuments(query);

      // Get suppliers
      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

      const suppliers = await User.find(query)
        .select(
          "name email companyName contactPhone businessAddress " +
            "certifications description averageRating totalReviews " +
            "createdAt profileImage"
        )
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean();

      // Get inventory count for each supplier
      const supplierIds = suppliers.map((s) => s._id);
      const inventoryCounts = await Inventory.aggregate([
        {
          $match: {
            supplierId: { $in: supplierIds },
            status: "active",
          },
        },
        {
          $group: {
            _id: "$supplierId",
            count: { $sum: 1 },
          },
        },
      ]);

      const countsMap = {};
      inventoryCounts.forEach((item) => {
        countsMap[item._id.toString()] = item.count;
      });

      // Add inventory count to each supplier
      const suppliersWithCounts = suppliers.map((supplier) => ({
        ...supplier,
        inventoryCount: countsMap[supplier._id.toString()] || 0,
      }));

      res.json({
        success: true,
        data: suppliersWithCounts,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error("Error in GET /inventory/browse/suppliers:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error fetching suppliers",
      });
    }
  }
);

// ========================================
// SEARCH INVENTORY
// GET /api/inventory/browse/search
// Advanced search across all inventory
// ========================================
router.get(
  "/browse/search",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const { q, category, minPrice, maxPrice, limit = 20 } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          message: "Search query is required",
        });
      }

      // Build query
      const query = {
        status: "active",
        $expr: {
          $gt: [
            {
              $subtract: [
                "$quantity",
                {
                  $add: [
                    "$reservedQuantity",
                    "$committedQuantity",
                    "$damagedQuantity",
                  ],
                },
              ],
            },
            0,
          ],
        },
        $or: [
          { name: { $regex: q, $options: "i" } },
          { description: { $regex: q, $options: "i" } },
          { sku: { $regex: q, $options: "i" } },
          { tags: { $in: [new RegExp(q, "i")] } },
          { category: { $regex: q, $options: "i" } },
          { subcategory: { $regex: q, $options: "i" } },
        ],
      };

      if (category) {
        query.category = category;
      }

      if (minPrice || maxPrice) {
        query.pricePerUnit = {};
        if (minPrice) query.pricePerUnit.$gte = Number(minPrice);
        if (maxPrice) query.pricePerUnit.$lte = Number(maxPrice);
      }

      const items = await Inventory.find(query)
        .populate("supplierId", "name companyName averageRating")
        .select(
          "name description category subcategory sku images pricePerUnit " +
            "unit quantity reservedQuantity committedQuantity damagedQuantity " +
            "averageRating reviewCount"
        )
        .limit(Number(limit))
        .lean();

      // Calculate available quantity
      const itemsWithAvailability = items.map((item) => ({
        ...item,
        availableQuantity: Math.max(
          0,
          item.quantity -
            (item.reservedQuantity || 0) -
            (item.committedQuantity || 0) -
            (item.damagedQuantity || 0)
        ),
      }));

      res.json({
        success: true,
        data: itemsWithAvailability,
        count: itemsWithAvailability.length,
      });
    } catch (error) {
      logger.error("Error in GET /inventory/browse/search:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error searching inventory",
      });
    }
  }
);

export default router;
