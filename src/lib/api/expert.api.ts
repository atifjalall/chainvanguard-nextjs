/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "./client";

/**
 * ========================================
 * EXPERT DASHBOARD API
 * ========================================
 */

export const expertApi = {
  // 📊 DASHBOARD
  getDashboardStats: async () => {
    return apiClient.get("/expert/dashboard");
  },

  // 📜 TRANSACTIONS
  getAllTransactions: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    search?: string; // Add search parameter
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) => {
    return apiClient.get("/expert/transactions", { params });
  },

  getTransactionDetails: async (txId: string) => {
    return apiClient.get(`/expert/transactions/${txId}`);
  },

  // 🔗 CONSENSUS
  getConsensusStatus: async () => {
    return apiClient.get("/expert/consensus/status");
  },

  getConsensusMetrics: async (timeRange: string = "24h") => {
    return apiClient.get(`/expert/consensus/metrics?timeRange=${timeRange}`);
  },

  // ⚡ FAULT TOLERANCE
  getFaultToleranceStatus: async () => {
    return apiClient.get("/expert/fault-tolerance/status");
  },

  getFaultToleranceStats: async (timeRange: string = "7d") => {
    return apiClient.get(
      `/expert/fault-tolerance/stats?timeRange=${timeRange}`
    );
  },

  // 📝 BLOCKCHAIN LOGS
  getBlockchainLogs: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    return apiClient.get("/expert/logs", { params });
  },

  getEntityLogs: async (entityId: string, entityType: string) => {
    return apiClient.get(`/expert/logs/${entityId}?entityType=${entityType}`);
  },

  // 🔒 SECURITY
  getSecurityOverview: async () => {
    return apiClient.get("/expert/security/overview");
  },

  getSecurityWallets: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    role?: string;
    sortBy?: string;
    sortOrder?: string;
    balanceMin?: number;
    balanceMax?: number;
  }) => {
    return apiClient.get("/expert/security/wallets", { params });
  },

  disableUser: async (userId: string, reason: string) => {
    return apiClient.post("/expert/security/disable-user", { userId, reason });
  },

  unfreezeUser: async (userId: string, reason: string) => {
    return apiClient.post("/expert/security/unfreeze-user", { userId, reason });
  },

  // SECURITY - Wallet by user ID (try expert route first, fallback to /wallet)
  getWalletByUserId: async (userId: string) => {
    // try expert route first
    try {
      return await apiClient.get(`/expert/wallet/${userId}`);
    } catch (err: any) {
      // If server doesn't have expert route, try fallback /wallet
      const isNotFound =
        err?.response?.status === 404 ||
        (err?.message && err.message.toLowerCase().includes("does not exist"));

      if (isNotFound) {
        try {
          return await apiClient.get(`/wallet/${userId}`);
        } catch (fallbackErr: any) {
          // Return a normalized failure response for frontend handling
          return {
            success: false,
            message:
              fallbackErr?.response?.data?.message ||
              fallbackErr?.message ||
              "Failed to fetch wallet",
            error: fallbackErr,
          };
        }
      }

      // Other errors: return normalized failure response instead of throwing
      return {
        success: false,
        message:
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch wallet",
        error: err,
      };
    }
  },
};
