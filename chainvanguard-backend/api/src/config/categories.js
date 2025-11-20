// ========================================
// APPAREL CATEGORIES CONFIGURATION - TEXTILE/CLOTHING ONLY
// Includes: Traditional clothing subcategories
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
      "Kurta",
      "Shalwar Kameez",
      "Activewear",
      "Sleepwear",
      "Swimwear",
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
      // Traditional
      "Shalwar Kameez",
      "Kurta",
      "Lawn Suits",
      "Sarees",
      "Lehenga",
      "Dupatta",
      "Shawls",
      // Regular
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
      "Sweaters",
      "Hoodies",
      "Jeans",
      "Trousers",
      "Shorts",
      "Dresses",
      "Jackets",
      "Coats",
      // Traditional
      "Kurta",
      "Shalwar Kameez",
      // Regular
      "Activewear",
      "Sleepwear",
      "Swimwear",
      "Underwear",
    ],
    sizes: ["2T", "3T", "4T", "5", "6", "7", "8", "10", "12", "14", "16"],
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
      "Swimwear",
    ],
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    description: "Unisex clothing and apparel",
  },
};

// ========================================
// PRODUCT TYPES - GENDER SPECIFIC
// ========================================
export const PRODUCT_TYPES = {
  Men: [
    { value: "Casual", label: "Casual" },
    { value: "Formal", label: "Formal" },
    { value: "Sports", label: "Sports" },
    { value: "Workwear", label: "Workwear" },
    { value: "Party", label: "Party" },
    { value: "Traditional", label: "Traditional" },
  ],
  Women: [
    { value: "Casual", label: "Casual" },
    { value: "Formal", label: "Formal" },
    { value: "Sports", label: "Sports" },
    { value: "Party", label: "Party" },
    { value: "Traditional", label: "Traditional" },
    { value: "Evening", label: "Evening Wear" },
    { value: "Bridal", label: "Bridal Wear" },
  ],
  Kids: [
    { value: "Casual", label: "Casual" },
    { value: "Sports", label: "Sports" },
    { value: "Party", label: "Party" },
    { value: "School", label: "School Wear" },
    { value: "Traditional", label: "Traditional" },
  ],
  Unisex: [
    { value: "Casual", label: "Casual" },
    { value: "Sports", label: "Sports" },
    { value: "Activewear", label: "Activewear" },
  ],
};

// ========================================
// FIT TYPES - GENDER SPECIFIC (For Clothing)
// ========================================
export const FIT_TYPES = {
  Men: [
    { value: "Slim Fit", label: "Slim Fit" },
    { value: "Regular Fit", label: "Regular Fit" },
    { value: "Loose Fit", label: "Loose Fit" },
    { value: "Athletic Fit", label: "Athletic Fit" },
    { value: "Relaxed Fit", label: "Relaxed Fit" },
  ],
  Women: [
    { value: "Slim Fit", label: "Slim Fit" },
    { value: "Regular Fit", label: "Regular Fit" },
    { value: "Loose Fit", label: "Loose Fit" },
    { value: "Bodycon", label: "Bodycon" },
    { value: "A-Line", label: "A-Line" },
    { value: "Oversized", label: "Oversized" },
  ],
  Kids: [
    { value: "Regular Fit", label: "Regular Fit" },
    { value: "Loose Fit", label: "Loose Fit" },
    { value: "Comfortable Fit", label: "Comfortable Fit" },
  ],
  Unisex: [
    { value: "Regular Fit", label: "Regular Fit" },
    { value: "Loose Fit", label: "Loose Fit" },
    { value: "Oversized", label: "Oversized" },
  ],
};

// ========================================
// PATTERNS - GENDER SPECIFIC
// ========================================
export const PATTERNS = {
  Men: [
    { value: "Solid", label: "Solid" },
    { value: "Striped", label: "Striped" },
    { value: "Checked", label: "Checked" },
    { value: "Plaid", label: "Plaid" },
    { value: "Printed", label: "Printed" },
    { value: "Embroidered", label: "Embroidered" },
  ],
  Women: [
    { value: "Solid", label: "Solid" },
    { value: "Striped", label: "Striped" },
    { value: "Checked", label: "Checked" },
    { value: "Floral", label: "Floral" },
    { value: "Polka Dot", label: "Polka Dot" },
    { value: "Abstract", label: "Abstract" },
    { value: "Geometric", label: "Geometric" },
    { value: "Embroidered", label: "Embroidered" },
    { value: "Printed", label: "Printed" },
    { value: "Digital Print", label: "Digital Print" },
  ],
  Kids: [
    { value: "Solid", label: "Solid" },
    { value: "Striped", label: "Striped" },
    { value: "Checked", label: "Checked" },
    { value: "Printed", label: "Printed" },
    { value: "Cartoon", label: "Cartoon" },
    { value: "Animal Print", label: "Animal Print" },
  ],
  Unisex: [
    { value: "Solid", label: "Solid" },
    { value: "Striped", label: "Striped" },
    { value: "Printed", label: "Printed" },
  ],
};

// ========================================
// FABRIC TYPES - GENDER SPECIFIC (For Clothing)
// ========================================
export const FABRIC_TYPES = {
  Men: [
    { value: "Cotton", label: "Cotton" },
    { value: "Polyester", label: "Polyester" },
    { value: "Denim", label: "Denim" },
    { value: "Linen", label: "Linen" },
    { value: "Wool", label: "Wool" },
    { value: "Jersey", label: "Jersey" },
    { value: "Fleece", label: "Fleece" },
    { value: "Khaddar", label: "Khaddar" },
    { value: "Karandi", label: "Karandi" },
  ],
  Women: [
    { value: "Cotton", label: "Cotton" },
    { value: "Polyester", label: "Polyester" },
    { value: "Silk", label: "Silk" },
    { value: "Chiffon", label: "Chiffon" },
    { value: "Satin", label: "Satin" },
    { value: "Velvet", label: "Velvet" },
    { value: "Linen", label: "Linen" },
    { value: "Denim", label: "Denim" },
    { value: "Jersey", label: "Jersey" },
    { value: "Lace", label: "Lace" },
    { value: "Lawn", label: "Lawn" },
    { value: "Khaddar", label: "Khaddar" },
    { value: "Karandi", label: "Karandi" },
    { value: "Organza", label: "Organza" },
    { value: "Net", label: "Net" },
  ],
  Kids: [
    { value: "Cotton", label: "Cotton" },
    { value: "Polyester", label: "Polyester" },
    { value: "Jersey", label: "Jersey" },
    { value: "Fleece", label: "Fleece" },
    { value: "Soft Cotton", label: "Soft Cotton" },
  ],
  Unisex: [
    { value: "Cotton", label: "Cotton" },
    { value: "Polyester", label: "Polyester" },
    { value: "Jersey", label: "Jersey" },
    { value: "Fleece", label: "Fleece" },
  ],
};

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
  { value: "Scoop Neck", label: "Scoop Neck" },
  { value: "Square Neck", label: "Square Neck" },
];

// ========================================
// SLEEVE LENGTHS
// ========================================
export const SLEEVE_LENGTHS = [
  { value: "Sleeveless", label: "Sleeveless" },
  { value: "Short Sleeve", label: "Short Sleeve" },
  { value: "3/4 Sleeve", label: "3/4 Sleeve" },
  { value: "Long Sleeve", label: "Long Sleeve" },
  { value: "Cap Sleeve", label: "Cap Sleeve" },
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
  "Lawn", // Pakistani fabric
  "Khaddar", // Pakistani fabric
  "Karandi", // Pakistani fabric
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
  "Gold",
  "Silver",
  "Mustard",
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
 * Get sizes for a specific category (textile/clothing only)
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
 * Get product types for a specific category
 */
export const getProductTypesByCategory = (category) => {
  if (!PRODUCT_TYPES[category]) {
    return PRODUCT_TYPES.Men;
  }
  return PRODUCT_TYPES[category];
};

/**
 * Get fit types for a specific category (textile/clothing only)
 */
export const getFitTypesByCategory = (category) => {
  if (!FIT_TYPES[category]) {
    return FIT_TYPES.Unisex;
  }
  return FIT_TYPES[category];
};

/**
 * Get patterns for a specific category
 */
export const getPatternsByCategory = (category) => {
  if (!PATTERNS[category]) {
    return PATTERNS.Unisex;
  }
  return PATTERNS[category];
};

/**
 * Get fabric types for a specific category (textile/clothing only)
 */
export const getFabricTypesByCategory = (category) => {
  if (!FABRIC_TYPES[category]) {
    return FABRIC_TYPES.Unisex;
  }
  return FABRIC_TYPES[category];
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
 * Validate if a size belongs to a category (textile/clothing only)
 */
export const validateCategorySize = (category, size) => {
  if (!APPAREL_CATEGORIES[category]) {
    return false;
  }
  return APPAREL_CATEGORIES[category].sizes.includes(size);
};

/**
 * Check if subcategory is traditional
 */
export const isTraditionalSubcategory = (subcategory) => {
  const traditionalSubcategories = [
    "Shalwar Kameez",
    "Kurta",
    "Lawn Suits",
    "Sarees",
    "Lehenga",
    "Dupatta",
    "Shawls",
  ];
  return traditionalSubcategories.includes(subcategory);
};

/**
 * Get formatted categories for API response (textile/clothing only)
 */
export const getCategoriesForAPI = () => {
  return {
    categories: getAllCategories(),
    productTypes: PRODUCT_TYPES,
    fitTypes: FIT_TYPES,
    patterns: PATTERNS,
    fabricTypes: FABRIC_TYPES,
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
  FABRIC_TYPES,
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
  getProductTypesByCategory,
  getFitTypesByCategory,
  getPatternsByCategory,
  getFabricTypesByCategory,
  validateCategorySubcategory,
  validateCategorySize,
  isTraditionalSubcategory,
  getCategoriesForAPI,
  getAllSizes,
  getAllSubcategories,
};
