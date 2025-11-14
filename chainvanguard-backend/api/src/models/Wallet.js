import mongoose from "mongoose";

const WalletTransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      "deposit",
      "withdrawal",
      "transfer_in",
      "transfer_out",
      "payment",
      "refund",
      "sale", // ✅ ADD THIS
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
  relatedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  relatedOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
  },
  description: String,
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "cancelled"],
    default: "completed",
  },
  transactionHash: String, // Blockchain transaction hash
  metadata: mongoose.Schema.Types.Mixed,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

const WalletSchema = new mongoose.Schema(
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
      index: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
    },
    currency: {
      type: String,
      default: "PKR",
      enum: ["PKR", "USD", "EUR"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFrozen: {
      type: Boolean,
      default: false,
    },
    frozenReason: String,
    frozenAt: Date,

    transactions: [WalletTransactionSchema],

    // Security & Limits
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    dailyWithdrawalLimit: {
      type: Number,
      default: 10000,
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
  },
  {
    timestamps: true,
  }
);

// Indexes
WalletSchema.index({ userId: 1, isActive: 1 });
WalletSchema.index({ walletAddress: 1 });
WalletSchema.index({ "transactions.timestamp": -1 });

// Virtual for available balance
WalletSchema.virtual("availableBalance").get(function () {
  return this.balance;
});

// Method to add transaction
WalletSchema.methods.addTransaction = function (transactionData) {
  const transaction = {
    ...transactionData,
    balanceBefore: this.balance,
    balanceAfter:
      this.balance +
      (["deposit", "transfer_in", "refund"].includes(transactionData.type)
        ? transactionData.amount
        : -transactionData.amount),
    timestamp: new Date(),
  };

  this.transactions.push(transaction);
  return transaction;
};

// Method to update balance
WalletSchema.methods.updateBalance = function (amount, type) {
  const balanceBefore = this.balance;

  switch (type) {
    case "deposit":
    case "transfer_in":
    case "refund":
    case "sale": // ✅ ADD THIS
      this.balance += amount;
      if (type === "deposit") this.totalDeposited += amount;
      if (type === "refund") this.totalReceived += amount;
      if (type === "sale") this.totalReceived += amount;
      break;

    case "withdrawal":
    case "transfer_out":
    case "payment":
      this.balance -= amount;
      if (type === "withdrawal") this.totalWithdrawn += amount;
      if (type === "payment") this.totalSpent += amount;
      break;

    default:
      throw new Error(`Unknown transaction type: ${type}`);
  }

  this.lastActivity = new Date();
  const balanceAfter = this.balance;

  return { balanceBefore, balanceAfter };
};

// Method to check if withdrawal is allowed
WalletSchema.methods.canWithdraw = function (amount) {
  // Reset daily limit if 24 hours passed
  const now = new Date();
  const lastReset = new Date(this.lastWithdrawalReset);
  const hoursDiff = (now - lastReset) / (1000 * 60 * 60);

  if (hoursDiff >= 24) {
    this.dailyWithdrawn = 0;
    this.lastWithdrawalReset = now;
  }

  return (
    this.isActive &&
    !this.isFrozen &&
    this.balance >= amount &&
    this.dailyWithdrawn + amount <= this.dailyWithdrawalLimit
  );
};

// Method to freeze wallet
WalletSchema.methods.freeze = function (reason) {
  this.isFrozen = true;
  this.frozenReason = reason;
  this.frozenAt = new Date();
};

// Method to unfreeze wallet
WalletSchema.methods.unfreeze = function () {
  this.isFrozen = false;
  this.frozenReason = null;
  this.frozenAt = null;
};

export default mongoose.model("Wallet", WalletSchema);
