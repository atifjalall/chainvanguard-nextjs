/* eslint-disable import/no-anonymous-default-export */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "./client";

// ========================================
// TYPES
// ========================================

export interface VendorCustomer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  isActive: boolean;
  createdAt: string;
  stats: {
    totalRequests: number;
    totalAmount: number;
    avgRequestValue: number;
    lastRequestDate?: string;
    pendingRequests: number;
    completedRequests: number;
    approvedCount?: number;
    rejectedCount?: number;
    cancelledCount?: number;
  };
}

export interface VendorCustomerListResponse {
  success: boolean;
  vendors: VendorCustomer[];
  customers: VendorCustomer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface VendorCustomerDetailResponse {
  success: boolean;
  vendor: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    companyName?: string;
    address: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
    };
    isActive: boolean;
    memberSince: string;
  };
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    companyName?: string;
    address: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
    };
    isActive: boolean;
    memberSince: string;
  };
  statistics: {
    totalRequests: number;
    totalAmount: number;
    avgRequestValue: number;
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    completedCount: number;
    cancelledCount: number;
    approvalRate: string;
    firstRequestDate?: string;
    lastRequestDate?: string;
    requestsByStatus: {
      pending: number;
      approved: number;
      rejected: number;
      completed: number;
      cancelled: number;
    };
  };
  stats: {
    totalRequests: number;
    totalAmount: number;
    avgRequestValue: number;
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    completedCount: number;
    cancelledCount: number;
    approvalRate: string;
    firstRequestDate?: string;
    lastRequestDate?: string;
    requestsByStatus: {
      pending: number;
      approved: number;
      rejected: number;
      completed: number;
      cancelled: number;
    };
  };
  recentRequests: Array<{
    id: string;
    requestNumber: string;
    amount: number;
    status: string;
    itemCount: number;
    date: string;
  }>;
}

export interface TopVendorsResponse {
  success: boolean;
  vendors: Array<{
    vendorId: string;
    vendorName: string;
    companyName?: string;
    totalAmount: number;
    totalRequests: number;
    avgRequestValue: number;
  }>;
}

// ========================================
// API FUNCTIONS
// ========================================

/**
 * Get all vendor customers (businesses that buy from this supplier)
 * Query params: page, limit, search, sortBy, sortOrder, minOrders, minAmount, status
 */
export async function getVendorCustomers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  minOrders?: number;
  minAmount?: number;
  status?: "active" | "inactive" | "all";
}): Promise<VendorCustomerListResponse> {
  const response = await apiClient.get<VendorCustomerListResponse>(
    "/vendor-customers",
    { params }
  );
  return response;
}

/**
 * Get detailed information about a specific vendor customer
 * @param vendorId - The vendor's user ID
 */
export async function getVendorCustomerById(
  vendorId: string
): Promise<VendorCustomerDetailResponse> {
  const response = await apiClient.get<VendorCustomerDetailResponse>(
    `/vendor-customers/${vendorId}`
  );
  return response;
}

/**
 * Get top performing vendors
 * @param limit - Number of top vendors to return (default: 10)
 */
export async function getTopVendors(
  limit: number = 10
): Promise<TopVendorsResponse> {
  const response = await apiClient.get<TopVendorsResponse>(
    "/vendor-customers/analytics/top-vendors",
    { params: { limit } }
  );
  return response;
}

/**
 * Get all orders/requests from a specific vendor
 * @param vendorId - The vendor's user ID
 * @param params - Query parameters for filtering and pagination
 */
export async function getVendorOrders(
  vendorId: string,
  params?: {
    page?: number;
    limit?: number;
    status?: string;
  }
): Promise<{
  success: boolean;
  requests: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> {
  const response = await apiClient.get<{
    success: boolean;
    requests: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>(`/vendor-customers/${vendorId}/orders`, { params });
  return response;
}

// ========================================
// EXPORT DEFAULT
// ========================================

export default {
  getVendorCustomers,
  getVendorCustomerById,
  getTopVendors,
  getVendorOrders,
};
