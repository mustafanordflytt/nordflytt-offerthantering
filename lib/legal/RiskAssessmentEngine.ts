import { supabase } from '@/lib/supabase';

interface RiskFactors {
  customer_factors: {
    payment_history: number;
    complaint_history: number;
    communication_style: number;
    special_requests: number;
  };
  job_factors: {
    value_at_risk: number;
    complexity: number;
    timeline_pressure: number;
    location_risks: number;
    weather_risks: number;
  };
  operational_factors: {
    team_experience: number;
    equipment_condition: number;
    route_complexity: number;
    capacity_stress: number;
  };
}

interface RiskAssessment {
  uppdrag_id?: number;
  customer_id?: number;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  primary_risks: string[];
  mitigation_strategies: MitigationStrategy[];
  insurance_recommendations: string[];
  special_precautions: string[];
}

interface MitigationStrategy {
  risk: string;
  mitigation: string;
  cost_impact: number;
  effectiveness: number;
}

export class RiskAssessmentEngine {
  async assessJobRisk(uppdragId: number): Promise<RiskAssessment> {
    try {
      const jobDetails = await this.getJobDetails(uppdragId);
      if (!jobDetails) {
        throw new Error('Job not found');
      }

      const riskFactors = await this.analyzeRiskFactors(jobDetails);
      const riskScore = this.calculateRiskScore(riskFactors);
      
      const assessment: RiskAssessment = {
        uppdrag_id: uppdragId,
        risk_score: riskScore,
        risk_level: this.categorizeRisk(riskScore),
        primary_risks: this.identifyPrimaryRisks(riskFactors),
        mitigation_strategies: this.generateMitigationStrategies(riskFactors),
        insurance_recommendations: this.getInsuranceRecommendations(riskScore, riskFactors),
        special_precautions: this.getSpecialPrecautions(riskFactors)
      };

      await this.storeRiskAssessment(assessment);
      
      if (riskScore > 75) {
        await this.triggerHighRiskAlert(assessment);
      }

      return assessment;
    } catch (error) {
      console.error('Error assessing job risk:', error);
      throw error;
    }
  }

  async assessCustomerRisk(customerId: number): Promise<RiskAssessment> {
    try {
      const customerHistory = await this.getCustomerHistory(customerId);
      const riskFactors = await this.analyzeCustomerRiskFactors(customerHistory);
      const riskScore = this.calculateCustomerRiskScore(riskFactors);

      const assessment: RiskAssessment = {
        customer_id: customerId,
        risk_score: riskScore,
        risk_level: this.categorizeRisk(riskScore),
        primary_risks: this.identifyCustomerRisks(customerHistory),
        mitigation_strategies: this.generateCustomerMitigationStrategies(customerHistory),
        insurance_recommendations: [],
        special_precautions: this.getCustomerPrecautions(customerHistory)
      };

      await this.storeRiskAssessment(assessment, 'customer');
      
      return assessment;
    } catch (error) {
      console.error('Error assessing customer risk:', error);
      throw error;
    }
  }

  private async getJobDetails(uppdragId: number) {
    const { data } = await supabase
      .from('uppdrag')
      .select(`
        *,
        kunder (
          id,
          namn,
          payment_history,
          complaint_count
        ),
        anställda (
          id,
          namn,
          erfarenhet_år
        )
      `)
      .eq('id', uppdragId)
      .single();

    return data;
  }

  private async analyzeRiskFactors(jobDetails: any): Promise<RiskFactors> {
    const factors: RiskFactors = {
      customer_factors: {
        payment_history: await this.analyzePaymentHistory(jobDetails.kunder?.id),
        complaint_history: await this.getComplaintHistory(jobDetails.kunder?.id),
        communication_style: this.analyzeCustomerCommunication(jobDetails),
        special_requests: this.analyzeSpecialRequests(jobDetails.special_requirements)
      },
      
      job_factors: {
        value_at_risk: jobDetails.estimated_value || 0,
        complexity: this.assessJobComplexity(jobDetails),
        timeline_pressure: this.assessTimelinePressure(jobDetails),
        location_risks: await this.assessLocationRisks(jobDetails),
        weather_risks: await this.getWeatherRisks(jobDetails.datum, jobDetails.från_address)
      },
      
      operational_factors: {
        team_experience: await this.assessTeamExperience(jobDetails.anställda),
        equipment_condition: 0.8, // Placeholder - would check equipment database
        route_complexity: await this.assessRouteComplexity(jobDetails),
        capacity_stress: await this.checkCapacityStress(jobDetails.datum)
      }
    };

    return factors;
  }

  private async analyzePaymentHistory(customerId: number): Promise<number> {
    if (!customerId) return 0.5;

    const { data } = await supabase
      .from('fakturer')
      .select('status, förfallodatum')
      .eq('kund_id', customerId);

    if (!data || data.length === 0) return 0.5;

    const latePayments = data.filter(f => 
      f.status === 'försenad' || 
      (f.status === 'obetald' && new Date(f.förfallodatum) < new Date())
    ).length;

    return latePayments > 2 ? 0.9 : latePayments > 0 ? 0.6 : 0.2;
  }

  private async getComplaintHistory(customerId: number): Promise<number> {
    if (!customerId) return 0.5;

    const { data } = await supabase
      .from('legal_disputes')
      .select('id')
      .eq('customer_id', customerId);

    const complaintCount = data?.length || 0;
    return complaintCount > 3 ? 0.9 : complaintCount > 1 ? 0.6 : 0.2;
  }

  private analyzeCustomerCommunication(jobDetails: any): number {
    // Analyze special requirements for demanding language
    const requirements = jobDetails.special_requirements?.toLowerCase() || '';
    const demandingKeywords = ['måste', 'kräver', 'absolut', 'omedelbart', 'oacceptabelt'];
    
    let score = 0.5;
    for (const keyword of demandingKeywords) {
      if (requirements.includes(keyword)) {
        score += 0.1;
      }
    }
    
    return Math.min(score, 1);
  }

  private analyzeSpecialRequests(requirements: string | null): number {
    if (!requirements) return 0.2;
    
    // More special requests = higher risk
    const requestCount = requirements.split(',').length;
    return Math.min(requestCount * 0.15, 1);
  }

  private assessJobComplexity(jobDetails: any): number {
    let complexity = 0.3;
    
    // Factors that increase complexity
    if (jobDetails.våning_från > 3 || jobDetails.våning_till > 3) complexity += 0.2;
    if (!jobDetails.hiss_från || !jobDetails.hiss_till) complexity += 0.2;
    if (jobDetails.volym > 50) complexity += 0.1;
    if (jobDetails.special_requirements) complexity += 0.1;
    if (jobDetails.packning) complexity += 0.1;
    
    return Math.min(complexity, 1);
  }

  private assessTimelinePressure(jobDetails: any): number {
    const moveDate = new Date(jobDetails.datum);
    const today = new Date();
    const daysUntilMove = Math.floor((moveDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilMove < 3) return 0.9;
    if (daysUntilMove < 7) return 0.6;
    if (daysUntilMove < 14) return 0.4;
    return 0.2;
  }

  private async assessLocationRisks(jobDetails: any): Promise<number> {
    let risk = 0.3;
    
    // Central Stockholm addresses have parking challenges
    if (jobDetails.från_address?.includes('Gamla Stan') || 
        jobDetails.till_address?.includes('Gamla Stan')) {
      risk += 0.3;
    }
    
    // Long distance moves are riskier
    if (jobDetails.avstånd > 50) risk += 0.2;
    
    return Math.min(risk, 1);
  }

  private async getWeatherRisks(moveDate: string, location: string): Promise<number> {
    const date = new Date(moveDate);
    const month = date.getMonth();
    
    // Winter months (Nov-Mar) have higher risk
    if (month >= 10 || month <= 2) return 0.7;
    
    // Summer is lowest risk
    if (month >= 5 && month <= 8) return 0.2;
    
    return 0.4;
  }

  private async assessTeamExperience(team: any[]): Promise<number> {
    if (!team || team.length === 0) return 0.5;
    
    const avgExperience = team.reduce((sum, member) => 
      sum + (member.erfarenhet_år || 0), 0) / team.length;
    
    if (avgExperience > 5) return 0.2;
    if (avgExperience > 2) return 0.5;
    return 0.8;
  }

  private async assessRouteComplexity(jobDetails: any): Promise<number> {
    // Simple assessment based on distance and urban locations
    let complexity = jobDetails.avstånd > 30 ? 0.5 : 0.3;
    
    if (jobDetails.från_address?.includes('Stockholm') && 
        jobDetails.till_address?.includes('Stockholm')) {
      complexity += 0.2;
    }
    
    return Math.min(complexity, 1);
  }

  private async checkCapacityStress(moveDate: string): Promise<number> {
    const { data } = await supabase
      .from('uppdrag')
      .select('id')
      .eq('datum', moveDate)
      .eq('status', 'scheduled');

    const bookingsOnDate = data?.length || 0;
    
    if (bookingsOnDate > 10) return 0.9;
    if (bookingsOnDate > 7) return 0.6;
    if (bookingsOnDate > 5) return 0.4;
    return 0.2;
  }

  private calculateRiskScore(factors: RiskFactors): number {
    // Weighted average of all factors
    const weights = {
      customer: 0.3,
      job: 0.4,
      operational: 0.3
    };

    const customerScore = Object.values(factors.customer_factors).reduce((a, b) => a + b, 0) / 
                         Object.values(factors.customer_factors).length;
    
    const jobScore = Object.values(factors.job_factors).reduce((a, b) => a + b, 0) / 
                    Object.values(factors.job_factors).length;
    
    const operationalScore = Object.values(factors.operational_factors).reduce((a, b) => a + b, 0) / 
                            Object.values(factors.operational_factors).length;

    const totalScore = (customerScore * weights.customer) + 
                      (jobScore * weights.job) + 
                      (operationalScore * weights.operational);

    return Math.round(totalScore * 100);
  }

  private categorizeRisk(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  private identifyPrimaryRisks(factors: RiskFactors): string[] {
    const risks = [];
    
    if (factors.customer_factors.payment_history > 0.7) {
      risks.push('Betalningshistorik indikerar kreditrisk');
    }
    if (factors.customer_factors.complaint_history > 0.7) {
      risks.push('Kund med historik av klagomål');
    }
    if (factors.job_factors.value_at_risk > 100000) {
      risks.push('Högt värde gods - ökad skaderisk');
    }
    if (factors.job_factors.complexity > 0.8) {
      risks.push('Komplex flytt med många riskfaktorer');
    }
    if (factors.operational_factors.team_experience < 0.3) {
      risks.push('Erfaret team tilldelat');
    }
    
    return risks;
  }

  private generateMitigationStrategies(riskFactors: RiskFactors): MitigationStrategy[] {
    const strategies: MitigationStrategy[] = [];
    
    // High-value items
    if (riskFactors.job_factors.value_at_risk > 100000) {
      strategies.push({
        risk: "Högt värde gods",
        mitigation: "Extra försäkring, seniorteam, detaljerad fotodokumentation",
        cost_impact: 500,
        effectiveness: 0.85
      });
    }

    // Difficult customer history
    if (riskFactors.customer_factors.complaint_history > 0.7) {
      strategies.push({
        risk: "Klagomålsbenägen kund",
        mitigation: "Tilldela erfaren kundservicespecialist, extra kommunikation",
        cost_impact: 200,
        effectiveness: 0.75
      });
    }

    // Complex logistics
    if (riskFactors.job_factors.complexity > 0.8) {
      strategies.push({
        risk: "Komplex logistik",
        mitigation: "Förbesök, detaljerad planering, backup-planer",
        cost_impact: 800,
        effectiveness: 0.9
      });
    }

    // Weather risks
    if (riskFactors.job_factors.weather_risks > 0.6) {
      strategies.push({
        risk: "Väderrelaterade risker",
        mitigation: "Väderskydd för gods, extra personal, flexibel tidplan",
        cost_impact: 300,
        effectiveness: 0.7
      });
    }

    return strategies;
  }

  private getInsuranceRecommendations(score: number, factors: RiskFactors): string[] {
    const recommendations = [];
    
    if (score > 70) {
      recommendations.push('Överväg tilläggförsäkring för detta uppdrag');
    }
    
    if (factors.job_factors.value_at_risk > 100000) {
      recommendations.push('Säkerställ fullvärdesförsäkring för högt värde gods');
    }
    
    if (factors.customer_factors.complaint_history > 0.7) {
      recommendations.push('Dokumentera försäkringsvillkor tydligt för kunden');
    }
    
    return recommendations;
  }

  private getSpecialPrecautions(factors: RiskFactors): string[] {
    const precautions = [];
    
    if (factors.job_factors.complexity > 0.8) {
      precautions.push('Genomför förbesök för planering');
    }
    
    if (factors.customer_factors.communication_style > 0.7) {
      precautions.push('Tilldela diplomatisk teamledare');
    }
    
    if (factors.operational_factors.capacity_stress > 0.7) {
      precautions.push('Säkerställ backup-resurser finns tillgängliga');
    }
    
    return precautions;
  }

  private async storeRiskAssessment(assessment: RiskAssessment, type: string = 'uppdrag') {
    await supabase
      .from('risk_assessments')
      .insert({
        assessment_type: type === 'uppdrag' ? 'job_risk' : 'customer_risk',
        reference_id: assessment.uppdrag_id || assessment.customer_id,
        reference_type: type,
        risk_factors: {
          primary_risks: assessment.primary_risks,
          mitigation_strategies: assessment.mitigation_strategies
        },
        risk_score: assessment.risk_score,
        risk_level: assessment.risk_level,
        mitigation_strategies: assessment.mitigation_strategies,
        predicted_issues: assessment.primary_risks,
        prevention_measures: assessment.special_precautions,
        assessed_by: 'ai_system',
        validity_period: 30
      });
  }

  private async triggerHighRiskAlert(assessment: RiskAssessment) {
    // Send notification to management about high-risk job
    console.log('⚠️ HIGH RISK ALERT:', assessment);
    
    // In production, this would send email/SMS alerts
    // await sendNotification({
    //   type: 'high_risk_job',
    //   urgency: 'high',
    //   data: assessment
    // });
  }

  private async getCustomerHistory(customerId: number) {
    const { data: disputes } = await supabase
      .from('legal_disputes')
      .select('*')
      .eq('customer_id', customerId);

    const { data: jobs } = await supabase
      .from('uppdrag')
      .select('*')
      .eq('kund_id', customerId);

    return {
      disputes: disputes || [],
      jobs: jobs || [],
      total_disputes: disputes?.length || 0,
      total_jobs: jobs?.length || 0
    };
  }

  private async analyzeCustomerRiskFactors(history: any): Promise<RiskFactors> {
    return {
      customer_factors: {
        payment_history: history.total_disputes > 2 ? 0.8 : 0.3,
        complaint_history: history.total_disputes / Math.max(history.total_jobs, 1),
        communication_style: 0.5,
        special_requests: 0.5
      },
      job_factors: {
        value_at_risk: 0,
        complexity: 0,
        timeline_pressure: 0,
        location_risks: 0,
        weather_risks: 0
      },
      operational_factors: {
        team_experience: 0,
        equipment_condition: 0,
        route_complexity: 0,
        capacity_stress: 0
      }
    };
  }

  private calculateCustomerRiskScore(factors: RiskFactors): number {
    const customerScore = Object.values(factors.customer_factors).reduce((a, b) => a + b, 0) / 
                         Object.values(factors.customer_factors).length;
    return Math.round(customerScore * 100);
  }

  private identifyCustomerRisks(history: any): string[] {
    const risks = [];
    
    if (history.total_disputes > 2) {
      risks.push('Hög frekvens av tvister');
    }
    
    if (history.total_disputes / history.total_jobs > 0.3) {
      risks.push('Hög andel klagomål relativt antal jobb');
    }
    
    return risks;
  }

  private generateCustomerMitigationStrategies(history: any): MitigationStrategy[] {
    const strategies: MitigationStrategy[] = [];
    
    if (history.total_disputes > 2) {
      strategies.push({
        risk: "Återkommande tvister",
        mitigation: "Extra dokumentation, tydlig kommunikation, seniorpersonal",
        cost_impact: 300,
        effectiveness: 0.8
      });
    }
    
    return strategies;
  }

  private getCustomerPrecautions(history: any): string[] {
    const precautions = [];
    
    if (history.total_disputes > 0) {
      precautions.push('Dokumentera alla interaktioner noggrant');
      precautions.push('Bekräfta alla överenskommelser skriftligt');
    }
    
    return precautions;
  }
}