import mongoose from 'mongoose';

/**
 * MongoDB Health Check Utility
 *
 * This utility provides functions to check MongoDB connection health.
 * Used by safe mode middleware to determine if app should enter fallback mode.
 */

/**
 * Check if MongoDB connection is healthy
 *
 * @returns {Promise<boolean>} True if MongoDB is connected and responsive
 */
export async function isMongoHealthy() {
  try {
    // Check connection state
    if (mongoose.connection.readyState !== 1) {
      console.warn('⚠️  MongoDB readyState:', mongoose.connection.readyState, '(not connected)');
      return false;
    }

    // Ping MongoDB to verify it's responsive
    await mongoose.connection.db.admin().ping();

    return true;
  } catch (error) {
    console.error('❌ MongoDB health check failed:', error.message);
    return false;
  }
}

/**
 * Get detailed MongoDB connection status
 *
 * @returns {object} Connection status details
 */
export function getMongoStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized'
  };

  return {
    readyState: mongoose.connection.readyState,
    status: states[mongoose.connection.readyState] || 'unknown',
    name: mongoose.connection.name,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
  };
}

/**
 * Wait for MongoDB to become healthy (with timeout)
 *
 * @param {number} timeoutMs - Maximum time to wait in milliseconds
 * @param {number} checkIntervalMs - How often to check in milliseconds
 * @returns {Promise<boolean>} True if MongoDB became healthy within timeout
 */
export async function waitForMongoHealth(timeoutMs = 30000, checkIntervalMs = 1000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const healthy = await isMongoHealthy();

    if (healthy) {
      return true;
    }

    // Wait before next check
    await new Promise(resolve => setTimeout(resolve, checkIntervalMs));
  }

  return false;
}

export default {
  isMongoHealthy,
  getMongoStatus,
  waitForMongoHealth
};
