// Lägg till handleJobEnd funktionen som saknas

const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, 'app/staff/dashboard/page.tsx');
let dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

// Hitta var vi ska lägga till handleJobEnd (efter handleJobStart)
const handleJobStartEnd = dashboardContent.indexOf('}, [selectedJobForStart, handleTimeWarnings])');

if (handleJobStartEnd > -1) {
  // Lägg till handleJobEnd funktionen direkt efter handleJobStart
  const insertPosition = handleJobStartEnd + '}, [selectedJobForStart, handleTimeWarnings])'.length;
  
  const handleJobEndFunction = `

  const handleJobEnd = async (jobId: string) => {
    console.log('Ending job:', jobId)
    const job = todaysJobs.find(j => j.id === jobId)
    if (!job) return
    
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
  
  dashboardContent = dashboardContent.slice(0, insertPosition) + handleJobEndFunction + dashboardContent.slice(insertPosition);
  
  // Nu måste vi också uppdatera mobile action bar för att använda handleJobEnd
  dashboardContent = dashboardContent.replace(
    /onClick={async \(\) => {\s*setLoadingJobId\(job\.id\)\s*setLoadingAction\('end'\)/g,
    `onClick={() => handleJobEnd(job.id)}`
  );
  
  fs.writeFileSync(dashboardPath, dashboardContent);
  console.log('✅ handleJobEnd tillagd och mobile action bar uppdaterad!');
} else {
  console.log('⚠️ Kunde inte hitta rätt position för handleJobEnd');
}

console.log('\n🎯 Nu ska allt fungera korrekt!');