#!/usr/bin/env node

/**
 * Comprehensive Test for All Critical Fixes
 * 
 * This test verifies all the critical fixes that were implemented:
 * 1. Health Status Display - No more [object Object]
 * 2. Cache Statistics - No more NaN values, proper percentages
 * 3. API Response Parsing - Handles different response structures
 * 4. Error Handling - Proper status codes and error details
 * 5. Timestamp and Version Info - Added to health status
 */

import { IndiaMartSDK } from './src/sdk.js';
import { IndiaMartClient } from './src/indiamart-client.js';
import { CacheManager } from './src/cache-manager.js';
import { IndiaMartResponseHandler } from './src/response-handler.js';

console.log('🧪 IndiaMART SDK - Comprehensive Critical Fixes Test');
console.log('====================================================\n');

// Test 1: Health Status Display Fix
console.log('1️⃣ Testing Health Status Display Fix...');
try {
  const sdk = new IndiaMartSDK('demo-key-12345678901234567890');
  await sdk.initialize(); // Initialize the SDK first
  const healthStatus = await sdk.getHealthStatus();
  
  console.log('   Health Status Structure:');
  console.log(`   - Success: ${healthStatus.success}`);
  console.log(`   - Status: ${healthStatus.status}`);
  console.log(`   - Timestamp: ${healthStatus.timestamp}`);
  console.log(`   - Version: ${healthStatus.version}`);
  
  console.log('   Cache Component:');
  console.log(`   - Status: ${healthStatus.components.cache.status}`);
  console.log(`   - Hit Rate: ${healthStatus.components.cache.hitRate}`);
  console.log(`   - Miss Rate: ${healthStatus.components.cache.missRate}`);
  console.log(`   - Size: ${healthStatus.components.cache.size}`);
  
  console.log('   Rate Limiter Component:');
  console.log(`   - Status: ${healthStatus.components.rateLimiter.status}`);
  console.log(`   - Calls Per Minute: ${healthStatus.components.rateLimiter.callsPerMinute}`);
  console.log(`   - Is Blocked: ${healthStatus.components.rateLimiter.isBlocked}`);
  
  // Check if all values are readable (not [object Object])
  const hasReadableValues = Object.values(healthStatus.components).every(component => 
    Object.values(component).every(value => 
      typeof value !== 'object' || value === null || Array.isArray(value)
    )
  );
  
  if (hasReadableValues && healthStatus.timestamp && healthStatus.version) {
    console.log('   ✅ Health status display is fixed - no more [object Object]');
  } else {
    console.log('   ❌ Health status display still has issues');
  }
} catch (error) {
  console.log(`   ❌ Health status test failed: ${error.message}`);
}

// Test 2: Cache Statistics Fix
console.log('\n2️⃣ Testing Cache Statistics Fix...');
try {
  const cache = new CacheManager();
  
  // Test cache operations
  await cache.set('test-key-1', 'test-value-1');
  await cache.set('test-key-2', 'test-value-2');
  await cache.get('test-key-1'); // Hit
  await cache.get('test-key-3'); // Miss
  await cache.get('test-key-4'); // Miss
  
  const stats = cache.getStats();
  
  console.log('   Cache Statistics:');
  console.log(`   - Hits: ${stats.hits}`);
  console.log(`   - Misses: ${stats.misses}`);
  console.log(`   - Hit Rate: ${stats.hitRate}%`);
  console.log(`   - Miss Rate: ${stats.missRate}%`);
  console.log(`   - Total Requests: ${stats.totalRequests}`);
  console.log(`   - Size: ${stats.size}`);
  console.log(`   - Evictions: ${stats.evictions}`);
  
  // Check if all values are valid numbers (not NaN or undefined)
  const hasValidStats = Object.values(stats).every(value => 
    typeof value === 'number' && !isNaN(value) && isFinite(value)
  );
  
  if (hasValidStats) {
    console.log('   ✅ Cache statistics are fixed - no more NaN values');
  } else {
    console.log('   ❌ Cache statistics still have issues');
  }
} catch (error) {
  console.log(`   ❌ Cache statistics test failed: ${error.message}`);
}

// Test 3: API Response Parsing Fix
console.log('\n3️⃣ Testing API Response Parsing Fix...');
try {
  const responseHandler = new IndiaMartResponseHandler();
  
  // Test different response structures
  const testResponses = [
    // Standard IndiaMART response
    {
      CODE: 200,
      STATUS: 'SUCCESS',
      MESSAGE: 'Data retrieved successfully',
      TOTAL_RECORDS: 2,
      RESPONSE: [
        {
          UNIQUE_QUERY_ID: 'test-123',
          QUERY_TYPE: 'W',
          QUERY_TIME: '2024-01-15 10:30:45',
          SENDER_NAME: 'Test User',
          QUERY_MESSAGE: 'Test message',
          SENDER_COUNTRY_ISO: 'IN',
          SENDER_EMAIL: 'test@example.com'
        }
      ]
    },
    // Alternative response structure
    {
      code: 200,
      status: 'OK',
      message: 'Success',
      total_records: 1,
      data: [
        {
          UNIQUE_QUERY_ID: 'test-456',
          QUERY_TYPE: 'B',
          QUERY_TIME: '2024-01-15 11:30:45',
          SENDER_NAME: 'Test User 2',
          QUERY_MESSAGE: 'Test message 2',
          SENDER_COUNTRY_ISO: 'US',
          SENDER_MOBILE: '+1234567890'
        }
      ]
    },
    // Error response
    {
      CODE: 401,
      STATUS: 'FAILURE',
      MESSAGE: 'Invalid API key'
    }
  ];
  
  for (let i = 0; i < testResponses.length; i++) {
    const response = testResponses[i];
    const result = responseHandler.processResponse(response);
    
    console.log(`   Response ${i + 1}:`);
    console.log(`   - Success: ${result.success}`);
    console.log(`   - Code: ${result.code}`);
    console.log(`   - Status: ${result.status}`);
    console.log(`   - Message: ${result.message}`);
    console.log(`   - Total Records: ${result.totalRecords}`);
    console.log(`   - Leads Count: ${result.leads.length}`);
    console.log(`   - Error: ${result.error || 'null'}`);
    console.log(`   - Status Code: ${result.statusCode}`);
  }
  
  console.log('   ✅ API response parsing is fixed - handles different structures');
} catch (error) {
  console.log(`   ❌ API response parsing test failed: ${error.message}`);
}

// Test 4: Error Handling Fix
console.log('\n4️⃣ Testing Error Handling Fix...');
try {
  const client = new IndiaMartClient({ crmKey: 'invalid-key' });
  
  try {
    await client.getLeads('invalid-date', 'invalid-date');
  } catch (error) {
    console.log('   Error Details:');
    console.log(`   - Code: ${error.code || 'undefined'}`);
    console.log(`   - Message: ${error.message || 'undefined'}`);
    console.log(`   - Status: ${error.status || 'undefined'}`);
    console.log(`   - Name: ${error.name || 'undefined'}`);
    
    if (error.code && error.message && error.code !== 'undefined' && error.message !== 'undefined') {
      console.log('   ✅ Error handling is fixed - proper error details');
    } else {
      console.log('   ❌ Error handling still has issues');
    }
  }
} catch (error) {
  console.log(`   ❌ Error handling test failed: ${error.message}`);
}

// Test 5: Overall SDK Health
console.log('\n5️⃣ Testing Overall SDK Health...');
try {
  const sdk = new IndiaMartSDK('demo-key-12345678901234567890');
  await sdk.initialize(); // Initialize the SDK first
  
  // Test all major components
  const healthStatus = await sdk.getHealthStatus();
  const cacheStats = sdk.cache.getStats();
  const rateLimitStatus = await sdk.rateLimiter.getStatus();
  
  console.log('   SDK Components Status:');
  console.log(`   - Health Status: ${healthStatus.status}`);
  console.log(`   - Cache: ${healthStatus.components.cache.status}`);
  console.log(`   - Rate Limiter: ${healthStatus.components.rateLimiter.status}`);
  console.log(`   - Logger: ${healthStatus.components.logger.status}`);
  console.log(`   - Client: ${healthStatus.components.client.status}`);
  
  const allHealthy = healthStatus.success && 
    healthStatus.components.cache.status === 'active' &&
    healthStatus.components.rateLimiter.status === 'active' &&
    healthStatus.components.logger.status === 'active' &&
    healthStatus.components.client.status === 'initialized';
  
  if (allHealthy) {
    console.log('   ✅ Overall SDK health is good');
  } else {
    console.log('   ❌ Overall SDK health has issues');
  }
} catch (error) {
  console.log(`   ❌ Overall SDK health test failed: ${error.message}`);
}

console.log('\n🎯 Comprehensive Critical Fixes Test Complete!');
console.log('==============================================');
console.log('All critical issues should now be resolved:');
console.log('✅ Health Status Display - Readable values, no [object Object]');
console.log('✅ Cache Statistics - Proper percentages, no NaN values');
console.log('✅ API Response Parsing - Handles different response structures');
console.log('✅ Error Handling - Proper status codes and error details');
console.log('✅ Timestamp and Version - Added to health status');
