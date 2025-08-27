import puppeteer from 'puppeteer';
import fs from 'fs/promises';

async function mapCRMModules() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1440, height: 900 }
  });

  const moduleAnalysis = {
    timestamp: new Date().toISOString(),
    modules: [],
    workflows: [],
    dataModels: [],
    integrationPoints: [],
    businessLogicGaps: []
  };

  try {
    const page = await browser.newPage();
    
    // Navigate to CRM
    await page.goto('http://localhost:3000/crm/dashboard', { 
      waitUntil: 'networkidle0'
    });

    console.log('🔍 Analyzing CRM Module Structure...\n');

    // Get all navigation links
    const navLinks = await page.$$eval('nav a[href*="/crm/"]', links => 
      links.map(link => ({
        text: link.textContent?.trim() || '',
        href: link.getAttribute('href') || '',
        icon: link.querySelector('svg')?.getAttribute('class') || ''
      }))
    );

    console.log(`Found ${navLinks.length} CRM modules\n`);

    // Analyze each module
    for (const link of navLinks) {
      if (link.href === '/crm/dashboard') continue; // Skip dashboard for now
      
      console.log(`📊 Analyzing: ${link.text}`);
      
      try {
        await page.goto(`http://localhost:3000${link.href}`, { 
          waitUntil: 'networkidle0',
          timeout: 15000 
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Capture module data
        const moduleData = await page.evaluate(() => {
          const data = {
            title: document.querySelector('h1')?.textContent || '',
            description: document.querySelector('p.text-muted-foreground')?.textContent || '',
            hasTable: !!document.querySelector('table'),
            hasForm: !!document.querySelector('form'),
            hasCards: document.querySelectorAll('.card, [class*="Card"]').length,
            buttons: Array.from(document.querySelectorAll('button')).map(btn => btn.textContent?.trim() || ''),
            inputs: Array.from(document.querySelectorAll('input')).map(input => ({
              type: input.type,
              placeholder: input.placeholder,
              name: input.name
            })),
            dataPoints: [],
            workflows: []
          };

          // Analyze data structure
          const tables = document.querySelectorAll('table');
          tables.forEach(table => {
            const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent?.trim() || '');
            if (headers.length > 0) {
              data.dataPoints.push({
                type: 'table',
                columns: headers
              });
            }
          });

          // Identify workflows
          const actionButtons = document.querySelectorAll('button[class*="primary"], button:has(svg)');
          actionButtons.forEach(btn => {
            const text = btn.textContent?.trim() || '';
            if (text.includes('Skapa') || text.includes('Lägg till') || text.includes('Ny')) {
              data.workflows.push({
                type: 'create',
                action: text
              });
            }
          });

          return data;
        });

        // Take screenshot
        await page.screenshot({ 
          path: `ai-analysis/screenshots/module-${link.href.replace(/\//g, '-')}.png`,
          fullPage: true 
        });

        moduleAnalysis.modules.push({
          name: link.text,
          href: link.href,
          ...moduleData,
          screenshot: `module-${link.href.replace(/\//g, '-')}.png`
        });

        console.log(`   ✅ ${moduleData.title || link.text} analyzed`);

      } catch (error) {
        console.log(`   ⚠️  Error analyzing ${link.text}: ${error.message}`);
        moduleAnalysis.businessLogicGaps.push({
          module: link.text,
          issue: 'Module load error',
          details: error.message
        });
      }
    }

    // Analyze Dashboard separately
    console.log('\n📊 Analyzing Dashboard...');
    await page.goto('http://localhost:3000/crm/dashboard', { 
      waitUntil: 'networkidle0'
    });

    const dashboardData = await page.evaluate(() => {
      const widgets = document.querySelectorAll('[class*="card"], [class*="Card"]');
      const charts = document.querySelectorAll('canvas, svg[class*="chart"]');
      const stats = Array.from(document.querySelectorAll('[class*="stat"], [class*="metric"]')).map(el => el.textContent);
      
      return {
        widgetCount: widgets.length,
        chartCount: charts.length,
        statistics: stats,
        hasRealTimeData: !!document.querySelector('[class*="live"], [class*="real-time"]')
      };
    });

    await page.screenshot({ 
      path: 'ai-analysis/screenshots/dashboard-overview.png',
      fullPage: true 
    });

    // Analyze workflow connections
    console.log('\n🔄 Analyzing Workflow Connections...');
    
    // Check for cross-module references
    for (const module of moduleAnalysis.modules) {
      const crossReferences = module.buttons.filter(btn => 
        btn.includes('kund') || btn.includes('offert') || btn.includes('uppdrag')
      );
      
      if (crossReferences.length > 0) {
        moduleAnalysis.workflows.push({
          module: module.name,
          connections: crossReferences,
          type: 'cross-module'
        });
      }
    }

    // Save analysis results
    await fs.mkdir('ai-analysis', { recursive: true });
    await fs.mkdir('ai-analysis/screenshots', { recursive: true });
    await fs.writeFile(
      'ai-analysis/crm-current-state.json',
      JSON.stringify(moduleAnalysis, null, 2)
    );

    console.log('\n✅ CRM Module Analysis Complete!');
    console.log(`   - ${moduleAnalysis.modules.length} modules analyzed`);
    console.log(`   - ${moduleAnalysis.businessLogicGaps.length} gaps identified`);
    console.log(`   - ${moduleAnalysis.workflows.length} workflows mapped`);

    return moduleAnalysis;

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await browser.close();
  }
}

// Run analysis
mapCRMModules().catch(console.error);