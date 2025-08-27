// Enkel test-fil som inte kräver Jest eller Puppeteer installerat
// Kör med: node manual-test.js

console.log('🧪 Manuell testning av Nordflytt Staff App\n');

const tests = [
  {
    name: 'Login sida',
    url: 'http://localhost:3000/staff',
    checks: [
      'Email input finns',
      'Password input finns', 
      'Login knapp finns',
      'Nordflytt logo visas'
    ]
  },
  {
    name: 'Dashboard',
    url: 'http://localhost:3000/staff/dashboard',
    checks: [
      'Jobbkort visas',
      'Check-in/ut knapp finns',
      'Team chat knapp finns',
      'Användarinfo visas'
    ]
  },
  {
    name: 'Mobile responsivitet',
    checks: [
      'Sticky action bar på mobil',
      '4 kolumners grid för snabbknappar',
      'Touch-vänliga knappar (min 44px höjd)',
      'Scrollbara modaler'
    ]
  },
  {
    name: 'Smart funktioner',
    checks: [
      'Fotopåminnelser vid jobbstart',
      'Smart prisberäkning i tilläggstjänster',
      'Dynamisk checklista baserat på jobbdata',
      'Automatiska tillägg (parkering, trappor)'
    ]
  }
];

console.log('📋 Manuell checklista för testning:\n');

tests.forEach((test, index) => {
  console.log(`${index + 1}. ${test.name}`);
  if (test.url) {
    console.log(`   URL: ${test.url}`);
  }
  console.log('   Kontrollera:');
  test.checks.forEach(check => {
    console.log(`   ☐ ${check}`);
  });
  console.log('');
});

console.log('💡 Tips för manuell testning:');
console.log('1. Öppna Chrome DevTools (F12)');
console.log('2. Aktivera Device Mode för mobilvy');
console.log('3. Välj iPhone X eller liknande');
console.log('4. Testa alla interaktioner');
console.log('5. Kontrollera console för fel\n');

console.log('🔍 Saker att extra uppmärksamma:');
console.log('- Klicka på jobbkort öppnar modal med detaljer');
console.log('- "Lägg till tjänst" visar smart prisberäkning överst');
console.log('- Fotopåminnelser triggas vid rätt tidpunkter');
console.log('- Sticky action bar syns bara för pågående jobb');
console.log('- Alla modaler går att scrolla på mobil\n');

// Simulera en enkel HTTP-check
const http = require('http');

const checkServer = (callback) => {
  http.get('http://localhost:3000', (res) => {
    if (res.statusCode === 200 || res.statusCode === 308) {
      console.log('✅ Dev server körs på http://localhost:3000');
    } else {
      console.log('⚠️  Dev server svarar med status:', res.statusCode);
    }
    callback();
  }).on('error', (err) => {
    console.log('❌ Dev server är inte igång!');
    console.log('   Kör "npm run dev" i terminal 1 först.\n');
    callback();
  });
};

checkServer(() => {
  console.log('\n🚀 Börja med att öppna http://localhost:3000/staff i din browser!');
});