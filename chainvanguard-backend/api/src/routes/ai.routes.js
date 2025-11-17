import express from "express";
import geminiService from "../services/gemini.service.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";
import logger from "../utils/logger.js";

const router = express.Router();

// ========================================
// GENERATE INVENTORY DESCRIPTION
// POST /api/ai/generate-inventory-description
// ========================================
router.post(
  "/generate-inventory-description",
  authenticate,
  authorizeRoles("vendor", "supplier"),
  async (req, res) => {
    try {
      const {
        name,
        category,
        subcategory,
        specifications,
        unit,
        manufacturer,
        origin,
      } = req.body;

      // Validation
      if (!name || !category) {
        return res.status(400).json({
          success: false,
          message: "Name and category are required",
        });
      }

      const inventoryData = {
        name,
        category,
        subcategory,
        specifications,
        unit,
        manufacturer,
        origin,
      };

      const result =
        await geminiService.generateInventoryDescription(inventoryData);

      res.json({
        success: true,
        data: result,
        message: "Description generated successfully",
      });
    } catch (error) {
      logger.error("Error in POST /ai/generate-inventory-description:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to generate description",
      });
    }
  }
);

// ========================================
// GENERATE PRODUCT DESCRIPTION
// POST /api/ai/generate-product-description
// ========================================
router.post(
  "/generate-product-description",
  authenticate,
  authorizeRoles("vendor"),
  async (req, res) => {
    try {
      const { name, category, materials, dimensions, features, color, weight } =
        req.body;

      // Validation
      if (!name || !category) {
        return res.status(400).json({
          success: false,
          message: "Name and category are required",
        });
      }

      const productData = {
        name,
        category,
        materials,
        dimensions,
        features,
        color,
        weight,
      };

      const result =
        await geminiService.generateProductDescription(productData);

      res.json({
        success: true,
        data: result,
        message: "Product description generated successfully",
      });
    } catch (error) {
      logger.error("Error in POST /ai/generate-product-description:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to generate product description",
      });
    }
  }
);

// ========================================
// HEALTH CHECK
// GET /api/ai/health
// ========================================
router.get("/health", authenticate, async (req, res) => {
  try {
    const hasApiKey = !!process.env.GEMINI_API_KEY;

    res.json({
      success: true,
      data: {
        service: "Gemini AI",
        configured: hasApiKey,
        status: hasApiKey ? "ready" : "not configured",
      },
    });
  } catch (error) {
    logger.error("Error in GET /ai/health:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check AI service status",
    });
  }
});

export default router;
