const puppeteer = require('puppeteer')

async function checkJobStatusIssue() {
  console.log('🔍 Checking job status persistence issue...')
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: {
      width: 390,
      height: 844,
      isMobile: true,
      hasTouch: true
    }
  })
  
  try {
    const page = await browser.newPage()
    
    // Enable console logging
    page.on('console', msg => {
      const text = msg.text()
      if (text.includes('LoadJobs') || text.includes('status') || text.includes('services')) {
        console.log('Browser:', text)
      }
    })
    
    // Go directly to dashboard (assuming already logged in)
    console.log('\n📱 Loading dashboard...')
    await page.goto('http://localhost:3000/staff/dashboard', { 
      waitUntil: 'networkidle0' 
    })
    
    // Check if we need to login
    const needsLogin = await page.evaluate(() => {
      return window.location.pathname === '/staff'
    })
    
    if (needsLogin) {
      console.log('📱 Need to login first...')
      await page.type('input[type="email"]', 'sofia@nordflytt.se')
      await page.type('input[type="password"]', 'demo123')
      await page.click('button[type="submit"]')
      await page.waitForNavigation({ waitUntil: 'networkidle0' })
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Check localStorage data
    console.log('\n📊 Checking localStorage data...')
    const storageData = await page.evaluate(() => {
      const mockJobs = JSON.parse(localStorage.getItem('mockJobs') || '[]')
      const jobStatuses = JSON.parse(localStorage.getItem('mockJobStatuses') || '{}')
      const savedServices = JSON.parse(localStorage.getItem('staff_jobs_with_services') || '{}')
      
      // Get today's date
      const today = new Date().toISOString().split('T')[0]
      
      // Filter today's jobs
      const todaysJobs = mockJobs.filter(job => job.moveDate === today)
      
      return {
        todaysDate: today,
        totalJobs: mockJobs.length,
        todaysJobs: todaysJobs.map(job => ({
          id: job.id,
          customer: job.customerName,
          services: job.services,
          defaultStatus: job.status,
          persistedStatus: jobStatuses[job.id] || 'not set',
          hasServices: !!savedServices[job.id]
        })),
        allPersistedStatuses: jobStatuses
      }
    })
    
    console.log('Today:', storageData.todaysDate)
    console.log('Total jobs in system:', storageData.totalJobs)
    console.log('Jobs for today:', storageData.todaysJobs.length)
    console.log('\nToday\'s jobs:')
    storageData.todaysJobs.forEach(job => {
      console.log(`\n- ${job.customer} (ID: ${job.id})`)
      console.log(`  Services: ${job.services.join(', ')}`)
      console.log(`  Default status: ${job.defaultStatus}`)
      console.log(`  Persisted status: ${job.persistedStatus}`)
      console.log(`  Has added services: ${job.hasServices}`)
    })
    
    console.log('\nAll persisted statuses:', storageData.allPersistedStatuses)
    
    // Check what's displayed on screen
    console.log('\n📱 Checking displayed jobs...')
    const displayedJobs = await page.evaluate(() => {
      const jobs = []
      const cards = document.querySelectorAll('[class*="card"]')
      
      cards.forEach(card => {
        const customerName = card.querySelector('h3')?.textContent || 
                           card.querySelector('[class*="text-lg"]')?.textContent ||
                           card.querySelector('[class*="font-medium"]')?.textContent
        
        if (customerName && !customerName.includes('Dashboard')) {
          const badges = card.querySelectorAll('[class*="badge"]')
          const buttons = card.querySelectorAll('button')
          
          const job = {
            customer: customerName,
            badges: Array.from(badges).map(b => b.textContent),
            buttons: Array.from(buttons).map(b => b.textContent?.trim()).filter(Boolean),
            cardText: card.textContent
          }
          
          // Check for specific status indicators
          if (card.textContent?.includes('Pågående')) {
            job.showsAsPending = true
          }
          
          jobs.push(job)
        }
      })
      
      return jobs
    })
    
    console.log('\nDisplayed jobs:')
    displayedJobs.forEach(job => {
      console.log(`\n- ${job.customer}`)
      console.log(`  Badges: ${job.badges.join(', ') || 'none'}`)
      console.log(`  Buttons: ${job.buttons.join(', ') || 'none'}`)
      console.log(`  Shows as pending: ${job.showsAsPending || false}`)
    })
    
    // Take screenshot
    await page.screenshot({ 
      path: 'current-job-status.png',
      fullPage: true 
    })
    console.log('\n📸 Screenshot saved: current-job-status.png')
    
    // Fix suggestion
    console.log('\n💡 To fix persisted status issues, run this in console:')
    console.log('localStorage.removeItem("mockJobStatuses")')
    console.log('location.reload()')
    
    // Try to fix automatically
    console.log('\n🔧 Attempting to fix status issues...')
    await page.evaluate(() => {
      // Clear only job statuses, keep other data
      localStorage.removeItem('mockJobStatuses')
      console.log('Cleared mockJobStatuses from localStorage')
    })
    
    // Reload to see the fix
    await page.reload({ waitUntil: 'networkidle0' })
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    await page.screenshot({ 
      path: 'fixed-job-status.png',
      fullPage: true 
    })
    console.log('📸 Fixed state screenshot: fixed-job-status.png')
    
    console.log('\n✅ Test complete!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await browser.close()
  }
}

checkJobStatusIssue()