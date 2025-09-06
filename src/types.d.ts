/**
 * TypeScript definitions for IndiaMART LMS CRM Integration Client
 */

export interface IndiaMartClientOptions {
  /** Your IndiaMART CRM key */
  crmKey: string;
  /** Override base URL (mainly for testing) */
  baseUrl?: string;
  /** Request timeout in milliseconds */
  timeoutMs?: number;
}

export interface GetLeadsOptions {
  /** Start time for lead search (will be formatted if not already a string) */
  startTime?: string | Date | number;
  /** End time for lead search (will be formatted if not already a string) */
  endTime?: string | Date | number;
  /** Page number if your account supports pagination */
  page?: number;
  /** Optional AbortController signal for cancellation */
  signal?: AbortSignal;
}

export interface GetLeadsResponse {
  /** Response code from IndiaMART API */
  code: number;
  /** Response message from IndiaMART API */
  message?: string;
  /** Total number of records available */
  totalRecords?: number;
  /** Array of lead objects */
  leads: Lead[];
  /** Raw response from IndiaMART API */
  raw: any;
}

export interface Lead {
  /** Lead's name */
  SENDER_NAME?: string;
  /** Lead's mobile number */
  SENDER_MOBILE?: string;
  /** Lead's email address */
  SENDER_EMAIL?: string;
  /** Lead's company name */
  SENDER_COMPANY?: string;
  /** Lead's address */
  SENDER_ADDRESS?: string;
  /** Lead's city */
  SENDER_CITY?: string;
  /** Lead's state */
  SENDER_STATE?: string;
  /** Product/service inquired about */
  QUERY_PRODUCT_NAME?: string;
  /** Lead's inquiry message */
  ENQ_MESSAGE?: string;
  /** Alternative field name for inquiry message */
  QUERY_MESSAGE?: string;
  /** Unique identifier for the lead */
  UNIQUE_QUERY_ID?: string;
  /** Alternative field name for query ID */
  QUERY_ID?: string;
  /** Additional fields that might be present in the response */
  [key: string]: any;
}

export declare class IndiaMartClient {
  /** Your IndiaMART CRM key */
  readonly crmKey: string;
  /** Base URL for API requests */
  readonly baseUrl: string;
  /** Request timeout in milliseconds */
  readonly timeoutMs: number;

  /**
   * Create a new IndiaMartClient instance
   * @param options Configuration options
   */
  constructor(options: IndiaMartClientOptions);

  /**
   * Format JS Date to `DD-MM-YYYY HH:MM:SS` format required by IndiaMART API
   * @param input Date-like input or already-formatted string
   * @param useLocal If true, formats in local time instead of UTC
   * @returns Formatted timestamp string
   */
  static formatTimestamp(input: Date | string | number, useLocal?: boolean): string;

  /**
   * Build URL with query parameters
   * @param query Query parameters object
   * @returns Complete URL string
   */
  buildUrl(query: Record<string, string | number | undefined>): string;

  /**
   * Fetch leads from IndiaMART LMS v2
   * @param options Lead search options
   * @returns Promise resolving to leads response
   */
  getLeads(options?: GetLeadsOptions): Promise<GetLeadsResponse>;
}
