/**
 * IndiaMART API Compliance Manager
 * 
 * Handles all IndiaMART API compliance requirements including:
 * - 7-day maximum date range
 * - 5-minute minimum interval between calls
 * - 15-minute API key blocking protection
 * - 365-day data availability validation
 * - Special character handling in QUERY_MESSAGE
 */

export class IndiaMartComplianceManager {
  constructor(options = {}) {
    this.minIntervalMs = 5 * 60 * 1000; // 5 minutes minimum
    this.maxDateRangeMs = 7 * 24 * 60 * 60 * 1000; // 7 days maximum
    this.maxHistoricalDays = 365; // 365 days historical data
    this.maxCallsPerMinute = 5; // 5 calls per minute limit
    this.blockDurationMs = 15 * 60 * 1000; // 15 minutes block duration
    
    // Rate limiting tracking
    this.callHistory = [];
    this.lastCallTime = null;
    this.isBlocked = false;
    this.blockedUntil = null;
    
    // Configuration
    this.enableStrictMode = options.enableStrictMode !== false; // Default true
    this.ntpServers = options.ntpServers || [
      'time.google.com',
      'time1.google.com', 
      'time2.google.com',
      'time3.google.com',
      'time4.google.com'
    ];
    
    // Event handlers
    this.onViolation = options.onViolation || this.defaultViolationHandler;
    this.onBlocked = options.onBlocked || this.defaultBlockedHandler;
    this.onRecovered = options.onRecovered || this.defaultRecoveredHandler;
  }

  /**
   * Validate API call compliance before making request
   */
  validateCall(startTime, endTime) {
    const violations = [];

    // Check if currently blocked
    if (this.isBlocked) {
      if (Date.now() < this.blockedUntil) {
        const remainingMs = this.blockedUntil - Date.now();
        violations.push({
          type: 'API_KEY_BLOCKED',
          message: `API key is blocked for ${Math.ceil(remainingMs / 60000)} more minutes`,
          retryAfter: remainingMs
        });
      } else {
        // Block period expired
        this.isBlocked = false;
        this.blockedUntil = null;
        this.onRecovered('API key block expired');
      }
    }

    // Check minimum interval between calls
    if (this.lastCallTime) {
      const timeSinceLastCall = Date.now() - this.lastCallTime;
      if (timeSinceLastCall < this.minIntervalMs) {
        const remainingMs = this.minIntervalMs - timeSinceLastCall;
        violations.push({
          type: 'MINIMUM_INTERVAL_VIOLATION',
          message: `Minimum 5 minutes between calls required. Wait ${Math.ceil(remainingMs / 60000)} more minutes`,
          retryAfter: remainingMs
        });
      }
    }

    // Check rate limiting (5 calls per minute)
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentCalls = this.callHistory.filter(time => time > oneMinuteAgo);
    
    if (recentCalls.length >= this.maxCallsPerMinute) {
      const oldestCall = Math.min(...recentCalls);
      const retryAfter = oldestCall + 60000 - now;
      violations.push({
        type: 'RATE_LIMIT_EXCEEDED',
        message: `Maximum 5 calls per minute exceeded. Wait ${Math.ceil(retryAfter / 1000)} seconds`,
        retryAfter
      });
    }

    // Validate date range
    const dateValidation = this.validateDateRange(startTime, endTime);
    if (!dateValidation.isValid) {
      violations.push({
        type: 'DATE_RANGE_VIOLATION',
        message: dateValidation.errors.join(', '),
        retryAfter: 0
      });
    }

    return {
      isValid: violations.length === 0,
      violations
    };
  }

  /**
   * Record API call for rate limiting
   */
  recordCall() {
    const now = Date.now();
    this.lastCallTime = now;
    this.callHistory.push(now);
    
    // Clean old history (keep only last hour)
    const oneHourAgo = now - 60 * 60 * 1000;
    this.callHistory = this.callHistory.filter(time => time > oneHourAgo);
  }

  /**
   * Handle API key blocking
   */
  handleBlocking() {
    this.isBlocked = true;
    this.blockedUntil = Date.now() + this.blockDurationMs;
    this.onBlocked(this.blockDurationMs);
  }

  /**
   * Parse IndiaMART date formats
   * @param {string} dateStr - Date string in IndiaMART format
   * @returns {Date} Parsed date
   */
  parseIndiaMartDate(dateStr) {
    if (typeof dateStr !== 'string') {
      return new Date(dateStr);
    }

    // Handle DD-MON-YYYY format (e.g., 04-SEP-2025)
    const dateFormatRegex = /^(\d{2})-([A-Z]{3})-(\d{4})$/;
    const dateMatch = dateStr.match(dateFormatRegex);
    if (dateMatch) {
      const [, day, month, year] = dateMatch;
      const monthMap = {
        'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
        'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11
      };
      return new Date(parseInt(year), monthMap[month], parseInt(day));
    }

    // Handle DD-MM-YYYYHH:MM:SS format (e.g., 04-09-202517:15:00)
    const timestampFormatRegex = /^(\d{2})-(\d{2})-(\d{4})(\d{2}):(\d{2}):(\d{2})$/;
    const timestampMatch = dateStr.match(timestampFormatRegex);
    if (timestampMatch) {
      const [, day, month, year, hour, minute, second] = timestampMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 
                     parseInt(hour), parseInt(minute), parseInt(second));
    }

    // Fallback to standard Date parsing
    return new Date(dateStr);
  }

  /**
   * Validate date range with IndiaMART requirements
   */
  validateDateRange(startTime, endTime) {
    const errors = [];
    
    if (!startTime || !endTime) {
      errors.push("Both start_time and end_time are required");
      return { isValid: false, errors };
    }

    // Parse IndiaMART date formats
    const start = this.parseIndiaMartDate(startTime);
    const end = this.parseIndiaMartDate(endTime);
    
    if (isNaN(start.getTime())) {
      errors.push("Invalid start_time format");
    }
    
    if (isNaN(end.getTime())) {
      errors.push("Invalid end_time format");
    }
    
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      if (start >= end) {
        errors.push("end_time must be greater than start_time");
      }
      
      const daysDiff = (end - start) / (1000 * 60 * 60 * 24);
      
      // 7-day maximum limit
      if (daysDiff > 7) {
        errors.push("Date range cannot exceed 7 days (IndiaMART requirement)");
      }
      
      // 365-day historical data limit
      const now = new Date();
      const daysSinceStart = (now - start) / (1000 * 60 * 60 * 24);
      if (daysSinceStart > 365) {
        errors.push("Data older than 365 days is not available");
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Clean special characters from QUERY_MESSAGE field
   */
  cleanQueryMessage(message) {
    if (typeof message !== 'string') return message;
    
    return message
      .replace(/\\n/g, '\n')     // Convert \n to actual newline
      .replace(/\\t/g, '\t')     // Convert \t to actual tab
      .replace(/\\r/g, '\r')     // Convert \r to actual carriage return
      .replace(/\\b/g, '\b')     // Convert \b to actual backspace
      .replace(/\\\\/g, '\\');   // Convert \\ to actual backslash
  }

  /**
   * Clean all lead data for special characters
   */
  cleanLeadData(lead) {
    if (!lead || typeof lead !== 'object') return lead;
    
    const cleaned = { ...lead };
    
    // Clean QUERY_MESSAGE and ENQ_MESSAGE fields
    if (cleaned.QUERY_MESSAGE) {
      cleaned.QUERY_MESSAGE = this.cleanQueryMessage(cleaned.QUERY_MESSAGE);
    }
    if (cleaned.ENQ_MESSAGE) {
      cleaned.ENQ_MESSAGE = this.cleanQueryMessage(cleaned.ENQ_MESSAGE);
    }
    
    return cleaned;
  }

  /**
   * Get recommended polling interval
   */
  getRecommendedPollingInterval() {
    return {
      minimum: 5 * 60 * 1000,    // 5 minutes (IndiaMART minimum)
      recommended: 10 * 60 * 1000, // 10 minutes (IndiaMART recommendation)
      maximum: 15 * 60 * 1000    // 15 minutes (IndiaMART maximum)
    };
  }

  /**
   * Get NTP synchronization recommendations
   */
  getNTPSyncRecommendations() {
    return {
      servers: this.ntpServers,
      command: 'ntpdate -s time.google.com', // Linux/Mac
      windowsCommand: 'w32tm /resync',
      description: 'Keep server time synchronized with NTP servers for accurate API calls'
    };
  }

  /**
   * Get compliance status
   */
  getStatus() {
    const now = Date.now();
    const recentCalls = this.callHistory.filter(time => time > now - 60000);
    
    return {
      isBlocked: this.isBlocked,
      blockedUntil: this.blockedUntil,
      timeUntilUnblocked: this.isBlocked ? Math.max(0, this.blockedUntil - now) : 0,
      recentCalls: recentCalls.length,
      maxCallsPerMinute: this.maxCallsPerMinute,
      lastCallTime: this.lastCallTime,
      timeSinceLastCall: this.lastCallTime ? now - this.lastCallTime : null,
      canMakeCall: !this.isBlocked && (!this.lastCallTime || (now - this.lastCallTime) >= this.minIntervalMs)
    };
  }

  /**
   * Reset compliance state
   */
  reset() {
    this.callHistory = [];
    this.lastCallTime = null;
    this.isBlocked = false;
    this.blockedUntil = null;
  }

  // Default event handlers
  defaultViolationHandler(violation) {
    console.warn(`⚠️  API Compliance Violation: ${violation.message}`);
  }

  defaultBlockedHandler(durationMs) {
    console.error(`🚫 API Key Blocked: ${Math.ceil(durationMs / 60000)} minutes`);
  }

  defaultRecoveredHandler(reason) {
    console.log(`✅ API Key Recovered: ${reason}`);
  }
}

// Export compliance constants
export const COMPLIANCE_CONSTANTS = {
  MIN_INTERVAL_MS: 5 * 60 * 1000,        // 5 minutes
  MAX_DATE_RANGE_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
  MAX_HISTORICAL_DAYS: 365,              // 365 days
  MAX_CALLS_PER_MINUTE: 5,               // 5 calls per minute
  BLOCK_DURATION_MS: 15 * 60 * 1000,     // 15 minutes
  RECOMMENDED_POLLING_MS: 10 * 60 * 1000, // 10 minutes
  NTP_SERVERS: [
    'time.google.com',
    'time1.google.com',
    'time2.google.com', 
    'time3.google.com',
    'time4.google.com'
  ]
};
