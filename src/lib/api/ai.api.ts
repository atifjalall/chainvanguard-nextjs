import { apiClient } from "./client";

export const aiApi = {
  /**
   * Generate inventory description using Gemini AI
   * @param {Object} inventoryData - Inventory data for description generation
   * @returns {Promise<{success: boolean, description: string, metadata: Object}}>}
   */
  async generateInventoryDescription(inventoryData: {
    name: string;
    category: string;
    subcategory?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    specifications?: Record<string, any>;
    unit?: string;
    manufacturer?: string;
    origin?: string;
  }) {
    const response = (await apiClient.post(
      "/ai/generate-inventory-description",
      inventoryData
    )) as { data: { success: boolean; description: string; metadata: object } };
    return response.data;
  },

  /**
   * Generate product description using Gemini AI
   * @param {Object} productData - Product data for description generation
   * @returns {Promise<{success: boolean, description: string, metadata: Object}}>}
   */
  async generateProductDescription(productData: {
    name: string;
    category: string;
    materials?: string[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dimensions?: Record<string, any>;
    features?: string[];
    color?: string;
    weight?: string;
  }) {
    const response = (await apiClient.post(
      "/ai/generate-product-description",
      productData
    )) as { data: { success: boolean; description: string; metadata: object } };
    return response.data;
  },

  /**
   * Check AI service health
   * @returns {Promise<{success: boolean, data: {service: string, configured: boolean, status: string}}>}
   */
  async checkHealth() {
    const response = (await apiClient.get("/ai/health")) as {
      data: {
        success: boolean;
        data: { service: string; configured: boolean; status: string };
      };
    };
    return response.data;
  },
};
