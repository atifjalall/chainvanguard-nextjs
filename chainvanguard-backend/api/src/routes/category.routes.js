import { Router } from "express";
import {
  getAllCategories,
  getSubcategoriesByCategory,
  getSizesByCategory,
  getCategoriesForAPI,
  getAllSizes,
  getAllSubcategories,
  PRODUCT_TYPES,
  FIT_TYPES,
  PATTERNS,
  NECKLINES,
  SLEEVE_LENGTHS,
  SEASONS,
  CERTIFICATION_TYPES,
  QUALITY_GRADES,
  COMMON_MATERIALS,
  COMMON_COLORS,
} from "../config/categories.js";

const router = Router();

// ========================================
// GET ALL CATEGORIES WITH METADATA
// ========================================
router.get("/", (req, res) => {
  try {
    const data = getCategoriesForAPI();
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
});

// ========================================
// GET CATEGORIES ONLY (Simple list)
// ========================================
router.get("/list", (req, res) => {
  try {
    const categories = getAllCategories();
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching category list:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch category list",
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
      data: subcategories,
    });
  } catch (error) {
    console.error("Error fetching subcategories:", error);
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
      data: sizes,
    });
  } catch (error) {
    console.error("Error fetching sizes:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sizes",
      error: error.message,
    });
  }
});

// ========================================
// GET ALL SIZES (All categories combined)
// ========================================
router.get("/sizes/all", (req, res) => {
  try {
    const sizes = getAllSizes();
    res.json({
      success: true,
      data: sizes,
    });
  } catch (error) {
    console.error("Error fetching all sizes:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sizes",
      error: error.message,
    });
  }
});

// ========================================
// GET ALL SUBCATEGORIES (All categories combined)
// ========================================
router.get("/subcategories/all", (req, res) => {
  try {
    const subcategories = getAllSubcategories();
    res.json({
      success: true,
      data: subcategories,
    });
  } catch (error) {
    console.error("Error fetching all subcategories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch subcategories",
      error: error.message,
    });
  }
});

// ========================================
// GET PRODUCT TYPES
// ========================================
router.get("/types/product", (req, res) => {
  try {
    res.json({
      success: true,
      data: PRODUCT_TYPES,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch product types",
      error: error.message,
    });
  }
});

// ========================================
// GET FIT TYPES
// ========================================
router.get("/types/fit", (req, res) => {
  try {
    res.json({
      success: true,
      data: FIT_TYPES,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch fit types",
      error: error.message,
    });
  }
});

// ========================================
// GET PATTERNS
// ========================================
router.get("/options/patterns", (req, res) => {
  try {
    res.json({
      success: true,
      data: PATTERNS,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch patterns",
      error: error.message,
    });
  }
});

// ========================================
// GET MATERIALS
// ========================================
router.get("/options/materials", (req, res) => {
  try {
    res.json({
      success: true,
      data: COMMON_MATERIALS.map((material) => ({
        value: material,
        label: material,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch materials",
      error: error.message,
    });
  }
});

// ========================================
// GET COLORS
// ========================================
router.get("/options/colors", (req, res) => {
  try {
    res.json({
      success: true,
      data: COMMON_COLORS.map((color) => ({
        value: color,
        label: color,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch colors",
      error: error.message,
    });
  }
});

export default router;
