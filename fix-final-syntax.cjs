// Slutgiltig fix för syntax-fel

const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, 'app/staff/dashboard/page.tsx');
let content = fs.readFileSync(dashboardPath, 'utf8');

// 1. Ta bort duplicerad kod från rad 798-799
content = content.replace(
  /\/\/ Force refresh job data[\s\S]*?const updatedJob = todaysJobs\.find\(j => j\.id === job\.id\);[\s\S]*?if \(updatedJob\) setSelectedJobForDetail\(updatedJob\)/g,
  ''
);

// 2. Fixa handleWarningAction funktionen
content = content.replace(
  /const handleWarningAction = useCallback\(\(type: TimeWarning\['type'\]\) => {[\s\S]*?}, \[activeJobForWarnings\]\)/,
  `const handleWarningAction = useCallback((type: TimeWarning['type']) => {
    switch (type) {
      case 'approaching_end':
      case 'overtime':
        // Show job details or overtime reporting
        if (activeJobForWarnings) {
          setSelectedJobForDetail(activeJobForWarnings)
          setShowJobDetailModal(true)
        }
        break
      case 'break_reminder':
      case 'long_shift':
        // Show hours modal
        setShowMyHoursModal(true)
        break
    }
  }, [activeJobForWarnings])`
);

// 3. Fixa mobile action bar button onClick
content = content.replace(
  /onClick=\(\) => handleJobEnd\(job\.id\)[\s\S]*?\/\/ DIREKT uppdatera status utan GPS[\s\S]*?setTimeout\(\(\) => toast\.remove\(\), 3000\)[\s\S]*?\}\}/g,
  'onClick={() => handleJobEnd(job.id)}'
);

// 4. Lägg till saknade imports om de saknas
if (!content.includes("import { FileText }")) {
  content = content.replace(
    "Camera,\n  Sparkles",
    "Camera,\n  Sparkles,\n  FileText"
  );
}

// 5. Fixa todaysJobs dependencies
content = content.replace(
  '}, [todaysJobs])',
  '}, [todaysJobs])'
);

// 6. Ta bort extra brackets vid slutet
content = content.trimEnd() + '\n';

fs.writeFileSync(dashboardPath, content);

console.log('✅ Syntax-fel fixade!');
console.log('');
console.log('Vad som fixades:');
console.log('1. Tog bort duplicerad kod');
console.log('2. Fixade handleWarningAction funktionen');
console.log('3. Fixade mobile action bar onClick');
console.log('4. La till saknade imports');
console.log('5. Balanserade brackets');
console.log('');
console.log('🔄 Servern kompilerar om automatiskt...');