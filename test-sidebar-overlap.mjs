import puppeteer from 'puppeteer';

async function testSidebarOverlap() {
  console.log('🔍 Testar sidebar overlap problem\n');
  
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
    
    // Gå till leads
    await page.click('a[href="/crm/leads"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Analysera layout
    const layoutAnalysis = await page.evaluate(() => {
      const sidebar = document.querySelector('.w-64.bg-white.border-r');
      const mainContent = document.querySelector('.flex-1.flex.flex-col');
      const leadsContent = document.querySelector('.p-6.space-y-6');
      const layoutWrapper = document.querySelector('.min-h-screen.flex');
      
      // Hämta bounding boxes
      const sidebarRect = sidebar?.getBoundingClientRect();
      const mainRect = mainContent?.getBoundingClientRect();
      const leadsRect = leadsContent?.getBoundingClientRect();
      
      return {
        sidebar: {
          exists: !!sidebar,
          width: sidebarRect?.width || 0,
          left: sidebarRect?.left || 0,
          right: sidebarRect?.right || 0,
          classes: sidebar?.className
        },
        mainContent: {
          exists: !!mainContent,
          left: mainRect?.left || 0,
          width: mainRect?.width || 0,
          classes: mainContent?.className
        },
        leadsContent: {
          exists: !!leadsContent,
          left: leadsRect?.left || 0,
          classes: leadsContent?.className
        },
        overlap: sidebarRect && leadsRect ? 
          (leadsRect.left < sidebarRect.right) : false,
        layoutWrapper: {
          display: layoutWrapper ? window.getComputedStyle(layoutWrapper).display : 'none',
          flexDirection: layoutWrapper ? window.getComputedStyle(layoutWrapper).flexDirection : 'none'
        }
      };
    });
    
    console.log('Layout analys:', JSON.stringify(layoutAnalysis, null, 2));
    
    if (layoutAnalysis.overlap) {
      console.log('\n❌ Leads-innehållet överlappar sidebaren!');
      console.log(`   Sidebar slutar vid: ${layoutAnalysis.sidebar.right}px`);
      console.log(`   Leads börjar vid: ${layoutAnalysis.leadsContent.left}px`);
    } else {
      console.log('\n✅ Ingen överlappning!');
    }
    
    // Ta screenshot
    await page.screenshot({ path: 'test-sidebar-overlap.png', fullPage: false });
    
  } catch (error) {
    console.error('❌ Test misslyckades:', error.message);
  }
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  await browser.close();
}

testSidebarOverlap().catch(console.error);