// VÄXLA NY TOKEN
const AUTH_CODE = "2a3d5208-0690-4a42-a4aa-4dd1802bca90";
const CLIENT_ID = "xvekSW7cqRsf";
const CLIENT_SECRET = "YhfvjemECo";

async function exchangeToken() {
  console.log("🔄 Växlar ny token...\n");
  
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
    console.log("✅ NY TOKEN:");
    console.log("==============");
    console.log(tokenData.access_token);
    console.log("==============");
    return tokenData.access_token;
  } else {
    console.log(`❌ Fel: ${data}`);
  }
}

exchangeToken();