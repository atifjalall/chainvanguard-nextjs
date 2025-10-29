import express from "express";
import {
  getAllCategories,
  getSubcategoriesByCategory,
  getSizesByCategory,
  getProductTypesByCategory,
  getFitTypesByCategory,
  getPatternsByCategory,
  getFabricTypesByCategory,
  getCategoriesForAPI,
  NECKLINES,
  SLEEVE_LENGTHS,
  SEASONS,
  CERTIFICATION_TYPES,
  QUALITY_GRADES,
  COMMON_MATERIALS,
  COMMON_COLORS,
} from "../config/categories.js";

const router = express.Router();

// ========================================
// GET ALL CATEGORIES WITH METADATA
// ========================================
router.get("/", (req, res) => {
  try {
    const categoriesData = getCategoriesForAPI();

    res.json({
      success: true,
      ...categoriesData,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
});

// ========================================
// GET CATEGORY-SPECIFIC OPTIONS
// ========================================
router.get("/:category/options", (req, res) => {
  try {
    const { category } = req.params;

    // Validate category
    const validCategories = ["Men", "Women", "Kids", "Unisex"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${validCategories.join(", ")}`,
      });
    }

    const options = {
      subcategories: getSubcategoriesByCategory(category),
      sizes: getSizesByCategory(category),
      productTypes: getProductTypesByCategory(category),
      fitTypes: getFitTypesByCategory(category),
      patterns: getPatternsByCategory(category),
      fabricTypes: getFabricTypesByCategory(category),
      necklines: NECKLINES,
      sleeveLengths: SLEEVE_LENGTHS,
      seasons: SEASONS,
      certificationTypes: CERTIFICATION_TYPES,
      qualityGrades: QUALITY_GRADES,
      commonMaterials: COMMON_MATERIALS,
      commonColors: COMMON_COLORS,
    };

    res.json({
      success: true,
      category,
      ...options,
    });
  } catch (error) {
    console.error("Get category options error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch category options",
      error: error.message,
    });
  }
});

// ========================================
// GET SUBCATEGORIES BY CATEGORY
// ========================================
router.get("/:category/subcategories", (req, res) => {
  try {
    const { category } = req.params;
    const subcategories = getSubcategoriesByCategory(category);

    if (subcategories.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Category '${category}' not found`,
      });
    }

    res.json({
      success: true,
      category,
      subcategories,
    });
  } catch (error) {
    console.error("Get subcategories error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch subcategories",
      error: error.message,
    });
  }
});

// ========================================
// GET SIZES BY CATEGORY
// ========================================
router.get("/:category/sizes", (req, res) => {
  try {
    const { category } = req.params;
    const sizes = getSizesByCategory(category);

    if (sizes.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Category '${category}' not found`,
      });
    }

    res.json({
      success: true,
      category,
      sizes,
    });
  } catch (error) {
    console.error("Get sizes error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sizes",
      error: error.message,
    });
  }
});

// ========================================
// GET PRODUCT TYPES BY CATEGORY
// ========================================
router.get("/:category/product-types", (req, res) => {
  try {
    const { category } = req.params;
    const productTypes = getProductTypesByCategory(category);

    res.json({
      success: true,
      category,
      productTypes,
    });
  } catch (error) {
    console.error("Get product types error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product types",
      error: error.message,
    });
  }
});

// ========================================
// GET FIT TYPES BY CATEGORY
// ========================================
router.get("/:category/fit-types", (req, res) => {
  try {
    const { category } = req.params;
    const fitTypes = getFitTypesByCategory(category);

    res.json({
      success: true,
      category,
      fitTypes,
    });
  } catch (error) {
    console.error("Get fit types error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch fit types",
      error: error.message,
    });
  }
});

// ========================================
// GET PATTERNS BY CATEGORY
// ========================================
router.get("/:category/patterns", (req, res) => {
  try {
    const { category } = req.params;
    const patterns = getPatternsByCategory(category);

    res.json({
      success: true,
      category,
      patterns,
    });
  } catch (error) {
    console.error("Get patterns error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patterns",
      error: error.message,
    });
  }
});

// ========================================
// GET FABRIC TYPES BY CATEGORY
// ========================================
router.get("/:category/fabric-types", (req, res) => {
  try {
    const { category } = req.params;
    const fabricTypes = getFabricTypesByCategory(category);

    res.json({
      success: true,
      category,
      fabricTypes,
    });
  } catch (error) {
    console.error("Get fabric types error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch fabric types",
      error: error.message,
    });
  }
});

export default router;
