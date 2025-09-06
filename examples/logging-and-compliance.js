/**
 * Logging and Compliance Example - IndiaMART LMS SDK
 * 
 * This example demonstrates the new logging, rate limiting, and compliance features:
 * - API logs and rate limits stored in files
 * - JSON responses without deduplication
 * - Non-configurable date compliance with IndiaMART limits
 */

import { IndiaMartSDK } from '../src/sdk.js';

// Your IndiaMART CRM key
const CRM_KEY = process.env.INDIAMART_CRM_KEY || 'your-crm-key-here';

async function main() {
  console.log('🚀 IndiaMART LMS SDK - Logging and Compliance Example\n');

  // Initialize SDK with custom paths
  const sdk = new IndiaMartSDK(CRM_KEY, {
    downloadPath: './downloads',
    logPath: './logs',
    timeoutMs: 30000
  });

  try {
    // Show current configuration
    console.log('📁 Configuration:');
    console.log(`   Download path: ${sdk.getDownloadPath()}`);
    console.log(`   Log path: ./logs`);
    console.log('');

    // Check rate limit status before making calls
    console.log('📊 Rate Limit Status:');
    const rateLimitStatus = sdk.getRateLimitStatus();
    console.log(`   Allowed: ${rateLimitStatus.allowed}`);
    console.log(`   Calls this minute: ${rateLimitStatus.callsPerMinute}/${rateLimitStatus.minuteLimit}`);
    console.log(`   Calls this hour: ${rateLimitStatus.callsPerHour}/${rateLimitStatus.hourLimit}`);
    console.log(`   Is blocked: ${rateLimitStatus.isBlocked}`);
    console.log('');

    // Test date compliance
    console.log('📅 Date Compliance Testing:');
    
    // Test valid date range
    const validRange = sdk.dateCompliance.validateDateRange('2024-01-01', '2024-01-02');
    console.log(`   Valid range (2024-01-01 to 2024-01-02): ${validRange.isValid ? '✅' : '❌'}`);
    if (!validRange.isValid) {
      console.log(`   Errors: ${validRange.errors.join(', ')}`);
    }

    // Test invalid date range (too long)
    const invalidRange = sdk.dateCompliance.validateDateRange('2024-01-01', '2024-01-15');
    console.log(`   Invalid range (2024-01-01 to 2024-01-15): ${invalidRange.isValid ? '✅' : '❌'}`);
    if (!invalidRange.isValid) {
      console.log(`   Errors: ${invalidRange.errors.join(', ')}`);
    }

    // Test future date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const futureRange = sdk.dateCompliance.validateDateRange(futureDate, futureDate);
    console.log(`   Future date: ${futureRange.isValid ? '✅' : '❌'}`);
    if (!futureRange.isValid) {
      console.log(`   Errors: ${futureRange.errors.join(', ')}`);
    }
    console.log('');

    // Test API calls with logging
    console.log('🔄 Testing API calls with logging...');
    
    // Try to get leads for yesterday (should work with compliance)
    console.log('📅 Fetching leads for yesterday...');
    const yesterdayResult = await sdk.getLeadsForYesterday();
    
    if (yesterdayResult.success) {
      console.log(`✅ Found ${yesterdayResult.leads.length} leads`);
      if (yesterdayResult.downloadPath) {
        console.log(`📁 Downloaded to: ${yesterdayResult.downloadPath}`);
      }
    } else {
      console.log(`❌ Error: ${yesterdayResult.error}`);
      if (yesterdayResult.compliance) {
        console.log(`   Compliance: ${yesterdayResult.compliance.compliance}`);
      }
    }

    // Try to get leads for last 7 days (should be limited to 7 days max)
    console.log('\n📅 Fetching leads for last 7 days...');
    const weekResult = await sdk.getLeadsForLastDays(7);
    
    if (weekResult.success) {
      console.log(`✅ Found ${weekResult.leads.length} leads`);
      if (weekResult.downloadPath) {
        console.log(`📁 Downloaded to: ${weekResult.downloadPath}`);
      }
    } else {
      console.log(`❌ Error: ${weekResult.error}`);
      if (weekResult.compliance) {
        console.log(`   Compliance: ${weekResult.compliance.compliance}`);
      }
    }

    // Try to get leads for last 30 days (should be limited to 7 days)
    console.log('\n📅 Fetching leads for last 30 days (will be limited to 7 days)...');
    const monthResult = await sdk.getLeadsForLastDays(30);
    
    if (monthResult.success) {
      console.log(`✅ Found ${monthResult.leads.length} leads`);
      if (monthResult.downloadPath) {
        console.log(`📁 Downloaded to: ${monthResult.downloadPath}`);
      }
    } else {
      console.log(`❌ Error: ${monthResult.error}`);
      if (monthResult.compliance) {
        console.log(`   Compliance: ${monthResult.compliance.compliance}`);
      }
    }

    // Show API logs
    console.log('\n📝 Recent API Logs:');
    const apiLogs = sdk.getAPILogs(5);
    apiLogs.forEach((log, index) => {
      console.log(`   ${index + 1}. ${log.timestamp} - ${log.method} ${log.url} - ${log.statusCode} (${log.responseTime}ms)`);
      console.log(`      Success: ${log.success}, Leads: ${log.leadsCount}, Error: ${log.error || 'None'}`);
    });

    // Show API statistics
    console.log('\n📊 API Statistics:');
    const apiStats = sdk.getAPIStats();
    if (apiStats) {
      console.log(`   Total calls: ${apiStats.totalCalls}`);
      console.log(`   Successful calls: ${apiStats.successfulCalls}`);
      console.log(`   Failed calls: ${apiStats.failedCalls}`);
      console.log(`   Success rate: ${apiStats.successRate.toFixed(1)}%`);
      console.log(`   Average response time: ${apiStats.averageResponseTime.toFixed(0)}ms`);
      console.log(`   Total leads: ${apiStats.totalLeads}`);
    }

    // Show rate limit statistics
    console.log('\n📊 Rate Limit Statistics:');
    const rateLimitStats = sdk.getRateLimitStats();
    if (rateLimitStats) {
      console.log(`   Total calls: ${rateLimitStats.totalCalls}`);
      console.log(`   Calls last hour: ${rateLimitStats.callsLastHour}`);
      console.log(`   Calls last day: ${rateLimitStats.callsLastDay}`);
      console.log(`   Is blocked: ${rateLimitStats.isBlocked}`);
      console.log(`   Last reset: ${rateLimitStats.lastReset}`);
    }

    // Test JSON file structure (if any files were created)
    console.log('\n📁 Checking downloaded files...');
    const fs = await import('fs');
    const path = await import('path');
    
    try {
      const downloadDir = sdk.getDownloadPath();
      const files = fs.readdirSync(downloadDir);
      
      if (files.length > 0) {
        console.log(`   Found ${files.length} files in ${downloadDir}:`);
        files.forEach(file => {
          console.log(`   - ${file}`);
        });
        
        // Show structure of first JSON file
        const firstFile = files[0];
        const filePath = path.join(downloadDir, firstFile);
        const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        console.log(`\n📄 Structure of ${firstFile}:`);
        console.log(`   Metadata:`, {
          downloadTime: fileContent.metadata.downloadTime,
          startDate: fileContent.metadata.startDate,
          endDate: fileContent.metadata.endDate,
          totalLeads: fileContent.metadata.totalLeads,
          deduplication: fileContent.metadata.deduplication,
          apiCallId: fileContent.metadata.apiCallId
        });
        console.log(`   Leads count: ${fileContent.leads.length}`);
        console.log(`   Deduplication: ${fileContent.metadata.deduplication ? 'Enabled' : 'Disabled'}`);
      } else {
        console.log('   No files downloaded (no leads found or API errors)');
      }
    } catch (error) {
      console.log(`   Error reading download directory: ${error.message}`);
    }

  } catch (error) {
    console.error('💥 Exception occurred:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the example
main().catch(console.error);
