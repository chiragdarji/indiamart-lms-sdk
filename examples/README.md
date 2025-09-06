# IndiaMART LMS SDK - Examples

This directory contains comprehensive examples demonstrating how to use the IndiaMART LMS SDK in various scenarios.

## 📁 Available Examples

### 1. **Simple Usage** (`simple-usage.js`)
- **Purpose**: Basic SDK usage with minimal configuration
- **Features**: 
  - Fetch leads for today, yesterday, and date ranges
  - Automatic JSON file downloads
  - Basic error handling
- **Run**: `npm run example`

### 2. **Advanced Usage** (`advanced-usage.js`)
- **Purpose**: Advanced SDK features and configuration
- **Features**:
  - Custom path configuration
  - Multiple date range queries
  - Error handling and retry logic
  - Statistics and monitoring
- **Run**: `npm run example:advanced`

### 3. **Logging and Compliance** (`logging-and-compliance.js`)
- **Purpose**: Demonstrate logging, rate limiting, and compliance features
- **Features**:
  - API call logging
  - Rate limit monitoring
  - Date compliance validation
  - Error classification
- **Run**: `npm run example:logging`

### 4. **Configurable Paths** (`configurable-paths.js`)
- **Purpose**: Show different path configuration options
- **Features**:
  - Basic path configuration
  - Production path setup
  - Development path setup
  - Docker and AWS Lambda paths
- **Run**: `npm run example:paths`

### 5. **Secure Usage** (`secure-usage.js`)
- **Purpose**: Demonstrate security features and input validation
- **Features**:
  - Input validation and sanitization
  - Secure logging without sensitive data exposure
  - Path traversal prevention
  - XSS protection
- **Run**: `npm run example:secure`

### 6. **Simple Client Test** (`simple-client-test.js`) ⭐ **NEW**
- **Purpose**: Comprehensive testing of SDK functionality
- **Features**:
  - Complete SDK functionality testing
  - Input validation testing
  - Error handling testing
  - Caching and performance testing
  - Logging and monitoring testing
  - Data management testing
- **Run**: `npm run test:client`

## 🧪 Testing the SDK

### Quick Test
```bash
npm run test:client
```

This will run a comprehensive test suite that validates:
- ✅ **Input Validation** - Email, file paths, dates
- ✅ **Error Handling** - Invalid inputs, future dates, old dates
- ✅ **Caching** - Cache statistics and management
- ✅ **Logging** - API logs, secure logs, monitoring
- ✅ **Data Management** - File operations, cleanup
- ✅ **Health Monitoring** - SDK component status

### Test Results
The test suite provides detailed feedback:
- **Test Status**: Pass/Fail for each test category
- **Statistics**: API calls, cache hits, success rates
- **Error Handling**: Proper error messages and validation
- **Performance**: Cache performance and response times

## 🔧 Configuration

### Environment Variables
```bash
# Required for real API calls
export INDIAMART_CRM_KEY="your-crm-key-here"

# Optional configuration
export NODE_ENV="development"  # Enables console logging
export LOG_LEVEL="2"          # 0=ERROR, 1=WARN, 2=INFO, 3=DEBUG
```

### Demo Mode
All examples work in demo mode without a real CRM key:
- Input validation testing
- Error handling testing
- Caching functionality
- Logging and monitoring
- Data management

## 📊 Example Output

### Successful Test Run
```
🧪 IndiaMART LMS SDK - Simple Client Test
============================================================
⚠️ No CRM key found. Running in demo mode...

✅ Basic Functionality Test Passed
✅ Lead Fetching Test Passed
✅ Error Handling Test Passed
✅ Logging and Monitoring Test Passed
✅ Data Management Test Passed

🎯 Final Test Results:
   Tests Passed: 5/5
   Success Rate: 100.0%
   Status: ✅ ALL TESTS PASSED
```

### Test Categories

#### 1. **Basic Functionality**
- Input validation (email, file paths)
- Cache functionality
- Date formatting
- Date range validation

#### 2. **Lead Fetching**
- Yesterday's leads
- Last 7 days leads
- Cache testing
- Error handling for API calls

#### 3. **Error Handling**
- Invalid date ranges
- Future date ranges
- Very old date ranges
- Proper error messages

#### 4. **Logging and Monitoring**
- API logs retrieval
- Secure logs access
- Rate limit status
- API statistics
- Cache statistics

#### 5. **Data Management**
- Download directory management
- Cache clearing
- Log cleanup
- File operations

## 🚀 Production Usage

### With Real API Key
```bash
export INDIAMART_CRM_KEY="your-actual-crm-key"
npm run test:client
```

### Custom Configuration
```javascript
import { IndiaMartSDK } from 'indiamart-lms-sdk';

const sdk = new IndiaMartSDK('your-crm-key', {
  paths: {
    downloadPath: './downloads',
    logPath: './logs',
    dataPath: './data'
  }
});

// Use the SDK...
const result = await sdk.getLeadsForYesterday();
```

## 📝 Notes

- All examples include comprehensive error handling
- Demo mode works without a real CRM key
- Examples demonstrate best practices for production use
- Test suite validates all SDK functionality
- Examples are production-ready and can be used as templates

## 🔗 Related Documentation

- [Main README](../README.md) - Complete SDK documentation
- [Security Fixes](../SECURITY_AND_PERFORMANCE_FIXES.md) - Security improvements
- [Analysis Report](../COMPREHENSIVE_ANALYSIS_REPORT.md) - Code analysis results
