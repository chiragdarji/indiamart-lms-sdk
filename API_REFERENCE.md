# IndiaMART LMS SDK - API Reference

## 📚 Complete API Documentation

This document provides comprehensive API reference for the IndiaMART LMS SDK.

---

## 🏗️ Core Classes

### IndiaMartSDK

The main SDK class that provides a simplified interface for IndiaMART LMS integration.

```javascript
import { IndiaMartSDK } from 'indiamart-lms-sdk';
```

#### Constructor

```javascript
new IndiaMartSDK(crmKey, options)
```

**Parameters:**
- `crmKey` (string, required): Your IndiaMART CRM API key
- `options` (object, optional): Configuration options

**Options Object:**
```typescript
interface SDKOptions {
  timeoutMs?: number;           // API timeout in milliseconds (default: 30000)
  baseUrl?: string;            // Custom base URL (optional)
  downloadPath?: string;       // Download directory (default: './downloads')
  logPath?: string;           // Log directory (default: './logs')
  paths?: {                   // Comprehensive path configuration
    downloadPath?: string;    // Download directory
    logPath?: string;         // Log directory
    dataPath?: string;        // Data storage directory
    leadsPath?: string;       // Leads storage directory
    processedPath?: string;   // Processed leads directory
    failedPath?: string;      // Failed leads directory
    apiLogFile?: string;      // API logs filename
    rateLimitFile?: string;   // Rate limit filename
  };
}
```

**Example:**
```javascript
const sdk = new IndiaMartSDK('your-crm-key', {
  timeoutMs: 30000,
  paths: {
    downloadPath: './downloads',
    logPath: './logs',
    dataPath: './data'
  }
});
```

---

## 📖 Method Reference

### Lead Fetching Methods

#### `getLeadsForToday()`

Fetch leads for today.

```javascript
const result = await sdk.getLeadsForToday();
```

**Returns:**
```typescript
interface LeadResult {
  success: boolean;           // Whether the operation was successful
  code: number;              // HTTP status code
  message: string;           // Response message
  totalRecords: number;      // Total number of records
  leads: Lead[];            // Array of lead objects
  raw: object;              // Raw API response
  downloadPath: string | null; // Path to downloaded JSON file
  compliance?: object;       // Date compliance information
}
```

**Example:**
```javascript
const result = await sdk.getLeadsForToday();
if (result.success) {
  console.log(`Found ${result.leads.length} leads`);
  console.log(`Downloaded to: ${result.downloadPath}`);
} else {
  console.error('Error:', result.error);
}
```

#### `getLeadsForYesterday()`

Fetch leads for yesterday.

```javascript
const result = await sdk.getLeadsForYesterday();
```

**Returns:** Same as `getLeadsForToday()`

#### `getLeadsForDate(date)`

Fetch leads for a specific date.

```javascript
const result = await sdk.getLeadsForDate('2024-01-15');
```

**Parameters:**
- `date` (string|Date): Date in YYYY-MM-DD format or Date object

**Returns:** Same as `getLeadsForToday()`

#### `getLeadsForDateRange(startDate, endDate)`

Fetch leads for a date range.

```javascript
const result = await sdk.getLeadsForDateRange('2024-01-01', '2024-01-07');
```

**Parameters:**
- `startDate` (string|Date): Start date in YYYY-MM-DD format or Date object
- `endDate` (string|Date): End date in YYYY-MM-DD format or Date object

**Returns:** Same as `getLeadsForToday()`

**Note:** Date range must comply with IndiaMART API limits (max 7 days, not older than 365 days)

#### `getLeadsForLastDays(days)`

Fetch leads for the last N days.

```javascript
const result = await sdk.getLeadsForLastDays(7);
```

**Parameters:**
- `days` (number): Number of days to fetch (1-7)

**Returns:** Same as `getLeadsForToday()`

---

### Utility Methods

#### `validateInput(input, rules)`

Validate input data according to specified rules.

```javascript
const validation = sdk.validateInput(input, rules);
```

**Parameters:**
- `input` (any): Input data to validate
- `rules` (object): Validation rules

**Validation Rules:**
```typescript
interface ValidationRules {
  type: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';
  required?: boolean;        // Whether the field is required
  min?: number;             // Minimum value/length
  max?: number;             // Maximum value/length
  pattern?: RegExp;         // Regular expression pattern
  integer?: boolean;        // Whether number must be integer
  custom?: (value: any) => ValidationResult; // Custom validation function
}
```

**Returns:**
```typescript
interface ValidationResult {
  isValid: boolean;         // Whether validation passed
  value: any;              // Sanitized value
  errors: string[];        // Array of error messages
}
```

**Examples:**
```javascript
// Email validation
const emailValidation = sdk.validateInput('user@example.com', {
  type: 'string',
  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  min: 5,
  max: 100
});

// Number validation
const numberValidation = sdk.validateInput(42, {
  type: 'number',
  min: 0,
  max: 100,
  integer: true
});

// Date validation
const dateValidation = sdk.validateInput('2024-01-15', {
  type: 'date'
});
```

---

### Monitoring Methods

#### `getHealthStatus()`

Get comprehensive SDK health status.

```javascript
const health = await sdk.getHealthStatus();
```

**Returns:**
```typescript
interface HealthStatus {
  success: boolean;         // Whether health check passed
  status: 'healthy' | 'unhealthy'; // Overall health status
  components: {            // Individual component status
    cache: {
      status: 'active' | 'inactive';
      stats: CacheStats;
    };
    rateLimiter: {
      status: 'active' | 'blocked';
      status: RateLimitStatus;
    };
    logger: {
      status: 'active' | 'inactive';
    };
    client: {
      status: 'initialized' | 'not_initialized';
    };
  };
  error?: string;          // Error message if unhealthy
}
```

**Example:**
```javascript
const health = await sdk.getHealthStatus();
console.log('SDK Status:', health.status);
console.log('Cache Status:', health.components.cache.status);
```

#### `getCacheStats()`

Get cache performance statistics.

```javascript
const stats = sdk.getCacheStats();
```

**Returns:**
```typescript
interface CacheStats {
  size: number;            // Current cache size
  hits: number;           // Number of cache hits
  misses: number;         // Number of cache misses
  evictions: number;      // Number of evictions
  hitRate: number;        // Cache hit rate percentage
  totalRequests: number;  // Total requests made
}
```

**Example:**
```javascript
const stats = sdk.getCacheStats();
console.log(`Cache hit rate: ${stats.hitRate}%`);
console.log(`Cache size: ${stats.size} entries`);
```

#### `getAPILogs(limit)`

Get API call logs.

```javascript
const logs = sdk.getAPILogs(50);
```

**Parameters:**
- `limit` (number, optional): Maximum number of logs to return (default: 50)

**Returns:**
```typescript
interface APILog {
  timestamp: string;       // Log timestamp
  method: string;         // HTTP method
  url: string;           // API endpoint
  statusCode: number;    // HTTP status code
  responseTime: number;  // Response time in milliseconds
  success: boolean;      // Whether call was successful
  leadsCount: number;    // Number of leads returned
  totalRecords: number;  // Total records available
  error?: string;        // Error message if failed
}
```

#### `getSecureLogs(limit)`

Get secure logs (sanitized).

```javascript
const logs = await sdk.getSecureLogs(100);
```

**Parameters:**
- `limit` (number, optional): Maximum number of logs to return (default: 100)

**Returns:** Array of sanitized log entries

#### `getRateLimitStatus()`

Get current rate limit status.

```javascript
const status = sdk.getRateLimitStatus();
```

**Returns:**
```typescript
interface RateLimitStatus {
  isBlocked: boolean;     // Whether currently blocked
  callsPerMinute: number; // Calls made in current minute
  callsPerHour: number;   // Calls made in current hour
  retryAfter?: number;    // Seconds until retry allowed
}
```

#### `getAPIStats()`

Get API call statistics.

```javascript
const stats = sdk.getAPIStats();
```

**Returns:**
```typescript
interface APIStats {
  totalCalls: number;     // Total API calls made
  successfulCalls: number; // Successful calls
  failedCalls: number;    // Failed calls
  averageResponseTime: number; // Average response time
}
```

---

### Cache Management Methods

#### `clearCache(pattern)`

Clear cache entries.

```javascript
// Clear all cache
await sdk.clearCache();

// Clear specific pattern
await sdk.clearCache('leads:.*');
```

**Parameters:**
- `pattern` (string, optional): Regular expression pattern to match cache keys

**Returns:**
```typescript
interface ClearResult {
  success: boolean;       // Whether operation succeeded
  message: string;        // Result message
  error?: string;         // Error message if failed
}
```

#### `getCacheKeys()`

Get all cache keys.

```javascript
const keys = sdk.cache.getKeys();
```

**Returns:** Array of cache key strings

---

### Log Management Methods

#### `clearOldSecureLogs(days)`

Clear old secure log files.

```javascript
await sdk.clearOldSecureLogs(30);
```

**Parameters:**
- `days` (number): Number of days to keep (default: 30)

**Returns:**
```typescript
interface ClearResult {
  success: boolean;
  message: string;
  error?: string;
}
```

---

### Resource Management Methods

#### `destroy()`

Destroy SDK instance and cleanup resources.

```javascript
await sdk.destroy();
```

**Returns:**
```typescript
interface DestroyResult {
  success: boolean;
  message: string;
  error?: string;
}
```

**Note:** This method should be called when the SDK is no longer needed to free up resources.

---

## 🔧 Static Methods

### `IndiaMartSDK.formatDate(date, format)`

Format a date to IndiaMART-compatible format.

```javascript
const formatted = IndiaMartSDK.formatDate(new Date(), 'timestamp');
```

**Parameters:**
- `date` (Date|string|number): Date to format
- `format` (string): Format type ('date' or 'timestamp')

**Returns:** Formatted date string

### `IndiaMartSDK.validateDateRange(startDate, endDate)`

Validate a date range for IndiaMART API compliance.

```javascript
const validation = IndiaMartSDK.validateDateRange('2024-01-01', '2024-01-07');
```

**Parameters:**
- `startDate` (Date|string): Start date
- `endDate` (Date|string): End date

**Returns:**
```typescript
interface DateValidationResult {
  isValid: boolean;        // Whether date range is valid
  errors: string[];        // Array of validation errors
}
```

---

## 📊 Data Types

### Lead Object

```typescript
interface Lead {
  leadId: string;          // Unique lead identifier
  companyName: string;     // Company name
  contactPerson: string;   // Contact person name
  email: string;          // Email address
  phone: string;          // Phone number
  city: string;           // City
  state: string;          // State
  country: string;        // Country
  requirement: string;    // Requirement description
  leadDate: string;       // Lead date
  source: string;         // Lead source
  // ... additional fields as per IndiaMART API
}
```

### Error Object

```typescript
interface SDKError extends Error {
  code: number;           // Error code
  statusCode?: number;    // HTTP status code
  retryable: boolean;     // Whether error is retryable
  details?: any;          // Additional error details
}
```

---

## 🔍 Error Codes

| Code | Description | Retryable |
|------|-------------|-----------|
| 400 | Bad Request | No |
| 401 | Unauthorized | No |
| 403 | Forbidden | No |
| 404 | Not Found | No |
| 429 | Too Many Requests | Yes |
| 500 | Internal Server Error | Yes |
| 502 | Bad Gateway | Yes |
| 503 | Service Unavailable | Yes |
| 504 | Gateway Timeout | Yes |

---

## 📝 Log Levels

| Level | Value | Description |
|-------|-------|-------------|
| ERROR | 0 | Error messages only |
| WARN | 1 | Warnings and errors |
| INFO | 2 | Informational messages |
| DEBUG | 3 | Debug information |

---

## 🚀 Examples

### Basic Usage

```javascript
import { IndiaMartSDK } from 'indiamart-lms-sdk';

const sdk = new IndiaMartSDK(process.env.INDIAMART_CRM_KEY);

// Fetch leads for yesterday
const result = await sdk.getLeadsForYesterday();
if (result.success) {
  console.log(`Found ${result.leads.length} leads`);
}
```

### Advanced Usage

```javascript
import { IndiaMartSDK } from 'indiamart-lms-sdk';

const sdk = new IndiaMartSDK(process.env.INDIAMART_CRM_KEY, {
  paths: {
    downloadPath: './downloads',
    logPath: './logs'
  }
});

// Health check
const health = await sdk.getHealthStatus();
console.log('SDK Health:', health.status);

// Cache management
const cacheStats = sdk.getCacheStats();
console.log('Cache Hit Rate:', cacheStats.hitRate);

// Clear cache
await sdk.clearCache();
```

### Error Handling

```javascript
try {
  const result = await sdk.getLeadsForDateRange('2024-01-01', '2024-01-07');
  
  if (!result.success) {
    console.error('API Error:', result.error);
    console.error('Error Code:', result.code);
    return;
  }
  
  console.log(`Successfully fetched ${result.leads.length} leads`);
} catch (error) {
  console.error('Unexpected error:', error.message);
}
```

---

**Last Updated**: September 6, 2025  
**Version**: 2.0.0  
**Status**: Production Ready ✅
