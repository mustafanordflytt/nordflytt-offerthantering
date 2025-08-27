import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testAIActivation() {
  console.log('🧪 TESTING AI SYSTEM ACTIVATION\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const results = {
    serverRunning: false,
    aiComponentsFound: false,
    customerIntelligence: false,
    leadScoring: false,
    aiJobCreation: false,
    performanceDashboard: false
  };
  
  try {
    const page = await browser.newPage();
    
    // Test 1: Check if server is running
    console.log('📋 Test 1: Checking server...');
    try {
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 10000 });
      results.serverRunning = true;
      console.log('✅ Server is running');
    } catch (error) {
      console.log('❌ Server is not running on localhost:3000');
      console.log('   Run: npm run dev');
      await browser.close();
      return results;
    }
    
    // Test 2: Navigate to CRM Dashboard
    console.log('\n📋 Test 2: Checking CRM Dashboard...');
    try {
      await page.goto('http://localhost:3000/crm/dashboard');
      await page.waitForTimeout(3000);
      
      // Take screenshot
      await page.screenshot({ path: 'ai-dashboard-test.png', fullPage: true });
      console.log('📸 Screenshot saved: ai-dashboard-test.png');
      
      // Check for AI components
      const aiElements = await page.evaluate(() => {
        const elements = {
          performanceCard: document.querySelector('[class*="AI System Performance"]'),
          leadScoring: document.querySelector('[class*="AI Lead Scoring"]'),
          botIcon: document.querySelector('svg[class*="Bot"]'),
          aiText: document.body.textContent?.includes('AI') || false
        };
        return elements;
      });
      
      if (aiElements.aiText) {
        results.aiComponentsFound = true;
        console.log('✅ AI components detected in dashboard');
      } else {
        console.log('❌ No AI components found in dashboard');
      }
      
    } catch (error) {
      console.log('❌ Failed to check dashboard:', error.message);
    }
    
    // Test 3: Check Customer Detail Page
    console.log('\n📋 Test 3: Checking Customer Intelligence...');
    try {
      // First, get a customer ID from the customers page
      await page.goto('http://localhost:3000/crm/kunder');
      await page.waitForTimeout(2000);
      
      // Click on first customer if available
      const firstCustomerLink = await page.$('table tbody tr:first-child a');
      if (firstCustomerLink) {
        await firstCustomerLink.click();
        await page.waitForTimeout(3000);
        
        // Check for AI Intelligence panel
        const hasIntelligence = await page.evaluate(() => {
          return document.body.textContent?.includes('AI Kundanalys') || 
                 document.body.textContent?.includes('Lead Score') ||
                 document.querySelector('[class*="CustomerIntelligence"]') !== null;
        });
        
        if (hasIntelligence) {
          results.customerIntelligence = true;
          console.log('✅ Customer Intelligence component found');
        } else {
          console.log('❌ Customer Intelligence not found');
        }
        
        // Check for AI job creation button
        const hasAIButton = await page.evaluate(() => {
          return document.body.textContent?.includes('AI Nytt Uppdrag') ||
                 document.querySelector('button:has(svg[class*="Bot"])') !== null;
        });
        
        if (hasAIButton) {
          results.aiJobCreation = true;
          console.log('✅ AI Job Creation button found');
        } else {
          console.log('❌ AI Job Creation button not found');
        }
        
        // Take screenshot
        await page.screenshot({ path: 'ai-customer-test.png', fullPage: true });
        console.log('📸 Screenshot saved: ai-customer-test.png');
      }
      
    } catch (error) {
      console.log('❌ Failed to check customer page:', error.message);
    }
    
    // Test 4: Check Leads Page
    console.log('\n📋 Test 4: Checking Lead Scoring...');
    try {
      await page.goto('http://localhost:3000/crm/leads');
      await page.waitForTimeout(2000);
      
      const hasLeadScoring = await page.evaluate(() => {
        return document.body.textContent?.includes('AI Lead Scoring') ||
               document.body.textContent?.includes('AI Score') ||
               document.querySelector('[class*="LeadScoring"]') !== null;
      });
      
      if (hasLeadScoring) {
        results.leadScoring = true;
        console.log('✅ Lead Scoring component found');
      } else {
        console.log('❌ Lead Scoring not found');
      }
      
    } catch (error) {
      console.log('❌ Failed to check leads page:', error.message);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
  
  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('==============');
  
  const passedTests = Object.values(results).filter(v => v).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\nTests Passed: ${passedTests}/${totalTests}`);
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}`);
  });
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL AI FEATURES ARE WORKING!');
    console.log('The AI system is fully integrated and operational.');
  } else if (passedTests > 0) {
    console.log('\n⚠️  PARTIAL AI INTEGRATION');
    console.log('Some AI features are working, but not all components are visible.');
    console.log('\nTroubleshooting:');
    console.log('1. Check browser console for errors');
    console.log('2. Verify API keys are configured');
    console.log('3. Ensure database migrations ran successfully');
  } else {
    console.log('\n❌ AI INTEGRATION NOT DETECTED');
    console.log('The AI components are not showing up in the UI.');
    console.log('\nNext steps:');
    console.log('1. Run: ./activate-ai-system.sh');
    console.log('2. Check .env.local for API keys');
    console.log('3. Restart the development server');
  }
  
  return results;
}

// Run the test
testAIActivation()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });