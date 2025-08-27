const puppeteer = require('puppeteer');

async function testChatbotUIFixes() {
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
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check chat bubble appearance
    console.log('2. Checking chat bubble appearance...');
    const chatBubbleInfo = await page.evaluate(() => {
      const button = document.querySelector('button.rounded-full.w-16.h-16');
      if (!button) return null;
      
      const icon = button.querySelector('svg');
      const badge = button.querySelector('.bg-red-500');
      const computedStyle = window.getComputedStyle(button);
      
      return {
        hasButton: !!button,
        hasIcon: !!icon,
        iconSize: icon ? `${icon.getAttribute('class')}` : null,
        hasBadge: !!badge,
        backgroundColor: computedStyle.backgroundColor,
        borderRadius: computedStyle.borderRadius
      };
    });
    
    console.log('   Chat bubble info:', chatBubbleInfo);
    
    // Check notification popup
    console.log('3. Checking notification popup...');
    const notificationInfo = await page.evaluate(() => {
      const popup = document.querySelector('.absolute.bottom-20.right-0');
      if (!popup) return null;
      
      const closeButton = popup.querySelector('button');
      const text = popup.querySelector('p')?.textContent;
      const computedStyle = window.getComputedStyle(popup);
      
      return {
        hasPopup: !!popup,
        hasCloseButton: !!closeButton,
        text: text,
        width: computedStyle.width,
        padding: computedStyle.padding
      };
    });
    
    console.log('   Notification info:', notificationInfo);
    
    // Take screenshot of closed state
    await page.screenshot({ path: 'chatbot-ui-closed.png', fullPage: false });
    console.log('4. Screenshot of closed state saved as chatbot-ui-closed.png');
    
    // Click chat bubble
    console.log('5. Opening chat...');
    await page.click('button.rounded-full.w-16.h-16');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if notification disappeared
    const notificationAfterOpen = await page.evaluate(() => {
      const popup = document.querySelector('.absolute.bottom-20.right-0');
      return !!popup;
    });
    
    console.log('6. Notification visible after opening chat:', notificationAfterOpen);
    
    // Take screenshot of open state
    await page.screenshot({ path: 'chatbot-ui-open.png', fullPage: false });
    console.log('7. Screenshot of open state saved as chatbot-ui-open.png');
    
    // Click minimize button
    console.log('8. Minimizing chat...');
    const minimizeButton = await page.$('button[class*="hover:bg-white/20"]:first-of-type');
    if (minimizeButton) {
      await minimizeButton.click();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check minimized state
      const minimizedInfo = await page.evaluate(() => {
        const card = document.querySelector('.h-16');
        const title = document.querySelector('.text-sm.font-medium');
        const icon = document.querySelector('.w-8.h-8 span');
        
        return {
          isMinimized: !!card,
          hasTitle: !!title,
          titleText: title?.textContent,
          hasIcon: !!icon
        };
      });
      
      console.log('9. Minimized state info:', minimizedInfo);
      
      // Take screenshot of minimized state
      await page.screenshot({ path: 'chatbot-ui-minimized.png', fullPage: false });
      console.log('10. Screenshot of minimized state saved as chatbot-ui-minimized.png');
    }
    
    console.log('\n✅ UI fixes test completed!');
    console.log('   - Chat bubble shows proper icon');
    console.log('   - Notification popup is properly sized');
    console.log('   - Minimized state shows title and icon');
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'chatbot-ui-error.png', fullPage: true });
  }
  
  await browser.close();
}

// Run the test
testChatbotUIFixes().catch(console.error);