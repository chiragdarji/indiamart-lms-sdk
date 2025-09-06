/**
 * Cache Manager - High-performance caching for API responses and computed values
 * 
 * This module provides LRU caching with TTL support for improving performance
 * and reducing API calls.
 */

/**
 * Cache entry
 */
class CacheEntry {
  constructor(key, value, ttl = 300000) { // 5 minutes default TTL
    this.key = key;
    this.value = value;
    this.createdAt = Date.now();
    this.ttl = ttl;
    this.accessCount = 0;
    this.lastAccessed = Date.now();
  }

  isExpired() {
    return Date.now() - this.createdAt > this.ttl;
  }

  touch() {
    this.accessCount++;
    this.lastAccessed = Date.now();
  }
}

/**
 * LRU Cache Manager
 */
export class CacheManager {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000;
    this.defaultTTL = options.defaultTTL || 300000; // 5 minutes
    this.cleanupInterval = options.cleanupInterval || 60000; // 1 minute
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0
    };

    // Start cleanup interval
    this.startCleanup();
  }

  /**
   * Generate cache key
   * @param {string} prefix - Key prefix
   * @param {object} params - Parameters to include in key
   * @returns {string} Generated cache key
   */
  generateKey(prefix, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    
    return `${prefix}:${sortedParams}`;
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {any} Cached value or null
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (entry.isExpired()) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.size = this.cache.size;
      return null;
    }

    entry.touch();
    this.stats.hits++;
    return entry.value;
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  set(key, value, ttl = this.defaultTTL) {
    // Remove existing entry if it exists
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Check if we need to evict entries
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const entry = new CacheEntry(key, value, ttl);
    this.cache.set(key, entry);
    this.stats.size = this.cache.size;
  }

  /**
   * Evict least recently used entry
   */
  evictLRU() {
    let lruKey = null;
    let lruTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      this.stats.evictions++;
      this.stats.size = this.cache.size;
    }
  }

  /**
   * Delete entry from cache
   * @param {string} key - Cache key
   */
  delete(key) {
    if (this.cache.delete(key)) {
      this.stats.size = this.cache.size;
    }
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
    this.stats.size = 0;
  }

  /**
   * Check if key exists in cache
   * @param {string} key - Cache key
   * @returns {boolean} True if key exists and is not expired
   */
  has(key) {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (entry.isExpired()) {
      this.cache.delete(key);
      this.stats.size = this.cache.size;
      return false;
    }

    return true;
  }

  /**
   * Get cache statistics
   * @returns {object} Cache statistics
   */
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
    const missRate = totalRequests > 0 ? (this.stats.misses / totalRequests) * 100 : 0;
    
    // Ensure all values are valid numbers
    const safeHitRate = isNaN(hitRate) ? 0 : Math.round(hitRate * 100) / 100;
    const safeMissRate = isNaN(missRate) ? 0 : Math.round(missRate * 100) / 100;
    const safeTotalRequests = isNaN(totalRequests) ? 0 : totalRequests;

    return {
      hits: this.stats.hits || 0,
      misses: this.stats.misses || 0,
      evictions: this.stats.evictions || 0,
      size: this.stats.size || 0,
      hitRate: safeHitRate,
      missRate: safeMissRate,
      totalRequests: safeTotalRequests,
      memoryUsage: this.calculateMemoryUsage()
    };
  }

  /**
   * Calculate memory usage in MB
   * @returns {number} Memory usage in MB
   */
  calculateMemoryUsage() {
    try {
      if (process.memoryUsage) {
        const memUsage = process.memoryUsage();
        return Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100; // MB
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.isExpired()) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    this.stats.size = this.cache.size;
    return cleaned;
  }

  /**
   * Start cleanup interval
   */
  startCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  /**
   * Stop cleanup interval
   */
  stopCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Cache API response
   * @param {string} endpoint - API endpoint
   * @param {object} params - Request parameters
   * @param {any} response - API response
   * @param {number} ttl - Time to live
   */
  cacheApiResponse(endpoint, params, response, ttl = this.defaultTTL) {
    const key = this.generateKey(`api:${endpoint}`, params);
    this.set(key, response, ttl);
  }

  /**
   * Get cached API response
   * @param {string} endpoint - API endpoint
   * @param {object} params - Request parameters
   * @returns {any} Cached response or null
   */
  getCachedApiResponse(endpoint, params) {
    const key = this.generateKey(`api:${endpoint}`, params);
    return this.get(key);
  }

  /**
   * Cache computed value
   * @param {string} operation - Operation name
   * @param {object} params - Operation parameters
   * @param {any} result - Computed result
   * @param {number} ttl - Time to live
   */
  cacheComputedValue(operation, params, result, ttl = this.defaultTTL) {
    const key = this.generateKey(`computed:${operation}`, params);
    this.set(key, result, ttl);
  }

  /**
   * Get cached computed value
   * @param {string} operation - Operation name
   * @param {object} params - Operation parameters
   * @returns {any} Cached result or null
   */
  getCachedComputedValue(operation, params) {
    const key = this.generateKey(`computed:${operation}`, params);
    return this.get(key);
  }

  /**
   * Invalidate cache entries by pattern
   * @param {string} pattern - Pattern to match
   */
  invalidatePattern(pattern) {
    const regex = new RegExp(pattern);
    let invalidated = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    this.stats.size = this.cache.size;
    return invalidated;
  }

  /**
   * Get all cache keys
   * @returns {Array} Array of cache keys
   */
  getKeys() {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size
   * @returns {number} Number of entries in cache
   */
  size() {
    return this.cache.size;
  }

  /**
   * Destroy cache and cleanup
   */
  destroy() {
    this.stopCleanup();
    this.clear();
  }
}

/**
 * Default cache instance
 */
export const defaultCache = new CacheManager({
  maxSize: 1000,
  defaultTTL: 300000, // 5 minutes
  cleanupInterval: 60000 // 1 minute
});
