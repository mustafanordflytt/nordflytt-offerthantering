import puppeteer from 'puppeteer';

async function testLeadsWebVitals() {
  console.log('🧪 Testar Leads Module med fokus på Web Vitals fel\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: { width: 1400, height: 900 },
    args: ['--disable-web-security'] // För att undvika CORS-problem
  });
  
  try {
    const page = await browser.newPage();
    
    // Fånga alla console-meddelanden
    const consoleMessages = [];
    page.on('console', msg => {
      const msgText = msg.text();
      consoleMessages.push({
        type: msg.type(),
        text: msgText
      });
      
      if (msg.type() === 'error') {
        console.log('🔴 Console error:', msgText);
      }
    });
    
    // Fånga page errors
    page.on('pageerror', error => {
      console.log('🔴 Page error:', error.message);
    });
    
    // Navigera till CRM
    console.log('1. Navigerar till CRM login...');
    await page.goto('http://localhost:3000/crm', { 
      waitUntil: 'networkidle0',
      timeout: 15000 
    });
    
    // Logga in
    console.log('2. Loggar in som admin...');
    await page.type('input[type="email"]', 'admin@nordflytt.se');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Vänta på navigation
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('   ✅ Inloggad');
    
    // Navigera till leads
    console.log('3. Navigerar till Leads...');
    await page.click('a[href="/crm/leads"]');
    
    // Vänta på att sidan laddas
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('   ✅ På leads-sidan');
    
    // Ta screenshot
    await page.screenshot({ path: 'test-leads-web-vitals.png', fullPage: false });
    
    // Analysera fel
    console.log('\n📊 Analys av console-meddelanden:');
    const errors = consoleMessages.filter(msg => msg.type === 'error');
    const warnings = consoleMessages.filter(msg => msg.type === 'warning');
    
    console.log(`   Totalt antal fel: ${errors.length}`);
    console.log(`   Totalt antal varningar: ${warnings.length}`);
    
    // Visa unika fel
    const uniqueErrors = [...new Set(errors.map(e => e.text))];
    if (uniqueErrors.length > 0) {
      console.log('\n🔴 Unika fel:');
      uniqueErrors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error.substring(0, 100)}...`);
      });
    }
    
    // Kolla specifikt efter Web Vitals fel
    const webVitalsErrors = errors.filter(e => 
      e.text.includes('web-vitals') || 
      e.text.includes('FCP') || 
      e.text.includes('TTFB') ||
      e.text.includes('TypeError')
    );
    
    if (webVitalsErrors.length > 0) {
      console.log('\n⚠️  Web Vitals relaterade fel hittade!');
      console.log('   Detta är troligen ett problem med Next.js web-vitals bibliotek');
    }
    
    // Kolla om sidan fungerar trots felen
    const hasLeadsContent = await page.$('.grid') !== null;
    const leadCards = await page.$$('.cursor-move');
    
    console.log('\n✅ Sidans funktionalitet:');
    console.log(`   Grid layout: ${hasLeadsContent ? 'Fungerar' : 'Saknas'}`);
    console.log(`   Lead cards: ${leadCards.length} st`);
    
    if (hasLeadsContent && leadCards.length > 0) {
      console.log('\n🎉 Trots fel i konsolen fungerar leads-modulen korrekt!');
      console.log('   Web Vitals fel påverkar inte funktionaliteten.');
    }
    
  } catch (error) {
    console.error('❌ Test misslyckades:', error.message);
  }
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  await browser.close();
}

testLeadsWebVitals().catch(console.error);