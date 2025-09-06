#!/usr/bin/env node

/**
 * IndiaMART LMS Client - Test Suite
 * 
 * Basic tests to verify the client functionality.
 * Run with: node test.js
 */

import { IndiaMartClient } from '../src/indiamart-client.js';

// Test helper function
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Test failed: ${message}`);
  }
}

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
  }
}

console.log("🧪 IndiaMART LMS Client - Test Suite");
console.log("====================================\n");

// Test 1: Client initialization
test("Client initialization with valid key", () => {
  const client = new IndiaMartClient({ crmKey: "test-key-123" });
  assert(client.crmKey === "test-key-123", "CRM key should be set correctly");
  assert(client.baseUrl === "https://mapi.indiamart.com/wservce/crm/crmListing/v2/", "Base URL should be set correctly");
  assert(client.timeoutMs === 30000, "Default timeout should be 30000ms");
});

test("Client initialization without key should throw", () => {
  try {
    new IndiaMartClient({});
    assert(false, "Should throw error when crmKey is missing");
  } catch (error) {
    assert(error.message === "crmKey is required", "Should throw correct error message");
  }
});

test("Client initialization with custom options", () => {
  const client = new IndiaMartClient({ 
    crmKey: "test-key", 
    baseUrl: "https://custom.api.com/",
    timeoutMs: 60000
  });
  assert(client.baseUrl === "https://custom.api.com/", "Custom base URL should be set");
  assert(client.timeoutMs === 60000, "Custom timeout should be set");
});

// Test 2: Timestamp formatting
test("formatTimestamp with Date object (UTC)", () => {
  const date = new Date('2024-01-15T10:30:45Z');
  const formatted = IndiaMartClient.formatTimestamp(date);
  assert(formatted === "15-01-2024 10:30:45", "Date should be formatted correctly in UTC");
});

test("formatTimestamp with Date object (local time)", () => {
  const date = new Date('2024-01-15T10:30:45Z');
  const formatted = IndiaMartClient.formatTimestamp(date, true);
  // This test might vary based on timezone, so we'll just check the format
  assert(formatted.includes("15-01-2024"), "Should contain correct date");
  assert(formatted.includes(":"), "Should contain time separator");
});

test("formatTimestamp with string input", () => {
  const input = "15-01-2024 10:30:45";
  const formatted = IndiaMartClient.formatTimestamp(input);
  assert(formatted === input, "String input should be returned as-is");
});

test("formatTimestamp with invalid date should throw", () => {
  try {
    IndiaMartClient.formatTimestamp("invalid-date");
    assert(false, "Should throw error for invalid date");
  } catch (error) {
    assert(error.message === "Invalid date for start_time/end_time", "Should throw correct error message");
  }
});

// Test 3: URL building
test("buildUrl with basic query", () => {
  const client = new IndiaMartClient({ crmKey: "test-key-123" });
  const url = client.buildUrl({ start_time: "01-01-2024 00:00:00", page: 1 });
  
  assert(url.includes("glusr_crm_key=test-key-123"), "Should include CRM key");
  assert(url.includes("start_time=01-01-2024+00%3A00%3A00"), "Should include start_time");
  assert(url.includes("page=1"), "Should include page number");
});

test("buildUrl filters out undefined values", () => {
  const client = new IndiaMartClient({ crmKey: "test-key-123" });
  const url = client.buildUrl({ 
    start_time: "01-01-2024 00:00:00", 
    end_time: undefined,
    page: null,
    empty: ""
  });
  
  assert(url.includes("start_time=01-01-2024+00%3A00%3A00"), "Should include start_time");
  assert(!url.includes("end_time"), "Should not include undefined end_time");
  assert(!url.includes("page"), "Should not include null page");
  assert(!url.includes("empty"), "Should not include empty string");
});

// Test 4: Edge cases
test("formatTimestamp with different months", () => {
  const months = [
    { date: new Date('2024-01-01T00:00:00Z'), expected: "01-01-2024 00:00:00" },
    { date: new Date('2024-06-15T12:30:45Z'), expected: "15-06-2024 12:30:45" },
    { date: new Date('2024-12-31T23:59:59Z'), expected: "31-12-2024 23:59:59" }
  ];
  
  months.forEach(({ date, expected }) => {
    const formatted = IndiaMartClient.formatTimestamp(date);
    assert(formatted === expected, `Should format ${date.toISOString()} as ${expected}`);
  });
});

test("buildUrl with special characters", () => {
  const client = new IndiaMartClient({ crmKey: "test-key-with-special-chars!@#" });
  const url = client.buildUrl({ start_time: "01-01-2024 00:00:00" });
  
  assert(url.includes("glusr_crm_key=test-key-with-special-chars%21%40%23"), "Should URL encode special characters");
});

console.log("\n✅ All tests completed!");
console.log("\nNote: These are unit tests. For integration tests with real API calls,");
console.log("set INDIAMART_CRM_KEY environment variable and run the example.js file.");
