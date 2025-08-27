const puppeteer = require('puppeteer');

async function debugAdditionalServices() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    devtools: true 
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    console.log('Browser console:', msg.text());
  });
  
  try {
    console.log('1. Navigating to offer page...');
    await page.goto('http://localhost:3000/offer/d863008b-ef23-49d1-823b-16f50bfe6979', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Wait a bit for React to render
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Debug: Check what data is in the offer object
    const offerData = await page.evaluate(() => {
      // Try to find React fiber to get component props
      const findReactProps = (element) => {
        const key = Object.keys(element).find(key => key.startsWith('__reactFiber$'));
        if (key) {
          let fiber = element[key];
          while (fiber) {
            if (fiber.memoizedProps) {
              return fiber.memoizedProps;
            }
            fiber = fiber.return;
          }
        }
        return null;
      };
      
      // Find PriceCTASection component
      const priceSections = document.querySelectorAll('[class*="bg-white"][class*="rounded-xl"]');
      let props = null;
      
      for (const section of priceSections) {
        const reactProps = findReactProps(section);
        if (reactProps) {
          props = reactProps;
          break;
        }
      }
      
      // Also try to get data from window if available
      const windowData = window.__OFFER_DATA__ || null;
      
      return {
        reactProps: props,
        windowData: windowData,
        // Check localStorage
        localStorage: {
          offer: localStorage.getItem('offer'),
          quoteData: localStorage.getItem('quoteData')
        }
      };
    });
    
    console.log('2. Debug data:', JSON.stringify(offerData, null, 2));
    
    // Try to inject some console logs
    await page.evaluate(() => {
      console.log('Page loaded, checking for offer data...');
      
      // Find all elements with text content
      const elements = document.querySelectorAll('*');
      for (const el of elements) {
        if (el.textContent && el.textContent.includes('Demontering')) {
          console.log('Found element with Demontering:', el);
        }
      }
    });
    
    // Check API response
    const responses = [];
    page.on('response', response => {
      if (response.url().includes('api/quote-requests')) {
        responses.push({
          url: response.url(),
          status: response.status()
        });
      }
    });
    
    // Reload to capture API calls
    console.log('3. Reloading page to capture API calls...');
    await page.reload({ waitUntil: 'networkidle0' });
    
    console.log('4. API responses:', responses);
    
    // Check the actual offer data from the API
    const apiData = await page.evaluate(async () => {
      try {
        const offerId = window.location.pathname.split('/').pop();
        const response = await fetch(`/api/quote-requests/${offerId}`);
        const data = await response.json();
        return data;
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('5. API data:', JSON.stringify(apiData, null, 2));
    
    // Take a screenshot
    await page.screenshot({ path: 'debug-additional-services.png', fullPage: true });
    console.log('6. Screenshot saved');
    
  } catch (error) {
    console.error('Debug failed:', error);
  }
  
  // Keep browser open for manual inspection
  console.log('\n⚠️  Browser will stay open for manual inspection. Close it manually when done.');
}

// Run the debug
debugAdditionalServices().catch(console.error);