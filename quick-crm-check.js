import puppeteer from 'puppeteer';

const quickCheck = async () => {
  console.log('🚀 Quick CRM Check...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  try {
    const page = await browser.newPage();
    
    // First check main CRM page
    console.log('Testing /crm...');
    const response = await page.goto('http://localhost:3000/crm', {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });
    
    if (response && response.ok()) {
      console.log('✅ /crm loaded successfully');
      
      // Take screenshot
      await page.screenshot({ path: 'crm-main-check.png' });
      
      // Check what's on the page
      const pageContent = await page.evaluate(() => {
        return {
          title: document.title,
          bodyText: document.body.innerText.substring(0, 200),
          buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()),
          links: Array.from(document.querySelectorAll('a')).map(a => ({
            text: a.textContent?.trim(),
            href: a.href
          }))
        };
      });
      
      console.log('\nPage content:');
      console.log('Title:', pageContent.title);
      console.log('Body preview:', pageContent.bodyText);
      console.log('\nButtons found:', pageContent.buttons);
      console.log('\nLinks found:');
      pageContent.links.forEach(link => {
        if (link.href.includes('/crm/')) {
          console.log(`  - ${link.text}: ${link.href}`);
        }
      });
      
      // Try dashboard
      console.log('\n\nTesting /crm/dashboard...');
      const dashResponse = await page.goto('http://localhost:3000/crm/dashboard', {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });
      
      if (dashResponse && dashResponse.ok()) {
        console.log('✅ Dashboard loaded');
        await page.screenshot({ path: 'crm-dashboard-check.png' });
      } else {
        console.log('❌ Dashboard failed to load');
      }
      
    } else {
      console.log('❌ /crm failed to load. Status:', response?.status());
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
};

quickCheck().catch(console.error);