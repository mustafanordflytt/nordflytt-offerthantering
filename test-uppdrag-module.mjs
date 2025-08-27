import puppeteer from 'puppeteer';

async function testUppdragModule() {
  console.log('🔍 Testar Uppdrag-modulen\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: { width: 1400, height: 900 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Samla fel
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Logga in
    console.log('1. Loggar in...');
    await page.goto('http://localhost:3000/crm', { waitUntil: 'networkidle0' });
    await page.type('input[type="email"]', 'admin@nordflytt.se');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    // Navigera till Uppdrag
    console.log('2. Navigerar till Uppdrag...');
    await page.click('a[href="/crm/uppdrag"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Ta screenshot
    await page.screenshot({ path: 'uppdrag-module-overview.png', fullPage: true });
    
    // Analysera sidan
    const pageAnalysis = await page.evaluate(() => {
      const title = document.querySelector('h1')?.textContent;
      const cards = document.querySelectorAll('.grid > div');
      const table = document.querySelector('table');
      const jobCards = document.querySelectorAll('[class*="job"], [class*="uppdrag"]');
      const buttons = Array.from(document.querySelectorAll('button')).map(btn => btn.textContent?.trim());
      const filters = document.querySelectorAll('select, input[type="search"]');
      
      return {
        title,
        hasCards: cards.length > 0,
        cardCount: cards.length,
        hasTable: !!table,
        jobElements: jobCards.length,
        buttons: buttons.filter(Boolean),
        filterCount: filters.length,
        // Försök hitta specifika element
        hasCalendarView: !!document.querySelector('[class*="calendar"]'),
        hasListView: !!document.querySelector('[class*="list"], table'),
        hasMapView: !!document.querySelector('[class*="map"]'),
        hasKanban: !!document.querySelector('[class*="kanban"], [class*="board"]')
      };
    });
    
    console.log('\n📊 Sidanalys:');
    console.log(`   Titel: ${pageAnalysis.title}`);
    console.log(`   Kort/Cards: ${pageAnalysis.cardCount}`);
    console.log(`   Tabell: ${pageAnalysis.hasTable ? 'Ja' : 'Nej'}`);
    console.log(`   Jobbelement: ${pageAnalysis.jobElements}`);
    console.log(`   Filter: ${pageAnalysis.filterCount}`);
    console.log(`   Knappar: ${pageAnalysis.buttons.join(', ')}`);
    
    console.log('\n🎯 Vylägen:');
    console.log(`   Kalender: ${pageAnalysis.hasCalendarView ? '✅' : '❌'}`);
    console.log(`   Lista: ${pageAnalysis.hasListView ? '✅' : '❌'}`);
    console.log(`   Karta: ${pageAnalysis.hasMapView ? '✅' : '❌'}`);
    console.log(`   Kanban: ${pageAnalysis.hasKanban ? '✅' : '❌'}`);
    
    // Kolla efter specifika funktioner
    console.log('\n🔧 Funktionalitet:');
    
    // Test: Sök
    const searchInput = await page.$('input[type="search"], input[placeholder*="Sök"]');
    console.log(`   Sökfunktion: ${searchInput ? '✅' : '❌'}`);
    
    // Test: Status-filter
    const statusFilter = await page.$('select');
    console.log(`   Statusfilter: ${statusFilter ? '✅' : '❌'}`);
    
    // Test: Datum-filter
    const dateInputs = await page.$$('input[type="date"]');
    console.log(`   Datumfilter: ${dateInputs.length > 0 ? '✅' : '❌'}`);
    
    // Test: Actions på jobb
    const actionButtons = await page.$$('button[class*="action"], button[aria-label]');
    console.log(`   Action-knappar: ${actionButtons.length > 0 ? '✅' : '❌'}`);
    
    // API-anrop
    const apiCalls = await page.evaluate(() => {
      return window.performance.getEntriesByType('resource')
        .filter(r => r.name.includes('/api/crm/jobs'))
        .map(r => ({ 
          url: r.name, 
          duration: Math.round(r.duration),
          status: r.responseStatus 
        }));
    });
    
    console.log('\n🌐 API-anrop:');
    apiCalls.forEach(call => {
      console.log(`   ${call.url.split('/').pop()} - ${call.duration}ms`);
    });
    
    // Kontrollera fel
    console.log('\n❗ Fel:');
    if (errors.length === 0) {
      console.log('   ✅ Inga JavaScript-fel');
    } else {
      errors.forEach(err => console.log(`   ❌ ${err}`));
    }
    
    // Rekommendationer
    console.log('\n💡 Rekommendationer för Uppdrag-modulen:');
    if (!pageAnalysis.hasCalendarView) {
      console.log('   - Lägg till kalendervy för schemaläggning');
    }
    if (!pageAnalysis.hasMapView) {
      console.log('   - Lägg till kartvy för ruttoptimering');
    }
    console.log('   - Implementera jobbstatus-hantering');
    console.log('   - Lägg till personalschemaläggning');
    console.log('   - Implementera tidsrapportering');
    
  } catch (error) {
    console.error('❌ Test misslyckades:', error.message);
  }
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  await browser.close();
}

testUppdragModule().catch(console.error);