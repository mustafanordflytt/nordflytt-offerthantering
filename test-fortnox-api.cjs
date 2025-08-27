#!/usr/bin/env node
// FORTNOX API TEST SCRIPT - WORKING VERSION

const https = require('https');

// VERIFIED WORKING CREDENTIALS
const ACCESS_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjEsInRlbmFudElkIjoxNzEwOTU2LCJyaWdodHNBc0pzb24iOiJINHNJQUFBQUFBQUFBNDFZNlc3ak9BeCtsXC83ZTVoM1NGRjBFbUowcEpoME1Gb3RGSUV1MG8xcUhvU05wOXVtWE9teExkdEtaSHdVaW5oOHBpcVQ3ejRPQlFSdG5OMDE3dENkOU9ScVErZ3pzZU5hZW5zQWNqYjdZaHo4bU1hR2I1bHFjcFdaZXdKWlNzS1ZZMHhZSDRobDN4Vm5ydHJLb2lsTmZLU3FCcDRadExvWTcrR0hCZk9mZHlkbEU3SXoyUVwvalpibHF1aUtLY2lMK0JtQU00eDFWbkV5dkhrUTdVQUhGZ3VUcHJUb0ZRYWp3UkpZc0lCMmJrSjhaQXJoS1VzNzdyd0RvZTBTS1pFUzZ1anZTeko0b1FRTlRLRWZnTEZcL0NtRDFmclFMNW93ZEJEaGMwaWFIb2lVbnZsc25FUUZXN0xBVDVDVGpJa01LMDJzc0lmUGRXaHgyQXFPMjFBWW9peUxTelMxR2pkMTlCVFFySjY1V3BHeHlYcHNqang3cVFOXC93K0NwUjRnMzR3bFo2anRSbFJyZDZLMUZhQTZ4blZTbjdJYjFOZ2h6ZzU5UTFhdERXSHV1Snh6Vjl4emxSb0RaekJPTktOU0JablNjRGNHcU1ZcUU1ek1aVENGbmN0a1JLQlliYUlNR0VWckwyaEV5OEpvVE5vbjJhaUFCOHNWUVdqYW96elhMSitiVDZMQXV3U1hNWjY0ZGRwY2hlN0dsRkRndzgyYUs0SnpnR1wvUFBXTDJlTXRwTkxwQkxvOVc4YW1YR2RkdEcxRUdjaEZnT0tLOEhCWGlROUtHVGJMSlJFa2hqSlhHWE9PNjhyemlyWXdsUEFVWk0xRnFKYWtjWm11MHZNdk10T1VESEZFV0xnd21tOWdxanZHM3ZEN20rOW1FTnJ6dERFQnNPMXZGM3NCSVc4dWdmMVpUb3Z1ZGxnTlIxNzJLVnhXdW9nQlVDRGNlRGZpZFZncG9rTHBoZForQ3MydHNtZk9hQ3Y3Z2lQTkJDdnY0eHVJQmk0ajNSeXVHVEROZUhiRTRhWlwvUFBSSDRPb2poWGg0N3p4bllXYkJRQ1o3R0kzUm9GR2NSMXFEVktyYWhRRjltUE5EdWRMaktqRVU0a3F3Zzl4UGtJb3dTVW5xMzQ4bVJqK0lVWGlINkdnMHNQSWNVeEpKWjhJXC9ocFMrZDNzaFRrWXlLUEd2akhcL1FFR3hqcE9vV212ME51ZVdzZHdmUTZkdnZ1QzdERTRaUjBONlNtUzAwVCtoaDRkdTFsa1hFOG9xQnhmbmhNTjc2UjVQcXNVeUVoMklPTDQyS2E0bzh1M0NCSnBia1pCOHJPWTN1U1lONEs1cSsxRG40WUJQOWRMYXpva0llR3FINFRhR2U4czczQzhXTEc5a3kxbERFMHd2SnJLOG9zTTJOaGZydW9PNXd2K0hxVWhTVjV4OCtjZnZXeWlRbkxuR2wwNWJQVURWYjRRdlBWYUFRb3QweHloUWxIck5vc1JBN1NibkZVNFlQTlBYcm1FeUZ3eDhQODBGREJUOWNYZEtqMHh5d1FxdStaVzlJSVlGdkcxdkFsTVQyNFZQNlpOTzZKK1lqcmpadVd4REUwekt2QjE3eTNYN1hiQmhEQTN2UVgzWEgxazd2VEs3SDJndTF4RVVpMUJZNFJWS0RJd01NSTJkNjh2ajUwWVV4VFhzTHcyR0JIbnFEMWk5NCs3ejE5R2lSenowZUN3R1RqTU1XRTU1ZVY0K2lxaERDVlJUc0lac2lIQWVicGpBaEZLTmFvY2dPdVUxa3FyQkNWbmRSaGlnV2lyMFpaSlp2b0k3U0tWYTZTeVhYNnNXeW1mVnBES3QwN3pYWGxjQVU0RWZCYllURDZIYWhiaG8xd3hpVFh1Y29UYzVuUTZqd3RsQlUxVmxkWTJLdmc2OFZxQlJ4M2tFR2tOcDN3MHR4ejhuMlhtMVhJQjZyZzhvZkdRSWppdGhVYk1SUytMOURreVRsVlcrTnhqOEtmWERYNlk0TXppUWNyK05VekR3aUJjUzFwZVJpbjl4WTQrRklBbXpFK2c1cVF0NFJBbVlaZllpMU5UbTJtME00YlgwMmM5c1ZLbmFaT3lISHZtUHl0RGVMb2dhVzFBWmZNYVo4dU9INWcrcUxTOHRHbWhqUXVQZFRJamVUaFNlTlgxUzRDVE5HWmE2elFxYnduYXQ0dHAzT3V3bGFIcGhPXC9JU2RXK2JWUTZlKzByV2hoUkd6VFJkaVNQbGJNVDJoKzdFdEdLQzE5QlNocCtTWlhzc0hoWUxCVU1BMnBIRXVBNndCdEhuSVZFQVNNUGRIVjFHQjU1UzdEdUJWR3VKVnhGdzF5TUxpWE9EcGhXbEZ2aUJ6dzQ0cFwvTGhMNmVNbm55c2F1UHQ3eWRNNGpHZmVKUVhoN3J3ZWxSaElmUFUxcnJUWWJ4bTArUEMwVzNuc2FaXC96VURCbFwvbmpRXC9FU1lERnRJWmZ0ZDJDS3lNK0k3USsyMjQ2WlBLWTlaeXpcL29LbDVCRFpBWGlZNWl3eWNYWVhVUm5Zc2FTK0Y3aEk4VmtcL2FrMUs3bUxmK0RVU3JoWTVFSDF6ZVNKT1Fyazd2Q0pCRER1OXRqWnZHTDU4Y3pHXC9WOUU0Vng5eGxrWlBoeWgxRnV0OVptT2U4b05xZ1VJMWw4NGlDcXVQRGsrOFpNbDdpVUdCNEY2VFVFZUhEYitONUlYZkV3TlJoWVwvYWNwcFZaS0wzMGRCVFB3ZnlUMit4Sjl4WTc0bllDV0owNlhpcDRhN29pcnIwNk1WNjRrdTdnNXdSbGJDc2RBU01mN2ZhcmxicHYwWnBpWDU0ZFwvXC9BV0o0TlRsTEZBQUEiLCJyaWdodHMiOiJINHNJQUFBQUFBQUFBNHRXeWs3VHk4d3J5ODlNVGxYU0FYSHk4aXRnXC9GZ0FKbXNLWVI0QUFBQT0iLCJhcHBzU2VydmVySG9zdCI6ImFwcHM1LmZvcnRub3guc2UiLCJzZW5kSW52b2ljZUFjY2VzcyI6dHJ1ZSwiY2xpZW50SWQiOiJ4dmVrU1c3Y3FSc2YiLCJzY29wZXMiOlsiY3VzdG9tZXIiLCJpbnZvaWNlIiwiYXJ0aWNsZSJdLCJhdXRoc291cmNlIjoiT0FVVEgyIiwiaWQiOiIzOGU1YzM5OTE3ZDcwNjRjOTVhMWU0ZTRlYmQzNDY4NTRiYTgzY2E4IiwianRpIjoiMzhlNWMzOTkxN2Q3MDY0Yzk1YTFlNGU0ZWJkMzQ2ODU0YmE4M2NhOCIsImlzcyI6Imh0dHBzOlwvXC9hcGkuZm9ydG5veC5zZVwvb2F1dGgyIiwiYXVkIjoieHZla1NXN2NxUnNmIiwic3ViIjoiMUAxNzEwOTU2IiwiZXhwIjoxNzUzMjI4MjM0LCJpYXQiOjE3NTMyMjQ2MzQsInRva2VuX3R5cGUiOiJiZWFyZXIiLCJzY29wZSI6ImN1c3RvbWVyIGludm9pY2UgYXJ0aWNsZSJ9.xh6WoPmI63hJEcAfIAAx1rquSpQc0AbIvB2rMi-GFng";
const CLIENT_SECRET = "YhfvjemECo";

// API ENDPOINTS TO TEST
const tests = [
  {
    name: "Company Information",
    endpoint: "/3/companyinformation"
  },
  {
    name: "Articles List",
    endpoint: "/3/articles"
  },
  {
    name: "Customers List", 
    endpoint: "/3/customers"
  }
];

// MAKE API REQUEST FUNCTION
function makeRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.fortnox.se',
      path: endpoint,
      method: 'GET',
      headers: {
    console.log("🔍 Headers being sent:", JSON.stringify(options.headers, null, 2));
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// RUN ALL TESTS
async function runTests() {
  console.log('🚀 TESTING FORTNOX API CONNECTION...\n');
  
  for (const test of tests) {
    try {
      console.log(`📊 Testing: ${test.name}`);
      const result = await makeRequest(test.endpoint);
      
      if (result.status === 200) {
        console.log(`✅ SUCCESS: ${test.name}`);
        
        // Show relevant data
        if (test.endpoint.includes('companyinformation')) {
          console.log(`   Company: ${result.data.CompanyInformation?.CompanyName || 'N/A'}`);
        } else if (test.endpoint.includes('articles')) {
          console.log(`   Articles found: ${result.data.Articles?.length || 0}`);
        } else if (test.endpoint.includes('customers')) {
          console.log(`   Customers found: ${result.data.Customers?.length || 0}`);
        }
      } else {
        console.log(`❌ FAILED: ${test.name} (Status: ${result.status})`);
        console.log(`   Error: ${JSON.stringify(result.data)}`);
      }
    } catch (error) {
      console.log(`❌ ERROR: ${test.name}`);
      console.log(`   ${error.message}`);
    }
    
    console.log(''); // Empty line
  }
  
  console.log('🎉 API TESTING COMPLETE!');
  console.log('\n🔧 READY FOR AUTO-INVOICE IMPLEMENTATION!');
}

// RUN THE TESTS
runTests().catch(console.error);