import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 1200 }
  });
  const page = await browser.newPage();
  
  // Gå till bekräftelsesidan med token för att komma förbi middleware
  await page.goto('http://localhost:3000/order-confirmation/3fa6a931-964e-431b-b3d1-61a6d09c7cb7?token=1234567890123456', {
    waitUntil: 'networkidle0'
  });
  
  // Vänta lite för att sidan ska ladda helt
  await new Promise(r => setTimeout(r, 3000));
  
  // Scrolla ner för att se tilläggstjänster
  await page.evaluate(() => {
    window.scrollBy(0, 400);
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Ta screenshot
  await page.screenshot({ 
    path: 'confirmation-with-token.png',
    fullPage: false
  });
  
  console.log('📸 Screenshot tagen: confirmation-with-token.png');
  
  // Scrolla ner mer för att se mer av sidan
  await page.evaluate(() => {
    window.scrollBy(0, 400);
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Ta en till screenshot längre ner
  await page.screenshot({ 
    path: 'confirmation-scrolled.png',
    fullPage: false
  });
  
  console.log('📸 Andra screenshot tagen: confirmation-scrolled.png');
  
  await browser.close();
  console.log('\n✅ Klart! Kolla screenshot-filerna.');
})();