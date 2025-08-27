import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const quickCRMAudit = async () => {
  console.log('🚀 Starting Quick CRM Audit...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  const auditResults = {
    timestamp: new Date().toISOString(),
    pages: [],
    summary: {
      totalPages: 0,
      workingPages: 0,
      brokenPages: 0,
      criticalIssues: []
    }
  };

  try {
    const page = await browser.newPage();
    
    // Monitor console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push({
          url: page.url(),
          error: msg.text()
        });
      }
    });
    
    // All CRM pages
    const crmPages = [
      '/crm', '/crm/dashboard', '/crm/kunder', '/crm/leads', '/crm/uppdrag',
      '/crm/anstallda', '/crm/kalender', '/crm/arenden', '/crm/offentliga-upphandlingar',
      '/crm/juridik-risk', '/crm/lager', '/crm/kundmagasin', '/crm/leverantorer',
      '/crm/ai-optimering', '/crm/ai-kundtjanst', '/crm/ai-marknadsforing',
      '/crm/samarbeten', '/crm/ekonomi', '/crm/rapporter', '/crm/rekrytering',
      '/crm/installningar', '/crm/dokument'
    ];
    
    console.log(`📋 Quick testing ${crmPages.length} pages...\n`);
    
    for (const pagePath of crmPages) {
      console.log(`Testing ${pagePath}...`);
      
      const pageResult = {
        path: pagePath,
        status: 'pending',
        loadTime: 0,
        hasErrors: false,
        errorDetails: [],
        elementCounts: {}
      };
      
      try {
        // Clear console errors
        consoleErrors.length = 0;
        
        // Navigate to page
        const startTime = Date.now();
        const response = await page.goto(`http://localhost:3000${pagePath}`, {
          waitUntil: 'networkidle0',
          timeout: 15000
        });
        pageResult.loadTime = Date.now() - startTime;
        
        // Check if page loaded
        if (!response || !response.ok()) {
          pageResult.status = 'failed';
          pageResult.hasErrors = true;
          pageResult.errorDetails.push(`HTTP ${response?.status() || 'error'}`);
          console.log(`  ❌ Failed to load (${response?.status() || 'timeout'})`);
        } else {
          pageResult.status = 'loaded';
          console.log(`  ✅ Loaded in ${pageResult.loadTime}ms`);
          
          // Wait for content
          await wait(2000);
          
          // Take screenshot
          await page.screenshot({ 
            path: `audit/quick_${pagePath.replace(/\//g, '_')}.png`,
            fullPage: false 
          });
          
          // Count elements
          pageResult.elementCounts = await page.evaluate(() => {
            return {
              buttons: document.querySelectorAll('button').length,
              links: document.querySelectorAll('a').length,
              forms: document.querySelectorAll('form').length,
              inputs: document.querySelectorAll('input, select, textarea').length,
              errors: document.querySelectorAll('.error, [class*="error"]').length
            };
          });
          
          // Check for visible errors
          if (pageResult.elementCounts.errors > 0) {
            pageResult.hasErrors = true;
            pageResult.errorDetails.push(`${pageResult.elementCounts.errors} error elements visible`);
          }
          
          // Check console errors
          if (consoleErrors.length > 0) {
            pageResult.hasErrors = true;
            pageResult.errorDetails.push(...consoleErrors.map(e => `Console: ${e.error}`));
          }
          
          // Quick interaction test - try clicking first button
          if (pageResult.elementCounts.buttons > 0) {
            try {
              await page.evaluate(() => {
                const btn = document.querySelector('button:not([disabled])');
                if (btn) btn.click();
              });
              await wait(1000);
              
              // Check if modal opened
              const hasModal = await page.$('[role="dialog"], .modal');
              if (hasModal) {
                console.log(`  ✅ First button opens modal`);
                // Close modal
                await page.keyboard.press('Escape');
                await wait(500);
              }
            } catch (e) {
              // Ignore button test errors
            }
          }
        }
        
      } catch (error) {
        pageResult.status = 'error';
        pageResult.hasErrors = true;
        pageResult.errorDetails.push(error.message);
        console.log(`  ❌ Error: ${error.message}`);
      }
      
      // Update summary
      auditResults.summary.totalPages++;
      if (pageResult.hasErrors) {
        auditResults.summary.brokenPages++;
        if (pageResult.errorDetails.length > 2) {
          auditResults.summary.criticalIssues.push({
            page: pagePath,
            errors: pageResult.errorDetails
          });
        }
      } else {
        auditResults.summary.workingPages++;
      }
      
      auditResults.pages.push(pageResult);
    }
    
    // Generate quick report
    console.log('\n\n📊 AUDIT SUMMARY');
    console.log('================\n');
    console.log(`Total Pages: ${auditResults.summary.totalPages}`);
    console.log(`✅ Working: ${auditResults.summary.workingPages}`);
    console.log(`❌ Broken: ${auditResults.summary.brokenPages}`);
    console.log(`🔴 Critical Issues: ${auditResults.summary.criticalIssues.length}`);
    
    // Show critical issues
    if (auditResults.summary.criticalIssues.length > 0) {
      console.log('\n🔴 CRITICAL ISSUES:');
      for (const issue of auditResults.summary.criticalIssues) {
        console.log(`\n${issue.page}:`);
        issue.errors.forEach(e => console.log(`  - ${e}`));
      }
    }
    
    // Show all pages status
    console.log('\n📄 PAGE STATUS:');
    for (const page of auditResults.pages) {
      const status = page.hasErrors ? '❌' : '✅';
      console.log(`${status} ${page.path} - ${page.status} (${page.loadTime}ms)`);
      if (page.hasErrors && page.errorDetails.length > 0) {
        console.log(`   Issues: ${page.errorDetails.slice(0, 2).join(', ')}${page.errorDetails.length > 2 ? '...' : ''}`);
      }
    }
    
    // Generate markdown report
    const report = `# Quick CRM Audit Report

## Summary
- **Date:** ${auditResults.timestamp}
- **Total Pages:** ${auditResults.summary.totalPages}
- **Working Pages:** ${auditResults.summary.workingPages} (${Math.round(auditResults.summary.workingPages / auditResults.summary.totalPages * 100)}%)
- **Broken Pages:** ${auditResults.summary.brokenPages}
- **Critical Issues:** ${auditResults.summary.criticalIssues.length}

## Page Status

| Page | Status | Load Time | Issues |
|------|--------|-----------|---------|
${auditResults.pages.map(p => 
  `| ${p.path} | ${p.hasErrors ? '❌ Error' : '✅ OK'} | ${p.loadTime}ms | ${p.errorDetails.join(', ') || 'None'} |`
).join('\n')}

## Critical Issues

${auditResults.summary.criticalIssues.map(issue => 
  `### ${issue.page}\n${issue.errors.map(e => `- ${e}`).join('\n')}`
).join('\n\n') || 'No critical issues found'}

## Recommendations

1. Fix pages that fail to load completely
2. Address console errors on working pages
3. Improve load times for pages over 3 seconds
4. Add proper error handling for user interactions
5. Ensure all forms have validation

Generated: ${new Date().toLocaleString('sv-SE')}
`;
    
    await fs.writeFile('audit/QUICK-AUDIT-REPORT.md', report);
    console.log('\n✅ Report saved to audit/QUICK-AUDIT-REPORT.md');
    
  } catch (error) {
    console.error('Audit failed:', error);
  } finally {
    await browser.close();
  }
};

// Run the audit
quickCRMAudit().catch(console.error);