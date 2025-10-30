import Review from "../models/Review.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import notificationService from "./notification.service.js";
import blockchainService from "./blockchain.service.js";
import mongoose from "mongoose";

/**
 * ========================================
 * REVIEW SERVICE
 * ========================================
 * Manage product reviews and ratings
 */

class ReviewService {
  // ========================================
  // CREATE REVIEW
  // ========================================

  /**
   * Create a new product review
   */
  async createReview(customerId, reviewData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const {
        productId,
        orderId,
        rating,
        title,
        comment,
        qualityRating,
        valueRating,
        deliveryRating,
        images,
        videos,
      } = reviewData;

      // Validate order and product
      const order = await Order.findById(orderId).session(session);

      if (!order) {
        throw new Error("Order not found");
      }

      if (order.customerId.toString() !== customerId) {
        throw new Error("Unauthorized: This is not your order");
      }

      if (!["delivered", "completed"].includes(order.status)) {
        throw new Error("Only delivered orders can be reviewed");
      }

      // Check if product was in the order
      const orderItem = order.items.find(
        (item) => item.productId.toString() === productId
      );

      if (!orderItem) {
        throw new Error("Product not found in this order");
      }

      // Check if already reviewed
      const existingReview = await Review.findOne({
        customerId,
        orderId,
        productId,
      }).session(session);

      if (existingReview) {
        throw new Error("You have already reviewed this product");
      }

      // Get product and vendor details
      const [product, customer] = await Promise.all([
        Product.findById(productId).session(session),
        User.findById(customerId).session(session),
      ]);

      if (!product) {
        throw new Error("Product not found");
      }

      // Create review
      const review = new Review({
        productId,
        productName: product.name,
        customerId,
        customerName: customer.name,
        vendorId: product.seller,
        orderId,
        orderNumber: order.orderNumber,
        rating,
        title,
        comment,
        qualityRating,
        valueRating,
        deliveryRating,
        images: images || [],
        videos: videos || [],
        verifiedPurchase: true,
        purchaseDate: order.createdAt,
        status: "approved", // Auto-approve for now
      });

      await review.save({ session });

      // Update order
      order.isReviewed = true;
      order.reviewSubmittedAt = new Date();
      await order.save({ session });

      // Product rating will be updated automatically via post-save hook

      // Log to blockchain
      try {
        const txId = await blockchainService.logTransaction({
          type: "review_submitted",
          reviewId: review._id,
          productId,
          customerId,
          rating,
          timestamp: new Date(),
        });

        review.blockchainTxId = txId;
        review.blockchainVerified = true;
        await review.save({ session });
      } catch (error) {
        console.error("Blockchain logging failed:", error);
      }

      // Notify vendor
      await notificationService.createNotification({
        recipientId: product.seller,
        title: "New Product Review",
        message: `${customer.name} left a ${rating}-star review for ${product.name}`,
        category: "reviews",
        priority: "low",
        action: {
          type: "view_review",
          url: `/vendor/reviews/${review._id}`,
        },
        metadata: {
          reviewId: review._id,
          productId,
          rating,
        },
      });

      await session.commitTransaction();

      return {
        success: true,
        message: "Review submitted successfully",
        review: await review.populate(["customerId", "vendorId", "productId"]),
      };
    } catch (error) {
      await session.abortTransaction();
      console.error("❌ Create review error:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ========================================
  // GET REVIEWS
  // ========================================

  /**
   * Get product reviews
   */
  async getProductReviews(productId, filters = {}) {
    const {
      rating,
      verifiedOnly,
      withImagesOnly,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    const query = {
      productId,
      status: "approved",
    };

    if (rating) {
      query.rating = Number(rating);
    }

    if (verifiedOnly === "true") {
      query.verifiedPurchase = true;
    }

    if (withImagesOnly === "true") {
      query["images.0"] = { $exists: true };
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    // Add helpful count as secondary sort
    if (sortBy !== "helpfulCount") {
      sort.helpfulCount = -1;
    }

    const [reviews, total, stats] = await Promise.all([
      Review.find(query)
        .populate("customerId", "name")
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Review.countDocuments(query),
      Review.getProductRatingStats(productId),
    ]);

    return {
      reviews,
      stats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get vendor reviews
   */
  async getVendorReviews(vendorId, filters = {}) {
    const {
      rating,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    const query = {
      vendorId,
      status: "approved",
    };

    if (rating) {
      query.rating = Number(rating);
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const [reviews, total, stats] = await Promise.all([
      Review.find(query)
        .populate("customerId", "name")
        .populate("productId", "name images")
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Review.countDocuments(query),
      Review.getVendorRatingStats(vendorId),
    ]);

    return {
      reviews,
      stats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get customer reviews
   */
  async getCustomerReviews(customerId, filters = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    const query = { customerId };

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate("productId", "name images price")
        .populate("vendorId", "name companyName")
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Review.countDocuments(query),
    ]);

    return {
      reviews,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get review by ID
   */
  async getReviewById(reviewId) {
    const review = await Review.findById(reviewId)
      .populate("customerId", "name")
      .populate("productId", "name images price category")
      .populate("vendorId", "name companyName");

    if (!review) {
      throw new Error("Review not found");
    }

    return review;
  }

  // ========================================
  // UPDATE REVIEW
  // ========================================

  /**
   * Edit review (by customer)
   */
  async editReview(reviewId, customerId, updateData) {
    try {
      const review = await Review.findById(reviewId);

      if (!review) {
        throw new Error("Review not found");
      }

      if (review.customerId.toString() !== customerId) {
        throw new Error("Unauthorized: You can only edit your own reviews");
      }

      // Only allow editing within 30 days
      const daysSinceCreation = Math.ceil(
        (new Date() - review.createdAt) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceCreation > 30) {
        throw new Error("Reviews can only be edited within 30 days");
      }

      const { rating, comment, title, images } = updateData;

      // Use the edit method which tracks history
      await review.edit(rating || review.rating, comment || review.comment);

      if (title !== undefined) review.title = title;
      if (images !== undefined) review.images = images;

      await review.save();

      return {
        success: true,
        message: "Review updated successfully",
        review: await review.populate(["customerId", "productId", "vendorId"]),
      };
    } catch (error) {
      console.error("❌ Edit review error:", error);
      throw error;
    }
  }

  /**
   * Delete review (by customer)
   */
  async deleteReview(reviewId, customerId) {
    try {
      const review = await Review.findById(reviewId);

      if (!review) {
        throw new Error("Review not found");
      }

      if (review.customerId.toString() !== customerId) {
        throw new Error("Unauthorized: You can only delete your own reviews");
      }

      await review.remove();

      return {
        success: true,
        message: "Review deleted successfully",
      };
    } catch (error) {
      console.error("❌ Delete review error:", error);
      throw error;
    }
  }

  // ========================================
  // HELPFUL VOTES
  // ========================================

  /**
   * Mark review as helpful
   */
  async voteHelpful(reviewId, userId, voteType) {
    try {
      const review = await Review.findById(reviewId);

      if (!review) {
        throw new Error("Review not found");
      }

      if (review.customerId.toString() === userId) {
        throw new Error("You cannot vote on your own review");
      }

      await review.addHelpfulVote(userId, voteType);

      return {
        success: true,
        message: `Marked as ${voteType}`,
        helpfulCount: review.helpfulCount,
        unhelpfulCount: review.unhelpfulCount,
      };
    } catch (error) {
      console.error("❌ Vote helpful error:", error);
      throw error;
    }
  }

  // ========================================
  // VENDOR RESPONSE
  // ========================================

  /**
   * Add vendor response to review
   */
  async addVendorResponse(reviewId, vendorId, comment) {
    try {
      const review = await Review.findById(reviewId);

      if (!review) {
        throw new Error("Review not found");
      }

      if (review.vendorId.toString() !== vendorId) {
        throw new Error(
          "Unauthorized: You can only respond to reviews of your products"
        );
      }

      if (review.vendorResponse && review.vendorResponse.comment) {
        throw new Error("You have already responded to this review");
      }

      await review.addVendorResponse(comment, vendorId);

      // Notify customer
      await notificationService.createNotification({
        recipientId: review.customerId,
        title: "Vendor Responded to Your Review",
        message: `${review.vendorId.name || "The vendor"} responded to your review`,
        category: "reviews",
        priority: "low",
        action: {
          type: "view_review",
          url: `/customer/reviews/${review._id}`,
        },
      });

      return {
        success: true,
        message: "Response added successfully",
        review,
      };
    } catch (error) {
      console.error("❌ Add vendor response error:", error);
      throw error;
    }
  }

  // ========================================
  // FLAG/REPORT REVIEW
  // ========================================

  /**
   * Flag review as inappropriate
   */
  async flagReview(reviewId, userId, reason) {
    try {
      const review = await Review.findById(reviewId);

      if (!review) {
        throw new Error("Review not found");
      }

      await review.flag(userId, reason);

      return {
        success: true,
        message: "Review flagged for moderation",
      };
    } catch (error) {
      console.error("❌ Flag review error:", error);
      throw error;
    }
  }

  // ========================================
  // STATISTICS
  // ========================================

  /**
   * Get product rating statistics
   */
  async getProductRatingStats(productId) {
    return await Review.getProductRatingStats(productId);
  }

  /**
   * Get vendor rating statistics
   */
  async getVendorRatingStats(vendorId, timeframe = "all") {
    return await Review.getVendorRatingStats(vendorId, timeframe);
  }

  /**
   * Get most helpful reviews
   */
  async getMostHelpfulReviews(productId, limit = 5) {
    return await Review.getMostHelpful(productId, limit);
  }

  /**
   * Check if customer can review product
   */
  async canReviewProduct(customerId, productId) {
    try {
      // Check if customer has purchased the product
      const order = await Order.findOne({
        customerId,
        "items.productId": productId,
        status: { $in: ["delivered", "completed"] },
      });

      if (!order) {
        return {
          canReview: false,
          reason: "You must purchase this product before reviewing it",
        };
      }

      // Check if already reviewed
      const existingReview = await Review.findOne({
        customerId,
        productId,
      });

      if (existingReview) {
        return {
          canReview: false,
          reason: "You have already reviewed this product",
        };
      }

      return {
        canReview: true,
        orderId: order._id,
      };
    } catch (error) {
      console.error("❌ Check review eligibility error:", error);
      throw error;
    }
  }
}

export default new ReviewService();
