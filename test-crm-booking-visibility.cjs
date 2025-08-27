const puppeteer = require('puppeteer');
const path = require('path');

async function testBookingVisibility() {
  console.log('🔍 Testing booking visibility in CRM pages...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });

  try {
    const page = await browser.newPage();
    
    // Go to main CRM page first
    console.log('📱 Navigating to CRM dashboard...');
    await page.goto('http://localhost:3000/crm', { waitUntil: 'networkidle0' });
    
    // Take screenshot of main CRM page
    await page.screenshot({ 
      path: 'crm-main-page.png', 
      fullPage: true 
    });
    console.log('✅ Screenshot saved: crm-main-page.png');

    // Test 1: Check Offerter page
    console.log('\n1️⃣ Testing Offerter page...');
    await page.goto('http://localhost:3000/crm/offerter', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for data to load
    
    // Search for Maria Johansson's booking
    const searchInput = await page.$('input[placeholder*="Sök"]');
    if (searchInput) {
      await searchInput.type('Maria Johansson');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Check if any offers are visible
    const offerCount = await page.evaluate(() => {
      const rows = document.querySelectorAll('tbody tr');
      console.log('Found rows:', rows.length);
      
      // Log all customer names found
      const customerNames = [];
      rows.forEach(row => {
        const nameCell = row.querySelector('td:nth-child(2)');
        if (nameCell) {
          customerNames.push(nameCell.textContent.trim());
        }
      });
      console.log('Customer names found:', customerNames);
      
      return rows.length;
    });
    
    console.log(`Found ${offerCount} offers in the table`);
    
    // Look for BOOK1001 or Maria Johansson
    const mariaFound = await page.evaluate(() => {
      const pageText = document.body.textContent;
      return pageText.includes('Maria Johansson') || pageText.includes('BOOK1001') || pageText.includes('NF-23857BDE');
    });
    
    console.log(`Maria Johansson found in Offerter: ${mariaFound}`);
    
    await page.screenshot({ 
      path: 'crm-offerter-page.png', 
      fullPage: true 
    });
    console.log('✅ Screenshot saved: crm-offerter-page.png');

    // Test 2: Check Leads page
    console.log('\n2️⃣ Testing Leads page...');
    await page.goto('http://localhost:3000/crm/leads', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check leads count
    const leadCount = await page.evaluate(() => {
      const cards = document.querySelectorAll('[class*="cursor-move"]');
      console.log('Found lead cards:', cards.length);
      
      // Check pipeline columns
      const columns = document.querySelectorAll('[class*="w-72"]');
      console.log('Found pipeline columns:', columns.length);
      
      return cards.length;
    });
    
    console.log(`Found ${leadCount} leads in the pipeline`);
    
    // Search for Maria
    const leadSearchInput = await page.$('input[placeholder*="Sök"]');
    if (leadSearchInput) {
      await leadSearchInput.type('Maria Johansson');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const mariaInLeads = await page.evaluate(() => {
      const pageText = document.body.textContent;
      return pageText.includes('Maria Johansson') || pageText.includes('maria.johansson@email.com');
    });
    
    console.log(`Maria Johansson found in Leads: ${mariaInLeads}`);
    
    await page.screenshot({ 
      path: 'crm-leads-page.png', 
      fullPage: true 
    });
    console.log('✅ Screenshot saved: crm-leads-page.png');

    // Test 3: Check Kalender page
    console.log('\n3️⃣ Testing Kalender page...');
    await page.goto('http://localhost:3000/crm/kalender', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check for jobs in calendar
    const jobsInCalendar = await page.evaluate(() => {
      // Look for job entries in calendar cells
      const jobElements = document.querySelectorAll('[class*="truncate font-medium"]');
      const customerNames = [];
      
      jobElements.forEach(el => {
        const name = el.textContent.trim();
        if (name) customerNames.push(name);
      });
      
      console.log('Jobs found in calendar:', customerNames);
      return customerNames.length;
    });
    
    console.log(`Found ${jobsInCalendar} jobs in the calendar`);
    
    const mariaInCalendar = await page.evaluate(() => {
      const pageText = document.body.textContent;
      return pageText.includes('Maria Johansson');
    });
    
    console.log(`Maria Johansson found in Calendar: ${mariaInCalendar}`);
    
    await page.screenshot({ 
      path: 'crm-kalender-page.png', 
      fullPage: true 
    });
    console.log('✅ Screenshot saved: crm-kalender-page.png');

    // Test 4: Check API responses directly
    console.log('\n4️⃣ Testing API endpoints directly...');
    
    // Test offers API
    const offersResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/offers');
        const data = await response.json();
        console.log('Offers API response:', data);
        return { 
          success: true, 
          count: Array.isArray(data) ? data.length : 0,
          hasData: Array.isArray(data) && data.length > 0,
          sample: Array.isArray(data) ? data.slice(0, 3) : null
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    console.log('Offers API:', offersResponse);
    
    // Test leads API
    const leadsResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/crm/leads');
        const data = await response.json();
        console.log('Leads API response:', data);
        return { 
          success: true, 
          count: data.leads ? data.leads.length : 0,
          hasData: data.leads && data.leads.length > 0,
          sample: data.leads ? data.leads.slice(0, 3) : null
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    console.log('Leads API:', leadsResponse);
    
    // Test jobs API
    const jobsResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/crm/jobs');
        const data = await response.json();
        console.log('Jobs API response:', data);
        return { 
          success: true, 
          count: data.jobs ? data.jobs.length : 0,
          hasData: data.jobs && data.jobs.length > 0,
          sample: data.jobs ? data.jobs.slice(0, 3) : null
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    console.log('Jobs API:', jobsResponse);

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('=================');
    console.log(`Offerter page: ${mariaFound ? '✅' : '❌'} Maria found, ${offerCount} total offers`);
    console.log(`Leads page: ${mariaInLeads ? '✅' : '❌'} Maria found, ${leadCount} total leads`);
    console.log(`Calendar page: ${mariaInCalendar ? '✅' : '❌'} Maria found, ${jobsInCalendar} total jobs`);
    console.log('\nAPI Status:');
    console.log(`- Offers API: ${offersResponse.success ? `✅ ${offersResponse.count} offers` : '❌ Failed'}`);
    console.log(`- Leads API: ${leadsResponse.success ? `✅ ${leadsResponse.count} leads` : '❌ Failed'}`);
    console.log(`- Jobs API: ${jobsResponse.success ? `✅ ${jobsResponse.count} jobs` : '❌ Failed'}`);
    
    // Wait a bit before closing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testBookingVisibility().catch(console.error);