const puppeteer = require('puppeteer');
const fs = require('fs');

// Test configuration
const BASE_URL = 'http://localhost:3001';
const REPORT_FILE = 'OFFER-FORM-TEST-REPORT.md';

// Test user data
const testData = {
  // Step 1 - Customer Type
  customerType: 'private', // or 'company'
  
  // Step 2 - Contact Info
  name: 'Test Testsson',
  email: 'test@example.com',
  phone: '070-123 45 67',
  
  // Step 3 - Moving Details
  fromAddress: 'Kungsgatan 1, Stockholm',
  toAddress: 'Drottninggatan 50, Stockholm',
  moveDate: '2024-08-15',
  
  // Additional details for testing
  livingArea: '75',
  rooms: '3',
  floor: '2',
  elevator: 'yes',
  packingHelp: true,
  cleaningService: true
};

async function testOfferForm() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Report structure
  const report = {
    timestamp: new Date().toISOString(),
    url: BASE_URL,
    steps: [],
    buttons: [],
    forms: [],
    navigation: [],
    errors: [],
    userPaths: [],
    screenshots: []
  };

  try {
    console.log('🚀 Starting offer form test...\n');
    
    // Navigate to main page
    console.log('📍 Navigating to', BASE_URL);
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    
    // Take initial screenshot
    await page.screenshot({ path: 'screenshots/1-initial-page.png' });
    report.screenshots.push('1-initial-page.png');
    
    // Analyze initial page
    console.log('\n🔍 Analyzing initial page...');
    const initialAnalysis = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button')).map(btn => ({
        text: btn.textContent?.trim(),
        className: btn.className,
        id: btn.id,
        type: btn.type,
        disabled: btn.disabled,
        visible: btn.offsetWidth > 0 && btn.offsetHeight > 0
      }));
      
      const links = Array.from(document.querySelectorAll('a')).map(link => ({
        text: link.textContent?.trim(),
        href: link.href,
        className: link.className
      }));
      
      const forms = Array.from(document.querySelectorAll('form')).map(form => ({
        id: form.id,
        action: form.action,
        method: form.method,
        fields: Array.from(form.querySelectorAll('input, select, textarea')).length
      }));
      
      return { buttons, links, forms };
    });
    
    report.buttons = initialAnalysis.buttons;
    report.navigation = initialAnalysis.links;
    report.forms = initialAnalysis.forms;
    
    console.log(`Found ${initialAnalysis.buttons.length} buttons`);
    console.log(`Found ${initialAnalysis.links.length} links`);
    console.log(`Found ${initialAnalysis.forms.length} forms\n`);
    
    // Test User Path 1: Complete offer form flow
    console.log('🛤️ Testing User Path 1: Complete Offer Form\n');
    
    const userPath1 = {
      name: 'Complete Offer Form Flow',
      steps: []
    };
    
    // Look for start button using XPath
    const startButtons = await page.$$('button, a');
    let startButtonFound = false;
    
    for (const button of startButtons) {
      const text = await button.evaluate(el => el.textContent?.trim());
      if (text && (text.includes('Få offert') || text.includes('Börja') || text.includes('Start'))) {
        console.log(`✅ Found start button with text: "${text}", clicking...`);
        await button.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/2-after-start.png' });
        userPath1.steps.push({ action: 'click_start', status: 'success' });
        startButtonFound = true;
        break;
      }
    }
    
    if (!startButtonFound) {
      console.log('⚠️ No start button found, continuing...');
    }
    
    // Step 1: Customer Type Selection
    console.log('\n📝 Step 1: Customer Type Selection');
    const hasCustomerTypeStep = await page.$('input[value="private"]');
    if (hasCustomerTypeStep) {
      // Try radio button
      const privateRadio = await page.$('input[value="private"]');
      if (privateRadio) {
        await privateRadio.click();
      } else {
        // Try button with text
        const buttons = await page.$$('button');
        for (const btn of buttons) {
          const text = await btn.evaluate(el => el.textContent?.trim());
          if (text && text.includes('Privat')) {
            await btn.click();
            break;
          }
        }
      }
      
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/3-customer-type.png' });
      
      // Look for next button
      const nextButtons = await page.$$('button');
      for (const btn of nextButtons) {
        const text = await btn.evaluate(el => el.textContent?.trim());
        if (text && (text.includes('Nästa') || text.includes('Fortsätt'))) {
          await btn.click();
          await page.waitForTimeout(2000);
          break;
        }
      }
      
      userPath1.steps.push({ action: 'select_customer_type', status: 'success' });
    }
    
    // Step 2: Contact Information
    console.log('\n📝 Step 2: Contact Information');
    const nameInput = await page.$('input[name="name"], input[placeholder*="namn" i]');
    if (nameInput) {
      await nameInput.type(testData.name);
      
      const emailInput = await page.$('input[name="email"], input[type="email"]');
      if (emailInput) await emailInput.type(testData.email);
      
      const phoneInput = await page.$('input[name="phone"], input[type="tel"], input[placeholder*="telefon" i]');
      if (phoneInput) await phoneInput.type(testData.phone);
      
      await page.screenshot({ path: 'screenshots/4-contact-info.png' });
      
      // Next button
      const nextButtons2 = await page.$$('button');
      for (const btn of nextButtons2) {
        const text = await btn.evaluate(el => el.textContent?.trim());
        if (text && (text.includes('Nästa') || text.includes('Fortsätt'))) {
          await btn.click();
          await page.waitForTimeout(2000);
          break;
        }
      }
      
      userPath1.steps.push({ action: 'fill_contact_info', status: 'success' });
    }
    
    // Step 3: Moving Details
    console.log('\n📝 Step 3: Moving Details');
    const fromAddressInput = await page.$('input[name="fromAddress"], input[placeholder*="från" i]');
    if (fromAddressInput) {
      await fromAddressInput.type(testData.fromAddress);
      
      const toAddressInput = await page.$('input[name="toAddress"], input[placeholder*="till" i]');
      if (toAddressInput) await toAddressInput.type(testData.toAddress);
      
      const dateInput = await page.$('input[type="date"], input[name="moveDate"]');
      if (dateInput) await dateInput.type(testData.moveDate);
      
      await page.screenshot({ path: 'screenshots/5-moving-details.png' });
      
      userPath1.steps.push({ action: 'fill_moving_details', status: 'success' });
    }
    
    // Look for additional options
    console.log('\n🔍 Checking for additional options...');
    
    // Living area
    const areaInput = await page.$('input[name="livingArea"], input[placeholder*="yta" i], input[placeholder*="kvm" i]');
    if (areaInput) {
      await areaInput.type(testData.livingArea);
      console.log('✅ Filled living area');
    }
    
    // Number of rooms
    const roomsSelect = await page.$('select[name="rooms"]');
    if (roomsSelect) {
      await roomsSelect.select(testData.rooms);
      console.log('✅ Selected number of rooms');
    }
    
    // Packing help checkbox
    const packingCheckbox = await page.$('input[type="checkbox"][name*="pack" i]');
    if (packingCheckbox && testData.packingHelp) {
      await packingCheckbox.click();
      console.log('✅ Selected packing help');
    }
    
    // Cleaning service
    const cleaningCheckbox = await page.$('input[type="checkbox"][name*="clean" i], input[type="checkbox"][name*="städ" i]');
    if (cleaningCheckbox && testData.cleaningService) {
      await cleaningCheckbox.click();
      console.log('✅ Selected cleaning service');
    }
    
    await page.screenshot({ path: 'screenshots/6-additional-options.png' });
    
    // Submit form
    console.log('\n🚀 Looking for submit button...');
    let submitButton = await page.$('button[type="submit"]');
    if (!submitButton) {
      // Look for button with submit-like text
      const allButtons = await page.$$('button');
      for (const btn of allButtons) {
        const text = await btn.evaluate(el => el.textContent?.trim());
        if (text && (text.includes('Skicka') || text.includes('Få offert') || text.includes('Beräkna'))) {
          submitButton = btn;
          break;
        }
      }
    }
    
    if (submitButton) {
      console.log('✅ Found submit button, clicking...');
      await submitButton.click();
      
      // Wait for response
      await page.waitForTimeout(5000);
      await page.screenshot({ path: 'screenshots/7-after-submit.png' });
      
      userPath1.steps.push({ action: 'submit_form', status: 'success' });
    }
    
    // Check for offer/confirmation
    console.log('\n🔍 Checking for offer/confirmation...');
    const hasOffer = await page.evaluate(() => {
      const body = document.body.textContent || '';
      return {
        hasPrice: /\d+\s*(kr|SEK|:-)/i.test(body),
        hasConfirmation: /tack|bekräftelse|offert/i.test(body),
        hasSummary: /sammanfattning|summary/i.test(body)
      };
    });
    
    if (hasOffer.hasPrice) {
      console.log('✅ Found price in response');
      userPath1.steps.push({ action: 'view_offer', status: 'success' });
    }
    
    if (hasOffer.hasConfirmation) {
      console.log('✅ Found confirmation message');
      userPath1.steps.push({ action: 'view_confirmation', status: 'success' });
    }
    
    await page.screenshot({ path: 'screenshots/8-final-state.png' });
    
    // Test User Path 2: Test all interactive elements
    console.log('\n\n🛤️ Testing User Path 2: Interactive Elements\n');
    
    // Go back to start
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    
    // Find and test all clickable elements
    const clickableElements = await page.evaluate(() => {
      const elements = [];
      
      // All buttons
      document.querySelectorAll('button').forEach(btn => {
        if (btn.offsetWidth > 0 && btn.offsetHeight > 0) {
          elements.push({
            type: 'button',
            text: btn.textContent?.trim(),
            selector: btn.id ? `#${btn.id}` : null
          });
        }
      });
      
      // All links
      document.querySelectorAll('a').forEach(link => {
        if (link.offsetWidth > 0 && link.offsetHeight > 0) {
          elements.push({
            type: 'link',
            text: link.textContent?.trim(),
            href: link.href
          });
        }
      });
      
      // All form inputs
      document.querySelectorAll('input, select, textarea').forEach(input => {
        if (input.offsetWidth > 0 && input.offsetHeight > 0) {
          elements.push({
            type: 'input',
            inputType: input.type,
            name: input.name,
            placeholder: input.placeholder
          });
        }
      });
      
      return elements;
    });
    
    console.log(`Found ${clickableElements.length} interactive elements`);
    
    // Add to report
    report.userPaths.push(userPath1);
    report.userPaths.push({
      name: 'Interactive Elements Test',
      elements: clickableElements
    });
    
    // Generate final report
    const reportContent = `# Offer Form Test Report

## Test Information
- **Date**: ${report.timestamp}
- **URL**: ${report.url}
- **Screenshots**: ${report.screenshots.length} captured

## Summary
- **Buttons Found**: ${report.buttons.length}
- **Links Found**: ${report.navigation.length}
- **Forms Found**: ${report.forms.length}
- **Errors**: ${report.errors.length}

## User Path 1: Complete Offer Form
${userPath1.steps.map(step => `- ${step.action}: ${step.status}`).join('\n')}

## Interactive Elements Found

### Buttons (${report.buttons.filter(b => b.visible).length} visible)
${report.buttons.filter(b => b.visible).map(b => `- "${b.text || 'No text'}" ${b.disabled ? '(disabled)' : ''}`).join('\n')}

### Form Fields
${clickableElements.filter(e => e.type === 'input').map(e => `- ${e.inputType} field: ${e.name || e.placeholder || 'unnamed'}`).join('\n')}

### Navigation Links
${report.navigation.slice(0, 10).map(l => `- "${l.text}": ${l.href}`).join('\n')}
${report.navigation.length > 10 ? `\n... and ${report.navigation.length - 10} more links` : ''}

## Screenshots Captured
${report.screenshots.map((s, i) => `${i + 1}. ${s}`).join('\n')}

## Test Status
${userPath1.steps.length > 0 ? '✅ Form flow tested successfully' : '❌ Form flow test incomplete'}
${hasOffer?.hasPrice ? '✅ Price/offer displayed' : '⚠️ No price found'}
${hasOffer?.hasConfirmation ? '✅ Confirmation shown' : '⚠️ No confirmation found'}
`;
    
    fs.writeFileSync(REPORT_FILE, reportContent);
    console.log(`\n📄 Report saved to ${REPORT_FILE}`);
    
  } catch (error) {
    console.error('❌ Test error:', error);
    report.errors.push({
      message: error.message,
      stack: error.stack
    });
  } finally {
    await browser.close();
  }
}

// Create screenshots directory
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

// Run the test
console.log('🧪 Nordflytt Offer Form Test\n');
testOfferForm().catch(console.error);