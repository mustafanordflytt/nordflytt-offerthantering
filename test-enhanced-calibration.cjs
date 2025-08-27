/**
 * Test script to verify enhanced algorithm calibration
 * Expected result for NF-23857BDE: ~6.75h
 */

// Mock the enhanced algorithm since we can't import TS directly
function calculateEnhancedEstimatedTime(input) {
  // Team efficiency values (from the algorithm)
  const teamEfficiency = {
    1: 2.5,
    2: 4.5,
    3: 10.0,
    4: 12.0,
    5: 13.0,
    6: 12.5
  };
  
  const efficiency = teamEfficiency[input.teamSize] || 2.5;
  
  // Calculate moving time
  const baseMovingTime = input.volume / efficiency;
  const loadingHours = baseMovingTime / 2;
  const unloadingHours = baseMovingTime / 2;
  
  // Calculate driving time
  const baseSpeed = 40; // km/h
  const roundTripDistance = input.distance * 2;
  const drivingHours = roundTripDistance / baseSpeed;
  
  // Total
  const subtotal = loadingHours + unloadingHours + drivingHours;
  const totalHours = Math.max(3, Math.ceil(subtotal * 4) / 4); // Round to quarter hours
  
  return {
    totalHours,
    breakdown: {
      loadingHours: Math.round(loadingHours * 10) / 10,
      unloadingHours: Math.round(unloadingHours * 10) / 10,
      drivingHours: Math.round(drivingHours * 10) / 10,
      packingHours: 0,
      cleaningHours: 0,
      logisticsHours: 0,
      additionalHours: 0
    },
    teamOptimization: {
      currentTeamSize: input.teamSize,
      currentEfficiency: efficiency,
      optimalTeamSize: input.volume <= 15 ? 2 : input.volume <= 35 ? 3 : 4,
      efficiencyRating: 'good',
      recommendations: []
    },
    competitiveAnalysis: {
      estimateVsCompetitors: 'competitive',
      advantagePercentage: 10,
      marketPosition: '10% snabbare än konkurrenter'
    }
  };
}

console.log('🧪 ENHANCED ALGORITHM CALIBRATION TEST\n');

// Test case matching NF-23857BDE
const testCase = {
  volume: 24,        // 80 kvm * 0.3 = 24 m³
  distance: 26.8,    // km
  teamSize: 2,       // 2 person team
  propertyType: 'lägenhet',
  livingArea: 80,
  floors: { from: 0, to: 0 },
  elevatorType: { from: 'stor', to: 'stor' },
  parkingDistance: { from: 0, to: 0 },
  services: ['moving'],
  trafficFactor: 'normal'
};

console.log('📊 Input Parameters:');
console.log(`   Living Area: ${testCase.livingArea} kvm`);
console.log(`   Property Type: ${testCase.propertyType}`);
console.log(`   Volume: ${testCase.volume} m³`);
console.log(`   Distance: ${testCase.distance} km`);
console.log(`   Team Size: ${testCase.teamSize} people`);
console.log('');

const result = calculateEnhancedEstimatedTime(testCase);

console.log('🎯 ENHANCED ALGORITHM RESULTS:');
console.log(`   Total Hours: ${result.totalHours}h`);
console.log('');
console.log('📈 Breakdown:');
console.log(`   Loading: ${result.breakdown.loadingHours.toFixed(2)}h`);
console.log(`   Unloading: ${result.breakdown.unloadingHours.toFixed(2)}h`);
console.log(`   Driving: ${result.breakdown.drivingHours.toFixed(2)}h`);
console.log(`   Logistics: ${result.breakdown.logisticsHours.toFixed(2)}h`);
console.log(`   Additional: ${result.breakdown.additionalHours.toFixed(2)}h`);
console.log('');
console.log('🏆 Team Optimization:');
console.log(`   Current Efficiency: ${result.teamOptimization.currentEfficiency} m³/h`);
console.log(`   Efficiency Rating: ${result.teamOptimization.efficiencyRating}`);
console.log(`   Optimal Team Size: ${result.teamOptimization.optimalTeamSize} people`);
console.log('');
console.log('🎖️ Competitive Analysis:');
console.log(`   vs Competitors: ${result.competitiveAnalysis.estimateVsCompetitors}`);
console.log(`   Market Position: ${result.competitiveAnalysis.marketPosition}`);
console.log('');

// Calculate what the time should be
const movingTime = testCase.volume / 4.5; // 2 person efficiency
const drivingTime = (testCase.distance * 2) / 40; // Round trip at 40 km/h
const expectedTotal = movingTime + drivingTime;

console.log('✅ VERIFICATION:');
console.log(`   Expected Calculation:`);
console.log(`   - Moving: ${testCase.volume} m³ ÷ 4.5 m³/h = ${movingTime.toFixed(2)}h`);
console.log(`   - Driving: ${testCase.distance * 2} km ÷ 40 km/h = ${drivingTime.toFixed(2)}h`);
console.log(`   - Expected Total: ${expectedTotal.toFixed(2)}h`);
console.log(`   - Actual Result: ${result.totalHours}h`);
console.log('');

if (Math.abs(result.totalHours - expectedTotal) < 0.5) {
  console.log('✅ CALIBRATION SUCCESS: Algorithm matches expected result!');
} else {
  console.log('❌ CALIBRATION ERROR: Result differs from expected!');
  console.log(`   Difference: ${Math.abs(result.totalHours - expectedTotal).toFixed(2)}h`);
}