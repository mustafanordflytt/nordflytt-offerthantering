// E2E Test Setup
beforeAll(async () => {
  // Set longer timeout for E2E tests
  jest.setTimeout(60000);
  
  // Wait for server to be ready
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
});

// Global error handler
page.on('pageerror', error => {
  console.error('Page error:', error.message);
});

// Console log handler (useful for debugging)
if (process.env.DEBUG) {
  page.on('console', msg => {
    console.log('Browser console:', msg.text());
  });
}

// Request failure handler
page.on('requestfailed', request => {
  console.error('Request failed:', request.url(), request.failure().errorText);
});

// Custom matchers
expect.extend({
  async toHaveText(received, expected) {
    const text = await received.textContent();
    const pass = text.includes(expected);
    return {
      pass,
      message: () => `expected element to have text "${expected}", but got "${text}"`
    };
  },
  
  async toBeVisible(received) {
    const isVisible = await received.isVisible();
    return {
      pass: isVisible,
      message: () => `expected element to be visible`
    };
  }
});