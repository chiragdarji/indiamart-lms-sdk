#!/usr/bin/env node

/**
 * IndiaMART LMS Client - Example Usage
 * 
 * This file demonstrates how to use the IndiaMartClient to fetch leads
 * from IndiaMART Lead Manager System (LMS).
 * 
 * Prerequisites:
 * 1. Set your IndiaMART CRM key in environment variable: INDIAMART_CRM_KEY
 * 2. Run: npm install
 * 3. Run: node example.js
 */

import { IndiaMartClient } from '../src/indiamart-client.js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

async function main() {
  try {
    // Get CRM key from environment
    const CRM_KEY = process.env.INDIAMART_CRM_KEY;
    if (!CRM_KEY) {
      throw new Error("Please set INDIAMART_CRM_KEY environment variable");
    }

    console.log("🚀 IndiaMART LMS Client Example");
    console.log("================================\n");

    // Initialize the client
    const client = new IndiaMartClient({ 
      crmKey: CRM_KEY,
      timeoutMs: 30000, // 30 seconds timeout
      useDatabase: true // Enable SQLite database
    });

    // Initialize database
    await client.initialize();
    console.log("✅ Client initialized successfully");

    // Check rate limit status
    const rateLimitStatus = await client.getRateLimitStatus();
    console.log(`📊 Rate Limit Status: ${rateLimitStatus.canMakeCall ? '✅ Can make call' : '❌ Rate limited'}`);
    if (rateLimitStatus.lastCall) {
      console.log(`   Last call: ${new Date(rateLimitStatus.lastCall).toLocaleString()}`);
    }
    console.log();

    // Example 1: Fetch leads from last 24 hours
    console.log("📅 Fetching leads from last 24 hours...");
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const { code, message, totalRecords, leads, raw } = await client.getLeads({
      startTime: IndiaMartClient.formatTimestamp(yesterday),
      endTime: IndiaMartClient.formatTimestamp(now),
      page: 1
    });

    console.log(`📊 Response Code: ${code}`);
    console.log(`📈 Total Records: ${totalRecords || 0}`);
    console.log(`📝 Message: ${message || 'No message'}`);
    console.log(`🔍 Leads Found: ${leads.length}\n`);

    // Display first few leads
    if (leads.length > 0) {
      console.log("📋 Sample Leads:");
      console.log("================");
      
      leads.slice(0, 3).forEach((lead, index) => {
        console.log(`\nLead ${index + 1}:`);
        console.log(`  Name: ${lead.SENDER_NAME || 'N/A'}`);
        console.log(`  Mobile: ${lead.SENDER_MOBILE || 'N/A'}`);
        console.log(`  Email: ${lead.SENDER_EMAIL || 'N/A'}`);
        console.log(`  Company: ${lead.SENDER_COMPANY || 'N/A'}`);
        console.log(`  City: ${lead.SENDER_CITY || 'N/A'}`);
        console.log(`  State: ${lead.SENDER_STATE || 'N/A'}`);
        console.log(`  Product: ${lead.QUERY_PRODUCT_NAME || 'N/A'}`);
        console.log(`  Query ID: ${lead.UNIQUE_QUERY_ID || lead.QUERY_ID || 'N/A'}`);
        console.log(`  Message: ${lead.ENQ_MESSAGE || lead.QUERY_MESSAGE || 'N/A'}`);
      });
    } else {
      console.log("ℹ️  No leads found in the specified time range");
    }

    // Example 2: Fetch leads from a specific date range
    console.log("\n\n📅 Fetching leads from specific date range...");
    const startDate = new Date('2024-01-01T00:00:00Z');
    const endDate = new Date('2024-01-31T23:59:59Z');

    const januaryLeads = await client.getLeads({
      startTime: IndiaMartClient.formatTimestamp(startDate),
      endTime: IndiaMartClient.formatTimestamp(endDate),
      page: 1
    });

    console.log(`📊 January 2024 - Total Records: ${januaryLeads.totalRecords || 0}`);
    console.log(`🔍 January 2024 - Leads Found: ${januaryLeads.leads.length}`);

    // Example 3: Using local time instead of UTC
    console.log("\n\n🕐 Fetching leads using local time...");
    const localStart = IndiaMartClient.formatTimestamp(new Date(), true); // useLocal = true
    const localEnd = IndiaMartClient.formatTimestamp(new Date(Date.now() + 24 * 60 * 60 * 1000), true);

    console.log(`Local start time: ${localStart}`);
    console.log(`Local end time: ${localEnd}`);

    // Example 4: Error handling
    console.log("\n\n⚠️  Testing error handling...");
    try {
      // This will likely fail due to invalid date range
      await client.getLeads({
        startTime: 'invalid-date',
        endTime: 'also-invalid'
      });
    } catch (error) {
      console.log(`✅ Error caught as expected: ${error.message}`);
    }

    // Show system statistics
    console.log("\n📊 System Statistics:");
    const stats = await client.getSystemStats();
    console.log(`   Total API Calls: ${stats.api?.total_api_calls || 0}`);
    console.log(`   Successful Calls: ${stats.api?.successful_calls || 0}`);
    console.log(`   Failed Calls: ${stats.api?.failed_calls || 0}`);
    console.log(`   Success Rate: ${stats.api?.total_api_calls > 0 ? Math.round((stats.api.successful_calls / stats.api.total_api_calls) * 100) : 0}%`);
    console.log(`   Total Leads: ${stats.leads?.total_leads || 0}`);

    console.log("\n✅ Example completed successfully!");

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// Run the example
main();
