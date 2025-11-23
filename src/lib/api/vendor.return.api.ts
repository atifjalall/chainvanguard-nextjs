/**
 * Vendor Returns API
 * All API calls related to managing customer returns
 */

import { apiClient } from "./client";
import type { ApiResponse } from "@/types";

// ========================================
// TYPES
// ========================================

export type ReturnStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "item_received"
  | "inspected"
  | "refunded"
  | "cancelled";

export type ReturnReason =
  | "defective"
  | "damaged"
  | "wrong_item"
  | "not_as_described"
  | "late_delivery"
  | "size_issue"
  | "changed_mind"
  | "quality_issues"
  | "other";

export interface ReturnItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
  reason?: string;
  condition?: string;
}

export interface ReturnRequest {
  _id: string;
  returnNumber: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  vendorId: string;
  vendorName: string;
  items: ReturnItem[];
  reason: ReturnReason;
  reasonDetails: string;
  returnAmount: number;
  refundAmount: number;
  restockingFee: number;
  shippingRefund: number;
  images: string[];
  status: ReturnStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  returnDeadline?: string;
  refundedAt?: string;
  refundTransactionId?: string;
  blockchainTxId?: string;
  blockchainVerified?: boolean;
  statusHistory?: Array<{
    status: ReturnStatus;
    timestamp: string;
    notes?: string;
    changedBy?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnFilters {
  status?: ReturnStatus;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "returnAmount" | "status";
  sortOrder?: "asc" | "desc";
  search?: string;
}

export interface ReturnsResponse extends ApiResponse {
  returns: ReturnRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ReturnResponse extends ApiResponse {
  return: ReturnRequest;
}

export interface VendorReturnStats {
  total: number;
  requested: number;
  approved: number;
  rejected: number;
  refunded: number;
  totalRefunded: number;
  pendingAmount: number;
}

export interface ReturnStatsResponse extends ApiResponse {
  stats: VendorReturnStats;
}

export type ItemCondition = "good" | "damaged" | "unsellable";

export interface RestockData {
  condition: ItemCondition;
  notes?: string;
}

// ========================================
// VENDOR RETURN FUNCTIONS
// ========================================

/**
 * Get vendor's returns with filtering and pagination
 * GET /api/returns/vendor
 */
export const getVendorReturns = async (
  filters?: ReturnFilters
): Promise<ReturnsResponse> => {
  const params = new URLSearchParams();

  if (filters?.status) params.append("status", filters.status);
  if (filters?.page) params.append("page", filters.page.toString());
  if (filters?.limit) params.append("limit", filters.limit.toString());
  if (filters?.sortBy) params.append("sortBy", filters.sortBy);
  if (filters?.sortOrder) params.append("sortOrder", filters.sortOrder);
  if (filters?.search) params.append("search", filters.search);

  const queryString = params.toString();
  const url = queryString
    ? `/returns/vendor?${queryString}`
    : "/returns/vendor";

  const response = await apiClient.get<ReturnsResponse>(url);
  return response;
};

/**
 * Get single return details by ID
 * GET /api/returns/:id
 */
export const getReturnById = async (
  returnId: string
): Promise<ReturnResponse> => {
  const response = await apiClient.get<ReturnResponse>(`/returns/${returnId}`);
  return response;
};

/**
 * Get vendor return statistics
 * GET /api/returns/vendor/stats
 */
export const getVendorReturnStats = async (): Promise<ReturnStatsResponse> => {
  const response = await apiClient.get<ReturnStatsResponse>(
    "/returns/vendor/stats"
  );
  return response;
};

/**
 * Approve a return request
 * PATCH /api/returns/:id/approve
 */
export const approveReturn = async (
  returnId: string,
  data: {
    reviewNotes?: string;
    refundAmount?: number;
    restockingFee?: number;
    shippingRefund?: number;
  }
): Promise<ReturnResponse> => {
  const response = await apiClient.patch<ReturnResponse>(
    `/returns/${returnId}/approve`,
    data
  );
  return response;
};

/**
 * Reject a return request
 * PATCH /api/returns/:id/reject
 */
export const rejectReturn = async (
  returnId: string,
  data: {
    rejectionReason: string;
  }
): Promise<ReturnResponse> => {
  const response = await apiClient.patch<ReturnResponse>(
    `/returns/${returnId}/reject`,
    data
  );
  return response;
};

/**
 * Mark return as item received
 * PATCH /api/returns/:id/item-received
 */
export const markItemReceived = async (
  returnId: string,
  data?: {
    notes?: string;
  }
): Promise<ReturnResponse> => {
  const response = await apiClient.patch<ReturnResponse>(
    `/returns/${returnId}/item-received`,
    data || {}
  );
  return response;
};

/**
 * Mark return as inspected
 * PATCH /api/returns/:id/inspected
 */
export const markInspected = async (
  returnId: string,
  data: {
    notes?: string;
    condition?: string;
  }
): Promise<ReturnResponse> => {
  const response = await apiClient.patch<ReturnResponse>(
    `/returns/${returnId}/inspected`,
    data
  );
  return response;
};

/**
 * Process refund
 * PATCH /api/returns/:id/refund
 */
export const processRefund = async (
  returnId: string,
  data?: {
    notes?: string;
  }
): Promise<ReturnResponse> => {
  const response = await apiClient.patch<ReturnResponse>(
    `/returns/${returnId}/refund`,
    data || {}
  );
  return response;
};

/**
 * Cancel a return request
 * PATCH /api/returns/:id/cancel
 */
export const cancelReturn = async (
  returnId: string,
  data: {
    reason: string;
  }
): Promise<ReturnResponse> => {
  const response = await apiClient.patch<ReturnResponse>(
    `/returns/${returnId}/cancel`,
    data
  );
  return response;
};

/**
 * Restock inventory after inspection
 * PATCH /api/returns/:id/restock
 *
 * This handles returning stock to inventory based on condition:
 * - 'good': Adds back to available stock
 * - 'damaged': Marks as damaged inventory
 * - 'unsellable': Logs as write-off (no stock added)
 */
export const restockInventory = async (
  returnId: string,
  data: RestockData
): Promise<ReturnResponse> => {
  const response = await apiClient.patch<ReturnResponse>(
    `/returns/${returnId}/restock`,
    data
  );
  return response;
};
