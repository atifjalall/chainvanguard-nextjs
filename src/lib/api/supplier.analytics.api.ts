/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "./client";

/**
 * ========================================
 * SUPPLIER ANALYTICS API
 * ========================================
 * Complete API for supplier analytics dashboard
 */

// ========================================
// INTERFACES
// ========================================

export interface SupplyData {
  date: string;
  revenue: number;
  orders: number;
  vendors: number;
  avgOrderValue: number;
  inventoryValue: number;
}

export interface ProductSupplyPerformance {
  id: string;
  name: string;
  category: string;
  revenue: number;
  orders: number;
  totalSupplied: number;
  avgOrderSize: number;
  stock: number;
  image?: string;
}

export interface VendorData {
  _id: string;
  name: string;
  email: string;
  companyName?: string;
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
  itemCount: number;
  totalQuantity: number;
}

export interface AnalyticsMetrics {
  revenue: { value: number; growth: number };
  orders: { value: number; growth: number };
  vendors: { value: number; growth: number };
  avgOrderValue: { value: number; growth: number };
  inventoryValue: { value: number; growth: number };
}

export interface SupplierAnalyticsResponse {
  success: boolean;
  timeframe: string;
  analytics: {
    revenue: {
      daily: Array<{
        _id: string;
        revenue: number;
        orders: number;
        avgOrderValue: number;
      }>;
      totals: {
        totalRevenue: number;
        totalOrders: number;
        avgOrderValue: number;
      };
    };
    topVendors: Array<{
      _id: string;
      name: string;
      email: string;
      companyName?: string;
      totalSpent: number;
      orderCount: number;
      lastOrderDate: string;
      avgOrderValue: number;
    }>;
    inventoryStats: {
      byCategory: Array<{
        _id: string;
        totalValue: number;
        itemCount: number;
        totalQuantity: number;
        avgPrice: number;
        minStock: number;
      }>;
      overall: {
        totalInventoryValue: number;
        totalItems: number;
        totalQuantity: number;
        lowStockItems: number;
        outOfStockItems: number;
      };
    };
    requestStats: {
      byStatus: Array<{
        _id: string;
        count: number;
        totalValue: number;
      }>;
      totals: {
        totalRequests: number;
        totalValue: number;
        approvalRate: string;
        approved: number;
        rejected: number;
      };
    };
    orderTrends: Array<{
      _id: string;
      totalOrders: number;
      pendingOrders: number;
      completedOrders: number;
      cancelledOrders: number;
    }>;
    topProducts?: Array<{
      _id: string;
      name: string;
      category: string;
      image?: string;
      revenue: number;
      totalSupplied: number;
      orderCount: number;
      currentStock: number;
      avgOrderSize: number;
      quantity: number;
      reservedQuantity: number;
      damagedQuantity: number;
      committedQuantity: number;
    }>;
    categoryRevenue?: Array<{
      _id: string;
      revenue: number;
      itemCount: number;
      totalQuantity: number;
    }>;
  };
}

// ========================================
// ANALYTICS API
// ========================================

export const supplierAnalyticsApi = {
  /**
   * Get comprehensive supplier analytics
   */
  getAnalytics: async (
    timeframe: "7d" | "30d" | "90d" | "1y" = "30d"
  ): Promise<SupplierAnalyticsResponse> => {
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
        `[Supplier Analytics API] Fetching analytics for ${backendTimeframe}`
      );

      const response = await apiClient.get<SupplierAnalyticsResponse>(
        `/analytics/supplier?timeframe=${backendTimeframe}`
      );

      console.log("[Supplier Analytics API] Response:", response);
      return response;
    } catch (error: any) {
      console.error("[Supplier Analytics API] Error:", error);
      throw new Error(error?.message || "Failed to fetch supplier analytics");
    }
  },

  /**
   * Transform backend data to supply data format for charts
   */
  transformToSupplyData: (
    analytics: SupplierAnalyticsResponse
  ): SupplyData[] => {
    const { revenue, topVendors, inventoryStats } = analytics.analytics;

    return revenue.daily.map((day) => {
      // Count unique vendors for this day
      const vendorCount = topVendors.length;

      return {
        date: day._id,
        revenue: day.revenue,
        orders: day.orders,
        vendors: vendorCount,
        avgOrderValue: day.avgOrderValue,
        inventoryValue: inventoryStats.overall.totalInventoryValue,
      };
    });
  },

  /**
   * Transform top vendors data
   */
  transformVendorData: (analytics: SupplierAnalyticsResponse): VendorData[] => {
    const { topVendors } = analytics.analytics;
    const totalRevenue = topVendors.reduce(
      (sum, vendor) => sum + vendor.totalSpent,
      0
    );

    const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

    return topVendors.slice(0, 5).map((vendor, index) => ({
      _id: vendor._id,
      name: vendor.name,
      email: vendor.email,
      companyName: vendor.companyName,
      value: vendor.totalSpent,
      percentage:
        totalRevenue > 0 ? (vendor.totalSpent / totalRevenue) * 100 : 0,
      color: colors[index % colors.length],
      orders: vendor.orderCount,
      totalSpent: vendor.totalSpent,
      avgOrderValue: vendor.avgOrderValue,
      lastOrderDate: vendor.lastOrderDate,
    }));
  },

  /**
   * Transform category data - uses categoryRevenue when available
   */
  transformCategoryData: (
    analytics: SupplierAnalyticsResponse
  ): CategoryData[] => {
    // Use categoryRevenue if available (from completed orders), fallback to inventory
    const categoryData =
      analytics.analytics.categoryRevenue &&
      analytics.analytics.categoryRevenue.length > 0
        ? analytics.analytics.categoryRevenue
        : analytics.analytics.inventoryStats.byCategory;

    const totalValue = categoryData.reduce(
      (sum, cat) =>
        sum + ((cat as any).revenue || (cat as any).totalValue || 0),
      0
    );

    const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

    return categoryData.map((category: any, index: number) => {
      const value = category.revenue || category.totalValue || 0;
      return {
        _id: category._id,
        name: category._id,
        value: value,
        percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
        color: colors[index % colors.length],
        itemCount: category.itemCount,
        totalQuantity: category.totalQuantity,
      };
    });
  },

  /**
   * Get top supply products - not needed anymore as data comes from backend
   */
  getTopProducts: async (): Promise<ProductSupplyPerformance[]> => {
    // This method is kept for compatibility but returns empty array
    // Actual data comes from getAnalytics response
    return [];
  },

  /**
   * Calculate metrics with growth
   */
  calculateMetrics: async (
    currentData: SupplierAnalyticsResponse,
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
        await supplierAnalyticsApi.getAnalytics(previousTimeframe);

      const current = currentData.analytics;
      const previous = previousData.analytics;

      const calculateGrowth = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      // Count unique vendors
      const uniqueVendors = new Set(current.topVendors.map((v) => v._id)).size;
      const previousUniqueVendors = new Set(
        previous.topVendors.map((v) => v._id)
      ).size;

      return {
        revenue: {
          value: current.revenue.totals.totalRevenue,
          growth: calculateGrowth(
            current.revenue.totals.totalRevenue,
            previous.revenue.totals.totalRevenue
          ),
        },
        orders: {
          value: current.revenue.totals.totalOrders,
          growth: calculateGrowth(
            current.revenue.totals.totalOrders,
            previous.revenue.totals.totalOrders
          ),
        },
        vendors: {
          value: uniqueVendors,
          growth: calculateGrowth(uniqueVendors, previousUniqueVendors),
        },
        avgOrderValue: {
          value: current.revenue.totals.avgOrderValue,
          growth: calculateGrowth(
            current.revenue.totals.avgOrderValue,
            previous.revenue.totals.avgOrderValue
          ),
        },
        inventoryValue: {
          value: current.inventoryStats.overall.totalInventoryValue,
          growth: calculateGrowth(
            current.inventoryStats.overall.totalInventoryValue,
            previous.inventoryStats.overall.totalInventoryValue
          ),
        },
      };
    } catch (error) {
      console.error(
        "[Supplier Analytics API] Error calculating metrics:",
        error
      );
      // Return current data with 0 growth if previous data fails
      const current = currentData.analytics;
      return {
        revenue: {
          value: current.revenue.totals.totalRevenue,
          growth: 0,
        },
        orders: {
          value: current.revenue.totals.totalOrders,
          growth: 0,
        },
        vendors: {
          value: new Set(current.topVendors.map((v) => v._id)).size,
          growth: 0,
        },
        avgOrderValue: {
          value: current.revenue.totals.avgOrderValue,
          growth: 0,
        },
        inventoryValue: {
          value: current.inventoryStats.overall.totalInventoryValue,
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
        `[Supplier Analytics API] Exporting ${type} data as ${format}`
      );

      const response = await apiClient.get<any>(
        `/analytics/export?format=${format}&type=${type}&timeframe=${backendTimeframe}`,
        {
          responseType: format === "csv" ? "blob" : "json",
        }
      );

      return response;
    } catch (error: any) {
      console.error("[Supplier Analytics API] Error exporting:", error);
      throw new Error(error?.message || "Failed to export analytics");
    }
  },
};

export default supplierAnalyticsApi;
