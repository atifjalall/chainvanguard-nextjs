/* eslint-disable @typescript-eslint/no-explicit-any */
import { ProductResponse } from "@/types/product.types";
import { apiClient } from "./client";
import type { Product } from "@/types";

export interface CreateProductData {
  // Basic Information
  name: string;
  description: string;
  category: string;
  subcategory: string;
  productType?: string;
  brand?: string;

  // Apparel Details
  apparelDetails: {
    size: string;
    fit?: string;
    color: string;
    pattern?: string;
    material: string;
    fabricType?: string;
    fabricWeight?: string;
    careInstructions?: string;
    neckline?: string;
    sleeveLength?: string;
  };

  // Pricing & Inventory
  price: number;
  costPrice?: number;
  quantity: number;
  minStockLevel?: number;
  sku?: string;

  // Physical Properties
  weight?: number;
  dimensions?: string;

  // Tags & Metadata
  tags?: string[];
  season?: string;
  countryOfOrigin?: string;
  manufacturer?: string;

  // Features
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestseller?: boolean;

  // Certifications
  isSustainable?: boolean;
  certifications?: string[];

  // Shipping
  freeShipping?: boolean;
  shippingCost?: number;

  // ✅ Add this for updates
  removeImages?: string[];
}

export interface ProductFilters {
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  color?: string;
  brand?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  outOfStock: number;
  lowStock: number;
  totalValue: number;
  averagePrice: number;
}

export interface ProductHistoryEvent {
  action: string;
  timestamp: Date;
  performedBy: string;
  details: Record<string, any>;
  txId?: string;
}

class ProductAPI {
  /**
   * Create a new product
   */
  async createProduct(
    data: CreateProductData,
    images: File[]
  ): Promise<{ success: boolean; product: Product; message: string }> {
    const formData = new FormData();

    // Basic Information
    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("category", data.category);
    formData.append("subcategory", data.subcategory);
    if (data.productType) formData.append("productType", data.productType);
    if (data.brand) formData.append("brand", data.brand);

    // Apparel Details (send as JSON string)
    formData.append("apparelDetails", JSON.stringify(data.apparelDetails));

    // Pricing & Inventory
    formData.append("price", data.price.toString());
    if (data.costPrice) formData.append("costPrice", data.costPrice.toString());
    formData.append("quantity", data.quantity.toString());
    if (data.minStockLevel)
      formData.append("minStockLevel", data.minStockLevel.toString());
    if (data.sku) formData.append("sku", data.sku);

    // Physical Properties
    if (data.weight) formData.append("weight", data.weight.toString());
    if (data.dimensions) formData.append("dimensions", data.dimensions);

    // Tags & Metadata
    if (data.tags && data.tags.length > 0) {
      data.tags.forEach((tag) => formData.append("tags[]", tag));
    }
    if (data.season) formData.append("season", data.season);
    if (data.countryOfOrigin)
      formData.append("countryOfOrigin", data.countryOfOrigin);
    if (data.manufacturer) formData.append("manufacturer", data.manufacturer);

    // Features
    formData.append("isFeatured", String(data.isFeatured || false));
    formData.append("isNewArrival", String(data.isNewArrival || false));
    formData.append("isBestseller", String(data.isBestseller || false));

    // Certifications
    formData.append("isSustainable", String(data.isSustainable || false));
    if (data.certifications && data.certifications.length > 0) {
      data.certifications.forEach((cert) =>
        formData.append("certifications[]", cert)
      );
    }

    // Shipping
    formData.append("freeShipping", String(data.freeShipping || false));
    if (!data.freeShipping && data.shippingCost) {
      formData.append("shippingCost", data.shippingCost.toString());
    }

    // Images
    images.forEach((image) => {
      formData.append("images", image);
    });

    return apiClient.post("/products", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }

  /**
   * Get all products with filters
   */
  async getProducts(filters?: ProductFilters): Promise<{
    success: boolean;
    products: Product[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });
    }

    return apiClient.get(`/products?${params.toString()}`);
  }

  /**
   * Get a single product by ID
   */
  async getProductById(
    id: string,
    incrementView: boolean = false
  ): Promise<{ success: boolean; product: Product }> {
    const timestamp = Date.now();
    return apiClient.get(
      `/products/${id}?view=${incrementView ? "true" : "false"}&_t=${timestamp}`
    );
  }

  /**
   * Get current vendor's products (using token authentication)
   */
  async getVendorProducts(filters?: ProductFilters): Promise<ProductResponse> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });
    }

    const user = apiClient.getAuthUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const userId = user._id || user.id;
    if (!userId) {
      console.error("[Product API] User object:", user);
      throw new Error("User ID not found. Please log in again.");
    }

    console.log("[Product API] Getting products for user ID:", userId);

    // ✅ Add cache-busting timestamp
    params.append("_t", Date.now().toString());

    return apiClient.get(`/products/by-seller/${userId}?${params.toString()}`);
  }

  /**
   * Update a product
   */
  async updateProduct(
    id: string,
    data: Partial<CreateProductData>,
    images?: File[]
  ): Promise<{ success: boolean; product: Product; message: string }> {
    const formData = new FormData();

    if (data.name) formData.append("name", data.name);
    if (data.description) formData.append("description", data.description);
    if (data.category) formData.append("category", data.category);
    if (data.subcategory) formData.append("subcategory", data.subcategory);
    if (data.productType) formData.append("productType", data.productType);
    if (data.brand) formData.append("brand", data.brand);

    // Apparel Details
    if (data.apparelDetails) {
      formData.append("apparelDetails", JSON.stringify(data.apparelDetails));
    }

    // Pricing & Inventory
    if (data.price !== undefined)
      formData.append("price", data.price.toString());
    if (data.costPrice !== undefined)
      formData.append("costPrice", data.costPrice.toString());
    if (data.quantity !== undefined)
      formData.append("quantity", data.quantity.toString());
    if (data.minStockLevel !== undefined)
      formData.append("minStockLevel", data.minStockLevel.toString());
    if (data.sku) formData.append("sku", data.sku);

    // Physical Properties
    if (data.weight !== undefined)
      formData.append("weight", data.weight.toString());
    if (data.dimensions) formData.append("dimensions", data.dimensions);

    // ✅ Tags - handle array properly
    if (data.tags && data.tags.length > 0) {
      data.tags.forEach((tag) => formData.append("tags[]", tag));
    }

    // Metadata
    if (data.season) formData.append("season", data.season);
    if (data.countryOfOrigin)
      formData.append("countryOfOrigin", data.countryOfOrigin);
    if (data.manufacturer) formData.append("manufacturer", data.manufacturer);

    // Features
    if (data.isFeatured !== undefined)
      formData.append("isFeatured", String(data.isFeatured));
    if (data.isNewArrival !== undefined)
      formData.append("isNewArrival", String(data.isNewArrival));
    if (data.isBestseller !== undefined)
      formData.append("isBestseller", String(data.isBestseller));
    if (data.isSustainable !== undefined)
      formData.append("isSustainable", String(data.isSustainable));

    // ✅ Certifications - handle array properly
    if (data.certifications && data.certifications.length > 0) {
      data.certifications.forEach((cert) =>
        formData.append("certifications[]", cert)
      );
    }

    // Shipping
    if (data.freeShipping !== undefined)
      formData.append("freeShipping", String(data.freeShipping));
    if (data.shippingCost !== undefined)
      formData.append("shippingCost", data.shippingCost.toString());

    // ✅ Remove Images - handle array properly
    if (data.removeImages && data.removeImages.length > 0) {
      data.removeImages.forEach((publicId) =>
        formData.append("removeImages[]", publicId)
      );
    }

    // ✅ Add new images
    if (images && images.length > 0) {
      images.forEach((image) => {
        formData.append("images", image);
      });
    }

    // ✅ Cache busting timestamp
    formData.append("_t", Date.now().toString());

    const response = await apiClient.put<{
      success: boolean;
      product: Product;
      message: string;
    }>(`/products/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (response.success && typeof window !== "undefined") {
      localStorage.removeItem(`product_${id}`);
    }

    return response;
  }

  /**
   * Update product stock
   */
  async updateStock(
    id: string,
    quantity: number
  ): Promise<{ success: boolean; product: Product; message: string }> {
    return apiClient.patch(`/products/${id}/stock`, { quantity });
  }

  /**
   * Delete a product (soft delete)
   */
  async deleteProduct(
    id: string
  ): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/products/${id}`);
  }

  /**
   * Get product statistics
   */
  async getProductStats(): Promise<{ success: boolean; stats: ProductStats }> {
    return apiClient.get("/products/stats/overview");
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(): Promise<{
    success: boolean;
    products: Product[];
    count: number;
  }> {
    return apiClient.get("/products/low-stock");
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(limit: number = 10): Promise<{
    success: boolean;
    products: Product[];
    count: number;
  }> {
    return apiClient.get(`/products/featured?limit=${limit}`);
  }

  /**
   * Get new arrival products
   */
  async getNewArrivals(limit: number = 10): Promise<{
    success: boolean;
    products: Product[];
    count: number;
  }> {
    return apiClient.get(`/products/new-arrivals?limit=${limit}`);
  }

  /**
   * Get category statistics (count of products per category)
   */
  async getCategoryStats(): Promise<{
    success: boolean;
    categories: Array<{ category: string; count: number }>;
  }> {
    return apiClient.get("/products/stats/categories");
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(
    category: string,
    filters?: ProductFilters
  ): Promise<{
    success: boolean;
    category: string;
    products: Product[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });
    }

    return apiClient.get(
      `/products/by-category/${category}?${params.toString()}`
    );
  }

  /**
   * Get products by seller
   */
  async getProductsBySeller(
    sellerId: string,
    filters?: ProductFilters
  ): Promise<{
    success: boolean;
    sellerId: string;
    products: Product[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });
    }

    return apiClient.get(
      `/products/by-seller/${sellerId}?${params.toString()}`
    );
  }

  /**
   * Search products
   */
  async searchProducts(
    query: string,
    filters?: ProductFilters
  ): Promise<{
    success: boolean;
    products: Product[];
    count: number;
    query: string;
  }> {
    const params = new URLSearchParams({ search: query });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });
    }

    return apiClient.get(`/products/search?${params.toString()}`);
  }

  /**
   * Get product blockchain history
   */
  async getProductHistory(id: string): Promise<{
    success: boolean;
    productId: string;
    history: ProductHistoryEvent[];
    blockchainVerified: boolean;
  }> {
    return apiClient.get(`/products/${id}/history`);
  }

  /**
   * Get related products
   */
  async getRelatedProducts(
    id: string,
    limit: number = 8
  ): Promise<{ success: boolean; products: Product[]; count: number }> {
    return apiClient.get(`/products/${id}/related?limit=${limit}`);
  }

  /**
   * Verify a product (Expert only)
   */
  async verifyProduct(
    id: string
  ): Promise<{ success: boolean; product: Product; message: string }> {
    return apiClient.post(`/products/${id}/verify`);
  }

  /**
   * Toggle product feature status
   */
  async toggleFeature(
    id: string,
    featureType: "isFeatured" | "isNewArrival" | "isBestseller"
  ): Promise<{ success: boolean; product: Product; message: string }> {
    return apiClient.patch(`/products/${id}`, { [featureType]: true });
  }
}

export const productAPI = new ProductAPI();
