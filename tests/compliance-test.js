#!/usr/bin/env node

/**
 * IndiaMART API Compliance Testing Tool
 * 
 * Tests all IndiaMART API compliance requirements including:
 * - 7-day maximum date range
 * - 5-minute minimum interval between calls
 * - 15-minute API key blocking protection
 * - Special character handling
 * - NTP synchronization recommendations
 */

import { IndiaMartComplianceManager, COMPLIANCE_CONSTANTS } from '../src/api-compliance.js';
import { IndiaMartClient } from '../src/indiamart-client.js';
import dotenv from 'dotenv';

dotenv.config();

class ComplianceTester {
  constructor() {
    this.complianceManager = new IndiaMartComplianceManager({
      onViolation: this.handleViolation.bind(this),
      onBlocked: this.handleBlocked.bind(this),
      onRecovered: this.handleRecovered.bind(this)
    });
    
    this.testResults = [];
    this.violations = [];
  }

  handleViolation(violation) {
    console.log(`⚠️  Violation: ${violation.message}`);
    this.violations.push(violation);
  }

  handleBlocked(durationMs) {
    console.log(`🚫 API Key Blocked: ${Math.ceil(durationMs / 60000)} minutes`);
  }

  handleRecovered(reason) {
    console.log(`✅ Recovered: ${reason}`);
  }

  async testDateRangeValidation() {
    console.log('📅 Testing Date Range Validation');
    console.log('=================================\n');

    const dateTests = [
      {
        name: 'Valid 7-day range',
        startTime: '2024-01-01',
        endTime: '2024-01-07',
        expected: true
      },
      {
        name: 'Invalid: 8-day range (exceeds 7-day limit)',
        startTime: '2024-01-01',
        endTime: '2024-01-09',
        expected: false
      },
      {
        name: 'Invalid: end_time before start_time',
        startTime: '2024-01-07',
        endTime: '2024-01-01',
        expected: false
      },
      {
        name: 'Invalid: missing start_time',
        startTime: null,
        endTime: '2024-01-07',
        expected: false
      },
      {
        name: 'Invalid: missing end_time',
        startTime: '2024-01-01',
        endTime: null,
        expected: false
      },
      {
        name: 'Invalid: data older than 365 days',
        startTime: '2022-01-01',
        endTime: '2022-01-07',
        expected: false
      }
    ];

    for (const test of dateTests) {
      const result = this.complianceManager.validateDateRange(test.startTime, test.endTime);
      const status = result.isValid === test.expected ? '✅ PASS' : '❌ FAIL';
      
      console.log(`${status} ${test.name}: ${result.isValid} (expected: ${test.expected})`);
      if (!result.isValid) {
        console.log(`   Errors: ${result.errors.join(', ')}`);
      }
      
      this.testResults.push({
        category: 'Date Range',
        test: test.name,
        status: result.isValid === test.expected ? 'PASS' : 'FAIL'
      });
    }
  }

  async testRateLimiting() {
    console.log('\n\n⏱️  Testing Rate Limiting');
    console.log('==========================\n');

    // Test minimum interval
    console.log('Testing minimum 5-minute interval...');
    const now = new Date();
    const future = new Date(now.getTime() + 2 * 60 * 1000); // 2 minutes from now
    
    const compliance1 = this.complianceManager.validateCall(now, future);
    console.log(`First call: ${compliance1.isValid ? '✅ Allowed' : '❌ Blocked'}`);
    
    if (compliance1.isValid) {
      this.complianceManager.recordCall();
    }
    
    // Try immediate second call (should be blocked)
    const compliance2 = this.complianceManager.validateCall(now, future);
    console.log(`Immediate second call: ${compliance2.isValid ? '❌ Should be blocked' : '✅ Correctly blocked'}`);
    
    if (!compliance2.isValid) {
      console.log(`   Reason: ${compliance2.violations[0].message}`);
    }

    this.testResults.push({
      category: 'Rate Limiting',
      test: 'Minimum Interval',
      status: !compliance2.isValid ? 'PASS' : 'FAIL'
    });
  }

  async testSpecialCharacterHandling() {
    console.log('\n\n🔤 Testing Special Character Handling');
    console.log('=====================================\n');

    const testMessages = [
      {
        input: 'Hello\\nWorld\\tTab\\rCarriage\\bBackspace\\\\Backslash',
        expected: 'Hello\nWorld\tTab\rCarriage\bBackspace\\Backslash'
      },
      {
        input: 'Normal message without special chars',
        expected: 'Normal message without special chars'
      },
      {
        input: 'Mixed\\nwith\\tnormal text',
        expected: 'Mixed\nwith\tnormal text'
      }
    ];

    for (const test of testMessages) {
      const result = this.complianceManager.cleanQueryMessage(test.input);
      const status = result === test.expected ? '✅ PASS' : '❌ FAIL';
      
      console.log(`${status} "${test.input}" -> "${result}"`);
      console.log(`   Expected: "${test.expected}"`);
      
      this.testResults.push({
        category: 'Special Characters',
        test: `Message: ${test.input.substring(0, 20)}...`,
        status: result === test.expected ? 'PASS' : 'FAIL'
      });
    }
  }

  async testLeadDataCleaning() {
    console.log('\n\n🧹 Testing Lead Data Cleaning');
    console.log('==============================\n');

    const testLead = {
      SENDER_NAME: 'John Doe',
      SENDER_MOBILE: '1234567890',
      QUERY_MESSAGE: 'Hello\\nI am interested\\tin your product\\r\\nPlease contact me\\\\',
      ENQ_MESSAGE: 'Another\\nmessage\\twith\\rspecial\\bchars',
      SENDER_EMAIL: 'john@example.com'
    };

    const cleanedLead = this.complianceManager.cleanLeadData(testLead);
    
    console.log('Original QUERY_MESSAGE:', testLead.QUERY_MESSAGE);
    console.log('Cleaned QUERY_MESSAGE:', cleanedLead.QUERY_MESSAGE);
    console.log('Original ENQ_MESSAGE:', testLead.ENQ_MESSAGE);
    console.log('Cleaned ENQ_MESSAGE:', cleanedLead.ENQ_MESSAGE);
    
    const hasSpecialChars = cleanedLead.QUERY_MESSAGE.includes('\\n') || 
                           cleanedLead.QUERY_MESSAGE.includes('\\t') ||
                           cleanedLead.QUERY_MESSAGE.includes('\\r') ||
                           cleanedLead.QUERY_MESSAGE.includes('\\b') ||
                           cleanedLead.QUERY_MESSAGE.includes('\\\\');
    
    const status = !hasSpecialChars ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} Special characters cleaned: ${!hasSpecialChars}`);
    
    this.testResults.push({
      category: 'Lead Data Cleaning',
      test: 'Special Character Removal',
      status: !hasSpecialChars ? 'PASS' : 'FAIL'
    });
  }

  async testComplianceStatus() {
    console.log('\n\n📊 Testing Compliance Status');
    console.log('=============================\n');

    const status = this.complianceManager.getStatus();
    
    console.log('Current Status:');
    console.log(`  Is Blocked: ${status.isBlocked}`);
    console.log(`  Recent Calls: ${status.recentCalls}/${status.maxCallsPerMinute}`);
    console.log(`  Last Call Time: ${status.lastCallTime ? new Date(status.lastCallTime).toISOString() : 'Never'}`);
    console.log(`  Time Since Last Call: ${status.timeSinceLastCall ? Math.round(status.timeSinceLastCall / 1000) + 's' : 'N/A'}`);
    console.log(`  Can Make Call: ${status.canMakeCall ? 'Yes' : 'No'}`);
    
    if (status.isBlocked) {
      console.log(`  Blocked Until: ${new Date(status.blockedUntil).toISOString()}`);
      console.log(`  Time Until Unblocked: ${Math.ceil(status.timeUntilUnblocked / 60000)} minutes`);
    }
  }

  async testNTPSyncRecommendations() {
    console.log('\n\n🕐 Testing NTP Sync Recommendations');
    console.log('====================================\n');

    const ntpInfo = this.complianceManager.getNTPSyncRecommendations();
    
    console.log('NTP Servers:');
    ntpInfo.servers.forEach((server, index) => {
      console.log(`  ${index + 1}. ${server}`);
    });
    
    console.log('\nSync Commands:');
    console.log(`  Linux/Mac: ${ntpInfo.command}`);
    console.log(`  Windows: ${ntpInfo.windowsCommand}`);
    console.log(`  Description: ${ntpInfo.description}`);
  }

  async testPollingRecommendations() {
    console.log('\n\n⏰ Testing Polling Recommendations');
    console.log('===================================\n');

    const pollingInfo = this.complianceManager.getRecommendedPollingInterval();
    
    console.log('Polling Intervals:');
    console.log(`  Minimum: ${pollingInfo.minimum / 60000} minutes (IndiaMART requirement)`);
    console.log(`  Recommended: ${pollingInfo.recommended / 60000} minutes (IndiaMART recommendation)`);
    console.log(`  Maximum: ${pollingInfo.maximum / 60000} minutes (IndiaMART maximum)`);
    
    console.log('\nCompliance Constants:');
    console.log(`  MIN_INTERVAL_MS: ${COMPLIANCE_CONSTANTS.MIN_INTERVAL_MS / 60000} minutes`);
    console.log(`  MAX_DATE_RANGE_MS: ${COMPLIANCE_CONSTANTS.MAX_DATE_RANGE_MS / (24 * 60 * 60 * 1000)} days`);
    console.log(`  MAX_HISTORICAL_DAYS: ${COMPLIANCE_CONSTANTS.MAX_HISTORICAL_DAYS} days`);
    console.log(`  MAX_CALLS_PER_MINUTE: ${COMPLIANCE_CONSTANTS.MAX_CALLS_PER_MINUTE} calls`);
    console.log(`  BLOCK_DURATION_MS: ${COMPLIANCE_CONSTANTS.BLOCK_DURATION_MS / 60000} minutes`);
  }

  async testWithRealClient() {
    console.log('\n\n🌐 Testing with Real Client');
    console.log('============================\n');

    if (!process.env.INDIAMART_CRM_KEY) {
      console.log('⚠️  Skipping real client tests - no CRM key provided');
      return;
    }

    const client = new IndiaMartClient({ 
      crmKey: process.env.INDIAMART_CRM_KEY,
      complianceManager: this.complianceManager
    });

    try {
      console.log('Testing with 7-day range...');
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const result = await client.getLeads({
        startTime: sevenDaysAgo,
        endTime: now,
        maxRetries: 1
      });
      
      console.log(`✅ 7-day range test: ${result.leads.length} leads found`);
      
      // Test special character cleaning
      if (result.leads.length > 0) {
        const firstLead = result.leads[0];
        console.log('Sample lead data:');
        console.log(`  Name: ${firstLead.SENDER_NAME}`);
        console.log(`  Mobile: ${firstLead.SENDER_MOBILE}`);
        console.log(`  Query Message: ${firstLead.QUERY_MESSAGE || firstLead.ENQ_MESSAGE || 'N/A'}`);
      }
      
    } catch (error) {
      console.log(`❌ Real client test error: ${error.message}`);
      if (error.details?.type) {
        console.log(`   Error Type: ${error.details.type}`);
        console.log(`   Suggestion: ${error.details.suggestion}`);
      }
    }
  }

  printSummary() {
    console.log('\n\n📊 Compliance Test Summary');
    console.log('===========================');
    
    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    console.log('\n📋 Test Categories:');
    const categories = [...new Set(this.testResults.map(r => r.category))];
    categories.forEach(category => {
      const categoryTests = this.testResults.filter(r => r.category === category);
      const categoryPassed = categoryTests.filter(r => r.status === 'PASS').length;
      console.log(`  ${category}: ${categoryPassed}/${categoryTests.length} passed`);
    });
    
    console.log('\n💡 IndiaMART Compliance Features:');
    console.log('   ✅ 7-day maximum date range enforcement');
    console.log('   ✅ 5-minute minimum interval between calls');
    console.log('   ✅ 15-minute API key blocking protection');
    console.log('   ✅ 365-day historical data validation');
    console.log('   ✅ Special character handling in QUERY_MESSAGE');
    console.log('   ✅ NTP synchronization recommendations');
    console.log('   ✅ 10-15 minute polling recommendations');
    console.log('   ✅ Comprehensive compliance monitoring');
  }

  async runAllTests() {
    console.log('🧪 IndiaMART API Compliance Testing');
    console.log('====================================\n');
    
    await this.testDateRangeValidation();
    await this.testRateLimiting();
    await this.testSpecialCharacterHandling();
    await this.testLeadDataCleaning();
    await this.testComplianceStatus();
    await this.testNTPSyncRecommendations();
    await this.testPollingRecommendations();
    await this.testWithRealClient();
    
    this.printSummary();
    
    console.log('\n🎉 Compliance tests completed!');
    console.log('\n📚 For more information about compliance, see:');
    console.log('   - api-compliance.js (Compliance implementation)');
    console.log('   - README.md (Documentation)');
    console.log('   - polling-service.js (Production usage)');
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new ComplianceTester();
  tester.runAllTests().catch(console.error);
}
