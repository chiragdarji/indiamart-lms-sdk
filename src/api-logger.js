/**
 * API Logger - Stores API logs and rate limits in files
 * 
 * This module handles logging of API calls, rate limits, and responses
 * to files for monitoring and debugging purposes.
 */

import fs from 'fs';
import path from 'path';

export class APILogger {
  constructor(options = {}) {
    // Support both old format (string) and new format (object)
    if (typeof options === 'string') {
      options = { logDirectory: options };
    }
    
    this.logDirectory = options.logDirectory || './logs';
    this.rateLimitFile = options.rateLimitFile || path.join(this.logDirectory, 'rate-limits.json');
    this.apiLogsFile = options.apiLogsFile || path.join(this.logDirectory, 'api-logs.json');
    this.ensureLogDirectory();
  }

  /**
   * Ensure log directory exists
   */
  ensureLogDirectory() {
    try {
      if (!fs.existsSync(this.logDirectory)) {
        fs.mkdirSync(this.logDirectory, { recursive: true });
        console.log(`📁 Created log directory: ${this.logDirectory}`);
      }
    } catch (error) {
      console.warn(`⚠️  Could not create log directory: ${error.message}`);
    }
  }

  /**
   * Log API call details
   * @param {object} callData - API call information
   */
  async logAPICall(callData) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        method: callData.method || 'GET',
        url: callData.url,
        statusCode: callData.statusCode,
        responseTime: callData.responseTime,
        success: callData.success,
        error: callData.error || null,
        leadsCount: callData.leadsCount || 0,
        totalRecords: callData.totalRecords || 0,
        userAgent: callData.userAgent || 'IndiaMART-SDK/1.0.0'
      };

      // Read existing logs
      let logs = [];
      if (fs.existsSync(this.apiLogsFile)) {
        const data = fs.readFileSync(this.apiLogsFile, 'utf8');
        logs = JSON.parse(data);
      }

      // Add new log entry
      logs.push(logEntry);

      // Keep only last 1000 entries to prevent file from growing too large
      if (logs.length > 1000) {
        logs = logs.slice(-1000);
      }

      // Write back to file
      fs.writeFileSync(this.apiLogsFile, JSON.stringify(logs, null, 2));
      
      console.log(`📝 API call logged: ${callData.method} ${callData.url} - ${callData.statusCode}`);
    } catch (error) {
      console.error('❌ Failed to log API call:', error.message);
    }
  }

  /**
   * Log rate limit information
   * @param {object} rateLimitData - Rate limit information
   */
  async logRateLimit(rateLimitData) {
    try {
      const rateLimitEntry = {
        timestamp: new Date().toISOString(),
        callsPerMinute: rateLimitData.callsPerMinute || 0,
        callsPerHour: rateLimitData.callsPerHour || 0,
        isBlocked: rateLimitData.isBlocked || false,
        blockUntil: rateLimitData.blockUntil || null,
        retryAfter: rateLimitData.retryAfter || null,
        lastCallTime: rateLimitData.lastCallTime || null,
        totalCallsToday: rateLimitData.totalCallsToday || 0
      };

      // Read existing rate limit data
      let rateLimits = {};
      if (fs.existsSync(this.rateLimitFile)) {
        const data = fs.readFileSync(this.rateLimitFile, 'utf8');
        rateLimits = JSON.parse(data);
      }

      // Update rate limit data
      rateLimits.current = rateLimitEntry;
      rateLimits.history = rateLimits.history || [];
      rateLimits.history.push(rateLimitEntry);

      // Keep only last 100 entries in history
      if (rateLimits.history.length > 100) {
        rateLimits.history = rateLimits.history.slice(-100);
      }

      // Write back to file
      fs.writeFileSync(this.rateLimitFile, JSON.stringify(rateLimits, null, 2));
      
      console.log(`📊 Rate limit logged: ${rateLimitData.callsPerMinute}/min, ${rateLimitData.callsPerHour}/hour`);
    } catch (error) {
      console.error('❌ Failed to log rate limit:', error.message);
    }
  }

  /**
   * Get API logs
   * @param {number} limit - Number of recent logs to return
   * @returns {Array} Array of API logs
   */
  getAPILogs(limit = 50) {
    try {
      if (!fs.existsSync(this.apiLogsFile)) {
        return [];
      }

      const data = fs.readFileSync(this.apiLogsFile, 'utf8');
      const logs = JSON.parse(data);
      return logs.slice(-limit);
    } catch (error) {
      console.error('❌ Failed to read API logs:', error.message);
      return [];
    }
  }

  /**
   * Get rate limit status
   * @returns {object} Current rate limit status
   */
  getRateLimitStatus() {
    try {
      if (!fs.existsSync(this.rateLimitFile)) {
        return null;
      }

      const data = fs.readFileSync(this.rateLimitFile, 'utf8');
      const rateLimits = JSON.parse(data);
      return rateLimits.current || null;
    } catch (error) {
      console.error('❌ Failed to read rate limit status:', error.message);
      return null;
    }
  }

  /**
   * Get API statistics
   * @returns {object} API statistics
   */
  getAPIStats() {
    try {
      const logs = this.getAPILogs(1000);
      
      if (logs.length === 0) {
        return {
          totalCalls: 0,
          successfulCalls: 0,
          failedCalls: 0,
          averageResponseTime: 0,
          totalLeads: 0,
          successRate: 0
        };
      }

      const successfulCalls = logs.filter(log => log.success);
      const failedCalls = logs.filter(log => !log.success);
      const totalLeads = logs.reduce((sum, log) => sum + (log.leadsCount || 0), 0);
      const totalResponseTime = logs.reduce((sum, log) => sum + (log.responseTime || 0), 0);

      return {
        totalCalls: logs.length,
        successfulCalls: successfulCalls.length,
        failedCalls: failedCalls.length,
        averageResponseTime: totalResponseTime / logs.length,
        totalLeads: totalLeads,
        successRate: (successfulCalls.length / logs.length) * 100
      };
    } catch (error) {
      console.error('❌ Failed to calculate API stats:', error.message);
      return null;
    }
  }

  /**
   * Clear old logs (older than 30 days)
   */
  clearOldLogs() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Clear API logs
      if (fs.existsSync(this.apiLogsFile)) {
        const data = fs.readFileSync(this.apiLogsFile, 'utf8');
        const logs = JSON.parse(data);
        const recentLogs = logs.filter(log => new Date(log.timestamp) > thirtyDaysAgo);
        fs.writeFileSync(this.apiLogsFile, JSON.stringify(recentLogs, null, 2));
      }

      // Clear rate limit history
      if (fs.existsSync(this.rateLimitFile)) {
        const data = fs.readFileSync(this.rateLimitFile, 'utf8');
        const rateLimits = JSON.parse(data);
        if (rateLimits.history) {
          rateLimits.history = rateLimits.history.filter(entry => new Date(entry.timestamp) > thirtyDaysAgo);
          fs.writeFileSync(this.rateLimitFile, JSON.stringify(rateLimits, null, 2));
        }
      }

      console.log('🧹 Old logs cleared (older than 30 days)');
    } catch (error) {
      console.error('❌ Failed to clear old logs:', error.message);
    }
  }
}
