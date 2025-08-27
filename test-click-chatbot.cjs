const puppeteer = require('puppeteer');

async function testClickChatbot() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null 
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('1. Navigating to offer page...');
    await page.goto('http://localhost:3000/offer/d863008b-ef23-49d1-823b-16f50bfe6979', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Find and click the chat button
    console.log('2. Looking for chat button...');
    
    // Try to find the fixed positioned div first
    const chatContainer = await page.$('.fixed.bottom-24.right-6');
    if (chatContainer) {
      console.log('   ✓ Found chat container');
      
      // Get button info
      const buttonInfo = await page.evaluate(() => {
        const container = document.querySelector('.fixed.bottom-24.right-6');
        const button = container?.querySelector('button');
        const svg = button?.querySelector('svg');
        
        if (button) {
          const rect = button.getBoundingClientRect();
          return {
            found: true,
            position: {
              top: rect.top,
              left: rect.left,
              bottom: rect.bottom,
              right: rect.right,
              width: rect.width,
              height: rect.height
            },
            hasIcon: !!svg,
            iconClass: svg?.getAttribute('class'),
            backgroundColor: window.getComputedStyle(button).backgroundColor
          };
        }
        return { found: false };
      });
      
      console.log('3. Button info:', JSON.stringify(buttonInfo, null, 2));
      
      if (buttonInfo.found) {
        // Click the button
        console.log('4. Clicking chat button...');
        await page.click('.fixed.bottom-24.right-6 button');
        
        // Wait for chat to open
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Check if chat opened
        const chatOpen = await page.evaluate(() => {
          const chatWidget = document.querySelector('.w-96'); // Chat width when open
          const header = document.querySelector('.bg-gradient-to-r.from-\\[\\#667eea\\].to-\\[\\#764ba2\\]');
          return {
            isOpen: !!chatWidget,
            hasHeader: !!header,
            headerText: header?.querySelector('.text-lg')?.textContent
          };
        });
        
        console.log('5. Chat state after click:', chatOpen);
        
        // Take screenshot
        await page.screenshot({ path: 'chatbot-opened-state.png', fullPage: false });
        console.log('6. Screenshot saved as chatbot-opened-state.png');
      }
    } else {
      console.log('   ✗ Chat container not found');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'chatbot-click-error.png', fullPage: true });
  }
  
  await browser.close();
}

// Run the test
testClickChatbot().catch(console.error);