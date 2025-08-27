import puppeteer from 'puppeteer';

async function performComprehensiveAudit() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  const page = await browser.newPage();
  
  const results = {
    critical: [],
    high: [],
    medium: [],
    low: [],
    info: []
  };
  
  // Monitor console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      results.high.push(`Console Error: ${msg.text()}`);
    }
  });
  
  // Monitor page errors
  page.on('pageerror', error => {
    results.critical.push(`Page Error: ${error.message}`);
  });
  
  // Monitor failed requests
  page.on('requestfailed', request => {
    if (!request.url().includes('_next/webpack-hmr')) {
      results.high.push(`Failed Request: ${request.url()}`);
    }
  });

  try {
    console.log('🚀 Starting comprehensive form audit...\n');
    
    // === STEG 1: LADDA FORMULÄRET ===
    console.log('📄 Step 1: Loading form...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Vänta på att formuläret laddas
    await page.waitForSelector('form', { timeout: 5000 }).catch(() => {
      results.critical.push('Form element not found on page');
    });
    
    // === STEG 2: KONTROLLERA KUNDTYP-VAL ===
    console.log('👤 Step 2: Testing customer type selection...');
    
    // Leta efter kundtyp-knappar (Privat/Företag)
    const customerTypeButtons = await page.$$('button[role="radio"]');
    if (customerTypeButtons.length === 0) {
      // Alternativ selector
      const radioInputs = await page.$$('input[type="radio"][name="customerType"]');
      if (radioInputs.length === 0) {
        results.critical.push('No customer type selection found');
      } else {
        // Klicka på Privat
        await page.click('label[for="private"]').catch(async () => {
          await page.click('input[value="private"]');
        });
      }
    }
    
    // === STEG 3: KONTAKTINFORMATION ===
    console.log('📝 Step 3: Testing contact information...');
    
    // Försök gå vidare utan att fylla i fält
    const nextButton = await page.$('button[type="submit"]') || await page.$('button:has-text("Nästa")');
    if (nextButton) {
      await nextButton.click();
      await page.waitForTimeout(500);
      
      // Kontrollera valideringsfel
      const errorMessages = await page.$$('.text-red-500, .text-destructive');
      if (errorMessages.length === 0) {
        results.high.push('No validation errors shown for empty required fields');
      }
    }
    
    // Fyll i kontaktformulär
    await page.type('input[name="name"], input[placeholder*="namn" i]', 'Test Testsson');
    await page.type('input[name="email"], input[type="email"]', 'test@test.se');
    await page.type('input[name="phone"], input[type="tel"]', '701234567');
    
    // Gå vidare
    await page.click('button[type="submit"], button:has-text("Nästa")');
    await page.waitForTimeout(1000);
    
    // === STEG 4: FLYTTINFORMATION ===
    console.log('🏠 Step 4: Testing move details...');
    
    // Kontrollera adressfält
    const addressInputs = await page.$$('input[placeholder*="adress" i]');
    if (addressInputs.length < 2) {
      results.critical.push(`Expected 2 address inputs, found ${addressInputs.length}`);
    }
    
    // Testa Google Maps autocomplete
    const googleMapsLoaded = await page.evaluate(() => {
      return typeof google !== 'undefined' && google.maps;
    });
    if (!googleMapsLoaded) {
      results.high.push('Google Maps API not loaded - autocomplete will not work');
    }
    
    // Fyll i adresser
    if (addressInputs.length >= 2) {
      await addressInputs[0].type('Kungsgatan 1, Stockholm');
      await page.waitForTimeout(500);
      await addressInputs[1].type('Drottninggatan 1, Stockholm');
    }
    
    // === STEG 5: BOENDEINFORMATION ===
    console.log('🏢 Step 5: Testing property details...');
    
    // Kontrollera bostadstyp
    const propertySelects = await page.$$('select[name*="PropertyType"]');
    if (propertySelects.length === 0) {
      results.medium.push('Property type selectors not found');
    }
    
    // Kontrollera boarea
    const areaInputs = await page.$$('input[name*="LivingArea"], input[placeholder*="boarea" i]');
    if (areaInputs.length === 0) {
      results.medium.push('Living area inputs not found');
    }
    
    // === STEG 6: TJÄNSTER OCH PRISSÄTTNING ===
    console.log('💰 Step 6: Testing services and pricing...');
    
    // Kontrollera att pris visas
    const priceElements = await page.$$('[class*="price"], [class*="kr"]');
    if (priceElements.length === 0) {
      results.critical.push('No price information displayed');
    }
    
    // Kontrollera tilläggstjänster
    const serviceCheckboxes = await page.$$('input[type="checkbox"]');
    results.info.push(`Found ${serviceCheckboxes.length} additional services`);
    
    // === STEG 7: SAMMANFATTNING ===
    console.log('📋 Step 7: Testing summary...');
    
    // Navigera till sammanfattning om möjligt
    const summaryButton = await page.$('button:has-text("Sammanfattning"), button:has-text("Granska")');
    if (summaryButton) {
      await summaryButton.click();
      await page.waitForTimeout(1000);
      
      // Kontrollera att sammanfattning visas
      const summaryContent = await page.$('.summary, [class*="summary"]');
      if (!summaryContent) {
        results.medium.push('Summary section not properly displayed');
      }
    }
    
    // === STEG 8: RESPONSIV DESIGN ===
    console.log('📱 Step 8: Testing responsive design...');
    
    // Test mobile
    await page.setViewport({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const mobileNav = await page.$('button[type="submit"], button:has-text("Nästa")');
    if (!mobileNav) {
      results.high.push('Navigation broken on mobile view');
    }
    
    // Test tablet
    await page.setViewport({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    // === STEG 9: PRESTANDA ===
    console.log('⚡ Step 9: Checking performance...');
    
    const metrics = await page.metrics();
    if (metrics.JSHeapUsedSize > 50 * 1024 * 1024) {
      results.medium.push(`High memory usage: ${Math.round(metrics.JSHeapUsedSize / 1024 / 1024)}MB`);
    }
    
    // === STEG 10: SÄKERHET ===
    console.log('🔒 Step 10: Security checks...');
    
    const pageContent = await page.content();
    
    // Kontrollera exponerade API-nycklar
    if (pageContent.includes('AIzaSy') && !pageContent.includes('YOUR_API_KEY')) {
      results.critical.push('Google Maps API key exposed in source');
    }
    
    if (pageContent.includes('pk_live_') || pageContent.includes('sk_live_')) {
      results.critical.push('Payment API keys exposed in source');
    }
    
    // Kontrollera Supabase-nycklar
    if (pageContent.includes('supabase') && pageContent.includes('anon')) {
      results.info.push('Supabase anon key found (this is expected)');
    }
    
    // === STEG 11: TILLGÄNGLIGHET ===
    console.log('♿ Step 11: Accessibility checks...');
    
    // Kontrollera labels
    const inputsWithoutLabels = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input:not([type="hidden"])');
      let count = 0;
      inputs.forEach(input => {
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (!label && !input.getAttribute('aria-label')) {
          count++;
        }
      });
      return count;
    });
    
    if (inputsWithoutLabels > 0) {
      results.medium.push(`${inputsWithoutLabels} input fields without proper labels`);
    }
    
    // Kontrollera kontrast (simplified check)
    const lowContrastElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let count = 0;
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        const color = style.color;
        const bgColor = style.backgroundColor;
        // Very basic check - in production use proper contrast calculation
        if (color === 'rgb(200, 200, 200)' || color === 'rgb(220, 220, 220)') {
          count++;
        }
      });
      return count;
    });
    
    if (lowContrastElements > 5) {
      results.low.push('Some elements may have low color contrast');
    }
    
  } catch (error) {
    results.critical.push(`Audit failed: ${error.message}`);
  } finally {
    // === RESULTAT ===
    console.log('\n' + '='.repeat(60));
    console.log('📊 AUDIT RESULTAT - OFFERTFORMULÄR');
    console.log('='.repeat(60));
    
    if (results.critical.length > 0) {
      console.log('\n🔴 KRITISKA (Måste fixas före produktion):');
      results.critical.forEach(item => console.log(`   • ${item}`));
    }
    
    if (results.high.length > 0) {
      console.log('\n🟠 HÖGA (Bör fixas före produktion):');
      results.high.forEach(item => console.log(`   • ${item}`));
    }
    
    if (results.medium.length > 0) {
      console.log('\n🟡 MEDIUM (Fixa om tid finns):');
      results.medium.forEach(item => console.log(`   • ${item}`));
    }
    
    if (results.low.length > 0) {
      console.log('\n🟢 LÅGA (Nice to have):');
      results.low.forEach(item => console.log(`   • ${item}`));
    }
    
    if (results.info.length > 0) {
      console.log('\nℹ️  INFORMATION:');
      results.info.forEach(item => console.log(`   • ${item}`));
    }
    
    const totalIssues = results.critical.length + results.high.length + results.medium.length + results.low.length;
    console.log(`\n📈 SAMMANFATTNING: ${totalIssues} problem hittade`);
    console.log(`   🔴 Kritiska: ${results.critical.length}`);
    console.log(`   🟠 Höga: ${results.high.length}`);
    console.log(`   🟡 Medium: ${results.medium.length}`);
    console.log(`   🟢 Låga: ${results.low.length}`);
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    await browser.close();
  }
}

performComprehensiveAudit();