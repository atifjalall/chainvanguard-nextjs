import mongoose from "mongoose";

/**
 * SUPPLIER RATING MODEL
 * Allows vendors to rate suppliers based on their experience
 * Similar to product reviews but for B2B supplier relationships
 */

const supplierRatingSchema = new mongoose.Schema(
  {
    // Rating identification
    ratingId: {
      type: String,
      unique: true,
      required: true,
    },

    // Vendor who is rating (buyer)
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    vendorName: {
      type: String,
      required: true,
    },

    // Supplier being rated (seller)
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    supplierName: {
      type: String,
      required: true,
    },

    // Rating breakdown (1-5 stars each)
    ratings: {
      quality: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },
      delivery: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },
      pricing: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },
      communication: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },
    },

    // Overall rating (calculated average)
    overallRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    // Review content
    comment: {
      type: String,
      maxlength: 1000,
      default: "",
    },

    // Verification - count of completed orders with this supplier
    completedOrdersCount: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },

    // Sample order references (up to 3 most recent)
    sampleOrders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],

    // Edit tracking
    isEdited: {
      type: Boolean,
      default: false,
    },
    editHistory: [
      {
        previousRatings: {
          quality: Number,
          delivery: Number,
          pricing: Number,
          communication: Number,
        },
        previousOverallRating: Number,
        previousComment: String,
        editedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    lastEditedAt: {
      type: Date,
    },

    // Supplier response
    supplierResponse: {
      comment: {
        type: String,
        maxlength: 1000,
      },
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      respondedAt: Date,
    },

    // Moderation
    status: {
      type: String,
      enum: ["approved", "pending", "flagged", "removed"],
      default: "approved",
      index: true,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
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

    // Helpful votes
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
    helpfulCount: {
      type: Number,
      default: 0,
    },
    unhelpfulCount: {
      type: Number,
      default: 0,
    },

    // Blockchain tracking
    blockchainTxId: {
      type: String,
      default: "",
    },
    blockchainVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

supplierRatingSchema.index({ vendorId: 1, supplierId: 1 }); // One rating per vendor-supplier pair
supplierRatingSchema.index({ supplierId: 1, status: 1, createdAt: -1 }); // For fetching supplier ratings
supplierRatingSchema.index({ overallRating: -1 }); // For sorting by rating
supplierRatingSchema.index({ createdAt: -1 }); // For recent ratings

// One vendor can only have one rating per supplier (can update it though)
supplierRatingSchema.index({ vendorId: 1, supplierId: 1 }, { unique: true });

// Generate rating ID before saving
supplierRatingSchema.pre("save", function (next) {
  if (!this.ratingId) {
    this.ratingId = `SR-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;
  }
  next();
});

// Calculate overall rating before saving
supplierRatingSchema.pre("save", function (next) {
  const { quality, delivery, pricing, communication } = this.ratings;
  this.overallRating = (
    (quality + delivery + pricing + communication) /
    4
  ).toFixed(1);
  next();
});

// Update helpful/unhelpful counts
supplierRatingSchema.pre("save", function (next) {
  this.helpfulCount = this.helpfulVotes.filter(
    (v) => v.vote === "helpful"
  ).length;
  this.unhelpfulCount = this.helpfulVotes.filter(
    (v) => v.vote === "unhelpful"
  ).length;
  next();
});

/**
 * Instance Methods
 */

supplierRatingSchema.methods.updateRating = function (newRatings, newComment) {
  // Save to edit history
  this.editHistory.push({
    previousRatings: { ...this.ratings },
    previousOverallRating: this.overallRating,
    previousComment: this.comment,
    editedAt: new Date(),
  });

  // Update ratings
  this.ratings = newRatings;
  this.comment = newComment || this.comment;
  this.isEdited = true;
  this.lastEditedAt = new Date();

  return this.save();
};

// Add supplier response
supplierRatingSchema.methods.addSupplierResponse = function (
  comment,
  respondedBy
) {
  this.supplierResponse = {
    comment,
    respondedBy,
    respondedAt: new Date(),
  };
  return this.save();
};

// Vote helpful/unhelpful
supplierRatingSchema.methods.addVote = function (userId, vote) {
  // Remove existing vote from this user
  this.helpfulVotes = this.helpfulVotes.filter(
    (v) => v.userId.toString() !== userId.toString()
  );

  // Add new vote
  this.helpfulVotes.push({
    userId,
    vote,
    votedAt: new Date(),
  });

  return this.save();
};

// Flag rating
supplierRatingSchema.methods.flag = function (userId, reason) {
  this.isFlagged = true;
  this.flaggedBy.push({
    userId,
    reason,
    flaggedAt: new Date(),
  });
  return this.save();
};

/**
 * Static Methods
 */

supplierRatingSchema.statics.getSupplierRatingStats = async function (
  supplierId
) {
  const stats = await this.aggregate([
    {
      $match: {
        supplierId: mongoose.Types.ObjectId(supplierId),
        status: "approved",
      },
    },
    {
      $group: {
        _id: null,
        totalRatings: { $sum: 1 },
        averageOverall: { $avg: "$overallRating" },
        averageQuality: { $avg: "$ratings.quality" },
        averageDelivery: { $avg: "$ratings.delivery" },
        averagePricing: { $avg: "$ratings.pricing" },
        averageCommunication: { $avg: "$ratings.communication" },
        fiveStarCount: {
          $sum: { $cond: [{ $gte: ["$overallRating", 4.5] }, 1, 0] },
        },
        fourStarCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gte: ["$overallRating", 3.5] },
                  { $lt: ["$overallRating", 4.5] },
                ],
              },
              1,
              0,
            ],
          },
        },
        threeStarCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gte: ["$overallRating", 2.5] },
                  { $lt: ["$overallRating", 3.5] },
                ],
              },
              1,
              0,
            ],
          },
        },
        twoStarCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gte: ["$overallRating", 1.5] },
                  { $lt: ["$overallRating", 2.5] },
                ],
              },
              1,
              0,
            ],
          },
        },
        oneStarCount: {
          $sum: { $cond: [{ $lt: ["$overallRating", 1.5] }, 1, 0] },
        },
        withCommentsCount: {
          $sum: { $cond: [{ $ne: ["$comment", ""] }, 1, 0] },
        },
      },
    },
  ]);

  return (
    stats[0] || {
      totalRatings: 0,
      averageOverall: 0,
      averageQuality: 0,
      averageDelivery: 0,
      averagePricing: 0,
      averageCommunication: 0,
      fiveStarCount: 0,
      fourStarCount: 0,
      threeStarCount: 0,
      twoStarCount: 0,
      oneStarCount: 0,
      withCommentsCount: 0,
    }
  );
};

// Check if vendor has existing rating for supplier
supplierRatingSchema.statics.hasRating = async function (vendorId, supplierId) {
  const rating = await this.findOne({ vendorId, supplierId });
  return !!rating;
};

// Get vendor's rating for a supplier
supplierRatingSchema.statics.getVendorRating = async function (
  vendorId,
  supplierId
) {
  return this.findOne({ vendorId, supplierId })
    .populate("vendorId", "name companyName")
    .populate("supplierId", "name companyName")
    .populate("supplierResponse.respondedBy", "name");
};

export default mongoose.model("SupplierRating", supplierRatingSchema);
