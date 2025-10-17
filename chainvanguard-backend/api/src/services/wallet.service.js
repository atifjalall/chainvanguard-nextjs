// chainvanguard-backend/api/src/services/wallet.service.js
// Modified to remove Ethereum dependencies and work with Hyperledger Fabric

import * as bip39 from "bip39";
import CryptoJS from "crypto-js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "your-super-secret-jwt-key-change-this-in-production";
const JWT_EXPIRES_IN = "7d"; // Token valid for 7 days

class WalletService {
  /**
   * Generate a new Fabric wallet address (UUID-based)
   * @returns {string} - Fabric wallet address
   */
  generateFabricAddress() {
    // Generate a unique Fabric address
    return crypto.randomBytes(20).toString("hex");
  }

  /**
   * Generate a new wallet with mnemonic phrase
   * @returns {Object} - { mnemonic, address, privateKey }
   */
  generateWallet() {
    try {
      // Generate 12-word mnemonic (industry standard)
      const mnemonic = bip39.generateMnemonic();

      // Generate address deterministically from mnemonic (same as recovery)
      const privateKey = crypto
        .createHash("sha256")
        .update(mnemonic)
        .digest("hex");

      const address = crypto
        .createHash("sha256")
        .update(privateKey)
        .digest("hex")
        .substring(0, 40);

      console.log("✅ New Fabric wallet generated");

      return {
        mnemonic: mnemonic,
        address: `0x${address}`,
        privateKey: privateKey,
      };
    } catch (error) {
      console.error("❌ Wallet generation failed:", error);
      throw new Error("Failed to generate wallet");
    }
  }

  /**
   * Recover wallet from mnemonic phrase
   * @param {string} mnemonic - 12 or 24 word mnemonic phrase
   * @returns {Object} - { address, privateKey, mnemonic }
   */
  recoverFromMnemonic(mnemonic) {
    try {
      // Validate mnemonic
      if (!bip39.validateMnemonic(mnemonic.trim())) {
        throw new Error("Invalid mnemonic phrase");
      }

      // Generate address and private key from mnemonic
      const privateKey = crypto
        .createHash("sha256")
        .update(mnemonic.trim())
        .digest("hex");

      const address = crypto
        .createHash("sha256")
        .update(privateKey)
        .digest("hex")
        .substring(0, 40);

      console.log("✅ Wallet recovered from mnemonic");

      return {
        address: `0x${address}`,
        privateKey: privateKey,
        mnemonic: mnemonic.trim(),
      };
    } catch (error) {
      console.error("❌ Wallet recovery failed:", error);
      throw new Error("Invalid mnemonic phrase. Please check and try again.");
    }
  }

  /**
   * Generate wallet from mnemonic phrase (alias for recoverFromMnemonic)
   * This method is used by auth routes for wallet recovery
   * @param {string} mnemonic - 12 or 24 word mnemonic phrase
   * @returns {Object} - { address, privateKey, mnemonic }
   */
  generateWalletFromMnemonic(mnemonic) {
    try {
      // Use the existing recoverFromMnemonic method
      return this.recoverFromMnemonic(mnemonic);
    } catch (error) {
      console.error("❌ Generate wallet from mnemonic failed:", error);
      throw new Error("Invalid mnemonic phrase. Please check and try again.");
    }
  }

  /**
   * Encrypt private key with password (for secure storage)
   * @param {string} privateKey - Wallet private key
   * @param {string} password - User password
   * @returns {string} - Encrypted private key
   */
  encryptPrivateKey(privateKey, password) {
    try {
      const encrypted = CryptoJS.AES.encrypt(privateKey, password).toString();
      console.log("✅ Private key encrypted");
      return encrypted;
    } catch (error) {
      console.error("❌ Encryption failed:", error);
      throw new Error("Failed to encrypt private key");
    }
  }

  /**
   * Decrypt private key with password
   * @param {string} encryptedKey - Encrypted private key
   * @param {string} password - User password
   * @returns {string} - Decrypted private key
   */
  decryptPrivateKey(encryptedKey, password) {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedKey, password).toString(
        CryptoJS.enc.Utf8
      );

      if (!decrypted) {
        throw new Error("Invalid password");
      }

      console.log("✅ Private key decrypted");
      return decrypted;
    } catch (error) {
      console.error("❌ Decryption failed:", error);
      throw new Error("Invalid password. Please try again.");
    }
  }

  /**
   * Sign a message with wallet (for Fabric authentication)
   * @param {string} privateKey - Wallet private key
   * @param {string} message - Message to sign
   * @returns {string} - Signature
   */
  signMessage(privateKey, message) {
    try {
      // Create HMAC signature for Fabric
      const signature = crypto
        .createHmac("sha256", privateKey)
        .update(message)
        .digest("hex");

      console.log("✅ Message signed");
      return signature;
    } catch (error) {
      console.error("❌ Signing failed:", error);
      throw new Error("Failed to sign message");
    }
  }

  /**
   * Verify signed message
   * @param {string} message - Original message
   * @param {string} signature - Signature
   * @param {string} privateKey - Private key to verify
   * @returns {boolean} - True if signature is valid
   */
  verifySignature(message, signature, privateKey) {
    try {
      const expectedSignature = crypto
        .createHmac("sha256", privateKey)
        .update(message)
        .digest("hex");

      const isValid = expectedSignature === signature;

      if (isValid) {
        console.log("✅ Signature verified");
      } else {
        console.log("❌ Signature verification failed");
      }

      return isValid;
    } catch (error) {
      console.error("❌ Verification failed:", error);
      return false;
    }
  }

  /**
   * Generate authentication challenge message
   * @param {string} address - Wallet address
   * @returns {Object} - { message, nonce, timestamp }
   */
  generateAuthChallenge(address) {
    const nonce = Math.random().toString(36).substring(7);
    const timestamp = Date.now();

    const message = `Sign this message to authenticate with ChainVanguard\n\nWallet: ${address}\nNonce: ${nonce}\nTimestamp: ${timestamp}`;

    return {
      message,
      nonce,
      timestamp,
    };
  }

  /**
   * Generate JWT token for authenticated user
   * @param {string} address - Wallet address
   * @param {string} role - User role
   * @returns {string} - JWT token
   */
  generateToken(address, role = "user") {
    try {
      const token = jwt.sign(
        {
          address: address.toLowerCase(),
          role,
          type: "wallet-auth",
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      console.log("✅ JWT token generated");
      return token;
    } catch (error) {
      console.error("❌ Token generation failed:", error);
      throw new Error("Failed to generate authentication token");
    }
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {Object} - Decoded token payload
   */
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log("✅ Token verified");
      return decoded;
    } catch (error) {
      console.error("❌ Token verification failed:", error);
      throw new Error("Invalid or expired token");
    }
  }

  /**
   * Hash password for storage
   * @param {string} password - Plain text password
   * @returns {string} - Hashed password
   */
  async hashPassword(password) {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(password, salt);
      console.log("✅ Password hashed");
      return hashed;
    } catch (error) {
      console.error("❌ Password hashing failed:", error);
      throw new Error("Failed to hash password");
    }
  }

  /**
   * Verify password against hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {boolean} - True if password matches
   */
  async verifyPassword(password, hash) {
    try {
      const isMatch = await bcrypt.compare(password, hash);

      if (isMatch) {
        console.log("✅ Password verified");
      } else {
        console.log("❌ Password verification failed");
      }

      return isMatch;
    } catch (error) {
      console.error("❌ Password verification failed:", error);
      return false;
    }
  }

  /**
   * Validate Fabric wallet address format
   * @param {string} address - Wallet address
   * @returns {boolean} - True if valid Fabric address
   */
  isValidAddress(address) {
    // Accept addresses in format: 0x followed by 40 hex characters
    const hexRegex = /^0x[0-9a-fA-F]{40}$/;
    return hexRegex.test(address);
  }

  /**
   * Validate mnemonic phrase
   * @param {string} mnemonic - Mnemonic phrase
   * @returns {boolean} - True if valid
   */
  isValidMnemonic(mnemonic) {
    return bip39.validateMnemonic(mnemonic.trim());
  }
}

export default WalletService;
