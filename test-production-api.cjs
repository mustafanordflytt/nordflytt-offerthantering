#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Configuration
const API_BASE_URL = 'https://api.nordflytt.se';
const API_KEY = 'nordflytt_gpt_api_key_2025';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

console.log(`${colors.bright}${colors.blue}=== Production API Test Script ===${colors.reset}\n`);
console.log(`API Base URL: ${colors.yellow}${API_BASE_URL}${colors.reset}`);
console.log(`API Key: ${colors.yellow}***${API_KEY.slice(-4)}${colors.reset}\n`);

// Test endpoints
const endpoints = [
  // GPT-RAG endpoints
  { path: '/gpt-rag/chat', method: 'POST' },
  { path: '/api/gpt-rag/chat', method: 'POST' },
  { path: '/gpt-rag', method: 'GET' },
  { path: '/api/gpt-rag', method: 'GET' },
  
  // Chat endpoints
  { path: '/chat', method: 'POST' },
  { path: '/api/chat', method: 'POST' },
  { path: '/ai/chat', method: 'POST' },
  { path: '/api/ai/chat', method: 'POST' },
  
  // Health check endpoints
  { path: '/', method: 'GET' },
  { path: '/health', method: 'GET' },
  { path: '/api/health', method: 'GET' },
  { path: '/api', method: 'GET' },
  
  // Version endpoints
  { path: '/version', method: 'GET' },
  { path: '/api/version', method: 'GET' },
  
  // Docs endpoints
  { path: '/docs', method: 'GET' },
  { path: '/api/docs', method: 'GET' },
  { path: '/swagger', method: 'GET' },
  { path: '/openapi.json', method: 'GET' }
];

// Test data for POST requests
const testData = {
  customerId: 'test-customer',
  message: 'Hej, jag vill boka en flytt',
  conversationHistory: []
};

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    console.log(`\n${colors.bright}Testing: ${colors.yellow}${endpoint.method} ${API_BASE_URL}${endpoint.path}${colors.reset}`);
    
    const url = new URL(API_BASE_URL + endpoint.path);
    const isHTTPS = url.protocol === 'https:';
    const httpModule = isHTTPS ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHTTPS ? 443 : 80),
      path: url.pathname + url.search,
      method: endpoint.method,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Nordflytt-Test-Script/1.0'
      },
      timeout: 10000,
      rejectUnauthorized: false // Allow self-signed certificates for testing
    };
    
    const req = httpModule.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Status: ${colors.bright}${res.statusCode >= 200 && res.statusCode < 300 ? colors.green : colors.red}${res.statusCode} ${res.statusMessage}${colors.reset}`);
        console.log(`Headers: ${colors.blue}${JSON.stringify(res.headers, null, 2)}${colors.reset}`);
        
        if (data) {
          try {
            const parsed = JSON.parse(data);
            console.log(`Response: ${colors.magenta}${JSON.stringify(parsed, null, 2)}${colors.reset}`);
          } catch (e) {
            // Not JSON, show first 500 chars
            console.log(`Response (text): ${colors.magenta}${data.substring(0, 500)}${data.length > 500 ? '...' : ''}${colors.reset}`);
          }
        }
        
        resolve({
          endpoint: endpoint.path,
          method: endpoint.method,
          status: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      console.log(`${colors.red}Error: ${error.message}${colors.reset}`);
      resolve({
        endpoint: endpoint.path,
        method: endpoint.method,
        error: error.message
      });
    });
    
    req.on('timeout', () => {
      console.log(`${colors.red}Request timed out${colors.reset}`);
      req.destroy();
      resolve({
        endpoint: endpoint.path,
        method: endpoint.method,
        error: 'Timeout'
      });
    });
    
    // Send data for POST requests
    if (endpoint.method === 'POST') {
      req.write(JSON.stringify(testData));
    }
    
    req.end();
  });
}

async function runTests() {
  console.log(`${colors.bright}Starting API endpoint discovery...${colors.reset}`);
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    // Small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log(`\n${colors.bright}${colors.blue}=== Test Summary ===${colors.reset}\n`);
  
  const successful = results.filter(r => r.status && r.status >= 200 && r.status < 300);
  const clientErrors = results.filter(r => r.status && r.status >= 400 && r.status < 500);
  const serverErrors = results.filter(r => r.status && r.status >= 500);
  const errors = results.filter(r => r.error);
  
  if (successful.length > 0) {
    console.log(`${colors.green}✓ Successful endpoints (${successful.length}):${colors.reset}`);
    successful.forEach(r => {
      console.log(`  - ${r.method} ${r.endpoint}: ${r.status} ${r.statusMessage}`);
    });
  }
  
  if (clientErrors.length > 0) {
    console.log(`\n${colors.yellow}⚠ Client errors (${clientErrors.length}):${colors.reset}`);
    clientErrors.forEach(r => {
      console.log(`  - ${r.method} ${r.endpoint}: ${r.status} ${r.statusMessage}`);
    });
  }
  
  if (serverErrors.length > 0) {
    console.log(`\n${colors.red}✗ Server errors (${serverErrors.length}):${colors.reset}`);
    serverErrors.forEach(r => {
      console.log(`  - ${r.method} ${r.endpoint}: ${r.status} ${r.statusMessage}`);
    });
  }
  
  if (errors.length > 0) {
    console.log(`\n${colors.red}✗ Connection errors (${errors.length}):${colors.reset}`);
    errors.forEach(r => {
      console.log(`  - ${r.method} ${r.endpoint}: ${r.error}`);
    });
  }
  
  // Look for API documentation or hints
  console.log(`\n${colors.bright}${colors.blue}=== API Discovery Hints ===${colors.reset}\n`);
  
  results.forEach(r => {
    if (r.data) {
      // Look for API documentation patterns
      if (r.data.includes('swagger') || r.data.includes('openapi') || r.data.includes('documentation')) {
        console.log(`${colors.green}Found potential API docs at: ${r.endpoint}${colors.reset}`);
      }
      
      // Look for error messages that hint at correct endpoints
      if (r.data.includes('endpoint') || r.data.includes('route') || r.data.includes('path')) {
        try {
          const parsed = JSON.parse(r.data);
          if (parsed.message || parsed.error || parsed.detail) {
            console.log(`${colors.yellow}Hint from ${r.endpoint}: ${parsed.message || parsed.error || parsed.detail}${colors.reset}`);
          }
        } catch (e) {
          // Not JSON
        }
      }
    }
  });
}

// Run the tests
runTests().catch(console.error);