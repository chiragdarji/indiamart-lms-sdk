#!/usr/bin/env node

/**
 * IndiaMART Date Format Testing Tool
 * 
 * This tool tests the enhanced date formatting capabilities
 * and validates both supported IndiaMART date formats.
 */

import { IndiaMartClient } from '../src/indiamart-client.js';
import dotenv from 'dotenv';

dotenv.config();

class DateFormatTester {
  constructor() {
    this.testResults = [];
  }

  async testDateFormats() {
    console.log('🧪 Testing IndiaMART Date Format Support');
    console.log('========================================\n');

    // Test cases for different date formats
    const testCases = [
      {
        name: 'Date Format (DD-MON-YYYY)',
        format: 'date',
        input: new Date('2024-01-15T10:30:45Z'),
        expected: '15-JAN-2024'
      },
      {
        name: 'Timestamp Format (DD-MM-YYYY HH:MM:SS)',
        format: 'timestamp',
        input: new Date('2024-01-15T10:30:45Z'),
        expected: '15-01-2024 10:30:45'
      },
      {
        name: 'Local Time Date Format',
        format: 'date',
        input: new Date('2024-01-15T10:30:45Z'),
        useLocal: true,
        expected: '15-JAN-2024' // Will vary by timezone
      },
      {
        name: 'Local Time Timestamp Format',
        format: 'timestamp',
        input: new Date('2024-01-15T10:30:45Z'),
        useLocal: true,
        expected: '15-01-2024' // Will vary by timezone
      },
      {
        name: 'String Input (Already Formatted)',
        format: 'timestamp',
        input: '15-01-2024 10:30:45',
        expected: '15-01-2024 10:30:45'
      },
      {
        name: 'String Input (Date Format)',
        format: 'date',
        input: '15-JAN-2024',
        expected: '15-JAN-2024'
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n📋 Testing: ${testCase.name}`);
      console.log('─'.repeat(50));
      
      try {
        const result = IndiaMartClient.formatTimestamp(
          testCase.input, 
          testCase.useLocal || false, 
          testCase.format
        );
        
        console.log(`   Input: ${testCase.input}`);
        console.log(`   Expected: ${testCase.expected}`);
        console.log(`   Result: ${result}`);
        
        const isValid = this.validateFormat(result, testCase.format);
        const matches = testCase.useLocal ? true : result === testCase.expected;
        
        if (isValid && matches) {
          console.log('   ✅ PASS');
          this.testResults.push({ name: testCase.name, status: 'PASS' });
        } else {
          console.log('   ❌ FAIL');
          this.testResults.push({ name: testCase.name, status: 'FAIL' });
        }
        
      } catch (error) {
        console.log(`   💥 ERROR: ${error.message}`);
        this.testResults.push({ name: testCase.name, status: 'ERROR' });
      }
    }

    this.testFormatValidation();
    this.testDateRangeValidation();
    this.printSummary();
  }

  testFormatValidation() {
    console.log('\n\n🔍 Testing Format Validation');
    console.log('=============================\n');

    const validationTests = [
      { input: '15-01-2024 10:30:45', format: 'timestamp', expected: true },
      { input: '15-JAN-2024', format: 'date', expected: true },
      { input: '1-01-2024 10:30:45', format: 'timestamp', expected: false }, // Invalid day format
      { input: '15-1-2024 10:30:45', format: 'timestamp', expected: false }, // Invalid month format
      { input: '15-JAN-2024 10:30', format: 'timestamp', expected: false }, // Missing seconds
      { input: '15-JAN-24', format: 'date', expected: false }, // Invalid year format
      { input: '15-JANUARY-2024', format: 'date', expected: false }, // Invalid month format
      { input: 'invalid-date', format: 'timestamp', expected: false },
      { input: '', format: 'timestamp', expected: false }
    ];

    for (const test of validationTests) {
      const result = IndiaMartClient.isValidIndiaMartFormat(test.input);
      const status = result === test.expected ? '✅ PASS' : '❌ FAIL';
      
      console.log(`${status} "${test.input}" -> ${result} (expected: ${test.expected})`);
    }
  }

  testDateRangeValidation() {
    console.log('\n\n📅 Testing Date Range Validation');
    console.log('==================================\n');

    const rangeTests = [
      {
        name: 'Valid date range',
        startTime: '2024-01-01',
        endTime: '2024-01-31',
        expected: true
      },
      {
        name: 'Invalid: end_time before start_time',
        startTime: '2024-01-31',
        endTime: '2024-01-01',
        expected: false
      },
      {
        name: 'Invalid: date range too large (400 days)',
        startTime: '2023-01-01',
        endTime: '2024-02-05',
        expected: false
      },
      {
        name: 'Invalid: missing start_time',
        startTime: null,
        endTime: '2024-01-31',
        expected: false
      },
      {
        name: 'Invalid: missing end_time',
        startTime: '2024-01-01',
        endTime: null,
        expected: false
      },
      {
        name: 'Invalid: both missing',
        startTime: null,
        endTime: null,
        expected: false
      }
    ];

    for (const test of rangeTests) {
      const result = IndiaMartClient.validateDateRange(test.startTime, test.endTime);
      const status = result.isValid === test.expected ? '✅ PASS' : '❌ FAIL';
      
      console.log(`${status} ${test.name}: ${result.isValid} (expected: ${test.expected})`);
      if (!result.isValid) {
        console.log(`   Errors: ${result.errors.join(', ')}`);
      }
    }
  }

  validateFormat(str, format) {
    if (format === 'date') {
      return /^\d{2}-[A-Z]{3}-\d{4}$/.test(str);
    } else {
      return /^\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2}$/.test(str);
    }
  }

  printSummary() {
    console.log('\n\n📊 Test Summary');
    console.log('================');
    
    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const errors = this.testResults.filter(r => r.status === 'ERROR').length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Errors: ${errors}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    console.log('\n📋 Supported Date Formats:');
    console.log('   ✅ DD-MON-YYYY (e.g., 15-JAN-2024)');
    console.log('   ✅ DD-MM-YYYY HH:MM:SS (e.g., 15-01-2024 10:30:45)');
    console.log('   ✅ Automatic format detection');
    console.log('   ✅ UTC and local time support');
    console.log('   ✅ Date range validation');
    console.log('   ✅ 365-day limit enforcement');
  }

  async testWithRealAPI() {
    console.log('\n\n🌐 Testing with Real API');
    console.log('=========================\n');

    if (!process.env.INDIAMART_CRM_KEY) {
      console.log('⚠️  Skipping real API tests - no CRM key provided');
      return;
    }

    const client = new IndiaMartClient({ crmKey: process.env.INDIAMART_CRM_KEY });

    // Test with date format
    try {
      console.log('📅 Testing with date format (DD-MON-YYYY)...');
      const dateResult = await client.getLeads({
        startTime: '01-JAN-2024',
        endTime: '31-JAN-2024',
        dateFormat: 'date',
        maxRetries: 1
      });
      console.log(`✅ Date format success: ${dateResult.leads.length} leads`);
    } catch (error) {
      console.log(`❌ Date format error: ${error.message}`);
    }

    // Test with timestamp format
    try {
      console.log('\n📅 Testing with timestamp format (DD-MM-YYYY HH:MM:SS)...');
      const timestampResult = await client.getLeads({
        startTime: '01-01-2024 00:00:00',
        endTime: '31-01-2024 23:59:59',
        dateFormat: 'timestamp',
        maxRetries: 1
      });
      console.log(`✅ Timestamp format success: ${timestampResult.leads.length} leads`);
    } catch (error) {
      console.log(`❌ Timestamp format error: ${error.message}`);
    }
  }

  async runAllTests() {
    await this.testDateFormats();
    await this.testWithRealAPI();
    
    console.log('\n🎉 Date format tests completed!');
    console.log('\n💡 Usage Examples:');
    console.log('   // Date format');
    console.log('   client.getLeads({ startTime: "01-JAN-2024", endTime: "31-JAN-2024", dateFormat: "date" })');
    console.log('   // Timestamp format');
    console.log('   client.getLeads({ startTime: "01-01-2024 00:00:00", endTime: "31-01-2024 23:59:59", dateFormat: "timestamp" })');
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new DateFormatTester();
  tester.runAllTests().catch(console.error);
}
