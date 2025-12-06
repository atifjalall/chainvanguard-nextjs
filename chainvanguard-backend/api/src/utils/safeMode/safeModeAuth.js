import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { extractUserByWallet } from './ipfsExtractor.js';
import { isMongoHealthy } from './mongoHealth.js';
import sessionService from '../../services/session.service.js';

/**
 * Safe Mode Authentication Helper
 *
 * This module provides authentication functions that work in safe mode
 * by falling back to cached/backup data when MongoDB is unavailable.
 */

/**
 * Safe mode login that falls back to IPFS backup when MongoDB is down
 *
 * @param {string} walletAddress - User's wallet address
 * @param {string} password - User's password
 * @param {function} normalLoginFn - Normal login function to try first
 * @returns {object} Login result with token and user data
 */
export async function safeModeLogin(walletAddress, password, normalLoginFn) {
  try {
    // Check MongoDB health
    const mongoHealthy = await isMongoHealthy();

    if (mongoHealthy) {
      // MongoDB is healthy - use normal login
      console.log('✅ MongoDB healthy - using normal login');
      return await normalLoginFn(walletAddress, password);
    }

    // MongoDB is down - use safe mode (backup data)
    console.warn('⚠️  Safe mode active - using backup data for login');

    // Extract user from IPFS backup
    const user = await extractUserByWallet(walletAddress);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        walletAddress: user.walletAddress,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create session in Redis (required for auth middleware)
    await sessionService.createSession(user._id.toString(), {
      userId: user._id.toString(),
      walletAddress: user.walletAddress,
      role: user.role,
      email: user.email,
      loginTime: new Date().toISOString(),
      safeMode: true
    });

    console.log(`✅ Created Redis session for user: ${user._id.toString()}`);

    // Return user data (exclude sensitive fields)
    const userData = {
      _id: user._id,
      walletAddress: user.walletAddress,
      walletName: user.walletName,
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isVerified: user.isVerified,
      address: user.address,
      city: user.city,
      state: user.state,
      country: user.country,
      postalCode: user.postalCode,
      companyName: user.companyName,
    };

    console.log(`✅ Safe mode login successful for: ${user.email}`);

    return {
      token,
      user: userData,
      safeMode: true,
      warning: 'Logged in using backup data. Some features may be limited.',
    };
  } catch (error) {
    console.error('❌ Safe mode login error:', error);
    throw error;
  }
}

/**
 * Check if current session is in safe mode
 *
 * @returns {Promise<boolean>} True if in safe mode
 */
export async function isInSafeMode() {
  const mongoHealthy = await isMongoHealthy();
  return !mongoHealthy;
}

export default {
  safeModeLogin,
  isInSafeMode,
};
