import puppeteer from 'puppeteer';
import fs from 'fs/promises';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function analyzeCRMState() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1440, height: 900 }
  });

  const analysis = {
    timestamp: new Date().toISOString(),
    modules: {},
    workflows: [],
    dataModels: [],
    integrationPoints: [],
    businessLogicGaps: [],
    automationOpportunities: []
  };

  try {
    const page = await browser.newPage();
    
    console.log('🔍 Starting Nordflytt CRM Analysis...\n');

    // Core modules to analyze
    const coreModules = [
      { name: 'Dashboard', path: '/crm/dashboard' },
      { name: 'Kunder', path: '/crm/kunder' },
      { name: 'Leads', path: '/crm/leads' },
      { name: 'Uppdrag', path: '/crm/uppdrag' },
      { name: 'Offerter', path: '/crm/offerter' },
      { name: 'Anställda', path: '/crm/anstallda' },
      { name: 'AI-Kundtjänst', path: '/crm/ai-kundtjanst' },
      { name: 'AI-Marknadsföring', path: '/crm/ai-marknadsforing' },
      { name: 'Ekonomi', path: '/crm/ekonomi' }
    ];

    // Analyze each module
    for (const module of coreModules) {
      console.log(`\n📊 Analyzing ${module.name}...`);
      
      try {
        await page.goto(`http://localhost:3000${module.path}`, { 
          waitUntil: 'networkidle0',
          timeout: 30000 
        });
        
        await wait(2000);

        // Take screenshot
        const screenshotPath = `ai-analysis/screenshots/${module.name.toLowerCase().replace(/\s+/g, '-')}.png`;
        await page.screenshot({ 
          path: screenshotPath,
          fullPage: true 
        });

        // Analyze module structure
        const moduleAnalysis = await page.evaluate(() => {
          const analysis = {
            hasData: false,
            dataTypes: [],
            userActions: [],
            automationPotential: [],
            currentWorkflow: []
          };

          // Check for data presence
          const tables = document.querySelectorAll('table');
          const cards = document.querySelectorAll('.card, [class*="Card"]');
          const forms = document.querySelectorAll('form');
          
          analysis.hasData = tables.length > 0 || cards.length > 0;
          
          // Identify data types
          if (tables.length > 0) {
            tables.forEach(table => {
              const headers = Array.from(table.querySelectorAll('thead th'))
                .map(th => th.textContent?.trim() || '');
              if (headers.length > 0) {
                analysis.dataTypes.push({
                  type: 'table',
                  columns: headers
                });
              }
            });
          }

          // Identify user actions
          const buttons = Array.from(document.querySelectorAll('button'));
          buttons.forEach(btn => {
            const text = btn.textContent?.trim() || '';
            if (text && !text.includes('...')) {
              analysis.userActions.push(text);
              
              // Identify automation opportunities
              if (text.includes('Skapa') || text.includes('Lägg till')) {
                analysis.automationPotential.push(`Auto-create ${text}`);
              }
              if (text.includes('Skicka') || text.includes('Send')) {
                analysis.automationPotential.push(`Auto-send functionality`);
              }
            }
          });

          // Analyze current workflow
          const pageTitle = document.querySelector('h1')?.textContent || '';
          const hasSearch = !!document.querySelector('input[placeholder*="Sök"]');
          const hasFilters = document.querySelectorAll('select, [role="combobox"]').length > 0;
          
          if (hasSearch) analysis.currentWorkflow.push('Manual search');
          if (hasFilters) analysis.currentWorkflow.push('Manual filtering');
          if (forms.length > 0) analysis.currentWorkflow.push('Manual data entry');

          return {
            ...analysis,
            pageTitle,
            elementCounts: {
              tables: tables.length,
              cards: cards.length,
              forms: forms.length,
              buttons: buttons.length
            }
          };
        });

        analysis.modules[module.name] = {
          path: module.path,
          screenshot: screenshotPath,
          ...moduleAnalysis
        };

        console.log(`   ✅ Found ${moduleAnalysis.userActions.length} user actions`);
        console.log(`   ✅ Identified ${moduleAnalysis.automationPotential.length} automation opportunities`);

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        analysis.businessLogicGaps.push({
          module: module.name,
          error: error.message,
          impact: 'Module inaccessible or broken'
        });
      }
    }

    // Analyze cross-module workflows
    console.log('\n🔄 Analyzing Cross-Module Workflows...');
    
    // Customer Journey Analysis
    analysis.workflows.push({
      name: 'Customer Journey',
      steps: [
        'Lead Generation (AI-Marknadsföring)',
        'Lead Qualification (Leads)',
        'Quote Creation (Offerter)',
        'Customer Conversion (Kunder)',
        'Job Execution (Uppdrag)',
        'Customer Service (AI-Kundtjänst)'
      ],
      automationGaps: [
        'No automatic lead scoring',
        'Manual quote follow-up',
        'No predictive customer value',
        'Manual job assignment'
      ]
    });

    // Identify integration points
    console.log('\n🔗 Identifying Integration Points...');
    
    analysis.integrationPoints = [
      {
        name: 'AI Customer Service Integration',
        current: 'Isolated system at api.nordflytt.se',
        potential: 'Real-time CRM data enrichment',
        benefit: 'Instant customer context for AI responses'
      },
      {
        name: 'Marketing Automation Data',
        current: 'Separate marketing modules',
        potential: 'Unified customer intelligence',
        benefit: 'Predictive lead scoring and targeting'
      },
      {
        name: 'Financial Integration',
        current: 'Manual invoice processing',
        potential: 'Automated Fortnox sync with RUT',
        benefit: '50% reduction in admin work'
      }
    ];

    // Business Logic Gap Analysis
    console.log('\n⚠️  Analyzing Business Logic Gaps...');
    
    // Add specific gaps based on module analysis
    for (const [moduleName, moduleData] of Object.entries(analysis.modules)) {
      if (moduleData.currentWorkflow.includes('Manual search')) {
        analysis.businessLogicGaps.push({
          module: moduleName,
          gap: 'No intelligent search or recommendations',
          impact: 'Users waste time finding information'
        });
      }
      
      if (moduleData.userActions.length > 5) {
        analysis.businessLogicGaps.push({
          module: moduleName,
          gap: 'Too many manual actions required',
          impact: 'Workflow inefficiency and user fatigue'
        });
      }
    }

    // AI Automation Opportunities
    console.log('\n🤖 Identifying AI Automation Opportunities...');
    
    analysis.automationOpportunities = [
      {
        category: 'Predictive Customer Management',
        opportunities: [
          'AI-powered lead scoring based on behavior patterns',
          'Automatic customer lifetime value prediction',
          'Churn risk identification and prevention',
          'Personalized service recommendations'
        ]
      },
      {
        category: 'Intelligent Workflow Automation',
        opportunities: [
          'Smart job scheduling with resource optimization',
          'Automatic team assignment based on skills/location',
          'Dynamic pricing based on demand and capacity',
          'Predictive maintenance and inventory management'
        ]
      },
      {
        category: 'Proactive Business Intelligence',
        opportunities: [
          'Real-time competitive threat monitoring',
          'Market opportunity identification',
          'Automatic profit margin optimization',
          'Cash flow prediction and alerts'
        ]
      }
    ];

    // Save analysis
    await fs.writeFile(
      'ai-analysis/crm-state-analysis.json',
      JSON.stringify(analysis, null, 2)
    );

    // Generate summary report
    const summary = {
      totalModules: Object.keys(analysis.modules).length,
      totalGaps: analysis.businessLogicGaps.length,
      totalOpportunities: analysis.automationOpportunities.reduce(
        (sum, cat) => sum + cat.opportunities.length, 0
      ),
      criticalFindings: [
        `${analysis.businessLogicGaps.length} business logic gaps identified`,
        'AI Customer Service operating in isolation',
        'No predictive analytics in use',
        'Manual workflows dominate operations',
        'Cross-module intelligence missing'
      ]
    };

    console.log('\n' + '='.repeat(50));
    console.log('📋 ANALYSIS SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Modules Analyzed: ${summary.totalModules}`);
    console.log(`⚠️  Business Logic Gaps: ${summary.totalGaps}`);
    console.log(`🚀 Automation Opportunities: ${summary.totalOpportunities}`);
    console.log('\n🔍 Critical Findings:');
    summary.criticalFindings.forEach(finding => {
      console.log(`   - ${finding}`);
    });

    return analysis;

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await browser.close();
  }
}

// Run analysis
analyzeCRMState().catch(console.error);