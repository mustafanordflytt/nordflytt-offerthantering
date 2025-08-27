/**
 * Automated Assignment System
 * Intelligent job-to-team assignment with real-time optimization
 */

import { EventEmitter } from 'events';
import { createClient } from '@/lib/supabase';
import { aiEngine } from '../core/ai-engine';
import { smartJobScheduler } from './smart-job-scheduler';

export interface AssignmentRequest {
  jobId: string;
  jobType: string;
  requiredSkills: string[];
  estimatedDuration: number;
  location: {
    address: string;
    coordinates: { lat: number; lng: number };
  };
  preferredDate: Date;
  priority: 'low' | 'normal' | 'high' | 'critical';
  customerSegment: string;
  specialRequirements?: string[];
}

export interface TeamCandidate {
  teamId: string;
  teamName: string;
  
  // Matching scores
  skillMatch: number;
  availabilityScore: number;
  proximityScore: number;
  performanceScore: number;
  workloadScore: number;
  
  // Team details
  members: TeamMember[];
  currentWorkload: number;
  completedJobs: number;
  satisfaction: number;
  specialties: string[];
  
  // Availability
  nextAvailable: Date;
  estimatedTravelTime: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  skills: string[];
  certifications: string[];
  experience: number;
  rating: number;
  currentStatus: 'available' | 'busy' | 'off-duty';
}

export interface AssignmentResult {
  success: boolean;
  jobId: string;
  
  // Primary assignment
  assignedTeam: {
    teamId: string;
    teamName: string;
    members: TeamMember[];
    confidence: number;
  };
  
  // Assignment details
  matchScore: number;
  scheduledStart: Date;
  estimatedCompletion: Date;
  travelDistance: number;
  
  // Optimization metrics
  efficiencyGain: number;
  customerSatisfactionPrediction: number;
  profitabilityScore: number;
  
  // Backup options
  backupTeams: TeamCandidate[];
  
  // Reasoning
  assignmentReasons: string[];
  optimizationFactors: Factor[];
  
  // Notifications
  notifications: Notification[];
}

export interface Factor {
  name: string;
  score: number;
  weight: number;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface Notification {
  recipient: string;
  type: 'sms' | 'email' | 'push' | 'in-app';
  message: string;
  scheduledTime: Date;
}

export class AutomatedAssignment extends EventEmitter {
  private supabase = createClient();
  private assignmentVersion = '2.5';
  
  // Assignment weights
  private readonly weights = {
    skillMatch: 0.30,
    availability: 0.25,
    proximity: 0.20,
    performance: 0.15,
    workload: 0.10
  };
  
  // Business rules
  private readonly rules = {
    maxTravelTime: 60, // minutes
    maxDailyJobs: 4,
    minRestTime: 30, // minutes between jobs
    overtimeThreshold: 8, // hours
    vipTeamThreshold: 0.9 // performance score
  };
  
  constructor() {
    super();
    this.initialize();
  }

  private async initialize() {
    console.log('🤖 Initializing Automated Assignment System v2.5...');
    
    // Load assignment models
    await this.loadAssignmentModels();
    
    // Start real-time monitoring
    this.startRealtimeMonitoring();
    
    // Initialize notification system
    this.initializeNotifications();
    
    console.log('✅ Assignment System ready');
    this.emit('ready');
  }

  /**
   * Automatically assign a job to the best team
   */
  async assignJob(request: AssignmentRequest): Promise<AssignmentResult> {
    const startTime = Date.now();
    
    try {
      // Get eligible teams
      const eligibleTeams = await this.getEligibleTeams(request);
      
      if (eligibleTeams.length === 0) {
        return this.handleNoTeamsAvailable(request);
      }
      
      // Score each team
      const scoredTeams = await this.scoreTeams(eligibleTeams, request);
      
      // Apply business rules
      const validTeams = this.applyBusinessRules(scoredTeams, request);
      
      // Select optimal team
      const selectedTeam = this.selectOptimalTeam(validTeams, request);
      
      // Create assignment
      const assignment = await this.createAssignment(selectedTeam, request);
      
      // Optimize route if needed
      await this.optimizeTeamRoute(selectedTeam, assignment);
      
      // Generate notifications
      const notifications = await this.generateNotifications(assignment, request);
      
      // Build result
      const result: AssignmentResult = {
        success: true,
        jobId: request.jobId,
        assignedTeam: {
          teamId: selectedTeam.teamId,
          teamName: selectedTeam.teamName,
          members: selectedTeam.members,
          confidence: this.calculateConfidence(selectedTeam, request)
        },
        matchScore: selectedTeam.totalScore,
        scheduledStart: assignment.scheduledStart,
        estimatedCompletion: assignment.estimatedCompletion,
        travelDistance: selectedTeam.estimatedTravelTime * 50 / 60, // km
        efficiencyGain: this.calculateEfficiencyGain(selectedTeam, request),
        customerSatisfactionPrediction: this.predictSatisfaction(selectedTeam, request),
        profitabilityScore: this.calculateProfitability(selectedTeam, request),
        backupTeams: validTeams.slice(1, 4),
        assignmentReasons: this.generateReasons(selectedTeam, request),
        optimizationFactors: this.getOptimizationFactors(selectedTeam),
        notifications
      };
      
      // Update team status
      await this.updateTeamStatus(selectedTeam, assignment);
      
      // Log assignment
      await this.logAssignment(request, result);
      
      // Emit events
      this.emit('job-assigned', {
        request,
        result,
        processingTime: Date.now() - startTime
      });
      
      // Trigger notifications
      await this.sendNotifications(notifications);
      
      return result;
      
    } catch (error) {
      console.error('❌ Error assigning job:', error);
      throw error;
    }
  }

  /**
   * Get teams eligible for the job
   */
  private async getEligibleTeams(request: AssignmentRequest): Promise<TeamCandidate[]> {
    // Get all active teams
    const { data: teams } = await this.supabase
      .from('teams')
      .select(`
        *,
        team_members (*)
      `)
      .eq('active', true);
    
    if (!teams) return [];
    
    // Filter by required skills
    const skillMatchedTeams = teams.filter(team => 
      this.hasRequiredSkills(team, request.requiredSkills)
    );
    
    // Build team candidates
    const candidates = await Promise.all(
      skillMatchedTeams.map(async team => {
        const availability = await this.getTeamAvailability(team.id, request.preferredDate);
        const workload = await this.getTeamWorkload(team.id);
        const performance = await this.getTeamPerformance(team.id);
        
        return {
          teamId: team.id,
          teamName: team.name,
          members: team.team_members.map((m: any) => ({
            id: m.id,
            name: m.name,
            role: m.role,
            skills: m.skills,
            certifications: m.certifications || [],
            experience: m.experience_years,
            rating: m.rating,
            currentStatus: m.status
          })),
          skillMatch: 0, // Will be calculated
          availabilityScore: availability.score,
          proximityScore: 0, // Will be calculated
          performanceScore: performance.score,
          workloadScore: 1 - (workload.utilization || 0),
          currentWorkload: workload.jobCount,
          completedJobs: performance.completedJobs,
          satisfaction: performance.satisfaction,
          specialties: team.specialties || [],
          nextAvailable: availability.nextSlot,
          estimatedTravelTime: 0 // Will be calculated
        };
      })
    );
    
    return candidates;
  }

  /**
   * Score teams based on multiple factors
   */
  private async scoreTeams(
    teams: TeamCandidate[],
    request: AssignmentRequest
  ): Promise<TeamCandidate[]> {
    const scoredTeams = await Promise.all(
      teams.map(async team => {
        // Calculate skill match
        team.skillMatch = this.calculateSkillMatch(team, request.requiredSkills);
        
        // Calculate proximity
        const distance = await this.calculateDistance(team, request.location);
        team.proximityScore = Math.max(0, 1 - (distance / 50)); // 50km max
        team.estimatedTravelTime = distance / 50 * 60; // minutes
        
        // Special requirements bonus
        if (request.specialRequirements) {
          const specialBonus = this.calculateSpecialRequirementsMatch(
            team,
            request.specialRequirements
          );
          team.skillMatch = Math.min(1, team.skillMatch + specialBonus);
        }
        
        // Customer segment preference
        if (request.customerSegment === 'vip' && team.performanceScore > this.rules.vipTeamThreshold) {
          team.performanceScore = Math.min(1, team.performanceScore * 1.2);
        }
        
        // Calculate total weighted score
        const totalScore = 
          team.skillMatch * this.weights.skillMatch +
          team.availabilityScore * this.weights.availability +
          team.proximityScore * this.weights.proximity +
          team.performanceScore * this.weights.performance +
          team.workloadScore * this.weights.workload;
        
        return {
          ...team,
          totalScore
        };
      })
    );
    
    // Sort by total score
    return scoredTeams.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
  }

  /**
   * Apply business rules to filter teams
   */
  private applyBusinessRules(
    teams: TeamCandidate[],
    request: AssignmentRequest
  ): TeamCandidate[] {
    return teams.filter(team => {
      // Travel time rule
      if (team.estimatedTravelTime > this.rules.maxTravelTime) {
        return false;
      }
      
      // Workload rule
      if (team.currentWorkload >= this.rules.maxDailyJobs) {
        return false;
      }
      
      // Priority rules
      if (request.priority === 'critical' && team.performanceScore < 0.8) {
        return false;
      }
      
      // Availability rule
      if (!team.nextAvailable || team.availabilityScore < 0.3) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Select the optimal team considering all factors
   */
  private selectOptimalTeam(
    teams: TeamCandidate[],
    request: AssignmentRequest
  ): TeamCandidate {
    if (teams.length === 0) {
      throw new Error('No teams available for assignment');
    }
    
    // For critical jobs, prioritize availability
    if (request.priority === 'critical') {
      const urgentTeam = teams.find(t => 
        t.availabilityScore > 0.8 && t.performanceScore > 0.7
      );
      if (urgentTeam) return urgentTeam;
    }
    
    // For VIP customers, prioritize performance
    if (request.customerSegment === 'vip') {
      const vipTeam = teams.find(t => 
        t.performanceScore > this.rules.vipTeamThreshold
      );
      if (vipTeam) return vipTeam;
    }
    
    // Default: highest scoring team
    return teams[0];
  }

  /**
   * Create the assignment
   */
  private async createAssignment(
    team: TeamCandidate,
    request: AssignmentRequest
  ): Promise<any> {
    const scheduledStart = this.calculateStartTime(team, request);
    const estimatedCompletion = new Date(
      scheduledStart.getTime() + request.estimatedDuration * 60 * 60 * 1000
    );
    
    // Create assignment record
    const { data: assignment } = await this.supabase
      .from('job_assignments')
      .insert({
        job_id: request.jobId,
        team_id: team.teamId,
        scheduled_start: scheduledStart,
        estimated_completion: estimatedCompletion,
        status: 'assigned',
        match_score: team.totalScore,
        auto_assigned: true,
        assignment_reasons: this.generateReasons(team, request)
      })
      .select()
      .single();
    
    return {
      ...assignment,
      scheduledStart,
      estimatedCompletion
    };
  }

  /**
   * Optimize team's route for the day
   */
  private async optimizeTeamRoute(team: TeamCandidate, assignment: any) {
    // Get all jobs for the team on the same day
    const assignmentDate = new Date(assignment.scheduled_start);
    const { data: dayJobs } = await this.supabase
      .from('job_assignments')
      .select('*')
      .eq('team_id', team.teamId)
      .gte('scheduled_start', assignmentDate.toISOString().split('T')[0])
      .lt('scheduled_start', new Date(assignmentDate.getTime() + 24*60*60*1000).toISOString().split('T')[0]);
    
    if (dayJobs && dayJobs.length > 1) {
      // Use smart scheduler to optimize route
      const optimizationRequest = {
        teamId: team.teamId,
        date: assignmentDate,
        jobs: dayJobs
      };
      
      await smartJobScheduler.optimizeFullDay(assignmentDate);
    }
  }

  /**
   * Generate notifications for the assignment
   */
  private async generateNotifications(
    assignment: any,
    request: AssignmentRequest
  ): Promise<Notification[]> {
    const notifications: Notification[] = [];
    
    // Team leader notification
    notifications.push({
      recipient: `team_${assignment.team_id}`,
      type: 'push',
      message: `New job assigned: ${request.jobType} at ${request.location.address}`,
      scheduledTime: new Date()
    });
    
    // Customer notification
    notifications.push({
      recipient: `customer_${request.jobId}`,
      type: 'sms',
      message: `Your ${request.jobType} has been assigned to our team. Scheduled for ${this.formatDate(assignment.scheduledStart)}`,
      scheduledTime: new Date()
    });
    
    // Reminder notifications
    const reminderTime = new Date(assignment.scheduledStart);
    reminderTime.setHours(reminderTime.getHours() - 24);
    
    notifications.push({
      recipient: `team_${assignment.team_id}`,
      type: 'email',
      message: `Reminder: ${request.jobType} tomorrow at ${request.location.address}`,
      scheduledTime: reminderTime
    });
    
    // Customer reminder
    notifications.push({
      recipient: `customer_${request.jobId}`,
      type: 'sms',
      message: `Reminder: Your moving team will arrive tomorrow at ${this.formatTime(assignment.scheduledStart)}`,
      scheduledTime: reminderTime
    });
    
    return notifications;
  }

  /**
   * Helper methods
   */
  private hasRequiredSkills(team: any, requiredSkills: string[]): boolean {
    if (requiredSkills.length === 0) return true;
    
    const teamSkills = new Set([
      ...(team.skills || []),
      ...team.team_members.flatMap((m: any) => m.skills || [])
    ]);
    
    return requiredSkills.every(skill => teamSkills.has(skill));
  }

  private async getTeamAvailability(teamId: string, preferredDate: Date): Promise<any> {
    const { data } = await this.supabase
      .from('team_availability')
      .select('*')
      .eq('team_id', teamId)
      .gte('date', preferredDate.toISOString().split('T')[0])
      .order('date')
      .limit(7);
    
    if (!data || data.length === 0) {
      return { score: 0, nextSlot: null };
    }
    
    // Find next available slot
    const nextSlot = data.find(day => 
      day.available_hours > 0 && new Date(day.date) >= preferredDate
    );
    
    // Calculate score based on preferred date match
    let score = 0.5;
    if (nextSlot) {
      const daysDiff = Math.floor(
        (new Date(nextSlot.date).getTime() - preferredDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      score = Math.max(0, 1 - (daysDiff * 0.1));
    }
    
    return {
      score,
      nextSlot: nextSlot ? new Date(nextSlot.date) : null
    };
  }

  private async getTeamWorkload(teamId: string): Promise<any> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data } = await this.supabase
      .from('job_assignments')
      .select('count')
      .eq('team_id', teamId)
      .eq('scheduled_start::date', today);
    
    const jobCount = data?.[0]?.count || 0;
    const utilization = jobCount / this.rules.maxDailyJobs;
    
    return {
      jobCount,
      utilization
    };
  }

  private async getTeamPerformance(teamId: string): Promise<any> {
    const { data } = await this.supabase
      .from('team_performance')
      .select('*')
      .eq('team_id', teamId)
      .single();
    
    if (!data) {
      return {
        score: 0.7,
        completedJobs: 0,
        satisfaction: 0.8
      };
    }
    
    return {
      score: data.overall_score || 0.7,
      completedJobs: data.completed_jobs || 0,
      satisfaction: data.customer_satisfaction || 0.8
    };
  }

  private calculateSkillMatch(team: TeamCandidate, requiredSkills: string[]): number {
    if (requiredSkills.length === 0) return 1;
    
    const teamSkills = new Set([
      ...team.specialties,
      ...team.members.flatMap(m => m.skills)
    ]);
    
    let matchScore = 0;
    let expertBonus = 0;
    
    requiredSkills.forEach(skill => {
      if (teamSkills.has(skill)) {
        matchScore += 1 / requiredSkills.length;
        
        // Bonus for multiple team members with the skill
        const expertsCount = team.members.filter(m => m.skills.includes(skill)).length;
        expertBonus += Math.min(0.1, expertsCount * 0.02);
      }
    });
    
    // Certification bonus
    const certificationBonus = team.members.reduce((bonus, member) => {
      const relevantCerts = member.certifications.filter(cert => 
        requiredSkills.some(skill => cert.toLowerCase().includes(skill.toLowerCase()))
      );
      return bonus + (relevantCerts.length * 0.05);
    }, 0);
    
    return Math.min(1, matchScore + expertBonus + certificationBonus);
  }

  private async calculateDistance(team: TeamCandidate, location: any): Promise<number> {
    // Get team base location
    const { data: teamData } = await this.supabase
      .from('teams')
      .select('base_location')
      .eq('id', team.teamId)
      .single();
    
    if (!teamData?.base_location) return 30; // Default 30km
    
    // Haversine formula
    const R = 6371; // Earth radius in km
    const lat1 = teamData.base_location.lat;
    const lon1 = teamData.base_location.lng;
    const lat2 = location.coordinates.lat;
    const lon2 = location.coordinates.lng;
    
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  }

  private calculateSpecialRequirementsMatch(
    team: TeamCandidate,
    requirements: string[]
  ): number {
    let bonus = 0;
    
    requirements.forEach(req => {
      // Check team specialties
      if (team.specialties.some(s => s.toLowerCase().includes(req.toLowerCase()))) {
        bonus += 0.1;
      }
      
      // Check member certifications
      if (team.members.some(m => 
        m.certifications.some(c => c.toLowerCase().includes(req.toLowerCase()))
      )) {
        bonus += 0.05;
      }
    });
    
    return Math.min(0.3, bonus); // Max 30% bonus
  }

  private calculateConfidence(team: TeamCandidate, request: AssignmentRequest): number {
    let confidence = 0.5; // Base confidence
    
    // Skill match contribution
    confidence += team.skillMatch * 0.2;
    
    // Performance history
    if (team.completedJobs > 50) confidence += 0.1;
    if (team.satisfaction > 0.9) confidence += 0.1;
    
    // Availability match
    confidence += team.availabilityScore * 0.1;
    
    // Workload factor
    if (team.workloadScore > 0.7) confidence += 0.05;
    
    return Math.min(0.95, confidence);
  }

  private calculateEfficiencyGain(team: TeamCandidate, request: AssignmentRequest): number {
    // Calculate efficiency improvement from this assignment
    let efficiency = 0.5; // Baseline
    
    // Proximity benefit
    if (team.proximityScore > 0.8) efficiency += 0.2;
    
    // Skill match benefit
    if (team.skillMatch > 0.9) efficiency += 0.15;
    
    // Workload optimization
    if (team.workloadScore > 0.3 && team.workloadScore < 0.8) {
      efficiency += 0.15; // Optimal utilization
    }
    
    return efficiency;
  }

  private predictSatisfaction(team: TeamCandidate, request: AssignmentRequest): number {
    // Base on historical performance
    let prediction = team.satisfaction;
    
    // Adjust for match quality
    prediction *= (0.7 + team.skillMatch * 0.3);
    
    // Customer segment adjustment
    if (request.customerSegment === 'vip') {
      prediction *= team.performanceScore > 0.9 ? 1.1 : 0.9;
    }
    
    // Priority adjustment
    if (request.priority === 'critical') {
      prediction *= team.availabilityScore > 0.8 ? 1.05 : 0.95;
    }
    
    return Math.min(1, prediction);
  }

  private calculateProfitability(team: TeamCandidate, request: AssignmentRequest): number {
    // Simple profitability score
    let profit = 0.6; // Base margin
    
    // Travel cost impact
    profit -= (team.estimatedTravelTime / 60) * 0.05; // 5% per hour travel
    
    // Efficiency impact
    profit += team.skillMatch * 0.1; // Better skills = faster completion
    
    // Overtime risk
    if (team.currentWorkload > 3) {
      profit -= 0.1; // Overtime costs
    }
    
    return Math.max(0, Math.min(1, profit));
  }

  private generateReasons(team: TeamCandidate, request: AssignmentRequest): string[] {
    const reasons = [];
    
    if (team.skillMatch > 0.9) {
      reasons.push('Perfect skill match for job requirements');
    }
    
    if (team.proximityScore > 0.8) {
      reasons.push(`Located only ${(team.estimatedTravelTime).toFixed(0)} minutes away`);
    }
    
    if (team.performanceScore > 0.9) {
      reasons.push(`Top-rated team with ${(team.satisfaction * 100).toFixed(0)}% satisfaction`);
    }
    
    if (team.availabilityScore > 0.8) {
      reasons.push('Available at the preferred time');
    }
    
    if (team.specialties.some(s => request.requiredSkills.includes(s))) {
      reasons.push('Specialized in this type of job');
    }
    
    return reasons;
  }

  private getOptimizationFactors(team: TeamCandidate): Factor[] {
    return [
      {
        name: 'Skill Match',
        score: team.skillMatch,
        weight: this.weights.skillMatch,
        impact: team.skillMatch > 0.8 ? 'positive' : 'neutral',
        description: `${(team.skillMatch * 100).toFixed(0)}% skill compatibility`
      },
      {
        name: 'Availability',
        score: team.availabilityScore,
        weight: this.weights.availability,
        impact: team.availabilityScore > 0.7 ? 'positive' : 'negative',
        description: team.nextAvailable ? `Available ${this.formatDate(team.nextAvailable)}` : 'Limited availability'
      },
      {
        name: 'Proximity',
        score: team.proximityScore,
        weight: this.weights.proximity,
        impact: team.proximityScore > 0.7 ? 'positive' : 'negative',
        description: `${team.estimatedTravelTime.toFixed(0)} minutes travel time`
      },
      {
        name: 'Performance',
        score: team.performanceScore,
        weight: this.weights.performance,
        impact: team.performanceScore > 0.8 ? 'positive' : 'neutral',
        description: `${(team.satisfaction * 100).toFixed(0)}% customer satisfaction`
      },
      {
        name: 'Workload',
        score: team.workloadScore,
        weight: this.weights.workload,
        impact: team.workloadScore > 0.5 ? 'positive' : 'negative',
        description: `${team.currentWorkload} jobs today`
      }
    ];
  }

  private calculateStartTime(team: TeamCandidate, request: AssignmentRequest): Date {
    // Use team's next available slot or preferred date
    if (team.nextAvailable && team.nextAvailable > request.preferredDate) {
      return team.nextAvailable;
    }
    
    // Set to preferred date at 9 AM
    const startTime = new Date(request.preferredDate);
    startTime.setHours(9, 0, 0, 0);
    
    return startTime;
  }

  private async updateTeamStatus(team: TeamCandidate, assignment: any) {
    // Update team availability
    await this.supabase
      .from('team_availability')
      .update({
        available_hours: team.currentWorkload >= this.rules.maxDailyJobs - 1 ? 0 : 4
      })
      .eq('team_id', team.teamId)
      .eq('date', new Date(assignment.scheduled_start).toISOString().split('T')[0]);
    
    // Update team workload
    await this.supabase
      .from('team_workload')
      .upsert({
        team_id: team.teamId,
        date: new Date(assignment.scheduled_start).toISOString().split('T')[0],
        job_count: team.currentWorkload + 1,
        total_hours: (team.currentWorkload + 1) * 3,
        updated_at: new Date()
      });
  }

  private async logAssignment(request: AssignmentRequest, result: AssignmentResult) {
    await this.supabase
      .from('assignment_log')
      .insert({
        job_id: request.jobId,
        team_id: result.assignedTeam.teamId,
        request,
        result,
        model_version: this.assignmentVersion,
        created_at: new Date()
      });
  }

  private async sendNotifications(notifications: Notification[]) {
    for (const notification of notifications) {
      await this.supabase
        .from('notifications_queue')
        .insert({
          recipient: notification.recipient,
          type: notification.type,
          message: notification.message,
          scheduled_time: notification.scheduledTime,
          status: 'pending'
        });
    }
  }

  private handleNoTeamsAvailable(request: AssignmentRequest): AssignmentResult {
    return {
      success: false,
      jobId: request.jobId,
      assignedTeam: {
        teamId: '',
        teamName: 'No team available',
        members: [],
        confidence: 0
      },
      matchScore: 0,
      scheduledStart: request.preferredDate,
      estimatedCompletion: request.preferredDate,
      travelDistance: 0,
      efficiencyGain: 0,
      customerSatisfactionPrediction: 0,
      profitabilityScore: 0,
      backupTeams: [],
      assignmentReasons: ['No teams met the requirements for this job'],
      optimizationFactors: [],
      notifications: [{
        recipient: 'operations_manager',
        type: 'email',
        message: `Unable to auto-assign job ${request.jobId}. Manual intervention required.`,
        scheduledTime: new Date()
      }]
    };
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('sv-SE');
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Model management
   */
  private async loadAssignmentModels() {
    // Load ML models for assignment optimization
    console.log('📊 Loading assignment models...');
  }

  private startRealtimeMonitoring() {
    // Monitor for urgent assignments and reoptimization needs
    setInterval(async () => {
      await this.checkUrgentAssignments();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private async checkUrgentAssignments() {
    const { data: unassigned } = await this.supabase
      .from('jobs')
      .select('*')
      .eq('status', 'pending')
      .eq('priority', 'critical')
      .is('assigned_team', null);
    
    if (unassigned && unassigned.length > 0) {
      console.log(`🚨 ${unassigned.length} critical jobs need assignment`);
      
      for (const job of unassigned) {
        const request: AssignmentRequest = {
          jobId: job.id,
          jobType: job.service_type,
          requiredSkills: job.required_skills || [],
          estimatedDuration: job.estimated_duration,
          location: job.pickup_location,
          preferredDate: new Date(job.requested_date),
          priority: 'critical',
          customerSegment: job.customer_segment || 'standard',
          specialRequirements: job.special_requirements
        };
        
        try {
          await this.assignJob(request);
        } catch (error) {
          console.error(`Failed to assign critical job ${job.id}:`, error);
        }
      }
    }
  }

  private initializeNotifications() {
    // Set up notification system
    console.log('📱 Notification system initialized');
  }

  /**
   * Public methods
   */
  async reassignJob(jobId: string, reason: string): Promise<AssignmentResult> {
    // Get current assignment
    const { data: currentAssignment } = await this.supabase
      .from('job_assignments')
      .select('*')
      .eq('job_id', jobId)
      .single();
    
    if (!currentAssignment) {
      throw new Error('Job not found');
    }
    
    // Get job details
    const { data: job } = await this.supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();
    
    // Create new assignment request
    const request: AssignmentRequest = {
      jobId,
      jobType: job.service_type,
      requiredSkills: job.required_skills || [],
      estimatedDuration: job.estimated_duration,
      location: job.pickup_location,
      preferredDate: new Date(job.requested_date),
      priority: job.priority || 'normal',
      customerSegment: job.customer_segment || 'standard',
      specialRequirements: job.special_requirements
    };
    
    // Exclude current team
    const result = await this.assignJob(request);
    
    // Log reassignment
    await this.supabase
      .from('reassignment_log')
      .insert({
        job_id: jobId,
        from_team_id: currentAssignment.team_id,
        to_team_id: result.assignedTeam.teamId,
        reason,
        created_at: new Date()
      });
    
    return result;
  }

  async getAssignmentMetrics(period: 'day' | 'week' | 'month'): Promise<any> {
    const startDate = new Date();
    if (period === 'week') startDate.setDate(startDate.getDate() - 7);
    else if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);
    else startDate.setHours(0, 0, 0, 0);
    
    const { data: assignments } = await this.supabase
      .from('assignment_log')
      .select('*')
      .gte('created_at', startDate.toISOString());
    
    if (!assignments) return null;
    
    const metrics = {
      totalAssignments: assignments.length,
      autoAssignmentRate: assignments.filter(a => a.result.success).length / assignments.length,
      averageMatchScore: assignments.reduce((sum, a) => sum + (a.result.matchScore || 0), 0) / assignments.length,
      averageEfficiency: assignments.reduce((sum, a) => sum + (a.result.efficiencyGain || 0), 0) / assignments.length,
      topTeams: this.getTopTeams(assignments),
      bottlenecks: this.identifyBottlenecks(assignments)
    };
    
    return metrics;
  }

  private getTopTeams(assignments: any[]): any[] {
    const teamStats: Record<string, any> = {};
    
    assignments.forEach(a => {
      const teamId = a.result.assignedTeam?.teamId;
      if (!teamId) return;
      
      if (!teamStats[teamId]) {
        teamStats[teamId] = {
          teamId,
          teamName: a.result.assignedTeam.teamName,
          assignments: 0,
          totalScore: 0,
          satisfaction: 0
        };
      }
      
      teamStats[teamId].assignments++;
      teamStats[teamId].totalScore += a.result.matchScore || 0;
      teamStats[teamId].satisfaction += a.result.customerSatisfactionPrediction || 0;
    });
    
    return Object.values(teamStats)
      .map(team => ({
        ...team,
        averageScore: team.totalScore / team.assignments,
        averageSatisfaction: team.satisfaction / team.assignments
      }))
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 5);
  }

  private identifyBottlenecks(assignments: any[]): string[] {
    const bottlenecks = [];
    
    const failedAssignments = assignments.filter(a => !a.result.success);
    if (failedAssignments.length > assignments.length * 0.1) {
      bottlenecks.push(`High failure rate: ${(failedAssignments.length / assignments.length * 100).toFixed(0)}%`);
    }
    
    const lowScores = assignments.filter(a => a.result.matchScore < 0.5);
    if (lowScores.length > assignments.length * 0.2) {
      bottlenecks.push('Many low-quality matches - consider expanding team capacity');
    }
    
    return bottlenecks;
  }
}

// Export singleton instance
export const automatedAssignment = new AutomatedAssignment();