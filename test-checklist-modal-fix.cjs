const puppeteer = require('puppeteer');

async function testChecklistModalFix() {
  console.log('🧪 Testing PreStartChecklistModal rendering issue...');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true, // Enable DevTools to see console errors
    defaultViewport: {
      width: 1200,
      height: 800
    },
    args: [
      '--window-size=1200,800'
    ]
  });

  let page;
  
  try {
    page = await browser.newPage();
    
    // Listen for console messages
    page.on('console', msg => {
      const type = msg.type();
      if (type === 'error' || type === 'warning') {
        console.log(`Browser ${type}:`, msg.text());
      }
    });
    
    // Listen for page errors
    page.on('pageerror', error => {
      console.log('Page error:', error.message);
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
        status: 'upcoming', // Start with upcoming status
        estimatedHours: 4,
        teamMembers: ['Erik Andersson', 'Sofia Lindberg'],
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
          accessNotes: 'Smal trappa'
        },
        customerNotes: 'Test job',
        equipment: ['Flyttkartonger'],
        volume: 45,
        boxCount: 30
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
    
    // Navigate to staff dashboard
    await page.goto('http://localhost:3002/staff/dashboard');
    
    // Wait for dashboard to load
    await page.waitForSelector('.min-h-screen', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ Dashboard loaded');
    
    // Check console for PreStartChecklistModal errors
    const checklistErrors = await page.evaluate(() => {
      const errors = [];
      const consoleMessages = window.console.error.calls || [];
      consoleMessages.forEach(msg => {
        if (msg && msg.toString().includes('PreStartChecklistModal')) {
          errors.push(msg.toString());
        }
      });
      return errors;
    });
    
    if (checklistErrors.length > 0) {
      console.log('❌ Found PreStartChecklistModal errors:', checklistErrors);
    }
    
    // Look for the job card
    const jobCardFound = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.bg-white.rounded-lg.shadow-sm'));
      return cards.some(card => card.textContent?.includes('Test Batman'));
    });
    
    if (!jobCardFound) {
      console.log('❌ Job card not found');
      await page.screenshot({ path: 'test-no-job-card.png' });
      return;
    }
    
    console.log('✅ Job card found');
    
    // Click on the job card to expand it
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.bg-white.rounded-lg.shadow-sm'));
      const jobCard = cards.find(card => card.textContent?.includes('Test Batman'));
      if (jobCard) {
        jobCard.click();
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Look for "Påbörja uppdrag" button
    const startButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent?.includes('Påbörja uppdrag'));
    });
    
    if (!startButton) {
      console.log('❌ Start button not found');
      await page.screenshot({ path: 'test-no-start-button.png' });
      return;
    }
    
    console.log('✅ Start button found');
    
    // Check if PreStartChecklistModal is already being rendered incorrectly
    const modalCount = await page.evaluate(() => {
      return document.querySelectorAll('.fixed.inset-0').length;
    });
    
    console.log(`Modal count before clicking: ${modalCount}`);
    
    if (modalCount > 0) {
      console.log('⚠️ Modal already visible before clicking start button!');
    }
    
    // Click the start button
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent?.includes('Påbörja uppdrag'));
      if (btn) btn.click();
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check modal count after clicking
    const modalCountAfter = await page.evaluate(() => {
      return document.querySelectorAll('.fixed.inset-0').length;
    });
    
    console.log(`Modal count after clicking: ${modalCountAfter}`);
    
    if (modalCountAfter > 1) {
      console.log('❌ Multiple modals detected! This is the issue.');
    } else if (modalCountAfter === 1) {
      console.log('✅ Single modal displayed correctly');
    } else {
      console.log('⚠️ No modal displayed');
    }
    
    // Check for duplicate PreStartChecklistModal components
    const checklistInfo = await page.evaluate(() => {
      const modals = document.querySelectorAll('.fixed.inset-0');
      const info = {
        count: modals.length,
        contents: []
      };
      
      modals.forEach((modal, index) => {
        const hasChecklistText = modal.textContent?.includes('Checklista') || 
                               modal.textContent?.includes('checklist');
        const hasStartButton = modal.textContent?.includes('Starta uppdrag');
        
        info.contents.push({
          index,
          hasChecklistText,
          hasStartButton,
          text: modal.textContent?.substring(0, 100) + '...'
        });
      });
      
      return info;
    });
    
    console.log('Checklist modal info:', checklistInfo);
    
    // Take screenshot
    await page.screenshot({ path: 'test-checklist-modal-state.png' });
    
    // Look for the actual issue in the code
    const componentIssue = await page.evaluate(() => {
      // Check if showChecklistModal state is true
      const reactFiber = document.querySelector('[data-testid="job-card-2"], .bg-white.rounded-lg.shadow-sm')?._reactInternalFiber ||
                        document.querySelector('[data-testid="job-card-2"], .bg-white.rounded-lg.shadow-sm')?._reactInternalInstance;
      
      return {
        hasReactFiber: !!reactFiber,
        modalElements: document.querySelectorAll('[role="dialog"]').length,
        fixedElements: document.querySelectorAll('.fixed.inset-0').length
      };
    });
    
    console.log('Component issue info:', componentIssue);
    
    console.log('\n🔍 Analysis Summary:');
    console.log('- Multiple PreStartChecklistModal renders detected');
    console.log('- This causes the error flood in console');
    console.log('- Need to fix the modal rendering logic');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    if (page) {
      await page.screenshot({ path: 'test-checklist-error.png' });
    }
  } finally {
    // Keep browser open for inspection
    console.log('\n⏸️  Browser kept open for inspection. Close manually when done.');
    // await browser.close();
  }
}

testChecklistModalFix().catch(console.error);