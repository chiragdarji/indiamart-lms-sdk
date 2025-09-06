/**
 * Input Validator - Secure input validation and sanitization
 * 
 * This module provides comprehensive input validation and sanitization
 * to prevent injection attacks and ensure data integrity.
 */

/**
 * Input validation and sanitization utilities
 */
export class InputValidator {
  /**
   * Validate and sanitize string input
   * @param {string} input - Input string to validate
   * @param {object} options - Validation options
   * @returns {object} Validation result
   */
  static validateString(input, options = {}) {
    const {
      minLength = 0,
      maxLength = 1000,
      allowEmpty = false,
      pattern = null,
      sanitize = true
    } = options;

    const result = {
      isValid: true,
      value: input,
      errors: []
    };

    // Check if input is string
    if (typeof input !== 'string') {
      result.isValid = false;
      result.errors.push('Input must be a string');
      return result;
    }

    // Check empty string
    if (!allowEmpty && input.trim().length === 0) {
      result.isValid = false;
      result.errors.push('Input cannot be empty');
      return result;
    }

    // Check length
    if (input.length < minLength) {
      result.isValid = false;
      result.errors.push(`Input must be at least ${minLength} characters long`);
    }

    if (input.length > maxLength) {
      result.isValid = false;
      result.errors.push(`Input must be no more than ${maxLength} characters long`);
    }

    // Check pattern
    if (pattern && !pattern.test(input)) {
      result.isValid = false;
      result.errors.push('Input does not match required pattern');
    }

    // Sanitize if requested
    if (sanitize && result.isValid) {
      result.value = this.sanitizeString(input);
    }

    return result;
  }

  /**
   * Validate and sanitize file path
   * @param {string} path - File path to validate
   * @returns {object} Validation result
   */
  static validateFilePath(path) {
    const result = {
      isValid: true,
      value: path,
      errors: []
    };

    if (typeof path !== 'string') {
      result.isValid = false;
      result.errors.push('Path must be a string');
      return result;
    }

    // Check for path traversal attempts
    if (path.includes('..') || path.includes('~') || path.includes('//')) {
      result.isValid = false;
      result.errors.push('Path traversal detected');
      return result;
    }

    // Check for null bytes
    if (path.includes('\0')) {
      result.isValid = false;
      result.errors.push('Null bytes not allowed in paths');
      return result;
    }

    // Sanitize path
    result.value = this.sanitizeFilePath(path);

    return result;
  }

  /**
   * Validate API key format
   * @param {string} apiKey - API key to validate
   * @returns {object} Validation result
   */
  static validateApiKey(apiKey) {
    const result = {
      isValid: true,
      value: apiKey,
      errors: []
    };

    if (typeof apiKey !== 'string') {
      result.isValid = false;
      result.errors.push('API key must be a string');
      return result;
    }

    if (apiKey.length < 10) {
      result.isValid = false;
      result.errors.push('API key is too short');
    }

    if (apiKey.length > 200) {
      result.isValid = false;
      result.errors.push('API key is too long');
    }

    // Check for common patterns that might indicate invalid keys
    if (apiKey.includes(' ') || apiKey.includes('\n') || apiKey.includes('\t')) {
      result.isValid = false;
      result.errors.push('API key contains invalid characters');
    }

    return result;
  }

  /**
   * Validate date input
   * @param {string|Date} date - Date to validate
   * @returns {object} Validation result
   */
  static validateDate(date) {
    const result = {
      isValid: true,
      value: date,
      errors: []
    };

    let dateObj;
    
    if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      result.isValid = false;
      result.errors.push('Date must be a string or Date object');
      return result;
    }

    if (isNaN(dateObj.getTime())) {
      result.isValid = false;
      result.errors.push('Invalid date format');
      return result;
    }

    // Check if date is in reasonable range (not too far in past/future)
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

    if (dateObj < oneYearAgo) {
      result.isValid = false;
      result.errors.push('Date is too far in the past');
    }

    if (dateObj > oneYearFromNow) {
      result.isValid = false;
      result.errors.push('Date is too far in the future');
    }

    result.value = dateObj;
    return result;
  }

  /**
   * Validate numeric input
   * @param {number|string} input - Numeric input to validate
   * @param {object} options - Validation options
   * @returns {object} Validation result
   */
  static validateNumber(input, options = {}) {
    const {
      min = -Infinity,
      max = Infinity,
      integer = false
    } = options;

    const result = {
      isValid: true,
      value: input,
      errors: []
    };

    const num = typeof input === 'string' ? parseFloat(input) : input;

    if (isNaN(num)) {
      result.isValid = false;
      result.errors.push('Input must be a valid number');
      return result;
    }

    if (integer && !Number.isInteger(num)) {
      result.isValid = false;
      result.errors.push('Input must be an integer');
    }

    if (num < min) {
      result.isValid = false;
      result.errors.push(`Number must be at least ${min}`);
    }

    if (num > max) {
      result.isValid = false;
      result.errors.push(`Number must be no more than ${max}`);
    }

    result.value = num;
    return result;
  }

  /**
   * Sanitize string input to prevent XSS
   * @param {string} input - String to sanitize
   * @returns {string} Sanitized string
   */
  static sanitizeString(input) {
    if (typeof input !== 'string') {
      return '';
    }

    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .replace(/[&]/g, '&amp;') // Escape ampersands
      .trim();
  }

  /**
   * Sanitize file path to prevent directory traversal
   * @param {string} path - File path to sanitize
   * @returns {string} Sanitized path
   */
  static sanitizeFilePath(path) {
    if (typeof path !== 'string') {
      return '';
    }

    return path
      .replace(/\.\./g, '') // Remove parent directory references
      .replace(/\/+/g, '/') // Normalize slashes
      .replace(/^\/+/, '') // Remove leading slashes
      .trim();
  }

  /**
   * Validate object structure
   * @param {object} obj - Object to validate
   * @param {object} schema - Validation schema
   * @returns {object} Validation result
   */
  static validateObject(obj, schema) {
    const result = {
      isValid: true,
      value: obj,
      errors: []
    };

    if (typeof obj !== 'object' || obj === null) {
      result.isValid = false;
      result.errors.push('Input must be an object');
      return result;
    }

    // Check required fields
    for (const [field, rules] of Object.entries(schema)) {
      if (rules.required && !(field in obj)) {
        result.isValid = false;
        result.errors.push(`Required field '${field}' is missing`);
        continue;
      }

      if (field in obj) {
        const fieldResult = this.validateField(obj[field], rules);
        if (!fieldResult.isValid) {
          result.isValid = false;
          result.errors.push(...fieldResult.errors.map(err => `${field}: ${err}`));
        }
      }
    }

    return result;
  }

  /**
   * Validate individual field
   * @param {any} value - Field value
   * @param {object} rules - Validation rules
   * @returns {object} Validation result
   */
  static validateField(value, rules) {
    const { type, required, min, max, pattern, custom } = rules;

    const result = {
      isValid: true,
      value: value,
      errors: []
    };

    if (required && (value === undefined || value === null)) {
      result.isValid = false;
      result.errors.push('Field is required');
      return result;
    }

    if (value === undefined || value === null) {
      return result; // Optional field
    }

    switch (type) {
      case 'string':
        return this.validateString(value, { minLength: min, maxLength: max, pattern });
      case 'number':
        return this.validateNumber(value, { min, max, integer: rules.integer });
      case 'date':
        return this.validateDate(value);
      case 'boolean':
        if (typeof value !== 'boolean') {
          result.isValid = false;
          result.errors.push('Field must be a boolean');
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          result.isValid = false;
          result.errors.push('Field must be an array');
        }
        break;
      case 'object':
        if (typeof value !== 'object' || value === null) {
          result.isValid = false;
          result.errors.push('Field must be an object');
        }
        break;
    }

    if (custom && typeof custom === 'function') {
      const customResult = custom(value);
      if (!customResult.isValid) {
        result.isValid = false;
        result.errors.push(...customResult.errors);
      }
    }

    return result;
  }
}

/**
 * Common validation schemas
 */
export const VALIDATION_SCHEMAS = {
  CRM_KEY: {
    type: 'string',
    required: true,
    min: 10,
    max: 200
  },
  
  FILE_PATH: {
    type: 'string',
    required: true,
    min: 1,
    max: 500
  },
  
  DATE_RANGE: {
    startDate: {
      type: 'date',
      required: true
    },
    endDate: {
      type: 'date',
      required: true
    }
  },
  
  API_OPTIONS: {
    timeoutMs: {
      type: 'number',
      required: false,
      min: 1000,
      max: 300000
    },
    baseUrl: {
      type: 'string',
      required: false,
      pattern: /^https?:\/\//
    }
  }
};
