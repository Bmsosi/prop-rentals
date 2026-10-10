import redisClient from '../config/redis.js';

/**
 * Cache utility functions for Redis
 * Provides caching, invalidation, and cache management capabilities
 */

// Default TTL (Time To Live) in seconds
const DEFAULT_TTL = 300; // 5 minutes
const SHORT_TTL = 60; // 1 minute
const LONG_TTL = 3600; // 1 hour

/**
 * Generate cache key with prefix
 * @param {string} prefix - Cache key prefix (e.g., 'listing', 'user')
 * @param {string|number} identifier - Unique identifier (ID, userId, etc.)
 * @param {object} options - Additional options for key generation
 * @returns {string} Cache key
 */
export function generateCacheKey(prefix, identifier, options = {}) {
  const parts = [prefix, identifier];
  
  if (options.role) parts.push(`role:${options.role}`);
  if (options.query) {
    const queryStr = JSON.stringify(options.query);
    parts.push(`query:${Buffer.from(queryStr).toString('base64').slice(0, 20)}`);
  }
  
  return parts.join(':');
}

/**
 * Get data from cache
 * @param {string} key - Cache key
 * @returns {Promise<object|null>} Cached data or null if not found
 */
export async function getFromCache(key) {
  try {
    const data = await redisClient.get(key);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error(`Cache get error for key ${key}:`, error.message);
    return null; // Fail gracefully - return null so app can fetch from DB
  }
}

/**
 * Set data in cache
 * @param {string} key - Cache key
 * @param {object} data - Data to cache
 * @param {number} ttl - Time to live in seconds (default: 5 minutes)
 * @returns {Promise<boolean>} Success status
 */
export async function setInCache(key, data, ttl = DEFAULT_TTL) {
  try {
    const serialized = JSON.stringify(data);
    await redisClient.setex(key, ttl, serialized);
    return true;
  } catch (error) {
    console.error(`Cache set error for key ${key}:`, error.message);
    return false; // Fail gracefully - don't throw
  }
}

/**
 * Delete a specific cache key
 * @param {string} key - Cache key to delete
 * @returns {Promise<boolean>} Success status
 */
export async function deleteFromCache(key) {
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error(`Cache delete error for key ${key}:`, error.message);
    return false;
  }
}

/**
 * Delete multiple cache keys by pattern
 * @param {string} pattern - Pattern to match (e.g., 'listing:*')
 * @returns {Promise<number>} Number of keys deleted
 */
export async function deleteCacheByPattern(pattern) {
  try {
    const stream = redisClient.scanStream({
      match: pattern,
      count: 100,
    });

    let deletedCount = 0;
    const pipeline = redisClient.pipeline();

    return new Promise((resolve, reject) => {
      stream.on('data', (keys) => {
        if (keys.length) {
          keys.forEach((key) => {
            pipeline.del(key);
            deletedCount++;
          });
        }
      });

      stream.on('end', async () => {
        if (deletedCount > 0) {
          await pipeline.exec();
        }
        resolve(deletedCount);
      });

      stream.on('error', (err) => {
        console.error(`Cache pattern delete error for ${pattern}:`, err.message);
        reject(err);
      });
    });
  } catch (error) {
    console.error(`Cache pattern delete error for ${pattern}:`, error.message);
    return 0;
  }
}

/**
 * Invalidate cache for a specific entity
 * @param {string} prefix - Cache prefix (e.g., 'listing', 'user')
 * @param {string|number} identifier - Entity identifier
 * @returns {Promise<boolean>} Success status
 */
export async function invalidateEntityCache(prefix, identifier) {
  try {
    // Delete specific key
    const specificKey = generateCacheKey(prefix, identifier);
    await deleteFromCache(specificKey);
    
    // Delete pattern-based keys (e.g., listings list)
    const pattern = `${prefix}:*`;
    await deleteCacheByPattern(pattern);
    
    return true;
  } catch (error) {
    console.error(`Cache invalidation error for ${prefix}:${identifier}:`, error.message);
    return false;
  }
}

/**
 * Clear all cache (use with caution)
 * @returns {Promise<boolean>} Success status
 */
export async function clearAllCache() {
  try {
    await redisClient.flushdb();
    return true;
  } catch (error) {
    console.error('Cache clear all error:', error.message);
    return false;
  }
}

/**
 * Express middleware for caching GET requests
 * @param {object} options - Caching options
 * @param {number} options.ttl - Time to live in seconds
 * @param {function} options.keyGenerator - Custom key generator function
 * @param {function} options.shouldCache - Function to determine if response should be cached
 * @returns {function} Express middleware
 */
export function cacheMiddleware(options = {}) {
  const {
    ttl = DEFAULT_TTL,
    keyGenerator,
    shouldCache = () => true,
  } = options;

  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Check if response should be cached
    if (!shouldCache(req)) {
      return next();
    }

    // Generate cache key
    let cacheKey;
    if (keyGenerator) {
      cacheKey = keyGenerator(req);
    } else {
      // Default key generation
      const prefix = req.route?.path?.replace(/^\//, '').replace(/\//g, ':') || 'api';
      const identifier = req.params.id || req.user?.id || 'all';
      cacheKey = generateCacheKey(prefix, identifier, {
        role: req.user?.role,
        query: req.query,
      });
    }

    // Try to get from cache
    const cachedData = await getFromCache(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = function (data) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setInCache(cacheKey, data, ttl).catch((err) => {
          console.error('Error caching response:', err);
        });
      }
      return originalJson(data);
    };

    next();
  };
}

// Export TTL constants for use in other modules
export const CACHE_TTL = {
  SHORT: SHORT_TTL,
  DEFAULT: DEFAULT_TTL,
  LONG: LONG_TTL,
};
