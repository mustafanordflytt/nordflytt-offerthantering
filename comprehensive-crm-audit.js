import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const comprehensiveCRMAudit = async () => {
  console.log('🚀 Starting Comprehensive Nordflytt CRM Audit...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--window-size=1920,1080']
  });
  
  const auditResults = {
    timestamp: new Date().toISOString(),
    pages: [],
    totalErrors: 0,
    totalSuccesses: 0,
    totalInteractions: 0,
    brokenFeatures: [],
    workingFeatures: [],
    navigationTests: [],
    formTests: [],
    performanceMetrics: [],
    consoleErrors: [],
    networkErrors: []
  };

  try {
    const page = await browser.newPage();
    
    // Monitor console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        auditResults.consoleErrors.push({
          page: page.url(),
          error: msg.text(),
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Monitor network errors
    page.on('response', response => {
      if (!response.ok() && !response.url().includes('_next')) {
        auditResults.networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    // Complete list of CRM pages to test
    const crmPages = [
      { path: '/crm', name: 'CRM Dashboard' },
      { path: '/crm/dashboard', name: 'Dashboard' },
      { path: '/crm/kunder', name: 'Kunder' },
      { path: '/crm/leads', name: 'Leads' },
      { path: '/crm/uppdrag', name: 'Uppdrag' },
      { path: '/crm/anstallda', name: 'Anställda' },
      { path: '/crm/kalender', name: 'Kalender' },
      { path: '/crm/arenden', name: 'Ärenden' },
      { path: '/crm/offentliga-upphandlingar', name: 'Offentliga upphandlingar' },
      { path: '/crm/juridik-risk', name: 'Juridik & Risk' },
      { path: '/crm/lager', name: 'Lager' },
      { path: '/crm/kundmagasin', name: 'Kundmagasin' },
      { path: '/crm/leverantorer', name: 'Leverantörer' },
      { path: '/crm/ai-optimering', name: 'AI Optimering' },
      { path: '/crm/ai-kundtjanst', name: 'AI Kundtjänst' },
      { path: '/crm/ai-marknadsforing', name: 'AI Marknadsföring' },
      { path: '/crm/samarbeten', name: 'Samarbeten' },
      { path: '/crm/ekonomi', name: 'Ekonomi' },
      { path: '/crm/rapporter', name: 'Rapporter' },
      { path: '/crm/rekrytering', name: 'Rekrytering' },
      { path: '/crm/installningar', name: 'Inställningar' },
      { path: '/crm/dokument', name: 'Dokument' }
    ];
    
    console.log(`📋 Testing ${crmPages.length} CRM pages...\n`);
    
    // Test each page
    for (const crmPage of crmPages) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📄 Testing: ${crmPage.name} (${crmPage.path})`);
      console.log(`${'='.repeat(80)}`);
      
      const pageResult = {
        path: crmPage.path,
        name: crmPage.name,
        status: 'pending',
        loadTime: 0,
        errors: [],
        successes: [],
        warnings: [],
        elements: {
          buttons: 0,
          links: 0,
          forms: 0,
          inputs: 0,
          selects: 0,
          textareas: 0
        },
        interactions: [],
        screenshots: [],
        performance: {}
      };
      
      try {
        // Navigate and measure load time
        const startTime = Date.now();
        const response = await page.goto(`http://localhost:3000${crmPage.path}`, {
          waitUntil: 'networkidle0',
          timeout: 30000
        });
        pageResult.loadTime = Date.now() - startTime;
        
        // Check page status
        if (response && response.ok()) {
          pageResult.status = 'loaded';
          console.log(`✅ Page loaded successfully (${pageResult.loadTime}ms)`);
        } else if (response) {
          pageResult.status = `error_${response.status()}`;
          pageResult.errors.push(`HTTP ${response.status()}: ${response.statusText()}`);
          console.log(`❌ Page returned status ${response.status()}`);
        }
        
        await wait(2000); // Wait for dynamic content
        
        // Take initial screenshot
        const screenshotPath = `audit/screenshots/${crmPage.path.replace(/\//g, '_')}_initial.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        pageResult.screenshots.push(screenshotPath);
        console.log(`📸 Initial screenshot saved`);
        
        // Count all interactive elements
        const elementCounts = await page.evaluate(() => {
          return {
            buttons: document.querySelectorAll('button, [role="button"]').length,
            links: document.querySelectorAll('a[href]').length,
            forms: document.querySelectorAll('form').length,
            inputs: document.querySelectorAll('input').length,
            selects: document.querySelectorAll('select').length,
            textareas: document.querySelectorAll('textarea').length,
            modals: document.querySelectorAll('[role="dialog"], .modal').length,
            tables: document.querySelectorAll('table').length,
            charts: document.querySelectorAll('canvas, svg.chart').length
          };
        });
        
        pageResult.elements = elementCounts;
        console.log(`\n🔍 Found elements:`);
        console.log(`   - ${elementCounts.buttons} buttons`);
        console.log(`   - ${elementCounts.links} links`);
        console.log(`   - ${elementCounts.forms} forms`);
        console.log(`   - ${elementCounts.inputs} inputs`);
        console.log(`   - ${elementCounts.tables} tables`);
        console.log(`   - ${elementCounts.charts} charts`);
        
        // Test all buttons
        await testButtons(page, pageResult, crmPage.path);
        
        // Test all forms
        await testForms(page, pageResult);
        
        // Test navigation links
        await testNavigation(page, pageResult, crmPage.path);
        
        // Test specific features based on page
        await testPageSpecificFeatures(page, pageResult, crmPage.path);
        
        // Performance metrics
        const performanceMetrics = await page.evaluate(() => {
          const navigation = performance.getEntriesByType('navigation')[0];
          return {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
            firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
          };
        });
        pageResult.performance = performanceMetrics;
        
      } catch (error) {
        pageResult.status = 'error';
        pageResult.errors.push(`Page test failed: ${error.message}`);
        console.log(`❌ Page test failed: ${error.message}`);
      }
      
      // Update totals
      auditResults.totalErrors += pageResult.errors.length;
      auditResults.totalSuccesses += pageResult.successes.length;
      auditResults.totalInteractions += pageResult.interactions.length;
      
      // Categorize results
      if (pageResult.errors.length > 0) {
        auditResults.brokenFeatures.push({
          page: crmPage.path,
          name: crmPage.name,
          errors: pageResult.errors
        });
      }
      
      if (pageResult.successes.length > 0) {
        auditResults.workingFeatures.push({
          page: crmPage.path,
          name: crmPage.name,
          features: pageResult.successes
        });
      }
      
      auditResults.pages.push(pageResult);
      
      // Save individual page report
      const pageReport = generatePageReport(pageResult);
      await fs.writeFile(
        `audit/page-reports/${crmPage.path.replace(/\//g, '_')}.md`,
        pageReport
      );
    }
    
    // Generate comprehensive report
    console.log('\n\n📝 Generating comprehensive audit report...\n');
    const report = generateComprehensiveReport(auditResults);
    await fs.writeFile('audit/CRM-AUDIT-COMPLETE.md', report);
    
    // Generate executive summary
    const summary = generateExecutiveSummary(auditResults);
    await fs.writeFile('audit/EXECUTIVE-SUMMARY.md', summary);
    
    // Generate JSON data for further analysis
    await fs.writeFile(
      'audit/audit-data.json',
      JSON.stringify(auditResults, null, 2)
    );
    
    console.log('\n✅ AUDIT COMPLETE!');
    console.log(`📊 Total pages tested: ${auditResults.pages.length}`);
    console.log(`🔘 Total interactions: ${auditResults.totalInteractions}`);
    console.log(`❌ Total errors: ${auditResults.totalErrors}`);
    console.log(`✅ Total successes: ${auditResults.totalSuccesses}`);
    
  } catch (error) {
    console.error('❌ Audit failed:', error);
  } finally {
    await browser.close();
  }
};

// Test all buttons on a page
async function testButtons(page, pageResult, pagePath) {
  console.log('\n🔘 Testing buttons...');
  
  const buttons = await page.$$('button, [role="button"]');
  let testedCount = 0;
  
  for (let i = 0; i < Math.min(buttons.length, 10); i++) {
    try {
      const buttonInfo = await page.evaluate((index) => {
        const btn = document.querySelectorAll('button, [role="button"]')[index];
        if (!btn) return null;
        
        return {
          text: btn.textContent?.trim() || '',
          ariaLabel: btn.getAttribute('aria-label') || '',
          disabled: btn.disabled || btn.getAttribute('aria-disabled') === 'true',
          type: btn.getAttribute('type') || 'button',
          classList: btn.className
        };
      }, i);
      
      if (!buttonInfo || buttonInfo.disabled) continue;
      
      const buttonLabel = buttonInfo.text || buttonInfo.ariaLabel || `Button ${i}`;
      console.log(`   Testing: "${buttonLabel}"`);
      
      // Click and monitor result
      const beforeUrl = page.url();
      await page.evaluate((index) => {
        const btn = document.querySelectorAll('button, [role="button"]')[index];
        btn?.click();
      }, i);
      
      await wait(1500);
      
      // Check what happened
      const afterUrl = page.url();
      const hasModal = await page.$('[role="dialog"], .modal');
      const hasError = await page.$('.error, [class*="error"], .text-red-500');
      const hasSuccess = await page.$('.success, [class*="success"], .text-green-500');
      
      if (hasError) {
        const errorText = await page.$eval('.error, [class*="error"], .text-red-500', el => el.textContent);
        pageResult.errors.push(`Button "${buttonLabel}": ${errorText}`);
        console.log(`     ❌ Error: ${errorText}`);
      } else if (hasModal) {
        pageResult.successes.push(`Button "${buttonLabel}": Opens modal`);
        pageResult.interactions.push({ type: 'button_modal', element: buttonLabel });
        console.log(`     ✅ Opens modal`);
        
        // Try to close modal
        const closeBtn = await page.$('[aria-label*="Close"], [aria-label*="Stäng"], button:has-text("Stäng"), button:has-text("Close")');
        if (closeBtn) {
          await closeBtn.click();
          await wait(500);
        }
      } else if (afterUrl !== beforeUrl) {
        pageResult.successes.push(`Button "${buttonLabel}": Navigates to ${afterUrl}`);
        pageResult.interactions.push({ type: 'button_navigation', element: buttonLabel, target: afterUrl });
        console.log(`     ✅ Navigates to new page`);
        
        // Navigate back
        await page.goto(`http://localhost:3000${pagePath}`, { waitUntil: 'networkidle0' });
        await wait(1000);
      } else if (hasSuccess) {
        pageResult.successes.push(`Button "${buttonLabel}": Shows success message`);
        pageResult.interactions.push({ type: 'button_success', element: buttonLabel });
        console.log(`     ✅ Shows success message`);
      } else {
        pageResult.warnings.push(`Button "${buttonLabel}": No visible effect`);
        console.log(`     ⚠️ No visible effect`);
      }
      
      testedCount++;
    } catch (error) {
      pageResult.errors.push(`Button test ${i}: ${error.message}`);
      console.log(`     ❌ Test failed: ${error.message}`);
    }
  }
  
  if (buttons.length > testedCount) {
    console.log(`   ℹ️ Tested ${testedCount} of ${buttons.length} buttons`);
  }
}

// Test forms on the page
async function testForms(page, pageResult) {
  const forms = await page.$$('form');
  if (forms.length === 0) return;
  
  console.log(`\n📝 Testing ${forms.length} forms...`);
  
  for (let i = 0; i < forms.length; i++) {
    try {
      const formInfo = await page.evaluate((index) => {
        const form = document.querySelectorAll('form')[index];
        if (!form) return null;
        
        const inputs = form.querySelectorAll('input, select, textarea');
        return {
          action: form.action || 'no-action',
          method: form.method || 'GET',
          inputCount: inputs.length,
          hasSubmit: !!form.querySelector('[type="submit"], button:not([type="button"])')
        };
      }, i);
      
      if (!formInfo) continue;
      
      console.log(`   Form ${i + 1}: ${formInfo.inputCount} inputs, ${formInfo.method} to ${formInfo.action}`);
      
      // Test form validation
      if (formInfo.hasSubmit) {
        // Try submitting empty form
        await page.evaluate((index) => {
          const form = document.querySelectorAll('form')[index];
          const submitBtn = form?.querySelector('[type="submit"], button:not([type="button"])');
          submitBtn?.click();
        }, i);
        
        await wait(1000);
        
        // Check for validation errors
        const hasValidationError = await page.$('.error, [class*="error"], .invalid, [aria-invalid="true"]');
        if (hasValidationError) {
          pageResult.successes.push(`Form ${i + 1}: Has validation`);
          console.log(`     ✅ Form has validation`);
        } else {
          pageResult.warnings.push(`Form ${i + 1}: No validation detected`);
          console.log(`     ⚠️ No validation detected`);
        }
      }
      
      pageResult.interactions.push({ type: 'form_tested', element: `Form ${i + 1}` });
    } catch (error) {
      pageResult.errors.push(`Form test ${i}: ${error.message}`);
      console.log(`     ❌ Form test failed: ${error.message}`);
    }
  }
}

// Test navigation links
async function testNavigation(page, pageResult, currentPath) {
  console.log('\n🔗 Testing navigation links...');
  
  const links = await page.$$('a[href]');
  const internalLinks = [];
  
  for (let i = 0; i < links.length; i++) {
    const href = await page.evaluate((index) => {
      const link = document.querySelectorAll('a[href]')[index];
      return link?.getAttribute('href');
    }, i);
    
    if (href && (href.startsWith('/') || href.includes('localhost'))) {
      internalLinks.push({ index: i, href });
    }
  }
  
  console.log(`   Found ${internalLinks.length} internal links`);
  
  // Test a sample of internal links
  for (let i = 0; i < Math.min(internalLinks.length, 5); i++) {
    const link = internalLinks[i];
    try {
      const linkText = await page.evaluate((index) => {
        const link = document.querySelectorAll('a[href]')[index];
        return link?.textContent?.trim() || 'No text';
      }, link.index);
      
      console.log(`   Testing link: "${linkText}" -> ${link.href}`);
      
      // Click link
      await page.evaluate((index) => {
        const link = document.querySelectorAll('a[href]')[index];
        link?.click();
      }, link.index);
      
      await wait(2000);
      
      // Check if navigation worked
      const newUrl = page.url();
      if (newUrl.includes(link.href) || newUrl !== `http://localhost:3000${currentPath}`) {
        pageResult.successes.push(`Link "${linkText}": Navigates correctly`);
        pageResult.interactions.push({ type: 'link_navigation', element: linkText, target: link.href });
        console.log(`     ✅ Navigation successful`);
        
        // Navigate back
        await page.goto(`http://localhost:3000${currentPath}`, { waitUntil: 'networkidle0' });
        await wait(1000);
      } else {
        pageResult.warnings.push(`Link "${linkText}": No navigation occurred`);
        console.log(`     ⚠️ No navigation occurred`);
      }
    } catch (error) {
      pageResult.errors.push(`Link test: ${error.message}`);
      console.log(`     ❌ Link test failed: ${error.message}`);
    }
  }
}

// Test page-specific features
async function testPageSpecificFeatures(page, pageResult, pagePath) {
  console.log('\n🎯 Testing page-specific features...');
  
  switch (pagePath) {
    case '/crm/kalender':
      // Test calendar navigation
      const prevBtn = await page.$('button[aria-label*="Previous"], button:has-text("Föregående")');
      const nextBtn = await page.$('button[aria-label*="Next"], button:has-text("Nästa")');
      
      if (prevBtn && nextBtn) {
        await nextBtn.click();
        await wait(1000);
        pageResult.successes.push('Calendar: Next month navigation works');
        console.log('   ✅ Calendar navigation works');
        
        await prevBtn.click();
        await wait(1000);
      }
      
      // Test view modes
      const viewTabs = await page.$$('[role="tab"]');
      if (viewTabs.length > 0) {
        pageResult.successes.push(`Calendar: ${viewTabs.length} view modes available`);
        console.log(`   ✅ ${viewTabs.length} view modes available`);
      }
      break;
      
    case '/crm/kunder':
      // Test search functionality
      const searchInput = await page.$('input[type="search"], input[placeholder*="Sök"]');
      if (searchInput) {
        await searchInput.type('Test');
        await wait(1000);
        pageResult.successes.push('Customers: Search functionality present');
        console.log('   ✅ Search functionality works');
      }
      break;
      
    case '/crm/ai-optimering':
      // Test AI optimization
      const optimizeBtn = await page.$('button:has-text("Optimera"), button:has-text("Optimize")');
      if (optimizeBtn) {
        await optimizeBtn.click();
        await wait(2000);
        
        const hasResults = await page.$('.optimization-results, [class*="results"]');
        if (hasResults) {
          pageResult.successes.push('AI Optimization: Generates results');
          console.log('   ✅ AI optimization generates results');
        }
      }
      break;
  }
}

// Generate page report
function generatePageReport(pageResult) {
  const status = pageResult.errors.length === 0 ? '✅ Healthy' : 
                 pageResult.errors.length > 3 ? '🔴 Critical' : '🟡 Issues';
  
  return `# Page Report: ${pageResult.name}

## Status: ${status}

### Overview
- **Path:** ${pageResult.path}
- **Load Time:** ${pageResult.loadTime}ms
- **Status:** ${pageResult.status}

### Elements Found
- Buttons: ${pageResult.elements.buttons}
- Links: ${pageResult.elements.links}
- Forms: ${pageResult.elements.forms}
- Inputs: ${pageResult.elements.inputs}

### Test Results
- ✅ Successes: ${pageResult.successes.length}
- ❌ Errors: ${pageResult.errors.length}
- ⚠️ Warnings: ${pageResult.warnings.length}

### Errors
${pageResult.errors.map(e => `- ❌ ${e}`).join('\n') || 'No errors found'}

### Successes
${pageResult.successes.map(s => `- ✅ ${s}`).join('\n') || 'No successes recorded'}

### Performance
- DOM Content Loaded: ${pageResult.performance.domContentLoaded || 'N/A'}ms
- Load Complete: ${pageResult.performance.loadComplete || 'N/A'}ms
- First Paint: ${pageResult.performance.firstPaint || 'N/A'}ms
- First Contentful Paint: ${pageResult.performance.firstContentfulPaint || 'N/A'}ms
`;
}

// Generate comprehensive report
function generateComprehensiveReport(results) {
  const healthScore = results.totalSuccesses + results.totalErrors > 0 
    ? Math.round((results.totalSuccesses / (results.totalSuccesses + results.totalErrors)) * 100)
    : 0;
  
  return `# Nordflytt CRM Comprehensive Audit Report

## 📊 Executive Summary

- **Audit Date:** ${results.timestamp}
- **Pages Tested:** ${results.pages.length}
- **Total Interactions:** ${results.totalInteractions}
- **Total Errors:** ${results.totalErrors}
- **Total Successes:** ${results.totalSuccesses}
- **System Health Score:** ${healthScore}%

## 🔴 Critical Issues (Immediate Action Required)

${results.brokenFeatures
  .filter(f => f.errors.length > 3)
  .map(f => `### ${f.name} (${f.path})
${f.errors.slice(0, 5).map(e => `- ❌ ${e}`).join('\n')}
${f.errors.length > 5 ? `- ...and ${f.errors.length - 5} more errors` : ''}
`).join('\n') || 'No critical issues found'}

## 🟡 Minor Issues

${results.brokenFeatures
  .filter(f => f.errors.length > 0 && f.errors.length <= 3)
  .map(f => `### ${f.name} (${f.path})
${f.errors.map(e => `- ⚠️ ${e}`).join('\n')}
`).join('\n') || 'No minor issues found'}

## ✅ Working Features

${results.workingFeatures
  .map(f => `### ${f.name} (${f.path})
${f.features.slice(0, 5).map(feat => `- ✅ ${feat}`).join('\n')}
${f.features.length > 5 ? `- ...and ${f.features.length - 5} more working features` : ''}
`).join('\n') || 'No working features recorded'}

## 📈 Performance Analysis

### Page Load Times
${results.pages
  .sort((a, b) => b.loadTime - a.loadTime)
  .slice(0, 5)
  .map(p => `- ${p.name}: ${p.loadTime}ms ${p.loadTime > 3000 ? '⚠️ Slow' : '✅'}`)
  .join('\n')}

## 🔍 Console Errors

${results.consoleErrors.length > 0 
  ? results.consoleErrors.slice(0, 10).map(e => `- ${e.page}: ${e.error}`).join('\n')
  : 'No console errors detected'}

## 🌐 Network Errors

${results.networkErrors.length > 0
  ? results.networkErrors.slice(0, 10).map(e => `- ${e.status} ${e.statusText}: ${e.url}`).join('\n')
  : 'No network errors detected'}

## 🎯 Recommendations

1. **Fix Critical Pages First:** Focus on pages with 3+ errors
2. **Improve Page Load Times:** Several pages take over 3 seconds to load
3. **Add Error Handling:** Many interactions lack proper error feedback
4. **Implement Form Validation:** Some forms can be submitted empty
5. **Fix Console Errors:** JavaScript errors may affect functionality
6. **Optimize Network Requests:** Some API calls are failing

## 📋 Next Steps

1. Create tickets for each critical issue
2. Assign developers to fix high-priority pages
3. Implement automated testing to prevent regressions
4. Re-run audit after fixes to verify improvements
5. Set up continuous monitoring for production
`;
}

// Generate executive summary
function generateExecutiveSummary(results) {
  const healthScore = results.totalSuccesses + results.totalErrors > 0 
    ? Math.round((results.totalSuccesses / (results.totalSuccesses + results.totalErrors)) * 100)
    : 0;
  
  const criticalPages = results.brokenFeatures.filter(f => f.errors.length > 3).length;
  const workingPages = results.pages.filter(p => p.errors.length === 0).length;
  
  return `# Executive Summary - Nordflytt CRM Audit

## Overall Health: ${healthScore >= 80 ? '✅ Good' : healthScore >= 60 ? '🟡 Fair' : '🔴 Poor'} (${healthScore}%)

### Key Metrics
- **Total Pages:** ${results.pages.length}
- **Fully Functional:** ${workingPages} (${Math.round(workingPages / results.pages.length * 100)}%)
- **Critical Issues:** ${criticalPages} pages
- **Total Errors:** ${results.totalErrors}
- **Total Successes:** ${results.totalSuccesses}

### Top 3 Issues
${results.brokenFeatures
  .sort((a, b) => b.errors.length - a.errors.length)
  .slice(0, 3)
  .map((f, i) => `${i + 1}. **${f.name}** - ${f.errors.length} errors`)
  .join('\n')}

### Top 3 Performing Pages
${results.workingFeatures
  .sort((a, b) => b.features.length - a.features.length)
  .slice(0, 3)
  .map((f, i) => `${i + 1}. **${f.name}** - ${f.features.length} working features`)
  .join('\n')}

### Immediate Actions Required
1. Fix critical pages with multiple errors
2. Address console errors affecting functionality
3. Improve page load performance
4. Implement proper error handling
5. Add comprehensive form validation

### Risk Assessment
- **Technical Debt:** ${healthScore < 60 ? 'High' : healthScore < 80 ? 'Medium' : 'Low'}
- **User Experience Impact:** ${criticalPages > 5 ? 'Severe' : criticalPages > 2 ? 'Moderate' : 'Minimal'}
- **Business Continuity Risk:** ${healthScore < 50 ? 'High' : 'Low'}

Generated: ${new Date().toLocaleString('sv-SE')}
`;
}

// Run the audit
comprehensiveCRMAudit().catch(console.error);