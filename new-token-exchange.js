// NEW TOKEN EXCHANGE WITH BETTER OUTPUT
const AUTH_CODE = "a9ffe478-c5fb-45d8-9a7f-0da78c6d4c7e";
const CLIENT_ID = "xvekSW7cqRsf";
const CLIENT_SECRET = "YhfvjemECo";

async function getNewToken() {
  console.log("🔄 NY TOKEN EXCHANGE");
  console.log("====================\n");
  
  const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch("https://apps.fortnox.se/oauth-v1/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: AUTH_CODE,
      redirect_uri: "https://localhost:3000/callback"
    })
  });

  const data = await response.text();
  
  if (response.ok) {
    const tokenData = JSON.parse(data);
    console.log("✅ TOKEN MOTTAGEN!\n");
    console.log("Kopiera denna token till dina scripts:");
    console.log("=====================================");
    console.log(tokenData.access_token);
    console.log("=====================================\n");
    
    // Testa direkt
    console.log("Testar token...");
    const testRes = await fetch("https://api.fortnox.se/3/companyinformation", {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Client-Secret': CLIENT_SECRET
      }
    });
    
    if (testRes.ok) {
      const company = await testRes.json();
      console.log(`✅ Token fungerar! Ansluten till: ${company.CompanyInformation.CompanyName}`);
    } else {
      console.log(`❌ Token fungerar inte: ${await testRes.text()}`);
    }
    
    return tokenData.access_token;
  } else {
    console.log(`❌ Token exchange misslyckades: ${data}`);
  }
}

getNewToken();