const puppeteer = require('puppeteer')

async function testJobDisplay() {
  console.log('🧪 Testing job display and status...')
  
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
      if (text.includes('mock') || text.includes('LoadJobs')) {
        console.log('Browser:', text)
      }
    })
    
    // Step 1: Login
    console.log('\n📱 Step 1: Logging in...')
    await page.goto('http://localhost:3000/staff', { waitUntil: 'networkidle0' })
    
    await page.type('input[type="email"]', 'sofia@nordflytt.se')
    await page.type('input[type="password"]', 'demo123')
    await page.click('button[type="submit"]')
    
    await page.waitForNavigation({ waitUntil: 'networkidle0' })
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Step 2: Check displayed jobs
    console.log('\n📱 Step 2: Checking displayed jobs...')
    const jobsInfo = await page.evaluate(() => {
      const jobs = []
      const cards = document.querySelectorAll('.rounded-lg.bg-white')
      
      cards.forEach((card, index) => {
        // Skip navigation cards
        if (card.textContent?.includes('Dashboard') || 
            card.textContent?.includes('Alla bokningar')) {
          return
        }
        
        const titleElement = card.querySelector('h3')
        const badgeElements = card.querySelectorAll('[class*="badge"]')
        const buttonElements = card.querySelectorAll('button')
        
        if (titleElement) {
          const job = {
            index: index,
            title: titleElement.textContent,
            badges: [],
            buttons: [],
            hasStartButton: false,
            statusIndicator: null
          }
          
          // Get all badges
          badgeElements.forEach(badge => {
            const text = badge.textContent?.trim()
            if (text) {
              job.badges.push({
                text: text,
                classes: badge.className
              })
            }
          })
          
          // Get all buttons
          buttonElements.forEach(button => {
            const text = button.textContent?.trim()
            if (text) {
              job.buttons.push(text)
              if (text.includes('Påbörja')) {
                job.hasStartButton = true
              }
            }
          })
          
          // Check for status indicators
          if (card.textContent?.includes('Pågående')) {
            job.statusIndicator = 'Pågående'
          } else if (card.textContent?.includes('Kommande')) {
            job.statusIndicator = 'Kommande'
          }
          
          jobs.push(job)
        }
      })
      
      return jobs
    })
    
    console.log(`\nFound ${jobsInfo.length} jobs:`)
    jobsInfo.forEach(job => {
      console.log(`\n📋 Job ${job.index}: ${job.title}`)
      console.log(`   Badges: ${job.badges.map(b => b.text).join(', ') || 'none'}`)
      console.log(`   Buttons: ${job.buttons.join(', ') || 'none'}`)
      console.log(`   Has start button: ${job.hasStartButton}`)
      console.log(`   Status indicator: ${job.statusIndicator || 'none'}`)
    })
    
    // Step 3: Find Anna Holm job specifically
    console.log('\n📱 Step 3: Looking for Anna Holm job...')
    const annaJobIndex = jobsInfo.findIndex(job => 
      job.title?.includes('Anna Holm')
    )
    
    if (annaJobIndex >= 0) {
      const annaJob = jobsInfo[annaJobIndex]
      console.log('\n✅ Found Anna Holm job:')
      console.log(`   Status: ${annaJob.statusIndicator || 'No status shown'}`)
      console.log(`   Should show: "Kommande" or start button`)
      console.log(`   Actually shows: ${annaJob.hasStartButton ? 'Start button ✅' : 'No start button ❌'}`)
      
      // Check if it incorrectly shows as "Pågående"
      if (annaJob.statusIndicator === 'Pågående' && annaJob.hasStartButton) {
        console.log('\n❌ BUG DETECTED: Job shows as "Pågående" but still has start button!')
      } else if (annaJob.statusIndicator === 'Pågående' && !annaJob.hasStartButton) {
        console.log('\n⚠️  Job shows as "Pågående" - was it previously started?')
      }
    } else {
      console.log('\n❌ Anna Holm job not found!')
    }
    
    // Step 4: Take screenshot
    await page.screenshot({ 
      path: 'job-display-test.png',
      fullPage: true 
    })
    console.log('\n📸 Screenshot saved: job-display-test.png')
    
    // Step 5: Check localStorage for persisted statuses
    console.log('\n📱 Step 4: Checking localStorage...')
    const storageInfo = await page.evaluate(() => {
      const mockJobs = JSON.parse(localStorage.getItem('mockJobs') || '[]')
      const jobStatuses = JSON.parse(localStorage.getItem('mockJobStatuses') || '{}')
      
      return {
        jobCount: mockJobs.length,
        jobs: mockJobs.map(j => ({
          id: j.id,
          name: j.customerName,
          defaultStatus: j.status,
          persistedStatus: jobStatuses[j.id]
        })),
        persistedStatuses: jobStatuses
      }
    })
    
    console.log(`\nLocalStorage info:`)
    console.log(`Total jobs: ${storageInfo.jobCount}`)
    storageInfo.jobs.forEach(job => {
      console.log(`- ${job.name}: default="${job.defaultStatus}", persisted="${job.persistedStatus || 'none'}"`)
    })
    
    if (Object.keys(storageInfo.persistedStatuses).length > 0) {
      console.log('\n⚠️  Found persisted statuses that might be causing issues!')
      console.log('To fix, run in browser console:')
      console.log('localStorage.removeItem("mockJobStatuses"); location.reload()')
    }
    
    console.log('\n✅ Test complete!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await browser.close()
  }
}

testJobDisplay()