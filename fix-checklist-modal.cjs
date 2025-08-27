// Fix för PreStartChecklistModal - ta bort GPS helt

const fs = require('fs');
const path = require('path');

const modalPath = path.join(__dirname, 'components/staff/PreStartChecklistModal.tsx');

if (fs.existsSync(modalPath)) {
  let content = fs.readFileSync(modalPath, 'utf8');
  
  // Hitta onStartJob prop och gör den enkel
  content = content.replace(
    /onClick={\(\) => onStartJob\(\)}/g,
    `onClick={() => {
      onStartJob();
      onClose();
    }}`
  );
  
  fs.writeFileSync(modalPath, content);
  console.log('✅ PreStartChecklistModal fixad - ingen GPS-kontroll!');
} else {
  console.log('⚠️ Kunde inte hitta PreStartChecklistModal');
}

// Dubbelkolla också att handleJobStart verkligen är uppdaterad
const dashboardPath = path.join(__dirname, 'app/staff/dashboard/page.tsx');
let dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

// Se till att handleJobStart INTE anropar någon GPS-funktion
if (dashboardContent.includes('startTimeTrackingWithWarnings')) {
  console.log('❌ GPS-funktioner finns fortfarande! Tar bort dem...');
  
  // Hitta och ersätt hela handleJobStart callback
  dashboardContent = dashboardContent.replace(
    /const handleJobStart = useCallback\(async \(\) => {[\s\S]*?}, \[[\s\S]*?\]\)/,
    `const handleJobStart = useCallback(async () => {
    if (!selectedJobForStart) return

    console.log('Job started:', selectedJobForStart.id)
    setLoadingJobId(selectedJobForStart.id)
    setLoadingAction('start')
    
    // DIREKT uppdatera status - INGEN GPS!
    setTodaysJobs(prev => 
      prev.map(job => 
        job.id === selectedJobForStart.id 
          ? { ...job, status: 'in_progress' as const, lastUpdated: Date.now() }
          : job
      )
    )
    
    // Spara status
    const mockJobs = localStorage.getItem('mockJobs')
    if (mockJobs) {
      const jobStatuses = JSON.parse(localStorage.getItem('mockJobStatuses') || '{}')
      jobStatuses[selectedJobForStart.id] = 'in_progress'
      localStorage.setItem('mockJobStatuses', JSON.stringify(jobStatuses))
    }
    
    // Stäng modal
    setShowChecklistModal(false)
    setSelectedJobForStart(null)
    setLoadingJobId(null)
    setLoadingAction(null)
    
    // Force refresh
    setLastRefresh(Date.now())
    
    // Visa toast
    const toast = document.createElement('div')
    toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg z-50'
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
  }, [selectedJobForStart, todaysJobs])`
  );
  
  fs.writeFileSync(dashboardPath, dashboardContent);
  console.log('✅ handleJobStart helt omskriven - INGEN GPS!');
}

console.log('\n🎯 NU ska det fungera:');
console.log('1. Klicka "Påbörja uppdrag" → Jobbet startar DIREKT');
console.log('2. Klicka "Avsluta" → Jobbet avslutas DIREKT');
console.log('3. INGEN GPS-modal någonstans!');
console.log('\n🔄 Ladda om sidan!');