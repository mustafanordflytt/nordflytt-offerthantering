import puppeteer from 'puppeteer';

async function testDetailedProblems() {
  console.log('🔍 Detaljerad problemsökning med Puppeteer\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: { width: 1400, height: 900 },
    args: ['--disable-web-security', '--no-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Samla ALLA konsolmeddelanden
    const allMessages = [];
    page.on('console', msg => {
      const msgType = msg.type();
      const msgText = msg.text();
      
      allMessages.push({
        type: msgType,
        text: msgText,
        location: msg.location(),
        args: msg.args()
      });
      
      // Visa alla fel och varningar direkt
      if (msgType === 'error') {
        console.log('🔴 ERROR:', msgText);
      } else if (msgType === 'warning' && !msgText.includes('Third-party cookie')) {
        console.log('🟡 WARNING:', msgText);
      }
    });
    
    // Fånga page errors
    page.on('pageerror', error => {
      console.log('💥 PAGE ERROR:', error.message);
      console.log('   Stack:', error.stack);
    });
    
    // Fånga response errors
    page.on('response', response => {
      if (!response.ok() && response.url().includes('/api/')) {
        console.log(`🌐 API ERROR: ${response.status()} - ${response.url()}`);
      }
    });
    
    // Fånga failed requests
    page.on('requestfailed', request => {
      console.log('❌ REQUEST FAILED:', request.url());
      console.log('   Failure:', request.failure()?.errorText);
    });
    
    console.log('📍 Steg 1: Navigerar till CRM...\n');
    await page.goto('http://localhost:3000/crm', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    // Vänta lite för att se initial laddning
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n📍 Steg 2: Loggar in...\n');
    await page.type('input[type="email"]', 'admin@nordflytt.se');
    await page.type('input[type="password"]', 'admin123');
    
    // Ta screenshot innan login
    await page.screenshot({ path: 'test-before-login.png' });
    
    await page.click('button[type="submit"]');
    
    // Vänta på navigation eller timeout
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
    } catch (e) {
      console.log('⚠️  Navigation timeout, fortsätter...');
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n📍 Steg 3: Kontrollerar dashboard...\n');
    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);
    
    // Ta screenshot efter login
    await page.screenshot({ path: 'test-after-login.png' });
    
    console.log('\n📍 Steg 4: Navigerar till Leads...\n');
    
    // Försök klicka på leads
    try {
      await page.click('a[href="/crm/leads"]');
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
    } catch (e) {
      console.log('⚠️  Leads navigation problem:', e.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Ta screenshot av leads-sidan
    await page.screenshot({ path: 'test-leads-page.png' });
    
    console.log('\n📊 Detaljerad felrapport:\n');
    
    // Analysera errors
    const errors = allMessages.filter(msg => msg.type === 'error');
    const warnings = allMessages.filter(msg => msg.type === 'warning');
    
    console.log(`Totalt antal errors: ${errors.length}`);
    console.log(`Totalt antal warnings: ${warnings.length}`);
    
    if (errors.length > 0) {
      console.log('\n🔴 Alla errors i detalj:');
      errors.forEach((error, i) => {
        console.log(`\n${i + 1}. ${error.text}`);
        if (error.location?.url) {
          console.log(`   File: ${error.location.url}`);
          console.log(`   Line: ${error.location.lineNumber}:${error.location.columnNumber}`);
        }
      });
    }
    
    // Kolla efter specifika problem
    console.log('\n🎯 Specifika problemkontroller:');
    
    // Web Vitals
    const webVitalsErrors = errors.filter(e => 
      e.text.includes('web-vitals') || 
      e.text.includes('sendToAnalytics') ||
      e.text.includes('rating')
    );
    console.log(`\n1. Web Vitals errors: ${webVitalsErrors.length}`);
    if (webVitalsErrors.length > 0) {
      webVitalsErrors.forEach(e => console.log(`   - ${e.text.substring(0, 100)}...`));
    }
    
    // API errors
    const apiErrors = errors.filter(e => 
      e.text.includes('401') || 
      e.text.includes('Failed to fetch') ||
      e.text.includes('Unauthorized')
    );
    console.log(`\n2. API errors: ${apiErrors.length}`);
    if (apiErrors.length > 0) {
      apiErrors.forEach(e => console.log(`   - ${e.text}`));
    }
    
    // React errors
    const reactErrors = errors.filter(e => 
      e.text.includes('React') || 
      e.text.includes('Component') ||
      e.text.includes('render')
    );
    console.log(`\n3. React errors: ${reactErrors.length}`);
    if (reactErrors.length > 0) {
      reactErrors.forEach(e => console.log(`   - ${e.text.substring(0, 100)}...`));
    }
    
    // Kontrollera sidans tillstånd
    console.log('\n📄 Sidans tillstånd:');
    const title = await page.title();
    console.log(`   Title: ${title}`);
    console.log(`   URL: ${page.url()}`);
    
    // Kontrollera om viktiga element finns
    const hasLeadsContent = await page.$('.grid, .kanban-board, [class*="lead"]') !== null;
    const hasSidebar = await page.$('nav, [class*="sidebar"]') !== null;
    const hasErrorMessage = await page.$('[class*="error"], [class*="Error"]') !== null;
    
    console.log(`   Has leads content: ${hasLeadsContent}`);
    console.log(`   Has sidebar: ${hasSidebar}`);
    console.log(`   Has error message: ${hasErrorMessage}`);
    
    // Kör JavaScript i sidan för att kolla state
    const pageState = await page.evaluate(() => {
      return {
        localStorage: Object.keys(window.localStorage),
        sessionStorage: Object.keys(window.sessionStorage),
        cookies: document.cookie,
        reactDevTools: !!(window.__REACT_DEVTOOLS_GLOBAL_HOOK__),
        errors: window.__errors || []
      };
    });
    
    console.log('\n🔧 Browser state:');
    console.log(`   LocalStorage keys: ${pageState.localStorage.join(', ')}`);
    console.log(`   SessionStorage keys: ${pageState.sessionStorage.join(', ')}`);
    console.log(`   Has cookies: ${pageState.cookies.length > 0}`);
    console.log(`   React DevTools: ${pageState.reactDevTools}`);
    
  } catch (error) {
    console.error('\n💥 Test kraschade:', error);
    console.error('Stack:', error.stack);
  }
  
  console.log('\n✅ Test slutfört. Screenshots sparade:');
  console.log('   - test-before-login.png');
  console.log('   - test-after-login.png');
  console.log('   - test-leads-page.png');
  
  await new Promise(resolve => setTimeout(resolve, 10000));
  await browser.close();
}

testDetailedProblems().catch(console.error);