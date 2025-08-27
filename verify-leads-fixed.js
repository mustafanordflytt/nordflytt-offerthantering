import puppeteer from 'puppeteer';

async function verifyLeadsFixed() {
  console.log('🔍 VERIFYING LEADS PAGE FIX\n');
  console.log('=' .repeat(50));
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });

  try {
    const page = await browser.newPage();
    
    // Test Leads Page
    console.log('📋 Testing Leads Page...');
    await page.goto('http://localhost:3000/crm/leads', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check API response
    const apiResult = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/crm/leads');
        const data = await response.json();
        return {
          success: true,
          total: data.leads?.length || 0,
          hasTestLead: data.leads?.some(l => l.email === 'testlead@example.com')
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    console.log('API Check:', apiResult);
    
    // Check UI for leads
    const uiResult = await page.evaluate(() => {
      const body = document.body.textContent || '';
      const leadCards = document.querySelectorAll('[class*="card"], [class*="Card"]');
      
      // Check for specific text patterns
      const hasTestLead = body.includes('Test Lead Creation') || body.includes('testlead@example.com');
      const hasMaria = body.includes('Maria');
      const hasLeadCount = body.includes('9') || body.includes('Totala Leads');
      
      return {
        hasTestLead,
        hasMaria,
        hasLeadCount,
        leadCardCount: leadCards.length,
        bodySnippet: body.substring(0, 200)
      };
    });
    
    console.log('\nUI Check:');
    console.log('- Test Lead visible:', uiResult.hasTestLead ? 'YES ✅' : 'NO ❌');
    console.log('- Maria visible:', uiResult.hasMaria ? 'YES ✅' : 'NO ❌');
    console.log('- Lead count shown:', uiResult.hasLeadCount ? 'YES ✅' : 'NO ❌');
    console.log('- Lead cards found:', uiResult.leadCardCount);
    
    await page.screenshot({ path: 'verify-leads-fixed.png' });
    
    // Summary
    const isFixed = apiResult.success && apiResult.total > 0 && (uiResult.hasTestLead || uiResult.leadCardCount > 0);
    console.log('\n🏁 RESULT:', isFixed ? 'LEADS PAGE FIXED! ✅' : 'STILL NEEDS WORK ❌');
    
    if (isFixed) {
      console.log('\n✨ The Leads page is now showing real database data!');
      console.log(`📊 Total leads from database: ${apiResult.total}`);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    console.log('\nKeeping browser open for inspection...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    await browser.close();
  }
}

verifyLeadsFixed();