// chainvanguard-backend/api/src/routes/wallet_routes.js
import express from "express";
import walletBalanceService from "../services/wallet.balance.service.js";
import fabricService from "../services/fabric.service.js";
import stripeService from "../services/stripe.service.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

// All wallet routes require authentication
router.use(authenticate);

/**
 * GET /api/wallet/balance
 * Get current wallet balance from blockchain
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
 * POST /api/wallet/create
 * Create blockchain wallet for user (auto-created on first access)
 */
router.post("/create", async (req, res) => {
  try {
    const { initialBalance = 0 } = req.body;

    const wallet = await walletBalanceService.getOrCreateWallet(req.userId);

    if (initialBalance > 0) {
      await walletBalanceService.addFunds(
        req.userId,
        parseFloat(initialBalance),
        "initial_deposit"
      );
    }

    res.json({
      success: true,
      message: "Wallet created successfully",
      wallet,
    });
  } catch (error) {
    console.error("❌ Create wallet failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create wallet",
    });
  }
});

/**
 * POST /api/wallet/deposit
 * Deposit funds to wallet (mint tokens on blockchain)
 */
router.post("/deposit", async (req, res) => {
  try {
    const { amount, description = "Deposit" } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
      });
    }

    const result = await walletBalanceService.addFunds(
      req.userId,
      parseFloat(amount),
      "deposit",
      { description }
    );

    res.json(result);
  } catch (error) {
    console.error("❌ Deposit failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to deposit funds",
    });
  }
});

/**
 * POST /api/wallet/create-payment-intent
 * Create Stripe payment intent for adding funds
 */
router.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
      });
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripeService.createPaymentIntent(
      parseFloat(amount),
      req.userId,
      {
        userEmail: req.user?.email,
        userName: req.user?.name,
      }
    );

    // Wrap response to match frontend WalletApiResponse type
    res.json({
      success: true,
      message: "Payment intent created successfully",
      data: {
        clientSecret: paymentIntent.clientSecret,
        paymentIntentId: paymentIntent.paymentIntentId,
        amount: paymentIntent.amount,
      },
    });
  } catch (error) {
    console.error("❌ Create payment intent failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create payment intent",
    });
  }
});

/**
 * POST /api/wallet/confirm-payment
 * Confirm Stripe payment and add funds to wallet
 */
router.post("/confirm-payment", async (req, res) => {
  try {
    const { paymentIntentId, amount } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: "Payment intent ID is required",
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
      });
    }

    // Verify payment with Stripe
    const verification = await stripeService.verifyPayment(paymentIntentId);

    if (!verification.verified) {
      return res.status(400).json({
        success: false,
        message: verification.message || "Payment verification failed",
      });
    }

    // Get payment method details for metadata
    let paymentMethodDetails = {};
    if (verification.paymentMethod) {
      try {
        const pmDetails = await stripeService.getPaymentMethod(
          verification.paymentMethod
        );
        paymentMethodDetails = {
          cardBrand: pmDetails.card?.brand,
          cardLast4: pmDetails.card?.last4,
        };
      } catch (error) {
        console.warn("⚠️ Could not fetch payment method details:", error);
      }
    }

    // Calculate CVT tokens (conversion rate: 1 USD = 278 CVT)
    const CONVERSION_RATE = 278;
    const cvtAmount = parseFloat(amount) * CONVERSION_RATE;

    // Add funds to wallet (mints CVT tokens on blockchain)
    const result = await walletBalanceService.addFunds(
      req.userId,
      cvtAmount,
      "stripe",
      {
        paymentIntentId,
        amountUSD: amount,
        amountCVT: cvtAmount,
        conversionRate: CONVERSION_RATE,
        stripeVerified: true,
        ...paymentMethodDetails,
      }
    );

    res.json({
      success: true,
      message: "Payment confirmed and funds added successfully",
      data: {
        ...result.data,
        amountUSD: amount,
        amountCVT: cvtAmount,
        conversionRate: CONVERSION_RATE,
        paymentIntentId,
      },
    });
  } catch (error) {
    console.error("❌ Confirm payment failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to confirm payment",
    });
  }
});

/**
 * POST /api/wallet/add-funds
 * Add funds to wallet (mint tokens) - Legacy endpoint for backward compatibility
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
 * Transfer tokens to another user
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
      message: error.message || "Failed to transfer tokens",
    });
  }
});

/**
 * POST /api/wallet/withdraw
 * Withdraw funds from wallet (burn tokens)
 * Accepts USD amount and converts to CVT tokens (1 USD = 278 CVT)
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

    // Calculate CVT tokens (conversion rate: 1 USD = 278 CVT)
    const CONVERSION_RATE = 278;
    const cvtAmount = parseFloat(amount) * CONVERSION_RATE;

    const result = await walletBalanceService.withdrawFunds(
      req.userId,
      cvtAmount,
      withdrawalMethod,
      {
        ...accountDetails,
        amountUSD: amount,
        amountCVT: cvtAmount,
        conversionRate: CONVERSION_RATE,
      }
    );

    res.json({
      success: true,
      message: "Withdrawal completed successfully",
      data: {
        ...result.data,
        amountUSD: amount,
        amountCVT: cvtAmount,
        conversionRate: CONVERSION_RATE,
      },
    });
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
 * Get transaction history from blockchain
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
 * GET /api/wallet/info
 * Get wallet information including token details
 * ✅ NOW RETURNS CVT TOKEN INFO
 */
router.get("/info", async (req, res) => {
  try {
    const balance = await walletBalanceService.getBalance(req.userId);

    // ✅ GET TOKEN INFO FROM BLOCKCHAIN
    let tokenInfo = {
      name: "ChainVanguard Token",
      symbol: "CVT",
      decimals: 2,
      totalSupply: 0,
    };

    try {
      const blockchainTokenInfo = await fabricService.getTokenInfo();
      if (blockchainTokenInfo.success) {
        tokenInfo = {
          ...tokenInfo,
          ...blockchainTokenInfo.tokenInfo,
        };
      }
    } catch (error) {
      console.warn("⚠️ Could not fetch token info from blockchain");
    }

    res.json({
      success: true,
      wallet: {
        ...balance.wallet,
        ...tokenInfo,
      },
      tokenInfo,
    });
  } catch (error) {
    console.error("❌ Get wallet info failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get wallet info",
    });
  }
});

/**
 * ✅ NEW ENDPOINT
 * GET /api/wallet/token-info
 * Get CVT token information from blockchain
 */
router.get("/token-info", async (req, res) => {
  try {
    const tokenInfo = await fabricService.getTokenInfo();

    res.json({
      success: true,
      ...tokenInfo,
    });
  } catch (error) {
    console.error("❌ Get token info failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get token information",
      fallback: {
        name: "ChainVanguard Token",
        symbol: "CVT",
        decimals: 2,
        totalSupply: 0,
      },
    });
  }
});

/**
 * ✅ NEW ENDPOINT
 * POST /api/wallet/sync
 * Sync wallet balance with blockchain
 */
router.post("/sync", async (req, res) => {
  try {
    const result = await walletBalanceService.syncWalletBalance(req.userId);
    res.json(result);
  } catch (error) {
    console.error("❌ Sync wallet failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to sync wallet balance",
    });
  }
});

/**
 * ✅ NEW ENDPOINT
 * GET /api/wallet/blockchain-history
 * Get transaction history directly from blockchain
 */
router.get("/blockchain-history", async (req, res) => {
  try {
    const history = await fabricService.getTokenHistory(req.userId.toString());

    res.json({
      success: true,
      ...history,
    });
  } catch (error) {
    console.error("❌ Get blockchain history failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get blockchain history",
    });
  }
});

/**
 * GET /api/wallet/can-afford/:amount
 * Check if user can afford a specific amount
 */
router.get("/can-afford/:amount", async (req, res) => {
  try {
    const amount = parseFloat(req.params.amount);

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
      });
    }

    const canAfford = await walletBalanceService.canAfford(req.userId, amount);

    res.json({
      success: true,
      canAfford,
      amount,
      currency: "CVT",
    });
  } catch (error) {
    console.error("❌ Check afford failed:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * POST /api/wallet/freeze/:userId (Expert/Admin only)
 * Freeze a user's wallet
 */
router.post(
  "/freeze/:userId",
  authorizeRoles("expert", "admin"),
  async (req, res) => {
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
  }
);

/**
 * POST /api/wallet/unfreeze/:userId (Expert/Admin only)
 * Unfreeze a user's wallet
 */
router.post(
  "/unfreeze/:userId",
  authorizeRoles("expert", "admin"),
  async (req, res) => {
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
  }
);

/**
 * POST /api/wallet/reset (DEV ONLY)
 * Reset wallet balance to zero (development only - uses blockchain)
 */
router.post("/reset", async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        success: false,
        message: "Not available in production",
      });
    }

    // Get current balance from blockchain
    const balance = await walletBalanceService.getBalance(req.userId);

    if (balance.balance > 0) {
      // Burn all tokens to reset to 0
      await walletBalanceService.withdrawFunds(
        req.userId,
        balance.balance,
        "reset",
        {}
      );
    }

    res.json({
      success: true,
      message: "Wallet reset successfully",
      balance: 0,
      currency: "CVT",
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
