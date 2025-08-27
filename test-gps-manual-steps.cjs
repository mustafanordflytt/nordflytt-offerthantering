// Manuell GPS test med stegvis kontroll
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // Sätt viewport
  await page.setViewport({ width: 390, height: 844 });

  try {
    console.log('🚀 Manuell GPS Modal Test\n');
    
    // Navigera direkt till dashboard
    console.log('📱 Går direkt till dashboard...');
    await page.goto('http://localhost:3000/staff/dashboard');
    await new Promise(r => setTimeout(r, 3000));
    
    // Kolla om vi är på dashboard eller login
    const url = page.url();
    console.log('📍 URL:', url);
    
    // Om vi är på login, vänta på manuell inloggning
    if (url.includes('staff') && !url.includes('dashboard')) {
      console.log('\n⚠️ MANUELL INLOGGNING KRÄVS!');
      console.log('1. Klicka på "Erik (Flyttchef)"');
      console.log('2. Vänta tills du ser dashboard\n');
      
      // Vänta på att användaren loggar in manuellt
      await page.waitForNavigation({ 
        waitUntil: 'networkidle0',
        timeout: 30000 
      }).catch(() => {});
      
      console.log('✅ Inloggad!');
    }
    
    // Sätt mock data
    console.log('\n🔧 Sätter mock-data...');
    await page.evaluate(() => {
      const mockJob = {
        id: 'test-1',
        bookingNumber: 'NF-TEST-GPS',
        customerName: 'Test Kund GPS',
        customerPhone: '+46 70 999 88 77',
        fromAddress: 'Testgatan 1',
        toAddress: 'Målgatan 99',
        moveTime: '09:00',
        endTime: '13:00',
        status: 'upcoming',
        estimatedHours: 4,
        teamMembers: ['Du'],
        priority: 'high',
        distance: 5,
        serviceType: 'moving',
        services: ['Flytt'],
        specialRequirements: [],
        locationInfo: {
          doorCode: '1234',
          floor: 2,
          elevator: true,
          elevatorStatus: 'Fungerar',
          parkingDistance: 10,
          accessNotes: ''
        },
        customerNotes: 'Test GPS modal',
        equipment: [],
        volume: 20
      };
      
      localStorage.setItem('mockJobs', JSON.stringify([mockJob]));
      localStorage.setItem('mockJobStatuses', '{}');
      console.log('Mock job satt!');
    });
    
    // Ladda om för att få mock data
    console.log('🔄 Laddar om sidan...');
    await page.reload();
    await new Promise(r => setTimeout(r, 3000));
    
    console.log('\n📋 INSTRUKTIONER:');
    console.log('1. Du bör se "Test Kund GPS" jobbet');
    console.log('2. Klicka på "Påbörja uppdrag"');
    console.log('3. Checklista visas - klicka "Starta uppdrag"');
    console.log('4. GPS modal SKA visas nu!');
    console.log('5. Klicka "Starta ändå"');
    console.log('6. Jobbet blir pågående');
    console.log('7. Scrolla ner och klicka "Avsluta"');
    console.log('8. INGEN GPS modal ska visas!\n');
    
    console.log('⏳ Väntar 15 sekunder för manuell testning...\n');
    
    // Ta screenshots var 3:e sekund
    for(let i = 1; i <= 5; i++) {
      await new Promise(r => setTimeout(r, 3000));
      await page.screenshot({ 
        path: `gps-manual-${i}.png`,
        fullPage: false 
      });
      console.log(`📸 Screenshot ${i} tagen`);
    }
    
    // Slutkontroll
    console.log('\n🔍 Kontrollerar resultat...');
    
    const finalCheck = await page.evaluate(() => {
      const body = document.body.textContent || '';
      return {
        hasGPSText: body.includes('GPS') || body.includes('position'),
        hasPågående: body.includes('Pågående'),
        hasSlutfört: body.includes('Slutfört'),
        currentUrl: window.location.href
      };
    });
    
    console.log('\n📊 RESULTAT:');
    console.log('- GPS-text på sidan:', finalCheck.hasGPSText ? 'JA' : 'NEJ');
    console.log('- Pågående status:', finalCheck.hasPågående ? 'JA' : 'NEJ');
    console.log('- Slutfört status:', finalCheck.hasSlutfört ? 'JA' : 'NEJ');
    console.log('- URL:', finalCheck.currentUrl);
    
  } catch (error) {
    console.error('❌ Fel:', error.message);
  }

  console.log('\n✨ Test klart! Browsern stängs om 10 sekunder...');
  await new Promise(r => setTimeout(r, 10000));
  await browser.close();
})();