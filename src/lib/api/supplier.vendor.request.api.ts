/* eslint-disable import/no-anonymous-default-export */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "./client";
import type {
  VendorRequest,
  VendorRequestListResponse,
  VendorRequestResponse,
  VendorRequestStatsResponse,
  CreateVendorRequestData,
  ApproveRequestData,
  RejectRequestData,
} from "@/types";

// ========================================
// SUPPLIER ENDPOINTS
// ========================================

/**
 * Get all vendor requests for supplier
 * Query params: status, page, limit, sortBy, sortOrder
 */
export async function getSupplierRequests(params?: {
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<VendorRequestListResponse> {
  const response = await apiClient.get<VendorRequestListResponse>(
    "/vendor-requests/supplier/requests",
    { params }
  );
  return response;
}

/**
 * Get vendor request statistics for supplier
 */
export async function getRequestStats(): Promise<VendorRequestStatsResponse> {
  const response = await apiClient.get<VendorRequestStatsResponse>(
    "/vendor-requests/supplier/stats"
  );
  return response;
}

/**
 * Get single vendor request by ID
 */
export async function getRequestById(
  id: string
): Promise<VendorRequestResponse> {
  const response = await apiClient.get<VendorRequestResponse>(
    `/vendor-requests/${id}`
  );
  return response;
}

/**
 * Approve vendor request
 * Body: { supplierNotes?: string }
 */
export async function approveRequest(
  id: string,
  data: ApproveRequestData
): Promise<VendorRequestResponse> {
  const response = await apiClient.post<VendorRequestResponse>(
    `/vendor-requests/${id}/approve`,
    data
  );
  return response;
}

/**
 * Reject vendor request
 * Body: { rejectionReason: string (required) }
 */
export async function rejectRequest(
  id: string,
  data: RejectRequestData
): Promise<VendorRequestResponse> {
  const response = await apiClient.post<VendorRequestResponse>(
    `/vendor-requests/${id}/reject`,
    data
  );
  return response;
}

/**
 * Complete vendor request (moves to transactions)
 * Body: { notes?: string }
 */
export async function completeRequest(
  id: string,
  data?: { notes?: string }
): Promise<VendorRequestResponse> {
  const response = await apiClient.post<VendorRequestResponse>(
    `/vendor-requests/${id}/complete`,
    data || {}
  );
  return response;
}

/**
 * Get supplier settings (auto-approve, etc.)
 */
export async function getSupplierSettings(): Promise<{
  success: boolean;
  settings: {
    autoApproveRequests: boolean;
    minOrderValue?: number;
    discountForRewards?: number;
    rewardPointsRate?: number;
  };
}> {
  const response = await apiClient.get<{
    success: boolean;
    settings: {
      autoApproveRequests: boolean;
      minOrderValue?: number;
      discountForRewards?: number;
      rewardPointsRate?: number;
    };
  }>("/vendor-requests/supplier/settings");
  return response;
}

/**
 * Update supplier settings
 */
export async function updateSupplierSettings(settings: {
  autoApproveRequests?: boolean;
  minOrderValue?: number;
  discountForRewards?: number;
  rewardPointsRate?: number;
}): Promise<{
  success: boolean;
  message: string;
  settings: any;
}> {
  const response = await apiClient.patch<{
    success: boolean;
    message: string;
    settings: any;
  }>("/vendor-requests/supplier/settings", settings);
  return response;
}

/**
 * Toggle auto-approve setting
 */
export async function toggleAutoApprove(): Promise<{
  success: boolean;
  message: string;
  autoApproveRequests: boolean;
}> {
  const response = await apiClient.patch<{
    success: boolean;
    message: string;
    autoApproveRequests: boolean;
  }>("/vendor-requests/supplier/auto-approve");
  return response;
}

// ========================================
// VENDOR ENDPOINTS
// ========================================

/**
 * Create new vendor request
 * Body: { supplierId, items: [{ inventoryId, quantity }], vendorNotes? }
 */
export async function createRequest(
  data: CreateVendorRequestData
): Promise<VendorRequestResponse> {
  const response = await apiClient.post<VendorRequestResponse>(
    "/vendor-requests",
    data
  );
  return response;
}

/**
 * Get vendor's own requests
 * Query params: status, supplierId, page, limit, sortBy, sortOrder
 */
export async function getVendorRequests(params?: {
  status?: string;
  supplierId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<VendorRequestListResponse> {
  const response = await apiClient.get<VendorRequestListResponse>(
    "/vendor-requests/my-requests",
    { params }
  );
  return response;
}

/**
 * Cancel vendor's own request (only if status is pending)
 */
export async function cancelRequest(
  id: string
): Promise<VendorRequestResponse> {
  const response = await apiClient.post<VendorRequestResponse>(
    `/vendor-requests/${id}/cancel`
  );
  return response;
}

/**
 * Get approved requests ready for payment
 */
export async function getApprovedRequests(): Promise<{
  success: boolean;
  count: number;
  data: VendorRequest[];
  message: string;
}> {
  const response = await apiClient.get<{
    success: boolean;
    count: number;
    data: VendorRequest[];
    message: string;
  }>("/vendor-requests/approved");
  return response;
}

/**
 * Pay for approved request and create order
 * Body: { shippingAddress: {...} }
 */
export async function payForRequest(
  id: string,
  shippingAddress: {
    name: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }
): Promise<{
  success: boolean;
  message: string;
  data: {
    vendorRequest: VendorRequest;
    order: any;
    payment: any;
  };
}> {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
    data: {
      vendorRequest: VendorRequest;
      order: any;
      payment: any;
    };
  }>(`/vendor-requests/${id}/pay`, {
    shippingAddress,
  });
  return response;
}

/**
 * Cancel approved request before payment
 * Body: { cancellationReason: string (required) }
 */
export async function cancelApprovedRequest(
  id: string,
  cancellationReason: string
): Promise<VendorRequestResponse> {
  const response = await apiClient.post<VendorRequestResponse>(
    `/vendor-requests/${id}/cancel-approved`,
    { cancellationReason }
  );
  return response;
}

// ========================================
// BLOCKCHAIN ENDPOINTS
// ========================================

/**
 * Get blockchain history for request (audit trail)
 */
export async function getRequestHistory(id: string): Promise<{
  success: boolean;
  request: {
    id: string;
    requestNumber: string;
    status: string;
    total: number;
    createdAt: string;
    blockchainVerified: boolean;
    blockchainTxId?: string;
  };
  blockchainHistory: any[];
}> {
  const response = await apiClient.get<{
    success: boolean;
    request: {
      id: string;
      requestNumber: string;
      status: string;
      total: number;
      createdAt: string;
      blockchainVerified: boolean;
      blockchainTxId?: string;
    };
    blockchainHistory: any[];
  }>(`/vendor-requests/${id}/history`);
  return response;
}

/**
 * Verify if request exists on blockchain
 */
export async function verifyRequestOnBlockchain(id: string): Promise<{
  success: boolean;
  mongoData: any;
  blockchain: {
    onBlockchain: boolean;
    data: any;
  };
  synced: boolean;
}> {
  const response = await apiClient.get<{
    success: boolean;
    mongoData: any;
    blockchain: {
      onBlockchain: boolean;
      data: any;
    };
    synced: boolean;
  }>(`/vendor-requests/blockchain/verify/${id}`);
  return response;
}

// ========================================
// VENDOR TRANSACTION API
// ========================================

export interface VendorTransaction {
  requestId: string;
  requestNumber: string;
  requestStatus: string;
  requestDate: string;
  supplier: {
    id: string;
    name: string;
    email: string;
    companyName: string;
  };
  amount: {
    subtotal: number;
    tax: number;
    total: number;
  };
  items: Array<{
    inventoryId: string;
    name: string;
    quantity: number;
    pricePerUnit: number;
    total: number;
  }>;
  itemCount: number;
  vendorNotes?: string;
  supplierNotes?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  order?: {
    orderId: string;
    orderNumber: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    shippingAddress: any;
    trackingNumber?: string;
    trackingUrl?: string;
    courierName?: string;
    estimatedDeliveryDate?: string;
    actualDeliveryDate?: string;
    statusHistory: any[];
    currentStatus: {
      status: string;
      lastUpdate: string;
    };
  };
  inventory: {
    created: boolean;
    itemCount: number;
    items: Array<{
      inventoryId: string;
      name: string;
      quantity: number;
      status: string;
    }>;
  };
  blockchain: {
    verified: boolean;
    txId?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TransactionListResponse {
  success: boolean;
  data: VendorTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface TransactionStatsResponse {
  success: boolean;
  stats: {
    statusBreakdown: Array<{
      _id: string;
      count: number;
      totalAmount: number;
    }>;
    totalSpent: number;
    pendingRequests: number;
    ordersInTransit: number;
    recentTransactions: Array<{
      requestId: string;
      requestNumber: string;
      supplier: string;
      amount: number;
      status: string;
      date: string;
    }>;
  };
  timeframe: string;
}

export interface OrderTrackingResponse {
  success: boolean;
  data: Array<{
    requestId: string;
    requestNumber: string;
    order: {
      orderId: string;
      orderNumber: string;
      status: string;
      createdAt: string;
      items: any[];
      shippingAddress: any;
      trackingNumber?: string;
      trackingUrl?: string;
      courierName?: string;
      estimatedDeliveryDate?: string;
      actualDeliveryDate?: string;
      statusHistory: any[];
      currentStatus: {
        status: string;
        lastUpdate: string;
      };
    };
    supplier: {
      name: string;
      companyName: string;
    };
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Get all vendor transactions (completed requests with orders)
 * @param params - Query parameters for filtering and pagination
 */
export async function getVendorTransactions(params?: {
  status?: string;
  orderStatus?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  startDate?: string;
  endDate?: string;
  supplierId?: string;
}): Promise<TransactionListResponse> {
  const response = await apiClient.get<TransactionListResponse>(
    "/vendor/transactions",
    { params }
  );
  return response;
}

/**
 * Get detailed transaction information by request ID
 * @param requestId - The vendor request ID
 */
export async function getTransactionById(requestId: string): Promise<{
  success: boolean;
  data: {
    request: any;
    order: any;
    inventory: any;
    timeline: any[];
  };
}> {
  const response = await apiClient.get<{
    success: boolean;
    data: {
      request: any;
      order: any;
      inventory: any;
      timeline: any[];
    };
  }>(`/vendor/transactions/${requestId}`);
  return response;
}

/**
 * Get vendor transaction statistics
 * @param timeframe - Time period for stats (week, month, year)
 */
export async function getTransactionStats(
  timeframe: "week" | "month" | "year" = "month"
): Promise<TransactionStatsResponse> {
  const response = await apiClient.get<TransactionStatsResponse>(
    "/vendor/stats",
    { params: { timeframe } }
  );
  return response;
}

/**
 * Get all orders with tracking information
 * @param params - Query parameters for filtering
 */
export async function getOrderTracking(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<OrderTrackingResponse> {
  const response = await apiClient.get<OrderTrackingResponse>(
    "/vendor/orders/tracking",
    { params }
  );
  return response;
}

// ========================================
// EXPORT DEFAULT
// ========================================

export default {
  // Supplier
  getSupplierRequests,
  getRequestStats,
  getRequestById,
  approveRequest,
  rejectRequest,
  completeRequest,
  getSupplierSettings,
  updateSupplierSettings,
  toggleAutoApprove,

  // Vendor
  createRequest,
  getVendorRequests,
  cancelRequest,
  getApprovedRequests,
  payForRequest,
  cancelApprovedRequest,

  // Blockchain
  getRequestHistory,
  verifyRequestOnBlockchain,

  getVendorTransactions,
  getTransactionById,
  getTransactionStats,
  getOrderTracking,
};
