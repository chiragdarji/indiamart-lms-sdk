#!/usr/bin/env node

/**
 * IndiaMART Error Testing Tool
 * 
 * This tool tests the error handling system with various error scenarios
 * and demonstrates how to handle different IndiaMART API error codes.
 */

import { IndiaMartClient } from '../src/indiamart-client.js';
import { IndiaMartErrorHandler, ERROR_TYPES } from '../src/error-handler.js';
import dotenv from 'dotenv';

dotenv.config();

// Mock error responses for testing
const MOCK_ERROR_RESPONSES = {
  [ERROR_TYPES.RATE_LIMIT_5_MIN]: {
    CODE: 429,
    STATUS: "FAILURE",
    MESSAGE: "It is advised to hit this API once in every 5 minutes,but it seems that you have crossed this limit. Please try again after 5 minutes.",
    TOTAL_RECORDS: 0,
    RESPONSE: []
  },
  [ERROR_TYPES.RATE_LIMIT_15_MIN]: {
    CODE: 429,
    STATUS: "FAILURE",
    MESSAGE: "Too Many Requests",
    APP_AUTH_FAILURE_CODE: 429,
    unique_id: ""
  },
  [ERROR_TYPES.INVALID_API_KEY]: {
    CODE: 401,
    STATUS: "FAILURE",
    MESSAGE: "Pull API Key that you are using is incorrect. Kindly use the correct Pull API Key as provided in the email.",
    TOTAL_RECORDS: 0,
    RESPONSE: []
  },
  [ERROR_TYPES.API_KEY_EXPIRED_INACTIVITY]: {
    CODE: 401,
    STATUS: "FAILURE",
    MESSAGE: "Pull API Key that you are using has expired as it was no longer in use. Kindly generate the new Pull API Key and use the new Pull API Key in API URL",
    TOTAL_RECORDS: 0,
    RESPONSE: []
  },
  [ERROR_TYPES.NO_LEADS]: {
    CODE: 204,
    STATUS: "FAILURE",
    MESSAGE: "There are no leads in the given time duration. Please try for a different duration.",
    TOTAL_RECORDS: 0,
    RESPONSE: []
  },
  [ERROR_TYPES.DATE_RANGE_TOO_LARGE]: {
    CODE: 400,
    STATUS: "FAILURE",
    MESSAGE: "You can fetch the data for the last 365 days only. Kindly change the Start Time or End Time accordingly",
    TOTAL_RECORDS: 0,
    RESPONSE: []
  },
  [ERROR_TYPES.SERVER_ERROR]: {
    CODE: 500,
    STATUS: "FAILURE",
    MESSAGE: "Some Error Occured",
    TOTAL_RECORDS: 0,
    RESPONSE: []
  }
};

class ErrorTester {
  constructor() {
    this.errorHandler = new IndiaMartErrorHandler({
      onError: this.handleError.bind(this),
      onRecovery: this.handleRecovery.bind(this)
    });
    
    this.testResults = [];
  }

  async handleError(error, context, attemptCount) {
    console.log(`❌ Error in ${context} (attempt ${attemptCount}):`, error.message);
    console.log(`   Type: ${error.details?.type}`);
    console.log(`   Suggestion: ${error.details?.suggestion}`);
    console.log(`   Retry After: ${error.details?.retryAfter ? error.details.retryAfter / 1000 + 's' : 'No retry'}`);
  }

  async handleRecovery(error, context) {
    console.log(`✅ Recovered from ${error.details?.type} in ${context}`);
  }

  async testErrorHandling() {
    console.log('🧪 Testing IndiaMART Error Handling System');
    console.log('==========================================\n');

    for (const [errorType, mockResponse] of Object.entries(MOCK_ERROR_RESPONSES)) {
      console.log(`\n📋 Testing: ${errorType}`);
      console.log('─'.repeat(50));
      
      try {
        // Convert mock response to the format expected by handleResponse
        const normalizedResponse = {
          code: mockResponse.CODE,
          status: mockResponse.STATUS,
          message: mockResponse.MESSAGE,
          totalRecords: mockResponse.TOTAL_RECORDS,
          leads: mockResponse.RESPONSE || []
        };
        
        const { success, data, error } = this.errorHandler.handleResponse(normalizedResponse);
        
        if (success) {
          console.log('✅ Response handled as success');
        } else {
          console.log('❌ Response handled as error');
          console.log(`   Error Type: ${error.details?.type}`);
          console.log(`   Message: ${error.message}`);
          console.log(`   Should Retry: ${this.errorHandler.shouldRetry(error, 1)}`);
          console.log(`   Retry Delay: ${this.errorHandler.getRetryDelay(error, 1) / 1000}s`);
          console.log(`   Critical: ${this.errorHandler.isCriticalError(error)}`);
          console.log(`   Description: ${this.errorHandler.getErrorDescription(error)}`);
        }
        
        this.testResults.push({
          errorType,
          success: !success,
          error: error?.details?.type,
          retryable: this.errorHandler.shouldRetry(error, 1),
          critical: this.errorHandler.isCriticalError(error)
        });
        
      } catch (err) {
        console.log('💥 Unexpected error:', err.message);
        this.testResults.push({
          errorType,
          success: false,
          error: 'UNEXPECTED_ERROR',
          retryable: false,
          critical: true
        });
      }
    }

    this.printSummary();
  }

  async testClientWithErrors() {
    console.log('\n\n🔧 Testing Client with Error Handling');
    console.log('=====================================\n');

    if (!process.env.INDIAMART_CRM_KEY) {
      console.log('⚠️  Skipping client tests - no CRM key provided');
      return;
    }

    const client = new IndiaMartClient({ 
      crmKey: process.env.INDIAMART_CRM_KEY,
      errorHandler: this.errorHandler
    });

    // Test with invalid date range (should trigger error)
    try {
      console.log('📅 Testing with invalid date range...');
      const result = await client.getLeads({
        startTime: '01-01-2020 00:00:00', // Very old date
        endTime: '01-01-2021 00:00:00',
        maxRetries: 1 // Limit retries for testing
      });
      console.log('✅ Unexpected success:', result);
    } catch (error) {
      console.log('❌ Expected error caught:', error.message);
      console.log(`   Type: ${error.details?.type}`);
      console.log(`   Suggestion: ${error.details?.suggestion}`);
    }

    // Test with missing parameters (should trigger error)
    try {
      console.log('\n📅 Testing with missing end time...');
      const result = await client.getLeads({
        startTime: '01-01-2024 00:00:00'
        // Missing endTime
      });
      console.log('✅ Unexpected success:', result);
    } catch (error) {
      console.log('❌ Expected error caught:', error.message);
      console.log(`   Type: ${error.details?.type}`);
    }
  }

  printSummary() {
    console.log('\n\n📊 Test Summary');
    console.log('================');
    
    const totalTests = this.testResults.length;
    const successfulTests = this.testResults.filter(r => r.success).length;
    const retryableErrors = this.testResults.filter(r => r.retryable).length;
    const criticalErrors = this.testResults.filter(r => r.critical).length;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Successful Error Handling: ${successfulTests}/${totalTests}`);
    console.log(`Retryable Errors: ${retryableErrors}`);
    console.log(`Critical Errors: ${criticalErrors}`);
    
    console.log('\n📋 Error Types Tested:');
    this.testResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const retry = result.retryable ? '🔄' : '⏹️';
      const critical = result.critical ? '🚨' : 'ℹ️';
      console.log(`   ${status} ${result.errorType} ${retry} ${critical}`);
    });
    
    console.log('\n💡 Error Handling Features:');
    console.log('   ✅ Automatic error detection and classification');
    console.log('   ✅ Intelligent retry logic with exponential backoff');
    console.log('   ✅ Critical error identification');
    console.log('   ✅ Human-readable error descriptions');
    console.log('   ✅ Actionable suggestions for each error type');
    console.log('   ✅ Comprehensive error statistics');
  }

  async runAllTests() {
    await this.testErrorHandling();
    await this.testClientWithErrors();
    
    console.log('\n🎉 Error handling tests completed!');
    console.log('\n📚 For more information about error handling, see:');
    console.log('   - error-handler.js (Error handling implementation)');
    console.log('   - README.md (Documentation)');
    console.log('   - polling-service.js (Production usage)');
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new ErrorTester();
  tester.runAllTests().catch(console.error);
}
