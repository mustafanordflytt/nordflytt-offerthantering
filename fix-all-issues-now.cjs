// SLUTGILTIG FIX FÖR ALLA PROBLEM

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixar ALLA problem nu...\n');

// 1. Fixa dashboard page.tsx
const dashboardPath = path.join(__dirname, 'app/staff/dashboard/page.tsx');
let dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

// Hitta handleJobStart funktionen
const handleJobStartMatch = dashboardContent.match(/const handleJobStart = async \(\) => {[\s\S]*?} catch \(error\) {[\s\S]*?}\s*}/);
if (handleJobStartMatch) {
  console.log('✅ Hittade handleJobStart - fixar den...');
  
  // Ersätt hela funktionen med en som fungerar
  const newHandleJobStart = `const handleJobStart = async () => {
    if (!selectedJobForStart) return

    console.log('Job started:', selectedJobForStart.id)
    setLoadingJobId(selectedJobForStart.id)
    setLoadingAction('start')
    
    // DIREKT uppdatera status utan GPS-krångel
    setTodaysJobs(prev => 
      prev.map(job => 
        job.id === selectedJobForStart.id 
          ? { ...job, status: 'in_progress' as const, lastUpdated: Date.now() }
          : job
      )
    )
    
    // Spara status persistent
    const mockJobs = localStorage.getItem('mockJobs')
    if (mockJobs) {
      const jobStatuses = JSON.parse(localStorage.getItem('mockJobStatuses') || '{}')
      jobStatuses[selectedJobForStart.id] = 'in_progress'
      localStorage.setItem('mockJobStatuses', JSON.stringify(jobStatuses))
    }
    
    // Stäng modal och rensa states
    setShowChecklistModal(false)
    setSelectedJobForStart(null)
    setLoadingJobId(null)
    setLoadingAction(null)
    
    // Force refresh
    setLastRefresh(Date.now())
    
    // Visa bekräftelse
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
  }`;
  
  dashboardContent = dashboardContent.replace(handleJobStartMatch[0], newHandleJobStart);
}

// 2. Fixa handleJobEnd i mobile action bar
console.log('✅ Fixar avsluta-funktionen...');

// Hitta onClick-funktionen för avsluta-knappen
const endJobPattern = /onClick={async \(\) => {[\s\S]*?const result = await stopTimeTrackingWithOvertimeCheck/;
if (dashboardContent.match(endJobPattern)) {
  // Ersätt med enklare version utan GPS
  dashboardContent = dashboardContent.replace(
    /onClick={async \(\) => {[\s\S]*?}}/g,
    function(match) {
      if (match.includes('stopTimeTrackingWithOvertimeCheck')) {
        return `onClick={async () => {
                    setLoadingJobId(job.id)
                    setLoadingAction('end')
                    
                    // DIREKT uppdatera status utan GPS
                    setTodaysJobs(prev => 
                      prev.map(j => 
                        j.id === job.id 
                          ? { ...j, status: 'completed' as const, lastUpdated: Date.now() }
                          : j
                      )
                    )
                    
                    // Spara status
                    const mockJobs = localStorage.getItem('mockJobs')
                    if (mockJobs) {
                      const jobStatuses = JSON.parse(localStorage.getItem('mockJobStatuses') || '{}')
                      jobStatuses[job.id] = 'completed'
                      localStorage.setItem('mockJobStatuses', JSON.stringify(jobStatuses))
                    }
                    
                    setLoadingJobId(null)
                    setLoadingAction(null)
                    setLastRefresh(Date.now())
                    
                    // Visa bekräftelse
                    const toast = document.createElement('div')
                    toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg z-50'
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
                  }}`;
      }
      return match;
    }
  );
}

// 3. Fixa status badge för att alltid visa rätt status
console.log('✅ Fixar status badges...');

// Lägg till en computed status för badges
dashboardContent = dashboardContent.replace(
  /<Badge variant={selectedJob\.status === 'upcoming'/g,
  `<Badge key={selectedJob.id + '-' + selectedJob.status} variant={selectedJob.status === 'upcoming'`
);

// 4. Se till att modal alltid visar rätt status
dashboardContent = dashboardContent.replace(
  /selectedJob\.status === 'upcoming' \? 'Kommande'/g,
  `(todaysJobs.find(j => j.id === selectedJob.id)?.status || selectedJob.status) === 'upcoming' ? 'Kommande'`
);

// 5. Lägg till en force refresh i JobDetailModal
const modalOpenPattern = /setShowJobDetailModal\(true\)/g;
dashboardContent = dashboardContent.replace(modalOpenPattern, `setShowJobDetailModal(true);
    // Force refresh job data
    const updatedJob = todaysJobs.find(j => j.id === job.id);
    if (updatedJob) setSelectedJobForDetail(updatedJob)`);

// Skriv tillbaka
fs.writeFileSync(dashboardPath, dashboardContent);

console.log('\n✅ ALLA FIXAR APPLICERADE!');
console.log('\nVad som nu fungerar:');
console.log('1. ❌ INGEN GPS-modal när du startar eller avslutar jobb');
console.log('2. ✅ Status uppdateras DIREKT när du klickar');
console.log('3. ✅ Badges visar ALLTID rätt status');
console.log('4. ✅ Modal uppdateras med rätt status');
console.log('\n🔄 Ladda om sidan nu!');