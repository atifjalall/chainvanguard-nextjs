/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/api/auth.api.ts
import { apiClient } from "./client";
import { User, UserRole } from "@/types";

export interface RegisterPayload {
  walletName: string;
  password: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole | "expert";
  address: string;
  city: string;
  state?: string;
  country: string;

  postalCode: string;
  companyName?: string;
  businessType?: string;
  businessAddress?: string;
  registrationNumber?: string;
  taxId?: string;
  acceptedTerms: boolean;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    wallet: {
      address: string;
      mnemonic: string;
    };
    verificationCode?: string;
  };
  warning?: string;
}

export interface LoginPayload {
  address?: string;
  walletAddress?: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
    session: {
      sessionId: string;
      expiresAt: string;
    };
  };
}

export interface WalletRecoverPayload {
  mnemonic: string;
  newPassword: string;
}

export interface ProfileResponse {
  success: boolean;
  data: User;
}

class AuthAPI {
  /**
   * Register new user with wallet creation
   */
  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    try {
      console.log("[AUTH API] Registering user:", {
        email: payload.email,
        role: payload.role,
      });

      const response = await apiClient.post<RegisterResponse>(
        "/auth/register",
        payload
      );

      console.log("[AUTH API] Registration successful:", response);

      // Don't save token yet - user needs to complete verification
      return response;
    } catch (error: any) {
      console.error("[AUTH API] Registration failed:", error);
      throw new Error(error.response?.data?.error || "Registration failed");
    }
  }

  /**
   * Login with wallet address and password
   */
  async login(payload: LoginPayload): Promise<LoginResponse> {
    try {
      console.log("[AUTH API] Logging in:", {
        address: payload.address || payload.walletAddress,
      });

      const response = await apiClient.post<LoginResponse>(
        "/auth/login",
        payload
      );

      console.log("[AUTH API] Login successful");

      // Save authentication data
      if (response.data.token && response.data.user) {
        apiClient.saveAuthData(response.data.token, response.data.user);
      }

      return response;
    } catch (error: any) {
      console.error("[AUTH API] Login failed:", error);
      throw new Error(error.response?.data?.error || "Login failed");
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<ProfileResponse> {
    try {
      const response = await apiClient.get<ProfileResponse>("/auth/profile");
      return response;
    } catch (error: any) {
      console.error("[AUTH API] Get profile failed:", error);
      throw new Error(error.response?.data?.error || "Failed to get profile");
    }
  }

  /**
   * Recover wallet with mnemonic phrase
   */
  async recoverWallet(payload: WalletRecoverPayload): Promise<any> {
    try {
      console.log("[AUTH API] Recovering wallet");

      const response = await apiClient.post("/auth/wallet/recover", payload);

      console.log("[AUTH API] Wallet recovery successful");

      return response;
    } catch (error: any) {
      console.error("[AUTH API] Wallet recovery failed:", error);
      throw new Error(error.response?.data?.error || "Wallet recovery failed");
    }
  }

  /**
   * Find wallet address from mnemonic
   */
  async findWallet(mnemonic: string): Promise<any> {
    try {
      const response = await apiClient.post("/auth/wallet/find", { mnemonic });
      return response;
    } catch (error: any) {
      console.error("[AUTH API] Find wallet failed:", error);
      throw new Error(error.response?.data?.error || "Failed to find wallet");
    }
  }

  /**
   * Verify email with code
   */
  async verifyEmail(code: string): Promise<any> {
    try {
      const response = await apiClient.post("/auth/verify-email", { code });
      return response;
    } catch (error: any) {
      console.error("[AUTH API] Email verification failed:", error);
      throw new Error(
        error.response?.data?.error || "Email verification failed"
      );
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout");
      apiClient.clearAuthData();
    } catch (error: any) {
      console.error("[AUTH API] Logout failed:", error);
      // Clear local data even if API call fails
      apiClient.clearAuthData();
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<any> {
    try {
      const response = (await apiClient.post<LoginResponse>(
        "/auth/refresh"
      )) as LoginResponse;

      if (response.data?.token) {
        apiClient.saveAuthData(response.data.token, response.data.user);
      }

      return response;
    } catch (error: any) {
      console.error("[AUTH API] Token refresh failed:", error);
      throw new Error("Session expired. Please login again.");
    }
  }

  /**
   * Find wallet address from mnemonic phrase
   */
  async findWalletByMnemonic(mnemonic: string): Promise<any> {
    try {
      console.log("[AUTH API] Finding wallet by mnemonic");

      const response = (await apiClient.post("/auth/wallet/find", {
        mnemonic: mnemonic.trim(),
      })) as { data: { walletAddress: string } };

      console.log("[AUTH API] Wallet found:", response.data.walletAddress);
      return response;
    } catch (error: any) {
      console.error("[AUTH API] Find wallet failed:", error);

      // ✅ PRESERVE THE FULL ERROR OBJECT
      if (error.response) {
        // Backend error - preserve status and data
        throw error;
      } else {
        // Network or other error
        throw new Error(error.message || "Failed to find wallet");
      }
    }
  }

  /**
   * Recover wallet and reset password
   */
  async recoverWalletPassword(payload: {
    mnemonic: string;
    walletAddress: string;
    newPassword: string;
  }): Promise<any> {
    try {
      console.log("[AUTH API] Recovering wallet password");

      const response = await apiClient.post("/auth/wallet/recover", {
        mnemonic: payload.mnemonic.trim(),
        walletAddress: payload.walletAddress,
        newPassword: payload.newPassword,
      });

      console.log("[AUTH API] Password reset successful");
      return response;
    } catch (error: any) {
      console.error("[AUTH API] Password recovery failed:", error);

      if (error.response) {
        throw error;
      } else {
        throw new Error(error.message || "Failed to reset password");
      }
    }
  }

  /**
   * Check if wallet address exists
   */
  async checkWalletExists(walletAddress: string): Promise<any> {
    try {
      console.log("[AUTH API] Checking if wallet exists");

      const response = await apiClient.post<{
        data: { walletAddress: string };
      }>("/auth/wallet/exists", {
        walletAddress: walletAddress.trim(),
      });

      console.log("[AUTH API] Wallet exists:", response.data.walletAddress);
      return response;
    } catch (error: any) {
      console.error("[AUTH API] Wallet check failed:", error);

      if (error.response) {
        throw error;
      } else {
        throw new Error(error.message || "Failed to check wallet");
      }
    }
  }
}

export const authAPI = new AuthAPI();
