const puppeteer = require('puppeteer');

async function testChecklistFixed() {
  console.log('🧪 Testing if PreStartChecklistModal issue is fixed...');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    defaultViewport: {
      width: 1200,
      height: 800
    }
  });

  let page;
  
  try {
    page = await browser.newPage();
    
    // Collect console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Set up mock job
    await page.evaluateOnNewDocument(() => {
      const mockJob = {
        id: '2',
        bookingNumber: 'NF-2024-002',
        customerName: 'Test Batman',
        customerPhone: '+46 70 123 45 67',
        fromAddress: 'Testgatan 123, Stockholm',
        toAddress: 'Flyttgatan 456, Stockholm',
        moveTime: '09:00',
        endTime: '13:00',
        status: 'upcoming',
        estimatedHours: 4,
        teamMembers: ['Erik Andersson'],
        priority: 'high',
        distance: 15.3,
        serviceType: 'moving',
        services: ['Flytt'],
        specialRequirements: [],
        locationInfo: {
          doorCode: '1234',
          floor: 4,
          elevator: false,
          elevatorStatus: 'Ingen hiss',
          parkingDistance: 100,
          accessNotes: ''
        },
        customerNotes: '',
        equipment: ['Flyttkartonger'],
        volume: 45
      };
      
      localStorage.setItem('mockJobs', JSON.stringify([mockJob]));
      localStorage.setItem('staff_auth', JSON.stringify({
        id: '1',
        email: 'test@nordflytt.se',
        name: 'Test User',
        role: 'mover',
        loginTime: new Date().toISOString()
      }));
    });
    
    // Navigate to dashboard
    await page.goto('http://localhost:3002/staff/dashboard');
    
    // Wait for page to load
    await page.waitForSelector('.min-h-screen', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ Dashboard loaded');
    
    // Check initial console errors
    const initialErrors = consoleErrors.filter(err => 
      err.includes('PreStartChecklistModal') || 
      err.includes('jobData')
    );
    
    if (initialErrors.length > 0) {
      console.log(`❌ Found ${initialErrors.length} errors on page load`);
      console.log('First error:', initialErrors[0]);
    } else {
      console.log('✅ No PreStartChecklistModal errors on initial load');
    }
    
    // Check that no modal is visible initially
    const initialModals = await page.evaluate(() => {
      return document.querySelectorAll('.fixed.inset-0').length;
    });
    
    console.log(`Initial modal count: ${initialModals}`);
    
    if (initialModals === 0) {
      console.log('✅ No modals visible on initial load');
    } else {
      console.log('❌ Modal already visible on load!');
    }
    
    // Find and click the job card
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.bg-white.rounded-lg.shadow-sm'));
      const jobCard = cards.find(card => card.textContent?.includes('Test Batman'));
      if (jobCard) {
        jobCard.click();
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Clicked job card');
    
    // Find and click start button
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const startBtn = buttons.find(btn => btn.textContent?.includes('Påbörja uppdrag'));
      if (startBtn) {
        startBtn.click();
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Clicked start button');
    
    // Check modal count after click
    const modalCount = await page.evaluate(() => {
      return document.querySelectorAll('.fixed.inset-0').length;
    });
    
    console.log(`Modal count after click: ${modalCount}`);
    
    if (modalCount === 1) {
      console.log('✅ Exactly one modal displayed');
    } else if (modalCount === 0) {
      console.log('❌ No modal displayed');
    } else {
      console.log(`❌ Multiple modals displayed: ${modalCount}`);
    }
    
    // Check for checklist content
    const hasChecklist = await page.evaluate(() => {
      const modal = document.querySelector('.fixed.inset-0');
      return modal?.textContent?.includes('Checklista') || false;
    });
    
    if (hasChecklist) {
      console.log('✅ Checklist modal content found');
    } else {
      console.log('❌ Checklist content not found');
    }
    
    // Check console errors after interaction
    const errorsAfterClick = consoleErrors.filter(err => 
      err.includes('PreStartChecklistModal') || 
      err.includes('jobData')
    );
    
    console.log(`\n📊 Final Results:`);
    console.log(`- Total console errors: ${consoleErrors.length}`);
    console.log(`- PreStartChecklistModal errors: ${errorsAfterClick.length}`);
    
    if (errorsAfterClick.length === 0) {
      console.log('✅ No PreStartChecklistModal errors - Issue is fixed!');
    } else {
      console.log('❌ Still getting errors:', errorsAfterClick);
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'test-checklist-fixed-final.png' });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    if (page) {
      await page.screenshot({ path: 'test-checklist-fixed-error.png' });
    }
  } finally {
    await browser.close();
  }
}

testChecklistFixed().catch(console.error);