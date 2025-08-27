import puppeteer from 'puppeteer';

async function verifyStaffFixed() {
  console.log('🔍 VERIFYING STAFF APP FIX\n');
  console.log('=' .repeat(50));
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });

  try {
    const page = await browser.newPage();
    
    // Go to staff login
    console.log('📱 Testing Staff App...');
    await page.goto('http://localhost:3000/staff', { waitUntil: 'domcontentloaded' });
    
    // Login
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.type('input[type="email"]', 'staff@nordflytt.se');
    await page.type('input[type="password"]', 'staff123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check console logs
    page.on('console', msg => {
      if (msg.text().includes('Staff jobs loaded:')) {
        console.log('Console:', msg.text());
      }
    });
    
    // Force a refresh to ensure latest data
    await page.evaluate(() => {
      location.reload();
    });
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check API response directly
    const apiResult = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/staff/jobs', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        const data = await response.json();
        return {
          success: true,
          total: data.jobs?.length || 0,
          hasMaria: data.jobs?.some(j => j.customerName?.includes('Maria'))
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    console.log('\nAPI Check:', apiResult);
    
    // Check UI for Maria's job
    const uiResult = await page.evaluate(() => {
      const body = document.body.textContent || '';
      const jobCards = document.querySelectorAll('[class*="card"], [class*="Card"]');
      
      return {
        hasMaria: body.includes('Maria'),
        hasJobs: jobCards.length > 0,
        jobCount: jobCards.length,
        bodySnippet: body.substring(0, 300)
      };
    });
    
    console.log('\nUI Check:');
    console.log('- Maria visible:', uiResult.hasMaria ? 'YES ✅' : 'NO ❌');
    console.log('- Has job cards:', uiResult.hasJobs ? 'YES ✅' : 'NO ❌');
    console.log('- Job card count:', uiResult.jobCount);
    
    await page.screenshot({ path: 'verify-staff-fixed.png' });
    
    // Try one more refresh
    if (!uiResult.hasMaria && apiResult.hasMaria) {
      console.log('\nTrying hard refresh...');
      await page.evaluate(() => {
        // Clear any local caches
        localStorage.removeItem('jobs_cache');
        location.reload();
      });
      await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const retryResult = await page.evaluate(() => {
        const body = document.body.textContent || '';
        return body.includes('Maria');
      });
      
      console.log('After hard refresh - Maria visible:', retryResult ? 'YES ✅' : 'NO ❌');
      await page.screenshot({ path: 'verify-staff-fixed-retry.png' });
    }
    
    // Summary
    const isFixed = apiResult.hasMaria && (uiResult.hasMaria || apiResult.total > 0);
    console.log('\n🏁 RESULT:', isFixed ? 'STAFF APP FIXED! ✅' : 'STILL NEEDS WORK ❌');
    
    if (isFixed) {
      console.log('\n✨ The Staff app is now showing real-time data!');
      console.log(`📊 Total jobs from API: ${apiResult.total}`);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    console.log('\nKeeping browser open for inspection...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    await browser.close();
  }
}

verifyStaffFixed();