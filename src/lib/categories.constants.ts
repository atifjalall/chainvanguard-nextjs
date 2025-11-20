// ========================================
// UPDATED FRONTEND CATEGORIES
// Matches backend categories.js
// ========================================

// Categories and subcategories - TEXTILE/CLOTHING ONLY
const CATEGORIES = {
  Men: [
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
    // Traditional
    "Kurta",
    "Shalwar Kameez",
    // Regular
    "Activewear",
    "Sleepwear",
    "Swimwear",
    "Underwear",
  ],
  Women: [
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
  Kids: [
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
  Unisex: [
    "T-Shirts",
    "Hoodies",
    "Sweaters",
    "Jackets",
    "Activewear",
    "Sleepwear",
    "Swimwear",
  ],
};

// Product types by category
const PRODUCT_TYPES = {
  Men: ["Casual", "Formal", "Sports", "Workwear", "Party", "Traditional"],
  Women: [
    "Casual",
    "Formal",
    "Sports",
    "Party",
    "Traditional",
    "Evening",
    "Bridal",
  ],
  Kids: ["Casual", "Sports", "Party", "School", "Traditional"],
  Unisex: ["Casual", "Sports", "Activewear"],
};

// Sizes by category (clothing)
const CATEGORY_SIZES = {
  Men: ["S", "M", "L", "XL", "XXL", "XXXL"],
  Women: ["XXS", "XS", "S", "M", "L", "XL", "XXL"],
  Kids: ["2T", "3T", "4T", "5", "6", "7", "8", "10", "12", "14", "16"],
  Unisex: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
};

// Traditional subcategories
const TRADITIONAL_SUBCATEGORIES = [
  "Shalwar Kameez",
  "Kurta",
  "Lawn Suits",
  "Sarees",
  "Lehenga",
  "Dupatta",
  "Shawls",
];

// Subcategories that have necklines (clothing items)
const NECKLINE_APPLICABLE_SUBCATEGORIES = [
  "T-Shirts",
  "Shirts",
  "Blouses",
  "Dresses",
  "Sweaters",
  "Hoodies",
  "Kurta",
  "Shalwar Kameez",
  "Lawn Suits",
  "Sarees",
  "Lehenga",
  "Jumpsuits",
];

// Subcategories that have sleeve lengths (clothing with sleeves)
const SLEEVE_APPLICABLE_SUBCATEGORIES = [
  "T-Shirts",
  "Shirts",
  "Blouses",
  "Dresses",
  "Sweaters",
  "Hoodies",
  "Jackets",
  "Coats",
  "Kurta",
  "Shalwar Kameez",
  "Lawn Suits",
  "Jumpsuits",
];

// Subcategories that don't need sizes (one-size-fits-all or adjustable)
const NO_SIZE_SUBCATEGORIES = [
  "Watches",
  "Jewelry",
  "Sunglasses",
  "Ties",
  "Scarves",
  "Dupatta",
  "Shawls",
];

// Helper function to get sizes based on category
const getSizesForProduct = (
  category: string,
  subcategory: string
): string[] => {
  return CATEGORY_SIZES[category as keyof typeof CATEGORY_SIZES] || [];
};

// Helper function to check if subcategory is traditional
const isTraditional = (subcategory: string): boolean => {
  return TRADITIONAL_SUBCATEGORIES.includes(subcategory);
};

// Helper function to check if subcategory needs neckline
const hasNeckline = (subcategory: string): boolean => {
  return NECKLINE_APPLICABLE_SUBCATEGORIES.includes(subcategory);
};

// Helper function to check if subcategory needs sleeve length
const hasSleeves = (subcategory: string): boolean => {
  return SLEEVE_APPLICABLE_SUBCATEGORIES.includes(subcategory);
};

// Helper function to check if subcategory needs size
const needsSize = (subcategory: string): boolean => {
  return !NO_SIZE_SUBCATEGORIES.includes(subcategory);
};

// Helper function to get fabric types based on category
const getFabricTypes = (category: string, subcategory: string): string[] => {
  // All clothing gets fabric types
  return FABRIC_TYPES[category as keyof typeof FABRIC_TYPES] || [];
};

// Fit types by category (gender-specific)
const FIT_TYPES = {
  Men: [
    "Slim Fit",
    "Regular Fit",
    "Loose Fit",
    "Athletic Fit",
    "Relaxed Fit",
  ],
  Women: [
    "Slim Fit",
    "Regular Fit",
    "Loose Fit",
    "Bodycon",
    "A-Line",
    "Oversized",
  ],
  Kids: ["Regular Fit", "Loose Fit", "Comfortable Fit"],
  Unisex: ["Regular Fit", "Loose Fit", "Oversized"],
};


// Patterns by category (gender-specific)
const PATTERNS = {
  Men: ["Solid", "Striped", "Checked", "Plaid", "Printed", "Embroidered"],
  Women: [
    "Solid",
    "Striped",
    "Checked",
    "Floral",
    "Polka Dot",
    "Abstract",
    "Geometric",
    "Embroidered",
    "Printed",
    "Digital Print",
  ],
  Kids: [
    "Solid",
    "Striped",
    "Checked",
    "Printed",
    "Cartoon",
    "Animal Print",
  ],
  Unisex: ["Solid", "Striped", "Printed"],
};

// Fabric types by category (gender-specific) - For clothing
const FABRIC_TYPES = {
  Men: [
    "Cotton",
    "Polyester",
    "Denim",
    "Linen",
    "Wool",
    "Jersey",
    "Fleece",
    "Khaddar",
    "Karandi",
  ],
  Women: [
    "Cotton",
    "Polyester",
    "Silk",
    "Chiffon",
    "Satin",
    "Velvet",
    "Linen",
    "Denim",
    "Jersey",
    "Lace",
    "Lawn",
    "Khaddar",
    "Karandi",
    "Organza",
    "Net",
  ],
  Kids: ["Cotton", "Polyester", "Jersey", "Fleece", "Soft Cotton"],
  Unisex: ["Cotton", "Polyester", "Jersey", "Fleece"],
};


// Necklines
const NECKLINES = [
  "Crew Neck",
  "V-Neck",
  "Round Neck",
  "Collar",
  "Off-Shoulder",
  "Boat Neck",
  "Turtleneck",
  "Scoop Neck",
  "Square Neck",
];

// Sleeve lengths
const SLEEVE_LENGTHS = [
  "Sleeveless",
  "Short Sleeve",
  "3/4 Sleeve",
  "Long Sleeve",
  "Cap Sleeve",
];

// Seasons
const SEASONS = ["Spring", "Summer", "Autumn", "Winter", "All Season"];

// Category codes for SKU generation
const categoryCodes: { [key: string]: string } = {
  Men: "MEN",
  Women: "WOM",
  Kids: "KID",
  Unisex: "UNI",
};

// Subcategory codes for SKU generation
const subcategoryCodes: { [key: string]: string } = {
  // Clothing
  "T-Shirts": "TSH",
  Shirts: "SHT",
  Sweaters: "SWT",
  Hoodies: "HOD",
  Jackets: "JKT",
  Coats: "COT",
  Jeans: "JNS",
  Trousers: "TRS",
  Shorts: "SHR",
  Suits: "SUT",
  Activewear: "ACT",
  Sleepwear: "SLP",
  Swimwear: "SWM",
  Underwear: "UND",
  Blouses: "BLO",
  Dresses: "DRS",
  Jumpsuits: "JMP",
  Skirts: "SKT",
  // Traditional
  "Shalwar Kameez": "SHK",
  Kurta: "KRT",
  "Lawn Suits": "LWN",
  Sarees: "SAR",
  Lehenga: "LHG",
  Dupatta: "DUP",
  Shawls: "SHW",
  // Footwear
  Shoes: "SHO",
  Sneakers: "SNK",
  Boots: "BOT",
  Sandals: "SDL",
  Heels: "HEL",
  Flats: "FLT",
  // Accessories
  Belts: "BLT",
  Hats: "HAT",
  Bags: "BAG",
  Scarves: "SCR",
  Ties: "TIE",
  Watches: "WTC",
  Wallets: "WLT",
  Handbags: "HBG",
  Clutches: "CLT",
  Jewelry: "JWL",
  Sunglasses: "SNG",
};

// Quality grades
const QUALITY_GRADES = ["Premium", "Grade A", "Grade B", "Grade C", "Standard"];

// Certification types
const CERTIFICATION_TYPES = [
  "GOTS",
  "Fair Trade",
  "OEKO-TEX",
  "ISO",
  "Origin Certificate",
  "Quality Certificate",
  "Compliance Certificate",
  "Other",
];

// Export all constants
export {
  CATEGORIES,
  PRODUCT_TYPES,
  CATEGORY_SIZES,
  TRADITIONAL_SUBCATEGORIES,
  FIT_TYPES,
  PATTERNS,
  FABRIC_TYPES,
  NECKLINES,
  SLEEVE_LENGTHS,
  SEASONS,
  QUALITY_GRADES,
  CERTIFICATION_TYPES,
  categoryCodes,
  subcategoryCodes,
  // Helper functions
  getSizesForProduct,
  getFabricTypes,
  isTraditional,
  hasNeckline,
  hasSleeves,
  needsSize,
};

// Type definitions for TypeScript
export type Category = keyof typeof CATEGORIES;
export type Subcategory = string;
export type ProductType = string;
export type Size = string;
export type FitType = string;
export type Pattern = string;
export type FabricType = string;
export type Neckline = (typeof NECKLINES)[number];
export type SleeveLength = (typeof SLEEVE_LENGTHS)[number];
export type Season = (typeof SEASONS)[number];
export type QualityGrade = (typeof QUALITY_GRADES)[number];
export type CertificationType = (typeof CERTIFICATION_TYPES)[number];
