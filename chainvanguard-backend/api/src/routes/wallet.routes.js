import express from "express";
import walletBalanceService from "../services/wallet-balance.service.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

// All wallet routes require authentication
router.use(authenticate);

/**
 * GET /api/wallet/balance
 * Get current wallet balance
 */
router.get("/balance", async (req, res) => {
  try {
    const result = await walletBalanceService.getBalance(req.userId);
    res.json(result);
  } catch (error) {
    console.error("❌ Get balance failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get balance",
    });
  }
});

/**
 * POST /api/wallet/add-funds
 * Add funds to wallet (deposit)
 */
router.post("/add-funds", async (req, res) => {
  try {
    const { amount, paymentMethod = "card", metadata = {} } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
      });
    }

    const result = await walletBalanceService.addFunds(
      req.userId,
      parseFloat(amount),
      paymentMethod,
      metadata
    );

    res.json(result);
  } catch (error) {
    console.error("❌ Add funds failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to add funds",
    });
  }
});

/**
 * POST /api/wallet/transfer
 * Transfer credits to another user
 */
router.post("/transfer", async (req, res) => {
  try {
    const { toUserId, toWalletAddress, amount, description = "" } = req.body;

    let recipientId = toUserId;

    // If wallet address provided, find user
    if (!recipientId && toWalletAddress) {
      const User = (await import("../models/User.js")).default;
      const recipient = await User.findOne({
        walletAddress: toWalletAddress,
      }).select("_id");
      if (!recipient) {
        return res.status(404).json({
          success: false,
          message: "Recipient wallet address not found",
        });
      }
      recipientId = recipient._id;
    }

    if (!recipientId) {
      return res.status(400).json({
        success: false,
        message: "Recipient user ID or wallet address is required",
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
      });
    }

    const result = await walletBalanceService.transferCredits(
      req.userId,
      recipientId,
      parseFloat(amount),
      description
    );

    res.json(result);
  } catch (error) {
    console.error("❌ Transfer failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to transfer credits",
    });
  }
});

/**
 * POST /api/wallet/withdraw
 * Withdraw funds from wallet
 */
router.post("/withdraw", async (req, res) => {
  try {
    const { amount, withdrawalMethod = "bank", accountDetails = {} } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
      });
    }

    const result = await walletBalanceService.withdrawFunds(
      req.userId,
      parseFloat(amount),
      withdrawalMethod,
      accountDetails
    );

    res.json(result);
  } catch (error) {
    console.error("❌ Withdrawal failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to withdraw funds",
    });
  }
});

/**
 * GET /api/wallet/transactions
 * Get transaction history
 */
router.get("/transactions", async (req, res) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      type: req.query.type,
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const result = await walletBalanceService.getTransactionHistory(
      req.userId,
      filters
    );
    res.json(result);
  } catch (error) {
    console.error("❌ Get transactions failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get transaction history",
    });
  }
});

/**
 * POST /api/wallet/freeze (Expert only)
 * Freeze a user's wallet
 */
router.post("/freeze/:userId", authorizeRoles("expert"), async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Reason is required to freeze wallet",
      });
    }

    const result = await walletBalanceService.freezeWallet(userId, reason);
    res.json(result);
  } catch (error) {
    console.error("❌ Freeze wallet failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to freeze wallet",
    });
  }
});

/**
 * POST /api/wallet/unfreeze (Expert only)
 * Unfreeze a user's wallet
 */
router.post("/unfreeze/:userId", authorizeRoles("expert"), async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await walletBalanceService.unfreezeWallet(userId);
    res.json(result);
  } catch (error) {
    console.error("❌ Unfreeze wallet failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to unfreeze wallet",
    });
  }
});

/**
 * POST /api/wallet/deposit
 * Deposit funds to wallet (test/development helper)
 */
router.post("/deposit", async (req, res) => {
  try {
    const { amount, description = "Test deposit" } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
      });
    }

    // Call addFunds service
    const result = await walletBalanceService.addFunds(
      req.userId,
      parseFloat(amount),
      "test_deposit",
      { description }
    );

    // Return with correct structure
    res.json({
      success: true,
      message: result.message,
      balance: result.data.newBalance, // ✅ Correct path
      wallet: {
        balance: result.data.newBalance,
      },
    });
  } catch (error) {
    console.error("❌ Deposit failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to deposit funds",
    });
  }
});

/**
 * POST /api/wallet/reset (DEV ONLY)
 * Reset wallet balance to zero
 */
router.post("/reset", authenticate, async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        success: false,
        message: "Not available in production",
      });
    }

    const wallet = await Wallet.findOne({ userId: req.userId });
    if (wallet) {
      wallet.balance = 0;
      wallet.transactions = [];
      wallet.totalDeposited = 0;
      wallet.totalWithdrawn = 0;
      wallet.totalSpent = 0;
      wallet.totalReceived = 0;
      await wallet.save();
    }

    res.json({
      success: true,
      message: "Wallet reset successfully",
      balance: 0,
    });
  } catch (error) {
    console.error("❌ Wallet reset failed:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
