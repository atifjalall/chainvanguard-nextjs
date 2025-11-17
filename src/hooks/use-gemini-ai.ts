/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { aiApi } from "@/lib/api/ai.api";
import { toast } from "sonner";

export interface InventoryDescriptionData {
  name: string;
  category: string;
  subcategory?: string;
  specifications?: Record<string, any>;
  unit?: string;
  manufacturer?: string;
  origin?: string;
}

export interface ProductDescriptionData {
  name: string;
  category: string;
  materials?: string[];
  dimensions?: Record<string, any>;
  features?: string[];
  color?: string;
  weight?: string;
}

export function useGeminiAI() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInventoryDescription = async (
    data: InventoryDescriptionData
  ) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await aiApi.generateInventoryDescription(data);

      if (response.success) {
        toast.success("Description generated successfully");
        return response.description;
      } else {
        throw new Error("Failed to generate description");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to generate description";
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const generateProductDescription = async (data: ProductDescriptionData) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await aiApi.generateProductDescription(data);

      if (response.success) {
        toast.success("Product description generated successfully");
        return response.description;
      } else {
        throw new Error("Failed to generate product description");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to generate product description";
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const checkAIHealth = async () => {
    try {
      const response = await aiApi.checkHealth();
      return response.success && response.data.configured;
    } catch (err) {
      return false;
    }
  };

  return {
    isGenerating,
    error,
    generateInventoryDescription,
    generateProductDescription,
    checkAIHealth,
  };
}
