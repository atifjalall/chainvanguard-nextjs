/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/api/analytics_api.ts
import { apiClient } from "./client";
import {
  SupplierAnalyticsResponse,
  SupplierDashboardMetrics,
  TopVendor,
  TopProduct,
  RecentActivity,
} from "@/types";
import supplierVendorApi from "./supplier.vendor.api";

/**
 * ========================================
 * ANALYTICS API
 * ========================================
 */

export const analyticsApi = {
  /**
   * Get supplier analytics dashboard data
   * @param timeframe - 'week', 'month', 'quarter' | 'year' | 'all'
   * @returns Comprehensive supplier analytics
   */
  getSupplierAnalytics: async (
    timeframe: "week" | "month" | "quarter" | "year" | "all" = "month"
  ): Promise<SupplierAnalyticsResponse> => {
    try {
      console.log(
        `[Analytics API] Fetching supplier analytics for ${timeframe}`
      );
      const response = await apiClient.get<SupplierAnalyticsResponse>(
        `/analytics/supplier?timeframe=${timeframe}`
      );
      console.log("[Analytics API] Response:", response);
      return response;
    } catch (error: any) {
      console.error(
        "[Analytics API] Error fetching supplier analytics:",
        error
      );
      throw new Error(error?.message || "Failed to fetch supplier analytics");
    }
  },

  /**
   * Get vendor analytics dashboard data
   * @param timeframe - 'week', 'month', 'quarter' | 'year' | 'all'
   * @returns Comprehensive vendor analytics
   */
  getVendorAnalytics: async (
    timeframe: "week" | "month" | "quarter" | "year" | "all" = "month"
  ): Promise<any> => {
    try {
      console.log(`[Analytics API] Fetching vendor analytics for ${timeframe}`);
      const response = await apiClient.get<any>(
        `/analytics/vendor?timeframe=${timeframe}`
      );
      console.log("[Analytics API] Response:", response);
      return response;
    } catch (error: any) {
      console.error("[Analytics API] Error fetching vendor analytics:", error);
      throw new Error(error?.message || "Failed to fetch vendor analytics");
    }
  },

  /**
   * Get analytics summary (today, week, month)
   * @returns Quick summary statistics
   */
  getAnalyticsSummary: async (): Promise<any> => {
    try {
      console.log("[Analytics API] Fetching analytics summary");
      const response = await apiClient.get<any>("/analytics/summary");
      console.log("[Analytics API] Summary response:", response);
      return response;
    } catch (error: any) {
      console.error("[Analytics API] Error fetching analytics summary:", error);
      throw new Error(error?.message || "Failed to fetch analytics summary");
    }
  },

  /**
   * Get the total number of vendors for the supplier.
   * Uses the vendor-customer API.
   */
  getVendorCount: async (): Promise<number> => {
    try {
      const res = await supplierVendorApi.getVendorCustomers({ limit: 1 });
      // Use pagination.total for accurate count if available
      if (res?.pagination?.total !== undefined) {
        return res.pagination.total;
      }
      // Fallback to vendors array length
      return Array.isArray(res?.vendors) ? res.vendors.length : 0;
    } catch {
      return 0;
    }
  },

  /**
   * Transform analytics data to dashboard metrics
   * @param analytics - Raw analytics data from backend
   * @returns Formatted dashboard metrics
   */
  transformToMetrics: (
    analytics: SupplierAnalyticsResponse
  ): SupplierDashboardMetrics => {
    const { revenue, inventoryStats, orderTrends } = analytics.analytics;

    // Calculate order trends
    const latestTrend = orderTrends[orderTrends.length - 1] || {
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
    };

    return {
      totalInventory: inventoryStats.overall.totalItems || 0,
      totalVendors: 0, // Placeholder, set in dashboard after fetching
      totalTransactions: latestTrend.totalOrders,
      totalRevenue: revenue.totals.totalRevenue || 0,
      totalOrders: revenue.totals.totalOrders || 0,
      activeInventory:
        inventoryStats.overall.totalItems -
          inventoryStats.overall.lowStockItems -
          inventoryStats.overall.outOfStockItems || 0,
      lowStockInventory: inventoryStats.overall.lowStockItems || 0,
      outOfStockInventory: inventoryStats.overall.outOfStockItems || 0,
      pendingVendors: 0, // Can be calculated from vendor requests if needed
      completedTransactions: latestTrend.completedOrders || 0,
      totalInventoryValue: inventoryStats.overall.totalInventoryValue || 0,
      avgOrderValue: revenue.totals.avgOrderValue || 0,
    };
  },

  /**
   * Transform top vendors data
   * @param vendors - Raw vendor data from backend
   * @returns Formatted top vendors
   */
  transformTopVendors: (vendors: TopVendor[]): TopVendor[] => {
    return vendors.map((vendor) => ({
      id: vendor._id,
      _id: vendor._id,
      name: vendor.name,
      email: vendor.email,
      companyName: vendor.companyName,
      totalOrders: vendor.orderCount || vendor.totalOrders || 0,
      totalSpent: vendor.totalSpent || 0,
      averageOrderValue: vendor.avgOrderValue || vendor.averageOrderValue || 0,
      status: "active" as const,
      lastOrderDate: vendor.lastOrderDate,
      joinedDate: vendor.lastOrderDate, // Using lastOrderDate as fallback
      rating: vendor.rating || 4.5,
      location: vendor.location || { city: "N/A", country: "N/A" },
    }));
  },

  /**
   * Generate mock top products from inventory
   * This should ideally come from backend, but for now we'll derive from available data
   */
  getMockTopProducts: (): TopProduct[] => {
    // This is temporary until we have a proper endpoint
    return [];
  },

  /**
   * Generate recent activity from analytics data
   * @param analytics - Raw analytics data
   * @returns Recent activity items
   */
  generateRecentActivity: (
    analytics: SupplierAnalyticsResponse
  ): RecentActivity[] => {
    const activities: RecentActivity[] = [];
    const { revenue, inventoryStats, topVendors } = analytics.analytics;

    // Add recent orders as activities
    if (revenue.daily.length > 0) {
      const recentDay = revenue.daily[revenue.daily.length - 1];
      if (recentDay.orders > 0) {
        activities.push({
          id: `order-${recentDay._id}`,
          type: "order_received",
          title: "New Orders Received",
          description: `${recentDay.orders} orders received with revenue of Rs ${recentDay.revenue.toFixed(2)}`,
          timestamp: new Date(recentDay._id).toISOString(),
          status: "success",
          amount: recentDay.revenue,
        });
      }
    }

    // Add vendor activities
    if (topVendors.length > 0) {
      const topVendor = topVendors[0];
      activities.push({
        id: `vendor-${topVendor._id}`,
        type: "vendor_added",
        title: "Top Vendor Activity",
        description: `${topVendor.name} - ${topVendor.orderCount || 0} orders placed`,
        timestamp: topVendor.lastOrderDate,
        status: "info",
        customer: topVendor.name,
      });
    }

    // Add low stock alerts
    if (inventoryStats.overall.lowStockItems > 0) {
      activities.push({
        id: "low-stock-alert",
        type: "stock_low",
        title: "Low Stock Alert",
        description: `${inventoryStats.overall.lowStockItems} items running low on stock`,
        timestamp: new Date().toISOString(),
        status: "warning",
      });
    }

    return activities.slice(0, 5); // Return top 5 activities
  },

  /**
   * Export analytics data
   * @param format - 'csv' or 'json'
   * @param type - Type of data to export
   * @param timeframe - Time period
   */
  exportAnalytics: async (
    format: "csv" | "json" = "json",
    type: "revenue" | "orders" | "products" | "customers" = "revenue",
    timeframe: "week" | "month" | "quarter" | "year" | "all" = "month"
  ): Promise<any> => {
    try {
      console.log(`[Analytics API] Exporting ${type} data as ${format}`);
      const response = await apiClient.get<any>(
        `/analytics/export?format=${format}&type=${type}&timeframe=${timeframe}`,
        {
          responseType: format === "csv" ? "blob" : "json",
        }
      );
      return response;
    } catch (error: any) {
      console.error("[Analytics API] Error exporting analytics:", error);
      throw new Error(error?.message || "Failed to export analytics");
    }
  },
};
