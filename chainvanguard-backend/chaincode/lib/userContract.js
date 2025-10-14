// chainvanguard-backend/chaincode/lib/userContract.js
"use strict";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Contract } = require("fabric-contract-api");
class UserContract extends Contract {
  /**
   * Initialize the ledger with default data
   */
  async initLedger(ctx) {
    console.info("============= START : Initialize Ledger ===========");

    // Get deterministic timestamp
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(
      txTimestamp.seconds.toInt() * 1000
    ).toISOString();

    const users = [
      {
        userId: "admin@org1",
        name: "Admin User",
        email: "admin@org1.example.com",
        role: "bdlt-expert",
        organizationMSP: "Org1MSP",
        walletAddress: "0x0000000000000000000000000000000000000000",
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ];

    for (let i = 0; i < users.length; i++) {
      users[i].docType = "user";
      await ctx.stub.putState(
        users[i].userId,
        Buffer.from(JSON.stringify(users[i]))
      );
      console.info("Added user:", users[i]);
    }

    console.info("============= END : Initialize Ledger ===========");
  }

  /**
   * Register a new user on the blockchain
   * @param {Context} ctx - Transaction context
   * @param {string} userId - Unique user identifier (wallet address)
   * @param {string} name - User's full name
   * @param {string} email - User's email
   * @param {string} role - User role (supplier, vendor, customer, bdlt-expert)
   * @param {string} organizationMSP - Organization MSP ID
   * @param {string} walletAddress - User's wallet address
   * @param {string} companyName - Company name (optional)
   * @param {string} businessAddress - Business address (optional)
   * @param {string} businessType - Type of business (optional)
   */
  async registerUser(
    ctx,
    userId,
    name,
    email,
    role,
    organizationMSP,
    walletAddress,
    companyName,
    businessAddress,
    businessType
  ) {
    console.info("============= START : Register User ===========");

    // Check if user already exists
    const userExists = await this.userExists(ctx, userId);
    if (userExists) {
      throw new Error(`User ${userId} already exists on the blockchain`);
    }

    // Validate role
    const validRoles = ["supplier", "vendor", "customer", "bdlt-expert"];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role: ${role}`);
    }

    // Get deterministic timestamp from transaction
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(
      txTimestamp.seconds.toInt() * 1000
    ).toISOString();

    // Create user object
    const user = {
      docType: "user",
      userId: userId,
      name: name,
      email: email,
      role: role,
      organizationMSP: organizationMSP,
      walletAddress: walletAddress,
      companyName: companyName || "",
      businessAddress: businessAddress || "",
      businessType: businessType || "",
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
      transactionCount: 0,
      lastLoginAt: null,
    };

    // Store user on ledger
    await ctx.stub.putState(userId, Buffer.from(JSON.stringify(user)));

    // Emit event
    ctx.stub.setEvent(
      "UserRegistered",
      Buffer.from(
        JSON.stringify({
          userId: userId,
          name: name,
          role: role,
          timestamp: timestamp,
        })
      )
    );

    console.info("============= END : Register User ===========");
    return JSON.stringify(user);
  }

  /**
   * Get user details
   * @param {Context} ctx
   * @param {string} userId
   */
  async getUser(ctx, userId) {
    const userAsBytes = await ctx.stub.getState(userId);

    if (!userAsBytes || userAsBytes.length === 0) {
      throw new Error(`User ${userId} does not exist`);
    }

    return userAsBytes.toString();
  }

  /**
   * Check if user exists
   * @param {Context} ctx
   * @param {string} userId
   */
  async userExists(ctx, userId) {
    const userAsBytes = await ctx.stub.getState(userId);
    return userAsBytes && userAsBytes.length > 0;
  }

  /**
   * Update user profile
   * @param {Context} ctx
   * @param {string} userId
   * @param {string} name
   * @param {string} email
   * @param {string} companyName
   * @param {string} businessAddress
   */
  async updateUser(ctx, userId, name, email, companyName, businessAddress) {
    console.info("============= START : Update User ===========");

    const userAsBytes = await ctx.stub.getState(userId);
    if (!userAsBytes || userAsBytes.length === 0) {
      throw new Error(`User ${userId} does not exist`);
    }

    const user = JSON.parse(userAsBytes.toString());

    // Get deterministic timestamp
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(
      txTimestamp.seconds.toInt() * 1000
    ).toISOString();

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (companyName) user.companyName = companyName;
    if (businessAddress) user.businessAddress = businessAddress;
    user.updatedAt = timestamp;

    await ctx.stub.putState(userId, Buffer.from(JSON.stringify(user)));

    // Emit event
    ctx.stub.setEvent(
      "UserUpdated",
      Buffer.from(
        JSON.stringify({
          userId: userId,
          timestamp: timestamp,
        })
      )
    );

    console.info("============= END : Update User ===========");
    return JSON.stringify(user);
  }

  /**
   * Update user's last login timestamp
   * @param {Context} ctx
   * @param {string} userId
   */
  async recordLogin(ctx, userId) {
    const userAsBytes = await ctx.stub.getState(userId);
    if (!userAsBytes || userAsBytes.length === 0) {
      throw new Error(`User ${userId} does not exist`);
    }

    const user = JSON.parse(userAsBytes.toString());

    // Get deterministic timestamp
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(
      txTimestamp.seconds.toInt() * 1000
    ).toISOString();

    user.lastLoginAt = timestamp;
    user.updatedAt = timestamp;

    await ctx.stub.putState(userId, Buffer.from(JSON.stringify(user)));
    return JSON.stringify(user);
  }

  /**
   * Deactivate user
   * @param {Context} ctx
   * @param {string} userId
   */
  async deactivateUser(ctx, userId) {
    console.info("============= START : Deactivate User ===========");

    const userAsBytes = await ctx.stub.getState(userId);
    if (!userAsBytes || userAsBytes.length === 0) {
      throw new Error(`User ${userId} does not exist`);
    }

    const user = JSON.parse(userAsBytes.toString());
    user.isActive = false;
    user.updatedAt = new Date().toISOString();

    await ctx.stub.putState(userId, Buffer.from(JSON.stringify(user)));

    console.info("============= END : Deactivate User ===========");
    return JSON.stringify(user);
  }

  /**
   * Get all users (admin only)
   * @param {Context} ctx
   */
  async getAllUsers(ctx) {
    const startKey = "";
    const endKey = "";
    const allResults = [];

    const iterator = await ctx.stub.getStateByRange(startKey, endKey);
    let result = await iterator.next();

    while (!result.done) {
      const strValue = Buffer.from(result.value.value.toString()).toString(
        "utf8"
      );
      let record;
      try {
        record = JSON.parse(strValue);
        if (record.docType === "user") {
          allResults.push(record);
        }
      } catch (err) {
        console.log(err);
      }
      result = await iterator.next();
    }

    await iterator.close();
    return JSON.stringify(allResults);
  }

  /**
   * Get users by role
   * @param {Context} ctx
   * @param {string} role
   */
  async getUsersByRole(ctx, role) {
    const queryString = {
      selector: {
        docType: "user",
        role: role,
      },
    };

    const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
    const allResults = [];
    let result = await iterator.next();

    while (!result.done) {
      const strValue = Buffer.from(result.value.value.toString()).toString(
        "utf8"
      );
      let record;
      try {
        record = JSON.parse(strValue);
        allResults.push(record);
      } catch (err) {
        console.log(err);
      }
      result = await iterator.next();
    }

    await iterator.close();
    return JSON.stringify(allResults);
  }

  /**
   * Get user statistics
   * @param {Context} ctx
   */
  async getUserStats(ctx) {
    const allUsers = JSON.parse(await this.getAllUsers(ctx));

    const stats = {
      totalUsers: allUsers.length,
      activeUsers: allUsers.filter((u) => u.isActive).length,
      suppliers: allUsers.filter((u) => u.role === "supplier").length,
      vendors: allUsers.filter((u) => u.role === "vendor").length,
      customers: allUsers.filter((u) => u.role === "customer").length,
      experts: allUsers.filter((u) => u.role === "bdlt-expert").length,
      timestamp: new Date().toISOString(),
    };

    return JSON.stringify(stats);
  }

  /**
   * Increment user's transaction count
   * @param {Context} ctx
   * @param {string} userId
   */
  async incrementTransactionCount(ctx, userId) {
    const userAsBytes = await ctx.stub.getState(userId);
    if (!userAsBytes || userAsBytes.length === 0) {
      throw new Error(`User ${userId} does not exist`);
    }

    const user = JSON.parse(userAsBytes.toString());
    user.transactionCount = (user.transactionCount || 0) + 1;
    user.updatedAt = new Date().toISOString();

    await ctx.stub.putState(userId, Buffer.from(JSON.stringify(user)));
    return JSON.stringify(user);
  }

  /**
   * Query user history
   * @param {Context} ctx
   * @param {string} userId
   */
  async getUserHistory(ctx, userId) {
    console.info("============= START : Get User History ===========");

    const iterator = await ctx.stub.getHistoryForKey(userId);
    const allResults = [];
    let result = await iterator.next();

    while (!result.done) {
      const strValue = Buffer.from(result.value.value.toString()).toString(
        "utf8"
      );
      const record = {
        txId: result.value.txId,
        timestamp: result.value.timestamp,
        isDelete: result.value.isDelete,
        value: strValue,
      };
      allResults.push(record);
      result = await iterator.next();
    }

    await iterator.close();
    console.info("============= END : Get User History ===========");
    return JSON.stringify(allResults);
  }
}

module.exports = UserContract;
