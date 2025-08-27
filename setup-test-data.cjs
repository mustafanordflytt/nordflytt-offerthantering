const puppeteer = require('puppeteer')

// Mock jobs data with proper dates
const getMockJobs = () => {
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0]
  
  return [
    {
      id: '1',
      bookingNumber: 'BK2024001',
      customerName: 'Anna Holm',
      customerPhone: '070-123 45 67',
      fromAddress: 'Vasagatan 10, Stockholm',
      toAddress: 'Kungsgatan 20, Stockholm',
      moveDate: today,
      moveTime: '09:00',
      endTime: '13:00',
      status: 'upcoming',
      estimatedHours: 4,
      teamMembers: ['Sofia Lindqvist', 'Marcus Johansson'],
      priority: 'high',
      distance: 3.5,
      serviceType: 'moving',
      services: ['Flytt', 'Flytthjälp', 'Packning'],
      specialRequirements: ['Piano', 'Ömtåliga föremål'],
      locationInfo: {
        doorCode: '1234',
        floor: 3,
        elevator: false,
        elevatorStatus: 'Ingen hiss',
        parkingDistance: 15,
        accessNotes: 'Ring på dörren'
      },
      customerNotes: 'Var försiktiga med pianot',
      equipment: ['Flyttkartonger', 'Bärselar'],
      volume: 35,
      boxCount: 25
    },
    {
      id: '2',
      bookingNumber: 'BK2024002',
      customerName: 'Erik Svensson',
      customerPhone: '070-234 56 78',
      fromAddress: 'Sveavägen 50, Stockholm',
      toAddress: 'Birger Jarlsgatan 100, Stockholm',
      moveDate: today,
      moveTime: '14:00',
      endTime: '18:00',
      status: 'upcoming',
      estimatedHours: 4,
      teamMembers: ['Sofia Lindqvist'],
      priority: 'medium',
      distance: 2.1,
      serviceType: 'moving',
      services: ['Flytt', 'Bärhjälp'],
      specialRequirements: [],
      locationInfo: {
        doorCode: '5678',
        floor: 2,
        elevator: true,
        elevatorStatus: 'Fungerar',
        parkingDistance: 5,
        accessNotes: ''
      },
      customerNotes: '',
      equipment: ['Flyttkartonger'],
      volume: 25,
      boxCount: 20
    },
    {
      id: '3',
      bookingNumber: 'BK2024003',
      customerName: 'Maria Andersson',
      customerPhone: '070-345 67 89',
      fromAddress: 'Hornsgatan 45, Stockholm',
      toAddress: 'Götgatan 78, Stockholm',
      moveDate: tomorrow,
      moveTime: '10:00',
      endTime: '14:00',
      status: 'upcoming',
      estimatedHours: 4,
      teamMembers: ['Sofia Lindqvist', 'Erik Nilsson'],
      priority: 'low',
      distance: 1.8,
      serviceType: 'moving',
      services: ['Flytt', 'Städning'],
      specialRequirements: ['Städning efter flytt'],
      locationInfo: {
        doorCode: '9012',
        floor: 4,
        elevator: true,
        elevatorStatus: 'Fungerar',
        parkingDistance: 10,
        accessNotes: 'Lastzon finns'
      },
      customerNotes: 'Städning ingår i priset',
      equipment: ['Flyttkartonger', 'Städutrustning'],
      volume: 30,
      boxCount: 15
    }
  ]
}

async function setupTestData() {
  console.log('🔧 Setting up test data...')
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: {
      width: 1200,
      height: 800
    }
  })
  
  try {
    const page = await browser.newPage()
    
    // Go to any page to set localStorage
    await page.goto('http://localhost:3000/staff', { waitUntil: 'networkidle0' })
    
    // Clear old data and set new mock jobs
    await page.evaluate((mockJobsData) => {
      // Clear all related localStorage
      localStorage.removeItem('mockJobs')
      localStorage.removeItem('mockJobStatuses')
      localStorage.removeItem('staff_jobs_with_services')
      
      // Set new mock jobs
      localStorage.setItem('mockJobs', JSON.stringify(mockJobsData))
      
      console.log('Test data set successfully!')
      console.log(`Added ${mockJobsData.length} mock jobs`)
      console.log('Jobs:', mockJobsData.map(j => `${j.customerName} - ${j.services.join(', ')}`))
    }, getMockJobs())
    
    console.log('✅ Test data setup complete!')
    console.log('\nNow you can:')
    console.log('1. Login with sofia@nordflytt.se / demo123')
    console.log('2. You should see 2 jobs for today')
    console.log('3. Anna Holm - Flytthjälp should show as "upcoming" (not "pågående")')
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-data-setup.png',
      fullPage: true 
    })
    console.log('\n📸 Screenshot saved: test-data-setup.png')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await browser.close()
  }
}

setupTestData()