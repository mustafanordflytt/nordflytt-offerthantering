import puppeteer from 'puppeteer';

async function testHardNavigation() {
  console.log('🧪 Testar direkt navigation till Leads\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: { width: 1400, height: 900 } 
  });
  
  try {
    const page = await browser.newPage();
    
    // Logga in först
    console.log('1. Loggar in...');
    await page.goto('http://localhost:3000/crm', { waitUntil: 'networkidle0' });
    await page.type('input[type="email"]', 'admin@nordflytt.se');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('   ✅ Inloggad');
    
    // Navigera direkt till leads URL
    console.log('2. Navigerar direkt till /crm/leads...');
    await page.goto('http://localhost:3000/crm/leads', { waitUntil: 'networkidle0' });
    
    // Vänta på innehåll
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Ta screenshot
    await page.screenshot({ path: 'test-hard-navigation.png', fullPage: true });
    
    // Kolla resultat
    const url = page.url();
    const title = await page.$eval('h1', el => el.textContent).catch(() => 'Ej hittad');
    
    console.log(`\n📍 URL: ${url}`);
    console.log(`📋 Sidtitel: ${title}`);
    
    // Kolla efter leads-specifika element
    const hasKanban = await page.$$('.bg-gray-50').then(els => els.length);
    const hasCards = await page.$$('.cursor-move').then(els => els.length);
    
    console.log(`\n✅ Leads-element:`);
    console.log(`   Kanban-kolumner: ${hasKanban}`);
    console.log(`   Lead-kort: ${hasCards}`);
    
    if (url.includes('/leads') && title === 'Leads') {
      console.log('\n🎉 Direkt navigation fungerar!');
    } else {
      console.log('\n⚠️  Något är fel med routing');
    }
    
  } catch (error) {
    console.error('❌ Fel:', error.message);
  }
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  await browser.close();
}

testHardNavigation().catch(console.error);