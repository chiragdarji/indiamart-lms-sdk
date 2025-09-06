#!/usr/bin/env node

/**
 * Secure Usage Example - IndiaMART LMS SDK
 * 
 * This example demonstrates the secure and optimized usage of the SDK
 * with input validation, secure logging, caching, and error handling.
 */

import { IndiaMartSDK } from '../src/index.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function demonstrateSecureUsage() {
  console.log('🔒 IndiaMART LMS SDK - Secure Usage Example\n');

  try {
    // Check if CRM key is available
    if (!process.env.INDIAMART_CRM_KEY) {
      console.log('⚠️ No CRM key found. Using demo mode with mock data.\n');
      
      // Demonstrate input validation without API calls
      console.log('🛡️ Input Validation Demo:');
      
      // Create a mock SDK instance for validation demo
      const { InputValidator } = await import('../src/input-validator.js');
      
      // Valid input
      const validInput = InputValidator.validateString('test@example.com', {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        minLength: 5,
        maxLength: 100
      });
      console.log('Valid email validation:', validInput.isValid ? '✅' : '❌');

      // Invalid input
      const invalidInput = InputValidator.validateString('invalid-email', {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        minLength: 5,
        maxLength: 100
      });
      console.log('Invalid email validation:', invalidInput.isValid ? '✅' : '❌', 
                  invalidInput.errors.join(', '));

      // Demonstrate file path validation
      const pathValidation = InputValidator.validateFilePath('../sensitive-file.txt');
      console.log('Path traversal validation:', pathValidation.isValid ? '✅' : '❌', 
                  pathValidation.errors.join(', '));

      console.log('\n✅ Security validation demonstration completed!');
      console.log('💡 To test full functionality, set INDIAMART_CRM_KEY environment variable');
      return;
    }

    // Initialize SDK with secure configuration
    const sdk = new IndiaMartSDK(process.env.INDIAMART_CRM_KEY, {
      paths: {
        downloadPath: './secure-downloads',
        logPath: './secure-logs',
        dataPath: './secure-data'
      }
    });

    console.log('✅ SDK initialized with secure configuration');

    // Demonstrate input validation
    console.log('\n🛡️ Input Validation Demo:');
    
    // Valid input
    const validInput = sdk.validateInput('test@example.com', {
      type: 'string',
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      min: 5,
      max: 100
    });
    console.log('Valid email validation:', validInput.isValid ? '✅' : '❌');

    // Invalid input
    const invalidInput = sdk.validateInput('invalid-email', {
      type: 'string',
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      min: 5,
      max: 100
    });
    console.log('Invalid email validation:', invalidInput.isValid ? '✅' : '❌', 
                invalidInput.errors.join(', '));

    // Demonstrate health check
    console.log('\n🏥 Health Check:');
    const health = await sdk.getHealthStatus();
    console.log('SDK Health:', health.status);
    console.log('Components:', Object.keys(health.components).join(', '));

    // Demonstrate caching
    console.log('\n💾 Caching Demo:');
    const cacheStats = sdk.getCacheStats();
    console.log('Cache Stats:', {
      size: cacheStats.size,
      hitRate: `${cacheStats.hitRate}%`,
      totalRequests: cacheStats.totalRequests
    });

    // Demonstrate secure logging
    console.log('\n📝 Secure Logging Demo:');
    const logs = await sdk.getSecureLogs(5);
    console.log(`Retrieved ${logs.length} recent log entries`);

    // Demonstrate error handling with invalid dates
    console.log('\n⚠️ Error Handling Demo:');
    
    try {
      // This should fail due to invalid date range
      const result = await sdk.getLeadsForDateRange('invalid-date', 'also-invalid');
      console.log('Invalid date result:', result.success ? '✅' : '❌', result.error);
    } catch (error) {
      console.log('Caught error:', error.message);
    }

    // Demonstrate proper date usage
    console.log('\n📅 Proper Date Usage:');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    try {
      const result = await sdk.getLeadsForYesterday();
      console.log('Yesterday leads result:', result.success ? '✅' : '❌');
      if (result.success) {
        console.log(`Found ${result.leads.length} leads`);
        if (result.downloadPath) {
          console.log(`Downloaded to: ${result.downloadPath}`);
        }
      } else {
        console.log('Error:', result.error);
      }
    } catch (error) {
      console.log('Error fetching yesterday leads:', error.message);
    }

    // Demonstrate cache management
    console.log('\n🗑️ Cache Management:');
    
    // Clear specific cache pattern
    const clearResult = await sdk.clearCache('leads:.*');
    console.log('Cache clear result:', clearResult.success ? '✅' : '❌', clearResult.message);

    // Demonstrate log management
    console.log('\n🧹 Log Management:');
    const logClearResult = await sdk.clearOldSecureLogs(7); // Keep only 7 days
    console.log('Log clear result:', logClearResult.success ? '✅' : '❌', logClearResult.message);

    // Demonstrate resource cleanup
    console.log('\n🧽 Resource Cleanup:');
    const destroyResult = await sdk.destroy();
    console.log('SDK destroyed:', destroyResult.success ? '✅' : '❌', destroyResult.message);

    console.log('\n✅ Secure usage demonstration completed!');

  } catch (error) {
    console.error('❌ Error in secure usage demo:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the demonstration
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateSecureUsage().catch(console.error);
}

export { demonstrateSecureUsage };
