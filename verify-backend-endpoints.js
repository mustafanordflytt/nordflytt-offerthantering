#!/usr/bin/env node

/**
 * Quick verification script for backend endpoints
 */

const endpoints = [
  { name: 'Booking API', method: 'POST', url: 'http://localhost:3000/api/bookings', 
    body: { customer_name: 'Test', customer_email: 'test@test.com', moving_date: '2025-02-20', 
            from_address: 'Stockholm', to_address: 'Göteborg', volume: 30 } },
  { name: 'Auth API', method: 'POST', url: 'http://localhost:3000/api/auth/login',
    body: { email: 'admin@nordflytt.se', password: 'admin123' } },
  { name: 'Jobs API', method: 'POST', url: 'http://localhost:3000/api/jobs',
    body: { job_type: 'moving', scheduled_date: '2025-02-15', customer_id: 1 } },
  { name: 'Jobs API GET', method: 'GET', url: 'http://localhost:3000/api/jobs' },
  { name: 'Lowisa Chat', method: 'POST', url: 'http://localhost:3000/api/lowisa/chat',
    body: { message: 'Hej, jag heter Erik', candidateId: 1, conversationHistory: [] } },
  { name: 'Recruitment Screening', method: 'POST', url: 'http://localhost:3000/api/recruitment/screening',
    body: { candidate_name: 'Test Candidate', position: 'Flyttare' } },
  { name: 'CRM API', method: 'GET', url: 'http://localhost:3000/api/crm?type=dashboard' },
  { name: 'Admin Users', method: 'GET', url: 'http://localhost:3000/api/admin/users' },
  { name: 'Health Check', method: 'GET', url: 'http://localhost:3000/api/ai/health-check' }
];

async function testEndpoint(endpoint) {
  try {
    const options = {
      method: endpoint.method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (endpoint.body) {
      options.body = JSON.stringify(endpoint.body);
    }
    
    const response = await fetch(endpoint.url, options);
    const data = await response.json();
    
    return {
      name: endpoint.name,
      status: response.status,
      success: response.ok,
      data: JSON.stringify(data).substring(0, 100) + '...'
    };
  } catch (error) {
    return {
      name: endpoint.name,
      status: 'ERROR',
      success: false,
      error: error.message
    };
  }
}

async function runTests() {
  console.log('🧪 Testing Backend Endpoints...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    
    if (result.success) {
      console.log(`✅ ${result.name}: ${result.status} - PASS`);
      console.log(`   Response: ${result.data}\n`);
      passed++;
    } else {
      console.log(`❌ ${result.name}: ${result.status} - FAIL`);
      console.log(`   Error: ${result.error || result.data}\n`);
      failed++;
    }
  }
  
  const successRate = Math.round((passed / endpoints.length) * 100);
  
  console.log('📊 Results Summary:');
  console.log(`   Total Tests: ${endpoints.length}`);
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Success Rate: ${successRate}%`);
  console.log(`   Expected: 95%+`);
  console.log(`   Status: ${successRate >= 95 ? '✅ GOAL ACHIEVED!' : '⚠️  Below target'}`);
}

// Import fetch for Node.js < 18
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

runTests();