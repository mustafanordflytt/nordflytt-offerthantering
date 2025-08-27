// =============================================================================
// NORDFLYTT PARTNER JOB MANAGER
// Hantering av jobbuppdrag för partners
// =============================================================================

import { supabase } from '../supabase';
import { Partner } from './PartnerOnboardingSystem';

export interface PartnerJob {
  id: number;
  partner_id: number;
  booking_id: number;
  job_type: 'primary' | 'support' | 'specialist';
  base_rate: number;
  commission_rate: number;
  bonus_eligibility: boolean;
  status: 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  assigned_at: string;
  accepted_at?: string;
  started_at?: string;
  completed_at?: string;
  quality_score?: number;
  customer_rating?: number;
  time_efficiency?: number;
  estimated_hours: number;
  actual_hours?: number;
  partner_payment?: number;
  nordflytt_revenue?: number;
  partner_notes?: string;
  internal_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface JobAssignment {
  booking_id: number;
  job_type: 'primary' | 'support' | 'specialist';
  required_specializations: string[];
  service_area: string;
  estimated_hours: number;
  base_rate: number;
  commission_rate: number;
  bonus_eligibility: boolean;
  start_date: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  special_requirements?: string[];
  customer_preferences?: {
    preferred_language?: string;
    accessibility_needs?: string[];
    special_instructions?: string;
  };
}

export interface JobMatchResult {
  partner: Partner;
  match_score: number;
  availability_score: number;
  skill_score: number;
  location_score: number;
  quality_score: number;
  capacity_score: number;
  estimated_travel_time: number;
  recommended_rate: number;
}

export class PartnerJobManager {
  private static instance: PartnerJobManager;
  
  public static getInstance(): PartnerJobManager {
    if (!PartnerJobManager.instance) {
      PartnerJobManager.instance = new PartnerJobManager();
    }
    return PartnerJobManager.instance;
  }

  // =============================================================================
  // SMART PARTNER MATCHING
  // =============================================================================

  async findBestPartnerForJob(assignment: JobAssignment): Promise<{
    matches: JobMatchResult[];
    recommended: JobMatchResult | null;
    alternatives: JobMatchResult[];
  }> {
    try {
      console.log('🔍 Söker partners för jobb:', assignment);

      // Hämta tillgängliga partners
      const availablePartners = await this.getAvailablePartners(assignment);
      
      // Beräkna matchningspoäng för varje partner
      const matches: JobMatchResult[] = [];
      
      for (const partner of availablePartners) {
        const matchResult = await this.calculatePartnerMatch(partner, assignment);
        matches.push(matchResult);
      }

      // Sortera efter matchningspoäng
      matches.sort((a, b) => b.match_score - a.match_score);

      // Välj bästa rekommendation
      const recommended = matches.length > 0 ? matches[0] : null;
      
      // Alternativa partners (top 3 efter rekommendation)
      const alternatives = matches.slice(1, 4);

      console.log(`✅ Hittade ${matches.length} möjliga partners`);
      
      return {
        matches,
        recommended,
        alternatives
      };
      
    } catch (error) {
      console.error('❌ Fel vid partnersökning:', error);
      throw error;
    }
  }

  private async getAvailablePartners(assignment: JobAssignment): Promise<Partner[]> {
    const filters = {
      status: 'active',
      specializations: assignment.required_specializations,
      service_areas: [assignment.service_area],
      onboarding_step: 'completed'
    };

    // I produktion: Använd Supabase med komplex query
    if (process.env.NODE_ENV === 'production') {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('status', 'active')
        .eq('onboarding_step', 'completed')
        .contains('specializations', assignment.required_specializations)
        .contains('service_areas', [assignment.service_area])
        .gte('quality_rating', 3.0); // Minimum kvalitet

      if (error) throw error;
      return data;
    }

    // Mock för utveckling
    return [
      {
        id: 1,
        name: 'Johan Andersson',
        company_name: 'Andersons Flytthjälp AB',
        organization_number: '556789-1234',
        partner_type: 'company',
        phone: '+46701234567',
        email: 'johan@anderssonsflyttjalp.se',
        address: 'Storgatan 123',
        city: 'Stockholm',
        postal_code: '11122',
        specializations: ['moving', 'packing'],
        service_areas: ['stockholm'],
        capacity_level: 'medium',
        status: 'active',
        onboarding_step: 'completed',
        onboarding_progress: 100,
        quality_rating: 4.5,
        completed_jobs: 25,
        total_revenue: 125000,
        certifications: ['ISO9001'],
        insurance_valid_until: '2025-12-31',
        created_at: '2024-12-01T10:00:00Z',
        updated_at: '2025-01-05T10:00:00Z'
      },
      {
        id: 2,
        name: 'Maria Svensson',
        partner_type: 'individual',
        phone: '+46709876543',
        email: 'maria.svensson@gmail.com',
        address: 'Vasagatan 45',
        city: 'Stockholm',
        postal_code: '11125',
        specializations: ['cleaning', 'packing'],
        service_areas: ['stockholm'],
        capacity_level: 'small',
        status: 'active',
        onboarding_step: 'completed',
        onboarding_progress: 100,
        quality_rating: 4.8,
        completed_jobs: 15,
        total_revenue: 45000,
        certifications: ['RUT-certifierad'],
        insurance_valid_until: '2025-06-30',
        created_at: '2024-11-15T14:30:00Z',
        updated_at: '2025-01-04T14:30:00Z'
      },
      {
        id: 3,
        name: 'Erik Pettersson',
        company_name: 'Stockholms Expressflytt',
        partner_type: 'company',
        phone: '+46708765432',
        email: 'erik@stockholmsexpressflytt.se',
        address: 'Kungsgatan 78',
        city: 'Stockholm',
        postal_code: '11156',
        specializations: ['moving', 'transport', 'storage'],
        service_areas: ['stockholm'],
        capacity_level: 'large',
        status: 'active',
        onboarding_step: 'completed',
        onboarding_progress: 100,
        quality_rating: 4.2,
        completed_jobs: 45,
        total_revenue: 280000,
        certifications: ['ISO9001', 'Miljöcertifierad'],
        insurance_valid_until: '2025-12-31',
        created_at: '2024-10-20T09:00:00Z',
        updated_at: '2025-01-03T16:00:00Z'
      }
    ];
  }

  private async calculatePartnerMatch(
    partner: Partner,
    assignment: JobAssignment
  ): Promise<JobMatchResult> {
    // Beräkna olika poäng-komponenter
    const skill_score = this.calculateSkillScore(partner, assignment);
    const location_score = this.calculateLocationScore(partner, assignment);
    const quality_score = this.calculateQualityScore(partner);
    const capacity_score = this.calculateCapacityScore(partner, assignment);
    const availability_score = await this.calculateAvailabilityScore(partner, assignment);

    // Viktad sammanlagd poäng
    const match_score = Math.round(
      (skill_score * 0.25) +
      (location_score * 0.20) +
      (quality_score * 0.25) +
      (capacity_score * 0.15) +
      (availability_score * 0.15)
    );

    // Beräkna restid
    const estimated_travel_time = this.estimateTravelTime(partner, assignment);
    
    // Beräkna rekommenderat pris
    const recommended_rate = this.calculateRecommendedRate(partner, assignment);

    return {
      partner,
      match_score,
      availability_score,
      skill_score,
      location_score,
      quality_score,
      capacity_score,
      estimated_travel_time,
      recommended_rate
    };
  }

  private calculateSkillScore(partner: Partner, assignment: JobAssignment): number {
    const partnerSkills = partner.specializations || [];
    const requiredSkills = assignment.required_specializations || [];
    
    if (requiredSkills.length === 0) return 100;
    
    const matchingSkills = requiredSkills.filter(skill => 
      partnerSkills.includes(skill)
    );
    
    const baseScore = (matchingSkills.length / requiredSkills.length) * 100;
    
    // Bonus för extra specialiseringar
    const extraSkills = partnerSkills.filter(skill => 
      !requiredSkills.includes(skill)
    );
    const bonus = Math.min(extraSkills.length * 5, 20);
    
    return Math.min(baseScore + bonus, 100);
  }

  private calculateLocationScore(partner: Partner, assignment: JobAssignment): number {
    const partnerAreas = partner.service_areas || [];
    const requiredArea = assignment.service_area;
    
    if (partnerAreas.includes(requiredArea)) {
      return 100;
    }
    
    // Närliggande områden (förenklade)
    const nearbyAreas: { [key: string]: string[] } = {
      'stockholm': ['uppsala', 'norrkoping'],
      'goteborg': ['boras', 'trollhattan'],
      'malmo': ['helsingborg', 'lund']
    };
    
    const nearby = nearbyAreas[requiredArea] || [];
    const hasNearby = partnerAreas.some(area => nearby.includes(area));
    
    return hasNearby ? 60 : 20;
  }

  private calculateQualityScore(partner: Partner): number {
    const rating = partner.quality_rating || 0;
    const completedJobs = partner.completed_jobs || 0;
    
    // Baspoäng från rating
    const baseScore = (rating / 5) * 100;
    
    // Bonus för erfarenhet
    const experienceBonus = Math.min(completedJobs * 2, 20);
    
    return Math.min(baseScore + experienceBonus, 100);
  }

  private calculateCapacityScore(partner: Partner, assignment: JobAssignment): number {
    const capacityLevels = {
      'small': 1,
      'medium': 2,
      'large': 3,
      'enterprise': 4
    };
    
    const partnerCapacity = capacityLevels[partner.capacity_level];
    const requiredCapacity = assignment.estimated_hours <= 4 ? 1 :
                           assignment.estimated_hours <= 8 ? 2 :
                           assignment.estimated_hours <= 16 ? 3 : 4;
    
    if (partnerCapacity >= requiredCapacity) {
      return 100;
    }
    
    // Straff för för liten kapacitet
    const penalty = (requiredCapacity - partnerCapacity) * 25;
    return Math.max(100 - penalty, 0);
  }

  private async calculateAvailabilityScore(
    partner: Partner,
    assignment: JobAssignment
  ): Promise<number> {
    // I produktion: Kontrollera partnerns kalender
    // Mock för utveckling
    const currentActiveJobs = await this.getActiveJobsCount(partner.id);
    const maxJobs = partner.capacity_level === 'large' ? 5 : 
                   partner.capacity_level === 'medium' ? 3 : 2;
    
    if (currentActiveJobs >= maxJobs) {
      return 20; // Överbelastad
    }
    
    const utilizationRate = currentActiveJobs / maxJobs;
    return Math.round(100 - (utilizationRate * 30));
  }

  private estimateTravelTime(partner: Partner, assignment: JobAssignment): number {
    // Förenklade restider (i verkligheten: Google Maps API)
    const baseTravelTime = 30; // minuter
    const sameCity = partner.city?.toLowerCase() === assignment.service_area?.toLowerCase();
    
    return sameCity ? baseTravelTime : baseTravelTime * 2;
  }

  private calculateRecommendedRate(partner: Partner, assignment: JobAssignment): number {
    const baseRate = assignment.base_rate;
    const qualityMultiplier = 1 + ((partner.quality_rating - 3) * 0.1);
    const experienceMultiplier = 1 + (Math.min(partner.completed_jobs, 50) * 0.002);
    
    return Math.round(baseRate * qualityMultiplier * experienceMultiplier);
  }

  // =============================================================================
  // JOBBUPPDRAG HANTERING
  // =============================================================================

  async assignJobToPartner(
    partnerId: number,
    assignment: JobAssignment
  ): Promise<{ success: boolean; job?: PartnerJob; error?: string }> {
    try {
      console.log('📋 Tilldelar jobb till partner:', partnerId, assignment);

      // Validera partner
      const partner = await this.getPartner(partnerId);
      if (!partner || partner.status !== 'active') {
        return {
          success: false,
          error: 'Partner inte tillgänglig'
        };
      }

      // Skapa jobbuppdrag
      const job = await this.createPartnerJob(partnerId, assignment);
      
      // Skicka notifiering till partner
      await this.notifyPartnerOfAssignment(partner, job);
      
      console.log('✅ Jobb tilldelat:', job.id);
      
      return {
        success: true,
        job
      };
      
    } catch (error) {
      console.error('❌ Fel vid jobbtilldelning:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Okänt fel'
      };
    }
  }

  private async createPartnerJob(
    partnerId: number,
    assignment: JobAssignment
  ): Promise<PartnerJob> {
    const jobData = {
      partner_id: partnerId,
      booking_id: assignment.booking_id,
      job_type: assignment.job_type,
      base_rate: assignment.base_rate,
      commission_rate: assignment.commission_rate,
      bonus_eligibility: assignment.bonus_eligibility,
      status: 'assigned',
      assigned_at: new Date().toISOString(),
      estimated_hours: assignment.estimated_hours,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // I produktion: Använd Supabase
    if (process.env.NODE_ENV === 'production') {
      const { data, error } = await supabase
        .from('partner_jobs')
        .insert([jobData])
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Mock för utveckling
    return {
      id: Date.now(),
      ...jobData
    } as PartnerJob;
  }

  async updateJobStatus(
    jobId: number,
    status: PartnerJob['status'],
    updates?: Partial<PartnerJob>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString(),
        ...updates
      };

      // Lägg till tidsstämpel för statusändringar
      switch (status) {
        case 'accepted':
          updateData.accepted_at = new Date().toISOString();
          break;
        case 'in_progress':
          updateData.started_at = new Date().toISOString();
          break;
        case 'completed':
          updateData.completed_at = new Date().toISOString();
          break;
      }

      // I produktion: Använd Supabase
      if (process.env.NODE_ENV === 'production') {
        const { error } = await supabase
          .from('partner_jobs')
          .update(updateData)
          .eq('id', jobId);

        if (error) throw error;
      }

      // Uppdatera partner-statistik
      if (status === 'completed') {
        await this.updatePartnerStatistics(jobId);
      }

      return { success: true };
      
    } catch (error) {
      console.error('❌ Fel vid uppdatering av jobbstatus:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Okänt fel'
      };
    }
  }

  // =============================================================================
  // PRESTANDA OCH KVALITET
  // =============================================================================

  async recordJobCompletion(
    jobId: number,
    completion: {
      actual_hours: number;
      quality_score: number;
      customer_rating: number;
      partner_notes?: string;
      internal_notes?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const job = await this.getJob(jobId);
      if (!job) {
        return { success: false, error: 'Jobb inte hittat' };
      }

      // Beräkna prestanda-metrics
      const time_efficiency = job.estimated_hours / completion.actual_hours;
      const partner_payment = this.calculatePartnerPayment(job, completion);
      const nordflytt_revenue = this.calculateNordflyttRevenue(job, completion);

      // Uppdatera jobb
      await this.updateJobStatus(jobId, 'completed', {
        actual_hours: completion.actual_hours,
        quality_score: completion.quality_score,
        customer_rating: completion.customer_rating,
        time_efficiency,
        partner_payment,
        nordflytt_revenue,
        partner_notes: completion.partner_notes,
        internal_notes: completion.internal_notes
      });

      return { success: true };
      
    } catch (error) {
      console.error('❌ Fel vid registrering av jobbslutförande:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Okänt fel'
      };
    }
  }

  private calculatePartnerPayment(job: PartnerJob, completion: any): number {
    const basePayment = job.base_rate * completion.actual_hours;
    const commissionPayment = (job.base_rate * completion.actual_hours) * (job.commission_rate / 100);
    
    // Kvalitetsbonus
    const qualityBonus = completion.quality_score >= 4.5 && job.bonus_eligibility ? 
                        basePayment * 0.1 : 0;
    
    return Math.round(basePayment + commissionPayment + qualityBonus);
  }

  private calculateNordflyttRevenue(job: PartnerJob, completion: any): number {
    const totalRevenue = job.base_rate * completion.actual_hours * 1.5; // 50% markup
    const partnerPayment = this.calculatePartnerPayment(job, completion);
    
    return Math.round(totalRevenue - partnerPayment);
  }

  private async updatePartnerStatistics(jobId: number): Promise<void> {
    const job = await this.getJob(jobId);
    if (!job) return;

    // I produktion: Uppdatera partner-statistik i databasen
    console.log('📊 Uppdaterar partner-statistik för:', job.partner_id);
  }

  // =============================================================================
  // RAPPORTER OCH ANALYS
  // =============================================================================

  async getPartnerJobStatistics(partnerId: number): Promise<{
    total_jobs: number;
    completed_jobs: number;
    cancelled_jobs: number;
    completion_rate: number;
    average_quality: number;
    average_customer_rating: number;
    total_earnings: number;
    time_efficiency: number;
    current_active_jobs: number;
  }> {
    const jobs = await this.getPartnerJobs(partnerId);
    
    const total_jobs = jobs.length;
    const completed_jobs = jobs.filter(j => j.status === 'completed').length;
    const cancelled_jobs = jobs.filter(j => j.status === 'cancelled').length;
    const completion_rate = total_jobs > 0 ? (completed_jobs / total_jobs) * 100 : 0;
    
    const completedJobsData = jobs.filter(j => j.status === 'completed');
    const average_quality = completedJobsData.length > 0 ? 
      completedJobsData.reduce((sum, j) => sum + (j.quality_score || 0), 0) / completedJobsData.length : 0;
    
    const average_customer_rating = completedJobsData.length > 0 ? 
      completedJobsData.reduce((sum, j) => sum + (j.customer_rating || 0), 0) / completedJobsData.length : 0;
    
    const total_earnings = completedJobsData.reduce((sum, j) => sum + (j.partner_payment || 0), 0);
    
    const time_efficiency = completedJobsData.length > 0 ? 
      completedJobsData.reduce((sum, j) => sum + (j.time_efficiency || 0), 0) / completedJobsData.length : 0;
    
    const current_active_jobs = jobs.filter(j => 
      ['assigned', 'accepted', 'in_progress'].includes(j.status)
    ).length;

    return {
      total_jobs,
      completed_jobs,
      cancelled_jobs,
      completion_rate,
      average_quality,
      average_customer_rating,
      total_earnings,
      time_efficiency,
      current_active_jobs
    };
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  private async getPartner(partnerId: number): Promise<Partner | null> {
    // I produktion: Använd Supabase
    if (process.env.NODE_ENV === 'production') {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('id', partnerId)
        .single();

      if (error) return null;
      return data;
    }

    // Mock för utveckling
    return {
      id: partnerId,
      name: 'Johan Andersson',
      company_name: 'Andersons Flytthjälp AB',
      organization_number: '556789-1234',
      partner_type: 'company',
      phone: '+46701234567',
      email: 'johan@anderssonsflyttjalp.se',
      address: 'Storgatan 123',
      city: 'Stockholm',
      postal_code: '11122',
      specializations: ['moving', 'packing'],
      service_areas: ['stockholm'],
      capacity_level: 'medium',
      status: 'active',
      onboarding_step: 'completed',
      onboarding_progress: 100,
      quality_rating: 4.5,
      completed_jobs: 25,
      total_revenue: 125000,
      certifications: ['ISO9001'],
      insurance_valid_until: '2025-12-31',
      created_at: '2024-12-01T10:00:00Z',
      updated_at: '2025-01-05T10:00:00Z'
    };
  }

  private async getJob(jobId: number): Promise<PartnerJob | null> {
    // I produktion: Använd Supabase
    if (process.env.NODE_ENV === 'production') {
      const { data, error } = await supabase
        .from('partner_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) return null;
      return data;
    }

    // Mock för utveckling
    return {
      id: jobId,
      partner_id: 1,
      booking_id: 123,
      job_type: 'primary',
      base_rate: 500,
      commission_rate: 15,
      bonus_eligibility: true,
      status: 'assigned',
      assigned_at: new Date().toISOString(),
      estimated_hours: 8,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  private async getActiveJobsCount(partnerId: number): Promise<number> {
    const jobs = await this.getPartnerJobs(partnerId);
    return jobs.filter(job => 
      ['assigned', 'accepted', 'in_progress'].includes(job.status)
    ).length;
  }

  private async getPartnerJobs(partnerId: number): Promise<PartnerJob[]> {
    // I produktion: Använd Supabase
    if (process.env.NODE_ENV === 'production') {
      const { data, error } = await supabase
        .from('partner_jobs')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (error) return [];
      return data;
    }

    // Mock för utveckling
    return [
      {
        id: 1,
        partner_id: partnerId,
        booking_id: 123,
        job_type: 'primary',
        base_rate: 500,
        commission_rate: 15,
        bonus_eligibility: true,
        status: 'completed',
        assigned_at: '2025-01-01T10:00:00Z',
        accepted_at: '2025-01-01T10:30:00Z',
        started_at: '2025-01-01T11:00:00Z',
        completed_at: '2025-01-01T19:00:00Z',
        quality_score: 4.5,
        customer_rating: 4.8,
        time_efficiency: 1.1,
        estimated_hours: 8,
        actual_hours: 7.5,
        partner_payment: 3500,
        nordflytt_revenue: 2500,
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T19:00:00Z'
      }
    ];
  }

  private async notifyPartnerOfAssignment(partner: Partner, job: PartnerJob): Promise<void> {
    console.log(`📧 Notifierar partner ${partner.name} om nytt jobb:`, job.id);
    // I produktion: Skicka push-notifiering och e-post
  }
}