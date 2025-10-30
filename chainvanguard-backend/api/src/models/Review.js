import mongoose from "mongoose";

/**
 * ========================================
 * REVIEW MODEL
 * ========================================
 * Product reviews and ratings system
 */

const reviewSchema = new mongoose.Schema(
  {
    // Review identification
    reviewId: {
      type: String,
      unique: true,
      required: true,
    },

    // Product information
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    productName: {
      type: String,
      required: true,
    },

    // Customer information
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
    },

    // Vendor information
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Related order
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    orderNumber: String,

    // Rating (1-5 stars)
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    // Review content
    title: {
      type: String,
      maxlength: 100,
    },
    comment: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 2000,
    },

    // Review categories (optional)
    qualityRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    valueRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    deliveryRating: {
      type: Number,
      min: 1,
      max: 5,
    },

    // Media
    images: [
      {
        url: String,
        caption: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    videos: [
      {
        url: String,
        thumbnail: String,
        duration: Number, // in seconds
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Verification
    verifiedPurchase: {
      type: Boolean,
      default: false,
      index: true,
    },
    purchaseDate: Date,

    // Review status
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "flagged", "hidden"],
      default: "approved",
      index: true,
    },

    moderationNotes: String,
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    moderatedAt: Date,

    // Vendor response
    vendorResponse: {
      comment: String,
      respondedAt: Date,
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },

    // Helpfulness
    helpfulCount: {
      type: Number,
      default: 0,
    },
    unhelpfulCount: {
      type: Number,
      default: 0,
    },
    helpfulVotes: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        vote: {
          type: String,
          enum: ["helpful", "unhelpful"],
        },
        votedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Flags and reports
    isFlagged: {
      type: Boolean,
      default: false,
      index: true,
    },
    flagReason: String,
    flaggedBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        reason: String,
        flaggedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Featured review
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Edit history
    isEdited: {
      type: Boolean,
      default: false,
    },
    editHistory: [
      {
        previousRating: Number,
        previousComment: String,
        editedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Blockchain
    blockchainTxId: String,
    blockchainVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ========================================
// COMPOUND INDEXES
// ========================================

// Ensure one review per customer per order per product
reviewSchema.index(
  { customerId: 1, orderId: 1, productId: 1 },
  { unique: true }
);

reviewSchema.index({ productId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ vendorId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ verifiedPurchase: 1, status: 1 });
reviewSchema.index({ helpfulCount: -1 });

// ========================================
// VIRTUALS
// ========================================

// Helpfulness score
reviewSchema.virtual("helpfulnessScore").get(function () {
  const total = this.helpfulCount + this.unhelpfulCount;
  if (total === 0) return 0;
  return ((this.helpfulCount / total) * 100).toFixed(2);
});

// Review age in days
reviewSchema.virtual("ageInDays").get(function () {
  const diffTime = Math.abs(new Date() - this.createdAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// ========================================
// MIDDLEWARE
// ========================================

// Auto-generate review ID
reviewSchema.pre("save", async function (next) {
  if (!this.reviewId) {
    const count = await mongoose.model("Review").countDocuments();
    this.reviewId = `REV-${String(count + 1).padStart(8, "0")}`;
  }
  next();
});

// Update product rating when review is saved
reviewSchema.post("save", async function (doc) {
  if (doc.status === "approved") {
    await updateProductRating(doc.productId);
  }
});

// Update product rating when review is removed
reviewSchema.post("remove", async function (doc) {
  await updateProductRating(doc.productId);
});

// ========================================
// METHODS
// ========================================

// Add helpful vote
reviewSchema.methods.addHelpfulVote = function (userId, voteType) {
  // Remove existing vote if any
  this.helpfulVotes = this.helpfulVotes.filter(
    (vote) => vote.userId.toString() !== userId.toString()
  );

  // Add new vote
  this.helpfulVotes.push({
    userId,
    vote: voteType,
    votedAt: new Date(),
  });

  // Update counts
  this.helpfulCount = this.helpfulVotes.filter(
    (v) => v.vote === "helpful"
  ).length;
  this.unhelpfulCount = this.helpfulVotes.filter(
    (v) => v.vote === "unhelpful"
  ).length;

  return this.save();
};

// Add vendor response
reviewSchema.methods.addVendorResponse = function (comment, respondedBy) {
  this.vendorResponse = {
    comment,
    respondedBy,
    respondedAt: new Date(),
  };
  return this.save();
};

// Flag review
reviewSchema.methods.flag = function (userId, reason) {
  this.isFlagged = true;
  this.flaggedBy.push({
    userId,
    reason,
    flaggedAt: new Date(),
  });
  return this.save();
};

// Edit review
reviewSchema.methods.edit = function (newRating, newComment) {
  this.editHistory.push({
    previousRating: this.rating,
    previousComment: this.comment,
    editedAt: new Date(),
  });

  this.rating = newRating;
  this.comment = newComment;
  this.isEdited = true;

  return this.save();
};

// ========================================
// STATICS
// ========================================

// Get product rating statistics
reviewSchema.statics.getProductRatingStats = async function (productId) {
  const stats = await this.aggregate([
    {
      $match: {
        productId: mongoose.Types.ObjectId(productId),
        status: "approved",
      },
    },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: "$rating" },
        fiveStarCount: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
        fourStarCount: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
        threeStarCount: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
        twoStarCount: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
        oneStarCount: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
        verifiedCount: { $sum: { $cond: ["$verifiedPurchase", 1, 0] } },
        withImagesCount: {
          $sum: { $cond: [{ $gt: [{ $size: "$images" }, 0] }, 1, 0] },
        },
      },
    },
  ]);

  return (
    stats[0] || {
      totalReviews: 0,
      averageRating: 0,
      fiveStarCount: 0,
      fourStarCount: 0,
      threeStarCount: 0,
      twoStarCount: 0,
      oneStarCount: 0,
      verifiedCount: 0,
      withImagesCount: 0,
    }
  );
};

// Get vendor rating statistics
reviewSchema.statics.getVendorRatingStats = async function (
  vendorId,
  timeframe = "all"
) {
  const dateFilter = getDateFilter(timeframe);

  const matchStage = {
    vendorId: mongoose.Types.ObjectId(vendorId),
    status: "approved",
  };

  if (dateFilter) {
    matchStage.createdAt = dateFilter;
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: "$rating" },
        averageQualityRating: { $avg: "$qualityRating" },
        averageValueRating: { $avg: "$valueRating" },
        averageDeliveryRating: { $avg: "$deliveryRating" },
      },
    },
  ]);

  return (
    stats[0] || {
      totalReviews: 0,
      averageRating: 0,
      averageQualityRating: 0,
      averageValueRating: 0,
      averageDeliveryRating: 0,
    }
  );
};

// Get most helpful reviews
reviewSchema.statics.getMostHelpful = async function (productId, limit = 5) {
  return this.find({
    productId,
    status: "approved",
    helpfulCount: { $gt: 0 },
  })
    .sort({ helpfulCount: -1, createdAt: -1 })
    .limit(limit)
    .populate("customerId", "name")
    .exec();
};

// ========================================
// HELPER FUNCTIONS
// ========================================

// Update product rating
async function updateProductRating(productId) {
  const Product = mongoose.model("Product");
  const Review = mongoose.model("Review");

  const stats = await Review.getProductRatingStats(productId);

  await Product.findByIdAndUpdate(productId, {
    averageRating: parseFloat(stats.averageRating.toFixed(2)),
    totalReviews: stats.totalReviews,
  });
}

// Get date filter
function getDateFilter(timeframe) {
  const now = new Date();
  switch (timeframe) {
    case "week":
      return { $gte: new Date(now.setDate(now.getDate() - 7)) };
    case "month":
      return { $gte: new Date(now.setMonth(now.getMonth() - 1)) };
    case "year":
      return { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) };
    case "all":
    default:
      return null;
  }
}

export default mongoose.model("Review", reviewSchema);
