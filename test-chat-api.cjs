#!/usr/bin/env node

const http = require('http');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

console.log(`${colors.bright}${colors.blue}=== Testing Chat API v2 ===${colors.reset}\n`);

// Test cases
const testCases = [
  {
    name: 'Price inquiry',
    message: 'Hej, vad kostar det att flytta en 3:a på 75m²?',
    expectedIntent: 'pricing'
  },
  {
    name: 'Price with services',
    message: 'Jag vill ha pris för flytt med packning och städning, 50m²',
    expectedIntent: 'pricing'
  },
  {
    name: 'Customer lookup',
    message: 'Min email är anna.svensson@gmail.com, vill se mina bokningar',
    expectedIntent: 'booking_inquiry'
  },
  {
    name: 'Booking inquiry',
    message: 'Kan jag se min bokning BK-2024-001234?',
    expectedIntent: 'booking_inquiry'
  },
  {
    name: 'Complaint',
    message: 'Jag har problem med min senaste flytt, saker blev skadade',
    expectedIntent: 'complaint'
  },
  {
    name: 'New booking',
    message: 'Jag vill boka en flytt till nästa vecka',
    expectedIntent: 'new_booking'
  },
  {
    name: 'General inquiry',
    message: 'Hej, kan ni hjälpa mig?',
    expectedIntent: 'general'
  }
];

async function testChatAPI(testCase) {
  return new Promise((resolve) => {
    console.log(`\n${colors.bright}Test: ${colors.yellow}${testCase.name}${colors.reset}`);
    console.log(`Message: "${colors.cyan}${testCase.message}${colors.reset}"`);
    
    const postData = JSON.stringify({
      message: testCase.message,
      customerId: null,
      conversationHistory: []
    });
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/ai-customer-service/gpt/chat-v2',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          // Check if the response has the expected structure
          const hasExpectedFields = response.success !== undefined &&
                                   response.response &&
                                   response.intent &&
                                   response.confidence !== undefined;
          
          if (res.statusCode === 200 && hasExpectedFields) {
            console.log(`${colors.green}✓ Status: ${res.statusCode}${colors.reset}`);
            console.log(`${colors.green}✓ Intent: ${response.intent} (expected: ${testCase.expectedIntent})${colors.reset}`);
            console.log(`${colors.green}✓ Confidence: ${response.confidence}${colors.reset}`);
            console.log(`${colors.green}✓ Production API: ${response.production_api ? 'Yes' : 'No (Mock)'}${colors.reset}`);
            
            if (response.customer_recognized) {
              console.log(`${colors.green}✓ Customer recognized${colors.reset}`);
            }
            
            console.log(`\nResponse preview: ${colors.magenta}${response.response.substring(0, 150)}...${colors.reset}`);
            
            if (response.suggestions && response.suggestions.length > 0) {
              console.log(`\nSuggestions: ${colors.blue}${response.suggestions.map(s => s.text).join(', ')}${colors.reset}`);
            }
            
            resolve({
              success: true,
              testCase: testCase.name,
              intent: response.intent,
              matchesExpected: response.intent === testCase.expectedIntent
            });
          } else {
            console.log(`${colors.red}✗ Error: Invalid response structure${colors.reset}`);
            console.log(`${colors.red}Response: ${JSON.stringify(response, null, 2)}${colors.reset}`);
            resolve({
              success: false,
              testCase: testCase.name,
              error: 'Invalid response structure'
            });
          }
        } catch (error) {
          console.log(`${colors.red}✗ Error parsing response: ${error.message}${colors.reset}`);
          console.log(`${colors.red}Raw response: ${data}${colors.reset}`);
          resolve({
            success: false,
            testCase: testCase.name,
            error: error.message
          });
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`${colors.red}✗ Request error: ${error.message}${colors.reset}`);
      resolve({
        success: false,
        testCase: testCase.name,
        error: error.message
      });
    });
    
    req.write(postData);
    req.end();
  });
}

async function testProductionEndpoints() {
  console.log(`\n${colors.bright}${colors.yellow}=== Testing Direct Production API Access ===${colors.reset}\n`);
  
  // Test with USE_PRODUCTION_API=true
  const testMessage = {
    message: 'Vad kostar en flytt för 50m² med packning?',
    customerId: null,
    conversationHistory: []
  };
  
  const postData = JSON.stringify(testMessage);
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/ai-customer-service/gpt/chat-v2',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log(`Production API Test Result:`);
          console.log(`- Status: ${res.statusCode}`);
          console.log(`- Production API Used: ${response.production_api ? colors.green + 'YES' : colors.yellow + 'NO (Mock)'}${colors.reset}`);
          console.log(`- Intent: ${response.intent}`);
          console.log(`- Response: ${response.response?.substring(0, 200)}...`);
          
          if (response.api_data) {
            console.log(`- API Data Available: ${colors.green}YES${colors.reset}`);
          }
          
          resolve(response);
        } catch (error) {
          console.log(`${colors.red}Error: ${error.message}${colors.reset}`);
          resolve(null);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`${colors.red}Request error: ${error.message}${colors.reset}`);
      resolve(null);
    });
    
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log(`Testing chat API at http://localhost:3000/api/ai-customer-service/gpt/chat-v2`);
  console.log(`Make sure the Next.js server is running!\n`);
  
  // First test production API access
  await testProductionEndpoints();
  
  // Then run all test cases
  console.log(`\n${colors.bright}${colors.yellow}=== Running All Test Cases ===${colors.reset}`);
  
  const results = [];
  for (const testCase of testCases) {
    const result = await testChatAPI(testCase);
    results.push(result);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log(`\n${colors.bright}${colors.blue}=== Test Summary ===${colors.reset}\n`);
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const correctIntents = results.filter(r => r.success && r.matchesExpected);
  
  console.log(`Total tests: ${results.length}`);
  console.log(`${colors.green}✓ Successful: ${successful.length}${colors.reset}`);
  console.log(`${colors.red}✗ Failed: ${failed.length}${colors.reset}`);
  console.log(`${colors.cyan}Intent matches: ${correctIntents.length}/${successful.length}${colors.reset}`);
  
  if (failed.length > 0) {
    console.log(`\nFailed tests:`);
    failed.forEach(f => {
      console.log(`- ${colors.red}${f.testCase}: ${f.error}${colors.reset}`);
    });
  }
  
  const incorrectIntents = successful.filter(r => !r.matchesExpected);
  if (incorrectIntents.length > 0) {
    console.log(`\nIncorrect intent detection:`);
    incorrectIntents.forEach(r => {
      console.log(`- ${colors.yellow}${r.testCase}: Got "${r.intent}" instead of expected intent${colors.reset}`);
    });
  }
  
  console.log(`\n${colors.bright}NOTE: To enable production API, set USE_PRODUCTION_API=true in your .env.local file${colors.reset}`);
}

// Run the tests
runTests().catch(console.error);