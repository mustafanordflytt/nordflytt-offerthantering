// Fixa ErrorBoundary import och syntax

const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, 'app/staff/dashboard/page.tsx');
let content = fs.readFileSync(dashboardPath, 'utf8');

// 1. Ta bort ErrorBoundary från return statement
content = content.replace(
  /return \(\s*<ErrorBoundary>\s*<div className="min-h-screen bg-gray-50 touch-friendly">/,
  'return (\n    <div className="min-h-screen bg-gray-50 touch-friendly">'
);

// 2. Ta bort closing ErrorBoundary tag (om den finns)
// Först, hitta sista </div> och kolla om det finns </ErrorBoundary> efter
const lastDivIndex = content.lastIndexOf('</div>');
if (lastDivIndex > -1) {
  const afterLastDiv = content.substring(lastDivIndex);
  if (afterLastDiv.includes('</ErrorBoundary>')) {
    content = content.replace(/(<\/div>\s*<\/ErrorBoundary>\s*)$/, '</div>\n');
  }
}

// 3. Säkerställ att filen slutar korrekt
content = content.trimEnd() + '\n';

fs.writeFileSync(dashboardPath, content);

console.log('✅ ErrorBoundary syntax fixad!');
console.log('');
console.log('Vad som fixades:');
console.log('1. Tog bort ErrorBoundary wrapper från return statement');
console.log('2. Tog bort matchande closing tag om den fanns');
console.log('');
console.log('🔄 Servern kompilerar om automatiskt...');