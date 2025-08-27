const puppeteer = require('puppeteer');

(async () => {
  console.log('🧪 Testar ChatWidget på orderbekräftelsesidan...');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Navigera till orderbekräftelsesidan
    console.log('📱 Navigerar till orderbekräftelsesidan...');
    await page.goto('http://localhost:3000/order-confirmation/7a34f656-c868-4c9c-96fa-9dc3242e3c7c', {
      waitUntil: 'networkidle2'
    });
    
    // Vänta lite så sidan laddar
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Kolla om ChatWidget finns
    const chatWidget = await page.$('#chat-widget-container');
    if (chatWidget) {
      console.log('✅ ChatWidget hittades på sidan!');
      
      // Ta en screenshot
      await page.screenshot({ 
        path: 'order-confirmation-with-chat.png',
        fullPage: true 
      });
      console.log('📸 Screenshot sparad som order-confirmation-with-chat.png');
      
      // Försök klicka på chat-ikonen
      const chatButton = await page.$('button[aria-label*="Chat"]');
      if (chatButton) {
        console.log('🎯 Klickar på chat-knappen...');
        await chatButton.click();
        
        // Vänta lite
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Kolla om chatten öppnades
        const chatWindow = await page.$('.chat-window, [class*="chat"][class*="open"]');
        if (chatWindow) {
          console.log('✅ Chattfönstret öppnades!');
          
          // Ta en ny screenshot med öppen chat
          await page.screenshot({ 
            path: 'order-confirmation-chat-open.png',
            fullPage: true 
          });
          console.log('📸 Screenshot med öppen chat sparad');
        }
      }
    } else {
      console.log('❌ ChatWidget hittades inte på sidan');
      
      // Ta screenshot ändå för felsökning
      await page.screenshot({ 
        path: 'order-confirmation-no-chat.png',
        fullPage: true 
      });
    }
    
  } catch (error) {
    console.error('❌ Test misslyckades:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();