import puppeteer from 'puppeteer';
import fs from 'fs';

const log = [];
function record(message) {
  const timestamp = new Date().toLocaleTimeString('sv-SE');
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  log.push(logMessage);
}

async function observeFormJourney() {
  record('🔍 OBSERVER MODE - Jag följer med dig genom formuläret\n');
  record('Instruktioner:');
  record('1. Gå igenom formuläret i din egen takt');
  record('2. Välj alla extratjänster du vill testa');
  record('3. Jag tar screenshots efter varje steg');
  record('4. Tryck Enter i terminalen för att ta screenshot när du vill\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--window-size=1280,800', '--window-position=0,0']
  });

  const page = await browser.newPage();
  let screenshotCount = 0;
  
  // Navigate to form
  record('Öppnar formuläret...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  
  // Take initial screenshot
  await page.screenshot({ path: `observe-00-start.png`, fullPage: true });
  record('📸 Start screenshot: observe-00-start.png');

  // Setup keyboard listener for manual screenshots
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  record('\n👀 OBSERVERAR NU - Tryck Enter för att ta screenshot när som helst...\n');

  // Function to take screenshot and analyze
  async function takeSnapshotAndAnalyze() {
    screenshotCount++;
    const filename = `observe-${String(screenshotCount).padStart(2, '0')}-step.png`;
    
    try {
      await page.screenshot({ path: filename, fullPage: true });
      record(`\n📸 Screenshot ${screenshotCount}: ${filename}`);
      
      // Analyze current page
      const analysis = await page.evaluate(() => {
        // Check current step
        const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent);
        const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent);
        const selectedServices = Array.from(document.querySelectorAll('input:checked')).map(input => {
          const label = input.closest('label');
          return label ? label.textContent : 'Unknown selection';
        });
        
        // Check for specific content
        const hasPackning = document.body.textContent.includes('Packning & emballering');
        const hasStadning = document.body.textContent.includes('Flyttstädning');
        const hasKartonger = document.body.textContent.includes('kartong');
        
        return {
          url: window.location.href,
          headings,
          buttons: buttons.slice(0, 5),
          selectedServices,
          contentChecks: {
            hasPackning,
            hasStadning,
            hasKartonger
          }
        };
      });
      
      record('\n📊 Sidanalys:');
      record(`URL: ${analysis.url}`);
      if (analysis.headings.length > 0) {
        record(`Rubriker: ${analysis.headings.slice(0, 3).join(', ')}`);
      }
      if (analysis.selectedServices.length > 0) {
        record(`\n✅ Valda tjänster:`);
        analysis.selectedServices.forEach(service => record(`  - ${service}`));
      }
      record(`\n🔍 Innehållskontroll:`);
      record(`  - Packning & emballering synlig: ${analysis.contentChecks.hasPackning ? '✅' : '❌'}`);
      record(`  - Flyttstädning synlig: ${analysis.contentChecks.hasStadning ? '✅' : '❌'}`);
      record(`  - Kartonger nämnda: ${analysis.contentChecks.hasKartonger ? '✅' : '❌'}`);
      
    } catch (error) {
      record(`❌ Kunde inte ta screenshot: ${error.message}`);
    }
  }

  // Listen for Enter key
  rl.on('line', async () => {
    await takeSnapshotAndAnalyze();
    record('\nFortsätt navigera... (Tryck Enter för nästa screenshot)');
  });

  // Monitor for important events
  page.on('framenavigated', async (frame) => {
    if (frame === page.mainFrame()) {
      const url = frame.url();
      record(`\n🔄 Navigerade till: ${url}`);
      
      // Auto-screenshot on important pages
      if (url.includes('/offer/') || url.includes('/order-confirmation/')) {
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for load
        await takeSnapshotAndAnalyze();
        
        record('\n⭐ VIKTIGT: Nu är vi på offert/bekräftelsesidan!');
        record('Kontrollerar om extratjänsterna syns...\n');
      }
    }
  });

  // Keep running until user closes browser
  browser.on('disconnected', () => {
    record('\n\n📋 OBSERVATIONSSUMMERING:');
    record(`Totalt antal screenshots: ${screenshotCount + 1}`);
    record('\nSkapar rapport...');
    
    fs.writeFileSync('OBSERVATION-REPORT.md', log.join('\n'));
    record('📄 Rapport sparad: OBSERVATION-REPORT.md');
    
    console.log('\n✅ Observation klar!');
    process.exit(0);
  });
}

observeFormJourney().catch(console.error);