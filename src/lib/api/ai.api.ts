import { apiClient } from "./client";

interface ProductData {
  name: string;
  category: string;
  subcategory?: string;
  materials?: string[];
  dimensions?: Record<string, string | number>;
  features?: string[];
  specifications?: Record<string, string | number>;
  color?: string;
  weight?: string;
  brand?: string;
  warranty?: string;
}

interface InventoryData {
  name: string;
  category: string;
  subcategory?: string;
  specifications?: Record<string, string | number>;
  unit?: string;
  manufacturer?: string;
  origin?: string;
}

interface AIResponse {
  success: boolean;
  description: string;
  metadata: {
    model: string;
    generatedAt: Date;
  };
}

interface HealthResponse {
  success: boolean;
  data: {
    service: string;
    model: string;
    configured: boolean;
    status: string;
  };
}

export const aiApi = {
  /**
   * Generate product description using Gemini AI
   */
  async generateProductDescription(productData: ProductData): Promise<AIResponse> {
    const response = await apiClient.post<{ data: AIResponse }>(
      "/ai/generate-product-description",
      productData
    );
    return response.data;
  },

  /**
   * Generate inventory description using Gemini AI
   */
  async generateInventoryDescription(inventoryData: InventoryData): Promise<AIResponse> {
    const response = await apiClient.post<{ data: AIResponse }>(
      "/ai/generate-inventory-description",
      inventoryData
    );
    return response.data;
  },

  /**
   * Check AI service health
   */
  async checkHealth(): Promise<HealthResponse> {
    const response = await apiClient.get<{ data: HealthResponse["data"] }>("/ai/health");
    return {
      success: true,
      data: response.data,
    };
  },
};