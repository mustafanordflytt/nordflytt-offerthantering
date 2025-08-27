/**
 * NORDFLYTT SERVICE PERSONALITY SCREENER
 * Advanced personality assessment for service-oriented positions
 */

export interface PersonalityProfile {
  bigFive: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  serviceTraits: {
    empathy: number;
    patience: number;
    helpfulness: number;
    communicationSkills: number;
    stressResilience: number;
  };
  workStyle: {
    teamOrientation: number;
    customerFocus: number;
    problemSolving: number;
    adaptability: number;
    reliability: number;
  };
}

export interface ServiceRedFlag {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'disqualifying';
  description: string;
  reasoning: string;
}

export interface AssessmentResult {
  profile: PersonalityProfile;
  serviceScore: number;
  redFlags: ServiceRedFlag[];
  positionRecommendations: Array<{
    position: string;
    fitScore: number;
    reasoning: string;
  }>;
  overallRecommendation: 'hire' | 'conditional' | 'reject';
}

export class ServicePersonalityScreener {
  private serviceRedFlags = {
    highNeuroticism: {
      threshold: 0.75,
      severity: 'disqualifying' as const,
      description: 'Hög emotionell instabilitet',
      reasoning: 'Kan inte hantera kundkonflikter eller arbetsstress effektivt'
    },
    lowAgreeableness: {
      threshold: 0.3,
      severity: 'disqualifying' as const,
      description: 'Låg medkänsla och samarbetsförmåga',
      reasoning: 'Bristande förmåga att förstå och hjälpa kunder'
    },
    extremeIntroversion: {
      threshold: 0.2,
      severity: 'high' as const,
      description: 'Extrem introversion',
      reasoning: 'Kan ha svårigheter med kundinteraktion och teamarbete'
    },
    lowConscientiousness: {
      threshold: 0.4,
      severity: 'medium' as const,
      description: 'Låg pålitlighet och struktur',
      reasoning: 'Risk för opålitlighet i kundservice och kvalitet'
    }
  };

  async createPersonalizedAssessment(
    applicationId: number,
    positionMatch: any
  ): Promise<any> {
    console.log('🧠 Creating personalized assessment for application:', applicationId);

    const baseQuestions = this.getBaseServiceQuestions();
    const positionSpecificQuestions = this.getPositionSpecificQuestions(positionMatch.position);
    const situationalQuestions = this.getSituationalQuestions(positionMatch.position);

    return {
      applicationId,
      assessmentId: `assess_${applicationId}_${Date.now()}`,
      questions: {
        personality: baseQuestions,
        cognitive: this.getCognitiveQuestions(),
        situational: situationalQuestions,
        positionSpecific: positionSpecificQuestions
      },
      estimatedTime: '45-60 minuter',
      positionFocus: positionMatch.position,
      instructions: this.generateInstructions(positionMatch.position)
    };
  }

  private getBaseServiceQuestions(): Array<{
    id: string;
    question: string;
    type: 'likert' | 'multiple_choice' | 'ranking';
    trait: string;
    options?: string[];
    scale?: { min: number; max: number; labels: string[] };
  }> {
    return [
      {
        id: 'empathy_1',
        question: 'Jag märker lätt när andra personer känner sig obekväma eller stressade',
        type: 'likert',
        trait: 'empathy',
        scale: {
          min: 1,
          max: 7,
          labels: ['Stämmer inte alls', 'Stämmer inte', 'Stämmer delvis inte', 'Neutral', 'Stämmer delvis', 'Stämmer', 'Stämmer helt']
        }
      },
      {
        id: 'patience_1',
        question: 'När någon frågar mig samma sak flera gånger blir jag irriterad',
        type: 'likert',
        trait: 'patience',
        scale: {
          min: 1,
          max: 7,
          labels: ['Stämmer inte alls', 'Stämmer inte', 'Stämmer delvis inte', 'Neutral', 'Stämmer delvis', 'Stämmer', 'Stämmer helt']
        }
      },
      {
        id: 'helpfulness_1',
        question: 'Jag går gärna extra långt för att hjälpa andra, även om det inte är min skyldighet',
        type: 'likert',
        trait: 'helpfulness',
        scale: {
          min: 1,
          max: 7,
          labels: ['Stämmer inte alls', 'Stämmer inte', 'Stämmer delvis inte', 'Neutral', 'Stämmer delvis', 'Stämmer', 'Stämmer helt']
        }
      },
      {
        id: 'stress_resilience_1',
        question: 'Under stressiga situationer behåller jag lugnet och kan tänka klart',
        type: 'likert',
        trait: 'stressResilience',
        scale: {
          min: 1,
          max: 7,
          labels: ['Stämmer inte alls', 'Stämmer inte', 'Stämmer delvis inte', 'Neutral', 'Stämmer delvis', 'Stämmer', 'Stämmer helt']
        }
      },
      {
        id: 'communication_1',
        question: 'Jag kan förklara komplicerade saker på ett enkelt sätt',
        type: 'likert',
        trait: 'communicationSkills',
        scale: {
          min: 1,
          max: 7,
          labels: ['Stämmer inte alls', 'Stämmer inte', 'Stämmer delvis inte', 'Neutral', 'Stämmer delvis', 'Stämmer', 'Stämmer helt']
        }
      },
      {
        id: 'team_orientation_1',
        question: 'Jag trivs bäst när jag arbetar i team snarare än ensam',
        type: 'likert',
        trait: 'teamOrientation',
        scale: {
          min: 1,
          max: 7,
          labels: ['Stämmer inte alls', 'Stämmer inte', 'Stämmer delvis inte', 'Neutral', 'Stämmer delvis', 'Stämmer', 'Stämmer helt']
        }
      },
      {
        id: 'customer_focus_1',
        question: 'Kundens behov kommer alltid först, även om det betyder extra arbete för mig',
        type: 'likert',
        trait: 'customerFocus',
        scale: {
          min: 1,
          max: 7,
          labels: ['Stämmer inte alls', 'Stämmer inte', 'Stämmer delvis inte', 'Neutral', 'Stämmer delvis', 'Stämmer', 'Stämmer helt']
        }
      }
    ];
  }

  private getSituationalQuestions(position: string): Array<{
    id: string;
    scenario: string;
    question: string;
    options: Array<{
      id: string;
      text: string;
      traits: Record<string, number>;
    }>;
  }> {
    const baseScenarios = [
      {
        id: 'angry_customer',
        scenario: 'En kund ringer och är mycket arg eftersom deras flytt blev försenad på grund av trafik. De hotar att klaga och kräver kompensation.',
        question: 'Vad gör du först?',
        options: [
          {
            id: 'listen_empathize',
            text: 'Lyssnar aktivt på kunden och bekräftar deras känslor innan jag förklarar situationen',
            traits: { empathy: 3, customerFocus: 3, communicationSkills: 2 }
          },
          {
            id: 'explain_policy',
            text: 'Förklarar omedelbart våra policies och att trafik är utanför vår kontroll',
            traits: { empathy: -1, customerFocus: 1, communicationSkills: 1 }
          },
          {
            id: 'offer_solution',
            text: 'Ber om ursäkt och erbjuder genast en lösning eller kompensation',
            traits: { empathy: 2, customerFocus: 3, problemSolving: 2 }
          },
          {
            id: 'transfer_call',
            text: 'Förklarar att jag behöver kolla med min chef och ber kunden vänta',
            traits: { empathy: 1, customerFocus: 1, problemSolving: -1 }
          }
        ]
      },
      {
        id: 'team_conflict',
        scenario: 'Två kollegor i ditt team har en konflikt om hur ett jobb ska utföras. Stämningen blir spänd och det påverkar arbetet.',
        question: 'Hur hanterar du situationen?',
        options: [
          {
            id: 'mediate_actively',
            text: 'Tar initiativ att medla och hjälper dem hitta en kompromiss',
            traits: { teamOrientation: 3, problemSolving: 2, communicationSkills: 2 }
          },
          {
            id: 'stay_neutral',
            text: 'Håller mig neutral och fokuserar på mitt eget arbete',
            traits: { teamOrientation: -1, problemSolving: -1, reliability: 1 }
          },
          {
            id: 'report_manager',
            text: 'Rapporterar situationen till chefen så de kan hantera det',
            traits: { teamOrientation: 1, problemSolving: 0, reliability: 1 }
          },
          {
            id: 'suggest_meeting',
            text: 'Föreslår att alla i teamet träffas för att diskutera arbetssätt',
            traits: { teamOrientation: 2, problemSolving: 2, communicationSkills: 1 }
          }
        ]
      }
    ];

    // Add position-specific scenarios
    if (position === 'flyttpersonal') {
      baseScenarios.push({
        id: 'physical_challenge',
        scenario: 'Du och ditt team håller på att bära ut en tung soffa. En teammedlem säger att hen inte orkar mer och behöver pausa.',
        question: 'Vad är din reaktion?',
        options: [
          {
            id: 'supportive_pause',
            text: 'Föreslår omedelbart en paus för hela teamet och kollar att alla mår bra',
            traits: { empathy: 3, teamOrientation: 3, reliability: 2 }
          },
          {
            id: 'take_over_load',
            text: 'Säger att jag kan ta en större del av lasten så vi kan fortsätta',
            traits: { helpfulness: 3, teamOrientation: 2, reliability: 2 }
          },
          {
            id: 'suggest_technique',
            text: 'Föreslår ett bättre sätt att lyfta eller använda hjälpmedel',
            traits: { problemSolving: 3, teamOrientation: 2, adaptability: 2 }
          },
          {
            id: 'express_frustration',
            text: 'Blir frustrerad eftersom det försenar jobbet',
            traits: { empathy: -2, teamOrientation: -1, stressResilience: -1 }
          }
        ]
      });
    }

    return baseScenarios;
  }

  private getCognitiveQuestions(): Array<{
    id: string;
    type: 'pattern_recognition' | 'logical_reasoning' | 'spatial_reasoning';
    question: string;
    options: string[];
    correctAnswer: string;
    timeLimit?: number;
  }> {
    return [
      {
        id: 'pattern_1',
        type: 'pattern_recognition',
        question: 'Vilken figur kommer näst i sekvensen? □ ○ □ ○ □ ?',
        options: ['□', '○', '△', '◊'],
        correctAnswer: '○',
        timeLimit: 30
      },
      {
        id: 'logic_1',
        type: 'logical_reasoning',
        question: 'Om alla flyttbilar är blå, och denna bil är en flyttbil, vilken färg är den?',
        options: ['Röd', 'Blå', 'Grön', 'Kan inte avgöras'],
        correctAnswer: 'Blå',
        timeLimit: 45
      },
      {
        id: 'spatial_1',
        type: 'spatial_reasoning',
        question: 'En kartong mäter 2×3×4 meter. Vilket av följande föremål får INTE plats i kartongen?',
        options: ['En soffa 1.8×2.5×1 m', 'Ett bord 1.5×2×3.5 m', 'En matta 3×2×0.1 m', 'En stol 0.5×0.5×1 m'],
        correctAnswer: 'En matta 3×2×0.1 m',
        timeLimit: 60
      }
    ];
  }

  private getPositionSpecificQuestions(position: string): any[] {
    const positionQuestions: Record<string, any[]> = {
      flyttpersonal: [
        {
          id: 'physical_stamina',
          question: 'Jag har energi kvar efter en hel dag av fysiskt arbete',
          type: 'likert',
          trait: 'physicalResilience'
        }
      ],
      team_leader: [
        {
          id: 'leadership_comfort',
          question: 'Jag känner mig bekväm med att ge konstruktiv feedback till teammedlemmar',
          type: 'likert',
          trait: 'leadershipComfort'
        }
      ],
      kundservice: [
        {
          id: 'tech_comfort',
          question: 'Jag lär mig lätt att använda nya datasystem och verktyg',
          type: 'likert',
          trait: 'techAdaptability'
        }
      ]
    };

    return positionQuestions[position] || [];
  }

  private generateInstructions(position: string): string {
    return `
Välkommen till Nordflytts personlighetstest!

Detta test hjälper oss förstå hur du passar in i vårt team och vår servicekultur. Det finns inga "rätta" eller "fel" svar - vi vill bara lära känna dig bättre.

INSTRUKTIONER:
• Svara ärligt baserat på hur du verkligen är, inte hur du tror vi vill att du ska vara
• Det finns ingen tidsgräns, men de flesta tar 45-60 minuter
• Ta pauser om du behöver
• Läs varje fråga noggrant

Testet består av tre delar:
1. Personlighetsfrågor (20-25 frågor)
2. Situationsbedömning (8-10 scenarion)  
3. Kognitiva förmågor (5-8 frågor)

Din ansökan gäller: ${position}

Vi kommer att anpassa några frågor specifikt för denna roll.

Lycka till!
    `.trim();
  }

  async analyzeResults(
    applicationId: number,
    responses: any
  ): Promise<AssessmentResult> {
    console.log('🧠 Analyzing assessment results for application:', applicationId);

    try {
      // Calculate personality profile
      const personalityProfile = this.calculatePersonalityProfile(responses);

      // Assess service fitness
      const serviceScore = this.calculateServiceScore(personalityProfile);

      // Identify red flags
      const redFlags = this.identifyRedFlags(personalityProfile);

      // Generate position recommendations
      const positionRecommendations = this.generatePositionRecommendations(personalityProfile);

      // Make overall recommendation
      const overallRecommendation = this.makeOverallRecommendation(
        personalityProfile,
        serviceScore,
        redFlags
      );

      const result: AssessmentResult = {
        profile: personalityProfile,
        serviceScore,
        redFlags,
        positionRecommendations,
        overallRecommendation
      };

      // Store results
      await this.storeAssessmentResults(applicationId, result);

      return result;

    } catch (error) {
      console.error('❌ Assessment analysis failed:', error);
      throw new Error(`Assessment analysis failed: ${error.message}`);
    }
  }

  private calculatePersonalityProfile(responses: any): PersonalityProfile {
    // Simplified calculation - in production, use validated psychometric algorithms
    return {
      bigFive: {
        openness: this.calculateTraitScore(responses, 'openness'),
        conscientiousness: this.calculateTraitScore(responses, 'conscientiousness'),
        extraversion: this.calculateTraitScore(responses, 'extraversion'),
        agreeableness: this.calculateTraitScore(responses, 'agreeableness'),
        neuroticism: this.calculateTraitScore(responses, 'neuroticism')
      },
      serviceTraits: {
        empathy: this.calculateTraitScore(responses, 'empathy'),
        patience: this.calculateTraitScore(responses, 'patience'),
        helpfulness: this.calculateTraitScore(responses, 'helpfulness'),
        communicationSkills: this.calculateTraitScore(responses, 'communicationSkills'),
        stressResilience: this.calculateTraitScore(responses, 'stressResilience')
      },
      workStyle: {
        teamOrientation: this.calculateTraitScore(responses, 'teamOrientation'),
        customerFocus: this.calculateTraitScore(responses, 'customerFocus'),
        problemSolving: this.calculateTraitScore(responses, 'problemSolving'),
        adaptability: this.calculateTraitScore(responses, 'adaptability'),
        reliability: this.calculateTraitScore(responses, 'reliability')
      }
    };
  }

  private calculateTraitScore(responses: any, trait: string): number {
    // Simplified trait calculation
    const relevantResponses = responses.filter((r: any) => r.trait === trait);
    if (relevantResponses.length === 0) return 0.5; // Default neutral

    const average = relevantResponses.reduce((sum: number, r: any) => sum + (r.value / 7), 0) / relevantResponses.length;
    return Math.max(0, Math.min(1, average));
  }

  private calculateServiceScore(profile: PersonalityProfile): number {
    // Weight service-critical traits
    const weights = {
      empathy: 0.25,
      patience: 0.20,
      customerFocus: 0.20,
      communicationSkills: 0.15,
      helpfulness: 0.10,
      stressResilience: 0.10
    };

    let score = 0;
    score += profile.serviceTraits.empathy * weights.empathy;
    score += profile.serviceTraits.patience * weights.patience;
    score += profile.workStyle.customerFocus * weights.customerFocus;
    score += profile.serviceTraits.communicationSkills * weights.communicationSkills;
    score += profile.serviceTraits.helpfulness * weights.helpfulness;
    score += profile.serviceTraits.stressResilience * weights.stressResilience;

    return Math.max(0, Math.min(1, score));
  }

  private identifyRedFlags(profile: PersonalityProfile): ServiceRedFlag[] {
    const redFlags: ServiceRedFlag[] = [];

    // Check each red flag condition
    if (profile.bigFive.neuroticism >= this.serviceRedFlags.highNeuroticism.threshold) {
      redFlags.push({
        type: 'highNeuroticism',
        severity: this.serviceRedFlags.highNeuroticism.severity,
        description: this.serviceRedFlags.highNeuroticism.description,
        reasoning: this.serviceRedFlags.highNeuroticism.reasoning
      });
    }

    if (profile.bigFive.agreeableness <= this.serviceRedFlags.lowAgreeableness.threshold) {
      redFlags.push({
        type: 'lowAgreeableness',
        severity: this.serviceRedFlags.lowAgreeableness.severity,
        description: this.serviceRedFlags.lowAgreeableness.description,
        reasoning: this.serviceRedFlags.lowAgreeableness.reasoning
      });
    }

    if (profile.bigFive.extraversion <= this.serviceRedFlags.extremeIntroversion.threshold) {
      redFlags.push({
        type: 'extremeIntroversion',
        severity: this.serviceRedFlags.extremeIntroversion.severity,
        description: this.serviceRedFlags.extremeIntroversion.description,
        reasoning: this.serviceRedFlags.extremeIntroversion.reasoning
      });
    }

    if (profile.bigFive.conscientiousness <= this.serviceRedFlags.lowConscientiousness.threshold) {
      redFlags.push({
        type: 'lowConscientiousness',
        severity: this.serviceRedFlags.lowConscientiousness.severity,
        description: this.serviceRedFlags.lowConscientiousness.description,
        reasoning: this.serviceRedFlags.lowConscientiousness.reasoning
      });
    }

    return redFlags;
  }

  private generatePositionRecommendations(profile: PersonalityProfile): Array<{
    position: string;
    fitScore: number;
    reasoning: string;
  }> {
    const positions = [
      {
        position: 'flyttpersonal',
        requirements: {
          teamOrientation: 0.6,
          reliability: 0.7,
          customerFocus: 0.6,
          stressResilience: 0.6
        }
      },
      {
        position: 'kundservice',
        requirements: {
          empathy: 0.7,
          communicationSkills: 0.8,
          customerFocus: 0.8,
          patience: 0.7
        }
      },
      {
        position: 'team_leader',
        requirements: {
          extraversion: 0.6,
          conscientiousness: 0.7,
          problemSolving: 0.7,
          teamOrientation: 0.8
        }
      }
    ];

    return positions.map(pos => {
      let fitScore = 0;
      let reasoning = '';

      // Calculate fit score based on requirements
      Object.entries(pos.requirements).forEach(([trait, requirement]) => {
        const profileValue = this.getTraitValue(profile, trait);
        const traitScore = Math.min(1, profileValue / requirement);
        fitScore += traitScore;

        if (profileValue >= requirement) {
          reasoning += `Strong ${trait}. `;
        } else {
          reasoning += `Could improve ${trait}. `;
        }
      });

      fitScore = fitScore / Object.keys(pos.requirements).length;

      return {
        position: pos.position,
        fitScore: Math.round(fitScore * 100) / 100,
        reasoning: reasoning.trim()
      };
    }).sort((a, b) => b.fitScore - a.fitScore);
  }

  private getTraitValue(profile: PersonalityProfile, trait: string): number {
    if (trait in profile.bigFive) {
      return profile.bigFive[trait as keyof typeof profile.bigFive];
    }
    if (trait in profile.serviceTraits) {
      return profile.serviceTraits[trait as keyof typeof profile.serviceTraits];
    }
    if (trait in profile.workStyle) {
      return profile.workStyle[trait as keyof typeof profile.workStyle];
    }
    return 0.5; // Default neutral
  }

  private makeOverallRecommendation(
    profile: PersonalityProfile,
    serviceScore: number,
    redFlags: ServiceRedFlag[]
  ): 'hire' | 'conditional' | 'reject' {
    // Disqualifying red flags
    const hasDisqualifyingFlags = redFlags.some(flag => flag.severity === 'disqualifying');
    if (hasDisqualifyingFlags) {
      return 'reject';
    }

    // High service score and no major issues
    if (serviceScore >= 0.8 && redFlags.filter(f => f.severity === 'high').length === 0) {
      return 'hire';
    }

    // Good service score with minor concerns
    if (serviceScore >= 0.6 && redFlags.filter(f => f.severity === 'high').length <= 1) {
      return 'conditional';
    }

    // Below threshold
    return 'reject';
  }

  private async storeAssessmentResults(
    applicationId: number,
    result: AssessmentResult
  ): Promise<void> {
    const response = await fetch('/api/recruitment/assessment-results', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        application_id: applicationId,
        personality_results: result.profile,
        service_fitness_score: result.serviceScore,
        red_flag_personalities: result.redFlags,
        recommended_position: result.positionRecommendations[0]?.position,
        overall_recommendation: result.overallRecommendation
      })
    });

    if (!response.ok) {
      throw new Error('Failed to store assessment results');
    }
  }
}