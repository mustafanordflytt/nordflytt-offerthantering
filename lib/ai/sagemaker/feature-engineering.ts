/**
 * Feature Engineering for Nordflytt ML Model
 * Transforms CRM job data into ML model features
 */

import { EnhancedTimeEstimationInput } from '@/lib/utils/enhanced-time-estimation';

export interface NordflyttMLFeatures {
  living_area: number;
  team_size: number;
  distance_km: number;
  floors: number;
  weather_score: number;
  customer_preparation: number;
  enhanced_v21_estimate: number;
  property_type_villa: number;
  property_type_kontor: number;
  elevator_ingen: number;
  elevator_liten: number;
}

export class FeatureEngineer {
  /**
   * Transform CRM job data to ML features
   */
  static transformJobToFeatures(
    jobData: Partial<EnhancedTimeEstimationInput>,
    baselineEstimate: number
  ): NordflyttMLFeatures {
    // Extract basic features
    const livingArea = jobData.livingArea || 70;
    const teamSize = jobData.teamSize || 2;
    const distance = jobData.distance || 10;
    
    // Calculate max floor
    const floors = Math.max(
      jobData.floors?.from || 0,
      jobData.floors?.to || 0
    );
    
    // Calculate weather score
    const weatherScore = this.calculateWeatherScore(new Date());
    
    // Estimate customer preparation (can be enhanced with real data)
    const customerPreparation = this.estimateCustomerPreparation(jobData);
    
    // Property type encoding
    const propertyType = jobData.propertyType || 'lägenhet';
    const property_type_villa = propertyType === 'villa' ? 1 : 0;
    const property_type_kontor = propertyType === 'kontor' ? 1 : 0;
    
    // Elevator type encoding
    const elevatorFrom = jobData.elevatorType?.from || 'ingen';
    const elevatorTo = jobData.elevatorType?.to || 'ingen';
    
    // Use worst case elevator scenario
    const hasNoElevator = elevatorFrom === 'ingen' || elevatorTo === 'ingen';
    const hasSmallElevator = !hasNoElevator && 
      (elevatorFrom === 'liten' || elevatorTo === 'liten');
    
    const elevator_ingen = hasNoElevator ? 1 : 0;
    const elevator_liten = hasSmallElevator ? 1 : 0;
    
    return {
      living_area: this.validateNumeric(livingArea, 1, 500),
      team_size: this.validateNumeric(teamSize, 1, 6),
      distance_km: this.validateNumeric(distance, 0.1, 200),
      floors: this.validateNumeric(floors, 0, 20),
      weather_score: this.validateNumeric(weatherScore, 0, 1),
      customer_preparation: this.validateNumeric(customerPreparation, 0, 1),
      enhanced_v21_estimate: this.validateNumeric(baselineEstimate, 1, 50),
      property_type_villa,
      property_type_kontor,
      elevator_ingen,
      elevator_liten
    };
  }
  
  /**
   * Calculate weather score based on date and season
   */
  static calculateWeatherScore(date: Date): number {
    const month = date.getMonth();
    
    // Swedish weather patterns
    const monthlyScores: Record<number, number> = {
      0: 0.3,  // January - cold, snow, ice
      1: 0.3,  // February - cold, snow
      2: 0.5,  // March - variable, melting snow
      3: 0.6,  // April - spring, rain
      4: 0.8,  // May - good weather
      5: 0.9,  // June - best weather
      6: 0.9,  // July - best weather
      7: 0.9,  // August - best weather
      8: 0.7,  // September - good, some rain
      9: 0.5,  // October - rain, getting cold
      10: 0.4, // November - cold, rain, dark
      11: 0.3  // December - cold, snow, dark
    };
    
    let score = monthlyScores[month] || 0.7;
    
    // Adjust for day of week (weekends slightly better)
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      score += 0.05;
    }
    
    // Adjust for time of day (if available)
    const hour = date.getHours();
    if (hour >= 9 && hour <= 16) {
      score += 0.05; // Daylight hours bonus
    } else if (hour < 6 || hour > 20) {
      score -= 0.1; // Early/late penalty
    }
    
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * Estimate customer preparation level
   */
  static estimateCustomerPreparation(jobData: any): number {
    let score = 0.7; // Base preparation level
    
    // Increase if packing service requested (customer less prepared)
    if (jobData.services?.includes('packing')) {
      score -= 0.2;
    }
    
    // Increase if cleaning service requested
    if (jobData.services?.includes('cleaning')) {
      score -= 0.1;
    }
    
    // Adjust based on property type
    if (jobData.propertyType === 'kontor') {
      score += 0.1; // Offices usually better organized
    }
    
    // Adjust based on volume (larger moves often less organized)
    const volume = jobData.volume || 20;
    if (volume > 50) {
      score -= 0.1;
    } else if (volume < 15) {
      score += 0.1;
    }
    
    // Ensure valid range
    return Math.max(0.1, Math.min(0.95, score));
  }
  
  /**
   * Validate numeric features
   */
  static validateNumeric(value: number, min: number, max: number): number {
    if (isNaN(value) || value === null || value === undefined) {
      return (min + max) / 2; // Return midpoint as default
    }
    return Math.max(min, Math.min(max, value));
  }
  
  /**
   * Extract features from booking data format
   */
  static extractFromBooking(booking: any, baselineEstimate: number): NordflyttMLFeatures {
    const details = booking.details || {};
    
    const jobData: Partial<EnhancedTimeEstimationInput> = {
      livingArea: parseInt(details.startLivingArea) || parseInt(details.endLivingArea) || 70,
      teamSize: 2, // Default, can be enhanced
      distance: parseFloat(details.calculatedDistance) || 10,
      propertyType: details.startPropertyType === 'house' ? 'villa' : 
                   details.startPropertyType === 'office' ? 'kontor' : 'lägenhet',
      floors: {
        from: parseInt(details.startFloor) || 0,
        to: parseInt(details.endFloor) || 0
      },
      elevatorType: {
        from: this.mapElevatorType(details.startElevator),
        to: this.mapElevatorType(details.endElevator)
      },
      services: booking.service_types || [],
      volume: details.estimatedVolume || 20
    };
    
    return this.transformJobToFeatures(jobData, baselineEstimate);
  }
  
  /**
   * Map various elevator formats to standard types
   */
  static mapElevatorType(elevator: string): 'ingen' | 'liten' | 'stor' {
    if (!elevator || elevator === 'none' || elevator === 'trappa') {
      return 'ingen';
    }
    if (elevator === 'small' || elevator === 'liten') {
      return 'liten';
    }
    if (elevator === 'big' || elevator === 'stor' || elevator === 'hiss') {
      return 'stor';
    }
    return 'ingen';
  }
  
  /**
   * Prepare batch features for multiple predictions
   */
  static prepareBatchFeatures(
    jobs: Array<Partial<EnhancedTimeEstimationInput>>,
    baselineEstimates: number[]
  ): number[][] {
    return jobs.map((job, index) => {
      const features = this.transformJobToFeatures(job, baselineEstimates[index]);
      return [
        features.living_area,
        features.team_size,
        features.distance_km,
        features.floors,
        features.weather_score,
        features.customer_preparation,
        features.enhanced_v21_estimate,
        features.property_type_villa,
        features.property_type_kontor,
        features.elevator_ingen,
        features.elevator_liten
      ];
    });
  }
  
  /**
   * Get feature importance explanations
   */
  static explainFeatures(features: NordflyttMLFeatures): Record<string, string> {
    return {
      living_area: `${features.living_area} m² - ${features.living_area < 50 ? 'Small' : features.living_area < 100 ? 'Medium' : 'Large'} property`,
      team_size: `${features.team_size} people - ${features.team_size === 1 ? 'Solo' : features.team_size <= 3 ? 'Standard' : 'Large'} team`,
      distance_km: `${features.distance_km} km - ${features.distance_km < 10 ? 'Local' : features.distance_km < 50 ? 'Regional' : 'Long distance'} move`,
      floors: `Floor ${features.floors} - ${features.floors === 0 ? 'Ground level' : features.floors <= 2 ? 'Low' : 'High'} floor`,
      weather_score: `${(features.weather_score * 100).toFixed(0)}% - ${features.weather_score > 0.7 ? 'Good' : features.weather_score > 0.5 ? 'Fair' : 'Poor'} weather`,
      customer_preparation: `${(features.customer_preparation * 100).toFixed(0)}% - Customer ${features.customer_preparation > 0.7 ? 'well' : features.customer_preparation > 0.5 ? 'moderately' : 'poorly'} prepared`,
      enhanced_v21_estimate: `${features.enhanced_v21_estimate}h baseline estimate`,
      property_type: features.property_type_villa ? 'Villa' : features.property_type_kontor ? 'Office' : 'Apartment',
      elevator: features.elevator_ingen ? 'No elevator' : features.elevator_liten ? 'Small elevator' : 'Large elevator'
    };
  }
}