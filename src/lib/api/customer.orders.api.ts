/**
 * Customer Orders API
 * All API calls related to customer orders
 */

import { apiClient } from "./client";
import type { Order, OrderStatus, ApiResponse } from "@/types";

// ========================================
// TYPES
// ========================================

export interface OrderFilters {
  status?: OrderStatus;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "total" | "status";
  sortOrder?: "asc" | "desc";
  startDate?: string;
  endDate?: string;
}

export interface OrdersResponse extends ApiResponse {
  data: {
    orders: Order[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

export interface OrderResponse extends ApiResponse {
  data: {
    order: Order;
  };
}

export interface CancelOrderData {
  reason: string;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalSpent: number;
  averageOrderValue: number;
}

export interface OrderStatsResponse extends ApiResponse {
  stats: OrderStats;
}

// ========================================
// ORDER FUNCTIONS
// ========================================

/**
 * Get customer's orders with filtering and pagination
 * GET /api/orders
 *
 * @param filters - Optional filters for orders
 * @returns Paginated orders list
 */
export const getOrders = async (
  filters?: OrderFilters
): Promise<OrdersResponse> => {
  const params = new URLSearchParams();

  if (filters?.status) params.append("status", filters.status);
  if (filters?.page) params.append("page", filters.page.toString());
  if (filters?.limit) params.append("limit", filters.limit.toString());
  if (filters?.sortBy) params.append("sortBy", filters.sortBy);
  if (filters?.sortOrder) params.append("sortOrder", filters.sortOrder);
  if (filters?.startDate) params.append("startDate", filters.startDate);
  if (filters?.endDate) params.append("endDate", filters.endDate);

  const queryString = params.toString();
  const url = queryString ? `/orders?${queryString}` : "/orders";

  const response = await apiClient.get<OrdersResponse>(url);
  return response;
};

/**
 * Get single order details by ID
 * GET /api/orders/:id
 *
 * @param orderId - Order ID
 * @returns Order details
 */
export const getOrderById = async (orderId: string): Promise<OrderResponse> => {
  const response = await apiClient.get<OrderResponse>(`/orders/${orderId}`);
  return response;
};

/**
 * Get customer's order history with advanced filters
 * GET /api/orders/history
 *
 * @param filters - Advanced filters
 * @returns Order history
 */
export const getOrderHistory = async (
  filters?: OrderFilters & {
    paymentStatus?: string;
    minAmount?: number;
    maxAmount?: number;
    search?: string;
  }
): Promise<OrdersResponse> => {
  const params = new URLSearchParams();

  if (filters?.status) params.append("status", filters.status);
  if (filters?.paymentStatus)
    params.append("paymentStatus", filters.paymentStatus);
  if (filters?.startDate) params.append("startDate", filters.startDate);
  if (filters?.endDate) params.append("endDate", filters.endDate);
  if (filters?.minAmount)
    params.append("minAmount", filters.minAmount.toString());
  if (filters?.maxAmount)
    params.append("maxAmount", filters.maxAmount.toString());
  if (filters?.search) params.append("search", filters.search);
  if (filters?.page) params.append("page", filters.page.toString());
  if (filters?.limit) params.append("limit", filters.limit.toString());
  if (filters?.sortBy) params.append("sortBy", filters.sortBy);
  if (filters?.sortOrder) params.append("sortOrder", filters.sortOrder);

  const queryString = params.toString();
  const url = queryString ? `/orders/history?${queryString}` : "/orders/history";

  const response = await apiClient.get<OrdersResponse>(url);
  return response;
};

/**
 * Get customer's order statistics
 * GET /api/orders/stats/customer
 *
 * @returns Order statistics
 */
export const getCustomerOrderStats =
  async (): Promise<OrderStatsResponse> => {
    const response = await apiClient.get<OrderStatsResponse>(
      "/orders/stats/customer"
    );
    return response;
  };

/**
 * Cancel an order
 * POST /api/orders/:id/cancel
 *
 * @param orderId - Order ID to cancel
 * @param data - Cancellation data (reason)
 * @returns Cancellation result
 */
export const cancelOrder = async (
  orderId: string,
  data: CancelOrderData
): Promise<ApiResponse> => {
  const response = await apiClient.post<ApiResponse>(
    `/orders/${orderId}/cancel`,
    data
  );
  return response;
};

/**
 * Track order by ID
 * GET /api/orders/:id/track
 *
 * @param orderId - Order ID to track
 * @returns Tracking information
 */
export const trackOrder = async (orderId: string): Promise<ApiResponse> => {
  const response = await apiClient.get<ApiResponse>(`/orders/${orderId}/track`);
  return response;
};

/**
 * Get order tracking details
 * GET /api/orders/:id/tracking
 *
 * @param orderId - Order ID
 * @returns Detailed tracking information
 */
export const getOrderTracking = async (
  orderId: string
): Promise<ApiResponse> => {
  const response = await apiClient.get<ApiResponse>(
    `/orders/${orderId}/tracking`
  );
  return response;
};

/**
 * Get order timeline (all status changes and events)
 * GET /api/orders/:id/timeline
 *
 * @param orderId - Order ID
 * @returns Order timeline
 */
export const getOrderTimeline = async (
  orderId: string
): Promise<ApiResponse> => {
  const response = await apiClient.get<ApiResponse>(
    `/orders/${orderId}/timeline`
  );
  return response;
};

/**
 * Check if order can be cancelled
 * GET /api/orders/:id/cancellation-eligibility
 *
 * @param orderId - Order ID
 * @returns Cancellation eligibility
 */
export const checkCancellationEligibility = async (
  orderId: string
): Promise<ApiResponse> => {
  const response = await apiClient.get<ApiResponse>(
    `/orders/${orderId}/cancellation-eligibility`
  );
  return response;
};

/**
 * Request order cancellation (for orders in processing)
 * POST /api/orders/:id/cancel/request
 *
 * @param orderId - Order ID
 * @param data - Cancellation request data
 * @returns Request result
 */
export const requestOrderCancellation = async (
  orderId: string,
  data: { reason: string; reasonDetails?: string }
): Promise<ApiResponse> => {
  const response = await apiClient.post<ApiResponse>(
    `/orders/${orderId}/cancel/request`,
    data
  );
  return response;
};

/**
 * Request order return
 * POST /api/orders/:id/return
 *
 * @param orderId - Order ID
 * @param data - Return request data
 * @returns Return request result
 */
export const requestOrderReturn = async (
  orderId: string,
  data: { reason: string; items?: string[] }
): Promise<ApiResponse> => {
  const response = await apiClient.post<ApiResponse>(
    `/orders/${orderId}/return`,
    data
  );
  return response;
};

/**
 * Submit order review
 * POST /api/orders/:id/review
 *
 * @param orderId - Order ID
 * @param data - Review data
 * @returns Review submission result
 */
export const submitOrderReview = async (
  orderId: string,
  data: { rating: number; comment?: string }
): Promise<ApiResponse> => {
  const response = await apiClient.post<ApiResponse>(
    `/orders/${orderId}/review`,
    data
  );
  return response;
};

/**
 * Get order invoice
 * GET /api/orders/invoice/:id
 *
 * @param orderId - Order ID
 * @returns Invoice data
 */
export const getOrderInvoice = async (
  orderId: string
): Promise<ApiResponse> => {
  const response = await apiClient.get<ApiResponse>(
    `/orders/invoice/${orderId}`
  );
  return response;
};

/**
 * Get blockchain history for an order
 * GET /api/orders/:id/blockchain
 *
 * @param orderId - Order ID
 * @returns Blockchain transaction history
 */
export const getOrderBlockchainHistory = async (
  orderId: string
): Promise<ApiResponse> => {
  const response = await apiClient.get<ApiResponse>(
    `/orders/${orderId}/blockchain`
  );
  return response;
};
