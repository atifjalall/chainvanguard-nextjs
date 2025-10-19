// ========================================
// APPAREL CATEGORIES CONFIGURATION
// ========================================

export const APPAREL_CATEGORIES = {
  Men: {
    label: "Men",
    subcategories: [
      "T-Shirts",
      "Shirts",
      "Hoodies",
      "Sweaters",
      "Jackets",
      "Coats",
      "Jeans",
      "Trousers",
      "Shorts",
      "Suits",
      "Activewear",
      "Sleepwear",
      "Underwear",
    ],
    sizes: ["S", "M", "L", "XL", "XXL", "XXXL"],
    description: "Men's clothing and apparel",
  },
  Women: {
    label: "Women",
    subcategories: [
      "T-Shirts",
      "Blouses",
      "Shirts",
      "Dresses",
      "Skirts",
      "Jeans",
      "Trousers",
      "Shorts",
      "Jackets",
      "Coats",
      "Sweaters",
      "Hoodies",
      "Suits",
      "Jumpsuits",
      "Activewear",
      "Sleepwear",
      "Swimwear",
      "Underwear",
    ],
    sizes: ["XXS", "XS", "S", "M", "L", "XL", "XXL"],
    description: "Women's clothing and apparel",
  },
  Kids: {
    label: "Kids",
    subcategories: [
      "T-Shirts",
      "Shirts",
      "Jeans",
      "Trousers",
      "Shorts",
      "Dresses",
      "Jackets",
      "Hoodies",
      "Activewear",
      "Sleepwear",
      "Underwear",
    ],
    sizes: ["2T", "3T", "4T", "5", "6", "7", "8", "10", "12", "14"],
    description: "Kids' clothing and apparel",
  },
  Unisex: {
    label: "Unisex",
    subcategories: [
      "T-Shirts",
      "Hoodies",
      "Sweaters",
      "Jackets",
      "Activewear",
      "Sleepwear",
    ],
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    description: "Unisex clothing and apparel",
  },
};

// ========================================
// PRODUCT TYPES
// ========================================
export const PRODUCT_TYPES = [
  { value: "Casual", label: "Casual" },
  { value: "Formal", label: "Formal" },
  { value: "Sports", label: "Sports" },
  { value: "Party", label: "Party" },
  { value: "Traditional", label: "Traditional" },
  { value: "Workwear", label: "Workwear" },
];

// ========================================
// FIT TYPES
// ========================================
export const FIT_TYPES = [
  { value: "Slim Fit", label: "Slim Fit" },
  { value: "Regular Fit", label: "Regular Fit" },
  { value: "Loose Fit", label: "Loose Fit" },
  { value: "Oversized", label: "Oversized" },
];

// ========================================
// PATTERNS
// ========================================
export const PATTERNS = [
  { value: "Solid", label: "Solid" },
  { value: "Striped", label: "Striped" },
  { value: "Checked", label: "Checked" },
  { value: "Printed", label: "Printed" },
  { value: "Embroidered", label: "Embroidered" },
  { value: "Other", label: "Other" },
];

// ========================================
// NECKLINES
// ========================================
export const NECKLINES = [
  { value: "Crew Neck", label: "Crew Neck" },
  { value: "V-Neck", label: "V-Neck" },
  { value: "Round Neck", label: "Round Neck" },
  { value: "Collar", label: "Collar" },
  { value: "Off-Shoulder", label: "Off-Shoulder" },
  { value: "Boat Neck", label: "Boat Neck" },
  { value: "Turtleneck", label: "Turtleneck" },
  { value: "Other", label: "Other" },
];

// ========================================
// SLEEVE LENGTHS
// ========================================
export const SLEEVE_LENGTHS = [
  { value: "Sleeveless", label: "Sleeveless" },
  { value: "Short Sleeve", label: "Short Sleeve" },
  { value: "3/4 Sleeve", label: "3/4 Sleeve" },
  { value: "Long Sleeve", label: "Long Sleeve" },
];

// ========================================
// SEASONS
// ========================================
export const SEASONS = [
  { value: "Spring", label: "Spring" },
  { value: "Summer", label: "Summer" },
  { value: "Autumn", label: "Autumn" },
  { value: "Winter", label: "Winter" },
  { value: "All Season", label: "All Season" },
];

// ========================================
// CERTIFICATION TYPES
// ========================================
export const CERTIFICATION_TYPES = [
  { value: "GOTS", label: "GOTS (Global Organic Textile Standard)" },
  { value: "Fair Trade", label: "Fair Trade" },
  { value: "OEKO-TEX", label: "OEKO-TEX" },
  { value: "ISO", label: "ISO" },
  { value: "Origin", label: "Origin Certificate" },
  { value: "Quality", label: "Quality Certificate" },
  { value: "Compliance", label: "Compliance Certificate" },
  { value: "Other", label: "Other" },
];

// ========================================
// QUALITY GRADES
// ========================================
export const QUALITY_GRADES = [
  { value: "Premium", label: "Premium" },
  { value: "A", label: "Grade A" },
  { value: "B", label: "Grade B" },
  { value: "C", label: "Grade C" },
  { value: "Standard", label: "Standard" },
];

// ========================================
// COMMON MATERIALS
// ========================================
export const COMMON_MATERIALS = [
  "100% Cotton",
  "100% Organic Cotton",
  "Cotton Blend",
  "Polyester",
  "Cotton-Polyester Blend",
  "Wool",
  "Linen",
  "Silk",
  "Denim",
  "Leather",
  "Synthetic",
  "Nylon",
  "Rayon",
  "Viscose",
  "Spandex",
  "Elastane",
];

// ========================================
// COMMON COLORS
// ========================================
export const COMMON_COLORS = [
  "White",
  "Black",
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Orange",
  "Purple",
  "Pink",
  "Brown",
  "Gray",
  "Navy",
  "Beige",
  "Maroon",
  "Olive",
  "Cream",
  "Multicolor",
];

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Get all categories with their subcategories
 */
export const getAllCategories = () => {
  return Object.keys(APPAREL_CATEGORIES).map((key) => ({
    value: key,
    label: APPAREL_CATEGORIES[key].label,
    subcategories: APPAREL_CATEGORIES[key].subcategories,
    sizes: APPAREL_CATEGORIES[key].sizes,
    description: APPAREL_CATEGORIES[key].description,
  }));
};

/**
 * Get subcategories for a specific category
 */
export const getSubcategoriesByCategory = (category) => {
  if (!APPAREL_CATEGORIES[category]) {
    return [];
  }
  return APPAREL_CATEGORIES[category].subcategories.map((subcat) => ({
    value: subcat,
    label: subcat,
  }));
};

/**
 * Get sizes for a specific category
 */
export const getSizesByCategory = (category) => {
  if (!APPAREL_CATEGORIES[category]) {
    return [];
  }
  return APPAREL_CATEGORIES[category].sizes.map((size) => ({
    value: size,
    label: size,
  }));
};

/**
 * Validate if a subcategory belongs to a category
 */
export const validateCategorySubcategory = (category, subcategory) => {
  if (!APPAREL_CATEGORIES[category]) {
    return false;
  }
  return APPAREL_CATEGORIES[category].subcategories.includes(subcategory);
};

/**
 * Validate if a size belongs to a category
 */
export const validateCategorySize = (category, size) => {
  if (!APPAREL_CATEGORIES[category]) {
    return false;
  }
  return APPAREL_CATEGORIES[category].sizes.includes(size);
};

/**
 * Get formatted categories for API response
 */
export const getCategoriesForAPI = () => {
  return {
    categories: getAllCategories(),
    productTypes: PRODUCT_TYPES,
    fitTypes: FIT_TYPES,
    patterns: PATTERNS,
    necklines: NECKLINES,
    sleeveLengths: SLEEVE_LENGTHS,
    seasons: SEASONS,
    certificationTypes: CERTIFICATION_TYPES,
    qualityGrades: QUALITY_GRADES,
    commonMaterials: COMMON_MATERIALS,
    commonColors: COMMON_COLORS,
  };
};

/**
 * Get all available sizes across all categories
 */
export const getAllSizes = () => {
  const allSizes = new Set();
  Object.values(APPAREL_CATEGORIES).forEach((cat) => {
    cat.sizes.forEach((size) => allSizes.add(size));
  });
  return Array.from(allSizes).map((size) => ({
    value: size,
    label: size,
  }));
};

/**
 * Get all available subcategories across all categories
 */
export const getAllSubcategories = () => {
  const allSubcats = new Set();
  Object.values(APPAREL_CATEGORIES).forEach((cat) => {
    cat.subcategories.forEach((subcat) => allSubcats.add(subcat));
  });
  return Array.from(allSubcats)
    .sort()
    .map((subcat) => ({
      value: subcat,
      label: subcat,
    }));
};

// ========================================
// EXPORTS
// ========================================
export default {
  APPAREL_CATEGORIES,
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
  getAllCategories,
  getSubcategoriesByCategory,
  getSizesByCategory,
  validateCategorySubcategory,
  validateCategorySize,
  getCategoriesForAPI,
  getAllSizes,
  getAllSubcategories,
};
