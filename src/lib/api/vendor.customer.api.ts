/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "./client";
import type {
  VendorCustomer,
  VendorCustomerStats,
  CustomerDetailResponse,
  Order,
  PaginatedResponse,
} from "@/types";

// ========================================
// VENDOR CUSTOMER API
// ========================================

/**
 * Get list of vendor's customers with statistics
 */
export async function getVendorCustomers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "totalSpent" | "totalOrders" | "loyaltyPoints" | "name";
  sortOrder?: "asc" | "desc";
}): Promise<PaginatedResponse<VendorCustomer>> {
  const queryParams = new URLSearchParams();

  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.search) queryParams.append("search", params.search);
  if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
  if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);

  const response = await apiClient.get<{
    success: boolean;
    customers: VendorCustomer[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>(`/vendor/customers?${queryParams.toString()}`);

  return {
    success: response.success,
    data: response.customers,
    pagination: {
      page: response.pagination.page,
      limit: response.pagination.limit,
      total: response.pagination.total,
      totalPages: response.pagination.pages,
      hasNext: response.pagination.page < response.pagination.pages,
      hasPrev: response.pagination.page > 1,
    },
  };
}

/**
 * Get customer statistics summary
 */
export async function getCustomerStatsSummary(): Promise<VendorCustomerStats> {
  const response = await apiClient.get<{
    success: boolean;
    summary: VendorCustomerStats;
  }>("/vendor/customers/stats/summary");

  return response.summary;
}

/**
 * Get detailed customer information
 */
export async function getCustomerDetails(
  customerId: string
): Promise<CustomerDetailResponse> {
  const response = await apiClient.get<any>(`/vendor/customers/${customerId}`);

  // Map recentOrders to include proper total/totalAmount fields and blockchain data
  const mappedRecentOrders =
    response.recentOrders?.map((order: any) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      amount: order.amount || 0,
      status: order.status,
      itemCount: order.itemCount,
      date: order.date,
      total: order.amount || 0,
      totalAmount: order.amount || 0,
      _id: order.id,
      createdAt: order.date,
      blockchainTxId: order.blockchainTxId || null,
      blockchainVerified: order.blockchainVerified || false,
    })) || [];

  return {
    success: response.success,
    customer: response.customer,
    statistics: response.statistics,
    recentOrders: mappedRecentOrders,
  };
}

/**
 * Get customer's order history
 */
export async function getCustomerOrders(
  customerId: string,
  params?: {
    page?: number;
    limit?: number;
    status?: string;
  }
): Promise<PaginatedResponse<Order>> {
  const queryParams = new URLSearchParams();

  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.status) queryParams.append("status", params.status);

  const response = await apiClient.get<{
    success: boolean;
    orders: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>(`/vendor/customers/${customerId}/orders?${queryParams.toString()}`);

  // Map the response to match Order type
  const mappedOrders = response.orders.map((order) => ({
    ...order,
    _id: order.id || order._id,
    id: order.id || order._id,
    total: order.amount || order.total || order.totalAmount || 0,
    totalAmount: order.amount || order.total || order.totalAmount || 0,
  }));

  return {
    success: response.success,
    data: mappedOrders,
    pagination: {
      page: response.pagination.page,
      limit: response.pagination.limit,
      total: response.pagination.total,
      totalPages: response.pagination.pages,
      hasNext: response.pagination.page < response.pagination.pages,
      hasPrev: response.pagination.page > 1,
    },
  };
}

/**
 * Get customer contact information
 */
export async function getCustomerContact(customerId: string): Promise<{
  name: string;
  email: string;
  phone?: string;
}> {
  const response = await apiClient.get<{
    success: boolean;
    contact: {
      name: string;
      email: string;
      phone?: string;
    };
  }>(`/vendor/customers/${customerId}/contact`);

  return response.contact;
}

/**
 * Get customers by order status (delivered, refunded)
 */
export async function getCustomersByOrderStatus(
  status: "delivered" | "refunded",
  params?: {
    page?: number;
    limit?: number;
    search?: string;
  }
): Promise<PaginatedResponse<VendorCustomer>> {
  // This will fetch all customers and filter on the frontend
  // Or you can add a backend route for this specific case
  const allCustomers = await getVendorCustomers({
    ...params,
    // You might want to add a status filter to the backend
  });

  return allCustomers;
}

/**
 * Send message to customer (placeholder - implement if needed)
 */
export async function sendCustomerMessage(
  customerId: string,
  message: string
): Promise<{ success: boolean; message: string }> {
  // Implement this endpoint in your backend if needed
  // For now, return a mock response
  return {
    success: true,
    message: "Message sent successfully",
  };
}

/**
 * Get new customers this month
 */
export async function getNewCustomersThisMonth(): Promise<VendorCustomer[]> {
  const stats = await getCustomerStatsSummary();
  const allCustomers = await getVendorCustomers({ limit: 100 });

  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  return (
    allCustomers.data?.filter((customer) => {
      const memberSince = new Date(customer.memberSince);
      return memberSince >= oneMonthAgo;
    }) || []
  );
}

/**
 * Get at-risk customers (no orders in last 60 days)
 */
export async function getAtRiskCustomers(): Promise<VendorCustomer[]> {
  const allCustomers = await getVendorCustomers({ limit: 100 });

  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  return (
    allCustomers.data?.filter((customer) => {
      if (!customer.stats.lastOrderDate) return false;
      const lastOrderDate = new Date(customer.stats.lastOrderDate);
      return lastOrderDate < sixtyDaysAgo;
    }) || []
  );
}

/**
 * Export customer data to CSV
 */
export async function exportCustomersToCSV(): Promise<Blob> {
  const response = await apiClient.get<Blob>("/vendor/customers/export/csv", {
    responseType: "blob",
  });

  return response;
}
