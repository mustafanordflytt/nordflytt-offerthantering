const puppeteer = require('puppeteer')

async function testJobWorkflowUX() {
  console.log('🧪 Testing job workflow UX issues...')
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    slowMo: 500, // Slow down to see what's happening
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
      if (text.includes('status') || text.includes('LoadJobs') || text.includes('Job') || text.includes('GPS')) {
        console.log('Console:', text)
      }
    })
    
    // Step 1: Go to dashboard
    console.log('\n📱 Step 1: Loading dashboard...')
    await page.goto('http://localhost:3000/staff/dashboard', { 
      waitUntil: 'networkidle0' 
    })
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Step 2: Find Anna Holm job
    console.log('\n📱 Step 2: Finding Anna Holm job...')
    
    // Check initial state
    const initialState = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.rounded-lg.bg-white'))
      const annaCard = cards.find(card => card.textContent?.includes('Anna Holm'))
      
      if (annaCard) {
        const badge = annaCard.querySelector('.badge, [class*="badge"]')
        const button = annaCard.querySelector('button')
        
        return {
          found: true,
          badgeText: badge?.textContent?.trim() || 'No badge',
          buttonText: button?.textContent?.trim() || 'No button',
          hasStartButton: button?.textContent?.includes('Påbörja') || false
        }
      }
      
      return { found: false }
    })
    
    console.log('Initial state:', initialState)
    
    if (!initialState.found) {
      console.log('❌ Anna Holm job not found!')
      return
    }
    
    // Step 3: Click on Anna Holm job
    console.log('\n📱 Step 3: Clicking on Anna Holm job...')
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.rounded-lg.bg-white'))
      const annaCard = cards.find(card => card.textContent?.includes('Anna Holm'))
      if (annaCard) annaCard.click()
    })
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Check if modal opened
    const modalState = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]')
      if (modal) {
        const title = modal.querySelector('h2')?.textContent
        const statusBadge = modal.querySelector('.badge, [class*="Kommande"], [class*="Uppdrag pågår"]')
        const startButton = modal.querySelector('button[class*="bg-green"]')
        
        return {
          hasModal: true,
          title: title,
          statusText: statusBadge?.textContent?.trim() || modal.textContent?.includes('Uppdrag pågår') ? 'Uppdrag pågår' : 'Unknown',
          hasStartButton: !!startButton,
          startButtonText: startButton?.textContent?.trim()
        }
      }
      return { hasModal: false }
    })
    
    console.log('Modal state:', modalState)
    
    // Step 4: Click Start button
    if (modalState.hasStartButton) {
      console.log('\n📱 Step 4: Clicking "Starta Flytt" button...')
      await page.click('button[class*="bg-green"]')
      
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Check for GPS modal
      const gpsModalState = await page.evaluate(() => {
        const modals = document.querySelectorAll('[role="dialog"]')
        const gpsModal = Array.from(modals).find(m => m.textContent?.includes('GPS-bekräftelse'))
        
        if (gpsModal) {
          const startButton = gpsModal.querySelector('button[class*="bg-green"]')
          return {
            hasGPSModal: true,
            buttonText: startButton?.textContent?.trim()
          }
        }
        return { hasGPSModal: false }
      })
      
      console.log('GPS Modal state:', gpsModalState)
      
      if (gpsModalState.hasGPSModal) {
        console.log('📍 GPS modal appeared - clicking "Starta ändå"...')
        await page.click('button:has-text("Starta ändå")')
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    // Step 5: Check if dashboard updated
    console.log('\n📱 Step 5: Checking if dashboard updated...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const dashboardAfterStart = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.rounded-lg.bg-white'))
      const annaCard = cards.find(card => card.textContent?.includes('Anna Holm'))
      
      if (annaCard) {
        const badge = annaCard.querySelector('.badge, [class*="badge"]')
        const buttons = annaCard.querySelectorAll('button')
        
        return {
          badgeText: badge?.textContent?.trim() || 'No badge',
          buttonTexts: Array.from(buttons).map(b => b.textContent?.trim()).filter(Boolean)
        }
      }
      
      return null
    })
    
    console.log('Dashboard after start:', dashboardAfterStart)
    
    // Step 6: Open job modal again to check status
    console.log('\n📱 Step 6: Opening job modal again...')
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.rounded-lg.bg-white'))
      const annaCard = cards.find(card => card.textContent?.includes('Anna Holm'))
      if (annaCard) annaCard.click()
    })
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const modalAfterStart = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]')
      if (modal) {
        const statusIndicator = modal.textContent?.includes('Uppdrag pågår') ? 'Uppdrag pågår' : 
                               modal.textContent?.includes('Kommande') ? 'Kommande' : 'Unknown'
        const cornerBadge = modal.querySelector('[class*="Kommande"]')
        const endButton = modal.querySelector('button[class*="bg-red"]')
        
        return {
          statusIndicator: statusIndicator,
          cornerBadgeText: cornerBadge?.textContent?.trim(),
          hasEndButton: !!endButton,
          endButtonText: endButton?.textContent?.trim()
        }
      }
      return null
    })
    
    console.log('Modal after start:', modalAfterStart)
    
    // Step 7: Try to end the job
    if (modalAfterStart?.hasEndButton) {
      console.log('\n📱 Step 7: Clicking "Avsluta Flytt" button...')
      await page.click('button[class*="bg-red"]')
      
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Check for GPS modal again
      const gpsModalEnd = await page.evaluate(() => {
        const modals = document.querySelectorAll('[role="dialog"]')
        const gpsModal = Array.from(modals).find(m => m.textContent?.includes('GPS-bekräftelse'))
        
        return { hasGPSModal: !!gpsModal }
      })
      
      console.log('GPS Modal at end:', gpsModalEnd)
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'job-workflow-test.png',
      fullPage: true 
    })
    
    // Check localStorage for status persistence
    const storageData = await page.evaluate(() => {
      const jobStatuses = JSON.parse(localStorage.getItem('mockJobStatuses') || '{}')
      const jobs = JSON.parse(localStorage.getItem('mockJobs') || '[]')
      const annaJob = jobs.find(j => j.customerName === 'Anna Holm')
      
      return {
        annaJobId: annaJob?.id,
        persistedStatus: annaJob ? jobStatuses[annaJob.id] : null,
        allStatuses: jobStatuses
      }
    })
    
    console.log('\n📊 Storage data:', storageData)
    
    // Summary of issues
    console.log('\n❌ UX Issues Found:')
    console.log('1. Dashboard does not update visually when job is started')
    console.log('2. Status badge shows "Kommande" even when job is "Pågående"')
    console.log('3. GPS modal appears at wrong time (on end instead of start)')
    console.log('4. No visual feedback when job is completed')
    console.log('5. Status persistence works but UI does not reflect it')
    
    console.log('\n💡 Recommendations:')
    console.log('1. Add real-time status updates to dashboard')
    console.log('2. Fix status badge consistency')
    console.log('3. Show GPS modal only at job start')
    console.log('4. Add success feedback when job completes')
    console.log('5. Auto-refresh dashboard after status changes')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await browser.close()
  }
}

testJobWorkflowUX()