/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "./client";
import {
  SupplierRating,
  SupplierRatingStats,
  RatingEligibility,
  SubmitRatingData,
} from "@/types";

/**
 * SUPPLIER RATING API
 */

export const supplierRatingApi = {
  /**
   * Submit or update rating for a supplier
   */
  rateSupplier: async (
    supplierId: string,
    data: SubmitRatingData
  ): Promise<{ success: boolean; message: string; rating: SupplierRating }> => {
    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        rating: SupplierRating;
      }>(`/suppliers/${supplierId}/rate`, data);
      return response;
    } catch (error: any) {
      throw new Error(error?.message || "Failed to submit rating");
    }
  },

  /**
   * Get vendor's own rating for a supplier
   */
  getMyRating: async (
    supplierId: string
  ): Promise<{ success: boolean; rating: SupplierRating | null }> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        rating: SupplierRating | null;
      }>(`/suppliers/${supplierId}/my-rating`);
      return response;
    } catch (error: any) {
      throw new Error(error?.message || "Failed to fetch rating");
    }
  },

  /**
   * Check if vendor can rate this supplier
   */
  canRate: async (supplierId: string): Promise<RatingEligibility> => {
    try {
      const response = await apiClient.get<RatingEligibility>(
        `/suppliers/${supplierId}/can-rate`
      );
      return response;
    } catch (error: any) {
      throw new Error(error?.message || "Failed to check eligibility");
    }
  },

  /**
   * Get all ratings for a supplier
   */
  getSupplierRatings: async (
    supplierId: string,
    filters?: {
      minRating?: number;
      withCommentsOnly?: boolean;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    }
  ): Promise<{
    success: boolean;
    ratings: SupplierRating[];
    pagination: any;
  }> => {
    try {
      const params = new URLSearchParams();
      if (filters?.minRating)
        params.append("minRating", filters.minRating.toString());
      if (filters?.withCommentsOnly) params.append("withCommentsOnly", "true");
      if (filters?.page) params.append("page", filters.page.toString());
      if (filters?.limit) params.append("limit", filters.limit.toString());
      if (filters?.sortBy) params.append("sortBy", filters.sortBy);
      if (filters?.sortOrder) params.append("sortOrder", filters.sortOrder);

      const response = await apiClient.get<{
        success: boolean;
        ratings: SupplierRating[];
        pagination: any;
      }>(`/suppliers/${supplierId}/ratings?${params.toString()}`);
      return response;
    } catch (error: any) {
      throw new Error(error?.message || "Failed to fetch ratings");
    }
  },

  /**
   * Get rating statistics for a supplier
   */
  getRatingStats: async (
    supplierId: string
  ): Promise<{
    success: boolean;
    stats: SupplierRatingStats;
    recentRatings: SupplierRating[];
  }> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        stats: SupplierRatingStats;
        recentRatings: SupplierRating[];
      }>(`/suppliers/${supplierId}/rating-stats`);
      return response;
    } catch (error: any) {
      throw new Error(error?.message || "Failed to fetch statistics");
    }
  },

  /**
   * Get all ratings submitted by this vendor
   */
  getMySubmittedRatings: async (filters?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<{
    success: boolean;
    ratings: SupplierRating[];
    pagination: any;
  }> => {
    try {
      const params = new URLSearchParams();
      if (filters?.page) params.append("page", filters.page.toString());
      if (filters?.limit) params.append("limit", filters.limit.toString());
      if (filters?.sortBy) params.append("sortBy", filters.sortBy);
      if (filters?.sortOrder) params.append("sortOrder", filters.sortOrder);

      const response = await apiClient.get<{
        success: boolean;
        ratings: SupplierRating[];
        pagination: any;
      }>(`/suppliers/my-ratings?${params.toString()}`);
      return response;
    } catch (error: any) {
      throw new Error(error?.message || "Failed to fetch ratings");
    }
  },

  /**
   * Add supplier response to a rating
   */
  respondToRating: async (
    ratingId: string,
    comment: string
  ): Promise<{ success: boolean; message: string; rating: SupplierRating }> => {
    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        rating: SupplierRating;
      }>(`/suppliers/ratings/${ratingId}/respond`, { comment });
      return response;
    } catch (error: any) {
      throw new Error(error?.message || "Failed to add response");
    }
  },

  /**
   * Vote on a rating (helpful/unhelpful)
   */
  voteOnRating: async (
    ratingId: string,
    vote: "helpful" | "unhelpful"
  ): Promise<{
    success: boolean;
    message: string;
    helpfulCount: number;
    unhelpfulCount: number;
  }> => {
    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        helpfulCount: number;
        unhelpfulCount: number;
      }>(`/suppliers/ratings/${ratingId}/vote`, { vote });
      return response;
    } catch (error: any) {
      throw new Error(error?.message || "Failed to vote");
    }
  },

  /**
   * Flag a rating as inappropriate
   */
  flagRating: async (
    ratingId: string,
    reason: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
      }>(`/suppliers/ratings/${ratingId}/flag`, { reason });
      return response;
    } catch (error: any) {
      throw new Error(error?.message || "Failed to flag rating");
    }
  },
};

export default supplierRatingApi;
