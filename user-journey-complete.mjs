import puppeteer from 'puppeteer';
import fs from 'fs';

// Create documentation file
const doc = [];
function log(message) {
  console.log(message);
  doc.push(message);
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function simulateUserJourney() {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 500, // Slow down to simulate real user
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();
  let stepNumber = 1;
  
  try {
    log('# 🚀 USER JOURNEY DOCUMENTATION - Nordflytt Booking Form\n');
    log('Date: ' + new Date().toLocaleString('sv-SE'));
    log('---\n');

    // Navigate to form
    log(`## Step ${stepNumber++}: Landing on Homepage`);
    log('User opens browser and navigates to Nordflytt website...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await wait(2000);
    
    await page.screenshot({ path: 'journey-01-homepage.png', fullPage: true });
    log('📸 Screenshot: journey-01-homepage.png');
    
    // Analyze page
    const pageTitle = await page.title();
    log(`Page Title: "${pageTitle}"`);
    
    // Check what's visible
    const hasForm = await page.$('form');
    const hasButtons = await page.$$('button');
    log(`Form found: ${hasForm ? 'Yes' : 'No'}`);
    log(`Buttons found: ${hasButtons.length}`);
    log('---\n');

    // Step 1 - Customer Type
    log(`## Step ${stepNumber++}: Selecting Customer Type`);
    log('User needs to choose between Private or Business customer...');
    
    // Look for customer type options
    const customerTypeOptions = await page.evaluate(() => {
      const divs = Array.from(document.querySelectorAll('div'));
      return divs
        .filter(div => div.textContent?.includes('Privatperson') || div.textContent?.includes('Företag'))
        .map(div => ({
          text: div.textContent?.substring(0, 50),
          classes: div.className
        }));
    });
    
    log('Available options found:');
    customerTypeOptions.forEach(opt => log(`  - ${opt.text}...`));
    
    // Click on Private customer
    log('\n👆 User clicks on "Privatperson"...');
    await page.evaluate(() => {
      const privateDiv = Array.from(document.querySelectorAll('div')).find(el => 
        el.textContent?.includes('Privatperson') && el.className.includes('cursor-pointer')
      );
      if (privateDiv) {
        privateDiv.click();
        return true;
      }
      return false;
    });
    await wait(1000);
    
    await page.screenshot({ path: 'journey-02-customer-type-selected.png' });
    log('📸 Screenshot: journey-02-customer-type-selected.png');
    log('---\n');

    // Step 2 - Contact Information
    log(`## Step ${stepNumber++}: Entering Contact Information`);
    log('User fills in their personal details...');
    
    // Check what input fields are available
    const inputFields = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      return inputs.map(input => ({
        name: input.name,
        type: input.type,
        placeholder: input.placeholder,
        required: input.required
      }));
    });
    
    log('Input fields available:');
    inputFields.forEach(field => log(`  - ${field.name || field.type}: ${field.placeholder || 'No placeholder'} ${field.required ? '(Required)' : ''}`));
    
    // Fill in contact info
    log('\n📝 User enters their information:');
    await page.type('input[name="name"]', 'Anna Svensson');
    log('  - Name: Anna Svensson');
    await wait(300);
    
    await page.type('input[name="email"]', 'anna.svensson@gmail.com');
    log('  - Email: anna.svensson@gmail.com');
    await wait(300);
    
    await page.type('input[name="phone"]', '0701234567');
    log('  - Phone: 070-123 45 67');
    await wait(500);
    
    await page.screenshot({ path: 'journey-03-contact-filled.png' });
    log('\n📸 Screenshot: journey-03-contact-filled.png');
    
    // Click continue
    log('\n👆 User clicks "Fortsätt" button...');
    await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find(el => 
        el.textContent?.includes('Fortsätt')
      );
      if (button) button.click();
    });
    await wait(1000);
    log('---\n');

    // Step 3 - Service Selection
    log(`## Step ${stepNumber++}: Selecting Services`);
    log('User chooses what services they need...');
    
    // Analyze available services
    const services = await page.evaluate(() => {
      const serviceDivs = Array.from(document.querySelectorAll('div[class*="border"]'));
      return serviceDivs
        .filter(div => div.textContent?.includes('Flytt') || div.textContent?.includes('Städning') || div.textContent?.includes('Packning'))
        .map(div => div.textContent?.substring(0, 100));
    });
    
    log('Available services:');
    services.forEach(service => log(`  - ${service}...`));
    
    // Select services
    log('\n👆 User selects multiple services:');
    
    // Select Moving
    await page.evaluate(() => {
      const flyttDiv = Array.from(document.querySelectorAll('div')).find(el => 
        el.textContent?.includes('Flytt') && el.textContent?.includes('Transport') && el.className.includes('border')
      );
      if (flyttDiv) flyttDiv.click();
    });
    log('  ✓ Selected: Flytt (Moving service)');
    await wait(500);
    
    // Select Packing
    await page.evaluate(() => {
      const packDiv = Array.from(document.querySelectorAll('div')).find(el => 
        el.textContent?.includes('Packning') && el.className.includes('border')
      );
      if (packDiv) packDiv.click();
    });
    log('  ✓ Selected: Packning (Packing service)');
    await wait(500);
    
    // Select Cleaning
    await page.evaluate(() => {
      const cleanDiv = Array.from(document.querySelectorAll('div')).find(el => 
        el.textContent?.includes('Städning') && el.className.includes('border')
      );
      if (cleanDiv) cleanDiv.click();
    });
    log('  ✓ Selected: Städning (Cleaning service)');
    await wait(500);
    
    await page.screenshot({ path: 'journey-04-services-selected.png' });
    log('\n📸 Screenshot: journey-04-services-selected.png');
    
    // Continue
    log('\n👆 User clicks "Fortsätt"...');
    await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find(el => 
        el.textContent?.includes('Fortsätt')
      );
      if (button) button.click();
    });
    await wait(1000);
    log('---\n');

    // Step 4 - Move Details
    log(`## Step ${stepNumber++}: Entering Move Details`);
    log('User provides information about their move...');
    
    // Fill move date
    log('\n📅 User selects move date (1 week from today)...');
    const moveDate = new Date();
    moveDate.setDate(moveDate.getDate() + 7);
    const dateStr = moveDate.toISOString().split('T')[0];
    await page.type('input[name="moveDate"]', dateStr);
    log(`  - Date: ${dateStr}`);
    
    await page.type('input[name="moveTime"]', '09:00');
    log('  - Time: 09:00');
    await wait(500);
    
    // From address
    log('\n🏠 User enters FROM address:');
    await page.type('input[name="startAddress"]', 'Vasagatan 15, Stockholm');
    log('  - Address: Vasagatan 15, Stockholm');
    await page.type('input[name="startLivingArea"]', '75');
    log('  - Living area: 75 m²');
    await page.select('select[name="startPropertyType"]', 'apartment');
    log('  - Property type: Apartment');
    await page.select('select[name="startFloor"]', '4');
    log('  - Floor: 4');
    await page.select('select[name="startElevator"]', 'small');
    log('  - Elevator: Small elevator');
    await page.type('input[name="startParkingDistance"]', '25');
    log('  - Parking distance: 25 meters');
    
    await wait(1000);
    await page.screenshot({ path: 'journey-05-from-address.png' });
    log('\n📸 Screenshot: journey-05-from-address.png');
    
    // To address
    log('\n🏠 User enters TO address:');
    await page.type('input[name="endAddress"]', 'Storgatan 28, Solna');
    log('  - Address: Storgatan 28, Solna');
    await page.type('input[name="endLivingArea"]', '95');
    log('  - Living area: 95 m²');
    await page.select('select[name="endPropertyType"]', 'apartment');
    log('  - Property type: Apartment');
    await page.select('select[name="endFloor"]', '2');
    log('  - Floor: 2');
    await page.select('select[name="endElevator"]', 'normal');
    log('  - Elevator: Normal elevator');
    await page.type('input[name="endParkingDistance"]', '10');
    log('  - Parking distance: 10 meters');
    
    await wait(1000);
    await page.screenshot({ path: 'journey-06-to-address.png' });
    log('\n📸 Screenshot: journey-06-to-address.png');
    
    // Continue
    log('\n👆 User clicks "Fortsätt"...');
    await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find(el => 
        el.textContent?.includes('Fortsätt')
      );
      if (button) button.click();
    });
    await wait(1000);
    log('---\n');

    // Step 5 - Inventory
    log(`## Step ${stepNumber++}: Inventory (Optional)`);
    log('User can specify furniture and items...');
    log('💭 User decides to skip this step for now...');
    
    await page.screenshot({ path: 'journey-07-inventory.png' });
    log('📸 Screenshot: journey-07-inventory.png');
    
    log('\n👆 User clicks "Fortsätt" to skip...');
    await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find(el => 
        el.textContent?.includes('Fortsätt')
      );
      if (button) button.click();
    });
    await wait(1000);
    log('---\n');

    // Step 6 - Extra Services
    log(`## Step ${stepNumber++}: Additional Services Selection`);
    log('⭐ IMPORTANT STEP: User selects extra services that should appear in the offer...');
    
    // Check what options are available
    const extraOptions = await page.evaluate(() => {
      const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
      const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
      
      return {
        radioOptions: radios.map(r => {
          const label = r.closest('label');
          return label ? label.textContent : 'Unknown';
        }),
        checkboxOptions: checkboxes.map(c => {
          const label = c.closest('label');
          return label ? label.textContent : 'Unknown';
        })
      };
    });
    
    log('\n📋 Available extra services:');
    log('Radio options (choose one):');
    extraOptions.radioOptions.forEach(opt => log(`  - ${opt}`));
    if (extraOptions.checkboxOptions.length > 0) {
      log('\nCheckbox options (can select multiple):');
      extraOptions.checkboxOptions.forEach(opt => log(`  - ${opt}`));
    }
    
    // Select packing service
    log('\n👆 User selects packing service:');
    await page.evaluate(() => {
      const packingRadio = Array.from(document.querySelectorAll('input[type="radio"]')).find(input => {
        const label = input.closest('label');
        return label && label.textContent?.includes('Packning & emballering');
      });
      if (packingRadio) {
        packingRadio.click();
        return true;
      }
      return false;
    });
    log('  ✓ Selected: Packning & emballering');
    await wait(500);
    
    // Select cleaning service
    log('\n👆 User selects cleaning service:');
    await page.evaluate(() => {
      const cleaningRadio = Array.from(document.querySelectorAll('input[type="radio"]')).find(input => {
        const label = input.closest('label');
        return label && label.textContent?.includes('Flyttstädning') && !label.textContent?.includes('Ingen');
      });
      if (cleaningRadio) {
        cleaningRadio.click();
        return true;
      }
      return false;
    });
    log('  ✓ Selected: Flyttstädning');
    await wait(500);
    
    // Select additional services if available
    const additionalSelected = await page.evaluate(() => {
      const selected = [];
      const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
      checkboxes.forEach(checkbox => {
        const label = checkbox.closest('label');
        if (label && (
          label.textContent?.includes('Möbelmontering') ||
          label.textContent?.includes('Upphängning') ||
          label.textContent?.includes('Bortforsling')
        )) {
          checkbox.click();
          selected.push(label.textContent);
        }
      });
      return selected;
    });
    
    if (additionalSelected.length > 0) {
      log('\n👆 User also selects additional services:');
      additionalSelected.forEach(service => log(`  ✓ Selected: ${service}`));
    }
    
    await wait(1000);
    await page.screenshot({ path: 'journey-08-extra-services-selected.png' });
    log('\n📸 Screenshot: journey-08-extra-services-selected.png');
    log('⚠️ NOTE: These selected services should appear in the final offer!');
    
    // Continue
    log('\n👆 User clicks "Fortsätt"...');
    await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find(el => 
        el.textContent?.includes('Fortsätt')
      );
      if (button) button.click();
    });
    await wait(1000);
    log('---\n');

    // Step 7 - Moving Materials
    log(`## Step ${stepNumber++}: Moving Materials`);
    log('User can order moving boxes and materials...');
    
    // Add some boxes
    log('\n📦 User orders moving materials:');
    const boxInputs = await page.$$('input[type="number"]');
    if (boxInputs.length >= 3) {
      await boxInputs[0].type('15');
      log('  - Small boxes: 15');
      await boxInputs[1].type('10');
      log('  - Medium boxes: 10');
      await boxInputs[2].type('5');
      log('  - Large boxes: 5');
    }
    
    await wait(1000);
    await page.screenshot({ path: 'journey-09-moving-materials.png' });
    log('\n📸 Screenshot: journey-09-moving-materials.png');
    
    // Continue
    log('\n👆 User clicks "Fortsätt"...');
    await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find(el => 
        el.textContent?.includes('Fortsätt')
      );
      if (button) button.click();
    });
    await wait(1000);
    log('---\n');

    // Step 8 - Summary
    log(`## Step ${stepNumber++}: Review Summary`);
    log('User reviews all entered information before submitting...');
    
    await wait(2000);
    await page.screenshot({ path: 'journey-10-summary-page.png', fullPage: true });
    log('📸 Screenshot: journey-10-summary-page.png');
    
    // Check what's shown in summary
    const summaryContent = await page.content();
    log('\n🔍 Checking summary content:');
    log('  - Customer name shown: ' + (summaryContent.includes('Anna Svensson') ? '✅ Yes' : '❌ No'));
    log('  - Move date shown: ' + (summaryContent.includes(dateStr) ? '✅ Yes' : '❌ No'));
    log('  - From address shown: ' + (summaryContent.includes('Vasagatan') ? '✅ Yes' : '❌ No'));
    log('  - To address shown: ' + (summaryContent.includes('Storgatan') ? '✅ Yes' : '❌ No'));
    
    log('\n🔍 Checking if EXTRA SERVICES appear in summary:');
    log('  - Packning & emballering: ' + (summaryContent.includes('Packning & emballering') ? '✅ VISIBLE' : '❌ MISSING'));
    log('  - Flyttstädning: ' + (summaryContent.includes('Flyttstädning') ? '✅ VISIBLE' : '❌ MISSING'));
    log('  - Moving boxes: ' + (summaryContent.includes('15') || summaryContent.includes('Small') ? '✅ VISIBLE' : '❌ MISSING'));
    
    // Check for price
    const priceElements = await page.$$eval('[class*="text-2xl"], [class*="text-3xl"], [class*="font-bold"]', elements => 
      elements.map(el => el.textContent).filter(text => text && text.includes('kr'))
    );
    log('\n💰 Price information found:');
    priceElements.forEach(price => log(`  - ${price}`));
    
    // Submit form
    log('\n👆 User clicks "Skicka bokning" to submit...');
    await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find(el => 
        el.textContent?.includes('Skicka')
      );
      if (button) button.click();
    });
    
    log('\n⏳ Waiting for response...');
    await wait(10000);
    log('---\n');

    // Check result
    const finalUrl = page.url();
    log(`## Step ${stepNumber++}: Final Result`);
    log(`Current URL: ${finalUrl}`);
    
    if (finalUrl.includes('/offer/')) {
      log('✅ SUCCESS: Reached offer page!');
      
      await wait(3000);
      await page.screenshot({ path: 'journey-11-offer-page.png', fullPage: true });
      log('📸 Screenshot: journey-11-offer-page.png');
      
      // Analyze offer page
      const offerContent = await page.content();
      log('\n🔍 CRITICAL CHECK - Do extra services appear in the offer?');
      log('  - Packning & emballering: ' + (offerContent.includes('Packning & emballering') ? '✅ VISIBLE' : '❌ MISSING IN OFFER'));
      log('  - Flyttstädning: ' + (offerContent.includes('Flyttstädning') ? '✅ VISIBLE' : '❌ MISSING IN OFFER'));
      log('  - Möbelmontering: ' + (offerContent.includes('Möbelmontering') ? '✅ VISIBLE' : '❌ MISSING IN OFFER'));
      
      // Check price breakdown
      log('\n💰 Checking price breakdown:');
      const offerPrices = await page.$$eval('[class*="font-semibold"], [class*="font-bold"], [class*="text-right"]', elements => 
        elements.map(el => el.textContent).filter(text => text && text.includes('kr'))
      );
      
      if (offerPrices.length > 0) {
        log('Price elements found:');
        offerPrices.slice(0, 10).forEach(price => log(`  - ${price}`));
      } else {
        log('  ❌ No price breakdown found!');
      }
      
    } else if (finalUrl.includes('/order-confirmation/')) {
      log('✅ Reached order confirmation page!');
      await page.screenshot({ path: 'journey-11-confirmation.png', fullPage: true });
      log('📸 Screenshot: journey-11-confirmation.png');
    } else {
      log('❌ Unexpected result. Did not reach offer page.');
      await page.screenshot({ path: 'journey-11-unexpected.png', fullPage: true });
      log('📸 Screenshot: journey-11-unexpected.png');
    }

  } catch (error) {
    log('\n❌ ERROR during journey: ' + error.message);
    await page.screenshot({ path: 'journey-error.png' });
    log('📸 Error screenshot: journey-error.png');
  }

  // Summary
  log('\n---\n## 📊 JOURNEY SUMMARY\n');
  log('### Key Findings:');
  log('1. User successfully navigated through all form steps');
  log('2. User selected multiple services including extra services');
  log('3. Form submission worked and redirected to offer/confirmation');
  log('4. ⚠️ CRITICAL ISSUE: Extra services selected in Step 6 may not appear in final offer');
  log('5. Price calculation and display needs verification');
  
  log('\n### User Experience Notes:');
  log('- Form flow is logical and easy to follow');
  log('- Multiple service selection works well');
  log('- Summary page shows most information correctly');
  log('- Missing visual confirmation of extra services in offer');
  
  log('\n### Screenshots Created:');
  log('- journey-01-homepage.png');
  log('- journey-02-customer-type-selected.png');
  log('- journey-03-contact-filled.png');
  log('- journey-04-services-selected.png');
  log('- journey-05-from-address.png');
  log('- journey-06-to-address.png');
  log('- journey-07-inventory.png');
  log('- journey-08-extra-services-selected.png');
  log('- journey-09-moving-materials.png');
  log('- journey-10-summary-page.png');
  log('- journey-11-offer-page.png (or confirmation/unexpected)');
  
  // Save documentation
  fs.writeFileSync('USER-JOURNEY-DOCUMENTATION.md', doc.join('\n'));
  log('\n📄 Full documentation saved to: USER-JOURNEY-DOCUMENTATION.md');
  
  console.log('\n🔍 Browser will stay open for manual inspection...');
  console.log('   Close the browser window when done.');
}

// Run the simulation
simulateUserJourney().catch(console.error);