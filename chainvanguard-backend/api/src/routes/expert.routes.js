import express from "express";
import expertService from "../services/expert.service.js";
import logger from "../utils/logger.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

// All expert routes require authentication and expert role
router.use(authenticate);
router.use(authorizeRoles("expert"));

/**
 * GET /api/expert/dashboard
 * Get expert dashboard statistics
 */
router.get("/dashboard", async (req, res) => {
  try {
    const result = await expertService.getDashboardStats();
    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Get dashboard stats failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get dashboard statistics",
    });
  }
});

/**
 * GET /api/expert/transactions
 * Get all blockchain transactions with filters
 */
router.get("/transactions", async (req, res) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      type: req.query.type,
      status: req.query.status,
      userId: req.query.userId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      sortBy: req.query.sortBy || "timestamp",
      sortOrder: req.query.sortOrder || "desc",
    };

    const result = await expertService.getAllTransactions(filters);
    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Get transactions failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get transactions",
    });
  }
});

/**
 * GET /api/expert/transactions/:txId
 * Get transaction details
 */
router.get("/transactions/:txId", async (req, res) => {
  try {
    const { txId } = req.params;
    const result = await expertService.getTransactionDetails(txId);
    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Get transaction details failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get transaction details",
    });
  }
});

/**
 * GET /api/expert/consensus/status
 * Get consensus monitoring status
 */
router.get("/consensus/status", async (req, res) => {
  try {
    const result = await expertService.getConsensusStatus();
    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Get consensus status failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get consensus status",
    });
  }
});

/**
 * GET /api/expert/consensus/metrics
 * Get consensus metrics with time range
 * Query params: timeRange (1h, 24h, 7d, 30d)
 */
router.get("/consensus/metrics", async (req, res) => {
  try {
    const timeRange = req.query.timeRange || "24h";
    const result = await expertService.getConsensusMetrics(timeRange);
    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Get consensus metrics failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get consensus metrics",
    });
  }
});

/**
 * GET /api/expert/fault-tolerance/status
 * Get fault tolerance status
 */
router.get("/fault-tolerance/status", async (req, res) => {
  try {
    const result = await expertService.getFaultToleranceStatus();
    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Get fault tolerance status failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get fault tolerance status",
    });
  }
});

/**
 * GET /api/expert/fault-tolerance/stats
 * Get fault tolerance statistics
 * Query params: timeRange (24h, 7d, 30d)
 */
router.get("/fault-tolerance/stats", async (req, res) => {
  try {
    const timeRange = req.query.timeRange || "7d";
    const result = await expertService.getFaultToleranceStats(timeRange);
    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Get fault tolerance stats failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get fault tolerance stats",
    });
  }
});

/**
 * GET /api/expert/logs
 * Get all blockchain activity logs
 */
router.get("/logs", async (req, res) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 100,
      type: req.query.type,
      status: req.query.status,
      entityType: req.query.entityType,
      performedBy: req.query.performedBy,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const result = await logger.getLogs(filters);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("❌ Get logs failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get logs",
    });
  }
});

/**
 * GET /api/expert/logs/entity/:entityId
 * Get logs for a specific entity
 */
router.get("/logs/entity/:entityId", async (req, res) => {
  try {
    const { entityId } = req.params;
    const { entityType } = req.query;

    if (!entityType) {
      return res.status(400).json({
        success: false,
        message: "Entity type is required",
      });
    }

    const logs = await logger.getEntityLogs(entityId, entityType);

    res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    console.error("❌ Get entity logs failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get entity logs",
    });
  }
});

/**
 * GET /api/expert/security/overview
 * Get security monitoring overview
 */
router.get("/security/overview", async (req, res) => {
  try {
    const result = await expertService.getSecurityOverview();
    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Get security overview failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get security overview",
    });
  }
});

/**
 * POST /api/expert/security/disable-user
 * Disable a user account (security action)
 * Body: { userId, reason }
 */
router.post("/security/disable-user", async (req, res) => {
  try {
    const { userId, reason } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Reason is required",
      });
    }

    const expertId = req.userId;
    const result = await expertService.disableUser(userId, expertId, reason);

    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Disable user failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to disable user",
    });
  }
});

export default router;
