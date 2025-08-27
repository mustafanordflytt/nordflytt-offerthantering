// =============================================================================
// NORDFLYTT PARTNER ONBOARDING SYSTEM
// Automatiserad onboarding-process för nya partners
// =============================================================================

import { supabase } from '../supabase';

export interface Partner {
  id: number;
  name: string;
  company_name?: string;
  organization_number?: string;
  partner_type: 'individual' | 'company' | 'subcontractor';
  phone: string;
  email: string;
  address?: string;
  city?: string;
  postal_code?: string;
  specializations: string[];
  service_areas: string[];
  capacity_level: 'small' | 'medium' | 'large' | 'enterprise';
  status: 'pending' | 'active' | 'suspended' | 'terminated';
  onboarding_step: 'application' | 'documents' | 'interview' | 'contract' | 'training' | 'completed';
  onboarding_progress: number;
  quality_rating: number;
  completed_jobs: number;
  total_revenue: number;
  certifications: string[];
  insurance_valid_until?: string;
  contract_signed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface OnboardingStep {
  id: number;
  partner_id: number;
  step_name: string;
  step_order: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  required_documents: string[];
  uploaded_documents: string[];
  notes?: string;
  completed_at?: string;
  completed_by?: number;
}

export interface OnboardingApplication {
  name: string;
  company_name?: string;
  organization_number?: string;
  partner_type: 'individual' | 'company' | 'subcontractor';
  phone: string;
  email: string;
  address: string;
  city: string;
  postal_code: string;
  specializations: string[];
  service_areas: string[];
  capacity_level: 'small' | 'medium' | 'large' | 'enterprise';
  motivation: string;
  experience_years: number;
  previous_companies: string[];
  references: Array<{
    name: string;
    company: string;
    phone: string;
    email: string;
  }>;
  certifications: string[];
  insurance_company: string;
  insurance_valid_until: string;
  availability: {
    full_time: boolean;
    part_time: boolean;
    weekends: boolean;
    evenings: boolean;
    emergency: boolean;
  };
}

export class PartnerOnboardingSystem {
  private static instance: PartnerOnboardingSystem;
  
  public static getInstance(): PartnerOnboardingSystem {
    if (!PartnerOnboardingSystem.instance) {
      PartnerOnboardingSystem.instance = new PartnerOnboardingSystem();
    }
    return PartnerOnboardingSystem.instance;
  }

  // =============================================================================
  // ANSÖKAN OCH REGISTRERING
  // =============================================================================

  async submitApplication(application: OnboardingApplication): Promise<{
    success: boolean;
    partner?: Partner;
    error?: string;
  }> {
    try {
      console.log('🚀 Skapar ny partner-ansökan...', application);

      // Validera ansökan
      const validationResult = this.validateApplication(application);
      if (!validationResult.valid) {
        return {
          success: false,
          error: validationResult.error
        };
      }

      // Skapa partner i databasen
      const partner = await this.createPartnerRecord(application);
      
      // Skapa onboarding-steg
      await this.createOnboardingSteps(partner.id);
      
      // Skicka välkomstmeddelande
      await this.sendWelcomeMessage(partner);
      
      // Skicka dokumentkrav
      await this.sendDocumentRequirements(partner);

      console.log('✅ Partner-ansökan skapad:', partner.id);
      
      return {
        success: true,
        partner
      };
      
    } catch (error) {
      console.error('❌ Fel vid skapande av partner-ansökan:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Okänt fel'
      };
    }
  }

  private validateApplication(application: OnboardingApplication): {
    valid: boolean;
    error?: string;
  } {
    // Obligatoriska fält
    const requiredFields = ['name', 'phone', 'email', 'address', 'city'];
    for (const field of requiredFields) {
      if (!application[field as keyof OnboardingApplication]) {
        return {
          valid: false,
          error: `Obligatoriskt fält saknas: ${field}`
        };
      }
    }

    // E-postvalidering
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(application.email)) {
      return {
        valid: false,
        error: 'Ogiltig e-postadress'
      };
    }

    // Telefonvalidering
    const phoneRegex = /^[+]?[0-9\s\-\(\)]+$/;
    if (!phoneRegex.test(application.phone)) {
      return {
        valid: false,
        error: 'Ogiltigt telefonnummer'
      };
    }

    // Specialiseringsvalidering
    const validSpecializations = ['moving', 'packing', 'cleaning', 'storage', 'transport'];
    if (!application.specializations.every(spec => validSpecializations.includes(spec))) {
      return {
        valid: false,
        error: 'Ogiltiga specialiseringar'
      };
    }

    // Serviceområden
    const validServiceAreas = ['stockholm', 'goteborg', 'malmo', 'uppsala', 'linkoping'];
    if (!application.service_areas.every(area => validServiceAreas.includes(area))) {
      return {
        valid: false,
        error: 'Ogiltiga serviceområden'
      };
    }

    return { valid: true };
  }

  private async createPartnerRecord(application: OnboardingApplication): Promise<Partner> {
    const partnerData = {
      name: application.name,
      company_name: application.company_name,
      organization_number: application.organization_number,
      partner_type: application.partner_type,
      phone: application.phone,
      email: application.email,
      address: application.address,
      city: application.city,
      postal_code: application.postal_code,
      specializations: application.specializations,
      service_areas: application.service_areas,
      capacity_level: application.capacity_level,
      status: 'pending',
      onboarding_step: 'application',
      onboarding_progress: 10,
      quality_rating: 0,
      completed_jobs: 0,
      total_revenue: 0,
      certifications: application.certifications,
      insurance_valid_until: application.insurance_valid_until,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // I produktion: Använd Supabase
    if (process.env.NODE_ENV === 'production') {
      const { data, error } = await supabase
        .from('partners')
        .insert([partnerData])
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Mock för utveckling
    return {
      id: Date.now(),
      ...partnerData
    } as Partner;
  }

  private async createOnboardingSteps(partnerId: number): Promise<void> {
    const steps = [
      {
        step_name: 'Ansökan och initial kontakt',
        step_order: 1,
        required_documents: ['application_form'],
        status: 'completed'
      },
      {
        step_name: 'Dokumentverifiering',
        step_order: 2,
        required_documents: ['id_document', 'insurance_certificate', 'tax_certificate'],
        status: 'pending'
      },
      {
        step_name: 'Intervju och bedömning',
        step_order: 3,
        required_documents: ['interview_notes', 'skill_assessment'],
        status: 'pending'
      },
      {
        step_name: 'Kontraktsignering',
        step_order: 4,
        required_documents: ['service_agreement', 'nda', 'safety_agreement'],
        status: 'pending'
      },
      {
        step_name: 'Utbildning och certifiering',
        step_order: 5,
        required_documents: ['training_completion', 'safety_certification'],
        status: 'pending'
      },
      {
        step_name: 'Slutlig godkännande',
        step_order: 6,
        required_documents: ['final_approval', 'system_access'],
        status: 'pending'
      }
    ];

    for (const step of steps) {
      const stepData = {
        partner_id: partnerId,
        ...step,
        uploaded_documents: [],
        created_at: new Date().toISOString()
      };

      // I produktion: Använd Supabase
      if (process.env.NODE_ENV === 'production') {
        const { error } = await supabase
          .from('partner_onboarding_steps')
          .insert([stepData]);

        if (error) throw error;
      }
    }
  }

  // =============================================================================
  // ONBOARDING PROGRESS TRACKING
  // =============================================================================

  async getOnboardingProgress(partnerId: number): Promise<{
    partner: Partner;
    steps: OnboardingStep[];
    progress: number;
    currentStep: string;
    nextActions: string[];
  }> {
    try {
      // Hämta partner
      const partner = await this.getPartner(partnerId);
      
      // Hämta onboarding-steg
      const steps = await this.getOnboardingSteps(partnerId);
      
      // Beräkna progress
      const completedSteps = steps.filter(step => step.status === 'completed').length;
      const progress = Math.round((completedSteps / steps.length) * 100);
      
      // Hitta aktuellt steg
      const currentStep = steps.find(step => step.status === 'in_progress')?.step_name ||
                         steps.find(step => step.status === 'pending')?.step_name ||
                         'Slutfört';
      
      // Generera nästa åtgärder
      const nextActions = this.generateNextActions(steps, partner);
      
      return {
        partner,
        steps,
        progress,
        currentStep,
        nextActions
      };
      
    } catch (error) {
      console.error('❌ Fel vid hämtning av onboarding-progress:', error);
      throw error;
    }
  }

  private async getPartner(partnerId: number): Promise<Partner> {
    // I produktion: Använd Supabase
    if (process.env.NODE_ENV === 'production') {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('id', partnerId)
        .single();

      if (error) throw error;
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
      status: 'pending',
      onboarding_step: 'documents',
      onboarding_progress: 35,
      quality_rating: 0,
      completed_jobs: 0,
      total_revenue: 0,
      certifications: ['ISO9001'],
      insurance_valid_until: '2025-12-31',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  private async getOnboardingSteps(partnerId: number): Promise<OnboardingStep[]> {
    // I produktion: Använd Supabase
    if (process.env.NODE_ENV === 'production') {
      const { data, error } = await supabase
        .from('partner_onboarding_steps')
        .select('*')
        .eq('partner_id', partnerId)
        .order('step_order');

      if (error) throw error;
      return data;
    }

    // Mock för utveckling
    return [
      {
        id: 1,
        partner_id: partnerId,
        step_name: 'Ansökan och initial kontakt',
        step_order: 1,
        status: 'completed',
        required_documents: ['application_form'],
        uploaded_documents: ['application_form.pdf'],
        completed_at: new Date().toISOString()
      },
      {
        id: 2,
        partner_id: partnerId,
        step_name: 'Dokumentverifiering',
        step_order: 2,
        status: 'in_progress',
        required_documents: ['id_document', 'insurance_certificate', 'tax_certificate'],
        uploaded_documents: ['id_document.pdf', 'insurance_certificate.pdf'],
        notes: 'Skattecertifikat saknas fortfarande'
      },
      {
        id: 3,
        partner_id: partnerId,
        step_name: 'Intervju och bedömning',
        step_order: 3,
        status: 'pending',
        required_documents: ['interview_notes', 'skill_assessment'],
        uploaded_documents: []
      },
      {
        id: 4,
        partner_id: partnerId,
        step_name: 'Kontraktsignering',
        step_order: 4,
        status: 'pending',
        required_documents: ['service_agreement', 'nda', 'safety_agreement'],
        uploaded_documents: []
      },
      {
        id: 5,
        partner_id: partnerId,
        step_name: 'Utbildning och certifiering',
        step_order: 5,
        status: 'pending',
        required_documents: ['training_completion', 'safety_certification'],
        uploaded_documents: []
      },
      {
        id: 6,
        partner_id: partnerId,
        step_name: 'Slutlig godkännande',
        step_order: 6,
        status: 'pending',
        required_documents: ['final_approval', 'system_access'],
        uploaded_documents: []
      }
    ];
  }

  private generateNextActions(steps: OnboardingStep[], partner: Partner): string[] {
    const actions: string[] = [];
    
    // Hitta aktuellt steg
    const currentStep = steps.find(step => step.status === 'in_progress') ||
                       steps.find(step => step.status === 'pending');
    
    if (!currentStep) {
      return ['Onboarding slutfört! Partner kan aktiveras.'];
    }

    // Generera åtgärder baserat på steg
    switch (currentStep.step_name) {
      case 'Dokumentverifiering':
        const missingDocs = currentStep.required_documents.filter(
          doc => !currentStep.uploaded_documents.includes(doc)
        );
        if (missingDocs.length > 0) {
          actions.push(`Begär saknade dokument: ${missingDocs.join(', ')}`);
        }
        actions.push('Verifiera uppladdade dokument');
        break;
        
      case 'Intervju och bedömning':
        actions.push('Boka intervju med partner');
        actions.push('Genomför kompetenstest');
        break;
        
      case 'Kontraktsignering':
        actions.push('Skicka kontrakt för digital signering');
        actions.push('Följ upp signering');
        break;
        
      case 'Utbildning och certifiering':
        actions.push('Registrera för obligatorisk utbildning');
        actions.push('Boka säkerhetsutbildning');
        break;
        
      case 'Slutlig godkännande':
        actions.push('Slutlig granskning av dokumentation');
        actions.push('Aktivera systemåtkomst');
        break;
    }

    return actions;
  }

  // =============================================================================
  // STEG-HANTERING
  // =============================================================================

  async completeOnboardingStep(
    partnerId: number,
    stepId: number,
    completedBy: number,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Uppdatera steg
      const updateData = {
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_by: completedBy,
        notes: notes || undefined
      };

      // I produktion: Använd Supabase
      if (process.env.NODE_ENV === 'production') {
        const { error } = await supabase
          .from('partner_onboarding_steps')
          .update(updateData)
          .eq('id', stepId)
          .eq('partner_id', partnerId);

        if (error) throw error;
      }

      // Uppdatera partner progress
      await this.updatePartnerProgress(partnerId);
      
      // Skicka notifiering
      await this.sendStepCompletionNotification(partnerId, stepId);

      return { success: true };
      
    } catch (error) {
      console.error('❌ Fel vid slutförande av onboarding-steg:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Okänt fel'
      };
    }
  }

  private async updatePartnerProgress(partnerId: number): Promise<void> {
    const steps = await this.getOnboardingSteps(partnerId);
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    const progress = Math.round((completedSteps / steps.length) * 100);
    
    // Bestäm aktuellt steg
    const currentStep = steps.find(step => step.status === 'in_progress') ||
                       steps.find(step => step.status === 'pending');
    
    const onboardingStep = currentStep ? this.mapStepToStatus(currentStep.step_name) : 'completed';
    
    // Uppdatera status om fullt slutfört
    const status = progress === 100 ? 'active' : 'pending';

    const updateData = {
      onboarding_progress: progress,
      onboarding_step: onboardingStep,
      status: status,
      updated_at: new Date().toISOString()
    };

    // I produktion: Använd Supabase
    if (process.env.NODE_ENV === 'production') {
      const { error } = await supabase
        .from('partners')
        .update(updateData)
        .eq('id', partnerId);

      if (error) throw error;
    }
  }

  private mapStepToStatus(stepName: string): string {
    const mapping: { [key: string]: string } = {
      'Ansökan och initial kontakt': 'application',
      'Dokumentverifiering': 'documents',
      'Intervju och bedömning': 'interview',
      'Kontraktsignering': 'contract',
      'Utbildning och certifiering': 'training',
      'Slutlig godkännande': 'completed'
    };
    
    return mapping[stepName] || 'application';
  }

  // =============================================================================
  // KOMMUNIKATION
  // =============================================================================

  private async sendWelcomeMessage(partner: Partner): Promise<void> {
    const message = `
      Hej ${partner.name}!
      
      Tack för din ansökan till Nordflytt Partner Network!
      
      Vi har tagit emot din ansökan och kommer att granska den inom 2 arbetsdagar.
      Du kommer att få information om nästa steg i processen via e-post.
      
      Välkommen till Nordflytt-familjen!
      
      Med vänliga hälsningar,
      Nordflytt Partner Team
    `;

    await this.sendEmail(partner.email, 'Välkommen till Nordflytt Partner Network', message);
  }

  private async sendDocumentRequirements(partner: Partner): Promise<void> {
    const message = `
      Hej ${partner.name}!
      
      För att slutföra din registrering som Nordflytt-partner behöver vi följande dokument:
      
      1. Kopia av giltig legitimation
      2. Försäkringsintyg (giltigt till ${partner.insurance_valid_until})
      3. Skatteverkets intyg för F-skatt (företag)
      4. Eventuella certifieringar
      
      Ladda upp dokumenten i vårt partnersystem eller skicka dem till partner@nordflytt.se
      
      Med vänliga hälsningar,
      Nordflytt Partner Team
    `;

    await this.sendEmail(partner.email, 'Dokumentkrav - Nordflytt Partner', message);
  }

  private async sendStepCompletionNotification(partnerId: number, stepId: number): Promise<void> {
    const partner = await this.getPartner(partnerId);
    const steps = await this.getOnboardingSteps(partnerId);
    const completedStep = steps.find(step => step.id === stepId);
    
    if (!completedStep) return;

    const message = `
      Hej ${partner.name}!
      
      Bra jobbat! Du har slutfört steget: "${completedStep.step_name}"
      
      Progress: ${partner.onboarding_progress}% slutfört
      
      Nästa steg: ${steps.find(step => step.status === 'pending')?.step_name || 'Slutfört!'}
      
      Fortsätt det fantastiska arbetet!
      
      Med vänliga hälsningar,
      Nordflytt Partner Team
    `;

    await this.sendEmail(partner.email, 'Onboarding Progress Update', message);
  }

  private async sendEmail(to: string, subject: string, body: string): Promise<void> {
    console.log(`📧 Skickar e-post till ${to}: ${subject}`);
    // I produktion: Integrera med e-posttjänst
    // await emailService.send({ to, subject, body });
  }

  // =============================================================================
  // ADMIN FUNKTIONER
  // =============================================================================

  async getAllPendingApplications(): Promise<Partner[]> {
    // I produktion: Använd Supabase
    if (process.env.NODE_ENV === 'production') {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

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
        status: 'pending',
        onboarding_step: 'documents',
        onboarding_progress: 35,
        quality_rating: 0,
        completed_jobs: 0,
        total_revenue: 0,
        certifications: ['ISO9001'],
        insurance_valid_until: '2025-12-31',
        created_at: '2025-01-05T10:00:00Z',
        updated_at: '2025-01-05T10:00:00Z'
      },
      {
        id: 2,
        name: 'Maria Svensson',
        partner_type: 'individual',
        phone: '+46709876543',
        email: 'maria.svensson@gmail.com',
        address: 'Vasagatan 45',
        city: 'Göteborg',
        postal_code: '41125',
        specializations: ['cleaning', 'packing'],
        service_areas: ['goteborg'],
        capacity_level: 'small',
        status: 'pending',
        onboarding_step: 'interview',
        onboarding_progress: 60,
        quality_rating: 0,
        completed_jobs: 0,
        total_revenue: 0,
        certifications: [],
        insurance_valid_until: '2025-06-30',
        created_at: '2025-01-04T14:30:00Z',
        updated_at: '2025-01-04T14:30:00Z'
      }
    ];
  }

  async getOnboardingStatistics(): Promise<{
    total_applications: number;
    pending_applications: number;
    active_partners: number;
    completion_rate: number;
    average_onboarding_time: number;
    bottlenecks: Array<{
      step: string;
      count: number;
      average_time: number;
    }>;
  }> {
    // I produktion: Kör SQL-queries mot Supabase
    // Mock för utveckling
    return {
      total_applications: 24,
      pending_applications: 8,
      active_partners: 15,
      completion_rate: 62.5,
      average_onboarding_time: 14, // dagar
      bottlenecks: [
        {
          step: 'Dokumentverifiering',
          count: 5,
          average_time: 7
        },
        {
          step: 'Intervju och bedömning',
          count: 3,
          average_time: 5
        }
      ]
    };
  }
}