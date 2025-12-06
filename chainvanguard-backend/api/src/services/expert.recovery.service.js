import ipfsService from "./ipfs.service.js";
import fabricService from "./fabric.service.js";
import redisService from "./redis.service.js";
import User from "../models/User.js";
import WalletService from "./wallet.service.js";
import zlib from "zlib";
import { promisify } from "util";

const gunzip = promisify(zlib.gunzip);

/**
 * ExpertRecoveryService
 * Handles expert data recovery from IPFS/Blockchain when MongoDB is wiped
 *
 * SCENARIO: MongoDB is completely wiped but blockchain and IPFS have the data
 * 1. Expert user tries to login but can't (user not found in MongoDB)
 * 2. System checks if this expert exists in last backup on IPFS
 * 3. If found in backup, verify with blockchain (wallet address)
 * 4. Restore expert user data to MongoDB from backup
 * 5. Allow login to proceed
 */
class ExpertRecoveryService {
  constructor() {
    this.walletService = new WalletService();
  }

  /**
   * Attempt to recover expert user from IPFS + blockchain when MongoDB is empty
   * @param {string} walletAddress - Wallet address of the expert
   * @param {string} password - Password for verification
   * @returns {object} Recovered user data if successful
   */
  async recoverExpertFromBackup(walletAddress, password) {
    console.log(`🔍 Attempting expert recovery for wallet: ${walletAddress}`);

    try {
      // Step 1: Get user registration data from blockchain
      console.log("⛓️  Step 1: Getting user data from blockchain...");
      await fabricService.connect();
      const blockchainUser = await fabricService.getUserByWalletAddress(
        walletAddress
      );
      await fabricService.disconnect();

      if (!blockchainUser) {
        throw new Error(
          "User not found on blockchain. Cannot verify authenticity."
        );
      }

      console.log(`   ✓ Found user on blockchain`);
      console.log(`   Role: ${blockchainUser.role}`);
      console.log(`   User Data CID: ${blockchainUser.userDataCID}`);

      // Only allow expert recovery
      if (blockchainUser.role !== "expert") {
        throw new Error(
          `Only expert users can be auto-recovered. Your role: ${blockchainUser.role}`
        );
      }

      // Step 2: Download user data from IPFS using CID from blockchain
      console.log("📥 Step 2: Downloading user data from IPFS...");

      if (!blockchainUser.userDataCID) {
        throw new Error(
          "User data CID not found on blockchain. User may have registered before IPFS storage was enabled."
        );
      }

      const ipfsResult = await ipfsService.downloadFromIPFS(
        blockchainUser.userDataCID
      );

      if (!ipfsResult.success) {
        throw new Error(`Failed to download from IPFS: ${ipfsResult.error}`);
      }

      // Parse user data
      const userData = JSON.parse(ipfsResult.data.toString());
      console.log(`   ✓ Downloaded user data: ${userData.name} (${userData.email})`);

      // Step 3: Verify wallet address matches
      if (
        userData.walletAddress.toLowerCase() !== walletAddress.toLowerCase()
      ) {
        throw new Error(
          "Wallet address mismatch between blockchain and IPFS data"
        );
      }

      console.log("   ✓ Wallet address verified");

      // Step 4: Verify password matches
      console.log("🔐 Step 4: Verifying password...");
      const isPasswordValid = await this.walletService.verifyPassword(
        password,
        userData.passwordHash
      );

      if (!isPasswordValid) {
        throw new Error("Invalid password for expert account");
      }

      console.log("   ✓ Password verified successfully");

      // Step 5: Restore expert user to MongoDB
      console.log("💾 Step 5: Restoring expert to MongoDB...");
      const restoredUser = await this._restoreUserToMongoDB(userData);
      console.log("   ✓ Expert user restored to MongoDB");

      console.log("✅ Expert recovery completed successfully");

      return {
        success: true,
        user: restoredUser,
        recoverySource: "BLOCKCHAIN_IPFS",
        userDataCID: blockchainUser.userDataCID,
        message:
          "Your account was recovered from blockchain and IPFS. Please verify your profile information.",
      };
    } catch (error) {
      console.error("❌ Expert recovery failed:", error);
      throw error;
    }
  }

  /**
   * Check if expert exists on blockchain (without password)
   * Used to determine if recovery is possible
   */
  async checkExpertExistsInBackup(walletAddress) {
    try {
      console.log(`🔍 Checking if expert exists on blockchain: ${walletAddress}`);

      // Query blockchain for user
      await fabricService.connect();
      const blockchainUser = await fabricService.getUserByWalletAddress(
        walletAddress
      );
      await fabricService.disconnect();

      if (!blockchainUser) {
        return {
          exists: false,
          reason: "User not found on blockchain",
        };
      }

      // Check if user is expert
      if (blockchainUser.role !== "expert") {
        return {
          exists: false,
          reason: `User role is ${blockchainUser.role}, not expert`,
        };
      }

      // Check if user data CID exists
      if (!blockchainUser.userDataCID) {
        return {
          exists: false,
          reason: "User data CID not found on blockchain",
        };
      }

      console.log(`   ✓ Expert found on blockchain with CID: ${blockchainUser.userDataCID}`);

      return {
        exists: true,
        userDataCID: blockchainUser.userDataCID,
        role: blockchainUser.role,
      };
    } catch (error) {
      console.error("❌ Check expert on blockchain failed:", error);
      return { exists: false, reason: error.message };
    }
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Get latest backup CID from Redis or blockchain
   */
  async _getLatestBackupCID() {
    try {
      // Try Redis first (fast)
      const cachedCID = await redisService.get("latest_backup_cid");
      if (cachedCID) {
        console.log("   ✓ Found backup CID in Redis cache");
        return cachedCID;
      }

      console.log("   Redis cache miss, querying blockchain...");

      // Fallback to blockchain
      await fabricService.connect();
      const latestBackup = await fabricService.getLatestBackupFromBlockchain();
      await fabricService.disconnect();

      if (latestBackup && latestBackup.cid) {
        console.log("   ✓ Found backup CID in blockchain");
        // Cache it for future use
        await redisService.set(
          "latest_backup_cid",
          latestBackup.cid,
          86400 * 7
        ); // 7 days
        return latestBackup.cid;
      }

      return null;
    } catch (error) {
      console.error("   ❌ Failed to get backup CID:", error);
      return null;
    }
  }

  /**
   * Download backup from IPFS and parse NDJSON format
   */
  async _downloadAndParseBackup(cid) {
    try {
      // Download from IPFS
      const result = await ipfsService.downloadFromIPFS(cid);

      if (!result.success) {
        throw new Error(`IPFS download failed: ${result.error}`);
      }

      // Decompress
      const decompressed = await gunzip(result.data);
      const dataString = decompressed.toString();

      // Parse NDJSON format
      const lines = dataString.trim().split("\n");
      const users = [];

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const item = JSON.parse(line);

          // Extract users only
          if (item.type === "user") {
            users.push(item.data);
          }
        } catch (e) {
          console.warn(`   ⚠️  Failed to parse line: ${e.message}`);
        }
      }

      return {
        users,
        totalUsers: users.length,
        format: "NDJSON",
      };
    } catch (error) {
      console.error("   ❌ Backup download/parse failed:", error);
      throw error;
    }
  }

  /**
   * Find user in backup data by wallet address and role
   */
  _findUserInBackup(users, walletAddress, role = "expert") {
    return users.find(
      (user) =>
        user.walletAddress &&
        user.walletAddress.toLowerCase() === walletAddress.toLowerCase() &&
        user.role === role
    );
  }

  /**
   * Verify user exists on blockchain
   */
  async _verifyOnBlockchain(walletAddress) {
    try {
      await fabricService.connect();

      // Query blockchain for user by wallet address
      const blockchainUser = await fabricService.getUserByWalletAddress(
        walletAddress
      );

      await fabricService.disconnect();

      return blockchainUser;
    } catch (error) {
      console.error("   ❌ Blockchain verification failed:", error);
      await fabricService.disconnect();
      return null;
    }
  }

  /**
   * Restore user to MongoDB from backup data
   */
  async _restoreUserToMongoDB(userData) {
    try {
      // Remove _id if it exists to let MongoDB generate a new one
      const userDataCopy = { ...userData };
      delete userDataCopy._id;

      // Create user in MongoDB
      const restoredUser = await User.create({
        ...userDataCopy,
        isActive: true,
        isVerified: true,
        restoredFromBackup: true,
        restoredAt: new Date(),
      });

      return restoredUser;
    } catch (error) {
      console.error("   ❌ MongoDB restore failed:", error);

      // If user already exists (duplicate key), fetch and return it
      if (error.code === 11000) {
        const existingUser = await User.findOne({
          walletAddress: userData.walletAddress,
        });
        return existingUser;
      }

      throw error;
    }
  }
}

export default new ExpertRecoveryService();
