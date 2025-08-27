import puppeteer from 'puppeteer';

async function testLayoutStructure() {
  console.log('🔍 Testar layout-struktur för CRM\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: { width: 1400, height: 900 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Logga in
    await page.goto('http://localhost:3000/crm', { waitUntil: 'networkidle0' });
    await page.type('input[type="email"]', 'admin@nordflytt.se');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    // Analysera DOM-struktur på dashboard
    console.log('1. Analyserar dashboard layout...');
    const dashboardStructure = await page.evaluate(() => {
      const body = document.body;
      const rootDiv = body.querySelector(':scope > div');
      const sidebar = document.querySelector('.w-64.bg-white.border-r');
      const mainContent = document.querySelector('.flex-1.flex.flex-col');
      
      return {
        bodyClasses: body.className,
        rootElement: rootDiv ? {
          tag: rootDiv.tagName,
          classes: rootDiv.className,
          childCount: rootDiv.children.length
        } : null,
        sidebar: sidebar ? {
          exists: true,
          classes: sidebar.className,
          visible: window.getComputedStyle(sidebar).display !== 'none',
          parent: sidebar.parentElement?.className
        } : null,
        mainContent: mainContent ? {
          exists: true,
          classes: mainContent.className
        } : null,
        fullHTML: document.documentElement.outerHTML.substring(0, 500) + '...'
      };
    });
    
    console.log('Dashboard struktur:', JSON.stringify(dashboardStructure, null, 2));
    
    // Navigera till leads
    await page.click('a[href="/crm/leads"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Analysera DOM-struktur på leads
    console.log('\n2. Analyserar leads layout...');
    const leadsStructure = await page.evaluate(() => {
      const body = document.body;
      const rootDiv = body.querySelector(':scope > div');
      const sidebar = document.querySelector('.w-64.bg-white.border-r');
      const mainContent = document.querySelector('.flex-1.flex.flex-col');
      
      // Kolla om leads-innehållet renderas direkt i body
      const directLeadsContent = document.querySelector('.container') || 
                                document.querySelector('[class*="Pipeline"]') ||
                                document.querySelector('main > div');
      
      return {
        bodyClasses: body.className,
        bodyChildCount: body.children.length,
        rootElement: rootDiv ? {
          tag: rootDiv.tagName,
          classes: rootDiv.className,
          childCount: rootDiv.children.length
        } : null,
        sidebar: sidebar ? {
          exists: true,
          classes: sidebar.className,
          visible: window.getComputedStyle(sidebar).display !== 'none',
          parent: sidebar.parentElement?.className
        } : null,
        mainContent: mainContent ? {
          exists: true,
          classes: mainContent.className
        } : null,
        directContent: directLeadsContent ? {
          exists: true,
          classes: directLeadsContent.className,
          parent: directLeadsContent.parentElement?.tagName
        } : null,
        fullHTML: document.documentElement.outerHTML.substring(0, 500) + '...'
      };
    });
    
    console.log('Leads struktur:', JSON.stringify(leadsStructure, null, 2));
    
    // Försök fixa layouten
    console.log('\n3. Analyserar problemet...');
    
    if (!leadsStructure.sidebar && leadsStructure.directContent) {
      console.log('❌ Problem identifierat: Leads-sidan renderas utanför CRM-layouten!');
      console.log('   Leads-innehållet finns direkt i body istället för i layouten.');
    } else if (leadsStructure.sidebar && !leadsStructure.sidebar.visible) {
      console.log('⚠️  Sidebar finns men är gömd');
    } else if (leadsStructure.sidebar && leadsStructure.sidebar.visible) {
      console.log('✅ Sidebar finns och är synlig');
    }
    
    // Kolla React-rendering
    const reactInfo = await page.evaluate(() => {
      const reactRoot = document.getElementById('__next') || 
                       document.querySelector('[data-reactroot]') ||
                       document.querySelector('#root');
      
      return {
        hasReactRoot: !!reactRoot,
        reactRootId: reactRoot?.id,
        reactRootClasses: reactRoot?.className,
        isNextJS: !!document.getElementById('__next')
      };
    });
    
    console.log('\n4. React/Next.js info:', reactInfo);
    
    // Ta screenshots för jämförelse
    await page.goto('http://localhost:3000/crm/dashboard');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'test-layout-dashboard.png' });
    
    await page.goto('http://localhost:3000/crm/leads');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'test-layout-leads.png' });
    
  } catch (error) {
    console.error('❌ Test misslyckades:', error.message);
  }
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  await browser.close();
}

testLayoutStructure().catch(console.error);