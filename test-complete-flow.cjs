const puppeteer = require('puppeteer');

async function testCompleteFlow() {
  console.log('🧪 Testing complete staff app flow with all fixes...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    defaultViewport: {
      width: 390,
      height: 844
    },
    args: [
      '--window-size=390,844',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  let page;
  const testResults = {
    dashboardLoad: false,
    noInitialErrors: false,
    jobCardVisible: false,
    checklistModalWorks: false,
    jobStarted: false,
    serviceModalWorks: false,
    servicesAdded: false,
    orderConfirmationWorks: false,
    jobCompleted: false,
    noFinalErrors: false
  };
  
  try {
    page = await browser.newPage();
    
    // Collect console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push({
          text: msg.text(),
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Set up mock data
    await page.evaluateOnNewDocument(() => {
      // Clear any existing data
      localStorage.clear();
      
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
        teamMembers: ['Erik Andersson', 'Sofia Lindberg'],
        priority: 'high',
        distance: 15.3,
        serviceType: 'moving',
        services: ['Packhjälp', 'Flytt', 'Flyttstädning'],
        specialRequirements: [],
        locationInfo: {
          doorCode: '1234',
          floor: 4,
          elevator: false,
          elevatorStatus: 'Ingen hiss',
          parkingDistance: 100,
          accessNotes: 'Smal trappa'
        },
        customerNotes: 'Var försiktig med möblerna',
        equipment: ['Flyttkartonger', 'Bubbelplast'],
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
    
    // Test 1: Dashboard Load
    console.log('1️⃣ Testing dashboard load...');
    await page.goto('http://localhost:3002/staff/dashboard');
    await page.waitForSelector('.min-h-screen', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    testResults.dashboardLoad = true;
    console.log('✅ Dashboard loaded successfully');
    
    // Test 2: Check for initial errors
    const initialErrors = consoleErrors.filter(err => 
      err.text.includes('PreStartChecklistModal') || 
      err.text.includes('jobData')
    );
    testResults.noInitialErrors = initialErrors.length === 0;
    console.log(testResults.noInitialErrors ? 
      '✅ No PreStartChecklistModal errors on load' : 
      `❌ Found ${initialErrors.length} errors on load`
    );
    
    // Test 3: Job card visibility
    const jobCardExists = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.bg-white.rounded-lg.shadow-sm'));
      return cards.some(card => card.textContent?.includes('Test Batman'));
    });
    testResults.jobCardVisible = jobCardExists;
    console.log(testResults.jobCardVisible ? 
      '✅ Job card visible' : 
      '❌ Job card not found'
    );
    
    await page.screenshot({ path: 'test-1-dashboard.png' });
    
    // Test 4: Checklist modal
    console.log('\n2️⃣ Testing job start flow...');
    
    // Click job card
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.bg-white.rounded-lg.shadow-sm'));
      const jobCard = cards.find(card => card.textContent?.includes('Test Batman'));
      if (jobCard) {
        jobCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        jobCard.click();
      }
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Click start button
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const startBtn = buttons.find(btn => btn.textContent?.includes('Påbörja uppdrag'));
      if (startBtn) {
        startBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        startBtn.click();
      }
    });
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Check checklist modal
    const checklistVisible = await page.evaluate(() => {
      const modal = document.querySelector('.fixed.inset-0');
      return modal?.textContent?.includes('Förbered uppdrag') || 
             modal?.textContent?.includes('Kontrollera följande');
    });
    testResults.checklistModalWorks = checklistVisible;
    console.log(testResults.checklistModalWorks ? 
      '✅ Checklist modal displayed' : 
      '❌ Checklist modal not found'
    );
    
    await page.screenshot({ path: 'test-2-checklist.png' });
    
    // Start job
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const startBtn = buttons.find(btn => btn.textContent?.includes('Starta uppdrag'));
      if (startBtn) startBtn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Handle GPS modal
    const gpsModalVisible = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('h2')).some(h => 
        h.textContent?.includes('GPS-bekräftelse')
      );
    });
    
    if (gpsModalVisible) {
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const gpsBtn = buttons.find(btn => btn.textContent?.includes('Starta ändå'));
        if (gpsBtn) gpsBtn.click();
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Check if job started
    const jobInProgress = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.bg-white.rounded-lg.shadow-sm'));
      const jobCard = cards.find(card => card.textContent?.includes('Test Batman'));
      return jobCard?.textContent?.includes('Pågående') || 
             jobCard?.textContent?.includes('in_progress') ||
             jobCard?.textContent?.includes('Uppdrag pågår');
    });
    testResults.jobStarted = jobInProgress;
    console.log(testResults.jobStarted ? 
      '✅ Job started successfully' : 
      '❌ Job not started'
    );
    
    await page.screenshot({ path: 'test-3-job-started.png' });
    
    // Test 5: Add services
    console.log('\n3️⃣ Testing service addition...');
    
    // Look for add service button
    const addServiceBtn = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent?.includes('Lägg till tjänst'));
      if (btn) {
        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return true;
      }
      return false;
    });
    
    if (addServiceBtn) {
      // Click add service
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.textContent?.includes('Lägg till tjänst'));
        if (btn) btn.click();
      });
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      testResults.serviceModalWorks = await page.evaluate(() => {
        return document.querySelector('.fixed.inset-0') !== null;
      });
      console.log(testResults.serviceModalWorks ? 
        '✅ Service modal opened' : 
        '❌ Service modal not opened'
      );
      
      if (testResults.serviceModalWorks) {
        // Click Material tab
        await page.evaluate(() => {
          const tabs = Array.from(document.querySelectorAll('button'));
          const materialTab = tabs.find(tab => tab.textContent?.includes('Material'));
          if (materialTab) materialTab.click();
        });
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Add items
        await page.evaluate(() => {
          const plusButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
            btn.innerHTML.includes('svg') && 
            btn.classList.contains('bg-[#002A5C]') &&
            btn.classList.contains('rounded-full')
          );
          // Add 10 boxes
          if (plusButtons[0]) {
            for (let i = 0; i < 10; i++) {
              plusButtons[0].click();
            }
          }
          // Add 2 tape
          if (plusButtons[1]) {
            for (let i = 0; i < 2; i++) {
              plusButtons[1].click();
            }
          }
        });
        
        await page.screenshot({ path: 'test-4-services-selected.png' });
        
        // Confirm services
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const confirmBtn = buttons.find(btn => 
            btn.textContent?.includes('Bekräfta') && 
            btn.classList.contains('bg-green-600')
          );
          if (confirmBtn) confirmBtn.click();
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if services added to job card
        testResults.servicesAdded = await page.evaluate(() => {
          const cards = Array.from(document.querySelectorAll('.bg-white.rounded-lg.shadow-sm'));
          const jobCard = cards.find(card => card.textContent?.includes('Test Batman'));
          return jobCard?.textContent?.includes('Tillagda tjänster') || false;
        });
        console.log(testResults.servicesAdded ? 
          '✅ Services added to job' : 
          '❌ Services not added'
        );
      }
    }
    
    // Test 6: Order confirmation
    console.log('\n4️⃣ Testing order confirmation...');
    
    const orderBtnExists = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(btn => btn.textContent?.includes('Visa orderbekräftelse'));
    });
    
    if (orderBtnExists && testResults.servicesAdded) {
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const orderBtn = buttons.find(btn => btn.textContent?.includes('Visa orderbekräftelse'));
        if (orderBtn) {
          orderBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
          orderBtn.click();
        }
      });
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      testResults.orderConfirmationWorks = await page.evaluate(() => {
        const modal = document.querySelector('.fixed.inset-0');
        return modal?.textContent?.includes('Orderbekräftelse') || false;
      });
      console.log(testResults.orderConfirmationWorks ? 
        '✅ Order confirmation displayed' : 
        '❌ Order confirmation not displayed'
      );
      
      await page.screenshot({ path: 'test-5-order-confirmation.png' });
      
      // Close modal
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const closeBtn = buttons.find(btn => btn.textContent?.includes('Stäng'));
        if (closeBtn) closeBtn.click();
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Test 7: Complete job
    console.log('\n5️⃣ Testing job completion...');
    
    // Find end job button (mobile action bar)
    const endJobBtn = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => 
        btn.textContent?.includes('Avsluta Flytt') || 
        btn.textContent?.includes('Avsluta')
      );
    });
    
    if (endJobBtn) {
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const endBtn = buttons.find(btn => 
          btn.textContent?.includes('Avsluta Flytt') || 
          btn.textContent?.includes('Avsluta')
        );
        if (endBtn) {
          endBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
          endBtn.click();
        }
      });
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Handle GPS end modal
      const gpsEndModal = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('h2')).some(h => 
          h.textContent?.includes('GPS-bekräftelse')
        );
      });
      
      if (gpsEndModal) {
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const endBtn = buttons.find(btn => btn.textContent?.includes('Avsluta ändå'));
          if (endBtn) endBtn.click();
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      testResults.jobCompleted = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.bg-white.rounded-lg.shadow-sm'));
        const jobCard = cards.find(card => card.textContent?.includes('Test Batman'));
        return jobCard?.textContent?.includes('Slutfört') || 
               jobCard?.textContent?.includes('completed') || false;
      });
      console.log(testResults.jobCompleted ? 
        '✅ Job completed' : 
        '❌ Job not completed'
      );
    }
    
    await page.screenshot({ path: 'test-6-final-state.png' });
    
    // Final error check
    const finalErrors = consoleErrors.filter(err => 
      err.text.includes('PreStartChecklistModal') || 
      err.text.includes('jobData')
    );
    testResults.noFinalErrors = finalErrors.length === 0;
    
    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));
    
    let passedTests = 0;
    let totalTests = 0;
    
    for (const [test, passed] of Object.entries(testResults)) {
      totalTests++;
      if (passed) passedTests++;
      const testName = test.replace(/([A-Z])/g, ' $1').toLowerCase();
      console.log(`${passed ? '✅' : '❌'} ${testName}`);
    }
    
    console.log('\n' + '-'.repeat(50));
    console.log(`Total: ${passedTests}/${totalTests} tests passed (${Math.round(passedTests/totalTests*100)}%)`);
    console.log(`Console errors: ${consoleErrors.length} total, ${finalErrors.length} PreStartChecklistModal errors`);
    console.log('-'.repeat(50));
    
    if (passedTests === totalTests) {
      console.log('\n🎉 ALL TESTS PASSED! The staff app is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Check the screenshots for details.');
    }
    
    // Save detailed test report
    const report = {
      timestamp: new Date().toISOString(),
      results: testResults,
      errors: consoleErrors,
      summary: {
        passed: passedTests,
        total: totalTests,
        percentage: Math.round(passedTests/totalTests*100)
      }
    };
    
    await page.evaluate((reportData) => {
      localStorage.setItem('test_report', JSON.stringify(reportData));
    }, report);
    
  } catch (error) {
    console.error('\n❌ Test crashed:', error);
    if (page) {
      await page.screenshot({ path: 'test-crash-error.png' });
    }
  } finally {
    console.log('\n⏸️  Browser will close in 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await browser.close();
  }
}

testCompleteFlow().catch(console.error);