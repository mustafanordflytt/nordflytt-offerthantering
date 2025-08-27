const puppeteer = require('puppeteer');

(async () => {
  console.log('🧪 Snabb test av z-index fix...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 1000,
    devtools: false,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  
  try {
    // Navigera till profil
    console.log('1️⃣ Går till Lars profil...');
    await page.goto('http://localhost:3000/crm/anstallda/staff-001', { 
      waitUntil: 'networkidle0',
      timeout: 15000 
    });
    
    // Klicka på Avtal-tab
    console.log('2️⃣ Klickar på Avtal-tab...');
    await page.click('[role="tab"]:nth-child(2)'); // Andra tabben är Avtal
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Klicka på Generera knappen
    console.log('3️⃣ Klickar på Generera knappen...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const generateBtn = buttons.find(btn => btn.textContent.includes('Generera Anställningsavtal'));
      if (generateBtn) generateBtn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Ta screenshot före dropdown-test
    await page.screenshot({ path: 'z-index-test-before.png' });
    console.log('📸 Screenshot: z-index-test-before.png');
    
    // Klicka på dropdown
    console.log('4️⃣ Öppnar dropdown...');
    try {
      await page.click('[data-placeholder="Välj roll för avtalet"]');
    } catch {
      await page.evaluate(() => {
        const trigger = document.querySelector('button[role="combobox"]') || 
                       document.querySelector('[data-testid="select-trigger"]') ||
                       document.querySelector('button[aria-haspopup="listbox"]');
        if (trigger) trigger.click();
      });
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Ta screenshot efter dropdown
    await page.screenshot({ path: 'z-index-test-after.png' });
    console.log('📸 Screenshot: z-index-test-after.png');
    
    console.log('✅ Test slutfört!');
    
  } catch (error) {
    console.error('❌ Test misslyckades:', error.message);
    await page.screenshot({ path: 'z-index-test-error.png' });
  }
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  await browser.close();
})();