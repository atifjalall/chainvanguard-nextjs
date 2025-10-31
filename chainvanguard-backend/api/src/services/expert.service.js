import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import BlockchainLog from "../models/BlockchainLog.js";

class ExpertService {


  /**
   * 📊 Get Expert Dashboard Statistics
   */
  async getDashboardStats() {
    try {
      const now = new Date();
      const last24Hours = new Date(now - 24 * 60 * 60 * 1000);
      const last7Days = new Date(now - 7 * 24 * 60 * 60 * 1000);
      const last30Days = new Date(now - 30 * 24 * 60 * 60 * 1000);

      // Network Overview
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ isActive: true });
      const totalProducts = await Product.countDocuments();
      const activeProducts = await Product.countDocuments({ status: "active" });
      const totalOrders = await Order.countDocuments();

      // User breakdown by role
      const usersByRole = await User.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } },
      ]);

      // Recent activity (last 24 hours)
      const recentUsers = await User.countDocuments({
        createdAt: { $gte: last24Hours },
      });
      const recentProducts = await Product.countDocuments({
        createdAt: { $gte: last24Hours },
      });
      const recentOrders = await Order.countDocuments({
        createdAt: { $gte: last24Hours },
      });

      // Transaction statistics
      const totalTransactions = await BlockchainLog.countDocuments();
      const successfulTransactions = await BlockchainLog.countDocuments({
        status: "success",
      });
      const failedTransactions = await BlockchainLog.countDocuments({
        status: "failed",
      });
      const pendingTransactions = await BlockchainLog.countDocuments({
        status: "pending",
      });

      // Transactions by type (last 30 days)
      const transactionsByType = await BlockchainLog.aggregate([
        { $match: { timestamp: { $gte: last30Days } } },
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]);

      // Recent blockchain logs
      const recentLogs = await BlockchainLog.find()
        .sort({ timestamp: -1 })
        .limit(10)
        .populate("performedBy", "name email role")
        .lean();

      // System health metrics
      const averageExecutionTime = await BlockchainLog.aggregate([
        { $match: { executionTime: { $exists: true, $ne: null } } },
        { $group: { _id: null, avg: { $avg: "$executionTime" } } },
      ]);

      // Error rate (last 24 hours)
      const recentTotalTx = await BlockchainLog.countDocuments({
        timestamp: { $gte: last24Hours },
      });
      const recentFailedTx = await BlockchainLog.countDocuments({
        status: "failed",
        timestamp: { $gte: last24Hours },
      });
      const errorRate =
        recentTotalTx > 0
          ? ((recentFailedTx / recentTotalTx) * 100).toFixed(2)
          : 0;

      return {
        success: true,
        data: {
          networkOverview: {
            totalUsers,
            activeUsers,
            totalProducts,
            activeProducts,
            totalOrders,
            usersByRole: usersByRole.reduce((acc, item) => {
              acc[item._id] = item.count;
              return acc;
            }, {}),
          },
          recentActivity: {
            last24Hours: {
              users: recentUsers,
              products: recentProducts,
              orders: recentOrders,
            },
          },
          transactions: {
            total: totalTransactions,
            successful: successfulTransactions,
            failed: failedTransactions,
            pending: pendingTransactions,
            successRate:
              totalTransactions > 0
                ? ((successfulTransactions / totalTransactions) * 100).toFixed(
                    2
                  )
                : 100,
            byType: transactionsByType.reduce((acc, item) => {
              acc[item._id] = item.count;
              return acc;
            }, {}),
          },
          systemHealth: {
            averageExecutionTime: averageExecutionTime[0]?.avg?.toFixed(2) || 0,
            errorRate: parseFloat(errorRate),
            status:
              errorRate < 5
                ? "healthy"
                : errorRate < 15
                  ? "warning"
                  : "critical",
          },
          recentLogs: recentLogs.map((log) => ({
            id: log._id,
            transactionId: log.transactionId,
            type: log.type,
            action: log.action,
            status: log.status,
            user: log.userId
              ? {
                  name: log.userId.name,
                  email: log.userId.email,
                  role: log.userId.role,
                }
              : null,
            timestamp: log.timestamp,
          })),
        },
      };
    } catch (error) {
      console.error("❌ Get dashboard stats failed:", error);
      throw error;
    }
  }

  /**
   * 📜 Get All Transactions with Filters
   */
  async getAllTransactions(filters = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        type,
        status,
        userId,
        startDate,
        endDate,
        sortBy = "timestamp",
        sortOrder = "desc",
      } = filters;

      const query = {};

      if (type) query.type = type;
      if (status) query.status = status;
      if (userId) query.performedBy = userId;
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      const [transactions, total] = await Promise.all([
        BlockchainLog.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate("performedBy", "name email role walletAddress")
          .lean(),
        BlockchainLog.countDocuments(query),
      ]);

      return {
        success: true,
        data: transactions.map((tx) => ({
          id: tx._id,
          transactionId: tx.transactionId,
          type: tx.type,
          action: tx.action,
          status: tx.status,
          user:
            tx.performedBy && tx.performedBy._id
              ? {
                  id: tx.performedBy._id,
                  name: tx.performedBy.name,
                  email: tx.performedBy.email,
                  role: tx.performedBy.role,
                  walletAddress: tx.performedBy.walletAddress,
                }
              : null,
          entityId: tx.entityId,
          entityType: tx.entityType,
          chaincodeName: tx.chaincodeName,
          functionName: tx.functionName,
          executionTime: tx.executionTime,
          blockNumber: tx.blockNumber,
          blockHash: tx.blockHash,
          timestamp: tx.timestamp,
          errorMessage: tx.errorMessage,
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      console.error("❌ Get all transactions failed:", error);
      throw error;
    }
  }

  /**
   * 🔍 Get Transaction Details
   */
  async getTransactionDetails(txId) {
    try {
      const transaction = await BlockchainLog.findOne({
        $or: [{ _id: txId }, { transactionId: txId }],
      })
        .populate("userId", "name email role walletAddress companyName")
        .lean();

      if (!transaction) {
        return {
          success: false,
          message: "Transaction not found",
        };
      }

      // Get related entity details
      let entityDetails = null;
      if (transaction.entityType === "product" && transaction.entityId) {
        entityDetails = await Product.findById(transaction.entityId)
          .select("name category price sellerId sellerName status")
          .lean();
      } else if (transaction.entityType === "order" && transaction.entityId) {
        entityDetails = await Order.findById(transaction.entityId)
          .select("totalAmount status customerId")
          .lean();
      }

      return {
        success: true,
        data: {
          transaction: {
            id: transaction._id,
            transactionId: transaction.transactionId,
            type: transaction.type,
            action: transaction.action,
            status: transaction.status,
            user: transaction.userId,
            entityId: transaction.entityId,
            entityType: transaction.entityType,
            entityDetails,
            chaincodeName: transaction.chaincodeName,
            functionName: transaction.functionName,
            requestData: transaction.requestData,
            responseData: transaction.responseData,
            blockNumber: transaction.blockNumber,
            blockHash: transaction.blockHash,
            executionTime: transaction.executionTime,
            gasUsed: transaction.gasUsed,
            ipAddress: transaction.ipAddress,
            errorMessage: transaction.errorMessage,
            errorStack: transaction.errorStack,
            metadata: transaction.metadata,
            timestamp: transaction.timestamp,
            createdAt: transaction.createdAt,
          },
        },
      };
    } catch (error) {
      console.error("❌ Get transaction details failed:", error);
      throw error;
    }
  }

  /**
   * 🔗 Get Consensus Status
   */
  async getConsensusStatus() {
    try {
      // In production, this would query Hyperledger Fabric for consensus info
      // For now, we'll return aggregated stats from our logs

      const last1Hour = new Date(Date.now() - 60 * 60 * 1000);

      const recentConsensusEvents = await BlockchainLog.countDocuments({
        type: "consensus-event",
        timestamp: { $gte: last1Hour },
      });

      const failedConsensus = await BlockchainLog.countDocuments({
        type: "consensus-event",
        status: "failed",
        timestamp: { $gte: last1Hour },
      });

      const consensusHealth =
        recentConsensusEvents > 0
          ? (
              ((recentConsensusEvents - failedConsensus) /
                recentConsensusEvents) *
              100
            ).toFixed(2)
          : 100;

      return {
        success: true,
        data: {
          status:
            consensusHealth >= 95
              ? "healthy"
              : consensusHealth >= 80
                ? "degraded"
                : "critical",
          health: parseFloat(consensusHealth),
          metrics: {
            totalEvents: recentConsensusEvents,
            successfulEvents: recentConsensusEvents - failedConsensus,
            failedEvents: failedConsensus,
            lastHour: recentConsensusEvents,
          },
          timestamp: new Date(),
        },
      };
    } catch (error) {
      console.error("❌ Get consensus status failed:", error);
      throw error;
    }
  }

  /**
   * 📈 Get Consensus Metrics
   */
  async getConsensusMetrics(timeRange = "24h") {
    try {
      const ranges = {
        "1h": 60 * 60 * 1000,
        "24h": 24 * 60 * 60 * 1000,
        "7d": 7 * 24 * 60 * 60 * 1000,
        "30d": 30 * 24 * 60 * 60 * 1000,
      };

      const startDate = new Date(
        Date.now() - (ranges[timeRange] || ranges["24h"])
      );

      const metrics = await BlockchainLog.aggregate([
        {
          $match: {
            type: "consensus-event",
            timestamp: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: timeRange === "1h" ? "%Y-%m-%d %H:00" : "%Y-%m-%d",
                date: "$timestamp",
              },
            },
            total: { $sum: 1 },
            successful: {
              $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] },
            },
            failed: {
              $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
            },
            avgExecutionTime: { $avg: "$executionTime" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      return {
        success: true,
        data: {
          timeRange,
          metrics: metrics.map((m) => ({
            timestamp: m._id,
            total: m.total,
            successful: m.successful,
            failed: m.failed,
            successRate: ((m.successful / m.total) * 100).toFixed(2),
            avgExecutionTime: m.avgExecutionTime?.toFixed(2) || 0,
          })),
        },
      };
    } catch (error) {
      console.error("❌ Get consensus metrics failed:", error);
      throw error;
    }
  }

  /**
   * 🛡️ Get Fault Tolerance Status
   */
  async getFaultToleranceStatus() {
    try {
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const totalTransactions = await BlockchainLog.countDocuments({
        timestamp: { $gte: last24Hours },
      });

      const failedTransactions = await BlockchainLog.countDocuments({
        status: "failed",
        timestamp: { $gte: last24Hours },
      });

      const systemErrors = await BlockchainLog.countDocuments({
        type: "system-event",
        status: "failed",
        timestamp: { $gte: last24Hours },
      });

      const errorRate =
        totalTransactions > 0
          ? ((failedTransactions / totalTransactions) * 100).toFixed(2)
          : 0;

      const faultToleranceScore = Math.max(0, 100 - parseFloat(errorRate) * 2);

      return {
        success: true,
        data: {
          status:
            faultToleranceScore >= 90
              ? "excellent"
              : faultToleranceScore >= 70
                ? "good"
                : faultToleranceScore >= 50
                  ? "fair"
                  : "poor",
          score: faultToleranceScore.toFixed(2),
          metrics: {
            totalTransactions,
            failedTransactions,
            systemErrors,
            errorRate: parseFloat(errorRate),
            uptime: 99.9, // Mock value - in production, calculate from system logs
            lastIncident: null, // Mock - would track actual incidents
          },
          timestamp: new Date(),
        },
      };
    } catch (error) {
      console.error("❌ Get fault tolerance status failed:", error);
      throw error;
    }
  }

  /**
   * 📊 Get Fault Tolerance Stats
   */
  async getFaultToleranceStats(timeRange = "7d") {
    try {
      const ranges = {
        "24h": 24 * 60 * 60 * 1000,
        "7d": 7 * 24 * 60 * 60 * 1000,
        "30d": 30 * 24 * 60 * 60 * 1000,
      };

      const startDate = new Date(
        Date.now() - (ranges[timeRange] || ranges["7d"])
      );

      const stats = await BlockchainLog.aggregate([
        {
          $match: { timestamp: { $gte: startDate } },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
            },
            total: { $sum: 1 },
            failed: {
              $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
            },
            avgExecutionTime: { $avg: "$executionTime" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      return {
        success: true,
        data: {
          timeRange,
          stats: stats.map((s) => ({
            date: s._id,
            total: s.total,
            failed: s.failed,
            success: s.total - s.failed,
            errorRate: ((s.failed / s.total) * 100).toFixed(2),
            avgExecutionTime: s.avgExecutionTime?.toFixed(2) || 0,
          })),
        },
      };
    } catch (error) {
      console.error("❌ Get fault tolerance stats failed:", error);
      throw error;
    }
  }

  /**
   * 📝 Get Blockchain Logs
   */
  async getBlockchainLogs(filters = {}) {
    try {
      const {
        page = 1,
        limit = 100,
        type,
        status,
        startDate,
        endDate,
      } = filters;

      const logs = await BlockchainLog.getRecentLogs(
        { type, status, startDate, endDate },
        limit
      );

      const total = await BlockchainLog.countDocuments({
        ...(type && { type }),
        ...(status && { status }),
        ...(startDate || endDate
          ? {
              timestamp: {
                ...(startDate && { $gte: new Date(startDate) }),
                ...(endDate && { $lte: new Date(endDate) }),
              },
            }
          : {}),
      });

      return {
        success: true,
        data: logs.map((log) => ({
          id: log._id,
          transactionId: log.transactionId,
          type: log.type,
          action: log.action,
          status: log.status,
          user: log.userId
            ? {
                name: log.userId.name,
                email: log.userId.email,
                role: log.userId.role,
              }
            : null,
          entityId: log.entityId,
          entityType: log.entityType,
          executionTime: log.executionTime,
          errorMessage: log.errorMessage,
          timestamp: log.timestamp,
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      };
    } catch (error) {
      console.error("❌ Get blockchain logs failed:", error);
      throw error;
    }
  }

  /**
   * 🔒 Get Security Overview
   */
  async getSecurityOverview() {
    try {
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const securityEvents = await BlockchainLog.countDocuments({
        type: "security-event",
        timestamp: { $gte: last24Hours },
      });

      const failedLogins = await BlockchainLog.countDocuments({
        type: "security-event",
        action: "login-failed",
        timestamp: { $gte: last24Hours },
      });

      const suspiciousActivity = await BlockchainLog.countDocuments({
        type: "security-event",
        status: "failed",
        timestamp: { $gte: last7Days },
      });

      const activeUsers = await User.countDocuments({ isActive: true });
      const inactiveUsers = await User.countDocuments({ isActive: false });

      return {
        success: true,
        data: {
          status: securityEvents < 10 && failedLogins < 5 ? "secure" : "alert",
          metrics: {
            securityEvents,
            failedLogins,
            suspiciousActivity,
            activeUsers,
            inactiveUsers,
          },
          recentEvents: await BlockchainLog.find({
            type: "security-event",
            timestamp: { $gte: last24Hours },
          })
            .sort({ timestamp: -1 })
            .limit(10)
            .populate("userId", "name email role")
            .lean(),
          timestamp: new Date(),
        },
      };
    } catch (error) {
      console.error("❌ Get security overview failed:", error);
      throw error;
    }
  }

  /**
   * 🚫 Disable User (Security action)
   */
  async disableUser(userId, expertId, reason) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }

      if (user.role === "expert") {
        return {
          success: false,
          message: "Cannot disable expert users",
        };
      }

      user.isActive = false;
      user.deactivatedAt = new Date();
      user.deactivatedBy = expertId;
      user.deactivationReason = reason;
      await user.save();

      // Log the action
      await BlockchainLog.logTransaction({
        transactionId: `security-disable-${Date.now()}`,
        type: "security-event",
        action: "user-disabled",
        status: "success",
        userId: expertId,
        entityId: userId,
        entityType: "user",
        metadata: { reason },
      });

      return {
        success: true,
        message: "User disabled successfully",
        data: {
          userId: user._id,
          name: user.name,
          email: user.email,
          disabledAt: user.deactivatedAt,
        },
      };
    } catch (error) {
      console.error("❌ Disable user failed:", error);
      throw error;
    }
  }
}

export default new ExpertService();
