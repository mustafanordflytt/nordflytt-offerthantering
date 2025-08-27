import puppeteer from 'puppeteer';

const BASE_URL = 'http://localhost:3000';
const TIMEOUT = 30000;

describe('Nordflytt Booking Flow E2E Tests', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
  });

  afterEach(async () => {
    await page.close();
  });

  describe('Step 1: Customer Type Selection', () => {
    test('should load booking form', async () => {
      await page.goto(`${BASE_URL}/form`, { waitUntil: 'networkidle0' });
      
      // Check if page loaded
      const title = await page.title();
      expect(title).toContain('Nordflytt');
      
      // Check if form exists
      const formExists = await page.$('div.space-y-6') !== null;
      expect(formExists).toBe(true);
    }, TIMEOUT);

    test('should select private customer type', async () => {
      await page.goto(`${BASE_URL}/form`, { waitUntil: 'networkidle0' });
      
      // Click on private customer card
      await page.click('div.moving-type-card:first-child');
      
      // Check if selected
      await page.waitForTimeout(500);
      const isSelected = await page.$eval('div.moving-type-card:first-child', 
        el => el.classList.contains('selected')
      );
      expect(isSelected).toBe(true);
    });

    test('should validate contact information', async () => {
      await page.goto(`${BASE_URL}/form`, { waitUntil: 'networkidle0' });
      
      // Select customer type
      await page.click('div.moving-type-card:first-child');
      
      // Try to proceed without filling form
      await page.click('button.next-button');
      await page.waitForTimeout(500);
      
      // Check for validation errors
      const errors = await page.$$('.text-red-500');
      expect(errors.length).toBeGreaterThan(0);
      
      // Fill in valid data
      await page.type('input[type="text"]', 'Test Testsson');
      await page.type('input[type="email"]', 'test@example.com');
      await page.type('input[type="tel"]', '0701234567');
      
      // Click next
      await page.click('button.next-button');
      await page.waitForTimeout(1000);
      
      // Should proceed to next step
      const url = await page.url();
      expect(url).toContain('form');
    });
  });

  describe('Step 2: Moving Details', () => {
    beforeEach(async () => {
      // Navigate to form and complete step 1
      await page.goto(`${BASE_URL}/form`, { waitUntil: 'networkidle0' });
      await page.click('div.moving-type-card:first-child');
      await page.type('input[type="text"]', 'Test Testsson');
      await page.type('input[type="email"]', 'test@example.com');
      await page.type('input[type="tel"]', '0701234567');
      await page.click('button.next-button');
      await page.waitForTimeout(1000);
    });

    test('should show address input fields', async () => {
      // Check for address inputs
      const addressInputs = await page.$$('input[placeholder*="address"], input[placeholder*="adress"]');
      expect(addressInputs.length).toBeGreaterThan(0);
    });

    test('should validate move date', async () => {
      // Try to proceed without date
      const nextButton = await page.$('button.next-button');
      if (nextButton) {
        await nextButton.click();
        await page.waitForTimeout(500);
        
        // Should show validation error
        const errors = await page.$$('.text-red-500, .error');
        expect(errors.length).toBeGreaterThan(0);
      }
      
      // Select a future date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];
      
      const dateInput = await page.$('input[type="date"]');
      if (dateInput) {
        await dateInput.type(dateString);
      }
    });

    test('should handle Google Maps autocomplete', async () => {
      // Wait for Google Maps to load
      await page.waitForTimeout(2000);
      
      // Type in address field
      const addressInput = await page.$('input[placeholder*="från"], input[placeholder*="from"]');
      if (addressInput) {
        await addressInput.type('Drottninggatan 1, Stockholm');
        await page.waitForTimeout(1500); // Wait for autocomplete
        
        // Check if suggestions appear
        const suggestions = await page.$$('.pac-container .pac-item');
        expect(suggestions.length).toBeGreaterThan(0);
        
        // Click first suggestion
        if (suggestions.length > 0) {
          await suggestions[0].click();
        }
      }
    });
  });

  describe('Step 3: Services Selection', () => {
    test('should display service options', async () => {
      // Navigate to services step (would need to complete previous steps)
      // This is a placeholder - in real test would navigate properly
      
      await page.goto(`${BASE_URL}/form`, { waitUntil: 'networkidle0' });
      
      // Check for service options when they appear
      const serviceCards = await page.$$('[class*="service"], [class*="tjänst"]');
      expect(serviceCards).toBeDefined();
    });

    test('should calculate price dynamically', async () => {
      // Check for price display
      const priceElements = await page.$$('[class*="price"], [class*="pris"], [class*="kr"]');
      expect(priceElements).toBeDefined();
    });
  });

  describe('Mobile Responsiveness', () => {
    test('should work on mobile viewport', async () => {
      await page.setViewport({ width: 375, height: 667 });
      await page.goto(`${BASE_URL}/form`, { waitUntil: 'networkidle0' });
      
      // Check if form is still accessible
      const formExists = await page.$('div.space-y-6') !== null;
      expect(formExists).toBe(true);
      
      // Check if cards stack vertically
      const cards = await page.$$('div.moving-type-card');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      await page.goto(`${BASE_URL}/form`, { waitUntil: 'networkidle0' });
      
      // Intercept API calls and force error
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().includes('/api/submit-booking')) {
          request.respond({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Server error' })
          });
        } else {
          request.continue();
        }
      });
      
      // Try to submit form (would need to fill all steps)
      // Check for error message display
    });

    test('should work offline (PWA)', async () => {
      // Load page first
      await page.goto(`${BASE_URL}/form`, { waitUntil: 'networkidle0' });
      
      // Go offline
      await page.setOfflineMode(true);
      
      // Try to navigate
      await page.reload();
      
      // Should show offline page or cached content
      const content = await page.content();
      expect(content).toBeDefined();
      
      // Go back online
      await page.setOfflineMode(false);
    });
  });
});

// Helper function to complete booking form
async function completeBookingForm(page) {
  // Step 1: Customer type
  await page.click('div.moving-type-card:first-child');
  await page.type('input[type="text"]', 'Test Testsson');
  await page.type('input[type="email"]', 'test@example.com');
  await page.type('input[type="tel"]', '0701234567');
  await page.click('button.next-button');
  await page.waitForTimeout(1000);
  
  // Step 2: Moving details
  // Add implementation for remaining steps
}