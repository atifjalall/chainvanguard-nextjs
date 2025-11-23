/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "./client";

/**
 * ========================================
 * VENDOR ANALYTICS API
 * ========================================
 * Complete API for vendor analytics dashboard
 */

// ========================================
// INTERFACES
// ========================================

export interface SalesData {
  date: string;
  revenue: number;
  orders: number;
  customers: number;
  avgOrderValue: number;
  itemsSold: number;
}

export interface ProductPerformance {
  _id: string;
  name: string;
  category: string;
  revenue: number;
  unitsSold: number;
  orderCount: number;
  avgPrice: number;
  image?: string;
  views?: number;
  conversionRate?: number;
  stock?: number;
}

export interface CustomerData {
  _id: string;
  name: string;
  email: string;
  city?: string;
  value: number;
  percentage: number;
  color: string;
  orders: number;
  totalSpent: number;
  avgOrderValue: number;
  lastOrderDate: string;
}

export interface CategoryData {
  _id: string;
  name: string;
  value: number;
  percentage: number;
  color: string;
  orders: number;
  unitsSold: number;
  revenuePercentage: string;
}

export interface AnalyticsMetrics {
  revenue: { value: number; growth: number };
  orders: { value: number; growth: number };
  customers: { value: number; growth: number };
  avgOrderValue: { value: number; growth: number };
}

export interface VendorAnalyticsResponse {
  success: boolean;
  timeframe: string;
  analytics: {
    sales: {
      daily: Array<{
        _id: string;
        revenue: number;
        orders: number;
        avgOrderValue: number;
        itemsSold: number;
      }>;
      totals: {
        totalRevenue: number;
        totalOrders: number;
        totalItems: number;
        avgOrderValue: number;
      };
    };
    topProducts: Array<{
      _id: string;
      name: string;
      category: string;
      image?: string;
      revenue: number;
      unitsSold: number;
      orderCount: number;
      avgPrice: number;
    }>;
    topCustomers: Array<{
      _id: string;
      name: string;
      email: string;
      city?: string;
      totalSpent: number;
      orderCount: number;
      lastOrderDate: string;
      avgOrderValue: number;
    }>;
    categoryStats: Array<{
      _id: string;
      revenue: number;
      orders: number;
      unitsSold: number;
      revenuePercentage: string;
    }>;
    orderTrends: Array<{
      _id: string;
      totalOrders: number;
      pendingOrders: number;
      completedOrders: number;
      cancelledOrders: number;
    }>;
  };
}

// ========================================
// ANALYTICS API
// ========================================

export const vendorAnalyticsApi = {
  /**
   * Get comprehensive vendor analytics
   */
  getAnalytics: async (
    timeframe: "7d" | "30d" | "90d" | "1y" = "30d"
  ): Promise<VendorAnalyticsResponse> => {
    try {
      // Map frontend timeframe to backend format
      const timeframeMap = {
        "7d": "week",
        "30d": "month",
        "90d": "quarter",
        "1y": "year",
      };

      const backendTimeframe = timeframeMap[timeframe] || "month";
      console.log(
        `[Vendor Analytics API] Fetching analytics for ${backendTimeframe}`
      );

      const response = await apiClient.get<VendorAnalyticsResponse>(
        `/analytics/vendor?timeframe=${backendTimeframe}`
      );

      console.log("[Vendor Analytics API] Response:", response);
      return response;
    } catch (error: any) {
      console.error("[Vendor Analytics API] Error:", error);
      throw new Error(error?.message || "Failed to fetch vendor analytics");
    }
  },

  /**
   * Transform backend data to sales data format for charts
   */
  transformToSalesData: (analytics: VendorAnalyticsResponse): SalesData[] => {
    const { sales, topCustomers } = analytics.analytics;

    return sales.daily.map((day) => {
      // Count unique customers for this day (use topCustomers as approximation)
      const customerCount = topCustomers.length;

      return {
        date: day._id,
        revenue: day.revenue,
        orders: day.orders,
        customers: customerCount,
        avgOrderValue: day.avgOrderValue,
        itemsSold: day.itemsSold || 0,
      };
    });
  },

  /**
   * Transform top customers data
   */
  transformCustomerData: (
    analytics: VendorAnalyticsResponse
  ): CustomerData[] => {
    const { topCustomers } = analytics.analytics;
    const totalRevenue = topCustomers.reduce(
      (sum, customer) => sum + customer.totalSpent,
      0
    );

    const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

    return topCustomers.slice(0, 5).map((customer, index) => ({
      _id: customer._id,
      name: customer.name,
      email: customer.email,
      city: customer.city,
      value: customer.totalSpent,
      percentage:
        totalRevenue > 0 ? (customer.totalSpent / totalRevenue) * 100 : 0,
      color: colors[index % colors.length],
      orders: customer.orderCount,
      totalSpent: customer.totalSpent,
      avgOrderValue: customer.avgOrderValue,
      lastOrderDate: customer.lastOrderDate,
    }));
  },

  /**
   * Transform category data
   */
  transformCategoryData: (
    analytics: VendorAnalyticsResponse
  ): CategoryData[] => {
    const { categoryStats } = analytics.analytics;
    const totalValue = categoryStats.reduce(
      (sum, cat) => sum + (cat.revenue || 0),
      0
    );

    const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

    return categoryStats.map((category: any, index: number) => {
      const value = category.revenue || 0;
      return {
        _id: category._id,
        name: category._id,
        value: value,
        percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
        color: colors[index % colors.length],
        orders: category.orders || 0,
        unitsSold: category.unitsSold || 0,
        revenuePercentage: category.revenuePercentage || "0",
      };
    });
  },

  /**
   * Transform product performance data
   */
  transformProductPerformance: (
    analytics: VendorAnalyticsResponse
  ): ProductPerformance[] => {
    const { topProducts } = analytics.analytics;

    return topProducts.map((product) => ({
      _id: product._id,
      name: product.name,
      category: product.category,
      revenue: product.revenue,
      unitsSold: product.unitsSold || 0,
      orderCount: product.orderCount || 0,
      avgPrice: product.avgPrice || 0,
      image: product.image,
      // Mock data for views and conversion rate since backend doesn't provide it
      views: Math.floor(product.unitsSold * 10), // Approximate views
      conversionRate: product.unitsSold > 0 ? 3.5 : 0, // Mock conversion rate
      stock: 25, // Mock stock - would need separate API call for actual stock
    }));
  },

  /**
   * Calculate metrics with growth
   */
  calculateMetrics: async (
    currentData: VendorAnalyticsResponse,
    currentTimeframe: "7d" | "30d" | "90d" | "1y" = "30d"
  ): Promise<AnalyticsMetrics> => {
    try {
      // Map to previous period
      const previousTimeframeMap: Record<string, "7d" | "30d" | "90d" | "1y"> =
        {
          "7d": "7d", // Compare 7d to previous 7d
          "30d": "30d", // Compare 30d to previous 30d
          "90d": "90d", // Compare 90d to previous 90d
          "1y": "1y", // Compare 1y to previous 1y
        };

      const previousTimeframe = previousTimeframeMap[currentTimeframe];

      // Get previous period data for growth calculation
      const previousData =
        await vendorAnalyticsApi.getAnalytics(previousTimeframe);

      const current = currentData.analytics;
      const previous = previousData.analytics;

      const calculateGrowth = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      // Count unique customers
      const uniqueCustomers = new Set(
        current.topCustomers.map((c) => c._id)
      ).size;
      const previousUniqueCustomers = new Set(
        previous.topCustomers.map((c) => c._id)
      ).size;

      return {
        revenue: {
          value: current.sales.totals.totalRevenue,
          growth: calculateGrowth(
            current.sales.totals.totalRevenue,
            previous.sales.totals.totalRevenue
          ),
        },
        orders: {
          value: current.sales.totals.totalOrders,
          growth: calculateGrowth(
            current.sales.totals.totalOrders,
            previous.sales.totals.totalOrders
          ),
        },
        customers: {
          value: uniqueCustomers,
          growth: calculateGrowth(uniqueCustomers, previousUniqueCustomers),
        },
        avgOrderValue: {
          value: current.sales.totals.avgOrderValue,
          growth: calculateGrowth(
            current.sales.totals.avgOrderValue,
            previous.sales.totals.avgOrderValue
          ),
        },
      };
    } catch (error) {
      console.error(
        "[Vendor Analytics API] Error calculating metrics:",
        error
      );
      // Return current data with 0 growth if previous data fails
      const current = currentData.analytics;
      return {
        revenue: {
          value: current.sales.totals.totalRevenue,
          growth: 0,
        },
        orders: {
          value: current.sales.totals.totalOrders,
          growth: 0,
        },
        customers: {
          value: new Set(current.topCustomers.map((c) => c._id)).size,
          growth: 0,
        },
        avgOrderValue: {
          value: current.sales.totals.avgOrderValue,
          growth: 0,
        },
      };
    }
  },

  /**
   * Export analytics data
   */
  exportAnalytics: async (
    format: "csv" | "json" = "json",
    type: "revenue" | "orders" | "products" | "customers" = "revenue",
    timeframe: "7d" | "30d" | "90d" | "1y" = "30d"
  ): Promise<any> => {
    try {
      const timeframeMap = {
        "7d": "week",
        "30d": "month",
        "90d": "quarter",
        "1y": "year",
      };

      const backendTimeframe = timeframeMap[timeframe] || "month";
      console.log(
        `[Vendor Analytics API] Exporting ${type} data as ${format}`
      );

      const response = await apiClient.get<any>(
        `/analytics/export?format=${format}&type=${type}&timeframe=${backendTimeframe}`,
        {
          responseType: format === "csv" ? "blob" : "json",
        }
      );

      return response;
    } catch (error: any) {
      console.error("[Vendor Analytics API] Error exporting:", error);
      throw new Error(error?.message || "Failed to export analytics");
    }
  },
};

export default vendorAnalyticsApi;
