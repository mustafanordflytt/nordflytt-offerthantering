const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting UI debug...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Gå till anställda sidan
    await page.goto('http://localhost:3001/crm/anstallda/staff-009', { 
      waitUntil: 'networkidle0' 
    });
    
    console.log('1. Navigerade till anställda sidan');
    await page.waitForTimeout(2000);
    
    // Klicka på Avtal tab
    const avtalTab = await page.$('button:has-text("Avtal")');
    if (avtalTab) {
      await avtalTab.click();
      console.log('2. Klickade på Avtal tab');
      await page.waitForTimeout(1000);
    }
    
    // Leta efter contract status element
    const contractCard = await page.$('.bg-blue-50');
    if (contractCard) {
      console.log('3. ✅ Hittade blå status-ruta!');
      const text = await contractCard.innerText();
      console.log('   Innehåll:', text);
    } else {
      console.log('3. ❌ Hittade INTE blå status-ruta');
    }
    
    // Kolla vad som faktiskt finns på sidan
    const contractContent = await page.evaluate(() => {
      const cards = document.querySelectorAll('[class*="card"]');
      const result = {
        antalCards: cards.length,
        innehåll: []
      };
      
      cards.forEach((card, index) => {
        result.innehåll.push({
          index: index,
          text: card.innerText,
          classes: card.className,
          innerHTML: card.innerHTML.substring(0, 200) + '...'
        });
      });
      
      return result;
    });
    
    console.log('\n4. Alla cards på sidan:');
    console.log(JSON.stringify(contractContent, null, 2));
    
    // Kolla specifikt efter status badge
    const badges = await page.evaluate(() => {
      const allBadges = document.querySelectorAll('[class*="badge"]');
      return Array.from(allBadges).map(badge => ({
        text: badge.innerText,
        classes: badge.className
      }));
    });
    
    console.log('\n5. Alla badges på sidan:');
    console.log(JSON.stringify(badges, null, 2));
    
    // Kolla efter bg-blue-50 eller liknande
    const blueElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="blue"]');
      return Array.from(elements).map(el => ({
        tag: el.tagName,
        classes: el.className,
        text: el.innerText?.substring(0, 100)
      }));
    });
    
    console.log('\n6. Alla element med "blue" i klassnamn:');
    console.log(JSON.stringify(blueElements, null, 2));
    
    // Ta screenshot
    await page.screenshot({ path: 'debug-contract-ui.png', fullPage: true });
    console.log('\n7. Screenshot sparad som debug-contract-ui.png');
    
  } catch (error) {
    console.error('Fel:', error);
  }
  
  await browser.close();
})();