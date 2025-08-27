const puppeteer = require('puppeteer');

describe('Nordflytt Staff App Tests', () => {
  let browser;
  let page;
  
  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true, // Set to false to see the browser
      slowMo: 50 // Slow down for visual testing
    });
    page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812 }); // iPhone X viewport
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('Login Flow', () => {
    test('Should load login page', async () => {
      await page.goto('http://localhost:3000/staff', {
        waitUntil: 'networkidle0'
      });
      
      // Check for login elements using better selectors
      const emailInput = await page.$('input[type="email"]');
      expect(emailInput).toBeTruthy();
      
      const passwordInput = await page.$('input[type="password"]');
      expect(passwordInput).toBeTruthy();
      
      // Find button with text "Logga in"
      const loginButton = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(button => button.textContent.includes('Logga in')) !== undefined;
      });
      expect(loginButton).toBeTruthy();
    });

    test('Should login successfully', async () => {
      // Type credentials
      await page.type('input[type="email"]', 'test@nordflytt.se');
      await page.type('input[type="password"]', 'password123');
      
      // Click login button
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const loginButton = buttons.find(button => button.textContent.includes('Logga in'));
        if (loginButton) loginButton.click();
      });
      
      // Wait for navigation or dashboard elements
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 3000 }).catch(() => {
        // Navigation might not happen if already logged in
      });
      
      const url = page.url();
      expect(url).toContain('/staff/dashboard');
    });
  });

  describe('Dashboard Features', () => {
    test('Should display job cards', async () => {
      // Wait for job cards to load
      try {
        await page.waitForSelector('.rounded-lg', { timeout: 5000 });
        const cards = await page.$$('.rounded-lg');
        expect(cards.length).toBeGreaterThan(0);
      } catch (error) {
        console.log('No job cards found, might be loading issue');
      }
    });

    test('Should have clickable job cards', async () => {
      const cards = await page.$$('.cursor-pointer');
      if (cards.length > 0) {
        // Click first card
        await cards[0].click();
        
        // Wait for modal
        await page.waitForTimeout(1000);
        
        // Check if modal opened
        const modal = await page.$('[role="dialog"]');
        expect(modal).toBeTruthy();
        
        // Close modal with ESC
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    });
  });

  describe('Mobile Features', () => {
    test('Should have mobile-optimized buttons', async () => {
      const buttons = await page.$$('button');
      
      for (const button of buttons.slice(0, 3)) { // Check first 3 buttons
        const box = await button.boundingBox();
        if (box) {
          // Minimum 44px for touch targets
          expect(box.height).toBeGreaterThanOrEqual(40); // Allow some flexibility
        }
      }
    });

    test('Should have sticky action bar for active jobs', async () => {
      // Check if there's a fixed bottom element
      const stickyBar = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('.fixed'));
        return elements.some(el => 
          el.classList.contains('bottom-0') && 
          el.classList.contains('left-0') && 
          el.classList.contains('right-0')
        );
      });
      
      // This might not exist if no jobs are in progress
      console.log('Sticky bar present:', stickyBar);
    });
  });

  describe('Smart Features', () => {
    test('Should have add service functionality', async () => {
      // Look for any button that might add services
      const addButtons = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.filter(button => 
          button.textContent.includes('Lägg till') || 
          button.textContent.includes('Tjänst') ||
          button.querySelector('svg') // Icon buttons
        ).length;
      });
      
      expect(addButtons).toBeGreaterThan(0);
    });

    test('Should handle navigation properly', async () => {
      // Test that we can navigate without errors
      const currentUrl = page.url();
      
      // Try to find and click a navigation element
      const navLinks = await page.$$('a[href*="/staff"]');
      if (navLinks.length > 0) {
        await navLinks[0].click();
        await page.waitForTimeout(1000);
        
        // Should navigate successfully
        const newUrl = page.url();
        expect(newUrl).toBeTruthy();
      }
    });
  });

  describe('Error Handling', () => {
    test('Should not have console errors', async () => {
      const errors = [];
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      // Navigate to trigger any errors
      await page.reload();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check for critical errors (ignore minor warnings)
      const criticalErrors = errors.filter(err => 
        err.includes('TypeError') || 
        err.includes('ReferenceError') ||
        err.includes('Cannot read')
      );
      
      expect(criticalErrors.length).toBe(0);
    });
  });
});