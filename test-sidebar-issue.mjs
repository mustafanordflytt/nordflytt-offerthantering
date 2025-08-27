import puppeteer from 'puppeteer';

async function testSidebarIssue() {
  console.log('🔍 Testar sidebar-problem när man navigerar till leads\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: { width: 1400, height: 900 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Logga in
    console.log('1. Loggar in...');
    await page.goto('http://localhost:3000/crm', { waitUntil: 'networkidle0' });
    await page.type('input[type="email"]', 'admin@nordflytt.se');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    // Kontrollera sidebar på dashboard
    console.log('\n2. Kontrollerar sidebar på dashboard...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const sidebarOnDashboard = await page.evaluate(() => {
      const sidebar = document.querySelector('nav, aside, [class*="sidebar"], [class*="Sidebar"]');
      const navLinks = document.querySelectorAll('a[href*="/crm/"]');
      return {
        exists: !!sidebar,
        visible: sidebar ? window.getComputedStyle(sidebar).display !== 'none' : false,
        width: sidebar ? sidebar.offsetWidth : 0,
        navLinksCount: navLinks.length,
        sidebarClasses: sidebar?.className || 'none',
        sidebarStyles: sidebar ? {
          display: window.getComputedStyle(sidebar).display,
          visibility: window.getComputedStyle(sidebar).visibility,
          position: window.getComputedStyle(sidebar).position,
          left: window.getComputedStyle(sidebar).left,
          transform: window.getComputedStyle(sidebar).transform
        } : null
      };
    });
    
    console.log('   Sidebar på dashboard:', sidebarOnDashboard);
    await page.screenshot({ path: 'test-sidebar-dashboard.png' });
    
    // Klicka på leads
    console.log('\n3. Navigerar till leads...');
    await page.click('a[href="/crm/leads"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Kontrollera sidebar på leads-sidan
    console.log('\n4. Kontrollerar sidebar på leads-sidan...');
    const sidebarOnLeads = await page.evaluate(() => {
      const sidebar = document.querySelector('nav, aside, [class*="sidebar"], [class*="Sidebar"]');
      const navLinks = document.querySelectorAll('a[href*="/crm/"]');
      
      // Kolla alla möjliga sidebar-element
      const possibleSidebars = document.querySelectorAll('nav, aside, [class*="sidebar"], [class*="Sidebar"], [class*="navigation"], [class*="menu"]');
      
      return {
        exists: !!sidebar,
        visible: sidebar ? window.getComputedStyle(sidebar).display !== 'none' : false,
        width: sidebar ? sidebar.offsetWidth : 0,
        navLinksCount: navLinks.length,
        sidebarClasses: sidebar?.className || 'none',
        allPossibleSidebars: Array.from(possibleSidebars).map(el => ({
          tag: el.tagName,
          classes: el.className,
          visible: window.getComputedStyle(el).display !== 'none',
          width: el.offsetWidth
        })),
        bodyClasses: document.body.className,
        mainContent: document.querySelector('main')?.className || 'no main element'
      };
    });
    
    console.log('   Sidebar på leads:', JSON.stringify(sidebarOnLeads, null, 2));
    await page.screenshot({ path: 'test-sidebar-leads.png' });
    
    // Kontrollera layout-strukturen
    console.log('\n5. Analyserar layout-struktur...');
    const layoutStructure = await page.evaluate(() => {
      const root = document.getElementById('__next') || document.querySelector('[data-reactroot]');
      const layout = root?.querySelector('[class*="layout"], [class*="Layout"]');
      
      function getElementInfo(el) {
        if (!el) return null;
        return {
          tag: el.tagName,
          classes: el.className,
          children: el.children.length,
          display: window.getComputedStyle(el).display,
          gridTemplate: window.getComputedStyle(el).gridTemplateColumns || 'none'
        };
      }
      
      return {
        root: getElementInfo(root),
        layout: getElementInfo(layout),
        directChildren: root ? Array.from(root.children).map(getElementInfo) : []
      };
    });
    
    console.log('   Layout struktur:', JSON.stringify(layoutStructure, null, 2));
    
    // Försök hitta och visa sidebar manuellt
    console.log('\n6. Försöker visa sidebar manuellt...');
    const sidebarFixed = await page.evaluate(() => {
      const sidebar = document.querySelector('nav, aside, [class*="sidebar"], [class*="Sidebar"]');
      if (sidebar) {
        sidebar.style.display = 'block';
        sidebar.style.visibility = 'visible';
        sidebar.style.position = 'relative';
        sidebar.style.transform = 'none';
        sidebar.style.left = '0';
        return true;
      }
      return false;
    });
    
    if (sidebarFixed) {
      console.log('   ✅ Sidebar visad manuellt');
      await new Promise(resolve => setTimeout(resolve, 1000));
      await page.screenshot({ path: 'test-sidebar-fixed.png' });
    } else {
      console.log('   ❌ Kunde inte hitta sidebar att visa');
    }
    
    // Sammanfattning
    console.log('\n📊 Sammanfattning:');
    console.log(`   Sidebar finns på dashboard: ${sidebarOnDashboard.exists}`);
    console.log(`   Sidebar synlig på dashboard: ${sidebarOnDashboard.visible}`);
    console.log(`   Sidebar finns på leads: ${sidebarOnLeads.exists}`);
    console.log(`   Sidebar synlig på leads: ${sidebarOnLeads.visible}`);
    
    if (!sidebarOnLeads.visible && sidebarOnLeads.exists) {
      console.log('\n⚠️  Sidebar finns men är gömd på leads-sidan!');
    } else if (!sidebarOnLeads.exists) {
      console.log('\n❌ Sidebar saknas helt på leads-sidan!');
    }
    
  } catch (error) {
    console.error('❌ Test misslyckades:', error.message);
  }
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  await browser.close();
}

testSidebarIssue().catch(console.error);