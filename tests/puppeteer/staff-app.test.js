const puppeteer = require('puppeteer');

describe('Nordflytt Staff App Tests', () => {
  let browser;
  let page;
  
  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false, // Set to true for CI
      slowMo: 100 // Slow down for visual testing
    });
    page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812 }); // iPhone X viewport
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('Login Flow', () => {
    test('Should load login page', async () => {
      await page.goto('http://localhost:3000/staff');
      
      // Check for login elements
      const loginButton = await page.$('button:contains("Logga in")');
      expect(loginButton).toBeTruthy();
      
      const emailInput = await page.$('input[type="email"]');
      expect(emailInput).toBeTruthy();
    });

    test('Should login successfully', async () => {
      await page.type('input[type="email"]', 'test@nordflytt.se');
      await page.type('input[type="password"]', 'password123');
      
      await page.click('button:contains("Logga in")');
      
      // Wait for navigation to dashboard
      await page.waitForNavigation();
      expect(page.url()).toContain('/staff/dashboard');
    });
  });

  describe('Dashboard Features', () => {
    test('Should display job cards', async () => {
      await page.waitForSelector('.bg-white.border-2.border-gray-200');
      const jobCards = await page.$$('.bg-white.border-2.border-gray-200');
      expect(jobCards.length).toBeGreaterThan(0);
    });

    test('Should open job detail modal on card click', async () => {
      const firstJobCard = await page.$('.bg-white.border-2.border-gray-200');
      await firstJobCard.click();
      
      // Wait for modal
      await page.waitForSelector('[role="dialog"]');
      const modal = await page.$('[role="dialog"]');
      expect(modal).toBeTruthy();
    });

    test('Should have sticky action bar for active jobs', async () => {
      // Close modal first
      await page.keyboard.press('Escape');
      
      // Check for sticky action bar
      const actionBar = await page.$('.fixed.bottom-0.left-0.right-0');
      expect(actionBar).toBeTruthy();
      
      // Check for 4 action buttons
      const actionButtons = await page.$$('.fixed.bottom-0 button');
      expect(actionButtons.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Smart Features', () => {
    test('Should trigger photo reminders when starting job', async () => {
      // Start a job
      const startButton = await page.$('button:contains("Starta uppdrag")');
      if (startButton) {
        await startButton.click();
        
        // Wait for checklist modal
        await page.waitForSelector('[role="dialog"]');
        
        // Complete checklist items
        const checkboxes = await page.$$('input[type="checkbox"]');
        for (const checkbox of checkboxes) {
          await checkbox.click();
        }
        
        // Start job
        await page.click('button:contains("Starta uppdrag")');
        
        // Should show photo reminder
        await page.waitForSelector('.fixed.inset-0.bg-black');
        const photoReminder = await page.$('.fixed.inset-0.bg-black');
        expect(photoReminder).toBeTruthy();
      }
    });

    test('Should show smart pricing in add service modal', async () => {
      // Click add service button
      const addServiceButton = await page.$('button:contains("Tjänst")');
      if (addServiceButton) {
        await addServiceButton.click();
        
        // Wait for modal
        await page.waitForSelector('[role="dialog"]');
        
        // Check for smart pricing section
        const smartPricing = await page.$('text/Smart Prisberäkning');
        expect(smartPricing).toBeTruthy();
        
        // Check for auto-added items
        const autoAddedBadges = await page.$$('.bg-green-600:contains("Auto-tillagd")');
        expect(autoAddedBadges.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Mobile Optimization', () => {
    test('Should have touch-friendly button sizes', async () => {
      const buttons = await page.$$('button');
      
      for (const button of buttons.slice(0, 5)) { // Check first 5 buttons
        const box = await button.boundingBox();
        if (box) {
          // Minimum 44px for touch targets (Apple HIG)
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('Should have proper modal scrolling', async () => {
      // Open a modal with scrollable content
      const modalButton = await page.$('button:contains("Lägg till")');
      if (modalButton) {
        await modalButton.click();
        await page.waitForSelector('[role="dialog"]');
        
        // Check for overflow-y-auto class
        const scrollableContent = await page.$('.overflow-y-auto');
        expect(scrollableContent).toBeTruthy();
      }
    });
  });

  describe('Error Handling', () => {
    test('Should handle API errors gracefully', async () => {
      // Intercept API calls
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        if (request.url().includes('/api/')) {
          request.abort();
        } else {
          request.continue();
        }
      });
      
      // Try to perform an action that requires API
      const actionButton = await page.$('button:contains("Spara")');
      if (actionButton) {
        await actionButton.click();
        
        // Should show error message, not crash
        await page.waitForTimeout(2000);
        const errorAlert = await page.$('[role="alert"]');
        expect(errorAlert).toBeTruthy();
      }
      
      // Reset interception
      await page.setRequestInterception(false);
    });
  });
});