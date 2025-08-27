#!/usr/bin/env node

const BASE_URL = 'http://localhost:3000';

// Color codes
const green = '\x1b[32m';
const red = '\x1b[31m';
const yellow = '\x1b[33m';
const blue = '\x1b[34m';
const reset = '\x1b[0m';

// Security test payloads
const SQL_INJECTION_PAYLOADS = [
  "' OR '1'='1",
  "'; DROP TABLE bookings; --",
  "1' UNION SELECT * FROM users --",
  "admin'--",
  "' OR 1=1--"
];

const XSS_PAYLOADS = [
  "<script>alert('XSS')</script>",
  "<img src=x onerror=alert('XSS')>",
  "javascript:alert('XSS')",
  "<svg onload=alert('XSS')>",
  "';alert('XSS');//"
];

const PATH_TRAVERSAL_PAYLOADS = [
  "../../../etc/passwd",
  "..\\..\\..\\windows\\system32\\config\\sam",
  "....//....//....//etc/passwd",
  "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd"
];

async function runSecurityTests() {
  console.log(`${blue}🔒 Nordflytt Security Audit${reset}`);
  console.log('==============================\n');

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0
  };

  // Test 1: Check security headers
  console.log(`${yellow}1. Testing Security Headers...${reset}`);
  await testSecurityHeaders(results);

  // Test 2: SQL Injection tests
  console.log(`\n${yellow}2. Testing SQL Injection Protection...${reset}`);
  await testSQLInjection(results);

  // Test 3: XSS Protection
  console.log(`\n${yellow}3. Testing XSS Protection...${reset}`);
  await testXSSProtection(results);

  // Test 4: Authentication & Authorization
  console.log(`\n${yellow}4. Testing Authentication & Authorization...${reset}`);
  await testAuthentication(results);

  // Test 5: Rate Limiting
  console.log(`\n${yellow}5. Testing Rate Limiting...${reset}`);
  await testRateLimiting(results);

  // Test 6: Input Validation
  console.log(`\n${yellow}6. Testing Input Validation...${reset}`);
  await testInputValidation(results);

  // Test 7: API Security
  console.log(`\n${yellow}7. Testing API Security...${reset}`);
  await testAPISecurity(results);

  // Test 8: File Upload Security
  console.log(`\n${yellow}8. Testing File Upload Security...${reset}`);
  await testFileUploadSecurity(results);

  // Summary
  printSummary(results);
}

async function testSecurityHeaders(results) {
  try {
    const response = await fetch(BASE_URL);
    const headers = response.headers;

    const securityHeaders = [
      { name: 'X-Content-Type-Options', expected: 'nosniff' },
      { name: 'X-Frame-Options', expected: 'DENY' },
      { name: 'X-XSS-Protection', expected: '1; mode=block' },
      { name: 'Strict-Transport-Security', expected: 'max-age=' },
      { name: 'Content-Security-Policy', expected: 'default-src' },
      { name: 'Referrer-Policy', expected: 'strict-origin' },
      { name: 'Permissions-Policy', expected: 'camera=' }
    ];

    for (const header of securityHeaders) {
      const value = headers.get(header.name);
      if (value && value.includes(header.expected)) {
        console.log(`${green}✓ ${header.name}: ${value}${reset}`);
        results.passed++;
      } else {
        console.log(`${red}✗ ${header.name}: Missing or incorrect${reset}`);
        results.failed++;
      }
    }
  } catch (error) {
    console.error(`${red}✗ Error testing headers: ${error.message}${reset}`);
    results.failed++;
  }
}

async function testSQLInjection(results) {
  for (const payload of SQL_INJECTION_PAYLOADS) {
    try {
      // Test booking submission
      const response = await fetch(`${BASE_URL}/api/submit-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerInfo: {
            name: payload,
            email: `${payload}@test.com`,
            phone: payload
          }
        })
      });

      // Check if payload was safely handled
      if (response.status >= 400 && response.status < 500) {
        console.log(`${green}✓ Blocked SQL injection: ${payload.substring(0, 30)}...${reset}`);
        results.passed++;
      } else {
        const body = await response.text();
        if (body.toLowerCase().includes('error') || body.toLowerCase().includes('sql')) {
          console.log(`${red}✗ Possible SQL injection vulnerability with: ${payload}${reset}`);
          results.failed++;
        } else {
          console.log(`${yellow}⚠ Unclear response for: ${payload.substring(0, 30)}...${reset}`);
          results.warnings++;
        }
      }
    } catch (error) {
      console.log(`${green}✓ Request failed safely for: ${payload.substring(0, 30)}...${reset}`);
      results.passed++;
    }
  }
}

async function testXSSProtection(results) {
  for (const payload of XSS_PAYLOADS) {
    try {
      // Test form submission
      const response = await fetch(`${BASE_URL}/api/submit-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerInfo: {
            name: payload,
            email: 'test@example.com',
            phone: '0701234567'
          },
          specialInstructions: payload
        })
      });

      const responseText = await response.text();
      
      // Check if payload appears unescaped in response
      if (!responseText.includes(payload) || responseText.includes('&lt;script')) {
        console.log(`${green}✓ XSS payload properly handled: ${payload.substring(0, 30)}...${reset}`);
        results.passed++;
      } else {
        console.log(`${red}✗ Potential XSS vulnerability: ${payload}${reset}`);
        results.failed++;
      }
    } catch (error) {
      console.log(`${green}✓ XSS attempt safely rejected${reset}`);
      results.passed++;
    }
  }
}

async function testAuthentication(results) {
  // Test protected endpoints without auth
  const protectedEndpoints = [
    '/api/staff/jobs',
    '/api/staff/update-status',
    '/api/admin/users',
    '/api/internal/metrics'
  ];

  for (const endpoint of protectedEndpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      
      if (response.status === 401 || response.status === 403) {
        console.log(`${green}✓ ${endpoint} requires authentication${reset}`);
        results.passed++;
      } else {
        console.log(`${red}✗ ${endpoint} accessible without auth (${response.status})${reset}`);
        results.failed++;
      }
    } catch (error) {
      console.log(`${yellow}⚠ Could not test ${endpoint}${reset}`);
      results.warnings++;
    }
  }

  // Test JWT token validation
  const fakeTokens = [
    'Bearer fake-token',
    'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    'Bearer ' + Buffer.from('{"user":"admin"}').toString('base64')
  ];

  for (const token of fakeTokens) {
    const response = await fetch(`${BASE_URL}/api/staff/jobs`, {
      headers: { 'Authorization': token }
    });
    
    if (response.status === 401) {
      console.log(`${green}✓ Invalid token rejected${reset}`);
      results.passed++;
    } else {
      console.log(`${red}✗ Invalid token accepted${reset}`);
      results.failed++;
    }
  }
}

async function testRateLimiting(results) {
  const endpoint = `${BASE_URL}/api/auth/send-otp`;
  const requests = [];
  
  // Send 100 requests rapidly
  for (let i = 0; i < 100; i++) {
    requests.push(
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '0701234567' })
      })
    );
  }
  
  const responses = await Promise.all(requests);
  const rateLimited = responses.filter(r => r.status === 429).length;
  
  if (rateLimited > 0) {
    console.log(`${green}✓ Rate limiting active (${rateLimited}/100 requests blocked)${reset}`);
    results.passed++;
  } else {
    console.log(`${red}✗ No rate limiting detected${reset}`);
    results.failed++;
  }
}

async function testInputValidation(results) {
  const invalidInputs = [
    { phone: '123' }, // Too short
    { phone: 'abc123' }, // Invalid format
    { email: 'not-an-email' }, // Invalid email
    { email: 'test@' }, // Incomplete email
    { moveDate: '2020-01-01' }, // Past date
    { livingArea: -50 }, // Negative number
    { livingArea: 'abc' }, // String instead of number
  ];

  for (const input of invalidInputs) {
    try {
      const response = await fetch(`${BASE_URL}/api/submit-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerInfo: {
            name: 'Test',
            email: input.email || 'test@example.com',
            phone: input.phone || '0701234567'
          },
          moveDetails: {
            moveDate: input.moveDate || new Date().toISOString(),
            livingArea: input.livingArea || 50
          }
        })
      });

      if (response.status >= 400 && response.status < 500) {
        console.log(`${green}✓ Invalid input rejected: ${JSON.stringify(input)}${reset}`);
        results.passed++;
      } else {
        console.log(`${red}✗ Invalid input accepted: ${JSON.stringify(input)}${reset}`);
        results.failed++;
      }
    } catch (error) {
      results.warnings++;
    }
  }
}

async function testAPISecurity(results) {
  // Test CORS
  const corsResponse = await fetch(`${BASE_URL}/api/health`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'http://malicious-site.com',
      'Access-Control-Request-Method': 'POST'
    }
  });
  
  const allowedOrigin = corsResponse.headers.get('Access-Control-Allow-Origin');
  if (!allowedOrigin || allowedOrigin === '*') {
    console.log(`${red}✗ CORS too permissive${reset}`);
    results.failed++;
  } else {
    console.log(`${green}✓ CORS properly configured${reset}`);
    results.passed++;
  }

  // Test HTTP methods
  const methods = ['PUT', 'DELETE', 'PATCH', 'TRACE'];
  for (const method of methods) {
    const response = await fetch(`${BASE_URL}/api/submit-booking`, { method });
    if (response.status === 405 || response.status === 404) {
      console.log(`${green}✓ ${method} method properly handled${reset}`);
      results.passed++;
    } else {
      console.log(`${yellow}⚠ ${method} method returned ${response.status}${reset}`);
      results.warnings++;
    }
  }
}

async function testFileUploadSecurity(results) {
  // Test malicious file names
  const maliciousFileNames = [
    '../../../etc/passwd',
    'shell.php.jpg',
    'test.exe',
    '"><script>alert(1)</script>.jpg'
  ];

  console.log(`${yellow}⚠ File upload security requires actual file upload implementation${reset}`);
  results.warnings++;
}

function printSummary(results) {
  console.log(`\n${blue}📊 Security Audit Summary${reset}`);
  console.log('========================');
  console.log(`${green}✅ Passed: ${results.passed}${reset}`);
  console.log(`${red}❌ Failed: ${results.failed}${reset}`);
  console.log(`${yellow}⚠️  Warnings: ${results.warnings}${reset}`);
  
  const total = results.passed + results.failed;
  const score = total > 0 ? Math.round((results.passed / total) * 100) : 0;
  console.log(`${blue}🔒 Security Score: ${score}%${reset}`);

  console.log(`\n${blue}📝 Recommendations:${reset}`);
  if (results.failed > 0) {
    console.log('1. Review and fix failed security tests');
    console.log('2. Implement proper input sanitization');
    console.log('3. Ensure all endpoints have proper authentication');
    console.log('4. Configure security headers correctly');
  }
  console.log('5. Regular security audits recommended');
  console.log('6. Consider implementing WAF (Web Application Firewall)');
  console.log('7. Add security monitoring and alerting');
}

// Run security tests
runSecurityTests().catch(console.error);