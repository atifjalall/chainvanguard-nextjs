import Product from "../models/Product.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import BlockchainLog from "../models/BlockchainLog.js";
import FabricService from "./fabric.service.js";

class BlockchainService {
  constructor() {
    this.fabricService = new FabricService();
  }

  /**
   * 📦 Get Product Blockchain History
   */
  async getProductHistory(productId) {
    try {
      console.log(`🔍 Fetching blockchain history for product: ${productId}`);

      // Get product from MongoDB
      const product = await Product.findById(productId)
        .populate("sellerId", "name email companyName walletAddress")
        .lean();

      if (!product) {
        return {
          success: false,
          message: "Product not found",
        };
      }

      // Get blockchain logs for this product
      const blockchainLogs = await BlockchainLog.find({
        entityId: productId,
        entityType: "product",
      })
        .sort({ timestamp: 1 })
        .populate("userId", "name email role")
        .lean();

      // Query Hyperledger Fabric for on-chain data
      let fabricHistory = [];
      try {
        await this.fabricService.connect();
        const contract =
          this.fabricService.network.getContract("ProductContract");
        const historyResult = await contract.evaluateTransaction(
          "getProductHistory",
          productId
        );
        fabricHistory = JSON.parse(historyResult.toString());
      } catch (error) {
        console.warn("⚠️ Could not fetch Fabric history:", error.message);
      }

      // Build complete timeline
      const timeline = [
        {
          stage: "Creation",
          timestamp: product.createdAt,
          action: "Product Created",
          actor: product.sellerId
            ? {
                name: product.sellerId.name,
                email: product.sellerId.email,
                walletAddress: product.sellerId.walletAddress,
              }
            : null,
          location: product.currentLocation,
          blockchainTxId: product.blockchainTxId,
          verified: true,
          metadata: {
            name: product.name,
            category: product.category,
            price: product.price,
          },
        },
      ];

      // Add supply chain history
      if (product.supplyChainHistory && product.supplyChainHistory.length > 0) {
        product.supplyChainHistory.forEach((event) => {
          timeline.push({
            stage: event.stage || "Update",
            timestamp: event.timestamp,
            action: event.action || event.stage,
            actor: event.actor,
            location: event.location,
            blockchainTxId: event.txId,
            verified: true,
            metadata: event.details,
          });
        });
      }

      // Add blockchain logs
      blockchainLogs.forEach((log) => {
        timeline.push({
          stage: "Blockchain Event",
          timestamp: log.timestamp,
          action: log.action,
          actor: log.userId
            ? {
                name: log.userId.name,
                email: log.userId.email,
                role: log.userId.role,
              }
            : null,
          blockchainTxId: log.transactionId,
          verified: log.status === "success",
          executionTime: log.executionTime,
          metadata: {
            type: log.type,
            status: log.status,
            chaincode: log.chaincodeName,
            function: log.functionName,
          },
        });
      });

      // Sort timeline by timestamp
      timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      return {
        success: true,
        data: {
          product: {
            id: product._id,
            name: product.name,
            description: product.description,
            category: product.category,
            sku: product.sku,
            price: product.price,
            seller: product.sellerId,
            currentLocation: product.currentLocation,
            status: product.status,
            qrCode: product.qrCode,
            createdAt: product.createdAt,
          },
          blockchain: {
            txId: product.blockchainTxId,
            verified: !!product.blockchainTxId,
            totalEvents: timeline.length,
            fabricHistory: fabricHistory.length > 0 ? fabricHistory : null,
          },
          timeline,
          supplyChainSummary: product.supplyChainSummary,
        },
      };
    } catch (error) {
      console.error("❌ Get product history failed:", error);
      throw error;
    }
  }

  /**
   * 📋 Get Order Blockchain History
   */
  async getOrderHistory(orderId) {
    try {
      console.log(`🔍 Fetching blockchain history for order: ${orderId}`);

      // Get order from MongoDB
      const order = await Order.findById(orderId)
        .populate("customerId", "name email walletAddress")
        .populate("products.productId", "name images price")
        .lean();

      if (!order) {
        return {
          success: false,
          message: "Order not found",
        };
      }

      // Get blockchain logs for this order
      const blockchainLogs = await BlockchainLog.find({
        entityId: orderId,
        entityType: "order",
      })
        .sort({ timestamp: 1 })
        .populate("userId", "name email role")
        .lean();

      // Query Hyperledger Fabric
      let fabricHistory = [];
      try {
        await this.fabricService.connect();
        const contract =
          this.fabricService.network.getContract("OrderContract");
        const historyResult = await contract.evaluateTransaction(
          "getOrderHistory",
          orderId
        );
        fabricHistory = JSON.parse(historyResult.toString());
      } catch (error) {
        console.warn("⚠️ Could not fetch Fabric history:", error.message);
      }

      // Build timeline
      const timeline = [
        {
          stage: "Order Created",
          timestamp: order.createdAt,
          action: "Order Placed",
          actor: order.customerId
            ? {
                name: order.customerId.name,
                email: order.customerId.email,
                walletAddress: order.customerId.walletAddress,
              }
            : null,
          blockchainTxId: order.blockchainTxId,
          verified: true,
          metadata: {
            totalAmount: order.totalAmount,
            itemCount: order.products?.length || 0,
            status: order.status,
          },
        },
      ];

      // Add status history
      if (order.statusHistory && order.statusHistory.length > 0) {
        order.statusHistory.forEach((status) => {
          timeline.push({
            stage: "Status Update",
            timestamp: status.timestamp,
            action: `Status changed to ${status.status}`,
            actor: status.updatedBy
              ? {
                  name: status.updatedBy.name,
                }
              : null,
            verified: true,
            metadata: {
              status: status.status,
              comment: status.comment,
            },
          });
        });
      }

      // Add tracking updates
      if (order.trackingUpdates && order.trackingUpdates.length > 0) {
        order.trackingUpdates.forEach((update) => {
          timeline.push({
            stage: "Tracking Update",
            timestamp: update.timestamp,
            action: update.status,
            location: update.location,
            verified: true,
            metadata: {
              description: update.description,
            },
          });
        });
      }

      // Add blockchain logs
      blockchainLogs.forEach((log) => {
        timeline.push({
          stage: "Blockchain Event",
          timestamp: log.timestamp,
          action: log.action,
          actor: log.userId
            ? {
                name: log.userId.name,
                email: log.userId.email,
                role: log.userId.role,
              }
            : null,
          blockchainTxId: log.transactionId,
          verified: log.status === "success",
          executionTime: log.executionTime,
          metadata: {
            type: log.type,
            status: log.status,
          },
        });
      });

      // Sort timeline
      timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      return {
        success: true,
        data: {
          order: {
            id: order._id,
            totalAmount: order.totalAmount,
            status: order.status,
            customer: order.customerId,
            products: order.products,
            shippingAddress: order.shippingAddress,
            createdAt: order.createdAt,
          },
          blockchain: {
            txId: order.blockchainTxId,
            verified: !!order.blockchainTxId,
            totalEvents: timeline.length,
            fabricHistory: fabricHistory.length > 0 ? fabricHistory : null,
          },
          timeline,
        },
      };
    } catch (error) {
      console.error("❌ Get order history failed:", error);
      throw error;
    }
  }

  /**
   * Verify Transaction on Blockchain
   */
  async verifyTransaction(txId) {
    try {
      console.log(`🔍 Verifying transaction: ${txId}`);

      // Find in blockchain logs
      // FIX: Check if txId is a valid ObjectId format first
      let log;

      // Check if it's a MongoDB ObjectId (24 hex characters)
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(txId);

      if (isObjectId) {
        // Try to find by _id
        log = await BlockchainLog.findById(txId)
          .populate("userId", "name email role walletAddress")
          .lean();
      }

      // If not found or not an ObjectId, try to find by transactionId
      if (!log) {
        log = await BlockchainLog.findOne({ transactionId: txId })
          .populate("userId", "name email role walletAddress")
          .lean();
      }

      if (!log) {
        // Transaction not in logs - it might be a blockchain txId that hasn't been logged yet
        // Try to verify directly on Hyperledger Fabric
        return {
          success: false,
          message: "Transaction not found in local logs",
          note: "This transaction may exist on the blockchain but is not logged in the database",
        };
      }

      // Try to verify on Hyperledger Fabric
      let fabricVerification = null;
      try {
        await this.fabricService.connect();

        // Query the appropriate contract
        const contract = this.fabricService.network.getContract(
          log.chaincodeName || "ProductContract"
        );

        // Try to fetch the entity to verify it exists on-chain
        if (log.entityType === "product" && log.entityId) {
          const result = await contract.evaluateTransaction(
            "getProduct",
            log.entityId
          );
          fabricVerification = {
            exists: true,
            data: JSON.parse(result.toString()),
          };
        } else if (log.entityType === "order" && log.entityId) {
          const orderContract =
            this.fabricService.network.getContract("OrderContract");
          const result = await orderContract.evaluateTransaction(
            "getOrder",
            log.entityId
          );
          fabricVerification = {
            exists: true,
            data: JSON.parse(result.toString()),
          };
        }
      } catch (error) {
        console.warn("⚠️ Fabric verification failed:", error.message);
        fabricVerification = {
          exists: false,
          error: error.message,
        };
      }

      // Determine verification status
      const isVerified =
        log.status === "success" &&
        (log.blockHash || log.transactionId) &&
        fabricVerification?.exists !== false;

      return {
        success: true,
        data: {
          transactionId: log.transactionId,
          verified: isVerified,
          status: log.status,
          type: log.type,
          action: log.action,
          timestamp: log.timestamp,
          user: log.userId
            ? {
                name: log.userId.name,
                email: log.userId.email,
                role: log.userId.role,
                walletAddress: log.userId.walletAddress,
              }
            : null,
          blockchain: {
            blockHash: log.blockHash,
            blockNumber: log.blockNumber,
            chaincode: log.chaincodeName,
            function: log.functionName,
            executionTime: log.executionTime,
            gasUsed: log.gasUsed,
          },
          entity: {
            id: log.entityId,
            type: log.entityType,
          },
          fabricVerification,
          metadata: log.metadata,
        },
      };
    } catch (error) {
      console.error("❌ Verify transaction failed:", error);
      throw error;
    }
  }

  /**
   * 🏥 Get Blockchain Network Health
   */
  async getNetworkHealth() {
    try {
      console.log("🏥 Checking blockchain network health...");

      const now = new Date();
      const last1Hour = new Date(now - 60 * 60 * 1000);
      const last24Hours = new Date(now - 24 * 60 * 60 * 1000);

      // Get transaction statistics
      const [
        totalTransactions,
        recentTransactions,
        failedTransactions,
        avgExecutionTime,
      ] = await Promise.all([
        BlockchainLog.countDocuments(),
        BlockchainLog.countDocuments({ timestamp: { $gte: last1Hour } }),
        BlockchainLog.countDocuments({
          status: "failed",
          timestamp: { $gte: last24Hours },
        }),
        BlockchainLog.aggregate([
          {
            $match: {
              executionTime: { $exists: true, $ne: null },
              timestamp: { $gte: last24Hours },
            },
          },
          { $group: { _id: null, avg: { $avg: "$executionTime" } } },
        ]),
      ]);

      // Calculate success rate
      const totalLast24h = await BlockchainLog.countDocuments({
        timestamp: { $gte: last24Hours },
      });
      const successRate =
        totalLast24h > 0
          ? (
              ((totalLast24h - failedTransactions) / totalLast24h) *
              100
            ).toFixed(2)
          : 100;

      // Get transactions by type
      const txByType = await BlockchainLog.aggregate([
        { $match: { timestamp: { $gte: last24Hours } } },
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]);

      // Try to connect to Hyperledger Fabric
      let fabricStatus = "unknown";
      let fabricDetails = null;
      try {
        await this.fabricService.connect();
        fabricStatus = "connected";
        fabricDetails = {
          channelName: "mychannel",
          connected: true,
          chaincodes: ["ProductContract", "OrderContract", "UserContract"],
        };
      } catch (error) {
        fabricStatus = "disconnected";
        fabricDetails = {
          connected: false,
          error: error.message,
        };
      }

      // Determine overall health
      const healthScore = parseFloat(successRate);
      let overallStatus = "healthy";
      if (healthScore < 95) overallStatus = "degraded";
      if (healthScore < 80) overallStatus = "critical";
      if (fabricStatus === "disconnected") overallStatus = "critical";

      return {
        success: true,
        data: {
          status: overallStatus,
          healthScore: healthScore,
          network: {
            fabricStatus,
            fabricDetails,
          },
          transactions: {
            total: totalTransactions,
            last1Hour: recentTransactions,
            last24Hours: totalLast24h,
            failed24Hours: failedTransactions,
            successRate: parseFloat(successRate),
            byType: txByType.reduce((acc, item) => {
              acc[item._id] = item.count;
              return acc;
            }, {}),
          },
          performance: {
            avgExecutionTime: avgExecutionTime[0]?.avg?.toFixed(2) || 0,
            unit: "ms",
          },
          timestamp: now,
        },
      };
    } catch (error) {
      console.error("❌ Get network health failed:", error);
      throw error;
    }
  }
}

export default new BlockchainService();
