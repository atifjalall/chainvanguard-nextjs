import Wallet from "../models/Wallet.js";
import User from "../models/User.js";
import BlockchainLog from "../models/BlockchainLog.js";
import mongoose from "mongoose";
import logger from "../utils/logger.js";

class WalletBalanceService {
  /**
   * 💰 Get or Create Wallet for User
   */
  async getOrCreateWallet(userId) {
    try {
      let wallet = await Wallet.findOne({ userId });

      if (!wallet) {
        // Get user's wallet address
        const user = await User.findById(userId).select("walletAddress");
        if (!user) {
          throw new Error("User not found");
        }

        wallet = new Wallet({
          userId,
          walletAddress: user.walletAddress,
          balance: 0,
          currency: "PKR",
        });

        await wallet.save();
        console.log(`✅ Created new wallet for user: ${userId}`);
      }

      return wallet;
    } catch (error) {
      console.error("❌ Get/Create wallet failed:", error);
      throw error;
    }
  }

  /**
   * 💵 Get Wallet Balance
   */
  async getBalance(userId) {
    try {
      const wallet = await this.getOrCreateWallet(userId);

      return {
        success: true,
        balance: wallet.balance,
        wallet: {
          balance: wallet.balance,
          currency: wallet.currency,
          isActive: wallet.isActive,
          isFrozen: wallet.isFrozen,
          lastActivity: wallet.lastActivity,
        },
        data: {
          balance: wallet.balance,
          currency: wallet.currency,
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
   */
  async addFunds(userId, amount, paymentMethod = "card", metadata = {}) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (amount <= 0) {
        throw new Error("Amount must be greater than 0");
      }

      const wallet = await this.getOrCreateWallet(userId);

      if (!wallet.isActive) {
        throw new Error("Wallet is not active");
      }

      if (wallet.isFrozen) {
        throw new Error(
          `Wallet is frozen. Reason: ${wallet.frozenReason || "N/A"}`
        );
      }

      // Update balance
      const { balanceBefore, balanceAfter } = wallet.updateBalance(
        amount,
        "deposit"
      );

      // Add transaction record
      const transaction = wallet.addTransaction({
        type: "deposit",
        amount,
        balanceBefore,
        balanceAfter,
        description: `Deposit via ${paymentMethod}`,
        status: "completed",
        metadata: {
          paymentMethod,
          ...metadata,
        },
      });

      await wallet.save({ session });

      // 🆕 LOG FUNDS ADDED
      const user = await User.findById(userId);
      await logger.logWallet({
        type: "wallet_funds_added",
        action: `Funds added to wallet: $${amount}`,
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
          currency: wallet.currency,
          transactionId: transaction._id,
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

      // Get both wallets
      const [senderWallet, receiverWallet] = await Promise.all([
        this.getOrCreateWallet(fromUserId),
        this.getOrCreateWallet(toUserId),
      ]);

      // Validate sender wallet
      if (!senderWallet.isActive || senderWallet.isFrozen) {
        throw new Error("Sender wallet is not available for transactions");
      }

      if (senderWallet.balance < amount) {
        throw new Error(
          `Insufficient balance. Available: ${senderWallet.balance} ${senderWallet.currency}`
        );
      }

      // Validate receiver wallet
      if (!receiverWallet.isActive || receiverWallet.isFrozen) {
        throw new Error("Receiver wallet is not available");
      }

      // Get user details
      const [sender, receiver] = await Promise.all([
        User.findById(fromUserId).select("name email walletAddress"),
        User.findById(toUserId).select("name email walletAddress"),
      ]);

      // Deduct from sender
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
        },
      });

      // Add to receiver
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
        },
      });

      await Promise.all([
        senderWallet.save({ session }),
        receiverWallet.save({ session }),
      ]);

      // 🆕 LOG WALLET TRANSFER
      await logger.logWallet({
        type: "wallet_transfer",
        action: `Wallet transfer: $${amount} from ${sender.name} to ${receiver.name}`,
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
          description,
        },
      });

      await session.commitTransaction();

      return {
        success: true,
        message: "Transfer completed successfully",
        data: {
          amount,
          currency: senderWallet.currency,
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

      const wallet = await this.getOrCreateWallet(userId);

      // Check if withdrawal is allowed
      if (!wallet.canWithdraw(amount)) {
        if (wallet.isFrozen) {
          throw new Error(
            `Wallet is frozen. Reason: ${wallet.frozenReason || "N/A"}`
          );
        }
        if (wallet.balance < amount) {
          throw new Error(
            `Insufficient balance. Available: ${wallet.balance} ${wallet.currency}`
          );
        }
        const remaining = wallet.dailyWithdrawalLimit - wallet.dailyWithdrawn;
        throw new Error(
          `Daily withdrawal limit exceeded. Remaining today: ${remaining} ${wallet.currency}`
        );
      }

      // Update balance
      const { balanceBefore, balanceAfter } = wallet.updateBalance(
        amount,
        "withdrawal"
      );

      // Add transaction record
      const transaction = wallet.addTransaction({
        type: "withdrawal",
        amount,
        balanceBefore,
        balanceAfter,
        description: `Withdrawal via ${withdrawalMethod}`,
        status: "completed",
        metadata: {
          withdrawalMethod,
          accountDetails: {
            ...accountDetails,
            // Mask sensitive data
            accountNumber: accountDetails.accountNumber
              ? `****${accountDetails.accountNumber.slice(-4)}`
              : undefined,
          },
        },
      });

      // Update daily withdrawn amount
      wallet.dailyWithdrawn += amount;

      await wallet.save({ session });

      // Log to blockchain
      // Log withdrawal to database
      const user = await User.findById(userId).select(
        "name email walletAddress role"
      );
      await logger.logWallet({
        type: "wallet_transaction",
        action: `Withdrawal: $${amount} via ${withdrawalMethod}`,
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
          accountDetails: {
            // Masked for security
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
          currency: wallet.currency,
          withdrawalMethod,
          transactionId: transaction._id,
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
          currentBalance: wallet.balance,
          currency: wallet.currency,
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
   */
  async processPayment(userId, orderId, amount, description, session) {
    let localSession = session;
    if (!localSession) {
      localSession = await mongoose.startSession();
      localSession.startTransaction();
    }
    try {
      const wallet = await this.getOrCreateWallet(userId);

      if (wallet.balance < amount) {
        throw new Error(
          `Insufficient balance. Available: ${wallet.balance} ${wallet.currency}, Required: ${amount} ${wallet.currency}`
        );
      }

      if (!wallet.isActive || wallet.isFrozen) {
        throw new Error("Wallet is not available for transactions");
      }

      // Deduct amount
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

      // 🆕 LOG PAYMENT
      const user = await User.findById(userId);
      await logger.logWallet({
        type: "payment_processed",
        action: `Payment processed: $${amount}`,
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
      // 🆕 LOG FAILED PAYMENT
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
   */
  async processRefund(userId, orderId, amount, description) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const wallet = await this.getOrCreateWallet(userId);

      // Add refund amount
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
      });

      await wallet.save({ session });

      await session.commitTransaction();

      return {
        success: true,
        newBalance: wallet.balance,
        message: "Refund processed successfully",
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * 🔒 Freeze Wallet (Admin/Expert only)
   */
  async freezeWallet(userId, reason) {
    try {
      const wallet = await this.getOrCreateWallet(userId);
      wallet.freeze(reason);
      await wallet.save();

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
  async unfreezeWallet(userId) {
    try {
      const wallet = await this.getOrCreateWallet(userId);
      wallet.unfreeze();
      await wallet.save();

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
   * Used after order creation to link the payment transaction
   */
  async updateTransactionOrderId(userId, orderId, session) {
    try {
      // Use findOneAndUpdate with atomic operation to avoid version conflicts
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
      // Don't throw - this is not critical
    }
  }

  /**
   * 💵 Process Refund
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
      const wallet = await this.getOrCreateWallet(userId);

      if (!wallet.isActive) {
        throw new Error("Wallet is not active");
      }

      if (wallet.isFrozen) {
        throw new Error(
          `Wallet is frozen. Reason: ${wallet.frozenReason || "N/A"}`
        );
      }

      // Add refund amount
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
      });

      await wallet.save({ session: localSession });

      // 🆕 LOG REFUND
      const user = await User.findById(userId);
      await logger.logWallet({
        type: "refund_processed",
        action: `Refund processed: $${amount}`,
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

      if (shouldCommit) {
        await localSession.commitTransaction();
      }

      console.log(
        `✅ Refunded $${amount} to wallet. New balance: $${wallet.balance}`
      );

      return {
        success: true,
        newBalance: wallet.balance,
        refundAmount: amount,
        message: "Refund processed successfully",
      };
    } catch (error) {
      if (shouldCommit) {
        await localSession.abortTransaction();
      }

      // 🆕 LOG FAILED REFUND
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
}

export default new WalletBalanceService();
