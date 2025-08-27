const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🚀 Testing profile page directly...');
    
    // Test going directly to the profile page
    await page.goto('http://localhost:3000/crm/anstallda/staff-007');
    
    // Wait a bit and check what we get
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check console for errors
    const logs = await page.evaluate(() => {
      return console.log === undefined ? [] : [];
    });
    
    const pageContent = await page.evaluate(() => {
      return {
        hasTabList: !!document.querySelector('[role="tablist"]'),
        hasError: document.body.textContent.includes('Anställd hittades inte'),
        hasName: document.body.textContent.includes('Profile Test Person'),
        bodyLength: document.body.textContent.length,
        title: document.title,
        hasLoading: document.body.textContent.includes('Laddar'),
        hasReactError: document.body.textContent.includes('Error'),
        innerText: document.body.innerText.slice(0, 200)
      };
    });
    
    console.log('Page content:', pageContent);
    
    if (pageContent.hasError) {
      console.log('❌ Shows error message');
    } else if (pageContent.hasTabList) {
      console.log('✅ Profile loaded with tabs');
    } else {
      console.log('❓ Unknown state');
    }
    
    await page.screenshot({ path: 'simple-profile-test.png' });
    
  } catch (error) {
    console.error('❌ Error:', error);
    await page.screenshot({ path: 'simple-profile-error.png' });
  } finally {
    await browser.close();
  }
})();