import puppeteer from 'puppeteer';

async function simpleCheckJobs() {
  console.log('🔍 Simple Jobs Check\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`Browser: ${msg.text()}`);
  });
  
  try {
    // Go to test page
    console.log('1️⃣ Loading test page...');
    await page.goto('http://localhost:3000/staff/test-jobs');
    await new Promise(r => setTimeout(r, 5000)); // Wait for API calls
    
    // Get page content
    const content = await page.evaluate(() => {
      return {
        directJobs: document.body.textContent?.match(/Direct API Call\s*Jobs found: (\d+)/)?.[1],
        realtimeJobs: document.body.textContent?.match(/useRealtimeJobs Hook\s*Loading: \w+\s*Jobs found: (\d+)/)?.[1],
        jobCards: Array.from(document.querySelectorAll('div')).filter(d => d.textContent?.includes('JOB')).length
      };
    });
    
    console.log('\n📊 Results:');
    console.log('   Direct API jobs:', content.directJobs);
    console.log('   Realtime jobs:', content.realtimeJobs);
    console.log('   Job cards visible:', content.jobCards);
    
    // Take screenshot
    await page.screenshot({ path: 'test-jobs-page.png' });
    console.log('\n✅ Screenshot: test-jobs-page.png');
    
    // Check console for API responses
    await page.evaluate(() => {
      console.log('Checking API responses...');
    });
    
    console.log('\n✅ Done. Check browser DevTools.');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

simpleCheckJobs();