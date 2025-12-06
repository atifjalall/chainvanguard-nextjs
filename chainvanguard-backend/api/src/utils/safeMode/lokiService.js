import loki from 'lokijs';
import redisService from '../../services/redis.service.js';
import { getCachedOrExtract } from './ipfsExtractor.js';

/**
 * LokiJS Service for Safe Mode
 *
 * When MongoDB is down, this service:
 * 1. Extracts user data from IPFS backup
 * 2. Loads data into LokiJS in-memory database
 * 3. Provides MongoDB-like query interface
 *
 * This allows us to use existing Mongoose query patterns without rewriting 600+ queries
 */

let lokiDB = null;
const userDatabases = new Map(); // Store separate LokiJS instance per user
const userAccessTimes = new Map(); // Track last access time for each user
const userCleanupTimers = new Map(); // Store cleanup timers for each user

// Configuration
const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes of inactivity before cleanup

/**
 * Initialize LokiJS for a specific user in safe mode
 *
 * @param {string} userId - User ID to initialize safe mode for
 * @param {number} limit - Maximum items to extract (default: 100)
 * @returns {object} LokiJS database instance
 */
export async function initializeSafeMode(userId, limit = 100) {
  try {
    console.log(`🔧 Initializing safe mode for user ${userId}...`);

    // Check if already initialized for this user
    if (userDatabases.has(userId)) {
      console.log(`✅ Safe mode already initialized for user ${userId}`);
      return userDatabases.get(userId);
    }

    // Extract user data from IPFS (with Redis caching)
    const extractedData = await getCachedOrExtract(userId, limit);

    // Create new LokiJS instance for this user
    const userDB = new loki(`safemode-${userId}.db`);

    // Load extracted data into LokiJS collections
    loadDataIntoLoki(userDB, extractedData);

    // Store in map for reuse
    userDatabases.set(userId, userDB);

    // Track access time for cleanup
    updateUserAccess(userId);

    // Schedule automatic cleanup after inactivity
    scheduleCleanup(userId);

    console.log(`✅ Safe mode initialized for user ${userId}:`, {
      orders: extractedData.orderCount || 0,
      products: extractedData.productCount || 0,
      inventory: extractedData.inventoryCount || 0,
      vendorInventories: extractedData.vendorInventoryCount || 0,
      vendorRequests: extractedData.vendorRequestCount || 0,
      returns: extractedData.returnCount || 0,
      wallets: extractedData.walletCount || 0,
      carts: extractedData.cartCount || 0,
      wishlists: extractedData.wishlistCount || 0,
      reviews: extractedData.reviewCount || 0,
      supplierRatings: extractedData.supplierRatingCount || 0,
      invoices: extractedData.invoiceCount || 0
    });

    return userDB;
  } catch (error) {
    console.error('❌ Safe mode initialization error:', error);
    throw error;
  }
}

/**
 * Load extracted user data into LokiJS collections
 *
 * @param {object} db - LokiJS database instance
 * @param {object} userData - Extracted user data
 */
function loadDataIntoLoki(db, userData) {
  // Create collections
  const usersCollection = db.addCollection('users', {
    unique: ['_id'],
    indices: ['email', 'walletAddress']
  });

  const ordersCollection = db.addCollection('orders', {
    unique: ['_id'],
    indices: ['userId', 'status', 'createdAt']
  });

  const productsCollection = db.addCollection('products', {
    unique: ['_id'],
    indices: ['sellerId', 'category', 'status']
  });

  const inventoryCollection = db.addCollection('inventory', {
    unique: ['_id'],
    indices: ['supplierId', 'category', 'status']
  });

  const vendorInventoriesCollection = db.addCollection('vendorInventories', {
    unique: ['_id'],
    indices: ['vendorId', 'productId', 'status']
  });

  const vendorRequestsCollection = db.addCollection('vendorRequests', {
    unique: ['_id'],
    indices: ['vendorId', 'supplierId', 'userId', 'status']
  });

  const returnsCollection = db.addCollection('returns', {
    unique: ['_id'],
    indices: ['userId', 'vendorId', 'orderId', 'status']
  });

  const walletsCollection = db.addCollection('wallets', {
    unique: ['_id'],
    indices: ['userId', 'walletAddress']
  });

  const cartsCollection = db.addCollection('carts', {
    unique: ['_id'],
    indices: ['userId']
  });

  const wishlistsCollection = db.addCollection('wishlists', {
    unique: ['_id'],
    indices: ['userId', 'productId']
  });

  const reviewsCollection = db.addCollection('reviews', {
    unique: ['_id'],
    indices: ['userId', 'productId', 'status']
  });

  const supplierRatingsCollection = db.addCollection('supplierRatings', {
    unique: ['_id'],
    indices: ['supplierId', 'vendorId']
  });

  const invoicesCollection = db.addCollection('invoices', {
    unique: ['_id'],
    indices: ['userId', 'orderId', 'status']
  });

  // Insert data
  if (userData.profile) {
    usersCollection.insert([userData.profile]);
  }

  if (userData.orders && userData.orders.length > 0) {
    ordersCollection.insert(userData.orders);
  }

  if (userData.products && userData.products.length > 0) {
    productsCollection.insert(userData.products);
  }

  if (userData.inventory && userData.inventory.length > 0) {
    inventoryCollection.insert(userData.inventory);
  }

  if (userData.vendorInventories && userData.vendorInventories.length > 0) {
    vendorInventoriesCollection.insert(userData.vendorInventories);
  }

  if (userData.vendorRequests && userData.vendorRequests.length > 0) {
    vendorRequestsCollection.insert(userData.vendorRequests);
  }

  if (userData.returns && userData.returns.length > 0) {
    returnsCollection.insert(userData.returns);
  }

  if (userData.wallets && userData.wallets.length > 0) {
    walletsCollection.insert(userData.wallets);
  }

  if (userData.carts && userData.carts.length > 0) {
    cartsCollection.insert(userData.carts);
  }

  if (userData.wishlists && userData.wishlists.length > 0) {
    wishlistsCollection.insert(userData.wishlists);
  }

  if (userData.reviews && userData.reviews.length > 0) {
    reviewsCollection.insert(userData.reviews);
  }

  if (userData.supplierRatings && userData.supplierRatings.length > 0) {
    supplierRatingsCollection.insert(userData.supplierRatings);
  }

  if (userData.invoices && userData.invoices.length > 0) {
    invoicesCollection.insert(userData.invoices);
  }

  console.log('📦 Data loaded into LokiJS collections:', {
    users: usersCollection.count(),
    orders: ordersCollection.count(),
    products: productsCollection.count(),
    inventory: inventoryCollection.count(),
    vendorInventories: vendorInventoriesCollection.count(),
    vendorRequests: vendorRequestsCollection.count(),
    returns: returnsCollection.count(),
    wallets: walletsCollection.count(),
    carts: cartsCollection.count(),
    wishlists: wishlistsCollection.count(),
    reviews: reviewsCollection.count(),
    supplierRatings: supplierRatingsCollection.count(),
    invoices: invoicesCollection.count()
  });
}

/**
 * Update last access time for a user and reschedule cleanup
 *
 * @param {string} userId - User ID
 */
function updateUserAccess(userId) {
  userAccessTimes.set(userId, Date.now());
}

/**
 * Schedule automatic cleanup for inactive user data
 *
 * @param {string} userId - User ID
 */
function scheduleCleanup(userId) {
  // Clear existing timer if any
  if (userCleanupTimers.has(userId)) {
    clearTimeout(userCleanupTimers.get(userId));
  }

  // Schedule new cleanup
  const timer = setTimeout(() => {
    const lastAccess = userAccessTimes.get(userId);
    const now = Date.now();

    // Only cleanup if still inactive
    if (now - lastAccess >= INACTIVITY_TIMEOUT) {
      console.log(`⏰ Auto-cleanup triggered for user ${userId} after ${Math.floor((now - lastAccess) / 1000)}s inactivity`);
      clearUserSafeMode(userId);
    }
  }, INACTIVITY_TIMEOUT);

  userCleanupTimers.set(userId, timer);
}

/**
 * Get LokiJS database instance for a user
 *
 * @param {string} userId - User ID
 * @returns {object|null} LokiJS database instance or null
 */
export function getUserDB(userId) {
  const db = userDatabases.get(userId);

  if (db) {
    // Update access time and reschedule cleanup
    updateUserAccess(userId);
    scheduleCleanup(userId);
  }

  return db || null;
}

/**
 * Get a specific collection from user's LokiJS database
 *
 * @param {string} userId - User ID
 * @param {string} collectionName - Collection name (orders, products, etc.)
 * @returns {object|null} LokiJS collection or null
 */
export function getCollection(userId, collectionName) {
  const userDB = userDatabases.get(userId);
  if (!userDB) return null;

  // Update access time and reschedule cleanup
  updateUserAccess(userId);
  scheduleCleanup(userId);

  return userDB.getCollection(collectionName);
}

/**
 * Query a collection with MongoDB-like syntax
 *
 * @param {string} userId - User ID
 * @param {string} collectionName - Collection name
 * @param {object} query - MongoDB-like query object
 * @param {object} options - Query options (sort, limit, skip)
 * @returns {array} Query results
 */
export function queryCollection(userId, collectionName, query = {}, options = {}) {
  const collection = getCollection(userId, collectionName);

  if (!collection) {
    console.warn(`⚠️ Collection ${collectionName} not found for user ${userId}`);
    return [];
  }

  let chain = collection.chain().find(query);

  // Apply sorting
  if (options.sort) {
    const sortField = Object.keys(options.sort)[0];
    const sortOrder = options.sort[sortField] === 1; // true = ascending
    chain = chain.simplesort(sortField, sortOrder);
  }

  // Apply skip/limit (pagination)
  if (options.skip) {
    chain = chain.offset(options.skip);
  }

  if (options.limit) {
    chain = chain.limit(options.limit);
  }

  return chain.data();
}

/**
 * Count documents in a collection matching a query
 *
 * @param {string} userId - User ID
 * @param {string} collectionName - Collection name
 * @param {object} query - MongoDB-like query object
 * @returns {number} Count of matching documents
 */
export function countDocuments(userId, collectionName, query = {}) {
  const collection = getCollection(userId, collectionName);

  if (!collection) {
    return 0;
  }

  return collection.chain().find(query).data().length;
}

/**
 * Clear safe mode data for a user
 *
 * @param {string} userId - User ID
 */
export function clearUserSafeMode(userId) {
  if (userDatabases.has(userId)) {
    const userDB = userDatabases.get(userId);

    // Clear all collections
    const collections = ['users', 'orders', 'products', 'inventory', 'vendorInventories', 'vendorRequests', 'returns', 'wallets'];
    collections.forEach(name => {
      const collection = userDB.getCollection(name);
      if (collection) {
        collection.clear();
      }
    });

    userDatabases.delete(userId);

    // Clear cleanup timer
    if (userCleanupTimers.has(userId)) {
      clearTimeout(userCleanupTimers.get(userId));
      userCleanupTimers.delete(userId);
    }

    // Clear access time tracking
    userAccessTimes.delete(userId);

    console.log(`🗑️ Cleared safe mode data for user ${userId}`);
  }
}

/**
 * Clear all safe mode data
 */
export function clearAllSafeMode() {
  userDatabases.forEach((db, userId) => {
    clearUserSafeMode(userId);
  });

  userDatabases.clear();
  userAccessTimes.clear();
  userCleanupTimers.clear();
  lokiDB = null;

  console.log('🗑️ Cleared all safe mode data');
}

/**
 * Get safe mode statistics (for monitoring)
 *
 * @returns {object} Statistics about safe mode usage
 */
export function getSafeModeStats() {
  const stats = {
    activeUsers: userDatabases.size,
    users: []
  };

  userDatabases.forEach((db, userId) => {
    const lastAccess = userAccessTimes.get(userId);
    const inactiveTime = Date.now() - lastAccess;

    stats.users.push({
      userId,
      lastAccessSeconds: Math.floor(inactiveTime / 1000),
      willCleanupIn: Math.max(0, Math.floor((INACTIVITY_TIMEOUT - inactiveTime) / 1000))
    });
  });

  return stats;
}

/**
 * Populate referenced documents (similar to Mongoose populate)
 *
 * @param {string} userId - User ID
 * @param {array} documents - Documents to populate
 * @param {string} field - Field name containing the reference ID
 * @param {string} refCollection - Collection name to populate from
 * @param {array} selectFields - Fields to include from referenced document
 * @returns {array} Documents with populated fields
 */
export function populateField(userId, documents, field, refCollection, selectFields = ['_id', 'name', 'email']) {
  if (!documents || documents.length === 0) return documents;

  const collection = getCollection(userId, refCollection);
  if (!collection) {
    console.warn(`⚠️ Reference collection ${refCollection} not found for populate`);
    return documents;
  }

  return documents.map(doc => {
    const refId = doc[field];
    if (!refId) return doc;

    // Find referenced document
    const refDoc = collection.findOne({ _id: refId.toString() });
    if (!refDoc) return doc;

    // Create populated object with selected fields
    const populatedData = {};
    selectFields.forEach(field => {
      if (refDoc[field] !== undefined) {
        populatedData[field] = refDoc[field];
      }
    });

    // Replace ID with populated object
    return {
      ...doc,
      [field]: populatedData
    };
  });
}

export default {
  initializeSafeMode,
  getUserDB,
  getCollection,
  queryCollection,
  countDocuments,
  clearUserSafeMode,
  clearAllSafeMode,
  getSafeModeStats,
  populateField
};
