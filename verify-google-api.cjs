const puppeteer = require('puppeteer');

async function verifyGoogleAPI() {
  console.log('🔍 Verifying Google Maps API setup...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  // Capture console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Google') || text.includes('Maps') || text.includes('API')) {
      console.log(`Browser: ${text}`);
    }
  });
  
  try {
    console.log('1️⃣ Navigating to debug page...');
    await page.goto('http://localhost:3000/debug-autocomplete', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    await new Promise(r => setTimeout(r, 3000));
    
    // Check Google Maps status
    const apiStatus = await page.evaluate(() => {
      return {
        google: typeof window.google !== 'undefined',
        maps: typeof window.google?.maps !== 'undefined',
        places: typeof window.google?.maps?.places !== 'undefined',
        autocomplete: typeof window.google?.maps?.places?.Autocomplete !== 'undefined'
      };
    });
    
    console.log('\n📊 API Status:');
    console.log(`   Google object: ${apiStatus.google ? '✅' : '❌'}`);
    console.log(`   Maps API: ${apiStatus.maps ? '✅' : '❌'}`);
    console.log(`   Places API: ${apiStatus.places ? '✅' : '❌'}`);
    console.log(`   Autocomplete: ${apiStatus.autocomplete ? '✅' : '❌'}`);
    
    if (apiStatus.places) {
      console.log('\n2️⃣ Testing autocomplete...');
      
      // Try to type in the input
      await page.click('input[type="text"]');
      await page.keyboard.type('Kungsgatan', { delay: 100 });
      
      await new Promise(r => setTimeout(r, 2000));
      
      // Check for pac-container
      const pacContainer = await page.evaluate(() => {
        const containers = document.querySelectorAll('.pac-container');
        return {
          found: containers.length > 0,
          visible: Array.from(containers).some(c => {
            const style = window.getComputedStyle(c);
            return style.display !== 'none' && style.visibility !== 'hidden';
          })
        };
      });
      
      console.log(`\n📍 Autocomplete dropdown:`);
      console.log(`   Found: ${pacContainer.found ? '✅' : '❌'}`);
      console.log(`   Visible: ${pacContainer.visible ? '✅' : '❌'}`);
      
      await page.screenshot({ path: 'google-api-test.png', fullPage: true });
      console.log('\n📸 Screenshot saved as google-api-test.png');
    }
    
    // Check for errors
    const errors = await page.evaluate(() => {
      return window.__errors || [];
    });
    
    if (errors.length > 0) {
      console.log('\n⚠️ Errors found:');
      errors.forEach(err => console.log(`   - ${err}`));
    }
    
    console.log('\n✅ Test complete!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    await new Promise(r => setTimeout(r, 3000));
    await browser.close();
  }
}

// Inject error capture
async function injectErrorCapture(page) {
  await page.evaluateOnNewDocument(() => {
    window.__errors = [];
    window.addEventListener('error', (e) => {
      window.__errors.push(e.message);
    });
  });
}

verifyGoogleAPI().catch(console.error);