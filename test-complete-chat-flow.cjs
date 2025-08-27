const puppeteer = require('puppeteer');

(async () => {
  console.log('🧪 Testar komplett flöde med ChatWidget...');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Steg 1: Gå till offertsidan
    console.log('\n📍 Steg 1: Navigerar till offertsidan...');
    await page.goto('http://localhost:3000/offer/test-offer-id', {
      waitUntil: 'networkidle2'
    });
    
    // Vänta lite
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Kolla om ChatWidget finns på offertsidan
    let chatWidget = await page.$('#chat-widget-container, [class*="chat-widget"]');
    if (chatWidget) {
      console.log('✅ ChatWidget finns på offertsidan');
    }
    
    // Steg 2: Boka flytthjälp
    console.log('\n📍 Steg 2: Klickar på "Boka flytthjälp"...');
    try {
      await page.waitForSelector('button:has-text("Boka flytthjälp")', { timeout: 5000 });
      await page.click('button:has-text("Boka flytthjälp")');
      
      // Vänta på BankID modal
      await page.waitForSelector('button:has-text("Öppna Mobilt BankID")', { timeout: 5000 });
      console.log('✅ BankID modal visas');
      
      // Klicka på BankID
      await page.click('button:has-text("Öppna Mobilt BankID")');
      console.log('⏳ Väntar på mock BankID autentisering...');
      
      // Vänta på autentisering (6 sekunder för mock)
      await new Promise(resolve => setTimeout(resolve, 6000));
      
      // Kolla om vi omdirigerats till orderbekräftelse
      await page.waitForFunction(
        () => window.location.pathname.includes('/order-confirmation'),
        { timeout: 10000 }
      );
      
      console.log('✅ Omdirigerad till orderbekräftelsesidan!');
      const currentUrl = page.url();
      console.log('📍 Nuvarande URL:', currentUrl);
      
      // Vänta lite så sidan laddar klart
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Steg 3: Kolla ChatWidget på orderbekräftelsesidan
      console.log('\n📍 Steg 3: Kollar ChatWidget på orderbekräftelsesidan...');
      
      // Sök efter ChatWidget med olika selektorer
      chatWidget = await page.$('#chat-widget-container, [class*="chat-widget"], button[aria-label*="Chat"], button[aria-label*="chat"]');
      
      if (chatWidget) {
        console.log('✅ ChatWidget finns på orderbekräftelsesidan!');
        
        // Ta screenshot
        await page.screenshot({ 
          path: 'order-confirmation-with-chat-complete.png',
          fullPage: true 
        });
        console.log('📸 Screenshot sparad');
        
        // Försök öppna chatten
        const chatButton = await page.$('button[aria-label*="Chat"], button[aria-label*="chat"]');
        if (chatButton) {
          await chatButton.click();
          console.log('🎯 Klickade på chat-knappen');
          
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Ta screenshot med öppen chat
          await page.screenshot({ 
            path: 'order-confirmation-chat-open-complete.png',
            fullPage: true 
          });
          console.log('📸 Screenshot med öppen chat sparad');
        }
      } else {
        console.log('❌ ChatWidget hittades inte på orderbekräftelsesidan');
        
        // Ta screenshot för felsökning
        await page.screenshot({ 
          path: 'order-confirmation-no-chat-debug.png',
          fullPage: true 
        });
        
        // Kolla om det finns något felmeddelande
        const errorMessage = await page.$('text="Ett fel uppstod", text="Order hittades inte"');
        if (errorMessage) {
          console.log('⚠️ Felmeddelande visas på sidan');
        }
      }
      
    } catch (error) {
      console.log('⚠️ Kunde inte slutföra bokningsflödet:', error.message);
      
      // Om vi inte kan boka, navigera direkt till en orderbekräftelse
      console.log('\n📍 Alternativ: Navigerar direkt till orderbekräftelse...');
      await page.goto('http://localhost:3000/order-confirmation/test-direct', {
        waitUntil: 'networkidle2'
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Ta screenshot
      await page.screenshot({ 
        path: 'order-confirmation-direct-navigation.png',
        fullPage: true 
      });
    }
    
  } catch (error) {
    console.error('❌ Test misslyckades:', error.message);
  } finally {
    console.log('\n✅ Test avslutat');
    if (browser) {
      await browser.close();
    }
  }
})();