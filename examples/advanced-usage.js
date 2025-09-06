/**
 * Advanced Usage Example - IndiaMART LMS SDK
 * 
 * This example shows advanced usage with custom parameters,
 * error handling, and optional features.
 */

import { IndiaMartSDK } from '../src/sdk.js';

// Your IndiaMART CRM key
const CRM_KEY = process.env.INDIAMART_CRM_KEY || 'your-crm-key-here';

async function main() {
  console.log('🚀 IndiaMART LMS SDK - Advanced Usage Example\n');

  // Initialize with advanced options
  const sdk = new IndiaMartSDK(CRM_KEY, {
    timeoutMs: 30000,        // Custom timeout
    downloadPath: './downloads' // Custom download path
  });

  try {
    // Example 1: Custom date range
    console.log('📅 Fetching leads for custom date range...');
    const customResult = await sdk.getLeadsForDateRange('2024-01-01', '2024-01-02');
    
    if (customResult.success) {
      console.log(`✅ Found ${customResult.leads.length} leads in custom range`);
      if (customResult.downloadPath) {
        console.log(`📁 Downloaded to: ${customResult.downloadPath}`);
      }
    } else {
      console.log(`❌ Error: ${customResult.error}`);
    }

    // Example 2: Custom parameters
    console.log('\n📅 Fetching leads with custom parameters...');
    const customParamsResult = await sdk.getLeads({
      startTime: '2024-01-01',
      endTime: '2024-01-02',
      page: 1,
      dateFormat: 'timestamp'
    });
    
    if (customParamsResult.success) {
      console.log(`✅ Found ${customParamsResult.leads.length} leads with custom params`);
      if (customParamsResult.downloadPath) {
        console.log(`📁 Downloaded to: ${customParamsResult.downloadPath}`);
      }
    } else {
      console.log(`❌ Error: ${customParamsResult.error}`);
    }

    // Example 3: Error handling with retry logic
    console.log('\n🔄 Demonstrating error handling...');
    await demonstrateErrorHandling(sdk);

    // Example 4: Lead processing
    console.log('\n📊 Processing leads...');
    await processLeads(sdk);

    // Example 5: Download functionality
    console.log('\n📁 Demonstrating download functionality...');
    await demonstrateDownloads(sdk);

    // Example 6: Utility functions
    console.log('\n🛠️  Using utility functions...');
    await demonstrateUtilities();

  } catch (error) {
    console.error('💥 Exception occurred:', error.message);
  }
}

async function demonstrateErrorHandling(sdk) {
  try {
    // This might fail if rate limited
    const result = await sdk.getLeadsForToday();
    
    if (result.success) {
      console.log('✅ Request successful');
    } else {
      console.log(`❌ Request failed: ${result.error} (Code: ${result.code})`);
      
      // Handle specific error types
      if (result.code === 429) {
        console.log('⏳ Rate limited - would retry after delay');
      } else if (result.code === 401) {
        console.log('🔑 Authentication failed - check your CRM key');
      } else if (result.code === 400) {
        console.log('📝 Bad request - check your parameters');
      }
    }
  } catch (error) {
    console.log(`💥 Exception: ${error.message}`);
  }
}

async function processLeads(sdk) {
  try {
    const result = await sdk.getLeadsForToday();
    
    if (result.success && result.leads.length > 0) {
      const leads = result.leads;
      
      // Categorize leads
      const highValueLeads = leads.filter(lead => 
        lead.QUERY_PRODUCT_NAME?.toLowerCase().includes('premium') ||
        lead.QUERY_PRODUCT_NAME?.toLowerCase().includes('high')
      );
      
      const mobileLeads = leads.filter(lead => 
        lead.SENDER_MOBILE && lead.SENDER_MOBILE.length > 0
      );
      
      const emailLeads = leads.filter(lead => 
        lead.SENDER_EMAIL && lead.SENDER_EMAIL.includes('@')
      );
      
      console.log(`📊 Lead Analysis:`);
      console.log(`   Total leads: ${leads.length}`);
      console.log(`   High value leads: ${highValueLeads.length}`);
      console.log(`   Leads with mobile: ${mobileLeads.length}`);
      console.log(`   Leads with email: ${emailLeads.length}`);
      
      // Show sample high value leads
      if (highValueLeads.length > 0) {
        console.log(`\n💎 High Value Leads:`);
        highValueLeads.slice(0, 2).forEach((lead, index) => {
          console.log(`   ${index + 1}. ${lead.SENDER_NAME} - ${lead.QUERY_PRODUCT_NAME}`);
        });
      }
    } else {
      console.log('ℹ️  No leads to process');
    }
  } catch (error) {
    console.log(`💥 Error processing leads: ${error.message}`);
  }
}

async function demonstrateDownloads(sdk) {
  try {
    // Show current download path
    console.log(`📁 Current download path: ${sdk.getDownloadPath()}`);
    
    // Change download path
    sdk.setDownloadPath('./my-leads');
    console.log(`📁 Changed download path to: ${sdk.getDownloadPath()}`);
    
    // Try to get leads (this will create the download directory)
    const result = await sdk.getLeadsForToday();
    if (result.success && result.downloadPath) {
      console.log(`✅ Leads downloaded to: ${result.downloadPath}`);
    } else {
      console.log(`ℹ️  No leads to download or error occurred`);
    }
    
  } catch (error) {
    console.log(`💥 Error demonstrating downloads: ${error.message}`);
  }
}

async function demonstrateUtilities() {
  // Format dates
  const now = new Date();
  const formattedDate = IndiaMartSDK.formatDate(now, 'timestamp');
  const formattedDateOnly = IndiaMartSDK.formatDate(now, 'date');
  
  console.log(`📅 Current date formatted:`);
  console.log(`   Timestamp format: ${formattedDate}`);
  console.log(`   Date format: ${formattedDateOnly}`);
  
  // Validate date ranges
  const validation = IndiaMartSDK.validateDateRange('2024-01-01', '2024-01-02');
  console.log(`\n✅ Date range validation:`);
  console.log(`   Valid: ${validation.isValid}`);
  if (!validation.isValid) {
    console.log(`   Errors: ${validation.errors.join(', ')}`);
  }
  
  // Test invalid date range
  const invalidValidation = IndiaMartSDK.validateDateRange('2024-01-02', '2024-01-01');
  console.log(`\n❌ Invalid date range validation:`);
  console.log(`   Valid: ${invalidValidation.isValid}`);
  if (!invalidValidation.isValid) {
    console.log(`   Errors: ${invalidValidation.errors.join(', ')}`);
  }
}

// Run the example
main().catch(console.error);
