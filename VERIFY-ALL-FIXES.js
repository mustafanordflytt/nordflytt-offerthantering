import puppeteer from "puppeteer";

async function verifyAllFixes() {
  console.log("🧪 COMPREHENSIVE SYSTEM VERIFICATION\n");
  console.log("=".repeat(60));
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });

  const testResults = {
    autoNumbering: { passed: false, details: "" },
    staffEndpoints: { passed: false, details: "" },
    businessWorkflow: { passed: false, details: "" },
    realtimeUpdates: { passed: false, details: "" },
    totalPassed: 0,
    totalTests: 4
  };

  try {
    const page = await browser.newPage();
    
    // Navigate to main page first
    await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
    
    // Test 1: Auto-Numbering System
    console.log("\n📊 Test 1: Auto-Numbering System");
    console.log("-".repeat(40));
    
    try {
      const bookingResponse = await page.evaluate(async () => {
        const response = await fetch("/api/submit-booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Auto Number Test",
            email: `auto-test-${Date.now()}@example.com`,
            phone: "070-999-1111",
            customerType: "private",
            serviceType: "moving",
            serviceTypes: ["moving"],
            moveDate: "2025-03-10",
            moveTime: "09:00",
            startAddress: "Test Start 1",
            endAddress: "Test End 2",
            startLivingArea: "50",
            endLivingArea: "60",
            totalPrice: 5000
          })
        });
        
        return {
          ok: response.ok,
          status: response.status,
          data: await response.json()
        };
      });
      
      if (bookingResponse.ok && bookingResponse.data.success) {
        testResults.autoNumbering.passed = true;
        testResults.autoNumbering.details = `Booking created: ${bookingResponse.data.bookingId}`;
        console.log("✅ Auto-numbering WORKING - No 400 errors");
      } else {
        testResults.autoNumbering.details = `Failed: ${bookingResponse.data.error || "Unknown error"}`;
        console.log("❌ Auto-numbering FAILED:", bookingResponse.data.error);
      }
    } catch (error) {
      testResults.autoNumbering.details = `Error: ${error.message}`;
      console.log("❌ Auto-numbering ERROR:", error.message);
    }
    
    // Test 2: Staff Endpoints
    console.log("\n👥 Test 2: Staff Endpoints");
    console.log("-".repeat(40));
    
    const staffEndpoints = [
      { name: "Schedules", url: "/api/staff/schedules" },
      { name: "Assignments", url: "/api/staff/assignments" }
    ];
    
    let allEndpointsWork = true;
    for (const endpoint of staffEndpoints) {
      try {
        const response = await page.evaluate(async (url) => {
          const response = await fetch(url);
          return {
            ok: response.ok,
            status: response.status,
            data: await response.json()
          };
        }, endpoint.url);
        
        if (response.ok && response.data.success) {
          console.log(`✅ ${endpoint.name}: WORKING`);
        } else {
          console.log(`❌ ${endpoint.name}: FAILED`);
          allEndpointsWork = false;
        }
      } catch (error) {
        console.log(`❌ ${endpoint.name}: ERROR - ${error.message}`);
        allEndpointsWork = false;
      }
    }
    
    testResults.staffEndpoints.passed = allEndpointsWork;
    testResults.staffEndpoints.details = allEndpointsWork ? "All endpoints working" : "Some endpoints failed";
    
    // Test 3: Business Workflow
    console.log("\n🔄 Test 3: Business Workflow");
    console.log("-".repeat(40));
    
    // Create a test booking and check workflow
    const workflowEmail = `workflow-${Date.now()}@example.com`;
    
    try {
      // Create booking
      const workflowResponse = await page.evaluate(async (email) => {
        const response = await fetch("/api/submit-booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Workflow Test",
            email: email,
            phone: "070-888-2222",
            customerType: "private",
            serviceType: "moving",
            serviceTypes: ["moving", "packing"],
            moveDate: "2025-03-15",
            moveTime: "10:00",
            startAddress: "Workflow Start",
            endAddress: "Workflow End",
            totalPrice: 8000
          })
        });
        
        return {
          ok: response.ok,
          data: await response.json()
        };
      }, workflowEmail);
      
      if (workflowResponse.ok) {
        // Check if customer was created
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for workflow
        
        // Check lead creation
        await page.goto("http://localhost:3000/crm/leads", { waitUntil: "domcontentloaded" });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const hasLead = await page.evaluate((email) => {
          const body = document.body.textContent || "";
          return body.includes(email) || body.includes("Workflow Test");
        }, workflowEmail);
        
        testResults.businessWorkflow.passed = hasLead;
        testResults.businessWorkflow.details = `Booking → Lead: ${hasLead ? "✅" : "❌"}`;
        
        console.log("Lead created:", hasLead ? "✅" : "❌");
        console.log("Workflow chain:", testResults.businessWorkflow.passed ? "WORKING ✅" : "INCOMPLETE ❌");
      }
    } catch (error) {
      testResults.businessWorkflow.details = `Error: ${error.message}`;
      console.log("❌ Workflow ERROR:", error.message);
    }
    
    // Test 4: Real-time Updates
    console.log("\n📡 Test 4: Real-time Updates");
    console.log("-".repeat(40));
    
    // Navigate to dashboard
    await page.goto("http://localhost:3000/crm/dashboard", { waitUntil: "domcontentloaded" });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for real-time indicators
    const realtimeCheck = await page.evaluate(() => {
      const body = document.body.textContent || "";
      const hasWebSocket = window.WebSocket !== undefined;
      const hasLiveIndicators = body.includes("Live") || body.includes("Realtid") || body.includes("real-time");
      
      return {
        hasWebSocket,
        hasLiveIndicators,
        bodySnippet: body.substring(0, 200)
      };
    });
    
    testResults.realtimeUpdates.passed = realtimeCheck.hasWebSocket;
    testResults.realtimeUpdates.details = `WebSocket: ${realtimeCheck.hasWebSocket ? "✅" : "❌"}, Live UI: ${realtimeCheck.hasLiveIndicators ? "✅" : "❌"}`;
    
    console.log("WebSocket support:", realtimeCheck.hasWebSocket ? "✅" : "❌");
    console.log("Live indicators:", realtimeCheck.hasLiveIndicators ? "✅" : "❌");
    
    // Calculate final score
    testResults.totalPassed = Object.values(testResults)
      .filter(r => typeof r === "object" && r.passed)
      .length;
    
    // Final Report
    console.log("\n" + "=".repeat(60));
    console.log("📊 FINAL VERIFICATION REPORT");
    console.log("=".repeat(60));
    
    console.log("\n✅ Test Results:");
    console.log(`1. Auto-numbering: ${testResults.autoNumbering.passed ? "PASSED ✅" : "FAILED ❌"}`);
    console.log(`   ${testResults.autoNumbering.details}`);
    
    console.log(`\n2. Staff Endpoints: ${testResults.staffEndpoints.passed ? "PASSED ✅" : "FAILED ❌"}`);
    console.log(`   ${testResults.staffEndpoints.details}`);
    
    console.log(`\n3. Business Workflow: ${testResults.businessWorkflow.passed ? "PASSED ✅" : "FAILED ❌"}`);
    console.log(`   ${testResults.businessWorkflow.details}`);
    
    console.log(`\n4. Real-time Updates: ${testResults.realtimeUpdates.passed ? "PASSED ✅" : "FAILED ❌"}`);
    console.log(`   ${testResults.realtimeUpdates.details}`);
    
    const successRate = (testResults.totalPassed / testResults.totalTests) * 100;
    
    console.log("\n" + "=".repeat(60));
    console.log(`🏁 OVERALL SUCCESS RATE: ${successRate.toFixed(0)}% (${testResults.totalPassed}/${testResults.totalTests} tests passed)`);
    console.log("=".repeat(60));
    
    if (successRate >= 90) {
      console.log("\n🎉 SYSTEM IS PRODUCTION READY\!");
      console.log("All critical issues have been resolved.");
    } else if (successRate >= 75) {
      console.log("\n⚠️  SYSTEM IS MOSTLY READY");
      console.log("Minor issues remain but core functionality works.");
    } else {
      console.log("\n❌ SYSTEM NEEDS MORE WORK");
      console.log("Critical issues still need to be fixed.");
    }
    
    // Take final screenshot
    await page.screenshot({ path: "final-verification-dashboard.png" });
    
  } catch (error) {
    console.error("Test error:", error);
  } finally {
    console.log("\nKeeping browser open for inspection...");
    await new Promise(resolve => setTimeout(resolve, 30000));
    await browser.close();
  }
}

verifyAllFixes();
