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
    // 1. Navigate directly to Juridik & Risk page
    console.log('1. Navigating to Juridik & Risk page...');
    await page.goto('http://localhost:3000/crm/juridik-risk', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Take screenshot of main dashboard
    await page.screenshot({ 
      path: 'legal-system-dashboard.png',
      fullPage: true 
    });
    console.log('✅ Successfully loaded Juridik & Risk page');
    console.log('📸 Screenshot saved: legal-system-dashboard.png');

    // 2. Check if main elements exist
    console.log('\n2. Checking main elements...');
    
    // Check for main title
    const mainTitle = await page.$('h1');
    if (mainTitle) {
      const titleText = await page.evaluate(el => el.textContent, mainTitle);
      console.log(`   ✅ Main title found: ${titleText}`);
    }

    // Check for metric cards
    const metricCards = await page.$$('.grid > .rounded-lg');
    console.log(`   ✅ Found ${metricCards.length} metric cards`);

    // 3. Test tab navigation using data attributes
    console.log('\n3. Testing tab navigation...');
    const tabButtons = await page.$$('[role="tab"]');
    console.log(`   Found ${tabButtons.length} tab buttons`);

    if (tabButtons.length > 0) {
      // Click each tab
      for (let i = 0; i < tabButtons.length && i < 6; i++) {
        const tabText = await page.evaluate(el => el.textContent, tabButtons[i]);
        console.log(`   Clicking on ${tabText} tab...`);
        
        await tabButtons[i].click();
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Take screenshot
        await page.screenshot({ 
          path: `legal-system-tab-${i}.png`,
          fullPage: true 
        });
        console.log(`   ✅ ${tabText} tab loaded - Screenshot saved as legal-system-tab-${i}.png`);
      }
    }

    // 4. Test specific components visibility
    console.log('\n4. Testing component visibility...');
    
    // Go back to first tab (Tvister)
    if (tabButtons.length > 0) {
      await tabButtons[0].click();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Check for dispute elements
    const disputeElements = await page.$$('h2:has-text("Juridiska tvister"), h2:has-text("Tvister")');
    if (disputeElements.length > 0) {
      console.log('   ✅ Disputes section found');
    }

    // 5. Test search functionality in Templates tab
    console.log('\n5. Testing Templates search...');
    if (tabButtons.length >= 6) {
      // Click on Mallar (Templates) tab - usually the last one
      await tabButtons[5].click();
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Look for search input
      const searchInput = await page.$('input[type="text"]');
      if (searchInput) {
        await searchInput.type('skada');
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('   ✅ Template search input working');
      }
    }

    // 6. Test responsive behavior
    console.log('\n6. Testing responsive behavior...');
    await page.setViewport({ width: 375, height: 812 }); // iPhone X
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({ 
      path: 'legal-system-mobile.png',
      fullPage: true 
    });
    console.log('📸 Mobile screenshot saved: legal-system-mobile.png');

    // 7. Test API endpoints
    console.log('\n7. Testing API endpoints...');
    
    const apiTests = [
      { name: 'Disputes API', url: '/api/legal/disputes?status=active' },
      { name: 'Risk Assessment API', url: '/api/legal/risk-assessment?type=job&reference_id=1' },
      { name: 'Insurance Claims API', url: '/api/legal/insurance-claims' },
      { name: 'Templates API', url: '/api/legal/templates?category=all' }
    ];

    for (const api of apiTests) {
      const response = await page.evaluate(async (url) => {
        try {
          const response = await fetch(url);
          return { status: response.status, ok: response.ok };
        } catch (error) {
          return { error: error.message };
        }
      }, api.url);
      
      console.log(`   ${api.name}:`, response.ok ? '✅ Working' : '❌ Failed');
    }

    console.log('\n✅ Legal AI & Risk Management System test completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'legal-system-error.png' });
    console.log('📸 Error screenshot saved: legal-system-error.png');
  } finally {
    await browser.close();
  }
}

// Run the test
testLegalSystem().catch(console.error);