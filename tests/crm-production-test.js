#!/usr/bin/env node

/**
 * CRM Production Readiness Test Suite
 * Comprehensive End-to-End tests for CRM system
 */

import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 30000;

// Test credentials
const TEST_USERS = {
  admin: { email: 'admin@nordflytt.se', password: 'admin123' },
  manager: { email: 'manager@nordflytt.se', password: 'manager123' },
  employee: { email: 'employee@nordflytt.se', password: 'employee123' }
};

console.log('🧪 Starting CRM Production Readiness Tests');
console.log(`🌐 Testing against: ${BASE_URL}`);

let browser;
let page;
let testResults = [];

async function recordResult(testName, passed, details = '') {
  const result = {
    test: testName,
    passed,
    details,
    timestamp: new Date().toISOString()
  };
  testResults.push(result);
  
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${testName}${details ? ` - ${details}` : ''}`);
}

async function setupBrowser() {
  browser = await chromium.launch({ 
    headless: process.env.HEADLESS !== 'false',
    timeout: TEST_TIMEOUT 
  });
  page = await browser.newPage();
  
  // Set up error logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`🐛 Browser error: ${msg.text()}`);
    }
  });
  
  page.on('pageerror', error => {
    console.log(`🚨 Page error: ${error.message}`);
  });
}

async function testBasicConnectivity() {
  console.log('\n📡 Testing Basic Connectivity');
  
  try {
    await page.goto(`${BASE_URL}/crm`, { waitUntil: 'networkidle' });
    
    // Should redirect to login or show CRM
    const currentUrl = page.url();
    const hasLogin = currentUrl.includes('/crm/login') || await page.locator('text=Logga in').isVisible();
    const hasCRM = currentUrl.includes('/crm') && !currentUrl.includes('/login');
    
    await recordResult('CRM Route Accessible', hasLogin || hasCRM, `Redirected to: ${currentUrl}`);
    
    // Check for critical CSS loading
    const hasStyles = await page.evaluate(() => {
      const computed = window.getComputedStyle(document.body);
      return computed.fontFamily && computed.fontSize;
    });
    
    await recordResult('CSS Loading', hasStyles);
    
    return hasLogin || hasCRM;
  } catch (error) {
    await recordResult('CRM Route Accessible', false, error.message);
    return false;
  }
}

async function testAuthentication() {
  console.log('\n🔐 Testing Authentication System');
  
  try {
    await page.goto(`${BASE_URL}/crm/login`);
    
    // Check login form exists
    const loginForm = await page.locator('form').count() > 0;
    await recordResult('Login Form Present', loginForm);
    
    if (!loginForm) return false;
    
    // Test invalid login
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(2000);
    const errorVisible = await page.locator('text=fel').or(page.locator('text=error')).isVisible();
    await recordResult('Invalid Login Rejected', errorVisible);
    
    // Test valid admin login
    await page.fill('input[type="email"]', TEST_USERS.admin.email);
    await page.fill('input[type="password"]', TEST_USERS.admin.password);
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    const redirected = page.url().includes('/crm/dashboard') || page.url().includes('/crm') && !page.url().includes('/login');
    await recordResult('Valid Admin Login', redirected, `Redirected to: ${page.url()}`);
    
    return redirected;
  } catch (error) {
    await recordResult('Authentication Test', false, error.message);
    return false;
  }
}

async function testDashboardLoad() {
  console.log('\n📊 Testing Dashboard Loading');
  
  try {
    await page.goto(`${BASE_URL}/crm/dashboard`, { waitUntil: 'networkidle' });
    
    // Check for dashboard elements
    const hasDashboardTitle = await page.locator('text=Dashboard').isVisible();
    await recordResult('Dashboard Title Visible', hasDashboardTitle);
    
    // Check for metrics cards
    const metricsCards = await page.locator('[class*="card"]').count();
    await recordResult('Dashboard Metrics Cards', metricsCards > 0, `Found ${metricsCards} cards`);
    
    // Check for navigation
    const hasNavigation = await page.locator('nav').or(page.locator('[class*="sidebar"]')).count() > 0;
    await recordResult('Navigation Present', hasNavigation);
    
    // Test mobile navigation (if present)
    const mobileMenuButton = await page.locator('[aria-label="Öppna navigation"]').count();
    if (mobileMenuButton > 0) {
      await recordResult('Mobile Navigation Available', true);
    }
    
    return hasDashboardTitle;
  } catch (error) {
    await recordResult('Dashboard Load Test', false, error.message);
    return false;
  }
}

async function testCRMNavigation() {
  console.log('\n🧭 Testing CRM Navigation');
  
  const testPages = [
    { name: 'Customers', path: '/crm/kunder', expectedText: 'Kunder' },
    { name: 'Leads', path: '/crm/leads', expectedText: 'Leads' },
    { name: 'Jobs', path: '/crm/uppdrag', expectedText: 'Uppdrag' },
    { name: 'Offers', path: '/crm/offerter', expectedText: 'Offerter' }
  ];
  
  let successCount = 0;
  
  for (const testPage of testPages) {
    try {
      await page.goto(`${BASE_URL}${testPage.path}`, { waitUntil: 'networkidle', timeout: 15000 });
      
      const hasExpectedContent = await page.locator(`text=${testPage.expectedText}`).isVisible();
      const noJSError = !await page.locator('text=error').or(page.locator('text=fel')).isVisible();
      
      const success = hasExpectedContent && noJSError;
      await recordResult(`${testPage.name} Page Load`, success, `URL: ${testPage.path}`);
      
      if (success) successCount++;
      
    } catch (error) {
      await recordResult(`${testPage.name} Page Load`, false, error.message);
    }
  }
  
  return successCount >= testPages.length * 0.75; // 75% success rate
}

async function testMobileResponsiveness() {
  console.log('\n📱 Testing Mobile Responsiveness');
  
  try {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/crm/dashboard`);
    
    // Check if mobile navigation is accessible
    const mobileMenuVisible = await page.locator('[aria-label="Öppna navigation"]').isVisible();
    await recordResult('Mobile Menu Button Visible', mobileMenuVisible);
    
    if (mobileMenuVisible) {
      await page.click('[aria-label="Öppna navigation"]');
      await page.waitForTimeout(1000);
      
      const mobileMenuOpen = await page.locator('[role="dialog"]').or(page.locator('[class*="sheet"]')).isVisible();
      await recordResult('Mobile Menu Opens', mobileMenuOpen);
    }
    
    // Test touch targets (minimum 44px)
    const touchTargets = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a, [role="button"]'));
      const tooSmall = buttons.filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width < 44 || rect.height < 44;
      });
      return {
        total: buttons.length,
        tooSmall: tooSmall.length
      };
    });
    
    const touchTargetCompliance = touchTargets.tooSmall === 0;
    await recordResult('Touch Target Compliance (44px min)', touchTargetCompliance, 
      `${touchTargets.tooSmall}/${touchTargets.total} too small`);
    
    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    return mobileMenuVisible && touchTargetCompliance;
  } catch (error) {
    await recordResult('Mobile Responsiveness Test', false, error.message);
    return false;
  }
}

async function testErrorHandling() {
  console.log('\n🚨 Testing Error Handling');
  
  try {
    // Test 404 handling
    await page.goto(`${BASE_URL}/crm/nonexistent-page`);
    
    const has404Handler = await page.locator('text=404').or(page.locator('text=hittas inte')).isVisible();
    await recordResult('404 Error Handling', has404Handler);
    
    // Test API error simulation (if possible)
    await page.goto(`${BASE_URL}/crm/dashboard`);
    
    // Check if error boundaries are in place (look for error boundary code in page)
    const hasErrorBoundary = await page.evaluate(() => {
      return document.querySelector('[data-error-boundary]') !== null ||
             document.body.innerHTML.includes('ErrorBoundary');
    });
    
    await recordResult('Error Boundary Implementation', hasErrorBoundary);
    
    return has404Handler;
  } catch (error) {
    await recordResult('Error Handling Test', false, error.message);
    return false;
  }
}

async function testSecurityHeaders() {
  console.log('\n🔒 Testing Security Headers');
  
  try {
    const response = await page.goto(`${BASE_URL}/crm`);
    const headers = response.headers();
    
    const hasSecurityHeaders = {
      'x-frame-options': headers['x-frame-options'] !== undefined,
      'x-content-type-options': headers['x-content-type-options'] !== undefined,
      'content-security-policy': headers['content-security-policy'] !== undefined,
      'strict-transport-security': headers['strict-transport-security'] !== undefined
    };
    
    const securityScore = Object.values(hasSecurityHeaders).filter(Boolean).length;
    await recordResult('Security Headers', securityScore >= 2, 
      `Found ${securityScore}/4 security headers`);
    
    return securityScore >= 2;
  } catch (error) {
    await recordResult('Security Headers Test', false, error.message);
    return false;
  }
}

async function testRoleBasedAccess() {
  console.log('\n👥 Testing Role-Based Access');
  
  try {
    // Test employee login and access
    await page.goto(`${BASE_URL}/crm/login`);
    
    await page.fill('input[type="email"]', TEST_USERS.employee.email);
    await page.fill('input[type="password"]', TEST_USERS.employee.password);
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    
    const employeeLoggedIn = page.url().includes('/crm') && !page.url().includes('/login');
    await recordResult('Employee Login Success', employeeLoggedIn);
    
    if (employeeLoggedIn) {
      // Try to access admin-only page
      await page.goto(`${BASE_URL}/crm/installningar`);
      
      const hasAccessRestriction = await page.locator('text=behörighet').or(
        page.locator('text=permission')
      ).isVisible();
      
      await recordResult('Role-Based Access Control', hasAccessRestriction);
    }
    
    return employeeLoggedIn;
  } catch (error) {
    await recordResult('Role-Based Access Test', false, error.message);
    return false;
  }
}

async function testPerformance() {
  console.log('\n⚡ Testing Performance');
  
  try {
    const startTime = Date.now();
    
    await page.goto(`${BASE_URL}/crm/dashboard`, { waitUntil: 'networkidle' });
    
    const loadTime = Date.now() - startTime;
    const performanceGood = loadTime < 5000; // Under 5 seconds
    
    await recordResult('Page Load Performance', performanceGood, `${loadTime}ms`);
    
    // Test JS bundle size (approximate)
    const jsSize = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      return scripts.length;
    });
    
    await recordResult('JS Bundle Reasonable', jsSize < 20, `${jsSize} script tags`);
    
    return performanceGood;
  } catch (error) {
    await recordResult('Performance Test', false, error.message);
    return false;
  }
}

async function generateReport() {
  console.log('\n📊 Test Results Summary');
  console.log('='.repeat(50));
  
  const passed = testResults.filter(r => r.passed).length;
  const failed = testResults.filter(r => r.passed === false).length;
  const total = testResults.length;
  
  console.log(`✅ Passed: ${passed}/${total} (${Math.round(passed/total*100)}%)`);
  console.log(`❌ Failed: ${failed}/${total} (${Math.round(failed/total*100)}%)`);
  console.log('');
  
  // Group by category
  const categories = {
    'Connectivity': testResults.filter(r => r.test.includes('Route') || r.test.includes('CSS')),
    'Authentication': testResults.filter(r => r.test.includes('Login') || r.test.includes('Auth')),
    'Navigation': testResults.filter(r => r.test.includes('Page Load') || r.test.includes('Dashboard')),
    'Mobile': testResults.filter(r => r.test.includes('Mobile') || r.test.includes('Touch')),
    'Security': testResults.filter(r => r.test.includes('Security') || r.test.includes('Role')),
    'Performance': testResults.filter(r => r.test.includes('Performance') || r.test.includes('JS Bundle'))
  };
  
  for (const [category, results] of Object.entries(categories)) {
    if (results.length > 0) {
      const categoryPassed = results.filter(r => r.passed).length;
      const categoryScore = Math.round(categoryPassed / results.length * 100);
      console.log(`📊 ${category}: ${categoryPassed}/${results.length} (${categoryScore}%)`);
    }
  }
  
  console.log('');
  
  // Failed tests details
  const failedTests = testResults.filter(r => !r.passed);
  if (failedTests.length > 0) {
    console.log('❌ Failed Tests Details:');
    failedTests.forEach(test => {
      console.log(`   • ${test.test}: ${test.details}`);
    });
    console.log('');
  }
  
  // Production readiness assessment
  const criticalTests = [
    'CRM Route Accessible',
    'Valid Admin Login', 
    'Dashboard Title Visible',
    'Touch Target Compliance (44px min)'
  ];
  
  const criticalPassed = criticalTests.every(test => 
    testResults.find(r => r.test === test)?.passed
  );
  
  const productionReady = passed >= total * 0.85 && criticalPassed;
  
  console.log(`🚀 Production Readiness: ${productionReady ? '✅ READY' : '❌ NOT READY'}`);
  
  if (!productionReady) {
    console.log('\n⚠️ Issues to resolve before production:');
    if (!criticalPassed) {
      console.log('   • Critical functionality failures detected');
    }
    if (passed < total * 0.85) {
      console.log('   • Test success rate below 85% threshold');
    }
  } else {
    console.log('\n🎉 CRM system is ready for production deployment!');
  }
  
  return productionReady;
}

async function runAllTests() {
  try {
    await setupBrowser();
    
    const connectivityOk = await testBasicConnectivity();
    
    if (connectivityOk) {
      await testAuthentication();
      await testDashboardLoad();
      await testCRMNavigation();
      await testMobileResponsiveness();
      await testErrorHandling();
      await testSecurityHeaders();
      await testRoleBasedAccess();
      await testPerformance();
    } else {
      console.log('⚠️ Basic connectivity failed - skipping dependent tests');
    }
    
    const productionReady = await generateReport();
    
    process.exit(productionReady ? 0 : 1);
    
  } catch (error) {
    console.error('🚨 Test suite failed:', error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test suite
runAllTests();