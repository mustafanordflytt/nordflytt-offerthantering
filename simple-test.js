import puppeteer from "puppeteer";

async function quickTest() {
  console.log("🔍 Quick Phase 4 system test...");
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1200, height: 800 },
      args: ["--no-sandbox"]
    });

    const page = await browser.newPage();
    
    console.log("📡 Testing server connection...");
    
    try {
      await page.goto("http://localhost:3000", { 
        waitUntil: "domcontentloaded",
        timeout: 10000 
      });
      
      console.log("✅ Server connection successful");
      
      // Wait using setTimeout wrapped in Promise
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      await page.screenshot({ path: "quick-test-main.png", fullPage: true });
      console.log("📸 Screenshot saved: quick-test-main.png");
      
      const title = await page.title();
      console.log(`📄 Page title: ${title}`);
      
      // Test Enhanced BI page
      console.log("🧪 Testing Enhanced BI page...");
      try {
        await page.goto("http://localhost:3000/enhanced-bi", { 
          waitUntil: "domcontentloaded",
          timeout: 10000 
        });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        await page.screenshot({ path: "quick-test-enhanced-bi.png", fullPage: true });
        console.log("📸 Enhanced BI screenshot saved");
        
      } catch (biError) {
        console.log(`❌ Enhanced BI page failed: ${biError.message}`);
      }
      
      console.log("🎉 Quick test completed\!");
      
    } catch (error) {
      console.log(`❌ Connection failed: ${error.message}`);
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

quickTest().catch(console.error);
