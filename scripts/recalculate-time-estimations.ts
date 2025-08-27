/**
 * Script to recalculate time estimations for existing bookings
 * using the enhanced algorithm v2.1
 */

import { createClient } from '@supabase/supabase-js';
import { calculateEnhancedEstimatedTime } from '../lib/utils/enhanced-time-estimation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface BookingUpdate {
  id: string;
  reference: string;
  oldHours: number;
  newHours: number;
  improvement: number;
  enhancedData: any;
}

async function recalculateBookingTime(booking: any): Promise<BookingUpdate | null> {
  try {
    const details = booking.details || {};
    
    // Extract data for enhanced calculation
    const livingArea = parseInt(details.startLivingArea) || parseInt(details.endLivingArea) || 70;
    const propertyType = details.startPropertyType === 'house' ? 'villa' : 
                        details.startPropertyType === 'storage' ? 'lägenhet' : 'lägenhet';
    const volume = details.estimatedVolume || (livingArea * 0.3);
    const distance = parseFloat(details.calculatedDistance) || 10;
    
    // Convert elevator info
    const elevatorTypeFrom = details.startElevator === 'hiss' ? 'stor' : 
                            details.startElevator === 'big' ? 'stor' :
                            details.startElevator === 'small' ? 'liten' : 'ingen';
    const elevatorTypeTo = details.endElevator === 'hiss' ? 'stor' : 
                          details.endElevator === 'big' ? 'stor' :
                          details.endElevator === 'small' ? 'liten' : 'ingen';
    
    // Calculate with enhanced algorithm
    const result = calculateEnhancedEstimatedTime({
      volume,
      distance,
      teamSize: 2, // Default team size
      propertyType,
      livingArea,
      floors: {
        from: parseInt(details.startFloor) || 0,
        to: parseInt(details.endFloor) || 0
      },
      elevatorType: {
        from: elevatorTypeFrom,
        to: elevatorTypeTo
      },
      parkingDistance: {
        from: parseInt(details.startParkingDistance) || 0,
        to: parseInt(details.endParkingDistance) || 0
      },
      services: booking.service_types || ['moving'],
      trafficFactor: 'normal',
      heavyItems: details.largeItems?.length > 0,
      specialItems: details.specialItems || []
    });
    
    // Get old hours (if stored)
    const oldHours = booking.estimated_hours || 
                    (booking.price_details?.estimated_hours) || 
                    15; // Default fallback
    
    const improvement = ((oldHours - result.totalHours) / oldHours * 100);
    
    return {
      id: booking.id,
      reference: booking.reference,
      oldHours,
      newHours: result.totalHours,
      improvement,
      enhancedData: {
        estimatedHours: result.totalHours,
        breakdown: result.breakdown,
        teamOptimization: result.teamOptimization,
        competitiveAnalysis: result.competitiveAnalysis
      }
    };
  } catch (error) {
    console.error(`Error processing booking ${booking.reference}:`, error);
    return null;
  }
}

async function updateSpecificBooking(reference: string) {
  console.log(`\n🔄 Updating booking ${reference} with enhanced algorithm...`);
  
  // Fetch the booking
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('reference', reference)
    .single();
    
  if (error || !booking) {
    console.error('❌ Booking not found:', error);
    return;
  }
  
  const update = await recalculateBookingTime(booking);
  if (!update) {
    console.error('❌ Failed to calculate new time');
    return;
  }
  
  // Update the booking with enhanced data
  const { error: updateError } = await supabase
    .from('bookings')
    .update({
      estimated_hours: update.newHours,
      enhanced_estimation: update.enhancedData,
      updated_at: new Date().toISOString()
    })
    .eq('id', booking.id);
    
  if (updateError) {
    console.error('❌ Failed to update booking:', updateError);
    return;
  }
  
  console.log(`✅ Successfully updated ${reference}`);
  console.log(`   Old estimate: ${update.oldHours}h`);
  console.log(`   New estimate: ${update.newHours}h`);
  console.log(`   Improvement: ${update.improvement.toFixed(1)}%`);
  console.log(`   Team optimization: ${update.enhancedData.teamOptimization.efficiencyRating}`);
  console.log(`   Market position: ${update.enhancedData.competitiveAnalysis.marketPosition}`);
}

async function recalculateAllBookings() {
  console.log('🚀 Starting time estimation recalculation...\n');
  
  // Fetch all bookings
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100); // Process latest 100 bookings
    
  if (error) {
    console.error('❌ Failed to fetch bookings:', error);
    return;
  }
  
  console.log(`📊 Found ${bookings.length} bookings to process\n`);
  
  const updates: BookingUpdate[] = [];
  
  for (const booking of bookings) {
    const update = await recalculateBookingTime(booking);
    if (update) {
      updates.push(update);
    }
  }
  
  // Show summary
  console.log('\n📈 RECALCULATION SUMMARY:');
  console.log(`   Total processed: ${updates.length}`);
  
  const avgImprovement = updates.reduce((sum, u) => sum + u.improvement, 0) / updates.length;
  console.log(`   Average improvement: ${avgImprovement.toFixed(1)}%`);
  
  // Sort by improvement
  const topImprovements = updates
    .sort((a, b) => b.improvement - a.improvement)
    .slice(0, 5);
    
  console.log('\n🏆 TOP IMPROVEMENTS:');
  topImprovements.forEach((u, i) => {
    console.log(`   ${i + 1}. ${u.reference}: ${u.oldHours}h → ${u.newHours}h (${u.improvement.toFixed(1)}% better)`);
  });
}

// Main execution
const args = process.argv.slice(2);

if (args[0] === '--booking' && args[1]) {
  // Update specific booking
  updateSpecificBooking(args[1]);
} else if (args[0] === '--all') {
  // Update all bookings
  recalculateAllBookings();
} else {
  console.log('Usage:');
  console.log('  npm run recalculate-time -- --booking NF-23857BDE   # Update specific booking');
  console.log('  npm run recalculate-time -- --all                   # Update all bookings');
}

// Export for use in other scripts
export { recalculateBookingTime, updateSpecificBooking };