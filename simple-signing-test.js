const puppeteer = require('puppeteer');

async function simpleSigningTest() {
  const browser = await puppeteer.launch({ 
    headless: false, 
    slowMo: 1000
  });
  
  try {
    const page = await browser.newPage();
    
    console.log('🎯 FÖRENKLAD SIGNERINGSTEST...');
    
    // Gå till signeringssida
    const token = 'kqkhd3fv34rmcy0or6h';
    await page.goto(`http://localhost:3000/avtal/signera/${token}`);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('✅ Signeringssida laddad');
    
    // Fyll i fält med evaluate för att undvika selector-problem
    await page.evaluate(() => {
      // Bank dropdown
      const bankSelects = document.querySelectorAll('button[role="combobox"], select');
      if (bankSelects[0]) bankSelects[0].click();
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await page.evaluate(() => {
      // Hitta SEB option
      const options = Array.from(document.querySelectorAll('*'));
      const sebOption = options.find(el => el.textContent && el.textContent.trim() === 'SEB');
      if (sebOption) sebOption.click();
    });
    
    // Clearingnummer
    await page.evaluate(() => {
      const clearingInput = document.querySelector('#clearingNumber');
      if (clearingInput) clearingInput.value = '1234';
    });
    
    // Kontonummer
    await page.evaluate(() => {
      const accountInput = document.querySelector('#accountNumber');
      if (accountInput) accountInput.value = '1234567890';
    });
    
    // Klädstorlek
    await page.evaluate(() => {
      const sizeSelects = document.querySelectorAll('button[role="combobox"], select');
      const sizeSelect = Array.from(sizeSelects).find(select => 
        select.id === 'clothingSize' || 
        select.previousElementSibling?.textContent?.includes('storlek')
      );
      if (sizeSelect) sizeSelect.click();
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await page.evaluate(() => {
      const options = Array.from(document.querySelectorAll('*'));
      const mOption = options.find(el => el.textContent && el.textContent.trim() === 'M');
      if (mOption) mOption.click();
    });
    
    // Signatur
    await page.evaluate(() => {
      const signatureInput = document.querySelector('#signature');
      if (signatureInput) signatureInput.value = 'Mustafa Abdulkarim';
    });
    
    // Checkbox
    await page.evaluate(() => {
      const checkbox = document.querySelector('input[type="checkbox"]');
      if (checkbox) checkbox.checked = true;
    });
    
    console.log('✅ Formulär ifyllt');
    
    // Klicka på signera
    const signResult = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const signButton = buttons.find(btn => 
        btn.textContent.includes('Signera anställningsavtal')
      );
      if (signButton) {
        signButton.click();
        return true;
      }
      return false;
    });
    
    console.log('Signera-knapp klickad:', signResult);
    
    if (signResult) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const currentUrl = page.url();
      console.log('Slutlig URL:', currentUrl);
      
      if (currentUrl.includes('bekraftelse')) {
        console.log('🎉 SIGNERING SLUTFÖRD! Omdirigerad till bekräftelsesida.');
      } else {
        const toastMessages = await page.evaluate(() => {
          const toasts = Array.from(document.querySelectorAll('*'));
          return toasts
            .filter(el => el.textContent && el.textContent.includes('signerat'))
            .map(el => el.textContent);
        });
        console.log('Toast-meddelanden:', toastMessages);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
  } catch (error) {
    console.error('❌ Test fel:', error);
  } finally {
    await browser.close();
  }
}

simpleSigningTest();