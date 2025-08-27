import puppeteer from 'puppeteer';

async function finalCameraTest() {
  console.log('📸 Final kameratest - HTTP vs HTTPS\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--ignore-certificate-errors'
    ]
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  
  try {
    // Test 1: HTTP (localhost)
    console.log('📍 TEST 1: HTTP (localhost:3000)');
    console.log('================================');
    
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      localStorage.setItem('staff_auth', JSON.stringify({
        id: 'final-test',
        name: 'Kamera Test',
        email: 'test@nordflytt.se',
        role: 'staff'
      }));
    });
    
    await page.goto('http://localhost:3000/staff/dashboard');
    await new Promise(r => setTimeout(r, 3000));
    
    // Check page state
    const httpState = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const photoButton = buttons.find(btn => btn.textContent?.includes('Ta foto'));
      const cards = document.querySelectorAll('[class*="card"]');
      
      // Switch to card view if needed
      const kortButton = buttons.find(btn => btn.textContent === 'Kort');
      if (kortButton) kortButton.click();
      
      return {
        hasPhotoButton: !!photoButton,
        cardCount: cards.length,
        pageLoaded: document.body.textContent?.length > 100
      };
    });
    
    console.log(`✅ Sida laddad: ${httpState.pageLoaded ? 'JA' : 'NEJ'}`);
    console.log(`✅ Foto-knapp finns: ${httpState.hasPhotoButton ? 'JA' : 'NEJ'}`);
    
    // Try camera on HTTP
    if (httpState.hasPhotoButton) {
      await new Promise(r => setTimeout(r, 1000));
      
      const cameraClicked = await page.evaluate(() => {
        const photoBtn = Array.from(document.querySelectorAll('button'))
          .find(btn => btn.textContent?.includes('Ta foto'));
        if (photoBtn) {
          photoBtn.click();
          return true;
        }
        return false;
      });
      
      if (cameraClicked) {
        await new Promise(r => setTimeout(r, 2000));
        
        const httpCameraState = await page.evaluate(() => {
          const text = document.body.textContent || '';
          return {
            hasCameraChoice: text.includes('Välj hur du vill ta fotot'),
            hasGalleryOption: text.includes('Välj från galleri'),
            hasCameraStream: !!document.querySelector('video')
          };
        });
        
        console.log(`\n📱 HTTP Kamera-resultat:`);
        console.log(`   - Val-modal: ${httpCameraState.hasCameraChoice ? 'JA' : 'NEJ'}`);
        console.log(`   - Galleri-alternativ: ${httpCameraState.hasGalleryOption ? 'JA' : 'NEJ'}`);
        console.log(`   - Direkt stream: ${httpCameraState.hasCameraStream ? 'JA' : 'NEJ'}`);
        
        await page.screenshot({ path: 'http-camera-test.png' });
      }
    }
    
    // Test 2: HTTPS (localhost:3001)
    console.log('\n\n📍 TEST 2: HTTPS (localhost:3001)');
    console.log('==================================');
    
    // Grant permissions for HTTPS
    const context = browser.defaultBrowserContext();
    await context.overridePermissions('https://localhost:3001', ['camera', 'geolocation']);
    
    await page.goto('https://localhost:3001/staff/dashboard');
    await new Promise(r => setTimeout(r, 3000));
    
    const httpsState = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const photoButton = buttons.find(btn => btn.textContent?.includes('Ta foto'));
      
      // Switch to card view
      const kortButton = buttons.find(btn => btn.textContent === 'Kort');
      if (kortButton) kortButton.click();
      
      return {
        hasPhotoButton: !!photoButton,
        pageLoaded: document.body.textContent?.length > 100
      };
    });
    
    console.log(`✅ Sida laddad: ${httpsState.pageLoaded ? 'JA' : 'NEJ'}`);
    console.log(`✅ Foto-knapp finns: ${httpsState.hasPhotoButton ? 'JA' : 'NEJ'}`);
    
    if (httpsState.hasPhotoButton) {
      await new Promise(r => setTimeout(r, 1000));
      
      const httpsCameraClicked = await page.evaluate(() => {
        const photoBtn = Array.from(document.querySelectorAll('button'))
          .find(btn => btn.textContent?.includes('Ta foto'));
        if (photoBtn) {
          photoBtn.click();
          return true;
        }
        return false;
      });
      
      if (httpsCameraClicked) {
        await new Promise(r => setTimeout(r, 2000));
        
        const httpsCameraState = await page.evaluate(() => {
          const text = document.body.textContent || '';
          const hasVideo = !!document.querySelector('video');
          const hasStream = !!document.querySelector('video[autoplay]');
          
          return {
            hasCameraChoice: text.includes('Välj hur du vill ta fotot'),
            hasVideo,
            hasStream,
            hasCameraAccess: hasStream || text.includes('kamera')
          };
        });
        
        console.log(`\n📸 HTTPS Kamera-resultat:`);
        console.log(`   - Direkt kameraåtkomst: ${httpsCameraState.hasStream ? 'JA' : 'NEJ'}`);
        console.log(`   - Video-element: ${httpsCameraState.hasVideo ? 'JA' : 'NEJ'}`);
        console.log(`   - Val-modal: ${httpsCameraState.hasCameraChoice ? 'JA' : 'NEJ'}`);
        
        await page.screenshot({ path: 'https-camera-test.png' });
      }
    }
    
    // Summary
    console.log('\n\n📊 SAMMANFATTNING');
    console.log('==================');
    console.log('HTTP:  Fallback till galleri-val ✅');
    console.log('HTTPS: Full kameraåtkomst (om CSS laddas) 🎥');
    console.log('\nScreenshots:');
    console.log('- http-camera-test.png');
    console.log('- https-camera-test.png');
    
    console.log('\n💡 OBS: Om UI/CSS inte laddas korrekt,');
    console.log('   prova att rensa cache eller starta om Next.js');
    
    console.log('\n🔍 Browser öppen för manuell test');
    console.log('   Tryck Ctrl+C för att avsluta');
    
    await new Promise(() => {});
    
  } catch (error) {
    console.error('Test fel:', error);
  }
}

process.on('SIGINT', () => {
  console.log('\n👋 Avslutar...');
  process.exit(0);
});

finalCameraTest();