import { isMongoHealthy } from '../utils/safeMode/mongoHealth.js';
import jwt from 'jsonwebtoken';

/**
 * Safe Mode Middleware
 *
 * This middleware:
 * 1. Checks MongoDB health on every request
 * 2. Adds `req.safeMode` flag to indicate if app is in safe mode
 * 3. Blocks ALL write operations (POST, PUT, PATCH, DELETE) when MongoDB is down
 * 4. Allows read operations (GET) to proceed using cached/backup data
 * 5. Allows ONLY expert role to perform backup/restore operations in safe mode
 *
 * When MongoDB is unavailable:
 * - Users can still view data (from cache/backup)
 * - Users CANNOT create/update/delete data
 * - Only experts can backup/restore
 * - App doesn't crash
 */

// Cache health check result for 5 seconds to reduce overhead
let cachedHealthStatus = {
  isHealthy: true,
  lastCheck: Date.now(),
  checkInterval: 5000 // 5 seconds
};

/**
 * Extract user role from JWT token
 */
function getUserRoleFromToken(req) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.role;
  } catch (error) {
    return null;
  }
}

async function safeModeMiddleware(req, res, next) {
  try {
    // Check if we need to refresh health status
    const now = Date.now();
    const shouldCheck = (now - cachedHealthStatus.lastCheck) > cachedHealthStatus.checkInterval;

    if (shouldCheck) {
      cachedHealthStatus.isHealthy = await isMongoHealthy();
      cachedHealthStatus.lastCheck = now;
    }

    const mongoHealthy = cachedHealthStatus.isHealthy;

    // Set safe mode flag (true = in safe mode, false = normal mode)
    req.safeMode = !mongoHealthy;

    if (req.safeMode) {
      console.warn('⚠️  SAFE MODE ACTIVE - MongoDB unavailable');

      // Block write operations in safe mode
      const writeOperations = ['POST', 'PUT', 'PATCH', 'DELETE'];

      if (writeOperations.includes(req.method)) {
        // Get user role from token
        const userRole = getUserRoleFromToken(req);

        // Allow certain endpoints even in safe mode
        const allowedInSafeMode = [
          '/api/auth/login', // Allow login (uses backup data)
          '/api/auth/refresh', // Allow token refresh
          '/api/auth/verify-otp', // Allow OTP verification
          '/api/auth/send-otp', // Allow OTP sending
          '/api/auth/logout', // Allow logout
          '/health', // Allow health checks
          '/api/wallet', // Allow wallet operations (blockchain independent)
        ];

        // Allow backup/restore ONLY for expert role
        const isBackupRestoreEndpoint = req.path.startsWith('/api/backups');
        const isExpert = userRole === 'expert';

        if (isBackupRestoreEndpoint && isExpert) {
          console.log('✅ Expert accessing backup/restore in safe mode');
          return next(); // Allow expert to backup/restore
        }

        const isAllowed = allowedInSafeMode.some(path => req.path.startsWith(path));

        if (!isAllowed) {
          return res.status(503).json({
            success: false,
            error: 'System under maintenance',
            message: 'Database maintenance in progress. Please be patient. You can view existing data, but cannot make changes at this time. Our team is working to restore full functionality.',
            safeMode: true,
            retryAfter: 60, // Suggest retry after 60 seconds
            contactSupport: 'If this persists, please contact support.'
          });
        }
      }
    }

    next();
  } catch (error) {
    console.error('❌ Safe mode middleware error:', error);
    // If middleware fails, assume we're NOT in safe mode and continue
    req.safeMode = false;
    next();
  }
}

export default safeModeMiddleware;
