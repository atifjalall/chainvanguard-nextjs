// chainvanguard-backend/api/src/models/Wallet.js
import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "deposit",
        "withdrawal",
        "transfer_in",
        "transfer_out",
        "payment",
        "refund",
        "sale",
        "reward",
        "penalty",
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    relatedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    relatedOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled"],
      default: "completed",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    // ✅ NEW FIELD - Blockchain balance cache
    blockchainBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    // ✅ NEW FIELD - Last sync timestamp
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
    currency: {
      type: String,
      default: "CVT", // ✅ CHANGED FROM PKR TO CVT
      enum: ["CVT"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFrozen: {
      type: Boolean,
      default: false,
    },
    frozenReason: {
      type: String,
      default: "",
    },
    frozenAt: {
      type: Date,
    },
    frozenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Transaction limits
    dailyWithdrawalLimit: {
      type: Number,
      default: 100000, // ~$360 USD (with 1 USD = 278 CVT conversion rate)
    },
    dailyWithdrawn: {
      type: Number,
      default: 0,
    },
    lastWithdrawalReset: {
      type: Date,
      default: Date.now,
    },
    // Statistics
    totalDeposited: {
      type: Number,
      default: 0,
    },
    totalWithdrawn: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    totalReceived: {
      type: Number,
      default: 0,
    },
    // Transaction history
    transactions: [transactionSchema],
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// ========================================
// INDEXES
// ========================================

walletSchema.index({ userId: 1 });
walletSchema.index({ walletAddress: 1 });
walletSchema.index({ isActive: 1 });
walletSchema.index({ isFrozen: 1 });
walletSchema.index({ "transactions.timestamp": -1 });
walletSchema.index({ lastSyncedAt: -1 }); // ✅ NEW INDEX

// ========================================
// METHODS
// ========================================

/**
 * Update wallet balance and statistics
 */
walletSchema.methods.updateBalance = function (amount, type) {
  const balanceBefore = this.balance;

  switch (type) {
    case "deposit":
    case "transfer_in":
    case "refund":
    case "sale":
    case "reward":
      this.balance += amount;
      this.totalReceived += amount;
      if (type === "deposit") this.totalDeposited += amount;
      break;

    case "withdrawal":
    case "transfer_out":
    case "payment":
    case "penalty":
      this.balance -= amount;
      if (type === "withdrawal") this.totalWithdrawn += amount;
      if (type === "payment") this.totalSpent += amount;
      break;

    default:
      throw new Error(`Unknown transaction type: ${type}`);
  }

  // ✅ UPDATE BLOCKCHAIN BALANCE CACHE
  this.blockchainBalance = this.balance;
  this.lastActivity = new Date();

  return {
    balanceBefore,
    balanceAfter: this.balance,
  };
};

/**
 * Add transaction record
 */
walletSchema.methods.addTransaction = function (transactionData) {
  const transaction = {
    ...transactionData,
    timestamp: transactionData.timestamp || new Date(),
  };

  this.transactions.push(transaction);
  this.lastActivity = new Date();

  return transaction;
};

/**
 * Check if withdrawal is allowed
 */
walletSchema.methods.canWithdraw = function (amount) {
  // Check if wallet is frozen
  if (this.isFrozen) {
    return false;
  }

  // Check if wallet is active
  if (!this.isActive) {
    return false;
  }

  // Check balance
  if (this.balance < amount) {
    return false;
  }

  // Reset daily withdrawal counter if needed
  const today = new Date();
  const lastReset = new Date(this.lastWithdrawalReset);

  if (
    today.getDate() !== lastReset.getDate() ||
    today.getMonth() !== lastReset.getMonth() ||
    today.getFullYear() !== lastReset.getFullYear()
  ) {
    this.dailyWithdrawn = 0;
    this.lastWithdrawalReset = today;
  }

  // Check daily limit
  if (this.dailyWithdrawn + amount > this.dailyWithdrawalLimit) {
    return false;
  }

  return true;
};

/**
 * Freeze wallet
 */
walletSchema.methods.freeze = function (reason, frozenBy) {
  this.isFrozen = true;
  this.frozenReason = reason;
  this.frozenAt = new Date();
  if (frozenBy) {
    this.frozenBy = frozenBy;
  }
};

/**
 * Unfreeze wallet
 */
walletSchema.methods.unfreeze = function () {
  this.isFrozen = false;
  this.frozenReason = "";
  this.frozenAt = null;
  this.frozenBy = null;
};

/**
 * ✅ NEW METHOD - Check if sync is needed
 */
walletSchema.methods.needsSync = function () {
  if (!this.lastSyncedAt) return true;

  const minutesSinceSync =
    (Date.now() - this.lastSyncedAt.getTime()) / 1000 / 60;

  // Sync if more than 5 minutes old
  return minutesSinceSync > 5;
};

/**
 * ✅ NEW METHOD - Mark as synced with blockchain
 */
walletSchema.methods.markSynced = function (blockchainBalance) {
  this.blockchainBalance = blockchainBalance;
  this.balance = blockchainBalance;
  this.lastSyncedAt = new Date();
};

// ========================================
// VIRTUALS
// ========================================

walletSchema.virtual("formattedBalance").get(function () {
  return `${this.balance.toFixed(2)} CVT`; // ✅ CHANGED TO CVT
});

walletSchema.virtual("availableBalance").get(function () {
  return this.balance;
});

walletSchema.virtual("dailyWithdrawalRemaining").get(function () {
  return Math.max(0, this.dailyWithdrawalLimit - this.dailyWithdrawn);
});

// ========================================
// PRE-SAVE HOOKS
// ========================================

walletSchema.pre("save", function (next) {
  // Ensure balance is never negative
  if (this.balance < 0) {
    this.balance = 0;
  }

  // ✅ ENSURE BLOCKCHAIN BALANCE CACHE IS IN SYNC
  if (!this.blockchainBalance || this.blockchainBalance !== this.balance) {
    this.blockchainBalance = this.balance;
  }

  next();
});

// ========================================
// STATICS
// ========================================

/**
 * Get wallet statistics
 */
walletSchema.statics.getStatistics = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalWallets: { $sum: 1 },
        activeWallets: {
          $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
        },
        frozenWallets: {
          $sum: { $cond: [{ $eq: ["$isFrozen", true] }, 1, 0] },
        },
        totalBalance: { $sum: "$balance" },
        totalDeposited: { $sum: "$totalDeposited" },
        totalWithdrawn: { $sum: "$totalWithdrawn" },
        totalSpent: { $sum: "$totalSpent" },
        totalReceived: { $sum: "$totalReceived" },
      },
    },
  ]);

  return stats[0] || {};
};

/**
 * ✅ NEW STATIC - Get wallets that need sync
 */
walletSchema.statics.getWalletsNeedingSync = async function (minutesOld = 5) {
  const syncThreshold = new Date(Date.now() - minutesOld * 60 * 1000);

  return this.find({
    isActive: true,
    isFrozen: false,
    $or: [
      { lastSyncedAt: { $exists: false } },
      { lastSyncedAt: { $lt: syncThreshold } },
    ],
  }).limit(100);
};

/**
 * Find wallet by user ID or wallet address
 */
walletSchema.statics.findByUserOrAddress = async function (userIdOrAddress) {
  const isObjectId = mongoose.Types.ObjectId.isValid(userIdOrAddress);

  if (isObjectId) {
    return this.findOne({ userId: userIdOrAddress });
  } else {
    return this.findOne({ walletAddress: userIdOrAddress });
  }
};

// ========================================
// JSON TRANSFORM
// ========================================

walletSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const Wallet = mongoose.model("Wallet", walletSchema);

export default Wallet;
