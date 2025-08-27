// Test GPS modal logik efter fix
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 390, height: 844 } // iPhone 14 Pro
  });
  const page = await browser.newPage();

  try {
    console.log('📱 Öppnar staff dashboard...');
    await page.goto('http://localhost:3000/staff/dashboard');
    await new Promise(r => setTimeout(r, 2000));
    
    // Kontrollera att sidan laddas korrekt
    const pageTitle = await page.$eval('h1', el => el.textContent).catch(() => null);
    if (!pageTitle) {
      // Prova att hitta välkomsttext istället
      const greeting = await page.$eval('p', el => el.textContent).catch(() => null);
      console.log('✅ Dashboard laddat:', greeting || 'Sidan verkar fungera');
    } else {
      console.log('✅ Dashboard laddat:', pageTitle);
    }
    
    // Hitta påbörja-knappen för Anna Holm
    console.log('\n🔍 Letar efter Anna Holm uppdrag...');
    const startButton = await page.$('button:has-text("Påbörja uppdrag")');
    
    if (startButton) {
      console.log('✅ Hittade påbörja-knapp');
      
      // TEST 1: Starta jobb (ska visa GPS modal)
      console.log('\n📍 TEST 1: Startar jobb - GPS modal ska visas');
      await startButton.click();
      await new Promise(r => setTimeout(r, 1000));
      
      // Kolla om GPS modal visas
      const gpsModal = await page.$('text=/GPS-position/i');
      if (gpsModal) {
        console.log('✅ GPS modal visas korrekt vid start!');
        
        // Klicka "Starta ändå"
        const startAnywayBtn = await page.$('button:has-text("Starta ändå")');
        if (startAnywayBtn) {
          await startAnywayBtn.click();
          console.log('✅ Klickade "Starta ändå"');
          await new Promise(r => setTimeout(r, 2000));
        }
      } else {
        console.log('❌ GPS modal visades inte vid start');
      }
      
      // TEST 2: Avsluta jobb (ska INTE visa GPS modal)
      console.log('\n🏁 TEST 2: Avslutar jobb - ingen GPS modal ska visas');
      
      // Hitta avsluta-knappen
      const endButton = await page.$('button:has-text("Avsluta")');
      if (endButton) {
        console.log('✅ Hittade avsluta-knapp');
        
        // Ta screenshot före klick
        await page.screenshot({ 
          path: 'test-before-end.png',
          fullPage: false 
        });
        
        await endButton.click();
        await new Promise(r => setTimeout(r, 2000));
        
        // Kolla om GPS modal visas (den ska INTE visas)
        const gpsModalAfterEnd = await page.$('text=/GPS-position/i');
        if (!gpsModalAfterEnd) {
          console.log('✅ Korrekt! Ingen GPS modal vid avslut');
        } else {
          console.log('❌ FEL! GPS modal visades vid avslut');
        }
        
        // Ta screenshot efter klick
        await page.screenshot({ 
          path: 'test-after-end.png',
          fullPage: false 
        });
        
        // Kolla status
        const statusBadge = await page.$eval('.bg-gray-500', el => el.textContent).catch(() => null);
        if (statusBadge && statusBadge.includes('Slutfört')) {
          console.log('✅ Status uppdaterad till "Slutfört"');
        } else {
          console.log('⚠️ Status kanske inte uppdaterad korrekt');
        }
      }
      
    } else {
      console.log('❌ Kunde inte hitta påbörja-knapp');
    }
    
    console.log('\n✨ Test klart!');
    console.log('Screenshots sparade:');
    console.log('- test-before-end.png');
    console.log('- test-after-end.png');
    
  } catch (error) {
    console.error('❌ Fel:', error.message);
    
    // Ta error screenshot
    await page.screenshot({ 
      path: 'test-error.png',
      fullPage: true 
    });
  }

  await browser.close();
})();