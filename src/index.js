/**
 * IndiaMART LMS SDK - Main Entry Point
 * 
 * This is the main entry point for the IndiaMART LMS SDK.
 * It provides both a simplified SDK interface and access to advanced functionality.
 */

// Primary SDK - Simple interface requiring only CRM key
export { IndiaMartSDK, default } from './sdk.js';

// Advanced functionality - For users who need more control
export { IndiaMartClient } from './indiamart-client.js';
export { IndiaMartResponseHandler, FIELD_DOCUMENTATION } from './response-handler.js';
export { IndiaMartComplianceManager, COMPLIANCE_CONSTANTS } from './api-compliance.js';
export { IndiaMartError, IndiaMartErrorHandler, ERROR_TYPES } from './error-handler.js';
export { InputValidator, VALIDATION_SCHEMAS } from './input-validator.js';
export { SecureLogger, LOG_LEVELS } from './secure-logger.js';
export { CacheManager } from './cache-manager.js';

// Re-export everything for convenience (advanced users)
export * from './indiamart-client.js';
export * from './response-handler.js';
export * from './api-compliance.js';
export * from './error-handler.js';
export * from './input-validator.js';
export * from './secure-logger.js';
export * from './cache-manager.js';
