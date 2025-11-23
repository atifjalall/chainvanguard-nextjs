import Notification from "../models/Notifications.js";
import User from "../models/User.js";
import redisService from "./redis.service.js";
import logger from "../utils/logger.js";

// ========================================
// NOTIFICATION SERVICE
// ========================================
class NotificationService {
  // ========================================
  // CREATE NOTIFICATION
  // ========================================
  async createNotification(data) {
    try {
      logger.info("Creating notification", {
        userId: data.userId,
        type: data.type,
      });

      // Validate user exists
      const user = await User.findById(data.userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Set defaults based on user preferences
      const notificationData = {
        ...data,
        channels: {
          inApp: {
            enabled: true,
            sent: true,
            sentAt: new Date(),
          },
          email: {
            enabled: user.notificationPreferences?.email || false,
            sent: false,
          },
          sms: {
            enabled: user.notificationPreferences?.sms || false,
            sent: false,
          },
          push: {
            enabled: user.notificationPreferences?.push || false,
            sent: false,
          },
        },
        isSent: true,
        sentAt: new Date(),
      };

      const notification = await Notification.create(notificationData);

      // Clear user's notification cache
      await redisService.del(`notifications:user:${data.userId}`);

      // TODO: Implement actual email/SMS/push sending based on channels
      // if (notificationData.channels.email.enabled) {
      //   await this.sendEmail(notification);
      // }

      logger.info("Notification created", { notificationId: notification._id });

      return notification;
    } catch (error) {
      logger.error("Error creating notification:", error);
      throw error;
    }
  }

  // ========================================
  // CREATE BULK NOTIFICATIONS
  // ========================================
  async createBulkNotifications(userIds, notificationData) {
    try {
      const notifications = userIds.map((userId) => ({
        ...notificationData,
        userId,
        channels: {
          inApp: { enabled: true, sent: true, sentAt: new Date() },
          email: { enabled: false, sent: false },
          sms: { enabled: false, sent: false },
          push: { enabled: false, sent: false },
        },
        isSent: true,
        sentAt: new Date(),
      }));

      const result = await Notification.insertMany(notifications);

      // Clear cache for all users
      for (const userId of userIds) {
        await redisService.del(`notifications:user:${userId}`);
      }

      logger.info("Bulk notifications created", { count: result.length });

      return result;
    } catch (error) {
      logger.error("Error creating bulk notifications:", error);
      throw error;
    }
  }

  // ========================================
  // GET USER NOTIFICATIONS
  // ========================================
  async getUserNotifications(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        isRead,
        priority,
        startDate,
        endDate,
      } = options;

      // Build query
      const query = {
        userId,
        isDeleted: false,
      };

      if (category) query.category = category;
      if (isRead !== undefined) query.isRead = isRead === "true";
      if (priority) query.priority = priority;

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      // Check cache (only for first page without filters)
      if (page === 1 && !category && isRead === undefined && !priority) {
        const cacheKey = `notifications:user:${userId}`;
        const cached = await redisService.get(cacheKey);
        if (cached) {
          logger.info("Returning cached notifications");
          return cached;
        }
      }

      // Pagination
      const skip = (page - 1) * limit;

      // Execute query
      const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(query)
          .sort({ createdAt: -1, priority: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Notification.countDocuments(query),
        Notification.countDocuments({
          userId,
          isRead: false,
          isDeleted: false,
        }),
      ]);

      const result = {
        notifications,
        unreadCount,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };

      // Cache for 2 minutes (first page only)
      if (page === 1 && !category && isRead === undefined && !priority) {
        await redisService.set(`notifications:user:${userId}`, result, 120);
      }

      return result;
    } catch (error) {
      logger.error("Error fetching notifications:", error);
      throw error;
    }
  }

  // ========================================
  // GET NOTIFICATION BY ID
  // ========================================
  async getNotificationById(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        userId,
      }).lean();

      if (!notification) {
        throw new Error("Notification not found");
      }

      return notification;
    } catch (error) {
      logger.error("Error fetching notification:", error);
      throw error;
    }
  }

  // ========================================
  // MARK AS READ
  // ========================================
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        {
          $set: {
            isRead: true,
            readAt: new Date(),
          },
        },
        { new: true }
      );

      if (!notification) {
        throw new Error("Notification not found");
      }

      // Clear cache
      await redisService.del(`notifications:user:${userId}`);

      logger.info("Notification marked as read", { notificationId });

      return notification;
    } catch (error) {
      logger.error("Error marking notification as read:", error);
      throw error;
    }
  }

  // ========================================
  // MARK ALL AS READ
  // ========================================
  async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        { userId, isRead: false, isDeleted: false },
        {
          $set: {
            isRead: true,
            readAt: new Date(),
          },
        }
      );

      // Clear cache
      await redisService.del(`notifications:user:${userId}`);

      logger.info("All notifications marked as read", {
        userId,
        count: result.modifiedCount,
      });

      return {
        message: "All notifications marked as read",
        count: result.modifiedCount,
      };
    } catch (error) {
      logger.error("Error marking all notifications as read:", error);
      throw error;
    }
  }

  // ========================================
  // ARCHIVE NOTIFICATION
  // ========================================
  async archiveNotification(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        {
          $set: {
            isArchived: true,
            archivedAt: new Date(),
          },
        },
        { new: true }
      );

      if (!notification) {
        throw new Error("Notification not found");
      }

      // Clear cache
      await redisService.del(`notifications:user:${userId}`);

      return notification;
    } catch (error) {
      logger.error("Error archiving notification:", error);
      throw error;
    }
  }

  // ========================================
  // DELETE NOTIFICATION
  // ========================================
  async deleteNotification(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        {
          $set: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        },
        { new: true }
      );

      if (!notification) {
        throw new Error("Notification not found");
      }

      // Clear cache
      await redisService.del(`notifications:user:${userId}`);

      logger.info("Notification deleted", { notificationId });

      return { message: "Notification deleted successfully" };
    } catch (error) {
      logger.error("Error deleting notification:", error);
      throw error;
    }
  }

  // ========================================
  // DELETE ALL NOTIFICATIONS
  // ========================================
  async deleteAllNotifications(userId) {
    try {
      const result = await Notification.updateMany(
        { userId, isDeleted: false },
        {
          $set: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        }
      );

      // Clear cache
      await redisService.del(`notifications:user:${userId}`);

      return {
        message: "All notifications deleted",
        count: result.modifiedCount,
      };
    } catch (error) {
      logger.error("Error deleting all notifications:", error);
      throw error;
    }
  }

  // ========================================
  // GET UNREAD COUNT
  // ========================================
  async getUnreadCount(userId) {
    try {
      const cacheKey = `notifications:unread:${userId}`;
      const cached = await redisService.get(cacheKey);
      if (cached !== null) return { unreadCount: cached };

      const count = await Notification.countDocuments({
        userId,
        isRead: false,
        isDeleted: false,
      });

      // Cache for 1 minute
      await redisService.set(cacheKey, count, 60);

      return { unreadCount: count };
    } catch (error) {
      logger.error("Error fetching unread count:", error);
      throw error;
    }
  }

  // ========================================
  // GET NOTIFICATIONS BY CATEGORY
  // ========================================
  async getNotificationsByCategory(userId, category, options = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      const skip = (page - 1) * limit;

      const [notifications, total] = await Promise.all([
        Notification.find({
          userId,
          category,
          isDeleted: false,
        })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Notification.countDocuments({
          userId,
          category,
          isDeleted: false,
        }),
      ]);

      return {
        notifications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error("Error fetching notifications by category:", error);
      throw error;
    }
  }

  // ========================================
  // RECORD NOTIFICATION ACTION
  // ========================================
  async recordNotificationAction(notificationId, userId, action) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        {
          $set: {
            actionTaken: action,
            actionTakenAt: new Date(),
            clickedAt: new Date(),
          },
        },
        { new: true }
      );

      if (!notification) {
        throw new Error("Notification not found");
      }

      return notification;
    } catch (error) {
      logger.error("Error recording notification action:", error);
      throw error;
    }
  }

  // ========================================
  // GET NOTIFICATION STATISTICS
  // ========================================
  async getNotificationStats(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const stats = await Notification.aggregate([
        {
          $match: {
            userId: userId,
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: "$category",
            total: { $sum: 1 },
            unread: {
              $sum: { $cond: [{ $eq: ["$isRead", false] }, 1, 0] },
            },
            urgent: {
              $sum: { $cond: [{ $eq: ["$isUrgent", true] }, 1, 0] },
            },
          },
        },
      ]);

      return {
        period: `${days} days`,
        categories: stats,
        totalNotifications: stats.reduce((sum, s) => sum + s.total, 0),
        totalUnread: stats.reduce((sum, s) => sum + s.unread, 0),
      };
    } catch (error) {
      logger.error("Error fetching notification stats:", error);
      throw error;
    }
  }

  // ========================================
  // CLEAN OLD NOTIFICATIONS
  // ========================================
  async cleanOldNotifications(daysOld = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await Notification.deleteMany({
        createdAt: { $lt: cutoffDate },
        isDeleted: true,
      });

      logger.info("Old notifications cleaned", { count: result.deletedCount });

      return {
        message: "Old notifications cleaned",
        count: result.deletedCount,
      };
    } catch (error) {
      logger.error("Error cleaning old notifications:", error);
      throw error;
    }
  }

  // ========================================
  // NOTIFICATION TEMPLATES
  // ========================================

  // Order notifications
  async notifyOrderPlaced(orderId, customerId, vendorId, orderDetails) {
    const notifications = [
      {
        userId: customerId,
        userRole: "customer",
        type: "order_placed",
        category: "order",
        title: "Order Placed Successfully",
        message: `Your order #${orderId.slice(-8)} has been placed successfully. Total: $${orderDetails.total}`,
        orderId,
        priority: "high",
        actionType: "view_order",
        actionUrl: `/orders/${orderId}`,
      },
      {
        userId: vendorId,
        userRole: "vendor",
        type: "order_placed",
        category: "order",
        title: "New Order Received",
        message: `New order #${orderId.slice(-8)} received. Total: $${orderDetails.total}`,
        orderId,
        priority: "high",
        actionType: "view_order",
        actionUrl: `/orders/${orderId}`,
      },
    ];

    for (const notif of notifications) {
      await this.createNotification(notif);
    }
  }

  // Inventory notifications
  async notifyLowStock(supplierId, inventoryItem) {
    await this.createNotification({
      userId: supplierId,
      userRole: "supplier",
      type: "low_stock",
      category: "inventory",
      title: "Low Stock Alert",
      message: `"${inventoryItem.name}" is running low. Current: ${inventoryItem.quantity}, Minimum: ${inventoryItem.minStockLevel}`,
      inventoryId: inventoryItem._id,
      priority: "high",
      isUrgent: true,
      actionType: "check_inventory",
      actionUrl: `/inventory/${inventoryItem._id}`,
    });
  }

  // Payment notifications
  async notifyPaymentReceived(userId, amount, orderId) {
    await this.createNotification({
      userId,
      userRole: "vendor",
      type: "payment_received",
      category: "payment",
      title: "Payment Received",
      message: `Payment of CVT ${amount} received for order #${orderId.slice(-8)}`,
      orderId,
      priority: "medium",
    });
  }

  // Blockchain notifications
  async notifyBlockchainTransaction(userId, userRole, txType, txId) {
    await this.createNotification({
      userId,
      userRole,
      type: "blockchain_transaction_confirmed",
      category: "blockchain",
      title: "Transaction Confirmed",
      message: `Your ${txType} transaction has been confirmed on the blockchain.`,
      transactionId: txId,
      priority: "low",
    });
  }
}

export default new NotificationService();
