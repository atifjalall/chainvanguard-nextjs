import readline from 'readline';
import { Readable } from 'stream';
import zlib from 'zlib';
import { promisify } from 'util';
import redisService from '../../services/redis.service.js';
import ipfsService from '../../services/ipfs.service.js';
import fabricService from '../../services/fabric.service.js';

const gunzip = promisify(zlib.gunzip);

/**
 * IPFS Data Extractor for Safe Mode
 *
 * This utility extracts specific user data from IPFS backup files without
 * loading the entire file into memory. It uses streaming to process large
 * backup files efficiently.
 *
 * Flow:
 * 1. Get latest backup CID from BLOCKCHAIN (immutable source of truth)
 * 2. Stream IPFS backup file line-by-line (NDJSON format)
 * 3. Extract only the requested user's data
 * 4. Cache extracted data in Redis for 1 hour
 * 5. Return data to user
 */

/**
 * Extract user-specific data from IPFS backup
 *
 * @param {string} userId - User ID to extract data for
 * @param {number} limit - Maximum number of items to extract (default: 50)
 * @returns {object} User data { profile, orders, products }
 */
export async function extractUserData(userId, limit = 50) {
  try {
    console.log(`📦 Extracting data for user ${userId} from IPFS backup...`);

    // Get latest backup CID from BLOCKCHAIN (immutable source of truth)
    // This is critical for disaster recovery - blockchain is always available
    let backupCID = null;
    let backupMetadata = null;

    try {
      console.log('🔗 Getting latest backup from blockchain...');
      backupMetadata = await fabricService.getLatestFullBackupFromBlockchain();

      if (backupMetadata && backupMetadata.cid) {
        backupCID = backupMetadata.cid;
        console.log(`✅ Found backup on blockchain: ${backupMetadata.backupId}`);
        console.log(`   CID: ${backupCID}`);
      }
    } catch (fabricError) {
      console.warn('⚠️  Blockchain unavailable, falling back to Redis:', fabricError.message);

      // Fallback to Redis if blockchain query fails
      backupCID = await redisService.get('latest_backup_cid');

      if (backupCID) {
        console.log('✅ Using backup CID from Redis fallback:', backupCID);
      }
    }

    if (!backupCID) {
      console.error('❌ No backup CID found in blockchain or Redis');
      throw new Error('No backup available. Please wait for next backup cycle.');
    }

    console.log(`📥 Downloading backup from IPFS: ${backupCID}`);

    // Download from IPFS
    const result = await ipfsService.downloadFromIPFS(backupCID);

    if (!result.success) {
      throw new Error(`Failed to download backup: ${result.error}`);
    }

    // Convert ArrayBuffer to Buffer if needed
    let backupBuffer = result.data;
    if (backupBuffer instanceof ArrayBuffer || backupBuffer.constructor.name === 'ArrayBuffer') {
      backupBuffer = Buffer.from(backupBuffer);
      console.log(`🔄 Converted ArrayBuffer to Buffer (${backupBuffer.length} bytes)`);
    }

    // Decompress if it's gzipped (check for .gz extension in metadata or magic bytes)
    if (backupBuffer[0] === 0x1f && backupBuffer[1] === 0x8b) {
      console.log('🗜️  Decompressing gzipped backup...');
      backupBuffer = await gunzip(backupBuffer);
      console.log(`✅ Decompressed to ${backupBuffer.length} bytes`);
    }

    const backupText = backupBuffer.toString('utf-8');

    // Initialize user data container
    const userData = {
      profile: null,
      orders: [],
      products: [],
      inventory: [],
      vendorInventories: [],
      vendorRequests: [],
      returns: [],
      wallets: [],
      carts: [],
      wishlists: [],
      reviews: [],
      supplierRatings: [],
      invoices: [],
      orderCount: 0,
      productCount: 0,
      inventoryCount: 0,
      vendorInventoryCount: 0,
      vendorRequestCount: 0,
      returnCount: 0,
      walletCount: 0,
      cartCount: 0,
      wishlistCount: 0,
      reviewCount: 0,
      supplierRatingCount: 0,
      invoiceCount: 0
    };

    // Check if this is NDJSON format (one JSON per line) or old format (single JSON)
    const lines = backupText.split('\n').filter(line => line.trim());

    // Detect format by examining first line structure
    let isNDJSON = false;
    if (lines.length > 0) {
      try {
        const firstRecord = JSON.parse(lines[0]);
        isNDJSON = firstRecord.hasOwnProperty('type') && firstRecord.hasOwnProperty('data');
        console.log(`📋 Format detected: ${isNDJSON ? 'NDJSON' : 'Old JSON'}`);
      } catch (e) {
        console.log(`⚠️  Could not parse first line`);
      }
    }

    if (!isNDJSON) {
      // Old format: single JSON object with collections
      console.log('📄 Processing old format backup (single JSON)...');
      const backup = JSON.parse(lines[0]);

      // Extract from old format
      if (backup.collections) {
        // Extract user profile
        if (backup.collections.users) {
          userData.profile = backup.collections.users.find(u => u._id.toString() === userId);
        }

        // Extract user's orders
        if (backup.collections.orders) {
          userData.orders = backup.collections.orders
            .filter(o => o.userId && o.userId.toString() === userId)
            .slice(0, limit);
          userData.orderCount = userData.orders.length;
        }

        // Extract user's products (if they're a seller)
        if (backup.collections.products) {
          userData.products = backup.collections.products
            .filter(p => p.sellerId && p.sellerId.toString() === userId)
            .slice(0, limit);
          userData.productCount = userData.products.length;
        }

        // Extract user's inventory (if they're a supplier/vendor)
        if (backup.collections.inventory) {
          userData.inventory = backup.collections.inventory
            .filter(i => i.supplierId && i.supplierId.toString() === userId)
            .slice(0, limit);
          userData.inventoryCount = userData.inventory.length;
        }

        // Extract user's vendor inventories (if they're a vendor)
        if (backup.collections.vendorInventories) {
          userData.vendorInventories = backup.collections.vendorInventories
            .filter(vi => vi.vendorId && vi.vendorId.toString() === userId)
            .slice(0, limit);
          userData.vendorInventoryCount = userData.vendorInventories.length;
        }

        // Extract user's vendor requests
        if (backup.collections.vendorRequests) {
          userData.vendorRequests = backup.collections.vendorRequests
            .filter(vr =>
              (vr.vendorId && vr.vendorId.toString() === userId) ||
              (vr.supplierId && vr.supplierId.toString() === userId) ||
              (vr.userId && vr.userId.toString() === userId)
            )
            .slice(0, limit);
          userData.vendorRequestCount = userData.vendorRequests.length;
        }

        // Extract user's returns (customer returns or vendor returns)
        if (backup.collections.returns) {
          userData.returns = backup.collections.returns
            .filter(r =>
              (r.userId && r.userId.toString() === userId) ||
              (r.vendorId && r.vendorId.toString() === userId)
            )
            .slice(0, limit);
          userData.returnCount = userData.returns.length;
        }

        // Extract user's wallets
        if (backup.collections.wallets) {
          userData.wallets = backup.collections.wallets
            .filter(w => w.userId && w.userId.toString() === userId)
            .slice(0, limit);
          userData.walletCount = userData.wallets.length;
        }

        // Extract user's carts
        if (backup.collections.carts) {
          userData.carts = backup.collections.carts
            .filter(c => c.userId && c.userId.toString() === userId)
            .slice(0, limit);
          userData.cartCount = userData.carts.length;
        }

        // Extract user's wishlists
        if (backup.collections.wishlists) {
          userData.wishlists = backup.collections.wishlists
            .filter(w => w.userId && w.userId.toString() === userId)
            .slice(0, limit);
          userData.wishlistCount = userData.wishlists.length;
        }

        // Extract user's reviews
        if (backup.collections.reviews) {
          userData.reviews = backup.collections.reviews
            .filter(r => r.userId && r.userId.toString() === userId)
            .slice(0, limit);
          userData.reviewCount = userData.reviews.length;
        }

        // Extract user's supplier ratings
        if (backup.collections.supplierRatings) {
          userData.supplierRatings = backup.collections.supplierRatings
            .filter(sr =>
              (sr.supplierId && sr.supplierId.toString() === userId) ||
              (sr.vendorId && sr.vendorId.toString() === userId)
            )
            .slice(0, limit);
          userData.supplierRatingCount = userData.supplierRatings.length;
        }

        // Extract user's invoices
        if (backup.collections.invoices) {
          userData.invoices = backup.collections.invoices
            .filter(i => i.userId && i.userId.toString() === userId)
            .slice(0, limit);
          userData.invoiceCount = userData.invoices.length;
        }
      }
    } else {
      // New format: NDJSON (one JSON object per line)
      console.log('📄 Processing NDJSON format backup (streaming)...');

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const record = JSON.parse(line);

          // Extract user profile
          if (record.type === 'user' && record.id === userId) {
            userData.profile = record.data;
          }

          // Extract user's orders (limited)
          if (record.type === 'order' && record.userId === userId) {
            if (userData.orderCount < limit) {
              userData.orders.push(record.data);
              userData.orderCount++;
            }
          }

          // Extract user's products (limited)
          if (record.type === 'product' && record.sellerId === userId) {
            if (userData.productCount < limit) {
              userData.products.push(record.data);
              userData.productCount++;
            }
          }

          // Extract user's inventory (limited)
          if (record.type === 'inventory' && record.supplierId === userId) {
            if (userData.inventoryCount < limit) {
              userData.inventory.push(record.data);
              userData.inventoryCount++;
            }
          }

          // Extract user's vendor inventories (limited)
          if (record.type === 'vendorInventory' && record.vendorId === userId) {
            if (userData.vendorInventoryCount < limit) {
              userData.vendorInventories.push(record.data);
              userData.vendorInventoryCount++;
            }
          }

          // Extract user's vendor requests (limited)
          if (record.type === 'vendorRequest') {
            const isUserRelated =
              record.vendorId === userId ||
              record.supplierId === userId ||
              record.userId === userId;

            if (isUserRelated && userData.vendorRequestCount < limit) {
              userData.vendorRequests.push(record.data);
              userData.vendorRequestCount++;
            }
          }

          // Extract user's returns (limited)
          if (record.type === 'return') {
            const isUserRelated =
              record.userId === userId ||
              record.vendorId === userId;

            if (isUserRelated && userData.returnCount < limit) {
              userData.returns.push(record.data);
              userData.returnCount++;
            }
          }

          // Extract user's wallets (limited)
          if (record.type === 'wallet' && record.userId === userId) {
            if (userData.walletCount < limit) {
              userData.wallets.push(record.data);
              userData.walletCount++;
            }
          }

          // Extract user's carts (limited)
          if (record.type === 'cart' && record.userId === userId) {
            if (userData.cartCount < limit) {
              userData.carts.push(record.data);
              userData.cartCount++;
            }
          }

          // Extract user's wishlists (limited)
          if (record.type === 'wishlist' && record.userId === userId) {
            if (userData.wishlistCount < limit) {
              userData.wishlists.push(record.data);
              userData.wishlistCount++;
            }
          }

          // Extract user's reviews (limited)
          if (record.type === 'review' && record.userId === userId) {
            if (userData.reviewCount < limit) {
              userData.reviews.push(record.data);
              userData.reviewCount++;
            }
          }

          // Extract user's supplier ratings (limited)
          if (record.type === 'supplierRating') {
            const isUserRelated =
              record.supplierId === userId ||
              record.vendorId === userId;

            if (isUserRelated && userData.supplierRatingCount < limit) {
              userData.supplierRatings.push(record.data);
              userData.supplierRatingCount++;
            }
          }

          // Extract user's invoices (limited)
          if (record.type === 'invoice' && record.userId === userId) {
            if (userData.invoiceCount < limit) {
              userData.invoices.push(record.data);
              userData.invoiceCount++;
            }
          }

          // Early exit if we have everything we need
          if (userData.profile &&
              userData.orderCount >= limit &&
              userData.productCount >= limit &&
              userData.inventoryCount >= limit &&
              userData.vendorInventoryCount >= limit &&
              userData.vendorRequestCount >= limit &&
              userData.returnCount >= limit &&
              userData.walletCount >= limit &&
              userData.cartCount >= limit &&
              userData.wishlistCount >= limit &&
              userData.reviewCount >= limit &&
              userData.supplierRatingCount >= limit &&
              userData.invoiceCount >= limit) {
            break;
          }
        } catch (parseError) {
          console.error('⚠️  Error parsing line:', parseError.message);
          continue;
        }
      }
    }

    console.log(`✅ Extracted data for user ${userId}:`, {
      hasProfile: !!userData.profile,
      orders: userData.orderCount,
      products: userData.productCount,
      inventory: userData.inventoryCount,
      vendorInventories: userData.vendorInventoryCount,
      vendorRequests: userData.vendorRequestCount,
      returns: userData.returnCount,
      wallets: userData.walletCount,
      carts: userData.cartCount,
      wishlists: userData.wishlistCount,
      reviews: userData.reviewCount,
      supplierRatings: userData.supplierRatingCount,
      invoices: userData.invoiceCount
    });

    return userData;
  } catch (error) {
    console.error('❌ IPFS extraction error:', error);
    throw error;
  }
}

/**
 * Get user data from cache or extract from IPFS
 *
 * @param {string} userId - User ID
 * @param {number} limit - Maximum items to extract
 * @returns {object} User data
 */
export async function getCachedOrExtract(userId, limit = 50) {
  try {
    // Check cache first
    const cacheKey = `safemode:user:${userId}`;
    const cached = await redisService.get(cacheKey);

    if (cached) {
      console.log(`✅ Cache hit for user ${userId}`);
      return cached;
    }

    // Cache miss - extract from IPFS
    console.log(`⏳ Cache miss - extracting data for user ${userId}...`);
    const extracted = await extractUserData(userId, limit);

    // Cache for 1 hour (3600 seconds)
    await redisService.set(cacheKey, extracted, 3600);

    console.log(`💾 Cached data for user ${userId} (TTL: 1 hour)`);

    return extracted;
  } catch (error) {
    console.error('❌ getCachedOrExtract error:', error);
    throw error;
  }
}

/**
 * Extract user by wallet address from IPFS backup (for login in safe mode)
 *
 * @param {string} walletAddress - User wallet address
 * @returns {object|null} User profile or null
 */
export async function extractUserByWallet(walletAddress) {
  try {
    console.log(`🔍 Searching for user by wallet: ${walletAddress}`);

    // Check cache first (wallet-based lookup)
    const cacheKey = `safemode:user:wallet:${walletAddress.toLowerCase()}`;
    const cached = await redisService.get(cacheKey);

    if (cached) {
      console.log(`✅ Cache hit for wallet ${walletAddress}`);
      return cached;
    }

    // Get latest backup CID from BLOCKCHAIN (immutable source of truth)
    let backupCID = null;

    try {
      console.log('🔗 Getting latest backup from blockchain...');
      const backupMetadata = await fabricService.getLatestFullBackupFromBlockchain();

      if (backupMetadata && backupMetadata.cid) {
        backupCID = backupMetadata.cid;
        console.log(`✅ Found backup on blockchain: ${backupMetadata.backupId}`);
      }
    } catch (fabricError) {
      console.warn('⚠️  Blockchain unavailable, falling back to Redis:', fabricError.message);

      // Fallback to Redis if blockchain query fails
      backupCID = await redisService.get('latest_backup_cid');
    }

    if (!backupCID) {
      throw new Error('No backup available');
    }

    // Download and decompress backup
    const result = await ipfsService.downloadFromIPFS(backupCID);
    if (!result.success) {
      throw new Error(`Failed to download backup: ${result.error}`);
    }

    // Convert ArrayBuffer to Buffer if needed
    let backupBuffer = result.data;
    console.log(`🔍 DEBUG: Buffer type: ${backupBuffer.constructor.name}, isBuffer: ${Buffer.isBuffer(backupBuffer)}, size: ${backupBuffer.length}`);
    console.log(`🔍 DEBUG: First bytes: [${backupBuffer[0]}, ${backupBuffer[1]}] (hex: 0x${backupBuffer[0]?.toString(16)}, 0x${backupBuffer[1]?.toString(16)})`);

    if (backupBuffer instanceof ArrayBuffer || backupBuffer.constructor.name === 'ArrayBuffer') {
      backupBuffer = Buffer.from(backupBuffer);
      console.log(`🔄 Converted ArrayBuffer to Buffer`);
    }

    // Decompress if needed (0x1f = 31, 0x8b = 139)
    if (backupBuffer[0] === 0x1f && backupBuffer[1] === 0x8b) {
      console.log('🗜️  GZIP DETECTED - Decompressing...');
      backupBuffer = await gunzip(backupBuffer);
      console.log(`✅ Decompressed to ${backupBuffer.length} bytes`);
    } else {
      console.log(`⚠️  NOT GZIPPED (first bytes: 0x${backupBuffer[0]?.toString(16)} 0x${backupBuffer[1]?.toString(16)})`);
    }

    const backupText = backupBuffer.toString('utf-8');
    console.log(`📄 Backup text length: ${backupText.length} characters, lines: ${backupText.split('\n').length}`);
    const lines = backupText.split('\n').filter(line => line.trim());

    let userProfile = null;

    // Check format by examining first line structure
    let isNDJSON = false;
    if (lines.length > 0) {
      try {
        const firstRecord = JSON.parse(lines[0]);
        isNDJSON = firstRecord.hasOwnProperty('type') && firstRecord.hasOwnProperty('data');
        console.log(`📋 Format detected: ${isNDJSON ? 'NDJSON' : 'Old JSON'} (has type: ${!!firstRecord.type}, has data: ${!!firstRecord.data})`);
      } catch (e) {
        console.log(`⚠️  Could not parse first line: ${e.message}`);
      }
    }

    if (isNDJSON) {
      // NDJSON format
      console.log(`🔍 Searching ${lines.length} NDJSON records for wallet: ${walletAddress}`);
      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const record = JSON.parse(line);

          if (record.type === 'user' &&
              record.data.walletAddress &&
              record.data.walletAddress.toLowerCase() === walletAddress.toLowerCase()) {
            userProfile = record.data;
            console.log(`✅ Found user in NDJSON: ${record.data.email}`);
            break;
          }
        } catch (parseError) {
          continue;
        }
      }
    } else {
      // Old format (single JSON object with collections)
      console.log(`🔍 Searching old format backup for wallet: ${walletAddress}`);
      const backup = JSON.parse(lines[0]);
      if (backup.collections && backup.collections.users) {
        userProfile = backup.collections.users.find(u =>
          u.walletAddress && u.walletAddress.toLowerCase() === walletAddress.toLowerCase()
        );
        if (userProfile) {
          console.log(`✅ Found user in old format: ${userProfile.email}`);
        }
      }
    }

    if (userProfile) {
      // Cache for 30 minutes
      await redisService.set(cacheKey, userProfile, 1800);
      console.log(`✅ Found and cached user by wallet: ${walletAddress}`);
    } else {
      console.log(`⚠️  User not found by wallet: ${walletAddress}`);
    }

    return userProfile;
  } catch (error) {
    console.error('❌ extractUserByWallet error:', error);
    throw error;
  }
}

/**
 * Extract user by email from IPFS backup (for login in safe mode)
 *
 * @param {string} email - User email
 * @returns {object|null} User profile or null
 */
export async function extractUserByEmail(email) {
  try {
    console.log(`🔍 Searching for user by email: ${email}`);

    // Check cache first (email-based lookup)
    const cacheKey = `safemode:user:email:${email}`;
    const cached = await redisService.get(cacheKey);

    if (cached) {
      console.log(`✅ Cache hit for email ${email}`);
      return cached;
    }

    // Get latest backup CID from BLOCKCHAIN (immutable source of truth)
    let backupCID = null;

    try {
      console.log('🔗 Getting latest backup from blockchain...');
      const backupMetadata = await fabricService.getLatestFullBackupFromBlockchain();

      if (backupMetadata && backupMetadata.cid) {
        backupCID = backupMetadata.cid;
        console.log(`✅ Found backup on blockchain: ${backupMetadata.backupId}`);
      }
    } catch (fabricError) {
      console.warn('⚠️  Blockchain unavailable, falling back to Redis:', fabricError.message);

      // Fallback to Redis if blockchain query fails
      backupCID = await redisService.get('latest_backup_cid');
    }

    if (!backupCID) {
      throw new Error('No backup available');
    }

    // Download and decompress backup
    const result = await ipfsService.downloadFromIPFS(backupCID);
    if (!result.success) {
      throw new Error(`Failed to download backup: ${result.error}`);
    }

    // Convert ArrayBuffer to Buffer if needed
    let backupBuffer = result.data;
    console.log(`🔍 DEBUG: Buffer type: ${backupBuffer.constructor.name}, isBuffer: ${Buffer.isBuffer(backupBuffer)}, size: ${backupBuffer.length}`);
    console.log(`🔍 DEBUG: First bytes: [${backupBuffer[0]}, ${backupBuffer[1]}] (hex: 0x${backupBuffer[0]?.toString(16)}, 0x${backupBuffer[1]?.toString(16)})`);

    if (backupBuffer instanceof ArrayBuffer || backupBuffer.constructor.name === 'ArrayBuffer') {
      backupBuffer = Buffer.from(backupBuffer);
      console.log(`🔄 Converted ArrayBuffer to Buffer`);
    }

    // Decompress if needed (0x1f = 31, 0x8b = 139)
    if (backupBuffer[0] === 0x1f && backupBuffer[1] === 0x8b) {
      console.log('🗜️  GZIP DETECTED - Decompressing...');
      backupBuffer = await gunzip(backupBuffer);
      console.log(`✅ Decompressed to ${backupBuffer.length} bytes`);
    } else {
      console.log(`⚠️  NOT GZIPPED (first bytes: 0x${backupBuffer[0]?.toString(16)} 0x${backupBuffer[1]?.toString(16)})`);
    }

    const backupText = backupBuffer.toString('utf-8');
    console.log(`📄 Backup text length: ${backupText.length} characters, lines: ${backupText.split('\n').length}`);
    const lines = backupText.split('\n').filter(line => line.trim());

    let userProfile = null;

    if (lines.length === 1) {
      // Old format
      const backup = JSON.parse(lines[0]);
      if (backup.collections && backup.collections.users) {
        userProfile = backup.collections.users.find(u => u.email === email);
      }
    } else {
      // NDJSON format
      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const record = JSON.parse(line);

          if (record.type === 'user' && record.data.email === email) {
            userProfile = record.data;
            break;
          }
        } catch (parseError) {
          continue;
        }
      }
    }

    if (userProfile) {
      // Cache for 30 minutes
      await redisService.set(cacheKey, userProfile, 1800);
      console.log(`✅ Found and cached user: ${email}`);
    } else {
      console.log(`⚠️  User not found: ${email}`);
    }

    return userProfile;
  } catch (error) {
    console.error('❌ extractUserByEmail error:', error);
    throw error;
  }
}

/**
 * Clear safe mode cache for a user
 *
 * @param {string} userId - User ID
 */
export async function clearSafeModeCache(userId) {
  try {
    await redisService.del(`safemode:user:${userId}`);
    console.log(`🗑️  Cleared safe mode cache for user ${userId}`);
  } catch (error) {
    console.error('❌ clearSafeModeCache error:', error);
  }
}

/**
 * Store latest backup CID in Redis
 * Called by backup service after creating a new backup
 *
 * @param {string} cid - IPFS CID of the latest backup
 */
export async function storeLatestBackupCID(cid) {
  try {
    await redisService.set('latest_backup_cid', cid, 86400 * 7); // Keep for 7 days
    console.log(`✅ Stored latest backup CID in Redis: ${cid}`);
  } catch (error) {
    console.error('❌ storeLatestBackupCID error:', error);
  }
}

export default {
  extractUserData,
  getCachedOrExtract,
  extractUserByEmail,
  extractUserByWallet,
  clearSafeModeCache,
  storeLatestBackupCID
};
