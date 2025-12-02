/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "./client";

/**
 * ========================================
 * BACKUP & DISASTER RECOVERY API
 * ========================================
 * Expert dashboard backup management
 */

export const backupApi = {
  // 📊 DASHBOARD STATUS
  getDashboardStatus: async () => {
    return apiClient.get("/backups/dashboard/status");
  },

  // 📋 LIST BACKUPS
  listBackups: async (params?: {
    page?: number;
    limit?: number;
    type?: "FULL" | "INCREMENTAL";
    status?: "ACTIVE" | "DELETED" | "FAILED";
  }) => {
    return apiClient.get("/backups/list", { params });
  },

  // 🔍 GET BACKUP DETAILS
  getBackupDetails: async (backupId: string) => {
    return apiClient.get(`/backups/${backupId}`);
  },

  // ⚡ MANUAL FULL BACKUP
  triggerFullBackup: async () => {
    return apiClient.post("/backups/dashboard/trigger-full");
  },

  // 🔄 MANUAL INCREMENTAL BACKUP
  triggerIncrementalBackup: async () => {
    return apiClient.post("/backups/dashboard/trigger-incremental");
  },

  // ✅ VERIFY BACKUP
  verifyBackup: async (backupId: string) => {
    return apiClient.post(`/backups/verify/${backupId}`);
  },

  // 🔄 RESTORE BACKUP
  restoreBackup: async (backupId: string) => {
    return apiClient.post(`/backups/restore/${backupId}`);
  },

  // 🗑️ DELETE BACKUP
  deleteBackup: async (backupId: string) => {
    return apiClient.delete(`/backups/${backupId}`);
  },

  // 📊 STORAGE STATS
  getStorageStats: async () => {
    return apiClient.get("/backups/stats/storage");
  },

  // 🔗 BLOCKCHAIN STATS
  getBlockchainStats: async () => {
    return apiClient.get("/backups/stats/blockchain");
  },

  // ⏰ SCHEDULE STATUS
  getScheduleStatus: async () => {
    return apiClient.get("/backups/schedule");
  },

  // 🚀 START SCHEDULER
  startScheduler: async () => {
    return apiClient.post("/backups/dashboard/start-scheduler");
  },

  // ⏸️ STOP SCHEDULER
  stopScheduler: async () => {
    return apiClient.post("/backups/dashboard/stop-scheduler");
  },

  // 📊 STORAGE CHECK
  checkStorage: async () => {
    return apiClient.post("/backups/dashboard/check-storage");
  },

  // 🔔 GET ALERTS
  getAlerts: async (limit?: number) => {
    return apiClient.get("/backups/dashboard/alerts", {
      params: { limit },
    });
  },

  // ⚠️ GET CRITICAL ALERTS
  getCriticalAlerts: async (limit?: number) => {
    return apiClient.get("/backups/dashboard/critical-alerts", {
      params: { limit },
    });
  },

  // 🧹 MANUAL CLEANUP
  manualCleanup: async () => {
    return apiClient.post("/backups/cleanup");
  },

  // 🚨 EMERGENCY RECOVERY (from blockchain)
  emergencyRecovery: async () => {
    return apiClient.post("/backups/emergency-recovery");
  },

  // 🔗 GET BACKUPS FROM BLOCKCHAIN
  getBackupsFromBlockchain: async () => {
    return apiClient.get("/backups/blockchain");
  },
};
