const puppeteer = require("puppeteer");

(async () => {
  console.log("🚀 Testing Google Autocomplete on actual form
");
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  // Log console messages
  page.on("console", msg => {
    const text = msg.text();
    if (text.includes("Google") || text.includes("Places") || text.includes("✅") || text.includes("❌") || text.includes("Address")) {
      console.log("Browser:", text);
    }
  });

  try {
    // Navigate directly to form
    console.log("📍 Going to form...");
    await page.goto("http://localhost:3002/form", {
      waitUntil: "networkidle0",
      timeout: 30000
    });
    
    // Wait for form to load
    await new Promise(r => setTimeout(r, 2000));
    
    // Navigate through steps with error handling
    console.log("📋 Navigating through form steps...");
    
    // Step 1 - Try to find and click customer type
    try {
      await page.waitForSelector("[data-testid=\"customer-type-private\"], .cursor-pointer", { timeout: 5000 });
      const privateOption = await page.$("[data-testid=\"customer-type-private\"]") || await page.$(".cursor-pointer");
      if (privateOption) {
        await privateOption.click();
        console.log("✅ Step 1: Selected customer type");
      }
    } catch (e) {
      console.log("⚠️ Step 1: Could not find customer type selector");
    }
    
    await new Promise(r => setTimeout(r, 1000));
    
    // Step 2 - Select moving type
    try {
      await page.waitForSelector("[data-testid=\"service-type-move\"], .cursor-pointer", { timeout: 5000 });
      const moveOption = await page.$("[data-testid=\"service-type-move\"]") || await page.$(".cursor-pointer");
      if (moveOption) {
        await moveOption.click();
        console.log("✅ Step 2: Selected service type");
        await new Promise(r => setTimeout(r, 500));
        
        // Click next
        const nextButton = await page.$("button[type=\"submit\"], button:has-text(\"Nästa\")");
        if (nextButton) {
          await nextButton.click();
        }
      }
    } catch (e) {
      console.log("⚠️ Step 2: Could not find service type selector");
    }
    
    await new Promise(r => setTimeout(r, 1000));
    
    // Step 3 - Skip additional services
    try {
      const nextButton = await page.$("button[type=\"submit\"], button:has-text(\"Nästa\")");
      if (nextButton) {
        await nextButton.click();
        console.log("✅ Step 3: Skipped additional services");
      }
    } catch (e) {
      console.log("⚠️ Step 3: Could not find next button");
    }
    
    await new Promise(r => setTimeout(r, 3000));
    
    // Now we should be at Step 4 with address inputs
    console.log("
📍 At address input step");
    
    // Check for Google API status
    const apiStatus = await page.evaluate(() => {
      return {
        googleLoaded: \!\!window.google,
        mapsLoaded: \!\!window.google?.maps,
        placesLoaded: \!\!window.google?.maps?.places,
        PlaceAutocompleteElement: \!\!window.google?.maps?.places?.PlaceAutocompleteElement,
        oldAutocomplete: \!\!window.google?.maps?.places?.Autocomplete
      };
    });
    
    console.log("📊 API Status:", JSON.stringify(apiStatus, null, 2));
    
    // Look for address inputs
    const inputs = await page.evaluate(() => {
      const allInputs = document.querySelectorAll("input");
      const addressInputs = [];
      
      allInputs.forEach(input => {
        if (input.placeholder && (
          input.placeholder.toLowerCase().includes("adress") || 
          input.placeholder.toLowerCase().includes("address") ||
          input.placeholder.toLowerCase().includes("sök") ||
          input.placeholder.toLowerCase().includes("från") ||
          input.placeholder.toLowerCase().includes("till")
        )) {
          addressInputs.push({
            placeholder: input.placeholder,
            id: input.id,
            className: input.className,
            parent: input.parentElement?.className
          });
        }
      });
      
      return addressInputs;
    });
    
    console.log("
🔍 Found address inputs:", inputs);
    
    if (inputs.length > 0) {
      // Try to interact with first address input
      const firstInput = await page.$("input[placeholder*=\"från\"], input[placeholder*=\"Från\"], input[placeholder*=\"adress\"]");
      
      if (firstInput) {
        console.log("
⌨️ Typing in address field...");
        await firstInput.click();
        await firstInput.type("Kungsgatan 1, Stockholm", { delay: 100 });
        
        // Wait for autocomplete
        await new Promise(r => setTimeout(r, 3000));
        
        // Check for dropdown
        const dropdownInfo = await page.evaluate(() => {
          const selectors = [
            ".pac-container",
            "[role=\"listbox\"]",
            ".gm-style",
            "div[class*=\"autocomplete\"]",
            "div[class*=\"place\"]"
          ];
          
          const found = [];
          for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
              if (el && window.getComputedStyle(el).display \!== "none") {
                found.push({
                  selector,
                  visible: true,
                  className: el.className,
                  childCount: el.children.length
                });
              }
            });
          }
          
          return found;
        });
        
        console.log("
📋 Dropdown elements found:", dropdownInfo);
        
        // Get any visible suggestions
        const suggestions = await page.evaluate(() => {
          const items = document.querySelectorAll(".pac-item, [role=\"option\"], .pac-item-query");
          return Array.from(items).map(item => ({
            text: item.textContent,
            className: item.className
          }));
        });
        
        if (suggestions.length > 0) {
          console.log("
✅ Address suggestions found:");
          suggestions.forEach((s, i) => console.log(`  ${i + 1}. ${s.text}`));
        } else {
          console.log("
⚠️ No suggestions visible");
        }
      }
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: "form-autocomplete-test.png",
      fullPage: false 
    });
    console.log("
📸 Screenshot saved: form-autocomplete-test.png");
    
  } catch (error) {
    console.error("
❌ Error:", error.message);
    await page.screenshot({ 
      path: "form-autocomplete-error.png",
      fullPage: true 
    });
  }
  
  console.log("
✅ Test complete. Check the browser window.");
  console.log("Press Ctrl+C to close.");
})();
