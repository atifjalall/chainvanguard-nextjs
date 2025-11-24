import { apiClient } from "./client";

export interface VendorStore {
  vendor: {
    id: string;
    name: string;
    companyName: string;
    businessType: string;
    location: string;
    memberSince: string;
    description: string;
    banner: string;
    operatingHours: string;
    socialLinks: Record<string, string>;
  };
  stats: {
    productCount: number;
    totalSales: number;
    totalRevenue: number;
    recentOrders: number;
    avgRating: number;
    topCategories: Array<{
      category: string;
      productCount: number;
    }>;
  };
}

export interface VendorProduct {
  _id: string;
  name: string;
  price: number;
  images: Array<{
    url: string;
    isMain: boolean;
  }>;
  category: string;
  subcategory: string;
  stock: number;
  description: string;
  createdAt: string;
}

export interface VendorProductsResponse {
  success: boolean;
  products: VendorProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: {
    category?: string;
    subcategory?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    inStock?: boolean;
  };
}

export interface VendorCategory {
  _id: string;
  subcategories: Array<{
    name: string;
    count: number;
    priceRange: {
      min: number;
      max: number;
    };
  }>;
  totalProducts: number;
}

export interface VendorProductFilters {
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  inStock?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

class VendorAPI {
  /**
   * Get vendor's public storefront information
   * Access: Public (no auth required)
   */
  async getVendorStore(vendorId: string): Promise<{
    success: boolean;
    store: VendorStore;
  }> {
    return apiClient.get(`/products/vendor/${vendorId}/store`);
  }

  /**
   * Get vendor's products with filtering
   * Access: Public (no auth required)
   */
  async getVendorProducts(
    vendorId: string,
    filters?: VendorProductFilters
  ): Promise<VendorProductsResponse> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });
    }

    return apiClient.get(
      `/products/vendor/${vendorId}/products?${params.toString()}`
    );
  }

  /**
   * Get vendor's product categories with counts
   * Access: Public
   */
  async getVendorCategories(vendorId: string): Promise<{
    success: boolean;
    categories: VendorCategory[];
  }> {
    return apiClient.get(`/products/vendor/${vendorId}/categories`);
  }
}

export const vendorAPI = new VendorAPI();
