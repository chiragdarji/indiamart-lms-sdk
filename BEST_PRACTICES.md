# IndiaMART LMS SDK - Best Practices Guide

## 🏆 Production-Ready Best Practices

This guide provides comprehensive best practices for using the IndiaMART LMS SDK in production environments.

---

## 🔒 Security Best Practices

### 1. API Key Management

#### ✅ DO: Secure API Key Storage
```javascript
// Use environment variables
const sdk = new IndiaMartSDK(process.env.INDIAMART_CRM_KEY);

// Or use a secure configuration service
const sdk = new IndiaMartSDK(configService.get('indiamart.crmKey'));
```

#### ❌ DON'T: Hardcode API Keys
```javascript
// NEVER do this
const sdk = new IndiaMartSDK('your-actual-api-key-here');
```

#### ✅ DO: Validate API Keys
```javascript
// Validate API key format before using
const keyValidation = InputValidator.validateApiKey(process.env.INDIAMART_CRM_KEY);
if (!keyValidation.isValid) {
  throw new Error('Invalid API key format');
}
```

### 2. Input Validation

#### ✅ DO: Validate All Inputs
```javascript
// Always validate user inputs
const emailValidation = sdk.validateInput(userEmail, {
  type: 'string',
  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  min: 5,
  max: 100
});

if (!emailValidation.isValid) {
  throw new Error(`Invalid email: ${emailValidation.errors.join(', ')}`);
}
```

#### ✅ DO: Sanitize File Paths
```javascript
// Validate file paths to prevent directory traversal
const pathValidation = InputValidator.validateFilePath(userProvidedPath);
if (!pathValidation.isValid) {
  throw new Error('Invalid file path');
}
```

### 3. Secure Logging

#### ✅ DO: Use Secure Logging
```javascript
// Sensitive data is automatically redacted
await sdk.secureLogger.info('Processing lead', {
  leadId: lead.id,
  companyName: lead.companyName,
  // API keys and passwords are automatically redacted
  apiKey: 'secret-key' // Will be logged as [REDACTED]
});
```

#### ❌ DON'T: Log Sensitive Data
```javascript
// NEVER do this
console.log('API Key:', process.env.INDIAMART_CRM_KEY);
console.log('Lead data:', JSON.stringify(lead)); // May contain sensitive data
```

---

## ⚡ Performance Best Practices

### 1. Caching Strategy

#### ✅ DO: Monitor Cache Performance
```javascript
// Regular cache monitoring
setInterval(() => {
  const cacheStats = sdk.getCacheStats();
  if (cacheStats.hitRate < 50) {
    console.warn('Low cache hit rate:', cacheStats.hitRate);
  }
}, 300000); // Check every 5 minutes
```

#### ✅ DO: Clear Cache Periodically
```javascript
// Clear cache during low-traffic periods
setInterval(async () => {
  await sdk.clearCache();
  console.log('Cache cleared');
}, 3600000); // Clear every hour
```

#### ✅ DO: Use Appropriate Cache Patterns
```javascript
// Cache frequently accessed data
const cacheKey = `leads:${dateRange}`;
const cachedResult = sdk.cache.get(cacheKey);
if (cachedResult) {
  return cachedResult;
}

// Cache the result
const result = await sdk.getLeadsForDateRange(startDate, endDate);
sdk.cache.set(cacheKey, result, 300000); // 5 minutes TTL
```

### 2. Memory Management

#### ✅ DO: Cleanup Resources
```javascript
// Always cleanup when done
const sdk = new IndiaMartSDK(crmKey);
try {
  // Use SDK
} finally {
  await sdk.destroy();
}
```

#### ✅ DO: Monitor Memory Usage
```javascript
// Monitor memory usage in production
setInterval(() => {
  const usage = process.memoryUsage();
  if (usage.heapUsed > 100 * 1024 * 1024) { // 100MB
    console.warn('High memory usage:', usage.heapUsed);
  }
}, 60000); // Check every minute
```

### 3. Async Operations

#### ✅ DO: Use Async/Await
```javascript
// Use async/await for better error handling
async function fetchLeads() {
  try {
    const result = await sdk.getLeadsForYesterday();
    return result;
  } catch (error) {
    console.error('Error fetching leads:', error.message);
    throw error;
  }
}
```

#### ❌ DON'T: Use Callbacks
```javascript
// Avoid callback-based patterns
sdk.getLeadsForYesterday((error, result) => {
  // This pattern is not supported
});
```

---

## 🛡️ Error Handling Best Practices

### 1. Comprehensive Error Handling

#### ✅ DO: Handle All Error Types
```javascript
async function processLeads() {
  try {
    const result = await sdk.getLeadsForYesterday();
    
    if (!result.success) {
      // Handle API errors
      switch (result.code) {
        case 400:
          console.error('Bad request:', result.error);
          break;
        case 401:
          console.error('Authentication failed:', result.error);
          break;
        case 429:
          console.error('Rate limit exceeded:', result.error);
          // Implement backoff strategy
          await new Promise(resolve => setTimeout(resolve, 60000));
          break;
        default:
          console.error('Unknown error:', result.error);
      }
      return;
    }
    
    // Process successful result
    console.log(`Processed ${result.leads.length} leads`);
    
  } catch (error) {
    // Handle unexpected errors
    console.error('Unexpected error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}
```

#### ✅ DO: Implement Retry Logic
```javascript
async function fetchLeadsWithRetry(maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await sdk.getLeadsForYesterday();
      if (result.success) {
        return result;
      }
      
      // Don't retry on client errors
      if (result.code >= 400 && result.code < 500) {
        throw new Error(result.error);
      }
      
      // Retry on server errors
      if (attempt === maxRetries) {
        throw new Error(`Failed after ${maxRetries} attempts: ${result.error}`);
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      console.warn(`Attempt ${attempt} failed:`, error.message);
    }
  }
}
```

### 2. Logging Errors

#### ✅ DO: Log Errors Securely
```javascript
try {
  const result = await sdk.getLeadsForDateRange(startDate, endDate);
} catch (error) {
  // Log error without sensitive data
  await sdk.secureLogger.error('Failed to fetch leads', {
    startDate,
    endDate,
    error: error.message,
    // Don't log the full error object as it may contain sensitive data
  });
}
```

---

## 📊 Monitoring Best Practices

### 1. Health Monitoring

#### ✅ DO: Regular Health Checks
```javascript
// Implement health check endpoint
app.get('/health', async (req, res) => {
  try {
    const health = await sdk.getHealthStatus();
    res.status(health.status === 'healthy' ? 200 : 503).json(health);
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
});
```

#### ✅ DO: Monitor Key Metrics
```javascript
// Monitor important metrics
setInterval(async () => {
  const health = await sdk.getHealthStatus();
  const cacheStats = sdk.getCacheStats();
  const apiStats = sdk.getAPIStats();
  
  // Send metrics to monitoring service
  metricsService.record('sdk.health', health.status === 'healthy' ? 1 : 0);
  metricsService.record('sdk.cache.hit_rate', cacheStats.hitRate);
  metricsService.record('sdk.api.success_rate', 
    apiStats.totalCalls > 0 ? apiStats.successfulCalls / apiStats.totalCalls : 0
  );
}, 60000); // Every minute
```

### 2. Alerting

#### ✅ DO: Set Up Alerts
```javascript
// Alert on critical issues
if (health.status !== 'healthy') {
  alertService.send('SDK Health Alert', {
    status: health.status,
    components: health.components,
    timestamp: new Date().toISOString()
  });
}

// Alert on low cache performance
if (cacheStats.hitRate < 30) {
  alertService.send('Low Cache Hit Rate', {
    hitRate: cacheStats.hitRate,
    size: cacheStats.size
  });
}
```

---

## 🔧 Configuration Best Practices

### 1. Environment-Specific Configuration

#### ✅ DO: Use Environment-Specific Settings
```javascript
const config = {
  development: {
    logLevel: 3, // DEBUG
    enableConsole: true,
    cacheSize: 100
  },
  production: {
    logLevel: 1, // WARN
    enableConsole: false,
    cacheSize: 1000
  }
};

const sdk = new IndiaMartSDK(process.env.INDIAMART_CRM_KEY, {
  logLevel: config[process.env.NODE_ENV].logLevel,
  cacheSize: config[process.env.NODE_ENV].cacheSize
});
```

#### ✅ DO: Use Configuration Files
```javascript
// config/production.json
{
  "indiamart": {
    "timeoutMs": 30000,
    "paths": {
      "downloadPath": "/var/app/downloads",
      "logPath": "/var/log/indiamart-sdk"
    }
  }
}

// Load configuration
const config = require('./config/production.json');
const sdk = new IndiaMartSDK(process.env.INDIAMART_CRM_KEY, config.indiamart);
```

### 2. Path Configuration

#### ✅ DO: Use Absolute Paths in Production
```javascript
const sdk = new IndiaMartSDK(crmKey, {
  paths: {
    downloadPath: '/var/app/downloads',
    logPath: '/var/log/indiamart-sdk',
    dataPath: '/var/app/data'
  }
});
```

#### ✅ DO: Ensure Directory Permissions
```javascript
// Ensure directories exist and have proper permissions
const fs = require('fs');
const path = require('path');

const ensureDirectory = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true, mode: 0o755 });
  }
};

ensureDirectory('/var/app/downloads');
ensureDirectory('/var/log/indiamart-sdk');
```

---

## 🚀 Deployment Best Practices

### 1. Docker Deployment

#### ✅ DO: Use Multi-Stage Builds
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Create directories with proper permissions
RUN mkdir -p /app/downloads /app/logs /app/data && \
    chown -R node:node /app

USER node
EXPOSE 3000
CMD ["node", "server.js"]
```

#### ✅ DO: Use Health Checks
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

### 2. AWS Lambda Deployment

#### ✅ DO: Optimize for Lambda
```javascript
// lambda-handler.js
let sdk;

const getSDK = () => {
  if (!sdk) {
    sdk = new IndiaMartSDK(process.env.INDIAMART_CRM_KEY, {
      paths: {
        downloadPath: '/tmp/downloads',
        logPath: '/tmp/logs'
      }
    });
  }
  return sdk;
};

exports.handler = async (event) => {
  const sdk = getSDK();
  const result = await sdk.getLeadsForYesterday();
  return result;
};
```

### 3. Kubernetes Deployment

#### ✅ DO: Use ConfigMaps and Secrets
```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: indiamart-sdk-config
data:
  LOG_LEVEL: "2"
  DOWNLOAD_PATH: "/app/downloads"
  LOG_PATH: "/app/logs"

---
# secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: indiamart-sdk-secret
type: Opaque
data:
  INDIAMART_CRM_KEY: <base64-encoded-key>
```

---

## 📝 Logging Best Practices

### 1. Structured Logging

#### ✅ DO: Use Structured Logs
```javascript
// Use structured logging for better analysis
await sdk.secureLogger.info('Lead processing started', {
  leadId: lead.id,
  companyName: lead.companyName,
  timestamp: new Date().toISOString(),
  processId: process.pid
});
```

#### ✅ DO: Include Context
```javascript
// Include relevant context in logs
await sdk.secureLogger.error('API call failed', {
  endpoint: 'getLeads',
  startDate,
  endDate,
  error: error.message,
  retryCount: attempt,
  timestamp: new Date().toISOString()
});
```

### 2. Log Rotation

#### ✅ DO: Implement Log Rotation
```javascript
// Clear old logs regularly
setInterval(async () => {
  await sdk.clearOldSecureLogs(30); // Keep 30 days
}, 86400000); // Daily
```

---

## 🧪 Testing Best Practices

### 1. Unit Testing

#### ✅ DO: Test Error Scenarios
```javascript
describe('SDK Error Handling', () => {
  it('should handle invalid API key', async () => {
    const sdk = new IndiaMartSDK('invalid-key');
    const result = await sdk.getLeadsForYesterday();
    expect(result.success).toBe(false);
    expect(result.code).toBe(401);
  });
  
  it('should handle invalid date range', async () => {
    const sdk = new IndiaMartSDK(validKey);
    const result = await sdk.getLeadsForDateRange('invalid', 'date');
    expect(result.success).toBe(false);
    expect(result.code).toBe(400);
  });
});
```

#### ✅ DO: Mock External Dependencies
```javascript
// Mock the SDK for testing
jest.mock('indiamart-lms-sdk', () => ({
  IndiaMartSDK: jest.fn().mockImplementation(() => ({
    getLeadsForYesterday: jest.fn().mockResolvedValue({
      success: true,
      leads: mockLeads
    })
  }))
}));
```

### 2. Integration Testing

#### ✅ DO: Test with Real API (in staging)
```javascript
describe('SDK Integration Tests', () => {
  it('should fetch leads successfully', async () => {
    const sdk = new IndiaMartSDK(process.env.TEST_CRM_KEY);
    const result = await sdk.getLeadsForYesterday();
    expect(result.success).toBe(true);
    expect(Array.isArray(result.leads)).toBe(true);
  });
});
```

---

## 🔄 Maintenance Best Practices

### 1. Regular Updates

#### ✅ DO: Keep SDK Updated
```bash
# Check for updates regularly
npm outdated indiamart-lms-sdk

# Update to latest version
npm update indiamart-lms-sdk
```

#### ✅ DO: Monitor Dependencies
```bash
# Audit for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

### 2. Performance Monitoring

#### ✅ DO: Monitor Performance Metrics
```javascript
// Track performance metrics
const startTime = Date.now();
const result = await sdk.getLeadsForYesterday();
const duration = Date.now() - startTime;

// Log performance metrics
await sdk.secureLogger.info('API call completed', {
  duration,
  leadsCount: result.leads.length,
  success: result.success
});
```

---

## 🚨 Common Pitfalls to Avoid

### 1. Memory Leaks

#### ❌ DON'T: Forget to Cleanup
```javascript
// BAD: SDK instance not destroyed
const sdk = new IndiaMartSDK(crmKey);
// Use SDK but never destroy it

// GOOD: Always cleanup
const sdk = new IndiaMartSDK(crmKey);
try {
  // Use SDK
} finally {
  await sdk.destroy();
}
```

### 2. Error Handling

#### ❌ DON'T: Ignore Errors
```javascript
// BAD: Ignoring errors
const result = await sdk.getLeadsForYesterday();
// No error handling

// GOOD: Proper error handling
try {
  const result = await sdk.getLeadsForYesterday();
  if (!result.success) {
    console.error('Failed to fetch leads:', result.error);
    return;
  }
  // Process result
} catch (error) {
  console.error('Unexpected error:', error.message);
}
```

### 3. Configuration

#### ❌ DON'T: Use Relative Paths in Production
```javascript
// BAD: Relative paths in production
const sdk = new IndiaMartSDK(crmKey, {
  downloadPath: './downloads' // May not work in production
});

// GOOD: Absolute paths in production
const sdk = new IndiaMartSDK(crmKey, {
  downloadPath: '/var/app/downloads'
});
```

---

## 📚 Additional Resources

- [SDK Documentation](./SDK_DOCUMENTATION.md) - Complete documentation
- [API Reference](./API_REFERENCE.md) - Detailed API reference
- [Examples](./examples/) - Working code examples
- [Security Guide](./SECURITY_AND_PERFORMANCE_FIXES.md) - Security implementation details

---

**Last Updated**: September 6, 2025  
**Version**: 2.0.0  
**Status**: Production Ready ✅
