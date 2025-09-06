# IndiaMART LMS SDK - Comprehensive Documentation

## 📚 Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [API Reference](#api-reference)
5. [Configuration](#configuration)
6. [Security](#security)
7. [Performance](#performance)
8. [Error Handling](#error-handling)
9. [Logging and Monitoring](#logging-and-monitoring)
10. [Best Practices](#best-practices)
11. [Examples](#examples)
12. [Troubleshooting](#troubleshooting)
13. [Migration Guide](#migration-guide)
14. [Changelog](#changelog)

---

## 🚀 Overview

The IndiaMART LMS SDK is a comprehensive Node.js library for integrating with the IndiaMART Lead Management System (LMS) API. It provides a simple, secure, and performant interface for fetching leads, managing data, and handling all aspects of lead management.

### ✨ Key Features

- **🔒 Security First**: Comprehensive input validation, secure logging, and data protection
- **⚡ High Performance**: Built-in caching, async operations, and memory optimization
- **🛡️ Production Ready**: Enterprise-grade error handling, monitoring, and reliability
- **📊 Easy Integration**: Simple API requiring only a CRM key
- **🔧 Configurable**: Flexible configuration for various deployment scenarios
- **📝 Comprehensive Logging**: Detailed logging with sensitive data protection
- **💾 Data Management**: Automatic JSON file downloads and data organization

### 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    IndiaMART LMS SDK                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Input     │  │   Secure    │  │   Cache     │        │
│  │ Validator   │  │   Logger    │  │  Manager    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Rate      │  │   Date      │  │   File      │        │
│  │  Limiter    │  │ Compliance  │  │  Storage    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Error     │  │  Response   │  │   IndiaMART │        │
│  │  Handler    │  │  Handler    │  │   Client    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Installation

### Prerequisites

- Node.js 16.0.0 or higher
- npm 7.0.0 or higher
- IndiaMART CRM API key

### Install the SDK

```bash
npm install indiamart-lms-sdk
```

### Environment Setup

Create a `.env` file in your project root:

```bash
# Required
INDIAMART_CRM_KEY=your-crm-key-here

# Optional
NODE_ENV=production
LOG_LEVEL=2
```

---

## 🚀 Quick Start

### Basic Usage

```javascript
import { IndiaMartSDK } from 'indiamart-lms-sdk';

// Initialize the SDK
const sdk = new IndiaMartSDK(process.env.INDIAMART_CRM_KEY);

// Fetch leads for yesterday
const result = await sdk.getLeadsForYesterday();

if (result.success) {
  console.log(`Found ${result.leads.length} leads`);
  console.log(`Downloaded to: ${result.downloadPath}`);
} else {
  console.error('Error:', result.error);
}
```

### Advanced Usage

```javascript
import { IndiaMartSDK } from 'indiamart-lms-sdk';

// Initialize with custom configuration
const sdk = new IndiaMartSDK(process.env.INDIAMART_CRM_KEY, {
  paths: {
    downloadPath: './downloads',
    logPath: './logs',
    dataPath: './data'
  }
});

// Fetch leads for a specific date range
const result = await sdk.getLeadsForDateRange('2024-01-01', '2024-01-07');

// Check cache statistics
const cacheStats = sdk.getCacheStats();
console.log('Cache hit rate:', cacheStats.hitRate);

// Get health status
const health = await sdk.getHealthStatus();
console.log('SDK status:', health.status);
```

---

## 📖 API Reference

### IndiaMartSDK Class

#### Constructor

```javascript
new IndiaMartSDK(crmKey, options)
```

**Parameters:**
- `crmKey` (string, required): Your IndiaMART CRM API key
- `options` (object, optional): Configuration options

**Options:**
```javascript
{
  timeoutMs: 30000,           // API timeout in milliseconds
  baseUrl: undefined,         // Custom base URL (optional)
  downloadPath: './downloads', // Download directory
  logPath: './logs',          // Log directory
  paths: {                    // Comprehensive path configuration
    downloadPath: './downloads',
    logPath: './logs',
    dataPath: './data',
    leadsPath: './data/leads',
    processedPath: './data/processed',
    failedPath: './data/failed',
    apiLogFile: 'api-logs.json',
    rateLimitFile: 'rate-limits.json'
  }
}
```

#### Core Methods

##### `getLeadsForToday()`
Fetch leads for today.

```javascript
const result = await sdk.getLeadsForToday();
```

**Returns:**
```javascript
{
  success: boolean,
  code: number,
  message: string,
  totalRecords: number,
  leads: Array,
  raw: object,
  downloadPath: string | null
}
```

##### `getLeadsForYesterday()`
Fetch leads for yesterday.

```javascript
const result = await sdk.getLeadsForYesterday();
```

##### `getLeadsForDate(date)`
Fetch leads for a specific date.

```javascript
const result = await sdk.getLeadsForDate('2024-01-15');
```

##### `getLeadsForDateRange(startDate, endDate)`
Fetch leads for a date range.

```javascript
const result = await sdk.getLeadsForDateRange('2024-01-01', '2024-01-07');
```

##### `getLeadsForLastDays(days)`
Fetch leads for the last N days.

```javascript
const result = await sdk.getLeadsForLastDays(7);
```

#### Utility Methods

##### `validateInput(input, rules)`
Validate input data.

```javascript
const validation = sdk.validateInput('test@example.com', {
  type: 'string',
  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  min: 5,
  max: 100
});
```

##### `getHealthStatus()`
Get SDK health status.

```javascript
const health = await sdk.getHealthStatus();
```

##### `getCacheStats()`
Get cache statistics.

```javascript
const stats = sdk.getCacheStats();
```

##### `clearCache(pattern)`
Clear cache entries.

```javascript
// Clear all cache
await sdk.clearCache();

// Clear specific pattern
await sdk.clearCache('leads:.*');
```

#### Monitoring Methods

##### `getAPILogs(limit)`
Get API call logs.

```javascript
const logs = sdk.getAPILogs(50);
```

##### `getSecureLogs(limit)`
Get secure logs.

```javascript
const logs = await sdk.getSecureLogs(100);
```

##### `getRateLimitStatus()`
Get rate limit status.

```javascript
const status = sdk.getRateLimitStatus();
```

##### `getAPIStats()`
Get API statistics.

```javascript
const stats = sdk.getAPIStats();
```

#### Cleanup Methods

##### `destroy()`
Destroy SDK and cleanup resources.

```javascript
await sdk.destroy();
```

##### `clearOldSecureLogs(days)`
Clear old log files.

```javascript
await sdk.clearOldSecureLogs(30);
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `INDIAMART_CRM_KEY` | Your IndiaMART CRM API key | - | Yes |
| `NODE_ENV` | Environment (development/production) | development | No |
| `LOG_LEVEL` | Log level (0=ERROR, 1=WARN, 2=INFO, 3=DEBUG) | 2 | No |

### Path Configuration

#### Basic Configuration
```javascript
const sdk = new IndiaMartSDK(crmKey, {
  downloadPath: './downloads',
  logPath: './logs'
});
```

#### Comprehensive Configuration
```javascript
const sdk = new IndiaMartSDK(crmKey, {
  paths: {
    downloadPath: './downloads',
    logPath: './logs',
    dataPath: './data',
    leadsPath: './data/leads',
    processedPath: './data/processed',
    failedPath: './data/failed',
    apiLogFile: 'api-logs.json',
    rateLimitFile: 'rate-limits.json'
  }
});
```

#### Production Configuration
```javascript
const sdk = new IndiaMartSDK(crmKey, {
  paths: {
    downloadPath: '/var/app/downloads',
    logPath: '/var/log/indiamart-sdk',
    dataPath: '/var/app/data'
  }
});
```

#### Docker Configuration
```javascript
const sdk = new IndiaMartSDK(crmKey, {
  paths: {
    downloadPath: '/app/downloads',
    logPath: '/app/logs',
    dataPath: '/app/data'
  }
});
```

---

## 🔒 Security

### Input Validation

The SDK automatically validates all inputs to prevent security vulnerabilities:

```javascript
// Email validation
const emailValidation = sdk.validateInput('user@example.com', {
  type: 'string',
  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  min: 5,
  max: 100
});

// File path validation
const pathValidation = sdk.validateInput('../sensitive-file.txt', {
  type: 'string'
});
// Returns: { isValid: false, errors: ['Path traversal detected'] }
```

### Secure Logging

All logs are automatically sanitized to prevent sensitive data exposure:

```javascript
// Sensitive data is automatically redacted
await sdk.secureLogger.info('API call', {
  apiKey: 'secret-key-123',  // Will be redacted as [REDACTED]
  userId: 'user123',
  action: 'fetch_leads'
});
```

### API Key Security

- API keys are validated at initialization
- Never logged or exposed in error messages
- Automatically redacted in all logs

### Path Security

- All file paths are validated to prevent directory traversal
- Safe path construction using `path.join()`
- Automatic sanitization of user-provided paths

---

## ⚡ Performance

### Caching

The SDK includes a built-in LRU cache for improved performance:

```javascript
// Cache statistics
const stats = sdk.getCacheStats();
console.log('Cache hit rate:', stats.hitRate);
console.log('Cache size:', stats.size);

// Clear cache
await sdk.clearCache();
```

### Async Operations

All file operations are asynchronous to prevent blocking:

```javascript
// Non-blocking file operations
const result = await sdk.getLeadsForYesterday();
// File downloads happen asynchronously
```

### Memory Management

- Automatic cleanup of expired cache entries
- Proper resource cleanup on SDK destruction
- Memory-efficient data structures

---

## ⚠️ Error Handling

### Error Types

The SDK provides comprehensive error handling:

```javascript
try {
  const result = await sdk.getLeadsForDateRange('invalid', 'date');
} catch (error) {
  console.error('Error type:', error.name);
  console.error('Error message:', error.message);
  console.error('Error code:', error.code);
}
```

### Common Error Scenarios

#### Invalid API Key
```javascript
{
  success: false,
  error: 'Invalid API key - Please check your CRM key',
  code: 401
}
```

#### Date Compliance Error
```javascript
{
  success: false,
  error: 'Date compliance error: End date cannot be in the future',
  code: 400
}
```

#### Rate Limit Exceeded
```javascript
{
  success: false,
  error: 'Rate limit exceeded: Too many requests',
  code: 429
}
```

### Error Recovery

The SDK includes automatic retry logic for transient errors:

```javascript
// Automatic retry with exponential backoff
const result = await sdk.getLeadsForYesterday();
// Will retry up to 4 times for transient errors
```

---

## 📝 Logging and Monitoring

### Log Levels

| Level | Value | Description |
|-------|-------|-------------|
| ERROR | 0 | Error messages only |
| WARN | 1 | Warnings and errors |
| INFO | 2 | Informational messages |
| DEBUG | 3 | Debug information |

### Log Types

#### API Logs
```javascript
const apiLogs = sdk.getAPILogs(50);
console.log('API calls:', apiLogs.length);
```

#### Secure Logs
```javascript
const secureLogs = await sdk.getSecureLogs(100);
console.log('Secure logs:', secureLogs.length);
```

### Monitoring

#### Health Status
```javascript
const health = await sdk.getHealthStatus();
console.log('SDK status:', health.status);
console.log('Components:', health.components);
```

#### Statistics
```javascript
const apiStats = sdk.getAPIStats();
const cacheStats = sdk.getCacheStats();
const rateLimitStats = sdk.getRateLimitStats();
```

---

## 🏆 Best Practices

### 1. Error Handling

```javascript
// Always check for errors
const result = await sdk.getLeadsForYesterday();
if (!result.success) {
  console.error('Failed to fetch leads:', result.error);
  return;
}

// Use try-catch for critical operations
try {
  const result = await sdk.getLeadsForDateRange(startDate, endDate);
  // Process result
} catch (error) {
  console.error('Unexpected error:', error.message);
}
```

### 2. Resource Management

```javascript
// Always cleanup resources
const sdk = new IndiaMartSDK(crmKey);
try {
  // Use SDK
} finally {
  await sdk.destroy();
}
```

### 3. Configuration

```javascript
// Use environment variables for sensitive data
const sdk = new IndiaMartSDK(process.env.INDIAMART_CRM_KEY, {
  paths: {
    downloadPath: process.env.DOWNLOAD_PATH || './downloads',
    logPath: process.env.LOG_PATH || './logs'
  }
});
```

### 4. Monitoring

```javascript
// Regular health checks
setInterval(async () => {
  const health = await sdk.getHealthStatus();
  if (health.status !== 'healthy') {
    console.warn('SDK health issue:', health.error);
  }
}, 60000); // Check every minute
```

### 5. Caching

```javascript
// Monitor cache performance
const cacheStats = sdk.getCacheStats();
if (cacheStats.hitRate < 50) {
  console.warn('Low cache hit rate:', cacheStats.hitRate);
}

// Clear cache periodically
setInterval(async () => {
  await sdk.clearCache();
}, 3600000); // Clear every hour
```

### 6. Logging

```javascript
// Use appropriate log levels
if (process.env.NODE_ENV === 'development') {
  // Enable debug logging in development
  const sdk = new IndiaMartSDK(crmKey, {
    logLevel: 3 // DEBUG
  });
}
```

---

## 📚 Examples

### Basic Lead Fetching

```javascript
import { IndiaMartSDK } from 'indiamart-lms-sdk';

const sdk = new IndiaMartSDK(process.env.INDIAMART_CRM_KEY);

// Fetch leads for yesterday
const result = await sdk.getLeadsForYesterday();
if (result.success) {
  console.log(`Found ${result.leads.length} leads`);
  console.log(`Downloaded to: ${result.downloadPath}`);
}
```

### Batch Processing

```javascript
import { IndiaMartSDK } from 'indiamart-lms-sdk';

const sdk = new IndiaMartSDK(process.env.INDIAMART_CRM_KEY);

// Process leads for the last 30 days
const days = 30;
const result = await sdk.getLeadsForLastDays(days);

if (result.success) {
  console.log(`Processing ${result.leads.length} leads from last ${days} days`);
  
  // Process each lead
  for (const lead of result.leads) {
    console.log(`Processing lead: ${lead.leadId}`);
    // Your processing logic here
  }
}
```

### Error Handling

```javascript
import { IndiaMartSDK } from 'indiamart-lms-sdk';

const sdk = new IndiaMartSDK(process.env.INDIAMART_CRM_KEY);

try {
  const result = await sdk.getLeadsForDateRange('2024-01-01', '2024-01-07');
  
  if (!result.success) {
    switch (result.code) {
      case 400:
        console.error('Invalid request:', result.error);
        break;
      case 401:
        console.error('Authentication failed:', result.error);
        break;
      case 429:
        console.error('Rate limit exceeded:', result.error);
        break;
      default:
        console.error('Unknown error:', result.error);
    }
    return;
  }
  
  console.log(`Successfully fetched ${result.leads.length} leads`);
} catch (error) {
  console.error('Unexpected error:', error.message);
}
```

### Monitoring and Health Checks

```javascript
import { IndiaMartSDK } from 'indiamart-lms-sdk';

const sdk = new IndiaMartSDK(process.env.INDIAMART_CRM_KEY);

// Health check
const health = await sdk.getHealthStatus();
console.log('SDK Health:', health.status);

// Monitor performance
const cacheStats = sdk.getCacheStats();
const apiStats = sdk.getAPIStats();

console.log('Cache Performance:', {
  hitRate: `${cacheStats.hitRate}%`,
  size: cacheStats.size,
  totalRequests: cacheStats.totalRequests
});

console.log('API Performance:', {
  totalCalls: apiStats.totalCalls,
  successRate: `${(apiStats.successfulCalls / apiStats.totalCalls * 100).toFixed(1)}%`
});
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Invalid API Key
```
Error: Invalid API key - Please check your CRM key
```
**Solution:** Verify your `INDIAMART_CRM_KEY` environment variable is set correctly.

#### 2. Date Compliance Error
```
Error: Date compliance error: End date cannot be in the future
```
**Solution:** Ensure your date range is valid and within IndiaMART's compliance limits.

#### 3. Rate Limit Exceeded
```
Error: Rate limit exceeded: Too many requests
```
**Solution:** Wait for the rate limit to reset or implement proper rate limiting in your application.

#### 4. File Permission Error
```
Error: EACCES: permission denied, mkdir '/path/to/directory'
```
**Solution:** Ensure the SDK has write permissions to the specified directories.

### Debug Mode

Enable debug logging for troubleshooting:

```javascript
const sdk = new IndiaMartSDK(crmKey, {
  logLevel: 3 // DEBUG
});

// Or set environment variable
process.env.LOG_LEVEL = '3';
```

### Health Check

Use the health check to diagnose issues:

```javascript
const health = await sdk.getHealthStatus();
console.log('Health Status:', JSON.stringify(health, null, 2));
```

---

## 🔄 Migration Guide

### From v1.0.0 to v2.0.0

#### Breaking Changes
- Removed database support (SQLite)
- Removed CSV export functionality
- Changed default export to JSON only

#### Migration Steps

1. **Update imports:**
```javascript
// Old
import { IndiaMartClient } from 'indiamart-lms-sdk';

// New
import { IndiaMartSDK } from 'indiamart-lms-sdk';
```

2. **Update initialization:**
```javascript
// Old
const client = new IndiaMartClient({
  crmKey: process.env.INDIAMART_CRM_KEY,
  useDatabase: true,
  useFileStorage: true
});

// New
const sdk = new IndiaMartSDK(process.env.INDIAMART_CRM_KEY, {
  paths: {
    downloadPath: './downloads',
    logPath: './logs'
  }
});
```

3. **Update method calls:**
```javascript
// Old
const result = await client.getLeads({
  startTime: '2024-01-01',
  endTime: '2024-01-07'
});

// New
const result = await sdk.getLeadsForDateRange('2024-01-01', '2024-01-07');
```

---

## 📋 Changelog

### v2.0.0 (2025-09-06)

#### ✨ New Features
- **Security Enhancements**: Comprehensive input validation and sanitization
- **Performance Optimization**: Built-in caching system with LRU cache
- **Secure Logging**: Automatic sanitization of sensitive data
- **Health Monitoring**: SDK health status and component monitoring
- **Enhanced Error Handling**: Comprehensive error handling and recovery
- **Resource Management**: Proper cleanup and memory management

#### 🔒 Security Improvements
- Input validation for all user inputs
- XSS protection through input sanitization
- Path traversal prevention
- Secure API key handling
- Sensitive data redaction in logs

#### ⚡ Performance Improvements
- LRU cache with TTL support
- Async file operations
- Memory optimization
- Connection pooling
- Request batching

#### 🛠️ Breaking Changes
- Removed database support (SQLite)
- Removed CSV export functionality
- Changed default export to JSON only
- Updated API structure

#### 📚 Documentation
- Comprehensive API documentation
- Best practices guide
- Security guidelines
- Performance optimization tips
- Troubleshooting guide

---

## 📞 Support

### Getting Help

1. **Documentation**: Check this comprehensive guide
2. **Examples**: Review the examples in the `examples/` directory
3. **Issues**: Report issues on the project repository
4. **Community**: Join the developer community

### Contributing

We welcome contributions! Please see the contributing guidelines for details.

### License

This SDK is licensed under the MIT License. See the LICENSE file for details.

---

**Last Updated**: September 6, 2025  
**Version**: 2.0.0  
**Status**: Production Ready ✅
