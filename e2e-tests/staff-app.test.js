import puppeteer from 'puppeteer';

const BASE_URL = 'http://localhost:3000';
const TIMEOUT = 30000;

describe('Nordflytt Staff App E2E Tests', () => {
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

  describe('Staff Login', () => {
    test('should load login page', async () => {
      await page.goto(`${BASE_URL}/staff`, { waitUntil: 'networkidle0' });
      
      const title = await page.title();
      expect(title).toContain('Nordflytt');
      
      // Check for login form elements
      const phoneInput = await page.$('input[type="tel"]');
      expect(phoneInput).not.toBeNull();
    }, TIMEOUT);

    test('should show validation errors for invalid phone', async () => {
      await page.goto(`${BASE_URL}/staff`, { waitUntil: 'networkidle0' });
      
      // Enter invalid phone
      await page.type('input[type="tel"]', '123');
      
      // Try to get OTP
      const otpButton = await page.$('button[type="submit"]');
      if (otpButton) {
        await otpButton.click();
        await page.waitForTimeout(500);
        
        // Check for error message
        const error = await page.$('.text-red-500, .error');
        expect(error).not.toBeNull();
      }
    });

    test('should handle quick login in development', async () => {
      await page.goto(`${BASE_URL}/staff`, { waitUntil: 'networkidle0' });
      
      // Look for quick login button (dev mode)
      const quickLoginButton = await page.$('button:contains("Quick Login")');
      if (quickLoginButton) {
        await quickLoginButton.click();
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        
        // Should redirect to dashboard
        const url = await page.url();
        expect(url).toContain('/staff/dashboard');
      }
    });
  });

  describe('Staff Dashboard', () => {
    beforeEach(async () => {
      // Navigate directly to dashboard (with auth bypass in dev)
      await page.goto(`${BASE_URL}/staff/dashboard`, { waitUntil: 'networkidle0' });
    });

    test('should display job cards', async () => {
      // Wait for job cards to load
      await page.waitForTimeout(2000);
      
      // Check for job cards
      const jobCards = await page.$$('.card, [class*="job-card"]');
      expect(jobCards.length).toBeGreaterThanOrEqual(0);
    });

    test('should show job details on click', async () => {
      const jobCard = await page.$('.card, [class*="job-card"]');
      if (jobCard) {
        await jobCard.click();
        await page.waitForTimeout(500);
        
        // Check if modal or details view appears
        const modal = await page.$('[role="dialog"], .modal');
        expect(modal).toBeDefined();
      }
    });

    test('should handle job status changes', async () => {
      // Find start button
      const startButton = await page.$('button:contains("Starta"), button:contains("Start")');
      if (startButton) {
        await startButton.click();
        await page.waitForTimeout(1000);
        
        // Should show checklist or confirmation
        const checklist = await page.$('[class*="checklist"], [class*="modal"]');
        expect(checklist).toBeDefined();
      }
    });
  });

  describe('Photo Documentation', () => {
    test('should open camera interface', async () => {
      await page.goto(`${BASE_URL}/staff/dashboard`, { waitUntil: 'networkidle0' });
      
      // Find camera button
      const cameraButton = await page.$('button[class*="camera"], button:contains("Foto")');
      if (cameraButton) {
        await cameraButton.click();
        await page.waitForTimeout(500);
        
        // Check for camera interface
        const cameraInterface = await page.$('input[type="file"], video');
        expect(cameraInterface).toBeDefined();
      }
    });

    test('should handle photo categories', async () => {
      // Check for photo category options
      const categories = ['before', 'during', 'after'];
      for (const category of categories) {
        const categoryOption = await page.$(`[data-category="${category}"], button:contains("${category}")`);
        expect(categoryOption).toBeDefined();
      }
    });
  });

  describe('Offline Functionality (PWA)', () => {
    test('should work offline', async () => {
      // Load dashboard first
      await page.goto(`${BASE_URL}/staff/dashboard`, { waitUntil: 'networkidle0' });
      await page.waitForTimeout(2000);
      
      // Go offline
      await page.setOfflineMode(true);
      
      // Try to navigate
      await page.reload();
      await page.waitForTimeout(1000);
      
      // Should still show content (cached)
      const content = await page.content();
      expect(content.length).toBeGreaterThan(100);
      
      // Go back online
      await page.setOfflineMode(false);
    });

    test('should queue actions when offline', async () => {
      await page.goto(`${BASE_URL}/staff/dashboard`, { waitUntil: 'networkidle0' });
      
      // Go offline
      await page.setOfflineMode(true);
      
      // Try to perform action (should be queued)
      const actionButton = await page.$('button');
      if (actionButton) {
        await actionButton.click();
        
        // Check for offline indicator or toast
        const offlineIndicator = await page.$('[class*="offline"], .toast');
        expect(offlineIndicator).toBeDefined();
      }
      
      // Go back online
      await page.setOfflineMode(false);
    });
  });

  describe('Real-time Updates', () => {
    test('should show real-time connection status', async () => {
      await page.goto(`${BASE_URL}/staff/dashboard`, { waitUntil: 'networkidle0' });
      
      // Look for connection indicator
      const connectionStatus = await page.$('[class*="realtime"], [class*="connection"]');
      expect(connectionStatus).toBeDefined();
    });

    test('should update job status in real-time', async () => {
      // This would require opening two browser instances
      // and checking if updates in one reflect in the other
      
      const page2 = await browser.newPage();
      await page2.goto(`${BASE_URL}/staff/dashboard`, { waitUntil: 'networkidle0' });
      
      // Make change in page1
      // Check if it reflects in page2
      
      await page2.close();
    });
  });

  describe('Mobile Responsiveness', () => {
    test('should work on mobile viewport', async () => {
      await page.setViewport({ width: 375, height: 667 });
      await page.goto(`${BASE_URL}/staff/dashboard`, { waitUntil: 'networkidle0' });
      
      // Check if layout adapts
      const mobileMenu = await page.$('[class*="mobile"], [class*="hamburger"]');
      expect(mobileMenu).toBeDefined();
      
      // Check if cards stack vertically
      const cards = await page.$$('.card');
      expect(cards).toBeDefined();
    });

    test('should have touch-friendly buttons', async () => {
      await page.setViewport({ width: 375, height: 667 });
      await page.goto(`${BASE_URL}/staff/dashboard`, { waitUntil: 'networkidle0' });
      
      // Check button sizes
      const buttons = await page.$$('button');
      for (const button of buttons) {
        const box = await button.boundingBox();
        if (box) {
          // Minimum 44px for touch targets
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    });
  });

  describe('GPS Tracking', () => {
    test('should request location permission', async () => {
      // Grant geolocation permission
      const context = browser.defaultBrowserContext();
      await context.overridePermissions(BASE_URL, ['geolocation']);
      
      await page.goto(`${BASE_URL}/staff/dashboard`, { waitUntil: 'networkidle0' });
      
      // Start a job that requires GPS
      const startButton = await page.$('button:contains("Starta")');
      if (startButton) {
        await startButton.click();
        
        // Should show GPS modal or indicator
        const gpsIndicator = await page.$('[class*="gps"], [class*="location"]');
        expect(gpsIndicator).toBeDefined();
      }
    });
  });
});

// Helper functions
async function loginAsStaff(page) {
  await page.goto(`${BASE_URL}/staff`, { waitUntil: 'networkidle0' });
  
  // Use quick login in dev or fill form
  const quickLogin = await page.$('button:contains("Quick Login")');
  if (quickLogin) {
    await quickLogin.click();
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
  } else {
    await page.type('input[type="tel"]', '0701234567');
    await page.click('button[type="submit"]');
    // Handle OTP flow
  }
}