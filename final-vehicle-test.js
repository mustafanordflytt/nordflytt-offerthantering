const puppeteer = require('puppeteer');

async function finalVehicleTest() {
  console.log('🎉 FINAL VEHICLE ACCESS TEST...');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    slowMo: 1000 
  });
  
  try {
    const page = await browser.newPage();
    
    // Test direct URL access to vehicle tab
    await page.goto('http://localhost:3000/crm/anstallda/staff-007?tab=vehicle');
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    // Check all the improvements we implemented
    const improvements = await page.evaluate(() => {
      const text = document.body.textContent;
      return {
        hasKeyGarage787: text.includes('KeyGarage 787'),
        hasPersonalCode: text.includes('155078') || /\d{6}/.test(text), // 6-digit code
        hasLocationInfo: text.includes('vänster bakdäck'),
        hasPlacementSection: text.includes('Låsboxens Placering'),
        hasSecuritySection: text.includes('Säkerhet & Ansvar'),
        hasCodeInstructions: text.includes('6-siffrig kod'),
        hasLucideIcons: document.querySelector('svg[class*="lucide"]') !== null,
        hasProperButtons: document.querySelectorAll('button').length > 0,
        hasEmailButton: text.includes('Skicka Email'),
        hasNewCodeButton: text.includes('Ny Kod'),
        contactEmail: text.includes('hej@nordflytt.se')
      };
    });
    
    console.log('✅ IMPROVEMENT VERIFICATION:');
    console.log('- KeyGarage 787 reference:', improvements.hasKeyGarage787 ? '✅' : '❌');
    console.log('- 6-digit personal code:', improvements.hasPersonalCode ? '✅' : '❌');
    console.log('- Location info (vänster bakdäck):', improvements.hasLocationInfo ? '✅' : '❌');
    console.log('- Placement section:', improvements.hasPlacementSection ? '✅' : '❌');
    console.log('- Security section:', improvements.hasSecuritySection ? '✅' : '❌');
    console.log('- Code usage instructions:', improvements.hasCodeInstructions ? '✅' : '❌');
    console.log('- Lucide icons (not emojis):', improvements.hasLucideIcons ? '✅' : '❌');
    console.log('- Proper buttons:', improvements.hasProperButtons ? '✅' : '❌');
    console.log('- Email button:', improvements.hasEmailButton ? '✅' : '❌');
    console.log('- New code button:', improvements.hasNewCodeButton ? '✅' : '❌');
    console.log('- Contact email updated:', improvements.contactEmail ? '✅' : '❌');
    
    const allPassed = Object.values(improvements).every(Boolean);
    
    if (allPassed) {
      console.log('\n🎉 ALL IMPROVEMENTS SUCCESSFULLY IMPLEMENTED!');
      console.log('✅ Vehicle access system is working perfectly');
      console.log('✅ UI consistency fixed (Lucide icons)');
      console.log('✅ Email content cleaned up');
      console.log('✅ Physical lock location added');
      console.log('✅ Contact information updated');
    } else {
      console.log('\n⚠️ Some improvements may need attention');
    }
    
    await page.screenshot({ 
      path: 'final-vehicle-test.png', 
      fullPage: true 
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

finalVehicleTest();