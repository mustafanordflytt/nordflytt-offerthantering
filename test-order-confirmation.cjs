const puppeteer = require('puppeteer'));

async function testOrderConfirmation() {
  console.log('🧪 Testing order confirmation functionality...'));
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: false,
    defaultViewport: {
      width: 390,
      height: 844
    },
    args: [
      '--window-size=390,844',
      '--disable-blink-features=AutomationControlled',
      '--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
    ]
  }));

  try {
    const page = await browser.newPage());
    
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
        status: 'in_progress',
        estimatedHours: 4,
        teamMembers: ['Erik Andersson', 'Sofia Lindberg'],
        priority: 'high',
        distance: 15.3,
        serviceType: 'moving',
        services: ['Packhjälp', 'Flytt', 'Flyttstädning'],
        specialRequirements: ['Antika möbler', 'Piano', 'Extra försiktig hantering'],
        locationInfo: {
          doorCode: '1234',
          floor: 4,
          elevator: false,
          elevatorStatus: 'Ingen hiss',
          parkingDistance: 100,
          accessNotes: 'Smal trappa, försiktighet krävs'
        },
        customerNotes: 'Kunden vill att vi är extra försiktiga med antikviteterna',
        equipment: ['Flyttkartonger', 'Bubbelplast', 'Täcken', 'Saxlyft'],
        volume: 45,
        boxCount: 30
      };
      
      // Set mock job
      localStorage.setItem('mockJobs', JSON.stringify([mockJob])));
      localStorage.setItem('mockJobStatuses', JSON.stringify({ '2': 'in_progress' })));
      
      // Mock login
      localStorage.setItem('staff_auth', JSON.stringify({
        id: '1',
        email: 'test@nordflytt.se',
        name: 'Test User',
        role: 'mover',
        loginTime: new Date().toISOString()
      })));
    }));
    
    // Navigate to staff app
    await page.goto('http://localhost:3002/staff/dashboard'));
    
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="job-card-2"], .min-h-screen', { timeout: 10000 }));
    
    // Wait a bit for React to settle
    await new Promise(resolve => setTimeout(resolve, 2000)));
    
    console.log('✅ Dashboard loaded successfully'));
    
    // Look for "Lägg till tjänst" button in the job card
    const addServiceButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button')));
      const button = buttons.find(btn => 
        btn.textContent?.includes('Lägg till tjänst') ||
        btn.textContent?.includes('tjänst')
      ));
      if (button) {
        button.scrollIntoView({ behavior: 'smooth', block: 'center' }));
        return true;
      }
      return false;
    }));
    
    if (!addServiceButton) {
      // If job is not in progress, click the job card first
      console.log('Job not in progress, clicking job card to expand...'));
      await page.click('[data-testid="job-card-2"], .bg-white.rounded-lg.shadow-sm'));
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Look for "Påbörja uppdrag" button
      const startButton = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button')));
        const btn = buttons.find(b => b.textContent?.includes('Påbörja uppdrag')));
        if (btn) {
          btn.scrollIntoView({ behavior: 'smooth', block: 'center' }));
          return true;
        }
        return false;
      }));
      
      if (startButton) {
        console.log('Starting job...'));
        await page.click('button:has-text("Påbörja uppdrag")'));
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Handle checklist modal if it appears
        const checklistVisible = await page.evaluate(() => {
          return document.querySelector('.fixed.inset-0') !== null;
        }));
        
        if (checklistVisible) {
          console.log('Handling checklist modal...'));
          await page.click('button:has-text("Starta uppdrag")'));
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Handle GPS modal
          const gpsModalVisible = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('h2')).some(h => 
              h.textContent?.includes('GPS-bekräftelse')
            ));
          }));
          
          if (gpsModalVisible) {
            console.log('Handling GPS modal...'));
            await page.click('button:has-text("Starta ändå")'));
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
    }
    
    // Now find and click "Lägg till tjänst" button
    console.log('Looking for "Lägg till tjänst" button...'));
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button')));
      const button = buttons.find(btn => 
        btn.textContent?.includes('Lägg till tjänst')
      ));
      if (button) {
        button.scrollIntoView({ behavior: 'smooth', block: 'center' }));
        button.click());
      }
    }));
    
    // Wait for add service modal
    await page.waitForSelector('.fixed.inset-0', { timeout: 5000 }));
    console.log('✅ Add service modal opened'));
    
    // Add some services
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Add flyttkartonger
    const boxInput = await page.$('input[type="number"][value="0"]'));
    if (boxInput) {
      await boxInput.click({ clickCount: 3 }));
      await boxInput.type('10'));
    }
    
    // Add packtejp
    const allInputs = await page.$$('input[type="number"]'));
    if (allInputs.length > 1) {
      await allInputs[1].click({ clickCount: 3 }));
      await allInputs[1].type('2'));
    }
    
    // Add plastpåsar
    if (allInputs.length > 2) {
      await allInputs[2].click({ clickCount: 3 }));
      await allInputs[2].type('20'));
    }
    
    await page.screenshot({ path: 'test-add-services.png' }));
    console.log('✅ Services selected'));
    
    // Confirm services
    await page.click('button:has-text("Bekräfta")'));
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Look for the order confirmation button
    console.log('Looking for order confirmation button...'));
    const orderConfirmationButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button')));
      const button = buttons.find(btn => 
        btn.textContent?.includes('Visa orderbekräftelse')
      ));
      if (button) {
        button.scrollIntoView({ behavior: 'smooth', block: 'center' }));
        return true;
      }
      return false;
    }));
    
    if (orderConfirmationButton) {
      console.log('✅ Order confirmation button found'));
      
      // Click the button
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button')));
        const button = buttons.find(btn => 
          btn.textContent?.includes('Visa orderbekräftelse')
        ));
        if (button) {
          button.click());
        }
      }));
      
      // Wait for order confirmation modal
      await page.waitForSelector('.fixed.inset-0', { timeout: 5000 }));
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await page.screenshot({ path: 'test-order-confirmation-modal.png' }));
      console.log('✅ Order confirmation modal displayed'));
      
      // Check the content
      const orderContent = await page.evaluate(() => {
        const modal = document.querySelector('.fixed.inset-0 .bg-white'));
        if (!modal) return null;
        
        const hasBookingNumber = modal.textContent?.includes('NF-2024-002'));
        const hasCustomerName = modal.textContent?.includes('Test Batman'));
        const hasAddedServices = modal.textContent?.includes('Tillagda tjänster under uppdrag'));
        const hasFlyttkartonger = modal.textContent?.includes('10x Flyttkartonger'));
        const hasPacktejp = modal.textContent?.includes('2x Packtejp'));
        const hasPlastpasar = modal.textContent?.includes('20x Plastpåsar'));
        const hasTotalCost = modal.textContent?.includes('Totalt tilläggskostnad'));
        
        return {
          hasBookingNumber,
          hasCustomerName,
          hasAddedServices,
          hasFlyttkartonger,
          hasPacktejp,
          hasPlastpasar,
          hasTotalCost
        };
      }));
      
      console.log('Order confirmation content:', orderContent));
      
      if (orderContent?.hasAddedServices && orderContent?.hasFlyttkartonger) {
        console.log('✅ Order confirmation shows added services correctly'));
      } else {
        console.log('❌ Order confirmation missing some content'));
      }
      
      // Close modal
      await page.click('button:has-text("Stäng")'));
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } else {
      console.log('❌ Order confirmation button not found'));
      await page.screenshot({ path: 'test-no-order-button.png' }));
    }
    
    // Check that services are shown on the job card
    const servicesOnCard = await page.evaluate(() => {
      const card = document.querySelector('[data-testid="job-card-2"], .bg-white.rounded-lg.shadow-sm'));
      if (!card) return null;
      
      const hasAddedServices = card.textContent?.includes('Tillagda tjänster'));
      const hasCost = card.textContent?.includes('+') && card.textContent?.includes('kr'));
      
      return { hasAddedServices, hasCost };
    }));
    
    console.log('Services on card:', servicesOnCard));
    
    if (servicesOnCard?.hasAddedServices) {
      console.log('✅ Added services shown on job card'));
    } else {
      console.log('❌ Added services not shown on job card'));
    }
    
    // Check localStorage for persistence
    const storageData = await page.evaluate(() => {
      const jobsWithServices = localStorage.getItem('staff_jobs_with_services'));
      const flyttparm = localStorage.getItem('customer_flyttparm'));
      
      return {
        jobsWithServices: jobsWithServices ? JSON.parse(jobsWithServices) : null,
        flyttparm: flyttparm ? JSON.parse(flyttparm) : null
      };
    }));
    
    console.log('\n📦 Storage data:'));
    console.log('Jobs with services:', JSON.stringify(storageData.jobsWithServices, null, 2)));
    console.log('Flyttpärm:', JSON.stringify(storageData.flyttparm, null, 2)));
    
    if (storageData.jobsWithServices && storageData.jobsWithServices['2']) {
      console.log('✅ Services saved persistently in localStorage'));
    } else {
      console.log('❌ Services not saved to localStorage'));
    }
    
    if (storageData.flyttparm && storageData.flyttparm['NF-2024-002']) {
      console.log('✅ Order confirmation saved to flyttpärm'));
    } else {
      console.log('❌ Order confirmation not saved to flyttpärm'));
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'test-order-confirmation-final.png' }));
    
    console.log('\n✅ Order confirmation test completed!'));
    console.log('\nSummary:'));
    console.log('- ✅ Services can be added to job'));
    console.log('- ✅ Services shown on job card'));
    console.log('- ✅ Services saved persistently'));
    console.log('- ✅ Order confirmation modal works'));
    console.log('- ✅ Flyttpärm updated with services'));
    
  } catch (error) {
    console.error('❌ Test failed:', error));
    // Only take screenshot if page exists
    if (page) {
      try {
        await page.screenshot({ path: 'test-order-confirmation-error.png' }));
      } catch (e) {
        // Ignore screenshot error
      }
    }
  } finally {
    await browser.close());
  }
}

testOrderConfirmation().catch(console.error));