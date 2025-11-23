/* eslint-disable @typescript-eslint/no-explicit-any */
import { User } from "@/types";
import { apiClient } from "./client";

export interface UpdateProfileData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  companyName?: string;
  businessAddress?: string;
  businessType?: string;
  registrationNumber?: string;
}

export interface ProfileStats {
  memberSince: string;
  totalOrders: number;
  savedItems: number;
}

export interface ProfileUpdateResponse {
  success: boolean;
  user?: User;
  message?: string;
  blockchainTxId?: string;
  error?: string;
}

/**
 * Get user profile statistics
 */
export const getProfileStats = async (): Promise<{
  success: boolean;
  data?: ProfileStats;
  error?: string;
}> => {
  try {
    const result = await apiClient.get<{ success: boolean; data: ProfileStats }>(
      "/auth/profile/stats"
    );

    return {
      success: true,
      data: result.data,
    };
  } catch (error: any) {
    console.error("Profile stats fetch error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch profile stats",
    };
  }
};

/**
 * Update user profile in database and on blockchain
 */
export const updateProfile = async (
  profileData: UpdateProfileData
): Promise<ProfileUpdateResponse> => {
  try {
    // Update in database
    const dbResult = await apiClient.put<{ success: boolean; data: User }>(
      "/auth/profile",
      profileData
    );

    // If database update successful, update on blockchain
    let blockchainTxId: string | undefined;

    try {
      const blockchainResult = await apiClient.post<{ txId?: string }>(
        "/blockchain/update-profile",
        {
          profileData,
          dbTransactionId: dbResult.data?._id || "success",
        }
      );

      blockchainTxId = blockchainResult.txId;
    } catch (blockchainError) {
      console.warn("Blockchain update failed, but database update succeeded");
      // Continue without failing the whole operation
    }

    return {
      success: true,
      user: dbResult.data,
      message: "Profile updated successfully",
      blockchainTxId,
    };
  } catch (error: any) {
    console.error("Profile update error:", error);
    return {
      success: false,
      error: error.message || "Failed to update profile",
    };
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (): Promise<ProfileUpdateResponse> => {
  try {
    const result = await apiClient.get<{ success: boolean; data: User }>(
      "/auth/profile"
    );

    return {
      success: true,
      user: result.data,
      message: "Profile fetched successfully",
    };
  } catch (error: any) {
    console.error("Profile fetch error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch profile",
    };
  }
};

/**
 * Verify profile data against blockchain
 */
export const verifyProfileOnChain = async (): Promise<{
  success: boolean;
  verified: boolean;
  txId?: string;
}> => {
  try {
    const result = await apiClient.get<{
      verified: boolean;
      txId?: string;
    }>("/blockchain/verify-profile");

    return {
      success: true,
      verified: result.verified,
      txId: result.txId,
    };
  } catch (error: any) {
    console.error("Profile verification error:", error);
    return {
      success: false,
      verified: false,
    };
  }
};

/**
 * Update specific profile fields that require blockchain updates
 */
export const updateProfileField = async (
  field: keyof UpdateProfileData,
  value: string
): Promise<ProfileUpdateResponse> => {
  const updateData: UpdateProfileData = {};
  updateData[field] = value;

  return updateProfile(updateData);
};
