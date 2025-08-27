import puppeteer from 'puppeteer';

async function checkFormLocation() {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100,
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();
  
  try {
    console.log('🔍 Checking different URLs for the booking form...\n');

    // Try different possible URLs
    const urls = [
      'http://localhost:3000',
      'http://localhost:3000/form',
      'http://localhost:3000/booking',
      'http://localhost:3000/boka'
    ];

    for (const url of urls) {
      console.log(`\n📍 Trying: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 2000));
      
      // Take screenshot
      const filename = `check-url-${url.split('/').pop() || 'root'}.png`;
      await page.screenshot({ path: filename, fullPage: true });
      console.log(`   📸 Screenshot saved: ${filename}`);
      
      // Check page content
      const pageTitle = await page.title();
      console.log(`   📄 Page title: ${pageTitle}`);
      
      // Look for form elements
      const hasPrivateButton = await page.$('button[value="private"]').then(el => !!el);
      const hasFormTag = await page.$('form').then(el => !!el);
      const hasNameInput = await page.$('input[name*="name"]').then(el => !!el);
      
      console.log(`   🔍 Has private button: ${hasPrivateButton ? '✅' : '❌'}`);
      console.log(`   🔍 Has form tag: ${hasFormTag ? '✅' : '❌'}`);
      console.log(`   🔍 Has name input: ${hasNameInput ? '✅' : '❌'}`);
      
      if (hasPrivateButton || hasFormTag) {
        console.log(`   ✨ This looks like the booking form!`);
        
        // Look for specific elements
        const buttons = await page.$$eval('button', elements => 
          elements.map(el => ({ text: el.textContent, value: el.value }))
        );
        console.log(`   🔘 Buttons found:`, buttons.slice(0, 5));
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }

  console.log('\n🔍 Browser will stay open for inspection...');
}

checkFormLocation().catch(console.error);