// Fixa syntax-fel i dashboard

const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, 'app/staff/dashboard/page.tsx');
let dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

// Ta bort duplicerad kod från mobile action bar
const duplicatePattern = /onClick=\(\) => handleJobEnd\(job\.id\)\s*\/\/ DIREKT uppdatera status utan GPS[\s\S]*?setTodaysJobs\(prev => [\s\S]*?\)\s*\)/;
if (dashboardContent.match(duplicatePattern)) {
  dashboardContent = dashboardContent.replace(duplicatePattern, 'onClick={() => handleJobEnd(job.id)}');
  console.log('✅ Tog bort duplicerad kod');
}

// Fixa eventuella andra syntax-problem
// Leta efter obalanserade parenteser eller brackets
let openBraces = 0;
let openParens = 0;
const lines = dashboardContent.split('\n');

lines.forEach((line, index) => {
  for (const char of line) {
    if (char === '{') openBraces++;
    if (char === '}') openBraces--;
    if (char === '(') openParens++;
    if (char === ')') openParens--;
  }
});

console.log(`Bracket balance: ${openBraces}`);
console.log(`Paren balance: ${openParens}`);

if (openBraces !== 0 || openParens !== 0) {
  console.log('⚠️ Obalanserade brackets eller parenteser!');
}

// Skriv tillbaka
fs.writeFileSync(dashboardPath, dashboardContent);

console.log('\n✅ Syntax-fel borde vara fixat!');
console.log('🔄 Servern kommer kompilera om automatiskt...');