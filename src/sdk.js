/**
 * IndiaMART LMS SDK - Simplified API for IndiaMART Lead Management System
 * 
 * This is a simplified wrapper around the IndiaMART LMS client that abstracts
 * most of the complexity and provides an easy-to-use API requiring only a CRM key.
 * 
 * Features:
 * - Simple API requiring only CRM key
 * - Automatic JSON file download
 * - Built-in error handling and retry logic
 * - Rate limiting compliance
 */

import { IndiaMartClient } from './indiamart-client.js';
import { APILogger } from './api-logger.js';
import { RateLimiter } from './rate-limiter.js';
import { DateComplianceManager } from './date-compliance.js';
import { InputValidator, VALIDATION_SCHEMAS } from './input-validator.js';
import { SecureLogger, LOG_LEVELS } from './secure-logger.js';
import { CacheManager } from './cache-manager.js';
import path from 'path';

/**
 * Simplified IndiaMART SDK for easy integration
 * 
 * @example
 * ```javascript
 * import { IndiaMartSDK } from 'indiamart-lms-sdk';
 * 
 * const sdk = new IndiaMartSDK('your-crm-key');
 * const leads = await sdk.getLeadsForToday();
 * ```
 */
export class IndiaMartSDK {
  /**
   * Create a new IndiaMART SDK instance
   * 
   * @param {string} crmKey - Your IndiaMART CRM key (required)
   * @param {object} options - Optional configuration
   * @param {number} options.timeoutMs - Request timeout in milliseconds (default: 30000)
   * @param {string} options.baseUrl - Override base URL (mainly for testing)
   * @param {string} options.downloadPath - Path to save JSON files (default: './downloads')
   * @param {string} options.logPath - Path to save logs (default: './logs')
   * @param {object} options.paths - Comprehensive path configuration
   * @param {string} options.paths.downloadPath - Path to save JSON files (default: './downloads')
   * @param {string} options.paths.logPath - Path to save logs (default: './logs')
   * @param {string} options.paths.apiLogFile - API log filename (default: 'api-logs.json')
   * @param {string} options.paths.rateLimitFile - Rate limit filename (default: 'rate-limits.json')
   * @param {string} options.paths.dataPath - Data storage path (default: './data')
   * @param {string} options.paths.leadsPath - Leads storage path (default: './data/leads')
   * @param {string} options.paths.processedPath - Processed leads path (default: './data/processed')
   * @param {string} options.paths.failedPath - Failed leads path (default: './data/failed')
   */
  constructor(crmKey, options = {}) {
    // Validate CRM key
    const keyValidation = InputValidator.validateApiKey(crmKey);
    if (!keyValidation.isValid) {
      throw new Error(`Invalid CRM key: ${keyValidation.errors.join(', ')}`);
    }

    this.crmKey = keyValidation.value;
    
    // Support both old format and new comprehensive path configuration
    const paths = options.paths || {};
    this.options = {
      timeoutMs: 30000,
      baseUrl: undefined,
      downloadPath: options.downloadPath || paths.downloadPath || './downloads',
      logPath: options.logPath || paths.logPath || './logs',
      paths: {
        downloadPath: options.downloadPath || paths.downloadPath || './downloads',
        logPath: options.logPath || paths.logPath || './logs',
        apiLogFile: paths.apiLogFile || 'api-logs.json',
        rateLimitFile: paths.rateLimitFile || 'rate-limits.json',
        dataPath: paths.dataPath || './data',
        leadsPath: paths.leadsPath || './data/leads',
        processedPath: paths.processedPath || './data/processed',
        failedPath: paths.failedPath || './data/failed'
      },
      ...options
    };

    // Initialize secure logging, rate limiting, and date compliance with configurable paths
    this.secureLogger = new SecureLogger({
      logFile: path.join(this.options.paths.logPath, 'secure-sdk.log'),
      enableConsole: process.env.NODE_ENV === 'development',
      logLevel: process.env.LOG_LEVEL ? parseInt(process.env.LOG_LEVEL) : LOG_LEVELS.INFO
    });
    
    this.apiLogger = new APILogger({
      logDirectory: this.options.paths.logPath,
      apiLogsFile: this.options.paths.apiLogFile,
      rateLimitFile: this.options.paths.rateLimitFile
    });
    
    this.rateLimiter = new RateLimiter({
      logDirectory: this.options.paths.logPath,
      rateLimitFile: this.options.paths.rateLimitFile
    });
    
    this.dateCompliance = new DateComplianceManager();
    
    // Initialize cache manager
    this.cache = new CacheManager({
      maxSize: 1000,
      defaultTTL: 300000, // 5 minutes
      cleanupInterval: 60000 // 1 minute
    });

    // Initialize the underlying client with configurable file storage paths
    this.client = new IndiaMartClient({
      crmKey: this.crmKey,
      baseUrl: this.options.baseUrl,
      timeoutMs: this.options.timeoutMs,
      useDatabase: false,
      useFileStorage: true,
      fileStorageOptions: {
        baseDir: this.options.paths.dataPath,
        leadsDir: this.options.paths.leadsPath,
        processedDir: this.options.paths.processedPath,
        failedDir: this.options.paths.failedPath
      }
    });

    this.isInitialized = false;
  }

  /**
   * Initialize the SDK (optional - will be called automatically on first use)
   */
  async initialize() {
    if (!this.isInitialized) {
      await this.client.initialize();
      
      // Ensure download directory exists
      await this.ensureDownloadDirectory();
      
      this.isInitialized = true;
    }
  }

  /**
   * Ensure download directory exists
   */
  async ensureDownloadDirectory() {
    const fs = await import('fs');
    const path = await import('path');
    
    try {
      if (!fs.existsSync(this.options.downloadPath)) {
        fs.mkdirSync(this.options.downloadPath, { recursive: true });
        console.log(`📁 Created download directory: ${this.options.downloadPath}`);
      }
    } catch (error) {
      console.warn(`⚠️  Could not create download directory: ${error.message}`);
    }
  }

  /**
   * Get leads for today and download as JSON file
   * 
   * @returns {Promise<object>} Leads data with success status, leads array, and download info
   * @example
   * ```javascript
   * const result = await sdk.getLeadsForToday();
   * if (result.success) {
   *   console.log(`Found ${result.leads.length} leads today`);
   *   console.log(`Downloaded to: ${result.downloadPath}`);
   * }
   * ```
   */
  async getLeadsForToday() {
    await this.initialize();
    
    // Use compliance manager for date range
    const dateRange = this.dateCompliance.getTodayRange();
    
    if (!dateRange.compliance.isValid) {
      return {
        success: false,
        error: `Date compliance error: ${dateRange.compliance.errors.join(', ')}`,
        code: 400,
        leads: [],
        raw: null,
        downloadPath: null
      };
    }
    
    return await this.getLeadsForDateRange(dateRange.startDate, dateRange.endDate);
  }

  /**
   * Get leads for yesterday and download as JSON file
   * 
   * @returns {Promise<object>} Leads data with success status, leads array, and download info
   */
  async getLeadsForYesterday() {
    await this.initialize();
    
    // Use compliance manager for date range
    const dateRange = this.dateCompliance.getYesterdayRange();
    
    if (!dateRange.compliance.isValid) {
      return {
        success: false,
        error: `Date compliance error: ${dateRange.compliance.errors.join(', ')}`,
        code: 400,
        leads: [],
        raw: null,
        downloadPath: null
      };
    }
    
    return await this.getLeadsForDateRange(dateRange.startDate, dateRange.endDate);
  }

  /**
   * Get leads for a specific date and download as JSON file
   * 
   * @param {Date|string} date - The date to fetch leads for
   * @returns {Promise<object>} Leads data with success status, leads array, and download info
   * @example
   * ```javascript
   * const result = await sdk.getLeadsForDate('2024-01-15');
   * ```
   */
  async getLeadsForDate(date) {
    await this.initialize();
    
    // Use compliance manager for date range
    const dateRange = this.dateCompliance.getDateRange(date);
    
    if (!dateRange.compliance.isValid) {
      return {
        success: false,
        error: `Date compliance error: ${dateRange.compliance.errors.join(', ')}`,
        code: 400,
        leads: [],
        raw: null,
        downloadPath: null
      };
    }
    
    return await this.getLeadsForDateRange(dateRange.startDate, dateRange.endDate);
  }

  /**
   * Get leads for a date range and download as JSON file
   * 
   * @param {Date|string} startDate - Start date
   * @param {Date|string} endDate - End date
   * @returns {Promise<object>} Leads data with success status, leads array, and download info
   * @example
   * ```javascript
   * const result = await sdk.getLeadsForDateRange('2024-01-01', '2024-01-07');
   * ```
   */
  async getLeadsForDateRange(startDate, endDate) {
    try {
      await this.initialize();

      // Validate input parameters
      const startValidation = InputValidator.validateDate(startDate);
      const endValidation = InputValidator.validateDate(endDate);
      
      if (!startValidation.isValid || !endValidation.isValid) {
        const errors = [...startValidation.errors, ...endValidation.errors];
        await this.secureLogger.error('Invalid date parameters', { startDate, endDate, errors });
        return {
          success: false,
          error: `Invalid date parameters: ${errors.join(', ')}`,
          code: 400,
          leads: [],
          raw: null,
          downloadPath: null
        };
      }

      // Enforce date compliance - non-configurable
      const compliance = this.dateCompliance.validateDateRange(startValidation.value, endValidation.value);
      if (!compliance.isValid) {
        await this.secureLogger.warn('Date compliance error', { 
          startDate: startValidation.value, 
          endDate: endValidation.value, 
          errors: compliance.errors 
        });
        return {
          success: false,
          error: `Date compliance error: ${compliance.errors.join(', ')}`,
          code: 400,
          leads: [],
          raw: null,
          downloadPath: null,
          compliance: compliance
        };
      }

      // Check cache first
      const cacheKey = this.cache.generateKey('leads', { 
        startDate: startValidation.value.toISOString(), 
        endDate: endValidation.value.toISOString() 
      });
      
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        await this.secureLogger.debug('Cache hit for leads request', { cacheKey });
        return cachedResult;
      }

      const startTime = Date.now();
      let result = null;
      let success = false;
      let error = null;

      try {
        // Check rate limits before making API call
        const rateLimitCheck = this.rateLimiter.canMakeCall();
        if (!rateLimitCheck.allowed) {
          await this.secureLogger.warn('Rate limit exceeded', { 
            retryAfter: rateLimitCheck.retryAfter,
            message: rateLimitCheck.message 
          });
          throw new Error(`Rate limit exceeded: ${rateLimitCheck.message}`);
        }

        // Format dates for IndiaMART API (IST timezone)
        const formattedStartDate = this.dateCompliance.formatDateForAPI(startValidation.value, 'timestamp');
        const formattedEndDate = this.dateCompliance.formatDateForAPI(endValidation.value, 'timestamp');

        await this.secureLogger.debug('Making API call', { 
          startDate: formattedStartDate, 
          endDate: formattedEndDate 
        });

        // Make API call
        result = await this.client.getLeads({
          startTime: formattedStartDate,
          endTime: formattedEndDate
        });

        success = true;

        // Record successful API call
        this.rateLimiter.recordCall(true);

        // Download JSON file if leads are found (no deduplication)
        let downloadPath = null;
        if (result.leads && result.leads.length > 0) {
          downloadPath = await this.downloadLeadsAsJSON(result.leads, startValidation.value, endValidation.value);
        }

        const responseData = {
          success: true,
          code: result.code,
          message: result.message,
          totalRecords: result.totalRecords,
          leads: result.leads || [],
          raw: result.raw,
          downloadPath: downloadPath,
          compliance: compliance
        };

        // Cache successful response
        this.cache.set(cacheKey, responseData, 300000); // 5 minutes TTL

        // Log API call securely
        await this.secureLogger.info('API call successful', {
          method: 'GET',
          url: 'IndiaMART API',
          statusCode: result.code || 200,
          responseTime: Date.now() - startTime,
          leadsCount: result.leads?.length || 0,
          totalRecords: result.totalRecords || 0
        });

        await this.apiLogger.logAPICall({
          method: 'GET',
          url: 'IndiaMART API',
          statusCode: result.code || 200,
          responseTime: Date.now() - startTime,
          success: true,
          leadsCount: result.leads?.length || 0,
          totalRecords: result.totalRecords || 0
        });

        return responseData;
      } catch (err) {
        error = err;
        success = false;

        // Record failed API call
        this.rateLimiter.recordCall(false);

        // Log API call failure securely
        await this.secureLogger.error('API call failed', {
          method: 'GET',
          url: 'IndiaMART API',
          statusCode: err.statusCode || 500,
          responseTime: Date.now() - startTime,
          error: err.message
        });

        await this.apiLogger.logAPICall({
          method: 'GET',
          url: 'IndiaMART API',
          statusCode: err.statusCode || 500,
          responseTime: Date.now() - startTime,
          success: false,
          error: err.message,
          leadsCount: 0,
          totalRecords: 0
        });

        return {
          success: false,
          error: err.message,
          code: err.statusCode || 500,
          leads: [],
          raw: null,
          downloadPath: null,
          compliance: compliance
        };
      }
    } catch (error) {
      await this.secureLogger.error('Unexpected error in getLeadsForDateRange', { 
        error: error.message,
        stack: error.stack 
      });
      
      return {
        success: false,
        error: 'Internal error occurred',
        code: 500,
        leads: [],
        raw: null,
        downloadPath: null
      };
    }
  }

  /**
   * Download leads as JSON file (without deduplication)
   * 
   * @param {Array} leads - Array of leads to download
   * @param {Date|string} startDate - Start date for filename
   * @param {Date|string} endDate - End date for filename
   * @returns {Promise<string>} Path to downloaded JSON file
   */
  async downloadLeadsAsJSON(leads, startDate, endDate) {
    const fs = await import('fs');
    const path = await import('path');
    
    try {
      // Create filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const startStr = new Date(startDate).toISOString().split('T')[0];
      const endStr = new Date(endDate).toISOString().split('T')[0];
      const filename = `leads_${startStr}_to_${endStr}_${timestamp}.json`;
      const filePath = path.join(this.options.downloadPath, filename);
      
      // Prepare data for download (no deduplication)
      const downloadData = {
        metadata: {
          downloadTime: new Date().toISOString(),
          startDate: startStr,
          endDate: endStr,
          totalLeads: leads.length,
          sdkVersion: '1.0.0',
          deduplication: false, // Explicitly mark as no deduplication
          apiCallId: `call_${timestamp}`
        },
        leads: leads // Store all leads without any deduplication
      };
      
      // Write JSON file
      fs.writeFileSync(filePath, JSON.stringify(downloadData, null, 2));
      
      console.log(`📁 Downloaded ${leads.length} leads to: ${filePath} (no deduplication)`);
      return filePath;
      
    } catch (error) {
      console.error('❌ Failed to download JSON file:', error.message);
      return null;
    }
  }

  /**
   * Get leads for the last N days and download as JSON file
   * 
   * @param {number} days - Number of days to look back
   * @returns {Promise<object>} Leads data with success status, leads array, and download info
   * @example
   * ```javascript
   * const result = await sdk.getLeadsForLastDays(7); // Last 7 days
   * ```
   */
  async getLeadsForLastDays(days) {
    await this.initialize();
    
    // Use compliance manager for date range (enforces 7-day limit)
    const dateRange = this.dateCompliance.getLastDaysRange(days);
    
    if (!dateRange.compliance.isValid) {
      return {
        success: false,
        error: `Date compliance error: ${dateRange.compliance.errors.join(', ')}`,
        code: 400,
        leads: [],
        raw: null,
        downloadPath: null,
        compliance: dateRange.compliance
      };
    }
    
    return await this.getLeadsForDateRange(dateRange.startDate, dateRange.endDate);
  }

  /**
   * Get leads with custom parameters and download as JSON file (advanced usage)
   * 
   * @param {object} params - Custom parameters
   * @param {Date|string} params.startTime - Start time
   * @param {Date|string} params.endTime - End time
   * @param {number} params.page - Page number
   * @param {string} params.dateFormat - Date format ('date' or 'timestamp')
   * @returns {Promise<object>} Leads data with success status, leads array, and download info
   * @example
   * ```javascript
   * const result = await sdk.getLeads({
   *   startTime: '2024-01-01',
   *   endTime: '2024-01-02',
   *   page: 1
   * });
   * ```
   */
  async getLeads(params = {}) {
    await this.initialize();
    
    try {
      const result = await this.client.getLeads(params);

      // Download JSON file if leads are found
      let downloadPath = null;
      if (result.leads && result.leads.length > 0) {
        downloadPath = await this.downloadLeadsAsJSON(result.leads, params.startTime, params.endTime);
      }

      return {
        success: true,
        code: result.code,
        message: result.message,
        totalRecords: result.totalRecords,
        leads: result.leads || [],
        raw: result.raw,
        downloadPath: downloadPath
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.statusCode || 500,
        leads: [],
        raw: null,
        downloadPath: null
      };
    }
  }

  /**
   * Get download directory path
   * 
   * @returns {string} Current download directory path
   */
  getDownloadPath() {
    return this.options.downloadPath;
  }

  /**
   * Set download directory path
   * 
   * @param {string} path - New download directory path
   */
  setDownloadPath(path) {
    this.options.downloadPath = path;
  }

  /**
   * Get API logs
   * 
   * @param {number} limit - Number of recent logs to return (default: 50)
   * @returns {Array} Array of API logs
   */
  getAPILogs(limit = 50) {
    return this.apiLogger.getAPILogs(limit);
  }

  /**
   * Get rate limit status
   * 
   * @returns {object} Current rate limit status
   */
  getRateLimitStatus() {
    return this.rateLimiter.getStatus();
  }

  /**
   * Get API statistics
   * 
   * @returns {object} API statistics
   */
  getAPIStats() {
    return this.apiLogger.getAPIStats();
  }

  /**
   * Get rate limit statistics
   * 
   * @returns {object} Rate limit statistics
   */
  getRateLimitStats() {
    return this.rateLimiter.getStats();
  }

  /**
   * Clear old logs (older than 30 days)
   */
  clearOldLogs() {
    this.apiLogger.clearOldLogs();
  }

  /**
   * Reset rate limits (for testing)
   */
  async resetRateLimits() {
    try {
      await this.rateLimiter.reset();
      await this.secureLogger.info('Rate limits reset');
      return {
        success: true,
        message: 'Rate limits reset successfully'
      };
    } catch (error) {
      await this.secureLogger.error('Failed to reset rate limits', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get cache statistics
   * @returns {object} Cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Clear cache
   * @param {string} pattern - Optional pattern to clear specific cache entries
   * @returns {Promise<object>} Clear result
   */
  async clearCache(pattern = null) {
    try {
      if (pattern) {
        const cleared = this.cache.invalidatePattern(pattern);
        await this.secureLogger.info('Cache cleared by pattern', { pattern, cleared });
        return {
          success: true,
          message: `Cleared ${cleared} cache entries matching pattern: ${pattern}`
        };
      } else {
        this.cache.clear();
        await this.secureLogger.info('All cache cleared');
        return {
          success: true,
          message: 'All cache cleared successfully'
        };
      }
    } catch (error) {
      await this.secureLogger.error('Failed to clear cache', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get secure logs
   * @param {number} limit - Number of log entries to return
   * @returns {Promise<Array>} Log entries
   */
  async getSecureLogs(limit = 100) {
    try {
      return await this.secureLogger.getLogs(limit);
    } catch (error) {
      await this.secureLogger.error('Failed to get secure logs', { error: error.message });
      return [];
    }
  }

  /**
   * Clear old secure logs
   * @param {number} days - Number of days to keep
   * @returns {Promise<object>} Clear result
   */
  async clearOldSecureLogs(days = 30) {
    try {
      await this.secureLogger.clearOldLogs(days);
      await this.secureLogger.info('Old logs cleared', { days });
      return {
        success: true,
        message: `Cleared logs older than ${days} days`
      };
    } catch (error) {
      await this.secureLogger.error('Failed to clear old logs', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate input parameters
   * @param {any} input - Input to validate
   * @param {object} rules - Validation rules
   * @returns {object} Validation result
   */
  validateInput(input, rules) {
    return InputValidator.validateField(input, rules);
  }

  /**
   * Get SDK health status
   * @returns {Promise<object>} Health status
   */
  async getHealthStatus() {
    try {
      const cacheStats = this.cache.getStats();
      const rateLimitStatus = await this.rateLimiter.getStatus();
      
      return {
        success: true,
        status: 'healthy',
        components: {
          cache: {
            status: 'active',
            stats: cacheStats
          },
          rateLimiter: {
            status: rateLimitStatus.isBlocked ? 'blocked' : 'active',
            details: rateLimitStatus
          },
          logger: {
            status: 'active'
          },
          client: {
            status: this.client ? 'initialized' : 'not_initialized'
          }
        }
      };
    } catch (error) {
      await this.secureLogger.error('Health check failed', { error: error.message });
      return {
        success: false,
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Destroy SDK and cleanup resources
   * @returns {Promise<object>} Destroy result
   */
  async destroy() {
    try {
      // Stop cache cleanup
      this.cache.destroy();
      
      // Clear sensitive data
      this.crmKey = '[REDACTED]';
      
      await this.secureLogger.info('SDK destroyed and resources cleaned up');
      
      return {
        success: true,
        message: 'SDK destroyed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Format a date to IndiaMART-compatible format
   * 
   * @param {Date|string|number} date - Date to format
   * @param {string} format - Format type ('date' or 'timestamp')
   * @returns {string} Formatted date string
   * @example
   * ```javascript
   * const formatted = IndiaMartSDK.formatDate(new Date(), 'timestamp');
   * ```
   */
  static formatDate(date, format = 'timestamp') {
    return IndiaMartClient.formatTimestamp(date, false, format);
  }

  /**
   * Validate a date range for IndiaMART API
   * 
   * @param {Date|string} startDate - Start date
   * @param {Date|string} endDate - End date
   * @returns {object} Validation result
   * @example
   * ```javascript
   * const validation = IndiaMartSDK.validateDateRange('2024-01-01', '2024-01-02');
   * if (!validation.isValid) {
   *   console.log('Validation errors:', validation.errors);
   * }
   * ```
   */
  static validateDateRange(startDate, endDate) {
    return IndiaMartClient.validateDateRange(startDate, endDate);
  }
}

// Export the SDK as the default export
export default IndiaMartSDK;
