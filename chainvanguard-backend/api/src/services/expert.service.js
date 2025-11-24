import mongoose from "mongoose";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import BlockchainLog from "../models/BlockchainLog.js";
import Wallet from "../models/Wallet.js";

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

      // Transactions by type (last 30 days) - use timestamp || createdAt
      const transactionsByType = await BlockchainLog.aggregate([
        {
          $match: {
            $or: [
              { timestamp: { $gte: last30Days } },
              { createdAt: { $gte: last30Days } },
            ],
          },
        },
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]);

      // Recent blockchain logs — sort by effectiveTimestamp (timestamp || createdAt) and populate performedBy
      const recentLogs = await BlockchainLog.aggregate([
        {
          $addFields: {
            effectiveTimestamp: { $ifNull: ["$timestamp", "$createdAt"] },
          },
        },
        { $sort: { effectiveTimestamp: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "users",
            localField: "performedBy",
            foreignField: "_id",
            as: "performedBy",
          },
        },
        {
          $unwind: {
            path: "$performedBy",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            transactionId: 1,
            type: 1,
            action: 1,
            status: 1,
            performedBy: {
              _id: "$performedBy._id",
              name: "$performedBy.name",
              email: "$performedBy.email",
              role: "$performedBy.role",
            },
            timestamp: { $ifNull: ["$timestamp", "$createdAt"] },
          },
        },
      ]);

      // System health metrics
      const averageExecutionTime = await BlockchainLog.aggregate([
        { $match: { executionTime: { $exists: true, $ne: null } } },
        { $group: { _id: null, avg: { $avg: "$executionTime" } } },
      ]);

      // Error rate (last 24 hours) - count transactions using timestamp || createdAt
      const recentTotalTx = await BlockchainLog.countDocuments({
        $or: [
          { timestamp: { $gte: last24Hours } },
          { createdAt: { $gte: last24Hours } },
        ],
      });
      const recentFailedTx = await BlockchainLog.countDocuments({
        status: "failed",
        $or: [
          { timestamp: { $gte: last24Hours } },
          { createdAt: { $gte: last24Hours } },
        ],
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
            // Accept both performedBy and userId (older logs might use userId)
            user:
              (log.performedBy && log.performedBy._id) ||
              (log.userId && log.userId._id)
                ? {
                    name: log.performedBy?.name || log.userId?.name,
                    email: log.performedBy?.email || log.userId?.email,
                    role: log.performedBy?.role || log.userId?.role,
                  }
                : null,
            timestamp: log.timestamp || log.createdAt,
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
        search, // <-- support search
        sortBy = "timestamp",
        sortOrder = "desc",
      } = filters;

      const query = {};

      if (type) query.type = type;
      if (status) query.status = status;
      if (userId) query.performedBy = userId;

      // Build a reusable date range filter that will be applied to timestamp OR createdAt
      // Normalize the startDate to start-of-day and endDate to end-of-day to include the entire days.
      let dateRange = null;
      if (startDate || endDate) {
        dateRange = {};
        if (startDate) {
          const s = new Date(startDate);
          s.setHours(0, 0, 0, 0);
          dateRange.$gte = s;
        }
        if (endDate) {
          const e = new Date(endDate);
          e.setHours(23, 59, 59, 999);
          dateRange.$lte = e;
        }

        // Validate that endDate is not before startDate
        if (
          dateRange.$gte &&
          dateRange.$lte &&
          dateRange.$lte < dateRange.$gte
        ) {
          throw new Error("End date cannot be earlier than start date");
        }
      }

      const skip = (page - 1) * limit;

      // Compute sort field. For timestamp we will use the effectiveTimestamp fallback.
      const sortField = sortBy === "timestamp" ? "timestamp" : sortBy;
      const sort = { [sortField]: sortOrder === "desc" ? -1 : 1 };

      // If no search - use the previous (faster) path but incorporate createdAt fallback in date filter and sort
      if (!search || !String(search).trim()) {
        const findQuery = { ...query };

        // Apply date filtering to either timestamp or createdAt
        if (dateRange) {
          findQuery.$or = [{ timestamp: dateRange }, { createdAt: dateRange }];
        }

        // Use dual-field sort when sorting by timestamp so createdAt acts as fallback
        const findSort =
          sortBy === "timestamp"
            ? {
                timestamp: sortOrder === "desc" ? -1 : 1,
                createdAt: sortOrder === "desc" ? -1 : 1,
              }
            : sort;

        const [transactions, total] = await Promise.all([
          BlockchainLog.find(findQuery)
            .sort(findSort)
            .skip(skip)
            .limit(limit)
            .populate("performedBy", "name email role walletAddress")
            .lean(),
          BlockchainLog.countDocuments(findQuery),
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
            // fallback to createdAt if timestamp missing
            timestamp: tx.timestamp || tx.createdAt,
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
      }

      // If search present - use aggregation to allow searches against joined fields (performedBy.name/email)
      const sanitized = String(search).trim();
      const escaped = sanitized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");

      const baseMatch = { ...query };

      // Build OR conditions for searching
      const searchOr = [
        { transactionId: { $regex: regex } },
        { type: { $regex: regex } },
        { action: { $regex: regex } },
        { entityType: { $regex: regex } },
        { entityId: { $regex: regex } },
        { chaincodeName: { $regex: regex } },
        { functionName: { $regex: regex } },
        { blockHash: { $regex: regex } },
        { "performedBy.name": { $regex: regex } },
        { "performedBy.email": { $regex: regex } },
        // Add support to search by Mongo ObjectId string
        { _idString: { $regex: regex } },
      ];

      // If the search query looks exactly like a 24-hex ObjectId, add an exact _id match for faster results.
      if (/^[a-fA-F0-9]{24}$/.test(sanitized)) {
        try {
          searchOr.push({ _id: mongoose.Types.ObjectId(sanitized) });
        } catch (e) {
          // ignore if invalid ObjectId conversion (defensive)
        }
      }

      // For aggregation sort, if sorting by 'timestamp', use 'effectiveTimestamp'
      const sortKeyAgg = sortBy === "timestamp" ? "effectiveTimestamp" : sortBy;
      const sortAgg = { [sortKeyAgg]: sortOrder === "desc" ? -1 : 1 };

      // Build pipeline.
      const pipeline = [
        { $match: baseMatch },
        {
          $lookup: {
            from: "users",
            localField: "performedBy",
            foreignField: "_id",
            as: "performedBy",
          },
        },
        { $unwind: { path: "$performedBy", preserveNullAndEmptyArrays: true } },

        // Add field 'effectiveTimestamp' as timestamp || createdAt so we can sort and filter correctly
        {
          $addFields: {
            effectiveTimestamp: { $ifNull: ["$timestamp", "$createdAt"] },
            // Add _id as string to allow searching by _id
            _idString: { $toString: "$_id" },
          },
        },

        // Add a date filter if startDate/endDate exist - use effectiveTimestamp
        ...(dateRange
          ? [
              {
                $match: {
                  effectiveTimestamp: dateRange,
                },
              },
            ]
          : []),

        // Apply search match
        { $match: { $or: searchOr } },

        {
          $facet: {
            docs: [
              { $sort: sortAgg },
              { $skip: skip },
              { $limit: limit },
              {
                $project: {
                  id: "$_id",
                  transactionId: 1,
                  type: 1,
                  action: 1,
                  status: 1,
                  performedBy: {
                    _id: "$performedBy._id",
                    name: "$performedBy.name",
                    email: "$performedBy.email",
                    role: "$performedBy.role",
                    walletAddress: "$performedBy.walletAddress",
                  },
                  entityId: 1,
                  entityType: 1,
                  chaincodeName: 1,
                  functionName: 1,
                  executionTime: 1,
                  blockNumber: 1,
                  blockHash: 1,
                  // fallback to createdAt if timestamp missing
                  timestamp: { $ifNull: ["$timestamp", "$createdAt"] },
                  errorMessage: 1,
                },
              },
            ],
            totalCount: [{ $count: "count" }],
          },
        },
      ];

      const aggResult = await BlockchainLog.aggregate(pipeline);

      const docs = aggResult?.[0]?.docs || [];
      const total = aggResult?.[0]?.totalCount?.[0]?.count || 0;

      return {
        success: true,
        data: docs.map((tx) => ({
          id: tx.id,
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
          timestamp: tx.timestamp || tx.createdAt,
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
            // <-- Fallback to createdAt if timestamp is missing
            timestamp: transaction.timestamp || transaction.createdAt,
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
      // Use real transaction data instead of non-existent consensus-event
      const last1Hour = new Date(Date.now() - 60 * 60 * 1000);

      // Count using effectiveTimestamp (timestamp || createdAt)
      const recentTransactions = await BlockchainLog.countDocuments({
        $or: [
          { timestamp: { $gte: last1Hour } },
          { createdAt: { $gte: last1Hour } },
        ],
      });

      const failedTransactions = await BlockchainLog.countDocuments({
        status: "failed",
        $or: [
          { timestamp: { $gte: last1Hour } },
          { createdAt: { $gte: last1Hour } },
        ],
      });

      // Build a fallback peer identifier:
      // use chaincodeName if available, otherwise metadata.peerId or the performedBy id string
      const peers = await BlockchainLog.aggregate([
        {
          $addFields: {
            effectiveTimestamp: { $ifNull: ["$timestamp", "$createdAt"] },
            chaincodeNameStr: { $ifNull: ["$chaincodeName", null] },
            metadataPeer: { $ifNull: ["$metadata.peerId", "$metadata.peer"] },
            performedByStr: { $toString: "$performedBy" },
          },
        },
        { $match: { effectiveTimestamp: { $gte: last1Hour } } },
        {
          $addFields: {
            peerKey: {
              $ifNull: [
                "$chaincodeNameStr",
                { $ifNull: ["$metadataPeer", "$performedByStr"] },
              ],
            },
          },
        },
        {
          $group: {
            _id: "$peerKey",
            count: { $sum: 1 },
            lastSeen: { $max: "$effectiveTimestamp" },
          },
        },
      ]);

      const successRate =
        recentTransactions > 0
          ? (
              ((recentTransactions - failedTransactions) / recentTransactions) *
              100
            ).toFixed(2)
          : 100;

      return {
        success: true,
        data: {
          status:
            successRate >= 95
              ? "healthy"
              : successRate >= 80
                ? "degraded"
                : "critical",
          health: parseFloat(successRate),
          metrics: {
            totalEvents: recentTransactions,
            successfulEvents: recentTransactions - failedTransactions,
            failedEvents: failedTransactions,
            lastHour: recentTransactions,
          },
          peers: peers.map((p) => ({
            id: p._id || "unknown-peer",
            name: p._id || "Peer Node",
            type: "peer",
            // simple online/offline judgement: lastSeen within last 1 hr -> online
            status:
              p.lastSeen && p.lastSeen >= last1Hour ? "online" : "offline",
            blockHeight: p.count,
            version: "2.5.0",
            lastSeen: p.lastSeen,
          })),
          networkState: {
            state: "Active",
            connected: true,
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

      // Use effectiveTimestamp (timestamp || createdAt) for robust metrics
      const pipeline = [
        {
          $addFields: {
            effectiveTimestamp: { $ifNull: ["$timestamp", "$createdAt"] },
          },
        },
        {
          $match: {
            effectiveTimestamp: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: timeRange === "1h" ? "%Y-%m-%d %H:00" : "%Y-%m-%d",
                date: "$effectiveTimestamp",
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
      ];

      const metricsAgg = await BlockchainLog.aggregate(pipeline);

      // Calculate overall metrics using effectiveTimestamp
      const totalTx = await BlockchainLog.countDocuments({
        $or: [
          { timestamp: { $gte: startDate } },
          { createdAt: { $gte: startDate } },
        ],
      });

      // Estimate block count (assume 10 tx per block)
      const blockCount = Math.ceil(totalTx / 10);

      // Compute first and last effectiveTimestamp transactions for avg block time
      const firstTx = await BlockchainLog.aggregate([
        {
          $addFields: {
            effectiveTimestamp: { $ifNull: ["$timestamp", "$createdAt"] },
          },
        },
        { $match: { effectiveTimestamp: { $gte: startDate } } },
        { $sort: { effectiveTimestamp: 1 } },
        { $limit: 1 },
      ]);

      const lastTx = await BlockchainLog.aggregate([
        {
          $addFields: {
            effectiveTimestamp: { $ifNull: ["$timestamp", "$createdAt"] },
          },
        },
        { $match: { effectiveTimestamp: { $gte: startDate } } },
        { $sort: { effectiveTimestamp: -1 } },
        { $limit: 1 },
      ]);

      let avgBlockTime = 0;
      if (firstTx?.[0] && lastTx?.[0] && blockCount > 0) {
        const firstTs = new Date(firstTx[0].effectiveTimestamp).getTime();
        const lastTs = new Date(lastTx[0].effectiveTimestamp).getTime();
        const timeDiff = (lastTs - firstTs) / 1000; // seconds
        avgBlockTime = timeDiff / blockCount;
      }

      return {
        success: true,
        data: {
          timeRange,
          metrics: {
            blockCount: blockCount,
            transactionCount: totalTx,
            avgBlockTime: avgBlockTime,
            avgTxPerBlock: blockCount > 0 ? totalTx / blockCount : 0,
          },
          trends: metricsAgg.map((m) => ({
            timestamp: m._id,
            blocks: Math.ceil(m.total / 10),
            transactions: m.total,
            successful: m.successful,
            failed: m.failed,
            successRate: ((m.successful / m.total) * 100).toFixed(2),
            avgExecutionTime: m.avgExecutionTime?.toFixed(2) || 0,
            avgBlockTime: avgBlockTime.toFixed(2),
            avgTxPerBlock: (m.total / Math.ceil(m.total / 10)).toFixed(1),
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
      // Use a longer window (30d) to compute a meaningful uptime percentage
      const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const totalTransactions = await BlockchainLog.countDocuments({
        $or: [
          { timestamp: { $gte: last24Hours } },
          { createdAt: { $gte: last24Hours } },
        ],
      });

      const failedTransactions = await BlockchainLog.countDocuments({
        status: "failed",
        $or: [
          { timestamp: { $gte: last24Hours } },
          { createdAt: { $gte: last24Hours } },
        ],
      });

      const systemErrors = await BlockchainLog.countDocuments({
        type: "system-event",
        status: "failed",
        $or: [
          { timestamp: { $gte: last24Hours } },
          { createdAt: { $gte: last24Hours } },
        ],
      });

      // Find last incident (most recent failed tx) using effectiveTimestamp fallback
      const lastIncidentDoc = await BlockchainLog.findOne({
        status: "failed",
        $or: [
          { timestamp: { $gte: last24Hours } },
          { createdAt: { $gte: last24Hours } },
        ],
      })
        .sort({ timestamp: -1, createdAt: -1 })
        .lean();

      const lastIncident =
        (lastIncidentDoc &&
          (lastIncidentDoc.timestamp || lastIncidentDoc.createdAt)) ||
        null;

      // --- Compute dynamic uptime over last30Days when downtime entries are logged ---
      // Common "downtime" event identifiers we treat as outages
      const downtimePredicates = [
        { action: "downtime" },
        { action: "node-down" },
        { "metadata.event": "downtime" },
        { "metadata.type": "downtime" },
        { "metadata.downtime": true },
      ];

      const downtimeLogs = await BlockchainLog.find({
        $and: [
          {
            $or: [
              { timestamp: { $gte: last30Days } },
              { createdAt: { $gte: last30Days } },
            ],
          },
          {
            $or: downtimePredicates,
          },
        ],
      }).lean();

      let totalDowntimeMs = 0;
      for (const log of downtimeLogs) {
        try {
          const md = log.metadata || {};
          if (typeof md.durationMs === "number") {
            totalDowntimeMs += md.durationMs;
          } else if (typeof md.duration === "number") {
            totalDowntimeMs += md.duration;
          } else if (md.start && md.end) {
            const start = new Date(md.start).getTime();
            const end = new Date(md.end).getTime();
            if (!isNaN(start) && !isNaN(end) && end > start) {
              totalDowntimeMs += Math.max(0, end - start);
            }
          } else if (log.timestamp && md.estimatedDurationSeconds) {
            totalDowntimeMs += Number(md.estimatedDurationSeconds || 0) * 1000;
          } else {
            // ignore unknown duration
          }
        } catch (e) {
          console.warn("⚠️ Downtime log parsing error:", e);
        }
      }

      const windowMs = Date.now() - last30Days.getTime();
      let uptimePercent = null;
      if (totalDowntimeMs > 0 && windowMs > 0) {
        uptimePercent = Math.max(
          0,
          ((windowMs - totalDowntimeMs) / windowMs) * 100
        );
      }
      const successRate =
        totalTransactions > 0
          ? ((totalTransactions - failedTransactions) / totalTransactions) * 100
          : 100;
      if (uptimePercent === null) {
        uptimePercent = successRate;
      }
      const uptimeRounded = Number((uptimePercent || 0).toFixed(2));
      const downtimeCount = downtimeLogs.length;

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
          score: parseFloat(faultToleranceScore.toFixed(2)),
          metrics: {
            totalTransactions,
            failedTransactions,
            systemErrors,
            errorRate: parseFloat(errorRate),
            uptime: uptimeRounded,
            downtimeCount,
            totalDowntimeMs,
            uptimeWindowStart: last30Days,
            uptimeWindowEnd: new Date(),
            lastIncident,
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

      // Use effectiveTimestamp (timestamp || createdAt)
      const stats = await BlockchainLog.aggregate([
        {
          $addFields: {
            effectiveTimestamp: { $ifNull: ["$timestamp", "$createdAt"] },
          },
        },
        {
          $match: {
            effectiveTimestamp: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$effectiveTimestamp",
              },
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
      // Normalize date range like in getAllTransactions
      let dateRange = null;
      if (startDate || endDate) {
        dateRange = {};
        if (startDate) {
          const s = new Date(startDate);
          s.setHours(0, 0, 0, 0);
          dateRange.$gte = s;
        }
        if (endDate) {
          const e = new Date(endDate);
          e.setHours(23, 59, 59, 999);
          dateRange.$lte = e;
        }
        if (
          dateRange.$gte &&
          dateRange.$lte &&
          dateRange.$lte < dateRange.$gte
        ) {
          throw new Error("End date cannot be earlier than start date");
        }
      }

      const logs = await BlockchainLog.getRecentLogs(
        { type, status, startDate, endDate },
        limit
      );

      // Count using timestamp OR createdAt, and normalized dateRange
      const countQuery = {
        ...(type && { type }),
        ...(status && { status }),
      };
      if (dateRange) {
        countQuery.$or = [{ timestamp: dateRange }, { createdAt: dateRange }];
      }
      const total = await BlockchainLog.countDocuments(countQuery);

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
          // <-- Fallback to createdAt if timestamp missing
          timestamp: log.timestamp || log.createdAt,
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
   * 💼 Get Security Wallets - All users with wallet information
   */
  async getSecurityWallets(filters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        status, // all, active, frozen
        role,
        sortBy = "recent",
        sortOrder = "desc",
        balanceMin,
        balanceMax,
      } = filters;

      const skip = (page - 1) * limit;

      // Build match conditions
      const matchConditions = {};

      // Status filter
      if (status && status !== "all") {
        if (status === "active") {
          matchConditions["user.isActive"] = true;
        } else if (status === "frozen") {
          matchConditions["user.isActive"] = false;
        }
      }

      // Role filter
      if (role && role !== "all") {
        matchConditions["user.role"] = role;
      }

      // Balance range filter
      if (balanceMin !== undefined || balanceMax !== undefined) {
        matchConditions["wallet.balance"] = {};
        if (balanceMin !== undefined) {
          matchConditions["wallet.balance"].$gte = balanceMin;
        }
        if (balanceMax !== undefined) {
          matchConditions["wallet.balance"].$lte = balanceMax;
        }
      }

      // Search filter (applied later in pipeline after lookup)
      let searchRegex = null;
      if (search && search.trim()) {
        const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        searchRegex = new RegExp(escaped, "i");
      }

      // Build sort
      let sortStage = {};
      switch (sortBy) {
        case "balance-desc":
          sortStage = { "wallet.balance": -1 };
          break;
        case "balance-asc":
          sortStage = { "wallet.balance": 1 };
          break;
        case "name-asc":
          sortStage = { "user.name": 1 };
          break;
        case "name-desc":
          sortStage = { "user.name": -1 };
          break;
        case "recent":
        default:
          sortStage = { "user.createdAt": -1 };
          break;
      }

      // Build aggregation pipeline
      const pipeline = [
        // Join with users
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: false,
          },
        },

        // Add computed fields
        {
          $addFields: {
            transactionCount: { $size: { $ifNull: ["$transactions", []] } },
            recentTransactions: {
              $slice: [
                {
                  $sortArray: {
                    input: { $ifNull: ["$transactions", []] },
                    sortBy: { timestamp: -1 },
                  },
                },
                5,
              ],
            },
            wallet: "$$ROOT",
          },
        },

        // Apply search filter if present
        ...(searchRegex
          ? [
              {
                $match: {
                  $or: [
                    { "user.name": searchRegex },
                    { "user.email": searchRegex },
                    { walletAddress: searchRegex },
                  ],
                },
              },
            ]
          : []),

        // Apply other filters
        ...(Object.keys(matchConditions).length > 0
          ? [{ $match: matchConditions }]
          : []),

        // Facet for pagination
        {
          $facet: {
            metadata: [{ $count: "total" }],
            data: [
              { $sort: sortStage },
              { $skip: skip },
              { $limit: limit },
              {
                $project: {
                  _id: 1,
                  userId: "$user._id",
                  name: "$user.name",
                  email: "$user.email",
                  role: "$user.role",
                  isActive: "$user.isActive",
                  walletAddress: 1,
                  balance: 1,
                  currency: 1,
                  isFrozen: 1,
                  frozenReason: 1,
                  frozenAt: 1,
                  lastActivity: 1,
                  transactionCount: 1,
                  totalDeposited: 1,
                  totalWithdrawn: 1,
                  totalSpent: 1,
                  totalReceived: 1,
                  dailyWithdrawalLimit: 1,
                  dailyWithdrawn: 1,
                  recentTransactions: {
                    $map: {
                      input: "$recentTransactions",
                      as: "tx",
                      in: {
                        type: "$$tx.type",
                        amount: "$$tx.amount",
                        status: "$$tx.status",
                        description: "$$tx.description",
                        timestamp: "$$tx.timestamp",
                      },
                    },
                  },
                  createdAt: "$user.createdAt",
                  updatedAt: 1,
                },
              },
            ],
          },
        },
      ];

      const result = await Wallet.aggregate(pipeline);

      const data = result[0]?.data || [];
      const total = result[0]?.metadata[0]?.total || 0;

      // Calculate security flags for each wallet
      const enrichedData = data.map((wallet) => {
        const securityFlags = [];

        // Check for suspicious activity
        if (wallet.isFrozen) {
          securityFlags.push("FROZEN");
        }

        if (wallet.balance > 50000) {
          securityFlags.push("HIGH_BALANCE");
        }

        if (wallet.balance < 10) {
          securityFlags.push("LOW_BALANCE");
        }

        if (wallet.dailyWithdrawn > wallet.dailyWithdrawalLimit * 0.8) {
          securityFlags.push("HIGH_DAILY_WITHDRAWAL");
        }

        const lastActivityDate = new Date(wallet.lastActivity);
        const daysSinceActivity =
          (Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceActivity > 30) {
          securityFlags.push("INACTIVE");
        }

        return {
          ...wallet,
          securityFlags,
        };
      });

      return {
        success: true,
        data: enrichedData,
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
      console.error("❌ Get security wallets failed:", error);
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

      // Invalidate existing sessions/tokens immediately
      user.forceLogoutAt = new Date();
      user.tokenVersion = (user.tokenVersion || 0) + 1;

      await user.save();

      // Log the action (use create() and make logging safe)
      try {
        await BlockchainLog.create({
          transactionId: `security-disable-${Date.now()}`,
          type: "security-event",
          action: "user-disabled",
          status: "success",
          // record the actor and related entity
          performedBy: expertId,
          userId: expertId,
          entityId: userId,
          entityType: "user",
          metadata: { reason },
          timestamp: new Date(),
        });
      } catch (logErr) {
        console.warn(
          "⚠️ Failed to persist security log for disable action:",
          logErr
        );
        // Don't fail the main operation if logging fails
      }

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

  /**
   * ✅ Unfreeze / Re-enable User (Security action)
   */
  async unfreezeUser(userId, expertId, reason) {
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
          message: "Cannot unfreeze expert users",
        };
      }

      // Re-activate user
      user.isActive = true;
      user.reactivatedAt = new Date();
      user.reactivatedBy = expertId;
      user.reactivationReason = reason;

      // Clear deactivation fields for clarity
      user.deactivatedAt = null;
      user.deactivatedBy = null;
      user.deactivationReason = null;

      // Increment token version / force logout to invalidate previous sessions
      user.forceLogoutAt = new Date();
      user.tokenVersion = (user.tokenVersion || 0) + 1;

      await user.save();

      // Unfreeze wallet if present
      try {
        await Wallet.updateOne(
          { userId: user._id },
          {
            $set: {
              isFrozen: false,
              frozenReason: null,
              frozenAt: null,
            },
          }
        );
      } catch (walletErr) {
        console.warn("⚠️ Failed to unfreeze wallet record:", walletErr);
      }

      // Log the action (use create() and make logging safe)
      try {
        await BlockchainLog.create({
          transactionId: `security-unfreeze-${Date.now()}`,
          type: "security-event",
          action: "user-unfrozen",
          status: "success",
          performedBy: expertId,
          userId: expertId,
          entityId: userId,
          entityType: "user",
          metadata: { reason },
          timestamp: new Date(),
        });
      } catch (logErr) {
        console.warn(
          "⚠️ Failed to persist security log for unfreeze action:",
          logErr
        );
      }

      return {
        success: true,
        message: "User reactivated successfully",
        data: {
          userId: user._id,
          name: user.name,
          email: user.email,
          reactivatedAt: user.reactivatedAt,
        },
      };
    } catch (error) {
      console.error("❌ Unfreeze user failed:", error);
      throw error;
    }
  }

  /**
   * 💼 Get Wallet by User ID (for expert UI)
   */
  async getWalletByUserId(userId) {
    try {
      if (!userId) {
        return { success: false, message: "User ID is required" };
      }

      // Accept either string ObjectId or ObjectId
      let query = { userId };
      try {
        query = { userId: mongoose.Types.ObjectId(String(userId)) };
      } catch (e) {
        // keep string; mongoose will attempt to cast
      }

      const wallet = await Wallet.findOne(query)
        .populate("userId", "name email role walletAddress createdAt isActive")
        .lean();

      if (!wallet) {
        return {
          success: false,
          message: "Wallet not found",
        };
      }

      // Normalize fields to match frontend expectations
      const normalized = {
        _id: wallet._id,
        userId: wallet.userId?._id || wallet.userId,
        name: wallet.userId?.name,
        email: wallet.userId?.email,
        role: wallet.userId?.role,
        currency: wallet.currency || "USD",
        balance: wallet.balance || 0,
        walletAddress: wallet.walletAddress || wallet.address || null,
        transactions: wallet.transactions || [],
        lastActivity:
          wallet.lastActivity || wallet.updatedAt || wallet.createdAt,
        totalDeposited: wallet.totalDeposited || 0,
        totalWithdrawn: wallet.totalWithdrawn || 0,
        dailyWithdrawalLimit: wallet.dailyWithdrawalLimit || 0,
        dailyWithdrawn: wallet.dailyWithdrawn || 0,
        isFrozen: wallet.isFrozen || false,
        isActive: wallet.userId?.isActive ?? true,
        createdAt: wallet.userId?.createdAt || wallet.createdAt,
      };

      return {
        success: true,
        data: normalized,
      };
    } catch (error) {
      console.error("❌ Get wallet by user id failed:", error);
      throw error;
    }
  }
}

export default new ExpertService();
