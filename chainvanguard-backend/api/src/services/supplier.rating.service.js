import SupplierRating from "../models/SupplierRating.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import notificationService from "./notification.service.js";
import blockchainService from "./blockchain.service.js";
import mongoose from "mongoose";
import logger from "../utils/logger.js";

/**
 * Business logic for vendor rating of suppliers
 */

class SupplierRatingService {
  async createOrUpdateRating(vendorId, supplierId, ratingData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { ratings, comment } = ratingData;

      // Validate vendor and supplier
      const [vendor, supplier] = await Promise.all([
        User.findOne({ _id: vendorId, role: "vendor" }),
        User.findOne({ _id: supplierId, role: "supplier" }),
      ]);

      if (!vendor) {
        throw new Error("Vendor not found");
      }

      if (!supplier) {
        throw new Error("Supplier not found");
      }

      // Check if vendor can rate this supplier
      const canRate = await this.canVendorRateSupplier(vendorId, supplierId);
      if (!canRate.eligible) {
        throw new Error(canRate.reason);
      }

      // Check if rating already exists
      const existingRating = await SupplierRating.findOne({
        vendorId,
        supplierId,
      });

      let rating;

      if (existingRating) {
        // Update existing rating
        await existingRating.updateRating(ratings, comment);
        rating = existingRating;

        logger.info(
          `Vendor ${vendorId} updated rating for supplier ${supplierId}`
        );
      } else {
        // Create new rating
        rating = new SupplierRating({
          vendorId,
          vendorName: vendor.name,
          supplierId,
          supplierName: supplier.name,
          ratings,
          comment: comment || "",
          completedOrdersCount: canRate.completedOrdersCount,
          sampleOrders: canRate.sampleOrders.slice(0, 3), // Store up to 3 recent orders
          status: "approved", // Auto-approve for now
        });

        await rating.save({ session });

        logger.info(
          `Vendor ${vendorId} created new rating for supplier ${supplierId}`
        );

        // Notify supplier
        await notificationService.createNotification({
          recipientId: supplierId,
          title: "New Supplier Rating",
          message: `${vendor.name} rated your business ${rating.overallRating}/5 stars`,
          category: "ratings",
          priority: "low",
          action: {
            type: "view_rating",
            url: `/supplier/ratings/${rating._id}`,
          },
          metadata: {
            ratingId: rating._id,
            vendorId,
            overallRating: rating.overallRating,
          },
        });
      }

      // Update supplier's average rating
      await this.updateSupplierAverageRating(supplierId, session);

      // Log to blockchain
      try {
        const txId = await blockchainService.logTransaction({
          type: existingRating
            ? "supplier_rating_updated"
            : "supplier_rating_created",
          ratingId: rating._id,
          vendorId,
          supplierId,
          overallRating: rating.overallRating,
          timestamp: new Date(),
        });

        rating.blockchainTxId = txId;
        rating.blockchainVerified = true;
        await rating.save({ session });
      } catch (error) {
        logger.error("Blockchain logging failed:", error);
      }

      await session.commitTransaction();

      return {
        success: true,
        message: existingRating
          ? "Rating updated successfully"
          : "Rating submitted successfully",
        rating: await rating.populate([
          { path: "vendorId", select: "name companyName" },
          { path: "supplierId", select: "name companyName" },
        ]),
      };
    } catch (error) {
      await session.abortTransaction();
      logger.error("❌ Create/Update rating error:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Check if vendor can rate supplier
   */
  async canVendorRateSupplier(vendorId, supplierId) {
    try {
      // Get completed orders between vendor and supplier
      const completedOrders = await Order.find({
        customerId: vendorId, // Vendor is the customer
        sellerId: supplierId, // Supplier is the seller
        status: "delivered",
      })
        .select("_id orderNumber createdAt")
        .sort({ createdAt: -1 })
        .lean();

      const completedOrdersCount = completedOrders.length;

      // Require at least 1 completed order
      if (completedOrdersCount === 0) {
        return {
          eligible: false,
          reason:
            "You must have at least 1 completed order with this supplier to rate them",
          completedOrdersCount: 0,
        };
      }

      return {
        eligible: true,
        completedOrdersCount,
        sampleOrders: completedOrders.map((o) => o._id),
      };
    } catch (error) {
      logger.error("Error checking rating eligibility:", error);
      throw error;
    }
  }

  /**
   * Update supplier average rating
   */
  async updateSupplierAverageRating(supplierId, session = null) {
    try {
      const stats = await SupplierRating.getSupplierRatingStats(supplierId);

      await User.findByIdAndUpdate(
        supplierId,
        {
          averageRating: stats.averageOverall || 0,
          totalRatings: stats.totalRatings || 0,
        },
        { session }
      );

      logger.info(
        `Updated supplier ${supplierId} average rating to ${stats.averageOverall}`
      );

      return stats;
    } catch (error) {
      logger.error("Error updating supplier average rating:", error);
      throw error;
    }
  }

  /**
   * Get supplier ratings
   */
  async getSupplierRatings(supplierId, filters = {}) {
    try {
      const {
        minRating,
        withCommentsOnly,
        page = 1,
        limit = 20,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = filters;

      const query = {
        supplierId,
        status: "approved",
      };

      if (minRating) {
        query.overallRating = { $gte: Number(minRating) };
      }

      if (withCommentsOnly === "true") {
        query.comment = { $ne: "" };
      }

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      const [ratings, total] = await Promise.all([
        SupplierRating.find(query)
          .populate("vendorId", "name companyName email")
          .populate("supplierResponse.respondedBy", "name")
          .sort(sort)
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        SupplierRating.countDocuments(query),
      ]);

      return {
        ratings,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      };
    } catch (error) {
      logger.error("Error getting supplier ratings:", error);
      throw error;
    }
  }

  /**
   * Get rating statistics
   */
  async getRatingStats(supplierId) {
    try {
      const stats = await SupplierRating.getSupplierRatingStats(supplierId);

      // Get recent ratings (last 5)
      const recentRatings = await SupplierRating.find({
        supplierId,
        status: "approved",
      })
        .populate("vendorId", "name companyName")
        .sort({ createdAt: -1 })
        .limit(5)
        .select("overallRating ratings comment createdAt")
        .lean();

      return {
        stats,
        recentRatings,
      };
    } catch (error) {
      logger.error("Error getting rating stats:", error);
      throw error;
    }
  }

  /**
   * Get vendor's rating for supplier
   */
  async getVendorRating(vendorId, supplierId) {
    try {
      const rating = await SupplierRating.getVendorRating(vendorId, supplierId);
      return rating;
    } catch (error) {
      logger.error("Error getting vendor rating:", error);
      throw error;
    }
  }

  /**
   * Add supplier response
   */
  async addSupplierResponse(ratingId, supplierId, comment) {
    try {
      const rating = await SupplierRating.findById(ratingId);

      if (!rating) {
        throw new Error("Rating not found");
      }

      if (rating.supplierId.toString() !== supplierId) {
        throw new Error(
          "Unauthorized: You can only respond to ratings of your business"
        );
      }

      if (rating.supplierResponse && rating.supplierResponse.comment) {
        throw new Error("You have already responded to this rating");
      }

      await rating.addSupplierResponse(comment, supplierId);

      // Notify vendor
      await notificationService.createNotification({
        recipientId: rating.vendorId,
        title: "Supplier Responded to Your Rating",
        message: `${rating.supplierName} responded to your rating`,
        category: "ratings",
        priority: "low",
        action: {
          type: "view_rating",
          url: `/vendor/suppliers/${supplierId}/rating`,
        },
      });

      return {
        success: true,
        message: "Response added successfully",
        rating,
      };
    } catch (error) {
      logger.error("❌ Add supplier response error:", error);
      throw error;
    }
  }

  /**
   * Vote helpful/unhelpful
   */
  async voteHelpful(ratingId, userId, vote) {
    try {
      if (!["helpful", "unhelpful"].includes(vote)) {
        throw new Error('Vote must be "helpful" or "unhelpful"');
      }

      const rating = await SupplierRating.findById(ratingId);

      if (!rating) {
        throw new Error("Rating not found");
      }

      await rating.addVote(userId, vote);

      return {
        success: true,
        message: "Vote recorded successfully",
        helpfulCount: rating.helpfulCount,
        unhelpfulCount: rating.unhelpfulCount,
      };
    } catch (error) {
      logger.error("❌ Vote helpful error:", error);
      throw error;
    }
  }

  /**
   * Flag rating
   */
  async flagRating(ratingId, userId, reason) {
    try {
      const rating = await SupplierRating.findById(ratingId);

      if (!rating) {
        throw new Error("Rating not found");
      }

      await rating.flag(userId, reason);

      return {
        success: true,
        message: "Rating flagged successfully",
      };
    } catch (error) {
      logger.error("❌ Flag rating error:", error);
      throw error;
    }
  }

  /**
   * Delete rating (admin only)
   */
  async deleteRating(ratingId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const rating = await SupplierRating.findById(ratingId);

      if (!rating) {
        throw new Error("Rating not found");
      }

      const supplierId = rating.supplierId;

      await rating.deleteOne({ session });

      // Update supplier's average rating
      await this.updateSupplierAverageRating(supplierId, session);

      await session.commitTransaction();

      return {
        success: true,
        message: "Rating deleted successfully",
      };
    } catch (error) {
      await session.abortTransaction();
      logger.error("❌ Delete rating error:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get vendor's submitted ratings
   */
  async getVendorSubmittedRatings(vendorId, filters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = filters;

      const query = { vendorId };

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      const [ratings, total] = await Promise.all([
        SupplierRating.find(query)
          .populate("supplierId", "name companyName email")
          .populate("supplierResponse.respondedBy", "name")
          .sort(sort)
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        SupplierRating.countDocuments(query),
      ]);

      return {
        ratings,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      };
    } catch (error) {
      logger.error("Error getting vendor submitted ratings:", error);
      throw error;
    }
  }
}

export default new SupplierRatingService();
