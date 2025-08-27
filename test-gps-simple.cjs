// Enkel GPS modal test utan reload
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 390, height: 844 }
  });
  const page = await browser.newPage();

  try {
    console.log('🚀 GPS Modal Test\n');
    
    // Steg 1: Sätt mock data FÖRE vi navigerar
    await page.evaluateOnNewDocument(() => {
      const mockJob = {
        id: '1',
        bookingNumber: 'NF-TEST-001',
        customerName: 'Anna Holm',
        customerPhone: '+46 70 123 45 67',
        fromAddress: 'Kungsgatan 10, Stockholm',
        toAddress: 'Vasagatan 25, Stockholm',
        moveTime: '08:00',
        endTime: '12:00',
        status: 'upcoming',
        estimatedHours: 4,
        teamMembers: ['Erik Andersson'],
        priority: 'high',
        distance: 2.5,
        serviceType: 'moving',
        services: ['Flytt'],
        specialRequirements: [],
        locationInfo: {
          doorCode: '1234',
          floor: 3,
          elevator: false,
          elevatorStatus: 'Ingen hiss',
          parkingDistance: 50,
          accessNotes: ''
        },
        customerNotes: '',
        equipment: [],
        volume: 25
      };
      
      window.localStorage.setItem('mockJobs', JSON.stringify([mockJob]));
      window.localStorage.setItem('mockJobStatuses', '{}');
    });
    
    // Steg 2: Gå till login
    console.log('📱 Navigerar till staff...');
    await page.goto('http://localhost:3000/staff');
    await new Promise(r => setTimeout(r, 2000));
    
    // Steg 3: Logga in
    console.log('🔐 Loggar in...');
    const loginSuccess = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const erikBtn = buttons.find(b => b.textContent?.includes('Erik'));
      if (erikBtn) {
        erikBtn.click();
        return true;
      }
      return false;
    });
    
    if (!loginSuccess) {
      throw new Error('Kunde inte hitta login-knapp');
    }
    
    await new Promise(r => setTimeout(r, 3000));
    
    // Steg 4: Vänta på navigation till dashboard
    console.log('📊 Väntar på dashboard...');
    await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
    
    // Om vi fortfarande är på login, navigera manuellt
    const currentUrl = page.url();
    if (!currentUrl.includes('dashboard')) {
      console.log('📍 Navigerar till dashboard manuellt...');
      await page.goto('http://localhost:3000/staff/dashboard');
      await new Promise(r => setTimeout(r, 2000));
    }
    
    await page.screenshot({ 
      path: 'gps-1-dashboard.png',
      fullPage: false 
    });
    
    // Steg 5: Hitta och klicka påbörja
    console.log('\n🎯 TEST: Starta jobb med GPS modal');
    
    const hasStartButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(b => b.textContent?.includes('Påbörja uppdrag'));
    });
    
    if (!hasStartButton) {
      // Debug: lista alla knappar
      const allButtons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button'))
          .map(b => b.textContent?.trim())
          .filter(t => t);
      });
      console.log('Tillgängliga knappar:', allButtons);
      
      // Kolla om det finns jobbkort
      const jobCards = await page.evaluate(() => {
        return document.querySelectorAll('.bg-gray-50.rounded-lg').length;
      });
      console.log('Antal jobbkort:', jobCards);
      
      throw new Error('Ingen påbörja-knapp hittades');
    }
    
    // Klicka påbörja
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const startBtn = buttons.find(b => b.textContent?.includes('Påbörja uppdrag'));
      if (startBtn) startBtn.click();
    });
    
    console.log('✅ Klickade påbörja');
    await new Promise(r => setTimeout(r, 1500));
    
    await page.screenshot({ 
      path: 'gps-2-after-start-click.png',
      fullPage: false 
    });
    
    // Hantera checklista om den visas
    const hasChecklist = await page.evaluate(() => {
      const h2s = Array.from(document.querySelectorAll('h2'));
      return h2s.some(h => h.textContent?.includes('Checklista'));
    });
    
    if (hasChecklist) {
      console.log('📋 Checklista visas, klickar starta...');
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const startBtn = buttons.find(b => b.textContent?.includes('Starta uppdrag'));
        if (startBtn) startBtn.click();
      });
      await new Promise(r => setTimeout(r, 1500));
    }
    
    await page.screenshot({ 
      path: 'gps-3-gps-modal.png',
      fullPage: false 
    });
    
    // Verifiera GPS modal
    const hasGPS = await page.evaluate(() => {
      return document.body.textContent?.includes('GPS-position') || 
             document.body.textContent?.includes('GPS position');
    });
    
    if (hasGPS) {
      console.log('✅ GPS MODAL VISAS - KORREKT!');
      
      // Klicka starta ändå
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const startBtn = buttons.find(b => b.textContent?.includes('Starta ändå'));
        if (startBtn) startBtn.click();
      });
      await new Promise(r => setTimeout(r, 2000));
    } else {
      console.log('❌ GPS modal visades INTE');
    }
    
    // Nu testa avslut
    console.log('\n🏁 TEST: Avsluta jobb utan GPS modal');
    
    await page.screenshot({ 
      path: 'gps-4-job-active.png',
      fullPage: false 
    });
    
    // Scrolla för mobile action bar
    await page.evaluate(() => window.scrollBy(0, 300));
    await new Promise(r => setTimeout(r, 500));
    
    // Hitta avsluta-knapp
    const hasEndButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(b => {
        const text = b.textContent || '';
        return text.includes('Avsluta') && !text.includes('session');
      });
    });
    
    if (hasEndButton) {
      console.log('✅ Hittade avsluta-knapp');
      
      await page.screenshot({ 
        path: 'gps-5-before-end.png',
        fullPage: false 
      });
      
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const endBtn = buttons.find(b => {
          const text = b.textContent || '';
          return text.includes('Avsluta') && !text.includes('session');
        });
        if (endBtn) endBtn.click();
      });
      
      await new Promise(r => setTimeout(r, 2000));
      
      await page.screenshot({ 
        path: 'gps-6-after-end.png',
        fullPage: false 
      });
      
      // Kolla om GPS visas
      const hasGPSAfterEnd = await page.evaluate(() => {
        return document.body.textContent?.includes('GPS-position') || 
               document.body.textContent?.includes('GPS position');
      });
      
      if (!hasGPSAfterEnd) {
        console.log('✅ INGEN GPS MODAL - KORREKT!');
      } else {
        console.log('❌ GPS modal visades vid avslut');
      }
    } else {
      console.log('❌ Ingen avsluta-knapp');
    }
    
    console.log('\n✨ Test klart!');
    
  } catch (error) {
    console.error('❌ Fel:', error.message);
    await page.screenshot({ 
      path: 'gps-error.png',
      fullPage: true 
    });
  }

  await new Promise(r => setTimeout(r, 3000));
  await browser.close();
})();