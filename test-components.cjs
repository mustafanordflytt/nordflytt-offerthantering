const puppeteer = require('puppeteer');

async function testComponents() {
  console.log('🧪 Testing individual components...');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Set up error logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('🚨 Console error:', msg.text());
    }
  });
  
  page.on('pageerror', error => {
    console.error('🚨 Page error:', error.message);
  });
  
  try {
    // Navigate to samarbeten page
    console.log('📍 Navigating to Samarbeten...');
    await page.goto('http://localhost:3000/crm/samarbeten', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check initial state
    console.log('🔍 Initial state check...');
    await page.screenshot({path: 'component-test-initial.png'});
    
    // Check if tabs are present
    const tabs = await page.evaluate(() => {
      const tabButtons = document.querySelectorAll('[role="tab"]');
      return Array.from(tabButtons).map(tab => ({
        text: tab.textContent,
        state: tab.getAttribute('data-state')
      }));
    });
    
    console.log('📋 Found tabs:', tabs);
    
    // Click Partners tab with explicit wait
    console.log('🔄 Clicking Partners tab...');
    await page.evaluate(() => {
      const tabs = document.querySelectorAll('[role="tab"]');
      const partnersTab = Array.from(tabs).find(tab => tab.textContent.includes('Partners'));
      if (partnersTab) {
        partnersTab.click();
      }
    });
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check tab state after click
    const tabsAfterClick = await page.evaluate(() => {
      const tabButtons = document.querySelectorAll('[role="tab"]');
      return Array.from(tabButtons).map(tab => ({
        text: tab.textContent,
        state: tab.getAttribute('data-state')
      }));
    });
    
    console.log('📋 Tabs after Partners click:', tabsAfterClick);
    
    // Take screenshot after clicking
    await page.screenshot({path: 'component-test-partners-clicked.png'});
    
    // Check if Partners content is visible
    const partnersVisible = await page.evaluate(() => {
      // Look for tab content with data-state="active"
      const activeTab = document.querySelector('[data-state="active"][role="tabpanel"]');
      if (activeTab) {
        const text = activeTab.textContent || '';
        return {
          hasPartnersContent: text.includes('Partners') || text.includes('Ny partner') || text.includes('Hantera'),
          contentLength: text.length,
          preview: text.substring(0, 200)
        };
      }
      return { hasPartnersContent: false, contentLength: 0, preview: 'No active tab found' };
    });
    
    console.log('📄 Partners content check:', partnersVisible);
    
    // Try clicking Referrals tab
    console.log('🔄 Clicking Referrals tab...');
    await page.evaluate(() => {
      const tabs = document.querySelectorAll('[role="tab"]');
      const referralsTab = Array.from(tabs).find(tab => tab.textContent.includes('Referrals'));
      if (referralsTab) {
        referralsTab.click();
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check Referrals content
    const referralsVisible = await page.evaluate(() => {
      const activeTab = document.querySelector('[data-state="active"][role="tabpanel"]');
      if (activeTab) {
        const text = activeTab.textContent || '';
        return {
          hasReferralsContent: text.includes('Referrals') || text.includes('Totala Referrals') || text.includes('Konverteringsgrad'),
          contentLength: text.length,
          preview: text.substring(0, 200)
        };
      }
      return { hasReferralsContent: false, contentLength: 0, preview: 'No active tab found' };
    });
    
    console.log('📄 Referrals content check:', referralsVisible);
    
    await page.screenshot({path: 'component-test-referrals-clicked.png'});
    
    // Check for specific component elements
    const componentElements = await page.evaluate(() => {
      return {
        partnersManagerFound: document.querySelector('[data-testid="partners-manager"]') !== null,
        referralsManagerFound: document.querySelector('[data-testid="referrals-manager"]') !== null,
        hasPartnersText: document.body.innerHTML.includes('Ny partner'),
        hasReferralsText: document.body.innerHTML.includes('Totala Referrals'),
        totalBodyLength: document.body.innerHTML.length
      };
    });
    
    console.log('🔍 Component elements check:', componentElements);
    
    console.log('✅ Component test completed');
    
  } catch (error) {
    console.error('❌ Component test failed:', error.message);
    await page.screenshot({path: 'component-test-error.png'});
  } finally {
    await browser.close();
  }
}

// Run the test
testComponents()
  .then(() => {
    console.log('🎉 Component test finished');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Component test suite failed:', error);
    process.exit(1);
  });