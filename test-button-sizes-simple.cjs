const puppeteer = require('puppeteer');

console.log('🔍 Testing button sizes in Staff App\n');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--window-size=400,900']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 }); // iPhone 14 Pro
  
  const results = [];
  
  try {
    // 1. Test Staff Login page
    console.log('1. Testing Staff Login page...');
    await page.goto('http://localhost:3000/staff/login', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'button-sizes-1-login.png' });
    
    const loginButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.map(btn => {
        const rect = btn.getBoundingClientRect();
        return {
          text: btn.textContent?.trim() || 'No text',
          height: Math.round(rect.height),
          visible: rect.height > 0
        };
      });
    });
    
    console.log('\n   Login page buttons:');
    loginButtons.forEach(btn => {
      if (btn.visible) {
        const status = btn.height >= 44 ? '✅' : '❌';
        console.log(`   ${status} "${btn.text}": ${btn.height}px`);
        results.push({ page: 'login', ...btn });
      }
    });
    
    // 2. Test mock dashboard (without login)
    console.log('\n2. Creating mock staff auth for dashboard...');
    
    // Set mock auth
    await page.evaluate(() => {
      localStorage.setItem('staff_auth', JSON.stringify({
        id: 'test-user',
        email: 'test@nordflytt.se',
        name: 'Test User',
        role: 'Flyttare',
        phone: '+46701234567',
        loginTime: new Date().toISOString(),
        token: 'mock-token'
      }));
    });
    
    // Navigate to dashboard
    await page.goto('http://localhost:3000/staff/dashboard', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: 'button-sizes-2-dashboard.png' });
    
    const dashboardButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.map(btn => {
        const rect = btn.getBoundingClientRect();
        return {
          text: btn.textContent?.trim().substring(0, 30) || 'No text',
          height: Math.round(rect.height),
          visible: rect.height > 0 && rect.width > 0
        };
      });
    });
    
    console.log('\n   Dashboard buttons:');
    dashboardButtons.forEach(btn => {
      if (btn.visible) {
        const status = btn.height >= 44 ? '✅' : '❌';
        console.log(`   ${status} "${btn.text}": ${btn.height}px`);
        results.push({ page: 'dashboard', ...btn });
      }
    });
    
    // 3. Check CSS rules
    console.log('\n3. Checking global CSS rules...');
    const cssRules = await page.evaluate(() => {
      // Create test elements
      const button = document.createElement('button');
      const touchButton = document.createElement('button');
      touchButton.className = 'touch-manipulation';
      
      document.body.appendChild(button);
      document.body.appendChild(touchButton);
      
      const buttonStyles = window.getComputedStyle(button);
      const touchStyles = window.getComputedStyle(touchButton);
      
      const result = {
        defaultMinHeight: buttonStyles.minHeight,
        touchMinHeight: touchStyles.minHeight,
        hasMediaQuery: false
      };
      
      // Check if media queries are applied
      if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
        result.hasMediaQuery = true;
      }
      
      document.body.removeChild(button);
      document.body.removeChild(touchButton);
      
      return result;
    });
    
    console.log(`   Default button min-height: ${cssRules.defaultMinHeight || 'Not set'}`);
    console.log(`   Touch button min-height: ${cssRules.touchMinHeight || 'Not set'}`);
    console.log(`   Touch media query active: ${cssRules.hasMediaQuery ? 'Yes' : 'No'}`);
    
    // Summary
    console.log('\n📊 Summary:');
    const allButtons = results.filter(r => r.visible);
    const smallButtons = allButtons.filter(r => r.height < 44);
    
    console.log(`   Total buttons tested: ${allButtons.length}`);
    console.log(`   Buttons < 44px: ${smallButtons.length}`);
    
    if (smallButtons.length > 0) {
      console.log('\n   ❌ Buttons that need fixing:');
      smallButtons.forEach(btn => {
        console.log(`      - ${btn.page}: "${btn.text}" (${btn.height}px)`);
      });
    } else {
      console.log('\n   ✅ All buttons meet the 44px minimum requirement!');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ path: 'button-sizes-error.png' });
  }
  
  console.log('\n✨ Test complete! Check screenshots.');
  await new Promise(resolve => setTimeout(resolve, 5000));
  await browser.close();
})();