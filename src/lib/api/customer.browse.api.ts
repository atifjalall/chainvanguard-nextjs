import { apiClient } from "./client";
import { ApiResponse, Product } from "@/types";

/**
 * ========================================
 * CUSTOMER BROWSE API - MARKETPLACE
 * Browse products from all vendors in the marketplace
 * ========================================
 */

// ========================================
// TYPE DEFINITIONS
// ========================================

export interface BrowseProductsParams {
  // Search
  search?: string;

  // Category Filters
  category?: string;
  subcategory?: string;

  // Price Filters
  minPrice?: number;
  maxPrice?: number;

  // Availability
  inStock?: boolean;

  // Features
  isFeatured?: boolean;
  isOrganic?: boolean;
  isFairTrade?: boolean;
  isRecycled?: boolean;

  // Vendor Filter
  vendorId?: string;

  // Pagination
  page?: number;
  limit?: number;

  // Sorting
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface BrowseProductsResponse extends ApiResponse {
  products: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  filters: {
    categories: string[];
    priceRange: {
      min: number;
      max: number;
    };
    vendors: Array<{
      _id: string;
      name: string;
      productCount: number;
    }>;
  };
}

export interface ProductDetailsResponse extends ApiResponse {
  product: Product;
  vendor: {
    _id: string;
    name: string;
    companyName?: string;
    averageRating?: number;
    totalReviews?: number;
  };
  reviews?: Array<{
    _id: string;
    customerId: string;
    customerName: string;
    rating: number;
    comment: string;
    createdAt: string;
  }>;
  relatedProducts?: Product[];
}

export interface VendorStoreResponse extends ApiResponse {
  vendor: {
    _id: string;
    name: string;
    companyName?: string;
    businessAddress?: string;
    description?: string;
    averageRating?: number;
    totalReviews?: number;
    profileImage?: string;
  };
  stats: {
    totalProducts: number;
    totalSales: number;
    averageRating: number;
  };
  featuredProducts: Product[];
}

export interface CompareProductsResponse extends ApiResponse {
  products: Product[];
  comparison: {
    priceRange: {
      min: number;
      max: number;
    };
    features: string[];
    specifications: Record<string, string[]>;
  };
}

// ========================================
// BROWSE FUNCTIONS
// ========================================

/**
 * Browse all products in the marketplace
 * GET /api/customer/browse/products
 *
 * @param params - Filter and pagination parameters
 * @returns Paginated product list with filters
 *
 * @example
 * const products = await browseProducts({
 *   category: 'Men',
 *   subcategory: 'T-Shirts',
 *   minPrice: 20,
 *   maxPrice: 100,
 *   inStock: true,
 *   page: 1,
 *   limit: 20
 * });
 */
export const browseProducts = async (
  params: BrowseProductsParams = {}
): Promise<BrowseProductsResponse> => {
  const queryParams = new URLSearchParams();

  if (params.search) queryParams.append("search", params.search);
  if (params.category) queryParams.append("category", params.category);
  if (params.subcategory) queryParams.append("subcategory", params.subcategory);
  if (params.minPrice !== undefined)
    queryParams.append("minPrice", params.minPrice.toString());
  if (params.maxPrice !== undefined)
    queryParams.append("maxPrice", params.maxPrice.toString());
  if (params.inStock !== undefined)
    queryParams.append("inStock", params.inStock.toString());
  if (params.isFeatured !== undefined)
    queryParams.append("isFeatured", params.isFeatured.toString());
  if (params.isOrganic !== undefined)
    queryParams.append("isOrganic", params.isOrganic.toString());
  if (params.isFairTrade !== undefined)
    queryParams.append("isFairTrade", params.isFairTrade.toString());
  if (params.isRecycled !== undefined)
    queryParams.append("isRecycled", params.isRecycled.toString());
  if (params.vendorId) queryParams.append("vendorId", params.vendorId);
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.sortBy) queryParams.append("sortBy", params.sortBy);
  if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

  const url = `/customer/browse/products${
    queryParams.toString() ? `?${queryParams.toString()}` : ""
  }`;
  const response = await apiClient.get<BrowseProductsResponse>(url);
  return response;
};

/**
 * Get detailed product information
 * GET /api/customer/browse/products/:id
 *
 * @param productId - ID of the product
 * @param options - Additional options
 * @returns Product details with vendor info and reviews
 *
 * @example
 * const product = await getProductDetails('prod_123456', {
 *   includeReviews: true,
 *   includeRelated: true,
 *   includeVendor: true
 * });
 */
export const getProductDetails = async (
  productId: string,
  options: {
    includeReviews?: boolean;
    includeRelated?: boolean;
    includeVendor?: boolean;
  } = {}
): Promise<ProductDetailsResponse> => {
  const queryParams = new URLSearchParams();

  if (options.includeReviews !== undefined)
    queryParams.append("includeReviews", options.includeReviews.toString());
  if (options.includeRelated !== undefined)
    queryParams.append("includeRelated", options.includeRelated.toString());
  if (options.includeVendor !== undefined)
    queryParams.append("includeVendor", options.includeVendor.toString());

  const url = `/customer/browse/products/${productId}${
    queryParams.toString() ? `?${queryParams.toString()}` : ""
  }`;
  const response = await apiClient.get<ProductDetailsResponse>(url);
  return response;
};

/**
 * Get vendor store page
 * GET /api/customer/browse/vendor/:vendorId
 *
 * @param vendorId - ID of the vendor
 * @returns Vendor profile with stats and featured products
 *
 * @example
 * const store = await getVendorStore('vendor_123456');
 */
export const getVendorStore = async (
  vendorId: string
): Promise<VendorStoreResponse> => {
  const response = await apiClient.get<VendorStoreResponse>(
    `/customer/browse/vendor/${vendorId}`
  );
  return response;
};

/**
 * Get vendor's products
 * GET /api/customer/browse/vendor/:vendorId/products
 *
 * @param vendorId - ID of the vendor
 * @param params - Filter and pagination parameters
 * @returns Paginated list of vendor's products
 *
 * @example
 * const products = await getVendorProducts('vendor_123456', {
 *   category: 'Women',
 *   page: 1,
 *   limit: 20
 * });
 */
export const getVendorProducts = async (
  vendorId: string,
  params: Omit<BrowseProductsParams, "vendorId"> = {}
): Promise<BrowseProductsResponse> => {
  const queryParams = new URLSearchParams();

  if (params.category) queryParams.append("category", params.category);
  if (params.subcategory) queryParams.append("subcategory", params.subcategory);
  if (params.minPrice !== undefined)
    queryParams.append("minPrice", params.minPrice.toString());
  if (params.maxPrice !== undefined)
    queryParams.append("maxPrice", params.maxPrice.toString());
  if (params.inStock !== undefined)
    queryParams.append("inStock", params.inStock.toString());
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.sortBy) queryParams.append("sortBy", params.sortBy);
  if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

  const url = `/customer/browse/vendor/${vendorId}/products${
    queryParams.toString() ? `?${queryParams.toString()}` : ""
  }`;
  const response = await apiClient.get<BrowseProductsResponse>(url);
  return response;
};

/**
 * Compare multiple products
 * POST /api/customer/browse/products/compare
 *
 * @param productIds - Array of product IDs to compare
 * @returns Comparison data for selected products
 *
 * @example
 * const comparison = await compareProducts(['prod_1', 'prod_2', 'prod_3']);
 */
export const compareProducts = async (
  productIds: string[]
): Promise<CompareProductsResponse> => {
  const response = await apiClient.post<CompareProductsResponse>(
    "/customer/browse/products/compare",
    { productIds }
  );
  return response;
};

/**
 * Get featured products collection
 * GET /api/customer/browse/collections/featured
 *
 * @param limit - Number of products to fetch
 * @param category - Optional category filter
 * @returns Featured products collection
 */
export const getFeaturedCollection = async (
  limit: number = 20,
  category?: string
): Promise<{ success: boolean; products: Product[] }> => {
  const queryParams = new URLSearchParams();
  queryParams.append("limit", limit.toString());
  if (category) queryParams.append("category", category);

  const url = `/customer/browse/collections/featured?${queryParams.toString()}`;
  const response = await apiClient.get<{
    success: boolean;
    products: Product[];
  }>(url);
  return response;
};

/**
 * Get trending products collection
 * GET /api/customer/browse/collections/trending
 *
 * @param limit - Number of products to fetch
 * @param timeframe - Time period (week|month|all)
 * @returns Trending products collection
 */
export const getTrendingCollection = async (
  limit: number = 20,
  timeframe: string = "week"
): Promise<{ success: boolean; products: Product[] }> => {
  const queryParams = new URLSearchParams();
  queryParams.append("limit", limit.toString());
  queryParams.append("timeframe", timeframe);

  const url = `/customer/browse/collections/trending?${queryParams.toString()}`;
  const response = await apiClient.get<{
    success: boolean;
    products: Product[];
  }>(url);
  return response;
};

/**
 * Get new arrivals collection
 * GET /api/customer/browse/collections/new-arrivals
 *
 * @param limit - Number of products to fetch
 * @param category - Optional category filter
 * @returns New arrivals collection
 */
export const getNewArrivalsCollection = async (
  limit: number = 20,
  category?: string
): Promise<{ success: boolean; products: Product[] }> => {
  const queryParams = new URLSearchParams();
  queryParams.append("limit", limit.toString());
  if (category) queryParams.append("category", category);

  const url = `/customer/browse/collections/new-arrivals?${queryParams.toString()}`;
  const response = await apiClient.get<{
    success: boolean;
    products: Product[];
  }>(url);
  return response;
};

/**
 * Get deals/discounted products collection
 * GET /api/customer/browse/collections/deals
 *
 * @param limit - Number of products to fetch
 * @param minDiscount - Minimum discount percentage
 * @returns Deals collection
 */
export const getDealsCollection = async (
  limit: number = 20,
  minDiscount?: number
): Promise<{ success: boolean; products: Product[] }> => {
  const queryParams = new URLSearchParams();
  queryParams.append("limit", limit.toString());
  if (minDiscount !== undefined)
    queryParams.append("minDiscount", minDiscount.toString());

  const url = `/customer/browse/collections/deals?${queryParams.toString()}`;
  const response = await apiClient.get<{
    success: boolean;
    products: Product[];
  }>(url);
  return response;
};

/**
 * Get single product details
 * GET /api/customer/browse/products/:id
 *
 * @param productId - Product ID
 * @param options - Include options
 * @returns Product details with vendor, reviews, and related products
 *
 * @example
 * const data = await getProductDetail('prod_123');
 */
export const getProductDetail = async (
  productId: string,
  options: {
    includeReviews?: boolean;
    includeRelated?: boolean;
    includeVendor?: boolean;
  } = {}
): Promise<ProductDetailsResponse> => {
  const queryParams = new URLSearchParams();

  if (options.includeReviews !== undefined)
    queryParams.append("includeReviews", options.includeReviews.toString());
  if (options.includeRelated !== undefined)
    queryParams.append("includeRelated", options.includeRelated.toString());
  if (options.includeVendor !== undefined)
    queryParams.append("includeVendor", options.includeVendor.toString());

  const url = `/customer/browse/products/${productId}${
    queryParams.toString() ? `?${queryParams.toString()}` : ""
  }`;
  const response = await apiClient.get<ProductDetailsResponse>(url);
  return response;
};

/**
 * Get related products
 * GET /api/customer/browse/products/:id/related
 *
 * @param productId - Product ID
 * @param limit - Number of related products
 * @returns Related products
 */
export const getRelatedProducts = async (
  productId: string,
  limit: number = 10
): Promise<{ success: boolean; products: Product[] }> => {
  const url = `/customer/browse/products/${productId}/related?limit=${limit}`;
  const response = await apiClient.get<{
    success: boolean;
    products: Product[];
  }>(url);
  return response;
};
