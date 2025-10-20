import express from "express";
import blockchainService from "../services/blockchain.service.js";
import { authenticate, optionalAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * GET /api/blockchain/product-history/:id
 * Get complete blockchain history for a product
 * Access: Public (with optional auth for enhanced info)
 */
router.get("/product-history/:id", optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await blockchainService.getProductHistory(id);

    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Get product history failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get product history",
    });
  }
});

/**
 * GET /api/blockchain/order-history/:id
 * Get complete blockchain history for an order
 * Access: Private (order owner or admin)
 */
router.get("/order-history/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await blockchainService.getOrderHistory(id);

    // Check authorization (order owner, seller, or expert)
    if (result.success && result.data.order) {
      const userId = req.userId;
      const userRole = req.userRole;
      const order = result.data.order;

      const isOwner = order.customer?._id?.toString() === userId;
      const isExpert = userRole === "expert";

      if (!isOwner && !isExpert) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You can only view your own orders.",
        });
      }
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Get order history failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get order history",
    });
  }
});

/**
 * GET /api/blockchain/verify-tx/:txId
 * Verify a transaction on the blockchain
 * Access: Public
 */
router.get("/verify-tx/:txId", async (req, res) => {
  try {
    const { txId } = req.params;

    const result = await blockchainService.verifyTransaction(txId);

    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Verify transaction failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to verify transaction",
    });
  }
});

/**
 * GET /api/blockchain/network-health
 * Get blockchain network health status
 * Access: Public
 */
router.get("/network-health", async (req, res) => {
  try {
    const result = await blockchainService.getNetworkHealth();

    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Get network health failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get network health",
    });
  }
});

export default router;
