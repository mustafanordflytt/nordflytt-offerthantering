/**
 * Standardized time estimation for moving jobs
 * Based on industry standards and consistent across all CRM sections
 */

export interface TimeEstimationInput {
  volume: number;          // m³
  distance: number;        // km (one way)
  floors?: {
    from: number;
    to: number;
  };
  hasElevator?: {
    from: boolean;
    to: boolean;
  };
  services?: string[];     // Additional services like packing
}

export interface TimeEstimationResult {
  totalHours: number;
  breakdown: {
    loadingHours: number;
    unloadingHours: number;
    drivingHours: number;
    additionalHours: number;
  };
  description: string;
}

/**
 * Calculate estimated time for a moving job
 * Industry standard: 2.5-3 m³ per hour for loading/unloading
 */
export function calculateEstimatedTime(input: TimeEstimationInput): TimeEstimationResult {
  // Base rates (industry standards)
  const VOLUME_PER_HOUR = 2.5;  // m³ per hour for loading/unloading
  const AVERAGE_SPEED_KM = 40;  // Average speed in city/suburban areas
  const FLOOR_PENALTY_MINUTES = 15; // Extra time per floor without elevator
  
  // Calculate loading/unloading time
  const loadingHours = input.volume / VOLUME_PER_HOUR / 2;  // Half for loading
  const unloadingHours = input.volume / VOLUME_PER_HOUR / 2; // Half for unloading
  
  // Calculate driving time (round trip)
  const drivingHours = (input.distance * 2) / AVERAGE_SPEED_KM;
  
  // Calculate additional time for floors without elevator
  let additionalHours = 0;
  
  if (input.floors && input.hasElevator) {
    // Add time for floors without elevator
    if (!input.hasElevator.from && input.floors.from > 0) {
      additionalHours += (input.floors.from * FLOOR_PENALTY_MINUTES) / 60;
    }
    if (!input.hasElevator.to && input.floors.to > 0) {
      additionalHours += (input.floors.to * FLOOR_PENALTY_MINUTES) / 60;
    }
  }
  
  // Add time for additional services
  if (input.services?.includes('packing')) {
    additionalHours += 2; // Extra time for packing service
  }
  if (input.services?.includes('cleaning')) {
    additionalHours += 1.5; // Extra time for cleaning
  }
  
  // Calculate total (with minimum of 3 hours)
  const totalHours = Math.max(
    3, // Minimum job time
    Math.ceil(loadingHours + unloadingHours + drivingHours + additionalHours)
  );
  
  // Create description
  const description = `Beräknad tid: ${totalHours} timmar (${input.volume} m³, ${input.distance} km)`;
  
  return {
    totalHours,
    breakdown: {
      loadingHours: Math.round(loadingHours * 10) / 10,
      unloadingHours: Math.round(unloadingHours * 10) / 10,
      drivingHours: Math.round(drivingHours * 10) / 10,
      additionalHours: Math.round(additionalHours * 10) / 10
    },
    description
  };
}

/**
 * Get time estimation from booking data
 */
export function getTimeEstimationFromBooking(booking: any): TimeEstimationResult {
  const input: TimeEstimationInput = {
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
    services: booking.service_types || []
  };
  
  return calculateEstimatedTime(input);
}