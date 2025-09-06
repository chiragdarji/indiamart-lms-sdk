/**
 * Simple Usage Example - IndiaMART LMS SDK
 * 
 * This example shows the basic usage of the IndiaMART LMS SDK
 * with minimal configuration - just your CRM key!
 */

import { IndiaMartSDK } from '../src/sdk.js';

// Your IndiaMART CRM key (get this from your IndiaMART seller portal)
const CRM_KEY = process.env.INDIAMART_CRM_KEY || 'your-crm-key-here';

async function main() {
  console.log('🚀 IndiaMART LMS SDK - Simple Usage Example\n');

  // Initialize the SDK with just your CRM key
  const sdk = new IndiaMartSDK(CRM_KEY);

  try {
    // Get leads for today
    console.log('📅 Fetching leads for today...');
    const todayResult = await sdk.getLeadsForToday();
    
    if (todayResult.success) {
      console.log(`✅ Found ${todayResult.leads.length} leads today`);
      console.log(`📊 Total records: ${todayResult.totalRecords}`);
      
      if (todayResult.downloadPath) {
        console.log(`📁 Downloaded to: ${todayResult.downloadPath}`);
      }
      
      // Display first few leads
      todayResult.leads.slice(0, 3).forEach((lead, index) => {
        console.log(`\n📋 Lead ${index + 1}:`);
        console.log(`   Name: ${lead.SENDER_NAME || 'N/A'}`);
        console.log(`   Company: ${lead.SENDER_COMPANY || 'N/A'}`);
        console.log(`   Mobile: ${lead.SENDER_MOBILE || 'N/A'}`);
        console.log(`   Product: ${lead.QUERY_PRODUCT_NAME || 'N/A'}`);
      });
    } else {
      console.log(`❌ Error: ${todayResult.error}`);
    }

    // Get leads for yesterday
    console.log('\n📅 Fetching leads for yesterday...');
    const yesterdayResult = await sdk.getLeadsForYesterday();
    
    if (yesterdayResult.success) {
      console.log(`✅ Found ${yesterdayResult.leads.length} leads yesterday`);
      if (yesterdayResult.downloadPath) {
        console.log(`📁 Downloaded to: ${yesterdayResult.downloadPath}`);
      }
    } else {
      console.log(`❌ Error: ${yesterdayResult.error}`);
    }

    // Get leads for last 7 days
    console.log('\n📅 Fetching leads for last 7 days...');
    const weekResult = await sdk.getLeadsForLastDays(7);
    
    if (weekResult.success) {
      console.log(`✅ Found ${weekResult.leads.length} leads in last 7 days`);
      if (weekResult.downloadPath) {
        console.log(`📁 Downloaded to: ${weekResult.downloadPath}`);
      }
    } else {
      console.log(`❌ Error: ${weekResult.error}`);
    }

  } catch (error) {
    console.error('💥 Exception occurred:', error.message);
  }
}

// Run the example
main().catch(console.error);
