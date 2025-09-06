#!/usr/bin/env node

/**
 * Health Status Components Fix Test
 * 
 * This test verifies that the health status components are properly displayed
 * without any [object Object] references.
 */

import { IndiaMartSDK } from './src/sdk.js';

console.log('🧪 IndiaMART SDK - Health Status Components Fix Test');
console.log('====================================================\n');

// Test Health Status Components Display
console.log('1️⃣ Testing Health Status Components Display...');
try {
  const sdk = new IndiaMartSDK('demo-key-12345678901234567890');
  await sdk.initialize();
  
  const healthStatus = await sdk.getHealthStatus();
  
  console.log('   Health Status Structure:');
  console.log(`   - Success: ${healthStatus.success}`);
  console.log(`   - Status: ${healthStatus.status}`);
  console.log(`   - Timestamp: ${healthStatus.timestamp}`);
  console.log(`   - Version: ${healthStatus.version}`);
  
  console.log('\n   Cache Component:');
  console.log(`   - Status: ${healthStatus.components.cache.status}`);
  console.log(`   - Hit Rate: ${healthStatus.components.cache.hitRate}`);
  console.log(`   - Miss Rate: ${healthStatus.components.cache.missRate}`);
  console.log(`   - Size: ${healthStatus.components.cache.size}`);
  console.log(`   - Total Requests: ${healthStatus.components.cache.totalRequests}`);
  console.log(`   - Evictions: ${healthStatus.components.cache.evictions}`);
  console.log(`   - Memory Usage: ${healthStatus.components.cache.memoryUsage}`);
  
  console.log('\n   Rate Limiter Component:');
  console.log(`   - Status: ${healthStatus.components.rateLimiter.status}`);
  console.log(`   - Calls Per Minute: ${healthStatus.components.rateLimiter.callsPerMinute}`);
  console.log(`   - Calls Per Hour: ${healthStatus.components.rateLimiter.callsPerHour}`);
  console.log(`   - Is Blocked: ${healthStatus.components.rateLimiter.isBlocked}`);
  console.log(`   - Retry After: ${healthStatus.components.rateLimiter.retryAfter}`);
  console.log(`   - Calls Remaining: ${healthStatus.components.rateLimiter.callsRemaining}`);
  console.log(`   - Minute Limit: ${healthStatus.components.rateLimiter.minuteLimit}`);
  console.log(`   - Hour Limit: ${healthStatus.components.rateLimiter.hourLimit}`);
  console.log(`   - Total Calls Today: ${healthStatus.components.rateLimiter.totalCallsToday}`);
  
  console.log('\n   Logger Component:');
  console.log(`   - Status: ${healthStatus.components.logger.status}`);
  console.log(`   - Log Level: ${healthStatus.components.logger.logLevel}`);
  
  console.log('\n   Client Component:');
  console.log(`   - Status: ${healthStatus.components.client.status}`);
  console.log(`   - Base URL: ${healthStatus.components.client.baseUrl}`);
  
  // Check if any values contain [object Object]
  const hasObjectObject = JSON.stringify(healthStatus).includes('[object Object]');
  
  // Check if all values are properly serialized
  const allValuesReadable = Object.values(healthStatus.components).every(component => 
    Object.values(component).every(value => 
      typeof value !== 'object' || value === null || Array.isArray(value) || value === 'Object'
    )
  );
  
  console.log('\n   Validation Results:');
  console.log(`   - Contains [object Object]: ${hasObjectObject ? 'YES' : 'NO'}`);
  console.log(`   - All values readable: ${allValuesReadable ? 'YES' : 'NO'}`);
  
  if (!hasObjectObject && allValuesReadable) {
    console.log('   ✅ Health status components are properly displayed - no [object Object]');
  } else {
    console.log('   ❌ Health status components still have [object Object] issues');
  }
  
  // Test JSON serialization
  try {
    const jsonString = JSON.stringify(healthStatus, null, 2);
    console.log('\n   JSON Serialization Test:');
    console.log('   ✅ Health status can be properly serialized to JSON');
  } catch (jsonError) {
    console.log('\n   JSON Serialization Test:');
    console.log('   ❌ Health status cannot be serialized to JSON');
  }
  
} catch (error) {
  console.log(`   ❌ Health status test failed: ${error.message}`);
}

console.log('\n🎯 Health Status Components Fix Test Complete!');
console.log('==============================================');
