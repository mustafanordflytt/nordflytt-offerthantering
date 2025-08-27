const puppeteer = require('puppeteer');

// Comprehensive CRM test with all modules and user flows
const CRM_MODULES = [
  { name: 'Dashboard', path: '/crm/dashboard' },
  { name: 'Kunder', path: '/crm/kunder' },
  { name: 'Leads', path: '/crm/leads' },
  { name: 'Uppdrag', path: '/crm/uppdrag' },
  { name: 'Offerter', path: '/crm/offerter' },
  { name: 'Anställda', path: '/crm/anstallda' },
  { name: 'Automation', path: '/crm/automation' }
];

// Test different user workflows
const USER_FLOWS = [
  {
    name: 'Customer to Job Flow',
    steps: [
      { action: 'navigate', path: '/crm/kunder' },
      { action: 'click', selector: 'button:has-text("Ny Kund")', description: 'Create new customer' },
      { action: 'waitForSelector', selector: 'input[name="name"]' },
      { action: 'type', selector: 'input[name="name"]', text: 'Test Customer' },
      { action: 'type', selector: 'input[name="email"]', text: 'test@example.com' },
      { action: 'type', selector: 'input[name="phone"]', text: '070-123 45 67' },
      { action: 'click', selector: 'button[type="submit"]' },
      { action: 'click', selector: 'button:has-text("Nytt uppdrag")' }
    ]
  },
  {
    name: 'Lead Conversion Flow',
    steps: [
      { action: 'navigate', path: '/crm/leads' },
      { action: 'click', selector: 'button:has-text("Ny Lead")' },
      { action: 'waitForSelector', selector: 'input[name="name"]' },
      { action: 'type', selector: 'input[name="name"]', text: 'Hot Lead' },
      { action: 'click', selector: 'button:has-text("Konvertera")' }
    ]
  },
  {
    name: 'Quote Creation Flow',
    steps: [
      { action: 'navigate', path: '/crm/offerter' },
      { action: 'click', selector: 'button:has-text("Skapa ny offert")' },
      { action: 'waitForSelector', selector: 'div[role="dialog"]' },
      { action: 'type', selector: 'input[name="title"]', text: 'Test Offert' },
      { action: 'click', selector: 'button:has-text("Spara")' }
    ]
  }
];

async function runComprehensiveTest() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  const results = {
    timestamp: new Date().toISOString(),
    modules: [],
    userFlows: [],
    errors: [],
    performance: []
  };

  try {
    // Test 1: Module Loading Performance
    console.log('🔍 Testing module loading performance...\n');
    
    for (const module of CRM_MODULES) {
      console.log(`Testing ${module.name}...`);
      const startTime = Date.now();
      
      try {
        await page.goto(`http://localhost:3000${module.path}`, {
          waitUntil: 'networkidle0',
          timeout: 10000
        });
        
        const loadTime = Date.now() - startTime;
        
        // Count interactive elements
        const elements = await page.evaluate(() => {
          const buttons = document.querySelectorAll('button').length;
          const links = document.querySelectorAll('a').length;
          const inputs = document.querySelectorAll('input, select, textarea').length;
          const tables = document.querySelectorAll('table').length;
          const cards = document.querySelectorAll('[class*="card"]').length;
          
          return { buttons, links, inputs, tables, cards };
        });
        
        results.modules.push({
          name: module.name,
          path: module.path,
          loadTime,
          status: 'success',
          elements
        });
        
        console.log(`✅ ${module.name} loaded in ${loadTime}ms`);
        console.log(`   Elements: ${elements.buttons} buttons, ${elements.inputs} inputs, ${elements.tables} tables\n`);
        
      } catch (error) {
        results.modules.push({
          name: module.name,
          path: module.path,
          status: 'error',
          error: error.message
        });
        results.errors.push({
          module: module.name,
          error: error.message
        });
        console.log(`❌ ${module.name} failed: ${error.message}\n`);
      }
      
      await new Promise(r => setTimeout(r, 1000));
    }
    
    // Test 2: User Flows
    console.log('\n🔄 Testing user workflows...\n');
    
    for (const flow of USER_FLOWS) {
      console.log(`Testing flow: ${flow.name}`);
      const flowResult = {
        name: flow.name,
        steps: [],
        status: 'success'
      };
      
      for (const step of flow.steps) {
        try {
          switch (step.action) {
            case 'navigate':
              await page.goto(`http://localhost:3000${step.path}`, {
                waitUntil: 'networkidle0'
              });
              flowResult.steps.push({ ...step, status: 'success' });
              break;
              
            case 'click':
              await page.waitForSelector(step.selector, { timeout: 5000 });
              await page.click(step.selector);
              flowResult.steps.push({ ...step, status: 'success' });
              break;
              
            case 'type':
              await page.type(step.selector, step.text);
              flowResult.steps.push({ ...step, status: 'success' });
              break;
              
            case 'waitForSelector':
              await page.waitForSelector(step.selector, { timeout: 5000 });
              flowResult.steps.push({ ...step, status: 'success' });
              break;
          }
          
          await new Promise(r => setTimeout(r, 500));
          
        } catch (error) {
          flowResult.steps.push({ 
            ...step, 
            status: 'error',
            error: error.message 
          });
          flowResult.status = 'partial';
          console.log(`  ⚠️ Step failed: ${step.description || step.action}`);
        }
      }
      
      results.userFlows.push(flowResult);
      console.log(`${flowResult.status === 'success' ? '✅' : '⚠️'} Flow completed\n`);
    }
    
    // Test 3: Performance Metrics
    console.log('\n📊 Collecting performance metrics...\n');
    
    // Test dashboard refresh speed
    await page.goto('http://localhost:3000/crm/dashboard');
    const refreshButton = await page.$('button:has-text("Uppdatera")');
    if (refreshButton) {
      const startRefresh = Date.now();
      await refreshButton.click();
      await page.waitForLoadState('networkidle');
      const refreshTime = Date.now() - startRefresh;
      
      results.performance.push({
        metric: 'Dashboard Refresh',
        value: refreshTime,
        unit: 'ms'
      });
      console.log(`Dashboard refresh: ${refreshTime}ms`);
    }
    
    // Generate summary report
    const summary = {
      totalModules: results.modules.length,
      successfulModules: results.modules.filter(m => m.status === 'success').length,
      averageLoadTime: Math.round(
        results.modules
          .filter(m => m.loadTime)
          .reduce((sum, m) => sum + m.loadTime, 0) / 
        results.modules.filter(m => m.loadTime).length
      ),
      totalUserFlows: results.userFlows.length,
      successfulFlows: results.userFlows.filter(f => f.status === 'success').length,
      totalErrors: results.errors.length
    };
    
    // Print summary
    console.log('\n📋 TEST SUMMARY');
    console.log('================');
    console.log(`✅ Modules: ${summary.successfulModules}/${summary.totalModules}`);
    console.log(`⏱️  Average load time: ${summary.averageLoadTime}ms`);
    console.log(`✅ User flows: ${summary.successfulFlows}/${summary.totalUserFlows}`);
    console.log(`❌ Errors: ${summary.totalErrors}`);
    
    // Save detailed report
    const fs = require('fs');
    fs.writeFileSync(
      'CRM-COMPREHENSIVE-TEST-REPORT.json',
      JSON.stringify({ ...results, summary }, null, 2)
    );
    
    console.log('\n💾 Full report saved to CRM-COMPREHENSIVE-TEST-REPORT.json');
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
runComprehensiveTest().catch(console.error);