/**
 * Rate Limiter - Manages API rate limits with file-based storage
 * 
 * This module handles rate limiting according to IndiaMART API compliance:
 * - 5 calls per minute
 * - 20 calls per hour
 * - 15-minute blocking period when limits exceeded
 */

import fs from 'fs';
import path from 'path';

export class RateLimiter {
  constructor(options = {}) {
    // Support both old format (string) and new format (object)
    if (typeof options === 'string') {
      options = { logDirectory: options };
    }
    
    this.logDirectory = options.logDirectory || './logs';
    this.rateLimitFile = options.rateLimitFile || path.join(this.logDirectory, 'rate-limits.json');
    this.ensureLogDirectory();
    
    // IndiaMART API limits
    this.limits = {
      callsPerMinute: 5,
      callsPerHour: 20,
      blockDurationMinutes: 15
    };
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
   * Load rate limit data from file
   * @returns {object} Rate limit data
   */
  loadRateLimitData() {
    try {
      if (!fs.existsSync(this.rateLimitFile)) {
        return {
          calls: [],
          blockedUntil: null,
          lastReset: new Date().toISOString()
        };
      }

      const data = fs.readFileSync(this.rateLimitFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Failed to load rate limit data:', error.message);
      return {
        calls: [],
        blockedUntil: null,
        lastReset: new Date().toISOString()
      };
    }
  }

  /**
   * Save rate limit data to file
   * @param {object} data - Rate limit data to save
   */
  saveRateLimitData(data) {
    try {
      fs.writeFileSync(this.rateLimitFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ Failed to save rate limit data:', error.message);
    }
  }

  /**
   * Check if API call is allowed
   * @returns {object} Rate limit check result
   */
  canMakeCall() {
    const now = new Date();
    const data = this.loadRateLimitData();

    // Check if currently blocked
    if (data.blockedUntil) {
      const blockUntil = new Date(data.blockedUntil);
      if (now < blockUntil) {
        const remainingMinutes = Math.ceil((blockUntil - now) / (1000 * 60));
        return {
          allowed: false,
          reason: 'RATE_LIMIT_BLOCKED',
          retryAfter: remainingMinutes * 60 * 1000, // milliseconds
          message: `API key is blocked for ${remainingMinutes} more minutes`
        };
      } else {
        // Block period expired, clear it
        data.blockedUntil = null;
        data.calls = [];
        data.lastReset = now.toISOString();
      }
    }

    // Clean old calls (older than 1 hour)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    data.calls = data.calls.filter(callTime => new Date(callTime) > oneHourAgo);

    // Check hourly limit
    if (data.calls.length >= this.limits.callsPerHour) {
      // Block for 15 minutes
      const blockUntil = new Date(now.getTime() + this.limits.blockDurationMinutes * 60 * 1000);
      data.blockedUntil = blockUntil.toISOString();
      this.saveRateLimitData(data);

      return {
        allowed: false,
        reason: 'HOURLY_LIMIT_EXCEEDED',
        retryAfter: this.limits.blockDurationMinutes * 60 * 1000,
        message: `Hourly limit exceeded. Blocked for ${this.limits.blockDurationMinutes} minutes`
      };
    }

    // Check minute limit (last 60 seconds)
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const recentCalls = data.calls.filter(callTime => new Date(callTime) > oneMinuteAgo);

    if (recentCalls.length >= this.limits.callsPerMinute) {
      const waitTime = 60 - Math.floor((now - new Date(recentCalls[0])) / 1000);
      return {
        allowed: false,
        reason: 'MINUTE_LIMIT_EXCEEDED',
        retryAfter: waitTime * 1000,
        message: `Minute limit exceeded. Wait ${waitTime} seconds`
      };
    }

    return {
      allowed: true,
      reason: 'OK',
      retryAfter: 0,
      message: 'API call allowed'
    };
  }

  /**
   * Record an API call
   * @param {boolean} success - Whether the call was successful
   */
  recordCall(success = true) {
    const now = new Date();
    const data = this.loadRateLimitData();

    // Add current call
    data.calls.push(now.toISOString());

    // If call failed due to rate limit, don't count it
    if (!success) {
      data.calls.pop();
    }

    this.saveRateLimitData(data);

    console.log(`📊 Rate limit recorded: ${data.calls.length}/${this.limits.callsPerHour} calls this hour`);
  }

  /**
   * Get current rate limit status
   * @returns {object} Current rate limit status
   */
  getStatus() {
    const now = new Date();
    const data = this.loadRateLimitData();
    const check = this.canMakeCall();

    // Count calls in different time windows
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const callsLastMinute = data.calls.filter(callTime => new Date(callTime) > oneMinuteAgo).length;
    const callsLastHour = data.calls.filter(callTime => new Date(callTime) > oneHourAgo).length;

    return {
      allowed: check.allowed,
      reason: check.reason,
      retryAfter: check.retryAfter,
      message: check.message,
      callsPerMinute: callsLastMinute,
      callsPerHour: callsLastHour,
      minuteLimit: this.limits.callsPerMinute,
      hourLimit: this.limits.callsPerHour,
      isBlocked: !!data.blockedUntil,
      blockedUntil: data.blockedUntil,
      totalCallsToday: data.calls.length
    };
  }

  /**
   * Reset rate limits (for testing or manual reset)
   */
  reset() {
    const data = {
      calls: [],
      blockedUntil: null,
      lastReset: new Date().toISOString()
    };
    this.saveRateLimitData(data);
    console.log('🔄 Rate limits reset');
  }

  /**
   * Get rate limit statistics
   * @returns {object} Rate limit statistics
   */
  getStats() {
    const data = this.loadRateLimitData();
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const callsLastHour = data.calls.filter(callTime => new Date(callTime) > oneHourAgo).length;
    const callsLastDay = data.calls.filter(callTime => new Date(callTime) > oneDayAgo).length;

    return {
      totalCalls: data.calls.length,
      callsLastHour: callsLastHour,
      callsLastDay: callsLastDay,
      isBlocked: !!data.blockedUntil,
      blockedUntil: data.blockedUntil,
      lastReset: data.lastReset,
      limits: this.limits
    };
  }
}
