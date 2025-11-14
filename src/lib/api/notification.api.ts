/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "./client";

export interface Notification {
  _id: string;
  userId: string;
  userRole: string;
  type: string;
  category: string;
  title: string;
  message: string;
  shortMessage?: string;
  priority: string;
  isUrgent: boolean;
  isRead: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  isSent: boolean;
  createdAt: string;
  updatedAt: string;
  sentAt: string;
  expiresAt?: string;
  actionUrl?: string;
  actionText?: string;
  actionType?: string;
  actionTaken?: string;
  action?: {
    url?: string;
  };
  relatedEntity?: {
    entityType: string;
    entityId: string;
    entityData?: any;
  };
  transactionId?: string;
  blockchainTxId?: string;
  blockchainVerified: boolean;
  senderName?: string;
  senderRole?: string;
  channels?: {
    inApp?: {
      enabled: boolean;
      sent: boolean;
      sentAt?: string;
    };
    email?: {
      enabled: boolean;
      sent: boolean;
      emailId?: string;
    };
    sms?: {
      enabled: boolean;
      sent: boolean;
      smsId?: string;
    };
    push?: {
      enabled: boolean;
      sent: boolean;
      pushId?: string;
    };
  };
  tags?: string[];
  images?: string[];
  deliveryStatus?: string;
  deliveryError?: string;
  retryCount?: number;
  maxRetries?: number;
  canDismiss?: boolean;
  autoArchiveAfterDays?: number;
  requiresAcknowledgment?: boolean;
  metadata?: {
    requestNumber?: string;
  };
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const notificationApi = {
  getNotifications: async (): Promise<NotificationsResponse> => {
    console.log("📡 API: Fetching notifications from /notifications");
    const response = (await apiClient.get("/notifications")) as any;
    console.log("📡 API: Response received:", response);
    return response.data;
  },

  markAsRead: async (notificationId: string): Promise<{ success: boolean }> => {
    console.log(`📡 API: Marking notification as read: ${notificationId}`);
    const response = (await apiClient.patch(
      `/notifications/${notificationId}/read`
    )) as any;
    console.log("📡 API: Mark as read response:", response);
    return response.data;
  },

  markAllAsRead: async (): Promise<{ success: boolean }> => {
    console.log("📡 API: Marking all notifications as read");
    const response = (await apiClient.patch(
      "/notifications/mark-all-read"
    )) as any;
    console.log("📡 API: Mark all as read response:", response);
    return response.data;
  },

  deleteNotification: async (
    notificationId: string
  ): Promise<{ success: boolean }> => {
    const response = (await apiClient.delete(
      `/notifications/${notificationId}`
    )) as any;
    return response.data;
  },
};
