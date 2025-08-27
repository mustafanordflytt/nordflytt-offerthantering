// Test GPS modal med login först
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 390, height: 844 } // iPhone 14 Pro
  });
  const page = await browser.newPage();

  try {
    console.log('📱 Öppnar staff app...');
    await page.goto('http://localhost:3000/staff');
    await new Promise(r => setTimeout(r, 2000));
    
    // Logga in först
    console.log('\n🔐 Loggar in som Erik...');
    
    // Klicka på Erik demo-knappen
    const erikButton = await page.$$eval('button', buttons => {
      const btn = buttons.find(b => b.textContent.includes('Erik (Flyttchef)'));
      return btn ? buttons.indexOf(btn) : -1;
    });
    
    if (erikButton >= 0) {
      const buttons = await page.$$('button');
      await buttons[erikButton].click();
      console.log('✅ Klickade på Erik demo-login');
      
      await new Promise(r => setTimeout(r, 3000));
      
      // Nu borde vi vara på dashboard
      console.log('\n📊 Kontrollerar dashboard...');
      
      await page.screenshot({ 
        path: 'gps-test-1-dashboard.png',
        fullPage: false 
      });
      
      // Hitta påbörja-knappen för Anna Holm
      console.log('\n🔍 Letar efter Anna Holm uppdrag...');
      
      // Vänta lite så jobben hinner laddas
      await new Promise(r => setTimeout(r, 2000));
      
      // Hitta påbörja-knappen
      const startButton = await page.$$eval('button', buttons => {
        const btn = buttons.find(b => b.textContent && b.textContent.includes('Påbörja uppdrag'));
        return btn ? buttons.indexOf(btn) : -1;
      });
      
      if (startButton >= 0) {
        console.log('✅ Hittade påbörja-knapp');
        
        // TEST 1: Starta jobb (ska visa GPS modal)
        console.log('\n📍 TEST 1: Startar jobb - GPS modal ska visas...');
        
        const buttons = await page.$$('button');
        await buttons[startButton].click();
        
        await new Promise(r => setTimeout(r, 1500));
        
        // Ta screenshot av modal
        await page.screenshot({ 
          path: 'gps-test-2-start-modal.png',
          fullPage: false 
        });
        
        // Kolla om checklista visas först
        const checklistTitle = await page.$eval('h2', el => el.textContent).catch(() => null);
        if (checklistTitle && checklistTitle.includes('Checklista')) {
          console.log('📋 Checklista visas först');
          
          // Klicka på "Starta uppdrag" i checklistan
          const startInChecklist = await page.$$eval('button', buttons => {
            const btn = buttons.find(b => b.textContent && b.textContent.includes('Starta uppdrag'));
            return btn ? buttons.indexOf(btn) : -1;
          });
          
          if (startInChecklist >= 0) {
            const checklistButtons = await page.$$('button');
            await checklistButtons[startInChecklist].click();
            console.log('✅ Klickade på starta i checklistan');
            
            await new Promise(r => setTimeout(r, 1500));
            
            // NU ska GPS modal visas
            await page.screenshot({ 
              path: 'gps-test-3-gps-modal.png',
              fullPage: false 
            });
          }
        }
        
        // Kolla GPS modal
        const gpsModalTitle = await page.$eval('h2', el => el.textContent).catch(() => null);
        if (gpsModalTitle && gpsModalTitle.includes('GPS')) {
          console.log('✅ GPS modal visas korrekt vid start!');
          
          // Klicka "Starta ändå"
          const startAnywayIdx = await page.$$eval('button', buttons => {
            const btn = buttons.find(b => b.textContent && b.textContent.includes('Starta ändå'));
            return btn ? buttons.indexOf(btn) : -1;
          });
          
          if (startAnywayIdx >= 0) {
            const modalButtons = await page.$$('button');
            await modalButtons[startAnywayIdx].click();
            console.log('✅ Klickade på "Starta ändå"');
            
            await new Promise(r => setTimeout(r, 2000));
          }
        } else {
          console.log('❌ GPS modal visades inte');
        }
        
        // TEST 2: Verifiera pågående status
        console.log('\n🔄 Verifierar jobbstatus...');
        
        await page.screenshot({ 
          path: 'gps-test-4-job-started.png',
          fullPage: false 
        });
        
        // TEST 3: Avsluta jobb (ska INTE visa GPS modal)
        console.log('\n🏁 TEST 3: Avslutar jobb...');
        
        // Hitta avsluta-knappen (kan vara i mobile action bar)
        const endButton = await page.$$eval('button', buttons => {
          const btn = buttons.find(b => {
            const text = b.textContent || '';
            return text.includes('Avsluta') && !text.includes('Avsluta session');
          });
          return btn ? buttons.indexOf(btn) : -1;
        });
        
        if (endButton >= 0) {
          console.log('✅ Hittade avsluta-knapp');
          
          await page.screenshot({ 
            path: 'gps-test-5-before-end.png',
            fullPage: false 
          });
          
          const endButtons = await page.$$('button');
          await endButtons[endButton].click();
          console.log('✅ Klickade på avsluta');
          
          await new Promise(r => setTimeout(r, 2000));
          
          await page.screenshot({ 
            path: 'gps-test-6-after-end.png',
            fullPage: false 
          });
          
          // Kolla om GPS modal visas (den ska INTE visas)
          const modalAfterEnd = await page.$eval('h2', el => el.textContent).catch(() => null);
          if (!modalAfterEnd || !modalAfterEnd.includes('GPS')) {
            console.log('✅ KORREKT! Ingen GPS modal vid avslut');
          } else {
            console.log('❌ FEL! GPS modal visades vid avslut:', modalAfterEnd);
          }
        } else {
          console.log('❌ Kunde inte hitta avsluta-knapp');
          
          // Lista alla knappar för debug
          const allButtons = await page.$$eval('button', buttons => 
            buttons.map(b => b.textContent).filter(t => t)
          );
          console.log('Tillgängliga knappar:', allButtons);
        }
        
      } else {
        console.log('❌ Kunde inte hitta påbörja-knapp');
        
        // Kolla om det finns några jobb
        const jobCards = await page.$$('.bg-gray-50.rounded-lg');
        console.log(`Hittade ${jobCards.length} jobbkort`);
      }
      
    } else {
      console.log('❌ Kunde inte hitta Erik demo-knapp');
    }
    
    console.log('\n✨ Test slutfört!');
    console.log('\n📸 Screenshots:');
    console.log('- gps-test-1-dashboard.png');
    console.log('- gps-test-2-start-modal.png');
    console.log('- gps-test-3-gps-modal.png');
    console.log('- gps-test-4-job-started.png');
    console.log('- gps-test-5-before-end.png');
    console.log('- gps-test-6-after-end.png');
    
  } catch (error) {
    console.error('\n❌ Fel:', error.message);
    await page.screenshot({ 
      path: 'gps-test-error.png',
      fullPage: true 
    });
  }

  // Vänta innan stängning
  await new Promise(r => setTimeout(r, 3000));
  await browser.close();
})();