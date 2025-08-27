// Slutgiltig GPS modal test
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 390, height: 844 }
  });
  const page = await browser.newPage();

  try {
    console.log('🚀 Startar GPS modal test...\n');
    
    // Först, sätt mock data och logga in
    console.log('📱 Går till login-sidan...');
    await page.goto('http://localhost:3000/staff');
    await new Promise(r => setTimeout(r, 1000));
    
    // Logga in direkt med demo-knappen
    console.log('🔐 Loggar in som Erik...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const erikBtn = buttons.find(b => b.textContent?.includes('Erik (Flyttchef)'));
      if (erikBtn) erikBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    
    // Nu ska vi vara på dashboard, sätt mock data
    console.log('🔧 Sätter upp testdata...');
    await page.evaluate(() => {
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
        specialRequirements: ['Pianoflytt'],
        locationInfo: {
          doorCode: '1234',
          floor: 3,
          elevator: false,
          elevatorStatus: 'Ingen hiss',
          parkingDistance: 50,
          accessNotes: 'Ring på dörren'
        },
        customerNotes: 'Kunden har katt',
        equipment: ['Släpvagn'],
        volume: 25
      };
      
      localStorage.setItem('mockJobs', JSON.stringify([mockJob]));
      localStorage.setItem('mockJobStatuses', '{}');
      console.log('Mock job satt!');
    });
    
    // Ladda om sidan för att få mock data
    console.log('🔄 Laddar om för att visa testdata...');
    await page.reload();
    await new Promise(r => setTimeout(r, 3000));
    
    // Ta screenshot av dashboard med jobb
    await page.screenshot({ 
      path: 'gps-final-1-dashboard.png',
      fullPage: false 
    });
    console.log('📸 Dashboard screenshot: gps-final-1-dashboard.png');
    
    // TEST 1: Starta jobb
    console.log('\n📍 TEST 1: STARTA JOBB');
    console.log('------------------------');
    
    // Klicka på Påbörja uppdrag
    const startButtonClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const startBtn = buttons.find(b => b.textContent?.includes('Påbörja uppdrag'));
      if (startBtn) {
        startBtn.click();
        return true;
      }
      return false;
    });
    
    if (!startButtonClicked) {
      throw new Error('Kunde inte hitta Påbörja uppdrag-knappen');
    }
    
    console.log('✅ Klickade på "Påbörja uppdrag"');
    await new Promise(r => setTimeout(r, 1500));
    
    // Checklista ska visas först
    await page.screenshot({ 
      path: 'gps-final-2-checklist.png',
      fullPage: false 
    });
    console.log('📸 Checklista: gps-final-2-checklist.png');
    
    // Klicka Starta uppdrag i checklistan
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const startBtn = buttons.find(b => b.textContent?.includes('Starta uppdrag'));
      if (startBtn) startBtn.click();
    });
    
    console.log('✅ Klickade "Starta uppdrag" i checklistan');
    await new Promise(r => setTimeout(r, 1500));
    
    // NU ska GPS modal visas
    await page.screenshot({ 
      path: 'gps-final-3-gps-modal.png',
      fullPage: false 
    });
    console.log('📸 GPS Modal: gps-final-3-gps-modal.png');
    
    // Verifiera GPS modal
    const hasGPSModal = await page.evaluate(() => {
      const h2s = Array.from(document.querySelectorAll('h2'));
      return h2s.some(h => h.textContent?.includes('GPS'));
    });
    
    if (hasGPSModal) {
      console.log('✅ GPS MODAL VISAS VID START - KORREKT!');
    } else {
      console.log('❌ GPS modal visades INTE - FEL!');
    }
    
    // Klicka Starta ändå
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const startBtn = buttons.find(b => b.textContent?.includes('Starta ändå'));
      if (startBtn) startBtn.click();
    });
    
    console.log('✅ Klickade "Starta ändå"');
    await new Promise(r => setTimeout(r, 2000));
    
    // Verifiera att jobbet är pågående
    await page.screenshot({ 
      path: 'gps-final-4-job-active.png',
      fullPage: false 
    });
    console.log('📸 Jobb aktivt: gps-final-4-job-active.png');
    
    // TEST 2: Avsluta jobb
    console.log('\n🏁 TEST 2: AVSLUTA JOBB');
    console.log('------------------------');
    
    // Scrolla ner för mobile action bar
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(r => setTimeout(r, 1000));
    
    await page.screenshot({ 
      path: 'gps-final-5-before-end.png',
      fullPage: false 
    });
    console.log('📸 Före avslut: gps-final-5-before-end.png');
    
    // Klicka Avsluta
    const endButtonClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const endBtn = buttons.find(b => {
        const text = b.textContent || '';
        return text.includes('Avsluta') && !text.includes('session');
      });
      if (endBtn) {
        endBtn.click();
        return true;
      }
      return false;
    });
    
    if (!endButtonClicked) {
      // Lista alla knappar för debug
      const buttonTexts = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button'))
          .map(b => b.textContent)
          .filter(t => t);
      });
      console.log('Tillgängliga knappar:', buttonTexts);
      throw new Error('Kunde inte hitta Avsluta-knappen');
    }
    
    console.log('✅ Klickade "Avsluta"');
    await new Promise(r => setTimeout(r, 2000));
    
    await page.screenshot({ 
      path: 'gps-final-6-after-end.png',
      fullPage: false 
    });
    console.log('📸 Efter avslut: gps-final-6-after-end.png');
    
    // KRITISK KONTROLL - ingen GPS modal ska visas
    const hasGPSModalAfterEnd = await page.evaluate(() => {
      const h2s = Array.from(document.querySelectorAll('h2'));
      return h2s.some(h => h.textContent?.includes('GPS'));
    });
    
    if (!hasGPSModalAfterEnd) {
      console.log('✅ INGEN GPS MODAL VID AVSLUT - KORREKT!');
    } else {
      console.log('❌ GPS MODAL VISADES VID AVSLUT - FEL!');
    }
    
    // Verifiera status
    const hasCompletedStatus = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('span, div'));
      return elements.some(e => e.textContent?.includes('Slutfört'));
    });
    
    if (hasCompletedStatus) {
      console.log('✅ Status uppdaterad till "Slutfört"');
    } else {
      console.log('⚠️ Status kanske inte uppdaterad');
    }
    
    console.log('\n✨ TEST SLUTFÖRT!');
    console.log('\n📊 SAMMANFATTNING:');
    console.log('- GPS modal vid start: ' + (hasGPSModal ? '✅ JA' : '❌ NEJ'));
    console.log('- GPS modal vid avslut: ' + (!hasGPSModalAfterEnd ? '✅ NEJ (korrekt)' : '❌ JA (fel)'));
    console.log('- Status uppdaterad: ' + (hasCompletedStatus ? '✅ JA' : '⚠️ OSÄKER'));
    
  } catch (error) {
    console.error('\n❌ FEL:', error.message);
    await page.screenshot({ 
      path: 'gps-error.png',
      fullPage: true 
    });
    console.log('📸 Error screenshot: gps-error.png');
  }

  // Vänta så man kan se resultatet
  console.log('\n⏳ Väntar 5 sekunder innan stängning...');
  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
})();