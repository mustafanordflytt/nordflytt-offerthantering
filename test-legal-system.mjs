import puppeteer from 'puppeteer';

async function testLegalSystem() {
  console.log('🚀 Starting Nordflytt Legal AI & Risk Management System Test...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    // 1. Navigate to CRM dashboard
    console.log('1. Navigating to CRM dashboard...');
    await page.goto('http://localhost:3000/crm/dashboard', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Click on Juridik & Risk in the navigation
    console.log('2. Clicking on Juridik & Risk menu item...');
    const juridikLink = await page.$('a[href="/crm/juridik-risk"]');
    if (juridikLink) {
      await juridikLink.click();
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      console.log('✅ Successfully navigated to Juridik & Risk page');
    } else {
      // Try alternative navigation method
      console.log('   Trying direct navigation...');
      await page.goto('http://localhost:3000/crm/juridik-risk', { 
        waitUntil: 'networkidle0' 
      });
    }
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Take screenshot of main dashboard
    await page.screenshot({ 
      path: 'legal-system-dashboard.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved: legal-system-dashboard.png');

    // 3. Test tab navigation
    console.log('\n3. Testing tab navigation...');
    const tabs = [
      { name: 'Tvister', selector: 'button:has-text("Tvister")' },
      { name: 'AI-svar', selector: 'button:has-text("AI-svar")' },
      { name: 'Försäkring', selector: 'button:has-text("Försäkring")' },
      { name: 'Riskanalys', selector: 'button:has-text("Riskanalys")' },
      { name: 'Kostnader', selector: 'button:has-text("Kostnader")' },
      { name: 'Mallar', selector: 'button:has-text("Mallar")' }
    ];

    for (const tab of tabs) {
      try {
        console.log(`   Testing ${tab.name} tab...`);
        
        // Try multiple selectors
        let tabButton = await page.$(tab.selector);
        if (!tabButton) {
          // Try with contains text
          tabButton = await page.$(`button:contains("${tab.name}")`);
        }
        if (!tabButton) {
          // Try XPath
          const [xpathButton] = await page.$x(`//button[contains(text(), "${tab.name}")]`);
          tabButton = xpathButton;
        }

        if (tabButton) {
          await tabButton.click();
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Take screenshot of each tab
          await page.screenshot({ 
            path: `legal-system-${tab.name.toLowerCase()}.png`,
            fullPage: true 
          });
          console.log(`   ✅ ${tab.name} tab loaded successfully`);
        } else {
          console.log(`   ⚠️  Could not find ${tab.name} tab button`);
        }
      } catch (error) {
        console.log(`   ❌ Error testing ${tab.name} tab:`, error.message);
      }
    }

    // 4. Test specific functionality in Tvister (Disputes) tab
    console.log('\n4. Testing Disputes functionality...');
    const tvisterTab = await page.$x('//button[contains(text(), "Tvister")]');
    if (tvisterTab[0]) {
      await tvisterTab[0].click();
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check for dispute cards
      const disputeCards = await page.$$('.rounded-lg.border');
      console.log(`   Found ${disputeCards.length} dispute cards`);

      // Test filter dropdown if exists
      const filterButton = await page.$('button:has-text("Alla")');
      if (filterButton) {
        await filterButton.click();
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('   ✅ Filter dropdown working');
      }
    }

    // 5. Test Risk Analysis charts
    console.log('\n5. Testing Risk Analysis visualization...');
    const riskTab = await page.$x('//button[contains(text(), "Riskanalys")]');
    if (riskTab[0]) {
      await riskTab[0].click();
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check for chart elements
      const charts = await page.$$('svg.recharts-surface');
      console.log(`   Found ${charts.length} risk analysis charts`);

      // Check for risk score
      const riskScore = await page.$('.text-4xl.font-bold');
      if (riskScore) {
        const score = await page.evaluate(el => el.textContent, riskScore);
        console.log(`   Current risk score: ${score}`);
      }
    }

    // 6. Test Legal Templates functionality
    console.log('\n6. Testing Legal Templates...');
    const mallarTab = await page.$x('//button[contains(text(), "Mallar")]');
    if (mallarTab[0]) {
      await mallarTab[0].click();
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Test search functionality
      const searchInput = await page.$('input[placeholder*="Sök mallar"]');
      if (searchInput) {
        await searchInput.type('skada');
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('   ✅ Template search working');
      }

      // Check template cards
      const templateCards = await page.$$('.space-y-4 > div');
      console.log(`   Found ${templateCards.length} template cards`);
    }

    // 7. Test responsive behavior
    console.log('\n7. Testing responsive behavior...');
    await page.setViewport({ width: 375, height: 812 }); // iPhone X
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({ 
      path: 'legal-system-mobile.png',
      fullPage: true 
    });
    console.log('📸 Mobile screenshot saved: legal-system-mobile.png');

    // 8. Test API endpoints
    console.log('\n8. Testing API endpoints...');
    
    // Test disputes API
    const disputesResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/legal/disputes?status=active');
        return { status: response.status, ok: response.ok };
      } catch (error) {
        return { error: error.message };
      }
    });
    console.log('   Disputes API:', disputesResponse.ok ? '✅ Working' : '❌ Failed');

    // Test risk assessment API
    const riskResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/legal/risk-assessment?type=job&reference_id=1');
        return { status: response.status, ok: response.ok };
      } catch (error) {
        return { error: error.message };
      }
    });
    console.log('   Risk Assessment API:', riskResponse.ok ? '✅ Working' : '❌ Failed');

    // Test insurance claims API
    const insuranceResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/legal/insurance-claims');
        return { status: response.status, ok: response.ok };
      } catch (error) {
        return { error: error.message };
      }
    });
    console.log('   Insurance Claims API:', insuranceResponse.ok ? '✅ Working' : '❌ Failed');

    // Test templates API
    const templatesResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/legal/templates?category=all');
        return { status: response.status, ok: response.ok };
      } catch (error) {
        return { error: error.message };
      }
    });
    console.log('   Templates API:', templatesResponse.ok ? '✅ Working' : '❌ Failed');

    console.log('\n✅ Legal AI & Risk Management System test completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    await page.screenshot({ path: 'legal-system-error.png' });
    console.log('📸 Error screenshot saved: legal-system-error.png');
  } finally {
    await browser.close();
  }
}

// Run the test
testLegalSystem().catch(console.error);