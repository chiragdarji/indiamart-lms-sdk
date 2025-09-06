/**
 * File Storage Manager
 * 
 * Handles storing leads to files before database processing.
 * Provides backup and recovery capabilities.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class FileStorageManager {
  constructor(options = {}) {
    this.baseDir = options.baseDir || path.join(__dirname, '..', 'data');
    this.leadsDir = options.leadsDir || path.join(this.baseDir, 'leads');
    this.processedDir = options.processedDir || path.join(this.baseDir, 'processed');
    this.failedDir = options.failedDir || path.join(this.baseDir, 'failed');
    this.isInitialized = false;
  }

  /**
   * Initialize file storage directories
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Create directories if they don't exist
      await fs.mkdir(this.baseDir, { recursive: true });
      await fs.mkdir(this.leadsDir, { recursive: true });
      await fs.mkdir(this.processedDir, { recursive: true });
      await fs.mkdir(this.failedDir, { recursive: true });

      console.log(`✅ File storage initialized: ${this.baseDir}`);
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize file storage:', error);
      throw error;
    }
  }

  /**
   * Store leads to file immediately
   * @param {Array} leads - Array of lead objects
   * @param {Object} metadata - API call metadata
   * @returns {string} File path where leads were stored
   */
  async storeLeads(leads, metadata = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!leads || leads.length === 0) {
      console.log('ℹ️  No leads to store');
      return null;
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `leads_${timestamp}.json`;
      const filepath = path.join(this.leadsDir, filename);

      const data = {
        timestamp: new Date().toISOString(),
        metadata: {
          totalLeads: leads.length,
          apiCallTime: metadata.apiCallTime || new Date().toISOString(),
          responseCode: metadata.responseCode || 200,
          responseMessage: metadata.responseMessage || 'Success',
          ...metadata
        },
        leads: leads
      };

      await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf8');
      
      console.log(`✅ Stored ${leads.length} leads to file: ${filename}`);
      return filepath;
    } catch (error) {
      console.error('❌ Failed to store leads to file:', error);
      throw error;
    }
  }

  /**
   * Store leads in CSV format for easy viewing
   * @param {Array} leads - Array of lead objects
   * @param {Object} metadata - API call metadata
   * @returns {string} File path where CSV was stored
   */
  async storeLeadsCSV(leads, metadata = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!leads || leads.length === 0) {
      return null;
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `leads_${timestamp}.csv`;
      const filepath = path.join(this.leadsDir, filename);

      // Create CSV header
      const headers = [
        'unique_query_id',
        'customer_name',
        'customer_company',
        'customer_location',
        'customer_mobile',
        'customer_email',
        'lead_type',
        'query_message',
        'product_name',
        'category',
        'query_time',
        'country'
      ];

      // Create CSV rows
      const rows = leads.map(lead => {
        return [
          lead.uniqueQueryId || lead.UNIQUE_QUERY_ID || '',
          lead.sender?.name || lead.SENDER_NAME || lead.customerName || '',
          lead.sender?.company || lead.SENDER_COMPANY || lead.customerCompany || '',
          lead.sender?.location || lead.SENDER_LOCATION || lead.customerLocation || '',
          lead.sender?.mobile || lead.SENDER_MOBILE || '',
          lead.sender?.email || lead.SENDER_EMAIL || '',
          lead.leadType || lead.queryTypeInfo?.name || lead.QUERY_TYPE || '',
          lead.query?.message || lead.QUERY_MESSAGE || lead.queryMessage || '',
          lead.query?.productName || lead.QUERY_PRODUCT_NAME || '',
          lead.query?.category || lead.QUERY_MCAT_NAME || '',
          lead.queryTime || lead.QUERY_TIME || '',
          lead.sender?.country || lead.SENDER_COUNTRY_ISO || ''
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      await fs.writeFile(filepath, csvContent, 'utf8');

      console.log(`✅ Stored ${leads.length} leads to CSV: ${filename}`);
      return filepath;
    } catch (error) {
      console.error('❌ Failed to store leads to CSV:', error);
      throw error;
    }
  }

  /**
   * Move file to processed directory
   * @param {string} filepath - Path to the file to move
   */
  async markAsProcessed(filepath) {
    try {
      const filename = path.basename(filepath);
      const newPath = path.join(this.processedDir, filename);
      await fs.rename(filepath, newPath);
      console.log(`✅ Moved to processed: ${filename}`);
    } catch (error) {
      console.error('❌ Failed to move file to processed:', error);
      throw error;
    }
  }

  /**
   * Move file to failed directory
   * @param {string} filepath - Path to the file to move
   * @param {string} error - Error message
   */
  async markAsFailed(filepath, error) {
    try {
      const filename = path.basename(filepath);
      const newPath = path.join(this.failedDir, filename);
      
      // Add error info to the file
      const data = JSON.parse(await fs.readFile(filepath, 'utf8'));
      data.error = {
        message: error,
        timestamp: new Date().toISOString()
      };
      
      await fs.writeFile(newPath, JSON.stringify(data, null, 2), 'utf8');
      await fs.unlink(filepath); // Remove original file
      
      console.log(`❌ Moved to failed: ${filename}`);
    } catch (err) {
      console.error('❌ Failed to move file to failed:', err);
      throw err;
    }
  }

  /**
   * Get all pending lead files
   * @returns {Array} Array of file paths
   */
  async getPendingFiles() {
    try {
      const files = await fs.readdir(this.leadsDir);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => path.join(this.leadsDir, file))
        .sort();
    } catch (error) {
      console.error('❌ Failed to get pending files:', error);
      return [];
    }
  }

  /**
   * Read lead data from file
   * @param {string} filepath - Path to the file
   * @returns {Object} Lead data
   */
  async readLeadFile(filepath) {
    try {
      const content = await fs.readFile(filepath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error('❌ Failed to read lead file:', error);
      throw error;
    }
  }

  /**
   * Get storage statistics
   * @returns {Object} Storage statistics
   */
  async getStats() {
    try {
      const pendingFiles = await this.getPendingFiles();
      const processedFiles = await fs.readdir(this.processedDir).catch(() => []);
      const failedFiles = await fs.readdir(this.failedDir).catch(() => []);

      let totalLeads = 0;
      for (const file of pendingFiles) {
        try {
          const data = await this.readLeadFile(file);
          totalLeads += data.leads?.length || 0;
        } catch (error) {
          // Skip files that can't be read
        }
      }

      return {
        pendingFiles: pendingFiles.length,
        processedFiles: processedFiles.length,
        failedFiles: failedFiles.length,
        totalLeads: totalLeads,
        storageDir: this.baseDir
      };
    } catch (error) {
      console.error('❌ Failed to get storage stats:', error);
      return {
        pendingFiles: 0,
        processedFiles: 0,
        failedFiles: 0,
        totalLeads: 0,
        storageDir: this.baseDir
      };
    }
  }

  /**
   * Clean up old files
   * @param {number} daysOld - Number of days old files to clean
   */
  async cleanupOldFiles(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const dirs = [this.processedDir, this.failedDir];
      let cleanedCount = 0;

      for (const dir of dirs) {
        const files = await fs.readdir(dir).catch(() => []);
        
        for (const file of files) {
          const filepath = path.join(dir, file);
          const stats = await fs.stat(filepath).catch(() => null);
          
          if (stats && stats.mtime < cutoffDate) {
            await fs.unlink(filepath);
            cleanedCount++;
          }
        }
      }

      console.log(`🧹 Cleaned up ${cleanedCount} old files`);
      return cleanedCount;
    } catch (error) {
      console.error('❌ Failed to cleanup old files:', error);
      return 0;
    }
  }
}

export const fileStorageManager = new FileStorageManager();
