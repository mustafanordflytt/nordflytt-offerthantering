const puppeteer = require('puppeteer');

async function testChatSimple() {
  console.log('🚀 Starting simple chat test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 375, height: 667 }
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to staff login
    console.log('📱 Navigating to staff login...');
    await page.goto('http://localhost:3001/staff', { waitUntil: 'networkidle2' });
    
    // Take screenshot of login page
    await page.screenshot({ path: 'login-page.png' });
    console.log('📸 Login page screenshot: login-page.png');
    
    // Fill in login credentials
    await page.type('input[type="email"]', 'erik@nordflytt.se');
    await page.type('input[type="password"]', 'demo123');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait and take screenshot of dashboard
    await new Promise(resolve => setTimeout(resolve, 3000));
    await page.screenshot({ path: 'dashboard-after-login.png' });
    console.log('📸 Dashboard screenshot: dashboard-after-login.png');
    
    // Check all buttons
    const buttons = await page.$$('button');
    console.log(`🔍 Found ${buttons.length} buttons total`);
    
    // Check for nav
    const nav = await page.$('nav');
    if (nav) {
      console.log('✅ Navigation found');
      
      // Check nav HTML
      const navHTML = await page.evaluate(el => el.outerHTML, nav);
      console.log('📋 Navigation HTML:');
      console.log(navHTML.substring(0, 500) + '...');
      
      // Look for chat button specifically
      const chatButton = await nav.$('button[class*="absolute"]');
      if (chatButton) {
        console.log('✅ Chat button found in nav!');
        await chatButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.screenshot({ path: 'chat-opened.png' });
        console.log('📸 Chat opened screenshot: chat-opened.png');
      } else {
        console.log('❌ Chat button not found in nav');
      }
    } else {
      console.log('❌ Navigation not found');
    }
    
    // Wait for user to see result
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'error-screenshot.png' });
  } finally {
    await browser.close();
  }
}

testChatSimple().catch(console.error);