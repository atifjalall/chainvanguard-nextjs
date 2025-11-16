/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "./client";
import { ApiResponse } from "@/types";

/**
 * ========================================
 * VENDOR REQUEST API
 * Complete vendor request management for material procurement
 * ========================================
 */

// ========================================
// TYPE DEFINITIONS
// ========================================

export interface RequestInventoryItem {
  inventoryId: string;
  quantity: number;
  notes?: string;
}

export interface CreateRequestData {
  supplierId: string;
  items: RequestInventoryItem[];
  vendorNotes?: string;
}

export interface CreateRequestResponse extends ApiResponse {
  data: {
    requestId: string;
    requestNumber: string;
    status: "pending" | "approved" | "rejected" | "cancelled" | "completed";
    total: number;
    subtotal: number;
    tax: number;
    items: Array<{
      inventoryId: string;
      inventoryName: string;
      quantity: number;
      pricePerUnit: number;
      subtotal: number;
    }>;
    createdAt: string;
  };
}

export interface VendorRequest {
  _id: string;
  requestNumber: string;
  supplierId: {
    _id: string;
    name: string;
    email: string;
    companyName?: string;
  };
  vendorId: {
    _id: string;
    name: string;
    email: string;
    companyName?: string;
  };
  items: Array<{
    inventoryId: string;
    inventoryName?: string;
    quantity: number;
    pricePerUnit: number;
    subtotal: number;
    inventory?: {
      _id: string;
      name: string;
      category?: string;
      unit?: string;
    };
  }>;
  subtotal: number;
  tax: number;
  total: number;
  status: "pending" | "approved" | "rejected" | "cancelled" | "completed";
  vendorNotes?: string;
  supplierNotes?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  autoApproved?: boolean;
  orderId?: string;
  isCompleted: boolean;
  completedAt?: string;
  blockchainTxId?: string;
  blockchainVerified: boolean;
  blockchainRequestId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetRequestsParams {
  status?: "pending" | "approved" | "rejected" | "cancelled" | "completed";
  supplierId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface GetRequestsResponse extends ApiResponse {
  requests: VendorRequest[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface RequestStatsResponse extends ApiResponse {
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
    completed: number;
    totalValue: number;
    avgRequestValue: number;
  };
}

export interface RequestDetailsResponse extends ApiResponse {
  request: VendorRequest;
}

export interface ApprovedRequest {
  _id: string;
  requestNumber: string;
  supplierId: {
    _id: string;
    name: string;
    companyName?: string;
  };
  items: Array<{
    inventoryName: string;
    quantity: number;
    pricePerUnit: number;
    subtotal: number;
  }>;
  total: number;
  approvedAt: string;
  vendorNotes?: string;
  supplierNotes?: string;
}

export interface ApprovedRequestsResponse extends ApiResponse {
  requests: ApprovedRequest[];
  totalAmount: number;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface PaymentResponse extends ApiResponse {
  data: {
    order: {
      orderId: string;
      orderNumber: string;
      total: number;
      paymentStatus: string;
      transactionHash?: string;
    };
    request: {
      requestId: string;
      status: string;
    };
    wallet: {
      newBalance: number;
      transactionId: string;
    };
  };
}

export interface RequestHistory {
  timestamp: string;
  action: string;
  performedBy: string;
  performedByRole: string;
  status?: string;
  notes?: string;
  blockchainTxId?: string;
}

export interface RequestHistoryResponse extends ApiResponse {
  history: RequestHistory[];
  request: {
    requestNumber: string;
    currentStatus: string;
  };
}

export interface BlockchainVerification extends ApiResponse {
  mongoData: {
    id: string;
    requestNumber: string;
    status: string;
    total: number;
    blockchainVerified: boolean;
    blockchainTxId?: string;
  };
  blockchain: {
    onBlockchain: boolean;
    data?: any;
  };
  synced: boolean;
}

// ========================================
// REQUEST MANAGEMENT FUNCTIONS
// ========================================

/**
 * Create new vendor request for inventory items
 * POST /api/vendor-requests
 *
 * @param data - Request data with supplier, items, and notes
 * @returns Created request details
 *
 * @example
 * const request = await createRequest({
 *   supplierId: 'sup_123456',
 *   items: [
 *     { inventoryId: 'inv_001', quantity: 100, notes: 'Urgent delivery' },
 *     { inventoryId: 'inv_002', quantity: 50 }
 *   ],
 *   vendorNotes: 'Need by next Friday'
 * });
 */
export const createRequest = async (
  data: CreateRequestData
): Promise<CreateRequestResponse> => {
  const response = await apiClient.post<CreateRequestResponse>(
    "/vendor-requests",
    data
  );
  return response;
};

/**
 * Get vendor's own requests with filters
 * GET /api/vendor-requests/my-requests
 *
 * @param params - Filter and pagination parameters
 * @returns Paginated list of vendor's requests
 *
 * @example
 * const requests = await getMyRequests({
 *   status: 'pending',
 *   page: 1,
 *   limit: 20,
 *   sortBy: 'createdAt',
 *   sortOrder: 'desc'
 * });
 */
export const getMyRequests = async (
  params?: GetRequestsParams
): Promise<GetRequestsResponse> => {
  const queryParams = new URLSearchParams();

  if (params?.status) queryParams.append("status", params.status);
  if (params?.supplierId) queryParams.append("supplierId", params.supplierId);
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
  if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);

  const url = `/vendor-requests/my-requests${
    queryParams.toString() ? `?${queryParams.toString()}` : ""
  }`;
  const response = await apiClient.get<GetRequestsResponse>(url);
  return response;
};

/**
 * Get vendor request statistics
 * GET /api/vendor-requests/stats
 *
 * @returns Statistics about vendor's requests
 *
 * @example
 * const stats = await getRequestStats();
 * // Returns: { total: 45, pending: 12, approved: 20, totalValue: 150000, ... }
 */
export const getRequestStats = async (): Promise<RequestStatsResponse> => {
  const response = await apiClient.get<RequestStatsResponse>(
    "/vendor-requests/stats"
  );
  return response;
};

/**
 * Get single request details
 * GET /api/vendor-requests/:id
 *
 * @param requestId - ID of the request
 * @returns Detailed request information
 *
 * @example
 * const request = await getRequestById('req_123456');
 */
export const getRequestById = async (
  requestId: string
): Promise<RequestDetailsResponse> => {
  const response = await apiClient.get<RequestDetailsResponse>(
    `/vendor-requests/${requestId}`
  );
  return response;
};

/**
 * Cancel a pending request
 * POST /api/vendor-requests/:id/cancel
 *
 * @param requestId - ID of the request to cancel
 * @returns Success response
 *
 * @example
 * await cancelRequest('req_123456');
 */
export const cancelRequest = async (
  requestId: string
): Promise<ApiResponse> => {
  const response = await apiClient.post<ApiResponse>(
    `/vendor-requests/${requestId}/cancel`
  );
  return response;
};

// ========================================
// APPROVED REQUESTS & PAYMENT FUNCTIONS
// ========================================

/**
 * Get approved requests ready for payment
 * GET /api/vendor-requests/approved
 *
 * @returns List of approved requests awaiting payment
 *
 * @example
 * const approvedRequests = await getApprovedRequests();
 */
export const getApprovedRequests =
  async (): Promise<ApprovedRequestsResponse> => {
    const response = await apiClient.get<ApprovedRequestsResponse>(
      "/vendor-requests/approved"
    );
    return response;
  };

/**
 * Process payment for approved request
 * POST /api/vendor-requests/:id/pay
 *
 * @param requestId - ID of the approved request
 * @param shippingAddress - Delivery address for the order
 * @returns Payment and order details
 *
 * @example
 * const result = await payForRequest('req_123456', {
 *   name: 'John Doe',
 *   phone: '+92-300-1234567',
 *   addressLine1: '123 Main Street',
 *   city: 'Karachi',
 *   state: 'Sindh',
 *   postalCode: '75500',
 *   country: 'Pakistan'
 * });
 */
export const payForRequest = async (
  requestId: string,
  shippingAddress: ShippingAddress
): Promise<PaymentResponse> => {
  const response = await apiClient.post<PaymentResponse>(
    `/vendor-requests/${requestId}/pay`,
    {
      shippingAddress,
    }
  );
  return response;
};

/**
 * Cancel an approved request before payment
 * POST /api/vendor-requests/:id/cancel-approved
 *
 * @param requestId - ID of the approved request
 * @param cancellationReason - Reason for cancellation
 * @returns Success response
 *
 * @example
 * await cancelApprovedRequest('req_123456', 'Found better alternative supplier');
 */
export const cancelApprovedRequest = async (
  requestId: string,
  cancellationReason: string
): Promise<ApiResponse> => {
  const response = await apiClient.post<ApiResponse>(
    `/vendor-requests/${requestId}/cancel-approved`,
    { cancellationReason }
  );
  return response;
};

// ========================================
// BLOCKCHAIN & AUDIT FUNCTIONS
// ========================================

/**
 * Get request history (blockchain audit trail)
 * GET /api/vendor-requests/:id/history
 *
 * @param requestId - ID of the request
 * @returns Complete history of request changes
 *
 * @example
 * const history = await getRequestHistory('req_123456');
 * // Returns array of all actions performed on the request
 */
export const getRequestHistory = async (
  requestId: string
): Promise<RequestHistoryResponse> => {
  const response = await apiClient.get<RequestHistoryResponse>(
    `/vendor-requests/${requestId}/history`
  );
  return response;
};

/**
 * Verify request on blockchain
 * GET /api/vendor-requests/blockchain/verify/:id
 *
 * @param requestId - ID of the request
 * @returns Blockchain verification status
 *
 * @example
 * const verification = await verifyRequestOnBlockchain('req_123456');
 * // Returns: { synced: true, mongoData: {...}, blockchain: {...} }
 */
export const verifyRequestOnBlockchain = async (
  requestId: string
): Promise<BlockchainVerification> => {
  const response = await apiClient.get<BlockchainVerification>(
    `/vendor-requests/blockchain/verify/${requestId}`
  );
  return response;
};

// ========================================
// BULK OPERATIONS
// ========================================

/**
 * Cancel multiple pending requests at once
 *
 * @param requestIds - Array of request IDs to cancel
 * @returns Results of bulk cancellation
 *
 * @example
 * const results = await cancelMultipleRequests(['req_001', 'req_002', 'req_003']);
 */
export const cancelMultipleRequests = async (
  requestIds: string[]
): Promise<{
  success: boolean;
  cancelled: string[];
  failed: Array<{ requestId: string; error: string }>;
}> => {
  const results = await Promise.allSettled(
    requestIds.map((id) => cancelRequest(id))
  );

  const cancelled: string[] = [];
  const failed: Array<{ requestId: string; error: string }> = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      cancelled.push(requestIds[index]);
    } else {
      failed.push({
        requestId: requestIds[index],
        error: result.reason?.message || "Unknown error",
      });
    }
  });

  return {
    success: failed.length === 0,
    cancelled,
    failed,
  };
};

/**
 * Get requests grouped by status
 *
 * @returns Requests organized by their status
 *
 * @example
 * const grouped = await getRequestsByStatus();
 * // Returns: { pending: [...], approved: [...], rejected: [...], ... }
 */
export const getRequestsByStatus = async (): Promise<{
  pending: VendorRequest[];
  approved: VendorRequest[];
  rejected: VendorRequest[];
  cancelled: VendorRequest[];
  completed: VendorRequest[];
}> => {
  const statuses: Array<
    "pending" | "approved" | "rejected" | "cancelled" | "completed"
  > = ["pending", "approved", "rejected", "cancelled", "completed"];

  const results = await Promise.all(
    statuses.map((status) =>
      getMyRequests({ status, limit: 100 }).then((res) => ({
        status,
        requests: res.requests,
      }))
    )
  );

  return results.reduce(
    (acc, { status, requests }) => ({
      ...acc,
      [status]: requests,
    }),
    {} as any
  );
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Calculate total value of pending requests
 *
 * @returns Total amount of pending requests
 *
 * @example
 * const total = await getPendingRequestsTotal();
 * // Returns: 145000
 */
export const getPendingRequestsTotal = async (): Promise<number> => {
  const response = await getMyRequests({ status: "pending", limit: 1000 });
  return response.requests.reduce((sum, req) => sum + req.total, 0);
};

/**
 * Check if vendor has any pending requests with a supplier
 *
 * @param supplierId - ID of the supplier
 * @returns Boolean indicating if pending requests exist
 *
 * @example
 * const hasPending = await hasPendingRequestsWithSupplier('sup_123456');
 */
export const hasPendingRequestsWithSupplier = async (
  supplierId: string
): Promise<boolean> => {
  const response = await getMyRequests({
    status: "pending",
    supplierId,
    limit: 1,
  });
  return response.requests.length > 0;
};

// ========================================
// EXPORT ALL FUNCTIONS AS DEFAULT OBJECT
// ========================================

const vendorRequestApi = {
  // Request Management (5 functions)
  createRequest,
  getMyRequests,
  getRequestStats,
  getRequestById,
  cancelRequest,

  // Approved Requests & Payment (3 functions)
  getApprovedRequests,
  payForRequest,
  cancelApprovedRequest,

  // Blockchain & Audit (2 functions)
  getRequestHistory,
  verifyRequestOnBlockchain,

  // Bulk Operations (2 functions)
  cancelMultipleRequests,
  getRequestsByStatus,

  // Utilities (2 functions)
  getPendingRequestsTotal,
  hasPendingRequestsWithSupplier,
};

export default vendorRequestApi;
