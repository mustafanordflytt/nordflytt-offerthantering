/**
 * NORDFLYTT AUTOMATED ONBOARDING SYSTEM
 * Complete employee onboarding from contract to full integration
 */

export interface OnboardingChecklistItem {
  id: string;
  title: string;
  description: string;
  stage: string;
  automated: boolean;
  estimatedDays: number;
  dependencies: string[];
  positionSpecific: boolean;
  mandatory: boolean;
  completedAt?: string;
  assignedTo?: string;
}

export interface OnboardingPlan {
  employeeId: string;
  applicationId: number;
  position: string;
  totalItems: number;
  estimatedDays: number;
  estimatedCompletion: string;
  aiTrainingLevel: string;
  mentorRequired: boolean;
  checklist: OnboardingChecklistItem[];
  milestones: Array<{
    day: number;
    title: string;
    description: string;
  }>;
}

export interface MentorMatch {
  mentorId: string;
  mentorName: string;
  mentorPosition: string;
  compatibility: number;
  experience: number;
  availability: boolean;
  reasoning: string;
}

export interface OnboardingProgress {
  completedItems: number;
  totalItems: number;
  percentage: number;
  currentStage: string;
  nextMilestone: string;
  estimatedCompletion: string;
  isOnTrack: boolean;
}

export class AutomatedOnboardingSystem {
  private baseOnboardingChecklist: OnboardingChecklistItem[] = [
    {
      id: 'welcome_email',
      title: 'Skicka välkomstmail med första dagens info',
      description: 'Automatiskt välkomstmail med praktisk information och första dagen detaljer',
      stage: 'welcome_package',
      automated: true,
      estimatedDays: 0,
      dependencies: [],
      positionSpecific: false,
      mandatory: true
    },
    {
      id: 'system_accounts',
      title: 'Skapa systemkonton (CRM, Personal-app)',
      description: 'Automatisk kontoskapning i alla Nordflytt-system inklusive CRM och Personal-app',
      stage: 'equipment_setup',
      automated: true,
      estimatedDays: 1,
      dependencies: ['welcome_email'],
      positionSpecific: false,
      mandatory: true
    },
    {
      id: 'personal_code',
      title: 'Generera personalkod för app-inloggning',
      description: 'Unik 6-siffrig kod för Personal-app med instruktioner',
      stage: 'equipment_setup',
      automated: true,
      estimatedDays: 1,
      dependencies: ['system_accounts'],
      positionSpecific: false,
      mandatory: true
    },
    {
      id: 'ai_basic_training',
      title: 'Genomgå grundläggande AI-systemutbildning',
      description: 'Interaktiv utbildning i Nordflytts AI-system och verktyg',
      stage: 'ai_training',
      automated: true,
      estimatedDays: 2,
      dependencies: ['system_accounts'],
      positionSpecific: false,
      mandatory: true
    },
    {
      id: 'company_handbook',
      title: 'Läs igenom företagshandbok',
      description: 'Digital handbok med policies, procedurer och företagskultur',
      stage: 'welcome_package',
      automated: false,
      estimatedDays: 1,
      dependencies: ['welcome_email'],
      positionSpecific: false,
      mandatory: true
    },
    {
      id: 'safety_training',
      title: 'Säkerhetsutbildning och certifiering',
      description: 'Online säkerhetsutbildning med test och certifikat',
      stage: 'ai_training',
      automated: true,
      estimatedDays: 1,
      dependencies: ['ai_basic_training'],
      positionSpecific: false,
      mandatory: true
    },
    {
      id: 'first_day_meeting',
      title: 'Första dagens möte med HR och närmaste chef',
      description: 'Personlig introduktion, välkomst och genomgång av första veckan',
      stage: 'integration_complete',
      automated: false,
      estimatedDays: 0,
      dependencies: ['company_handbook'],
      positionSpecific: false,
      mandatory: true
    }
  ];

  private positionSpecificChecklists: Record<string, OnboardingChecklistItem[]> = {
    flyttpersonal: [
      {
        id: 'physical_training',
        title: 'Lyftutbildning och ergonomi',
        description: 'Praktisk utbildning i säker lyftning och ergonomiska arbetsställningar',
        stage: 'ai_training',
        automated: false,
        estimatedDays: 1,
        dependencies: ['safety_training'],
        positionSpecific: true,
        mandatory: true,
        assignedTo: 'Säkerhetsansvarig'
      },
      {
        id: 'customer_interaction',
        title: 'Kundinteraktionsutbildning',
        description: 'Rollspel och scenarioträning för kundmöten under flytt',
        stage: 'ai_training',
        automated: true,
        estimatedDays: 1,
        dependencies: ['ai_basic_training'],
        positionSpecific: true,
        mandatory: true
      },
      {
        id: 'mentor_pairing',
        title: 'Tilldelning av erfaren mentor',
        description: 'AI-matchning med optimal mentor för praktisk vägledning',
        stage: 'mentor_assignment',
        automated: true,
        estimatedDays: 0,
        dependencies: ['system_accounts'],
        positionSpecific: true,
        mandatory: true
      },
      {
        id: 'equipment_training',
        title: 'Utrustning och verktyg',
        description: 'Genomgång av flyttverktyg, truckar och säkerhetsutrustning',
        stage: 'equipment_setup',
        automated: false,
        estimatedDays: 1,
        dependencies: ['safety_training', 'physical_training'],
        positionSpecific: true,
        mandatory: true,
        assignedTo: 'Lagerchef'
      }
    ],

    team_leader: [
      {
        id: 'leadership_training',
        title: 'Nordflytts ledarskapsutbildning',
        description: 'Comprehensive ledarskapsutbildning med Nordflytts filosofi och verktyg',
        stage: 'ai_training',
        automated: true,
        estimatedDays: 3,
        dependencies: ['ai_basic_training'],
        positionSpecific: true,
        mandatory: true
      },
      {
        id: 'ai_advanced_training',
        title: 'Avancerad AI-systemutbildning',
        description: 'Djupgående utbildning i AI Phase 1-5 och beslutsverktyg',
        stage: 'ai_training',
        automated: true,
        estimatedDays: 2,
        dependencies: ['leadership_training'],
        positionSpecific: true,
        mandatory: true
      },
      {
        id: 'team_assignment',
        title: 'Tilldelning av team att leda',
        description: 'AI-optimerad teammatchning baserat på personlighet och erfarenhet',
        stage: 'integration_complete',
        automated: true,
        estimatedDays: 7,
        dependencies: ['leadership_training', 'ai_advanced_training'],
        positionSpecific: true,
        mandatory: true
      },
      {
        id: 'performance_metrics',
        title: 'KPI:er och prestationsmätning',
        description: 'Utbildning i teamets KPI:er och hur man driver förbättringar',
        stage: 'ai_training',
        automated: true,
        estimatedDays: 1,
        dependencies: ['ai_advanced_training'],
        positionSpecific: true,
        mandatory: true
      }
    ],

    kundservice: [
      {
        id: 'ai_chatbot_training',
        title: 'AI-chatbot samarbetsutbildning',
        description: 'Lär dig arbeta effektivt med AI-kundtjänst och eskalering',
        stage: 'ai_training',
        automated: true,
        estimatedDays: 2,
        dependencies: ['ai_basic_training'],
        positionSpecific: true,
        mandatory: true
      },
      {
        id: 'crm_advanced',
        title: 'Avancerad CRM-utbildning',
        description: 'Masterclass i Nordflytts CRM-system och kundhantering',
        stage: 'ai_training',
        automated: true,
        estimatedDays: 2,
        dependencies: ['system_accounts'],
        positionSpecific: true,
        mandatory: true
      },
      {
        id: 'phone_system',
        title: 'Telefonsystem och routing',
        description: 'Utbildning i telefonisystem, samtalshantering och eskalering',
        stage: 'equipment_setup',
        automated: false,
        estimatedDays: 1,
        dependencies: ['system_accounts'],
        positionSpecific: true,
        mandatory: true,
        assignedTo: 'IT-support'
      },
      {
        id: 'customer_scenarios',
        title: 'Kundscenario-träning',
        description: 'Praktisk träning med vanliga kundärenden och lösningar',
        stage: 'ai_training',
        automated: true,
        estimatedDays: 2,
        dependencies: ['crm_advanced', 'ai_chatbot_training'],
        positionSpecific: true,
        mandatory: true
      }
    ],

    chauffor: [
      {
        id: 'vehicle_training',
        title: 'Fordonsutbildning och rutiner',
        description: 'Genomgång av företagets fordon, rutter och säkerhetsrutiner',
        stage: 'equipment_setup',
        automated: false,
        estimatedDays: 2,
        dependencies: ['safety_training'],
        positionSpecific: true,
        mandatory: true,
        assignedTo: 'Transportchef'
      },
      {
        id: 'route_optimization',
        title: 'GPS och ruttoptimering',
        description: 'Utbildning i GPS-system och AI-driven ruttoptimering',
        stage: 'ai_training',
        automated: true,
        estimatedDays: 1,
        dependencies: ['ai_basic_training', 'vehicle_training'],
        positionSpecific: true,
        mandatory: true
      },
      {
        id: 'delivery_protocols',
        title: 'Leveransprotokoll och kundkontakt',
        description: 'Standardprocedurer för leveranser och kundkommunikation',
        stage: 'ai_training',
        automated: true,
        estimatedDays: 1,
        dependencies: ['vehicle_training'],
        positionSpecific: true,
        mandatory: true
      }
    ],

    koordinator: [
      {
        id: 'project_management',
        title: 'Projektledning och planeringsverktyg',
        description: 'Utbildning i Nordflytts projektledningsmetoder och verktyg',
        stage: 'ai_training',
        automated: true,
        estimatedDays: 2,
        dependencies: ['ai_basic_training'],
        positionSpecific: true,
        mandatory: true
      },
      {
        id: 'scheduling_ai',
        title: 'AI-baserad schemaläggning',
        description: 'Avancerad utbildning i AI-driven schemaläggning och optimering',
        stage: 'ai_training',
        automated: true,
        estimatedDays: 2,
        dependencies: ['project_management'],
        positionSpecific: true,
        mandatory: true
      },
      {
        id: 'stakeholder_management',
        title: 'Intressenthantering och kommunikation',
        description: 'Tekniker för att hantera kunder, team och ledning effektivt',
        stage: 'ai_training',
        automated: true,
        estimatedDays: 1,
        dependencies: ['project_management'],
        positionSpecific: true,
        mandatory: true
      }
    ],

    kvalitetskontroll: [
      {
        id: 'quality_standards',
        title: 'Nordflytts kvalitetsstandarder',
        description: 'Djupgående genomgång av kvalitetskrav och mätmetoder',
        stage: 'ai_training',
        automated: true,
        estimatedDays: 2,
        dependencies: ['ai_basic_training'],
        positionSpecific: true,
        mandatory: true
      },
      {
        id: 'inspection_tools',
        title: 'Inspektionsverktyg och dokumentation',
        description: 'Utbildning i digitala inspektionsverktyg och rapportsystem',
        stage: 'equipment_setup',
        automated: true,
        estimatedDays: 1,
        dependencies: ['system_accounts'],
        positionSpecific: true,
        mandatory: true
      },
      {
        id: 'feedback_training',
        title: 'Konstruktiv feedback och förbättringsprocesser',
        description: 'Tekniker för att ge feedback och driva kvalitetsförbättringar',
        stage: 'ai_training',
        automated: true,
        estimatedDays: 1,
        dependencies: ['quality_standards'],
        positionSpecific: true,
        mandatory: true
      }
    ]
  };

  async initiateOnboarding(
    applicationId: number,
    employeeData: any,
    contractSigned: boolean = true
  ): Promise<{
    onboardingStarted: boolean;
    employeeId: string;
    onboardingPlan: OnboardingPlan;
    estimatedCompletion: string;
  }> {
    console.log('🎓 Initiating onboarding for application:', applicationId);

    try {
      if (!contractSigned) {
        await this.waitForContractSignature(applicationId);
      }

      // Create employee record in main system
      const employeeId = await this.createEmployeeRecord(employeeData);

      // Create comprehensive onboarding plan
      const onboardingPlan = await this.createOnboardingPlan(employeeId, employeeData);

      // Start automated onboarding execution
      await this.executeOnboardingSteps(employeeId, onboardingPlan);

      // Set up progress tracking
      await this.initializeProgressTracking(employeeId, onboardingPlan);

      console.log('✅ Onboarding started for employee:', employeeId);

      return {
        onboardingStarted: true,
        employeeId,
        onboardingPlan,
        estimatedCompletion: onboardingPlan.estimatedCompletion
      };

    } catch (error) {
      console.error('❌ Onboarding initiation failed:', error);
      throw new Error(`Onboarding initiation failed: ${error.message}`);
    }
  }

  private async waitForContractSignature(applicationId: number): Promise<void> {
    // Poll for contract signature (in production, use webhooks)
    let attempts = 0;
    const maxAttempts = 30; // 30 attempts = 5 minutes

    while (attempts < maxAttempts) {
      const contractStatus = await this.checkContractStatus(applicationId);
      if (contractStatus === 'signed') {
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      attempts++;
    }

    throw new Error('Contract signature timeout');
  }

  private async checkContractStatus(applicationId: number): Promise<string> {
    try {
      const response = await fetch(`/api/recruitment/applications/${applicationId}/contract-status`);
      const data = await response.json();
      return data.status || 'pending';
    } catch {
      return 'pending';
    }
  }

  private async createEmployeeRecord(employeeData: any): Promise<string> {
    const employeeId = `emp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // This would create a record in the anställda table
    const response = await fetch('/api/staff', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: employeeId,
        name: `${employeeData.first_name} ${employeeData.last_name}`,
        email: employeeData.email,
        phone: employeeData.phone,
        position: employeeData.desired_position,
        department: employeeData.department || 'Operations',
        start_date: employeeData.startDate,
        status: 'onboarding',
        created_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create employee record');
    }

    return employeeId;
  }

  private async createOnboardingPlan(employeeId: string, employeeData: any): Promise<OnboardingPlan> {
    const position = employeeData.desired_position || 'flyttpersonal';
    
    // Combine base checklist with position-specific items
    const baseChecklist = [...this.baseOnboardingChecklist];
    const positionSpecificItems = this.positionSpecificChecklists[position] || [];
    const fullChecklist = [...baseChecklist, ...positionSpecificItems];

    // Calculate dependencies and timing
    const optimizedChecklist = this.optimizeChecklistTiming(fullChecklist);
    
    // Determine AI training level based on position
    const aiTrainingLevel = this.determineAITrainingLevel(position);
    
    // Calculate total duration
    const estimatedDays = this.calculateOnboardingDuration(optimizedChecklist);
    const estimatedCompletion = this.calculateCompletionDate(estimatedDays);

    // Generate milestones
    const milestones = this.generateMilestones(optimizedChecklist, estimatedDays);

    const onboardingPlan: OnboardingPlan = {
      employeeId,
      applicationId: employeeData.applicationId || 0,
      position,
      totalItems: optimizedChecklist.length,
      estimatedDays,
      estimatedCompletion,
      aiTrainingLevel,
      mentorRequired: this.requiresMentor(position),
      checklist: optimizedChecklist,
      milestones
    };

    // Store onboarding plan
    await this.storeOnboardingPlan(onboardingPlan);

    return onboardingPlan;
  }

  private optimizeChecklistTiming(checklist: OnboardingChecklistItem[]): OnboardingChecklistItem[] {
    // Sort items by dependencies and estimated days
    const sorted = [...checklist];
    
    // Simple dependency-aware sorting (in production, use topological sort)
    sorted.sort((a, b) => {
      if (a.dependencies.length === 0 && b.dependencies.length > 0) return -1;
      if (a.dependencies.length > 0 && b.dependencies.length === 0) return 1;
      return a.estimatedDays - b.estimatedDays;
    });

    return sorted;
  }

  private determineAITrainingLevel(position: string): string {
    const trainingLevels: Record<string, string> = {
      flyttpersonal: 'Basic',
      team_leader: 'Advanced',
      kundservice: 'Intermediate',
      chauffor: 'Basic',
      koordinator: 'Advanced',
      kvalitetskontroll: 'Intermediate'
    };

    return trainingLevels[position] || 'Basic';
  }

  private calculateOnboardingDuration(checklist: OnboardingChecklistItem[]): number {
    // Calculate critical path through dependencies
    let maxDays = 0;
    const itemDays: Record<string, number> = {};

    for (const item of checklist) {
      let itemStartDay = 0;
      
      // Find latest dependency completion
      for (const dep of item.dependencies) {
        if (itemDays[dep] !== undefined) {
          itemStartDay = Math.max(itemStartDay, itemDays[dep]);
        }
      }
      
      itemDays[item.id] = itemStartDay + item.estimatedDays;
      maxDays = Math.max(maxDays, itemDays[item.id]);
    }

    return Math.max(5, maxDays); // Minimum 5 days
  }

  private calculateCompletionDate(estimatedDays: number): string {
    const completionDate = new Date();
    
    // Add business days only
    let daysAdded = 0;
    while (daysAdded < estimatedDays) {
      completionDate.setDate(completionDate.getDate() + 1);
      const dayOfWeek = completionDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not weekend
        daysAdded++;
      }
    }

    return completionDate.toISOString().split('T')[0];
  }

  private requiresMentor(position: string): boolean {
    const mentorPositions = ['flyttpersonal', 'team_leader'];
    return mentorPositions.includes(position);
  }

  private generateMilestones(checklist: OnboardingChecklistItem[], totalDays: number): Array<{
    day: number;
    title: string;
    description: string;
  }> {
    const milestones = [
      {
        day: 1,
        title: 'Välkommen!',
        description: 'Första dagen, introduktion och systemåtkomst'
      },
      {
        day: Math.ceil(totalDays * 0.25),
        title: 'Grundutbildning klar',
        description: 'AI-system och säkerhetsutbildning genomförd'
      },
      {
        day: Math.ceil(totalDays * 0.5),
        title: 'Halvtid',
        description: 'Positionsspecifik utbildning och mentorskap'
      },
      {
        day: Math.ceil(totalDays * 0.75),
        title: 'Nästan klar',
        description: 'Praktisk träning och teamintegration'
      },
      {
        day: totalDays,
        title: 'Fullständig integration',
        description: 'Alla onboarding-aktiviteter genomförda'
      }
    ];

    return milestones;
  }

  private async executeOnboardingSteps(employeeId: string, onboardingPlan: OnboardingPlan): Promise<void> {
    console.log('🚀 Starting automated onboarding execution for:', employeeId);

    // Execute Day 0 items (immediate actions)
    await this.executeImmediateSteps(employeeId, onboardingPlan);
    
    // Schedule future steps
    await this.scheduleOnboardingSteps(employeeId, onboardingPlan);
    
    // Assign mentor if needed
    if (onboardingPlan.mentorRequired) {
      await this.assignMentor(employeeId, onboardingPlan.position);
    }
  }

  private async executeImmediateSteps(employeeId: string, onboardingPlan: OnboardingPlan): Promise<void> {
    const immediateSteps = onboardingPlan.checklist.filter(item => 
      item.estimatedDays === 0 && item.automated
    );

    for (const step of immediateSteps) {
      try {
        await this.executeOnboardingStep(employeeId, step);
        await this.markStepCompleted(employeeId, step.id);
        console.log(`✅ Completed immediate step: ${step.title}`);
      } catch (error) {
        console.error(`❌ Failed immediate step ${step.title}:`, error);
      }
    }
  }

  private async executeOnboardingStep(employeeId: string, step: OnboardingChecklistItem): Promise<void> {
    switch (step.id) {
      case 'welcome_email':
        await this.sendWelcomeEmail(employeeId);
        break;
      case 'system_accounts':
        await this.createSystemAccounts(employeeId);
        break;
      case 'personal_code':
        await this.generatePersonalCode(employeeId);
        break;
      case 'ai_basic_training':
        await this.enrollInAITraining(employeeId, 'basic');
        break;
      case 'mentor_pairing':
        await this.assignMentor(employeeId, step.assignedTo);
        break;
      default:
        console.log(`Manual step: ${step.title} - assigned to ${step.assignedTo}`);
    }
  }

  private async sendWelcomeEmail(employeeId: string): Promise<void> {
    const employee = await this.getEmployeeData(employeeId);
    
    const welcomeEmail = {
      to: employee.email,
      subject: `Välkommen till Nordflytt ${employee.name.split(' ')[0]}! 🎉`,
      body: `
Hej ${employee.name.split(' ')[0]}!

Välkommen till Nordflytt-familjen! Vi är så glada att ha dig ombord.

## 🎯 DITT ONBOARDING-PROGRAM STARTAR NU

Vi har förberett ett personligt onboarding-program för dig som ${employee.position}:

**Första dagen:** ${employee.start_date}  
**Tid:** 08:00  
**Plats:** Nordflytt Huvudkontor, Stockholm  
**Vad att ta med:** ID-handling, bankuppgifter för löneregistrering

## 📱 DINA INLOGGNINGSUPPGIFTER

Du kommer att få separata mail med:
- CRM-system inloggning
- Personal-app kod  
- AI-utbildningsportal åtkomst

## 🎓 UTBILDNINGSPROGRAM

- AI-systemutbildning anpassad för din roll
- Säkerhetsutbildning och certifiering
- Positionsspecifik praktisk träning
- Mentor-pairing för stöd och vägledning

## 📞 KONTAKT

Vid frågor, kontakta:
📧 onboarding@nordflytt.se
📞 +46 8 123 456 78

Vi ser fram emot att träffa dig!

Med vänliga hälsningar,
Nordflytt Onboarding Team

---
*Detta meddelande skickades automatiskt av Nordflytts AI-onboarding system.*
      `.trim()
    };

    await this.sendEmail(welcomeEmail);
  }

  private async createSystemAccounts(employeeId: string): Promise<void> {
    const employee = await this.getEmployeeData(employeeId);
    
    // Generate username and temporary password
    const username = `${employee.name.toLowerCase().replace(' ', '.')}.${employeeId.slice(-4)}`;
    const tempPassword = this.generateTemporaryPassword();

    // Create CRM account
    const crmAccount = {
      username,
      email: employee.email,
      role: this.determineUserRole(employee.position),
      temporaryPassword: tempPassword,
      mustChangePassword: true
    };

    // Store account info (mock implementation)
    console.log('👤 CRM account created:', crmAccount);

    // Send credentials email
    await this.sendCredentialsEmail(employee, crmAccount);
  }

  private async generatePersonalCode(employeeId: string): Promise<void> {
    // Generate unique 6-digit code for staff app
    let code;
    let isUnique = false;
    
    while (!isUnique) {
      code = Math.floor(100000 + Math.random() * 900000).toString();
      isUnique = await this.checkPersonalCodeUnique(code);
    }
    
    // Store in employee record
    await this.updateEmployeePersonalCode(employeeId, code);
    
    // Send app instructions
    const employee = await this.getEmployeeData(employeeId);
    await this.sendPersonalAppInstructions(employee, code);
  }

  private async assignMentor(employeeId: string, position?: string): Promise<void> {
    const mentor = await this.findOptimalMentor(employeeId, position);
    
    if (mentor) {
      await this.createMentorAssignment(employeeId, mentor.mentorId);
      await this.notifyMentorAndEmployee(employeeId, mentor);
      console.log(`🤝 Mentor assigned: ${mentor.mentorName} → ${employeeId}`);
    }
  }

  private async findOptimalMentor(employeeId: string, position?: string): Promise<MentorMatch | null> {
    // AI-powered mentor matching
    const employee = await this.getEmployeeData(employeeId);
    const availableMentors = await this.getAvailableMentors(position || employee.position);
    
    if (availableMentors.length === 0) return null;

    // Score mentors based on compatibility factors
    const mentorScores = availableMentors.map(mentor => ({
      ...mentor,
      compatibility: this.calculateMentorCompatibility(employee, mentor),
      experience: this.calculateExperienceScore(mentor),
      availability: mentor.currentMentees < 3 // Max 3 mentees per mentor
    }));

    // Sort by overall score
    mentorScores.sort((a, b) => {
      const scoreA = a.compatibility * 0.4 + a.experience * 0.3 + (a.availability ? 0.3 : 0);
      const scoreB = b.compatibility * 0.4 + b.experience * 0.3 + (b.availability ? 0.3 : 0);
      return scoreB - scoreA;
    });

    const bestMentor = mentorScores[0];
    
    return {
      mentorId: bestMentor.id,
      mentorName: bestMentor.name,
      mentorPosition: bestMentor.position,
      compatibility: bestMentor.compatibility,
      experience: bestMentor.experience,
      availability: bestMentor.availability,
      reasoning: `Optimal match based on position similarity (${bestMentor.position}), experience level, and mentoring availability.`
    };
  }

  private calculateMentorCompatibility(employee: any, mentor: any): number {
    let score = 0.5; // Base score

    // Position similarity
    if (mentor.position === employee.position) score += 0.3;
    else if (this.isRelatedPosition(mentor.position, employee.position)) score += 0.1;

    // Department similarity  
    if (mentor.department === employee.department) score += 0.2;

    return Math.min(1.0, score);
  }

  private isRelatedPosition(mentorPos: string, employeePos: string): boolean {
    const related = {
      team_leader: ['flyttpersonal'],
      koordinator: ['kundservice'],
      kvalitetskontroll: ['flyttpersonal', 'team_leader']
    };

    return related[mentorPos]?.includes(employeePos) || false;
  }

  private calculateExperienceScore(mentor: any): number {
    const yearsExperience = mentor.years_experience || 1;
    const mentoringSessions = mentor.mentoring_sessions || 0;
    
    const experienceScore = Math.min(1.0, yearsExperience / 5); // Max at 5 years
    const mentoringScore = Math.min(1.0, mentoringSessions / 10); // Max at 10 sessions
    
    return (experienceScore * 0.7) + (mentoringScore * 0.3);
  }

  async getOnboardingProgress(employeeId: string): Promise<OnboardingProgress> {
    const onboardingRecord = await this.getOnboardingRecord(employeeId);
    
    if (!onboardingRecord) {
      throw new Error('Onboarding record not found');
    }

    const completedItems = onboardingRecord.completed_items?.length || 0;
    const totalItems = onboardingRecord.checklist_items?.length || 0;
    const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    
    // Determine current stage
    const currentStage = this.determineCurrentStage(onboardingRecord);
    
    // Find next milestone
    const nextMilestone = this.findNextMilestone(onboardingRecord, percentage);
    
    // Check if on track
    const isOnTrack = this.isOnboardingOnTrack(onboardingRecord, completedItems, totalItems);

    return {
      completedItems,
      totalItems,
      percentage,
      currentStage,
      nextMilestone,
      estimatedCompletion: onboardingRecord.estimated_completion,
      isOnTrack
    };
  }

  private determineCurrentStage(onboardingRecord: any): string {
    const stages = ['welcome_package', 'equipment_setup', 'ai_training', 'mentor_assignment', 'integration_complete'];
    
    // Find the latest stage with completed items
    let currentStage = stages[0];
    
    for (const stage of stages) {
      const stageItems = onboardingRecord.checklist_items?.filter((item: any) => item.stage === stage) || [];
      const completedStageItems = stageItems.filter((item: any) => 
        onboardingRecord.completed_items?.includes(item.id)
      );
      
      if (completedStageItems.length === stageItems.length && stageItems.length > 0) {
        currentStage = stage;
      } else {
        break;
      }
    }
    
    return currentStage;
  }

  private findNextMilestone(onboardingRecord: any, percentage: number): string {
    const milestones = [
      { threshold: 25, title: 'Grundutbildning klar' },
      { threshold: 50, title: 'Halvtid nådd' },
      { threshold: 75, title: 'Nästan klar' },
      { threshold: 100, title: 'Fullständig integration' }
    ];

    for (const milestone of milestones) {
      if (percentage < milestone.threshold) {
        return milestone.title;
      }
    }

    return 'Onboarding completed';
  }

  private isOnboardingOnTrack(onboardingRecord: any, completedItems: number, totalItems: number): boolean {
    const startDate = new Date(onboardingRecord.created_at);
    const now = new Date();
    const daysElapsed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const expectedProgress = Math.min(1.0, daysElapsed / onboardingRecord.estimated_days);
    const actualProgress = totalItems > 0 ? completedItems / totalItems : 0;
    
    return actualProgress >= (expectedProgress * 0.8); // Allow 20% tolerance
  }

  // Helper methods (implementations would be more detailed in production)
  private async storeOnboardingPlan(plan: OnboardingPlan): Promise<void> {
    console.log('💾 Storing onboarding plan for employee:', plan.employeeId);
  }

  private async scheduleOnboardingSteps(employeeId: string, plan: OnboardingPlan): Promise<void> {
    console.log('📅 Scheduling onboarding steps for employee:', employeeId);
  }

  private async markStepCompleted(employeeId: string, stepId: string): Promise<void> {
    console.log(`✅ Marking step completed: ${stepId} for employee: ${employeeId}`);
  }

  private async getEmployeeData(employeeId: string): Promise<any> {
    // Mock employee data
    return {
      id: employeeId,
      name: 'Test Employee',
      email: 'test@example.com',
      position: 'flyttpersonal',
      department: 'Operations',
      start_date: '2025-02-01'
    };
  }

  private async sendEmail(emailData: any): Promise<void> {
    console.log('📧 Sending email:', emailData.subject);
  }

  private generateTemporaryPassword(): string {
    return Math.random().toString(36).slice(-12);
  }

  private determineUserRole(position: string): string {
    const roles: Record<string, string> = {
      team_leader: 'team_leader',
      koordinator: 'coordinator',
      kvalitetskontroll: 'quality_controller',
      kundservice: 'customer_service',
      flyttpersonal: 'staff',
      chauffor: 'driver'
    };
    
    return roles[position] || 'staff';
  }

  private async sendCredentialsEmail(employee: any, credentials: any): Promise<void> {
    console.log('🔐 Sending credentials email to:', employee.email);
  }

  private async checkPersonalCodeUnique(code: string): Promise<boolean> {
    // Mock uniqueness check
    return Math.random() > 0.1; // 90% chance of being unique
  }

  private async updateEmployeePersonalCode(employeeId: string, code: string): Promise<void> {
    console.log(`🔢 Personal code ${code} assigned to employee ${employeeId}`);
  }

  private async sendPersonalAppInstructions(employee: any, code: string): Promise<void> {
    console.log('📱 Sending personal app instructions with code:', code);
  }

  private async getAvailableMentors(position: string): Promise<any[]> {
    // Mock available mentors
    return [
      {
        id: 'mentor_001',
        name: 'Senior Employee 1',
        position: position,
        department: 'Operations',
        years_experience: 3,
        mentoring_sessions: 5,
        currentMentees: 1
      }
    ];
  }

  private async createMentorAssignment(employeeId: string, mentorId: string): Promise<void> {
    console.log(`🤝 Creating mentor assignment: ${mentorId} → ${employeeId}`);
  }

  private async notifyMentorAndEmployee(employeeId: string, mentor: MentorMatch): Promise<void> {
    console.log(`📧 Notifying mentor ${mentor.mentorName} and employee ${employeeId}`);
  }

  private async enrollInAITraining(employeeId: string, level: string): Promise<void> {
    console.log(`🎓 Enrolling employee ${employeeId} in ${level} AI training`);
  }

  private async initializeProgressTracking(employeeId: string, plan: OnboardingPlan): Promise<void> {
    console.log('📊 Initializing progress tracking for employee:', employeeId);
  }

  private async getOnboardingRecord(employeeId: string): Promise<any> {
    // Mock onboarding record
    return {
      employee_id: employeeId,
      estimated_days: 7,
      checklist_items: this.baseOnboardingChecklist,
      completed_items: ['welcome_email', 'system_accounts'],
      estimated_completion: '2025-02-10',
      created_at: '2025-01-15T10:00:00Z'
    };
  }
}