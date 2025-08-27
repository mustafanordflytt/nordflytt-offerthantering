import fetch from 'node-fetch';

console.log('🧪 Testing Fortnox invoicing with 20+ bookings\n');

// Generate random Swedish personal number
function generatePersonalNumber() {
  const year = 1950 + Math.floor(Math.random() * 50);
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  const suffix = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
  return `${year}${month}${day}-${suffix}`;
}

// Generate random Swedish address
function generateAddress() {
  const streets = ['Kungsgatan', 'Vasagatan', 'Storgatan', 'Drottninggatan', 'Sveavägen', 'Birger Jarlsgatan'];
  const street = streets[Math.floor(Math.random() * streets.length)];
  const number = Math.floor(Math.random() * 150) + 1;
  return `${street} ${number}`;
}

// Generate test booking data
function generateTestBooking(index) {
  const firstNames = ['Anna', 'Erik', 'Maria', 'Johan', 'Sofia', 'Lars', 'Emma', 'Nils', 'Karin', 'Anders'];
  const lastNames = ['Andersson', 'Johansson', 'Karlsson', 'Nilsson', 'Eriksson', 'Larsson', 'Olsson', 'Persson'];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const name = `${firstName} ${lastName}`;
  
  const services = ['Flytt', 'Packhjälp', 'Flyttstädning'];
  const selectedServices = services.slice(0, Math.floor(Math.random() * 3) + 1);
  
  const volumes = [10, 15, 20, 25, 30, 35, 40, 50];
  const volume = volumes[Math.floor(Math.random() * volumes.length)];
  
  return {
    customerType: 'private',
    name: name,
    email: `test${index}@example.com`,
    phone: `070${Math.floor(Math.random() * 9000000) + 1000000}`,
    personalNumber: generatePersonalNumber(),
    
    fromAddress: generateAddress(),
    fromPostal: '11234',
    fromCity: 'Stockholm',
    fromType: 'apartment',
    fromFloor: Math.floor(Math.random() * 5) + 1,
    fromElevator: Math.random() > 0.3,
    
    toAddress: generateAddress(),
    toPostal: '11456',
    toCity: 'Stockholm',
    toType: 'apartment',
    toFloor: Math.floor(Math.random() * 5) + 1,
    toElevator: Math.random() > 0.5,
    
    moveDate: new Date(Date.now() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    
    services: selectedServices,
    volume: volume,
    
    additionalServices: Math.random() > 0.7 ? ['Handyman 1 timme'] : [],
    specialItems: Math.random() > 0.8 ? ['Piano'] : [],
    
    acceptTerms: true,
    acceptPrivacy: true,
    wantsRut: true
  };
}

// Create a single booking
async function createBooking(bookingData, index) {
  try {
    console.log(`${index}. Creating booking for ${bookingData.name}...`);
    
    const response = await fetch('http://localhost:3000/api/submit-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log(`   ✅ Booking created: ${result.bookingId}`);
      return {
        success: true,
        bookingId: result.bookingId,
        customerName: bookingData.name,
        services: bookingData.services,
        volume: bookingData.volume
      };
    } else {
      console.log(`   ❌ Failed: ${result.error || 'Unknown error'}`);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Complete a job and trigger invoice creation
async function completeJobAndInvoice(booking) {
  try {
    // Simulate job completion with actual hours
    const completionData = {
      jobId: booking.bookingId,
      completedAt: new Date().toISOString(),
      actualHours: {
        flytthjälp: booking.services.includes('Flytt') ? 4 + Math.random() * 2 : 0,
        packning: booking.services.includes('Packhjälp') ? 2 + Math.random() * 1 : 0,
        städning: booking.services.includes('Flyttstädning') ? 3 + Math.random() * 1 : 0
      },
      staffBreakdown: {
        flytthjälp: booking.services.includes('Flytt') ? [
          { staffId: 'staff-1', hours: 2 + Math.random() },
          { staffId: 'staff-2', hours: 2 + Math.random() }
        ] : []
      },
      additions: Math.random() > 0.7 ? [{
        type: 'extra-kartonger',
        description: 'Extra flyttkartonger (10 st)',
        price: 790,
        rutEligible: false,
        addedBy: 'staff-1',
        timestamp: new Date().toISOString()
      }] : [],
      materials: [{
        type: 'kartonger',
        description: 'Flyttkartonger',
        quantity: Math.floor(booking.volume / 5),
        unitPrice: 79,
        rutEligible: false,
        usedBy: 'staff-1'
      }]
    };
    
    // Trigger invoice generation
    const response = await fetch('http://localhost:3000/api/generate-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: booking.bookingId,
        completionData: completionData
      })
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      return { 
        success: true, 
        invoiceNumber: result.invoiceNumber,
        rutDeduction: result.rutDeduction || 0
      };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Main test execution
async function runBulkTest() {
  const numberOfBookings = 25; // Test with 25 bookings
  const bookings = [];
  const results = {
    created: 0,
    invoiced: 0,
    failed: 0,
    totalRutDeduction: 0,
    errors: []
  };
  
  console.log(`🚀 Creating ${numberOfBookings} test bookings...\n`);
  
  // Create all bookings
  for (let i = 1; i <= numberOfBookings; i++) {
    const bookingData = generateTestBooking(i);
    const result = await createBooking(bookingData, i);
    
    if (result.success) {
      bookings.push(result);
      results.created++;
    } else {
      results.failed++;
      results.errors.push(`Booking ${i}: ${result.error}`);
    }
    
    // Add small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n✅ Created ${results.created} bookings`);
  console.log(`❌ Failed ${results.failed} bookings\n`);
  
  // Process invoices for created bookings
  console.log('📄 Generating invoices for completed jobs...\n');
  
  for (let i = 0; i < bookings.length; i++) {
    const booking = bookings[i];
    console.log(`${i + 1}. Processing invoice for ${booking.customerName}...`);
    
    const invoiceResult = await completeJobAndInvoice(booking);
    
    if (invoiceResult.success) {
      results.invoiced++;
      results.totalRutDeduction += invoiceResult.rutDeduction;
      console.log(`   ✅ Invoice created: ${invoiceResult.invoiceNumber}`);
      console.log(`   💰 RUT deduction: ${invoiceResult.rutDeduction} kr`);
    } else {
      console.log(`   ❌ Invoice failed: ${invoiceResult.error}`);
      results.errors.push(`Invoice for ${booking.bookingId}: ${invoiceResult.error}`);
    }
    
    // Add delay between invoice generations
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 BULK INVOICE TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total bookings attempted: ${numberOfBookings}`);
  console.log(`Bookings created: ${results.created}`);
  console.log(`Invoices generated: ${results.invoiced}`);
  console.log(`Total RUT deductions: ${results.totalRutDeduction.toLocaleString('sv-SE')} kr`);
  console.log(`Average RUT per invoice: ${Math.round(results.totalRutDeduction / results.invoiced).toLocaleString('sv-SE')} kr`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    results.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  // Performance metrics
  console.log('\n⚡ Performance:');
  console.log(`   - Booking creation rate: ${(results.created / numberOfBookings * 100).toFixed(1)}%`);
  console.log(`   - Invoice success rate: ${(results.invoiced / results.created * 100).toFixed(1)}%`);
  
  // Check for Fortnox-specific issues
  if (results.invoiced < results.created) {
    console.log('\n⚠️  Fortnox Integration Issues:');
    console.log('   - Check Fortnox API rate limits');
    console.log('   - Verify access token is valid');
    console.log('   - Check for duplicate customer numbers');
  }
  
  console.log('\n✅ Bulk test completed!');
}

// Check if Fortnox is configured
async function checkFortnoxConfig() {
  console.log('🔍 Checking Fortnox configuration...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/debug-env');
    const data = await response.json();
    
    const hasFortnoxConfig = data.environment?.fortnoxConfigured;
    
    if (!hasFortnoxConfig) {
      console.log('⚠️  Fortnox is not configured!');
      console.log('\nTo configure Fortnox, add these to your .env file:');
      console.log('- FORTNOX_CLIENT_SECRET');
      console.log('- FORTNOX_ACCESS_TOKEN');
      console.log('\nThe test will create bookings but invoice generation may fail.\n');
      
      const answer = await new Promise(resolve => {
        console.log('Continue anyway? (y/n): ');
        process.stdin.once('data', data => resolve(data.toString().trim()));
      });
      
      if (answer.toLowerCase() !== 'y') {
        console.log('Test cancelled.');
        process.exit(0);
      }
    } else {
      console.log('✅ Fortnox configuration found\n');
    }
  } catch (error) {
    console.log('⚠️  Could not verify Fortnox configuration\n');
  }
}

// Run the test
async function main() {
  await checkFortnoxConfig();
  await runBulkTest();
  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});