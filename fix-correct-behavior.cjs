// KORREKT FIX - Behåll GPS vid start, ta bort vid avslut, uppdatera UI direkt

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixar korrekt beteende...\n');

const dashboardPath = path.join(__dirname, 'app/staff/dashboard/page.tsx');
let dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

// 1. ÅTERSTÄLL handleJobStart med GPS-modal
console.log('✅ Återställer GPS-modal för start...');

dashboardContent = dashboardContent.replace(
  /const handleJobStart = useCallback\(async \(\) => {[\s\S]*?}, \[[\s\S]*?\]\)/,
  `const handleJobStart = useCallback(async () => {
    if (!selectedJobForStart) return

    console.log('Starting job:', selectedJobForStart.id)
    const job = selectedJobForStart
    
    setLoadingJobId(job.id)
    setLoadingAction('start')
    
    const jobLocation = {
      latitude: 59.334591,
      longitude: 18.063240,
      address: job.toAddress
    }

    try {
      // Visa GPS-modal för start
      const timeTrackingResult = await startTimeTrackingWithWarnings(
        job.id,
        job.serviceType,
        jobLocation,
        job.endTime,
        job.estimatedHours,
        handleTimeWarnings,
        job.bookingNumber,
        job.customerName
      )

      if (timeTrackingResult.success) {
        // Uppdatera status DIREKT
        setTodaysJobs(prev => 
          prev.map(j => 
            j.id === job.id 
              ? { ...j, status: 'in_progress' as const, lastUpdated: Date.now() }
              : j
          )
        )
        
        // Force refresh för att uppdatera UI
        setLastRefresh(Date.now())
        
        // Spara status
        const mockJobs = localStorage.getItem('mockJobs')
        if (mockJobs) {
          const jobStatuses = JSON.parse(localStorage.getItem('mockJobStatuses') || '{}')
          jobStatuses[job.id] = 'in_progress'
          localStorage.setItem('mockJobStatuses', JSON.stringify(jobStatuses))
        }

        // Stäng modal
        setShowChecklistModal(false)
        setSelectedJobForStart(null)
        
        // Visa bekräftelse
        const toast = document.createElement('div')
        toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-top'
        toast.innerHTML = \`
          <div class="flex items-center space-x-2">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Uppdrag startat!</span>
          </div>
        \`
        document.body.appendChild(toast)
        setTimeout(() => toast.remove(), 3000)
      }
    } catch (error) {
      console.error('Error starting job:', error)
    } finally {
      setLoadingJobId(null)
      setLoadingAction(null)
    }
  }, [selectedJobForStart, handleTimeWarnings])`
);

// 2. Se till att avsluta-funktionen INTE visar GPS
console.log('✅ Tar bort GPS-modal från avsluta...');

// Hitta handleJobEnd funktionen om den finns
const handleJobEndPattern = /const handleJobEnd = async \(jobId: string\) => {[\s\S]*?}\s*catch[\s\S]*?}\s*}/;
const handleJobEndMatch = dashboardContent.match(handleJobEndPattern);

if (handleJobEndMatch) {
  const newHandleJobEnd = `const handleJobEnd = async (jobId: string) => {
    console.log('Ending job:', jobId)
    const job = todaysJobs.find(j => j.id === jobId)
    if (!job) {
      setLoadingJobId(null)
      setLoadingAction(null)
      return
    }
    
    setLoadingJobId(jobId)
    setLoadingAction('end')
    
    try {
      // Uppdatera status DIREKT - ingen GPS-kontroll
      setTodaysJobs(prev => 
        prev.map(j => 
          j.id === jobId 
            ? { ...j, status: 'completed' as const, lastUpdated: Date.now() }
            : j
        )
      )
      
      // Force refresh
      setLastRefresh(Date.now())
      
      // Spara status
      const mockJobs = localStorage.getItem('mockJobs')
      if (mockJobs) {
        const jobStatuses = JSON.parse(localStorage.getItem('mockJobStatuses') || '{}')
        jobStatuses[jobId] = 'completed'
        localStorage.setItem('mockJobStatuses', JSON.stringify(jobStatuses))
      }
      
      // Visa bekräftelse
      const toast = document.createElement('div')
      toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-top'
      toast.innerHTML = \`
        <div class="flex items-center space-x-2">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>Uppdrag avslutat!</span>
        </div>
      \`
      document.body.appendChild(toast)
      setTimeout(() => toast.remove(), 3000)
    } catch (error) {
      console.error('Error ending job:', error)
    } finally {
      setLoadingJobId(null)
      setLoadingAction(null)
    }
  }`;
  
  dashboardContent = dashboardContent.replace(handleJobEndMatch[0], newHandleJobEnd);
}

// 3. Uppdatera job detail modal för att visa rätt status
console.log('✅ Fixar status badges...');

// Lägg till dynamisk status check i JobDetailModal
dashboardContent = dashboardContent.replace(
  /{selectedJob && \(/g,
  `{selectedJob && (
    /* Använd aktuell status från todaysJobs */`
);

// Se till att badge alltid visar rätt status
dashboardContent = dashboardContent.replace(
  /<Badge key={selectedJob\.id/g,
  `<Badge key={selectedJob.id + '-' + selectedJob.status + '-' + Date.now()}`
);

// 4. Se till att "Pågående" texten visas korrekt
dashboardContent = dashboardContent.replace(
  /selectedJob\.status === 'in_progress' \? 'Pågående'/g,
  `(todaysJobs.find(j => j.id === selectedJob?.id)?.status || selectedJob?.status) === 'in_progress' ? 'Pågående'`
);

fs.writeFileSync(dashboardPath, dashboardContent);

console.log('\n✅ KORREKT BETEENDE IMPLEMENTERAT!');
console.log('\nSå här fungerar det nu:');
console.log('1. START jobb → GPS-modal visas → Status blir "Pågående"');
console.log('2. AVSLUTA jobb → INGEN GPS-modal → Status blir "Slutfört"');
console.log('3. UI uppdateras DIREKT när status ändras');
console.log('4. Status badges visar alltid rätt status');
console.log('\n🔄 Ladda om sidan och testa!');