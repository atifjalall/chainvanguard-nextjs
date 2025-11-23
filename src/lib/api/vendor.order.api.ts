/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "./client";
import { Order, OrderStatus } from "@/types";

// ========================================
// INTERFACES
// ========================================

export interface OrderFilters {
  status?: OrderStatus | "All Status";
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  startDate?: string;
  endDate?: string;
}

export interface OrdersResponse {
  success: boolean;
  orders: Order[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalOrders: number;
    limit: number;
  };
}

export interface OrderStatsResponse {
  success: boolean;
  timeframe: string;
  stats: {
    totalOrders: number;
    pendingOrders: number;
    activeOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    topProducts?: Array<{
      productId: string;
      productName: string;
      quantity: number;
      revenue: number;
    }>;
  };
}

export interface UpdateOrderStatusData {
  status: OrderStatus;
  notes?: string;
  trackingId?: string;
  carrier?: string;
  estimatedDelivery?: string;
}

export interface UpdateShippingData {
  trackingNumber?: string;
  courierName?: string;
  estimatedDeliveryDate?: string;
  trackingUrl?: string;
}

export interface ShipOrderData {
  trackingNumber: string;
  courierName: string;
  estimatedDeliveryDate?: string;
  notes?: string;
}

export interface CreateOrderData {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
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
  billingAddress?: any;
  paymentMethod: string;
  customerNotes?: string;
  specialInstructions?: string;
  isGift?: boolean;
  giftMessage?: string;
  discountCode?: string;
}

// ========================================
// TRANSFORM FUNCTIONS
// ========================================

/**
 * Transform and validate order data from backend to frontend format
 */
function transformOrder(order: any): Order | null {
  if (!order || typeof order !== "object" || Object.keys(order).length === 0) {
    return null;
  }

  // CRITICAL FIX: Handle _id as ObjectId object
  let orderId: string | null = null;

  try {
    // If _id is an ObjectId object with $oid
    if (order._id?.$oid) {
      orderId = order._id.$oid;
    }
    // If _id has toString method
    else if (order._id?.toString) {
      orderId = order._id.toString();
    }
    // If id exists
    else if (order.id?.toString) {
      orderId = order.id.toString();
    }
    // Fallback to direct string conversion
    else if (order._id) {
      orderId = String(order._id);
    } else if (order.id) {
      orderId = String(order.id);
    }
  } catch (e) {
    console.error("[ORDER API] Error extracting order ID:", e);
  }

  if (!orderId) {
    console.error("[ORDER API] Order missing valid ID:", order);
    return null;
  }

  try {
    // Extract customer ID safely
    let customerId = "";
    if (order.customerId?.$oid) {
      customerId = order.customerId.$oid;
    } else if (order.customerId?.toString) {
      customerId = order.customerId.toString();
    } else if (order.customerId) {
      customerId = String(order.customerId);
    }

    // Extract seller ID safely
    let sellerId = "";
    if (order.sellerId?.$oid) {
      sellerId = order.sellerId.$oid;
    } else if (order.sellerId?.toString) {
      sellerId = order.sellerId.toString();
    } else if (order.sellerId) {
      sellerId = String(order.sellerId);
    }

    return {
      ...order,
      // Ensure ID fields - BOTH must be strings
      id: orderId,
      _id: orderId,

      // Ensure items/products (backend uses 'items')
      products: order.items || order.products || [],
      items: order.items || order.products || [],

      // Ensure amounts
      totalAmount: order.total || order.totalAmount || 0,
      total: order.total || order.totalAmount || 0,
      subtotal: order.subtotal || 0,
      shippingCost: order.shippingCost || 0,
      tax: order.tax || 0,
      discount: order.discount || 0,

      // Map tracking fields
      trackingId: order.trackingNumber || order.trackingId || "",
      trackingNumber: order.trackingNumber || order.trackingId || "",
      trackingUrl: order.trackingUrl || "",

      // Map courier fields
      carrier: order.courierName || order.carrier || "",
      courierName: order.courierName || order.carrier || "",

      // Ensure customer info with IDs as strings
      customerId,
      customerName:
        order.customerName || order.customerId?.name || "Unknown Customer",
      customerEmail: order.customerEmail || order.customerId?.email || "",
      customerPhone: order.customerPhone || order.shippingAddress?.phone || "",
      customerWalletAddress:
        order.customerWalletAddress || order.customerId?.walletAddress || "",

      // Ensure seller info with IDs as strings
      sellerId,
      sellerName: order.sellerName || order.sellerId?.name || "Unknown Seller",
      sellerWalletAddress:
        order.sellerWalletAddress || order.sellerId?.walletAddress || "",
      sellerRole: order.sellerRole || "vendor",

      // Blockchain fields
      blockchainOrderId: order.blockchainOrderId || "",
      blockchainTxId: order.blockchainTxId || order.blockchainTxHash || "",
      blockchainTxHash: order.blockchainTxHash || order.blockchainTxId || "",
      blockchainVerified: order.blockchainVerified || false,

      // Status and history
      status: order.status || "pending",
      statusHistory: order.statusHistory || order.orderHistory || [],

      // Payment info
      paymentMethod: order.paymentMethod || "wallet",
      paymentStatus: order.paymentStatus || "pending",
      paymentIntentId: order.paymentIntentId || "",
      transactionHash: order.transactionHash || "",

      // Shipping address
      shippingAddress: order.shippingAddress || {
        name: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        country: "",
        postalCode: "",
      },

      // Billing address
      billingAddress: order.billingAddress || undefined,

      // Shipping details
      shippingMethod: order.shippingMethod || "standard",
      estimatedDeliveryDate: order.estimatedDeliveryDate || "",
      actualDeliveryDate: order.actualDeliveryDate || "",

      // Order metadata
      orderNumber: order.orderNumber || orderId,
      currency: order.currency || "CVT",
      customerNotes: order.customerNotes || "",
      specialInstructions: order.specialInstructions || "",
      isGift: order.isGift || false,
      giftMessage: order.giftMessage || "",
      cancellationReason: order.cancellationReason || "",
      refundAmount: order.refundAmount || 0,
      refundReason: order.refundReason || "",

      // Timestamps - handle both Date objects and strings
      createdAt:
        order.createdAt?.$date || order.createdAt || new Date().toISOString(),
      updatedAt:
        order.updatedAt?.$date || order.updatedAt || new Date().toISOString(),
      confirmedAt: order.confirmedAt?.$date || order.confirmedAt || undefined,
      processingAt:
        order.processingAt?.$date || order.processingAt || undefined,
      shippedAt: order.shippedAt?.$date || order.shippedAt || undefined,
      deliveredAt: order.deliveredAt?.$date || order.deliveredAt || undefined,
      cancelledAt: order.cancelledAt?.$date || order.cancelledAt || undefined,
      refundedAt: order.refundedAt?.$date || order.refundedAt || undefined,
      paidAt: order.paidAt?.$date || order.paidAt || undefined,
    };
  } catch (error) {
    console.error("[ORDER API] Error transforming order:", error);
    return null;
  }
}

// ========================================
// ORDER API CLASS
// ========================================

class OrderAPI {
  // ========================================
  // SELLER/VENDOR METHODS
  // ========================================

  /**
   * Get seller's orders (vendor/supplier)
   */
  async getSellerOrders(filters: OrderFilters = {}): Promise<OrdersResponse> {
    try {
      const params = new URLSearchParams();

      if (filters.status && filters.status !== "All Status") {
        params.append("status", filters.status);
      }
      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());
      if (filters.sortBy) params.append("sortBy", filters.sortBy);
      if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      console.log("[ORDER API] Fetching seller orders with filters:", filters);

      const response: any = await apiClient.get(
        `/orders/seller?${params.toString()}`
      );

      console.log("[ORDER API] Raw seller orders response:", response);

      // Backend returns { success, data: [...orders], pagination }
      const orders = response.data || response.orders || [];

      // Transform all orders
      const transformedOrders = orders
        .map((order: any) => transformOrder(order))
        .filter((order: Order | null): order is Order => order !== null);

      console.log("[ORDER API] Transformed orders:", transformedOrders.length);

      return {
        success: response.success !== false,
        orders: transformedOrders,
        pagination: {
          currentPage:
            response.pagination?.page || response.pagination?.currentPage || 1,
          totalPages: response.pagination?.totalPages || 1,
          totalOrders:
            response.pagination?.total ||
            response.pagination?.totalOrders ||
            transformedOrders.length,
          limit: response.pagination?.limit || 20,
        },
      };
    } catch (error: any) {
      console.error("[ORDER API] getSellerOrders error:", error);
      // Return empty result instead of throwing
      return {
        success: false,
        orders: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalOrders: 0,
          limit: 20,
        },
      };
    }
  }

  /**
   * Get seller's order statistics
   */
  async getSellerStats(
    timeframe: string = "month"
  ): Promise<OrderStatsResponse> {
    try {
      console.log("[ORDER API] Fetching seller stats for:", timeframe);

      const response: any = await apiClient.get(
        `/orders/seller/stats?timeframe=${timeframe}`
      );

      console.log("[ORDER API] Raw stats response:", response);

      return {
        success: response.success || true,
        timeframe: timeframe,
        stats: {
          totalOrders: response.stats?.totalOrders || response.totalOrders || 0,
          pendingOrders:
            response.stats?.pendingOrders || response.pendingOrders || 0,
          activeOrders:
            response.stats?.activeOrders || response.activeOrders || 0,
          completedOrders:
            response.stats?.completedOrders || response.completedOrders || 0,
          cancelledOrders:
            response.stats?.cancelledOrders || response.cancelledOrders || 0,
          totalRevenue:
            response.stats?.totalRevenue || response.totalRevenue || 0,
          averageOrderValue:
            response.stats?.averageOrderValue ||
            response.averageOrderValue ||
            0,
          topProducts:
            response.stats?.topProducts || response.topProducts || [],
        },
      };
    } catch (error: any) {
      console.error("[ORDER API] getSellerStats error:", error);
      // Return empty stats instead of throwing
      return {
        success: false,
        timeframe,
        stats: {
          totalOrders: 0,
          pendingOrders: 0,
          activeOrders: 0,
          completedOrders: 0,
          cancelledOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          topProducts: [],
        },
      };
    }
  }

  // ========================================
  // SINGLE ORDER METHODS
  // ========================================

  /**
   * Get single order by ID
   */
  async getOrderById(
    orderId: string
  ): Promise<{ success: boolean; order: Order }> {
    try {
      // Validate order ID
      if (!orderId || orderId === "undefined" || orderId === "null") {
        throw new Error("Invalid order ID");
      }

      console.log("[ORDER API] Fetching order:", orderId);

      const response: any = await apiClient.get(`/orders/${orderId}`);

      console.log("[ORDER API] Raw order response:", response);

      // 🆕 FIXED: Correctly access the nested order object from response.data.order
      // Backend returns { success: true, data: { order: { ... } } }
      const orderData = response.data?.order || response.order || response;

      if (!orderData) {
        throw new Error("Order data not found in response");
      }

      const transformedOrder = transformOrder(orderData);

      if (!transformedOrder) {
        console.error(
          "[ORDER API] Failed to transform order data for ID:",
          orderId
        );
        return { success: false, order: null as any };
      }

      return {
        success: true,
        order: transformedOrder,
      };
    } catch (error: any) {
      console.error("[ORDER API] getOrderById error:", error);
      throw error;
    }
  }

  // ========================================
  // ORDER STATUS UPDATES
  // ========================================

  /**
   * Update order status (vendor/supplier) - Uses PATCH
   */
  async updateOrderStatus(
    orderId: string,
    updateData: UpdateOrderStatusData
  ): Promise<{ success: boolean; order: Order; message?: string }> {
    try {
      console.log("[ORDER API] Updating order status:", orderId, updateData);

      const payload: any = {
        status: updateData.status,
        notes: updateData.notes,
      };

      // Include tracking info if provided
      if (updateData.trackingId) {
        payload.trackingNumber = updateData.trackingId;
      }
      if (updateData.carrier) {
        payload.carrier = updateData.carrier;
      }
      if (updateData.estimatedDelivery) {
        payload.estimatedDelivery = updateData.estimatedDelivery;
      }

      const response: any = await apiClient.patch(
        `/orders/${orderId}/status`,
        payload
      );

      console.log("[ORDER API] Update status response:", response);

      const transformedOrder = transformOrder(response.order || response.data);

      if (!transformedOrder) {
        throw new Error("Failed to transform updated order");
      }

      return {
        success: response.success,
        order: transformedOrder,
        message: response.message,
      };
    } catch (error: any) {
      console.error("[ORDER API] updateOrderStatus error:", error);
      throw error;
    }
  }

  /**
   * Update shipping information - Uses PATCH
   */
  async updateShipping(
    orderId: string,
    shippingData: UpdateShippingData
  ): Promise<{
    success: boolean;
    order?: Order;
    shippingInfo?: any;
    message?: string;
  }> {
    try {
      console.log("[ORDER API] Updating shipping info:", orderId, shippingData);

      const response: any = await apiClient.patch(
        `/orders/${orderId}/shipping`,
        shippingData
      );

      console.log("[ORDER API] Update shipping response:", response);

      return {
        success: response.success,
        order: transformOrder(response.order) ?? undefined,
        shippingInfo: response.shippingInfo,
        message: response.message,
      };
    } catch (error: any) {
      console.error("[ORDER API] updateShipping error:", error);
      throw error;
    }
  }

  /**
   * Confirm order - Uses POST
   */
  async confirmOrder(
    orderId: string,
    estimatedDeliveryDate?: string,
    notes?: string
  ): Promise<{ success: boolean; order: Order; message?: string }> {
    try {
      console.log("[ORDER API] Confirming order:", orderId);

      const response: any = await apiClient.post(`/orders/${orderId}/confirm`, {
        estimatedDeliveryDate,
        notes,
      });

      const transformedOrder = transformOrder(response.order || response.data);

      if (!transformedOrder) {
        throw new Error("Failed to transform confirmed order");
      }

      return {
        success: response.success,
        order: transformedOrder,
        message: response.message,
      };
    } catch (error: any) {
      console.error("[ORDER API] confirmOrder error:", error);
      throw error;
    }
  }

  /**
   * Mark order as shipped - Uses POST
   */
  async markAsShipped(
    orderId: string,
    shippingInfo: ShipOrderData
  ): Promise<{ success: boolean; order: Order; message?: string }> {
    try {
      console.log("[ORDER API] Marking order as shipped:", orderId);

      const response: any = await apiClient.post(
        `/orders/${orderId}/ship`,
        shippingInfo
      );

      const transformedOrder = transformOrder(response.order || response.data);

      if (!transformedOrder) {
        throw new Error("Failed to transform shipped order");
      }

      return {
        success: response.success,
        order: transformedOrder,
        message: response.message,
      };
    } catch (error: any) {
      console.error("[ORDER API] markAsShipped error:", error);
      throw error;
    }
  }

  /**
   * Cancel order - Uses POST
   */
  async cancelOrder(
    orderId: string,
    reason?: string
  ): Promise<{ success: boolean; order: Order; message?: string }> {
    try {
      console.log("[ORDER API] Cancelling order:", orderId);

      const response: any = await apiClient.post(`/orders/${orderId}/cancel`, {
        reason,
      });

      const transformedOrder = transformOrder(response.order || response.data);

      if (!transformedOrder) {
        throw new Error("Failed to transform cancelled order");
      }

      return {
        success: response.success,
        order: transformedOrder,
        message: response.message,
      };
    } catch (error: any) {
      console.error("[ORDER API] cancelOrder error:", error);
      throw error;
    }
  }

  // ========================================
  // CUSTOMER METHODS
  // ========================================

  /**
   * Create new order (Customer only)
   */
  async createOrder(
    orderData: CreateOrderData
  ): Promise<{ success: boolean; order: Order; message?: string }> {
    try {
      console.log("[ORDER API] Creating order:", orderData);

      const response: any = await apiClient.post("/orders", orderData);

      const transformedOrder = transformOrder(response.order || response.data);

      if (!transformedOrder) {
        throw new Error("Failed to transform created order");
      }

      return {
        success: response.success,
        order: transformedOrder,
        message: response.message,
      };
    } catch (error: any) {
      console.error("[ORDER API] createOrder error:", error);
      throw error;
    }
  }

  /**
   * Get customer's orders
   */
  async getCustomerOrders(filters: OrderFilters = {}): Promise<OrdersResponse> {
    try {
      const params = new URLSearchParams();

      if (filters.status && filters.status !== "All Status") {
        params.append("status", filters.status);
      }
      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());
      if (filters.sortBy) params.append("sortBy", filters.sortBy);
      if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);

      console.log("[ORDER API] Fetching customer orders");

      const response: any = await apiClient.get(`/orders?${params.toString()}`);

      const orders = response.data || response.orders || [];

      const transformedOrders = orders
        .map((order: any) => transformOrder(order))
        .filter((order: Order | null): order is Order => order !== null);

      return {
        success: response.success !== false,
        orders: transformedOrders,
        pagination: {
          currentPage:
            response.pagination?.page || response.pagination?.currentPage || 1,
          totalPages: response.pagination?.totalPages || 1,
          totalOrders:
            response.pagination?.total ||
            response.pagination?.totalOrders ||
            transformedOrders.length,
          limit: response.pagination?.limit || 20,
        },
      };
    } catch (error: any) {
      console.error("[ORDER API] getCustomerOrders error:", error);
      return {
        success: false,
        orders: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalOrders: 0,
          limit: 20,
        },
      };
    }
  }

  /**
   * Track order
   */
  async trackOrder(
    orderId: string
  ): Promise<{ success: boolean; tracking: any; message?: string }> {
    try {
      console.log("[ORDER API] Tracking order:", orderId);

      const response: any = await apiClient.get(`/orders/${orderId}/track`);

      return {
        success: response.success,
        tracking: response.tracking || response.data,
        message: response.message,
      };
    } catch (error: any) {
      console.error("[ORDER API] trackOrder error:", error);
      throw error;
    }
  }

  // ========================================
  // BLOCKCHAIN METHODS
  // ========================================

  /**
   * Get order blockchain history
   */
  async getBlockchainHistory(
    orderId: string
  ): Promise<{ success: boolean; history: any[]; message?: string }> {
    try {
      console.log("[ORDER API] Fetching blockchain history:", orderId);

      const response: any = await apiClient.get(
        `/orders/${orderId}/blockchain`
      );

      return {
        success: response.success,
        history: response.history || response.data || [],
        message: response.message,
      };
    } catch (error: any) {
      console.error("[ORDER API] getBlockchainHistory error:", error);
      throw error;
    }
  }
}

// ========================================
// EXPORT
// ========================================

export const orderAPI = new OrderAPI();
export const orderApi = orderAPI;
