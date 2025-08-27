/**
 * NORDFLYTT AI RECRUITMENT SYSTEM
 * Smart Application Processor for CV Analysis & Position Matching
 */

import { DocumentAnalyzer } from './DocumentAnalyzer';
import { ServicePersonalityScreener } from './ServicePersonalityScreener';
import { PositionMatcher } from './PositionMatcher';
import { AIEmailRecruiter } from './AIEmailRecruiter';

export interface ApplicationData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  desired_position: string;
  geographic_preference?: string;
  availability_date?: Date;
  salary_expectation?: number;
}

export interface DocumentAnalysisResult {
  type: 'cv' | 'personal_letter';
  score: number;
  strengths: string[];
  redFlags: string[];
  keySkills: string[];
  experience: string[];
  education: string[];
}

export interface PositionMatch {
  position: string;
  confidence: number;
  reasonsForMatch: string[];
  alternativePositions: Array<{
    position: string;
    confidence: number;
  }>;
}

export interface ProcessingResult {
  applicationId: number;
  documentScores: DocumentAnalysisResult[];
  recommendedPosition: PositionMatch;
  emailConversationStarted: boolean;
  nextSteps: string[];
  estimatedTimeToHire: string;
}

export class SmartApplicationProcessor {
  private documentAnalyzer: DocumentAnalyzer;
  private personalityScreener: ServicePersonalityScreener;
  private positionMatcher: PositionMatcher;
  private aiEmailRecruiter: AIEmailRecruiter;

  constructor() {
    this.documentAnalyzer = new DocumentAnalyzer();
    this.personalityScreener = new ServicePersonalityScreener();
    this.positionMatcher = new PositionMatcher();
    this.aiEmailRecruiter = new AIEmailRecruiter();
  }

  async processNewApplication(
    applicationData: ApplicationData,
    cvFile: File,
    letterFile?: File
  ): Promise<ProcessingResult> {
    console.log('🎯 Starting application processing for:', applicationData.email);

    try {
      // 1. Store basic application
      const application = await this.storeApplication(applicationData);
      console.log('✅ Application stored with ID:', application.id);

      // 2. Analyze documents with AI
      const documentAnalysis = await Promise.all([
        this.documentAnalyzer.analyzeCV(cvFile, application.id),
        letterFile ? this.documentAnalyzer.analyzePersonalLetter(letterFile, application.id) : null
      ].filter(Boolean)) as DocumentAnalysisResult[];

      console.log('📄 Documents analyzed:', documentAnalysis.length);

      // 3. Intelligent position matching
      const positionMatch = await this.positionMatcher.findBestMatch(
        applicationData.desired_position,
        documentAnalysis,
        applicationData.geographic_preference
      );

      console.log('🎯 Position match found:', positionMatch.position, 'confidence:', positionMatch.confidence);

      // 4. Initialize AI email conversation
      const emailConversation = await this.aiEmailRecruiter.initiateEmailScreening(
        application.id,
        documentAnalysis,
        positionMatch
      );

      console.log('📧 Email conversation started:', emailConversation.conversationStarted);

      // 5. Generate next steps
      const nextSteps = this.generateNextSteps(documentAnalysis, positionMatch);

      return {
        applicationId: application.id,
        documentScores: documentAnalysis,
        recommendedPosition: positionMatch,
        emailConversationStarted: emailConversation.conversationStarted,
        nextSteps: nextSteps,
        estimatedTimeToHire: this.calculateEstimatedTimeToHire(positionMatch)
      };

    } catch (error) {
      console.error('❌ Error processing application:', error);
      throw new Error(`Application processing failed: ${error.message}`);
    }
  }

  private async storeApplication(applicationData: ApplicationData): Promise<{ id: number }> {
    const response = await fetch('/api/recruitment/applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...applicationData,
        application_date: new Date().toISOString(),
        current_stage: 'cv_screening',
        status: 'active'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to store application');
    }

    return await response.json();
  }

  private generateNextSteps(
    documentAnalysis: DocumentAnalysisResult[],
    positionMatch: PositionMatch
  ): string[] {
    const steps: string[] = [];

    // Analyze document quality
    const avgDocumentScore = documentAnalysis.reduce((sum, doc) => sum + doc.score, 0) / documentAnalysis.length;

    if (avgDocumentScore >= 0.8) {
      steps.push('📄 Excellent documents - fast-track to email screening');
    } else if (avgDocumentScore >= 0.6) {
      steps.push('📄 Good documents - standard email screening process');
    } else {
      steps.push('📄 Documents need follow-up questions');
    }

    // Position match confidence
    if (positionMatch.confidence >= 0.8) {
      steps.push('🎯 Strong position match - proceed with specialized questions');
    } else if (positionMatch.confidence >= 0.6) {
      steps.push('🎯 Good position match - explore fit further');
    } else {
      steps.push('🎯 Position match uncertain - explore alternatives');
    }

    // Service screening priority
    steps.push('🤖 AI email screening focused on service attitude');
    steps.push('🧠 Personality assessment for service fitness');
    steps.push('🎥 Video analysis for customer interaction skills');

    return steps;
  }

  private calculateEstimatedTimeToHire(positionMatch: PositionMatch): string {
    // Base timeline: 5-7 days for standard process
    let days = 6;

    // Adjust based on position match confidence
    if (positionMatch.confidence >= 0.9) {
      days = 4; // Fast-track for excellent matches
    } else if (positionMatch.confidence < 0.6) {
      days = 8; // Extended review for uncertain matches
    }

    // Adjust based on position type
    if (positionMatch.position === 'team_leader' || positionMatch.position === 'koordinator') {
      days += 2; // Leadership positions need more assessment
    }

    return `${days} arbetsdagar`;
  }

  async getApplicationStatus(applicationId: number): Promise<any> {
    const response = await fetch(`/api/recruitment/applications/${applicationId}`);
    if (!response.ok) {
      throw new Error('Failed to get application status');
    }
    return await response.json();
  }

  async updateApplicationStage(applicationId: number, stage: string, notes?: string): Promise<void> {
    const response = await fetch(`/api/recruitment/applications/${applicationId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        current_stage: stage,
        updated_at: new Date().toISOString(),
        notes: notes
      })
    });

    if (!response.ok) {
      throw new Error('Failed to update application stage');
    }
  }

  async getAllApplications(filters?: {
    stage?: string;
    status?: string;
    position?: string;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.stage) params.append('stage', filters.stage);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.position) params.append('position', filters.position);

    const response = await fetch(`/api/recruitment/applications?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to get applications');
    }
    return await response.json();
  }

  async getApplicationMetrics(): Promise<{
    totalApplications: number;
    byStage: Record<string, number>;
    byPosition: Record<string, number>;
    averageProcessingTime: number;
    hiringSuccess: number;
  }> {
    const response = await fetch('/api/recruitment/metrics');
    if (!response.ok) {
      throw new Error('Failed to get metrics');
    }
    return await response.json();
  }
}