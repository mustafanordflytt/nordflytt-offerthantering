import puppeteer from 'puppeteer';

async function testLeadsFixed() {
  console.log('🧪 Testar Leads Module med fixar\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: { width: 1400, height: 900 } 
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigera till CRM
    console.log('1. Navigerar till CRM...');
    await page.goto('http://localhost:3000/crm', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    // Logga in
    console.log('2. Loggar in...');
    await page.type('input[type="email"]', 'admin@nordflytt.se');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Vänta på dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('   ✅ Inloggad');
    
    // Klicka på Leads i sidebar
    console.log('3. Klickar på Leads i sidebar...');
    await page.click('a[href="/crm/leads"]');
    
    // Vänta på navigation
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('   ✅ Navigerade till leads');
    
    // Vänta lite för att låta sidan ladda
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Ta screenshot
    await page.screenshot({ path: 'test-leads-fixed-final.png', fullPage: true });
    console.log('📸 Screenshot sparad');
    
    // Kolla URL
    const currentUrl = page.url();
    console.log(`\n📍 Nuvarande URL: ${currentUrl}`);
    
    // Kolla efter leads-element
    const hasGrid = await page.$('.grid') !== null;
    const leadCards = await page.$$('.cursor-move');
    const kpiCards = await page.$$('[class*="rounded-lg"][class*="p-6"]');
    
    console.log(`\n✅ Resultat:`);
    console.log(`   URL innehåller /leads: ${currentUrl.includes('/leads') ? 'Ja' : 'Nej'}`);
    console.log(`   Grid layout: ${hasGrid ? 'Hittad' : 'Ej hittad'}`);
    console.log(`   Lead cards: ${leadCards.length}`);
    console.log(`   KPI cards: ${kpiCards.length}`);
    
    if (currentUrl.includes('/leads') && (hasGrid || leadCards.length > 0)) {
      console.log('\n🎉 Succé! Leads-modulen fungerar korrekt!');
    }
    
  } catch (error) {
    console.error('❌ Test misslyckades:', error.message);
  }
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  await browser.close();
}

testLeadsFixed().catch(console.error);