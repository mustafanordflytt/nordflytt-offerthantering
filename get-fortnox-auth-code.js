// FORTNOX AUTHORIZATION - PRODUKTION
const CLIENT_ID = "xvekSW7cqRsf";
const TENANT_ID = "1573825";

console.log('🔐 FORTNOX AUTHORIZATION GUIDE\n');
console.log('=================================\n');

console.log('Du behöver få en authorization code från Fortnox.\n');

console.log('ALTERNATIV 1 - Med nordflytt.se som redirect:');
console.log('============================================');
console.log('URL: https://apps.fortnox.se/oauth-v1/auth?client_id=xvekSW7cqRsf&redirect_uri=https://nordflytt.se&scope=customer+invoice+article+companyinformation&state=production&access_type=offline&response_type=code');
console.log('\nOBS: Efter inloggning kommer du få en URL som ser ut så här:');
console.log('https://nordflytt.se?code=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX&state=production');
console.log('Kopiera "code" värdet!\n');

console.log('\nALTERNATIV 2 - Direkt API-anrop (om du har användarnamn/lösenord):');
console.log('==================================================================');
console.log(`curl -X POST https://api.fortnox.se/3/auth \\
  -H "Content-Type: application/json" \\
  -d '{
    "client_id": "${CLIENT_ID}",
    "client_secret": "YhfvjemECo",
    "grant_type": "password",
    "username": "DITT_ANVÄNDARNAMN",
    "password": "DITT_LÖSENORD",
    "scope": "customer invoice article companyinformation"
  }'`);

console.log('\n\nALTERNATIV 3 - Om du redan är inloggad i Fortnox:');
console.log('================================================');
console.log('1. Gå till: https://apps.fortnox.se/');
console.log('2. Gå till "Inställningar" -> "API-kopplingar"');
console.log('3. Leta efter din app (client_id: xvekSW7cqRsf)');
console.log('4. Klicka "Hantera" och sedan "Förnya token"');

console.log('\n\n📝 När du har fått en authorization code eller token:');
console.log('===================================================');
console.log('Skapa en fil som heter .env.fortnox.production med följande innehåll:');
console.log(`
FORTNOX_CLIENT_ID=${CLIENT_ID}
FORTNOX_CLIENT_SECRET=YhfvjemECo
FORTNOX_TENANT_ID=${TENANT_ID}
FORTNOX_AUTH_CODE=DIN_AUTH_CODE_HÄR
`);

// Skapa en enkel token exchange funktion
const exchangeCode = `
// EXCHANGE AUTH CODE FOR TOKEN
const AUTH_CODE = process.env.FORTNOX_AUTH_CODE || "SÄTT_IN_HÄR";

async function getToken() {
  const response = await fetch("https://apps.fortnox.se/oauth-v1/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: "${CLIENT_ID}",
      client_secret: "YhfvjemECo",
      code: AUTH_CODE,
      redirect_uri: "https://nordflytt.se"
    })
  });

  const result = await response.json();
  
  if (result.access_token) {
    console.log("✅ Access Token:", result.access_token);
    console.log("✅ Refresh Token:", result.refresh_token);
    
    // Spara tokens
    const fs = require('fs');
    fs.appendFileSync('.env.fortnox.production', \`
FORTNOX_ACCESS_TOKEN=\${result.access_token}
FORTNOX_REFRESH_TOKEN=\${result.refresh_token}
\`);
  } else {
    console.log("❌ Error:", result);
  }
}

getToken();
`;

require('fs').writeFileSync('exchange-auth-code.js', exchangeCode);
console.log('\n✅ Skapade exchange-auth-code.js');