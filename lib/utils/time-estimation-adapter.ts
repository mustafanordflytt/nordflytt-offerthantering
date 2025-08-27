/**
 * Adapter to help migrate from old time estimation to enhanced time estimation
 * Provides backward compatibility while transitioning to the new algorithm
 */

import { calculateEnhancedEstimatedTime, EnhancedTimeEstimationInput } from './enhanced-time-estimation';
import { calculateEstimatedTime, TimeEstimationInput } from './time-estimation';

/**
 * Convert old time estimation input to enhanced format
 */
export function convertToEnhancedInput(
  oldInput: TimeEstimationInput,
  additionalData?: {
    teamSize?: number;
    propertyType?: 'lägenhet' | 'villa' | 'kontor';
    livingArea?: number;
    parkingDistance?: { from: number; to: number };
    trafficFactor?: 'helg' | 'normal' | 'rusningstid';
  }
): EnhancedTimeEstimationInput {
  // Estimate living area from volume if not provided
  const livingArea = additionalData?.livingArea || Math.round(oldInput.volume / 0.3);
  
  // Convert elevator boolean to type
  const elevatorTypeFrom = oldInput.hasElevator?.from ? 'stor' : 'ingen';
  const elevatorTypeTo = oldInput.hasElevator?.to ? 'stor' : 'ingen';
  
  return {
    volume: oldInput.volume,
    distance: oldInput.distance,
    teamSize: additionalData?.teamSize || 2,
    propertyType: additionalData?.propertyType || 'lägenhet',
    livingArea,
    floors: oldInput.floors,
    elevatorType: {
      from: elevatorTypeFrom,
      to: elevatorTypeTo
    },
    parkingDistance: additionalData?.parkingDistance || { from: 0, to: 0 },
    services: oldInput.services,
    trafficFactor: additionalData?.trafficFactor || 'normal',
    heavyItems: oldInput.heavyItems,
    specialItems: oldInput.specialItems
  };
}

/**
 * Backward compatible function that uses enhanced algorithm but accepts old format
 */
export function calculateTimeBackwardCompatible(
  oldInput: TimeEstimationInput,
  useEnhanced: boolean = true
) {
  if (!useEnhanced) {
    // Use old algorithm for comparison
    return calculateEstimatedTime(oldInput);
  }
  
  // Convert to enhanced format and calculate
  const enhancedInput = convertToEnhancedInput(oldInput);
  const enhancedResult = calculateEnhancedEstimatedTime(enhancedInput);
  
  // Return in old format for compatibility
  return {
    totalHours: enhancedResult.totalHours,
    breakdown: {
      loadingHours: enhancedResult.breakdown.loadingHours,
      unloadingHours: enhancedResult.breakdown.unloadingHours,
      drivingHours: enhancedResult.breakdown.drivingHours,
      packingHours: enhancedResult.breakdown.packingHours || 0,
      cleaningHours: enhancedResult.breakdown.cleaningHours || 0,
      additionalHours: enhancedResult.breakdown.additionalHours
    },
    description: enhancedResult.description
  };
}

/**
 * Extract additional data from booking details for enhanced calculation
 */
export function extractEnhancedDataFromBooking(booking: any) {
  return {
    teamSize: booking.details?.teamSize || 2,
    propertyType: booking.details?.startPropertyType === 'house' ? 'villa' as const : 
                  booking.details?.startPropertyType === 'office' ? 'kontor' as const : 
                  'lägenhet' as const,
    livingArea: parseInt(booking.details?.startLivingArea) || 70,
    parkingDistance: {
      from: parseInt(booking.details?.startParkingDistance) || 0,
      to: parseInt(booking.details?.endParkingDistance) || 0
    },
    trafficFactor: 'normal' as const
  };
}