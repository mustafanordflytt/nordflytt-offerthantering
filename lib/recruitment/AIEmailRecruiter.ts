/**
 * NORDFLYTT AI EMAIL RECRUITER
 * Intelligent Email Screening Agent with Nordflytt Brand Voice
 */

import { DocumentAnalysisResult, PositionMatch } from './SmartApplicationProcessor';

export interface EmailQuestion {
  id: string;
  question: string;
  purpose: string;
  analysisPoints: string[];
  expectedAnswerLength: number;
  followUpQuestions?: string[];
}

export interface ConversationAnalysis {
  enthusiasm: number;
  serviceOrientation: number;
  communicationClarity: number;
  genuineInterest: number;
  redFlags: string[];
  positiveIndicators: string[];
}

export interface EmailConversationResult {
  conversationStarted: boolean;
  totalQuestions: number;
  expectedDuration: string;
  conversationId: string;
}

export class AIEmailRecruiter {
  private nordflyttBrandVoice = {
    tone: 'professional yet friendly',
    values: ['innovation', 'service excellence', 'AI-driven efficiency', 'team collaboration'],
    signature: 'Med vänliga hälsningar,\nNordflytt AI Rekrytering\nhr@nordflytt.se'
  };

  private serviceQuestions = [
    {
      id: 'service_experience',
      question: 'Berätta om en situation där du hjälpte en kund eller kollega som var frustrerad eller stressad. Hur hanterade du situationen och vad var resultatet?',
      purpose: 'Assess service mindset and conflict resolution',
      analysisPoints: ['empathy', 'problem_solving', 'customer_focus', 'conflict_resolution'],
      expectedAnswerLength: 150
    },
    {
      id: 'team_collaboration',
      question: 'Ge ett exempel på när du arbetat i team för att lösa en utmaning. Vilken var din roll och hur bidrog du till teamets framgång?',
      purpose: 'Evaluate teamwork and collaboration skills',
      analysisPoints: ['teamwork', 'collaboration', 'role_clarity', 'contribution'],
      expectedAnswerLength: 120
    },
    {
      id: 'stress_handling',
      question: 'Beskriv en situation där du behövde prestera under tidspress eller stress. Vilka strategier använde du för att hålla kvaliteten hög?',
      purpose: 'Test stress management and quality focus',
      analysisPoints: ['stress_management', 'quality_focus', 'time_management', 'resilience'],
      expectedAnswerLength: 130
    },
    {
      id: 'nordflytt_interest',
      question: 'Vad attraherar dig mest med Nordflytt och vår AI-fokuserade approach till flyttjänster? Hur ser du dig själv bidra till vårt team?',
      purpose: 'Gauge genuine interest and company alignment',
      analysisPoints: ['company_research', 'genuine_interest', 'ai_comfort', 'value_alignment'],
      expectedAnswerLength: 140
    }
  ];

  async initiateEmailScreening(
    applicationId: number,
    documentAnalysis: DocumentAnalysisResult[],
    positionMatch: PositionMatch
  ): Promise<EmailConversationResult> {
    console.log('📧 Initiating AI email screening for application:', applicationId);

    try {
      // Get candidate profile
      const candidate = await this.getCandidateProfile(applicationId);
      
      // Generate personalized questions based on analysis
      const personalizedQuestions = await this.generatePersonalizedQuestions(
        documentAnalysis,
        positionMatch,
        candidate
      );

      // Create conversation record
      const conversationId = await this.createConversationRecord(
        applicationId,
        personalizedQuestions
      );

      // Send initial welcome email with first question
      await this.sendWelcomeEmail(candidate, personalizedQuestions[0], conversationId);

      return {
        conversationStarted: true,
        totalQuestions: personalizedQuestions.length,
        expectedDuration: this.calculateExpectedDuration(personalizedQuestions.length),
        conversationId: conversationId
      };

    } catch (error) {
      console.error('❌ Email screening initiation failed:', error);
      throw new Error(`Email screening failed: ${error.message}`);
    }
  }

  private async getCandidateProfile(applicationId: number): Promise<any> {
    const response = await fetch(`/api/recruitment/applications/${applicationId}`);
    if (!response.ok) {
      throw new Error('Failed to get candidate profile');
    }
    return await response.json();
  }

  private async generatePersonalizedQuestions(
    documentAnalysis: DocumentAnalysisResult[],
    positionMatch: PositionMatch,
    candidate: any
  ): Promise<EmailQuestion[]> {
    const questions: EmailQuestion[] = [];
    
    // Start with service experience (mandatory for all)
    questions.push(this.serviceQuestions[0]);

    // Add position-specific questions
    const positionSpecificQuestions = this.getPositionSpecificQuestions(positionMatch.position);
    questions.push(...positionSpecificQuestions);

    // Add questions based on document analysis gaps
    const documentGapQuestions = this.getDocumentGapQuestions(documentAnalysis);
    questions.push(...documentGapQuestions);

    // Always end with Nordflytt interest question
    questions.push(this.serviceQuestions[3]);

    return questions.slice(0, 4); // Limit to 4 questions to avoid overwhelming
  }

  private getPositionSpecificQuestions(position: string): EmailQuestion[] {
    const positionQuestions: Record<string, EmailQuestion[]> = {
      flyttpersonal: [
        {
          id: 'physical_readiness',
          question: 'Flyttpersonal innebär fysiskt krävande arbete. Berätta om din erfarenhet av fysiskt arbete och hur du håller dig i form för att hantera långa arbetsdagar.',
          purpose: 'Assess physical readiness and stamina',
          analysisPoints: ['physical_fitness', 'work_ethic', 'endurance', 'realistic_expectations'],
          expectedAnswerLength: 120
        }
      ],
      
      team_leader: [
        {
          id: 'leadership_style',
          question: 'Som teamledare kommer du ansvara för att motivera och vägleda ditt team. Beskriv din ledarskapsfilosofi och ge ett exempel på hur du utvecklat en teammedlem.',
          purpose: 'Evaluate leadership approach and team development',
          analysisPoints: ['leadership_style', 'team_development', 'motivation_skills', 'coaching_ability'],
          expectedAnswerLength: 160
        }
      ],
      
      kundservice: [
        {
          id: 'ai_collaboration',
          question: 'I vår kundservice arbetar du tätt med AI-system för att ge bästa möjliga support. Hur känner du inför att samarbeta med AI-teknik i ditt dagliga arbete?',
          purpose: 'Assess AI readiness and technology adoption',
          analysisPoints: ['ai_comfort', 'technology_adoption', 'adaptability', 'learning_mindset'],
          expectedAnswerLength: 130
        }
      ],
      
      chauffor: [
        {
          id: 'driving_experience',
          question: 'Som chaufför hos Nordflytt kör du olika fordonstyper och navigerar i trafiken. Berätta om din körerfarenhet och hur du säkerställer säker och effektiv transport.',
          purpose: 'Evaluate driving competence and safety mindset',
          analysisPoints: ['driving_experience', 'safety_focus', 'navigation_skills', 'responsibility'],
          expectedAnswerLength: 140
        }
      ],
      
      koordinator: [
        {
          id: 'planning_skills',
          question: 'Som koordinator hanterar du multipla projekt och deadlines samtidigt. Beskriv dina strategier för att hålla ordning och säkerställa att inget faller mellan stolarna.',
          purpose: 'Test organizational and multitasking abilities',
          analysisPoints: ['organization', 'multitasking', 'priority_management', 'attention_to_detail'],
          expectedAnswerLength: 150
        }
      ],
      
      kvalitetskontroll: [
        {
          id: 'quality_mindset',
          question: 'Kvalitetskontroll kräver noggrannhet och förmåga att konstruktivt kommunicera förbättringsområden. Ge ett exempel på hur du identifierat och adresserat ett kvalitetsproblem.',
          purpose: 'Assess quality focus and communication skills',
          analysisPoints: ['attention_to_detail', 'quality_mindset', 'constructive_feedback', 'improvement_focus'],
          expectedAnswerLength: 145
        }
      ]
    };

    return positionQuestions[position] || [this.serviceQuestions[1]]; // Default to team collaboration
  }

  private getDocumentGapQuestions(documentAnalysis: DocumentAnalysisResult[]): EmailQuestion[] {
    const gapQuestions: EmailQuestion[] = [];
    
    const cvAnalysis = documentAnalysis.find(doc => doc.type === 'cv');
    const letterAnalysis = documentAnalysis.find(doc => doc.type === 'personal_letter');

    // If CV lacks service experience
    if (cvAnalysis && !cvAnalysis.strengths.some(strength => 
      strength.toLowerCase().includes('service')
    )) {
      gapQuestions.push({
        id: 'service_gap',
        question: 'Vi ser att din bakgrund inte inkluderar traditionell kundservice. Berätta om situationer där du ändå arbetat med människor eller hjälpt andra - det kan vara privat, ideellt eller i andra sammanhang.',
        purpose: 'Explore hidden service experience',
        analysisPoints: ['hidden_service_exp', 'people_skills', 'helping_attitude', 'transferable_skills'],
        expectedAnswerLength: 130
      });
    }

    // If letter shows low enthusiasm
    if (letterAnalysis && letterAnalysis.strengths.some(strength => 
      strength.includes('enthusiasm') && strength.includes('low')
    )) {
      gapQuestions.push({
        id: 'motivation_clarification',
        question: 'Vi vill förstå din motivation bättre. Vad är det specifikt med flyttbranschen och Nordflytt som engagerar dig? Vad hoppas du uppnå i denna roll?',
        purpose: 'Clarify motivation and engagement',
        analysisPoints: ['genuine_motivation', 'career_goals', 'industry_interest', 'long_term_commitment'],
        expectedAnswerLength: 140
      });
    }

    return gapQuestions.slice(0, 1); // Maximum 1 gap question
  }

  private async createConversationRecord(
    applicationId: number,
    questions: EmailQuestion[]
  ): Promise<string> {
    const conversationId = `conv_${applicationId}_${Date.now()}`;
    
    const response = await fetch('/api/recruitment/email-conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        application_id: applicationId,
        conversation_thread: {
          id: conversationId,
          questions: questions,
          currentQuestionIndex: 0,
          responses: [],
          startedAt: new Date().toISOString()
        },
        current_question_set: 1,
        response_scores: {},
        communication_style: {},
        enthusiasm_level: 0,
        service_orientation: 0,
        ai_recruiter_notes: 'Initial email screening started'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create conversation record');
    }

    return conversationId;
  }

  private async sendWelcomeEmail(
    candidate: any,
    firstQuestion: EmailQuestion,
    conversationId: string
  ): Promise<void> {
    const emailContent = this.generateWelcomeEmailContent(candidate, firstQuestion, conversationId);
    
    const response = await fetch('/api/recruitment/emails/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: candidate.email,
        subject: `Nästa steg i din ansökan till Nordflytt - ${candidate.desired_position}`,
        body: emailContent,
        conversationId: conversationId
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send welcome email');
    }
  }

  private generateWelcomeEmailContent(
    candidate: any,
    firstQuestion: EmailQuestion,
    conversationId: string
  ): string {
    return `
Hej ${candidate.first_name}!

Tack för din ansökan till positionen som ${candidate.desired_position} hos Nordflytt. Vi är imponerade av din bakgrund och vill gärna lära känna dig bättre.

Som en del av vår AI-drivna rekryteringsprocess kommer jag att ställa några frågor som hjälper oss förstå din passform för rollen och Nordflytt-kulturen. Detta tar bara några minuter och ger dig möjlighet att visa vem du är bortom CV:t.

## DIN FÖRSTA FRÅGA:

**${firstQuestion.question}**

Svara gärna inom 2-3 arbetsdagar. Det finns inga "rätta" eller "fel" svar - vi vill bara höra din genuina reflektion.

## VAD HÄNDER SEDAN?

Efter att du svarat kommer jag att ställa ytterligare några frågor som anpassas efter din profil. Hela processen tar normalt 5-7 arbetsdagar och avslutas med möjlighet till personlig träff.

Har du frågor är du välkommen att svara på detta mail eller kontakta hr@nordflytt.se.

Vi ser fram emot att höra från dig!

${this.nordflyttBrandVoice.signature}

---
*Detta meddelande skickades av Nordflytts AI-rekryteringssystem. Konversations-ID: ${conversationId}*
    `.trim();
  }

  async handleEmailResponse(
    conversationId: string,
    emailContent: string,
    responseTime: Date
  ): Promise<{
    analysisComplete: boolean;
    nextQuestionSent: boolean;
    overallAssessment?: ConversationAnalysis;
  }> {
    console.log('📧 Processing email response for conversation:', conversationId);

    try {
      // Get conversation record
      const conversation = await this.getConversationRecord(conversationId);
      
      // Analyze the response
      const responseAnalysis = await this.analyzeEmailResponse(
        emailContent,
        conversation.conversation_thread.questions[conversation.conversation_thread.currentQuestionIndex],
        responseTime
      );

      // Store response and analysis
      await this.storeResponseAnalysis(conversationId, responseAnalysis, emailContent);

      // Determine if more questions needed
      const currentIndex = conversation.conversation_thread.currentQuestionIndex;
      const totalQuestions = conversation.conversation_thread.questions.length;

      if (currentIndex + 1 < totalQuestions) {
        // Send next question
        const nextQuestion = conversation.conversation_thread.questions[currentIndex + 1];
        await this.sendFollowUpEmail(conversation.application_id, nextQuestion, conversationId);
        
        return {
          analysisComplete: false,
          nextQuestionSent: true
        };
      } else {
        // All questions answered - generate overall assessment
        const overallAssessment = await this.generateOverallAssessment(conversationId);
        await this.advanceToNextStage(conversation.application_id, overallAssessment);
        
        return {
          analysisComplete: true,
          nextQuestionSent: false,
          overallAssessment: overallAssessment
        };
      }

    } catch (error) {
      console.error('❌ Email response handling failed:', error);
      throw new Error(`Email response handling failed: ${error.message}`);
    }
  }

  private async analyzeEmailResponse(
    emailContent: string,
    question: EmailQuestion,
    responseTime: Date
  ): Promise<any> {
    const analysis = {
      responseLength: emailContent.length,
      responseTime: responseTime,
      analysisPoints: {},
      score: 0
    };

    // Analyze each point the question was designed to assess
    for (const point of question.analysisPoints) {
      analysis.analysisPoints[point] = this.assessAnalysisPoint(emailContent, point);
    }

    // Calculate overall response score
    analysis.score = Object.values(analysis.analysisPoints).reduce((sum: number, score: number) => sum + score, 0) / question.analysisPoints.length;

    return analysis;
  }

  private assessAnalysisPoint(emailContent: string, analysisPoint: string): number {
    const lowerContent = emailContent.toLowerCase();
    
    const pointKeywords: Record<string, string[]> = {
      empathy: ['förstår', 'känner', 'empati', 'understand', 'feel', 'compassion'],
      problem_solving: ['lösning', 'solve', 'åtgärd', 'problem', 'hanterade', 'handled'],
      customer_focus: ['kund', 'customer', 'service', 'hjälpa', 'help', 'support'],
      teamwork: ['team', 'tillsammans', 'samarbete', 'collaboration', 'vi', 'we'],
      communication: ['förklarade', 'explained', 'kommunicerade', 'talked', 'discussed'],
      stress_management: ['lugn', 'calm', 'kontroll', 'control', 'prioriterade', 'organized'],
      leadership_style: ['ledde', 'led', 'vägledde', 'guided', 'motiverade', 'inspired'],
      ai_comfort: ['teknik', 'technology', 'ai', 'system', 'digital', 'automation'],
      genuine_interest: ['fascinerande', 'exciting', 'passion', 'intresserad', 'motivated']
    };

    const keywords = pointKeywords[analysisPoint] || [];
    const keywordMatches = keywords.filter(keyword => lowerContent.includes(keyword)).length;
    
    // Base score from keyword presence
    let score = Math.min(1.0, keywordMatches * 0.2);
    
    // Bonus for detailed responses (shows thought)
    if (emailContent.length > 150) score += 0.2;
    if (emailContent.length > 250) score += 0.1;
    
    // Penalty for very short responses
    if (emailContent.length < 50) score -= 0.3;
    
    return Math.max(0, Math.min(1.0, score));
  }

  private async generateOverallAssessment(conversationId: string): Promise<ConversationAnalysis> {
    const conversation = await this.getConversationRecord(conversationId);
    const responses = conversation.conversation_thread.responses || [];
    
    let totalEnthusiasm = 0;
    let totalServiceOrientation = 0;
    let totalCommunicationClarity = 0;
    let totalGenuineInterest = 0;
    
    const redFlags: string[] = [];
    const positiveIndicators: string[] = [];

    // Analyze all responses
    for (const response of responses) {
      if (response.analysis) {
        // Aggregate scores
        totalEnthusiasm += this.extractScoreForTrait(response.analysis, 'enthusiasm');
        totalServiceOrientation += this.extractScoreForTrait(response.analysis, 'service');
        totalCommunicationClarity += this.extractScoreForTrait(response.analysis, 'communication');
        totalGenuineInterest += this.extractScoreForTrait(response.analysis, 'genuine_interest');
        
        // Identify patterns
        if (response.content.length < 50) {
          redFlags.push('Consistently short responses may indicate low engagement');
        }
        
        if (response.analysis.score > 0.8) {
          positiveIndicators.push(`Excellent response to ${response.questionId}`);
        }
      }
    }

    const responseCount = responses.length || 1;
    
    return {
      enthusiasm: totalEnthusiasm / responseCount,
      serviceOrientation: totalServiceOrientation / responseCount,
      communicationClarity: totalCommunicationClarity / responseCount,
      genuineInterest: totalGenuineInterest / responseCount,
      redFlags,
      positiveIndicators
    };
  }

  private extractScoreForTrait(analysis: any, trait: string): number {
    // Extract trait-specific scores from analysis
    const traitMappings: Record<string, string[]> = {
      enthusiasm: ['genuine_interest', 'motivation'],
      service: ['customer_focus', 'empathy', 'problem_solving'],
      communication: ['communication', 'clarity'],
      genuine_interest: ['genuine_interest', 'company_research']
    };

    const relevantPoints = traitMappings[trait] || [];
    let totalScore = 0;
    let pointCount = 0;

    for (const point of relevantPoints) {
      if (analysis.analysisPoints && analysis.analysisPoints[point] !== undefined) {
        totalScore += analysis.analysisPoints[point];
        pointCount++;
      }
    }

    return pointCount > 0 ? totalScore / pointCount : 0;
  }

  private calculateExpectedDuration(questionCount: number): string {
    const baseDays = 3; // Base time for candidate to think and respond
    const additionalDays = (questionCount - 1) * 1.5; // Additional time per extra question
    const totalDays = Math.ceil(baseDays + additionalDays);
    
    return `${totalDays} arbetsdagar`;
  }

  private async getConversationRecord(conversationId: string): Promise<any> {
    const response = await fetch(`/api/recruitment/email-conversations/${conversationId}`);
    if (!response.ok) {
      throw new Error('Failed to get conversation record');
    }
    return await response.json();
  }

  private async storeResponseAnalysis(
    conversationId: string,
    analysis: any,
    emailContent: string
  ): Promise<void> {
    const response = await fetch(`/api/recruitment/email-conversations/${conversationId}/response`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        response_content: emailContent,
        analysis: analysis,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error('Failed to store response analysis');
    }
  }

  private async sendFollowUpEmail(
    applicationId: number,
    nextQuestion: EmailQuestion,
    conversationId: string
  ): Promise<void> {
    const candidate = await this.getCandidateProfile(applicationId);
    const emailContent = this.generateFollowUpEmailContent(candidate, nextQuestion, conversationId);
    
    const response = await fetch('/api/recruitment/emails/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: candidate.email,
        subject: `Följdfråga från Nordflytt Rekrytering - ${candidate.desired_position}`,
        body: emailContent,
        conversationId: conversationId
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send follow-up email');
    }
  }

  private generateFollowUpEmailContent(
    candidate: any,
    question: EmailQuestion,
    conversationId: string
  ): string {
    return `
Hej igen ${candidate.first_name}!

Tack för ditt genomtänkta svar. Vi uppskattar att du tar dig tid att dela med dig av dina erfarenheter.

## NÄSTA FRÅGA:

**${question.question}**

Som tidigare, svara gärna inom 2-3 arbetsdagar. Vi är nära slutet av vår email-screening och ser fram emot att höra dina tankar.

${this.nordflyttBrandVoice.signature}

---
*Konversations-ID: ${conversationId}*
    `.trim();
  }

  private async advanceToNextStage(
    applicationId: number,
    assessment: ConversationAnalysis
  ): Promise<void> {
    // Calculate if candidate should advance based on assessment
    const averageScore = (
      assessment.enthusiasm +
      assessment.serviceOrientation +
      assessment.communicationClarity +
      assessment.genuineInterest
    ) / 4;

    const shouldAdvance = averageScore >= 0.6 && assessment.redFlags.length < 2;
    const nextStage = shouldAdvance ? 'personality_test' : 'email_screening_failed';

    const response = await fetch(`/api/recruitment/applications/${applicationId}/advance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentStage: 'email_screening',
        nextStage: nextStage,
        assessment: assessment,
        notes: `Email screening completed. Average score: ${averageScore.toFixed(2)}`
      })
    });

    if (!response.ok) {
      throw new Error('Failed to advance application stage');
    }

    // Send appropriate notification to candidate
    if (shouldAdvance) {
      await this.sendAdvancementEmail(applicationId);
    } else {
      await this.sendRejectionEmail(applicationId, assessment);
    }
  }

  private async sendAdvancementEmail(applicationId: number): Promise<void> {
    const candidate = await this.getCandidateProfile(applicationId);
    
    const emailContent = `
Hej ${candidate.first_name}!

Tack för dina genomtänkta svar under vår email-screening. Vi är imponerade av dina svar och vill gärna fortsätta processen.

## NÄSTA STEG: PERSONLIGHETSTEST

Du kommer inom kort att få en länk till vår online-personlighetstest som tar cirka 30 minuter att genomföra. Testet hjälper oss förstå hur du passar in i Nordflytts team och arbetskultur.

Vi återkommer inom 1-2 arbetsdagar med mer information.

${this.nordflyttBrandVoice.signature}
    `.trim();

    await fetch('/api/recruitment/emails/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: candidate.email,
        subject: 'Bra jobbat! Nästa steg i din Nordflytt-ansökan',
        body: emailContent
      })
    });
  }

  private async sendRejectionEmail(
    applicationId: number,
    assessment: ConversationAnalysis
  ): Promise<void> {
    const candidate = await this.getCandidateProfile(applicationId);
    
    const emailContent = `
Hej ${candidate.first_name}!

Tack för din tid och dina genomtänkta svar under vår rekryteringsprocess.

Efter noggrann genomgång har vi beslutat att inte gå vidare med din ansökan just nu. Detta baseras på vår bedömning av passformen mellan din profil och våra aktuella behov.

Vi uppskattar verkligen ditt intresse för Nordflytt och uppmuntrar dig att ansöka igen i framtiden när vi har positioner som bättre matchar din bakgrund.

Lycka till framöver!

${this.nordflyttBrandVoice.signature}
    `.trim();

    await fetch('/api/recruitment/emails/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: candidate.email,
        subject: 'Tack för din ansökan till Nordflytt',
        body: emailContent
      })
    });
  }
}