import puppeteer from 'puppeteer';

async function testFinalConsoleErrors() {
  console.log('🧪 Testar för konsolfel efter alla fixar\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: { width: 1400, height: 900 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Samla alla konsolmeddelanden
    const consoleMessages = [];
    page.on('console', msg => {
      const msgText = msg.text();
      const msgType = msg.type();
      
      // Ignorera vissa vanliga varningar
      if (msgText.includes('Third-party cookie') || 
          msgText.includes('DevTools') ||
          msgText.includes('[Fast Refresh]') ||
          msgText.includes('React DevTools')) {
        return;
      }
      
      consoleMessages.push({
        type: msgType,
        text: msgText,
        location: msg.location()
      });
      
      if (msgType === 'error') {
        console.log('🔴 Error:', msgText);
      } else if (msgType === 'warning') {
        console.log('🟡 Warning:', msgText);
      }
    });
    
    // Fånga page errors
    page.on('pageerror', error => {
      console.log('🔴 Page error:', error.message);
    });
    
    // Test 1: Navigera till CRM login
    console.log('1. Testar CRM login-sidan...');
    await page.goto('http://localhost:3000/crm', { 
      waitUntil: 'networkidle0',
      timeout: 15000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Logga in
    console.log('2. Loggar in som admin...');
    await page.type('input[type="email"]', 'admin@nordflytt.se');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('   ✅ Inloggad');
    
    // Test 2: Navigera till leads
    console.log('\n3. Testar Leads-sidan...');
    await page.click('a[href="/crm/leads"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 3: Navigera till andra sidor
    console.log('\n4. Testar andra CRM-sidor...');
    const pages = [
      { name: 'Kunder', href: '/crm/kunder' },
      { name: 'Uppdrag', href: '/crm/uppdrag' },
      { name: 'Offerter', href: '/crm/offerter' }
    ];
    
    for (const testPage of pages) {
      console.log(`   Testar ${testPage.name}...`);
      await page.click(`a[href="${testPage.href}"]`);
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Analysera resultat
    console.log('\n📊 Sammanfattning:');
    const errors = consoleMessages.filter(msg => msg.type === 'error');
    const warnings = consoleMessages.filter(msg => msg.type === 'warning');
    
    console.log(`   Totalt antal fel: ${errors.length}`);
    console.log(`   Totalt antal varningar: ${warnings.length}`);
    
    if (errors.length > 0) {
      console.log('\n🔴 Detaljerade fel:');
      errors.forEach((error, i) => {
        console.log(`\n   ${i + 1}. ${error.text}`);
        if (error.location?.url) {
          console.log(`      URL: ${error.location.url}`);
          console.log(`      Rad: ${error.location.lineNumber}`);
        }
      });
    }
    
    // Specifika kontroller
    const webVitalsErrors = errors.filter(e => 
      e.text.includes('web-vitals') || 
      e.text.includes('sendToAnalytics')
    );
    
    const apiErrors = errors.filter(e => 
      e.text.includes('401') || 
      e.text.includes('Unauthorized')
    );
    
    const mapsErrors = warnings.filter(w => 
      w.text.includes('Google Maps') || 
      w.text.includes('InvalidKey')
    );
    
    console.log('\n🎯 Specifika problem:');
    console.log(`   Web Vitals fel: ${webVitalsErrors.length}`);
    console.log(`   API 401 fel: ${apiErrors.length}`);
    console.log(`   Google Maps varningar: ${mapsErrors.length}`);
    
    // Ta screenshot
    await page.screenshot({ path: 'test-final-console-errors.png', fullPage: false });
    
    if (errors.length === 0 && warnings.filter(w => !w.text.includes('Google Maps')).length === 0) {
      console.log('\n✅ Inga kritiska fel hittades!');
    } else {
      console.log('\n⚠️  Det finns fortfarande fel som behöver åtgärdas.');
    }
    
  } catch (error) {
    console.error('❌ Test misslyckades:', error.message);
  }
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  await browser.close();
}

testFinalConsoleErrors().catch(console.error);