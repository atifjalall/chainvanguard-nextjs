// api/src/services/customer.browse.service.js
import Product from "../models/Product.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Review from "../models/Review.js";
import mongoose from "mongoose";
import redisService from "./redis.service.js";
import cartService from "./cart.service.js";
import wishlistService from "./wishlist.service.js";
import logger from "../utils/logger.js";

class CustomerBrowseService {
  // ========================================
  // BROWSE PRODUCTS
  // ========================================

  /**
   * Browse products with advanced customer-friendly filtering
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} - Products with pagination
   */
  async browseProducts(filters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        category,
        subcategory,
        size,
        color,
        brand,
        material,
        fit,
        minPrice,
        maxPrice,
        inStock,
        isFeatured,
        isNewArrival,
        isBestseller,
        isOrganic,
        isFairTrade,
        isRecycled,
        season,
        sortBy = "createdAt",
        sortOrder = "desc",
        vendorId,
      } = filters;

      // Build query - only show active products
      const query = { status: "active" };

      // Text search
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { tags: { $in: [new RegExp(search, "i")] } },
        ];
      }

      // Category filters
      if (category) query.category = category;
      if (subcategory) query.subcategory = subcategory;

      // Apparel filters
      if (size) query["apparelDetails.size"] = size;
      if (color) query["apparelDetails.color"] = color;
      if (brand) query.brand = new RegExp(brand, "i");
      if (material) query["apparelDetails.material"] = material;
      if (fit) query["apparelDetails.fit"] = fit;

      // Price range
      if (minPrice !== undefined || maxPrice !== undefined) {
        query.price = {};
        if (minPrice !== undefined) query.price.$gte = minPrice;
        if (maxPrice !== undefined) query.price.$lte = maxPrice;
      }

      // Stock filter
      if (inStock) {
        query.quantity = { $gt: 0 };
      }

      // Feature filters
      if (isFeatured !== undefined) query.isFeatured = isFeatured;
      if (isNewArrival !== undefined) query.isNewArrival = isNewArrival;
      if (isBestseller !== undefined) query.isBestseller = isBestseller;

      // Season filter
      if (season) query.season = season;

      // Vendor filter
      if (vendorId) query.sellerId = vendorId;

      // Pagination
      const skip = (page - 1) * limit;

      // Sorting
      const sort = {};
      if (sortBy === "price") {
        sort.price = sortOrder === "asc" ? 1 : -1;
      } else if (sortBy === "name") {
        sort.name = sortOrder === "asc" ? 1 : -1;
      } else if (sortBy === "popularity") {
        sort.viewCount = -1;
        sort.salesCount = -1;
      } else if (sortBy === "rating") {
        sort.averageRating = -1;
      } else {
        sort[sortBy] = sortOrder === "desc" ? -1 : 1;
      }

      // Execute query
      const [products, total] = await Promise.all([
        Product.find(query)
          .select(
            "name price discount originalPrice images category subcategory quantity " +
              "averageRating totalReviews isFeatured brand apparelDetails sellerId createdAt"
          )
          .populate("sellerId", "name companyName city state")
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Product.countDocuments(query),
      ]);

      // Format products for customer view
      const formattedProducts = products.map((product) => {
        // Calculate discount price if discount exists
        const discountPrice =
          product.discount > 0
            ? product.price - (product.price * product.discount) / 100
            : product.originalPrice || null;

        const finalPrice = discountPrice || product.price;

        return {
          id: product._id,
          name: product.name,
          price: product.price,
          discountPrice: discountPrice,
          finalPrice: finalPrice,
          discount: product.discount || 0,
          images: product.images,
          mainImage:
            product.images?.find((img) => img.isMain) || product.images?.[0],
          category: product.category,
          subcategory: product.subcategory,
          inStock: product.quantity > 0,
          stockStatus: this._getStockStatus(product.quantity),
          rating: product.averageRating || 0,
          reviewCount: product.totalReviews || 0,
          isFeatured: product.isFeatured || false,
          brand: product.brand,
          size: product.apparelDetails?.size || "",
          color: product.apparelDetails?.color || "",
          vendor: {
            id: product.sellerId?._id,
            name: product.sellerId?.companyName || product.sellerId?.name,
            location: `${product.sellerId?.city || ""}${
              product.sellerId?.state ? ", " + product.sellerId.state : ""
            }`.trim(),
          },
        };
      });

      return {
        products: formattedProducts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasMore: page < Math.ceil(total / limit),
        },
        filters: {
          category,
          subcategory,
          minPrice,
          maxPrice,
          inStock,
          search,
        },
      };
    } catch (error) {
      logger.error("Error in browseProducts:", error);
      throw error;
    }
  }

  // ========================================
  // PRODUCT DETAILS
  // ========================================

  /**
   * Get detailed product information with reviews, vendor, and related products
   * @param {string} productId - Product ID
   * @param {Object} options - Options (includeReviews, includeRelated, includeVendor)
   * @returns {Promise<Object>} - Detailed product information
   */
  async getProductDetails(productId, options = {}) {
    try {
      const {
        includeReviews = true,
        includeRelated = true,
        includeVendor = true,
        incrementView = false,
      } = options;

      // Get product
      const product = await Product.findOne({
        _id: productId,
        status: "active",
      })
        .populate(
          "sellerId",
          "name companyName email phone city state country businessType createdAt"
        )
        .lean();

      if (!product) {
        throw new Error("Product not found");
      }

      // Increment view count if requested
      if (incrementView) {
        await Product.findByIdAndUpdate(productId, {
          $inc: { viewCount: 1 },
        });
      }

      // Format product details
      const productDetails = {
        id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        discountPrice: product.discountPrice,
        finalPrice: product.discountPrice || product.price,
        discount: product.discountPrice
          ? Math.round(
              ((product.price - product.discountPrice) / product.price) * 100
            )
          : 0,
        images: product.images,
        category: product.category,
        subcategory: product.subcategory,
        quantity: product.quantity, // Changed from 'stock' to 'quantity' for frontend consistency
        stockStatus: this._getStockStatus(product.quantity),
        minStockLevel: product.minStockLevel,
        sku: product.sku,
        slug: product.slug,
        color: product.color || product.apparelDetails?.color, // Populate from apparelDetails if not set
        size: product.size || product.apparelDetails?.size, // Populate from apparelDetails if not set

        // Ratings & Reviews
        rating: {
          average: product.averageRating || 0,
          count: product.reviewCount || 0,
          breakdown: product.ratingBreakdown || {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0,
          },
        },

        // Apparel details
        apparelDetails: product.apparelDetails
          ? {
              availableSizes: product.apparelDetails.availableSizes || [],
              availableColors: product.apparelDetails.availableColors || [],
              material: product.apparelDetails.material,
              careInstructions: product.apparelDetails.careInstructions,
              fit: product.apparelDetails.fit,
              pattern: product.apparelDetails.pattern,
              occasion: product.apparelDetails.occasion,
              season: product.apparelDetails.season,
            }
          : null,

        // Dimensions
        dimensions: product.dimensions
          ? {
              length: product.dimensions.length,
              width: product.dimensions.width,
              height: product.dimensions.height,
              weight: product.dimensions.weight,
              unit: product.dimensions.unit,
            }
          : null,

        // Sustainability
        sustainability: {
          isOrganic: product.sustainabilityInfo?.isOrganic || false,
          isFairTrade: product.sustainabilityInfo?.isFairTrade || false,
          isRecycled: product.sustainabilityInfo?.isRecycled || false,
          carbonFootprint: product.sustainabilityInfo?.carbonFootprint,
          certifications: product.sustainabilityInfo?.certifications || [],
        },

        // Shipping
        shipping: {
          isFreeShipping: product.freeShipping || false,
          cost: product.shippingCost || 0,
          estimatedDays: product.estimatedDeliveryDays || "5-7",
          weight: product.shippingInfo?.weight,
          dimensions: product.shippingInfo?.dimensions,
        },

        // Features
        features: {
          isFeatured: product.isFeatured || false,
          isVerified: product.isVerified || false,
          isNew: this._isNewProduct(product.createdAt),
          isBestseller: (product.salesCount || 0) > 50,
        },

        // Tags
        tags: product.tags || [],

        // Metadata
        metadata: {
          viewCount: product.viewCount || 0,
          salesCount: product.salesCount || 0,
          wishlistCount: product.wishlistCount || 0,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        },
      };

      // Include vendor details
      if (includeVendor && product.sellerId) {
        productDetails.vendor = {
          id: product.sellerId._id,
          name: product.sellerId.companyName || product.sellerId.name,
          email: product.sellerId.email,
          phone: product.sellerId.phone,
          location: `${product.sellerId.city || ""}${
            product.sellerId.state ? ", " + product.sellerId.state : ""
          }${product.sellerId.country ? ", " + product.sellerId.country : ""}`.trim(),
          businessType: product.sellerId.businessType,
          memberSince: product.sellerId.createdAt,
        };

        // Add sellerName and sellerId for frontend compatibility
        productDetails.sellerName =
          product.sellerId.companyName || product.sellerId.name;
        productDetails.sellerId = product.sellerId._id;

        // Get vendor stats
        const [productCount, avgRating] = await Promise.all([
          Product.countDocuments({
            sellerId: product.sellerId._id,
            status: "active",
          }),
          Review.aggregate([
            {
              $lookup: {
                from: "products",
                localField: "productId",
                foreignField: "_id",
                as: "product",
              },
            },
            {
              $match: {
                "product.sellerId": new mongoose.Types.ObjectId(
                  product.sellerId._id
                ),
              },
            },
            {
              $group: {
                _id: null,
                avgRating: { $avg: "$rating" },
                totalReviews: { $sum: 1 },
              },
            },
          ]),
        ]);

        productDetails.vendor.stats = {
          productCount,
          avgRating: avgRating[0]?.avgRating || 0,
          totalReviews: avgRating[0]?.totalReviews || 0,
        };
      }

      // Include reviews
      if (includeReviews) {
        const reviews = await Review.find({
          productId: productId,
          status: "approved",
        })
          .populate("userId", "name")
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();

        productDetails.reviews = reviews.map((review) => ({
          id: review._id,
          rating: review.rating,
          title: review.title,
          comment: review.comment,
          userName: review.userId?.name || "Anonymous",
          date: review.createdAt,
          isVerifiedPurchase: review.isVerifiedPurchase || false,
          helpfulCount: review.helpfulCount || 0,
        }));
      }

      // Include related products
      if (includeRelated) {
        const relatedProducts = await this._getRelatedProductsForDetail(
          productId,
          product.category,
          product.subcategory,
          product.price
        );
        productDetails.relatedProducts = relatedProducts;
      }

      return { product: productDetails };
    } catch (error) {
      logger.error("Error in getProductDetails:", error);
      throw error;
    }
  }

  // ========================================
  // RELATED PRODUCTS
  // ========================================

  /**
   * Get related/recommended products
   * @param {string} productId - Product ID
   * @param {number} limit - Number of products to return
   * @returns {Promise<Object>} - Related products
   */
  async getRelatedProducts(productId, limit = 10) {
    try {
      // Get the base product
      const product = await Product.findById(productId).select(
        "category subcategory price seller"
      );

      if (!product) {
        throw new Error("Product not found");
      }

      const relatedProducts = await this._getRelatedProductsForDetail(
        productId,
        product.category,
        product.subcategory,
        product.price,
        limit
      );

      return {
        success: true,
        products: relatedProducts,
      };
    } catch (error) {
      logger.error("Error in getRelatedProducts:", error);
      throw error;
    }
  }

  /**
   * Internal method to get related products
   */
  async _getRelatedProductsForDetail(
    productId,
    category,
    subcategory,
    price,
    limit = 10
  ) {
    try {
      // Price range (±30%)
      const priceMin = price * 0.7;
      const priceMax = price * 1.3;

      // Get the base product to access tags and brand
      const baseProduct = await Product.findById(productId).select(
        "tags brand category subcategory"
      );

      console.log("Base product for related products:", baseProduct);
      console.log(
        "Query params - category:",
        category,
        "subcategory:",
        subcategory,
        "priceMin:",
        priceMin,
        "priceMax:",
        priceMax
      );

      const relatedProducts = await Product.find({
        _id: { $ne: productId },
        status: "active",
        quantity: { $gt: 0 }, // Only in-stock products
        $or: [
          { category, subcategory }, // Same subcategory
          { category, price: { $gte: priceMin, $lte: priceMax } }, // Same category, similar price
          { brand: baseProduct.brand, _id: { $ne: productId } }, // Same brand
          { tags: { $in: baseProduct.tags } }, // Similar tags
        ],
      })
        .select(
          "name price discountPrice images category subcategory quantity " +
            "averageRating totalReviews brand sellerId tags"
        )
        .populate("sellerId", "name companyName")
        .sort({ averageRating: -1, totalSold: -1 })
        .limit(limit * 2) // Get more to allow mixing
        .lean();

      console.log(
        "Raw related products found:",
        relatedProducts.length,
        relatedProducts
      );

      // Mix the results: prioritize same subcategory, then same category, then brand, then tags
      const sameSubcategory = relatedProducts.filter(
        (p) => p.category === category && p.subcategory === subcategory
      );
      const sameCategory = relatedProducts.filter(
        (p) => p.category === category && p.subcategory !== subcategory
      );
      const sameBrand = relatedProducts.filter(
        (p) => p.brand === baseProduct.brand && p.category !== category
      );
      const similarTags = relatedProducts.filter(
        (p) =>
          p.tags.some((tag) => baseProduct.tags.includes(tag)) &&
          !sameSubcategory.includes(p) &&
          !sameCategory.includes(p) &&
          !sameBrand.includes(p)
      );

      console.log(
        "Categorized related products - sameSubcategory:",
        sameSubcategory.length,
        "sameCategory:",
        sameCategory.length,
        "sameBrand:",
        sameBrand.length,
        "similarTags:",
        similarTags.length
      );

      // Combine and limit to ensure variety
      const mixedProducts = [
        ...sameSubcategory.slice(0, Math.ceil(limit * 0.4)), // 40% same subcategory
        ...sameCategory.slice(0, Math.ceil(limit * 0.3)), // 30% same category
        ...sameBrand.slice(0, Math.ceil(limit * 0.2)), // 20% same brand
        ...similarTags.slice(0, Math.ceil(limit * 0.1)), // 10% similar tags
      ].slice(0, limit); // Limit to requested number

      console.log(
        "Final mixed related products:",
        mixedProducts.length,
        mixedProducts
      );

      return mixedProducts.map((p) => ({
        id: p._id,
        name: p.name,
        price: p.price,
        costPrice: p.discountPrice,
        images: p.images,
        quantity: p.quantity,
        inStock: p.quantity > 0,
        rating: p.averageRating || 0,
        reviewCount: p.totalReviews || 0,
        brand: p.brand,
        vendor: {
          name: p.sellerId?.companyName || p.sellerId?.name,
        },
      }));
    } catch (error) {
      logger.error("Error in _getRelatedProductsForDetail:", error);
      return [];
    }
  }

  // ========================================
  // VENDOR STORE
  // ========================================

  /**
   * Get vendor store page
   * @param {string} vendorId - Vendor ID
   * @returns {Promise<Object>} - Vendor store information
   */
  async getVendorStore(vendorId) {
    try {
      // Get vendor details
      const vendor = await User.findOne({
        _id: vendorId,
        role: { $in: ["vendor", "supplier"] },
      }).select(
        "name companyName email phone city state country businessType createdAt"
      );

      if (!vendor) {
        throw new Error("Vendor not found");
      }

      // Get vendor statistics
      const [
        productCount,
        totalSales,
        avgRating,
        topCategories,
        featuredProducts,
      ] = await Promise.all([
        // Total active products
        Product.countDocuments({
          sellerId: vendorId,
          status: "active",
        }),

        // Total delivered orders
        Order.aggregate([
          {
            $match: {
              sellerId: new mongoose.Types.ObjectId(vendorId),
              status: "delivered",
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              totalRevenue: { $sum: "$total" },
            },
          },
        ]),

        // Average rating from reviews
        Review.aggregate([
          {
            $lookup: {
              from: "products",
              localField: "productId",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $match: {
              "product.sellerId": new mongoose.Types.ObjectId(vendorId),
              status: "approved",
            },
          },
          {
            $group: {
              _id: null,
              avgRating: { $avg: "$rating" },
              totalReviews: { $sum: 1 },
            },
          },
        ]),

        // Top categories
        Product.aggregate([
          {
            $match: {
              sellerId: new mongoose.Types.ObjectId(vendorId),
              status: "active",
            },
          },
          {
            $group: {
              _id: "$category",
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ]),

        // Featured products
        Product.find({
          sellerId: vendorId,
          status: "active",
          isFeatured: true,
        })
          .select(
            "name price discountPrice images category subcategory quantity " +
              "averageRating totalReviews"
          )
          .sort({ totalSold: -1 })
          .limit(8)
          .lean(),
      ]);

      return {
        vendor: {
          id: vendor._id,
          name: vendor.companyName || vendor.name,
          email: vendor.email,
          phone: vendor.phone,
          location: `${vendor.city || ""}${
            vendor.state ? ", " + vendor.state : ""
          }${vendor.country ? ", " + vendor.country : ""}`.trim(),
          businessType: vendor.businessType,
          memberSince: vendor.createdAt,
        },
        stats: {
          productCount,
          totalSales: totalSales[0]?.total || 0,
          totalRevenue: totalSales[0]?.totalRevenue || 0,
          avgRating: avgRating[0]?.avgRating || 0,
          totalReviews: avgRating[0]?.totalReviews || 0,
        },
        topCategories: topCategories.map((cat) => ({
          category: cat._id,
          productCount: cat.count,
        })),
        featuredProducts: featuredProducts.map((p) => ({
          id: p._id,
          name: p.name,
          price: p.price,
          discountPrice: p.discountPrice,
          finalPrice: p.discountPrice || p.price,
          mainImage: p.images?.find((img) => img.isMain) || p.images?.[0],
          category: p.category,
          subcategory: p.subcategory,
          inStock: p.stock > 0,
          rating: p.averageRating || 0,
          reviewCount: p.reviewCount || 0,
        })),
      };
    } catch (error) {
      logger.error("Error in getVendorStore:", error);
      throw error;
    }
  }

  /**
   * Get vendor products with filters
   * @param {string} vendorId - Vendor ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} - Vendor products
   */
  async getVendorProducts(vendorId, filters = {}) {
    try {
      // Verify vendor exists
      const vendor = await User.findOne({
        _id: vendorId,
        role: { $in: ["vendor", "supplier"] },
      });

      if (!vendor) {
        throw new Error("Vendor not found");
      }

      // Use browseProducts with vendorId filter
      const result = await this.browseProducts({
        ...filters,
        vendorId,
      });

      return result;
    } catch (error) {
      logger.error("Error in getVendorProducts:", error);
      throw error;
    }
  }

  // ========================================
  // PRODUCT COMPARISON
  // ========================================

  /**
   * Compare multiple products side-by-side
   * @param {Array<string>} productIds - Product IDs to compare
   * @returns {Promise<Object>} - Comparison data
   */
  async compareProducts(productIds) {
    try {
      const products = await Product.find({
        _id: { $in: productIds },
        status: "active",
      })
        .populate("sellerId", "name companyName")
        .lean();

      if (products.length === 0) {
        throw new Error("No products found for comparison");
      }

      const comparisonData = products.map((product) => ({
        id: product._id,
        name: product.name,
        price: product.price,
        discountPrice: product.discountPrice,
        finalPrice: product.discountPrice || product.price,
        mainImage:
          product.images?.find((img) => img.isMain) || product.images?.[0],
        category: product.category,
        subcategory: product.subcategory,
        brand: product.brand,
        rating: product.averageRating || 0,
        reviewCount: product.reviewCount || 0,
        inStock: product.stock > 0,
        stock: product.stock,
        features: {
          isFeatured: product.isFeatured || false,
          isVerified: product.isVerified || false,
          isFreeShipping: product.shippingInfo?.isFreeShipping || false,
        },
        sustainability: {
          isOrganic: product.sustainabilityInfo?.isOrganic || false,
          isFairTrade: product.sustainabilityInfo?.isFairTrade || false,
          isRecycled: product.sustainabilityInfo?.isRecycled || false,
        },
        apparelDetails: product.apparelDetails
          ? {
              availableSizes: product.apparelDetails.availableSizes || [],
              availableColors: product.apparelDetails.availableColors || [],
              material: product.apparelDetails.material,
              fit: product.apparelDetails.fit,
            }
          : null,
        dimensions: product.dimensions || null,
        vendor: {
          name: product.sellerId?.companyName || product.sellerId?.name,
        },
      }));

      return {
        products: comparisonData,
        count: comparisonData.length,
      };
    } catch (error) {
      logger.error("Error in compareProducts:", error);
      throw error;
    }
  }

  // ========================================
  // COLLECTIONS
  // ========================================

  /**
   * Get featured products collection
   */
  async getFeaturedCollection(limit = 20, category = null) {
    try {
      const query = {
        status: "active",
        isFeatured: true,
      };

      if (category) {
        query.category = category;
      }

      const products = await Product.find(query)
        .select(
          "name price discountPrice images category subcategory stock " +
            "averageRating reviewCount brand seller"
        )
        .populate("seller", "name companyName")
        .sort({ salesCount: -1, averageRating: -1 })
        .limit(limit)
        .lean();

      return {
        products: this._formatProductList(products),
        count: products.length,
      };
    } catch (error) {
      logger.error("Error in getFeaturedCollection:", error);
      throw error;
    }
  }

  /**
   * Get trending products collection
   */
  async getTrendingCollection(limit = 20, timeframe = "week") {
    try {
      // Calculate date based on timeframe
      let dateFilter;
      const now = new Date();

      switch (timeframe) {
        case "week":
          dateFilter = new Date(now.setDate(now.getDate() - 7));
          break;
        case "month":
          dateFilter = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          dateFilter = new Date(0); // All time
      }

      const products = await Product.find({
        status: "active",
        createdAt: { $gte: dateFilter },
      })
        .select(
          "name price discountPrice images category subcategory stock " +
            "averageRating reviewCount brand seller viewCount salesCount"
        )
        .populate("seller", "name companyName")
        .sort({ viewCount: -1, salesCount: -1 })
        .limit(limit)
        .lean();

      return {
        products: this._formatProductList(products),
        count: products.length,
        timeframe,
      };
    } catch (error) {
      logger.error("Error in getTrendingCollection:", error);
      throw error;
    }
  }

  /**
   * Get new arrivals collection
   */
  async getNewArrivalsCollection(limit = 20, category = null) {
    try {
      const query = {
        status: "active",
      };

      if (category) {
        query.category = category;
      }

      const products = await Product.find(query)
        .select(
          "name price discountPrice images category subcategory stock " +
            "averageRating reviewCount brand seller createdAt"
        )
        .populate("seller", "name companyName")
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return {
        products: this._formatProductList(products),
        count: products.length,
      };
    } catch (error) {
      logger.error("Error in getNewArrivalsCollection:", error);
      throw error;
    }
  }

  /**
   * Get deals collection (products on sale)
   */
  async getDealsCollection(limit = 20, minDiscount = 10) {
    try {
      const products = await Product.find({
        status: "active",
        discountPrice: { $exists: true, $ne: null },
      })
        .select(
          "name price discountPrice images category subcategory stock " +
            "averageRating reviewCount brand seller"
        )
        .populate("seller", "name companyName")
        .lean();

      // Filter by minimum discount percentage
      const dealsProducts = products
        .filter((p) => {
          const discountPercent = ((p.price - p.discountPrice) / p.price) * 100;
          return discountPercent >= minDiscount;
        })
        .sort((a, b) => {
          const discountA = ((a.price - a.discountPrice) / a.price) * 100;
          const discountB = ((b.price - b.discountPrice) / b.price) * 100;
          return discountB - discountA;
        })
        .slice(0, limit);

      return {
        products: this._formatProductList(dealsProducts),
        count: dealsProducts.length,
        minDiscount,
      };
    } catch (error) {
      logger.error("Error in getDealsCollection:", error);
      throw error;
    }
  }

  // ========================================
  // CATEGORY PAGE
  // ========================================

  /**
   * Get category page with products and filters
   */
  async getCategoryPage(category, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = options;

      // Get products in category
      const productsResult = await this.browseProducts({
        category,
        page,
        limit,
        sortBy,
        sortOrder,
      });

      // Get subcategories with counts
      const subcategories = await Product.aggregate([
        {
          $match: {
            category,
            status: "active",
          },
        },
        {
          $group: {
            _id: "$subcategory",
            count: { $sum: 1 },
            minPrice: { $min: "$price" },
            maxPrice: { $max: "$price" },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);

      // Get price range for category
      const priceRange = await Product.aggregate([
        {
          $match: {
            category,
            status: "active",
          },
        },
        {
          $group: {
            _id: null,
            minPrice: { $min: "$price" },
            maxPrice: { $max: "$price" },
          },
        },
      ]);

      // Get brands in category
      const brands = await Product.distinct("brand", {
        category,
        status: "active",
      });

      return {
        category,
        products: productsResult.products,
        pagination: productsResult.pagination,
        subcategories: subcategories.map((sub) => ({
          name: sub._id,
          count: sub.count,
          priceRange: {
            min: sub.minPrice,
            max: sub.maxPrice,
          },
        })),
        filters: {
          priceRange: priceRange[0] || { minPrice: 0, maxPrice: 0 },
          brands: brands.filter((b) => b),
        },
      };
    } catch (error) {
      logger.error("Error in getCategoryPage:", error);
      throw error;
    }
  }

  // ========================================
  // QUICK ACTIONS
  // ========================================

  /**
   * Quick add to cart
   */
  async quickAddToCart(userId, options) {
    try {
      const { productId, quantity, selectedSize, selectedColor, selectedFit } =
        options;

      // Verify product exists and is in stock
      const product = await Product.findOne({
        _id: productId,
        status: "active",
      });

      if (!product) {
        throw new Error("Product not found");
      }

      if (product.stock < quantity) {
        throw new Error("Insufficient stock");
      }

      // Use cart service to add to cart
      const result = await cartService.addToCart(userId, null, {
        productId,
        quantity,
        selectedSize,
        selectedColor,
        selectedFit,
      });

      return {
        message: "Product added to cart successfully",
        cart: result.cart,
      };
    } catch (error) {
      logger.error("Error in quickAddToCart:", error);
      throw error;
    }
  }

  /**
   * Quick add to wishlist
   */
  async quickAddToWishlist(userId, productId, options = {}) {
    try {
      // Verify product exists
      const product = await Product.findOne({
        _id: productId,
        status: "active",
      });

      if (!product) {
        throw new Error("Product not found");
      }

      // Use wishlist service
      const result = await wishlistService.addToWishlist(
        userId,
        productId,
        options
      );

      return result;
    } catch (error) {
      logger.error("Error in quickAddToWishlist:", error);
      throw error;
    }
  }

  // ========================================
  // PERSONALIZATION
  // ========================================

  /**
   * Get browsing history
   */
  async getBrowsingHistory(userId, page = 1, limit = 20) {
    try {
      // Try to get from Redis cache
      const cacheKey = `browsing_history:${userId}`;
      const cached = await redisService.get(cacheKey);

      let productIds = [];

      if (cached) {
        productIds = JSON.parse(cached);
      }

      // Pagination
      const skip = (page - 1) * limit;
      const paginatedIds = productIds.slice(skip, skip + limit);

      if (paginatedIds.length === 0) {
        return {
          products: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0,
          },
        };
      }

      // Get products
      const products = await Product.find({
        _id: { $in: paginatedIds },
        status: "active",
      })
        .select(
          "name price discountPrice images category subcategory stock " +
            "averageRating reviewCount brand seller"
        )
        .populate("seller", "name companyName")
        .lean();

      // Maintain order from browsing history
      const orderedProducts = paginatedIds
        .map((id) => products.find((p) => p._id.toString() === id))
        .filter((p) => p);

      return {
        products: this._formatProductList(orderedProducts),
        pagination: {
          page,
          limit,
          total: productIds.length,
          pages: Math.ceil(productIds.length / limit),
        },
      };
    } catch (error) {
      logger.error("Error in getBrowsingHistory:", error);
      throw error;
    }
  }

  /**
   * Get personalized recommendations
   */
  async getPersonalizedRecommendations(userId, limit = 20) {
    try {
      // Get user's order history
      const orders = await Order.find({
        customerId: userId,
        status: "delivered",
      })
        .select("items")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      // Extract categories and product IDs from orders
      const purchasedProductIds = [];
      const categories = new Set();

      for (const order of orders) {
        for (const item of order.items || []) {
          purchasedProductIds.push(item.productId.toString());
        }
      }

      // Get purchased products to find categories
      const purchasedProducts = await Product.find({
        _id: { $in: purchasedProductIds },
      }).select("category subcategory");

      purchasedProducts.forEach((p) => {
        if (p.category) categories.add(p.category);
      });

      // Find recommendations based on categories
      const recommendations = await Product.find({
        _id: { $nin: purchasedProductIds },
        status: "active",
        $or: [
          { category: { $in: Array.from(categories) } },
          { isFeatured: true },
        ],
      })
        .select(
          "name price discountPrice images category subcategory stock " +
            "averageRating reviewCount brand seller salesCount"
        )
        .populate("seller", "name companyName")
        .sort({ averageRating: -1, salesCount: -1 })
        .limit(limit)
        .lean();

      return {
        products: this._formatProductList(recommendations),
        count: recommendations.length,
      };
    } catch (error) {
      logger.error("Error in getPersonalizedRecommendations:", error);
      throw error;
    }
  }

  /**
   * Get search suggestions/autocomplete
   */
  async getSearchSuggestions(query, limit = 10) {
    try {
      // Search in product names
      const products = await Product.find({
        status: "active",
        $or: [
          { name: { $regex: query, $options: "i" } },
          { tags: { $in: [new RegExp(query, "i")] } },
          { brand: { $regex: query, $options: "i" } },
        ],
      })
        .select("name category brand")
        .limit(limit)
        .lean();

      const suggestions = products.map((p) => ({
        text: p.name,
        type: "product",
        category: p.category,
        brand: p.brand,
      }));

      // Also get category suggestions
      const categories = await Product.distinct("category", {
        status: "active",
        category: { $regex: query, $options: "i" },
      });

      categories.slice(0, 3).forEach((cat) => {
        suggestions.push({
          text: cat,
          type: "category",
        });
      });

      return {
        suggestions: suggestions.slice(0, limit),
        query,
      };
    } catch (error) {
      logger.error("Error in getSearchSuggestions:", error);
      throw error;
    }
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Format product list for customer view
   */
  _formatProductList(products) {
    return products.map((product) => ({
      id: product._id,
      name: product.name,
      price: product.price,
      discountPrice: product.discountPrice,
      finalPrice: product.discountPrice || product.price,
      discount: product.discountPrice
        ? Math.round(
            ((product.price - product.discountPrice) / product.price) * 100
          )
        : 0,
      mainImage:
        product.images?.find((img) => img.isMain) || product.images?.[0],
      category: product.category,
      subcategory: product.subcategory,
      brand: product.brand,
      inStock: product.quantity > 0,
      stockStatus: this._getStockStatus(product.quantity),
      rating: product.averageRating || 0,
      reviewCount: product.totalReviews || 0,
      vendor: {
        name: product.sellerId?.companyName || product.sellerId?.name,
      },
    }));
  }

  /**
   * Get stock status label
   */
  _getStockStatus(stock) {
    if (stock === 0) return "Out of Stock";
    if (stock < 10) return "Low Stock";
    return "In Stock";
  }

  /**
   * Check if product is new (created within last 30 days)
   */
  _isNewProduct(createdAt) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(createdAt) > thirtyDaysAgo;
  }

  /**
   * Get similar products based on category
   * @param {string} category - Category to find similar products for
   * @param {number} limit - Number of products to return
   * @returns {Promise<Object>} - Similar products
   */
  async getSimilarProducts(category, limit = 10) {
    try {
      const products = await Product.find({
        category,
        status: "active",
        quantity: { $gt: 0 },
        sellerId: { $exists: true, $type: "objectId" },
      })
        .select(
          "name price discountPrice images category subcategory quantity " +
            "averageRating totalReviews brand sellerId"
        )
        .populate("sellerId", "name companyName")
        .sort({ averageRating: -1, totalSold: -1 })
        .limit(limit)
        .lean();

      return {
        products: products.map((p) => ({
          _id: p._id,
          id: p._id,
          name: p.name,
          price: p.price,
          discountPrice: p.discountPrice,
          originalPrice: p.discountPrice,
          images: p.images,
          quantity: p.quantity,
          inStock: p.quantity > 0,
          category: p.category,
          subcategory: p.subcategory,
          rating: p.averageRating || 0,
          totalReviews: p.totalReviews || 0,
          brand: p.brand,
          apparelDetails: p.apparelDetails,
        })),
        count: products.length,
      };
    } catch (error) {
      logger.error("Error in getSimilarProducts:", error);
      throw error;
    }
  }
}

export default new CustomerBrowseService();
