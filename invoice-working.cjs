#!/usr/bin/env node
// NORDFLYTT AUTO-INVOICE CREATION - WORKING VERSION

const https = require('https');

// WORKING TOKEN (same as connection-test.cjs)
const ACCESS_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjEsInRlbmFudElkIjoxNzEwOTU2LCJyaWdodHNBc0pzb24iOiJINHNJQUFBQUFBQUFBNDFZNlc3ak9BeCtsXC83ZTVoM1NGRjBFbUowcEpoME1Gb3RGSUV1MG8xcUhvU05wOXVtWE9teExkdEtaSHdVaW5oOHBpcVQ3ejRPQlFSdG5OMDE3dENkOU9ScVErZ3pzZU5hZW5zQWNqYjdZaHo4bU1hR2I1bHFjcFdaZXdKWlNzS1ZZMHhZSDRobDN4Vm5ydHJLb2lsTmZLU3FCcDRadExvWTcrR0hCZk9mZHlkbEU3SXoyUVwvalpibHF1aUtLY2lMK0JtQU00eDFWbkV5dkhrUTdVQUhGZ3VUcHJUb0ZRYWp3UkpZc0lCMmJrSjhaQXJoS1VzNzdyd0RvZTBTS1pFUzZ1anZTeko0b1FRTlRLRWZnTEZcL0NtRDFmclFMNW93ZEJEaGMwaWFIb2lVbnZsc25FUUZXN0xBVDVDVGpJa01LMDJzc0lmUGRXaHgyQXFPMjFBWW9peUxTelMxR2pkMTlCVFFySjY1V3BHeHlYcHNqang3cVFOXC93K0NwUjRnMzR3bFo2anRSbFJyZDZLMUZhQTZ4blZTbjdJYjFOZ2h6ZzU5UTFhdERXSHV1Snh6Vjl4emxSb0RaekJPTktOU0JablNjRGNHcU1ZcUU1ek1aVENGbmN0a1JLQlliYUlNR0VWckwyaEV5OEpvVE5vbjJhaUFCOHNWUVdqYW96elhMSitiVDZMQXV3U1hNWjY0ZGRwY2hlN0dsRkRndzgyYUs0SnpnR1wvUFBXTDJlTXRwTkxwQkxvOVc4YW1YR2RkdEcxRUdjaEZnT0tLOEhCWGlROUtHVGJMSlJFa2hqSlhHWE9PNjhyemlyWXdsUEFVWk0xRnFKYWtjWm11MHZNdk10T1VESEZFV0xnd21tOWdxanZHM3ZEM20rOW1FTnJ6dERFQnNPMXZGM3NCSVc4dWdmMVpUb3Z1ZGxnTlIxNzJLVnhXdW9nQlVDRGNlRGZpZVZncG9rTHBoZForQ3MydHNtZk9hQ3Y3Z2lQTkJDdnY0eHVJQmk0ajNSeXVHVEROZUhiRTRhWlwvUFBSSDRPb2poWGg0N3p4bllXYkJRQ1o3R0kzUm9GR2NSMXFEVktyYWhRRjltUE5EdWRMaktqRVU0a3F3Zzl4UGtJb3dTVW5xMzQ4bVJqK0lVWGlINkdnMHNQSWNVeEpKWjhJXC9ocFMrZDNzaFRrWXlLUEd2akhcL1FFR3hqcE9vV212ME51ZVdzZHdmUTZkdnZ1QzdERTRaUjBONlNtUzAwVCtoaDRkdTFsa1hFOFRoUDYwWVhiSWFuc051T3cySGxzUFJMTVc4SDh0ZGJCRDRQZ3Y2dUYxUnBpUk1qRytlRXgxZDVHa3V1elRpV05hVHU0TkxpSTZqZEI3NHgzdGxjNFhzellucW1XTW9aR1dINXRSWmxsWml6TWJ4ZDFoXC9NRlg0K3lzQ1R2K0puVHIxNDJNV0daTTQydVV2TFZhQVFrdDB4eWhRbEdiTHBRa2JyQlJ6Q2ZpUkM0dzJHT2FKalFwK3NMR2xUNlkySHpJTzBXWnhtKzZOekVaMzZvdm1kdVNTT0FiUmxidzVmRTlPQlMrV2ZTdUNmbUk2NDNibG9TeDlBd3J3WmY4OTUrMVc0YlFBSjcwMTkweDlWUDdrNnZ4Tm9MdHNjRnptb0xIQ09zUUpHQmh4R3l2WGw5ZmVqQ21MYThoT0d4d1k0OFFlc1h2WDNlZVwvbzBTT2FlandTQnljZGhpaGRBWFZhT282c1N3bFFYN1NDWUlSOEdtS2N6SWhTaFdNZktEYmhPWmFtd1FsUjJVb2NwRm9pK0dtV1ZiS0tQMENwV3VVb20xK25Ic3BuMmFRMnBkTzgwMTVYREZlQkV3RytGd2VoM29HNFpOc0laazF6bktrXC9NWlVLcjg3UlFWdFJZWFdGaHI0S3ZGNnNWY054QkJwSGFkTUpMYzFcL0s5MTF1VmlFZnFJTExIeG9ESVlyYlZtekVVUGkrUUpNbjUxUnRqY2M5Q245eTFlaVBEYzRrSHF6Z1Y4ODhJQVRHdGFUbFlaemVXK0RnU3dGc3h2Z01ha0xlRWdKbEduNkp0VFE1dFpsQ08yOThOWEhhRnl0MW1qb2h4NzFqOHJjMmlLTUhsdFlHWERLbmZicmcrSUhwaTByTFI1c2ExcmowVUNNM2tvY25qVjlWdXdnd1JXZXVzVUtuOHA2b2ViZWN6cmtLV3gyYVR2eUduRmpsMTBLbHY5TzJvb1VSc1UwWFlVdjZXREVcL29mbXhMeG1odFBRVm9LVGxtMXpKQm9lRHdWTEJOS1J5TEFHdUE3UjVFRlpBRUREMlJGZFRnK1dWdXd6alZoamhWc1pkTk1qQjRGN2llSVZwUmIwaGNzQ1BLXC82NVNPampKWjhyRzd2NmVNdlRPWTl0M0NjRzRlMjlIcFFhU1h6ME5LMjEybXdZdFwvbnd0Rmg0NzJtYzhWTXpaUHg1MHZ4RW1BeFlTR2Y0WGRzaHNETGlPMEx2dCtHbVR5cVBXY3M5Nnl0Y1FnNlJGWWlQWWNJbUYyTjNFWjJKR1V2aWU0V1BGSlAxcDlhczVDNytnVk1yNGFLUkI5VTNreWZtS0pDN3d5Y1N3TGpiWTJmeml1WEhNeHYzZnhHRmNcL1VaWjJYNGNJUlNiN1hXWnpydU1UZW9GaUJZZitFZ3Fyank1UGpFVDVhNGx4Z2NCT28xQlhsdzJQamZTRjd3TVRVWVdmeWtKYWRWU1M1K0h3VXg4WDhrOVwvZ1NmOGFOK1o2QWxTUk9sNHFmR3U2S3FxeFBqMWFzSjdxNE84QVpXUW5IUWt2RStIK3I1YTZaZG15WWx1U0hmXC84SGg0U0lERXNVQUFBPSIsInJpZ2h0cyI6Ikg0c0lBQUFBQUFBQUE0dFd5azdUeTh3cnk4OU1UbFhTQVhIeThpdGdcL0ZnQUptc0tZUjRBQUFBPSIsImFwcHNTZXJ2ZXJIb3N0IjoiYXBwczUuZm9ydG5veC5zZSIsInNlbmRJbnZvaWNlQWNjZXNzIjp0cnVlLCJjbGllbnRJZCI6Inh2ZWtTVzdjcVJzZiIsInNjb3BlcyI6WyJjdXN0b21lciIsImludm9pY2UiLCJhcnRpY2xlIiwiY29tcGFueWluZm9ybWF0aW9uIl0sImF1dGhzb3VyY2UiOiJPQVVUSDIiLCJpZCI6ImUwY2U3MjZjZDk4NTJlMDMwNTIwNzYwMDU1ZGQyOTc4YmVkMzNmNmQiLCJqdGkiOiJlMGNlNzI2Y2Q5ODUyZTAzMDUyMDc2MDA1NWRkMjk3OGJlZDMzZjZkIiwiaXNzIjoiaHR0cHM6XC9cL2FwaS5mb3J0bm94LnNlXC9vYXV0aDIiLCJhdWQiOiJ4dmVrU1c3Y3FSc2YiLCJzdWIiOiIxQDE3MTA5NTYiLCJleHAiOjE3NTMzMTQzNzgsImlhdCI6MTc1MzMxMDc3OCwidG9rZW5fdHlwZSI6ImJlYXJlciIsInNjb3BlIjoiY3VzdG9tZXIgaW52b2ljZSBhcnRpY2xlIGNvbXBhbnlpbmZvcm1hdGlvbiJ9.vd-9_NDeYGD6cpokvU0PTFvPHz4TfXbmlf2usQjxI7o";

console.log('🚀 NORDFLYTT AUTO-INVOICE TEST');
console.log('================================');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function createInvoice() {
  console.log('📄 Creating Nordflytt invoice...');
  
  const invoice = {
    Invoice: {
      CustomerNumber: "TEST001",
      InvoiceDate: new Date().toISOString().split('T')[0],
      DueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      Comments: "Nordflytt AI Auto-Invoice Test",
      YourReference: "Test Customer",
      OurReference: "Nordflytt AI",
      InvoiceRows: [
        {
          Description: "Flyttjänst Stockholm",
          Quantity: 1,
          Price: 5000
        },
        {
          Description: "RUT-berättigad städning",
          Quantity: 4,
          Price: 450
        }
      ],
      HouseWork: true,
      HouseWorkType: "RUTARBETE"
    }
  };

  const options = {
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
    const result = await makeRequest(options, invoice);
    console.log('📊 Result:', result.status);
    
    if (result.status === 201) {
      const inv = result.data.Invoice;
      console.log('✅ SUCCESS! Invoice created!');
      console.log(`📋 Number: ${inv.DocumentNumber}`);
      console.log(`💰 Total: ${inv.Total} SEK`);
      console.log(`🏠 RUT: ${inv.HouseWork ? 'YES' : 'NO'}`);
      console.log('🎉 NORDFLYTT AUTO-INVOICE WORKING!');
    } else {
      console.log('❌ Failed:', JSON.stringify(result.data, null, 2));
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

createInvoice();
