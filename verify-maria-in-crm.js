import puppeteer from 'puppeteer';

async function verifyMariaInCRM() {
  console.log('🔍 Verifying Maria Johansson appears in all CRM pages...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });

  try {
    const page = await browser.newPage();
    const results = {};
    
    // 1. Check Offers page
    console.log('📊 Checking Offers page...');
    await page.goto('http://localhost:3000/crm/offerter', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    results.offers = await page.evaluate(() => {
      const body = document.body.textContent || '';
      return {
        hasMaria: body.includes('Maria Johansson') || body.includes('maria.johansson@example.com'),
        hasPhone: body.includes('+46 70 345 67 89'),
        hasAddress: body.includes('Gamla Stan') || body.includes('Vasastan'),
        tableRows: document.querySelectorAll('table tbody tr').length
      };
    });
    
    await page.screenshot({ path: 'verify-offers-page.png' });
    console.log('Offers page:', results.offers);
    
    // 2. Check Leads page
    console.log('\n📋 Checking Leads page...');
    await page.goto('http://localhost:3000/crm/leads', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    results.leads = await page.evaluate(() => {
      const body = document.body.textContent || '';
      return {
        hasMaria: body.includes('Maria Johansson') || body.includes('maria.johansson@example.com'),
        hasPhone: body.includes('+46 70 345 67 89'),
        leadCount: document.querySelectorAll('table tbody tr, [class*="card"]').length
      };
    });
    
    await page.screenshot({ path: 'verify-leads-page.png' });
    console.log('Leads page:', results.leads);
    
    // 3. Check Calendar
    console.log('\n📅 Checking Calendar...');
    await page.goto('http://localhost:3000/crm/kalender', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    results.calendar = await page.evaluate(() => {
      const body = document.body.textContent || '';
      return {
        hasMaria: body.includes('Maria Johansson') || body.includes('maria.johansson@example.com'),
        hasAddress: body.includes('Gamla Stan') || body.includes('Vasastan'),
        eventCount: document.querySelectorAll('[class*="event"], [class*="appointment"], [class*="job"]').length
      };
    });
    
    await page.screenshot({ path: 'verify-calendar-page.png' });
    console.log('Calendar:', results.calendar);
    
    // 4. Check API endpoints directly
    console.log('\n🔌 Checking API responses...');
    
    const apiChecks = [
      { name: 'Offers', url: 'http://localhost:3000/api/offers' },
      { name: 'Leads', url: 'http://localhost:3000/api/crm/leads' },
      { name: 'Jobs', url: 'http://localhost:3000/api/crm/jobs' }
    ];
    
    for (const check of apiChecks) {
      const response = await fetch(check.url);
      const data = await response.json();
      
      let found = false;
      let count = 0;
      
      if (check.name === 'Offers' && data.offers) {
        count = data.offers.length;
        found = data.offers.some(o => 
          o.customerEmail === 'maria.johansson@example.com' ||
          o.customerName === 'Maria Johansson'
        );
      } else if (check.name === 'Leads' && data.leads) {
        count = data.leads.length;
        found = data.leads.some(l => 
          l.email === 'maria.johansson@example.com' ||
          l.name === 'Maria Johansson'
        );
      } else if (check.name === 'Jobs' && data.jobs) {
        count = data.jobs.length;
        found = data.jobs.some(j => 
          j.customerEmail === 'maria.johansson@example.com' ||
          j.customerName === 'Maria Johansson'
        );
      }
      
      console.log(`${check.name} API: ${found ? 'Found Maria ✅' : 'No Maria ❌'} (Total: ${count})`);
    }
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('=' .repeat(50));
    console.log(`Offers page: ${results.offers.hasMaria ? 'VISIBLE ✅' : 'NOT VISIBLE ❌'}`);
    console.log(`Leads page: ${results.leads.hasMaria ? 'VISIBLE ✅' : 'NOT VISIBLE ❌'}`);
    console.log(`Calendar: ${results.calendar.hasMaria ? 'VISIBLE ✅' : 'NOT VISIBLE ❌'}`);
    
    const allVisible = results.offers.hasMaria && results.leads.hasMaria && results.calendar.hasMaria;
    console.log(`\nOverall: ${allVisible ? 'SUCCESS - Maria is visible everywhere! ✅' : 'INCOMPLETE - Some pages need fixing ❌'}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

verifyMariaInCRM();