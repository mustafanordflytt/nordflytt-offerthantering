const puppeteer = require('puppeteer')

async function testStatusUpdates() {
  console.log('🧪 Testing status update visual feedback...')
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: false,
    defaultViewport: {
      width: 1400,
      height: 900
    }
  })
  
  try {
    const page = await browser.newPage()
    
    // Enable console logging
    page.on('console', msg => {
      const text = msg.text()
      if (text.includes('Refreshing jobs') || text.includes('status') || text.includes('[LoadJobs]')) {
        console.log('Browser:', text)
      }
    })
    
    // Go directly to dashboard (assuming you're already logged in)
    console.log('\n📱 Loading dashboard...')
    await page.goto('http://localhost:3000/staff/dashboard', { 
      waitUntil: 'networkidle0' 
    })
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'status-test-1-initial.png',
      fullPage: true 
    })
    console.log('📸 Initial state: status-test-1-initial.png')
    
    // Find and click first job
    console.log('\n📱 Finding first job...')
    const jobFound = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.rounded-lg'))
      const jobCard = cards.find(card => {
        const text = card.textContent || ''
        return text.includes('Flytt') && !text.includes('Dashboard')
      })
      
      if (jobCard) {
        console.log('Found job card:', jobCard.textContent?.substring(0, 100))
        jobCard.click()
        return true
      }
      return false
    })
    
    if (!jobFound) {
      console.log('❌ No job card found!')
      return
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Check modal and click start
    console.log('\n📱 Looking for start button...')
    const startClicked = await page.evaluate(() => {
      const startButton = document.querySelector('button[class*="bg-green"]')
      if (startButton && startButton.textContent?.includes('Starta')) {
        console.log('Found start button:', startButton.textContent)
        startButton.click()
        return true
      }
      return false
    })
    
    if (startClicked) {
      console.log('✅ Clicked start button')
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Handle GPS modal if it appears
      const gpsHandled = await page.evaluate(() => {
        const gpsButton = Array.from(document.querySelectorAll('button')).find(
          btn => btn.textContent?.includes('Starta ändå')
        )
        if (gpsButton) {
          console.log('GPS modal appeared - clicking "Starta ändå"')
          gpsButton.click()
          return true
        }
        return false
      })
      
      if (gpsHandled) {
        console.log('✅ Handled GPS modal')
      }
      
      // Wait for refresh
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Take screenshot after start
      await page.screenshot({ 
        path: 'status-test-2-after-start.png',
        fullPage: true 
      })
      console.log('📸 After start: status-test-2-after-start.png')
      
      // Check if dashboard updated
      const dashboardStatus = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.rounded-lg'))
        const results = []
        
        cards.forEach(card => {
          const badges = card.querySelectorAll('[class*="badge"]')
          const buttons = card.querySelectorAll('button')
          
          if (badges.length > 0 || buttons.length > 0) {
            results.push({
              badges: Array.from(badges).map(b => b.textContent),
              buttons: Array.from(buttons).map(b => b.textContent?.trim()).filter(Boolean)
            })
          }
        })
        
        return results
      })
      
      console.log('\n📊 Dashboard status after start:')
      dashboardStatus.forEach((item, index) => {
        if (item.badges.length > 0 || item.buttons.length > 0) {
          console.log(`Card ${index}:`)
          console.log('  Badges:', item.badges)
          console.log('  Buttons:', item.buttons)
        }
      })
      
      // Click job again to check modal status
      console.log('\n📱 Opening job modal again...')
      await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.rounded-lg'))
        const jobCard = cards.find(card => {
          const text = card.textContent || ''
          return text.includes('Flytt') && !text.includes('Dashboard')
        })
        if (jobCard) jobCard.click()
      })
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Check modal status
      const modalStatus = await page.evaluate(() => {
        const modal = document.querySelector('[role="dialog"]')
        if (modal) {
          const isPending = modal.textContent?.includes('Uppdrag pågår')
          const cornerBadge = modal.querySelector('[class*="Kommande"]')
          const endButton = modal.querySelector('button[class*="bg-red"]')
          
          return {
            showsPending: isPending,
            cornerBadgeText: cornerBadge?.textContent,
            hasEndButton: !!endButton
          }
        }
        return null
      })
      
      console.log('\n📊 Modal status check:')
      console.log('Shows "Uppdrag pågår":', modalStatus?.showsPending)
      console.log('Corner badge:', modalStatus?.cornerBadgeText)
      console.log('Has end button:', modalStatus?.hasEndButton)
      
      await page.screenshot({ 
        path: 'status-test-3-modal-check.png',
        fullPage: true 
      })
      console.log('📸 Modal check: status-test-3-modal-check.png')
    }
    
    console.log('\n✅ Test complete!')
    console.log('\nCheck the screenshots to verify:')
    console.log('1. Initial state shows correct status')
    console.log('2. After starting, dashboard updates immediately')
    console.log('3. Modal shows consistent status')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await browser.close()
  }
}

testStatusUpdates()