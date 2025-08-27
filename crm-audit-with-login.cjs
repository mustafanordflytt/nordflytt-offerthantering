const puppeteer = require('puppeteer');
const fs = require('fs').promises;

class CRMCompleteAuditWithLogin {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.results = {
      auditDate: new Date().toISOString(),
      loginSuccess: false,
      modules: {},
      businessLogic: {},
      errors: [],
      warnings: [],
      recommendations: []
    };
  }

  async runAudit() {
    console.log('🚀 Starting Nordflytt CRM Audit with Login...\n');
    
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1440, height: 900 }
    });

    try {
      const page = await browser.newPage();
      
      // Monitor console errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          this.results.errors.push({
            type: 'console',
            message: msg.text(),
            location: page.url()
          });
        }
      });

      // 1. Login first
      const loginSuccess = await this.login(page);
      this.results.loginSuccess = loginSuccess;
      
      if (!loginSuccess) {
        console.log('❌ Login failed, cannot continue audit');
        return;
      }
      
      console.log('✅ Login successful, proceeding with audit...\n');
      
      // 2. Test all CRM modules
      await this.testAllModules(page);
      
      // 3. Test key business workflows
      await this.testBusinessWorkflows(page);
      
      // 4. Generate recommendations
      this.generateRecommendations();
      
      // Save results
      await this.saveResults();
      
    } catch (error) {
      console.error('Audit failed:', error);
      this.results.errors.push({
        type: 'fatal',
        message: error.message
      });
    } finally {
      await browser.close();
    }
  }

  async login(page) {
    try {
      console.log('🔐 Logging in to CRM...');
      
      // Navigate to login page
      await page.goto(`${this.baseUrl}/crm/login`, {
        waitUntil: 'networkidle0'
      });
      
      // Fill login form
      await page.type('input[type="email"]', 'admin@nordflytt.se');
      await page.type('input[type="password"]', 'admin123');
      
      // Click login button
      await page.click('button[type="submit"]');
      
      // Wait for navigation
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      
      // Check if we're on dashboard
      const currentUrl = page.url();
      return currentUrl.includes('/crm/dashboard');
      
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  async testAllModules(page) {
    console.log('📋 Testing all CRM modules...\n');
    
    const modules = [
      { name: 'Dashboard', path: '/crm/dashboard', critical: true },
      { name: 'Kunder', path: '/crm/kunder', critical: true },
      { name: 'Leads', path: '/crm/leads', critical: true },
      { name: 'Uppdrag', path: '/crm/uppdrag', critical: true },
      { name: 'Offerter', path: '/crm/offerter', critical: true },
      { name: 'Ekonomi', path: '/crm/ekonomi', critical: true },
      { name: 'Anställda', path: '/crm/anstallda', critical: true },
      { name: 'Kalender', path: '/crm/kalender', critical: false },
      { name: 'Rapporter', path: '/crm/rapporter', critical: false }
    ];

    for (const module of modules) {
      console.log(`Testing ${module.name}...`);
      
      try {
        await page.goto(`${this.baseUrl}${module.path}`, {
          waitUntil: 'networkidle0',
          timeout: 10000
        });

        const moduleResult = {
          name: module.name,
          path: module.path,
          critical: module.critical,
          status: 'success',
          loadTime: 0,
          hasContent: false,
          elements: {},
          issues: []
        };

        const startTime = Date.now();
        
        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if page has real content (not just layout)
        const hasContent = await page.evaluate(() => {
          const main = document.querySelector('main');
          if (!main) return false;
          
          // Check for common content indicators
          const hasTable = !!document.querySelector('table');
          const hasCards = document.querySelectorAll('[class*="card"]').length > 0;
          const hasButtons = document.querySelectorAll('button').length > 5; // More than just nav buttons
          const hasData = document.body.innerText.length > 500;
          
          return hasTable || hasCards || hasButtons || hasData;
        });
        
        moduleResult.hasContent = hasContent;
        
        // Count interactive elements
        moduleResult.elements = await page.evaluate(() => {
          return {
            buttons: document.querySelectorAll('button').length,
            links: document.querySelectorAll('a').length,
            forms: document.querySelectorAll('form').length,
            inputs: document.querySelectorAll('input, textarea, select').length,
            tables: document.querySelectorAll('table').length,
            cards: document.querySelectorAll('[class*="card"]').length
          };
        });
        
        // Check for common issues
        if (!hasContent) {
          moduleResult.issues.push('No content displayed - might be empty or not implemented');
        }
        
        if (moduleResult.elements.buttons < 2) {
          moduleResult.issues.push('Very few interactive elements');
        }
        
        moduleResult.loadTime = Date.now() - startTime;
        
        // Take screenshot
        await page.screenshot({
          path: `./audit-${module.name.toLowerCase().replace(/\s+/g, '-')}.png`
        });

        this.results.modules[module.name] = moduleResult;
        console.log(`✅ ${module.name} - ${hasContent ? 'Has content' : 'No content'}\n`);
        
      } catch (error) {
        this.results.modules[module.name] = {
          name: module.name,
          path: module.path,
          critical: module.critical,
          status: 'error',
          error: error.message
        };
        console.log(`❌ ${module.name} - FAILED: ${error.message}\n`);
      }
    }
  }

  async testBusinessWorkflows(page) {
    console.log('\n💼 Testing business workflows...\n');
    
    const workflows = [
      {
        name: 'Create New Customer',
        test: async () => {
          await page.goto(`${this.baseUrl}/crm/kunder`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Look for add customer button
          const addButton = await page.$('button:has-text("Ny"), button:has-text("Lägg till"), button[class*="add"]');
          if (addButton) {
            await addButton.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Check if form appeared
            const form = await page.$('form, [role="dialog"], .modal');
            return !!form;
          }
          return false;
        }
      },
      {
        name: 'Create New Lead',
        test: async () => {
          await page.goto(`${this.baseUrl}/crm/leads`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const addButton = await page.$('button:has-text("Ny"), button:has-text("Lägg till"), button[class*="add"]');
          return !!addButton;
        }
      },
      {
        name: 'View Job Details',
        test: async () => {
          await page.goto(`${this.baseUrl}/crm/uppdrag`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Check if there's a list or table of jobs
          const jobList = await page.$('table, .job-list, [class*="uppdrag"]');
          return !!jobList;
        }
      }
    ];

    for (const workflow of workflows) {
      console.log(`Testing workflow: ${workflow.name}`);
      
      try {
        const result = await workflow.test();
        this.results.businessLogic[workflow.name] = {
          name: workflow.name,
          status: result ? 'working' : 'not-working'
        };
        console.log(`${result ? '✅' : '❌'} ${workflow.name}\n`);
      } catch (error) {
        this.results.businessLogic[workflow.name] = {
          name: workflow.name,
          status: 'error',
          error: error.message
        };
        console.log(`❌ ${workflow.name} - Error: ${error.message}\n`);
      }
    }
  }

  generateRecommendations() {
    const { modules, businessLogic } = this.results;
    
    // Count modules with/without content
    let modulesWithContent = 0;
    let modulesWithoutContent = 0;
    let criticalIssues = [];
    
    for (const [name, module] of Object.entries(modules)) {
      if (module.status === 'success') {
        if (module.hasContent) {
          modulesWithContent++;
        } else {
          modulesWithoutContent++;
          if (module.critical) {
            criticalIssues.push(`${name} has no content`);
          }
        }
      }
    }
    
    // Calculate health score
    const totalModules = Object.keys(modules).length;
    const contentScore = (modulesWithContent / totalModules) * 100;
    
    this.results.healthScore = Math.round(contentScore);
    
    // Generate recommendations
    if (modulesWithoutContent > totalModules / 2) {
      this.results.recommendations.push('🚨 CRITICAL: Most modules have no content. Need to implement module functionality.');
    }
    
    if (criticalIssues.length > 0) {
      this.results.recommendations.push('🔴 Critical modules without content:');
      criticalIssues.forEach(issue => {
        this.results.recommendations.push(`  - ${issue}`);
      });
    }
    
    // Check business logic
    const workingWorkflows = Object.values(businessLogic).filter(w => w.status === 'working').length;
    const totalWorkflows = Object.keys(businessLogic).length;
    
    if (workingWorkflows < totalWorkflows / 2) {
      this.results.recommendations.push('⚠️ Most business workflows are not working. Implement CRUD operations.');
    }
    
    // Specific recommendations
    this.results.recommendations.push('\n📋 Specific improvements needed:');
    this.results.recommendations.push('1. Add actual content to empty modules');
    this.results.recommendations.push('2. Implement CRUD operations (Create, Read, Update, Delete)');
    this.results.recommendations.push('3. Add real data or mock data for testing');
    this.results.recommendations.push('4. Implement search and filtering functionality');
    this.results.recommendations.push('5. Add form validation and error handling');
  }

  async saveResults() {
    // Create audit directory
    await fs.mkdir('./audit', { recursive: true });
    
    // Generate report
    const report = this.generateReport();
    
    // Save JSON results
    await fs.writeFile(
      './audit/crm-audit-results.json',
      JSON.stringify(this.results, null, 2)
    );
    
    // Save markdown report
    await fs.writeFile('./audit/CRM-AUDIT-REPORT.md', report);
    
    console.log('\n📊 Audit complete! Results saved to:');
    console.log('   - audit/crm-audit-results.json');
    console.log('   - audit/CRM-AUDIT-REPORT.md\n');
  }

  generateReport() {
    const { modules, businessLogic, healthScore, recommendations } = this.results;
    
    let report = `# Nordflytt CRM Audit Report
Generated: ${this.results.auditDate}

## 🏥 System Health Score: ${healthScore}%

## 📊 Module Analysis

| Module | Status | Has Content | Elements | Issues |
|--------|--------|-------------|----------|--------|
`;

    for (const [name, module] of Object.entries(modules)) {
      if (module.status === 'success') {
        const elements = module.elements;
        const elementSummary = `B:${elements.buttons} L:${elements.links} T:${elements.tables}`;
        
        report += `| ${name} | ✅ | ${module.hasContent ? '✅' : '❌'} | ${elementSummary} | ${module.issues.length} |\n`;
      } else {
        report += `| ${name} | ❌ | - | - | Error |\n`;
      }
    }

    report += `\n## 💼 Business Logic\n\n`;
    
    for (const [name, workflow] of Object.entries(businessLogic)) {
      const icon = workflow.status === 'working' ? '✅' : workflow.status === 'error' ? '❌' : '⚠️';
      report += `- ${icon} **${name}**: ${workflow.status}`;
      if (workflow.error) {
        report += ` - ${workflow.error}`;
      }
      report += '\n';
    }

    report += `\n## 💡 Recommendations\n\n`;
    recommendations.forEach(rec => {
      report += `${rec}\n`;
    });

    return report;
  }
}

// Run the audit
const audit = new CRMCompleteAuditWithLogin();
audit.runAudit().catch(console.error);