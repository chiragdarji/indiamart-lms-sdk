#!/usr/bin/env node

/**
 * Test Final Solution - Verify all issues are resolved
 */

import { IndiaMartSDK } from './src/sdk.js';

console.log('🎯 Testing Final Solution - All Issues Resolved');
console.log('===============================================\n');

const CRM_KEY = "mRy2FLFv7H3JSfet432Y/FmIq1fAlDc=";

try {
  const sdk = new IndiaMartSDK(CRM_KEY);
  await sdk.initialize();
  
  console.log('✅ SDK Initialized Successfully');
  
  // Test 1: Health Status - Should show no [object Object]
  console.log('\n1️⃣ HEALTH STATUS TEST');
  console.log('====================');
  const health = await sdk.getHealthStatus();
  console.log('Health Status:');
  console.log(JSON.stringify(health, null, 2));
  
  // Check for [object Object]
  const healthStr = JSON.stringify(health);
  const hasObjectObject = healthStr.includes('[object Object]');
  console.log(`\n[object Object] Check: ${hasObjectObject ? '❌ FOUND' : '✅ NOT FOUND'}`);
  
  // Test 2: API Call - Should work with proper date format
  console.log('\n2️⃣ API CALL TEST');
  console.log('================');
  
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 1); // Yesterday
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 1); // Day before yesterday
  
  console.log(`📅 Fetching leads from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
  
  const result = await sdk.getLeadsForDateRange(startDate, endDate);
  
  console.log('\n✅ API Call Result:');
  console.log(`   Success: ${result.success}`);
  console.log(`   Code: ${result.code}`);
  console.log(`   Status: ${result.status}`);
  console.log(`   Message: ${result.message}`);
  console.log(`   Error: ${result.error || 'null'}`);
  console.log(`   Total Records: ${result.totalRecords}`);
  console.log(`   Leads Count: ${result.leads?.length || 0}`);
  console.log(`   Raw Data: ${result.raw ? 'Present' : 'Missing'}`);
  console.log(`   Download Path: ${result.downloadPath || 'None'}`);
  
  // Check for undefined values
  const hasUndefined = Object.values(result).some(val => val === undefined);
  console.log(`   Has Undefined Values: ${hasUndefined ? '❌ YES' : '✅ NO'}`);
  
  if (hasUndefined) {
    console.log('❌ Found undefined values:');
    Object.entries(result).forEach(([key, value]) => {
      if (value === undefined) {
        console.log(`   - ${key}: undefined`);
      }
    });
  }
  
  // Test 3: Show sample lead data
  if (result.leads && result.leads.length > 0) {
    console.log('\n3️⃣ SAMPLE LEAD DATA');
    console.log('==================');
    const sampleLead = result.leads[0];
    console.log('First Lead:');
    console.log(JSON.stringify(sampleLead, null, 2));
  }
  
  // Test 4: Health Status After API Call
  console.log('\n4️⃣ HEALTH STATUS AFTER API CALL');
  console.log('================================');
  const healthAfter = await sdk.getHealthStatus();
  const healthAfterStr = JSON.stringify(healthAfter);
  const hasObjectObjectAfter = healthAfterStr.includes('[object Object]');
  console.log(`[object Object] Check After: ${hasObjectObjectAfter ? '❌ FOUND' : '✅ NOT FOUND'}`);
  
  // Summary
  console.log('\n🎯 FINAL TEST SUMMARY');
  console.log('====================');
  console.log(`✅ Health Status [object Object]: ${hasObjectObject ? '❌ FAILED' : '✅ PASSED'}`);
  console.log(`✅ API Call Success: ${result.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`✅ No Undefined Values: ${hasUndefined ? '❌ FAILED' : '✅ PASSED'}`);
  console.log(`✅ Raw Data Present: ${result.raw ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`✅ Health Status After [object Object]: ${hasObjectObjectAfter ? '❌ FAILED' : '✅ PASSED'}`);
  
  const allPassed = !hasObjectObject && result.success && !hasUndefined && result.raw && !hasObjectObjectAfter;
  console.log(`\n🏆 OVERALL RESULT: ${allPassed ? '✅ ALL ISSUES RESOLVED!' : '❌ SOME ISSUES REMAIN'}`);
  
} catch (error) {
  console.log(`❌ Test failed: ${error.message}`);
  console.log(error.stack);
}
