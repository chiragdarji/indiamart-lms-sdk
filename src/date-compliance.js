/**
 * Date Compliance Manager - Enforces IndiaMART API date limits
 * 
 * IndiaMART API compliance rules:
 * - Maximum 7 days date range
 * - Maximum 365 days historical data
 * - Dates must be in IST timezone
 * - Start date must be before end date
 */

export class DateComplianceManager {
  constructor() {
    // IndiaMART API limits
    this.limits = {
      maxDateRangeDays: 7,      // Maximum 7 days between start and end
      maxHistoricalDays: 365,   // Maximum 365 days of historical data
      timezone: 'IST'           // India Standard Time
    };
  }

  /**
   * Validate and enforce date range compliance
   * @param {Date|string} startDate - Start date
   * @param {Date|string} endDate - End date
   * @returns {object} Validation result with compliance info
   */
  validateDateRange(startDate, endDate) {
    const errors = [];
    const warnings = [];

    // Convert to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    // Basic validation
    if (isNaN(start.getTime())) {
      errors.push('Invalid start date format');
    }

    if (isNaN(end.getTime())) {
      errors.push('Invalid end date format');
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        errors,
        warnings,
        compliance: 'INVALID_DATES'
      };
    }

    // Check if start date is before end date
    if (start >= end) {
      errors.push('Start date must be before end date');
    }

    // Check if end date is in the future
    if (end > now) {
      errors.push('End date cannot be in the future');
    }

    // Check date range (maximum 7 days)
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (daysDiff > this.limits.maxDateRangeDays) {
      errors.push(`Date range cannot exceed ${this.limits.maxDateRangeDays} days (IndiaMART limit)`);
    }

    // Check historical data limit (maximum 365 days)
    const daysFromNow = Math.ceil((now - start) / (1000 * 60 * 60 * 24));
    if (daysFromNow > this.limits.maxHistoricalDays) {
      errors.push(`Data older than ${this.limits.maxHistoricalDays} days is not available (IndiaMART limit)`);
    }

    // Check if dates are too far in the past
    if (daysFromNow < 0) {
      errors.push('Start date cannot be in the future');
    }

    // Warnings for edge cases
    if (daysDiff === this.limits.maxDateRangeDays) {
      warnings.push('Using maximum allowed date range');
    }

    if (daysFromNow > 300) {
      warnings.push('Requesting data older than 300 days - may have limited availability');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      compliance: errors.length === 0 ? 'COMPLIANT' : 'NON_COMPLIANT',
      dateRange: {
        days: daysDiff,
        maxAllowed: this.limits.maxDateRangeDays
      },
      historical: {
        daysFromNow: daysFromNow,
        maxAllowed: this.limits.maxHistoricalDays
      }
    };
  }

  /**
   * Get compliant date range for today
   * @returns {object} Compliant date range for today
   */
  getTodayRange() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    return {
      startDate: startOfDay,
      endDate: endOfDay,
      compliance: this.validateDateRange(startOfDay, endOfDay)
    };
  }

  /**
   * Get compliant date range for yesterday
   * @returns {object} Compliant date range for yesterday
   */
  getYesterdayRange() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const endOfDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1);
    
    return {
      startDate: startOfDay,
      endDate: endOfDay,
      compliance: this.validateDateRange(startOfDay, endOfDay)
    };
  }

  /**
   * Get compliant date range for last N days
   * @param {number} days - Number of days to look back
   * @returns {object} Compliant date range for last N days
   */
  getLastDaysRange(days) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Ensure we don't exceed the maximum range
    const actualDays = Math.min(days, this.limits.maxDateRangeDays);
    const actualStartDate = new Date();
    actualStartDate.setDate(actualStartDate.getDate() - actualDays);
    
    return {
      startDate: actualStartDate,
      endDate: endDate,
      requestedDays: days,
      actualDays: actualDays,
      compliance: this.validateDateRange(actualStartDate, endDate)
    };
  }

  /**
   * Get compliant date range for a specific date
   * @param {Date|string} date - Specific date
   * @returns {object} Compliant date range for specific date
   */
  getDateRange(date) {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);
    
    return {
      startDate: startOfDay,
      endDate: endOfDay,
      compliance: this.validateDateRange(startOfDay, endOfDay)
    };
  }

  /**
   * Format date for IndiaMART API (IST timezone)
   * @param {Date|string} date - Date to format
   * @param {string} format - Format type ('date' or 'timestamp')
   * @returns {string} Formatted date string
   */
  formatDateForAPI(date, format = 'timestamp') {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      throw new Error('Invalid date for formatting');
    }

    // Convert to IST (UTC+05:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(d.getTime() + istOffset);
    
    const pad = (n) => String(n).padStart(2, "0");
    const getY = (dt) => istTime.getUTCFullYear();
    const getM = (dt) => istTime.getUTCMonth() + 1;
    const getD = (dt) => istTime.getUTCDate();
    const getH = (dt) => istTime.getUTCHours();
    const getMin = (dt) => istTime.getUTCMinutes();
    const getS = (dt) => istTime.getUTCSeconds();

    if (format === 'date') {
      // Format: DD-MON-YYYY (e.g., 25-JAN-2022)
      const MMM = [
        "JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"
      ];
      const monthIndex = istTime.getUTCMonth();
      return `${pad(getD(d))}-${MMM[monthIndex]}-${getY(d)}`;
    } else {
      // Format: DD-MM-YYYYHH:MM:SS (e.g., 25-01-202217:30:00) - No space for IndiaMART API compliance
      return `${pad(getD(d))}-${pad(getM(d))}-${getY(d)}${pad(getH(d))}:${pad(getMin(d))}:${pad(getS(d))}`;
    }
  }

  /**
   * Get compliance limits
   * @returns {object} Current compliance limits
   */
  getLimits() {
    return { ...this.limits };
  }

  /**
   * Check if a date range is compliant
   * @param {Date|string} startDate - Start date
   * @param {Date|string} endDate - End date
   * @returns {boolean} True if compliant
   */
  isCompliant(startDate, endDate) {
    const validation = this.validateDateRange(startDate, endDate);
    return validation.isValid && validation.compliance === 'COMPLIANT';
  }
}
