/**
 * NORDFLYTT POSITION MATCHER
 * AI-powered position matching based on candidate analysis
 */

import { DocumentAnalysisResult, PositionMatch } from './SmartApplicationProcessor';

export interface NordflyttPosition {
  position_key: string;
  title: string;
  base_salary: number;
  hourly_rate: number;
  benefits: string[];
  requirements: string[];
  probation_period: number;
  work_type: string;
}

export interface PositionFitScore {
  position: string;
  totalScore: number;
  breakDown: {
    experienceMatch: number;
    skillsMatch: number;
    serviceOrientation: number;
    workTypeCompatibility: number;
    geographicFit: number;
  };
  reasoning: string[];
}

export class PositionMatcher {
  private nordflyttPositions: Record<string, NordflyttPosition> = {};

  constructor() {
    this.initializePositions();
  }

  private initializePositions() {
    this.nordflyttPositions = {
      flyttpersonal: {
        position_key: 'flyttpersonal',
        title: 'Flyttpersonal',
        base_salary: 28000,
        hourly_rate: 165,
        benefits: ['RUT-avdrag handling', 'GPS tracking', 'Team bonus'],
        requirements: ['Physical fitness', 'Customer service', 'Team collaboration'],
        probation_period: 3,
        work_type: 'field'
      },
      team_leader: {
        position_key: 'team_leader',
        title: 'Teamledare Flytt',
        base_salary: 35000,
        hourly_rate: 205,
        benefits: ['Leadership bonus', 'Performance incentives', 'AI training'],
        requirements: ['Leadership experience', 'Stress handling', 'Problem solving'],
        probation_period: 3,
        work_type: 'field_leadership'
      },
      kundservice: {
        position_key: 'kundservice',
        title: 'Kundservice & Support',
        base_salary: 32000,
        hourly_rate: 185,
        benefits: ['AI chatbot collaboration', 'Customer satisfaction bonus'],
        requirements: ['Communication skills', 'Empathy', 'Technology adoption'],
        probation_period: 2,
        work_type: 'office'
      },
      chauffor: {
        position_key: 'chauffor',
        title: 'Chaufför & Logistik',
        base_salary: 31000,
        hourly_rate: 180,
        benefits: ['Fuel card', 'Vehicle maintenance', 'Route optimization bonus'],
        requirements: ['Valid driver license', 'Navigation skills', 'Reliability'],
        probation_period: 3,
        work_type: 'driving'
      },
      koordinator: {
        position_key: 'koordinator',
        title: 'Koordinator & Planeringsstöd',
        base_salary: 38000,
        hourly_rate: 220,
        benefits: ['AI system access', 'Planning bonus', 'Efficiency rewards'],
        requirements: ['Organizational skills', 'AI aptitude', 'Multi-tasking'],
        probation_period: 2,
        work_type: 'office'
      },
      kvalitetskontroll: {
        position_key: 'kvalitetskontroll',
        title: 'Kvalitetskontrollant',
        base_salary: 34000,
        hourly_rate: 195,
        benefits: ['Quality bonus', 'Training certification', 'Improvement rewards'],
        requirements: ['Attention to detail', 'Documentation skills', 'Authority'],
        probation_period: 2,
        work_type: 'field_office'
      }
    };
  }

  async findBestMatch(
    desiredPosition: string,
    documentAnalysis: DocumentAnalysisResult[],
    geographicPreference?: string
  ): Promise<PositionMatch> {
    console.log('🎯 Finding best position match for desired position:', desiredPosition);

    try {
      // Calculate fit scores for all positions
      const positionScores: PositionFitScore[] = [];

      for (const [positionKey, position] of Object.entries(this.nordflyttPositions)) {
        const fitScore = await this.calculatePositionFit(
          position,
          documentAnalysis,
          desiredPosition,
          geographicPreference
        );

        positionScores.push({
          position: positionKey,
          totalScore: fitScore.total,
          breakDown: fitScore.breakdown,
          reasoning: fitScore.reasoning
        });
      }

      // Sort by total score
      positionScores.sort((a, b) => b.totalScore - a.totalScore);

      const bestMatch = positionScores[0];
      const alternatives = positionScores.slice(1, 4).map(score => ({
        position: score.position,
        confidence: score.totalScore
      }));

      console.log('🏆 Best match found:', bestMatch.position, 'score:', bestMatch.totalScore);

      return {
        position: bestMatch.position,
        confidence: bestMatch.totalScore,
        reasonsForMatch: bestMatch.reasoning,
        alternativePositions: alternatives
      };

    } catch (error) {
      console.error('❌ Position matching failed:', error);
      throw new Error(`Position matching failed: ${error.message}`);
    }
  }

  private async calculatePositionFit(
    position: NordflyttPosition,
    documentAnalysis: DocumentAnalysisResult[],
    desiredPosition: string,
    geographicPreference?: string
  ): Promise<{
    total: number;
    breakdown: PositionFitScore['breakDown'];
    reasoning: string[];
  }> {
    const reasoning: string[] = [];
    
    // 1. Experience Match (25% weight)
    const experienceMatch = this.calculateExperienceMatch(position, documentAnalysis, reasoning);

    // 2. Skills Match (25% weight)
    const skillsMatch = this.calculateSkillsMatch(position, documentAnalysis, reasoning);

    // 3. Service Orientation (20% weight)
    const serviceOrientation = this.calculateServiceOrientation(position, documentAnalysis, reasoning);

    // 4. Work Type Compatibility (20% weight)
    const workTypeCompatibility = this.calculateWorkTypeCompatibility(position, documentAnalysis, reasoning);

    // 5. Geographic Fit (10% weight)
    const geographicFit = this.calculateGeographicFit(position, geographicPreference, reasoning);

    // 6. Desired Position Alignment Bonus
    const desiredPositionBonus = this.calculateDesiredPositionAlignment(position, desiredPosition, reasoning);

    const breakdown = {
      experienceMatch,
      skillsMatch,
      serviceOrientation,
      workTypeCompatibility,
      geographicFit
    };

    const total = Math.min(1.0, 
      experienceMatch * 0.25 +
      skillsMatch * 0.25 +
      serviceOrientation * 0.20 +
      workTypeCompatibility * 0.20 +
      geographicFit * 0.10 +
      desiredPositionBonus
    );

    return {
      total,
      breakdown,
      reasoning
    };
  }

  private calculateExperienceMatch(
    position: NordflyttPosition,
    documentAnalysis: DocumentAnalysisResult[],
    reasoning: string[]
  ): number {
    let experienceScore = 0;
    const cvAnalysis = documentAnalysis.find(doc => doc.type === 'cv');
    
    if (!cvAnalysis) {
      reasoning.push(`No CV found for ${position.title}`);
      return 0;
    }

    // Match experience to position type
    if (position.work_type === 'field' || position.work_type === 'field_leadership') {
      // Look for physical work experience
      const physicalWorkKeywords = ['physical', 'manual', 'construction', 'warehouse', 
                                   'moving', 'transport', 'installation', 'maintenance'];
      
      const hasPhysicalExp = cvAnalysis.experience.some(exp => 
        physicalWorkKeywords.some(keyword => 
          exp.toLowerCase().includes(keyword)
        )
      );

      if (hasPhysicalExp) {
        experienceScore += 0.6;
        reasoning.push(`Strong physical work experience for ${position.title}`);
      }
    }

    if (position.work_type === 'office') {
      // Look for office/administrative experience
      const officeKeywords = ['office', 'administration', 'customer service', 
                             'support', 'reception', 'coordination'];
      
      const hasOfficeExp = cvAnalysis.experience.some(exp => 
        officeKeywords.some(keyword => 
          exp.toLowerCase().includes(keyword)
        )
      );

      if (hasOfficeExp) {
        experienceScore += 0.6;
        reasoning.push(`Relevant office experience for ${position.title}`);
      }
    }

    if (position.work_type === 'driving') {
      // Look for driving/logistics experience
      const drivingKeywords = ['driver', 'delivery', 'transport', 'logistics', 
                              'chaufför', 'körning', 'distribution'];
      
      const hasDrivingExp = cvAnalysis.experience.some(exp => 
        drivingKeywords.some(keyword => 
          exp.toLowerCase().includes(keyword)
        )
      );

      if (hasDrivingExp) {
        experienceScore += 0.7;
        reasoning.push(`Excellent driving/logistics experience for ${position.title}`);
      }
    }

    if (position.position_key === 'team_leader') {
      // Look for leadership experience
      const leadershipKeywords = ['leader', 'manager', 'supervisor', 'coordinator',
                                 'ledare', 'chef', 'ansvarig', 'team lead'];
      
      const hasLeadershipExp = cvAnalysis.experience.some(exp => 
        leadershipKeywords.some(keyword => 
          exp.toLowerCase().includes(keyword)
        )
      );

      if (hasLeadershipExp) {
        experienceScore += 0.4;
        reasoning.push(`Leadership experience found for ${position.title}`);
      }
    }

    // Service experience (applies to all positions)
    const serviceKeywords = ['service', 'customer', 'client', 'support', 'help'];
    const hasServiceExp = cvAnalysis.experience.some(exp => 
      serviceKeywords.some(keyword => 
        exp.toLowerCase().includes(keyword)
      )
    );

    if (hasServiceExp) {
      experienceScore += 0.3;
      reasoning.push(`Service experience beneficial for ${position.title}`);
    }

    return Math.min(1.0, experienceScore);
  }

  private calculateSkillsMatch(
    position: NordflyttPosition,
    documentAnalysis: DocumentAnalysisResult[],
    reasoning: string[]
  ): number {
    let skillsScore = 0;
    const cvAnalysis = documentAnalysis.find(doc => doc.type === 'cv');
    
    if (!cvAnalysis) return 0;

    // Create skills mapping for each position
    const positionSkillsMap: Record<string, string[]> = {
      flyttpersonal: ['physical fitness', 'teamwork', 'customer service', 'manual work'],
      team_leader: ['leadership', 'communication', 'problem solving', 'team management'],
      kundservice: ['communication', 'customer service', 'technology', 'empathy'],
      chauffor: ['driving', 'navigation', 'reliability', 'time management'],
      koordinator: ['organization', 'planning', 'technology', 'multitasking'],
      kvalitetskontroll: ['attention to detail', 'documentation', 'quality control']
    };

    const requiredSkills = positionSkillsMap[position.position_key] || [];
    
    for (const requiredSkill of requiredSkills) {
      const hasSkill = cvAnalysis.keySkills.some(skill => 
        skill.toLowerCase().includes(requiredSkill.toLowerCase()) ||
        requiredSkill.toLowerCase().includes(skill.toLowerCase())
      );

      if (hasSkill) {
        skillsScore += 1 / requiredSkills.length;
        reasoning.push(`${requiredSkill} skill matches ${position.title} requirements`);
      }
    }

    return Math.min(1.0, skillsScore);
  }

  private calculateServiceOrientation(
    position: NordflyttPosition,
    documentAnalysis: DocumentAnalysisResult[],
    reasoning: string[]
  ): number {
    let serviceScore = 0;

    // All Nordflytt positions require service orientation
    for (const doc of documentAnalysis) {
      if (doc.strengths.some(strength => 
        strength.toLowerCase().includes('service') ||
        strength.toLowerCase().includes('customer') ||
        strength.toLowerCase().includes('support')
      )) {
        serviceScore += 0.5;
        reasoning.push(`Strong service orientation shown in ${doc.type}`);
      }
    }

    // Letter analysis provides deeper service insight
    const letterAnalysis = documentAnalysis.find(doc => doc.type === 'personal_letter');
    if (letterAnalysis) {
      // Extract service attitude score from letter analysis
      const serviceAttitudeMatch = letterAnalysis.strengths.find(strength => 
        strength.includes('Service attitude')
      );
      
      if (serviceAttitudeMatch) {
        const scoreMatch = serviceAttitudeMatch.match(/(\d+)\/10/);
        if (scoreMatch) {
          const serviceAttitudeScore = parseInt(scoreMatch[1]) / 10;
          serviceScore += serviceAttitudeScore * 0.5;
          reasoning.push(`Service attitude score: ${scoreMatch[1]}/10 from personal letter`);
        }
      }
    }

    return Math.min(1.0, serviceScore);
  }

  private calculateWorkTypeCompatibility(
    position: NordflyttPosition,
    documentAnalysis: DocumentAnalysisResult[],
    reasoning: string[]
  ): number {
    let compatibilityScore = 0.5; // Base score

    const cvAnalysis = documentAnalysis.find(doc => doc.type === 'cv');
    if (!cvAnalysis) return compatibilityScore;

    // Check for work type specific experience
    if (position.work_type === 'field') {
      const fieldIndicators = ['outdoor', 'physical', 'manual', 'construction', 'moving'];
      const hasFieldExp = cvAnalysis.experience.some(exp => 
        fieldIndicators.some(indicator => exp.toLowerCase().includes(indicator))
      );
      
      if (hasFieldExp) {
        compatibilityScore += 0.4;
        reasoning.push(`Field work experience compatible with ${position.title}`);
      }

      // Check for potential red flags for field work
      if (cvAnalysis.redFlags.some(flag => 
        flag.toLowerCase().includes('injury') || 
        flag.toLowerCase().includes('physical limitation')
      )) {
        compatibilityScore -= 0.3;
        reasoning.push(`Potential physical limitations for ${position.title}`);
      }
    }

    if (position.work_type === 'office') {
      const officeIndicators = ['computer', 'office', 'administrative', 'desk', 'technology'];
      const hasOfficeExp = cvAnalysis.keySkills.some(skill => 
        officeIndicators.some(indicator => skill.toLowerCase().includes(indicator))
      );
      
      if (hasOfficeExp) {
        compatibilityScore += 0.4;
        reasoning.push(`Office skills compatible with ${position.title}`);
      }
    }

    if (position.work_type === 'driving') {
      const drivingIndicators = ['license', 'driving', 'vehicle', 'transport'];
      const hasDrivingSkills = cvAnalysis.keySkills.some(skill => 
        drivingIndicators.some(indicator => skill.toLowerCase().includes(indicator))
      ) || cvAnalysis.experience.some(exp => 
        drivingIndicators.some(indicator => exp.toLowerCase().includes(indicator))
      );
      
      if (hasDrivingSkills) {
        compatibilityScore += 0.4;
        reasoning.push(`Driving experience/skills compatible with ${position.title}`);
      }
    }

    return Math.min(1.0, compatibilityScore);
  }

  private calculateGeographicFit(
    position: NordflyttPosition,
    geographicPreference?: string,
    reasoning: string[]
  ): number {
    if (!geographicPreference) {
      reasoning.push('No geographic preference specified');
      return 0.5; // Neutral score
    }

    // Nordflytt operates primarily in Stockholm region
    const stockholmRegions = ['stockholm', 'göteborg', 'malmö', 'uppsala', 'västerås'];
    
    const prefersStockholmRegion = stockholmRegions.some(region => 
      geographicPreference.toLowerCase().includes(region)
    );

    if (prefersStockholmRegion) {
      reasoning.push(`Geographic preference ${geographicPreference} matches Nordflytt operations`);
      return 1.0;
    } else {
      reasoning.push(`Geographic preference ${geographicPreference} may require relocation`);
      return 0.3;
    }
  }

  private calculateDesiredPositionAlignment(
    position: NordflyttPosition,
    desiredPosition: string,
    reasoning: string[]
  ): number {
    if (!desiredPosition) return 0;

    const positionTitleLower = position.title.toLowerCase();
    const desiredPositionLower = desiredPosition.toLowerCase();

    // Exact match
    if (positionTitleLower.includes(desiredPositionLower) || 
        desiredPositionLower.includes(positionTitleLower)) {
      reasoning.push(`Desired position "${desiredPosition}" directly matches ${position.title}`);
      return 0.1; // 10% bonus
    }

    // Partial match for related positions
    const relatedTerms: Record<string, string[]> = {
      flyttpersonal: ['moving', 'transport', 'physical', 'manual'],
      team_leader: ['leader', 'manager', 'supervisor', 'coordinator'],
      kundservice: ['service', 'support', 'customer', 'reception'],
      chauffor: ['driver', 'delivery', 'transport', 'logistics'],
      koordinator: ['planning', 'coordination', 'organization'],
      kvalitetskontroll: ['quality', 'control', 'inspection']
    };

    const related = relatedTerms[position.position_key] || [];
    const hasRelatedTerm = related.some(term => 
      desiredPositionLower.includes(term) || term.includes(desiredPositionLower)
    );

    if (hasRelatedTerm) {
      reasoning.push(`Desired position "${desiredPosition}" is related to ${position.title}`);
      return 0.05; // 5% bonus
    }

    return 0;
  }

  async getPositionDetails(positionKey: string): Promise<NordflyttPosition | null> {
    return this.nordflyttPositions[positionKey] || null;
  }

  async getAllPositions(): Promise<NordflyttPosition[]> {
    return Object.values(this.nordflyttPositions);
  }

  async getPositionsByWorkType(workType: string): Promise<NordflyttPosition[]> {
    return Object.values(this.nordflyttPositions).filter(
      position => position.work_type === workType
    );
  }

  async calculateSalaryRecommendation(
    positionMatch: PositionMatch,
    documentAnalysis: DocumentAnalysisResult[],
    currentMarketRate?: number
  ): Promise<{
    recommendedSalary: number;
    reasoning: string;
    negotiationRange: { min: number; max: number };
  }> {
    const position = this.nordflyttPositions[positionMatch.position];
    if (!position) {
      throw new Error('Position not found');
    }

    let baseSalary = position.base_salary;
    let adjustmentFactor = 1.0;

    // Adjust based on candidate quality
    if (positionMatch.confidence >= 0.9) {
      adjustmentFactor = 1.05; // 5% premium for excellent candidates
    } else if (positionMatch.confidence >= 0.8) {
      adjustmentFactor = 1.02; // 2% premium for strong candidates
    } else if (positionMatch.confidence < 0.6) {
      adjustmentFactor = 0.98; // 2% reduction for uncertain fits
    }

    // Market rate adjustment
    if (currentMarketRate && currentMarketRate > baseSalary) {
      const marketAdjustment = Math.min(1.1, currentMarketRate / baseSalary);
      adjustmentFactor *= marketAdjustment;
    }

    const recommendedSalary = Math.round(baseSalary * adjustmentFactor);
    const negotiationRange = {
      min: Math.round(recommendedSalary * 0.95),
      max: Math.round(recommendedSalary * 1.08)
    };

    let reasoning = `Base salary ${baseSalary} SEK for ${position.title}. `;
    reasoning += `Adjusted by ${Math.round((adjustmentFactor - 1) * 100)}% based on candidate fit (${Math.round(positionMatch.confidence * 100)}%). `;
    reasoning += `Final recommendation: ${recommendedSalary} SEK.`;

    return {
      recommendedSalary,
      reasoning,
      negotiationRange
    };
  }
}