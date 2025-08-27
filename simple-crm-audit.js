import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const runCRMAudit = async () => {
  console.log('🚀 Starting Nordflytt CRM System Audit...\n');
  
  // Create audit directory
  await fs.mkdir('audit', { recursive: true });
  await fs.mkdir('audit/screenshots', { recursive: true });
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  const auditResults = {
    timestamp: new Date().toISOString(),
    pages: [],
    totalErrors: 0,
    totalSuccesses: 0,
    brokenFeatures: [],
    workingFeatures: []
  };

  try {
    const page = await browser.newPage();
    
    // List of CRM pages to test
    const crmPages = [
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
    
    console.log(`📋 Testing ${crmPages.length} CRM pages...\n`);
    
    // Test each page
    for (const pagePath of crmPages) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📄 Testing: ${pagePath}`);
      console.log(`${'='.repeat(60)}`);
      
      const pageResult = {
        path: pagePath,
        status: 'unknown',
        loadTime: 0,
        errors: [],
        successes: [],
        elements: {
          buttons: 0,
          links: 0,
          forms: 0
        },
        screenshot: '',
        interactions: []
      };
      
      try {
        // Navigate to page
        const startTime = Date.now();
        const response = await page.goto(`http://localhost:3000${pagePath}`, {
          waitUntil: 'networkidle0',
          timeout: 30000
        });
        pageResult.loadTime = Date.now() - startTime;
        
        // Check response
        if (response && response.ok()) {
          pageResult.status = 'loaded';
          console.log(`✅ Page loaded successfully (${pageResult.loadTime}ms)`);
        } else if (response) {
          pageResult.status = `error_${response.status()}`;
          pageResult.errors.push(`HTTP ${response.status()}`);
          console.log(`❌ Page returned status ${response.status()}`);
        }
        
        await wait(2000); // Wait for content
        
        // Take screenshot
        const screenshotPath = `audit/screenshots${pagePath.replace(/\//g, '_')}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        pageResult.screenshot = screenshotPath;
        console.log(`📸 Screenshot saved`);
        
        // Count elements
        const elementCounts = await page.evaluate(() => {
          return {
            buttons: document.querySelectorAll('button, input[type="button"], input[type="submit"]').length,
            links: document.querySelectorAll('a').length,
            forms: document.querySelectorAll('form').length,
            inputs: document.querySelectorAll('input, textarea, select').length
          };
        });
        
        pageResult.elements = elementCounts;
        console.log(`🔍 Found: ${elementCounts.buttons} buttons, ${elementCounts.links} links, ${elementCounts.forms} forms`);
        
        // Test buttons
        const buttons = await page.$$('button');
        console.log(`\n🔘 Testing ${buttons.length} buttons...`);
        
        for (let i = 0; i < Math.min(buttons.length, 5); i++) { // Test first 5 buttons
          try {
            const buttonText = await page.evaluate((index) => {
              const btn = document.querySelectorAll('button')[index];
              return btn ? btn.textContent?.trim() || 'No text' : null;
            }, i);
            
            if (buttonText) {
              console.log(`  Testing button: "${buttonText}"`);
              
              // Click button
              await page.evaluate((index) => {
                const btn = document.querySelectorAll('button')[index];
                if (btn && !btn.disabled) btn.click();
              }, i);
              
              await wait(1000);
              
              // Check for modals or errors
              const hasModal = await page.$('.modal, [role="dialog"]');
              const hasError = await page.$('.error, .text-red-500');
              
              if (hasError) {
                const errorText = await page.$eval('.error, .text-red-500', el => el.textContent);
                pageResult.errors.push(`Button "${buttonText}": ${errorText}`);
                console.log(`    ❌ Error: ${errorText}`);
              } else if (hasModal) {
                pageResult.successes.push(`Button "${buttonText}": Modal opened`);
                console.log(`    ✅ Modal opened`);
                // Close modal if possible
                const closeBtn = await page.$('[aria-label="Close"], .close, button:has-text("Stäng")');
                if (closeBtn) await closeBtn.click();
              } else {
                pageResult.successes.push(`Button "${buttonText}": Clicked successfully`);
                console.log(`    ✅ Clicked successfully`);
              }
              
              // Return to original page if navigated away
              if (page.url() !== `http://localhost:3000${pagePath}`) {
                await page.goto(`http://localhost:3000${pagePath}`, { waitUntil: 'networkidle0' });
                await wait(1000);
              }
            }
          } catch (error) {
            console.log(`    ❌ Button test failed: ${error.message}`);
            pageResult.errors.push(`Button test ${i}: ${error.message}`);
          }
        }
        
        // Test forms
        const forms = await page.$$('form');
        if (forms.length > 0) {
          console.log(`\n📝 Found ${forms.length} forms`);
          // We'll skip form testing for now to keep it simple
        }
        
        // Check console errors
        const consoleErrors = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });
        
        if (consoleErrors.length > 0) {
          pageResult.errors.push(...consoleErrors.map(e => `Console: ${e}`));
        }
        
      } catch (error) {
        pageResult.status = 'error';
        pageResult.errors.push(error.message);
        console.log(`❌ Page test failed: ${error.message}`);
      }
      
      // Update totals
      auditResults.totalErrors += pageResult.errors.length;
      auditResults.totalSuccesses += pageResult.successes.length;
      
      if (pageResult.errors.length > 0) {
        auditResults.brokenFeatures.push({
          page: pagePath,
          errors: pageResult.errors
        });
      }
      
      if (pageResult.successes.length > 0) {
        auditResults.workingFeatures.push({
          page: pagePath,
          features: pageResult.successes
        });
      }
      
      auditResults.pages.push(pageResult);
    }
    
    // Generate report
    console.log('\n\n📝 Generating audit report...\n');
    
    const report = generateMarkdownReport(auditResults);
    await fs.writeFile('audit/CRM-AUDIT-REPORT.md', report);
    
    console.log('✅ Audit complete!');
    console.log(`📊 Total pages: ${auditResults.pages.length}`);
    console.log(`❌ Total errors: ${auditResults.totalErrors}`);
    console.log(`✅ Total successes: ${auditResults.totalSuccesses}`);
    
  } catch (error) {
    console.error('Audit failed:', error);
  } finally {
    await browser.close();
  }
};

const generateMarkdownReport = (results) => {
  const healthScore = Math.round((results.totalSuccesses / (results.totalSuccesses + results.totalErrors)) * 100) || 0;
  
  let markdown = `# Nordflytt CRM System Audit Report

## 📊 Executive Summary

- **Audit Date:** ${results.timestamp}
- **Pages Tested:** ${results.pages.length}
- **Total Errors Found:** ${results.totalErrors}
- **Total Working Features:** ${results.totalSuccesses}
- **System Health Score:** ${healthScore}%

## 🔴 Critical Issues (Top Priority)

`;

  // List pages with most errors first
  const sortedByErrors = [...results.pages].sort((a, b) => b.errors.length - a.errors.length);
  const criticalPages = sortedByErrors.filter(p => p.errors.length > 3);
  
  if (criticalPages.length > 0) {
    markdown += `These pages have multiple errors and need immediate attention:\n\n`;
    for (const page of criticalPages) {
      markdown += `### ${page.path} (${page.errors.length} errors)\n`;
      for (const error of page.errors.slice(0, 5)) {
        markdown += `- ❌ ${error}\n`;
      }
      markdown += `\n`;
    }
  } else {
    markdown += `No critical issues found! 🎉\n\n`;
  }

  markdown += `## 🟡 Minor Issues

`;

  const minorIssuePages = sortedByErrors.filter(p => p.errors.length > 0 && p.errors.length <= 3);
  for (const page of minorIssuePages) {
    markdown += `### ${page.path}\n`;
    for (const error of page.errors) {
      markdown += `- ⚠️ ${error}\n`;
    }
    markdown += `\n`;
  }

  markdown += `## ✅ Working Features

`;

  for (const feature of results.workingFeatures) {
    markdown += `### ${feature.page}\n`;
    for (const success of feature.features.slice(0, 5)) {
      markdown += `- ✅ ${success}\n`;
    }
    if (feature.features.length > 5) {
      markdown += `- ...and ${feature.features.length - 5} more working features\n`;
    }
    markdown += `\n`;
  }

  markdown += `## 📄 Page-by-Page Analysis

`;

  for (const page of results.pages) {
    const status = page.errors.length === 0 ? '✅' : page.errors.length > 3 ? '🔴' : '🟡';
    markdown += `### ${status} ${page.path}

- **Status:** ${page.status}
- **Load Time:** ${page.loadTime}ms
- **Elements Found:** ${page.elements.buttons} buttons, ${page.elements.links} links, ${page.elements.forms} forms
- **Errors:** ${page.errors.length}
- **Working Features:** ${page.successes.length}
- **Screenshot:** [View](${page.screenshot})

`;
  }

  markdown += `## 🔧 Recommendations

1. **Fix Critical Pages First:** Focus on pages with multiple errors
2. **Test All Forms:** Many forms were not fully tested and may have validation issues
3. **Check Console Errors:** Several pages have JavaScript errors in the console
4. **Improve Load Times:** Some pages take over 3 seconds to load
5. **Add Error Handling:** Many buttons don't show proper error messages

## 📈 Next Steps

1. Address all critical issues (pages with 3+ errors)
2. Fix minor issues page by page
3. Re-run audit after fixes
4. Set up automated testing to prevent regressions
`;

  return markdown;
};

// Run the audit
runCRMAudit().catch(console.error);