"use strict";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Contract } = require("fabric-contract-api");

class TokenContract extends Contract {
  constructor() {
    super("TokenContract");
  }

  // ========================================
  // HELPER FUNCTIONS
  // ========================================

  /**
   * Get deterministic timestamp from transaction
   * This ensures all peers get the same timestamp
   */
  _getTimestamp(ctx) {
    const timestamp = ctx.stub.getTxTimestamp();
    const milliseconds =
      timestamp.seconds.low * 1000 +
      Math.floor(timestamp.nanos / 1000000);
    return new Date(milliseconds).toISOString();
  }

  // ========================================
  // INITIALIZATION
  // ========================================

  /**
   * Initialize token system
   */
  async initLedger(ctx) {
    console.info("============= START : Initialize Token Ledger ===========");

    const tokenInfo = {
      name: "ChainVanguard Token",
      symbol: "CVT",
      decimals: 2,
      totalSupply: 0,
      creator: ctx.clientIdentity.getID(),
      createdAt: this._getTimestamp(ctx),
    };

    await ctx.stub.putState(
      "TOKEN_INFO",
      Buffer.from(JSON.stringify(tokenInfo))
    );

    console.info("Token initialized:", tokenInfo);
    console.info("============= END : Initialize Token Ledger ===========");

    return JSON.stringify({
      success: true,
      message: "Token initialized successfully",
      ...tokenInfo,
    });
  }

  // ========================================
  // ACCOUNT MANAGEMENT
  // ========================================

  /**
   * Create new token account
   */
  async createAccount(ctx, userId, walletAddress, initialBalance) {
    console.info(
      `============= START : Create Token Account ${userId} ===========`
    );

    const accountKey = `ACCOUNT_${userId}`;

    // Check if account exists
    const exists = await ctx.stub.getState(accountKey);
    if (exists && exists.length > 0) {
      throw new Error(`Account already exists for user: ${userId}`);
    }

    const balance = parseFloat(initialBalance) || 0;

    const timestamp = this._getTimestamp(ctx);
    const account = {
      userId,
      walletAddress,
      balance,
      createdAt: timestamp,
      updatedAt: timestamp,
      txCount: 0,
    };

    await ctx.stub.putState(accountKey, Buffer.from(JSON.stringify(account)));

    // Update total supply if initial balance > 0
    if (balance > 0) {
      await this._updateTotalSupply(ctx, balance);
    }

    console.info("Account created:", account);
    console.info("============= END : Create Token Account ===========");

    return JSON.stringify({
      success: true,
      account,
      message: `Account created with ${balance} CVT`,
    });
  }

  /**
   * Get account balance
   */
  async balanceOf(ctx, userId) {
    const accountKey = `ACCOUNT_${userId}`;
    const accountBytes = await ctx.stub.getState(accountKey);

    if (!accountBytes || accountBytes.length === 0) {
      return JSON.stringify({
        success: true,
        balance: 0,
        exists: false,
      });
    }

    const account = JSON.parse(accountBytes.toString());

    return JSON.stringify({
      success: true,
      balance: account.balance,
      walletAddress: account.walletAddress,
      exists: true,
    });
  }

  /**
   * Get full account info
   */
  async getAccount(ctx, userId) {
    const accountKey = `ACCOUNT_${userId}`;
    const accountBytes = await ctx.stub.getState(accountKey);

    if (!accountBytes || accountBytes.length === 0) {
      throw new Error(`Account not found: ${userId}`);
    }

    const account = JSON.parse(accountBytes.toString());

    return JSON.stringify({
      success: true,
      account,
    });
  }

  // ========================================
  // TRANSFER OPERATIONS
  // ========================================

  /**
   * Transfer tokens between accounts
   */
  async transfer(ctx, fromUserId, toUserId, amount, description) {
    console.info(
      `============= START : Transfer ${amount} CVT from ${fromUserId} to ${toUserId} ===========`
    );

    const transferAmount = parseFloat(amount);

    if (transferAmount <= 0) {
      throw new Error("Transfer amount must be greater than 0");
    }

    if (fromUserId === toUserId) {
      throw new Error("Cannot transfer to yourself");
    }

    // Get sender account
    const fromKey = `ACCOUNT_${fromUserId}`;
    const fromBytes = await ctx.stub.getState(fromKey);
    if (!fromBytes || fromBytes.length === 0) {
      throw new Error(`Sender account not found: ${fromUserId}`);
    }
    const fromAccount = JSON.parse(fromBytes.toString());

    // Check balance
    if (fromAccount.balance < transferAmount) {
      throw new Error(
        `Insufficient balance. Available: ${fromAccount.balance} CVT, Required: ${transferAmount} CVT`
      );
    }

    // Get recipient account
    const toKey = `ACCOUNT_${toUserId}`;
    const toBytes = await ctx.stub.getState(toKey);
    if (!toBytes || toBytes.length === 0) {
      throw new Error(`Recipient account not found: ${toUserId}`);
    }
    const toAccount = JSON.parse(toBytes.toString());

    // Perform transfer
    const fromBalanceBefore = fromAccount.balance;
    const toBalanceBefore = toAccount.balance;
    const timestamp = this._getTimestamp(ctx);

    fromAccount.balance -= transferAmount;
    fromAccount.updatedAt = timestamp;
    fromAccount.txCount += 1;

    toAccount.balance += transferAmount;
    toAccount.updatedAt = timestamp;
    toAccount.txCount += 1;

    // Save updated accounts
    await ctx.stub.putState(fromKey, Buffer.from(JSON.stringify(fromAccount)));
    await ctx.stub.putState(toKey, Buffer.from(JSON.stringify(toAccount)));

    // Create transfer record
    const txId = ctx.stub.getTxID();

    const transfer = {
      txId,
      type: "transfer",
      from: {
        userId: fromUserId,
        walletAddress: fromAccount.walletAddress,
        balanceBefore: fromBalanceBefore,
        balanceAfter: fromAccount.balance,
      },
      to: {
        userId: toUserId,
        walletAddress: toAccount.walletAddress,
        balanceBefore: toBalanceBefore,
        balanceAfter: toAccount.balance,
      },
      amount: transferAmount,
      description: description || "Token transfer",
      timestamp,
      blockNumber: ctx.stub.getTxTimestamp().seconds.low,
    };

    const transferKey = `TX_${txId}`;
    await ctx.stub.putState(transferKey, Buffer.from(JSON.stringify(transfer)));

    console.info("Transfer completed:", transfer);
    console.info("============= END : Transfer ===========");

    return JSON.stringify({
      success: true,
      transfer,
      message: `Successfully transferred ${transferAmount} CVT`,
    });
  }

  // ========================================
  // MINT & BURN (ADMIN OPERATIONS)
  // ========================================

  /**
   * Mint new tokens (increase supply)
   */
  async mint(ctx, userId, amount, reason) {
    console.info(
      `============= START : Mint ${amount} CVT to ${userId} ===========`
    );

    const mintAmount = parseFloat(amount);

    if (mintAmount <= 0) {
      throw new Error("Mint amount must be greater than 0");
    }

    const accountKey = `ACCOUNT_${userId}`;
    const accountBytes = await ctx.stub.getState(accountKey);

    if (!accountBytes || accountBytes.length === 0) {
      throw new Error(`Account not found: ${userId}`);
    }

    const account = JSON.parse(accountBytes.toString());
    const balanceBefore = account.balance;
    const timestamp = this._getTimestamp(ctx);

    account.balance += mintAmount;
    account.updatedAt = timestamp;
    account.txCount += 1;

    await ctx.stub.putState(accountKey, Buffer.from(JSON.stringify(account)));
    await this._updateTotalSupply(ctx, mintAmount);

    // Create mint record
    const txId = ctx.stub.getTxID();
    const mintRecord = {
      txId,
      type: "mint",
      userId,
      walletAddress: account.walletAddress,
      amount: mintAmount,
      balanceBefore,
      balanceAfter: account.balance,
      reason: reason || "Token minting",
      timestamp,
      minter: ctx.clientIdentity.getID(),
    };

    const recordKey = `TX_${txId}`;
    await ctx.stub.putState(recordKey, Buffer.from(JSON.stringify(mintRecord)));

    console.info("Tokens minted:", mintRecord);
    console.info("============= END : Mint ===========");

    return JSON.stringify({
      success: true,
      mintRecord,
      message: `Successfully minted ${mintAmount} CVT`,
    });
  }

  /**
   * Burn tokens (decrease supply)
   */
  async burn(ctx, userId, amount, reason) {
    console.info(
      `============= START : Burn ${amount} CVT from ${userId} ===========`
    );

    const burnAmount = parseFloat(amount);

    if (burnAmount <= 0) {
      throw new Error("Burn amount must be greater than 0");
    }

    const accountKey = `ACCOUNT_${userId}`;
    const accountBytes = await ctx.stub.getState(accountKey);

    if (!accountBytes || accountBytes.length === 0) {
      throw new Error(`Account not found: ${userId}`);
    }

    const account = JSON.parse(accountBytes.toString());

    if (account.balance < burnAmount) {
      throw new Error(
        `Insufficient balance to burn. Available: ${account.balance} CVT, Required: ${burnAmount} CVT`
      );
    }

    const balanceBefore = account.balance;
    const timestamp = this._getTimestamp(ctx);

    account.balance -= burnAmount;
    account.updatedAt = timestamp;
    account.txCount += 1;

    await ctx.stub.putState(accountKey, Buffer.from(JSON.stringify(account)));
    await this._updateTotalSupply(ctx, -burnAmount);

    // Create burn record
    const txId = ctx.stub.getTxID();
    const burnRecord = {
      txId,
      type: "burn",
      userId,
      walletAddress: account.walletAddress,
      amount: burnAmount,
      balanceBefore,
      balanceAfter: account.balance,
      reason: reason || "Token burning",
      timestamp,
      burner: ctx.clientIdentity.getID(),
    };

    const recordKey = `TX_${txId}`;
    await ctx.stub.putState(recordKey, Buffer.from(JSON.stringify(burnRecord)));

    console.info("Tokens burned:", burnRecord);
    console.info("============= END : Burn ===========");

    return JSON.stringify({
      success: true,
      burnRecord,
      message: `Successfully burned ${burnAmount} CVT`,
    });
  }

  // ========================================
  // QUERY OPERATIONS
  // ========================================

  /**
   * Get token information
   */
  async getTokenInfo(ctx) {
    const infoBytes = await ctx.stub.getState("TOKEN_INFO");

    if (!infoBytes || infoBytes.length === 0) {
      throw new Error("Token not initialized");
    }

    const info = JSON.parse(infoBytes.toString());
    return JSON.stringify({ success: true, tokenInfo: info });
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(ctx, txId) {
    const txKey = `TX_${txId}`;
    const txBytes = await ctx.stub.getState(txKey);

    if (!txBytes || txBytes.length === 0) {
      throw new Error(`Transaction not found: ${txId}`);
    }

    const transaction = JSON.parse(txBytes.toString());
    return JSON.stringify({ success: true, transaction });
  }

  /**
   * Get account transaction history
   */
  async getAccountHistory(ctx, userId) {
    console.info(`Getting transaction history for ${userId}`);

    const iterator = await ctx.stub.getStateByRange("", "");
    const transactions = [];

    try {
      while (true) {
        const result = await iterator.next();

        if (result.value && result.value.value.toString()) {
          const key = result.value.key;

          // Only process transaction records
          if (key.startsWith("TX_")) {
            const tx = JSON.parse(result.value.value.toString());

            // Include if user is sender or receiver
            if (
              (tx.from && tx.from.userId === userId) ||
              (tx.to && tx.to.userId === userId) ||
              tx.userId === userId
            ) {
              transactions.push(tx);
            }
          }
        }

        if (result.done) {
          await iterator.close();
          break;
        }
      }
    } catch (error) {
      await iterator.close();
      throw error;
    }

    // Sort by timestamp descending
    transactions.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return JSON.stringify({
      success: true,
      transactions,
      count: transactions.length,
    });
  }

  // ========================================
  // INTERNAL HELPERS
  // ========================================

  /**
   * Update total token supply
   */
  async _updateTotalSupply(ctx, change) {
    const infoBytes = await ctx.stub.getState("TOKEN_INFO");

    let info;
    if (!infoBytes || infoBytes.length === 0) {
      // Initialize TOKEN_INFO if it doesn't exist
      info = {
        name: "ChainVanguard Token",
        symbol: "CVT",
        decimals: 2,
        totalSupply: 0,
        creator: ctx.clientIdentity.getID(),
        createdAt: this._getTimestamp(ctx),
      };
    } else {
      info = JSON.parse(infoBytes.toString());
    }

    info.totalSupply += change;
    info.updatedAt = this._getTimestamp(ctx);

    await ctx.stub.putState("TOKEN_INFO", Buffer.from(JSON.stringify(info)));

    console.info(
      `Total supply updated: ${info.totalSupply} CVT (change: ${change >= 0 ? "+" : ""}${change})`
    );
  }
}

module.exports = TokenContract;
