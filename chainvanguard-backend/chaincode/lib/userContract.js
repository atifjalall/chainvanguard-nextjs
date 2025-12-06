// chainvanguard-backend/chaincode/lib/userContract.js
"use strict";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Contract } = require("fabric-contract-api");

/**
 * UserContract - Event-Based User Management
 *
 * This contract uses event-sourcing pattern where only immutable events are stored.
 * MongoDB stores current state, blockchain stores event history.
 *
 * Events Stored:
 * - USER_REGISTERED: User registration with immutable identity data
 * - ROLE_CHANGED: Role change events (rare)
 * - KYC_VERIFIED: KYC verification events
 * - USER_DEACTIVATED: Account deactivation
 * - USER_REACTIVATED: Account reactivation
 */
class UserContract extends Contract {

  // ========================================
  // INITIALIZATION
  // ========================================

  /**
   * Initialize the ledger with default data
   */
  async initLedger(ctx) {
    console.info("============= START : Initialize Ledger ===========");

    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(
      txTimestamp.seconds.toInt() * 1000
    ).toISOString();

    // Initialize with admin registration event
    const adminEvent = {
      docType: "event",
      eventType: "USER_REGISTERED",
      eventId: `admin@org1_REGISTERED_${Date.now()}`,
      userId: "admin@org1",
      walletAddress: "0x0000000000000000000000000000000000000000",
      role: "expert",
      organizationMSP: "Org1MSP",
      timestamp: timestamp,
      txId: ctx.stub.getTxID(),
    };

    await ctx.stub.putState(
      adminEvent.eventId,
      Buffer.from(JSON.stringify(adminEvent))
    );

    console.info("Admin user registration event recorded");
    console.info("============= END : Initialize Ledger ===========");
  }

  // ========================================
  // USER REGISTRATION EVENT
  // ========================================

  /**
   * Record user registration event (IMMUTABLE)
   *
   * Stores only:
   * - userId (MongoDB ID)
   * - walletAddress (never changes)
   * - role (rarely changes)
   * - registeredAt timestamp
   *
   * Does NOT store:
   * - email (can change)
   * - phone (can change)
   * - name (can change)
   * - address (can change)
   *
   * @param {Context} ctx - Transaction context
   * @param {string} eventDataJSON - Registration event data
   * @returns {string} Registration event
   */
  async recordUserRegistration(ctx, eventDataJSON) {
    console.info("============= START : Record User Registration ===========");

    let eventData;
    try {
      eventData = JSON.parse(eventDataJSON);
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }

    // Validate required fields
    if (!eventData.userId) {
      throw new Error("userId is required");
    }
    if (!eventData.walletAddress) {
      throw new Error("walletAddress is required");
    }
    if (!eventData.role) {
      throw new Error("role is required");
    }

    // Validate role
    const validRoles = ["supplier", "vendor", "customer", "expert"];
    if (!validRoles.includes(eventData.role)) {
      throw new Error(
        `Invalid role: ${eventData.role}. Valid roles are: ${validRoles.join(", ")}`
      );
    }

    // Get deterministic timestamp
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(
      txTimestamp.seconds.toInt() * 1000
    ).toISOString();
    const txId = ctx.stub.getTxID();

    // Create registration event (IMMUTABLE)
    const registrationEvent = {
      docType: "event",
      eventType: "USER_REGISTERED",
      eventId: `${eventData.userId}_REGISTERED_${txTimestamp.seconds.toInt()}`,

      // Immutable identity data only
      userId: eventData.userId,
      walletAddress: eventData.walletAddress,
      role: eventData.role,

      // IPFS CIDs for disaster recovery
      userDataCID: eventData.userDataCID || null, // User data stored on IPFS
      kycHash: eventData.kycHash || null, // KYC documents stored on IPFS

      // Blockchain metadata
      timestamp: timestamp,
      txId: txId,
      registeredAt: eventData.registeredAt || timestamp,
    };

    // Check if user already registered (duplicate prevention)
    const existingRegistration = await this.getUserRegistrationEvent(ctx, eventData.userId);
    if (existingRegistration) {
      throw new Error(`User ${eventData.userId} already registered on blockchain`);
    }

    // Store registration event on ledger
    await ctx.stub.putState(
      registrationEvent.eventId,
      Buffer.from(JSON.stringify(registrationEvent))
    );

    // Emit event for external listeners
    ctx.stub.setEvent(
      "UserRegistered",
      Buffer.from(
        JSON.stringify({
          userId: eventData.userId,
          walletAddress: eventData.walletAddress,
          role: eventData.role,
          timestamp: timestamp,
        })
      )
    );

    console.info(`✅ User registration event recorded: ${eventData.userId} (${eventData.role})`);
    console.info("============= END : Record User Registration ===========");

    return JSON.stringify(registrationEvent);
  }

  // ========================================
  // ROLE CHANGE EVENT
  // ========================================

  /**
   * Record role change event (RARE)
   *
   * @param {Context} ctx - Transaction context
   * @param {string} eventDataJSON - Role change event data
   * @returns {string} Role change event
   */
  async recordRoleChange(ctx, eventDataJSON) {
    console.info("============= START : Record Role Change ===========");

    let eventData;
    try {
      eventData = JSON.parse(eventDataJSON);
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }

    // Validate required fields
    if (!eventData.userId) {
      throw new Error("userId is required");
    }
    if (!eventData.oldRole) {
      throw new Error("oldRole is required");
    }
    if (!eventData.newRole) {
      throw new Error("newRole is required");
    }
    if (!eventData.changedBy) {
      throw new Error("changedBy (admin ID) is required");
    }

    // Validate new role
    const validRoles = ["supplier", "vendor", "customer", "expert"];
    if (!validRoles.includes(eventData.newRole)) {
      throw new Error(`Invalid new role: ${eventData.newRole}`);
    }

    // Get deterministic timestamp
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(
      txTimestamp.seconds.toInt() * 1000
    ).toISOString();
    const txId = ctx.stub.getTxID();

    // Create role change event
    const roleChangeEvent = {
      docType: "event",
      eventType: "ROLE_CHANGED",
      eventId: `${eventData.userId}_ROLE_CHANGED_${txTimestamp.seconds.toInt()}`,

      userId: eventData.userId,
      oldRole: eventData.oldRole,
      newRole: eventData.newRole,
      changedBy: eventData.changedBy,
      reason: eventData.reason || "",

      timestamp: timestamp,
      txId: txId,
    };

    // Store role change event
    await ctx.stub.putState(
      roleChangeEvent.eventId,
      Buffer.from(JSON.stringify(roleChangeEvent))
    );

    // Emit event
    ctx.stub.setEvent(
      "RoleChanged",
      Buffer.from(
        JSON.stringify({
          userId: eventData.userId,
          oldRole: eventData.oldRole,
          newRole: eventData.newRole,
          timestamp: timestamp,
        })
      )
    );

    console.info(`✅ Role change event recorded: ${eventData.userId} (${eventData.oldRole} → ${eventData.newRole})`);
    console.info("============= END : Record Role Change ===========");

    return JSON.stringify(roleChangeEvent);
  }

  // ========================================
  // KYC VERIFICATION EVENT
  // ========================================

  /**
   * Record KYC verification event
   *
   * @param {Context} ctx - Transaction context
   * @param {string} eventDataJSON - KYC verification event data
   * @returns {string} KYC verification event
   */
  async recordKYCVerification(ctx, eventDataJSON) {
    console.info("============= START : Record KYC Verification ===========");

    let eventData;
    try {
      eventData = JSON.parse(eventDataJSON);
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }

    // Validate required fields
    if (!eventData.userId) {
      throw new Error("userId is required");
    }
    if (!eventData.kycHash) {
      throw new Error("kycHash (IPFS) is required");
    }
    if (!eventData.verifiedBy) {
      throw new Error("verifiedBy (expert ID) is required");
    }

    // Get deterministic timestamp
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(
      txTimestamp.seconds.toInt() * 1000
    ).toISOString();
    const txId = ctx.stub.getTxID();

    // Create KYC verification event
    const kycEvent = {
      docType: "event",
      eventType: "KYC_VERIFIED",
      eventId: `${eventData.userId}_KYC_VERIFIED_${txTimestamp.seconds.toInt()}`,

      userId: eventData.userId,
      kycHash: eventData.kycHash,  // IPFS hash of KYC documents
      verifiedBy: eventData.verifiedBy,
      verificationLevel: eventData.verificationLevel || "basic",  // basic, advanced, expert
      notes: eventData.notes || "",

      timestamp: timestamp,
      txId: txId,
    };

    // Store KYC verification event
    await ctx.stub.putState(
      kycEvent.eventId,
      Buffer.from(JSON.stringify(kycEvent))
    );

    // Emit event
    ctx.stub.setEvent(
      "KYCVerified",
      Buffer.from(
        JSON.stringify({
          userId: eventData.userId,
          kycHash: eventData.kycHash,
          verifiedBy: eventData.verifiedBy,
          timestamp: timestamp,
        })
      )
    );

    console.info(`✅ KYC verification event recorded for user: ${eventData.userId}`);
    console.info("============= END : Record KYC Verification ===========");

    return JSON.stringify(kycEvent);
  }

  // ========================================
  // USER DEACTIVATION EVENT
  // ========================================

  /**
   * Record user deactivation event
   *
   * @param {Context} ctx - Transaction context
   * @param {string} eventDataJSON - Deactivation event data
   * @returns {string} Deactivation event
   */
  async recordUserDeactivation(ctx, eventDataJSON) {
    console.info("============= START : Record User Deactivation ===========");

    let eventData;
    try {
      eventData = JSON.parse(eventDataJSON);
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }

    // Validate required fields
    if (!eventData.userId) {
      throw new Error("userId is required");
    }
    if (!eventData.deactivatedBy) {
      throw new Error("deactivatedBy is required");
    }

    // Get deterministic timestamp
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(
      txTimestamp.seconds.toInt() * 1000
    ).toISOString();
    const txId = ctx.stub.getTxID();

    // Create deactivation event
    const deactivationEvent = {
      docType: "event",
      eventType: "USER_DEACTIVATED",
      eventId: `${eventData.userId}_DEACTIVATED_${txTimestamp.seconds.toInt()}`,

      userId: eventData.userId,
      deactivatedBy: eventData.deactivatedBy,
      reason: eventData.reason || "No reason provided",

      timestamp: timestamp,
      txId: txId,
    };

    // Store deactivation event
    await ctx.stub.putState(
      deactivationEvent.eventId,
      Buffer.from(JSON.stringify(deactivationEvent))
    );

    // Emit event
    ctx.stub.setEvent(
      "UserDeactivated",
      Buffer.from(
        JSON.stringify({
          userId: eventData.userId,
          reason: eventData.reason,
          timestamp: timestamp,
        })
      )
    );

    console.info(`✅ User deactivation event recorded: ${eventData.userId}`);
    console.info("============= END : Record User Deactivation ===========");

    return JSON.stringify(deactivationEvent);
  }

  // ========================================
  // USER REACTIVATION EVENT
  // ========================================

  /**
   * Record user reactivation event
   *
   * @param {Context} ctx - Transaction context
   * @param {string} eventDataJSON - Reactivation event data
   * @returns {string} Reactivation event
   */
  async recordUserReactivation(ctx, eventDataJSON) {
    console.info("============= START : Record User Reactivation ===========");

    let eventData;
    try {
      eventData = JSON.parse(eventDataJSON);
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }

    // Validate required fields
    if (!eventData.userId) {
      throw new Error("userId is required");
    }
    if (!eventData.reactivatedBy) {
      throw new Error("reactivatedBy is required");
    }

    // Get deterministic timestamp
    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = new Date(
      txTimestamp.seconds.toInt() * 1000
    ).toISOString();
    const txId = ctx.stub.getTxID();

    // Create reactivation event
    const reactivationEvent = {
      docType: "event",
      eventType: "USER_REACTIVATED",
      eventId: `${eventData.userId}_REACTIVATED_${txTimestamp.seconds.toInt()}`,

      userId: eventData.userId,
      reactivatedBy: eventData.reactivatedBy,
      notes: eventData.notes || "",

      timestamp: timestamp,
      txId: txId,
    };

    // Store reactivation event
    await ctx.stub.putState(
      reactivationEvent.eventId,
      Buffer.from(JSON.stringify(reactivationEvent))
    );

    // Emit event
    ctx.stub.setEvent(
      "UserReactivated",
      Buffer.from(
        JSON.stringify({
          userId: eventData.userId,
          timestamp: timestamp,
        })
      )
    );

    console.info(`✅ User reactivation event recorded: ${eventData.userId}`);
    console.info("============= END : Record User Reactivation ===========");

    return JSON.stringify(reactivationEvent);
  }

  // ========================================
  // QUERY FUNCTIONS
  // ========================================

  /**
   * Get user registration event
   *
   * @param {Context} ctx - Transaction context
   * @param {string} userId - User ID
   * @returns {object|null} Registration event or null
   */
  async getUserRegistrationEvent(ctx, userId) {
    // Query for registration event
    const queryString = {
      selector: {
        docType: "event",
        eventType: "USER_REGISTERED",
        userId: userId,
      },
    };

    const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
    const result = await iterator.next();

    if (!result.done && result.value) {
      const strValue = Buffer.from(result.value.value.toString()).toString("utf8");
      await iterator.close();
      return JSON.parse(strValue);
    }

    await iterator.close();
    return null;
  }

  /**
   * Get all user events (complete history)
   *
   * @param {Context} ctx - Transaction context
   * @param {string} userId - User ID
   * @returns {string} Array of user events
   */
  async getUserEventHistory(ctx, userId) {
    console.info(`============= START : Get User Event History for ${userId} ===========`);

    const queryString = {
      selector: {
        docType: "event",
        userId: userId,
      },
      sort: [{ timestamp: "asc" }],
    };

    const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
    const allResults = [];

    let result = await iterator.next();
    while (!result.done) {
      const strValue = Buffer.from(result.value.value.toString()).toString("utf8");
      try {
        const record = JSON.parse(strValue);
        allResults.push(record);
      } catch (err) {
        console.error("Error parsing event:", err);
      }
      result = await iterator.next();
    }

    await iterator.close();

    console.info(`✅ Retrieved ${allResults.length} events for user ${userId}`);
    console.info("============= END : Get User Event History ===========");

    return JSON.stringify(allResults);
  }

  /**
   * Get user by wallet address
   *
   * @param {Context} ctx - Transaction context
   * @param {string} walletAddress - Wallet address
   * @returns {string} User registration event
   */
  async getUserByWalletAddress(ctx, walletAddress) {
    console.info(`============= START : Get User By Wallet ${walletAddress} ===========`);

    const queryString = {
      selector: {
        docType: "event",
        eventType: "USER_REGISTERED",
        walletAddress: walletAddress,
      },
    };

    const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
    const result = await iterator.next();

    if (!result.done && result.value) {
      const strValue = Buffer.from(result.value.value.toString()).toString("utf8");
      await iterator.close();

      console.info("✅ User found");
      console.info("============= END : Get User By Wallet ===========");

      return strValue;
    }

    await iterator.close();
    throw new Error(`User with wallet address ${walletAddress} not found`);
  }

  /**
   * Get all users by role
   *
   * @param {Context} ctx - Transaction context
   * @param {string} role - User role
   * @returns {string} Array of user registration events
   */
  async getUsersByRole(ctx, role) {
    console.info(`============= START : Get Users By Role: ${role} ===========`);

    // Validate role
    const validRoles = ["supplier", "vendor", "customer", "expert"];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role: ${role}. Valid roles are: ${validRoles.join(", ")}`);
    }

    const queryString = {
      selector: {
        docType: "event",
        eventType: "USER_REGISTERED",
        role: role,
      },
    };

    const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
    const allResults = [];

    let result = await iterator.next();
    while (!result.done) {
      const strValue = Buffer.from(result.value.value.toString()).toString("utf8");
      try {
        const record = JSON.parse(strValue);
        allResults.push(record);
      } catch (err) {
        console.error("Error parsing event:", err);
      }
      result = await iterator.next();
    }

    await iterator.close();

    console.info(`✅ Found ${allResults.length} users with role ${role}`);
    console.info("============= END : Get Users By Role ===========");

    return JSON.stringify(allResults);
  }

  /**
   * Get all registered users
   *
   * @param {Context} ctx - Transaction context
   * @returns {string} Array of all user registration events
   */
  async getAllUsers(ctx) {
    console.info("============= START : Get All Users ===========");

    const queryString = {
      selector: {
        docType: "event",
        eventType: "USER_REGISTERED",
      },
    };

    const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
    const allResults = [];

    let result = await iterator.next();
    while (!result.done) {
      const strValue = Buffer.from(result.value.value.toString()).toString("utf8");
      try {
        const record = JSON.parse(strValue);
        allResults.push(record);
      } catch (err) {
        console.error("Error parsing event:", err);
      }
      result = await iterator.next();
    }

    await iterator.close();

    console.info(`✅ Retrieved ${allResults.length} registered users`);
    console.info("============= END : Get All Users ===========");

    return JSON.stringify(allResults);
  }

  /**
   * Verify user exists on blockchain
   *
   * @param {Context} ctx - Transaction context
   * @param {string} userId - User ID
   * @returns {boolean} True if user registered
   */
  async userExists(ctx, userId) {
    const registrationEvent = await this.getUserRegistrationEvent(ctx, userId);
    return registrationEvent !== null;
  }

  // ========================================
  // DEPRECATED METHODS (for backward compatibility)
  // ========================================

  /**
   * @deprecated Use getUserRegistrationEvent instead
   */
  async getUser(ctx, userId) {
    console.warn("⚠️ getUser() is deprecated. Use getUserEventHistory() instead.");
    const registrationEvent = await this.getUserRegistrationEvent(ctx, userId);
    if (!registrationEvent) {
      throw new Error(`User ${userId} does not exist`);
    }
    return JSON.stringify(registrationEvent);
  }

  /**
   * @deprecated Use recordRoleChange instead
   */
  async updateUser(ctx, userDataJSON) {
    throw new Error("updateUser() is deprecated. Use recordRoleChange() or recordKYCVerification() for immutable events only.");
  }

  /**
   * @deprecated Login tracking should be in MongoDB, not blockchain
   */
  async recordLogin(ctx, userId) {
    throw new Error("recordLogin() is deprecated. Login tracking is mutable and should only be in MongoDB.");
  }

  /**
   * @deprecated Use recordUserDeactivation instead
   */
  async deactivateUser(ctx, userId) {
    throw new Error("deactivateUser() is deprecated. Use recordUserDeactivation() instead.");
  }

  /**
   * @deprecated Use recordUserReactivation instead
   */
  async activateUser(ctx, userId) {
    throw new Error("activateUser() is deprecated. Use recordUserReactivation() instead.");
  }
}

module.exports = UserContract;
