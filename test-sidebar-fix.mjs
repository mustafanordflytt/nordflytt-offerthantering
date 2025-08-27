import puppeteer from 'puppeteer';

async function testSidebarFix() {
  console.log('🔧 Testar och försöker fixa sidebar-problemet\n');
  
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
    
    // Analysera problemet
    console.log('1. Analyserar DOM-struktur...\n');
    const analysis = await page.evaluate(() => {
      // Hitta layout wrapper
      const layoutWrapper = document.querySelector('.min-h-screen.flex.bg-gray-50');
      const sidebar = document.querySelector('.w-64.bg-white.border-r');
      const mainContent = document.querySelector('.flex-1.flex.flex-col');
      const leadsContainer = document.querySelector('.p-6.space-y-6');
      
      // Kolla parent-child relationer
      let leadsParentChain = [];
      let current = leadsContainer;
      while (current && current !== document.body) {
        leadsParentChain.push({
          tag: current.tagName,
          classes: current.className,
          id: current.id
        });
        current = current.parentElement;
      }
      
      return {
        hasLayoutWrapper: !!layoutWrapper,
        hasSidebar: !!sidebar,
        hasMainContent: !!mainContent,
        hasLeadsContainer: !!leadsContainer,
        layoutChildren: layoutWrapper ? layoutWrapper.children.length : 0,
        leadsParentChain,
        problem: !layoutWrapper ? 'No layout wrapper' : 
                 !sidebar ? 'No sidebar' :
                 !mainContent ? 'No main content' :
                 'Unknown'
      };
    });
    
    console.log('DOM Analys:', JSON.stringify(analysis, null, 2));
    
    // Försök att fixa genom att injektera CSS
    console.log('\n2. Försöker visa sidebar med CSS...\n');
    await page.evaluate(() => {
      // Ta bort hidden class från sidebar om den finns
      const sidebar = document.querySelector('.hidden.md\\:block.w-64');
      if (sidebar) {
        sidebar.classList.remove('hidden');
        sidebar.classList.add('block');
        console.log('Sidebar: hidden class borttagen');
      }
      
      // Se till att layout wrapper har rätt display
      const layoutWrapper = document.querySelector('.min-h-screen.flex');
      if (layoutWrapper) {
        layoutWrapper.style.display = 'flex';
        console.log('Layout: flex display säkerställd');
      }
      
      // Justera main content width
      const mainContent = document.querySelector('.flex-1');
      if (mainContent) {
        mainContent.style.marginLeft = '256px'; // Sidebar width
        console.log('Main content: vänster marginal tillagd');
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({ path: 'test-sidebar-fix-attempt.png' });
    
    // Kolla om sidebar syns nu
    const sidebarVisible = await page.evaluate(() => {
      const sidebar = document.querySelector('.w-64.bg-white.border-r');
      if (!sidebar) return false;
      const rect = sidebar.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && rect.left >= 0;
    });
    
    console.log(`\n3. Sidebar synlig efter fix: ${sidebarVisible ? '✅ JA' : '❌ NEJ'}`);
    
    // Om fortfarande inte synlig, kolla om problemet är med Next.js routing
    if (!sidebarVisible) {
      console.log('\n4. Kollar Next.js routing...\n');
      
      const routingInfo = await page.evaluate(() => {
        // Kolla om vi har flera React roots
        const allReactRoots = document.querySelectorAll('[data-reactroot], #__next > div');
        
        return {
          reactRootsCount: allReactRoots.length,
          nextAppElement: !!document.querySelector('#__next'),
          multipleLayouts: document.querySelectorAll('.min-h-screen.flex').length
        };
      });
      
      console.log('Routing info:', routingInfo);
      
      if (routingInfo.multipleLayouts > 1) {
        console.log('⚠️  Problem: Flera layout-instanser renderas!');
        console.log('   Detta kan bero på felaktig Next.js routing eller layout nesting.');
      }
    }
    
    // Slutlig lösning: Tvinga om-rendering
    console.log('\n5. Testar att navigera fram och tillbaka...\n');
    await page.goto('http://localhost:3000/crm/dashboard');
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.goto('http://localhost:3000/crm/leads');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.screenshot({ path: 'test-sidebar-final.png' });
    
    // Final kontroll
    const finalCheck = await page.evaluate(() => {
      const sidebar = document.querySelector('.w-64.bg-white.border-r');
      const sidebarLinks = document.querySelectorAll('.w-64 a[href*="/crm/"]');
      
      return {
        sidebarExists: !!sidebar,
        sidebarVisible: sidebar ? window.getComputedStyle(sidebar).display !== 'none' : false,
        sidebarWidth: sidebar ? sidebar.offsetWidth : 0,
        navLinksCount: sidebarLinks.length
      };
    });
    
    console.log('\n📊 Slutlig kontroll:', finalCheck);
    
    if (finalCheck.sidebarVisible && finalCheck.navLinksCount > 0) {
      console.log('\n✅ Sidebar fungerar nu!');
    } else {
      console.log('\n❌ Sidebar-problemet kvarstår. Trolig orsak:');
      console.log('   - Layout-komponenten renderas inte korrekt för leads-sidan');
      console.log('   - Möjlig lösning: Kontrollera app/crm/layout.tsx och leads/page.tsx');
    }
    
  } catch (error) {
    console.error('❌ Test misslyckades:', error.message);
  }
  
  await new Promise(resolve => setTimeout(resolve, 10000));
  await browser.close();
}

testSidebarFix().catch(console.error);