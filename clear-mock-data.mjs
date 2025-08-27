import puppeteer from 'puppeteer';

console.log('🧹 Clearing mock data and testing Supabase connection\n');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--window-size=400,900']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  
  try {
    // 1. Go to staff dashboard (will redirect to login if not authenticated)
    console.log('1. Navigating to staff dashboard...');
    await page.goto('http://localhost:3000/staff/dashboard', { waitUntil: 'networkidle2' });
    
    // 2. Clear mock data from localStorage
    console.log('\n2. Clearing mock data...');
    await page.evaluate(() => {
      // Clear all mock-related data
      localStorage.removeItem('mockJobs');
      localStorage.removeItem('mockJobStatuses');
      localStorage.removeItem('staff_jobs_with_services');
      console.log('Mock data cleared');
    });
    console.log('   ✅ Mock data cleared from localStorage');
    
    // 3. Check if we're on login page (expected if not authenticated)
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('\n3. Redirected to login page (expected)');
      console.log('   URL:', currentUrl);
    } else {
      console.log('\n3. Still on dashboard - user might be authenticated');
      console.log('   URL:', currentUrl);
      
      // Take screenshot to see current state
      await page.screenshot({ path: 'staff-dashboard-after-clear.png' });
      
      // Check for any error messages
      const errorText = await page.$$eval('.text-red-500', elements => 
        elements.map(el => el.textContent).join(', ')
      );
      if (errorText) {
        console.log('   Error messages:', errorText);
      }
    }
    
    // 4. Test API directly
    console.log('\n4. Testing Supabase API connection...');
    const apiResponse = await page.evaluate(async () => {
      try {
        // Get auth token if available
        const auth = localStorage.getItem('staff_auth');
        const authData = auth ? JSON.parse(auth) : null;
        
        const response = await fetch('/api/staff/jobs', {
          headers: authData?.token ? {
            'Authorization': `Bearer ${authData.token}`
          } : {}
        });
        
        const data = await response.json();
        return {
          status: response.status,
          success: data.success,
          source: data.source,
          jobCount: data.jobs?.length || 0,
          error: data.error
        };
      } catch (error) {
        return {
          error: error.message
        };
      }
    });
    
    console.log('   API Response:', apiResponse);
    
    if (apiResponse.source === 'database') {
      console.log('   ✅ Successfully connected to Supabase!');
      console.log(`   📊 Found ${apiResponse.jobCount} jobs in database`);
    } else if (apiResponse.source === 'mock') {
      console.log('   ⚠️ Still using mock data (database connection failed)');
    } else if (apiResponse.status === 401) {
      console.log('   🔒 Authentication required (expected)');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\n✅ Mock data cleared!');
  console.log('\n📋 Next steps:');
  console.log('1. Login to Staff App using OTP authentication');
  console.log('2. Jobs will be fetched from Supabase automatically');
  console.log('3. If no jobs appear, create test jobs in Supabase');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  await browser.close();
})();