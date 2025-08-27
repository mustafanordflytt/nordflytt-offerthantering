// Sätt upp mock-jobb för testning
const puppeteer = require('puppeteer');

// Mock job data
const mockJob = {
  id: '1',
  bookingNumber: 'NF-2025-001',
  customerName: 'Anna Holm',
  customerPhone: '+46 70 123 45 67',
  fromAddress: 'Kungsgatan 10, Stockholm',
  toAddress: 'Vasagatan 25, Stockholm',
  moveTime: '08:00',
  endTime: '12:00',
  status: 'upcoming',
  estimatedHours: 4,
  teamMembers: ['Erik Andersson', 'Sofia Lindberg'],
  priority: 'high',
  distance: 2.5,
  serviceType: 'moving',
  services: ['Packhjälp', 'Flytt', 'Flyttstädning'],
  specialRequirements: ['Pianoflytt', 'Ömtåliga föremål'],
  locationInfo: {
    doorCode: '1234',
    floor: 3,
    elevator: false,
    elevatorStatus: 'Ingen hiss',
    parkingDistance: 50,
    accessNotes: 'Ring på dörren'
  },
  customerNotes: 'Kunden har en katt, var försiktig med dörrar',
  equipment: ['Släpvagn', 'Lyftband', 'Skyddsmaterial'],
  volume: 25,
  boxCount: 30
};

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 390, height: 844 }
  });
  const page = await browser.newPage();

  try {
    console.log('🔧 Sätter upp mock-data...');
    
    // Gå till sidan
    await page.goto('http://localhost:3000/staff');
    
    // Sätt mock-data i localStorage
    await page.evaluate((jobData) => {
      localStorage.setItem('mockJobs', JSON.stringify([jobData]));
      localStorage.setItem('mockJobStatuses', '{}');
      console.log('Mock data satt!');
    }, mockJob);
    
    console.log('✅ Mock-jobb skapat för Anna Holm');
    console.log('📍 Adress:', mockJob.toAddress);
    console.log('⏰ Tid:', mockJob.moveTime + ' - ' + mockJob.endTime);
    console.log('📦 Tjänster:', mockJob.services.join(', '));
    
    // Nu kör vi testet
    console.log('\n🚀 Startar GPS-test...\n');
    
    // Logga in
    console.log('🔐 Loggar in som Erik...');
    const erikButton = await page.$$eval('button', buttons => {
      const btn = buttons.find(b => b.textContent.includes('Erik (Flyttchef)'));
      return btn ? buttons.indexOf(btn) : -1;
    });
    
    if (erikButton >= 0) {
      const buttons = await page.$$('button');
      await buttons[erikButton].click();
      console.log('✅ Inloggad');
      
      await new Promise(r => setTimeout(r, 3000));
      
      // Ta dashboard screenshot
      await page.screenshot({ 
        path: 'gps-test-1-dashboard-with-job.png',
        fullPage: false 
      });
      
      console.log('\n🔍 Letar efter Anna Holm uppdrag...');
      
      // Hitta påbörja-knappen
      const startButton = await page.$$eval('button', buttons => {
        const btn = buttons.find(b => b.textContent && b.textContent.includes('Påbörja uppdrag'));
        return btn ? buttons.indexOf(btn) : -1;
      });
      
      if (startButton >= 0) {
        console.log('✅ Hittade påbörja-knapp!');
        
        // TEST 1: Starta jobb
        console.log('\n📍 TEST 1: Startar jobb (GPS modal ska visas)...');
        
        const buttons = await page.$$('button');
        await buttons[startButton].click();
        
        await new Promise(r => setTimeout(r, 1500));
        
        // Kolla om checklista visas
        const checklistVisible = await page.$eval('h2', el => el.textContent).catch(() => null);
        if (checklistVisible && checklistVisible.includes('Checklista')) {
          console.log('📋 Checklista visas');
          
          await page.screenshot({ 
            path: 'gps-test-2-checklist.png',
            fullPage: false 
          });
          
          // Klicka starta i checklistan
          const startInChecklist = await page.$$eval('button', buttons => {
            const btn = buttons.find(b => b.textContent && b.textContent.includes('Starta uppdrag'));
            return btn ? buttons.indexOf(btn) : -1;
          });
          
          if (startInChecklist >= 0) {
            const checklistButtons = await page.$$('button');
            await checklistButtons[startInChecklist].click();
            console.log('✅ Klickade starta i checklistan');
            
            await new Promise(r => setTimeout(r, 1500));
          }
        }
        
        // Nu ska GPS modal visas
        await page.screenshot({ 
          path: 'gps-test-3-gps-modal.png',
          fullPage: false 
        });
        
        const gpsModal = await page.$eval('h2', el => el.textContent).catch(() => null);
        if (gpsModal && gpsModal.includes('GPS')) {
          console.log('✅ GPS MODAL VISAS VID START - KORREKT!');
          
          // Klicka starta ändå
          const startAnyway = await page.$$eval('button', buttons => {
            const btn = buttons.find(b => b.textContent && b.textContent.includes('Starta ändå'));
            return btn ? buttons.indexOf(btn) : -1;
          });
          
          if (startAnyway >= 0) {
            const gpsButtons = await page.$$('button');
            await gpsButtons[startAnyway].click();
            console.log('✅ Klickade "Starta ändå"');
          }
        } else {
          console.log('❌ GPS modal visades INTE vid start - FEL!');
        }
        
        await new Promise(r => setTimeout(r, 2000));
        
        // Verifiera pågående status
        console.log('\n🔄 Verifierar pågående status...');
        await page.screenshot({ 
          path: 'gps-test-4-job-active.png',
          fullPage: false 
        });
        
        // TEST 2: Avsluta jobb
        console.log('\n🏁 TEST 2: Avslutar jobb (ingen GPS modal ska visas)...');
        
        // Scrolla ner för att se mobile action bar
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await new Promise(r => setTimeout(r, 500));
        
        // Hitta avsluta-knappen
        const endButton = await page.$$eval('button', buttons => {
          const btn = buttons.find(b => {
            const text = b.textContent || '';
            return text.includes('Avsluta') && !text.includes('session');
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
          console.log('✅ Klickade avsluta');
          
          await new Promise(r => setTimeout(r, 2000));
          
          await page.screenshot({ 
            path: 'gps-test-6-after-end.png',
            fullPage: false 
          });
          
          // Kritisk kontroll - ska INTE visa GPS modal
          const modalAfterEnd = await page.$eval('h2', el => el.textContent).catch(() => null);
          if (!modalAfterEnd || !modalAfterEnd.includes('GPS')) {
            console.log('✅ KORREKT! INGEN GPS MODAL VID AVSLUT!');
          } else {
            console.log('❌ FEL! GPS MODAL VISADES VID AVSLUT!');
          }
          
          // Kolla status
          const statusText = await page.$$eval('span, div', elements => {
            const el = elements.find(e => e.textContent && e.textContent.includes('Slutfört'));
            return el ? el.textContent : null;
          });
          
          if (statusText) {
            console.log('✅ Status uppdaterad till "Slutfört"');
          }
          
        } else {
          console.log('❌ Kunde inte hitta avsluta-knapp');
        }
        
      } else {
        console.log('❌ Kunde inte hitta påbörja-knapp');
      }
    }
    
    console.log('\n✨ TEST SLUTFÖRT!');
    console.log('\n📊 RESULTAT:');
    console.log('1. GPS modal vid start: Se gps-test-3-gps-modal.png');
    console.log('2. GPS modal vid avslut: Se gps-test-6-after-end.png');
    
  } catch (error) {
    console.error('❌ Fel:', error.message);
    await page.screenshot({ path: 'gps-test-error.png', fullPage: true });
  }

  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
})();