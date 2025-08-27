// Fix syntax error i AddServiceModal.tsx

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/staff/components/AddServiceModal.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Hitta och ta bort den orphaned else-satsen
// Det verkar finnas ett syntaxfel runt rad 405 enligt servern

// Läs några rader runt problemområdet
const lines = content.split('\n');
console.log('Kontrollerar rader 400-410:');
for (let i = 399; i < 410 && i < lines.length; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

// Leta efter möjliga problem med brackets
let braceCount = 0;
let problemLine = -1;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Räkna öppnande och stängande brackets
  for (const char of line) {
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
  }
  
  // Kolla om vi har en orphaned else
  if (line.trim().startsWith('} else {') && braceCount < 0) {
    problemLine = i;
    console.log(`\n❌ Hittade möjlig orphaned else på rad ${i + 1}`);
  }
}

console.log(`\nTotal bracket balance: ${braceCount}`);

// Om vi har obalanserade brackets, försök fixa
if (braceCount !== 0) {
  console.log('\n⚠️ Brackets är obalanserade!');
  
  // Leta efter dubbla catch-satser eller liknande
  const catchPattern = /} catch \(error\) {/g;
  const catches = content.match(catchPattern);
  console.log(`Hittade ${catches ? catches.length : 0} catch-satser`);
  
  // Kolla om det finns någon extra } före rad 405
  const beforeLine405 = lines.slice(0, 405).join('\n');
  const extraClosingBrace = beforeLine405.lastIndexOf('}\n}');
  
  if (extraClosingBrace > -1) {
    console.log('Hittade möjlig extra } före rad 405');
  }
}

// Enkel fix: Se till att handleSubmit-funktionen är korrekt stängd
// Baserat på server-felet verkar det som att det saknas något

// Kontrollera strukturen runt handleSubmit
const handleSubmitStart = content.indexOf('const handleSubmit = async () => {');
if (handleSubmitStart > -1) {
  console.log('\n✅ Hittade handleSubmit funktionen');
  
  // Hitta slutet av funktionen genom att räkna brackets
  let pos = handleSubmitStart;
  let openBraces = 0;
  let foundStart = false;
  
  while (pos < content.length) {
    if (content[pos] === '{') {
      openBraces++;
      foundStart = true;
    } else if (content[pos] === '}' && foundStart) {
      openBraces--;
      if (openBraces === 0) {
        console.log(`handleSubmit slutar vid position ${pos}`);
        break;
      }
    }
    pos++;
  }
}

// Enklaste lösningen: Ta bort eventuell duplicerad kod
// Servern klagar på rad 405 som har "} else {" men det finns ingen matchande if

// Leta efter området runt rad 403-405
const problemArea = lines.slice(402, 407).join('\n');
console.log('\nProblemområde:\n', problemArea);

// Om vi har "onClose()" följt av "} else {", är det fel
if (content.includes('onClose()\n      \n      } else {')) {
  console.log('\n❌ Hittade orphaned else statement!');
  content = content.replace('onClose()\n      \n      } else {', 'onClose()\n    } catch (error) {');
  console.log('✅ Fixade orphaned else statement');
  
  // Ta också bort den extra catch om den finns
  if (content.includes('}\n    } catch (error) {\n      console.error(\'Error updating order:\', error)')) {
    content = content.replace(
      '}\n    } catch (error) {\n      console.error(\'Error updating order:\', error)',
      '}\n      console.error(\'Error updating order:\', error)'
    );
  }
}

// En annan möjlighet är att det finns för många } någonstans
// Leta efter }\n} mönster som kan vara fel
const doubleClosing = /}\s*\n\s*}/g;
const matches = content.match(doubleClosing);
if (matches && matches.length > 10) {
  console.log(`\n⚠️ Hittade ${matches.length} instanser av dubbla }`);
}

// Skriv tillbaka filen
fs.writeFileSync(filePath, content);

console.log('\n✅ Syntax fix applicerad!');
console.log('Kör npm run dev igen för att se om felet är löst.');