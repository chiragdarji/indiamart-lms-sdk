// IndiaMART LMS CRM Integration v2 – Minimal Node.js client
// Docs reference (endpoint pattern): https://mapi.indiamart.com/wservce/crm/crmListing/v2/?glusr_crm_key=...
// Usage example is at the bottom of this file.

import { IndiaMartErrorHandler, IndiaMartError } from './error-handler.js';
import { IndiaMartComplianceManager } from './api-compliance.js';
import { IndiaMartResponseHandler } from './response-handler.js';
import { FileStorageManager } from './file-storage-manager.js';
import { DateComplianceManager } from './date-compliance.js';

/**
 * Lightweight client for IndiaMART Lead Manager (LMS) CRM Integration v2.
 *
 * Notes:
 * - Endpoint (v2): `https://mapi.indiamart.com/wservce/crm/crmListing/v2/`
 * - Auth: via `glusr_crm_key` query param (seller portal → generate CRM key).
 * - Common params:
 *    - start_time: `DD-MMM-YYYY HH:mm:ss` (e.g., `01-JAN-2025 00:00:00`)
 *    - end_time:   `DD-MMM-YYYY HH:mm:ss`
 *    - page: number (optional; if your account supports pagination)
 * - Response shape typically contains: CODE, MESSAGE, TOTAL_RECORDS, RESPONSE (array of leads)
 *   Lead fields often include: SENDER_NAME, SENDER_MOBILE, SENDER_EMAIL, SENDER_COMPANY,
 *   SENDER_ADDRESS, SENDER_CITY, SENDER_STATE, QUERY_PRODUCT_NAME, ENQ_MESSAGE or QUERY_MESSAGE,
 *   UNIQUE_QUERY_ID or QUERY_ID, etc. Treat keys as case-sensitive.
 *
 * Tested on Node.js ≥18 (built-in fetch). If you're on Node 16, install `node-fetch` and swap fetch calls.
 */

const DEFAULT_BASE_URL = "https://mapi.indiamart.com/wservce/crm/crmListing/v2/";

export class IndiaMartClient {
  /**
   * @param {object} opts
   * @param {string} opts.crmKey - Your IndiaMART CRM key.
   * @param {string} [opts.baseUrl] - Override base URL (mainly for testing).
   * @param {number} [opts.timeoutMs=30000] - Request timeout in milliseconds.
   */
  constructor({ crmKey, baseUrl = DEFAULT_BASE_URL, timeoutMs = 30000, errorHandler = null, complianceManager = null, responseHandler = null, useFileStorage = true, fileStorageOptions = {} }) {
    if (!crmKey) throw new Error("crmKey is required");
    this.crmKey = crmKey;
    this.baseUrl = baseUrl.replace(/\/?$/, "/").replace(/\/\/$/, "/"); // ensure trailing slash once
    this.timeoutMs = timeoutMs;
    this.errorHandler = errorHandler || new IndiaMartErrorHandler();
    this.complianceManager = complianceManager || new IndiaMartComplianceManager();
    this.dateComplianceManager = new DateComplianceManager();
    this.responseHandler = responseHandler || new IndiaMartResponseHandler();
    this.useFileStorage = useFileStorage;
    this.fileStorageManager = useFileStorage ? new FileStorageManager(fileStorageOptions) : null;
    this.isInitialized = false;
  }

  /**
   * Initialize the file storage
   */
  async initialize() {
    if (!this.isInitialized) {
      // Initialize file storage if enabled
      if (this.useFileStorage && this.fileStorageManager) {
        await this.fileStorageManager.initialize();
        console.log('✅ File storage initialized');
      }
      
      this.isInitialized = true;
      console.log('✅ IndiaMART client initialized');
    }
  }

  /**
   * Get leads from IndiaMART API
   * @param {object} opts - Options for the API call
   * @param {string} opts.startTime - Start time in DD-MMM-YYYY HH:mm:ss format
   * @param {string} opts.endTime - End time in DD-MMM-YYYY HH:mm:ss format
   * @param {number} [opts.page] - Page number for pagination
   * @param {AbortSignal} [opts.signal] - Abort signal for cancellation
   * @param {number} [opts.maxRetries=3] - Maximum number of retries
   * @param {string} [opts.dateFormat='timestamp'] - Date format to use
   * @returns {Promise<object>} API response with leads data
   */
  async getLeads(opts = {}) {
    const { startTime, endTime, page, signal, maxRetries = 3, dateFormat = 'timestamp' } = opts;
    let attemptCount = 0;

    // Validate required parameters
    if (!startTime || !endTime) {
      throw new IndiaMartError('startTime and endTime are required', 'INVALID_PARAMETERS');
    }

    // Skip date format validation as it will be handled by date compliance check

    // Check date compliance
    const complianceCheck = this.complianceManager.validateDateRange(startTime, endTime);
    if (!complianceCheck.isValid) {
      throw new IndiaMartError(`Date compliance error: ${complianceCheck.errors.join(', ')}`, 'DATE_COMPLIANCE_ERROR');
    }

    const startTimeMs = Date.now();
    
    while (attemptCount < maxRetries) {
      try {
        console.log(`🔄 API Call Attempt ${attemptCount}/${maxRetries}`);
        console.log(`   Start Time: ${startTime}`);
        console.log(`   End Time: ${endTime}`);
        console.log(`   Date Format: ${dateFormat}`);
        
        // Build URL with query parameters
        const url = new URL(this.baseUrl);
        url.searchParams.set('glusr_crm_key', this.crmKey);
        url.searchParams.set('start_time', startTime);
        url.searchParams.set('end_time', endTime);
        if (page) {
          url.searchParams.set('page', page.toString());
        }

        console.log(`📡 Making request to: ${url.toString().replace(this.crmKey, '[REDACTED]')}`);

        // Make the API call
        const response = await fetch(url.toString(), {
          method: 'GET',
          signal,
          timeout: this.timeoutMs,
          headers: {
            'User-Agent': 'IndiaMART-Client/1.0.0',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        const responseTime = Date.now() - startTimeMs;
        console.log(`📡 Raw API Response:`, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers ? Object.fromEntries(response.headers.entries()) : 'No headers',
          dataLength: response.headers?.get('content-length') || 'Unknown',
          hasData: response.body !== null
        });

        // Process the response
        const result = await this.responseHandler.processResponse(response, responseTime);
        console.log(`🔍 Response Processing:`, {
          success: result.success,
          hasData: !!result.data,
          dataKeys: result.data ? Object.keys(result.data) : [],
          error: result.error
        });

        if (result.success) {
          console.log(`✅ API Call Successful`);
          console.log(`   Response Time: ${responseTime}ms`);
          console.log(`   Total Records: ${result.totalRecords || 0}`);
          console.log(`   Leads Count: ${result.leads?.length || 0}`);

          // Store leads to file if file storage is enabled
          if (this.useFileStorage && this.fileStorageManager && result.leads?.length > 0) {
            try {
              const downloadPath = await this.fileStorageManager.storeLeads(result.leads, {
                startTime,
                endTime,
                totalRecords: result.totalRecords
              });
              console.log(`💾 Leads stored to: ${downloadPath}`);
              result.downloadPath = downloadPath;
            } catch (storageError) {
              console.warn(`⚠️ Failed to store leads: ${storageError.message}`);
            }
          }

          return result;
        } else {
          console.log(`❌ API Call Failed:`, {
            error: result.error,
            statusCode: result.statusCode,
            hasData: !!result.data,
            dataKeys: result.data ? Object.keys(result.data) : []
          });

          // Check if this is a retryable error
        if (this.errorHandler.isRetryableError(result.statusCode, result.error)) {
          attemptCount++;
          if (attemptCount < maxRetries) {
            const delay = this.errorHandler.getRetryDelay({ code: result.statusCode }, attemptCount);
            console.log(`⏳ Retrying in ${delay}ms... (attempt ${attemptCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }

          throw new IndiaMartError(result.error, result.statusCode);
        }
      } catch (error) {
        const responseTime = Date.now() - startTimeMs;
        console.log(`❌ getLeads Error (${error.code || 'UNKNOWN'}): ${error.message}`);
        
        if (error.code === 'ABORT_ERR') {
          console.log('🚫 Request was aborted');
          throw error;
        }

        if (this.errorHandler.isRetryableError(error.statusCode, error.message)) {
          attemptCount++;
          if (attemptCount < maxRetries) {
            const delay = this.errorHandler.getRetryDelay({ code: error.statusCode }, attemptCount);
            console.log(`⏳ Retrying in ${delay}ms... (attempt ${attemptCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }

        console.log(`💡 Suggestion: ${this.errorHandler.getSuggestion(error.code, error.message)}`);
        console.log(`❌ Not retrying: ${this.errorHandler.getSuggestion(error.code, error.message)}`);
        throw error;
      }
    }

    throw new IndiaMartError(`Failed after ${maxRetries} attempts`, 'MAX_RETRIES_EXCEEDED');
  }

  /**
   * Get leads for a specific date range
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @param {object} options - Additional options
   * @returns {Promise<object>} API response with leads data
   */
  async getLeadsForDateRange(startDate, endDate, options = {}) {
    const startTime = this.dateComplianceManager.formatDateForAPI(startDate, 'timestamp');
    const endTime = this.dateComplianceManager.formatDateForAPI(endDate, 'timestamp');
    
    return await this.getLeads({
      startTime,
      endTime,
      ...options
    });
  }

  /**
   * Get leads for today
   * @param {object} options - Additional options
   * @returns {Promise<object>} API response with leads data
   */
  async getLeadsForToday(options = {}) {
    const today = new Date();
    const startTime = this.dateComplianceManager.formatDateForAPI(today, 'timestamp');
    const endTime = this.dateComplianceManager.formatDateForAPI(today, 'timestamp');
    
    return await this.getLeads({
      startTime,
      endTime,
      ...options
    });
  }

  /**
   * Get leads for yesterday
   * @param {object} options - Additional options
   * @returns {Promise<object>} API response with leads data
   */
  async getLeadsForYesterday(options = {}) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startTime = this.dateComplianceManager.formatDateForAPI(yesterday, 'timestamp');
    const endTime = this.dateComplianceManager.formatDateForAPI(yesterday, 'timestamp');
    
    return await this.getLeads({
      startTime,
      endTime,
      ...options
    });
  }

  /**
   * Static method to format timestamp (for backward compatibility)
   * @param {Date|string} date - Date to format
   * @param {boolean} useLocalTime - Whether to use local time instead of UTC
   * @returns {string} Formatted timestamp
   */
  static formatTimestamp(date, useLocalTime = false) {
    // If it's already a string, check if it looks like a valid date format
    if (typeof date === 'string') {
      // Check if it's already in the expected format (DD-MM-YYYY HH:MM:SS)
      const dateFormatRegex = /^\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2}$/;
      if (dateFormatRegex.test(date)) {
        return date;
      }
      
      // Try to parse as a date
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        throw new Error('Invalid date for start_time/end_time');
      }
      return date;
    }
    
    // If it's an invalid date, throw error
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date for start_time/end_time');
    }
    
    // Format as DD-MM-YYYY HH:MM:SS
    const pad = (n) => String(n).padStart(2, "0");
    
    if (useLocalTime) {
      // Use local time
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      
      return `${pad(day)}-${pad(month)}-${year} ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    } else {
      // Use UTC time
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth() + 1;
      const day = date.getUTCDate();
      const hours = date.getUTCHours();
      const minutes = date.getUTCMinutes();
      const seconds = date.getUTCSeconds();
      
      return `${pad(day)}-${pad(month)}-${year} ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
  }

  /**
   * Static method to validate date range (for backward compatibility)
   * @param {Date|string} startDate - Start date
   * @param {Date|string} endDate - End date
   * @returns {object} Validation result
   */
  static validateDateRange(startDate, endDate) {
    const dateComplianceManager = new DateComplianceManager();
    return dateComplianceManager.validateDateRange(startDate, endDate);
  }

  /**
   * Build URL with query parameters (for backward compatibility)
   * @param {object} params - Query parameters
   * @returns {string} Built URL
   */
  buildUrl(params = {}) {
    const url = new URL(this.baseUrl);
    url.searchParams.set('glusr_crm_key', this.crmKey);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value.toString());
      }
    });
    return url.toString();
  }
}

// Example usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const client = new IndiaMartClient({
    crmKey: process.env.INDIAMART_CRM_KEY || 'your-crm-key-here',
    useFileStorage: true,
    fileStorageOptions: {
      downloadPath: './downloads'
    }
  });

  try {
    await client.initialize();
    
    // Get leads for yesterday
    const result = await client.getLeadsForYesterday();
    console.log('Leads fetched:', result.leads?.length || 0);
    console.log('Download path:', result.downloadPath);
  } catch (error) {
    console.error('Error:', error.message);
  }
}
