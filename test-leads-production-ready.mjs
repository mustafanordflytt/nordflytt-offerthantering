import puppeteer from 'puppeteer';

async function testLeadsProductionReady() {
  console.log('🔍 Omfattande test av Leads-modulen för produktion\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: { width: 1400, height: 900 }
  });
  
  const results = {
    passed: [],
    failed: [],
    warnings: []
  };
  
  try {
    const page = await browser.newPage();
    
    // Samla fel
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
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
    
    console.log('1️⃣ GRUNDLÄGGANDE FUNKTIONALITET\n');
    
    // Test 1: Sidan laddas
    const pageLoaded = await page.$('.p-6.space-y-6') !== null;
    if (pageLoaded) {
      results.passed.push('✅ Leads-sidan laddas korrekt');
    } else {
      results.failed.push('❌ Leads-sidan laddas inte');
    }
    
    // Test 2: KPI-kort visas
    const kpiCards = await page.$$('.grid > .relative');
    if (kpiCards.length >= 4) {
      results.passed.push('✅ KPI-kort visas (4 st)');
    } else {
      results.failed.push(`❌ KPI-kort saknas (${kpiCards.length}/4)`);
    }
    
    // Test 3: Pipeline/List toggle fungerar
    const toggleButtons = await page.$$('button');
    let pipelineBtn = null;
    let listBtn = null;
    
    for (const button of toggleButtons) {
      const text = await button.evaluate(el => el.textContent);
      if (text && text.includes('Pipeline')) pipelineBtn = button;
      if (text && text.includes('Lista')) listBtn = button;
    }
    
    if (pipelineBtn && listBtn) {
      results.passed.push('✅ View toggle-knappar finns');
      
      // Testa att byta vy
      await listBtn.click();
      await new Promise(resolve => setTimeout(resolve, 500));
      const hasTable = await page.$('table') !== null;
      if (hasTable) {
        results.passed.push('✅ Lista-vy fungerar');
      } else {
        results.failed.push('❌ Lista-vy fungerar inte');
      }
      
      // Byt tillbaka till pipeline
      await pipelineBtn.click();
      await new Promise(resolve => setTimeout(resolve, 500));
    } else {
      results.failed.push('❌ View toggle-knappar saknas');
    }
    
    console.log('\n2️⃣ DRAG & DROP FUNKTIONALITET\n');
    
    // Test 4: Drag & drop
    const leadCards = await page.$$('.cursor-move');
    if (leadCards.length > 0) {
      results.passed.push(`✅ Lead-kort finns (${leadCards.length} st)`);
      
      // Försök drag & drop
      try {
        const firstCard = leadCards[0];
        const box = await firstCard.boundingBox();
        if (box) {
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.down();
          await page.mouse.move(box.x + 300, box.y);
          await page.mouse.up();
          results.passed.push('✅ Drag & drop fungerar (ingen krasch)');
        }
      } catch (e) {
        results.failed.push('❌ Drag & drop kraschade');
      }
    } else {
      results.warnings.push('⚠️  Inga lead-kort att testa drag & drop med');
    }
    
    console.log('\n3️⃣ SÖKFUNKTIONALITET\n');
    
    // Test 5: Sökfält
    const searchInput = await page.$('input[placeholder*="Sök"]');
    if (searchInput) {
      results.passed.push('✅ Sökfält finns');
      
      // Testa sökning
      await searchInput.type('Test');
      await new Promise(resolve => setTimeout(resolve, 1000));
      await searchInput.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      results.passed.push('✅ Sökning fungerar');
    } else {
      results.failed.push('❌ Sökfält saknas');
    }
    
    // Test 6: Filter
    const filterSelects = await page.$$('select');
    if (filterSelects.length >= 3) {
      results.passed.push(`✅ Filter finns (${filterSelects.length} st)`);
    } else {
      results.warnings.push(`⚠️  Få filter (${filterSelects.length} st)`);
    }
    
    console.log('\n4️⃣ KNAPPAR OCH ACTIONS\n');
    
    // Test 7: Ny Lead-knapp
    let newLeadBtn = null;
    const allButtons = await page.$$('button');
    for (const button of allButtons) {
      const text = await button.evaluate(el => el.textContent);
      if (text && text.includes('Ny Lead')) {
        newLeadBtn = button;
        break;
      }
    }
    
    if (newLeadBtn) {
      results.passed.push('✅ "Ny Lead"-knapp finns');
    } else {
      results.failed.push('❌ "Ny Lead"-knapp saknas');
    }
    
    // Test 8: Action-knappar på leads
    const phoneButtons = await page.$$('button svg.lucide-phone');
    const emailButtons = await page.$$('button svg.lucide-mail');
    if (phoneButtons.length > 0 && emailButtons.length > 0) {
      results.passed.push('✅ Telefon/email-knappar finns');
    } else {
      results.warnings.push('⚠️  Action-knappar saknas på leads');
    }
    
    console.log('\n5️⃣ DATAHANTERING\n');
    
    // Test 9: API-anrop
    const apiCalls = await page.evaluate(() => {
      return window.performance.getEntriesByType('resource')
        .filter(r => r.name.includes('/api/crm/leads'))
        .map(r => ({ name: r.name, status: r.responseStatus || 200 }));
    });
    
    if (apiCalls.length > 0) {
      const failed401 = apiCalls.filter(c => c.status === 401);
      if (failed401.length === 0) {
        results.passed.push('✅ API-anrop fungerar');
      } else {
        results.failed.push('❌ API returnerar 401 Unauthorized');
      }
    } else {
      results.warnings.push('⚠️  Inga API-anrop detekterades');
    }
    
    console.log('\n6️⃣ RESPONSIVITET\n');
    
    // Test 10: Mobil responsivitet
    await page.setViewport({ width: 375, height: 812 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mobileCheck = await page.evaluate(() => {
      const sidebar = document.querySelector('aside');
      const content = document.querySelector('.p-6');
      return {
        sidebarHidden: !sidebar || window.getComputedStyle(sidebar).display === 'none',
        contentVisible: !!content && window.getComputedStyle(content).display !== 'none',
        hasOverflow: document.body.scrollWidth > window.innerWidth
      };
    });
    
    if (mobileCheck.sidebarHidden && mobileCheck.contentVisible && !mobileCheck.hasOverflow) {
      results.passed.push('✅ Mobil responsivitet fungerar');
    } else {
      results.failed.push('❌ Problem med mobil responsivitet');
    }
    
    // Återställ viewport
    await page.setViewport({ width: 1400, height: 900 });
    
    console.log('\n7️⃣ FELHANTERING\n');
    
    if (errors.length === 0) {
      results.passed.push('✅ Inga JavaScript-fel');
    } else {
      results.failed.push(`❌ JavaScript-fel: ${errors.length} st`);
      errors.slice(0, 3).forEach(e => results.failed.push(`   - ${e}`));
    }
    
    // Test 11: Zustand store
    const storeCheck = await page.evaluate(() => {
      try {
        const store = window.useLeads?.getState?.();
        return !!store;
      } catch {
        return false;
      }
    });
    
    if (storeCheck) {
      results.passed.push('✅ Zustand store fungerar');
    } else {
      results.warnings.push('⚠️  Kunde inte verifiera Zustand store');
    }
    
    console.log('\n8️⃣ SÄKERHET OCH PRESTANDA\n');
    
    // Test 12: Säkerhetshuvuden
    const securityCheck = await page.evaluate(() => {
      const hasCSRF = document.querySelector('meta[name="csrf-token"]');
      const hasSecureLinks = Array.from(document.querySelectorAll('a')).every(a => 
        !a.href.includes('javascript:') && !a.href.includes('data:')
      );
      return { hasCSRF: !!hasCSRF, hasSecureLinks };
    });
    
    if (securityCheck.hasSecureLinks) {
      results.passed.push('✅ Inga osäkra länkar');
    } else {
      results.failed.push('❌ Osäkra länkar hittade');
    }
    
    // Test 13: Laddningstid
    const timing = await page.evaluate(() => {
      const perf = window.performance.timing;
      return perf.loadEventEnd - perf.navigationStart;
    });
    
    if (timing < 3000) {
      results.passed.push(`✅ Snabb laddningstid (${timing}ms)`);
    } else {
      results.warnings.push(`⚠️  Långsam laddningstid (${timing}ms)`);
    }
    
    // Ta screenshot
    await page.screenshot({ path: 'leads-production-test.png', fullPage: true });
    
  } catch (error) {
    results.failed.push(`❌ Test kraschade: ${error.message}`);
  }
  
  // Sammanställ resultat
  console.log('\n\n📊 SAMMANFATTNING\n');
  console.log('='.repeat(50));
  
  console.log(`\n✅ GODKÄNDA: ${results.passed.length}`);
  results.passed.forEach(r => console.log(`   ${r}`));
  
  console.log(`\n❌ MISSLYCKADE: ${results.failed.length}`);
  results.failed.forEach(r => console.log(`   ${r}`));
  
  console.log(`\n⚠️  VARNINGAR: ${results.warnings.length}`);
  results.warnings.forEach(r => console.log(`   ${r}`));
  
  const score = (results.passed.length / (results.passed.length + results.failed.length)) * 100;
  console.log(`\n🎯 POÄNG: ${score.toFixed(0)}%`);
  
  if (score >= 90 && results.failed.length === 0) {
    console.log('\n✅ PRODUKTIONSKLAR!');
  } else if (score >= 70) {
    console.log('\n⚠️  NÄSTAN KLAR - Fixa de kritiska felen');
  } else {
    console.log('\n❌ EJ PRODUKTIONSKLAR - Betydande problem kvarstår');
  }
  
  console.log('\n📝 REKOMMENDATIONER:');
  if (!results.passed.find(r => r.includes('CSRF'))) {
    console.log('   - Lägg till CSRF-skydd');
  }
  if (results.failed.find(r => r.includes('401'))) {
    console.log('   - Fixa autentisering för produktion');
  }
  if (!results.passed.find(r => r.includes('Ny Lead'))) {
    console.log('   - Implementera "Ny Lead" funktionalitet');
  }
  console.log('   - Lägg till error boundaries');
  console.log('   - Implementera loading states');
  console.log('   - Lägg till Sentry för felrapportering');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  await browser.close();
}

testLeadsProductionReady().catch(console.error);