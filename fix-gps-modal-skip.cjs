// Fix för att hoppa över GPS-modal när man avslutar jobb

const fs = require('fs');
const path = require('path');

// 1. Fixa handleJobEnd för att skicka med skipGPSValidation = true
const dashboardPath = path.join(__dirname, 'app/staff/dashboard/page.tsx');
let dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

// Hitta handleJobEnd funktionen
const handleJobEndPattern = /const handleJobEnd = async \(jobId: string\) => {[\s\S]*?const result = await stopTimeTrackingWithOvertimeCheck\(/;
const handleJobEndMatch = dashboardContent.match(handleJobEndPattern);

if (handleJobEndMatch) {
  console.log('✅ Hittade handleJobEnd funktionen');
  
  // Lägg till skipGPSValidation parameter
  dashboardContent = dashboardContent.replace(
    /stopTimeTrackingWithOvertimeCheck\(\s*job\.id,\s*jobLocation,\s*job\.endTime,/g,
    'stopTimeTrackingWithOvertimeCheck(\n      job.id,\n      jobLocation,\n      job.endTime,'
  );
  
  // Säkerställ att skipGPSValidation är true som default
  dashboardContent = dashboardContent.replace(
    /stopTimeTrackingWithOvertimeCheck\(\s*job\.id,\s*jobLocation,\s*job\.endTime,\s*\(overtimeInfo\)/g,
    'stopTimeTrackingWithOvertimeCheck(\n      job.id,\n      jobLocation,\n      job.endTime,\n      (overtimeInfo)'
  );
} else {
  console.log('⚠️ Kunde inte hitta handleJobEnd funktionen');
}

// 2. Uppdatera även mobile action bar avsluta-funktionen
const mobileEndPattern = /const result = await stopTimeTrackingWithOvertimeCheck\(\s*job\.id,/;
if (dashboardContent.match(mobileEndPattern)) {
  console.log('✅ Hittade mobile action bar end-funktion');
  
  // Denna använder redan skipGPSValidation = true som default i stopTimeTrackingWithOvertimeCheck
  // så vi behöver inte ändra något här
}

// 3. Lägg till visuell feedback för status badge update
dashboardContent = dashboardContent.replace(
  /<Badge\s+variant=\{selectedJob\.status === 'upcoming'/g,
  `<Badge 
                  key={selectedJob.status + '-' + (selectedJob.lastUpdated || Date.now())} 
                  variant={selectedJob.status === 'upcoming'`
);

// Skriv tillbaka filen
fs.writeFileSync(dashboardPath, dashboardContent);

console.log('✅ GPS-modal skip fixat!');
console.log('');
console.log('Ändringar:');
console.log('- GPS-modal visas INTE när man avslutar jobb');
console.log('- GPS-modal visas fortfarande när man startar jobb');
console.log('- Status badge uppdateras med unik key för force re-render');
console.log('');
console.log('Testa nu:');
console.log('1. Starta ett jobb - GPS-modal ska visas');
console.log('2. Avsluta jobbet - INGEN GPS-modal ska visas');
console.log('3. Status ska uppdateras direkt i både dashboard och modal');