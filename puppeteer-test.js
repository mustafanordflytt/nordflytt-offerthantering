const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('🚀 Startar Puppeteer test...');
    
    // Gå till staff dashboard
    await page.goto('http://localhost:3000/staff/dashboard', { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    
    console.log('📄 Sida laddad');
    
    // Vänta på att sidan laddar
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Kolla om vi behöver logga in
    const emailInput = await page.$('input[type="email"]');
    if (emailInput) {
      console.log('📝 Loggar in...');
      await page.type('input[type="email"]', 'erik.andersson@nordflytt.se');
      await page.type('input[type="password"]', 'test123');
      await page.click('button[type="submit"]');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Ta en skärmdump
    await page.screenshot({ path: 'dashboard-screenshot.png', fullPage: true });
    console.log('📸 Skärmdump sparad som dashboard-screenshot.png');
    
    // Kolla vilka komponenter som finns
    const components = await page.evaluate(() => {
      const elements = [];
      
      // Kolla efter WorkTimeDisplay
      const workTime = document.querySelector('h3');
      if (workTime && workTime.textContent.includes('Idag')) {
        elements.push('✅ WorkTimeDisplay hittat');
      } else {
        elements.push('❌ WorkTimeDisplay saknas');
      }
      
      // Kolla efter MaterialCalculation
      const materialCalc = Array.from(document.querySelectorAll('*')).find(el => 
        el.textContent && el.textContent.includes('Materialberäkning')
      );
      if (materialCalc) {
        elements.push('✅ MaterialCalculation hittat');
      } else {
        elements.push('❌ MaterialCalculation saknas');
      }
      
      // Kolla efter SmartPricingWidget
      const smartPricing = Array.from(document.querySelectorAll('*')).find(el => 
        el.textContent && el.textContent.includes('Smart Prissättning')
      );
      if (smartPricing) {
        elements.push('✅ SmartPricingWidget hittat');
      } else {
        elements.push('❌ SmartPricingWidget saknas');
      }
      
      // Kolla efter DesktopPhotoManager
      const photoManager = Array.from(document.querySelectorAll('*')).find(el => 
        el.textContent && (el.textContent.includes('Före-bilder') || el.textContent.includes('Dra och släpp'))
      );
      if (photoManager) {
        elements.push('✅ DesktopPhotoManager hittat');
      } else {
        elements.push('❌ DesktopPhotoManager saknas');
      }
      
      // Kolla alla h3-rubriker
      const headings = Array.from(document.querySelectorAll('h3')).map(h => h.textContent);
      elements.push('📝 H3-rubriker: ' + headings.join(', '));
      
      // Allmän info
      elements.push('📄 Sidtitel: ' + document.title);
      elements.push('🎯 URL: ' + window.location.href);
      
      return elements;
    });
    
    console.log('\n🔍 RESULTAT:');
    components.forEach(comp => console.log(comp));
    
    // Kolla efter fel i konsolen
    const logs = await page.evaluate(() => {
      return window.console.error ? 'Konsolfel finns' : 'Ingen konsolfel';
    });
    console.log('🐛 Konsolstatus:', logs);
    
  } catch (error) {
    console.error('❌ Fel:', error.message);
  } finally {
    await browser.close();
  }
})();