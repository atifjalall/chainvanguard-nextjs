import express from "express";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";
import supplierRatingService from "../services/supplier.rating.service.js";

const router = express.Router();

/**
 * POST /api/suppliers/:supplierId/rate
 * Submit or update rating for a supplier
 * Access: Vendor only
 *
 * Body:
 * - ratings: { quality, delivery, pricing, communication } (required)
 * - comment: Optional review comment
 */
router.post(
  "/:supplierId/rate",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const { supplierId } = req.params;
      const { ratings, comment } = req.body;

      // Validate ratings
      if (!ratings) {
        return res.status(400).json({
          success: false,
          message: "Ratings are required",
        });
      }

      const { quality, delivery, pricing, communication } = ratings;

      if (!quality || !delivery || !pricing || !communication) {
        return res.status(400).json({
          success: false,
          message:
            "All rating categories are required (quality, delivery, pricing, communication)",
        });
      }

      // Validate rating values (1-5)
      const ratingValues = [quality, delivery, pricing, communication];
      const allValid = ratingValues.every(
        (r) => r >= 1 && r <= 5 && Number.isInteger(r)
      );

      if (!allValid) {
        return res.status(400).json({
          success: false,
          message: "All ratings must be integers between 1 and 5",
        });
      }

      const result = await supplierRatingService.createOrUpdateRating(
        req.userId,
        supplierId,
        { ratings, comment }
      );

      res.status(result.rating.isEdited ? 200 : 201).json(result);
    } catch (error) {
      console.error("❌ Rate supplier error:", error);
      res.status(error.message.includes("not found") ? 404 : 400).json({
        success: false,
        message: error.message || "Failed to submit rating",
      });
    }
  }
);

/**
 * GET /api/suppliers/:supplierId/my-rating
 * Get vendor's rating for a specific supplier
 * Access: Vendor only
 */
router.get(
  "/:supplierId/my-rating",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const { supplierId } = req.params;

      const rating = await supplierRatingService.getVendorRating(
        req.userId,
        supplierId
      );

      if (!rating) {
        return res.json({
          success: true,
          rating: null,
          message: "You haven't rated this supplier yet",
        });
      }

      res.json({
        success: true,
        rating,
      });
    } catch (error) {
      console.error("❌ Get vendor rating error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve rating",
      });
    }
  }
);

/**
 * GET /api/suppliers/:supplierId/can-rate
 * Check if vendor can rate this supplier
 * Access: Vendor only
 */
router.get(
  "/:supplierId/can-rate",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const { supplierId } = req.params;

      const eligibility = await supplierRatingService.canVendorRateSupplier(
        req.userId,
        supplierId
      );

      res.json({
        success: true,
        ...eligibility,
      });
    } catch (error) {
      console.error("❌ Check eligibility error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to check eligibility",
      });
    }
  }
);

/**
 * GET /api/suppliers/my-ratings
 * Get all ratings submitted by this vendor
 * Access: Vendor only
 *
 * Query Params:
 * - page: Page number
 * - limit: Items per page
 * - sortBy: Sort field
 * - sortOrder: Sort order (asc/desc)
 */
router.get(
  "/my-ratings",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const filters = {
        page: req.query.page,
        limit: req.query.limit,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      };

      const result = await supplierRatingService.getVendorSubmittedRatings(
        req.userId,
        filters
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("❌ Get vendor ratings error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve ratings",
      });
    }
  }
);

/**
 * GET /api/suppliers/:supplierId/ratings
 * Get all ratings for a supplier
 * Access: Public
 *
 * Query Params:
 * - minRating: Filter by minimum rating
 * - withCommentsOnly: Show only ratings with comments
 * - page: Page number
 * - limit: Items per page
 * - sortBy: Sort field
 * - sortOrder: Sort order (asc/desc)
 */
router.get("/:supplierId/ratings", async (req, res) => {
  try {
    const { supplierId } = req.params;

    const filters = {
      minRating: req.query.minRating,
      withCommentsOnly: req.query.withCommentsOnly,
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
    };

    const result = await supplierRatingService.getSupplierRatings(
      supplierId,
      filters
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("❌ Get supplier ratings error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve ratings",
    });
  }
});

/**
 * GET /api/suppliers/:supplierId/rating-stats
 * Get rating statistics for a supplier
 * Access: Public
 */
router.get("/:supplierId/rating-stats", async (req, res) => {
  try {
    const { supplierId } = req.params;

    const result = await supplierRatingService.getRatingStats(supplierId);

    res.json({
      success: true,
      ...result,
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
 * POST /api/suppliers/ratings/:ratingId/respond
 * Add supplier response to a rating
 * Access: Supplier only
 *
 * Body:
 * - comment: Response comment (required)
 */
router.post(
  "/ratings/:ratingId/respond",
  authenticate,
  authorizeRoles("supplier"),
  async (req, res) => {
    try {
      const { ratingId } = req.params;
      const { comment } = req.body;

      if (!comment) {
        return res.status(400).json({
          success: false,
          message: "Response comment is required",
        });
      }

      const result = await supplierRatingService.addSupplierResponse(
        ratingId,
        req.userId,
        comment
      );

      res.json(result);
    } catch (error) {
      console.error("❌ Add supplier response error:", error);
      res.status(error.message.includes("not found") ? 404 : 400).json({
        success: false,
        message: error.message || "Failed to add response",
      });
    }
  }
);

/**
 * POST /api/suppliers/ratings/:ratingId/vote
 * Vote if rating was helpful or not
 * Access: Authenticated users
 *
 * Body:
 * - vote: "helpful" or "unhelpful" (required)
 */
router.post("/ratings/:ratingId/vote", authenticate, async (req, res) => {
  try {
    const { ratingId } = req.params;
    const { vote } = req.body;

    if (!vote || !["helpful", "unhelpful"].includes(vote)) {
      return res.status(400).json({
        success: false,
        message: 'Vote must be "helpful" or "unhelpful"',
      });
    }

    const result = await supplierRatingService.voteHelpful(
      ratingId,
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
 * POST /api/suppliers/ratings/:ratingId/flag
 * Flag rating as inappropriate
 * Access: Authenticated users
 *
 * Body:
 * - reason: Reason for flagging (required)
 */
router.post("/ratings/:ratingId/flag", authenticate, async (req, res) => {
  try {
    const { ratingId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Reason is required",
      });
    }

    const result = await supplierRatingService.flagRating(
      ratingId,
      req.userId,
      reason
    );

    res.json(result);
  } catch (error) {
    console.error("❌ Flag rating error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to flag rating",
    });
  }
});

/**
 * DELETE /api/suppliers/ratings/:ratingId
 * Delete a rating (admin only)
 * Access: Admin/Expert only
 */
router.delete(
  "/ratings/:ratingId",
  authenticate,
  authorizeRoles("expert"),
  async (req, res) => {
    try {
      const { ratingId } = req.params;

      const result = await supplierRatingService.deleteRating(ratingId);

      res.json(result);
    } catch (error) {
      console.error("❌ Delete rating error:", error);
      res.status(error.message.includes("not found") ? 404 : 500).json({
        success: false,
        message: error.message || "Failed to delete rating",
      });
    }
  }
);

export default router;
