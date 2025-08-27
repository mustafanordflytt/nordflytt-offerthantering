const puppeteer = require('puppeteer');

async function testPartnersAndReferrals() {
  console.log('🧪 Testing Partners and Referrals tabs...');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Set up error logging before navigation
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.error('🚨 Console error:', msg.text());
    }
  });
  
  page.on('pageerror', error => {
    console.error('🚨 Page error:', error.message);
  });
  
  try {
    // Navigate to CRM dashboard
    console.log('📍 Navigating to CRM dashboard...');
    await page.goto('http://localhost:3001/crm/dashboard', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if we're on the right page
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);
    
    // Navigate to Samarbeten
    console.log('📍 Navigating to Samarbeten...');
    await page.goto('http://localhost:3001/crm/samarbeten', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot of initial state
    await page.screenshot({path: 'samarbeten-initial.png'});
    console.log('📸 Screenshot saved: samarbeten-initial.png');
    
    // Check if page loaded correctly
    const pageTitle = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.textContent : null;
    });
    
    console.log('📄 Page title:', pageTitle);
    
    if (pageTitle !== 'Samarbeten') {
      console.error('❌ Page did not load correctly');
      throw new Error('Page title incorrect');
    }
    
    // Wait for tabs to be visible
    console.log('🔍 Looking for tabs...');
    await page.waitForSelector('[role="tablist"]', { timeout: 10000 });
    
    // Wait a bit to catch any async errors
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (consoleErrors.length > 0) {
      console.log('📋 Console errors found:', consoleErrors);
    }
    
    // Test Partners tab
    console.log('🧪 Testing Partners tab...');
    
    // Debug: Check what tabs are available
    const tabsHTML = await page.evaluate(() => {
      const tabsList = document.querySelector('[role="tablist"]');
      return tabsList ? tabsList.innerHTML : 'No tabs found';
    });
    console.log('🔍 Available tabs HTML:', tabsHTML.substring(0, 500));
    
    // Check for tabs with text content
    const tabsWithText = await page.evaluate(() => {
      const tabs = document.querySelectorAll('[role="tab"]');
      return Array.from(tabs).map(tab => ({
        text: tab.textContent,
        value: tab.getAttribute('value'),
        'data-value': tab.getAttribute('data-value'),
        'data-state': tab.getAttribute('data-state')
      }));
    });
    console.log('📋 Found tabs:', tabsWithText);
    
    // Click on Partners tab by text content
    const partnersTabExists = await page.evaluate(() => {
      const tabs = document.querySelectorAll('[role="tab"]');
      const partnersTab = Array.from(tabs).find(tab => tab.textContent.includes('Partners'));
      if (partnersTab) {
        partnersTab.click();
        return true;
      }
      return false;
    });
    
    if (partnersTabExists) {
      console.log('✅ Clicked Partners tab');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Take screenshot after clicking Partners tab
      await page.screenshot({path: 'partners-tab-clicked.png'});
      console.log('📸 Screenshot saved: partners-tab-clicked.png');
      
      // Check for any JavaScript errors
      const partnersErrors = await page.evaluate(() => {
        const errors = [];
        // Check for error messages on page
        const errorElements = document.querySelectorAll('.error, .text-red-500, .text-red-600, .text-red-700, .text-red-800');
        errorElements.forEach(el => errors.push(el.textContent));
        return errors;
      });
      
      if (partnersErrors.length > 0) {
        console.error('❌ Partners tab errors:', partnersErrors);
      }
      
      // Check if PartnersManager component loaded
      const partnersContent = await page.evaluate(() => {
        // Check for Partners tab content
        const tabContent = document.querySelector('[data-state="active"]');
        if (tabContent) {
          const hasPartnersContent = tabContent.innerHTML.includes('Partners') || 
                                    tabContent.innerHTML.includes('PartnersManager') ||
                                    tabContent.innerHTML.includes('Ny partner');
          return {
            hasContent: hasPartnersContent,
            preview: tabContent.innerHTML.substring(0, 200),
            length: tabContent.innerHTML.length
          };
        }
        return null;
      });
      
      console.log('📄 Partners tab content:', partnersContent);
      
    } else {
      console.error('❌ Partners tab not found');
    }
    
    // Test Referrals tab
    console.log('🧪 Testing Referrals tab...');
    
    // Click on Referrals tab by text content
    const referralsTabExists = await page.evaluate(() => {
      const tabs = document.querySelectorAll('[role="tab"]');
      const referralsTab = Array.from(tabs).find(tab => tab.textContent.includes('Referrals'));
      if (referralsTab) {
        referralsTab.click();
        return true;
      }
      return false;
    });
    
    if (referralsTabExists) {
      console.log('✅ Clicked Referrals tab');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Take screenshot after clicking Referrals tab
      await page.screenshot({path: 'referrals-tab-clicked.png'});
      console.log('📸 Screenshot saved: referrals-tab-clicked.png');
      
      // Check for any JavaScript errors
      const referralsErrors = await page.evaluate(() => {
        const errors = [];
        // Check for error messages on page
        const errorElements = document.querySelectorAll('.error, .text-red-500, .text-red-600, .text-red-700, .text-red-800');
        errorElements.forEach(el => errors.push(el.textContent));
        return errors;
      });
      
      if (referralsErrors.length > 0) {
        console.error('❌ Referrals tab errors:', referralsErrors);
      }
      
      // Check if ReferralsManager component loaded
      const referralsContent = await page.evaluate(() => {
        // Check for Referrals tab content
        const tabContent = document.querySelector('[data-state="active"]');
        if (tabContent) {
          const hasReferralsContent = tabContent.innerHTML.includes('Referrals') || 
                                     tabContent.innerHTML.includes('ReferralsManager') ||
                                     tabContent.innerHTML.includes('Totala Referrals');
          return {
            hasContent: hasReferralsContent,
            preview: tabContent.innerHTML.substring(0, 200),
            length: tabContent.innerHTML.length
          };
        }
        return null;
      });
      
      console.log('📄 Referrals tab content:', referralsContent);
      
    } else {
      console.error('❌ Referrals tab not found');
    }
    
    // Error listeners already set up at the beginning
    
    // Check for missing components
    console.log('🔍 Checking for missing components...');
    
    const missingComponents = await page.evaluate(() => {
      const components = [];
      
      // Check if PartnersManager exists
      const partnersManager = document.querySelector('PartnersManager');
      if (!partnersManager) {
        components.push('PartnersManager component not found');
      }
      
      // Check if ReferralsManager exists
      const referralsManager = document.querySelector('ReferralsManager');
      if (!referralsManager) {
        components.push('ReferralsManager component not found');
      }
      
      return components;
    });
    
    if (missingComponents.length > 0) {
      console.error('❌ Missing components:', missingComponents);
    }
    
    // Take final screenshot
    await page.screenshot({path: 'partners-referrals-final.png'});
    console.log('📸 Final screenshot saved: partners-referrals-final.png');
    
    console.log('✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Take error screenshot
    await page.screenshot({path: 'partners-referrals-error.png'});
    console.log('📸 Error screenshot saved: partners-referrals-error.png');
    
    // Log current page content for debugging
    const pageContent = await page.content();
    console.log('📄 Page content length:', pageContent.length);
    
    // Check if server is running
    try {
      const response = await page.goto('http://localhost:3001', { timeout: 5000 });
      console.log('🌐 Server response status:', response.status());
    } catch (serverError) {
      console.error('❌ Server not running:', serverError.message);
    }
    
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
if (require.main === module) {
  testPartnersAndReferrals()
    .then(() => {
      console.log('🎉 All tests completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = testPartnersAndReferrals;