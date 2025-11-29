// chainvanguard-backend/api/src/services/wallet.balance.service.js
import Wallet from "../models/Wallet.js";
import User from "../models/User.js";
import BlockchainLog from "../models/BlockchainLog.js";
import mongoose from "mongoose";
import logger from "../utils/logger.js";
import notificationService from "./notification.service.js";
import fabricService from "./fabric.service.js"; // ✅ ADD THIS

class WalletBalanceService {
  /**
   * 💰 Get or Create Wallet for User
   * ✅ NOW CREATES BLOCKCHAIN TOKEN ACCOUNT
   */
  async getOrCreateWallet(userId) {
    try {
      let wallet = await Wallet.findOne({ userId });

      if (!wallet) {
        const user = await User.findById(userId);

        if (!user) {
          throw new Error("User not found");
        }

        // ✅ CREATE BLOCKCHAIN TOKEN ACCOUNT FIRST
        try {
          const result = await fabricService.createTokenAccount(
            userId.toString(),
            user.walletAddress,
            0
          );
          if (result.message === "Account already exists") {
            console.log(
              `ℹ️ Blockchain token account already exists for: ${user.walletAddress}`
            );
          } else {
            console.log(
              `✅ Blockchain token account created for: ${user.walletAddress}`
            );
          }
        } catch (blockchainError) {
          console.warn(
            "⚠️ Blockchain account creation failed:",
            blockchainError.message
          );
          // Continue anyway - MongoDB wallet will still be created
        }

        // Create MongoDB wallet (cache & history)
        wallet = new Wallet({
          userId: user._id,
          walletAddress: user.walletAddress,
          balance: 0,
          currency: "CVT", // ✅ NOW CVT TOKENS
          isActive: true,
          isFrozen: false,
        });

        try {
          await wallet.save();
          console.log(`✅ Wallet auto-created for user: ${userId}`);

          // Log wallet creation
          await logger.logWallet({
            type: "wallet_created",
            action: "Wallet automatically created with blockchain token account",
            walletId: wallet._id,
            userId,
            userDetails: {
              walletAddress: user.walletAddress,
              role: user.role,
              name: user.name,
            },
            status: "success",
          });
        } catch (saveError) {
          // Handle duplicate key error (E11000) - wallet was created by another request
          if (saveError.code === 11000 && saveError.message.includes("userId")) {
            console.log(`ℹ️ Wallet already exists for user: ${userId} (race condition handled)`);
            // Fetch the existing wallet created by the other request
            wallet = await Wallet.findOne({ userId });
            if (!wallet) {
              throw new Error("Wallet creation failed - please try again");
            }
          } else {
            throw saveError;
          }
        }
      }

      return wallet;
    } catch (error) {
      console.error("❌ Get/Create wallet failed:", error);
      throw error;
    }
  }

  /**
   * 💵 Get Wallet Balance
   * ✅ NOW READS FROM BLOCKCHAIN AS SOURCE OF TRUTH
   */
  async getBalance(userId) {
    try {
      // 1. Get MongoDB wallet (for metadata)
      const wallet = await this.getOrCreateWallet(userId);

      // 2. ✅ GET REAL BALANCE FROM BLOCKCHAIN
      let blockchainBalance = 0;
      try {
        const tokenBalance = await fabricService.getTokenBalance(
          userId.toString()
        );

        if (tokenBalance.success && tokenBalance.exists) {
          blockchainBalance = parseFloat(tokenBalance.balance) || 0;
        }

        // Sync MongoDB cache with blockchain
        if (wallet.balance !== blockchainBalance) {
          console.log(
            `🔄 Syncing balance: MongoDB=${wallet.balance}, Blockchain=${blockchainBalance}`
          );
          wallet.balance = blockchainBalance;
          wallet.lastSyncedAt = new Date();
          await wallet.save();
        }
      } catch (blockchainError) {
        console.warn(
          "⚠️ Blockchain balance read failed, using cached:",
          blockchainError.message
        );
        blockchainBalance = wallet.balance;
      }

      return {
        success: true,
        balance: blockchainBalance,
        wallet: {
          balance: blockchainBalance,
          currency: "CVT", // ✅ CVT TOKENS
          isActive: wallet.isActive,
          isFrozen: wallet.isFrozen,
          lastActivity: wallet.lastActivity,
          lastSyncedAt: wallet.lastSyncedAt,
        },
        data: {
          balance: blockchainBalance,
          currency: "CVT",
          isActive: wallet.isActive,
          isFrozen: wallet.isFrozen,
          lastActivity: wallet.lastActivity,
          statistics: {
            totalDeposited: wallet.totalDeposited,
            totalWithdrawn: wallet.totalWithdrawn,
            totalSpent: wallet.totalSpent,
            totalReceived: wallet.totalReceived,
          },
        },
      };
    } catch (error) {
      console.error("❌ Get balance failed:", error);
      throw error;
    }
  }

  /**
   * 💳 Add Funds (Deposit)
   * ✅ NOW MINTS CVT TOKENS ON BLOCKCHAIN
   */
  async addFunds(userId, amount, paymentMethod = "card", metadata = {}) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (amount <= 0) {
        throw new Error("Amount must be greater than 0");
      }

      const wallet = await Wallet.findOne({ userId });

      if (!wallet) {
        throw new Error("Wallet not found. Please create wallet first.");
      }

      if (!wallet.isActive) {
        throw new Error("Wallet is not active");
      }

      if (wallet.isFrozen) {
        throw new Error(
          `Wallet is frozen. Reason: ${wallet.frozenReason || "N/A"}`
        );
      }

      // ✅ MINT TOKENS ON BLOCKCHAIN
      const mintResult = await fabricService.mintTokens(
        userId.toString(),
        amount,
        `Deposit via ${paymentMethod}`
      );

      console.log("✅ Tokens minted on blockchain:", mintResult);

      // Update MongoDB (cache & history)
      const balanceBefore = wallet.balance;
      wallet.updateBalance(amount, "deposit");
      const balanceAfter = wallet.balance;

      const transaction = wallet.addTransaction({
        type: "deposit",
        amount,
        balanceBefore,
        balanceAfter,
        description: `Deposit via ${paymentMethod}`,
        status: "completed",
        metadata: {
          paymentMethod,
          blockchainTxId: mintResult.mintRecord?.txId,
          ...metadata,
        },
      });

      await wallet.save({ session });

      const user = await User.findById(userId);
      await notificationService.createNotification({
        userId,
        userRole: user.role,
        type: "wallet_credited",
        category: "payment",
        title: "Wallet Credited",
        message: `${amount.toFixed(
          2
        )} CVT has been added to your wallet. New balance: ${wallet.balance.toFixed(
          2
        )} CVT`,
        priority: "medium",
        relatedEntity: {
          entityType: "wallet",
          entityId: wallet._id,
          entityData: { amount, newBalance: wallet.balance },
        },
      });

      // LOG FUNDS ADDED
      await logger.logWallet({
        type: "wallet_funds_added",
        action: `Funds added to wallet: ${amount} CVT`,
        walletId: wallet._id,
        userId,
        userDetails: user
          ? {
              walletAddress: user.walletAddress,
              role: user.role,
              name: user.name,
            }
          : {},
        status: "success",
        data: {
          amount,
          paymentMethod,
          newBalance: wallet.balance,
          blockchainTxId: mintResult.mintRecord?.txId,
          ...metadata,
        },
      });

      await session.commitTransaction();

      return {
        success: true,
        message: "Funds added successfully",
        data: {
          amount,
          newBalance: wallet.balance,
          currency: "CVT",
          transactionId: transaction._id,
          blockchainTxId: mintResult.mintRecord?.txId,
          transaction: {
            id: transaction._id,
            type: transaction.type,
            amount: transaction.amount,
            timestamp: transaction.timestamp,
          },
        },
      };
    } catch (error) {
      await session.abortTransaction();
      console.error("❌ Add funds failed:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * 💸 Transfer Credits (User-to-User)
   * ✅ NOW USES BLOCKCHAIN TOKEN TRANSFER
   */
  async transferCredits(fromUserId, toUserId, amount, description = "") {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (amount <= 0) {
        throw new Error("Amount must be greater than 0");
      }

      if (fromUserId === toUserId) {
        throw new Error("Cannot transfer to yourself");
      }

      const [senderWallet, receiverWallet] = await Promise.all([
        Wallet.findOne({ userId: fromUserId }),
        Wallet.findOne({ userId: toUserId }),
      ]);

      if (!senderWallet || !receiverWallet) {
        throw new Error("One or both wallets not found.");
      }

      // Validate sender wallet
      if (!senderWallet.isActive || senderWallet.isFrozen) {
        throw new Error("Sender wallet is not available for transactions");
      }

      // Get real balance from blockchain
      const senderBalance = await fabricService.getTokenBalance(
        fromUserId.toString()
      );
      const realBalance = senderBalance.balance || 0;

      if (realBalance < amount) {
        throw new Error(
          `Insufficient balance. Available: ${realBalance} CVT, Required: ${amount} CVT`
        );
      }

      // Validate receiver wallet
      if (!receiverWallet.isActive || receiverWallet.isFrozen) {
        throw new Error("Receiver wallet is not available");
      }

      const [sender, receiver] = await Promise.all([
        User.findById(fromUserId).select("name email walletAddress role"),
        User.findById(toUserId).select("name email walletAddress role"),
      ]);

      // ✅ TRANSFER ON BLOCKCHAIN
      const transferResult = await fabricService.transferTokens(
        fromUserId.toString(),
        toUserId.toString(),
        amount,
        description || `Transfer to ${receiver.name}`
      );

      console.log("✅ Blockchain transfer completed:", transferResult);

      // Update MongoDB (cache & history)
      const senderBalanceBefore = senderWallet.balance;
      senderWallet.updateBalance(amount, "transfer_out");
      const senderTransaction = senderWallet.addTransaction({
        type: "transfer_out",
        amount,
        balanceBefore: senderBalanceBefore,
        balanceAfter: senderWallet.balance,
        relatedUserId: toUserId,
        description: description || `Transfer to ${receiver.name}`,
        status: "completed",
        metadata: {
          recipientName: receiver.name,
          recipientEmail: receiver.email,
          recipientWallet: receiver.walletAddress,
          blockchainTxId: transferResult.transfer?.txId,
        },
      });

      const receiverBalanceBefore = receiverWallet.balance;
      receiverWallet.updateBalance(amount, "transfer_in");
      const receiverTransaction = receiverWallet.addTransaction({
        type: "transfer_in",
        amount,
        balanceBefore: receiverBalanceBefore,
        balanceAfter: receiverWallet.balance,
        relatedUserId: fromUserId,
        description: description || `Transfer from ${sender.name}`,
        status: "completed",
        metadata: {
          senderName: sender.name,
          senderEmail: sender.email,
          senderWallet: sender.walletAddress,
          blockchainTxId: transferResult.transfer?.txId,
        },
      });

      await Promise.all([
        senderWallet.save({ session }),
        receiverWallet.save({ session }),
      ]);

      // LOG WALLET TRANSFER
      await logger.logWallet({
        type: "wallet_transfer",
        action: `Wallet transfer: ${amount} CVT from ${sender.name} to ${receiver.name}`,
        walletId: senderWallet._id,
        userId: fromUserId,
        userDetails: {
          walletAddress: sender.walletAddress,
          name: sender.name,
          email: sender.email,
        },
        status: "success",
        data: {
          amount,
          from: {
            userId: fromUserId,
            name: sender.name,
            walletAddress: sender.walletAddress,
            newBalance: senderWallet.balance,
            transactionId: senderTransaction._id,
          },
          to: {
            userId: toUserId,
            name: receiver.name,
            walletAddress: receiver.walletAddress,
            newBalance: receiverWallet.balance,
            transactionId: receiverTransaction._id,
          },
          blockchainTxId: transferResult.transfer?.txId,
          description,
        },
      });

      await session.commitTransaction();

      return {
        success: true,
        message: "Transfer completed successfully",
        data: {
          amount,
          currency: "CVT",
          from: {
            userId: fromUserId,
            name: sender.name,
            walletAddress: sender.walletAddress,
            newBalance: senderWallet.balance,
            transactionId: senderTransaction._id,
          },
          to: {
            userId: toUserId,
            name: receiver.name,
            walletAddress: receiver.walletAddress,
            newBalance: receiverWallet.balance,
            transactionId: receiverTransaction._id,
          },
          blockchainTxId: transferResult.transfer?.txId,
        },
      };
    } catch (error) {
      await session.abortTransaction();
      console.error("❌ Transfer credits failed:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * 🏦 Withdraw Funds
   * ✅ NOW BURNS CVT TOKENS ON BLOCKCHAIN
   */
  async withdrawFunds(
    userId,
    amount,
    withdrawalMethod = "bank",
    accountDetails = {}
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (amount <= 0) {
        throw new Error("Amount must be greater than 0");
      }

      const wallet = await Wallet.findOne({ userId });

      if (!wallet) {
        throw new Error("Wallet not found. Please create wallet first.");
      }

      // Log wallet state for debugging
      console.log("🔍 Withdrawal check:", {
        userId,
        amount,
        currentLimit: wallet.dailyWithdrawalLimit,
        currentWithdrawn: wallet.dailyWithdrawn,
        remaining: wallet.dailyWithdrawalLimit - wallet.dailyWithdrawn,
        balance: wallet.balance,
      });

      // Check daily reset and save if needed
      const today = new Date();
      const lastReset = new Date(wallet.lastWithdrawalReset);
      const needsReset =
        today.getDate() !== lastReset.getDate() ||
        today.getMonth() !== lastReset.getMonth() ||
        today.getFullYear() !== lastReset.getFullYear();

      if (needsReset) {
        console.log("🔄 Resetting daily withdrawal counter");
        wallet.dailyWithdrawn = 0;
        wallet.lastWithdrawalReset = today;
        await wallet.save({ session });
      }

      // Check if withdrawal is allowed
      if (!wallet.canWithdraw(amount)) {
        if (wallet.isFrozen) {
          throw new Error(
            `Wallet is frozen. Reason: ${wallet.frozenReason || "N/A"}`
          );
        }

        // Get real balance from blockchain
        const tokenBalance = await fabricService.getTokenBalance(
          userId.toString()
        );
        const realBalance = tokenBalance.balance || 0;

        if (realBalance < amount) {
          throw new Error(
            `Insufficient balance. Available: ${realBalance} CVT, Required: ${amount} CVT`
          );
        }

        const remaining = wallet.dailyWithdrawalLimit - wallet.dailyWithdrawn;
        console.log("❌ Daily limit exceeded:", {
          limit: wallet.dailyWithdrawalLimit,
          withdrawn: wallet.dailyWithdrawn,
          remaining,
          attemptedAmount: amount,
        });
        throw new Error(
          `Daily withdrawal limit exceeded. Remaining today: ${remaining} CVT`
        );
      }

      // ✅ BURN TOKENS ON BLOCKCHAIN
      const burnResult = await fabricService.burnTokens(
        userId.toString(),
        amount,
        `Withdrawal via ${withdrawalMethod}`
      );

      console.log("✅ Tokens burned on blockchain:", burnResult);

      // Update MongoDB (cache & history)
      const { balanceBefore, balanceAfter } = wallet.updateBalance(
        amount,
        "withdrawal"
      );

      const transaction = wallet.addTransaction({
        type: "withdrawal",
        amount,
        balanceBefore,
        balanceAfter,
        description: `Withdrawal via ${withdrawalMethod}`,
        status: "completed",
        metadata: {
          withdrawalMethod,
          blockchainTxId: burnResult.burnRecord?.txId,
          accountDetails: {
            ...accountDetails,
            accountNumber: accountDetails.accountNumber
              ? `****${accountDetails.accountNumber.slice(-4)}`
              : undefined,
          },
        },
      });

      wallet.dailyWithdrawn += amount;

      await wallet.save({ session });

      // Log withdrawal
      const user = await User.findById(userId).select(
        "name email walletAddress role"
      );
      await logger.logWallet({
        type: "wallet_transaction",
        action: `Withdrawal: ${amount} CVT via ${withdrawalMethod}`,
        walletId: wallet._id,
        userId,
        userDetails: user
          ? {
              walletAddress: user.walletAddress,
              role: user.role,
              name: user.name,
              email: user.email,
            }
          : {},
        status: "success",
        data: {
          amount,
          withdrawalMethod,
          balanceBefore,
          balanceAfter,
          blockchainTxId: burnResult.burnRecord?.txId,
          accountDetails: {
            accountNumber: accountDetails.accountNumber
              ? `****${accountDetails.accountNumber.slice(-4)}`
              : undefined,
          },
        },
      });

      await session.commitTransaction();

      return {
        success: true,
        message: "Withdrawal processed successfully",
        data: {
          amount,
          newBalance: wallet.balance,
          currency: "CVT",
          withdrawalMethod,
          transactionId: transaction._id,
          blockchainTxId: burnResult.burnRecord?.txId,
          estimatedArrival: "1-3 business days",
        },
      };
    } catch (error) {
      await session.abortTransaction();
      console.error("❌ Withdraw funds failed:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * 📜 Get Transaction History
   * ✅ COMBINES MONGODB HISTORY WITH BLOCKCHAIN VERIFICATION
   */
  async getTransactionHistory(userId, filters = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        type,
        startDate,
        endDate,
        status,
      } = filters;

      const wallet = await this.getOrCreateWallet(userId);

      let transactions = [...wallet.transactions];

      // Apply filters
      if (type) {
        transactions = transactions.filter((tx) => tx.type === type);
      }

      if (status) {
        transactions = transactions.filter((tx) => tx.status === status);
      }

      if (startDate || endDate) {
        transactions = transactions.filter((tx) => {
          const txDate = new Date(tx.timestamp);
          if (startDate && txDate < new Date(startDate)) return false;
          if (endDate && txDate > new Date(endDate)) return false;
          return true;
        });
      }

      // Sort by most recent
      transactions.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );

      // Pagination
      const skip = (page - 1) * limit;
      const paginatedTx = transactions.slice(skip, skip + limit);

      // Populate related user details
      const txWithDetails = await Promise.all(
        paginatedTx.map(async (tx) => {
          const txObj = tx.toObject ? tx.toObject() : tx;

          if (txObj.relatedUserId) {
            const relatedUser = await User.findById(txObj.relatedUserId).select(
              "name email walletAddress"
            );

            txObj.relatedUser = relatedUser
              ? {
                  name: relatedUser.name,
                  email: relatedUser.email,
                  walletAddress: relatedUser.walletAddress,
                }
              : null;
          }
          return txObj;
        })
      );

      // ✅ GET CURRENT BALANCE FROM BLOCKCHAIN
      let currentBalance = wallet.balance;
      try {
        const tokenBalance = await fabricService.getTokenBalance(
          userId.toString()
        );
        currentBalance = tokenBalance.balance || wallet.balance;
      } catch (error) {
        console.warn("⚠️ Using cached balance:", error.message);
      }

      return {
        success: true,
        data: txWithDetails,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(transactions.length / limit),
          totalItems: transactions.length,
          itemsPerPage: parseInt(limit),
          hasNextPage: page * limit < transactions.length,
          hasPrevPage: page > 1,
        },
        summary: {
          currentBalance,
          currency: "CVT",
          totalTransactions: wallet.transactions.length,
          statistics: {
            totalDeposited: wallet.totalDeposited,
            totalWithdrawn: wallet.totalWithdrawn,
            totalSpent: wallet.totalSpent,
            totalReceived: wallet.totalReceived,
          },
        },
      };
    } catch (error) {
      console.error("❌ Get transaction history failed:", error);
      throw error;
    }
  }

  /**
   * 💰 Process Payment (for orders)
   * ✅ NOW USES BLOCKCHAIN TOKEN TRANSFER
   */
  async processPayment(userId, orderId, amount, description, session) {
    let localSession = session;
    if (!localSession) {
      localSession = await mongoose.startSession();
      localSession.startTransaction();
    }

    try {
      const wallet = await Wallet.findOne({ userId }).session(localSession);

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      // ✅ CHECK REAL BALANCE FROM BLOCKCHAIN
      const tokenBalance = await fabricService.getTokenBalance(
        userId.toString()
      );
      const realBalance = tokenBalance.balance || 0;

      if (realBalance < amount) {
        throw new Error(
          `Insufficient balance. Available: ${realBalance} CVT, Required: ${amount} CVT`
        );
      }

      if (!wallet.isActive || wallet.isFrozen) {
        throw new Error("Wallet is not available for transactions");
      }

      // NOTE: Actual blockchain transfer happens in processPaymentWithCredit
      // This method just validates and logs

      const { balanceBefore, balanceAfter } = wallet.updateBalance(
        amount,
        "payment"
      );

      wallet.addTransaction({
        type: "payment",
        amount,
        balanceBefore,
        balanceAfter,
        relatedOrderId: orderId,
        description: description || `Payment for order`,
        status: "completed",
      });

      await wallet.save({ session: localSession });

      // LOG PAYMENT
      const user = await User.findById(userId);
      await logger.logWallet({
        type: "payment_processed",
        action: `Payment processed: ${amount} CVT`,
        walletId: wallet._id,
        userId,
        userDetails: user
          ? {
              walletAddress: user.walletAddress,
              role: user.role,
              name: user.name,
            }
          : {},
        status: "success",
        data: {
          amount,
          orderId,
          description,
          newBalance: wallet.balance,
        },
      });

      if (!session) await localSession.commitTransaction();

      return {
        success: true,
        newBalance: wallet.balance,
        message: "Payment processed successfully",
      };
    } catch (error) {
      if (!session) await localSession.abortTransaction();

      await logger.logWallet({
        type: "payment_failed",
        action: `Payment failed: ${error.message}`,
        userId,
        status: "failed",
        data: { amount, orderId, description },
        error: error.message,
      });
      throw error;
    } finally {
      if (!session) localSession.endSession();
    }
  }

  /**
   * 💵 Process Refund
   * ✅ NOW MINTS TOKENS BACK TO USER
   */
  async processRefund(userId, orderId, amount, description, session) {
    let localSession = session;
    let shouldCommit = false;

    if (!localSession) {
      localSession = await mongoose.startSession();
      localSession.startTransaction();
      shouldCommit = true;
    }

    try {
      const wallet = await Wallet.findOne({ userId });

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      // ✅ MINT REFUND TOKENS ON BLOCKCHAIN
      const mintResult = await fabricService.mintTokens(
        userId.toString(),
        amount,
        `Refund for order ${orderId}`
      );

      console.log("✅ Refund tokens minted:", mintResult);

      // Update MongoDB
      const { balanceBefore, balanceAfter } = wallet.updateBalance(
        amount,
        "refund"
      );

      wallet.addTransaction({
        type: "refund",
        amount,
        balanceBefore,
        balanceAfter,
        relatedOrderId: orderId,
        description: description || `Refund for order`,
        status: "completed",
        metadata: {
          blockchainTxId: mintResult.mintRecord?.txId,
        },
      });

      await wallet.save({ session: localSession });

      // LOG REFUND
      const user = await User.findById(userId);
      await logger.logWallet({
        type: "refund_processed",
        action: `Refund processed: ${amount} CVT`,
        walletId: wallet._id,
        userId,
        userDetails: user
          ? {
              walletAddress: user.walletAddress,
              role: user.role,
              name: user.name,
            }
          : {},
        status: "success",
        data: {
          amount,
          orderId,
          description,
          newBalance: wallet.balance,
          blockchainTxId: mintResult.mintRecord?.txId,
        },
      });

      if (shouldCommit) {
        await localSession.commitTransaction();
      }

      console.log(
        `✅ Refunded ${amount} CVT to wallet. New balance: ${wallet.balance} CVT`
      );

      return {
        success: true,
        newBalance: wallet.balance,
        refundAmount: amount,
        blockchainTxId: mintResult.mintRecord?.txId,
        message: "Refund processed successfully",
      };
    } catch (error) {
      if (shouldCommit) {
        await localSession.abortTransaction();
      }

      // LOG FAILED REFUND
      await logger.logWallet({
        type: "refund_failed",
        action: `Refund failed: ${error.message}`,
        userId,
        status: "failed",
        data: { amount, orderId, description },
        error: error.message,
      });

      console.error("❌ Refund failed:", error);
      throw error;
    } finally {
      if (shouldCommit) {
        localSession.endSession();
      }
    }
  }

  /**
   * 🔒 Freeze Wallet (Admin/Expert only)
   */
  async freezeWallet(userId, reason, performedBy = null) {
    try {
      const wallet = await Wallet.findOne({ userId }).populate("userId", "name email");

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      wallet.freeze(reason);
      await wallet.save();

      // Log to DB
      const logData = {
        transactionId: `wallet-freeze-${Date.now()}`,
        type: "security-event",
        action: "wallet-frozen",
        status: "success",
        performedBy: performedBy,
        userId: performedBy,
        entityId: userId,
        entityType: "wallet",
        metadata: {
          reason,
          targetUser: wallet.userId?.email || userId,
          targetName: wallet.userId?.name || "Unknown",
          walletAddress: wallet.walletAddress,
        },
        timestamp: new Date(),
      };

      try {
        await BlockchainLog.create(logData);
        console.log("✅ Wallet freeze logged to DB");
      } catch (logErr) {
        console.warn("⚠️ Failed to log wallet freeze to DB:", logErr);
      }

      // Log to Fabric blockchain
      try {
        await fabricService.createBlockchainLog(
          logData.transactionId,
          logData
        );
        console.log("✅ Wallet freeze logged to Fabric blockchain");
      } catch (fabricErr) {
        console.warn(
          "⚠️ Failed to log wallet freeze to Fabric blockchain:",
          fabricErr.message
        );
      }

      // Log using logger utility
      try {
        await logger.logWallet({
          type: "wallet-frozen",
          userId: userId,
          performedBy: performedBy,
          data: {
            reason,
            walletAddress: wallet.walletAddress,
          },
        });
      } catch (loggerErr) {
        console.warn("⚠️ Logger failed for wallet freeze:", loggerErr);
      }

      return {
        success: true,
        message: "Wallet frozen successfully",
      };
    } catch (error) {
      console.error("❌ Freeze wallet failed:", error);
      throw error;
    }
  }

  /**
   * 🔓 Unfreeze Wallet (Admin/Expert only)
   */
  async unfreezeWallet(userId, reason = "Admin action", performedBy = null) {
    try {
      const wallet = await Wallet.findOne({ userId }).populate("userId", "name email");

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      wallet.unfreeze();
      await wallet.save();

      // Log to DB
      const logData = {
        transactionId: `wallet-unfreeze-${Date.now()}`,
        type: "security-event",
        action: "wallet-unfrozen",
        status: "success",
        performedBy: performedBy,
        userId: performedBy,
        entityId: userId,
        entityType: "wallet",
        metadata: {
          reason,
          targetUser: wallet.userId?.email || userId,
          targetName: wallet.userId?.name || "Unknown",
          walletAddress: wallet.walletAddress,
        },
        timestamp: new Date(),
      };

      try {
        await BlockchainLog.create(logData);
        console.log("✅ Wallet unfreeze logged to DB");
      } catch (logErr) {
        console.warn("⚠️ Failed to log wallet unfreeze to DB:", logErr);
      }

      // Log to Fabric blockchain
      try {
        await fabricService.createBlockchainLog(
          logData.transactionId,
          logData
        );
        console.log("✅ Wallet unfreeze logged to Fabric blockchain");
      } catch (fabricErr) {
        console.warn(
          "⚠️ Failed to log wallet unfreeze to Fabric blockchain:",
          fabricErr.message
        );
      }

      // Log using logger utility
      try {
        await logger.logWallet({
          type: "wallet-unfrozen",
          userId: userId,
          performedBy: performedBy,
          data: {
            reason,
            walletAddress: wallet.walletAddress,
          },
        });
      } catch (loggerErr) {
        console.warn("⚠️ Logger failed for wallet unfreeze:", loggerErr);
      }

      return {
        success: true,
        message: "Wallet unfrozen successfully",
      };
    } catch (error) {
      console.error("❌ Unfreeze wallet failed:", error);
      throw error;
    }
  }

  /**
   * 🔄 Update Transaction with Order ID
   */
  async updateTransactionOrderId(userId, orderId, session) {
    try {
      const result = await Wallet.findOneAndUpdate(
        {
          userId,
          "transactions.type": "payment",
          "transactions.relatedOrderId": { $exists: false },
        },
        {
          $set: {
            "transactions.$[elem].relatedOrderId": orderId,
          },
        },
        {
          arrayFilters: [
            {
              "elem.type": "payment",
              "elem.relatedOrderId": { $exists: false },
            },
          ],
          sort: { "transactions.timestamp": -1 },
          session: session,
          new: true,
        }
      );

      if (result) {
        console.log(`✅ Updated transaction with orderId: ${orderId}`);
      } else {
        console.warn(
          `⚠️ No pending payment transaction found for user: ${userId}`
        );
      }
    } catch (error) {
      console.error("⚠️ Failed to update transaction orderId:", error);
    }
  }

  /**
   * 💰 Process Payment WITH Supplier Credit
   * ✅ NOW USES BLOCKCHAIN TOKEN TRANSFER
   */
  async processPaymentWithCredit(
    buyerId,
    sellerId,
    orderId,
    amount,
    description,
    session
  ) {
    let localSession = session;
    if (!localSession) {
      localSession = await mongoose.startSession();
      localSession.startTransaction();
    }

    try {
      const [buyerWallet, sellerWallet] = await Promise.all([
        this.getOrCreateWallet(buyerId),
        this.getOrCreateWallet(sellerId),
      ]);

      // Validate buyer wallet
      const buyerBalance = await fabricService.getTokenBalance(
        buyerId.toString()
      );
      const realBalance = buyerBalance.balance || 0;

      if (realBalance < amount) {
        throw new Error(
          `Insufficient balance. Available: ${realBalance} CVT, Required: ${amount} CVT`
        );
      }

      if (!buyerWallet.isActive || buyerWallet.isFrozen) {
        throw new Error("Buyer wallet is not available");
      }

      // Validate seller wallet
      if (!sellerWallet.isActive || sellerWallet.isFrozen) {
        throw new Error("Seller wallet cannot receive payments");
      }

      const [buyer, seller] = await Promise.all([
        User.findById(buyerId).select("name email walletAddress role"),
        User.findById(sellerId).select("name email walletAddress role"),
      ]);

      // ✅ TRANSFER TOKENS ON BLOCKCHAIN
      const transferResult = await fabricService.transferTokens(
        buyerId.toString(),
        sellerId.toString(),
        amount,
        description || `Payment for order ${orderId}`
      );

      console.log("✅ Blockchain payment transfer:", transferResult);

      // Update MongoDB for both wallets
      const buyerBalanceBefore = buyerWallet.balance;
      const { balanceAfter: buyerBalanceAfter } = buyerWallet.updateBalance(
        amount,
        "payment"
      );

      buyerWallet.addTransaction({
        type: "payment",
        amount,
        balanceBefore: buyerBalanceBefore,
        balanceAfter: buyerBalanceAfter,
        relatedOrderId: orderId,
        relatedUserId: sellerId,
        description: description || `Payment to ${seller.name}`,
        status: "completed",
        metadata: {
          sellerName: seller.name,
          sellerWalletAddress: seller.walletAddress,
          orderReference: orderId,
          blockchainTxId: transferResult.transfer?.txId,
        },
      });

      const sellerBalanceBefore = sellerWallet.balance;
      const { balanceAfter: sellerBalanceAfter } = sellerWallet.updateBalance(
        amount,
        "sale"
      );

      sellerWallet.addTransaction({
        type: "sale",
        amount,
        balanceBefore: sellerBalanceBefore,
        balanceAfter: sellerBalanceAfter,
        relatedOrderId: orderId,
        relatedUserId: buyerId,
        description: description || `Payment from ${buyer.name}`,
        status: "completed",
        metadata: {
          buyerName: buyer.name,
          buyerWalletAddress: buyer.walletAddress,
          orderReference: orderId,
          blockchainTxId: transferResult.transfer?.txId,
        },
      });

      await Promise.all([
        buyerWallet.save({ session: localSession }),
        sellerWallet.save({ session: localSession }),
      ]);

      // Log the transaction
      await logger.logWallet({
        type: "payment_processed",
        action: `Payment: ${amount} CVT from ${buyer.name} to ${seller.name}`,
        walletId: buyerWallet._id,
        userId: buyerId,
        userDetails: {
          walletAddress: buyer.walletAddress,
          role: buyer.role,
          name: buyer.name,
        },
        status: "success",
        data: {
          amount,
          orderId,
          buyer: {
            userId: buyerId,
            name: buyer.name,
            balanceBefore: buyerBalanceBefore,
            balanceAfter: buyerBalanceAfter,
          },
          seller: {
            userId: sellerId,
            name: seller.name,
            balanceBefore: sellerBalanceBefore,
            balanceAfter: sellerBalanceAfter,
          },
          blockchainTxId: transferResult.transfer?.txId,
        },
      });

      if (!session) {
        await localSession.commitTransaction();
      }

      console.log(
        `✅ Payment processed: Vendor paid ${amount} CVT, Supplier credited ${amount} CVT`
      );

      return {
        success: true,
        message: "Payment processed and seller credited",
        data: {
          amount,
          currency: "CVT",
          buyer: {
            userId: buyerId,
            name: buyer.name,
            newBalance: buyerBalanceAfter,
          },
          seller: {
            userId: sellerId,
            name: seller.name,
            newBalance: sellerBalanceAfter,
          },
          blockchainTxId: transferResult.transfer?.txId,
        },
      };
    } catch (error) {
      if (!session) {
        await localSession.abortTransaction();
      }
      console.error("❌ Process payment with credit failed:", error);
      throw error;
    } finally {
      if (!session) {
        localSession.endSession();
      }
    }
  }

  /**
   * 🔄 Sync Wallet Balance with Blockchain
   * ✅ NEW METHOD - Manually sync MongoDB cache with blockchain
   */
  async syncWalletBalance(userId) {
    try {
      const wallet = await Wallet.findOne({ userId });

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      // Get blockchain balance
      const tokenBalance = await fabricService.getTokenBalance(
        userId.toString()
      );

      if (!tokenBalance.success) {
        throw new Error("Failed to get blockchain balance");
      }

      const blockchainBalance = parseFloat(tokenBalance.balance) || 0;

      // Update MongoDB
      const balanceBefore = wallet.balance;
      wallet.balance = blockchainBalance;
      wallet.lastSyncedAt = new Date();
      await wallet.save();

      console.log(
        `✅ Wallet synced: ${balanceBefore} CVT → ${blockchainBalance} CVT`
      );

      return {
        success: true,
        message: "Wallet balance synced successfully",
        data: {
          balanceBefore,
          balanceAfter: blockchainBalance,
          currency: "CVT",
          lastSyncedAt: wallet.lastSyncedAt,
        },
      };
    } catch (error) {
      console.error("❌ Sync wallet balance failed:", error);
      throw error;
    }
  }

  /**
   * 💰 Check if user can afford amount
   * ✅ NOW CHECKS BLOCKCHAIN BALANCE
   */
  async canAfford(userId, amount) {
    try {
      // Check blockchain health first
      await fabricService.ensureBlockchainConnected();

      const tokenBalance = await fabricService.getTokenBalance(
        userId.toString()
      );
      const balance = tokenBalance.balance || 0;
      return balance >= amount;
    } catch (error) {
      console.error("❌ Blockchain balance check failed:", error);
      // Throw error to inform user that blockchain is required
      throw new Error(
        `Blockchain network error: ${error.message}. Please ensure Hyperledger Fabric is running.`
      );
    }
  }
}

export default new WalletBalanceService();
