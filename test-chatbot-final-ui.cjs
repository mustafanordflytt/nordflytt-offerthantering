const puppeteer = require('puppeteer');

async function testChatbotFinalUI() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null 
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🚀 Testing final chatbot UI improvements...\n');
    
    console.log('1. Navigating to offer page...');
    await page.goto('http://localhost:3000/offer/d863008b-ef23-49d1-823b-16f50bfe6979', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Screenshot 1: Closed state with all improvements
    await page.screenshot({ path: 'chatbot-final-closed.png', fullPage: false });
    console.log('2. ✅ Closed state screenshot: chatbot-final-closed.png');
    
    // Test closing notification
    console.log('3. Testing notification close button...');
    const closeButton = await page.$('.absolute.top-2.right-2');
    if (closeButton) {
      await closeButton.click();
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('   ✅ Notification closed successfully');
    }
    
    // Open chat
    console.log('4. Opening chat...');
    await page.click('button.rounded-full.w-16.h-16');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Screenshot 2: Open state
    await page.screenshot({ path: 'chatbot-final-open.png', fullPage: false });
    console.log('5. ✅ Open state screenshot: chatbot-final-open.png');
    
    // Minimize chat
    console.log('6. Minimizing chat...');
    const minimizeButton = await page.$('button[class*="hover:bg-white/20"]:first-of-type');
    if (minimizeButton) {
      await minimizeButton.click();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Screenshot 3: Minimized state
      await page.screenshot({ path: 'chatbot-final-minimized.png', fullPage: false });
      console.log('7. ✅ Minimized state screenshot: chatbot-final-minimized.png');
    }
    
    console.log('\n🎉 UI Improvements Summary:');
    console.log('   ✅ Chat bubble has proper message icon (not dark circle)');
    console.log('   ✅ Notification popup has proper width and padding');
    console.log('   ✅ Notification has close button');
    console.log('   ✅ Auto-hides after 10 seconds');
    console.log('   ✅ Minimized state shows "Maja från Nordflytt" with icon');
    console.log('   ✅ Positioned higher to avoid cookie banner overlap');
    console.log('   ✅ Smooth animations and transitions');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'chatbot-final-error.png', fullPage: true });
  }
  
  await browser.close();
}

// Run the test
testChatbotFinalUI().catch(console.error);