const puppeteer = require('puppeteer')

async function testJobStatusLogic() {
  console.log('🧪 Testing job status logic and UX flow...')
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    defaultViewport: {
      width: 1200,
      height: 800
    }
  })
  
  try {
    const page = await browser.newPage()
    
    // Enable console logging
    page.on('console', msg => {
      const text = msg.text()
      if (text.includes('[LoadJobs]') || text.includes('status') || text.includes('Status')) {
        console.log('Console:', text)
      }
    })
    
    // Step 1: Clear localStorage to start fresh
    console.log('\n📱 Step 1: Clearing localStorage...')
    await page.goto('http://localhost:3000/staff', { waitUntil: 'networkidle0' })
    await page.evaluate(() => {
      localStorage.clear()
      console.log('LocalStorage cleared')
    })
    
    // Step 2: Login
    console.log('\n📱 Step 2: Logging in as Sofia...')
    await page.type('input[type="email"]', 'sofia@nordflytt.se')
    await page.type('input[type="password"]', 'demo123')
    await page.click('button[type="submit"]')
    
    // Wait for navigation to dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle0' })
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Step 3: Check initial job status
    console.log('\n📱 Step 3: Checking initial job statuses...')
    const initialStatuses = await page.evaluate(() => {
      const jobs = []
      const cards = document.querySelectorAll('[class*="card"]')
      
      cards.forEach((card, index) => {
        const customerName = card.querySelector('[class*="font-medium"]')?.textContent
        const statusBadge = card.querySelector('[class*="badge"]')
        const buttons = card.querySelectorAll('button')
        
        let actionButton = null
        buttons.forEach(btn => {
          const text = btn.textContent || ''
          if (text.includes('Påbörja') || text.includes('Foto') || text.includes('Avsluta')) {
            actionButton = text
          }
        })
        
        if (customerName && customerName !== 'Sofia Lindqvist') {
          jobs.push({
            index,
            customer: customerName,
            statusBadge: statusBadge?.textContent || 'No badge',
            statusColor: statusBadge?.className || '',
            actionButton: actionButton || 'No action button',
            hasStartButton: !!Array.from(buttons).find(b => b.textContent?.includes('Påbörja'))
          })
        }
      })
      
      // Also check localStorage
      const mockJobs = JSON.parse(localStorage.getItem('mockJobs') || '[]')
      const jobStatuses = JSON.parse(localStorage.getItem('mockJobStatuses') || '{}')
      
      console.log('Mock jobs from localStorage:', mockJobs.map(j => ({ id: j.id, name: j.customerName, status: j.status })))
      console.log('Job statuses from localStorage:', jobStatuses)
      
      return { cards: jobs, localStorage: { mockJobs, jobStatuses } }
    })
    
    console.log('\n📊 Initial job states:')
    initialStatuses.cards.forEach(job => {
      console.log(`- ${job.customer}:`)
      console.log(`  Status badge: ${job.statusBadge}`)
      console.log(`  Action button: ${job.actionButton}`)
      console.log(`  Has start button: ${job.hasStartButton}`)
    })
    
    // Step 4: Find Flytthjälp Anna Holm job
    console.log('\n📱 Step 4: Finding Flytthjälp Anna Holm job...')
    const annaJob = await page.evaluate(() => {
      const cards = document.querySelectorAll('[class*="card"]')
      let annaCard = null
      let annaIndex = -1
      
      cards.forEach((card, index) => {
        const text = card.textContent || ''
        if (text.includes('Anna Holm') && text.includes('Flytthjälp')) {
          annaCard = card
          annaIndex = index
        }
      })
      
      if (annaCard) {
        // Get detailed info
        const badge = annaCard.querySelector('[class*="badge"]')
        const buttons = annaCard.querySelectorAll('button')
        const buttonTexts = Array.from(buttons).map(b => b.textContent)
        
        return {
          found: true,
          index: annaIndex,
          badgeText: badge?.textContent,
          badgeClasses: badge?.className,
          buttons: buttonTexts,
          fullText: annaCard.textContent
        }
      }
      
      return { found: false }
    })
    
    if (!annaJob.found) {
      console.log('❌ Could not find Anna Holm job!')
      return
    }
    
    console.log('\n📊 Anna Holm job details:')
    console.log('Badge:', annaJob.badgeText)
    console.log('Badge classes:', annaJob.badgeClasses)
    console.log('Buttons:', annaJob.buttons)
    
    // Step 5: Check if job shows as "pågående" without being started
    console.log('\n📱 Step 5: Analyzing job status issue...')
    const statusAnalysis = await page.evaluate(() => {
      // Check localStorage for any persisted statuses
      const jobStatuses = JSON.parse(localStorage.getItem('mockJobStatuses') || '{}')
      const mockJobs = JSON.parse(localStorage.getItem('mockJobs') || '[]')
      
      // Find Anna Holm job
      const annaJob = mockJobs.find(j => j.customerName === 'Anna Holm')
      
      return {
        annaJobId: annaJob?.id,
        annaJobStatus: annaJob?.status,
        persistedStatus: annaJob ? jobStatuses[annaJob.id] : null,
        allStatuses: jobStatuses
      }
    })
    
    console.log('\n🔍 Status Analysis:')
    console.log('Anna job ID:', statusAnalysis.annaJobId)
    console.log('Anna job status in mockJobs:', statusAnalysis.annaJobStatus)
    console.log('Persisted status for Anna:', statusAnalysis.persistedStatus)
    console.log('All persisted statuses:', statusAnalysis.allStatuses)
    
    // Step 6: Take screenshot of current state
    await page.screenshot({ 
      path: 'job-status-issue.png',
      fullPage: true 
    })
    console.log('\n📸 Screenshot saved: job-status-issue.png')
    
    // Step 7: Try to click on the job card
    console.log('\n📱 Step 7: Clicking on Anna Holm job card...')
    const jobClicked = await page.evaluate(() => {
      const cards = document.querySelectorAll('[class*="card"]')
      let clicked = false
      
      cards.forEach(card => {
        if (card.textContent?.includes('Anna Holm')) {
          card.click()
          clicked = true
        }
      })
      
      return clicked
    })
    
    if (jobClicked) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Check if modal opened
      const modalInfo = await page.evaluate(() => {
        const modal = document.querySelector('[role="dialog"]')
        if (modal) {
          return {
            hasModal: true,
            modalTitle: modal.querySelector('h2')?.textContent,
            modalContent: modal.textContent?.substring(0, 200)
          }
        }
        return { hasModal: false }
      })
      
      console.log('\n📊 Modal info:', modalInfo)
      
      if (modalInfo.hasModal) {
        await page.screenshot({ 
          path: 'job-modal.png',
          fullPage: true 
        })
        console.log('📸 Modal screenshot saved: job-modal.png')
      }
    }
    
    // Step 8: Fix the status if needed
    console.log('\n📱 Step 8: Fixing job status...')
    const fixApplied = await page.evaluate(() => {
      const jobStatuses = JSON.parse(localStorage.getItem('mockJobStatuses') || '{}')
      const mockJobs = JSON.parse(localStorage.getItem('mockJobs') || '[]')
      
      // Find Anna Holm job
      const annaJob = mockJobs.find(j => j.customerName === 'Anna Holm')
      
      if (annaJob && jobStatuses[annaJob.id] === 'in_progress') {
        // Reset to upcoming
        delete jobStatuses[annaJob.id]
        localStorage.setItem('mockJobStatuses', JSON.stringify(jobStatuses))
        console.log('Fixed: Reset Anna Holm job status to upcoming')
        return true
      }
      
      return false
    })
    
    if (fixApplied) {
      console.log('✅ Status fix applied, reloading page...')
      await page.reload({ waitUntil: 'networkidle0' })
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      await page.screenshot({ 
        path: 'job-status-fixed.png',
        fullPage: true 
      })
      console.log('📸 Fixed state screenshot: job-status-fixed.png')
    }
    
    console.log('\n✅ Test complete!')
    console.log('\n💡 Summary:')
    console.log('- Job statuses are persisted in localStorage')
    console.log('- If a job was previously started, it remains "in_progress"')
    console.log('- This persists even after page reload')
    console.log('- Fix: Clear mockJobStatuses from localStorage or reset specific job')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    try {
      await page.screenshot({ 
        path: 'test-error.png',
        fullPage: true 
      })
    } catch (screenshotError) {
      console.error('Could not take error screenshot:', screenshotError.message)
    }
  } finally {
    await browser.close()
  }
}

testJobStatusLogic()