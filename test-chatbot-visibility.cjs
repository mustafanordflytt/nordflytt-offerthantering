const puppeteer = require('puppeteer');

async function testChatbotVisibility() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null 
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    if (msg.text().includes('offer') || msg.text().includes('ChatWidget')) {
      console.log('Console:', msg.text());
    }
  });
  
  try {
    console.log('1. Navigating to offer page...');
    await page.goto('http://localhost:3000/offer/d863008b-ef23-49d1-823b-16f50bfe6979', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check what's on the page
    const pageContent = await page.evaluate(() => {
      // Check for various states
      const loadingElement = document.querySelector('.animate-spin');
      const errorElement = document.querySelector('.text-red-600');
      const offerNotFound = document.querySelector('h2')?.textContent?.includes('hittades inte');
      const orderConfirmation = document.querySelector('p')?.textContent?.includes('orderbekräftelse');
      const rejectedOffer = document.querySelector('h2')?.textContent?.includes('avvisad');
      
      // Check for main content
      const mainHeading = document.querySelector('h1')?.textContent;
      const hasOfferContent = mainHeading?.includes('Vi har ett förslag');
      
      // Check for chat widget
      const chatBubble = document.querySelector('button.rounded-full.w-16.h-16');
      const chatWidget = document.querySelector('[class*="ChatWidget"]');
      
      return {
        state: {
          loading: !!loadingElement,
          error: !!errorElement,
          offerNotFound: !!offerNotFound,
          orderConfirmation: !!orderConfirmation,
          rejectedOffer: !!rejectedOffer,
          hasMainContent: hasOfferContent
        },
        chatbot: {
          hasChatBubble: !!chatBubble,
          hasChatWidget: !!chatWidget
        },
        mainHeading: mainHeading,
        bodyClasses: document.body.className
      };
    });
    
    console.log('2. Page state:', JSON.stringify(pageContent, null, 2));
    
    // Try to find chat widget in different ways
    const chatButtonSelectors = [
      'button.rounded-full.w-16.h-16',
      'button[class*="rounded-full"]',
      '[class*="MessageCircle"]',
      'button:has(svg)',
      '.fixed.bottom-24.right-6'
    ];
    
    console.log('3. Searching for chat widget with different selectors...');
    for (const selector of chatButtonSelectors) {
      const element = await page.$(selector);
      if (element) {
        console.log(`   ✓ Found element with selector: ${selector}`);
        const info = await element.evaluate(el => ({
          tagName: el.tagName,
          className: el.className,
          position: window.getComputedStyle(el).position,
          bottom: window.getComputedStyle(el).bottom,
          right: window.getComputedStyle(el).right,
          display: window.getComputedStyle(el).display,
          visibility: window.getComputedStyle(el).visibility
        }));
        console.log('     Info:', info);
      }
    }
    
    // Take screenshot
    await page.screenshot({ path: 'chatbot-visibility-test.png', fullPage: true });
    console.log('4. Screenshot saved as chatbot-visibility-test.png');
    
    // Check if ChatWidget component is imported
    const pageSource = await page.content();
    const hasImport = pageSource.includes('ChatWidget');
    console.log('5. ChatWidget in page source:', hasImport);
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'chatbot-visibility-error.png', fullPage: true });
  }
  
  await browser.close();
}

// Run the test
testChatbotVisibility().catch(console.error);