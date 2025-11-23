/**
 * Customer Returns API
 * All API calls related to product returns and refunds
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
  productName?: string;
  quantity: number;
  price?: number;
  subtotal?: number;
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

export interface CreateReturnData {
  orderId: string;
  items: ReturnItem[];
  reason: ReturnReason;
  reasonDetails: string;
  images?: string[];
}

// ========================================
// RETURN FUNCTIONS
// ========================================

/**
 * Get customer's returns with filtering and pagination
 * GET /api/returns/customer
 *
 * @param filters - Optional filters for returns
 * @returns Paginated returns list
 */
export const getCustomerReturns = async (
  filters?: ReturnFilters
): Promise<ReturnsResponse> => {
  const params = new URLSearchParams();

  if (filters?.status) params.append("status", filters.status);
  if (filters?.page) params.append("page", filters.page.toString());
  if (filters?.limit) params.append("limit", filters.limit.toString());
  if (filters?.sortBy) params.append("sortBy", filters.sortBy);
  if (filters?.sortOrder) params.append("sortOrder", filters.sortOrder);

  const queryString = params.toString();
  const url = queryString
    ? `/returns/customer?${queryString}`
    : "/returns/customer";

  const response = await apiClient.get<ReturnsResponse>(url);
  return response;
};

/**
 * Get single return details by ID
 * GET /api/returns/:id
 *
 * @param returnId - Return ID
 * @returns Return details
 */
export const getReturnById = async (
  returnId: string
): Promise<ReturnResponse> => {
  const response = await apiClient.get<ReturnResponse>(`/returns/${returnId}`);
  return response;
};

/**
 * Create a new return request
 * POST /api/returns
 *
 * @param data - Return request data
 * @returns Created return
 */
export const createReturn = async (
  data: CreateReturnData
): Promise<ReturnResponse> => {
  const response = await apiClient.post<ReturnResponse>("/returns", data);
  return response;
};

/**
 * Upload return images to Cloudinary
 * This is a helper function to handle image uploads
 *
 * @param files - Image files to upload
 * @returns Array of Cloudinary URLs
 */
export const uploadReturnImages = async (
  files: File[]
): Promise<Array<{ url: string; publicId: string }>> => {
  const uploadedImages: Array<{ url: string; publicId: string }> = [];

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    console.error("Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
    throw new Error("Cloudinary is not configured. Please contact support.");
  }

  for (const file of files) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "chainvanguard");
    formData.append("folder", "returns");

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Cloudinary upload failed:", errorData);
        throw new Error(
          errorData.error?.message ||
            `Upload failed with status ${response.status}`
        );
      }

      const data = await response.json();
      uploadedImages.push({
        url: data.secure_url,
        publicId: data.public_id,
      });
    } catch (error) {
      console.error("Image upload error:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to upload image. Please try again."
      );
    }
  }

  return uploadedImages;
};

/**
 * Get eligible orders for return
 * This checks which orders can be returned (delivered within return window)
 * Uses the orders API endpoint
 *
 * @returns List of eligible orders
 */
export const getEligibleOrders = async () => {
  // Import dynamically to avoid circular dependencies
  const { getOrders } = await import("./customer.orders.api");

  // Get delivered orders
  const response = await getOrders({
    status: "delivered",
    limit: 50,
  });

  if (!response.success || !response.data) {
    return [];
  }

  // Filter for orders within return window (30 days)
  const returnWindow = 30;
  const now = new Date();

  return response.data.orders.filter((order) => {
    const deliveryDate = new Date(order.actualDeliveryDate || order.createdAt);
    const daysSinceDelivery = Math.ceil(
      (now.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceDelivery <= returnWindow && !order.returnRequested;
  });
};
