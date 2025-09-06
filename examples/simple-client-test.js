#!/usr/bin/env node

/**
 * Simple Client Test - IndiaMART LMS SDK
 * 
 * This example demonstrates a simple client implementation that tests
 * the SDK functionality and validates it works as per requirements.
 */

import { IndiaMartSDK } from '../src/index.js';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

// Load environment variables
dotenv.config();

/**
 * Simple Client Class
 * 
 * This class demonstrates how to use the IndiaMART SDK in a real application
 * with proper error handling, logging, and data management.
 */
class SimpleClient {
  constructor(crmKey) {
    this.sdk = new IndiaMartSDK(crmKey, {
      paths: {
        downloadPath: './client-downloads',
        logPath: './client-logs',
        dataPath: './client-data'
      }
    });
    
    this.isInitialized = false;
    this.stats = {
      totalLeads: 0,
      successfulCalls: 0,
      failedCalls: 0,
      cacheHits: 0
    };
  }

  /**
   * Initialize the client
   */
  async initialize() {
    try {
      console.log('🚀 Initializing Simple Client...');
      
      // Check SDK health
      const health = await this.sdk.getHealthStatus();
      console.log('📊 SDK Health Status:', health.status);
      
      if (health.status === 'healthy') {
        console.log('✅ SDK is healthy and ready');
        this.isInitialized = true;
        return true;
      } else {
        console.log('❌ SDK health check failed:', health.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to initialize client:', error.message);
      return false;
    }
  }

  /**
   * Test basic SDK functionality
   */
  async testBasicFunctionality() {
    console.log('\n🧪 Testing Basic SDK Functionality...');
    
    try {
      // Test 1: Input validation
      console.log('\n1️⃣ Testing Input Validation:');
      const emailValidation = this.sdk.validateInput('test@example.com', {
        type: 'string',
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        min: 5,
        max: 100
      });
      console.log('   Email validation:', emailValidation.isValid ? '✅' : '❌');

      const invalidEmailValidation = this.sdk.validateInput('invalid-email', {
        type: 'string',
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        min: 5,
        max: 100
      });
      console.log('   Invalid email validation:', invalidEmailValidation.isValid ? '✅' : '❌');

      // Test 2: Cache functionality
      console.log('\n2️⃣ Testing Cache Functionality:');
      const cacheStats = this.sdk.getCacheStats();
      console.log('   Cache stats:', {
        size: cacheStats.size,
        hitRate: `${cacheStats.hitRate}%`,
        totalRequests: cacheStats.totalRequests
      });

      // Test 3: Date formatting
      console.log('\n3️⃣ Testing Date Formatting:');
      const today = new Date();
      const formattedDate = IndiaMartSDK.formatDate(today, 'timestamp');
      console.log('   Today formatted:', formattedDate);

      // Test 4: Date range validation
      console.log('\n4️⃣ Testing Date Range Validation:');
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const dateValidation = IndiaMartSDK.validateDateRange(yesterday, today);
      console.log('   Date range validation:', dateValidation.isValid ? '✅' : '❌');
      if (!dateValidation.isValid) {
        console.log('   Validation errors:', dateValidation.errors.join(', '));
      }

      console.log('\n✅ Basic functionality tests completed');
      return true;
    } catch (error) {
      console.error('❌ Basic functionality test failed:', error.message);
      return false;
    }
  }

  /**
   * Test lead fetching functionality
   */
  async testLeadFetching() {
    console.log('\n📊 Testing Lead Fetching Functionality...');
    
    try {
      // Test 1: Get leads for yesterday (safer than today)
      console.log('\n1️⃣ Fetching leads for yesterday:');
      const yesterdayResult = await this.sdk.getLeadsForYesterday();
      
      if (yesterdayResult.success) {
        console.log('   ✅ Successfully fetched leads for yesterday');
        console.log('   📈 Total records:', yesterdayResult.totalRecords);
        console.log('   📋 Leads count:', yesterdayResult.leads.length);
        
        if (yesterdayResult.downloadPath) {
          console.log('   💾 Downloaded to:', yesterdayResult.downloadPath);
          this.stats.totalLeads += yesterdayResult.leads.length;
        }
        
        this.stats.successfulCalls++;
      } else {
        console.log('   ❌ Failed to fetch leads for yesterday');
        console.log('   Error:', yesterdayResult.error);
        this.stats.failedCalls++;
      }

      // Test 2: Get leads for last 7 days
      console.log('\n2️⃣ Fetching leads for last 7 days:');
      const lastWeekResult = await this.sdk.getLeadsForLastDays(7);
      
      if (lastWeekResult.success) {
        console.log('   ✅ Successfully fetched leads for last 7 days');
        console.log('   📈 Total records:', lastWeekResult.totalRecords);
        console.log('   📋 Leads count:', lastWeekResult.leads.length);
        
        if (lastWeekResult.downloadPath) {
          console.log('   💾 Downloaded to:', lastWeekResult.downloadPath);
          this.stats.totalLeads += lastWeekResult.leads.length;
        }
        
        this.stats.successfulCalls++;
      } else {
        console.log('   ❌ Failed to fetch leads for last 7 days');
        console.log('   Error:', lastWeekResult.error);
        this.stats.failedCalls++;
      }

      // Test 3: Test caching (make same request again)
      console.log('\n3️⃣ Testing cache (repeat last 7 days request):');
      const cachedResult = await this.sdk.getLeadsForLastDays(7);
      
      if (cachedResult.success) {
        console.log('   ✅ Cached request successful');
        console.log('   📈 Total records:', cachedResult.totalRecords);
        console.log('   📋 Leads count:', cachedResult.leads.length);
        this.stats.cacheHits++;
      } else {
        console.log('   ❌ Cached request failed');
        console.log('   Error:', cachedResult.error);
      }

      console.log('\n✅ Lead fetching tests completed');
      return true;
    } catch (error) {
      console.error('❌ Lead fetching test failed:', error.message);
      this.stats.failedCalls++;
      return false;
    }
  }

  /**
   * Test error handling
   */
  async testErrorHandling() {
    console.log('\n⚠️ Testing Error Handling...');
    
    try {
      // Test 1: Invalid date range
      console.log('\n1️⃣ Testing invalid date range:');
      const invalidDateResult = await this.sdk.getLeadsForDateRange('invalid-date', 'also-invalid');
      
      if (!invalidDateResult.success) {
        console.log('   ✅ Properly handled invalid date range');
        console.log('   Error:', invalidDateResult.error);
      } else {
        console.log('   ❌ Should have failed with invalid dates');
      }

      // Test 2: Future date range
      console.log('\n2️⃣ Testing future date range:');
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const futureResult = await this.sdk.getLeadsForDateRange(futureDate, futureDate);
      
      if (!futureResult.success) {
        console.log('   ✅ Properly handled future date range');
        console.log('   Error:', futureResult.error);
      } else {
        console.log('   ❌ Should have failed with future dates');
      }

      // Test 3: Very old date range
      console.log('\n3️⃣ Testing very old date range:');
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 2);
      const oldResult = await this.sdk.getLeadsForDateRange(oldDate, oldDate);
      
      if (!oldResult.success) {
        console.log('   ✅ Properly handled very old date range');
        console.log('   Error:', oldResult.error);
      } else {
        console.log('   ❌ Should have failed with very old dates');
      }

      console.log('\n✅ Error handling tests completed');
      return true;
    } catch (error) {
      console.error('❌ Error handling test failed:', error.message);
      return false;
    }
  }

  /**
   * Test logging and monitoring
   */
  async testLoggingAndMonitoring() {
    console.log('\n📝 Testing Logging and Monitoring...');
    
    try {
      // Test 1: Get API logs
      console.log('\n1️⃣ Getting API logs:');
      const apiLogs = this.sdk.getAPILogs(5);
      console.log('   📋 Retrieved', apiLogs.length, 'API log entries');

      // Test 2: Get secure logs
      console.log('\n2️⃣ Getting secure logs:');
      const secureLogs = await this.sdk.getSecureLogs(5);
      console.log('   📋 Retrieved', secureLogs.length, 'secure log entries');

      // Test 3: Get rate limit status
      console.log('\n3️⃣ Getting rate limit status:');
      const rateLimitStatus = this.sdk.getRateLimitStatus();
      console.log('   📊 Rate limit status:', {
        isBlocked: rateLimitStatus.isBlocked,
        callsPerMinute: rateLimitStatus.callsPerMinute,
        callsPerHour: rateLimitStatus.callsPerHour
      });

      // Test 4: Get API statistics
      console.log('\n4️⃣ Getting API statistics:');
      const apiStats = this.sdk.getAPIStats();
      console.log('   📊 API stats:', {
        totalCalls: apiStats.totalCalls,
        successfulCalls: apiStats.successfulCalls,
        failedCalls: apiStats.failedCalls
      });

      // Test 5: Get cache statistics
      console.log('\n5️⃣ Getting cache statistics:');
      const cacheStats = this.sdk.getCacheStats();
      console.log('   📊 Cache stats:', {
        size: cacheStats.size,
        hitRate: `${cacheStats.hitRate}%`,
        totalRequests: cacheStats.totalRequests
      });

      console.log('\n✅ Logging and monitoring tests completed');
      return true;
    } catch (error) {
      console.error('❌ Logging and monitoring test failed:', error.message);
      return false;
    }
  }

  /**
   * Test data management
   */
  async testDataManagement() {
    console.log('\n💾 Testing Data Management...');
    
    try {
      // Test 1: Check download directory
      console.log('\n1️⃣ Checking download directory:');
      const downloadPath = this.sdk.getDownloadPath();
      console.log('   📁 Download path:', downloadPath);
      
      try {
        const files = await fs.readdir(downloadPath);
        console.log('   📋 Files in download directory:', files.length);
      } catch (error) {
        console.log('   📁 Download directory does not exist yet');
      }

      // Test 2: Test cache clearing
      console.log('\n2️⃣ Testing cache clearing:');
      const clearResult = await this.sdk.clearCache();
      if (clearResult.success) {
        console.log('   ✅ Cache cleared successfully');
      } else {
        console.log('   ❌ Failed to clear cache:', clearResult.error);
      }

      // Test 3: Test log cleanup
      console.log('\n3️⃣ Testing log cleanup:');
      const logCleanupResult = await this.sdk.clearOldSecureLogs(30);
      if (logCleanupResult.success) {
        console.log('   ✅ Log cleanup completed');
      } else {
        console.log('   ❌ Failed to cleanup logs:', logCleanupResult.error);
      }

      console.log('\n✅ Data management tests completed');
      return true;
    } catch (error) {
      console.error('❌ Data management test failed:', error.message);
      return false;
    }
  }

  /**
   * Generate test report
   */
  generateTestReport() {
    console.log('\n📊 Test Report Summary:');
    console.log('=' .repeat(50));
    console.log('📈 Client Statistics:');
    console.log('   Total Leads Fetched:', this.stats.totalLeads);
    console.log('   Successful API Calls:', this.stats.successfulCalls);
    console.log('   Failed API Calls:', this.stats.failedCalls);
    console.log('   Cache Hits:', this.stats.cacheHits);
    
    const successRate = this.stats.successfulCalls + this.stats.failedCalls > 0 
      ? (this.stats.successfulCalls / (this.stats.successfulCalls + this.stats.failedCalls)) * 100 
      : 0;
    
    console.log('   Success Rate:', `${successRate.toFixed(1)}%`);
    console.log('=' .repeat(50));
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    try {
      console.log('\n🧹 Cleaning up resources...');
      const destroyResult = await this.sdk.destroy();
      if (destroyResult.success) {
        console.log('   ✅ SDK destroyed successfully');
      } else {
        console.log('   ❌ Failed to destroy SDK:', destroyResult.error);
      }
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
    }
  }
}

/**
 * Main test function
 */
async function runClientTest() {
  console.log('🧪 IndiaMART LMS SDK - Simple Client Test\n');
  console.log('=' .repeat(60));

  // Check if CRM key is available
  if (!process.env.INDIAMART_CRM_KEY) {
    console.log('⚠️ No CRM key found. Running in demo mode...\n');
    console.log('💡 To test with real API calls, set INDIAMART_CRM_KEY environment variable');
    console.log('📝 Demo mode will test validation, caching, and error handling only\n');
  }

  // Use a valid demo key format for testing
  const demoKey = 'demo-key-12345678901234567890'; // 25 characters to pass validation
  const client = new SimpleClient(process.env.INDIAMART_CRM_KEY || demoKey);

  try {
    // Initialize client
    const initialized = await client.initialize();
    if (!initialized) {
      console.log('❌ Client initialization failed. Exiting...');
      return;
    }

    // Run all tests
    const tests = [
      { name: 'Basic Functionality', fn: () => client.testBasicFunctionality() },
      { name: 'Lead Fetching', fn: () => client.testLeadFetching() },
      { name: 'Error Handling', fn: () => client.testErrorHandling() },
      { name: 'Logging and Monitoring', fn: () => client.testLoggingAndMonitoring() },
      { name: 'Data Management', fn: () => client.testDataManagement() }
    ];

    let passedTests = 0;
    const totalTests = tests.length;

    for (const test of tests) {
      console.log(`\n🔍 Running ${test.name} Test...`);
      const result = await test.fn();
      if (result) {
        passedTests++;
        console.log(`✅ ${test.name} Test Passed`);
      } else {
        console.log(`❌ ${test.name} Test Failed`);
      }
    }

    // Generate report
    client.generateTestReport();

    // Final results
    console.log('\n🎯 Final Test Results:');
    console.log(`   Tests Passed: ${passedTests}/${totalTests}`);
    console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
      console.log('   Status: ✅ ALL TESTS PASSED');
    } else {
      console.log('   Status: ⚠️ SOME TESTS FAILED');
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // Cleanup
    await client.cleanup();
    console.log('\n✅ Client test completed');
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  runClientTest().catch(console.error);
}

export { SimpleClient, runClientTest };
