// Fix för att lägga till loading states på knappar

const fs = require('fs');
const path = require('path');

// Läs dashboard-filen
const dashboardPath = path.join(__dirname, 'app/staff/dashboard/page.tsx');
let dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

// 1. Lägg till loading state för avsluta-knappen i mobile action bar
dashboardContent = dashboardContent.replace(
  `onClick={() => handleJobEnd(activeJob.id)}
                className="`,
  `onClick={() => handleJobEnd(activeJob.id)}
                disabled={loadingJobId === activeJob.id && loadingAction === 'end'}
                className="`
);

// 2. Lägg till spinner för avsluta-knappen
dashboardContent = dashboardContent.replace(
  `<PauseCircle className="h-5 w-5" />
                  Avsluta uppdrag`,
  `{loadingJobId === activeJob.id && loadingAction === 'end' ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      Avslutar...
                    </>
                  ) : (
                    <>
                      <PauseCircle className="h-5 w-5" />
                      Avsluta uppdrag
                    </>
                  )}`
);

// 3. Fixa status badge i job detail modal för att visa rätt status
dashboardContent = dashboardContent.replace(
  `<Badge variant={selectedJob.status === 'upcoming' ? 'secondary' : selectedJob.status === 'in_progress' ? 'default' : 'success'}>
                  {selectedJob.status === 'upcoming' ? 'Kommande' : selectedJob.status === 'in_progress' ? 'Pågående' : 'Slutförd'}
                </Badge>`,
  `<Badge 
                  key={selectedJob.status + '-' + Date.now()} 
                  variant={selectedJob.status === 'upcoming' ? 'secondary' : selectedJob.status === 'in_progress' ? 'default' : 'success'}
                >
                  {selectedJob.status === 'upcoming' ? 'Kommande' : selectedJob.status === 'in_progress' ? 'Pågående' : 'Slutförd'}
                </Badge>`
);

// 4. Uppdatera handleJobStart för att sätta loading state innan GPS-modal
dashboardContent = dashboardContent.replace(
  `const handleJobStart = async (jobId: string) => {
    console.log('Starting job:', jobId)
    const job = todaysJobs.find(j => j.id === jobId)
    if (!job) return`,
  `const handleJobStart = async (jobId: string) => {
    console.log('Starting job:', jobId)
    setLoadingJobId(jobId)
    setLoadingAction('start')
    
    const job = todaysJobs.find(j => j.id === jobId)
    if (!job) {
      setLoadingJobId(null)
      setLoadingAction(null)
      return
    }`
);

// 5. Uppdatera handleJobEnd för att sätta loading state
dashboardContent = dashboardContent.replace(
  `const handleJobEnd = async (jobId: string) => {
    console.log('Ending job:', jobId)
    const job = todaysJobs.find(j => j.id === jobId)
    if (!job) return`,
  `const handleJobEnd = async (jobId: string) => {
    console.log('Ending job:', jobId)
    setLoadingJobId(jobId)
    setLoadingAction('end')
    
    const job = todaysJobs.find(j => j.id === jobId)
    if (!job) {
      setLoadingJobId(null)
      setLoadingAction(null)
      return
    }`
);

// 6. Lägg till finally blocks för att rensa loading states
dashboardContent = dashboardContent.replace(
  /setLastRefresh\(Date\.now\(\)\)\s*}\s*catch \(error\)/g,
  `setLastRefresh(Date.now())
    } catch (error)`
);

// Lägg till finally blocks efter alla catch-satser i handleJobStart och handleJobEnd
dashboardContent = dashboardContent.replace(
  /console\.error\('Error starting job:', error\)\s*}/g,
  `console.error('Error starting job:', error)
    } finally {
      setLoadingJobId(null)
      setLoadingAction(null)
    }`
);

dashboardContent = dashboardContent.replace(
  /console\.error\('Error ending job:', error\)\s*}/g,
  `console.error('Error ending job:', error)
    } finally {
      setLoadingJobId(null)
      setLoadingAction(null)
    }`
);

// Skriv tillbaka filen
fs.writeFileSync(dashboardPath, dashboardContent);

console.log('✅ Loading states fixade för alla knappar!');
console.log('');
console.log('Följande har lagts till:');
console.log('- Loading state för avsluta-knappen i mobile action bar');
console.log('- Spinner animation när knappar laddas');
console.log('- Knappar inaktiveras under laddning');
console.log('- Loading states rensas i finally blocks');
console.log('- Status badge uppdateras med key för force re-render');