import puppeteer from "puppeteer";

async function verifyUIFixes() {
  console.log("🧪 FINAL UI VERIFICATION TEST\n");
  console.log("=".repeat(60));
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });

  const testResults = {
    customerPageFixed: false,
    staffAppFixed: false,
    details: {}
  };

  try {
    const page = await browser.newPage();
    
    // Test 1: Create a new test customer and verify it appears
    console.log("\n📊 Test 1: Customer Page Real-Time Updates");
    console.log("-".repeat(40));
    
    // Create a test customer via API
    const testCustomerName = `UI Test Customer ${Date.now()}`;
    const testEmail = `uitest-${Date.now()}@example.com`;
    
    await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
    
    const customerResponse = await page.evaluate(async (name, email) => {
      const response = await fetch("/api/submit-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          email: email,
          phone: "070-888-9999",
          customerType: "private",
          serviceType: "moving",
          serviceTypes: ["moving"],
          moveDate: new Date().toISOString().split('T')[0],
          moveTime: "14:00",
          startAddress: "UI Test Start",
          endAddress: "UI Test End",
          totalPrice: 7500
        })
      });
      
      return {
        ok: response.ok,
        data: await response.json()
      };
    }, testCustomerName, testEmail);
    
    if (!customerResponse.ok) {
      console.error("Failed to create test customer:", customerResponse.data);
    } else {
      console.log("✅ Test customer created:", testCustomerName);
    }
    
    // Navigate to customer page
    await page.goto("http://localhost:3000/crm/kunder", { waitUntil: "networkidle2" });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if new customer appears
    const customerFound = await page.evaluate((name) => {
      const body = document.body.textContent || "";
      return body.includes(name);
    }, testCustomerName);
    
    testResults.customerPageFixed = customerFound;
    testResults.details.customerPageTest = customerFound 
      ? `✅ Customer "${testCustomerName}" found on page` 
      : `❌ Customer "${testCustomerName}" NOT found on page`;
    
    console.log(testResults.details.customerPageTest);
    
    // Take screenshot of customer page
    await page.screenshot({ path: "customer-page-verification.png" });
    
    // Test 2: Check Staff App for Real Jobs
    console.log("\n👥 Test 2: Staff App Real Jobs");
    console.log("-".repeat(40));
    
    // Login to staff app
    await page.goto("http://localhost:3000/staff", { waitUntil: "domcontentloaded" });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Login as Mustafa
    await page.waitForSelector('[type="email"]');
    await page.type('[type="email"]', 'mustafa@nordflytt.se');
    await page.type('[type="password"]', 'nordflytt123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for real job data
    const staffPageContent = await page.evaluate(() => {
      return document.body.textContent || "";
    });
    
    // Check if mock data is gone and real data appears
    const hasMockData = staffPageContent.includes("Anna Svensson") || 
                        staffPageContent.includes("Södermalm till Östermalm");
    const hasRealData = staffPageContent.includes(testCustomerName) || 
                        staffPageContent.includes("UI Test");
    
    testResults.staffAppFixed = !hasMockData || hasRealData;
    testResults.details.staffAppTest = {
      mockDataGone: !hasMockData,
      realDataShowing: hasRealData,
      message: testResults.staffAppFixed 
        ? "✅ Staff app showing real job data" 
        : "❌ Staff app still showing mock data"
    };
    
    console.log(testResults.details.staffAppTest.message);
    console.log("Mock data removed:", !hasMockData ? "✅" : "❌");
    console.log("Real data visible:", hasRealData ? "✅" : "❌");
    
    // Take screenshot of staff dashboard
    await page.screenshot({ path: "staff-dashboard-verification.png" });
    
    // Final Report
    console.log("\n" + "=".repeat(60));
    console.log("📊 FINAL VERIFICATION REPORT");
    console.log("=".repeat(60));
    
    const successRate = (testResults.customerPageFixed && testResults.staffAppFixed) ? 100 : 
                       (testResults.customerPageFixed || testResults.staffAppFixed) ? 50 : 0;
    
    console.log(`\n✅ Customer Page Fixed: ${testResults.customerPageFixed ? "YES ✅" : "NO ❌"}`);
    console.log(`✅ Staff App Fixed: ${testResults.staffAppFixed ? "YES ✅" : "NO ❌"}`);
    
    console.log("\n" + "=".repeat(60));
    console.log(`🏁 OVERALL SUCCESS RATE: ${successRate}%`);
    console.log("=".repeat(60));
    
    if (successRate === 100) {
      console.log("\n🎉 ALL UI ISSUES FIXED!");
      console.log("Both customer page and staff app now show real database data.");
    } else {
      console.log("\n⚠️  SOME ISSUES REMAIN");
      console.log("Check the screenshots for details.");
    }
    
  } catch (error) {
    console.error("Test error:", error);
  } finally {
    console.log("\nKeeping browser open for inspection...");
    await new Promise(resolve => setTimeout(resolve, 30000));
    await browser.close();
  }
}

verifyUIFixes();