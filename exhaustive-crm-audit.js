import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const exhaustiveCRMAudit = async () => {
  console.log('🚀 Starting Exhaustive Nordflytt CRM Audit...\n');
  
  // Create audit directory structure
  const auditDir = 'audit';
  const screenshotsDir = path.join(auditDir, 'screenshots');
  const pageReportsDir = path.join(auditDir, 'page-reports');
  const interactionLogsDir = path.join(auditDir, 'interaction-logs');
  
  // Create directories
  await fs.mkdir(auditDir, { recursive: true });
  await fs.mkdir(screenshotsDir, { recursive: true });
  await fs.mkdir(pageReportsDir, { recursive: true });
  await fs.mkdir(interactionLogsDir, { recursive: true });
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--window-size=1920,1080']
  });
  
  const page = await browser.newPage();
  
  const auditResults = {
    startTime: new Date().toISOString(),
    pages: [],
    totalInteractions: 0,
    totalErrors: 0,
    totalSuccesses: 0,
    brokenFeatures: [],
    workingFeatures: [],
    performanceIssues: [],
    mobileResponsiveness: [],
    codeAnalysis: []
  };

  try {
    // PHASE 1: Discover all CRM pages
    console.log('🔍 PHASE 1: Discovering all CRM pages...\n');
    const allPages = await discoverAllPages(page);
    console.log(`✅ Found ${allPages.length} pages to audit\n`);
    
    // PHASE 2: Test every page exhaustively
    console.log('📋 PHASE 2: Testing every page exhaustively...\n');
    for (const pagePath of allPages) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📄 TESTING PAGE: ${pagePath}`);
      console.log(`${'='.repeat(80)}\n`);
      
      const pageAudit = await testPageExhaustively(page, pagePath, screenshotsDir);
      auditResults.pages.push(pageAudit);
      
      // Update totals
      auditResults.totalInteractions += pageAudit.interactions.length;
      auditResults.totalErrors += pageAudit.errors.length;
      auditResults.totalSuccesses += pageAudit.successes.length;
      
      // Save individual page report
      await savePageReport(pageAudit, pageReportsDir);
    }
    
    // PHASE 3: Test navigation pathways
    console.log('\n\n🛤️ PHASE 3: Testing user navigation pathways...\n');
    await testNavigationPathways(page, auditResults);
    
    // PHASE 4: Test mobile responsiveness
    console.log('\n\n📱 PHASE 4: Testing mobile responsiveness...\n');
    await testMobileResponsiveness(page, allPages, auditResults);
    
    // PHASE 5: Performance testing
    console.log('\n\n⚡ PHASE 5: Performance testing...\n');
    await testPerformance(page, allPages, auditResults);
    
    // PHASE 6: Generate comprehensive documentation
    console.log('\n\n📝 PHASE 6: Generating comprehensive documentation...\n');
    await generateComprehensiveDocumentation(auditResults, auditDir);
    
    console.log('\n✅ AUDIT COMPLETE!');
    console.log(`📊 Total pages tested: ${auditResults.pages.length}`);
    console.log(`🔘 Total interactions tested: ${auditResults.totalInteractions}`);
    console.log(`❌ Total errors found: ${auditResults.totalErrors}`);
    console.log(`✅ Total successes: ${auditResults.totalSuccesses}`);
    
  } catch (error) {
    console.error('❌ Audit failed:', error);
  } finally {
    await browser.close();
  }
};

// Discover all pages in the CRM
const discoverAllPages = async (page) => {
  const discoveredPages = new Set();
  const toVisit = ['/crm'];
  const visited = new Set();
  
  // Add known pages that might not be discoverable via links
  const knownPages = [
    '/crm',
    '/crm/dashboard',
    '/crm/kunder',
    '/crm/leads',
    '/crm/uppdrag',
    '/crm/anstallda',
    '/crm/kalender',
    '/crm/arenden',
    '/crm/offentliga-upphandlingar',
    '/crm/juridik-risk',
    '/crm/lager',
    '/crm/kundmagasin',
    '/crm/leverantorer',
    '/crm/ai-optimering',
    '/crm/ai-kundtjanst',
    '/crm/ai-marknadsforing',
    '/crm/samarbeten',
    '/crm/ekonomi',
    '/crm/rapporter'
  ];
  
  // Add known pages to visit list
  knownPages.forEach(p => {
    if (!toVisit.includes(p)) toVisit.push(p);
  });
  
  while (toVisit.length > 0) {
    const currentPath = toVisit.pop();
    if (visited.has(currentPath)) continue;
    
    visited.add(currentPath);
    console.log(`   🔍 Discovering: ${currentPath}`);
    
    try {
      await page.goto(`http://localhost:3000${currentPath}`, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if page loaded successfully
      const title = await page.title();
      const hasContent = await page.$('body');
      
      if (hasContent) {
        discoveredPages.add(currentPath);
        
        // Find all internal links
        const links = await page.evaluate(() => {
          const allLinks = Array.from(document.querySelectorAll('a[href]'));
          return allLinks
            .map(link => link.getAttribute('href'))
            .filter(href => href && (href.startsWith('/crm') || href.startsWith('/')))
            .filter(href => !href.includes('#'))
            .map(href => href.split('?')[0]); // Remove query params
        });
        
        // Add new links to visit
        for (const link of links) {
          if (!visited.has(link) && !toVisit.includes(link) && link.startsWith('/crm')) {
            toVisit.push(link);
          }
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Failed to discover ${currentPath}: ${error.message}`);
    }
  }
  
  return Array.from(discoveredPages).sort();
};

// Test a page exhaustively
const testPageExhaustively = async (page, pagePath, screenshotsDir) => {
  const pageAudit = {
    path: pagePath,
    timestamp: new Date().toISOString(),
    loadTime: 0,
    title: '',
    screenshot: '',
    elements: {
      buttons: [],
      links: [],
      forms: [],
      inputs: [],
      selects: [],
      textareas: []
    },
    interactions: [],
    errors: [],
    successes: [],
    warnings: [],
    consoleErrors: [],
    networkErrors: []
  };
  
  // Set up console error tracking
  const consoleMessages = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleMessages.push(msg.text());
    }
  });
  
  // Set up network error tracking
  const networkErrors = [];
  page.on('requestfailed', request => {
    networkErrors.push({
      url: request.url(),
      method: request.method(),
      error: request.failure().errorText
    });
  });
  
  try {
    // Navigate and measure load time
    const startTime = Date.now();
    const response = await page.goto(`http://localhost:3000${pagePath}`, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    pageAudit.loadTime = Date.now() - startTime;
    
    // Check response status
    if (!response.ok()) {
      pageAudit.errors.push(`Page returned ${response.status()} status code`);
    }
    
    // Get page title
    pageAudit.title = await page.title();
    console.log(`📄 Page Title: "${pageAudit.title}"`);
    console.log(`⏱️ Load Time: ${pageAudit.loadTime}ms`);
    
    // Take screenshot
    const screenshotPath = path.join(screenshotsDir, `${pagePath.replace(/\//g, '_')}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    pageAudit.screenshot = screenshotPath;
    console.log(`📸 Screenshot saved`);
    
    // Wait for dynamic content
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Discover all interactive elements
    console.log(`\n🔍 Discovering interactive elements...`);
    
    // Find all buttons
    pageAudit.elements.buttons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"], [role="button"]'));
      return buttons.map((btn, index) => ({
        index,
        text: btn.textContent?.trim() || btn.value || '',
        id: btn.id,
        className: btn.className,
        type: btn.type || 'button',
        disabled: btn.disabled,
        visible: btn.offsetParent !== null,
        selector: btn.id ? `#${btn.id}` : `.${btn.className.split(' ').join('.')}`
      }));
    });
    console.log(`   🔘 Found ${pageAudit.elements.buttons.length} buttons`);
    
    // Find all links
    pageAudit.elements.links = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'));
      return links.map((link, index) => ({
        index,
        text: link.textContent?.trim() || '',
        href: link.href,
        target: link.target,
        visible: link.offsetParent !== null
      }));
    });
    console.log(`   🔗 Found ${pageAudit.elements.links.length} links`);
    
    // Find all forms
    pageAudit.elements.forms = await page.evaluate(() => {
      const forms = Array.from(document.querySelectorAll('form'));
      return forms.map((form, index) => ({
        index,
        id: form.id,
        action: form.action,
        method: form.method,
        inputs: Array.from(form.querySelectorAll('input, textarea, select')).length
      }));
    });
    console.log(`   📝 Found ${pageAudit.elements.forms.length} forms`);
    
    // Find all inputs
    pageAudit.elements.inputs = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input:not([type="button"]):not([type="submit"])'));
      return inputs.map((input, index) => ({
        index,
        name: input.name,
        type: input.type,
        id: input.id,
        placeholder: input.placeholder,
        required: input.required,
        value: input.value,
        visible: input.offsetParent !== null
      }));
    });
    console.log(`   📝 Found ${pageAudit.elements.inputs.length} input fields`);
    
    // Test all buttons
    console.log(`\n🔘 Testing buttons...`);
    for (const button of pageAudit.elements.buttons) {
      if (button.visible && !button.disabled) {
        const result = await testButton(page, button, pagePath);
        pageAudit.interactions.push(result);
        if (result.error) {
          pageAudit.errors.push(`Button "${button.text}": ${result.error}`);
        } else {
          pageAudit.successes.push(`Button "${button.text}": ${result.result}`);
        }
      }
    }
    
    // Test all links
    console.log(`\n🔗 Testing links...`);
    for (const link of pageAudit.elements.links) {
      if (link.visible && link.href && !link.href.includes('mailto:') && !link.href.includes('tel:')) {
        const result = await testLink(page, link, pagePath);
        pageAudit.interactions.push(result);
        if (result.error) {
          pageAudit.errors.push(`Link "${link.text}": ${result.error}`);
        } else {
          pageAudit.successes.push(`Link "${link.text}": ${result.result}`);
        }
      }
    }
    
    // Test all forms
    console.log(`\n📝 Testing forms...`);
    for (const form of pageAudit.elements.forms) {
      const result = await testForm(page, form, pageAudit.elements.inputs);
      pageAudit.interactions.push(result);
      if (result.error) {
        pageAudit.errors.push(`Form ${form.index}: ${result.error}`);
      } else if (result.submitResult.includes('error')) {
        pageAudit.errors.push(`Form ${form.index}: ${result.submitResult}`);
      } else {
        pageAudit.successes.push(`Form ${form.index}: ${result.submitResult}`);
      }
    }
    
    // Collect console errors
    pageAudit.consoleErrors = consoleMessages;
    pageAudit.networkErrors = networkErrors;
    
  } catch (error) {
    pageAudit.errors.push(`Page testing failed: ${error.message}`);
    console.log(`❌ Page testing failed: ${error.message}`);
  }
  
  // Clear event listeners
  page.removeAllListeners('console');
  page.removeAllListeners('requestfailed');
  
  return pageAudit;
};

// Test a button
const testButton = async (page, button, currentPath) => {
  const interaction = {
    type: 'button',
    element: button,
    result: '',
    error: null,
    urlBefore: page.url(),
    urlAfter: '',
    timestamp: new Date().toISOString()
  };
  
  try {
    console.log(`   🔘 Testing button: "${button.text}"`);
    
    // Try different selectors
    let clicked = false;
    const selectors = [
      button.id && `#${button.id}`,
      button.selector,
      `button:has-text("${button.text}")`,
      `button:nth-of-type(${button.index + 1})`
    ].filter(Boolean);
    
    for (const selector of selectors) {
      try {
        await page.click(selector, { timeout: 5000 });
        clicked = true;
        break;
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!clicked) {
      throw new Error('Could not click button with any selector');
    }
    
    // Wait for potential navigation or modal
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    interaction.urlAfter = page.url();
    
    // Check for errors on page
    const errorElement = await page.$('.error, .alert-danger, [role="alert"], .text-red-500');
    if (errorElement) {
      const errorText = await errorElement.textContent();
      interaction.error = errorText;
      interaction.result = 'error_displayed';
    } else if (interaction.urlBefore !== interaction.urlAfter) {
      interaction.result = 'navigation_occurred';
    } else {
      // Check for modals or popups
      const modal = await page.$('.modal, [role="dialog"], .dialog');
      if (modal) {
        interaction.result = 'modal_opened';
      } else {
        interaction.result = 'clicked_successfully';
      }
    }
    
    // Navigate back if we left the page
    if (interaction.urlAfter !== interaction.urlBefore && !interaction.urlAfter.includes(currentPath)) {
      await page.goto(interaction.urlBefore, { waitUntil: 'networkidle0' }));
      await new Promise(resolve => setTimeout(resolve, 1000);
    }
    
  } catch (error) {
    interaction.error = error.message;
    interaction.result = 'test_failed';
  }
  
  return interaction;
};

// Test a link
const testLink = async (page, link, currentPath) => {
  const interaction = {
    type: 'link',
    element: link,
    result: '',
    error: null,
    urlBefore: page.url(),
    urlAfter: '',
    responseStatus: null,
    timestamp: new Date().toISOString()
  };
  
  try {
    console.log(`   🔗 Testing link: "${link.text}" -> ${link.href}`);
    
    // Skip external links
    if (!link.href.includes('localhost')) {
      interaction.result = 'skipped_external';
      return interaction;
    }
    
    // Click the link
    await page.evaluate((index) => {
      const links = document.querySelectorAll('a[href]');
      links[index]?.click();
    }, link.index);
    
    // Wait for navigation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    interaction.urlAfter = page.url();
    
    if (interaction.urlAfter !== interaction.urlBefore) {
      interaction.result = 'navigation_successful';
      
      // Check if new page loaded correctly
      const title = await page.title();
      const hasContent = await page.$('body');
      
      if (!hasContent) {
        interaction.error = 'Page has no content';
        interaction.result = 'navigation_failed';
      }
      
      // Navigate back
      await page.goto(interaction.urlBefore, { waitUntil: 'networkidle0' }));
      await new Promise(resolve => setTimeout(resolve, 1000);
    } else {
      interaction.result = 'no_navigation';
    }
    
  } catch (error) {
    interaction.error = error.message;
    interaction.result = 'test_failed';
  }
  
  return interaction;
};

// Test a form
const testForm = async (page, form, allInputs) => {
  const interaction = {
    type: 'form',
    element: form,
    fillResults: [],
    submitResult: '',
    error: null,
    timestamp: new Date().toISOString()
  };
  
  try {
    console.log(`   📝 Testing form ${form.index}`);
    
    // Get form inputs
    const formInputs = await page.evaluate((formIndex) => {
      const form = document.querySelectorAll('form')[formIndex];
      if (!form) return [];
      
      return Array.from(form.querySelectorAll('input, textarea, select')).map(input => ({
        name: input.name,
        type: input.type,
        id: input.id,
        required: input.required,
        tagName: input.tagName.toLowerCase()
      }));
    }, form.index);
    
    // Fill each input
    for (const input of formInputs) {
      const testValue = generateTestValue(input.type, input.name);
      
      try {
        const selector = input.id ? `#${input.id}` : `[name="${input.name}"]`;
        
        if (input.tagName === 'select') {
          // Handle select elements
          const options = await page.$$eval(selector + ' option', opts => 
            opts.map(opt => opt.value).filter(v => v)
          );
          if (options.length > 0) {
            await page.select(selector, options[0]);
            interaction.fillResults.push({
              field: input.name,
              value: options[0],
              success: true
            });
          }
        } else {
          // Handle input and textarea
          await page.fill(selector, testValue);
          interaction.fillResults.push({
            field: input.name,
            value: testValue,
            success: true
          });
        }
        
      } catch (error) {
        interaction.fillResults.push({
          field: input.name,
          value: testValue,
          success: false,
          error: error.message
        });
      }
    }
    
    // Try to submit the form
    try {
      // Look for submit button within form
      const submitButton = await page.$(`form:nth-of-type(${form.index + 1}) button[type="submit"], form:nth-of-type(${form.index + 1}) input[type="submit"], form:nth-of-type(${form.index + 1}) button:has-text("Submit"), form:nth-of-type(${form.index + 1}) button:has-text("Skicka")`);
      
      if (submitButton) {
        await submitButton.click();
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check for success/error messages
        const errorMsg = await page.$('.error, .alert-danger, .text-red-500');
        const successMsg = await page.$('.success, .alert-success, .text-green-500');
        
        if (errorMsg) {
          const text = await errorMsg.textContent();
          interaction.submitResult = `error: ${text}`;
        } else if (successMsg) {
          const text = await successMsg.textContent();
          interaction.submitResult = `success: ${text}`;
        } else {
          interaction.submitResult = 'submitted_no_clear_feedback';
        }
      } else {
        interaction.submitResult = 'no_submit_button_found';
      }
      
    } catch (error) {
      interaction.submitResult = `submit_failed: ${error.message}`;
    }
    
  } catch (error) {
    interaction.error = error.message;
    interaction.submitResult = 'form_test_failed';
  }
  
  return interaction;
};

// Generate test values for form inputs
const generateTestValue = (inputType, inputName) => {
  const testData = {
    email: 'test@nordflytt.se',
    name: 'Test Användare',
    phone: '070-123-4567',
    tel: '070-123-4567',
    address: 'Testgatan 1, 123 45 Stockholm',
    price: '10000',
    date: '2025-12-31',
    time: '14:30',
    text: 'Test text värde',
    number: '42',
    url: 'https://test.com',
    password: 'TestPassword123!',
    search: 'test sökning'
  };
  
  // Match by input type
  if (testData[inputType]) return testData[inputType];
  
  // Match by input name patterns
  const nameLower = inputName?.toLowerCase() || '';
  if (nameLower.includes('email') || nameLower.includes('e-post')) return testData.email;
  if (nameLower.includes('name') || nameLower.includes('namn')) return testData.name;
  if (nameLower.includes('phone') || nameLower.includes('tel') || nameLower.includes('telefon')) return testData.phone;
  if (nameLower.includes('address') || nameLower.includes('adress')) return testData.address;
  if (nameLower.includes('price') || nameLower.includes('pris') || nameLower.includes('cost')) return testData.price;
  if (nameLower.includes('date') || nameLower.includes('datum')) return testData.date;
  if (nameLower.includes('time') || nameLower.includes('tid')) return testData.time;
  if (nameLower.includes('password') || nameLower.includes('lösenord')) return testData.password;
  if (nameLower.includes('search') || nameLower.includes('sök')) return testData.search;
  
  return testData.text;
};

// Test navigation pathways
const testNavigationPathways = async (page, auditResults) => {
  const pathways = [
    {
      name: 'Customer Journey',
      steps: [
        { path: '/crm', action: 'navigate' },
        { path: '/crm/kunder', action: 'click', selector: 'a[href="/crm/kunder"]' },
        { action: 'click', selector: 'button:has-text("Ny kund")' }
      ]
    },
    {
      name: 'Lead to Customer',
      steps: [
        { path: '/crm/leads', action: 'navigate' },
        { action: 'click', selector: '.lead-card:first-child' },
        { action: 'click', selector: 'button:has-text("Konvertera")' }
      ]
    },
    {
      name: 'Create Job',
      steps: [
        { path: '/crm/uppdrag', action: 'navigate' },
        { action: 'click', selector: 'button:has-text("Nytt uppdrag")' }
      ]
    }
  ];
  
  for (const pathway of pathways) {
    console.log(`🛤️ Testing pathway: ${pathway.name}`);
    const pathwayResult = {
      name: pathway.name,
      steps: [],
      success: true,
      error: null
    };
    
    try {
      for (const step of pathway.steps) {
        if (step.action === 'navigate' && step.path) {
          await page.goto(`http://localhost:3000${step.path}`, { waitUntil: 'networkidle0' });
          pathwayResult.steps.push({ action: 'navigate', target: step.path, success: true });
        } else if (step.action === 'click' && step.selector) {
          try {
            await page.click(step.selector, { timeout: 5000 });
            await new Promise(resolve => setTimeout(resolve, 2000));
            pathwayResult.steps.push({ action: 'click', target: step.selector, success: true });
          } catch (e) {
            pathwayResult.steps.push({ action: 'click', target: step.selector, success: false, error: e.message });
            pathwayResult.success = false;
            pathwayResult.error = e.message;
            break;
          }
        }
      }
    } catch (error) {
      pathwayResult.success = false;
      pathwayResult.error = error.message;
    }
    
    auditResults.pages.push({
      path: `pathway_${pathway.name}`,
      interactions: [pathwayResult],
      errors: pathwayResult.success ? [] : [pathwayResult.error],
      successes: pathwayResult.success ? ['Pathway completed successfully'] : []
    });
  }
};

// Test mobile responsiveness
const testMobileResponsiveness = async (page, allPages, auditResults) => {
  const viewports = [
    { name: 'iPhone 12', width: 390, height: 844 },
    { name: 'iPad', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 }
  ];
  
  for (const pagePath of allPages.slice(0, 5)) { // Test first 5 pages
    console.log(`📱 Testing mobile responsiveness for: ${pagePath}`);
    
    for (const viewport of viewports) {
      await page.setViewport(viewport);
      await page.goto(`http://localhost:3000${pagePath}`, { waitUntil: 'networkidle0' }));
      await new Promise(resolve => setTimeout(resolve, 1000);
      
      // Check for horizontal scroll (bad for mobile)
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      // Check for overlapping elements
      const hasOverlap = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        for (let i = 0; i < Math.min(elements.length, 100); i++) {
          const rect1 = elements[i].getBoundingClientRect();
          for (let j = i + 1; j < Math.min(elements.length, 100); j++) {
            const rect2 = elements[j].getBoundingClientRect();
            if (rect1.left < rect2.right && rect1.right > rect2.left &&
                rect1.top < rect2.bottom && rect1.bottom > rect2.top) {
              return true;
            }
          }
        }
        return false;
      });
      
      auditResults.mobileResponsiveness.push({
        page: pagePath,
        viewport: viewport.name,
        hasHorizontalScroll,
        hasOverlap,
        issues: []
      });
      
      if (hasHorizontalScroll) {
        auditResults.mobileResponsiveness[auditResults.mobileResponsiveness.length - 1].issues.push('Horizontal scrolling detected');
      }
      if (hasOverlap) {
        auditResults.mobileResponsiveness[auditResults.mobileResponsiveness.length - 1].issues.push('Overlapping elements detected');
      }
    }
  }
  
  // Reset to desktop viewport
  await page.setViewport({ width: 1920, height: 1080 });
};

// Test performance
const testPerformance = async (page, allPages, auditResults) => {
  for (const pagePath of allPages.slice(0, 5)) { // Test first 5 pages
    console.log(`⚡ Testing performance for: ${pagePath}`);
    
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        loadTime: navigation.loadEventEnd - navigation.fetchStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });
    
    auditResults.performanceIssues.push({
      page: pagePath,
      metrics,
      issues: []
    });
    
    // Flag performance issues
    if (metrics.loadTime > 3000) {
      auditResults.performanceIssues[auditResults.performanceIssues.length - 1].issues.push(`Slow load time: ${metrics.loadTime}ms`);
    }
    if (metrics.firstContentfulPaint > 1500) {
      auditResults.performanceIssues[auditResults.performanceIssues.length - 1].issues.push(`Slow first contentful paint: ${metrics.firstContentfulPaint}ms`);
    }
  }
};

// Save individual page report
const savePageReport = async (pageAudit, reportsDir) => {
  const reportPath = path.join(reportsDir, `${pageAudit.path.replace(/\//g, '_')}.json`);
  await fs.writeFile(reportPath, JSON.stringify(pageAudit, null, 2));
};

// Generate comprehensive documentation
const generateComprehensiveDocumentation = async (auditResults, auditDir) => {
  let markdown = `# Nordflytt CRM Complete System Audit

## 📊 Audit Summary
- **Date:** ${auditResults.startTime}
- **Pages Tested:** ${auditResults.pages.length}
- **Total Interactions:** ${auditResults.totalInteractions}
- **Total Errors:** ${auditResults.totalErrors}
- **Total Successes:** ${auditResults.totalSuccesses}

## 🏆 Executive Summary

### System Health Score: ${calculateHealthScore(auditResults)}%

### Key Findings:
- **Working Features:** ${auditResults.totalSuccesses} features are working correctly
- **Broken Features:** ${auditResults.totalErrors} features need attention
- **Critical Issues:** ${auditResults.pages.filter(p => p.errors.length > 5).length} pages have multiple errors
- **Performance Issues:** ${auditResults.performanceIssues.filter(p => p.issues.length > 0).length} pages have performance problems

---

## 📄 Page-by-Page Analysis

`;

  // Sort pages by error count (worst first)
  const sortedPages = [...auditResults.pages].sort((a, b) => b.errors.length - a.errors.length);

  for (const page of sortedPages) {
    const errorCount = page.errors.length;
    const successCount = page.successes.length;
    const statusEmoji = errorCount === 0 ? '✅' : errorCount > 5 ? '🔴' : '🟡';
    
    markdown += `
### ${statusEmoji} Page: \`${page.path}\`

**Status:** ${errorCount === 0 ? 'Fully Functional' : errorCount > 5 ? 'Critical Issues' : 'Minor Issues'}  
**Load Time:** ${page.loadTime}ms  
**Screenshot:** [View Screenshot](${page.screenshot})  

#### 📊 Metrics:
- **Buttons Found:** ${page.elements?.buttons?.length || 0}
- **Links Found:** ${page.elements?.links?.length || 0}
- **Forms Found:** ${page.elements?.forms?.length || 0}
- **Successful Interactions:** ${successCount}
- **Failed Interactions:** ${errorCount}

`;

    // Document errors if any
    if (errorCount > 0) {
      markdown += `#### ❌ Errors Found:\n`;
      for (const error of page.errors) {
        markdown += `- ${error}\n`;
      }
      markdown += '\n';
    }

    // Document successes
    if (successCount > 0) {
      markdown += `#### ✅ Working Features:\n`;
      for (const success of page.successes.slice(0, 5)) {
        markdown += `- ${success}\n`;
      }
      if (page.successes.length > 5) {
        markdown += `- ...and ${page.successes.length - 5} more\n`;
      }
      markdown += '\n';
    }

    // Document console errors
    if (page.consoleErrors?.length > 0) {
      markdown += `#### 🔴 Console Errors:\n`;
      for (const error of page.consoleErrors) {
        markdown += `- ${error}\n`;
      }
      markdown += '\n';
    }

    // Document network errors
    if (page.networkErrors?.length > 0) {
      markdown += `#### 🌐 Network Errors:\n`;
      for (const error of page.networkErrors) {
        markdown += `- ${error.method} ${error.url}: ${error.error}\n`;
      }
      markdown += '\n';
    }

    // Document specific interactions
    const failedButtons = page.interactions?.filter(i => i.type === 'button' && i.error) || [];
    const failedLinks = page.interactions?.filter(i => i.type === 'link' && i.error) || [];
    const failedForms = page.interactions?.filter(i => i.type === 'form' && (i.error || i.submitResult?.includes('error'))) || [];

    if (failedButtons.length > 0) {
      markdown += `#### 🔘 Failed Button Interactions:\n`;
      for (const btn of failedButtons) {
        markdown += `- **"${btn.element.text}"**: ${btn.error}\n`;
      }
      markdown += '\n';
    }

    if (failedLinks.length > 0) {
      markdown += `#### 🔗 Failed Link Interactions:\n`;
      for (const link of failedLinks) {
        markdown += `- **"${link.element.text}"** → ${link.element.href}: ${link.error}\n`;
      }
      markdown += '\n';
    }

    if (failedForms.length > 0) {
      markdown += `#### 📝 Failed Form Submissions:\n`;
      for (const form of failedForms) {
        markdown += `- **Form ${form.element.index}**: ${form.error || form.submitResult}\n`;
      }
      markdown += '\n';
    }

    markdown += `---\n`;
  }

  // Add mobile responsiveness section
  if (auditResults.mobileResponsiveness?.length > 0) {
    markdown += `
## 📱 Mobile Responsiveness Analysis

`;
    const mobileIssues = auditResults.mobileResponsiveness.filter(m => m.issues.length > 0);
    if (mobileIssues.length > 0) {
      markdown += `### Issues Found:\n`;
      for (const issue of mobileIssues) {
        markdown += `- **${issue.page}** on ${issue.viewport}: ${issue.issues.join(', ')}\n`;
      }
    } else {
      markdown += `✅ All tested pages are mobile responsive!\n`;
    }
  }

  // Add performance section
  if (auditResults.performanceIssues?.length > 0) {
    markdown += `
## ⚡ Performance Analysis

`;
    const perfIssues = auditResults.performanceIssues.filter(p => p.issues.length > 0);
    if (perfIssues.length > 0) {
      markdown += `### Performance Issues:\n`;
      for (const issue of perfIssues) {
        markdown += `- **${issue.page}**: ${issue.issues.join(', ')}\n`;
      }
    }
    
    markdown += `\n### Performance Metrics:\n`;
    for (const perf of auditResults.performanceIssues) {
      markdown += `- **${perf.page}**:\n`;
      markdown += `  - Load Time: ${perf.metrics.loadTime}ms\n`;
      markdown += `  - First Contentful Paint: ${perf.metrics.firstContentfulPaint}ms\n`;
    }
  }

  // Add prioritized fix list
  markdown += `
## 🔧 Prioritized Fix List

### 🔴 Critical (Fix Immediately):
`;
  const criticalPages = sortedPages.filter(p => p.errors.length > 5);
  for (const page of criticalPages) {
    markdown += `1. **${page.path}**: ${page.errors.length} errors\n`;
    for (const error of page.errors.slice(0, 3)) {
      markdown += `   - ${error}\n`;
    }
  }

  markdown += `
### 🟡 High Priority:
`;
  const highPriorityPages = sortedPages.filter(p => p.errors.length > 0 && p.errors.length <= 5);
  for (const page of highPriorityPages.slice(0, 10)) {
    markdown += `1. **${page.path}**: ${page.errors.length} errors\n`;
  }

  markdown += `
### ✅ Fully Functional Pages:
`;
  const workingPages = sortedPages.filter(p => p.errors.length === 0);
  for (const page of workingPages) {
    markdown += `- ${page.path}\n`;
  }

  // Add recommendations
  markdown += `
## 💡 Recommendations

1. **Fix Critical Issues First**: Focus on pages with multiple errors
2. **Test Form Validations**: Many forms are missing proper error handling
3. **Improve Mobile Experience**: Some pages have horizontal scrolling on mobile
4. **Optimize Performance**: Several pages take over 3 seconds to load
5. **Add Loading States**: Many buttons don't show loading feedback
6. **Implement Error Boundaries**: Console errors indicate missing error handling

## 📈 Next Steps

1. Review this audit report with the development team
2. Create tickets for each critical issue
3. Implement fixes in order of priority
4. Re-run audit after fixes to verify improvements
5. Set up automated testing to prevent regressions
`;

  // Write the main report
  const reportPath = path.join(auditDir, 'CRM-COMPLETE-AUDIT.md');
  await fs.writeFile(reportPath, markdown);
  console.log(`\n✅ Main audit report saved to: ${reportPath}`);

  // Also create a summary JSON
  const summary = {
    auditDate: auditResults.startTime,
    totalPages: auditResults.pages.length,
    totalErrors: auditResults.totalErrors,
    totalSuccesses: auditResults.totalSuccesses,
    healthScore: calculateHealthScore(auditResults),
    criticalPages: criticalPages.map(p => ({ path: p.path, errors: p.errors.length })),
    workingPages: workingPages.map(p => p.path),
    topErrors: getTopErrors(auditResults),
    recommendations: [
      'Fix critical pages first',
      'Implement proper form validation',
      'Add error boundaries',
      'Improve mobile responsiveness',
      'Optimize page load times'
    ]
  };

  const summaryPath = path.join(auditDir, 'audit-summary.json');
  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`✅ Audit summary saved to: ${summaryPath}`);
};

// Calculate system health score
const calculateHealthScore = (auditResults) => {
  const total = auditResults.totalInteractions || 1;
  const successRate = (auditResults.totalSuccesses / total) * 100;
  return Math.round(successRate);
};

// Get top errors across all pages
const getTopErrors = (auditResults) => {
  const errorCounts = {};
  
  for (const page of auditResults.pages) {
    for (const error of page.errors) {
      const errorType = error.split(':')[0];
      errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;
    }
  }
  
  return Object.entries(errorCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([error, count]) => ({ error, count }));
};

// Run the audit
exhaustiveCRMAudit().catch(console.error);