/**
 * IndiaMART API Response Handler
 * 
 * Handles the official IndiaMART API response format and provides
 * comprehensive field documentation and validation.
 */

export class IndiaMartResponseHandler {
  constructor() {
    // Lead types mapping based on official documentation
    this.leadTypes = {
      'W': {
        name: 'Direct Enquiries',
        description: 'Direct enquiries from buyers'
      },
      'B': {
        name: 'Buy-Leads',
        description: 'Buy leads from IndiaMART'
      },
      'P': {
        name: 'PNS Calls',
        description: 'Phone number sharing calls'
      },
      'BIZ': {
        name: 'Catalog-views',
        description: 'Catalog views (after 7 days of inactivity)'
      },
      'WA': {
        name: 'WhatsApp Enquiries',
        description: 'WhatsApp enquiries from buyers'
      }
    };

    // Required fields that are always present
    this.requiredFields = [
      'UNIQUE_QUERY_ID',
      'QUERY_TYPE',
      'QUERY_TIME',
      'SENDER_COUNTRY_ISO'
    ];

    // Contact fields (at least one must be present)
    this.contactFields = [
      'SENDER_MOBILE',
      'SENDER_EMAIL'
    ];
  }

  /**
   * Process the official IndiaMART API response
   * @param {Object} response - Raw API response
   * @returns {Object} Processed response with metadata
   */
  processResponse(response) {
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid response format');
    }

    const processed = {
      success: response.CODE === 200 && response.STATUS === 'SUCCESS',
      code: response.CODE,
      status: response.STATUS,
      message: response.MESSAGE || '',
      totalRecords: response.TOTAL_RECORDS || 0,
      leads: [],
      error: response.CODE !== 200 ? response.MESSAGE || 'API call failed' : null,
      statusCode: response.CODE,
      metadata: {
        leadTypes: {},
        countries: new Set(),
        products: new Set(),
        categories: new Set(),
        timeRange: { earliest: null, latest: null }
      }
    };

    // Process leads if present - check both RESPONSE and leads arrays
    const leadsArray = response.RESPONSE || response.leads;
    
    console.log(`🔍 Response Handler - Processing leads:`, {
      hasResponse: !!response.RESPONSE,
      hasLeads: !!response.leads,
      isArray: Array.isArray(leadsArray),
      responseLength: leadsArray?.length || 0,
      responseKeys: response ? Object.keys(response) : []
    });
    
    if (leadsArray && Array.isArray(leadsArray)) {
      console.log(`📋 Processing ${leadsArray.length} leads...`);
      processed.leads = leadsArray.map((lead, index) => {
        console.log(`   Lead ${index + 1}:`, {
          uniqueQueryId: lead.UNIQUE_QUERY_ID,
          queryType: lead.QUERY_TYPE,
          senderName: lead.SENDER_NAME,
          hasMessage: !!lead.QUERY_MESSAGE
        });
        return this.processLead(lead, processed.metadata);
      });
      console.log(`✅ Processed ${processed.leads.length} leads`);
    } else {
      console.log(`⚠️  No leads array found in API response (checked RESPONSE and leads)`);
    }

    return processed;
  }

  /**
   * Process individual lead data
   * @param {Object} lead - Raw lead data
   * @param {Object} metadata - Metadata object to update
   * @returns {Object} Processed lead data
   */
  processLead(lead, metadata) {
    if (!lead || typeof lead !== 'object') {
      return null;
    }

    // Validate required fields
    const validation = this.validateLead(lead);
    if (!validation.isValid) {
      console.warn(`Invalid lead data: ${validation.errors.join(', ')}`);
      return null;
    }

    // Process the lead
    const processed = {
      // Core identification
      uniqueQueryId: lead.UNIQUE_QUERY_ID,
      queryType: lead.QUERY_TYPE,
      queryTypeInfo: this.leadTypes[lead.QUERY_TYPE] || { name: 'Unknown', description: 'Unknown lead type' },
      queryTime: lead.QUERY_TIME,
      
      // Sender information
      sender: {
        name: lead.SENDER_NAME || 'IndiaMART Buyer', // Default value as per docs
        mobile: lead.SENDER_MOBILE,
        mobileAlt: lead.SENDER_MOBILE_ALT,
        email: lead.SENDER_EMAIL,
        emailAlt: lead.SENDER_EMAIL_ALT,
        company: lead.SENDER_COMPANY,
        address: lead.SENDER_ADDRESS,
        city: lead.SENDER_CITY,
        state: lead.SENDER_STATE,
        pincode: lead.SENDER_PINCODE,
        country: lead.SENDER_COUNTRY_ISO
      },
      
      // Query details
      query: {
        productName: lead.QUERY_PRODUCT_NAME,
        message: lead.QUERY_MESSAGE,
        category: lead.QUERY_MCAT_NAME
      },
      
      // Call information (if applicable)
      call: {
        duration: lead.CALL_DURATION,
        receiverMobile: lead.RECEIVER_MOBILE
      },
      
      // Raw data for reference
      raw: lead
    };

    // Update metadata
    this.updateMetadata(processed, metadata);

    return processed;
  }

  /**
   * Validate lead data structure
   * @param {Object} lead - Lead data to validate
   * @returns {Object} Validation result
   */
  validateLead(lead) {
    const errors = [];

    // Check required fields
    for (const field of this.requiredFields) {
      if (!lead[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Check contact fields (at least one must be present)
    const hasContact = this.contactFields.some(field => lead[field]);
    if (!hasContact) {
      errors.push('At least one contact field (SENDER_MOBILE or SENDER_EMAIL) must be present');
    }

    // Validate QUERY_TYPE
    if (lead.QUERY_TYPE && !this.leadTypes[lead.QUERY_TYPE]) {
      errors.push(`Unknown QUERY_TYPE: ${lead.QUERY_TYPE}`);
    }

    // Validate QUERY_TIME format
    if (lead.QUERY_TIME && !this.isValidQueryTime(lead.QUERY_TIME)) {
      errors.push(`Invalid QUERY_TIME format: ${lead.QUERY_TIME}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate QUERY_TIME format
   * @param {string} queryTime - Query time string
   * @returns {boolean} Is valid format
   */
  isValidQueryTime(queryTime) {
    // Expected format: "2021-12-08 12:47:25"
    const timeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
    return timeRegex.test(queryTime);
  }

  /**
   * Update metadata with lead information
   * @param {Object} lead - Processed lead
   * @param {Object} metadata - Metadata object to update
   */
  updateMetadata(lead, metadata) {
    // Count lead types
    const type = lead.queryType;
    metadata.leadTypes[type] = (metadata.leadTypes[type] || 0) + 1;

    // Track countries
    if (lead.sender.country) {
      metadata.countries.add(lead.sender.country);
    }

    // Track products
    if (lead.query.productName) {
      metadata.products.add(lead.query.productName);
    }

    // Track categories
    if (lead.query.category) {
      metadata.categories.add(lead.query.category);
    }

    // Track time range
    if (lead.queryTime) {
      const queryDate = new Date(lead.queryTime);
      if (!metadata.timeRange.earliest || queryDate < metadata.timeRange.earliest) {
        metadata.timeRange.earliest = queryDate;
      }
      if (!metadata.timeRange.latest || queryDate > metadata.timeRange.latest) {
        metadata.timeRange.latest = queryDate;
      }
    }
  }

  /**
   * Get lead type information
   * @param {string} queryType - Query type code
   * @returns {Object} Lead type information
   */
  getLeadTypeInfo(queryType) {
    return this.leadTypes[queryType] || { name: 'Unknown', description: 'Unknown lead type' };
  }

  /**
   * Get all supported lead types
   * @returns {Object} All lead types
   */
  getAllLeadTypes() {
    return { ...this.leadTypes };
  }

  /**
   * Filter leads by type
   * @param {Array} leads - Array of processed leads
   * @param {string} queryType - Query type to filter by
   * @returns {Array} Filtered leads
   */
  filterLeadsByType(leads, queryType) {
    return leads.filter(lead => lead.queryType === queryType);
  }

  /**
   * Get lead statistics
   * @param {Array} leads - Array of processed leads
   * @returns {Object} Lead statistics
   */
  getLeadStatistics(leads) {
    const stats = {
      total: leads.length,
      byType: {},
      byCountry: {},
      byProduct: {},
      byCategory: {},
      timeRange: { earliest: null, latest: null }
    };

    leads.forEach(lead => {
      // Count by type
      stats.byType[lead.queryType] = (stats.byType[lead.queryType] || 0) + 1;

      // Count by country
      if (lead.sender.country) {
        stats.byCountry[lead.sender.country] = (stats.byCountry[lead.sender.country] || 0) + 1;
      }

      // Count by product
      if (lead.query.productName) {
        stats.byProduct[lead.query.productName] = (stats.byProduct[lead.query.productName] || 0) + 1;
      }

      // Count by category
      if (lead.query.category) {
        stats.byCategory[lead.query.category] = (stats.byCategory[lead.query.category] || 0) + 1;
      }

      // Track time range
      if (lead.queryTime) {
        const queryDate = new Date(lead.queryTime);
        if (!stats.timeRange.earliest || queryDate < stats.timeRange.earliest) {
          stats.timeRange.earliest = queryDate;
        }
        if (!stats.timeRange.latest || queryDate > stats.timeRange.latest) {
          stats.timeRange.latest = queryDate;
        }
      }
    });

    return stats;
  }

  /**
   * Export leads in different formats
   * @param {Array} leads - Array of processed leads
   * @param {string} format - Export format ('json', 'csv', 'summary')
   * @returns {string} Exported data
   */
  exportLeads(leads, format = 'json') {
    switch (format.toLowerCase()) {
      case 'csv':
        return this.exportToCSV(leads);
      case 'summary':
        return this.exportSummary(leads);
      default:
        return JSON.stringify(leads, null, 2);
    }
  }

  /**
   * Export leads to CSV format
   * @param {Array} leads - Array of processed leads
   * @returns {string} CSV data
   */
  exportToCSV(leads) {
    if (leads.length === 0) return '';

    const headers = [
      'UNIQUE_QUERY_ID',
      'QUERY_TYPE',
      'QUERY_TIME',
      'SENDER_NAME',
      'SENDER_MOBILE',
      'SENDER_EMAIL',
      'SENDER_COMPANY',
      'SENDER_CITY',
      'SENDER_STATE',
      'SENDER_COUNTRY_ISO',
      'QUERY_PRODUCT_NAME',
      'QUERY_MESSAGE',
      'QUERY_MCAT_NAME'
    ];

    const csvRows = [headers.join(',')];

    leads.forEach(lead => {
      const row = headers.map(header => {
        const value = this.getNestedValue(lead, header);
        return `"${(value || '').toString().replace(/"/g, '""')}"`;
      });
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  /**
   * Get nested value from lead object
   * @param {Object} lead - Lead object
   * @param {string} path - Path to value
   * @returns {*} Value
   */
  getNestedValue(lead, path) {
    const pathMap = {
      'UNIQUE_QUERY_ID': 'uniqueQueryId',
      'QUERY_TYPE': 'queryType',
      'QUERY_TIME': 'queryTime',
      'SENDER_NAME': 'sender.name',
      'SENDER_MOBILE': 'sender.mobile',
      'SENDER_EMAIL': 'sender.email',
      'SENDER_COMPANY': 'sender.company',
      'SENDER_CITY': 'sender.city',
      'SENDER_STATE': 'sender.state',
      'SENDER_COUNTRY_ISO': 'sender.country',
      'QUERY_PRODUCT_NAME': 'query.productName',
      'QUERY_MESSAGE': 'query.message',
      'QUERY_MCAT_NAME': 'query.category'
    };

    const mappedPath = pathMap[path];
    if (!mappedPath) return null;

    return mappedPath.split('.').reduce((obj, key) => obj?.[key], lead);
  }

  /**
   * Export leads summary
   * @param {Array} leads - Array of processed leads
   * @returns {string} Summary text
   */
  exportSummary(leads) {
    const stats = this.getLeadStatistics(leads);
    const leadTypes = this.getAllLeadTypes();

    let summary = `IndiaMART Leads Summary\n`;
    summary += `========================\n\n`;
    summary += `Total Leads: ${stats.total}\n\n`;

    summary += `By Lead Type:\n`;
    Object.entries(stats.byType).forEach(([type, count]) => {
      const typeInfo = leadTypes[type];
      summary += `  ${type} (${typeInfo.name}): ${count}\n`;
    });

    if (Object.keys(stats.byCountry).length > 0) {
      summary += `\nBy Country:\n`;
      Object.entries(stats.byCountry).forEach(([country, count]) => {
        summary += `  ${country}: ${count}\n`;
      });
    }

    if (Object.keys(stats.byProduct).length > 0) {
      summary += `\nTop Products:\n`;
      Object.entries(stats.byProduct)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .forEach(([product, count]) => {
          summary += `  ${product}: ${count}\n`;
        });
    }

    if (stats.timeRange.earliest && stats.timeRange.latest) {
      summary += `\nTime Range:\n`;
      summary += `  From: ${stats.timeRange.earliest.toISOString()}\n`;
      summary += `  To: ${stats.timeRange.latest.toISOString()}\n`;
    }

    return summary;
  }
}

// Export field documentation
export const FIELD_DOCUMENTATION = {
  // Always present fields
  UNIQUE_QUERY_ID: {
    description: 'Unique identifier for the query',
    type: 'string',
    required: true,
    example: '2012487827'
  },
  QUERY_TYPE: {
    description: 'Type of lead received',
    type: 'string',
    required: true,
    values: {
      'W': 'Direct Enquiries',
      'B': 'Buy-Leads',
      'P': 'PNS Calls',
      'BIZ': 'Catalog-views',
      'WA': 'WhatsApp Enquiries'
    }
  },
  QUERY_TIME: {
    description: 'Date and time of the query',
    type: 'string',
    required: true,
    format: 'YYYY-MM-DD HH:MM:SS',
    example: '2021-12-08 12:47:25'
  },
  SENDER_NAME: {
    description: 'Name of the sender (defaults to "IndiaMART Buyer" if not present)',
    type: 'string',
    required: false,
    default: 'IndiaMART Buyer'
  },
  SENDER_MOBILE: {
    description: 'Primary mobile number of the sender',
    type: 'string',
    required: false,
    example: '+91-999XXXXXXX'
  },
  SENDER_EMAIL: {
    description: 'Primary email address of the sender',
    type: 'string',
    required: false,
    example: 'arunxyz@gmail.com'
  },
  SENDER_COUNTRY_ISO: {
    description: 'ISO country code of the sender',
    type: 'string',
    required: true,
    example: 'IN'
  },
  SENDER_MOBILE_ALT: {
    description: 'Alternative mobile number',
    type: 'string',
    required: false,
    example: null
  },
  SENDER_EMAIL_ALT: {
    description: 'Alternative email address',
    type: 'string',
    required: false,
    example: 'arunxyz1@gmail.com'
  },
  SENDER_COMPANY: {
    description: 'Company name of the sender',
    type: 'string',
    required: false,
    example: 'Arun Industries'
  },
  SENDER_ADDRESS: {
    description: 'Full address of the sender',
    type: 'string',
    required: false,
    example: 'Arun Industries, Meerut, Uttar Pradesh, 250001'
  },
  SENDER_CITY: {
    description: 'City of the sender',
    type: 'string',
    required: false,
    example: 'Meerut'
  },
  SENDER_STATE: {
    description: 'State of the sender',
    type: 'string',
    required: false,
    example: 'Uttar Pradesh'
  },
  SENDER_PINCODE: {
    description: 'Postal code of the sender',
    type: 'string',
    required: false,
    example: '250001'
  },
  QUERY_PRODUCT_NAME: {
    description: 'Name of the product being queried about',
    type: 'string',
    required: false,
    example: 'Dye Sublimation Ink'
  },
  QUERY_MESSAGE: {
    description: 'Full message from the sender',
    type: 'string',
    required: false,
    example: 'I want to buy Dye Sublimation Ink.',
    note: 'May contain special characters: \\n, \\t, \\r, \\b, \\\\'
  },
  QUERY_MCAT_NAME: {
    description: 'Main category name for the query',
    type: 'string',
    required: false,
    example: 'Sublimation Ink'
  },
  CALL_DURATION: {
    description: 'Duration of the call (if applicable)',
    type: 'string',
    required: false,
    example: null
  },
  RECEIVER_MOBILE: {
    description: 'Receiver mobile number (if applicable)',
    type: 'string',
    required: false,
    example: null
  }
};
