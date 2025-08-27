const puppeteer = require('puppeteer');
const fs = require('fs');

async function testOfferFormDetailed() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Detailed report
  const detailedReport = {
    timestamp: new Date().toISOString(),
    url: 'http://localhost:3000',
    pages: [],
    interactions: [],
    formData: {},
    errors: []
  };

  try {
    console.log('🚀 Starting detailed offer form test...\n');
    
    // Navigate to main page
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));
    
    // Analyze initial page
    console.log('📸 Screenshot 1: Initial page');
    await page.screenshot({ path: 'screenshots/detailed-1-initial.png', fullPage: true });
    
    const initialPageAnalysis = await page.evaluate(() => {
      const pageInfo = {
        title: document.title,
        url: window.location.href,
        buttons: [],
        forms: [],
        inputs: [],
        text: []
      };
      
      // Get all buttons
      document.querySelectorAll('button').forEach(btn => {
        pageInfo.buttons.push({
          text: btn.textContent?.trim(),
          className: btn.className,
          onclick: btn.onclick ? 'has onclick' : 'no onclick',
          type: btn.type
        });
      });
      
      // Get all forms
      document.querySelectorAll('form').forEach(form => {
        pageInfo.forms.push({
          action: form.action,
          method: form.method,
          fields: form.querySelectorAll('input, select, textarea').length
        });
      });
      
      // Get all inputs
      document.querySelectorAll('input, select, textarea').forEach(input => {
        pageInfo.inputs.push({
          type: input.type || input.tagName.toLowerCase(),
          name: input.name,
          placeholder: input.placeholder,
          value: input.value,
          required: input.required
        });
      });
      
      // Get key text elements
      document.querySelectorAll('h1, h2, h3, p').forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.length > 0 && text.length < 200) {
          pageInfo.text.push({
            tag: el.tagName.toLowerCase(),
            text: text
          });
        }
      });
      
      return pageInfo;
    });
    
    detailedReport.pages.push({
      step: 'initial',
      ...initialPageAnalysis
    });
    
    console.log('\n📊 Initial Page Analysis:');
    console.log(`Title: ${initialPageAnalysis.title}`);
    console.log(`Buttons: ${initialPageAnalysis.buttons.length}`);
    console.log(`Forms: ${initialPageAnalysis.forms.length}`);
    console.log(`Inputs: ${initialPageAnalysis.inputs.length}`);
    
    // Log all buttons
    console.log('\nButtons found:');
    initialPageAnalysis.buttons.forEach((btn, i) => {
      console.log(`${i + 1}. "${btn.text}" (${btn.type})`);
    });
    
    // Try to click the main CTA button
    console.log('\n🎯 Looking for main CTA button...');
    
    // Method 1: Try by text content
    const ctaButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const ctaBtn = buttons.find(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        return text.includes('offert') || text.includes('börja') || text.includes('start');
      });
      if (ctaBtn) {
        ctaBtn.click();
        return true;
      }
      return false;
    });
    
    if (ctaButton) {
      console.log('✅ Clicked CTA button');
      await new Promise(r => setTimeout(r, 3000));
      
      // Check if we're on a new page or if content changed
      const currentUrl = await page.url();
      console.log(`Current URL: ${currentUrl}`);
      
      await page.screenshot({ path: 'screenshots/detailed-2-after-cta.png', fullPage: true });
    }
    
    // Analyze current state
    const currentState = await page.evaluate(() => {
      return {
        url: window.location.href,
        hasForm: document.querySelectorAll('form').length > 0,
        inputCount: document.querySelectorAll('input, select, textarea').length,
        visibleText: Array.from(document.querySelectorAll('h1, h2, h3, label')).map(el => el.textContent?.trim()).filter(t => t)
      };
    });
    
    console.log('\n📍 Current state:');
    console.log(`URL: ${currentState.url}`);
    console.log(`Has form: ${currentState.hasForm}`);
    console.log(`Input fields: ${currentState.inputCount}`);
    
    // If we have a form, try to fill it
    if (currentState.hasForm || currentState.inputCount > 0) {
      console.log('\n📝 Form detected, attempting to fill...');
      
      // Try to fill customer type (private/company)
      const customerTypeSelected = await page.evaluate(() => {
        // Radio buttons
        const privateRadio = document.querySelector('input[type="radio"][value="private"]');
        if (privateRadio) {
          privateRadio.click();
          return 'radio-private';
        }
        
        // Or buttons
        const buttons = Array.from(document.querySelectorAll('button'));
        const privateBtn = buttons.find(btn => btn.textContent?.includes('Privat'));
        if (privateBtn) {
          privateBtn.click();
          return 'button-private';
        }
        
        return null;
      });
      
      if (customerTypeSelected) {
        console.log(`✅ Selected customer type: ${customerTypeSelected}`);
        await new Promise(r => setTimeout(r, 1000));
      }
      
      // Fill text inputs
      await page.evaluate(() => {
        // Name
        const nameInputs = document.querySelectorAll('input[name*="name"], input[placeholder*="namn" i]');
        nameInputs.forEach(input => input.value = 'Test Testsson');
        
        // Email
        const emailInputs = document.querySelectorAll('input[type="email"], input[name*="email"], input[placeholder*="e-post" i], input[placeholder*="email" i]');
        emailInputs.forEach(input => input.value = 'test@example.com');
        
        // Phone
        const phoneInputs = document.querySelectorAll('input[type="tel"], input[name*="phone"], input[name*="telefon"], input[placeholder*="telefon" i]');
        phoneInputs.forEach(input => input.value = '070-123 45 67');
        
        // Address fields
        const fromInputs = document.querySelectorAll('input[name*="from"], input[placeholder*="från" i]');
        fromInputs.forEach(input => input.value = 'Kungsgatan 1, Stockholm');
        
        const toInputs = document.querySelectorAll('input[name*="to"], input[placeholder*="till" i]');
        toInputs.forEach(input => input.value = 'Drottninggatan 50, Stockholm');
        
        // Date
        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => input.value = '2024-08-15');
        
        // Living area
        const areaInputs = document.querySelectorAll('input[name*="area"], input[placeholder*="yta" i], input[placeholder*="kvm" i]');
        areaInputs.forEach(input => input.value = '75');
      });
      
      console.log('✅ Filled form fields');
      await new Promise(r => setTimeout(r, 1000));
      await page.screenshot({ path: 'screenshots/detailed-3-form-filled.png', fullPage: true });
      
      // Look for next/submit button
      const submitClicked = await page.evaluate(() => {
        // Try submit button
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.click();
          return 'submit';
        }
        
        // Try next/continue button
        const buttons = Array.from(document.querySelectorAll('button'));
        const nextBtn = buttons.find(btn => {
          const text = btn.textContent?.toLowerCase() || '';
          return text.includes('nästa') || text.includes('fortsätt') || text.includes('beräkna') || text.includes('få offert');
        });
        
        if (nextBtn) {
          nextBtn.click();
          return 'next';
        }
        
        return null;
      });
      
      if (submitClicked) {
        console.log(`✅ Clicked ${submitClicked} button`);
        await new Promise(r => setTimeout(r, 5000));
        
        // Check for result
        const resultState = await page.evaluate(() => {
          const bodyText = document.body.textContent || '';
          return {
            url: window.location.href,
            hasPrice: /\d+\s*(kr|SEK|:-)/i.test(bodyText),
            hasThankYou: /tack|bekräftelse|mottag/i.test(bodyText),
            hasSummary: /sammanfattning|summary|offert/i.test(bodyText),
            prices: bodyText.match(/\d+\s*\d*\s*(kr|SEK|:-)/gi) || []
          };
        });
        
        console.log('\n📊 Result Analysis:');
        console.log(`URL: ${resultState.url}`);
        console.log(`Has price: ${resultState.hasPrice}`);
        console.log(`Has confirmation: ${resultState.hasThankYou}`);
        console.log(`Has summary: ${resultState.hasSummary}`);
        if (resultState.prices.length > 0) {
          console.log(`Prices found: ${resultState.prices.join(', ')}`);
        }
        
        await page.screenshot({ path: 'screenshots/detailed-4-result.png', fullPage: true });
        
        detailedReport.interactions.push({
          action: 'form_submission',
          result: resultState
        });
      }
    }
    
    // Test all visible buttons
    console.log('\n🔘 Testing all interactive elements...');
    
    const allElements = await page.evaluate(() => {
      const elements = {
        buttons: [],
        links: [],
        inputs: []
      };
      
      // Buttons
      document.querySelectorAll('button').forEach((btn, i) => {
        if (btn.offsetWidth > 0 && btn.offsetHeight > 0) {
          elements.buttons.push({
            index: i,
            text: btn.textContent?.trim(),
            disabled: btn.disabled,
            type: btn.type
          });
        }
      });
      
      // Links
      document.querySelectorAll('a').forEach((link, i) => {
        if (link.offsetWidth > 0 && link.offsetHeight > 0) {
          elements.links.push({
            index: i,
            text: link.textContent?.trim(),
            href: link.href
          });
        }
      });
      
      // Inputs
      document.querySelectorAll('input, select, textarea').forEach((input, i) => {
        if (input.offsetWidth > 0 && input.offsetHeight > 0) {
          elements.inputs.push({
            index: i,
            type: input.type || input.tagName.toLowerCase(),
            name: input.name,
            placeholder: input.placeholder,
            required: input.required
          });
        }
      });
      
      return elements;
    });
    
    detailedReport.interactions.push({
      action: 'element_scan',
      elements: allElements
    });
    
    // Generate comprehensive report
    const reportContent = `# Detailed Offer Form Test Report

## Test Information
- **Date**: ${detailedReport.timestamp}
- **URL**: ${detailedReport.url}
- **Test Duration**: ${new Date() - new Date(detailedReport.timestamp)}ms

## Page Analysis

### Initial Page
- **Title**: ${detailedReport.pages[0]?.title || 'N/A'}
- **Buttons**: ${detailedReport.pages[0]?.buttons.length || 0}
- **Forms**: ${detailedReport.pages[0]?.forms.length || 0}
- **Input Fields**: ${detailedReport.pages[0]?.inputs.length || 0}

### Buttons Found
${detailedReport.pages[0]?.buttons.map((btn, i) => `${i + 1}. "${btn.text}" (type: ${btn.type})`).join('\n') || 'No buttons found'}

### Text Content
${detailedReport.pages[0]?.text.filter(t => t.tag === 'h1' || t.tag === 'h2').map(t => `- ${t.tag.toUpperCase()}: ${t.text}`).join('\n') || 'No headers found'}

## User Journey Test

### Steps Completed
${detailedReport.interactions.map(i => `- ${i.action}: ${JSON.stringify(i.result || i.elements?.buttons?.length || 'completed')}`).join('\n')}

## Interactive Elements Summary

### All Buttons (${allElements.buttons.length})
${allElements.buttons.map(b => `- "${b.text}" ${b.disabled ? '(disabled)' : ''}`).join('\n')}

### All Links (${allElements.links.length})
${allElements.links.map(l => `- "${l.text}": ${l.href}`).join('\n')}

### All Input Fields (${allElements.inputs.length})
${allElements.inputs.map(i => `- ${i.type} field: ${i.name || i.placeholder || 'unnamed'} ${i.required ? '(required)' : ''}`).join('\n')}

## Screenshots Captured
1. detailed-1-initial.png - Initial page load
2. detailed-2-after-cta.png - After clicking CTA button
3. detailed-3-form-filled.png - Form with test data
4. detailed-4-result.png - Final result/confirmation

## Test Results
${detailedReport.interactions.find(i => i.result?.hasPrice) ? '✅ Price/offer displayed successfully' : '⚠️ No price found'}
${detailedReport.interactions.find(i => i.result?.hasThankYou) ? '✅ Confirmation message shown' : '⚠️ No confirmation found'}
${detailedReport.interactions.find(i => i.result?.hasSummary) ? '✅ Summary/offer details shown' : '⚠️ No summary found'}

## Errors
${detailedReport.errors.length > 0 ? detailedReport.errors.map(e => `- ${e}`).join('\n') : 'No errors encountered'}
`;
    
    fs.writeFileSync('OFFER-FORM-DETAILED-REPORT.md', reportContent);
    console.log('\n📄 Detailed report saved to OFFER-FORM-DETAILED-REPORT.md');
    
  } catch (error) {
    console.error('❌ Test error:', error);
    detailedReport.errors.push(error.message);
  } finally {
    await new Promise(r => setTimeout(r, 3000)); // Keep browser open for 3 seconds to see final state
    await browser.close();
  }
}

// Run the test
console.log('🧪 Nordflytt Detailed Offer Form Test\n');
console.log('Testing URL: http://localhost:3000\n');
testOfferFormDetailed().catch(console.error);