#!/usr/bin/env node

/**
 * IndiaMART API Response Handling Example
 * 
 * Demonstrates how to work with the official IndiaMART API response format
 * and use the comprehensive response handler.
 */

import { IndiaMartClient } from '../src/indiamart-client.js';
import { IndiaMartResponseHandler, FIELD_DOCUMENTATION } from '../src/response-handler.js';
import dotenv from 'dotenv';

dotenv.config();

class ResponseExample {
  constructor() {
    this.client = new IndiaMartClient({ 
      crmKey: process.env.INDIAMART_CRM_KEY 
    });
    this.responseHandler = new IndiaMartResponseHandler();
  }

  async demonstrateResponseHandling() {
    console.log('🔍 IndiaMART API Response Handling Demo');
    console.log('=======================================\n');

    if (!process.env.INDIAMART_CRM_KEY) {
      console.log('⚠️  No CRM key found. Using mock data for demonstration.\n');
      await this.demonstrateWithMockData();
      return;
    }

    try {
      // Get recent leads (last 7 days)
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      console.log(`📅 Fetching leads from ${startTime.toISOString()} to ${endTime.toISOString()}\n`);
      
      const result = await this.client.getLeads({
        startTime: startTime,
        endTime: endTime
      });

      if (result.success) {
        console.log(`✅ Successfully fetched ${result.leads.length} leads (${result.totalRecords} total available)\n`);
        await this.analyzeLeads(result);
      } else {
        console.log(`❌ Failed to fetch leads: ${result.message}`);
      }

    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      if (error.details) {
        console.log(`   Type: ${error.details.type}`);
        console.log(`   Suggestion: ${error.details.suggestion}`);
      }
    }
  }

  async demonstrateWithMockData() {
    console.log('📊 Using Mock Data for Demonstration\n');
    
    // Mock response based on the official format
    const mockResponse = {
      CODE: 200,
      STATUS: "SUCCESS",
      MESSAGE: "",
      TOTAL_RECORDS: 18,
      RESPONSE: [
        {
          UNIQUE_QUERY_ID: "2012487827",
          QUERY_TYPE: "W",
          QUERY_TIME: "2021-12-08 12:47:25",
          SENDER_NAME: "Arun",
          SENDER_MOBILE: "+91-999XXXXXXX",
          SENDER_EMAIL: "arunxyz@gmail.com",
          SENDER_COMPANY: "Arun Industries",
          SENDER_ADDRESS: "Arun Industries, Meerut, Uttar Pradesh, 250001",
          SENDER_CITY: "Meerut",
          SENDER_STATE: "Uttar Pradesh",
          SENDER_PINCODE: "250001",
          SENDER_COUNTRY_ISO: "IN",
          SENDER_MOBILE_ALT: null,
          SENDER_EMAIL_ALT: "arunxyz1@gmail.com",
          QUERY_PRODUCT_NAME: "Dye Sublimation Ink",
          QUERY_MESSAGE: "I want to buy Dye Sublimation Ink.",
          QUERY_MCAT_NAME: "Sublimation Ink",
          CALL_DURATION: null,
          RECEIVER_MOBILE: null
        },
        {
          UNIQUE_QUERY_ID: "2012487828",
          QUERY_TYPE: "B",
          QUERY_TIME: "2021-12-08 14:30:15",
          SENDER_NAME: "IndiaMART Buyer",
          SENDER_MOBILE: "+91-888XXXXXXX",
          SENDER_EMAIL: "buyer@example.com",
          SENDER_COMPANY: "Tech Solutions",
          SENDER_ADDRESS: "Tech Park, Bangalore, Karnataka, 560001",
          SENDER_CITY: "Bangalore",
          SENDER_STATE: "Karnataka",
          SENDER_PINCODE: "560001",
          SENDER_COUNTRY_ISO: "IN",
          SENDER_MOBILE_ALT: null,
          SENDER_EMAIL_ALT: null,
          QUERY_PRODUCT_NAME: "Industrial Equipment",
          QUERY_MESSAGE: "Looking for industrial equipment\\nwith specifications\\tand pricing.",
          QUERY_MCAT_NAME: "Industrial Machinery",
          CALL_DURATION: "00:05:30",
          RECEIVER_MOBILE: "+91-9876543210"
        },
        {
          UNIQUE_QUERY_ID: "2012487829",
          QUERY_TYPE: "WA",
          QUERY_TIME: "2021-12-08 16:45:00",
          SENDER_NAME: "Priya Sharma",
          SENDER_MOBILE: "+91-777XXXXXXX",
          SENDER_EMAIL: "priya@company.com",
          SENDER_COMPANY: "Sharma Enterprises",
          SENDER_ADDRESS: "Business District, Mumbai, Maharashtra, 400001",
          SENDER_CITY: "Mumbai",
          SENDER_STATE: "Maharashtra",
          SENDER_PINCODE: "400001",
          SENDER_COUNTRY_ISO: "IN",
          SENDER_MOBILE_ALT: null,
          SENDER_EMAIL_ALT: null,
          QUERY_PRODUCT_NAME: "WhatsApp Business Tools",
          QUERY_MESSAGE: "Interested in WhatsApp business solutions",
          QUERY_MCAT_NAME: "Business Software",
          CALL_DURATION: null,
          RECEIVER_MOBILE: null
        }
      ]
    };

    // Process the mock response
    const processedResponse = this.responseHandler.processResponse(mockResponse);
    
    console.log(`✅ Processed ${processedResponse.leads.length} leads from mock data\n`);
    await this.analyzeLeads(processedResponse);
  }

  async analyzeLeads(result) {
    console.log('📊 Lead Analysis');
    console.log('================\n');

    // Basic statistics
    const stats = this.responseHandler.getLeadStatistics(result.leads);
    console.log(`Total Leads: ${stats.total}`);
    console.log(`Time Range: ${stats.timeRange.earliest?.toISOString()} to ${stats.timeRange.latest?.toISOString()}\n`);

    // Lead types breakdown
    console.log('📋 Lead Types:');
    const leadTypes = this.responseHandler.getAllLeadTypes();
    Object.entries(stats.byType).forEach(([type, count]) => {
      const typeInfo = leadTypes[type];
      console.log(`  ${type} (${typeInfo.name}): ${count} leads`);
    });

    // Countries breakdown
    if (Object.keys(stats.byCountry).length > 0) {
      console.log('\n🌍 Countries:');
      Object.entries(stats.byCountry).forEach(([country, count]) => {
        console.log(`  ${country}: ${count} leads`);
      });
    }

    // Top products
    if (Object.keys(stats.byProduct).length > 0) {
      console.log('\n🛍️ Top Products:');
      Object.entries(stats.byProduct)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([product, count]) => {
          console.log(`  ${product}: ${count} leads`);
        });
    }

    // Sample lead details
    console.log('\n📝 Sample Lead Details:');
    if (result.leads.length > 0) {
      const sampleLead = result.leads[0];
      console.log(`  ID: ${sampleLead.uniqueQueryId}`);
      console.log(`  Type: ${sampleLead.queryType} (${sampleLead.queryTypeInfo.name})`);
      console.log(`  Time: ${sampleLead.queryTime}`);
      console.log(`  Sender: ${sampleLead.sender.name} (${sampleLead.sender.company})`);
      console.log(`  Contact: ${sampleLead.sender.mobile || sampleLead.sender.email}`);
      console.log(`  Location: ${sampleLead.sender.city}, ${sampleLead.sender.state}, ${sampleLead.sender.country}`);
      console.log(`  Product: ${sampleLead.query.productName}`);
      console.log(`  Message: ${sampleLead.query.message}`);
      console.log(`  Category: ${sampleLead.query.category}`);
    }

    // Demonstrate filtering
    console.log('\n🔍 Filtering Examples:');
    const directEnquiries = this.responseHandler.filterLeadsByType(result.leads, 'W');
    console.log(`  Direct Enquiries (W): ${directEnquiries.length} leads`);

    const buyLeads = this.responseHandler.filterLeadsByType(result.leads, 'B');
    console.log(`  Buy Leads (B): ${buyLeads.length} leads`);

    const whatsappLeads = this.responseHandler.filterLeadsByType(result.leads, 'WA');
    console.log(`  WhatsApp Leads (WA): ${whatsappLeads.length} leads`);

    // Export examples
    console.log('\n📤 Export Examples:');
    console.log('  CSV Export (first 2 leads):');
    const csvData = this.responseHandler.exportLeads(result.leads.slice(0, 2), 'csv');
    console.log(csvData);

    console.log('\n  Summary Export:');
    const summaryData = this.responseHandler.exportLeads(result.leads, 'summary');
    console.log(summaryData);
  }

  demonstrateFieldDocumentation() {
    console.log('\n📚 Field Documentation');
    console.log('======================\n');

    console.log('Key Fields and Their Meanings:\n');
    
    const keyFields = [
      'UNIQUE_QUERY_ID',
      'QUERY_TYPE', 
      'QUERY_TIME',
      'SENDER_NAME',
      'SENDER_MOBILE',
      'SENDER_EMAIL',
      'SENDER_COUNTRY_ISO',
      'QUERY_PRODUCT_NAME',
      'QUERY_MESSAGE',
      'QUERY_MCAT_NAME'
    ];

    keyFields.forEach(field => {
      const doc = FIELD_DOCUMENTATION[field];
      if (doc) {
        console.log(`${field}:`);
        console.log(`  Description: ${doc.description}`);
        console.log(`  Type: ${doc.type}`);
        console.log(`  Required: ${doc.required ? 'Yes' : 'No'}`);
        if (doc.example) console.log(`  Example: ${doc.example}`);
        if (doc.format) console.log(`  Format: ${doc.format}`);
        if (doc.values) {
          console.log(`  Values:`);
          Object.entries(doc.values).forEach(([key, value]) => {
            console.log(`    ${key}: ${value}`);
          });
        }
        if (doc.note) console.log(`  Note: ${doc.note}`);
        console.log('');
      }
    });
  }

  async run() {
    await this.demonstrateResponseHandling();
    this.demonstrateFieldDocumentation();
    
    console.log('\n🎉 Response handling demonstration completed!');
    console.log('\n💡 Key Features Demonstrated:');
    console.log('   ✅ Official API response format processing');
    console.log('   ✅ Lead type classification and filtering');
    console.log('   ✅ Comprehensive field documentation');
    console.log('   ✅ Data validation and error handling');
    console.log('   ✅ Export capabilities (CSV, Summary)');
    console.log('   ✅ Special character handling in messages');
    console.log('   ✅ Lead statistics and analytics');
  }
}

// Run the example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const example = new ResponseExample();
  example.run().catch(console.error);
}
