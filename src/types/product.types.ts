// src/types/product.types.ts

export interface ApparelDetails {
  // Size & Fit
  size:
    | "XXS"
    | "XS"
    | "S"
    | "M"
    | "L"
    | "XL"
    | "XXL"
    | "XXXL"
    | "Free Size"
    | "2T"
    | "3T"
    | "4T"
    | "5"
    | "6"
    | "7"
    | "8"
    | "10"
    | "12"
    | "14"
    | "16";
  fit?:
    | "Slim Fit"
    | "Regular Fit"
    | "Loose Fit"
    | "Oversized"
    | "Athletic Fit"
    | "Relaxed Fit"
    | "Bodycon"
    | "A-Line"
    | "Comfortable Fit";

  // Style Details
  color: string;
  pattern?:
    | "Solid"
    | "Striped"
    | "Checked"
    | "Printed"
    | "Floral"
    | "Abstract"
    | "Geometric"
    | "Polka Dot"
    | "Embroidered"
    | "Plaid"
    | "Cartoon"
    | "Animal Print";

  // Material & Fabric
  material: string; // e.g., "100% Cotton"
  fabricType?:
    | "Cotton"
    | "Polyester"
    | "Silk"
    | "Wool"
    | "Linen"
    | "Denim"
    | "Jersey"
    | "Chiffon"
    | "Satin"
    | "Velvet"
    | "Fleece"
    | "Soft Cotton"
    | "Lace";
  fabricWeight?: string; // e.g., "180 GSM"
  careInstructions?: string;

  // Design Details
  neckline?:
    | "Round Neck"
    | "V-Neck"
    | "Crew Neck"
    | "Polo Neck"
    | "Boat Neck"
    | "Off-Shoulder"
    | "Collar"
    | "Turtleneck";
  sleeveLength?:
    | "Sleeveless"
    | "Short Sleeve"
    | "3/4 Sleeve"
    | "Long Sleeve"
    | "Full Sleeve";
}

export interface ProductImage {
  url: string;
  ipfsHash?: string;
  cloudinaryId?: string;
  publicId?: string;
  viewType?: "front" | "back" | "side" | "detail" | "worn" | "tag";
  isMain: boolean;
}

export interface ProductReview {
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  images?: string[];
  createdAt: Date;
  helpful: number;
}

export interface Product {
  // MongoDB ID
  _id: string;
  id?: string;

  // Basic Information
  name: string;
  description: string;

  // Category System
  category: "Men" | "Women" | "Kids" | "Unisex";
  subcategory:
    | "T-Shirts"
    | "Shirts"
    | "Blouses"
    | "Sweaters"
    | "Hoodies"
    | "Jackets"
    | "Coats"
    | "Jeans"
    | "Trousers"
    | "Shorts"
    | "Skirts"
    | "Dresses"
    | "Suits"
    | "Jumpsuits"
    | "Scarves"
    | "Belts"
    | "Hats"
    | "Bags"
    | "Shoes"
    | "Sneakers"
    | "Boots"
    | "Sandals"
    | "Activewear"
    | "Sleepwear"
    | "Swimwear"
    | "Underwear";

  productType?:
    | "Casual"
    | "Formal"
    | "Sports"
    | "Party"
    | "Traditional"
    | "Workwear"
    | "Evening"
    | "School";
  brand?: string;

  // QR Code
  qrCode?: string;
  qrCodeImageUrl?: string;

  // Apparel-Specific Attributes
  apparelDetails: ApparelDetails;

  // Pricing
  price: number;
  costPrice?: number;
  originalPrice?: number;
  discount?: number;

  // Inventory
  quantity: number;
  reservedQuantity?: number;
  minStockLevel: number;
  sku: string;
  slug: string;

  // Images
  images: ProductImage[];

  // Physical Properties
  weight?: number;
  dimensions?: string;

  // Tags & Metadata
  tags: string[];
  season?: "Spring" | "Summer" | "Autumn" | "Winter" | "All Season";
  countryOfOrigin?: string;
  manufacturer?: string;

  // Seller Information
  sellerId: string;
  sellerName: string;
  sellerWalletAddress?: string;

  // Status
  status:
    | "draft"
    | "active"
    | "inactive"
    | "out_of_stock"
    | "discontinued"
    | "archived";
  isVerified: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestseller: boolean;

  // Certifications
  isSustainable: boolean;
  certifications: string[];

  // Ratings & Reviews
  averageRating: number;
  totalReviews: number;
  reviews?: ProductReview[];

  // Sales & Views
  totalSold: number;
  totalRevenue?: number;
  views: number;
  lastViewedAt?: Date;
  lastSoldAt?: Date;

  // Blockchain
  blockchainProductId?: string;
  blockchainVerified: boolean;
  ipfsHash?: string;
  fabricTransactionId?: string;

  // Shipping
  freeShipping: boolean;
  shippingCost: number;
  estimatedDeliveryDays?: number;

  // Dates
  lastRestockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Virtuals (computed fields)
  availableQuantity?: number;
  stockStatus?: "in_stock" | "low_stock" | "out_of_stock";
  url?: string;
}

// Gender-specific type definitions
export interface CategoryConfig {
  value: string;
  label: string;
  subcategories: string[];
  sizes: string[];
  description: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface ProductListResponse {
  success: boolean;
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ProductResponse {
  success: boolean;
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  sellerId?: string;
}

export interface ProductStatsResponse {
  success: boolean;
  stats: {
    totalProducts: number;
    activeProducts: number;
    outOfStock: number;
    lowStock: number;
    totalValue: number;
    averagePrice: number;
  };
}

// Category-specific options
export interface CategorySpecificOptions {
  productTypes: SelectOption[];
  fitTypes: SelectOption[];
  patterns: SelectOption[];
  fabricTypes: SelectOption[];
}

// API response for categories
export interface CategoriesAPIResponse {
  success: boolean;
  categories: CategoryConfig[];
  productTypes: Record<string, SelectOption[]>;
  fitTypes: Record<string, SelectOption[]>;
  patterns: Record<string, SelectOption[]>;
  fabricTypes: Record<string, SelectOption[]>;
  necklines: SelectOption[];
  sleeveLengths: SelectOption[];
  seasons: SelectOption[];
  certificationTypes: SelectOption[];
  qualityGrades: SelectOption[];
  commonMaterials: string[];
  commonColors: string[];
}

// Update main types/index.ts to export product types
export * from "./product.types";
