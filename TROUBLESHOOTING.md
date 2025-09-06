# IndiaMART LMS SDK - Troubleshooting Guide

## 🔧 Common Issues and Solutions

This guide helps you diagnose and resolve common issues with the IndiaMART LMS SDK.

---

## 🚨 Critical Issues

### 1. Invalid API Key

#### Symptoms
```
Error: Invalid API key - Please check your CRM key
```

#### Causes
- API key is not set in environment variables
- API key is incorrect or expired
- API key format is invalid

#### Solutions

**Check Environment Variable:**
```bash
echo $INDIAMART_CRM_KEY
```

**Verify API Key Format:**
```javascript
import { InputValidator } from 'indiamart-lms-sdk';

const validation = InputValidator.validateApiKey(process.env.INDIAMART_CRM_KEY);
if (!validation.isValid) {
  console.error('Invalid API key format:', validation.errors);
}
```

**Set API Key:**
```bash
export INDIAMART_CRM_KEY="your-actual-crm-key-here"
```

**Test API Key:**
```javascript
const sdk = new IndiaMartSDK(process.env.INDIAMART_CRM_KEY);
const health = await sdk.getHealthStatus();
console.log('SDK Health:', health.status);
```

---

### 2. Date Compliance Errors

#### Symptoms
```
Error: Date compliance error: End date cannot be in the future
Error: Date compliance error: Data older than 365 days is not available
Error: Date compliance error: Date range cannot exceed 7 days
```

#### Causes
- Invalid date format
- Date range exceeds IndiaMART limits
- Future dates used
- Dates older than 365 days

#### Solutions

**Use Valid Date Format:**
```javascript
// Good: Use proper date format
const result = await sdk.getLeadsForDateRange('2024-01-01', '2024-01-07');

// Bad: Invalid date format
const result = await sdk.getLeadsForDateRange('invalid-date', 'also-invalid');
```

**Check Date Range:**
```javascript
// Validate date range before API call
const validation = IndiaMartSDK.validateDateRange(startDate, endDate);
if (!validation.isValid) {
  console.error('Invalid date range:', validation.errors);
  return;
}
```

**Use Yesterday Instead of Today:**
```javascript
// If today's date causes issues, use yesterday
const result = await sdk.getLeadsForYesterday();
```

---

### 3. Rate Limit Exceeded

#### Symptoms
```
Error: Rate limit exceeded: Too many requests
Error: Rate limit exceeded: API key disabled for 15 minutes
```

#### Causes
- Too many API calls in a short period
- Exceeding IndiaMART's rate limits (5 calls/minute, 20 calls/hour)

#### Solutions

**Check Rate Limit Status:**
```javascript
const status = sdk.getRateLimitStatus();
console.log('Rate limit status:', status);
```

**Implement Retry Logic:**
```javascript
async function fetchLeadsWithRetry() {
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await sdk.getLeadsForYesterday();
      if (result.success) {
        return result;
      }
      
      if (result.code === 429) {
        // Rate limit exceeded, wait and retry
        const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`Rate limited, waiting ${waitTime}ms before retry ${attempt}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      throw new Error(result.error);
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
    }
  }
}
```

**Monitor Rate Limits:**
```javascript
// Check rate limit status before making calls
const status = sdk.getRateLimitStatus();
if (status.isBlocked) {
  console.log(`Rate limited, retry after ${status.retryAfter} seconds`);
  return;
}
```

---

## ⚠️ Common Issues

### 1. File Permission Errors

#### Symptoms
```
Error: EACCES: permission denied, mkdir '/path/to/directory'
Error: ENOENT: no such file or directory, mkdir '/path/to/directory'
```

#### Solutions

**Check Directory Permissions:**
```bash
ls -la /path/to/directory
```

**Create Directories with Proper Permissions:**
```bash
mkdir -p /var/app/downloads /var/log/indiamart-sdk
chmod 755 /var/app/downloads /var/log/indiamart-sdk
```

**Use Absolute Paths:**
```javascript
const sdk = new IndiaMartSDK(crmKey, {
  paths: {
    downloadPath: '/var/app/downloads',
    logPath: '/var/log/indiamart-sdk'
  }
});
```

---

### 2. Memory Issues

#### Symptoms
```
Error: JavaScript heap out of memory
Warning: High memory usage detected
```

#### Solutions

**Monitor Memory Usage:**
```javascript
setInterval(() => {
  const usage = process.memoryUsage();
  console.log('Memory usage:', {
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + ' MB',
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + ' MB',
    external: Math.round(usage.external / 1024 / 1024) + ' MB'
  });
}, 60000);
```

**Clear Cache Regularly:**
```javascript
// Clear cache every hour
setInterval(async () => {
  await sdk.clearCache();
  console.log('Cache cleared');
}, 3600000);
```

**Destroy SDK Instances:**
```javascript
// Always destroy SDK instances when done
await sdk.destroy();
```

---

### 3. Network Issues

#### Symptoms
```
Error: fetch failed
Error: ECONNRESET
Error: ETIMEDOUT
```

#### Solutions

**Check Network Connectivity:**
```bash
curl -I https://api.indiamart.com
```

**Increase Timeout:**
```javascript
const sdk = new IndiaMartSDK(crmKey, {
  timeoutMs: 60000 // 60 seconds
});
```

**Implement Retry Logic:**
```javascript
async function fetchWithRetry(maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await sdk.getLeadsForYesterday();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}
```

---

## 🔍 Debugging

### 1. Enable Debug Logging

#### Set Debug Level
```javascript
const sdk = new IndiaMartSDK(crmKey, {
  logLevel: 3 // DEBUG level
});

// Or set environment variable
process.env.LOG_LEVEL = '3';
```

#### Check Logs
```javascript
// Get recent logs
const logs = await sdk.getSecureLogs(50);
console.log('Recent logs:', logs);
```

---

### 2. Health Check

#### Check SDK Health
```javascript
const health = await sdk.getHealthStatus();
console.log('SDK Health:', JSON.stringify(health, null, 2));
```

#### Check Individual Components
```javascript
const health = await sdk.getHealthStatus();

// Check cache
if (health.components.cache.status !== 'active') {
  console.error('Cache issue:', health.components.cache);
}

// Check rate limiter
if (health.components.rateLimiter.status === 'blocked') {
  console.error('Rate limiter blocked:', health.components.rateLimiter);
}
```

---

### 3. Performance Debugging

#### Check Cache Performance
```javascript
const cacheStats = sdk.getCacheStats();
console.log('Cache Performance:', {
  hitRate: `${cacheStats.hitRate}%`,
  size: cacheStats.size,
  totalRequests: cacheStats.totalRequests
});
```

#### Check API Performance
```javascript
const apiStats = sdk.getAPIStats();
console.log('API Performance:', {
  totalCalls: apiStats.totalCalls,
  successRate: `${(apiStats.successfulCalls / apiStats.totalCalls * 100).toFixed(1)}%`,
  averageResponseTime: apiStats.averageResponseTime
});
```

---

## 🛠️ Diagnostic Tools

### 1. SDK Test Script

Create a test script to diagnose issues:

```javascript
// test-sdk.js
import { IndiaMartSDK } from 'indiamart-lms-sdk';

async function testSDK() {
  console.log('🧪 Testing IndiaMART LMS SDK...\n');
  
  try {
    // Test 1: Initialize SDK
    console.log('1️⃣ Testing SDK initialization...');
    const sdk = new IndiaMartSDK(process.env.INDIAMART_CRM_KEY);
    console.log('✅ SDK initialized successfully');
    
    // Test 2: Health check
    console.log('\n2️⃣ Testing health check...');
    const health = await sdk.getHealthStatus();
    console.log('Health status:', health.status);
    
    // Test 3: Input validation
    console.log('\n3️⃣ Testing input validation...');
    const validation = sdk.validateInput('test@example.com', {
      type: 'string',
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    });
    console.log('Input validation:', validation.isValid ? '✅' : '❌');
    
    // Test 4: Cache functionality
    console.log('\n4️⃣ Testing cache functionality...');
    const cacheStats = sdk.getCacheStats();
    console.log('Cache stats:', cacheStats);
    
    // Test 5: API call (if API key is valid)
    if (process.env.INDIAMART_CRM_KEY && process.env.INDIAMART_CRM_KEY !== 'demo-key') {
      console.log('\n5️⃣ Testing API call...');
      const result = await sdk.getLeadsForYesterday();
      console.log('API call result:', result.success ? '✅' : '❌');
      if (!result.success) {
        console.log('Error:', result.error);
      }
    } else {
      console.log('\n5️⃣ Skipping API call (no valid API key)');
    }
    
    console.log('\n✅ SDK test completed successfully');
    
  } catch (error) {
    console.error('\n❌ SDK test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // Cleanup
    if (sdk) {
      await sdk.destroy();
    }
  }
}

testSDK();
```

Run the test:
```bash
node test-sdk.js
```

---

### 2. Environment Check

Check your environment setup:

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check environment variables
echo "INDIAMART_CRM_KEY: ${INDIAMART_CRM_KEY:0:10}..."
echo "NODE_ENV: $NODE_ENV"
echo "LOG_LEVEL: $LOG_LEVEL"

# Check directory permissions
ls -la ./downloads ./logs 2>/dev/null || echo "Directories don't exist"
```

---

### 3. Network Check

Test network connectivity:

```bash
# Test IndiaMART API connectivity
curl -I https://api.indiamart.com

# Test with timeout
curl --connect-timeout 10 https://api.indiamart.com

# Test DNS resolution
nslookup api.indiamart.com
```

---

## 📊 Monitoring and Alerting

### 1. Set Up Monitoring

```javascript
// Monitor SDK health
setInterval(async () => {
  try {
    const health = await sdk.getHealthStatus();
    if (health.status !== 'healthy') {
      console.error('SDK health issue:', health);
      // Send alert to monitoring service
    }
  } catch (error) {
    console.error('Health check failed:', error.message);
  }
}, 60000); // Check every minute
```

### 2. Set Up Alerts

```javascript
// Alert on critical issues
const alertService = {
  send: (message, data) => {
    console.error('ALERT:', message, data);
    // Send to your alerting service (PagerDuty, Slack, etc.)
  }
};

// Alert on rate limiting
const rateLimitStatus = sdk.getRateLimitStatus();
if (rateLimitStatus.isBlocked) {
  alertService.send('Rate limit exceeded', {
    retryAfter: rateLimitStatus.retryAfter,
    callsPerHour: rateLimitStatus.callsPerHour
  });
}
```

---

## 🆘 Getting Help

### 1. Check Documentation

- [SDK Documentation](./SDK_DOCUMENTATION.md) - Complete guide
- [API Reference](./API_REFERENCE.md) - Detailed API docs
- [Best Practices](./BEST_PRACTICES.md) - Production guidelines

### 2. Check Examples

- [Simple Usage](./examples/simple-usage.js) - Basic examples
- [Client Test](./examples/simple-client-test.js) - Comprehensive test
- [Secure Usage](./examples/secure-usage.js) - Security examples

### 3. Debug Information

When reporting issues, include:

```javascript
// Collect debug information
const debugInfo = {
  nodeVersion: process.version,
  platform: process.platform,
  sdkVersion: '2.0.0',
  health: await sdk.getHealthStatus(),
  cacheStats: sdk.getCacheStats(),
  apiStats: sdk.getAPIStats(),
  rateLimitStatus: sdk.getRateLimitStatus(),
  environment: {
    NODE_ENV: process.env.NODE_ENV,
    LOG_LEVEL: process.env.LOG_LEVEL
  }
};

console.log('Debug Info:', JSON.stringify(debugInfo, null, 2));
```

### 4. Common Solutions

| Issue | Quick Fix |
|-------|-----------|
| Invalid API key | Check `INDIAMART_CRM_KEY` environment variable |
| Date compliance error | Use valid date format and range |
| Rate limit exceeded | Wait and implement retry logic |
| File permission error | Check directory permissions |
| Memory issues | Clear cache and destroy SDK instances |
| Network issues | Check connectivity and increase timeout |

---

## 📝 Log Analysis

### 1. Check API Logs

```javascript
const apiLogs = sdk.getAPILogs(100);
const failedLogs = apiLogs.filter(log => !log.success);
console.log('Failed API calls:', failedLogs.length);
```

### 2. Check Secure Logs

```javascript
const secureLogs = await sdk.getSecureLogs(100);
const errorLogs = secureLogs.filter(log => log.level === 'ERROR');
console.log('Error logs:', errorLogs.length);
```

### 3. Analyze Performance

```javascript
const apiStats = sdk.getAPIStats();
const successRate = (apiStats.successfulCalls / apiStats.totalCalls) * 100;
console.log(`API Success Rate: ${successRate.toFixed(1)}%`);

if (successRate < 90) {
  console.warn('Low API success rate detected');
}
```

---

**Last Updated**: September 6, 2025  
**Version**: 2.0.0  
**Status**: Production Ready ✅
