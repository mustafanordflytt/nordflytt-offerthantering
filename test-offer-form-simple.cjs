const puppeteer = require('puppeteer');

async function testOfferForm() {
  console.log('🧪 Testar Nordflytt offertformulär\n');
  
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
    
    // 2. Steg 1: Välj kundtyp (Privat)
    console.log('\n2️⃣ Steg 1: Väljer kundtyp...');
    await page.waitForSelector('button:has-text("Privat")', { timeout: 5000 });
    await page.click('button:has-text("Privat")');
    await new Promise(r => setTimeout(r, 1000));
    console.log('   ✅ Valde "Privat"');
    
    // 3. Steg 2: Kontaktinformation
    console.log('\n3️⃣ Steg 2: Fyller i kontaktinformation...');
    await page.waitForSelector('input[name="name"]', { timeout: 5000 });
    await page.type('input[name="name"]', 'Test Testsson');
    await page.type('input[name="email"]', 'test@example.com');
    await page.type('input[name="phone"]', '0701234567');
    
    // Klicka på nästa-knappen
    await page.click('button:has-text("Nästa")');
    await new Promise(r => setTimeout(r, 1000));
    console.log('   ✅ Kontaktinfo ifylld');
    
    // 4. Steg 3: Välj tjänst (Flytt)
    console.log('\n4️⃣ Steg 3: Väljer tjänst...');
    await page.waitForSelector('button[data-service="moving"]', { timeout: 5000 });
    await page.click('button[data-service="moving"]');
    await new Promise(r => setTimeout(r, 500));
    
    // Klicka på nästa
    await page.click('button:has-text("Nästa")');
    await new Promise(r => setTimeout(r, 1000));
    console.log('   ✅ Valde "Flytt"');
    
    // 5. Steg 4: Flyttdetaljer
    console.log('\n5️⃣ Steg 4: Fyller i flyttdetaljer...');
    await page.waitForSelector('input[name="moveDate"]', { timeout: 5000 });
    
    // Datum
    await page.evaluate(() => {
      const dateInput = document.querySelector('input[name="moveDate"]');
      if (dateInput) {
        dateInput.value = '2024-08-15';
        dateInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    
    // Adresser
    await page.type('input[name="startAddress"]', 'Kungsgatan 1, Stockholm');
    await page.type('input[name="endAddress"]', 'Drottninggatan 50, Stockholm');
    
    // Våningsplan
    await page.select('select[name="startFloor"]', '2');
    await page.select('select[name="endFloor"]', '3');
    
    // Hiss
    await page.select('select[name="startElevator"]', 'none');
    await page.select('select[name="endElevator"]', 'small');
    
    // Boendeyta
    await page.type('input[name="startLivingArea"]', '75');
    await page.type('input[name="endLivingArea"]', '85');
    
    await page.screenshot({ path: 'screenshots/test-2-details.png', fullPage: true });
    
    // Klicka på Beräkna pris
    await page.click('button:has-text("Beräkna pris")');
    await new Promise(r => setTimeout(r, 3000));
    console.log('   ✅ Flyttdetaljer ifyllda');
    
    // 6. Kolla om vi får pris/sammanfattning
    console.log('\n6️⃣ Kollar resultat...');
    
    // Vänta på att något resultat ska visas
    await new Promise(r => setTimeout(r, 2000));
    
    // Ta screenshot av resultatet
    await page.screenshot({ path: 'screenshots/test-3-result.png', fullPage: true });
    
    // Kolla om vi har pris
    const pageContent = await page.content();
    const hasPrice = pageContent.includes('kr') || pageContent.includes('SEK');
    const hasSummary = pageContent.includes('sammanfattning') || pageContent.includes('Sammanfattning');
    
    console.log(`   ${hasPrice ? '✅' : '❌'} Pris visat: ${hasPrice}`);
    console.log(`   ${hasSummary ? '✅' : '❌'} Sammanfattning visad: ${hasSummary}`);
    
    // Extrahera priser om de finns
    if (hasPrice) {
      const prices = await page.evaluate(() => {
        const priceElements = Array.from(document.querySelectorAll('*')).filter(el => {
          const text = el.textContent || '';
          return /\d+\s*(kr|SEK|:-)/i.test(text);
        });
        return priceElements.slice(0, 5).map(el => el.textContent?.trim());
      });
      
      console.log('\n   Hittade priser:');
      prices.forEach(price => console.log(`   - ${price}`));
    }
    
    console.log('\n✅ Test genomfört!');
    console.log('\nScreenshots sparade:');
    console.log('- screenshots/test-1-start.png');
    console.log('- screenshots/test-2-details.png');
    console.log('- screenshots/test-3-result.png');
    
  } catch (error) {
    console.error('\n❌ Fel uppstod:', error.message);
    await page.screenshot({ path: 'screenshots/test-error.png', fullPage: true });
  } finally {
    await new Promise(r => setTimeout(r, 3000)); // Låt användaren se resultatet
    await browser.close();
  }
}

// Kör testet
testOfferForm().catch(console.error);