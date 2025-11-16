import { apiClient } from "./client";
import { ApiResponse, Inventory } from "@/types";

/**
 * ========================================
 * VENDOR BROWSE & WISHLIST API
 * Browse supplier inventory marketplace and manage saved items
 * ========================================
 */

// ========================================
// TYPE DEFINITIONS
// ========================================

export interface BrowseInventoryParams {
  supplierId?: string;
  category?: string;
  subcategory?: string;
  materialType?: string;
  fabricType?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface BrowseInventoryResponse extends ApiResponse {
  data: Inventory[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface InventoryDetailsResponse extends ApiResponse {
  data: Inventory;
}

export interface BrowseCategoryResponse extends ApiResponse {
  data: Array<{
    _id: string;
    totalItems: number;
    totalValue: number;
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    subcategories: Array<{
      name: string;
      count: number;
      avgPrice: number;
      minPrice: number;
      maxPrice: number;
    }>;
  }>;
}

export interface BrowseSupplierParams {
  search?: string;
  minRating?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface BrowseSupplier {
  _id: string;
  name: string;
  email: string;
  companyName?: string;
  contactPhone?: string;
  businessAddress?: string;
  certifications?: string[];
  description?: string;
  averageRating?: number;
  totalReviews?: number;
  profileImage?: string;
  inventoryCount: number;
  createdAt: string;
}

export interface BrowseSupplierResponse extends ApiResponse {
  data: BrowseSupplier[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface SupplierProfileResponse extends ApiResponse {
  data: BrowseSupplier & {
    inventoryStats: {
      totalProducts: number;
      categories: Array<{
        _id: string;
        count: number;
        avgPrice: number;
      }>;
    };
  };
}

export interface SupplierInventoryParams {
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface WishlistItem {
  _id: string;
  userId: string;
  productId: string | Inventory;
  inventoryId?: string | Inventory;
  addedAt: string;
  notes?: string;
  notifyOnPriceDrop?: boolean;
  notifyOnBackInStock?: boolean;
}

export interface WishlistResponse extends ApiResponse {
  wishlist: {
    _id: string;
    userId: string;
    items: WishlistItem[];
    isPublic: boolean;
    lastModified: string;
    createdAt: string;
    updatedAt: string;
  };
  itemCount: number;
}

export interface WishlistStatsResponse extends ApiResponse {
  data: {
    totalItems: number;
    totalValue: number;
    inStockItems: number;
    outOfStockItems: number;
  };
}

// ========================================
// INVENTORY BROWSING FUNCTIONS
// ========================================

/**
 * Browse all supplier inventory with filters and pagination
 * GET /api/inventory/browse
 *
 * @param params - Filter and pagination parameters
 * @returns Paginated inventory list
 *
 * @example
 * const items = await browseInventory({
 *   category: 'Fabric',
 *   search: 'cotton',
 *   minPrice: 100,
 *   maxPrice: 1000,
 *   page: 1,
 *   limit: 20
 * });
 */
export const browseInventory = async (
  params: BrowseInventoryParams = {}
): Promise<BrowseInventoryResponse> => {
  const queryParams = new URLSearchParams();

  if (params.supplierId) queryParams.append("supplierId", params.supplierId);
  if (params.category) queryParams.append("category", params.category);
  if (params.subcategory) queryParams.append("subcategory", params.subcategory);
  if (params.materialType)
    queryParams.append("materialType", params.materialType);
  if (params.fabricType) queryParams.append("fabricType", params.fabricType);
  if (params.minPrice !== undefined)
    queryParams.append("minPrice", params.minPrice.toString());
  if (params.maxPrice !== undefined)
    queryParams.append("maxPrice", params.maxPrice.toString());
  if (params.search) queryParams.append("search", params.search);
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.sortBy) queryParams.append("sortBy", params.sortBy);
  if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

  const url = `/inventory/browse${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
  const response = await apiClient.get<BrowseInventoryResponse>(url);
  return response;
};

/**
 * Get single inventory item details
 * GET /api/inventory/browse/:inventoryId
 *
 * @param inventoryId - ID of the inventory item
 * @returns Detailed inventory information
 *
 * @example
 * const item = await getInventoryDetails('inv_123456');
 */
export const getInventoryDetails = async (
  inventoryId: string
): Promise<InventoryDetailsResponse> => {
  const response = await apiClient.get<InventoryDetailsResponse>(
    `/inventory/browse/${inventoryId}`
  );
  return response;
};

/**
 * Get browse categories with statistics
 * GET /api/inventory/browse/categories
 *
 * @returns Categories with item counts, pricing stats, and subcategories
 *
 * @example
 * const categories = await getBrowseCategories();
 * // Returns: [{ _id: 'Fabric', totalItems: 150, avgPrice: 450, subcategories: [...] }]
 */
export const getBrowseCategories =
  async (): Promise<BrowseCategoryResponse> => {
    const response = await apiClient.get<BrowseCategoryResponse>(
      "/inventory/browse/categories"
    );
    return response;
  };

/**
 * Get all suppliers for browsing
 * GET /api/inventory/browse/suppliers
 *
 * @param params - Search and filter parameters
 * @returns Paginated list of suppliers with inventory counts
 *
 * @example
 * const suppliers = await getBrowseSuppliers({
 *   search: 'textile',
 *   minRating: 4,
 *   page: 1,
 *   limit: 20
 * });
 */
export const getBrowseSuppliers = async (
  params: BrowseSupplierParams = {}
): Promise<BrowseSupplierResponse> => {
  const queryParams = new URLSearchParams();

  if (params.search) queryParams.append("search", params.search);
  if (params.minRating !== undefined)
    queryParams.append("minRating", params.minRating.toString());
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.sortBy) queryParams.append("sortBy", params.sortBy);
  if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

  const url = `/inventory/browse/suppliers${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
  const response = await apiClient.get<BrowseSupplierResponse>(url);
  return response;
};

/**
 * Get supplier profile with inventory statistics
 * GET /api/inventory/browse/suppliers/:supplierId
 *
 * @param supplierId - ID of the supplier
 * @returns Supplier profile with inventory stats
 *
 * @example
 * const profile = await getSupplierProfile('sup_123456');
 */
export const getSupplierProfile = async (
  supplierId: string
): Promise<SupplierProfileResponse> => {
  const response = await apiClient.get<SupplierProfileResponse>(
    `/inventory/browse/suppliers/${supplierId}`
  );
  return response;
};

/**
 * Get specific supplier's inventory
 * GET /api/inventory/browse/suppliers/:supplierId/inventory
 *
 * @param supplierId - ID of the supplier
 * @param params - Filter and pagination parameters
 * @returns Paginated inventory from specific supplier
 *
 * @example
 * const items = await getSupplierInventory('sup_123456', {
 *   category: 'Fabric',
 *   page: 1,
 *   limit: 20
 * });
 */
export const getSupplierInventory = async (
  supplierId: string,
  params: SupplierInventoryParams = {}
): Promise<BrowseInventoryResponse> => {
  const queryParams = new URLSearchParams();

  if (params.category) queryParams.append("category", params.category);
  if (params.subcategory) queryParams.append("subcategory", params.subcategory);
  if (params.minPrice !== undefined)
    queryParams.append("minPrice", params.minPrice.toString());
  if (params.maxPrice !== undefined)
    queryParams.append("maxPrice", params.maxPrice.toString());
  if (params.search) queryParams.append("search", params.search);
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.sortBy) queryParams.append("sortBy", params.sortBy);
  if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

  const url = `/inventory/browse/suppliers/${supplierId}/inventory${
    queryParams.toString() ? `?${queryParams.toString()}` : ""
  }`;
  const response = await apiClient.get<BrowseInventoryResponse>(url);
  return response;
};

// ========================================
// WISHLIST FUNCTIONS
// ========================================

/**
 * Get vendor's wishlist (saved items)
 * GET /api/wishlist
 *
 * @returns List of all saved inventory items
 *
 * @example
 * const wishlist = await getWishlist();
 */
export const getWishlist = async (): Promise<WishlistResponse> => {
  const response = await apiClient.get<WishlistResponse>("/wishlist");
  return response;
};

/**
 * Get wishlist statistics
 * GET /api/wishlist/stats
 *
 * @returns Statistics about saved items (count, value, stock status)
 *
 * @example
 * const stats = await getWishlistStats();
 * // Returns: { totalItems: 15, totalValue: 45000, inStockItems: 12, outOfStockItems: 3 }
 */
export const getWishlistStats = async (): Promise<WishlistStatsResponse> => {
  const response =
    await apiClient.get<WishlistStatsResponse>("/wishlist/stats");
  return response;
};

/**
 * Add inventory item to wishlist
 * POST /api/wishlist/add
 *
 * @param inventoryId - ID of the inventory item
 * @param options - Optional settings for notifications and notes
 * @returns Success response
 *
 * @example
 * await addToWishlist('inv_123456', {
 *   notes: 'Check price next week',
 *   notifyOnPriceDrop: true,
 *   notifyOnBackInStock: false
 * });
 */
export const addToWishlist = async (
  inventoryId: string,
  options?: {
    notes?: string;
    notifyOnPriceDrop?: boolean;
    notifyOnBackInStock?: boolean;
  }
): Promise<ApiResponse> => {
  const response = await apiClient.post<ApiResponse>("/wishlist/add", {
    productId: inventoryId, // Backend uses productId for both products and inventory
    notes: options?.notes,
    notifyOnPriceDrop: options?.notifyOnPriceDrop,
    notifyOnBackInStock: options?.notifyOnBackInStock,
  });
  return response;
};

/**
 * Check if item is in wishlist
 * GET /api/wishlist/check/:inventoryId
 *
 * @param inventoryId - ID of the inventory item
 * @returns Boolean indicating if item is saved
 *
 * @example
 * const { isInWishlist } = await isInWishlist('inv_123456');
 */
export const isInWishlist = async (
  inventoryId: string
): Promise<ApiResponse<{ isInWishlist: boolean }>> => {
  const response = await apiClient.get<ApiResponse<{ isInWishlist: boolean }>>(
    `/wishlist/check/${inventoryId}`
  );
  return response;
};

/**
 * Update wishlist item settings
 * PATCH /api/wishlist/:inventoryId
 *
 * @param inventoryId - ID of the inventory item
 * @param updates - Fields to update (notes, notifications)
 * @returns Success response
 *
 * @example
 * await updateWishlistItem('inv_123456', {
 *   notes: 'Updated notes',
 *   notifyOnPriceDrop: false
 * });
 */
export const updateWishlistItem = async (
  inventoryId: string,
  updates: {
    notes?: string;
    notifyOnPriceDrop?: boolean;
    notifyOnBackInStock?: boolean;
  }
): Promise<ApiResponse> => {
  const response = await apiClient.patch<ApiResponse>(
    `/wishlist/${inventoryId}`,
    updates
  );
  return response;
};

/**
 * Remove item from wishlist
 * DELETE /api/wishlist/:inventoryId
 *
 * @param inventoryId - ID of the inventory item
 * @returns Success response
 *
 * @example
 * await removeFromWishlist('inv_123456');
 */
export const removeFromWishlist = async (
  inventoryId: string
): Promise<ApiResponse> => {
  const response = await apiClient.delete<ApiResponse>(
    `/wishlist/${inventoryId}`
  );
  return response;
};

/**
 * Clear entire wishlist
 * DELETE /api/wishlist
 *
 * @returns Success response
 *
 * @example
 * await clearWishlist();
 */
export const clearWishlist = async (): Promise<ApiResponse> => {
  const response = await apiClient.delete<ApiResponse>("/wishlist");
  return response;
};

/**
 * Move wishlist items to cart
 * POST /api/wishlist/move-to-cart
 *
 * @param inventoryIds - Array of inventory item IDs
 * @returns Success response with cart details
 *
 * @example
 * await moveWishlistToCart(['inv_123', 'inv_456', 'inv_789']);
 */
export const moveWishlistToCart = async (
  inventoryIds: string[]
): Promise<ApiResponse> => {
  const response = await apiClient.post<ApiResponse>("/wishlist/move-to-cart", {
    productIds: inventoryIds,
  });
  return response;
};

// ========================================
// EXPORT ALL FUNCTIONS AS DEFAULT OBJECT
// ========================================

const vendorBrowseApi = {
  // Inventory Browsing (6 functions)
  browseInventory,
  getInventoryDetails,
  getBrowseCategories,
  getBrowseSuppliers,
  getSupplierProfile,
  getSupplierInventory,

  // Wishlist Management (7 functions)
  getWishlist,
  getWishlistStats,
  addToWishlist,
  isInWishlist,
  updateWishlistItem,
  removeFromWishlist,
  clearWishlist,
  moveWishlistToCart,
};

export default vendorBrowseApi;
