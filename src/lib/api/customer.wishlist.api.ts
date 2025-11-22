import { apiClient } from "./client";
import { ApiResponse, Wishlist, WishlistStats, Product } from "@/types";

/**
 * ========================================
 * CUSTOMER WISHLIST API
 * Saved items / wishlist functionality for customers
 * ========================================
 */

// ========================================
// TYPE DEFINITIONS
// ========================================

export interface WishlistResponse extends ApiResponse {
  wishlist: Wishlist;
  itemCount: number;
}

export interface WishlistStatsResponse extends ApiResponse {
  stats: WishlistStats;
}

export interface AddToWishlistOptions {
  notes?: string;
  notifyOnPriceDrop?: boolean;
  notifyOnBackInStock?: boolean;
}

export interface UpdateWishlistItemData {
  notes?: string;
  notifyOnPriceDrop?: boolean;
  notifyOnBackInStock?: boolean;
}

export interface IsInWishlistResponse extends ApiResponse {
  isInWishlist: boolean;
}

export interface MoveToCartResponse extends ApiResponse {
  movedCount: number;
  failedItems?: string[];
}

export interface SimilarProductsResponse extends ApiResponse {
  products: Product[];
}

// ========================================
// WISHLIST FUNCTIONS
// ========================================

/**
 * Get customer's wishlist (saved items)
 * GET /api/wishlist
 *
 * @returns List of all saved products
 *
 * @example
 * const { wishlist, itemCount } = await getWishlist();
 */
export const getWishlist = async (): Promise<WishlistResponse> => {
  const response = await apiClient.get<WishlistResponse>("/wishlist");
  return response;
};

/**
 * Get wishlist statistics
 * GET /api/wishlist/stats
 *
 * @returns Statistics about saved items
 *
 * @example
 * const { stats } = await getWishlistStats();
 * // { totalItems: 15, totalValue: 45000, inStockItems: 12, outOfStockItems: 3 }
 */
export const getWishlistStats = async (): Promise<WishlistStatsResponse> => {
  const response =
    await apiClient.get<WishlistStatsResponse>("/wishlist/stats");
  return response;
};

/**
 * Add product to wishlist
 * POST /api/wishlist/add
 *
 * @param productId - ID of the product
 * @param options - Optional settings for notifications and notes
 * @returns Success response with updated wishlist
 *
 * @example
 * await addToWishlist('prod_123456', {
 *   notes: 'Buy this when on sale',
 *   notifyOnPriceDrop: true,
 *   notifyOnBackInStock: false
 * });
 */
export const addToWishlist = async (
  productId: string,
  options?: AddToWishlistOptions
): Promise<WishlistResponse> => {
  const response = await apiClient.post<WishlistResponse>("/wishlist/add", {
    productId,
    notes: options?.notes,
    notifyOnPriceDrop: options?.notifyOnPriceDrop,
    notifyOnBackInStock: options?.notifyOnBackInStock,
  });
  return response;
};

/**
 * Check if product is in wishlist
 * GET /api/wishlist/check/:productId
 *
 * @param productId - ID of the product
 * @returns Boolean indicating if product is saved
 *
 * @example
 * const { isInWishlist } = await isInWishlist('prod_123456');
 */
export const isInWishlist = async (
  productId: string
): Promise<IsInWishlistResponse> => {
  const response = await apiClient.get<IsInWishlistResponse>(
    `/wishlist/check/${productId}`
  );
  return response;
};

/**
 * Update wishlist item settings
 * PATCH /api/wishlist/:productId
 *
 * @param productId - ID of the product
 * @param updates - Fields to update (notes, notifications)
 * @returns Success response
 *
 * @example
 * await updateWishlistItem('prod_123456', {
 *   notes: 'Updated notes',
 *   notifyOnPriceDrop: false
 * });
 */
export const updateWishlistItem = async (
  productId: string,
  updates: UpdateWishlistItemData
): Promise<ApiResponse> => {
  const response = await apiClient.patch<ApiResponse>(
    `/wishlist/${productId}`,
    updates
  );
  return response;
};

/**
 * Remove product from wishlist
 * DELETE /api/wishlist/:productId
 *
 * @param productId - ID of the product
 * @returns Success response
 *
 * @example
 * await removeFromWishlist('prod_123456');
 */
export const removeFromWishlist = async (
  productId: string
): Promise<ApiResponse> => {
  const response = await apiClient.delete<ApiResponse>(
    `/wishlist/${productId}`
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
 * @param productIds - Array of product IDs to move
 * @returns Response with count of moved items
 *
 * @example
 * await moveToCart(['prod_1', 'prod_2', 'prod_3']);
 */
export const moveToCart = async (
  productIds: string[]
): Promise<MoveToCartResponse> => {
  const response = await apiClient.post<MoveToCartResponse>(
    "/wishlist/move-to-cart",
    { productIds }
  );
  return response;
};

/**
 * Get similar products based on category
 * GET /api/customer/browse/recommendations/similar?category=<category>
 *
 * @param category - Category to find similar products for
 * @returns List of similar products
 *
 * @example
 * const { products } = await getSimilarProducts('apparel');
 */
export const getSimilarProducts = async (
  category: string
): Promise<SimilarProductsResponse> => {
  const response = await apiClient.get<SimilarProductsResponse>(
    `/customer/browse/recommendations/similar?category=${encodeURIComponent(category)}`
  );
  return response;
};
