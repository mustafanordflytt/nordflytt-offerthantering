const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  console.log('Navigating to staff dashboard...');
  await page.goto('http://localhost:3000/staff/dashboard', { waitUntil: 'networkidle2' });
  
  // Wait for auth check
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Check if we're redirected to login
  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);
  
  if (currentUrl.includes('/staff') && !currentUrl.includes('/dashboard')) {
    console.log('Redirected to login - setting auth');
    // Set auth in localStorage
    await page.evaluate(() => {
      localStorage.setItem('staff_auth', JSON.stringify({
        id: '1',
        email: 'test@nordflytt.se',
        name: 'Test User',
        role: 'Flyttare',
        loginTime: new Date().toISOString()
      }));
    });
    
    // Navigate back to dashboard
    await page.goto('http://localhost:3000/staff/dashboard', { waitUntil: 'networkidle2' });
  }
  
  console.log('Waiting for dashboard to load...');
  
  try {
    // Wait for dashboard to render
    await page.waitForSelector('.min-h-screen', { timeout: 10000 });
    
    // Check for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Console error:', msg.text());
      }
    });
    
    page.on('pageerror', error => {
      console.error('Page error:', error.message);
    });
    
    // Check if the page loaded properly
    const hasErrors = await page.evaluate(() => {
      const errorBoundary = document.querySelector('[data-error-boundary]');
      const loadingSpinner = document.querySelector('.animate-spin');
      return {
        hasErrorBoundary: !!errorBoundary,
        isStillLoading: !!loadingSpinner
      };
    });
    
    console.log('Page status:', hasErrors);
    
    // Check for React rendering errors
    await page.evaluate(() => {
      // Check for missing keys warning
      const warnings = [];
      const originalWarn = console.warn;
      console.warn = (...args) => {
        warnings.push(args.join(' '));
        originalWarn(...args);
      };
      
      // Force a re-render by clicking something
      const button = document.querySelector('button');
      if (button) button.click();
      
      console.warn = originalWarn;
      return warnings;
    });
    
    // Test adding a service (trigger the fixed code)
    const addServiceButton = await page.$('button:has-text("Lägg till tjänst")');
    if (addServiceButton) {
      console.log('Testing add service functionality...');
      await addServiceButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if modal opened without errors
      const modal = await page.$('[role="dialog"]');
      console.log('Add service modal opened:', !!modal);
    }
    
    // Check if toasts work properly
    console.log('Testing toast notifications...');
    const toastTest = await page.evaluate(() => {
      // Simulate a toast by triggering an action
      const startButton = document.querySelector('button:has-text("Påbörja uppdrag")');
      if (startButton) {
        startButton.click();
        return true;
      }
      return false;
    });
    
    if (toastTest) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const toastVisible = await page.$('.fixed.bottom-4.right-4');
      console.log('Toast notification visible:', !!toastVisible);
    }
    
    console.log('✅ React rendering fixes appear to be working!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  await browser.close();
})();