const fs = require('fs');
const path = require('path');

// Läs contracts.json
const contractsPath = path.join(__dirname, 'data', 'contracts.json');
const contracts = JSON.parse(fs.readFileSync(contractsPath, 'utf-8'));

// Kolla Mustafas avtal
const mustafaId = 'd6612ebb-e2c7-4f0b-a1ba-589a472ab0a6';
const mustafaData = contracts.employees[mustafaId];

console.log('=== MUSTAFA CONTRACT DATA ===');
console.log('Name:', mustafaData.name);
console.log('Email:', mustafaData.email);
console.log('Role:', mustafaData.role);
console.log('\nCurrent Contract:');
console.log(JSON.stringify(mustafaData.contracts.current, null, 2));

// Kontrollera om PDF-filen finns
const pdfPath = path.join(__dirname, 'public', mustafaData.contracts.current.pdfUrl);
const pdfExists = fs.existsSync(pdfPath);
console.log('\nPDF exists:', pdfExists);
console.log('PDF path:', pdfPath);