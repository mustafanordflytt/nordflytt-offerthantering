// Test komplett GPS modal flöde
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
    await new Promise(r => setTimeout(r, 3000));
    
    console.log('✅ Dashboard laddat!');
    
    // Ta screenshot av dashboard
    await page.screenshot({ 
      path: 'gps-test-1-dashboard.png',
      fullPage: false 
    });
    
    // Hitta påbörja-knappen
    console.log('\n🔍 Letar efter påbörja-knapp...');
    const startButton = await page.waitForSelector('button:has(svg.h-4.w-4) >> text=/Påbörja uppdrag/i', {
      timeout: 5000
    }).catch(() => null);
    
    if (!startButton) {
      // Prova alternativ selector
      const altButton = await page.$$eval('button', buttons => {
        const btn = buttons.find(b => b.textContent.includes('Påbörja uppdrag'));
        return btn ? buttons.indexOf(btn) : -1;
      });
      
      if (altButton >= 0) {
        const buttons = await page.$$('button');
        await buttons[altButton].click();
        console.log('✅ Klickade på påbörja-knapp (alternativ metod)');
      } else {
        throw new Error('Kunde inte hitta påbörja-knapp');
      }
    } else {
      await startButton.click();
      console.log('✅ Klickade på påbörja-knapp');
    }
    
    await new Promise(r => setTimeout(r, 1500));
    
    // TEST 1: Kolla om GPS modal visas vid start
    console.log('\n📍 TEST 1: Kontrollerar GPS modal vid start...');
    
    // Ta screenshot av modal
    await page.screenshot({ 
      path: 'gps-test-2-start-modal.png',
      fullPage: false 
    });
    
    const gpsModalTitle = await page.$eval('h2', el => el.textContent).catch(() => null);
    if (gpsModalTitle && gpsModalTitle.includes('GPS')) {
      console.log('✅ GPS modal visas korrekt vid start!');
      console.log('   Modal titel:', gpsModalTitle);
      
      // Hitta och klicka "Starta ändå"
      const startAnywayButton = await page.$$eval('button', buttons => {
        const btn = buttons.find(b => b.textContent.includes('Starta ändå'));
        return btn ? buttons.indexOf(btn) : -1;
      });
      
      if (startAnywayButton >= 0) {
        const buttons = await page.$$('button');
        await buttons[startAnywayButton].click();
        console.log('✅ Klickade på "Starta ändå"');
      }
      
      await new Promise(r => setTimeout(r, 2000));
    } else {
      console.log('❌ GPS modal visades inte vid start');
    }
    
    // TEST 2: Verifiera att jobbet är pågående
    console.log('\n🔄 Verifierar jobbstatus...');
    
    await page.screenshot({ 
      path: 'gps-test-3-job-started.png',
      fullPage: false 
    });
    
    const statusBadge = await page.$eval('.bg-green-500', el => el.textContent).catch(() => null);
    if (statusBadge && statusBadge.includes('Pågående')) {
      console.log('✅ Jobbet är nu pågående!');
    } else {
      console.log('⚠️ Kunde inte verifiera jobbstatus');
    }
    
    // TEST 3: Avsluta jobb (ska INTE visa GPS modal)
    console.log('\n🏁 TEST 3: Avslutar jobb...');
    
    // Hitta avsluta-knappen
    const endButton = await page.$$eval('button', buttons => {
      const btn = buttons.find(b => b.textContent.includes('Avsluta'));
      return btn ? buttons.indexOf(btn) : -1;
    });
    
    if (endButton >= 0) {
      console.log('✅ Hittade avsluta-knapp');
      
      // Ta screenshot före klick
      await page.screenshot({ 
        path: 'gps-test-4-before-end.png',
        fullPage: false 
      });
      
      const buttons = await page.$$('button');
      await buttons[endButton].click();
      console.log('✅ Klickade på avsluta');
      
      await new Promise(r => setTimeout(r, 2000));
      
      // Ta screenshot efter klick
      await page.screenshot({ 
        path: 'gps-test-5-after-end.png',
        fullPage: false 
      });
      
      // Kolla om GPS modal visas (den ska INTE visas)
      const modalAfterEnd = await page.$eval('h2', el => el.textContent).catch(() => null);
      if (!modalAfterEnd || !modalAfterEnd.includes('GPS')) {
        console.log('✅ KORREKT! Ingen GPS modal vid avslut');
      } else {
        console.log('❌ FEL! GPS modal visades vid avslut:', modalAfterEnd);
      }
      
      // Verifiera slutförd status
      const completedBadge = await page.$eval('.bg-gray-500', el => el.textContent).catch(() => null);
      if (completedBadge && completedBadge.includes('Slutfört')) {
        console.log('✅ Status uppdaterad till "Slutfört"');
      } else {
        console.log('⚠️ Status kanske inte uppdaterad');
      }
    } else {
      console.log('❌ Kunde inte hitta avsluta-knapp');
    }
    
    console.log('\n✨ Test slutfört!');
    console.log('\n📸 Screenshots sparade:');
    console.log('- gps-test-1-dashboard.png');
    console.log('- gps-test-2-start-modal.png');
    console.log('- gps-test-3-job-started.png');
    console.log('- gps-test-4-before-end.png');
    console.log('- gps-test-5-after-end.png');
    
  } catch (error) {
    console.error('\n❌ Fel:', error.message);
    
    // Ta error screenshot
    await page.screenshot({ 
      path: 'gps-test-error.png',
      fullPage: true 
    });
    console.log('📸 Error screenshot: gps-test-error.png');
  }

  // Vänta lite innan vi stänger så användaren kan se resultatet
  await new Promise(r => setTimeout(r, 3000));
  await browser.close();
})();