import express from "express";
import notificationService from "../services/notification.service.js";
import { authenticate } from "../middleware/auth.middleware.js";
import logger from "../utils/logger.js";

const router = express.Router();

// ========================================
// GET USER NOTIFICATIONS
// ========================================
router.get("/", authenticate, async (req, res) => {
  try {
    // SAFE MODE: Notifications unavailable (not backed up)
    if (req.safeMode) {
      return res.json({
        success: true,
        safeMode: true,
        data: {
          notifications: [],
          pagination: {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 20,
            total: 0,
            pages: 0
          }
        },
        message: "Notifications temporarily unavailable during maintenance",
        warning: "Notification history will be available when maintenance completes."
      });
    }

    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 20,
      category: req.query.category,
      isRead: req.query.isRead,
      priority: req.query.priority,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const result = await notificationService.getUserNotifications(
      req.user.userId,
      options
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Error in GET /notifications:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching notifications",
    });
  }
});

// ========================================
// GET UNREAD COUNT
// ========================================
router.get("/unread-count", authenticate, async (req, res) => {
  try {
    const result = await notificationService.getUnreadCount(req.user.userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Error in GET /notifications/unread-count:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching unread count",
    });
  }
});

// ========================================
// GET NOTIFICATION STATISTICS
// ========================================
router.get("/stats", authenticate, async (req, res) => {
  try {
    const days = req.query.days || 30;
    const stats = await notificationService.getNotificationStats(
      req.user.userId,
      Number(days)
    );

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("Error in GET /notifications/stats:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching statistics",
    });
  }
});

// ========================================
// GET NOTIFICATIONS BY CATEGORY
// ========================================
router.get("/category/:category", authenticate, async (req, res) => {
  try {
    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 20,
    };

    const result = await notificationService.getNotificationsByCategory(
      req.user.userId,
      req.params.category,
      options
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Error in GET /notifications/category/:category:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching notifications by category",
    });
  }
});

// ========================================
// GET NOTIFICATION BY ID
// ========================================
router.get("/:id", authenticate, async (req, res) => {
  try {
    const notification = await notificationService.getNotificationById(
      req.params.id,
      req.user.userId
    );

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    logger.error("Error in GET /notifications/:id:", error);
    res.status(404).json({
      success: false,
      message: error.message || "Notification not found",
    });
  }
});

// ========================================
// MARK NOTIFICATION AS READ
// ========================================
router.patch("/:id/read", authenticate, async (req, res) => {
  try {
    const notification = await notificationService.markAsRead(
      req.params.id,
      req.user.userId
    );

    res.json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    logger.error("Error in PATCH /notifications/:id/read:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error marking notification as read",
    });
  }
});

// ========================================
// MARK ALL AS READ
// ========================================
router.patch("/mark-all-read", authenticate, async (req, res) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.userId);

    res.json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    logger.error("Error in PATCH /notifications/mark-all-read:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error marking all notifications as read",
    });
  }
});

// ========================================
// ARCHIVE NOTIFICATION
// ========================================
router.patch("/:id/archive", authenticate, async (req, res) => {
  try {
    const notification = await notificationService.archiveNotification(
      req.params.id,
      req.user.userId
    );

    res.json({
      success: true,
      message: "Notification archived",
      data: notification,
    });
  } catch (error) {
    logger.error("Error in PATCH /notifications/:id/archive:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error archiving notification",
    });
  }
});

// ========================================
// DELETE NOTIFICATION
// ========================================
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const result = await notificationService.deleteNotification(
      req.params.id,
      req.user.userId
    );

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    logger.error("Error in DELETE /notifications/:id:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error deleting notification",
    });
  }
});

// ========================================
// DELETE ALL NOTIFICATIONS
// ========================================
router.delete("/", authenticate, async (req, res) => {
  try {
    const result = await notificationService.deleteAllNotifications(
      req.user.userId
    );

    res.json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    logger.error("Error in DELETE /notifications:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error deleting notifications",
    });
  }
});

// ========================================
// RECORD NOTIFICATION ACTION
// ========================================
router.post("/:id/action", authenticate, async (req, res) => {
  try {
    const { action } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        message: "Action is required",
      });
    }

    const notification = await notificationService.recordNotificationAction(
      req.params.id,
      req.user.userId,
      action
    );

    res.json({
      success: true,
      message: "Action recorded",
      data: notification,
    });
  } catch (error) {
    logger.error("Error in POST /notifications/:id/action:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error recording action",
    });
  }
});

// ========================================
// CREATE NOTIFICATION (Admin/System only)
// ========================================
router.post("/", authenticate, async (req, res) => {
  try {
    // Only experts (admins) can create notifications manually
    if (req.user.role !== "expert") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admins can create notifications.",
      });
    }

    const notificationData = {
      ...req.body,
      senderId: req.user.userId,
      senderRole: req.user.role,
    };

    const notification =
      await notificationService.createNotification(notificationData);

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: notification,
    });
  } catch (error) {
    logger.error("Error in POST /notifications:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error creating notification",
    });
  }
});

// ========================================
// CREATE BULK NOTIFICATIONS (Admin only)
// ========================================
router.post("/bulk", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "expert") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admins can create bulk notifications.",
      });
    }

    const { userIds, notificationData } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "User IDs array is required",
      });
    }

    if (!notificationData) {
      return res.status(400).json({
        success: false,
        message: "Notification data is required",
      });
    }

    const notifications = await notificationService.createBulkNotifications(
      userIds,
      {
        ...notificationData,
        senderId: req.user.userId,
        senderRole: req.user.role,
      }
    );

    res.status(201).json({
      success: true,
      message: "Bulk notifications created successfully",
      data: {
        count: notifications.length,
        notifications,
      },
    });
  } catch (error) {
    logger.error("Error in POST /notifications/bulk:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error creating bulk notifications",
    });
  }
});

export default router;
