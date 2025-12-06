import express from "express";
import reviewService from "../services/review.service.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * ========================================
 * REVIEW ROUTES
 * ========================================
 * Manage product reviews and ratings
 */

// ========================================
// PUBLIC ENDPOINTS (No auth required)
// ========================================

/**
 * GET /api/reviews/product/:productId
 * Get product reviews
 * Access: Public
 *
 * Query Params:
 * - rating: Filter by rating (1-5)
 * - verifiedOnly: Show only verified purchases (true/false)
 * - withImagesOnly: Show only reviews with images (true/false)
 * - page: Page number
 * - limit: Items per page
 * - sortBy: Sort field (createdAt, helpfulCount, rating)
 * - sortOrder: Sort order (asc/desc)
 */
router.get("/product/:productId", async (req, res) => {
  try {
    // SAFE MODE: Reviews unavailable (not backed up)
    if (req.safeMode) {
      return res.json({
        success: true,
        safeMode: true,
        reviews: [],
        pagination: {
          page: parseInt(req.query.page) || 1,
          limit: parseInt(req.query.limit) || 10,
          total: 0,
          pages: 0
        },
        averageRating: 0,
        totalReviews: 0,
        message: "Product reviews temporarily unavailable during maintenance",
        warning: "Review data will be available when maintenance completes."
      });
    }

    const filters = {
      rating: req.query.rating,
      verifiedOnly: req.query.verifiedOnly,
      withImagesOnly: req.query.withImagesOnly,
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sortBy || "createdAt",
      sortOrder: req.query.sortOrder || "desc",
    };

    const result = await reviewService.getProductReviews(
      req.params.productId,
      filters
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("❌ Get product reviews error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve reviews",
    });
  }
});

/**
 * GET /api/reviews/product/:productId/stats
 * Get product rating statistics
 * Access: Public
 */
router.get("/product/:productId/stats", async (req, res) => {
  try {
    const stats = await reviewService.getProductRatingStats(
      req.params.productId
    );

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("❌ Get rating stats error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve statistics",
    });
  }
});

/**
 * GET /api/reviews/product/:productId/helpful
 * Get most helpful reviews for product
 * Access: Public
 *
 * Query Params:
 * - limit: Number of reviews (default: 5)
 */
router.get("/product/:productId/helpful", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 5, 20);

    const reviews = await reviewService.getMostHelpfulReviews(
      req.params.productId,
      limit
    );

    res.json({
      success: true,
      reviews,
    });
  } catch (error) {
    console.error("❌ Get helpful reviews error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve reviews",
    });
  }
});

/**
 * GET /api/reviews/:id
 * Get review by ID
 * Access: Public
 */
router.get("/:id", async (req, res) => {
  try {
    const review = await reviewService.getReviewById(req.params.id);

    res.json({
      success: true,
      review,
    });
  } catch (error) {
    console.error("❌ Get review error:", error);

    if (error.message === "Review not found") {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve review",
    });
  }
});

// ========================================
// CUSTOMER ENDPOINTS
// ========================================

/**
 * POST /api/reviews
 * Create a new review
 * Access: Customer only
 *
 * Body:
 * - productId: Product ID (required)
 * - orderId: Order ID (required)
 * - rating: Rating 1-5 (required)
 * - title: Review title (optional)
 * - comment: Review text (required, min 10 chars)
 * - qualityRating: Quality rating 1-5 (optional)
 * - valueRating: Value rating 1-5 (optional)
 * - deliveryRating: Delivery rating 1-5 (optional)
 * - images: Array of image URLs (optional)
 * - videos: Array of video objects (optional)
 */
router.post("/", authenticate, authorizeRoles("customer"), async (req, res) => {
  try {
    const { productId, orderId, rating, comment } = req.body;

    // Validate required fields
    if (!productId || !orderId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "Product ID, Order ID, rating, and comment are required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    if (comment.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Comment must be at least 10 characters long",
      });
    }

    const result = await reviewService.createReview(req.userId, req.body);

    res.status(201).json(result);
  } catch (error) {
    console.error("❌ Create review error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create review",
    });
  }
});

/**
 * GET /api/reviews/customer/my-reviews
 * Get customer's reviews
 * Access: Customer only
 *
 * Query Params:
 * - page: Page number
 * - limit: Items per page
 * - sortBy: Sort field
 * - sortOrder: Sort order (asc/desc)
 */
router.get(
  "/customer/my-reviews",
  authenticate,
  authorizeRoles("customer"),
  async (req, res) => {
    try {
      const filters = {
        page: req.query.page,
        limit: req.query.limit,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      };

      const result = await reviewService.getCustomerReviews(
        req.userId,
        filters
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("❌ Get customer reviews error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve reviews",
      });
    }
  }
);

/**
 * GET /api/reviews/customer/can-review/:productId
 * Check if customer can review product
 * Access: Customer only
 */
router.get(
  "/customer/can-review/:productId",
  authenticate,
  authorizeRoles("customer"),
  async (req, res) => {
    try {
      const result = await reviewService.canReviewProduct(
        req.userId,
        req.params.productId
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("❌ Check review eligibility error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to check eligibility",
      });
    }
  }
);

/**
 * PATCH /api/reviews/:id
 * Edit review
 * Access: Customer (own reviews only)
 *
 * Body:
 * - rating: New rating (optional)
 * - comment: New comment (optional)
 * - title: New title (optional)
 * - images: New images (optional)
 */
router.patch(
  "/:id",
  authenticate,
  authorizeRoles("customer"),
  async (req, res) => {
    try {
      const result = await reviewService.editReview(
        req.params.id,
        req.userId,
        req.body
      );

      res.json(result);
    } catch (error) {
      console.error("❌ Edit review error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to edit review",
      });
    }
  }
);

/**
 * DELETE /api/reviews/:id
 * Delete review
 * Access: Customer (own reviews only)
 */
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("customer"),
  async (req, res) => {
    try {
      const result = await reviewService.deleteReview(
        req.params.id,
        req.userId
      );

      res.json(result);
    } catch (error) {
      console.error("❌ Delete review error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete review",
      });
    }
  }
);

/**
 * POST /api/reviews/:id/vote
 * Vote review as helpful or unhelpful
 * Access: Authenticated users
 *
 * Body:
 * - vote: 'helpful' or 'unhelpful' (required)
 */
router.post("/:id/vote", authenticate, async (req, res) => {
  try {
    const { vote } = req.body;

    if (!vote || !["helpful", "unhelpful"].includes(vote)) {
      return res.status(400).json({
        success: false,
        message: 'Vote must be "helpful" or "unhelpful"',
      });
    }

    const result = await reviewService.voteHelpful(
      req.params.id,
      req.userId,
      vote
    );

    res.json(result);
  } catch (error) {
    console.error("❌ Vote helpful error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to vote",
    });
  }
});

/**
 * POST /api/reviews/:id/flag
 * Flag review as inappropriate
 * Access: Authenticated users
 *
 * Body:
 * - reason: Reason for flagging (required)
 */
router.post("/:id/flag", authenticate, async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Reason is required",
      });
    }

    const result = await reviewService.flagReview(
      req.params.id,
      req.userId,
      reason
    );

    res.json(result);
  } catch (error) {
    console.error("❌ Flag review error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to flag review",
    });
  }
});

// ========================================
// VENDOR ENDPOINTS
// ========================================

/**
 * GET /api/reviews/vendor/my-reviews
 * Get vendor's product reviews
 * Access: Vendor only
 *
 * Query Params:
 * - rating: Filter by rating
 * - page: Page number
 * - limit: Items per page
 * - sortBy: Sort field
 * - sortOrder: Sort order (asc/desc)
 */
router.get(
  "/vendor/my-reviews",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const filters = {
        rating: req.query.rating,
        page: req.query.page,
        limit: req.query.limit,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      };

      const result = await reviewService.getVendorReviews(req.userId, filters);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("❌ Get vendor reviews error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve reviews",
      });
    }
  }
);

/**
 * GET /api/reviews/vendor/stats
 * Get vendor rating statistics
 * Access: Vendor only
 *
 * Query Params:
 * - timeframe: 'week', 'month', 'year', 'all' (default: 'all')
 */
router.get(
  "/vendor/stats",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const timeframe = req.query.timeframe || "all";

      const stats = await reviewService.getVendorRatingStats(
        req.userId,
        timeframe
      );

      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      console.error("❌ Get vendor stats error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve statistics",
      });
    }
  }
);

/**
 * POST /api/reviews/:id/respond
 * Add vendor response to review
 * Access: Vendor only
 *
 * Body:
 * - comment: Response text (required)
 */
router.post(
  "/:id/respond",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const { comment } = req.body;

      if (!comment || comment.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: "Response must be at least 10 characters long",
        });
      }

      const result = await reviewService.addVendorResponse(
        req.params.id,
        req.userId,
        comment
      );

      res.json(result);
    } catch (error) {
      console.error("❌ Add vendor response error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to add response",
      });
    }
  }
);

export default router;
