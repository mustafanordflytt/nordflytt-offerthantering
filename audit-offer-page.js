import puppeteer from 'puppeteer';

async function auditOfferPage() {
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
  
  // Monitor errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      results.high.push(`Console Error: ${msg.text()}`);
    }
  });
  
  page.on('pageerror', error => {
    results.critical.push(`Page Error: ${error.message}`);
  });

  try {
    console.log('🎯 Starting offer page audit...\n');
    
    // Use a test offer ID - you may need to create one first
    const testOfferId = 'test-offer-id';
    
    // === STEG 1: LADDA OFFERTSIDAN ===
    console.log('📄 Loading offer page...');
    await page.goto(`http://localhost:3000/offer/${testOfferId}`, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Check if page loaded correctly
    const pageTitle = await page.title();
    results.info.push(`Page title: ${pageTitle}`);
    
    // === STEG 2: KONTROLLERA LAYOUT OCH INNEHÅLL ===
    console.log('🎨 Checking layout and content...');
    
    // Check for main offer elements
    const offerElements = {
      header: await page.$('h1, h2').catch(() => null),
      priceDisplay: await page.$('[class*="price"], [class*="kr"]').catch(() => null),
      serviceList: await page.$('[class*="service"], [class*="tjänst"]').catch(() => null),
      ctaButton: await page.$('button[class*="primary"], button[class*="book"]').catch(() => null),
      customerInfo: await page.$('[class*="customer"], [class*="kund"]').catch(() => null)
    };
    
    for (const [element, selector] of Object.entries(offerElements)) {
      if (!selector) {
        results.high.push(`Missing ${element} on offer page`);
      }
    }
    
    // === STEG 3: PRISBERÄKNING OCH VISNING ===
    console.log('💰 Checking price calculations...');
    
    // Check if prices are displayed
    const priceElements = await page.$$eval('[class*="kr"]', elements => 
      elements.map(el => el.textContent)
    ).catch(() => []);
    
    if (priceElements.length === 0) {
      results.critical.push('No prices displayed on offer page');
    } else {
      results.info.push(`Found ${priceElements.length} price elements`);
      
      // Check for RUT deduction display
      const hasRutInfo = priceElements.some(price => 
        price.toLowerCase().includes('rut') || price.includes('50%')
      );
      if (!hasRutInfo) {
        results.medium.push('RUT deduction not clearly indicated');
      }
    }
    
    // === STEG 4: INTERAKTIVA ELEMENT ===
    console.log('🖱️ Testing interactive elements...');
    
    // Check "Boka nu" button
    const bookButton = await page.$('button:has-text("Boka"), button:has-text("Book")').catch(async () => {
      return await page.$('button[class*="primary"]');
    });
    
    if (bookButton) {
      const isClickable = await bookButton.isIntersectingViewport();
      if (!isClickable) {
        results.medium.push('Book button not immediately visible');
      }
      
      // Check button size for mobile
      const buttonSize = await bookButton.boundingBox();
      if (buttonSize && buttonSize.height < 44) {
        results.medium.push(`Book button too small for mobile: ${buttonSize.height}px (should be 44px+)`);
      }
    } else {
      results.critical.push('No booking button found');
    }
    
    // Check for service selection/modification
    const serviceCheckboxes = await page.$$('input[type="checkbox"]');
    results.info.push(`Found ${serviceCheckboxes.length} service checkboxes`);
    
    // === STEG 5: KREDITKONTROLL-FLÖDE ===
    console.log('💳 Checking credit check flow...');
    
    // Try clicking book button to see credit check
    if (bookButton) {
      await bookButton.click();
      await page.waitForTimeout(2000);
      
      // Check if credit check modal/form appears
      const creditCheckElements = await page.$('[class*="credit"], [class*="kredit"]');
      if (!creditCheckElements) {
        results.high.push('Credit check flow not triggered or visible');
      }
      
      // Check for BankID integration
      const bankIdButton = await page.$('[class*="bankid"], img[src*="bankid"]');
      if (!bankIdButton) {
        results.medium.push('BankID integration not visible');
      }
    }
    
    // === STEG 6: CHATWIDGET ===
    console.log('💬 Checking ChatWidget...');
    
    const chatWidget = await page.$('#chat-widget-container, [class*="chat"]');
    if (!chatWidget) {
      results.medium.push('ChatWidget not found on page');
    } else {
      // Check if chat button is visible and clickable
      const chatButton = await page.$('#chat-widget-container button');
      if (chatButton) {
        const isVisible = await chatButton.isIntersectingViewport();
        if (!isVisible) {
          results.low.push('Chat button not visible in viewport');
        }
      }
    }
    
    // === STEG 7: PDF-GENERERING ===
    console.log('📄 Checking PDF generation...');
    
    const pdfButton = await page.$('button:has-text("PDF"), button:has-text("Ladda ner")');
    if (!pdfButton) {
      results.medium.push('No PDF download option found');
    }
    
    // === STEG 8: RESPONSIV DESIGN ===
    console.log('📱 Testing responsive design...');
    
    // Test mobile view
    await page.setViewport({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Check if content reflows properly
    const mobileBookButton = await page.$('button[class*="primary"]');
    if (mobileBookButton) {
      const mobileButtonSize = await mobileBookButton.boundingBox();
      if (mobileButtonSize && mobileButtonSize.width < 200) {
        results.medium.push('Book button might be too narrow on mobile');
      }
    }
    
    // Check horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    if (hasHorizontalScroll) {
      results.high.push('Horizontal scroll detected on mobile');
    }
    
    // === STEG 9: DATA INTEGRITET ===
    console.log('🔒 Checking data integrity...');
    
    // Check if customer data is displayed
    const customerData = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasName: text.includes('Test') || text.includes('Kund'),
        hasEmail: text.includes('@'),
        hasPhone: text.includes('+46') || /\d{10}/.test(text),
        hasAddress: text.includes('gatan') || text.includes('vägen')
      };
    });
    
    if (!customerData.hasName) {
      results.high.push('Customer name not displayed');
    }
    if (!customerData.hasAddress) {
      results.high.push('Move addresses not displayed');
    }
    
    // === STEG 10: PERFORMANCE ===
    console.log('⚡ Checking performance...');
    
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        loadTime: navigation.loadEventEnd - navigation.fetchStart,
        domReady: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0
      };
    });
    
    if (performanceMetrics.loadTime > 3000) {
      results.medium.push(`Slow load time: ${Math.round(performanceMetrics.loadTime)}ms`);
    }
    
    // === STEG 11: SÄKERHET ===
    console.log('🔐 Security checks...');
    
    // Check for exposed sensitive data
    const pageContent = await page.content();
    
    if (pageContent.includes('process.env')) {
      results.critical.push('Environment variables might be exposed');
    }
    
    // Check if offer ID is properly validated
    if (testOfferId === 'test-offer-id' && !pageContent.includes('404') && !pageContent.includes('error')) {
      results.info.push('Offer page loads even with test ID - might need validation');
    }
    
  } catch (error) {
    results.critical.push(`Audit failed: ${error.message}`);
  } finally {
    // === RESULTAT ===
    console.log('\n' + '='.repeat(60));
    console.log('📊 AUDIT RESULTAT - OFFERTVISARE');
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

auditOfferPage();