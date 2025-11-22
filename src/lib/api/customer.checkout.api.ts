import { apiClient } from "./client";
import { ApiResponse, Order } from "@/types";

/**
 * ========================================
 * CHECKOUT API
 * Checkout functionality for customers
 * ========================================
 */

// ========================================
// TYPE DEFINITIONS
// ========================================

export interface CheckoutData {
  // Shipping Information
  shippingAddress: {
    name: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };

  // Payment Information
  paymentMethod: "crypto" | "wallet";
  walletAddress?: string;

  // Order Details
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;

  subtotal: number;
  shippingCost: number;
  tax?: number;
  discount?: number;
  total: number;

  // Additional Info
  customerNotes?: string;
  shippingMethod?: "standard" | "express";
}

export interface CheckoutResponse extends ApiResponse {
  data: Order;
}

// ========================================
// CHECKOUT FUNCTIONS
// ========================================

/**
 * Create order from checkout
 * POST /api/orders
 *
 * @param checkoutData - Checkout information
 * @returns Created order
 *
 * @example
 * const order = await createOrder({
 *   shippingAddress: { ... },
 *   paymentMethod: 'wallet',
 *   items: [...],
 *   total: 5000
 * });
 */
export const createOrder = async (
  checkoutData: CheckoutData
): Promise<CheckoutResponse> => {
  const response = await apiClient.post<CheckoutResponse>(
    "/orders",
    checkoutData
  );
  return response;
};

/**
 * Validate checkout before creating order
 * POST /api/customer/checkout/validate
 *
 * @param checkoutData - Checkout information to validate
 * @returns Validation result
 *
 * @example
 * const validation = await validateCheckout({ ... });
 */
export const validateCheckout = async (
  checkoutData: Partial<CheckoutData>
): Promise<ApiResponse> => {
  const response = await apiClient.post<ApiResponse>(
    "/customer/checkout/validate",
    checkoutData
  );
  return response;
};

/**
 * Calculate shipping cost for checkout
 * POST /api/customer/checkout/calculate-shipping
 *
 * @param items - Cart items
 * @param address - Shipping address
 * @returns Shipping cost calculation
 *
 * @example
 * const shipping = await calculateShipping(cartItems, address);
 */
export const calculateShipping = async (
  items: Array<{ productId: string; quantity: number }>,
  address: {
    city: string;
    state: string;
    country: string;
    postalCode: string;
  }
): Promise<{ success: boolean; shippingCost: number }> => {
  const response = await apiClient.post<{
    success: boolean;
    shippingCost: number;
  }>("/customer/checkout/calculate-shipping", {
    items,
    address,
  });
  return response;
};
