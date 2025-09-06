/**
 * Configurable Paths Example - IndiaMART LMS SDK
 * 
 * This example demonstrates how to configure all file and folder paths
 * in the IndiaMART SDK for different deployment scenarios.
 */

import { IndiaMartSDK } from '../src/sdk.js';

// Your IndiaMART CRM key
const CRM_KEY = process.env.INDIAMART_CRM_KEY || 'your-crm-key-here';

async function main() {
  console.log('🚀 IndiaMART LMS SDK - Configurable Paths Example\n');

  // Example 1: Basic configuration (backward compatible)
  console.log('📁 Example 1: Basic Configuration (Backward Compatible)');
  console.log('=' .repeat(60));
  
  const basicSDK = new IndiaMartSDK(CRM_KEY, {
    downloadPath: './my-downloads',
    logPath: './my-logs'
  });
  
  console.log('Configuration:');
  console.log(`   Download path: ${basicSDK.getDownloadPath()}`);
  console.log(`   Log path: ${basicSDK.options.paths.logPath}`);
  console.log(`   API log file: ${basicSDK.options.paths.apiLogFile}`);
  console.log(`   Rate limit file: ${basicSDK.options.paths.rateLimitFile}`);
  console.log('');

  // Example 2: Comprehensive path configuration
  console.log('📁 Example 2: Comprehensive Path Configuration');
  console.log('=' .repeat(60));
  
  const comprehensiveSDK = new IndiaMartSDK(CRM_KEY, {
    timeoutMs: 30000,
    paths: {
      // JSON download paths
      downloadPath: './custom-downloads',
      
      // Logging paths
      logPath: './custom-logs',
      apiLogFile: 'custom-api-logs.json',
      rateLimitFile: 'custom-rate-limits.json',
      
      // Data storage paths
      dataPath: './custom-data',
      leadsPath: './custom-data/raw-leads',
      processedPath: './custom-data/processed-leads',
      failedPath: './custom-data/failed-leads'
    }
  });
  
  console.log('Configuration:');
  console.log(`   Download path: ${comprehensiveSDK.getDownloadPath()}`);
  console.log(`   Log path: ${comprehensiveSDK.options.paths.logPath}`);
  console.log(`   API log file: ${comprehensiveSDK.options.paths.apiLogFile}`);
  console.log(`   Rate limit file: ${comprehensiveSDK.options.paths.rateLimitFile}`);
  console.log(`   Data path: ${comprehensiveSDK.options.paths.dataPath}`);
  console.log(`   Leads path: ${comprehensiveSDK.options.paths.leadsPath}`);
  console.log(`   Processed path: ${comprehensiveSDK.options.paths.processedPath}`);
  console.log(`   Failed path: ${comprehensiveSDK.options.paths.failedPath}`);
  console.log('');

  // Example 3: Production deployment configuration
  console.log('📁 Example 3: Production Deployment Configuration');
  console.log('=' .repeat(60));
  
  const productionSDK = new IndiaMartSDK(CRM_KEY, {
    timeoutMs: 45000,
    paths: {
      // Use absolute paths for production
      downloadPath: '/var/app/downloads',
      logPath: '/var/log/indiamart-sdk',
      apiLogFile: 'api-calls.json',
      rateLimitFile: 'rate-limits.json',
      dataPath: '/var/data/indiamart',
      leadsPath: '/var/data/indiamart/leads',
      processedPath: '/var/data/indiamart/processed',
      failedPath: '/var/data/indiamart/failed'
    }
  });
  
  console.log('Production Configuration:');
  console.log(`   Download path: ${productionSDK.getDownloadPath()}`);
  console.log(`   Log path: ${productionSDK.options.paths.logPath}`);
  console.log(`   Data path: ${productionSDK.options.paths.dataPath}`);
  console.log('');

  // Example 4: Development environment configuration
  console.log('📁 Example 4: Development Environment Configuration');
  console.log('=' .repeat(60));
  
  const devSDK = new IndiaMartSDK(CRM_KEY, {
    timeoutMs: 15000,
    paths: {
      // Use project-relative paths for development
      downloadPath: './dev-downloads',
      logPath: './dev-logs',
      apiLogFile: 'dev-api-logs.json',
      rateLimitFile: 'dev-rate-limits.json',
      dataPath: './dev-data',
      leadsPath: './dev-data/leads',
      processedPath: './dev-data/processed',
      failedPath: './dev-data/failed'
    }
  });
  
  console.log('Development Configuration:');
  console.log(`   Download path: ${devSDK.getDownloadPath()}`);
  console.log(`   Log path: ${devSDK.options.paths.logPath}`);
  console.log(`   Data path: ${devSDK.options.paths.dataPath}`);
  console.log('');

  // Example 5: Testing configuration with custom filenames
  console.log('📁 Example 5: Testing Configuration with Custom Filenames');
  console.log('=' .repeat(60));
  
  const testSDK = new IndiaMartSDK(CRM_KEY, {
    timeoutMs: 10000,
    paths: {
      downloadPath: './test-downloads',
      logPath: './test-logs',
      apiLogFile: 'test-api-calls.json',
      rateLimitFile: 'test-rate-limits.json',
      dataPath: './test-data',
      leadsPath: './test-data/leads',
      processedPath: './test-data/processed',
      failedPath: './test-data/failed'
    }
  });
  
  console.log('Testing Configuration:');
  console.log(`   Download path: ${testSDK.getDownloadPath()}`);
  console.log(`   Log path: ${testSDK.options.paths.logPath}`);
  console.log(`   API log file: ${testSDK.options.paths.apiLogFile}`);
  console.log(`   Rate limit file: ${testSDK.options.paths.rateLimitFile}`);
  console.log('');

  // Example 6: Docker container configuration
  console.log('📁 Example 6: Docker Container Configuration');
  console.log('=' .repeat(60));
  
  const dockerSDK = new IndiaMartSDK(CRM_KEY, {
    timeoutMs: 30000,
    paths: {
      // Use Docker volume mounts
      downloadPath: '/app/data/downloads',
      logPath: '/app/logs',
      apiLogFile: 'api-logs.json',
      rateLimitFile: 'rate-limits.json',
      dataPath: '/app/data',
      leadsPath: '/app/data/leads',
      processedPath: '/app/data/processed',
      failedPath: '/app/data/failed'
    }
  });
  
  console.log('Docker Configuration:');
  console.log(`   Download path: ${dockerSDK.getDownloadPath()}`);
  console.log(`   Log path: ${dockerSDK.options.paths.logPath}`);
  console.log(`   Data path: ${dockerSDK.options.paths.dataPath}`);
  console.log('');

  // Example 7: AWS Lambda configuration
  console.log('📁 Example 7: AWS Lambda Configuration');
  console.log('=' .repeat(60));
  
  const lambdaSDK = new IndiaMartSDK(CRM_KEY, {
    timeoutMs: 25000, // Lambda timeout considerations
    paths: {
      // Use /tmp for Lambda (temporary storage)
      downloadPath: '/tmp/downloads',
      logPath: '/tmp/logs',
      apiLogFile: 'lambda-api-logs.json',
      rateLimitFile: 'lambda-rate-limits.json',
      dataPath: '/tmp/data',
      leadsPath: '/tmp/data/leads',
      processedPath: '/tmp/data/processed',
      failedPath: '/tmp/data/failed'
    }
  });
  
  console.log('Lambda Configuration:');
  console.log(`   Download path: ${lambdaSDK.getDownloadPath()}`);
  console.log(`   Log path: ${lambdaSDK.options.paths.logPath}`);
  console.log(`   Data path: ${lambdaSDK.options.paths.dataPath}`);
  console.log('');

  // Example 8: Show how to change paths after initialization
  console.log('📁 Example 8: Changing Paths After Initialization');
  console.log('=' .repeat(60));
  
  const dynamicSDK = new IndiaMartSDK(CRM_KEY);
  console.log('Initial download path:', dynamicSDK.getDownloadPath());
  
  // Change download path
  dynamicSDK.setDownloadPath('./new-downloads');
  console.log('New download path:', dynamicSDK.getDownloadPath());
  console.log('');

  // Example 9: Demonstrate path validation
  console.log('📁 Example 9: Path Configuration Summary');
  console.log('=' .repeat(60));
  
  const configs = [
    { name: 'Basic', sdk: basicSDK },
    { name: 'Comprehensive', sdk: comprehensiveSDK },
    { name: 'Production', sdk: productionSDK },
    { name: 'Development', sdk: devSDK },
    { name: 'Testing', sdk: testSDK },
    { name: 'Docker', sdk: dockerSDK },
    { name: 'Lambda', sdk: lambdaSDK }
  ];
  
  console.log('All Configurations:');
  configs.forEach(config => {
    console.log(`\n${config.name}:`);
    console.log(`   Download: ${config.sdk.getDownloadPath()}`);
    console.log(`   Logs: ${config.sdk.options.paths.logPath}`);
    console.log(`   Data: ${config.sdk.options.paths.dataPath}`);
    console.log(`   API Log: ${config.sdk.options.paths.apiLogFile}`);
    console.log(`   Rate Limit: ${config.sdk.options.paths.rateLimitFile}`);
  });

  console.log('\n✅ All path configurations demonstrated!');
  console.log('\n💡 Tips:');
  console.log('   - Use absolute paths for production deployments');
  console.log('   - Use relative paths for development');
  console.log('   - Use /tmp for AWS Lambda (temporary storage)');
  console.log('   - Use Docker volume mounts for containerized deployments');
  console.log('   - Customize filenames to avoid conflicts in shared environments');
}

// Run the example
main().catch(console.error);
