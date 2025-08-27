import { createClient } from '@supabase/supabase-js';
import { calculateEnhancedEstimatedTime } from './lib/utils/enhanced-time-estimation.ts';
import { calculateEstimatedTime } from './lib/utils/time-estimation.ts';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugTimeEstimation() {
  console.log('🔍 Debugging time estimation for booking NF-23857BDE...\n');

  try {
    // Fetch the specific booking
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .or('reference.eq.NF-23857BDE,customer_email.eq.mustafa.abdulkarim@hotmail.com')
      .limit(1);

    if (error) {
      console.error('Error fetching booking:', error);
      return;
    }

    if (!bookings || bookings.length === 0) {
      console.log('❌ No booking found with reference NF-23857BDE or email mustafa.abdulkarim@hotmail.com');
      return;
    }

    const booking = bookings[0];
    console.log('✅ Found booking:', {
      id: booking.id,
      reference: booking.reference,
      customer_email: booking.customer_email,
      move_date: booking.move_date,
      status: booking.status
    });

    console.log('\n📊 Booking details:');
    console.log('Living area:', booking.details?.startLivingArea, 'm²');
    console.log('Estimated volume:', booking.details?.estimatedVolume, 'm³');
    console.log('Distance:', booking.details?.calculatedDistance, 'km');
    console.log('Start floor:', booking.details?.startFloor);
    console.log('End floor:', booking.details?.endFloor);
    console.log('Start elevator:', booking.details?.startElevator);
    console.log('End elevator:', booking.details?.endElevator);
    console.log('Parking distance (start):', booking.details?.startParkingDistance, 'm');
    console.log('Parking distance (end):', booking.details?.endParkingDistance, 'm');
    console.log('Services:', booking.service_types);

    // Calculate using OLD algorithm
    console.log('\n🕐 OLD Time Estimation Algorithm:');
    const oldInput = {
      volume: booking.details?.estimatedVolume || 20,
      distance: parseFloat(booking.details?.calculatedDistance) || 10,
      floors: {
        from: parseInt(booking.details?.startFloor) || 0,
        to: parseInt(booking.details?.endFloor) || 0
      },
      hasElevator: {
        from: booking.details?.startElevator === 'hiss',
        to: booking.details?.endElevator === 'hiss'
      },
      services: booking.service_types || ['moving']
    };

    const oldResult = calculateEstimatedTime(oldInput);
    console.log('Total hours:', oldResult.totalHours);
    console.log('Breakdown:', oldResult.breakdown);

    // Calculate using ENHANCED algorithm
    console.log('\n🚀 ENHANCED Time Estimation Algorithm:');
    const elevatorTypeFrom = booking.details?.startElevator === 'hiss' ? 'stor' : 
                            booking.details?.startElevator === 'small' ? 'liten' : 'ingen';
    const elevatorTypeTo = booking.details?.endElevator === 'hiss' ? 'stor' : 
                          booking.details?.endElevator === 'small' ? 'liten' : 'ingen';
    
    const enhancedInput = {
      volume: booking.details?.estimatedVolume || 20,
      distance: parseFloat(booking.details?.calculatedDistance) || 10,
      teamSize: 2, // Default team size
      propertyType: booking.details?.startPropertyType === 'house' ? 'villa' : 'lägenhet',
      livingArea: parseInt(booking.details?.startLivingArea) || 70,
      floors: {
        from: parseInt(booking.details?.startFloor) || 0,
        to: parseInt(booking.details?.endFloor) || 0
      },
      elevatorType: {
        from: elevatorTypeFrom,
        to: elevatorTypeTo
      },
      parkingDistance: {
        from: parseInt(booking.details?.startParkingDistance) || 0,
        to: parseInt(booking.details?.endParkingDistance) || 0
      },
      services: booking.service_types || ['moving'],
      trafficFactor: 'normal'
    };

    const enhancedResult = calculateEnhancedEstimatedTime(enhancedInput);
    console.log('Total hours:', enhancedResult.totalHours);
    console.log('Breakdown:', enhancedResult.breakdown);
    console.log('Team optimization:', enhancedResult.teamOptimization);
    console.log('Competitive analysis:', enhancedResult.competitiveAnalysis);

    // Compare results
    console.log('\n📊 COMPARISON:');
    console.log('Old algorithm:', oldResult.totalHours, 'hours');
    console.log('Enhanced algorithm:', enhancedResult.totalHours, 'hours');
    console.log('Difference:', oldResult.totalHours - enhancedResult.totalHours, 'hours');

    // Check what's stored in the database
    console.log('\n💾 What\'s stored in database:');
    console.log('Booking details.estimatedHours:', booking.details?.estimatedHours);
    console.log('Any other time fields:', Object.keys(booking.details || {}).filter(k => k.toLowerCase().includes('hour') || k.toLowerCase().includes('time')));

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the debug function
debugTimeEstimation();