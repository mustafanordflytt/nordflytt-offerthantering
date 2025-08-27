/**
 * NORDFLYTT PROCUREMENT INTELLIGENCE ENGINE
 * AI-Powered automatic discovery and analysis of public procurement opportunities
 * Stockholm-focused market domination system
 */

export interface ProcurementOpportunity {
  id?: number;
  source: string;
  tenderId: string;
  title: string;
  entityName: string;
  entityType: 'kommun' | 'region' | 'myndighet' | 'bolag';
  estimatedValue: number;
  deadline: string;
  description: string;
  category: string;
  subcategory: string;
  requirements: any;
  procurementType: string;
  rawData: any;
}

export interface AIAnalysis {
  winProbability: number;
  strategicImportance: 'critical' | 'high' | 'medium' | 'low';
  nordflyttAdvantages: string[];
  challenges: string[];
  competitorAnalysis: any;
  riskFactors: string[];
  recommendations: string[];
  confidenceScore: number;
  estimatedEffort: number; // hours
  estimatedRevenue: number;
  keyStakeholders: string[];
}

export interface VismaCommerceSearchCriteria {
  regions: string[];
  categories: string[];
  keywords: string[];
  minimumValue: number;
  status: string;
  dateRange?: {
    from: string;
    to: string;
  };
}

export class ProcurementIntelligenceEngine {
  private stockholmMunicipalities = [
    'Stockholm', 'Solna', 'Sundbyberg', 'Nacka', 'Täby', 'Danderyd', 
    'Lidingö', 'Huddinge', 'Botkyrka', 'Haninge', 'Tyresö', 'Värmdö'
  ];

  private targetCategories = [
    'Flyttjänster', 'Transporttjänster', 'Logistiktjänster', 
    'Lokalvård', 'Fastighetstjänster', 'Kontorsflytt'
  ];

  private aiKeywords = [
    'flytt', 'transport', 'relokalisering', 'omlokalisering', 
    'logistik', 'förflyttning', 'etablering', 'evakuering'
  ];

  constructor() {
    console.log('🎯 Nordflytt Procurement Intelligence Engine initialized');
    console.log('📍 Target: Stockholm Region Public Sector');
    console.log('🤖 AI-Powered Opportunity Discovery & Analysis');
  }

  async scanForOpportunities(): Promise<ProcurementOpportunity[]> {
    console.log('🔍 Starting comprehensive procurement opportunity scan...');
    
    try {
      const scanResults = await Promise.allSettled([
        this.scanVismaCommerce(),
        this.scanTEDDatabase(),
        this.scanEntityWebsites(),
        this.scanNetworkSources(),
        this.scanGovernmentPortals()
      ]);

      const allOpportunities: ProcurementOpportunity[] = [];
      
      scanResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allOpportunities.push(...result.value);
          console.log(`✅ Scan source ${index + 1} completed: ${result.value.length} opportunities`);
        } else {
          console.log(`❌ Scan source ${index + 1} failed:`, result.reason);
        }
      });

      // Filter for Stockholm region and relevant services
      const stockholmOpportunities = allOpportunities.filter(opp => 
        this.isStockholmRelevant(opp) && this.isMovingServiceRelevant(opp)
      );

      console.log(`🎯 Found ${stockholmOpportunities.length} Stockholm-relevant opportunities`);

      // AI analysis for each opportunity
      const analyzedOpportunities = await this.analyzeOpportunities(stockholmOpportunities);

      // Store in database
      for (const opportunity of analyzedOpportunities) {
        await this.storeOpportunity(opportunity);
      }

      return analyzedOpportunities;

    } catch (error) {
      console.error('❌ Procurement scan failed:', error);
      throw new Error(`Procurement scan failed: ${error.message}`);
    }
  }

  private async scanVismaCommerce(): Promise<ProcurementOpportunity[]> {
    console.log('📡 Scanning Visma Commerce for Stockholm opportunities...');
    
    try {
      // Simulate Visma Commerce API integration
      const mockOpportunities = [
        {
          id: 'VC-2025-001',
          title: 'Ramavtal kontorsflyttar Stockholms Stad',
          procuringEntity: 'Stockholms Stad',
          estimatedValue: 5000000,
          submissionDeadline: '2025-03-15T14:00:00Z',
          description: 'Ramavtal för kontorsflyttar inom Stockholms Stad med fokus på hållbarhet och kostnadseffektivitet',
          category: 'Flyttjänster',
          procurementType: 'ramavtal',
          technicalRequirements: {
            environmentalCertification: true,
            digitalDocumentation: true,
            realTimeTracking: true,
            qualityAssurance: 'mandatory'
          },
          contractPeriod: '2 år + 1+1 år option',
          estimatedVolume: '200-300 flyttar per år'
        },
        {
          id: 'VC-2025-002', 
          title: 'Sjukhusflyttar Region Stockholm',
          procuringEntity: 'Region Stockholm',
          estimatedValue: 3500000,
          submissionDeadline: '2025-02-28T12:00:00Z',
          description: 'Specialiserade flyttar av medicinsk utrustning och känsliga material',
          category: 'Specialflyttar',
          procurementType: 'öppen upphandling',
          technicalRequirements: {
            medicalEquipmentHandling: true,
            securityClearance: 'required',
            emergencyAvailability: '24/7',
            insurance: 'comprehensive'
          },
          contractPeriod: '3 år',
          estimatedVolume: '50-80 specialflyttar per år'
        },
        {
          id: 'VC-2025-003',
          title: 'Skolflyttar Solna Kommun sommaren 2025',
          procuringEntity: 'Solna Kommun',
          estimatedValue: 800000,
          submissionDeadline: '2025-04-10T16:00:00Z',
          description: 'Flytt av skolor och förskolor under sommarsemester',
          category: 'Utbildningsflyttar',
          procurementType: 'direktupphandling',
          technicalRequirements: {
            summerSchedule: true,
            sensitiveEquipment: true,
            childSafetyCompliance: true
          },
          contractPeriod: 'Juni-Augusti 2025',
          estimatedVolume: '8-12 skolor'
        }
      ];

      return mockOpportunities.map(tender => ({
        source: 'Visma Commerce',
        tenderId: tender.id,
        title: tender.title,
        entityName: tender.procuringEntity,
        entityType: this.determineEntityType(tender.procuringEntity),
        estimatedValue: tender.estimatedValue,
        deadline: tender.submissionDeadline,
        description: tender.description,
        category: 'flyttjänster',
        subcategory: this.determineSubcategory(tender.category),
        requirements: tender.technicalRequirements,
        procurementType: tender.procurementType,
        rawData: tender
      }));

    } catch (error) {
      console.error('❌ Visma Commerce scan failed:', error);
      return [];
    }
  }

  private async scanTEDDatabase(): Promise<ProcurementOpportunity[]> {
    console.log('🇪🇺 Scanning TED Database for larger Swedish contracts...');
    
    try {
      // Simulate TED database integration for larger contracts
      const mockTEDOpportunities = [
        {
          id: 'TED-2025-SE-001',
          title: 'Transport and Logistics Services - Swedish National Police',
          procuringEntity: 'Polismyndigheten',
          estimatedValue: 7000000,
          submissionDeadline: '2025-05-20T15:00:00Z',
          description: 'Comprehensive transport and relocation services for police facilities across Stockholm region',
          category: 'Transport services',
          procurementType: 'Open procedure',
          technicalRequirements: {
            securityClearance: 'secret',
            backgroundChecks: 'mandatory',
            emergencyResponse: 'immediate',
            tracking: 'real-time'
          },
          contractPeriod: '4 years',
          cpvCodes: ['60160000-7', '63100000-0']
        }
      ];

      return mockTEDOpportunities.map(tender => ({
        source: 'TED Database',
        tenderId: tender.id,
        title: tender.title,
        entityName: tender.procuringEntity,
        entityType: 'myndighet',
        estimatedValue: tender.estimatedValue,
        deadline: tender.submissionDeadline,
        description: tender.description,
        category: 'flyttjänster',
        subcategory: 'säkerhetsflyttar',
        requirements: tender.technicalRequirements,
        procurementType: tender.procurementType,
        rawData: tender
      }));

    } catch (error) {
      console.error('❌ TED Database scan failed:', error);
      return [];
    }
  }

  private async scanEntityWebsites(): Promise<ProcurementOpportunity[]> {
    console.log('🌐 Scanning Stockholm entity websites...');
    
    try {
      // Simulate web scraping of Stockholm municipalities
      const mockWebOpportunities = [
        {
          id: 'WEB-DANDERYD-001',
          title: 'Biblioteksflytt Danderyd Kommun',
          entity: 'Danderyd Kommun',
          value: 450000,
          deadline: '2025-03-30',
          description: 'Flytt av Danderyds bibliotek till nya lokaler',
          found_on: 'danderyd.se/upphandling'
        },
        {
          id: 'WEB-LIDINGO-001', 
          title: 'Förvaltningsflyttar Lidingö Stad',
          entity: 'Lidingö Kommun',
          value: 650000,
          deadline: '2025-04-15',
          description: 'Flera mindre förvaltningsflyttar under våren',
          found_on: 'lidingo.se/inköp'
        }
      ];

      return mockWebOpportunities.map(opp => ({
        source: 'Entity Website',
        tenderId: opp.id,
        title: opp.title,
        entityName: opp.entity,
        entityType: 'kommun' as const,
        estimatedValue: opp.value,
        deadline: opp.deadline + 'T16:00:00Z',
        description: opp.description,
        category: 'flyttjänster',
        subcategory: this.determineSubcategory(opp.title),
        requirements: {},
        procurementType: 'direktupphandling',
        rawData: opp
      }));

    } catch (error) {
      console.error('❌ Entity website scan failed:', error);
      return [];
    }
  }

  private async scanNetworkSources(): Promise<ProcurementOpportunity[]> {
    console.log('🤝 Scanning network intelligence sources...');
    
    try {
      // Simulate network intelligence gathering
      const mockNetworkOpportunities = [
        {
          id: 'NET-2025-001',
          title: 'Anticipated office consolidation - Skatteverket Stockholm',
          entity: 'Skatteverket',
          value: 2500000,
          timeframe: 'Q3 2025',
          description: 'Rumored office consolidation project combining 3 Stockholm locations',
          confidence: 0.7,
          source: 'Industry contact'
        }
      ];

      return mockNetworkOpportunities.map(opp => ({
        source: 'Network Intelligence',
        tenderId: opp.id,
        title: opp.title,
        entityName: opp.entity,
        entityType: 'myndighet' as const,
        estimatedValue: opp.value,
        deadline: '2025-06-30T16:00:00Z', // Estimated
        description: opp.description,
        category: 'flyttjänster',
        subcategory: 'kontorsflytt',
        requirements: { confidence: opp.confidence },
        procurementType: 'anticipated',
        rawData: opp
      }));

    } catch (error) {
      console.error('❌ Network scan failed:', error);
      return [];
    }
  }

  private async scanGovernmentPortals(): Promise<ProcurementOpportunity[]> {
    console.log('🏛️ Scanning government procurement portals...');
    
    try {
      // Simulate government portal scanning
      const mockGovOpportunities = [
        {
          id: 'GOV-2025-001',
          title: 'Emergency relocation services framework',
          entity: 'Socialstyrelsen Stockholm',
          value: 1200000,
          deadline: '2025-05-15',
          description: 'Framework for emergency relocations and crisis response',
          portal: 'upphandlingsmyndigheten.se'
        }
      ];

      return mockGovOpportunities.map(opp => ({
        source: 'Government Portal',
        tenderId: opp.id,
        title: opp.title,
        entityName: opp.entity,
        entityType: 'myndighet' as const,
        estimatedValue: opp.value,
        deadline: opp.deadline + 'T14:00:00Z',
        description: opp.description,
        category: 'flyttjänster',
        subcategory: 'krisledning',
        requirements: {},
        procurementType: 'ramavtal',
        rawData: opp
      }));

    } catch (error) {
      console.error('❌ Government portal scan failed:', error);
      return [];
    }
  }

  private isStockholmRelevant(opportunity: ProcurementOpportunity): boolean {
    const entityName = opportunity.entityName.toLowerCase();
    const description = opportunity.description.toLowerCase();
    
    // Check if entity is Stockholm-based
    const isStockholmEntity = this.stockholmMunicipalities.some(municipality => 
      entityName.includes(municipality.toLowerCase())
    );
    
    // Check if description mentions Stockholm
    const mentionsStockholm = description.includes('stockholm') || 
                              description.includes('stockholms län');
    
    // Check if it's a national agency with Stockholm operations
    const isNationalWithStockholm = ['skatteverket', 'försäkringskassan', 'arbetsförmedlingen', 'polismyndigheten']
      .some(agency => entityName.includes(agency)) && 
      (mentionsStockholm || description.includes('huvudkontor'));

    return isStockholmEntity || mentionsStockholm || isNationalWithStockholm;
  }

  private isMovingServiceRelevant(opportunity: ProcurementOpportunity): boolean {
    const title = opportunity.title.toLowerCase();
    const description = opportunity.description.toLowerCase();
    const category = opportunity.category.toLowerCase();
    
    // Check for moving-related keywords
    const relevantKeywords = this.aiKeywords.some(keyword => 
      title.includes(keyword) || description.includes(keyword)
    );
    
    // Check category relevance
    const relevantCategory = this.targetCategories.some(cat => 
      category.includes(cat.toLowerCase())
    );
    
    // Check for specific moving-related terms
    const movingTerms = ['relocation', 'moving', 'transport', 'logistics', 'facility management'];
    const hasMovingTerms = movingTerms.some(term => 
      title.includes(term) || description.includes(term)
    );

    return relevantKeywords || relevantCategory || hasMovingTerms;
  }

  private async analyzeOpportunities(opportunities: ProcurementOpportunity[]): Promise<(ProcurementOpportunity & { aiAnalysis: AIAnalysis })[]> {
    console.log(`🤖 Running AI analysis on ${opportunities.length} opportunities...`);
    
    const analyzedOpportunities = [];
    
    for (const opportunity of opportunities) {
      try {
        const analysis = await this.performAIAnalysis(opportunity);
        analyzedOpportunities.push({
          ...opportunity,
          aiAnalysis: analysis
        });
        console.log(`✅ Analyzed: ${opportunity.title} - Win Probability: ${(analysis.winProbability * 100).toFixed(0)}%`);
      } catch (error) {
        console.error(`❌ Analysis failed for ${opportunity.title}:`, error);
      }
    }
    
    return analyzedOpportunities;
  }

  private async performAIAnalysis(opportunity: ProcurementOpportunity): Promise<AIAnalysis> {
    // Simulate AI-powered analysis
    const baseWinProbability = this.calculateBaseWinProbability(opportunity);
    const nordflyttAdvantages = this.identifyNordflyttAdvantages(opportunity);
    const challenges = this.identifyOpportunityChallenges(opportunity);
    const strategicImportance = this.calculateStrategicImportance(opportunity);
    
    return {
      winProbability: baseWinProbability,
      strategicImportance,
      nordflyttAdvantages,
      challenges,
      competitorAnalysis: this.analyzeCompetition(opportunity),
      riskFactors: this.identifyRiskFactors(opportunity),
      recommendations: this.generateRecommendations(opportunity, baseWinProbability),
      confidenceScore: Math.min(0.95, baseWinProbability + 0.1),
      estimatedEffort: this.estimateEffort(opportunity),
      estimatedRevenue: opportunity.estimatedValue,
      keyStakeholders: this.identifyKeyStakeholders(opportunity)
    };
  }

  private calculateBaseWinProbability(opportunity: ProcurementOpportunity): number {
    let probability = 0.5; // Base 50%
    
    // AI technology advantage
    if (opportunity.requirements?.digitalDocumentation || 
        opportunity.requirements?.realTimeTracking) {
      probability += 0.2; // +20% for tech requirements
    }
    
    // Cost efficiency advantage
    if (opportunity.estimatedValue > 1000000) {
      probability += 0.15; // +15% for large contracts where AI efficiency matters
    }
    
    // Stockholm local presence
    if (opportunity.entityType === 'kommun') {
      probability += 0.1; // +10% for municipal contracts
    }
    
    // Specialized requirements matching Nordflytt capabilities
    if (opportunity.subcategory === 'kontorsflytt' || 
        opportunity.subcategory === 'skolflyttar') {
      probability += 0.1; // +10% for our specialty areas
    }
    
    // Environmental requirements (AI route optimization advantage)
    if (opportunity.requirements?.environmentalCertification) {
      probability += 0.15; // +15% for sustainability focus
    }
    
    return Math.min(0.95, probability); // Max 95% probability
  }

  private identifyNordflyttAdvantages(opportunity: ProcurementOpportunity): string[] {
    const advantages = [
      '99% AI-automatiserade operationer - unikt i branschen',
      '60% lägre operationella kostnader genom AI-optimering',
      'Real-time GPS-spårning och kvalitetssäkring',
      'Miljöoptimerade rutter med AI Route Planning'
    ];
    
    // Add specific advantages based on requirements
    if (opportunity.requirements?.realTimeTracking) {
      advantages.push('Avancerad IoT och real-time dashboards');
    }
    
    if (opportunity.requirements?.digitalDocumentation) {
      advantages.push('Fullständigt paperless workflow');
    }
    
    if (opportunity.estimatedValue > 2000000) {
      advantages.push('Skalbar AI-arkitektur för stora volymer');
    }
    
    if (opportunity.entityType === 'myndighet') {
      advantages.push('Specialiserad compliance och säkerhetsprotokoll');
    }
    
    return advantages;
  }

  private identifyOpportunityChallenges(opportunity: ProcurementOpportunity): string[] {
    const challenges = [];
    
    if (opportunity.estimatedValue > 5000000) {
      challenges.push('Stor kontraktsstorlek kräver omfattande referenser');
    }
    
    if (opportunity.requirements?.securityClearance) {
      challenges.push('Säkerhetsklearance krävs för personal');
    }
    
    if (opportunity.entityType === 'region') {
      challenges.push('Komplex beslutsprocess med många stakeholders');
    }
    
    if (opportunity.procurementType === 'ramavtal') {
      challenges.push('Långsiktig åtagande med prestandakrav');
    }
    
    if (opportunity.deadline && new Date(opportunity.deadline) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
      challenges.push('Kort tid för offertpreparation');
    }
    
    return challenges;
  }

  private calculateStrategicImportance(opportunity: ProcurementOpportunity): 'critical' | 'high' | 'medium' | 'low' {
    // Stockholm Stad and Region Stockholm are critical
    if (opportunity.entityName.includes('Stockholm') && 
        (opportunity.entityType === 'kommun' || opportunity.entityType === 'region')) {
      return 'critical';
    }
    
    // Large contracts are high importance
    if (opportunity.estimatedValue > 3000000) {
      return 'high';
    }
    
    // Reference-building opportunities in key municipalities
    if (['Solna', 'Sundbyberg', 'Nacka'].some(mun => 
        opportunity.entityName.includes(mun))) {
      return 'high';
    }
    
    // Medium value contracts
    if (opportunity.estimatedValue > 1000000) {
      return 'medium';
    }
    
    return 'low';
  }

  private analyzeCompetition(opportunity: ProcurementOpportunity): any {
    // Simulate competitor analysis
    return {
      expectedCompetitors: [
        'Flyttfirman Stockholm AB',
        'Nordic Moving Solutions',
        'Smart Flytt AB'
      ],
      competitiveAdvantages: [
        'AI technology leadership',
        'Cost efficiency through automation',
        'Real-time quality assurance'
      ],
      competitiveThreats: [
        'Established relationships',
        'Local market presence',
        'Traditional approach preference'
      ]
    };
  }

  private identifyRiskFactors(opportunity: ProcurementOpportunity): string[] {
    const risks = [];
    
    if (opportunity.source === 'Network Intelligence') {
      risks.push('Unconfirmed opportunity - needs verification');
    }
    
    if (opportunity.entityType === 'myndighet') {
      risks.push('Strict compliance and security requirements');
    }
    
    if (opportunity.procurementType === 'ramavtal') {
      risks.push('Long-term commitment with performance penalties');
    }
    
    return risks;
  }

  private generateRecommendations(opportunity: ProcurementOpportunity, winProbability: number): string[] {
    const recommendations = [];
    
    if (winProbability > 0.7) {
      recommendations.push('High priority - develop comprehensive offer immediately');
      recommendations.push('Engage key stakeholders proactively');
    }
    
    if (winProbability > 0.5 && winProbability <= 0.7) {
      recommendations.push('Good opportunity - prepare detailed technical solution');
      recommendations.push('Research competitor positioning');
    }
    
    if (opportunity.estimatedValue > 2000000) {
      recommendations.push('Prepare extensive reference documentation');
      recommendations.push('Consider partnership or subcontracting strategy');
    }
    
    if (opportunity.entityName.includes('Stockholm')) {
      recommendations.push('Leverage Stockholm local presence in positioning');
    }
    
    return recommendations;
  }

  private estimateEffort(opportunity: ProcurementOpportunity): number {
    let baseHours = 40; // Base effort for any proposal
    
    if (opportunity.estimatedValue > 5000000) baseHours += 60;
    if (opportunity.estimatedValue > 2000000) baseHours += 30;
    if (opportunity.procurementType === 'ramavtal') baseHours += 20;
    if (opportunity.requirements?.securityClearance) baseHours += 15;
    
    return baseHours;
  }

  private identifyKeyStakeholders(opportunity: ProcurementOpportunity): string[] {
    const stakeholders = ['Inköpschef', 'Fastighetschef'];
    
    if (opportunity.entityType === 'kommun') {
      stakeholders.push('Kommunchef', 'Ekonomichef');
    }
    
    if (opportunity.entityType === 'region') {
      stakeholders.push('Regiondirektör', 'Verksamhetschef');
    }
    
    if (opportunity.entityType === 'myndighet') {
      stakeholders.push('Myndighetschef', 'Säkerhetschef');
    }
    
    return stakeholders;
  }

  private determineEntityType(entityName: string): 'kommun' | 'region' | 'myndighet' | 'bolag' {
    if (entityName.includes('Kommun') || entityName.includes('Stad')) return 'kommun';
    if (entityName.includes('Region')) return 'region';
    if (entityName.includes('verket') || entityName.includes('kassan') || 
        entityName.includes('myndigheten')) return 'myndighet';
    return 'bolag';
  }

  private determineSubcategory(category: string): string {
    const categoryLower = category.toLowerCase();
    
    if (categoryLower.includes('kontor')) return 'kontorsflytt';
    if (categoryLower.includes('skol') || categoryLower.includes('utbildning')) return 'skolflyttar';
    if (categoryLower.includes('sjukhus') || categoryLower.includes('vård')) return 'sjukhusflytt';
    if (categoryLower.includes('bibliotek')) return 'biblioteksflytt';
    if (categoryLower.includes('special')) return 'specialflyttar';
    if (categoryLower.includes('säkerhet') || categoryLower.includes('polis')) return 'säkerhetsflyttar';
    
    return 'kontorsflytt'; // Default
  }

  private async storeOpportunity(opportunity: ProcurementOpportunity & { aiAnalysis: AIAnalysis }): Promise<void> {
    console.log(`💾 Storing opportunity: ${opportunity.title}`);
    
    try {
      // This would integrate with the actual database
      const opportunityData = {
        tender_id: opportunity.tenderId,
        title: opportunity.title,
        entity_name: opportunity.entityName,
        entity_type: opportunity.entityType,
        estimated_value: opportunity.estimatedValue,
        deadline_date: opportunity.deadline,
        description: opportunity.description,
        category: opportunity.category,
        subcategory: opportunity.subcategory,
        procurement_type: opportunity.procurementType,
        requirements: opportunity.requirements,
        win_probability: opportunity.aiAnalysis.winProbability,
        strategic_importance: opportunity.aiAnalysis.strategicImportance,
        ai_analysis: {
          advantages: opportunity.aiAnalysis.nordflyttAdvantages,
          challenges: opportunity.aiAnalysis.challenges,
          recommendations: opportunity.aiAnalysis.recommendations,
          confidence_score: opportunity.aiAnalysis.confidenceScore
        },
        opportunity_source: opportunity.source,
        status: 'identified'
      };
      
      // Simulate database storage
      console.log('📊 Opportunity data prepared for storage:', {
        id: opportunity.tenderId,
        title: opportunity.title,
        value: opportunity.estimatedValue,
        probability: `${(opportunity.aiAnalysis.winProbability * 100).toFixed(0)}%`,
        importance: opportunity.aiAnalysis.strategicImportance
      });
      
    } catch (error) {
      console.error('❌ Failed to store opportunity:', error);
    }
  }

  // Public method to trigger manual scan
  async triggerManualScan(): Promise<{ 
    success: boolean; 
    opportunitiesFound: number; 
    highPriorityOpportunities: number; 
  }> {
    try {
      const opportunities = await this.scanForOpportunities();
      const highPriority = opportunities.filter(opp => 
        opp.aiAnalysis.winProbability > 0.7
      ).length;
      
      return {
        success: true,
        opportunitiesFound: opportunities.length,
        highPriorityOpportunities: highPriority
      };
    } catch (error) {
      console.error('Manual scan failed:', error);
      return {
        success: false,
        opportunitiesFound: 0,
        highPriorityOpportunities: 0
      };
    }
  }
}