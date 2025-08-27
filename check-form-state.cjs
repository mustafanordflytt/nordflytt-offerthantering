const puppeteer = require('puppeteer');

(async () => {
  console.log('🔍 Checking form state and Google Maps status...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  // Capture Google Maps related console logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Google') || text.includes('Maps') || text.includes('Address') || text.includes('✅') || text.includes('❌') || text.includes('⏳')) {
      console.log('Console:', text);
    }
  });

  try {
    // Go directly to form page
    console.log('1️⃣ Going to form page...');
    await page.goto('http://localhost:3002/form', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Wait for React to render
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check current step
    const currentStep = await page.evaluate(() => {
      const stepIndicators = document.querySelectorAll('.text-blue-600');
      for (let i = 0; i < stepIndicators.length; i++) {
        if (stepIndicators[i].textContent.includes('Steg')) {
          return stepIndicators[i].textContent;
        }
      }
      return 'Unknown';
    });
    
    console.log('📍 Current step:', currentStep);
    
    // Try to navigate to step 4 if not already there
    if (!currentStep.includes('4')) {
      console.log('\n2️⃣ Navigating to Step 4...');
      
      // Step 1 - Click first option
      const step1Options = await page.$$('.cursor-pointer');
      if (step1Options.length > 0) {
        await step1Options[0].click();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Step 2 - Click first option and next
      const step2Options = await page.$$('.cursor-pointer');
      if (step2Options.length > 0) {
        await step2Options[0].click();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const nextButton = await page.$('button:has-text("Nästa")');
        if (nextButton) {
          await nextButton.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Step 3 - Just click next
      const step3Next = await page.$('button:has-text("Nästa")');
      if (step3Next) {
        await step3Next.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Now check for address inputs
    console.log('\n3️⃣ Checking for address inputs...');
    
    const addressInputInfo = await page.evaluate(() => {
      const inputs = [];
      
      // Check by ID
      const startAddress = document.querySelector('#startAddress');
      if (startAddress) {
        inputs.push({
          id: 'startAddress',
          placeholder: startAddress.placeholder,
          value: startAddress.value,
          type: startAddress.type
        });
      }
      
      // Check for any input with address-related placeholder
      const allInputs = document.querySelectorAll('input');
      allInputs.forEach(input => {
        if (input.placeholder && input.placeholder.toLowerCase().includes('adress')) {
          inputs.push({
            id: input.id || 'no-id',
            placeholder: input.placeholder,
            value: input.value,
            type: input.type
          });
        }
      });
      
      return inputs;
    });
    
    console.log('Found inputs:', addressInputInfo);
    
    // Check for Google Maps status icon
    const googleStatus = await page.evaluate(() => {
      const icons = document.querySelectorAll('svg');
      for (const icon of icons) {
        const classes = icon.getAttribute('class') || '';
        if (classes.includes('w-4') && classes.includes('h-4')) {
          if (classes.includes('text-green-500')) return '✅ Ready (green icon found)';
          if (classes.includes('animate-spin')) return '🔄 Loading (spinner found)';
          if (classes.includes('text-gray-400')) return '❌ Failed (gray icon found)';
        }
      }
      return '❓ No status icon found';
    });
    
    console.log('\n4️⃣ Google Maps Status:', googleStatus);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'form-step4-state.png',
      fullPage: false 
    });
    console.log('\n📸 Screenshot saved: form-step4-state.png');
    
    // Try typing in address field if found
    if (addressInputInfo.length > 0) {
      console.log('\n5️⃣ Testing autocomplete...');
      const firstInput = await page.$('#startAddress') || await page.$('input[placeholder*="adress"]');
      
      if (firstInput) {
        await firstInput.click();
        await firstInput.type('Kungsgatan', { delay: 100 });
        
        // Wait for autocomplete
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check for Google dropdown
        const hasDropdown = await page.evaluate(() => {
          const pacContainer = document.querySelector('.pac-container');
          return pacContainer && window.getComputedStyle(pacContainer).display !== 'none';
        });
        
        console.log('Autocomplete dropdown visible:', hasDropdown ? '✅ Yes' : '❌ No');
        
        await page.screenshot({ 
          path: 'form-autocomplete-test.png',
          fullPage: false 
        });
        console.log('📸 Autocomplete test screenshot: form-autocomplete-test.png');
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ 
      path: 'error-state.png',
      fullPage: true 
    });
  }
  
  console.log('\n✅ Check complete. Browser remains open.');
  console.log('Press Ctrl+C to close.');
})();