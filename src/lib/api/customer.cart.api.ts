import { apiClient } from "./client";
import { ApiResponse, Product } from "@/types";

/**
 * ========================================
 * CART API
 * Shopping cart functionality for customers
 * ========================================
 */

// ========================================
// TYPE DEFINITIONS
// ========================================

export interface CartItem {
  _id: string;
  productId: string | Product;
  quantity: number;
  price: number;
  subtotal: number;
  productName?: string;
  productImage?: string;
  selectedSize?: string;
  selectedColor?: string;
  selectedFit?: string;
  sellerId?: string;
  sellerName?: string;
}

export interface Cart {
  _id: string;
  userId?: string;
  sessionId?: string;
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
  totalQuantity: number;
  subtotal: number;
  discount?: number;
  tax?: number;
  shipping?: number;
}

export interface CartResponse extends ApiResponse {
  data: Cart;
}

export interface AddToCartData {
  productId: string;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  selectedFit?: string;
  sessionId?: string;
}

export interface UpdateCartItemData {
  quantity: number;
  sessionId?: string;
}

export interface CartSummary {
  totalItems: number;
  totalQuantity: number;
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  totalAmount: number;
}

// ========================================
// CART FUNCTIONS
// ========================================

/**
 * Get user's cart
 * GET /api/cart
 *
 * @param sessionId - Optional session ID for guest users
 * @returns User's cart with items
 *
 * @example
 * const { data: cart } = await getCart();
 * const { data: guestCart } = await getCart('session_123');
 */
export const getCart = async (sessionId?: string): Promise<CartResponse> => {
  const url = sessionId ? `/cart?sessionId=${sessionId}` : "/cart";
  const response = await apiClient.get<CartResponse>(url);
  return response;
};

/**
 * Add item to cart
 * POST /api/cart/add
 *
 * @param data - Product and quantity to add
 * @returns Updated cart
 *
 * @example
 * await addToCart({
 *   productId: 'prod_123456',
 *   quantity: 2,
 *   selectedSize: 'M',
 *   selectedColor: 'Blue'
 * });
 */
export const addToCart = async (data: AddToCartData): Promise<CartResponse> => {
  const response = await apiClient.post<CartResponse>("/cart/add", data);
  return response;
};

/**
 * Update cart item quantity
 * PUT /api/cart/item/:itemId
 *
 * @param itemId - Cart item ID
 * @param data - New quantity
 * @returns Updated cart
 *
 * @example
 * await updateCartItem('item_123456', { quantity: 3 });
 */
export const updateCartItem = async (
  itemId: string,
  data: UpdateCartItemData
): Promise<CartResponse> => {
  const response = await apiClient.put<CartResponse>(
    `/cart/item/${itemId}`,
    data
  );
  return response;
};

/**
 * Remove item from cart
 * DELETE /api/cart/item/:itemId
 *
 * @param itemId - Cart item ID
 * @param sessionId - Optional session ID for guest users
 * @returns Updated cart
 *
 * @example
 * await removeCartItem('item_123456');
 */
export const removeCartItem = async (
  itemId: string,
  sessionId?: string
): Promise<CartResponse> => {
  const url = sessionId
    ? `/cart/item/${itemId}?sessionId=${sessionId}`
    : `/cart/item/${itemId}`;
  const response = await apiClient.delete<CartResponse>(url);
  return response;
};

/**
 * Clear entire cart
 * DELETE /api/cart/clear
 *
 * @param sessionId - Optional session ID for guest users
 * @returns Success response
 *
 * @example
 * await clearCart();
 */
export const clearCart = async (sessionId?: string): Promise<ApiResponse> => {
  const url = sessionId ? `/cart/clear?sessionId=${sessionId}` : "/cart/clear";
  const response = await apiClient.delete<ApiResponse>(url);
  return response;
};

/**
 * Get cart item count
 * GET /api/cart/count
 *
 * @param sessionId - Optional session ID for guest users
 * @returns Number of items in cart
 *
 * @example
 * const { count } = await getCartCount();
 */
export const getCartCount = async (
  sessionId?: string
): Promise<{ success: boolean; count: number }> => {
  const url = sessionId ? `/cart/count?sessionId=${sessionId}` : "/cart/count";
  const response = await apiClient.get<{ success: boolean; count: number }>(
    url
  );
  return response;
};

/**
 * Get cart summary
 * GET /api/cart/summary
 *
 * @param sessionId - Optional session ID for guest users
 * @returns Cart summary with totals
 *
 * @example
 * const { summary } = await getCartSummary();
 */
export const getCartSummary = async (
  sessionId?: string
): Promise<{ success: boolean; summary: CartSummary }> => {
  const url = sessionId
    ? `/cart/summary?sessionId=${sessionId}`
    : "/cart/summary";
  const response = await apiClient.get<{
    success: boolean;
    summary: CartSummary;
  }>(url);
  return response;
};

/**
 * Validate cart (check stock availability)
 * POST /api/cart/validate
 *
 * @param sessionId - Optional session ID for guest users
 * @returns Validation results
 *
 * @example
 * const validation = await validateCart();
 */
export const validateCart = async (
  sessionId?: string
): Promise<ApiResponse> => {
  const response = await apiClient.post<ApiResponse>("/cart/validate", {
    sessionId,
  });
  return response;
};

/**
 * Merge guest cart with user cart (after login)
 * POST /api/cart/merge
 *
 * @param guestSessionId - Guest session ID
 * @returns Merged cart
 *
 * @example
 * await mergeCart('session_123');
 */
export const mergeCart = async (
  guestSessionId: string
): Promise<CartResponse> => {
  const response = await apiClient.post<CartResponse>("/cart/merge", {
    guestSessionId,
  });
  return response;
};

/**
 * Apply coupon code to cart
 * POST /api/cart/apply-coupon
 *
 * @param couponCode - Coupon code to apply
 * @param sessionId - Optional session ID for guest users
 * @returns Updated cart with discount
 *
 * @example
 * await applyCoupon('SAVE20');
 */
export const applyCoupon = async (
  couponCode: string,
  sessionId?: string
): Promise<CartResponse> => {
  const response = await apiClient.post<CartResponse>("/cart/apply-coupon", {
    couponCode,
    sessionId,
  });
  return response;
};
