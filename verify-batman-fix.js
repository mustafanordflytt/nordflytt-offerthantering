import puppeteer from "puppeteer";

async function verifyBatmanFix() {
  console.log("🦇 BATMAN DATABASE INTEGRATION VERIFICATION\n");
  console.log("=".repeat(60));
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });

  const testResults = {
    bookingCreated: false,
    customerPageShows: false,
    offersPageShows: false,
    leadsPageShows: false,
    staffAppShows: false,
    details: {}
  };

  try {
    const page = await browser.newPage();
    
    // Test 1: Create Batman booking via API
    console.log("\n🦇 Creating Batman booking...");
    
    await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
    
    const bookingResponse = await page.evaluate(async () => {
      const response = await fetch("/api/submit-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Bruce Wayne (Batman)",
          email: "batman@gotham.com",
          phone: "070-BATMAN-1",
          customerType: "private",
          serviceType: "moving",
          serviceTypes: ["moving", "packing", "cleaning"],
          moveDate: "2025-08-10",
          moveTime: "22:00",
          startAddress: "Wayne Manor, Gotham",
          endAddress: "Batcave, Gotham Underground",
          totalPrice: 24890,
          startLivingArea: "500",
          endLivingArea: "1000",
          notes: "Handle with care - secret identity items"
        })
      });
      
      return {
        ok: response.ok,
        status: response.status,
        data: await response.json()
      };
    });
    
    if (!bookingResponse.ok || !bookingResponse.data.success) {
      console.error("❌ Booking creation failed:", bookingResponse.data);
      return;
    }
    
    testResults.bookingCreated = true;
    const bookingId = bookingResponse.data.bookingId;
    console.log("✅ Booking created:", bookingId);
    console.log("  - Reference:", bookingResponse.data.bookingReference);
    console.log("  - Total Price:", bookingResponse.data.totalPrice);
    
    // Wait for database propagation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 2: Check Customer Page
    console.log("\n📊 Checking Customer Page...");
    await page.goto("http://localhost:3000/crm/kunder", { waitUntil: "networkidle2" });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const customerPageContent = await page.evaluate(() => document.body.textContent || "");
    testResults.customerPageShows = customerPageContent.includes("Bruce Wayne") || 
                                   customerPageContent.includes("Batman") ||
                                   customerPageContent.includes("batman@gotham.com");
    
    console.log(testResults.customerPageShows ? "✅ Batman found on customer page" : "❌ Batman NOT found on customer page");
    await page.screenshot({ path: "batman-customer-page.png" });
    
    // Test 3: Check Offers Page
    console.log("\n📊 Checking Offers Page...");
    await page.goto("http://localhost:3000/crm/offerter", { waitUntil: "networkidle2" });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const offersPageContent = await page.evaluate(() => document.body.textContent || "");
    testResults.offersPageShows = offersPageContent.includes("Bruce Wayne") || 
                                 offersPageContent.includes("Batman") ||
                                 offersPageContent.includes("24890") ||
                                 offersPageContent.includes("24 890");
    
    console.log(testResults.offersPageShows ? "✅ Batman found on offers page" : "❌ Batman NOT found on offers page");
    await page.screenshot({ path: "batman-offers-page.png" });
    
    // Test 4: Check Leads Page
    console.log("\n📊 Checking Leads Page...");
    await page.goto("http://localhost:3000/crm/leads", { waitUntil: "networkidle2" });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const leadsPageContent = await page.evaluate(() => document.body.textContent || "");
    testResults.leadsPageShows = leadsPageContent.includes("Bruce Wayne") || 
                                leadsPageContent.includes("Batman") ||
                                leadsPageContent.includes("batman@gotham.com");
    
    console.log(testResults.leadsPageShows ? "✅ Batman found on leads page" : "❌ Batman NOT found on leads page");
    await page.screenshot({ path: "batman-leads-page.png" });
    
    // Test 5: Check Staff App
    console.log("\n📊 Checking Staff App...");
    await page.goto("http://localhost:3000/staff", { waitUntil: "domcontentloaded" });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Login to staff app
    await page.waitForSelector('[type="email"]');
    await page.type('[type="email"]', 'mustafa@nordflytt.se');
    await page.type('[type="password"]', 'nordflytt123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const staffPageContent = await page.evaluate(() => document.body.textContent || "");
    testResults.staffAppShows = staffPageContent.includes("Bruce Wayne") || 
                               staffPageContent.includes("Batman") ||
                               staffPageContent.includes("Wayne Manor") ||
                               staffPageContent.includes("Batcave");
    
    console.log(testResults.staffAppShows ? "✅ Batman job found in staff app" : "❌ Batman job NOT found in staff app");
    await page.screenshot({ path: "batman-staff-app.png" });
    
    // Final Report
    console.log("\n" + "=".repeat(60));
    console.log("📊 FINAL VERIFICATION REPORT");
    console.log("=".repeat(60));
    
    const testsRun = 5;
    const testsPassed = Object.values(testResults).filter(v => v === true).length - 1; // -1 for details object
    const successRate = (testsPassed / testsRun) * 100;
    
    console.log(`\n✅ Booking Created: ${testResults.bookingCreated ? "YES ✅" : "NO ❌"}`);
    console.log(`✅ Customer Page Shows Batman: ${testResults.customerPageShows ? "YES ✅" : "NO ❌"}`);
    console.log(`✅ Offers Page Shows Batman: ${testResults.offersPageShows ? "YES ✅" : "NO ❌"}`);
    console.log(`✅ Leads Page Shows Batman: ${testResults.leadsPageShows ? "YES ✅" : "NO ❌"}`);
    console.log(`✅ Staff App Shows Batman: ${testResults.staffAppShows ? "YES ✅" : "NO ❌"}`);
    
    console.log("\n" + "=".repeat(60));
    console.log(`🏁 OVERALL SUCCESS RATE: ${successRate.toFixed(0)}% (${testsPassed}/${testsRun} tests passed)`);
    console.log("=".repeat(60));
    
    if (successRate === 100) {
      console.log("\n🎉 ALL DATABASE INTEGRATION ISSUES FIXED!");
      console.log("Batman booking is visible across all CRM pages.");
    } else if (successRate >= 60) {
      console.log("\n⚠️  PARTIAL SUCCESS");
      console.log("Some pages still need fixing. Check screenshots for details.");
    } else {
      console.log("\n❌ CRITICAL ISSUES REMAIN");
      console.log("Database integration is still broken.");
    }
    
  } catch (error) {
    console.error("Test error:", error);
  } finally {
    console.log("\nKeeping browser open for inspection...");
    await new Promise(resolve => setTimeout(resolve, 30000));
    await browser.close();
  }
}

verifyBatmanFix();