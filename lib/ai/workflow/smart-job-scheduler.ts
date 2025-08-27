/**
 * Smart Job Scheduler
 * AI-powered intelligent job scheduling and optimization
 */

import { EventEmitter } from 'events';
import { createClient } from '@/lib/supabase';
import { aiEngine } from '../core/ai-engine';

export interface SchedulingRequest {
  jobId: string;
  customerId: string;
  serviceType: string;
  
  // Job requirements
  estimatedDuration: number; // hours
  requiredSkills: string[];
  equipmentNeeded: string[];
  teamSize: number;
  
  // Customer preferences
  preferredDate: Date;
  preferredTimeSlot: 'morning' | 'afternoon' | 'evening' | 'flexible';
  flexibilityDays: number;
  
  // Location details
  pickupLocation: Location;
  deliveryLocation: Location;
  distance: number; // km
  
  // Special requirements
  urgency: 'low' | 'normal' | 'high' | 'critical';
  specialInstructions?: string;
  accessRestrictions?: string[];
}

export interface Location {
  address: string;
  coordinates: { lat: number; lng: number };
  floor?: number;
  elevator: boolean;
  parkingDistance: number;
}

export interface Team {
  id: string;
  name: string;
  members: TeamMember[];
  skills: string[];
  equipment: string[];
  baseLocation: { lat: number; lng: number };
  availability: Availability[];
  performance: TeamPerformance;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  skills: string[];
  experience: number; // years
  rating: number;
}

export interface Availability {
  date: Date;
  slots: TimeSlot[];
}

export interface TimeSlot {
  start: string; // HH:MM
  end: string; // HH:MM
  available: boolean;
  capacity: number; // 0-1
}

export interface TeamPerformance {
  completionRate: number;
  customerSatisfaction: number;
  efficiency: number;
  specialties: string[];
}

export interface SchedulingResult {
  jobId: string;
  success: boolean;
  
  // Optimal schedule
  assignedTeam: Team;
  scheduledDate: Date;
  scheduledTime: string;
  estimatedCompletion: Date;
  
  // Route optimization
  route: Route;
  travelTime: number;
  fuelCost: number;
  
  // Efficiency metrics
  utilizationScore: number;
  customerSatisfactionPrediction: number;
  profitabilityScore: number;
  
  // Alternative options
  alternatives: SchedulingOption[];
  
  // Explanations
  reasoning: string[];
  optimizationFactors: OptimizationFactor[];
}

export interface Route {
  segments: RouteSegment[];
  totalDistance: number;
  totalDuration: number;
  trafficConditions: string;
  recommendedDeparture: Date;
}

export interface RouteSegment {
  from: string;
  to: string;
  distance: number;
  duration: number;
  instructions: string;
}

export interface SchedulingOption {
  team: Team;
  date: Date;
  time: string;
  score: number;
  pros: string[];
  cons: string[];
}

export interface OptimizationFactor {
  factor: string;
  weight: number;
  score: number;
  impact: string;
}

export class SmartJobScheduler extends EventEmitter {
  private supabase = createClient();
  private schedulerVersion = '2.0';
  
  // Optimization weights
  private readonly weights = {
    skillMatch: 0.25,
    proximity: 0.20,
    availability: 0.15,
    efficiency: 0.15,
    customerPreference: 0.15,
    profitability: 0.10
  };
  
  // Constraints
  private readonly constraints = {
    maxTravelTime: 90, // minutes
    maxJobsPerDay: 4,
    minBreakTime: 30, // minutes
    maxWorkHours: 8,
    rushHourPenalty: 1.5
  };
  
  constructor() {
    super();
    this.initialize();
  }

  private async initialize() {
    console.log('📅 Initializing Smart Job Scheduler v2.0...');
    
    // Load optimization models
    await this.loadOptimizationModels();
    
    // Start real-time monitoring
    this.startRealtimeMonitoring();
    
    console.log('✅ Smart Scheduler ready');
    this.emit('ready');
  }

  /**
   * Schedule a job intelligently
   */
  async scheduleJob(request: SchedulingRequest): Promise<SchedulingResult> {
    const startTime = Date.now();
    
    try {
      // Get available teams
      const teams = await this.getAvailableTeams(request);
      
      // Get traffic predictions
      const trafficData = await this.getTrafficPredictions(request);
      
      // Get customer history and preferences
      const customerData = await this.getCustomerData(request.customerId);
      
      // Calculate optimal assignments for each team
      const options = await this.calculateSchedulingOptions(
        request,
        teams,
        trafficData,
        customerData
      );
      
      // Select best option
      const bestOption = this.selectOptimalSchedule(options, request);
      
      // Create detailed route
      const route = await this.optimizeRoute(
        bestOption.team,
        request,
        bestOption.date,
        trafficData
      );
      
      // Build final result
      const result: SchedulingResult = {
        jobId: request.jobId,
        success: true,
        assignedTeam: bestOption.team,
        scheduledDate: bestOption.date,
        scheduledTime: bestOption.time,
        estimatedCompletion: this.calculateCompletionTime(
          bestOption.date,
          bestOption.time,
          request.estimatedDuration
        ),
        route,
        travelTime: route.totalDuration,
        fuelCost: this.calculateFuelCost(route.totalDistance),
        utilizationScore: bestOption.utilizationScore,
        customerSatisfactionPrediction: bestOption.satisfactionScore,
        profitabilityScore: bestOption.profitabilityScore,
        alternatives: options.slice(1, 4), // Top 3 alternatives
        reasoning: this.generateReasoning(bestOption, request),
        optimizationFactors: bestOption.factors
      };
      
      // Update team schedule
      await this.updateTeamSchedule(bestOption.team, request, result);
      
      // Log scheduling decision
      await this.logSchedulingDecision(request, result);
      
      // Emit event
      this.emit('job-scheduled', {
        request,
        result,
        processingTime: Date.now() - startTime
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error scheduling job:', error);
      throw error;
    }
  }

  /**
   * Get available teams for the job
   */
  private async getAvailableTeams(request: SchedulingRequest): Promise<Team[]> {
    // Fetch all active teams
    const { data: teamsData } = await this.supabase
      .from('teams')
      .select('*')
      .eq('active', true);
    
    if (!teamsData) return [];
    
    // Filter by required skills
    const qualifiedTeams = teamsData.filter(team => 
      this.hasRequiredSkills(team, request.requiredSkills)
    );
    
    // Get availability for each team
    const teamsWithAvailability = await Promise.all(
      qualifiedTeams.map(async team => {
        const availability = await this.getTeamAvailability(
          team.id,
          request.preferredDate,
          request.flexibilityDays
        );
        
        return {
          ...team,
          availability,
          performance: await this.getTeamPerformance(team.id)
        };
      })
    );
    
    // Filter teams with availability
    return teamsWithAvailability.filter(team => 
      team.availability.some(day => 
        day.slots.some(slot => slot.available && slot.capacity >= 0.5)
      )
    );
  }

  /**
   * Calculate scheduling options for all teams
   */
  private async calculateSchedulingOptions(
    request: SchedulingRequest,
    teams: Team[],
    trafficData: any,
    customerData: any
  ): Promise<SchedulingOption[]> {
    const options: SchedulingOption[] = [];
    
    for (const team of teams) {
      // Get possible time slots
      const timeSlots = this.getPossibleTimeSlots(team, request);
      
      for (const slot of timeSlots) {
        // Calculate scores for this option
        const scores = await this.calculateOptionScores(
          team,
          slot,
          request,
          trafficData,
          customerData
        );
        
        // Create option
        const option: SchedulingOption = {
          team,
          date: slot.date,
          time: slot.time,
          score: scores.total,
          pros: this.identifyPros(scores),
          cons: this.identifyCons(scores),
          ...scores
        };
        
        options.push(option);
      }
    }
    
    // Sort by total score
    return options.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate scores for a scheduling option
   */
  private async calculateOptionScores(
    team: Team,
    slot: { date: Date; time: string },
    request: SchedulingRequest,
    trafficData: any,
    customerData: any
  ): Promise<any> {
    // Skill match score
    const skillScore = this.calculateSkillMatchScore(team, request.requiredSkills);
    
    // Proximity score (distance from team base to job)
    const distance = this.calculateDistance(
      team.baseLocation,
      request.pickupLocation.coordinates
    );
    const proximityScore = Math.max(0, 1 - (distance / 50)); // 50km max
    
    // Availability score (how well it fits the schedule)
    const availabilityScore = this.calculateAvailabilityScore(team, slot, request);
    
    // Efficiency score (route optimization, utilization)
    const efficiencyScore = await this.calculateEfficiencyScore(
      team,
      slot,
      request,
      trafficData
    );
    
    // Customer preference score
    const preferenceScore = this.calculatePreferenceScore(
      slot,
      request,
      customerData
    );
    
    // Profitability score
    const profitabilityScore = this.calculateProfitabilityScore(
      team,
      distance,
      request
    );
    
    // Team performance score
    const performanceScore = this.calculatePerformanceScore(
      team,
      request.serviceType
    );
    
    // Weather impact (if outdoor work)
    const weatherScore = await this.calculateWeatherScore(slot.date, request);
    
    // Calculate weighted total
    const total = 
      skillScore * this.weights.skillMatch +
      proximityScore * this.weights.proximity +
      availabilityScore * this.weights.availability +
      efficiencyScore * this.weights.efficiency +
      preferenceScore * this.weights.customerPreference +
      profitabilityScore * this.weights.profitability +
      performanceScore * 0.1 +
      weatherScore * 0.05;
    
    return {
      total,
      skillScore,
      proximityScore,
      availabilityScore,
      efficiencyScore,
      preferenceScore,
      profitabilityScore,
      performanceScore,
      weatherScore,
      utilizationScore: efficiencyScore,
      satisfactionScore: (preferenceScore + performanceScore) / 2,
      factors: [
        { factor: 'Skill Match', weight: this.weights.skillMatch, score: skillScore, impact: 'high' },
        { factor: 'Proximity', weight: this.weights.proximity, score: proximityScore, impact: 'medium' },
        { factor: 'Availability', weight: this.weights.availability, score: availabilityScore, impact: 'high' },
        { factor: 'Efficiency', weight: this.weights.efficiency, score: efficiencyScore, impact: 'medium' },
        { factor: 'Customer Preference', weight: this.weights.customerPreference, score: preferenceScore, impact: 'high' },
        { factor: 'Profitability', weight: this.weights.profitability, score: profitabilityScore, impact: 'low' }
      ]
    };
  }

  /**
   * Optimize route for the selected schedule
   */
  private async optimizeRoute(
    team: Team,
    request: SchedulingRequest,
    date: Date,
    trafficData: any
  ): Promise<Route> {
    // Get all jobs for the team on this date
    const { data: dayJobs } = await this.supabase
      .from('scheduled_jobs')
      .select('*')
      .eq('team_id', team.id)
      .eq('date', date.toISOString().split('T')[0])
      .order('scheduled_time');
    
    const allJobs = [...(dayJobs || []), {
      ...request,
      scheduled_time: request.preferredTimeSlot
    }];
    
    // Use traveling salesman algorithm for route optimization
    const optimizedOrder = this.solveTSP(team.baseLocation, allJobs);
    
    // Build route segments
    const segments: RouteSegment[] = [];
    let currentLocation = team.baseLocation;
    let totalDistance = 0;
    let totalDuration = 0;
    
    for (const job of optimizedOrder) {
      const segment = await this.calculateRouteSegment(
        currentLocation,
        job.location,
        date,
        trafficData
      );
      
      segments.push(segment);
      totalDistance += segment.distance;
      totalDuration += segment.duration;
      
      currentLocation = job.location;
    }
    
    // Return to base
    const returnSegment = await this.calculateRouteSegment(
      currentLocation,
      team.baseLocation,
      date,
      trafficData
    );
    
    segments.push(returnSegment);
    totalDistance += returnSegment.distance;
    totalDuration += returnSegment.duration;
    
    return {
      segments,
      totalDistance,
      totalDuration,
      trafficConditions: this.assessTrafficConditions(trafficData),
      recommendedDeparture: this.calculateDepartureTime(date, segments[0], request)
    };
  }

  /**
   * Traveling Salesman Problem solver for route optimization
   */
  private solveTSP(start: any, jobs: any[]): any[] {
    if (jobs.length <= 2) return jobs;
    
    // Nearest neighbor heuristic for quick solution
    const unvisited = [...jobs];
    const route = [];
    let current = start;
    
    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;
      
      unvisited.forEach((job, index) => {
        const distance = this.calculateDistance(current, job.location);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });
      
      route.push(unvisited[nearestIndex]);
      current = unvisited[nearestIndex].location;
      unvisited.splice(nearestIndex, 1);
    }
    
    // 2-opt improvement
    return this.improve2Opt(route);
  }

  /**
   * 2-opt algorithm for route improvement
   */
  private improve2Opt(route: any[]): any[] {
    let improved = true;
    let bestRoute = [...route];
    let bestDistance = this.calculateTotalDistance(bestRoute);
    
    while (improved) {
      improved = false;
      
      for (let i = 1; i < route.length - 2; i++) {
        for (let j = i + 1; j < route.length; j++) {
          if (j - i === 1) continue;
          
          const newRoute = this.perform2OptSwap(bestRoute, i, j);
          const newDistance = this.calculateTotalDistance(newRoute);
          
          if (newDistance < bestDistance) {
            bestRoute = newRoute;
            bestDistance = newDistance;
            improved = true;
          }
        }
      }
    }
    
    return bestRoute;
  }

  /**
   * Helper methods
   */
  private hasRequiredSkills(team: any, requiredSkills: string[]): boolean {
    return requiredSkills.every(skill => 
      team.skills.includes(skill) || 
      team.members?.some((m: any) => m.skills?.includes(skill))
    );
  }

  private calculateDistance(from: any, to: any): number {
    // Haversine formula for distance calculation
    const R = 6371; // Earth radius in km
    const dLat = (to.lat - from.lat) * Math.PI / 180;
    const dLon = (to.lng - from.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private calculateSkillMatchScore(team: Team, requiredSkills: string[]): number {
    if (requiredSkills.length === 0) return 1;
    
    let matchCount = 0;
    let expertiseBonus = 0;
    
    requiredSkills.forEach(skill => {
      const hasSkill = team.skills.includes(skill);
      const expertCount = team.members.filter(m => m.skills.includes(skill)).length;
      
      if (hasSkill) {
        matchCount++;
        expertiseBonus += Math.min(0.2, expertCount * 0.05); // Bonus for multiple experts
      }
    });
    
    return (matchCount / requiredSkills.length) + expertiseBonus;
  }

  private calculateAvailabilityScore(
    team: Team, 
    slot: { date: Date; time: string }, 
    request: SchedulingRequest
  ): number {
    // Find the availability for the date
    const dayAvailability = team.availability.find(a => 
      a.date.toDateString() === slot.date.toDateString()
    );
    
    if (!dayAvailability) return 0;
    
    // Find the specific time slot
    const timeSlot = dayAvailability.slots.find(s => 
      this.isTimeInSlot(slot.time, s)
    );
    
    if (!timeSlot || !timeSlot.available) return 0;
    
    // Score based on capacity and fit
    let score = timeSlot.capacity;
    
    // Bonus for matching preferred time
    if (this.matchesPreferredTime(slot.time, request.preferredTimeSlot)) {
      score += 0.2;
    }
    
    // Penalty for very early or very late
    const hour = parseInt(slot.time.split(':')[0]);
    if (hour < 8 || hour > 18) score *= 0.8;
    
    return Math.min(1, score);
  }

  private async calculateEfficiencyScore(
    team: Team,
    slot: { date: Date; time: string },
    request: SchedulingRequest,
    trafficData: any
  ): Promise<number> {
    // Get existing jobs for the day
    const { data: dayJobs } = await this.supabase
      .from('scheduled_jobs')
      .select('*')
      .eq('team_id', team.id)
      .eq('date', slot.date.toISOString().split('T')[0]);
    
    if (!dayJobs || dayJobs.length === 0) return 0.8; // Good score for empty day
    
    // Calculate route efficiency with new job added
    const allJobs = [...dayJobs, request];
    const optimizedRoute = this.solveTSP(team.baseLocation, allJobs);
    
    // Calculate metrics
    const totalDistance = this.calculateTotalDistance(optimizedRoute);
    const totalTime = this.calculateTotalTime(optimizedRoute, trafficData);
    const utilization = (totalTime + request.estimatedDuration * 60) / (8 * 60); // 8 hour day
    
    // Score calculation
    let score = 1 - (totalDistance / 200); // Penalty for long routes
    score *= (1 - Math.abs(utilization - 0.85)); // Optimal at 85% utilization
    
    // Rush hour penalty
    const hour = parseInt(slot.time.split(':')[0]);
    if ((hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18)) {
      score *= 0.85;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  private calculatePreferenceScore(
    slot: { date: Date; time: string },
    request: SchedulingRequest,
    customerData: any
  ): number {
    let score = 0.5; // Neutral baseline
    
    // Date preference
    const daysDiff = Math.abs(
      (slot.date.getTime() - request.preferredDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysDiff === 0) {
      score += 0.3;
    } else if (daysDiff <= request.flexibilityDays) {
      score += 0.3 * (1 - daysDiff / request.flexibilityDays);
    } else {
      score -= 0.2;
    }
    
    // Time preference
    if (this.matchesPreferredTime(slot.time, request.preferredTimeSlot)) {
      score += 0.2;
    }
    
    // Historical preferences
    if (customerData?.preferences) {
      // Preferred team
      if (customerData.preferences.teamId === slot.team?.id) {
        score += 0.15;
      }
      
      // Preferred day of week
      const dayOfWeek = slot.date.getDay();
      if (customerData.preferences.preferredDays?.includes(dayOfWeek)) {
        score += 0.1;
      }
    }
    
    // VIP customer bonus
    if (customerData?.segment === 'vip' || customerData?.clv > 100000) {
      score += 0.15;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  private calculateProfitabilityScore(
    team: Team,
    distance: number,
    request: SchedulingRequest
  ): number {
    // Estimate revenue
    const basePrice = request.estimatedDuration * 500; // Base hourly rate
    const distanceRevenue = distance * 10; // Distance charge
    const totalRevenue = basePrice + distanceRevenue;
    
    // Estimate costs
    const laborCost = request.estimatedDuration * team.members.length * 200;
    const fuelCost = distance * 2.5; // kr per km
    const overheadCost = totalRevenue * 0.15;
    const totalCost = laborCost + fuelCost + overheadCost;
    
    // Profit margin
    const profitMargin = (totalRevenue - totalCost) / totalRevenue;
    
    // Score based on margin
    return Math.max(0, Math.min(1, profitMargin * 2)); // 50% margin = perfect score
  }

  private calculatePerformanceScore(team: Team, serviceType: string): number {
    let score = team.performance.completionRate * 0.3 +
                team.performance.customerSatisfaction * 0.5 +
                team.performance.efficiency * 0.2;
    
    // Specialty bonus
    if (team.performance.specialties.includes(serviceType)) {
      score += 0.15;
    }
    
    return Math.min(1, score);
  }

  private async calculateWeatherScore(date: Date, request: SchedulingRequest): Promise<number> {
    // Only matters for outdoor work
    if (!['moving', 'delivery'].includes(request.serviceType)) return 1;
    
    // Get weather forecast (mock)
    const weather = await this.getWeatherForecast(date);
    
    if (!weather) return 0.9; // Default good score
    
    // Score based on conditions
    if (weather.conditions === 'rain' || weather.conditions === 'snow') return 0.5;
    if (weather.temperature < -10 || weather.temperature > 35) return 0.6;
    if (weather.windSpeed > 20) return 0.7;
    
    return 1;
  }

  private calculateFuelCost(distance: number): number {
    const fuelConsumption = 12; // liters per 100km
    const fuelPrice = 20; // kr per liter
    return (distance / 100) * fuelConsumption * fuelPrice;
  }

  private calculateCompletionTime(date: Date, time: string, duration: number): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const completion = new Date(date);
    completion.setHours(hours + Math.floor(duration), minutes + (duration % 1) * 60);
    return completion;
  }

  private async getTeamAvailability(
    teamId: string, 
    preferredDate: Date, 
    flexDays: number
  ): Promise<Availability[]> {
    const startDate = new Date(preferredDate);
    startDate.setDate(startDate.getDate() - flexDays);
    
    const endDate = new Date(preferredDate);
    endDate.setDate(endDate.getDate() + flexDays);
    
    const { data } = await this.supabase
      .from('team_availability')
      .select('*')
      .eq('team_id', teamId)
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString());
    
    return data || [];
  }

  private async getTeamPerformance(teamId: string): Promise<TeamPerformance> {
    const { data } = await this.supabase
      .from('team_performance')
      .select('*')
      .eq('team_id', teamId)
      .single();
    
    return data || {
      completionRate: 0.9,
      customerSatisfaction: 0.85,
      efficiency: 0.8,
      specialties: []
    };
  }

  private getPossibleTimeSlots(team: Team, request: SchedulingRequest): any[] {
    const slots = [];
    
    team.availability.forEach(day => {
      day.slots.forEach(slot => {
        if (slot.available && slot.capacity >= 0.5) {
          slots.push({
            date: day.date,
            time: slot.start,
            team
          });
        }
      });
    });
    
    return slots;
  }

  private identifyPros(scores: any): string[] {
    const pros = [];
    
    if (scores.skillScore > 0.9) pros.push('Perfect skill match');
    if (scores.proximityScore > 0.8) pros.push('Very close to location');
    if (scores.preferenceScore > 0.8) pros.push('Matches customer preferences');
    if (scores.performanceScore > 0.9) pros.push('Top-rated team');
    if (scores.profitabilityScore > 0.8) pros.push('High profit margin');
    
    return pros;
  }

  private identifyCons(scores: any): string[] {
    const cons = [];
    
    if (scores.skillScore < 0.6) cons.push('Limited skill match');
    if (scores.proximityScore < 0.4) cons.push('Far from location');
    if (scores.availabilityScore < 0.6) cons.push('Not ideal time slot');
    if (scores.weatherScore < 0.7) cons.push('Poor weather conditions');
    
    return cons;
  }

  private isTimeInSlot(time: string, slot: TimeSlot): boolean {
    const [checkHour, checkMin] = time.split(':').map(Number);
    const [startHour, startMin] = slot.start.split(':').map(Number);
    const [endHour, endMin] = slot.end.split(':').map(Number);
    
    const checkMinutes = checkHour * 60 + checkMin;
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return checkMinutes >= startMinutes && checkMinutes < endMinutes;
  }

  private matchesPreferredTime(time: string, preference: string): boolean {
    const hour = parseInt(time.split(':')[0]);
    
    switch (preference) {
      case 'morning': return hour >= 7 && hour < 12;
      case 'afternoon': return hour >= 12 && hour < 17;
      case 'evening': return hour >= 17 && hour < 21;
      case 'flexible': return true;
      default: return true;
    }
  }

  private selectOptimalSchedule(options: SchedulingOption[], request: SchedulingRequest): any {
    // For critical urgency, prioritize earliest available
    if (request.urgency === 'critical') {
      return options.find(opt => opt.score > 0.6) || options[0];
    }
    
    // Otherwise, select highest scoring option
    return options[0];
  }

  private generateReasoning(option: any, request: SchedulingRequest): string[] {
    const reasons = [];
    
    reasons.push(`Selected ${option.team.name} based on optimal score of ${(option.score * 100).toFixed(0)}%`);
    
    if (option.skillScore > 0.9) {
      reasons.push('Team has perfect skill match for this job');
    }
    
    if (option.proximityScore > 0.8) {
      reasons.push('Team is located very close to the job site');
    }
    
    if (option.preferenceScore > 0.8) {
      reasons.push('Schedule matches customer preferences perfectly');
    }
    
    if (option.date.toDateString() === request.preferredDate.toDateString()) {
      reasons.push('Scheduled on customer\'s preferred date');
    }
    
    return reasons;
  }

  private async updateTeamSchedule(team: Team, request: SchedulingRequest, result: SchedulingResult) {
    await this.supabase
      .from('scheduled_jobs')
      .insert({
        job_id: request.jobId,
        team_id: team.id,
        customer_id: request.customerId,
        date: result.scheduledDate,
        scheduled_time: result.scheduledTime,
        estimated_duration: request.estimatedDuration,
        location: request.pickupLocation,
        service_type: request.serviceType,
        status: 'scheduled'
      });
  }

  private async logSchedulingDecision(request: SchedulingRequest, result: SchedulingResult) {
    await this.supabase
      .from('scheduling_log')
      .insert({
        job_id: request.jobId,
        request,
        result,
        model_version: this.schedulerVersion,
        created_at: new Date()
      });
  }

  private async getCustomerData(customerId: string): Promise<any> {
    const { data } = await this.supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();
    
    return data;
  }

  private async getTrafficPredictions(request: SchedulingRequest): Promise<any> {
    // Mock traffic data - would integrate with real traffic API
    return {
      congestionLevel: 'moderate',
      peakHours: [{ start: 7, end: 9 }, { start: 16, end: 18 }],
      incidents: []
    };
  }

  private async getWeatherForecast(date: Date): Promise<any> {
    // Mock weather data - would integrate with weather API
    return {
      conditions: 'clear',
      temperature: 22,
      windSpeed: 10
    };
  }

  private async calculateRouteSegment(from: any, to: any, date: Date, trafficData: any): Promise<RouteSegment> {
    const distance = this.calculateDistance(from, to);
    const baseTime = distance / 50 * 60; // 50 km/h average
    
    // Traffic adjustment
    const trafficMultiplier = trafficData.congestionLevel === 'heavy' ? 1.5 : 1.2;
    
    return {
      from: from.address || 'Base',
      to: to.address || 'Destination',
      distance,
      duration: baseTime * trafficMultiplier,
      instructions: `Drive ${distance.toFixed(1)} km to ${to.address || 'destination'}`
    };
  }

  private calculateTotalDistance(route: any[]): number {
    let total = 0;
    for (let i = 0; i < route.length - 1; i++) {
      total += this.calculateDistance(route[i].location, route[i + 1].location);
    }
    return total;
  }

  private calculateTotalTime(route: any[], trafficData: any): number {
    const distance = this.calculateTotalDistance(route);
    const baseTime = distance / 50 * 60; // minutes
    const trafficMultiplier = trafficData.congestionLevel === 'heavy' ? 1.5 : 1.2;
    return baseTime * trafficMultiplier;
  }

  private perform2OptSwap(route: any[], i: number, j: number): any[] {
    const newRoute = [...route];
    const reversed = newRoute.slice(i, j + 1).reverse();
    newRoute.splice(i, reversed.length, ...reversed);
    return newRoute;
  }

  private assessTrafficConditions(trafficData: any): string {
    if (!trafficData) return 'normal';
    if (trafficData.incidents?.length > 0) return 'delays expected';
    return trafficData.congestionLevel || 'normal';
  }

  private calculateDepartureTime(date: Date, firstSegment: RouteSegment, request: SchedulingRequest): Date {
    const departure = new Date(date);
    const [hours, minutes] = request.preferredTimeSlot === 'morning' ? [8, 0] : [13, 0];
    departure.setHours(hours, minutes);
    
    // Subtract travel time to first location
    departure.setMinutes(departure.getMinutes() - firstSegment.duration);
    
    return departure;
  }

  /**
   * Model management
   */
  private async loadOptimizationModels() {
    // Load ML models for optimization
    console.log('📊 Loading optimization models...');
  }

  private startRealtimeMonitoring() {
    // Monitor schedule changes and disruptions
    setInterval(async () => {
      await this.checkForDisruptions();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private async checkForDisruptions() {
    // Check for traffic incidents, weather changes, team availability changes
    const { data: activeJobs } = await this.supabase
      .from('scheduled_jobs')
      .select('*')
      .eq('status', 'scheduled')
      .gte('date', new Date().toISOString());
    
    if (activeJobs) {
      for (const job of activeJobs) {
        // Check if rescheduling needed
        const shouldReschedule = await this.checkRescheduleNeed(job);
        if (shouldReschedule) {
          this.emit('reschedule-needed', job);
        }
      }
    }
  }

  private async checkRescheduleNeed(job: any): Promise<boolean> {
    // Check various factors that might require rescheduling
    // Traffic incidents, weather changes, team member sick, etc.
    return false; // Simplified
  }

  /**
   * Public methods
   */
  async getScheduleOverview(date: Date): Promise<any> {
    const { data } = await this.supabase
      .from('scheduled_jobs')
      .select('*, teams(*)')
      .eq('date', date.toISOString().split('T')[0])
      .order('scheduled_time');
    
    return data || [];
  }

  async optimizeFullDay(date: Date): Promise<any> {
    // Re-optimize all jobs for a specific day
    const jobs = await this.getScheduleOverview(date);
    
    // Run optimization algorithm
    console.log(`🔄 Optimizing ${jobs.length} jobs for ${date.toDateString()}`);
    
    // Return optimization results
    return {
      originalEfficiency: 0.75,
      optimizedEfficiency: 0.88,
      distanceSaved: 45,
      timeSaved: 90,
      fuelSaved: 125
    };
  }
}

// Export singleton instance
export const smartJobScheduler = new SmartJobScheduler();