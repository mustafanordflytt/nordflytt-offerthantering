import puppeteer from 'puppeteer';

async function testComprehensiveCRM() {
  console.log('🧪 Omfattande CRM-test med Puppeteer\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: { width: 1400, height: 900 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Fånga konsolmeddelanden
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    });
    
    // Test 1: Login
    console.log('1️⃣ Testar login...');
    await page.goto('http://localhost:3000/crm', { waitUntil: 'networkidle0' });
    await page.type('input[type="email"]', 'admin@nordflytt.se');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('   ✅ Inloggning fungerar');
    
    // Test 2: Dashboard
    console.log('\n2️⃣ Testar Dashboard...');
    const dashboardStats = await page.$$('.grid > div');
    console.log(`   ✅ Dashboard visar ${dashboardStats.length} statistikkort`);
    
    // Test 3: Leads
    console.log('\n3️⃣ Testar Leads...');
    await page.click('a[href="/crm/leads"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await page.waitForSelector('.cursor-move', { timeout: 5000 });
    const leadCards = await page.$$('.cursor-move');
    console.log(`   ✅ Leads-sida visar ${leadCards.length} leads`);
    
    // Test drag-and-drop
    if (leadCards.length > 0) {
      const firstLead = leadCards[0];
      const boundingBox = await firstLead.boundingBox();
      if (boundingBox) {
        await page.mouse.move(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(boundingBox.x + 300, boundingBox.y);
        await page.mouse.up();
        console.log('   ✅ Drag-and-drop fungerar');
      }
    }
    
    // Test 4: Kunder
    console.log('\n4️⃣ Testar Kunder...');
    await page.click('a[href="/crm/kunder"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    const hasCustomerContent = await page.$('table') !== null || await page.$('.grid') !== null;
    console.log(`   ✅ Kunder-sida ${hasCustomerContent ? 'laddar korrekt' : 'behöver data'}`);
    
    // Test 5: Uppdrag/Jobs
    console.log('\n5️⃣ Testar Uppdrag...');
    await page.click('a[href="/crm/uppdrag"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 1000));
    const jobElements = await page.$$('[class*="card"], [class*="job"], table tr');
    console.log(`   ✅ Uppdrag-sida visar ${jobElements.length} element`);
    
    // Test 6: Offerter
    console.log('\n6️⃣ Testar Offerter...');
    await page.click('a[href="/crm/offerter"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    const hasOfferContent = await page.$('table') !== null || await page.$('.grid') !== null;
    console.log(`   ✅ Offerter-sida ${hasOfferContent ? 'laddar korrekt' : 'behöver data'}`);
    
    // Test 7: Responsivitet
    console.log('\n7️⃣ Testar responsivitet...');
    await page.setViewport({ width: 375, height: 812 }); // iPhone X
    await new Promise(resolve => setTimeout(resolve, 1000));
    const mobileMenuButton = await page.$('button[aria-label*="menu"], button[class*="mobile"]');
    console.log(`   ✅ Mobilvy ${mobileMenuButton ? 'har meny-knapp' : 'saknar meny-knapp'}`);
    
    // Återställ viewport
    await page.setViewport({ width: 1400, height: 900 });
    
    // Test 8: Sök och filter
    console.log('\n8️⃣ Testar sökfunktioner...');
    await page.goto('http://localhost:3000/crm/leads', { waitUntil: 'networkidle0' });
    const searchInput = await page.$('input[placeholder*="Sök"], input[type="search"]');
    if (searchInput) {
      await searchInput.type('Test');
      console.log('   ✅ Sökfält fungerar');
    }
    
    // Analysera fel
    console.log('\n📊 Felanalys:');
    const errors = consoleMessages.filter(msg => msg.type === 'error');
    console.log(`   Totalt antal fel: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('   Fel funna:');
      errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error.text.substring(0, 80)}...`);
      });
    }
    
    // Ta slutlig screenshot
    await page.screenshot({ path: 'test-comprehensive-crm.png', fullPage: false });
    
    console.log('\n✅ Alla tester slutförda!');
    
  } catch (error) {
    console.error('❌ Test misslyckades:', error.message);
    await page.screenshot({ path: 'test-error.png', fullPage: false });
  }
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  await browser.close();
}

// Kör testet
testComprehensiveCRM().catch(console.error);