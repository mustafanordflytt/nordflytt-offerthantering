/**
 * NORDFLYTT ENHANCED TEAM-BASED TIME ESTIMATION ALGORITHM v2.1
 * FINAL CALIBRATED VERSION - Market Competitive
 * 
 * MAJOR CALIBRATION: Team efficiency significantly increased for 3+ person teams
 * to match competitor performance (Jordgubbsprinsen: 10h for 250kvm villa with 3 people)
 */

export interface EnhancedTimeEstimationInput {
  // Basic job parameters
  volume?: number;            // m³ (optional - can be calculated from livingArea)
  distance: number;           // km (one way)
  teamSize: number;           // Number of people on the job
  
  // Property details  
  propertyType: 'lägenhet' | 'villa' | 'kontor';
  livingArea: number;         // m² - used for improved volume calculation
  roomBreakdown?: {           // Optional detailed room breakdown
    kök: number;              // m² kitchen area
    sovrum: number;           // m² bedroom area  
    vardagsrum: number;       // m² living room area
    badrum: number;           // m² bathroom area
  };
  
  // Location factors
  floors?: {
    from: number;             // Floor level at pickup
    to: number;               // Floor level at delivery
  };
  elevatorType?: {
    from: 'ingen' | 'liten' | 'stor';
    to: 'ingen' | 'liten' | 'stor';
  };
  parkingDistance?: {
    from: number;             // meters from building entrance
    to: number;               // meters from building entrance
  };
  
  // Job complexity
  trafficFactor?: 'helg' | 'normal' | 'rusningstid';
  services: string[];         // ['moving', 'packing', 'cleaning']
  heavyItems?: boolean;       // Standard heavy furniture assumption
  specialItems?: string[];    // ['piano', 'safe', 'artwork']
  storageItems?: boolean;     // Extra basement/storage items
}

export interface EnhancedTimeEstimationResult {
  totalHours: number;
  breakdown: {
    loadingHours: number;
    unloadingHours: number;
    drivingHours: number;
    packingHours?: number;
    cleaningHours?: number;
    logisticsHours: number;
    additionalHours: number;
  };
  teamOptimization: {
    currentTeamSize: number;
    currentEfficiency: number;
    optimalTeamSize: number;
    efficiencyRating: 'optimal' | 'good' | 'suboptimal';
    recommendations: string[];
  };
  competitiveAnalysis: {
    estimateVsCompetitors: 'faster' | 'competitive' | 'slower';
    advantagePercentage: number;
    marketPosition: string;
  };
  description: string;
}

/**
 * CALIBRATED TEAM EFFICIENCY MATRIX v2.1
 * Major increases for 3+ person teams to match competitor performance
 */
function getTeamEfficiency(teamSize: number, taskType: 'moving' | 'packing' | 'cleaning'): number {
  const efficiencyMap = {
    moving: {
      1: 2.5,   // Base rate - kept same
      2: 4.5,   // Works well for apartments - kept same  
      3: 10.0,  // MAJOR INCREASE from 6.0 - matches Jordgubbsprinsen villa performance
      4: 12.0,  // MAJOR INCREASE from 7.0 - exceeds competitors
      5: 13.0,  // MAJOR INCREASE from 7.5 - maximum efficiency
      6: 12.5   // Slight diminishing returns
    },
    packing: {
      1: 3.0, 2: 5.0, 3: 7.5, 4: 9.0, 5: 10.0
    },
    cleaning: {
      1: 40, 2: 70, 3: 100, 4: 120, 5: 130 // m²/hour
    }
  };
  
  return efficiencyMap[taskType][Math.min(teamSize, 6)] || efficiencyMap[taskType][1];
}

/**
 * IMPROVED VOLUME CALCULATION (from competitor analysis)
 * Matches industry standard: ~3 kvm = 1 m³
 */
function calculateImprovedVolume(livingArea: number, propertyType: string): number {
  const volumeMultipliers = {
    'lägenhet': 0.3,    // Matches competitor calculations  
    'villa': 0.4,       // Includes basement/storage
    'kontor': 0.25      // Standardized office furniture
  };
  
  return livingArea * (volumeMultipliers[propertyType] || 0.3);
}

/**
 * ROOM-SPECIFIC COMPLEXITY CALCULATION
 */
function calculateRoomComplexity(roomBreakdown: any, taskType: 'packing' | 'cleaning'): number {
  if (!roomBreakdown) return 1.0;
  
  const complexityFactors = {
    packing: {
      kök: 1.5,         // Fragile items, appliances
      sovrum: 1.2,      // Clothes, personal items
      vardagsrum: 0.8,  // Mostly furniture
      badrum: 1.3       // Small items, toiletries
    },
    cleaning: {
      kök: 2.0,         // Grease, appliances, detailed work
      badrum: 1.8,      // Scrubbing, mold, detailed work
      övriga: 1.0       // Standard cleaning
    }
  };
  
  let totalArea = 0;
  let weightedArea = 0;
  
  Object.entries(roomBreakdown).forEach(([room, area]) => {
    const factor = complexityFactors[taskType][room] || 1.0;
    totalArea += area;
    weightedArea += area * factor;
  });
  
  return totalArea > 0 ? weightedArea / totalArea : 1.0;
}

/**
 * TRAFFIC AND LOGISTICS FACTORS
 */
function getTrafficMultiplier(factor: string, distance: number): number {
  const multipliers = {
    'helg': 0.9,       // Less traffic on weekends
    'normal': 1.0,     // Standard traffic
    'rusningstid': 1.4 // Rush hour penalty (major impact in Stockholm)
  };
  
  // Longer distances more affected by traffic
  const distanceImpact = distance > 20 ? 1.1 : 1.0;
  return (multipliers[factor] || 1.0) * distanceImpact;
}

function calculateLogisticsPenalties(input: EnhancedTimeEstimationInput): number {
  let penalties = 0;
  
  // Elevator penalties (minutes converted to hours)
  if (input.floors && input.elevatorType) {
    const elevatorPenalties = {
      'ingen': 20,    // 20 minutes per floor
      'liten': 8,     // 8 minutes per floor  
      'stor': 2       // 2 minutes per floor
    };
    
    const fromPenalty = (input.floors.from * elevatorPenalties[input.elevatorType.from]) / 60;
    const toPenalty = (input.floors.to * elevatorPenalties[input.elevatorType.to]) / 60;
    penalties += fromPenalty + toPenalty;
  }
  
  // Parking distance penalties (over 20m baseline)
  if (input.parkingDistance) {
    const fromParking = Math.max(0, input.parkingDistance.from - 20);
    const toParking = Math.max(0, input.parkingDistance.to - 20);
    // 5 km/h walking speed with equipment
    penalties += (fromParking + toParking) / 100 / 5;
  }
  
  return penalties;
}

/**
 * FATIGUE FACTOR CALCULATION
 * Reduced impact for larger teams (they can rotate work)
 */
function getFatigueFactor(hours: number, teamSize: number): number {
  // Larger teams handle long jobs better
  const teamFatigueReduction = teamSize >= 4 ? 0.7 : teamSize >= 3 ? 0.85 : 1.0;
  
  if (hours <= 6) return 1.0;
  if (hours <= 8) return 1.0 + (0.05 * teamFatigueReduction);
  if (hours <= 10) return 1.0 + (0.1 * teamFatigueReduction);
  return 1.0 + (0.15 * teamFatigueReduction);
}

/**
 * MAIN CALCULATION FUNCTION
 */
export function calculateEnhancedEstimatedTime(input: EnhancedTimeEstimationInput): EnhancedTimeEstimationResult {
  // Use improved volume calculation if no volume provided
  const calculatedVolume = input.volume || calculateImprovedVolume(input.livingArea, input.propertyType);
  const actualVolume = calculatedVolume;

  // Get team efficiencies
  const movingEfficiency = getTeamEfficiency(input.teamSize, 'moving');
  const packingEfficiency = getTeamEfficiency(input.teamSize, 'packing');
  const cleaningEfficiency = getTeamEfficiency(input.teamSize, 'cleaning');

  let totalHours = 0;
  let breakdown = {
    loadingHours: 0,
    unloadingHours: 0,
    drivingHours: 0,
    packingHours: 0,
    cleaningHours: 0,
    logisticsHours: 0,
    additionalHours: 0
  };

  // Calculate moving time
  if (input.services.includes('moving')) {
    const baseMovingTime = actualVolume / movingEfficiency;
    
    // Enhanced parallel task optimization
    const simultaneousWork = input.teamSize >= 2;
    
    if (simultaneousWork && input.services.length > 1) {
      // Teams can work in parallel - improved overlap efficiency
      breakdown.loadingHours = baseMovingTime * 0.4;   // 40% of time loading
      breakdown.unloadingHours = baseMovingTime * 0.4; // 40% of time unloading
      // 20% overlap savings from parallel work
    } else {
      breakdown.loadingHours = baseMovingTime / 2;
      breakdown.unloadingHours = baseMovingTime / 2;
    }
  }

  // Calculate packing time
  if (input.services.includes('packing')) {
    const roomComplexity = calculateRoomComplexity(input.roomBreakdown, 'packing');
    const basePacking = actualVolume / packingEfficiency * roomComplexity;
    
    // Packing can overlap with moving for teams ≥ 3
    if (input.teamSize >= 3 && input.services.includes('moving')) {
      breakdown.packingHours = basePacking * 0.75; // 25% overlap bonus
    } else {
      breakdown.packingHours = basePacking;
    }
  }

  // Calculate cleaning time  
  if (input.services.includes('cleaning')) {
    const roomComplexity = calculateRoomComplexity(input.roomBreakdown, 'cleaning');
    const baseCleaningArea = input.livingArea * roomComplexity;
    breakdown.cleaningHours = baseCleaningArea / cleaningEfficiency;
    
    // Cleaning can start in kitchen/bathroom while moving continues
    if (input.teamSize >= 2 && input.services.includes('moving')) {
      breakdown.cleaningHours *= 0.8; // 20% overlap bonus
    }
  }

  // Calculate driving time with traffic
  const baseSpeed = 40; // km/h average in Stockholm
  const trafficMultiplier = getTrafficMultiplier(input.trafficFactor || 'normal', input.distance);
  
  // Vehicle strategy optimization
  const roundTripDistance = input.distance * 2;
  breakdown.drivingHours = roundTripDistance / baseSpeed * trafficMultiplier;

  // Add logistics penalties
  breakdown.logisticsHours = calculateLogisticsPenalties(input);

  // Special items penalties
  if (input.specialItems?.includes('piano')) {
    breakdown.additionalHours += 1.5; // Piano moving penalty
  }
  if (input.heavyItems) {
    breakdown.additionalHours += actualVolume * 0.05; // 5% penalty for heavy items
  }

  // Calculate subtotal
  const subtotal = Object.values(breakdown).reduce((sum, hours) => sum + hours, 0);

  // Apply property type multiplier (micro-adjusted for perfect competitiveness)
  const propertyMultipliers = {
    'lägenhet': 1.0,
    'villa': 1.0,      // Removed penalty - good teams handle villas efficiently
    'kontor': 0.9
  };
  const propertyAdjusted = subtotal * (propertyMultipliers[input.propertyType] || 1.0);

  // Apply fatigue factor
  const fatigueAdjusted = propertyAdjusted * getFatigueFactor(propertyAdjusted, input.teamSize);

  // Final calculation (minimum 3 hours, rounded to quarter hours)
  totalHours = Math.max(3, Math.ceil(fatigueAdjusted * 4) / 4);

  // Team optimization analysis
  const optimalSize = actualVolume <= 15 ? 2 : actualVolume <= 35 ? 3 : 4;
  const efficiencyRating = input.teamSize === optimalSize ? 'optimal' : 
                          Math.abs(input.teamSize - optimalSize) <= 1 ? 'good' : 'suboptimal';

  // Competitive analysis
  const competitorEstimate = calculateCompetitorEstimate(actualVolume, input.propertyType);
  const advantage = ((competitorEstimate - totalHours) / competitorEstimate) * 100;
  
  return {
    totalHours,
    breakdown,
    teamOptimization: {
      currentTeamSize: input.teamSize,
      currentEfficiency: movingEfficiency,
      optimalTeamSize: optimalSize,
      efficiencyRating,
      recommendations: generateOptimizationRecommendations(input, optimalSize)
    },
    competitiveAnalysis: {
      estimateVsCompetitors: advantage > 15 ? 'faster' : advantage > -5 ? 'competitive' : 'slower',
      advantagePercentage: Math.round(advantage),
      marketPosition: `${Math.abs(Math.round(advantage))}% ${advantage > 0 ? 'snabbare' : 'långsammare'} än konkurrenter`
    },
    description: `Beräknad tid: ${totalHours} timmar (${actualVolume} m³, ${input.distance} km, ${input.teamSize} personer)`
  };
}

/**
 * Estimate competitor time for comparison
 */
function calculateCompetitorEstimate(volume: number, propertyType: string): number {
  // Based on competitor analysis:
  // Apartments: ~4-6h for 15-20 m³
  // Villas: ~10h for 100 m³ (Jordgubbsprinsen data)
  
  if (propertyType === 'villa') {
    return volume * 0.11; // Slightly higher than 0.1 to account for complexity
  } else {
    return Math.max(4, volume * 0.27); // Slightly higher for apartments too
  }
}

/**
 * Generate optimization recommendations
 */
function generateOptimizationRecommendations(input: EnhancedTimeEstimationInput, optimalSize: number): string[] {
  const recommendations = [];
  
  if (input.teamSize < optimalSize) {
    recommendations.push(`Öka till ${optimalSize} personer för optimal effektivitet`);
  } else if (input.teamSize > optimalSize) {
    recommendations.push(`${optimalSize} personer kan vara mer kostnadseffektivt`);
  }
  
  if (input.services.length > 1 && input.teamSize >= 3) {
    recommendations.push('Parallellt arbete möjligt - packning och städning kan överlappa med flytt');
  }
  
  if (input.trafficFactor === 'rusningstid') {
    recommendations.push('Överväg att boka utanför rusningstid för 40% snabbare transport');
  }
  
  return recommendations;
}

/**
 * Apply calibrated estimation to specific booking
 */
export function updateBookingTimeEstimate(bookingId: string, input: EnhancedTimeEstimationInput): EnhancedTimeEstimationResult {
  const result = calculateEnhancedEstimatedTime(input);
  
  console.log(`📊 Updated ${bookingId}: ${result.totalHours}h (vs competitors: ${result.competitiveAnalysis.marketPosition})`);
  
  return result;
}

/**
 * Convert from old time estimation format to enhanced format
 */
export function convertToEnhancedInput(
  oldInput: any,
  teamSize: number = 2,
  propertyType: 'lägenhet' | 'villa' | 'kontor' = 'lägenhet'
): EnhancedTimeEstimationInput {
  return {
    volume: oldInput.volume,
    distance: oldInput.distance || 10,
    teamSize,
    propertyType,
    livingArea: Math.round(oldInput.volume / 0.3), // Estimate living area from volume
    floors: oldInput.floors,
    elevatorType: {
      from: oldInput.hasElevator?.from ? 'stor' : 'ingen',
      to: oldInput.hasElevator?.to ? 'stor' : 'ingen'
    },
    services: oldInput.services || ['moving'],
    trafficFactor: 'normal'
  };
}

// Export for testing
export { getTeamEfficiency, calculateImprovedVolume };