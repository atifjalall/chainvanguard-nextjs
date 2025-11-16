/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "./client";

const BASE_URL = "/vendor/inventory";

// Get vendor's inventory with filters and pagination
export const getVendorInventory = async (params?: {
  supplierId?: string;
  category?: string;
  status?: string;
  lowStock?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) => {
  const response = await apiClient.get<any>(BASE_URL, { params });
  return response.data;
};

// Get inventory statistics
export const getInventoryStats = async (): Promise<any> => {
  const response = await apiClient.get<any>(`${BASE_URL}/stats`);
  return response.data;
};

// Get low stock alerts
export const getLowStockAlerts = async (): Promise<any> => {
  const response = await apiClient.get<any>(`${BASE_URL}/low-stock`);
  return response.data;
};

// Get reorder suggestions
export const getReorderSuggestions = async () => {
  const response = await apiClient.get<any>(`${BASE_URL}/reorder-suggestions`);
  return response.data;
};

// Get inventory by supplier
export const getInventoryBySupplier = async (supplierId: string) => {
  const response = await apiClient.get<any>(`${BASE_URL}/by-supplier/${supplierId}`);
  return response.data;
};

// Search inventory
export const searchVendorInventory = async (query: string) => {
  const response = await apiClient.get<any>(`${BASE_URL}/search`, {
    params: { q: query },
  });
  return response.data;
};

// Get single inventory item by ID
export const getVendorInventoryById = async (id: string) => {
  const response = await apiClient.get<any>(`${BASE_URL}/${id}`);
  return response.data;
};

// Get inventory movements history
export const getInventoryMovements = async (id: string) => {
  const response = await apiClient.get<any>(`${BASE_URL}/${id}/movements`);
  return response.data;
};

// Adjust stock quantity
export const adjustStock = async (
  id: string,
  data: {
    quantityChange: number;
    reason: string;
    notes?: string;
  }
) => {
  const response = await apiClient.post<any>(`${BASE_URL}/${id}/adjust`, data);
  return response.data;
};

// Reserve quantity
export const reserveQuantity = async (
  id: string,
  data: {
    quantity: number;
    orderId?: string;
    notes?: string;
  }
) => {
  const response = await apiClient.post<any>(`${BASE_URL}/${id}/reserve`, data);
  return response.data;
};

// Release reserved quantity
export const releaseReservedQuantity = async (id: string, quantity: number) => {
  const response = await apiClient.post<any>(`${BASE_URL}/${id}/release`, {
    quantity,
  });
  return response.data;
};

// Use in production
export const useInProduction = async (
  id: string,
  data: {
    quantity: number;
    productId?: string;
    productName?: string;
    notes?: string;
  }
) => {
  const response = await apiClient.post<any>(`${BASE_URL}/${id}/use`, data);
  return response.data;
};

// Mark as damaged
export const markAsDamaged = async (
  id: string,
  data: {
    quantity: number;
    reason: string;
    notes?: string;
  }
) => {
  const response = await apiClient.post<any>(`${BASE_URL}/${id}/damaged`, data);
  return response.data;
};

// Update quality status
export const updateQualityStatus = async (
  id: string,
  data: {
    status: "pending" | "passed" | "failed" | "conditional";
    notes?: string;
  }
) => {
  const response = await apiClient.post<any>(`${BASE_URL}/${id}/quality`, data);
  return response.data;
};

// Create inventory from delivered order
export const createInventoryFromOrder = async (orderId: string) => {
  const response = await apiClient.post<any>(`${BASE_URL}/from-order/${orderId}`);
  return response.data;
};

// Delete inventory item
export const deleteVendorInventory = async (id: string) => {
  const response = await apiClient.delete<any>(`${BASE_URL}/${id}`);
  return response.data;
};
