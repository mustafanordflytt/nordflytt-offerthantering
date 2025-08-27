import puppeteer from 'puppeteer';

async function testLeadsSimple() {
  console.log('🧪 Testing Leads Module - Simple Test\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: { width: 1200, height: 800 } 
  });
  
  try {
    const page = await browser.newPage();
    
    // Set up error logging
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.log('🔴 Console error:', msg.text());
      }
    });
    
    page.on('pageerror', error => {
      errors.push(error.message);
      console.log('🔴 Page error:', error.message);
    });
    
    // Wait for server
    console.log('1. Waiting for server to be ready...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Navigate directly to leads with mock auth
    console.log('2. Navigating to leads module...');
    
    // Set localStorage to bypass login in test
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('crm_user', JSON.stringify({
        id: 'test-admin',
        email: 'admin@nordflytt.se',
        role: 'admin',
        name: 'Test Admin'
      }));
      localStorage.setItem('crm_token', 'test-token');
    });
    
    await page.goto('http://localhost:3000/crm/leads', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });
    
    // Wait a bit for React to render
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot
    await page.screenshot({ path: 'test-leads-simple-result.png', fullPage: true });
    console.log('📸 Screenshot saved as test-leads-simple-result.png');
    
    // Check if page loaded without React errors
    if (errors.length === 0) {
      console.log('✅ No JavaScript errors detected!');
      
      // Try to find lead elements
      const hasGrid = await page.$('.grid') !== null;
      const hasCards = await page.$('.cursor-move') !== null;
      
      console.log(`✅ Grid layout: ${hasGrid ? 'Found' : 'Not found'}`);
      console.log(`✅ Lead cards: ${hasCards ? 'Found' : 'Not found'}`);
      
    } else {
      console.log(`❌ Found ${errors.length} errors`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  await browser.close();
}

testLeadsSimple().catch(console.error);