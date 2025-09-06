/**
 * Secure Logger - Production-ready logging without sensitive data exposure
 * 
 * This module provides secure logging that sanitizes sensitive information
 * and provides different log levels for production use.
 */

import fs from 'fs/promises';
import path from 'path';
import { InputValidator } from './input-validator.js';

/**
 * Log levels
 */
export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

/**
 * Secure logger class
 */
export class SecureLogger {
  constructor(options = {}) {
    this.logLevel = options.logLevel || LOG_LEVELS.INFO;
    this.logFile = options.logFile || './logs/sdk.log';
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.maxFiles = options.maxFiles || 5;
    this.enableConsole = options.enableConsole || false;
    this.sensitiveFields = options.sensitiveFields || ['password', 'apiKey', 'crmKey', 'token', 'secret'];
    
    this.ensureLogDirectory();
  }

  /**
   * Ensure log directory exists
   */
  async ensureLogDirectory() {
    try {
      const logDir = path.dirname(this.logFile);
      await fs.mkdir(logDir, { recursive: true });
    } catch (error) {
      // Silently fail in production
      if (this.enableConsole) {
        console.warn('Could not create log directory:', error.message);
      }
    }
  }

  /**
   * Sanitize log data to remove sensitive information
   * @param {any} data - Data to sanitize
   * @returns {any} Sanitized data
   */
  sanitizeData(data) {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      
      if (this.sensitiveFields.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Format log entry
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {any} data - Additional data
   * @returns {string} Formatted log entry
   */
  formatLogEntry(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const sanitizedData = data ? this.sanitizeData(data) : null;
    
    const logEntry = {
      timestamp,
      level,
      message,
      data: sanitizedData
    };

    return JSON.stringify(logEntry);
  }

  /**
   * Write log entry to file
   * @param {string} logEntry - Formatted log entry
   */
  async writeToFile(logEntry) {
    try {
      await fs.appendFile(this.logFile, logEntry + '\n');
      
      // Check file size and rotate if needed
      await this.rotateLogFile();
    } catch (error) {
      // Silently fail in production
      if (this.enableConsole) {
        console.warn('Could not write to log file:', error.message);
      }
    }
  }

  /**
   * Rotate log file if it exceeds max size
   */
  async rotateLogFile() {
    try {
      const stats = await fs.stat(this.logFile);
      
      if (stats.size > this.maxFileSize) {
        // Rotate existing files
        for (let i = this.maxFiles - 1; i > 0; i--) {
          const oldFile = `${this.logFile}.${i}`;
          const newFile = `${this.logFile}.${i + 1}`;
          
          try {
            await fs.rename(oldFile, newFile);
          } catch (error) {
            // File doesn't exist, continue
          }
        }

        // Move current file to .1
        await fs.rename(this.logFile, `${this.logFile}.1`);
        
        // Create new log file
        await fs.writeFile(this.logFile, '');
      }
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Log error message
   * @param {string} message - Error message
   * @param {any} data - Additional data
   */
  async error(message, data = null) {
    if (this.logLevel >= LOG_LEVELS.ERROR) {
      const logEntry = this.formatLogEntry('ERROR', message, data);
      await this.writeToFile(logEntry);
      
      if (this.enableConsole) {
        console.error(`[ERROR] ${message}`, data ? this.sanitizeData(data) : '');
      }
    }
  }

  /**
   * Log warning message
   * @param {string} message - Warning message
   * @param {any} data - Additional data
   */
  async warn(message, data = null) {
    if (this.logLevel >= LOG_LEVELS.WARN) {
      const logEntry = this.formatLogEntry('WARN', message, data);
      await this.writeToFile(logEntry);
      
      if (this.enableConsole) {
        console.warn(`[WARN] ${message}`, data ? this.sanitizeData(data) : '');
      }
    }
  }

  /**
   * Log info message
   * @param {string} message - Info message
   * @param {any} data - Additional data
   */
  async info(message, data = null) {
    if (this.logLevel >= LOG_LEVELS.INFO) {
      const logEntry = this.formatLogEntry('INFO', message, data);
      await this.writeToFile(logEntry);
      
      if (this.enableConsole) {
        console.log(`[INFO] ${message}`, data ? this.sanitizeData(data) : '');
      }
    }
  }

  /**
   * Log debug message
   * @param {string} message - Debug message
   * @param {any} data - Additional data
   */
  async debug(message, data = null) {
    if (this.logLevel >= LOG_LEVELS.DEBUG) {
      const logEntry = this.formatLogEntry('DEBUG', message, data);
      await this.writeToFile(logEntry);
      
      if (this.enableConsole) {
        console.log(`[DEBUG] ${message}`, data ? this.sanitizeData(data) : '');
      }
    }
  }

  /**
   * Log API call securely
   * @param {object} callData - API call data
   */
  async logApiCall(callData) {
    const sanitizedData = {
      method: callData.method,
      url: callData.url,
      statusCode: callData.statusCode,
      responseTime: callData.responseTime,
      success: callData.success,
      leadsCount: callData.leadsCount,
      totalRecords: callData.totalRecords,
      error: callData.error ? '[ERROR]' : null
    };

    const level = callData.success ? 'info' : 'error';
    await this[level]('API Call', sanitizedData);
  }

  /**
   * Log rate limit information
   * @param {object} rateLimitData - Rate limit data
   */
  async logRateLimit(rateLimitData) {
    const sanitizedData = {
      callsPerMinute: rateLimitData.callsPerMinute,
      callsPerHour: rateLimitData.callsPerHour,
      isBlocked: rateLimitData.isBlocked,
      retryAfter: rateLimitData.retryAfter
    };

    await this.info('Rate Limit Status', sanitizedData);
  }

  /**
   * Get log entries
   * @param {number} limit - Number of entries to return
   * @returns {Array} Log entries
   */
  async getLogs(limit = 100) {
    try {
      const content = await fs.readFile(this.logFile, 'utf8');
      const lines = content.trim().split('\n').filter(line => line.trim());
      const logs = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch (error) {
          return { timestamp: new Date().toISOString(), level: 'ERROR', message: 'Invalid log entry', data: { raw: line } };
        }
      });

      return logs.slice(-limit);
    } catch (error) {
      return [];
    }
  }

  /**
   * Clear old logs
   * @param {number} days - Number of days to keep
   */
  async clearOldLogs(days = 30) {
    try {
      const logs = await this.getLogs(10000);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const recentLogs = logs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate > cutoffDate;
      });

      const logContent = recentLogs.map(log => JSON.stringify(log)).join('\n');
      await fs.writeFile(this.logFile, logContent + '\n');
    } catch (error) {
      // Silently fail
    }
  }
}
