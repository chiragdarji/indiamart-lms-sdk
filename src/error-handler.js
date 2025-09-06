/**
 * IndiaMART API Error Handler
 * 
 * Comprehensive error handling for all IndiaMART API error codes
 * Based on official IndiaMART error documentation
 */

export class IndiaMartError extends Error {
  constructor(message, code, status, details = {}) {
    super(message);
    this.name = 'IndiaMartError';
    this.code = code;
    this.status = status;
    this.details = details;
    this.timestamp = new Date();
  }
}

export class IndiaMartErrorHandler {
  constructor(options = {}) {
    this.retryDelays = {
      429: 5 * 60 * 1000, // 5 minutes for rate limiting
      500: 30 * 1000,     // 30 seconds for server errors
      default: 10 * 1000  // 10 seconds for other errors
    };
    
    this.maxRetries = options.maxRetries || 3;
    this.onError = options.onError || this.defaultErrorHandler;
    this.onRecovery = options.onRecovery || this.defaultRecoveryHandler;
    
    // Error statistics
    this.stats = {
      totalErrors: 0,
      errorCounts: {},
      lastError: null,
      recoveryAttempts: 0,
      successfulRecoveries: 0
    };
  }

  /**
   * Handle API response and determine if it's an error
   */
  handleResponse(response) {
    const { code, status, message, total_records, response: leads } = response;
    
    // Success case
    if (code === 200 || (status && status !== 'FAILURE')) {
      return { success: true, data: response };
    }

    // Error case - create specific error based on code and message
    const error = this.createSpecificError(code, status, message, response);
    this.stats.totalErrors++;
    this.stats.errorCounts[code] = (this.stats.errorCounts[code] || 0) + 1;
    this.stats.lastError = error;

    return { success: false, error };
  }

  /**
   * Create specific error instances based on IndiaMART error codes
   */
  createSpecificError(code, status, message, response) {
    const baseError = {
      code,
      status,
      message,
      response,
      timestamp: new Date()
    };

    switch (code) {
      case 429:
        if (message && message.includes('5 minutes')) {
          return new IndiaMartError(
            'Rate limit exceeded - API can only be called once every 5 minutes',
            code,
            status,
            {
              ...baseError,
              type: 'RATE_LIMIT_5_MIN',
              retryAfter: 5 * 60 * 1000, // 5 minutes
              suggestion: 'Wait 5 minutes before retrying'
            }
          );
        } else if (message && message.includes('Too Many Requests')) {
          return new IndiaMartError(
            'Too many requests - API key disabled for 15 minutes',
            code,
            status,
            {
              ...baseError,
              type: 'RATE_LIMIT_15_MIN',
              retryAfter: 15 * 60 * 1000, // 15 minutes
              suggestion: 'Wait 15 minutes before retrying'
            }
          );
        }
        break;

      case 401:
        if (message && message.includes('incorrect')) {
          return new IndiaMartError(
            'Invalid API key - Please check your CRM key',
            code,
            status,
            {
              ...baseError,
              type: 'INVALID_API_KEY',
              retryAfter: 0, // Don't retry
              suggestion: 'Verify your INDIAMART_CRM_KEY in environment variables'
            }
          );
        } else if (message && message.includes('expired') && message.includes('no longer in use')) {
          return new IndiaMartError(
            'API key expired due to inactivity - Generate new key',
            code,
            status,
            {
              ...baseError,
              type: 'API_KEY_EXPIRED_INACTIVITY',
              retryAfter: 0, // Don't retry
              suggestion: 'Generate new API key from IndiaMART seller portal'
            }
          );
        } else if (message && message.includes('expired') && message.includes('generated')) {
          return new IndiaMartError(
            'API key expired - New key generated',
            code,
            status,
            {
              ...baseError,
              type: 'API_KEY_EXPIRED_NEW_GENERATED',
              retryAfter: 0, // Don't retry
              suggestion: 'Use the new API key from your email/SMS'
            }
          );
        }
        break;

      case 204:
        if (message && message.includes('no leads')) {
          return new IndiaMartError(
            'No leads found in the specified time range',
            code,
            status,
            {
              ...baseError,
              type: 'NO_LEADS',
              retryAfter: 0, // Don't retry
              suggestion: 'Try a different time range'
            }
          );
        } else if (message && message.includes('available after 24 hours')) {
          return new IndiaMartError(
            'Historical data not yet available - Wait 24 hours',
            code,
            status,
            {
              ...baseError,
              type: 'HISTORICAL_DATA_UNAVAILABLE',
              retryAfter: 24 * 60 * 60 * 1000, // 24 hours
              suggestion: 'Wait 24 hours or fetch only recent data'
            }
          );
        }
        break;

      case 400:
        if (message && message.includes('365 days')) {
          return new IndiaMartError(
            'Date range exceeds 365 days limit',
            code,
            status,
            {
              ...baseError,
              type: 'DATE_RANGE_TOO_LARGE',
              retryAfter: 0, // Don't retry
              suggestion: 'Reduce date range to last 365 days'
            }
          );
        } else if (message && message.includes('date parameters')) {
          return new IndiaMartError(
            'Missing required date parameters',
            code,
            status,
            {
              ...baseError,
              type: 'MISSING_DATE_PARAMETERS',
              retryAfter: 0, // Don't retry
              suggestion: 'Provide both start_time and end_time parameters'
            }
          );
        } else if (message && message.includes('Date format')) {
          return new IndiaMartError(
            'Invalid date format',
            code,
            status,
            {
              ...baseError,
              type: 'INVALID_DATE_FORMAT',
              retryAfter: 0, // Don't retry
              suggestion: 'Use DD-MM-YYYY HH:MM:SS format'
            }
          );
        }
        break;

      case 500:
        return new IndiaMartError(
          'IndiaMART server error - Internal issues',
          code,
          status,
          {
            ...baseError,
            type: 'SERVER_ERROR',
            retryAfter: 30 * 1000, // 30 seconds
            suggestion: 'Retry after 30 seconds or contact IndiaMART support'
          }
        );

      default:
        return new IndiaMartError(
          `Unknown error: ${message}`,
          code,
          status,
          {
            ...baseError,
            type: 'UNKNOWN_ERROR',
            retryAfter: 10 * 1000, // 10 seconds
            suggestion: 'Check IndiaMART API documentation'
          }
        );
    }

    // Fallback for unhandled cases
    return new IndiaMartError(
      message || 'Unknown API error',
      code,
      status,
      {
        ...baseError,
        type: 'UNHANDLED_ERROR',
        retryAfter: 10 * 1000,
        suggestion: 'Check error details and retry'
      }
    );
  }

  /**
   * Determine if an error should be retried
   */
  shouldRetry(error, attemptCount) {
    if (attemptCount >= this.maxRetries) {
      return false;
    }

    // Don't retry certain error types
    const noRetryTypes = [
      'INVALID_API_KEY',
      'API_KEY_EXPIRED_INACTIVITY',
      'API_KEY_EXPIRED_NEW_GENERATED',
      'NO_LEADS',
      'DATE_RANGE_TOO_LARGE',
      'MISSING_DATE_PARAMETERS',
      'INVALID_DATE_FORMAT'
    ];

    return !noRetryTypes.includes(error.details?.type);
  }

  /**
   * Check if an error is retryable (alias for shouldRetry)
   */
  isRetryableError(statusCode, errorMessage) {
    const error = {
      code: statusCode,
      details: { type: this.getErrorType(statusCode, errorMessage) }
    };
    return this.shouldRetry(error, 0);
  }

  /**
   * Get error type from status code and message
   */
  getErrorType(statusCode, errorMessage) {
    if (statusCode === 401) return 'INVALID_API_KEY';
    if (statusCode === 429) return 'RATE_LIMIT_EXCEEDED';
    if (statusCode >= 500) return 'SERVER_ERROR';
    if (errorMessage?.includes('rate limit')) return 'RATE_LIMIT_EXCEEDED';
    if (errorMessage?.includes('invalid key')) return 'INVALID_API_KEY';
    return 'UNKNOWN_ERROR';
  }

  /**
   * Get suggestion for error resolution
   */
  getSuggestion(errorCode, errorMessage) {
    const suggestions = {
      'INVALID_API_KEY': 'Verify your INDIAMART_CRM_KEY in environment variables',
      'RATE_LIMIT_EXCEEDED': 'Wait for rate limit to reset before making more calls',
      'INVALID_DATE_FORMAT': 'Check date format and ensure it follows DD-MON-YYYY format',
      'DATE_RANGE_TOO_LARGE': 'Reduce date range to maximum 7 days',
      'NO_LEADS': 'No leads found in the specified date range',
      'SERVER_ERROR': 'Server error occurred, try again later'
    };

    return suggestions[errorCode] || 'Check your request parameters and try again';
  }

  /**
   * Get retry delay for specific error
   */
  getRetryDelay(error, attemptCount) {
    const baseDelay = error.details?.retryAfter || this.retryDelays[error.code] || this.retryDelays.default;
    
    // Exponential backoff for retries
    const multiplier = Math.pow(2, attemptCount - 1);
    return Math.min(baseDelay * multiplier, 5 * 60 * 1000); // Max 5 minutes
  }

  /**
   * Handle error with appropriate action
   */
  async handleError(error, context = 'API Call', attemptCount = 1) {
    await this.onError(error, context, attemptCount);

    if (this.shouldRetry(error, attemptCount)) {
      const delay = this.getRetryDelay(error, attemptCount);
      console.log(`⏳ Retrying in ${delay / 1000} seconds (attempt ${attemptCount + 1}/${this.maxRetries})`);
      return { shouldRetry: true, delay };
    } else {
      console.log(`❌ Not retrying: ${error.details?.suggestion || error.message}`);
      return { shouldRetry: false, delay: 0 };
    }
  }

  /**
   * Handle successful recovery
   */
  async handleRecovery(error, context) {
    this.stats.recoveryAttempts++;
    this.stats.successfulRecoveries++;
    await this.onRecovery(error, context);
  }

  /**
   * Default error handler
   */
  async defaultErrorHandler(error, context, attemptCount) {
    const errorType = error.details?.type || 'UNKNOWN';
    const suggestion = error.details?.suggestion || 'Check error details';
    
    console.error(`❌ ${context} Error (${errorType}):`, error.message);
    console.error(`💡 Suggestion: ${suggestion}`);
    
    if (error.details?.retryAfter > 0) {
      console.error(`⏰ Retry after: ${error.details.retryAfter / 1000} seconds`);
    }
  }

  /**
   * Default recovery handler
   */
  async defaultRecoveryHandler(error, context) {
    console.log(`✅ Recovered from ${error.details?.type || 'error'} in ${context}`);
  }

  /**
   * Get error statistics
   */
  getStats() {
    return {
      ...this.stats,
      recoveryRate: this.stats.recoveryAttempts > 0 
        ? (this.stats.successfulRecoveries / this.stats.recoveryAttempts * 100).toFixed(1) + '%'
        : 'N/A'
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalErrors: 0,
      errorCounts: {},
      lastError: null,
      recoveryAttempts: 0,
      successfulRecoveries: 0
    };
  }

  /**
   * Check if error is critical (requires immediate attention)
   */
  isCriticalError(error) {
    const criticalTypes = [
      'INVALID_API_KEY',
      'API_KEY_EXPIRED_INACTIVITY',
      'API_KEY_EXPIRED_NEW_GENERATED'
    ];
    
    return criticalTypes.includes(error.details?.type);
  }

  /**
   * Get human-readable error description
   */
  getErrorDescription(error) {
    const descriptions = {
      'RATE_LIMIT_5_MIN': 'API rate limit exceeded - wait 5 minutes',
      'RATE_LIMIT_15_MIN': 'Too many requests - API key disabled for 15 minutes',
      'INVALID_API_KEY': 'Invalid API key - check your CRM key',
      'API_KEY_EXPIRED_INACTIVITY': 'API key expired due to inactivity - generate new key',
      'API_KEY_EXPIRED_NEW_GENERATED': 'API key expired - new key generated',
      'NO_LEADS': 'No leads found in time range',
      'HISTORICAL_DATA_UNAVAILABLE': 'Historical data not available yet',
      'DATE_RANGE_TOO_LARGE': 'Date range exceeds 365 days limit',
      'MISSING_DATE_PARAMETERS': 'Missing start_time or end_time parameters',
      'INVALID_DATE_FORMAT': 'Invalid date format',
      'SERVER_ERROR': 'IndiaMART server error',
      'UNKNOWN_ERROR': 'Unknown error occurred'
    };

    return descriptions[error.details?.type] || error.message;
  }
}

// Export error types for easy reference
export const ERROR_TYPES = {
  RATE_LIMIT_5_MIN: 'RATE_LIMIT_5_MIN',
  RATE_LIMIT_15_MIN: 'RATE_LIMIT_15_MIN',
  INVALID_API_KEY: 'INVALID_API_KEY',
  API_KEY_EXPIRED_INACTIVITY: 'API_KEY_EXPIRED_INACTIVITY',
  API_KEY_EXPIRED_NEW_GENERATED: 'API_KEY_EXPIRED_NEW_GENERATED',
  NO_LEADS: 'NO_LEADS',
  HISTORICAL_DATA_UNAVAILABLE: 'HISTORICAL_DATA_UNAVAILABLE',
  DATE_RANGE_TOO_LARGE: 'DATE_RANGE_TOO_LARGE',
  MISSING_DATE_PARAMETERS: 'MISSING_DATE_PARAMETERS',
  INVALID_DATE_FORMAT: 'INVALID_DATE_FORMAT',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};
