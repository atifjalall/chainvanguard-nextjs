import { initializeSafeMode, queryCollection, countDocuments } from './lokiService.js';

/**
 * Query Wrapper for Safe Mode
 *
 * Provides MongoDB-like query interface that automatically routes to:
 * - LokiJS (in safe mode when MongoDB is down)
 * - MongoDB (in normal mode)
 *
 * This allows existing route handlers to work with minimal changes
 */

/**
 * Safe Mode Find - Query with MongoDB-like syntax
 *
 * @param {object} Model - Mongoose model (used in normal mode)
 * @param {object} req - Express request object (to check safe mode and get userId)
 * @param {object} query - MongoDB query object
 * @param {object} options - Query options { sort, limit, skip }
 * @returns {Promise<array>} Query results
 */
export async function safeFind(Model, req, query = {}, options = {}) {
  if (!req.safeMode) {
    // Normal mode - use MongoDB
    const mongoQuery = Model.find(query);

    if (options.sort) {
      mongoQuery.sort(options.sort);
    }

    if (options.skip) {
      mongoQuery.skip(options.skip);
    }

    if (options.limit) {
      mongoQuery.limit(options.limit);
    }

    return await mongoQuery.exec();
  }

  // Safe mode - use LokiJS
  const userId = req.userId || req.user?._id || req.user?.id;

  if (!userId) {
    throw new Error('User ID is required for safe mode queries');
  }

  // Initialize safe mode for user if not already done
  await initializeSafeMode(userId, 100);

  // Get collection name from model
  const collectionName = Model.collection.name;

  // Query LokiJS
  return queryCollection(userId, collectionName, query, options);
}

/**
 * Safe Mode Count - Count documents with MongoDB-like syntax
 *
 * @param {object} Model - Mongoose model
 * @param {object} req - Express request object
 * @param {object} query - MongoDB query object
 * @returns {Promise<number>} Document count
 */
export async function safeCount(Model, req, query = {}) {
  if (!req.safeMode) {
    // Normal mode - use MongoDB
    return await Model.countDocuments(query);
  }

  // Safe mode - use LokiJS
  const userId = req.userId || req.user?._id || req.user?.id;

  if (!userId) {
    throw new Error('User ID is required for safe mode queries');
  }

  // Initialize safe mode for user if not already done
  await initializeSafeMode(userId, 100);

  // Get collection name from model
  const collectionName = Model.collection.name;

  // Count in LokiJS
  return countDocuments(userId, collectionName, query);
}

/**
 * Safe Mode Find One - Find single document
 *
 * @param {object} Model - Mongoose model
 * @param {object} req - Express request object
 * @param {object} query - MongoDB query object
 * @returns {Promise<object|null>} Document or null
 */
export async function safeFindOne(Model, req, query = {}) {
  if (!req.safeMode) {
    // Normal mode - use MongoDB
    return await Model.findOne(query);
  }

  // Safe mode - use LokiJS
  const userId = req.userId || req.user?._id || req.user?.id;

  if (!userId) {
    throw new Error('User ID is required for safe mode queries');
  }

  // Initialize safe mode for user if not already done
  await initializeSafeMode(userId, 100);

  // Get collection name from model
  const collectionName = Model.collection.name;

  // Query LokiJS and get first result
  const results = queryCollection(userId, collectionName, query, { limit: 1 });
  return results.length > 0 ? results[0] : null;
}

/**
 * Safe Mode Aggregate - Limited aggregation support
 * Note: LokiJS doesn't support full MongoDB aggregation pipelines
 * This is a simplified version for common use cases
 *
 * @param {object} Model - Mongoose model
 * @param {object} req - Express request object
 * @param {array} pipeline - Aggregation pipeline
 * @returns {Promise<array>} Aggregation results
 */
export async function safeAggregate(Model, req, pipeline = []) {
  if (!req.safeMode) {
    // Normal mode - use MongoDB
    return await Model.aggregate(pipeline);
  }

  // Safe mode - limited aggregation support
  console.warn('⚠️ Safe mode aggregation support is limited. Some operations may not work.');

  const userId = req.userId || req.user?._id || req.user?.id;

  if (!userId) {
    throw new Error('User ID is required for safe mode queries');
  }

  // Initialize safe mode for user if not already done
  await initializeSafeMode(userId, 100);

  // Parse simple aggregation pipelines
  let query = {};
  let options = {};

  for (const stage of pipeline) {
    if (stage.$match) {
      query = { ...query, ...stage.$match };
    }

    if (stage.$sort) {
      options.sort = stage.$sort;
    }

    if (stage.$limit) {
      options.limit = stage.$limit;
    }

    if (stage.$skip) {
      options.skip = stage.$skip;
    }
  }

  // Get collection name from model
  const collectionName = Model.collection.name;

  // Query LokiJS
  return queryCollection(userId, collectionName, query, options);
}

/**
 * Helper to build pagination response
 *
 * @param {array} data - Query results
 * @param {number} total - Total count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {object} Pagination response
 */
export function buildPaginationResponse(data, total, page, limit) {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasMore: page * limit < total
    }
  };
}

export default {
  safeFind,
  safeCount,
  safeFindOne,
  safeAggregate,
  buildPaginationResponse
};
