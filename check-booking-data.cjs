/**
 * Check booking data directly in the database
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBooking(reference) {
  console.log(`\n🔍 Checking booking ${reference}...\n`);
  
  try {
    // Fetch booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('reference', reference)
      .single();
      
    if (error || !booking) {
      console.log('❌ Booking not found');
      return;
    }
    
    console.log('📋 BOOKING DATA:');
    console.log(`   ID: ${booking.id}`);
    console.log(`   Reference: ${booking.reference}`);
    console.log(`   Status: ${booking.status}`);
    console.log(`   Move Date: ${booking.move_date}`);
    console.log(`   Total Price: ${booking.total_price} kr`);
    console.log(`   Estimated Hours: ${booking.estimated_hours || 'Not set'}`);
    console.log('');
    
    if (booking.details) {
      console.log('📊 BOOKING DETAILS:');
      console.log(`   Start Address: ${booking.details.startAddress || booking.start_address}`);
      console.log(`   End Address: ${booking.details.endAddress || booking.end_address}`);
      console.log(`   Living Area: ${booking.details.startLivingArea || 'Not set'} kvm`);
      console.log(`   Property Type: ${booking.details.startPropertyType || 'Not set'}`);
      console.log(`   Estimated Volume: ${booking.details.estimatedVolume || 'Not set'} m³`);
      console.log(`   Calculated Distance: ${booking.details.calculatedDistance || 'Not set'} km`);
      console.log(`   Start Floor: ${booking.details.startFloor || 0}`);
      console.log(`   End Floor: ${booking.details.endFloor || 0}`);
      console.log(`   Start Elevator: ${booking.details.startElevator || 'none'}`);
      console.log(`   End Elevator: ${booking.details.endElevator || 'none'}`);
    }
    
    // Check for enhanced estimation data
    if (booking.enhanced_estimation) {
      console.log('\n✅ ENHANCED ESTIMATION DATA FOUND:');
      console.log(`   Total Hours: ${booking.enhanced_estimation.estimatedHours}h`);
      if (booking.enhanced_estimation.teamOptimization) {
        console.log(`   Team Efficiency: ${booking.enhanced_estimation.teamOptimization.currentEfficiency} m³/h`);
        console.log(`   Efficiency Rating: ${booking.enhanced_estimation.teamOptimization.efficiencyRating}`);
      }
    } else {
      console.log('\n❌ No enhanced estimation data stored');
    }
    
    // Calculate what it should be
    if (booking.details?.startLivingArea && booking.details?.calculatedDistance) {
      const volume = (booking.details.estimatedVolume || (parseInt(booking.details.startLivingArea) * 0.3));
      const movingTime = volume / 4.5; // 2 person team
      const drivingTime = (parseFloat(booking.details.calculatedDistance) * 2) / 40;
      const expectedHours = Math.ceil((movingTime + drivingTime) * 4) / 4;
      
      console.log('\n🧮 EXPECTED CALCULATION:');
      console.log(`   Volume: ${volume} m³`);
      console.log(`   Moving Time: ${movingTime.toFixed(2)}h (${volume} m³ ÷ 4.5 m³/h)`);
      console.log(`   Driving Time: ${drivingTime.toFixed(2)}h`);
      console.log(`   Expected Total: ${expectedHours}h`);
      
      if (booking.estimated_hours) {
        console.log(`   Current Stored: ${booking.estimated_hours}h`);
        console.log(`   Difference: ${Math.abs(booking.estimated_hours - expectedHours).toFixed(2)}h`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Check specific booking or all recent bookings
const args = process.argv.slice(2);
if (args[0]) {
  checkBooking(args[0]);
} else {
  console.log('Usage: node check-booking-data.cjs NF-23857BDE');
}