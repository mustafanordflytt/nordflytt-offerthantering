#!/usr/bin/env node
// FORTNOX CONNECTION VERIFICATION - STEP BY STEP
// Testar kopplingen systematiskt innan vi skapar invoices

const https = require('https');

// ACCESS TOKEN (använd befintlig token från filen)
const ACCESS_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjEsInRlbmFudElkIjoxNzEwOTU2LCJyaWdodHNBc0pzb24iOiJINHNJQUFBQUFBQUFBNDFZNlc3ak9BeCtsXC83ZTVoM1NGRjBFbUowcEpoME1Gb3RGSUV1MG8xcUhvU05wOXVtWE9teExkdEtaSHdVaW5oOHBpcVQ3ejRPQlFSdG5OMDE3dENkOU9ScVErZ3pzZU5hZW5zQWNqYjdZaHo4bU1hR2I1bHFjcFdaZXdKWlNzS1ZZMHhZSDRobDN4Vm5ydHJLb2lsTmZLU3FCcDRadExvWTcrR0hCZk9mZHlkbEU3SXoyUVwvalpibHF1aUtLY2lMK0JtQU00eDFWbkV5dkhrUTdVQUhGZ3VUcHJUb0ZRYWp3UkpZc0lCMmJrSjhaQXJoS1VzNzdyd0RvZTBTS1pFUzZ1anZTeko0b1FRTlRLRWZnTEZcL0NtRDFmclFMNW93ZEJEaGMwaWFIb2lVbnZsc25FUUZXN0xBVDVDVGpJa01LMDJzc0lmUGRXaHgyQXFPMjFBWW9peUxTelMxR2pkMTlCVFFySjY1V3BHeHlYcHNqang3cVFOXC93K0NwUjRnMzR3bFo2anRSbFJyZDZLMUZhQTZ4blZTbjdJYjFOZ2h6ZzU5UTFhdERXSHV1Snh6Vjl4emxSb0RaekJPTktOU0JablNjRGNHcU1ZcUU1ek1aVENGbmN0a1JLQlliYUlNR0VWckwyaEV5OEpvVE5vbjJhaUFCOHNWUVdqYW96elhMSitiVDZMQXV3U1hNWjY0ZGRwY2hlN0dsRkRndzgyYUs0SnpnR1wvUFBXTDJlTXRwTkxwQkxvOVc4YW1YR2RkdEcxRUdjaEZnT0tLOEhCWGlROUtHVGJMSlJFa2hqSlhHWE9PNjhyemlyWXdsUEFVWk0xRnFKYWtjWm11MHZNdk10T1VESEZFV0xnd21tOWdxanZHM3ZEN20rOW1FTnJ6dERFQnNPMXZGM3NCSVc4dWdmMVpUb3Z1ZGxnTlIxNzJLVnhXdW9nQlVDRGNlRGZpZFZncG9rTHBoZlorQ3MydHNtZk9hQ3Y3Z2lQTkJDdnY0eHVJQmk0ajNSeXVHVEROZUhiRTRhWlwvUFBSSDRPb2poWGg0N3p4bllXYkJRQ1o3R0kzUm9GR2NSMXFEVktyYWhRRjltUE5EdWRMaktqRVU0a3F3Zzl4UGtJb3dTVW5xMzQ4bVJqK0lVWGlINkdnMHNQSWNVeEpKWjhJXC9ocFMrZDNzaFRrWXlLUEd2akhcL1FFR3hqcE9vV212ME51ZVdzZHdmUTZkdnZ1QzdERTRaUjBONlNtUzAwVCtoaDRkdTFsa1hFOFRoUDYwWVhiSWFuc051T3cySGxzUFJMTVc4SDh0ZGJCRDRQZ3Y2dUYxUnBpUk1qRytlRXgxZDVHa3V1elRpV05hVHU0TkxpSTZqZEI3NHgzdGxjNFhzellucW1XTW9aR1dINXRSWmxsWml6TWJ4ZDFoXC9NRlg0K3lzQ1R2K0puVHIxNDJNV0daTTQydVV2TFZhQVFrdDB4eWhRbEdiTHBRa2JyQlJ6Q2ZpUkM0dzJHT2FLalFwK3NMR2xUNlkySHpJTzBXWnhtKzZOekVaMzZvdm1kdVNTT0FiUmxidzVmRTlPQlMrV2ZTdUNmbUk2NDNibG9TeDlBd3J3WmY4OTUrMVc0YlFBSjcwMTkweDlWUDdrNnZ4Tm9MdHNjRnptb0xIQ09zUUpHQmh4R3l2WGw5ZmVqQ21MYThoT0d4d1k0OFFlc1h2WDNlZVwvbzBTT2FlandTQnljZGhpaGRBWFZhT282c1N3bFFYN1NDWUlSOEdtS2N6SWhTaFdNZktEYmhPWmFtd1FsUjJVb2NwRm9pK0dtV1ZiS0tQMENwV3VVb20xK25Ic3BuMmFRMnBkTzgwMTVYREZlQkV3RytGd2VoM29HNFpOc0laazF6bktrXC9NWlVLcjg3UlFWdFJZWFdGaHI0S3ZGNnNWY054QkJwSGFkTUpMYzFcL0s5MTF1VmlFZnFJTExIeG9ESVlyYlZtekVVUGkrUUpNbjUxUnRqY2M5Q245eTFlaVBEYzRrSHF6Z1Y4ODhJQVRHdGFUbFlaemVXK0RnU3dGc3h2Z01ha0xlRWdKbEduNkp0VFE1dFpsQ08yOThOWEhhRnl0MW1qb2h4NzFqOHJjMmlLTUhsdFlHWERLbmZicmcrSUhwaTByTFI1c2ExcmowVUNNM2tvY25qVjlWdXdnd1JXZXVzVUtuOHA2b2ViZWN6cmtLV3gyYVR2eUduRmpsMTBLbHY5TzJvb1VSc1UwWFlVdjZXREVcL29mbXhMeG1odFBRVm9LVGxtMXpKQm9lRHdWTEJOS1J5TEFHdUE3UjVFRlpBRUREMlJGZFRnK1dWdXd6alZoamhWc1pkTk1qQjRGN2llSVZwUmIwaGNzQ1BLXC82NVNPampKWjhyRzd2NmVNdlRPWTl0M0NjRzRlMjlIcFFhU1h6ME5LMjEybXdZdFwvbnd0Rmg0NzJtYzhWTXpaUHg1MHZ4RW1BeFlTR2Y0WGRzaHNETGlPMEx2dCtHbVR5cVBXY3M5Nnl0Y1FnNlJGWWlQWWNJbUYyTjNFWjJKR1V2aWU0V1BGSlAxcDlhczVDNytnVk1yNGFLUkI5VTNreWZtS0pDN3d5Y1N3TGpiWTJmeml1WEhNeHYzZnhHRmNcL1VaWjJYNGNJUlNiN1hXWnpydU1UZW9GaUJZZitFZ3Fyank1UGpFVDVhNGx4Z2NCT28xQlhsdzJQamZTRjd3TVRVWVdmeWtLYWRWU1M1K0h3VXg4WDhrOVwvZ1NmOGFOK1o2QWxTUk9sNHFmR3U2S3FxeFBqMWFzSjdxNE84QVpXUW5IUWt2RStIK3I1YTZaZG15WWx1U0hmXC84SGg0U0lERXNVQUFBPSIsInJpZ2h0cyI6Ikg0c0lBQUFBQUFBQUE0dFd5azdUeTh3cnk4OU1UbFhTQVhIeThpdGdcL0ZnQUptc0tZUjRBQUFBPSIsImFwcHNTZXJ2ZXJIb3N0IjoiYXBwczUuZm9ydG5veC5zZSIsInNlbmRJbnZvaWNlQWNjZXNzIjp0cnVlLCJjbGllbnRJZCI6Inh2ZWtTVzdjcVJzZiIsInNjb3BlcyI6WyJjdXN0b21lciIsImludm9pY2UiLCJhcnRpY2xlIiwiY29tcGFueWluZm9ybWF0aW9uIl0sImF1dGhzb3VyY2UiOiJPQVVUSDIiLCJpZCI6ImUwY2U3MjZjZDk4NTJlMDMwNTIwNzYwMDU1ZGQyOTc4YmVkMzNmNmQiLCJqdGkiOiJlMGNlNzI2Y2Q5ODUyZTAzMDUyMDc2MDA1NWRkMjk3OGJlZDMzZjZkIiwiaXNzIjoiaHR0cHM6XC9cL2FwaS5mb3J0bm94LnNlXC9vYXV0aDIiLCJhdWQiOiJ4dmVrU1c3Y3FSc2YiLCJzdWIiOiIxQDE3MTA5NTYiLCJleHAiOjE3NTMzMTQzNzgsImlhdCI6MTc1MzMxMDc3OCwidG9rZW5fdHlwZSI6ImJlYXJlciIsInNjb3BlIjoiY3VzdG9tZXIgaW52b2ljZSBhcnRpY2xlIGNvbXBhbnlpbmZvcm1hdGlvbiJ9.vd-9_NDeYGD6cpokvU0PTFvPHz4TfXbmlf2usQjxI7o";

console.log('🚀 FORTNOX CONNECTION VERIFICATION STARTING...');
console.log('================================================');

// API Helper Function
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// STEG 1: Verifiera Token Format
function verifyTokenFormat() {
  console.log('\n📋 STEG 1: TOKEN FORMAT VERIFICATION');
  console.log('=====================================');
  
  if (!ACCESS_TOKEN || ACCESS_TOKEN === "REPLACE_WITH_FRESH_TOKEN_HERE") {
    console.log('❌ No valid access token found');
    return false;
  }
  
  console.log('✅ Token exists');
  console.log(`📏 Token length: ${ACCESS_TOKEN.length} characters`);
  console.log(`🔍 Token preview: ${ACCESS_TOKEN.substring(0, 50)}...`);
  
  // Decode JWT header to check format
  try {
    const parts = ACCESS_TOKEN.split('.');
    if (parts.length === 3) {
      const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      
      console.log('✅ Valid JWT format');
      console.log(`🏢 Tenant ID: ${payload.tenantId}`);
      console.log(`👤 Client ID: ${payload.clientId}`);
      console.log(`🔐 Scopes: ${payload.scopes?.join(', ')}`);
      console.log(`⏰ Expires: ${new Date(payload.exp * 1000).toLocaleString()}`);
      
      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        console.log('⚠️  TOKEN IS EXPIRED!');
        return false;
      } else {
        console.log('✅ Token is still valid');
        return true;
      }
    }
  } catch (error) {
    console.log('❌ Invalid JWT format:', error.message);
    return false;
  }
  
  return true;
}

// STEG 2: Test Basic API Connection
async function testBasicConnection() {
  console.log('\n🔌 STEG 2: BASIC API CONNECTION TEST');
  console.log('====================================');
  
  const options = {
    hostname: 'api.fortnox.se',
    port: 443,
    path: '/3/companyinformation',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    console.log('🌐 Connecting to: https://api.fortnox.se/3/companyinformation');
    console.log('🔑 Using Bearer token authentication');
    
    const result = await makeRequest(options);
    
    console.log(`📊 Response Status: ${result.status}`);
    console.log(`📦 Content-Type: ${result.headers['content-type']}`);
    
    if (result.status === 200) {
      console.log('✅ CONNECTION SUCCESS!');
      const company = result.data.CompanyInformation;
      console.log(`🏢 Company: ${company?.CompanyName || 'Unknown'}`);
      console.log(`🆔 Organization Number: ${company?.OrganizationNumber || 'Unknown'}`);
      console.log(`📧 Email: ${company?.Email || 'Unknown'}`);
      return true;
    } else {
      console.log('❌ CONNECTION FAILED');
      console.log('Response:', JSON.stringify(result.data, null, 2));
      return false;
    }
  } catch (error) {
    console.log('❌ CONNECTION ERROR:', error.message);
    return false;
  }
}

// STEG 3: Test Specific Endpoints
async function testEndpoints() {
  console.log('\n🎯 STEG 3: ENDPOINT TESTING');
  console.log('============================');
  
  const endpoints = [
    { name: 'Articles', path: '/3/articles', description: 'Product/service management' },
    { name: 'Customers', path: '/3/customers', description: 'Customer management' },
    { name: 'Invoices', path: '/3/invoices', description: 'Invoice management' }
  ];
  
  const results = {};
  
  for (const endpoint of endpoints) {
    console.log(`\n📡 Testing ${endpoint.name} (${endpoint.description})`);
    
    const options = {
      hostname: 'api.fortnox.se',
      port: 443,
      path: endpoint.path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    try {
      const result = await makeRequest(options);
      
      if (result.status === 200) {
        console.log(`✅ ${endpoint.name}: SUCCESS`);
        
        // Count items if it's an array response
        const dataKey = Object.keys(result.data)[0];
        const items = result.data[dataKey];
        if (Array.isArray(items)) {
          console.log(`   📊 Items found: ${items.length}`);
        }
        
        results[endpoint.name] = { success: true, count: Array.isArray(items) ? items.length : 'N/A' };
      } else {
        console.log(`❌ ${endpoint.name}: FAILED (${result.status})`);
        console.log(`   Error: ${JSON.stringify(result.data)}`);
        results[endpoint.name] = { success: false, error: result.status };
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ERROR - ${error.message}`);
      results[endpoint.name] = { success: false, error: error.message };
    }
  }
  
  return results;
}

// STEG 4: Summary och Recommendations
function showSummary(endpointResults) {
  console.log('\n📊 SUMMARY & RECOMMENDATIONS');
  console.log('===============================');
  
  const successCount = Object.values(endpointResults).filter(r => r.success).length;
  const totalCount = Object.keys(endpointResults).length;
  
  console.log(`🎯 Connection Success Rate: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);
  
  if (successCount === totalCount) {
    console.log('�� ALL ENDPOINTS WORKING!');
    console.log('✅ Ready for invoice creation');
    console.log('✅ Ready for customer management');
    console.log('✅ Ready for product management');
    console.log('\n�� NEXT STEP: We can safely proceed with invoice creation!');
  } else {
    console.log('⚠️  Some endpoints failed');
    console.log('🔧 Troubleshooting needed before proceeding');
    
    Object.entries(endpointResults).forEach(([name, result]) => {
      if (!result.success) {
        console.log(`   ❌ ${name}: ${result.error}`);
      }
    });
  }
  
  console.log('\n📋 Endpoint Details:');
  Object.entries(endpointResults).forEach(([name, result]) => {
    const status = result.success ? '✅' : '❌';
    const detail = result.success ? `(${result.count} items)` : `(${result.error})`;
    console.log(`   ${status} ${name}: ${detail}`);
  });
}

// MAIN EXECUTION
async function runConnectionVerification() {
  console.log('🔍 Starting systematic connection verification...\n');
  
  // Step 1: Verify token format
  const tokenValid = verifyTokenFormat();
  if (!tokenValid) {
    console.log('\n❌ STOPPING: Token is invalid or expired');
    console.log('🔧 ACTION NEEDED: Get fresh OAuth token');
    return;
  }
  
  // Step 2: Test basic connection
  const connectionWorking = await testBasicConnection();
  if (!connectionWorking) {
    console.log('\n❌ STOPPING: Basic connection failed');
    console.log('🔧 ACTION NEEDED: Check token or network connection');
    return;
  }
  
  // Step 3: Test specific endpoints
  const endpointResults = await testEndpoints();
  
  // Step 4: Show summary
  showSummary(endpointResults);
}

// Run the verification
runConnectionVerification();
// LÄGG TILL INVOICE CREATION DIREKT I WORKING FILEN
// LÄGG TILL INVOICE CREATION MED CUSTOMER
async function testInvoiceCreation() {
  console.log('\n�� TESTING INVOICE CREATION WITH WORKING TOKEN...');
  
  // STEG 1: Skapa customer först
  console.log('👤 Creating customer first...');
  const customer = {
    Customer: {
      CustomerNumber: "TEST001",
      Name: "Test Customer",
      Address1: "Testgatan 1",
      ZipCode: "12345",
      City: "Stockholm"
    }
  };

  const customerOptions = {
    hostname: 'api.fortnox.se',
    port: 443,
    path: '/3/customers',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    const customerResult = await makeRequest(customerOptions, customer);
    console.log(`📊 Customer Creation Status: ${customerResult.status}`);
  } catch (error) {
    console.log('Customer already exists or error:', error.message);
  }

  // STEG 2: Skapa invoice
  console.log('📄 Creating invoice...');
  const invoice = {
    Invoice: {
      CustomerNumber: "TEST001", 
      InvoiceDate: new Date().toISOString().split('T')[0],
      DueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      Comments: "Nordflytt AI Test Invoice",
      InvoiceRows: [
        {
          Description: "Flyttjänst test",
          Quantity: 1,
          Price: 1000,
          Unit: "st"
        }
      ]
    }
  };

  const invoiceOptions = {
    hostname: 'api.fortnox.se',
    port: 443,
    path: '/3/invoices',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    const result = await makeRequest(invoiceOptions, invoice);
    console.log(`📊 Invoice Creation Status: ${result.status}`);
    
    if (result.status === 201) {
      console.log('✅ INVOICE CREATION SUCCESS!');
      console.log(`📋 Invoice: ${result.data.Invoice.DocumentNumber}`);
      console.log(`💰 Total: ${result.data.Invoice.Total} SEK`);
      console.log('🎉 NORDFLYTT AUTO-INVOICE WORKING!');
    } else {
      console.log('❌ Invoice Creation Failed:', JSON.stringify(result.data, null, 2));
    }
  } catch (error) {
    console.log('❌ Invoice Error:', error.message);
  }
}
  
 
     

// Kör invoice test
testInvoiceCreation();
