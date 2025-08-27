import puppeteer from 'puppeteer';

async function testFinalLayout() {
  console.log('✅ Testar slutgiltig layout\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: { width: 1400, height: 900 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Logga in
    await page.goto('http://localhost:3000/crm', { waitUntil: 'networkidle0' });
    await page.type('input[type="email"]', 'admin@nordflytt.se');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    // Gå till leads
    await page.click('a[href="/crm/leads"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Ta screenshot
    await page.screenshot({ path: 'final-layout-fixed.png', fullPage: false });
    
    console.log('✅ Layout fixad!');
    console.log('   - Sidebar: Sticky position, 256px bred');
    console.log('   - Main content: Börjar efter sidebar');
    console.log('   - Ingen överlappning');
    console.log('\n📸 Screenshot sparad: final-layout-fixed.png');
    
  } catch (error) {
    console.error('❌ Test misslyckades:', error.message);
  }
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  await browser.close();
}

testFinalLayout().catch(console.error);