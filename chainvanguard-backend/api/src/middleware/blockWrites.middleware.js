/**
 * Block Write Operations Middleware
 *
 * Automatically blocks all POST, PUT, PATCH, DELETE operations when in safe mode
 * Allows GET and OPTIONS to pass through for read-only access
 *
 * EXCEPTIONS (these operations work even in safe mode):
 * - Blockchain operations (independent of MongoDB)
 * - Authentication (uses backup data)
 * - Backup viewing operations
 */

/**
 * Middleware to block write operations in safe mode
 * Apply this AFTER authenticate middleware
 */
export const blockWritesInSafeMode = (req, res, next) => {
  // Only block if in safe mode
  if (!req.safeMode) {
    return next();
  }

  // Allow read operations
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return next();
  }

  // Allow specific safe mode operations
  const allowedSafeModeWrites = [
    // Blockchain operations (independent of MongoDB)
    '/wallet/transfer',
    '/wallet/deposit',
    '/wallet/withdraw',

    // Authentication (uses backup data)
    '/auth/login',
    '/auth/refresh',
    '/auth/verify-otp',
    '/auth/send-otp',

    // Backup read operations
    '/backups/verify',
    '/backups/download'
  ];

  // Check if this is an allowed operation
  console.log(`🔍 Checking path: ${req.path}, originalUrl: ${req.originalUrl}`);

  const isAllowed = allowedSafeModeWrites.some(path => {
    const matches = req.path.includes(path) || req.originalUrl.includes(path);
    console.log(`  - Testing "${path}": ${matches}`);
    return matches;
  });

  console.log(`🔍 Final result: isAllowed = ${isAllowed}`);

  if (isAllowed) {
    console.log(`✅ Allowing ${method} ${req.path} in safe mode`);
    return next();
  }

  // Block all other write operations
  console.log(`⚠️  Blocked ${method} ${req.path} - safe mode active`);

  return res.status(503).json({
    success: false,
    error: 'System under maintenance',
    message: 'Write operations are temporarily unavailable. Please try again in a few minutes.',
    safeMode: true,
    timestamp: new Date().toISOString()
  });
};

/**
 * Middleware specifically for expert-only backup operations
 * Blocks backup creation/restoration in safe mode
 */
export const blockBackupWritesInSafeMode = (req, res, next) => {
  if (!req.safeMode) {
    return next();
  }

  const method = req.method.toUpperCase();
  if (method === 'GET') {
    return next(); // Allow viewing backups
  }

  // Block backup creation/restoration in safe mode
  const backupWriteOperations = [
    '/api/backups/create',
    '/api/backups/restore',
    '/api/backups/:id/delete'
  ];

  const isBackupWrite = backupWriteOperations.some(path =>
    req.path.includes(path) || req.originalUrl.includes(path)
  );

  if (isBackupWrite) {
    console.log(`⚠️  Blocked backup operation ${method} ${req.path} - safe mode active`);

    return res.status(503).json({
      success: false,
      error: 'Cannot create/restore backups during maintenance',
      message: 'Backup operations require MongoDB write access. Please wait for system recovery.',
      safeMode: true,
      note: 'You can view existing backups and download them from IPFS.',
      timestamp: new Date().toISOString()
    });
  }

  next();
};

export default {
  blockWritesInSafeMode,
  blockBackupWritesInSafeMode
};
