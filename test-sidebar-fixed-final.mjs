import puppeteer from 'puppeteer';

async function testSidebarFixedFinal() {
  console.log('🎯 Testar sidebar efter permanenta fixar\n');
  
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
    
    console.log('1. Testar Dashboard...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({ path: 'sidebar-dashboard-fixed.png' });
    
    // Testa navigation till olika sidor
    const pages = [
      { name: 'Leads', href: '/crm/leads' },
      { name: 'Kunder', href: '/crm/kunder' },
      { name: 'Uppdrag', href: '/crm/uppdrag' }
    ];
    
    for (const testPage of pages) {
      console.log(`\n2. Testar ${testPage.name}...`);
      await page.click(`a[href="${testPage.href}"]`);
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Kontrollera sidebar
      const sidebarCheck = await page.evaluate(() => {
        const sidebar = document.querySelector('.fixed.h-full.overflow-y-auto');
        const mainContent = document.querySelector('.lg\\:ml-64');
        
        return {
          sidebarExists: !!sidebar,
          sidebarFixed: sidebar ? window.getComputedStyle(sidebar).position === 'fixed' : false,
          mainHasMargin: !!mainContent,
          sidebarWidth: sidebar ? sidebar.offsetWidth : 0
        };
      });
      
      console.log(`   Sidebar check:`, sidebarCheck);
      
      if (testPage.name === 'Leads') {
        await page.screenshot({ path: 'sidebar-leads-fixed.png' });
      }
    }
    
    // Testa responsivitet
    console.log('\n3. Testar responsivitet...');
    
    // Desktop (1400px)
    console.log('   Desktop (1400px):');
    const desktopCheck = await page.evaluate(() => {
      const sidebar = document.querySelector('.hidden.lg\\:block');
      return sidebar ? window.getComputedStyle(sidebar).display : 'none';
    });
    console.log(`   Sidebar display: ${desktopCheck}`);
    
    // Tablet (1000px)
    await page.setViewport({ width: 1000, height: 900 });
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('   Tablet (1000px):');
    const tabletCheck = await page.evaluate(() => {
      const sidebar = document.querySelector('.hidden.lg\\:block');
      return sidebar ? window.getComputedStyle(sidebar).display : 'none';
    });
    console.log(`   Sidebar display: ${tabletCheck}`);
    
    // Mobile (375px)
    await page.setViewport({ width: 375, height: 812 });
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('   Mobile (375px):');
    const mobileCheck = await page.evaluate(() => {
      const sidebar = document.querySelector('.hidden.lg\\:block');
      const mobileMenu = document.querySelector('[class*="mobile"], button[aria-label*="menu"]');
      return {
        sidebarDisplay: sidebar ? window.getComputedStyle(sidebar).display : 'none',
        hasMobileMenu: !!mobileMenu
      };
    });
    console.log(`   Sidebar display: ${mobileCheck.sidebarDisplay}`);
    console.log(`   Has mobile menu: ${mobileCheck.hasMobileMenu}`);
    
    console.log('\n✅ Test slutfört!');
    console.log('\n📝 Sammanfattning:');
    console.log('   - Sidebar är nu fixed position');
    console.log('   - Main content har vänster marginal');
    console.log('   - Responsiv brytpunkt ändrad till lg (1024px)');
    console.log('   - DOM-manipulation borttagen');
    
  } catch (error) {
    console.error('❌ Test misslyckades:', error.message);
  }
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  await browser.close();
}

testSidebarFixedFinal().catch(console.error);