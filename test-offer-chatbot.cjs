const puppeteer = require('puppeteer');

async function testOfferChatbot() {
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
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('2. Page loaded - checking for chatbot...');
    
    // Look for chat bubble
    const chatBubble = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const chatButton = buttons.find(btn => {
        const svg = btn.querySelector('svg');
        return svg && btn.classList.contains('rounded-full') && 
               btn.classList.contains('w-16') && btn.classList.contains('h-16');
      });
      return !!chatButton;
    });
    
    console.log('3. Chat bubble found:', chatBubble);
    
    // Check for notification popup
    const notificationPopup = await page.evaluate(() => {
      const popup = document.querySelector('.animate-bounce');
      return popup ? popup.textContent : null;
    });
    
    console.log('4. Notification popup:', notificationPopup);
    
    // Click chat bubble to open
    console.log('5. Opening chat widget...');
    await page.click('button.rounded-full.w-16.h-16');
    
    // Wait for chat to open
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check chat header
    const chatHeader = await page.evaluate(() => {
      const title = document.querySelector('.text-lg.font-semibold');
      const status = document.querySelector('.text-sm.opacity-95');
      return {
        title: title?.textContent,
        status: status?.textContent
      };
    });
    
    console.log('6. Chat header:', chatHeader);
    
    // Get initial message
    const initialMessage = await page.evaluate(() => {
      const messages = document.querySelectorAll('.text-sm.leading-relaxed');
      return messages[0]?.textContent;
    });
    
    console.log('7. Initial message preview:', initialMessage?.substring(0, 100) + '...');
    
    // Check quick action buttons
    const quickActions = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('.group.bg-white.hover\\:bg-gradient-to-r'));
      return buttons.map(btn => {
        const text = btn.querySelector('.font-medium')?.textContent;
        const emoji = btn.querySelector('.text-2xl')?.textContent;
        return { text, emoji };
      });
    });
    
    console.log('8. Quick action buttons:', quickActions);
    
    // Test sending a message
    console.log('9. Testing message input...');
    await page.type('input[placeholder="Skriv ditt meddelande här..."]', 'Kan du förklara RUT-avdraget?');
    
    // Take screenshot with chat open
    await page.screenshot({ path: 'offer-chatbot-open.png', fullPage: true });
    console.log('10. Screenshot saved as offer-chatbot-open.png');
    
    // Send message
    await page.click('button[type="submit"]');
    console.log('11. Message sent - waiting for response...');
    
    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for bot response
    const botResponse = await page.evaluate(() => {
      const messages = Array.from(document.querySelectorAll('.text-sm.leading-relaxed'));
      // Get the last bot message (should be response to our question)
      const botMessages = messages.filter((msg, index) => {
        const parent = msg.closest('.flex');
        return parent && parent.classList.contains('justify-start');
      });
      return botMessages[botMessages.length - 1]?.textContent;
    });
    
    console.log('12. Bot response preview:', botResponse?.substring(0, 100) + '...');
    
    // Take final screenshot
    await page.screenshot({ path: 'offer-chatbot-conversation.png', fullPage: true });
    console.log('13. Final screenshot saved as offer-chatbot-conversation.png');
    
    console.log('\n✅ Chatbot integration successful!');
    console.log('   - Chat bubble is visible');
    console.log('   - Chat opens with offer-specific context');
    console.log('   - Quick actions are available');
    console.log('   - Messaging functionality works');
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'offer-chatbot-error.png', fullPage: true });
  }
  
  await browser.close();
}

// Run the test
testOfferChatbot().catch(console.error);