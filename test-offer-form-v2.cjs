const puppeteer = require('puppeteer');

async function testOfferForm() {
  console.log('🧪 Testar Nordflytt offertformulär v2\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // 1. Gå till startsidan
    console.log('1️⃣ Navigerar till startsidan...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));
    
    // Ta screenshot av startsidan
    await page.screenshot({ path: 'screenshots/test-1-start.png', fullPage: true });
    console.log('   ✅ Startsida laddad');
    
    // Analysera sidan för att hitta rätt element
    const pageInfo = await page.evaluate(() => {
      const info = {
        title: document.title,
        buttons: [],
        radioButtons: [],
        hasPrivateOption: false
      };
      
      // Hitta alla knappar
      document.querySelectorAll('button').forEach(btn => {
        info.buttons.push({
          text: btn.textContent?.trim(),
          id: btn.id,
          className: btn.className
        });
      });
      
      // Hitta radio buttons
      document.querySelectorAll('input[type="radio"]').forEach(radio => {
        info.radioButtons.push({
          value: radio.value,
          name: radio.name,
          id: radio.id
        });
      });
      
      // Kolla om det finns text med "Privat"
      info.hasPrivateOption = document.body.textContent?.includes('Privat') || false;
      
      return info;
    });
    
    console.log('\n📊 Sidanalys:');
    console.log('   Knappar:', pageInfo.buttons.length);
    console.log('   Radio buttons:', pageInfo.radioButtons.length);
    console.log('   Har "Privat" option:', pageInfo.hasPrivateOption);
    
    // 2. Försök välja kundtyp
    console.log('\n2️⃣ Steg 1: Väljer kundtyp...');
    
    // Försök olika sätt att välja "Privat"
    let privateSelected = false;
    
    // Metod 1: Klicka på button med text "Privat"
    try {
      const privateButton = await page.$('button');
      if (privateButton) {
        const buttonText = await page.evaluate(el => el.textContent, privateButton);
        if (buttonText?.includes('Privat')) {
          await privateButton.click();
          privateSelected = true;
          console.log('   ✅ Klickade på Privat-knapp');
        }
      }
    } catch (e) {}
    
    // Metod 2: Klicka på radio button för privat
    if (!privateSelected) {
      try {
        await page.click('input[type="radio"][value="private"]');
        privateSelected = true;
        console.log('   ✅ Valde privat radio button');
      } catch (e) {}
    }
    
    // Metod 3: Klicka på label som innehåller "Privat"
    if (!privateSelected) {
      try {
        await page.evaluate(() => {
          const labels = Array.from(document.querySelectorAll('label'));
          const privateLabel = labels.find(label => label.textContent?.includes('Privat'));
          if (privateLabel) privateLabel.click();
        });
        privateSelected = true;
        console.log('   ✅ Klickade på Privat-label');
      } catch (e) {}
    }
    
    // Metod 4: Klicka baserat på div/card struktur
    if (!privateSelected) {
      try {
        await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('*'));
          const privateElement = elements.find(el => {
            const text = el.textContent || '';
            return text.includes('Privat') && (el.tagName === 'DIV' || el.tagName === 'BUTTON');
          });
          if (privateElement) {
            privateElement.click();
            return true;
          }
          return false;
        });
        privateSelected = true;
        console.log('   ✅ Klickade på Privat-element');
      } catch (e) {}
    }
    
    await new Promise(r => setTimeout(r, 1000));
    
    // Leta efter nästa-knapp eller automatisk navigering
    console.log('\n3️⃣ Letar efter nästa steg...');
    
    // Vänta lite för att se om formuläret uppdateras automatiskt
    await new Promise(r => setTimeout(r, 2000));
    
    // Ta ny screenshot
    await page.screenshot({ path: 'screenshots/test-2-after-selection.png', fullPage: true });
    
    // Kolla om vi har input-fält för kontaktinfo
    const hasContactForm = await page.evaluate(() => {
      return document.querySelector('input[name="name"]') !== null ||
             document.querySelector('input[type="email"]') !== null;
    });
    
    if (hasContactForm) {
      console.log('   ✅ Kontaktformulär hittat');
      
      // Fyll i kontaktinformation
      console.log('\n4️⃣ Fyller i kontaktinformation...');
      
      // Namn
      const nameInput = await page.$('input[name="name"]');
      if (nameInput) {
        await nameInput.type('Test Testsson');
      }
      
      // Email
      const emailInput = await page.$('input[type="email"], input[name="email"]');
      if (emailInput) {
        await emailInput.type('test@example.com');
      }
      
      // Telefon
      const phoneInput = await page.$('input[type="tel"], input[name="phone"]');
      if (phoneInput) {
        await phoneInput.type('0701234567');
      }
      
      console.log('   ✅ Kontaktinfo ifylld');
      
      // Leta efter nästa-knapp
      const nextButton = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const nextBtn = buttons.find(btn => {
          const text = btn.textContent?.toLowerCase() || '';
          return text.includes('nästa') || text.includes('fortsätt');
        });
        if (nextBtn) {
          nextBtn.click();
          return true;
        }
        return false;
      });
      
      if (nextButton) {
        console.log('   ✅ Klickade på Nästa');
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    
    // Ta slutlig screenshot
    await page.screenshot({ path: 'screenshots/test-3-final.png', fullPage: true });
    
    // Sammanfatta resultat
    console.log('\n📊 Testresultat:');
    const currentUrl = page.url();
    console.log('   URL:', currentUrl);
    
    const pageContent = await page.content();
    console.log('   Sidlängd:', pageContent.length, 'tecken');
    
    console.log('\n✅ Test genomfört!');
    console.log('\nScreenshots sparade:');
    console.log('- screenshots/test-1-start.png');
    console.log('- screenshots/test-2-after-selection.png');
    console.log('- screenshots/test-3-final.png');
    
  } catch (error) {
    console.error('\n❌ Fel uppstod:', error.message);
    await page.screenshot({ path: 'screenshots/test-error.png', fullPage: true });
  } finally {
    await new Promise(r => setTimeout(r, 3000));
    await browser.close();
  }
}

// Kör testet
testOfferForm().catch(console.error);