/**
 * NORDFLYTT MANDATORY VIDEO ANALYSIS
 * AI-powered video interview analysis for service positions
 */

export interface VideoPrompt {
  id: string;
  prompt: string;
  position: string;
  analysisPoints: string[];
  timeLimit: number; // seconds
  instructions: string;
}

export interface VideoAnalysisResult {
  transcript: string;
  facialAnalysis: {
    genuineSmiles: number;
    eyeContact: number;
    facialExpressions: string[];
    confidenceLevel: number;
  };
  voiceAnalysis: {
    tone: string;
    pace: string;
    clarity: number;
    enthusiasm: number;
    steadiness: number;
  };
  contentAnalysis: {
    structuredResponse: number;
    relevantExamples: number;
    serviceOrientation: number;
    problemSolvingApproach: number;
  };
  overallScores: {
    serviceCommuncation: number;
    authenticity: number;
    professionalPresentation: number;
    positionFit: number;
  };
}

export class MandatoryVideoAnalysis {
  private positionPrompts: Record<string, VideoPrompt[]> = {
    flyttpersonal: [
      {
        id: 'physical_teamwork',
        prompt: 'Berätta om en situation där du arbetade i team för att lösa en fysiskt krävande uppgift. Vad var din roll och hur bidrog du till teamets framgång?',
        position: 'flyttpersonal',
        analysisPoints: ['teamwork', 'physical_readiness', 'problem_solving', 'communication'],
        timeLimit: 120,
        instructions: 'Dela en konkret situation från tidigare arbete eller privatliv. Fokusera på samarbete och din egen insats.'
      },
      {
        id: 'customer_conflict',
        prompt: 'En kund är missnöjd med hur ni hanterat deras möbler under flytten. Hur skulle du hantera denna situation?',
        position: 'flyttpersonal',
        analysisPoints: ['customer_service', 'conflict_resolution', 'empathy', 'professionalism'],
        timeLimit: 90,
        instructions: 'Beskriv steg-för-steg hur du skulle hantera situationen. Tänk på både kundens känslor och praktiska lösningar.'
      }
    ],
    
    team_leader: [
      {
        id: 'leadership_pressure',
        prompt: 'Beskriv en situation där du ledde ett team under tidspress eller stress. Vilka strategier använde du för att hålla teamet motiverat och produktivt?',
        position: 'team_leader',
        analysisPoints: ['leadership', 'stress_management', 'motivation_skills', 'decision_making'],
        timeLimit: 150,
        instructions: 'Ge ett konkret exempel. Förklara vilka utmaningar ni stod inför och hur du ledde teamet genom dem.'
      },
      {
        id: 'team_development',
        prompt: 'Hur skulle du coacha en teammedlem som presterar under förväntan? Ge ett exempel på din coachningsfilosofi.',
        position: 'team_leader',
        analysisPoints: ['coaching', 'empathy', 'development_mindset', 'constructive_feedback'],
        timeLimit: 120,
        instructions: 'Beskriv din approach till att utveckla medarbetare. Fokusera på både praktiska metoder och din filosofi.'
      }
    ],
    
    kundservice: [
      {
        id: 'angry_customer_call',
        prompt: 'En kund ringer och är mycket arg över att deras flytt blivit försenad. De hotar att klaga och kräver omedelbar kompensation. Hur hanterar du detta samtal?',
        position: 'kundservice',
        analysisPoints: ['customer_service', 'de_escalation', 'empathy', 'solution_focus'],
        timeLimit: 100,
        instructions: 'Demonstrera hur du skulle hantera samtalet från början till slut. Visa både empati och professionalism.'
      },
      {
        id: 'ai_collaboration',
        prompt: 'Berätta om en gång när du lärt dig använda ny teknologi eller system. Hur känner du inför att arbeta tätt med AI-verktyg i ditt dagliga arbete?',
        position: 'kundservice',
        analysisPoints: ['technology_adoption', 'learning_ability', 'ai_comfort', 'adaptability'],
        timeLimit: 110,
        instructions: 'Dela din inställning till teknologi och lärande. Var specifik om hur du anpassar dig till nya verktyg.'
      }
    ],
    
    chauffor: [
      {
        id: 'difficult_delivery',
        prompt: 'Beskriv en utmanande körning eller leverans du genomfört. Hur säkerställde du säkerhet och punktlighet trots svårigheter?',
        position: 'chauffor',
        analysisPoints: ['safety_focus', 'problem_solving', 'responsibility', 'time_management'],
        timeLimit: 100,
        instructions: 'Ge ett konkret exempel som visar ditt förhållningssätt till säkerhet och ansvar.'
      }
    ],
    
    koordinator: [
      {
        id: 'multiple_priorities',
        prompt: 'Berätta om en dag när du hanterade många olika projekt och deadlines samtidigt. Hur organiserade du ditt arbete och säkerställde att inget föll mellan stolarna?',
        position: 'koordinator',
        analysisPoints: ['organization', 'multitasking', 'priority_management', 'systematic_approach'],
        timeLimit: 120,
        instructions: 'Beskriv dina strategier för planering och uppföljning. Ge konkreta exempel på verktyg eller metoder du använder.'
      }
    ],
    
    kvalitetskontroll: [
      {
        id: 'quality_issue',
        prompt: 'Ge ett exempel på när du identifierat ett kvalitetsproblem och behövt kommunicera förbättringsområden till kollegor. Hur genomförde du detta konstruktivt?',
        position: 'kvalitetskontroll',
        analysisPoints: ['attention_to_detail', 'quality_mindset', 'constructive_feedback', 'diplomacy'],
        timeLimit: 110,
        instructions: 'Fokusera på både din förmåga att upptäcka problem och att kommunicera förbättringar på ett positivt sätt.'
      }
    ]
  };

  async createVideoAssessment(
    applicationId: number,
    positionMatch: any
  ): Promise<{
    assessmentId: string;
    prompts: VideoPrompt[];
    totalTimeEstimate: number;
    instructions: string;
  }> {
    console.log('🎥 Creating video assessment for application:', applicationId);

    const position = positionMatch.position;
    const prompts = this.positionPrompts[position] || this.positionPrompts.flyttpersonal;
    
    // Add common service question for all positions
    const commonServicePrompt: VideoPrompt = {
      id: 'service_philosophy',
      prompt: 'Vad betyder god kundservice för dig? Ge ett exempel på när du gått extra långt för att hjälpa någon.',
      position: 'common',
      analysisPoints: ['service_philosophy', 'empathy', 'dedication', 'genuine_care'],
      timeLimit: 90,
      instructions: 'Dela din syn på service och ett konkret exempel som visar dina värderingar i praktiken.'
    };

    const allPrompts = [...prompts, commonServicePrompt];
    const totalTimeEstimate = allPrompts.reduce((sum, prompt) => sum + prompt.timeLimit, 0);

    const assessmentId = `video_${applicationId}_${Date.now()}`;

    return {
      assessmentId,
      prompts: allPrompts,
      totalTimeEstimate,
      instructions: this.generateVideoInstructions(position, allPrompts.length)
    };
  }

  private generateVideoInstructions(position: string, questionCount: number): string {
    return `
# NORDFLYTT VIDEO INTERVJU

Välkommen till vår AI-drivna videointervju! Detta är en viktig del av vår rekryteringsprocess där vi får möjlighet att lära känna dig bättre.

## TEKNISKA KRAV
- Stabil internetanslutning
- Webbkamera och mikrofon
- Lugn miljö utan bakgrundsbrus
- Dator eller mobil med modern webbläsare

## FÖRBEREDELSER
- Välj en neutral bakgrund
- Säkerställ god belysning på ditt ansikte
- Testa ljud och bild innan du börjar
- Ha ett glas vatten nära till hands

## INTERVJUFORMAT
- ${questionCount} frågor anpassade för positionen: ${position}
- Varje fråga har en egen tidsgräns
- Du kan inte gå tillbaka till tidigare frågor
- Tänketid: 30 sekunder innan inspelning startar

## TIPS FÖR FRAMGÅNG
- Titta in i kameran (inte på skärmen) för ögonkontakt
- Tala tydligt och i normal hastighet
- Använd konkreta exempel från din erfarenhet
- Var dig själv - äkthet värderas högt
- Strukturera dina svar: situation → åtgärd → resultat

## BEDÖMNING
Vår AI analyserar:
- Kommunikationsförmåga och tydlighet
- Genuinhet och autenticitet
- Service-orientering och empati
- Professionell presentation
- Relevans för positionen

## SEKRETESS
- Dina videor behandlas konfidentiellt
- Endast Nordflytts rekryteringsteam har åtkomst
- Videorna raderas efter rekryteringsprocessen

Är du redo att börja? Lycka till!
    `.trim();
  }

  async analyzeVideo(
    videoFile: File,
    prompt: VideoPrompt,
    applicationId: number
  ): Promise<VideoAnalysisResult> {
    console.log('🎥 Analyzing video for prompt:', prompt.id);

    try {
      // Store video file
      const videoPath = await this.storeVideoFile(videoFile, applicationId, prompt.id);

      // Generate transcript (mock implementation)
      const transcript = await this.generateTranscript(videoFile);

      // Perform analysis
      const analysis = await Promise.all([
        this.analyzeFacialExpressions(videoFile),
        this.analyzeVoiceCharacteristics(videoFile, transcript),
        this.analyzeResponseContent(transcript, prompt),
        this.calculateOverallScores(transcript, prompt)
      ]);

      const result: VideoAnalysisResult = {
        transcript,
        facialAnalysis: analysis[0],
        voiceAnalysis: analysis[1],
        contentAnalysis: analysis[2],
        overallScores: analysis[3]
      };

      // Store analysis
      await this.storeVideoAnalysis(applicationId, prompt.id, videoPath, result);

      return result;

    } catch (error) {
      console.error('❌ Video analysis failed:', error);
      throw new Error(`Video analysis failed: ${error.message}`);
    }
  }

  private async storeVideoFile(videoFile: File, applicationId: number, promptId: string): Promise<string> {
    // Mock implementation - in production, upload to cloud storage
    const filename = `video_${applicationId}_${promptId}_${Date.now()}.webm`;
    
    // Simulate upload
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return `/uploads/videos/${filename}`;
  }

  private async generateTranscript(videoFile: File): Promise<string> {
    // Mock transcript generation - in production, use speech-to-text API
    const mockTranscripts = [
      "Ja, hej! Jag skulle vilja berätta om en situation när jag arbetade på mitt förra jobb. Vi hade en kund som var riktigt missnöjd och jag försökte verkligen lyssna på vad de sa och förstå deras perspektiv. Sedan förklarade jag lugnt vad som hade hänt och vad vi kunde göra för att lösa situationen. Till slut blev kunden nöjd och tackade till och med för hjälpen.",
      
      "Teamarbete är superviktigt för mig. Jag kommer ihåg när vi hade ett riktigt tungt lyft på mitt förra jobb och en av mina kollegor såg ut att ha ont i ryggen. Jag föreslog att vi skulle ta en paus och kolla så att alla mådde bra, och sedan hittade vi ett bättre sätt att lyfta tillsammans. Det är viktigt att alla känner sig trygga och att vi hjälps åt.",
      
      "Min syn på kundservice är att man alltid ska sätta kunden först och verkligen lyssna på vad de behöver. Jag minns en gång när en kund ringde precis när vi skulle stänga, men de hade verkligen behövt hjälp så jag stannade kvar för att hjälpa dem. Det kändes så bra att kunna lösa deras problem."
    ];

    return mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
  }

  private async analyzeFacialExpressions(videoFile: File): Promise<VideoAnalysisResult['facialAnalysis']> {
    // Mock facial analysis - in production, use computer vision APIs
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      genuineSmiles: Math.random() * 0.4 + 0.6, // 0.6-1.0
      eyeContact: Math.random() * 0.3 + 0.7, // 0.7-1.0  
      facialExpressions: ['friendly', 'attentive', 'confident'],
      confidenceLevel: Math.random() * 0.3 + 0.7 // 0.7-1.0
    };
  }

  private async analyzeVoiceCharacteristics(videoFile: File, transcript: string): Promise<VideoAnalysisResult['voiceAnalysis']> {
    // Mock voice analysis - in production, use audio analysis APIs
    await new Promise(resolve => setTimeout(resolve, 300));

    const tones = ['professional', 'friendly', 'confident', 'calm'];
    const paces = ['optimal', 'slightly fast', 'measured'];

    return {
      tone: tones[Math.floor(Math.random() * tones.length)],
      pace: paces[Math.floor(Math.random() * paces.length)],
      clarity: Math.random() * 0.2 + 0.8, // 0.8-1.0
      enthusiasm: Math.random() * 0.4 + 0.6, // 0.6-1.0
      steadiness: Math.random() * 0.3 + 0.7 // 0.7-1.0
    };
  }

  private async analyzeResponseContent(transcript: string, prompt: VideoPrompt): Promise<VideoAnalysisResult['contentAnalysis']> {
    const lowerTranscript = transcript.toLowerCase();

    // Analyze structure (intro, body, conclusion)
    const hasStructure = this.hasStructuredResponse(transcript);
    const structuredResponse = hasStructure ? 0.9 : 0.4;

    // Look for concrete examples
    const exampleIndicators = ['när jag', 'en gång', 'jag minns', 'till exempel', 'förra jobbet'];
    const hasExamples = exampleIndicators.some(indicator => lowerTranscript.includes(indicator));
    const relevantExamples = hasExamples ? 0.8 : 0.3;

    // Service orientation keywords
    const serviceKeywords = ['kund', 'hjälpa', 'service', 'lyssna', 'förstå', 'lösa', 'teamwork', 'samarbete'];
    const serviceScore = serviceKeywords.filter(keyword => lowerTranscript.includes(keyword)).length / serviceKeywords.length;
    const serviceOrientation = Math.min(1.0, serviceScore * 1.5);

    // Problem-solving approach
    const problemSolvingKeywords = ['lösning', 'problem', 'strategi', 'planera', 'tänka', 'analyze'];
    const problemSolvingScore = problemSolvingKeywords.filter(keyword => lowerTranscript.includes(keyword)).length / problemSolvingKeywords.length;
    const problemSolvingApproach = Math.min(1.0, problemSolvingScore * 1.2);

    return {
      structuredResponse,
      relevantExamples,
      serviceOrientation,
      problemSolvingApproach
    };
  }

  private hasStructuredResponse(transcript: string): boolean {
    // Check for structured response patterns
    const structureIndicators = [
      'först', 'sedan', 'till slut', 'därefter',
      'situationen var', 'jag gjorde', 'resultatet blev',
      'för det första', 'för det andra'
    ];

    return structureIndicators.some(indicator => 
      transcript.toLowerCase().includes(indicator)
    );
  }

  private async calculateOverallScores(transcript: string, prompt: VideoPrompt): Promise<VideoAnalysisResult['overallScores']> {
    // Calculate composite scores based on analysis points
    const contentAnalysis = await this.analyzeResponseContent(transcript, prompt);
    
    // Service communication (content + structure)
    const serviceCommuncation = (contentAnalysis.serviceOrientation * 0.6) + 
                               (contentAnalysis.structuredResponse * 0.4);

    // Authenticity (examples + genuine expression)
    const authenticity = (contentAnalysis.relevantExamples * 0.7) + 
                        (Math.random() * 0.2 + 0.8) * 0.3; // Mock genuineness score

    // Professional presentation (structure + clarity)
    const professionalPresentation = (contentAnalysis.structuredResponse * 0.5) + 
                                   (Math.random() * 0.3 + 0.7) * 0.5; // Mock presentation score

    // Position fit (based on prompt-specific analysis)
    const positionFit = this.calculatePositionSpecificFit(transcript, prompt);

    return {
      serviceCommuncation: Math.round(serviceCommuncation * 100) / 100,
      authenticity: Math.round(authenticity * 100) / 100,
      professionalPresentation: Math.round(professionalPresentation * 100) / 100,
      positionFit: Math.round(positionFit * 100) / 100
    };
  }

  private calculatePositionSpecificFit(transcript: string, prompt: VideoPrompt): number {
    const lowerTranscript = transcript.toLowerCase();
    let score = 0.5; // Base score

    // Position-specific keyword matching
    const positionKeywords: Record<string, string[]> = {
      flyttpersonal: ['fysisk', 'team', 'tillsammans', 'hjälpa', 'lyfta', 'säker'],
      team_leader: ['leda', 'team', 'motivera', 'coach', 'utveckla', 'ansvar'],
      kundservice: ['kund', 'service', 'lyssna', 'hjälpa', 'lösa', 'telefon'],
      chauffor: ['köra', 'säker', 'tid', 'punktlig', 'ansvar', 'navigation'],
      koordinator: ['planera', 'organisera', 'projekt', 'deadline', 'prioritera'],
      kvalitetskontroll: ['kvalitet', 'noggrann', 'kontroll', 'förbättra', 'standard']
    };

    const keywords = positionKeywords[prompt.position] || [];
    const matchedKeywords = keywords.filter(keyword => lowerTranscript.includes(keyword));
    score += (matchedKeywords.length / keywords.length) * 0.4;

    // Analysis point matching
    for (const point of prompt.analysisPoints) {
      if (this.transcriptMatchesAnalysisPoint(lowerTranscript, point)) {
        score += 0.1;
      }
    }

    return Math.min(1.0, score);
  }

  private transcriptMatchesAnalysisPoint(transcript: string, point: string): boolean {
    const pointKeywords: Record<string, string[]> = {
      teamwork: ['team', 'tillsammans', 'samarbete', 'grupp'],
      customer_service: ['kund', 'service', 'hjälpa', 'bemöta'],
      leadership: ['leda', 'ledare', 'ansvar', 'chef', 'styra'],
      problem_solving: ['problem', 'lösning', 'lösa', 'tänka', 'strategi'],
      empathy: ['förstå', 'känna', 'lyssna', 'empati', 'perspektiv'],
      stress_management: ['stress', 'press', 'lugn', 'hantera', 'kontroll']
    };

    const keywords = pointKeywords[point] || [];
    return keywords.some(keyword => transcript.includes(keyword));
  }

  private async storeVideoAnalysis(
    applicationId: number,
    promptId: string,
    videoPath: string,
    analysis: VideoAnalysisResult
  ): Promise<void> {
    const response = await fetch('/api/recruitment/video-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        application_id: applicationId,
        prompt_id: promptId,
        video_file_path: videoPath,
        transcript: analysis.transcript,
        facial_analysis: analysis.facialAnalysis,
        voice_analysis: analysis.voiceAnalysis,
        content_analysis: analysis.contentAnalysis,
        service_communication_score: analysis.overallScores.serviceCommuncation,
        authenticity_score: analysis.overallScores.authenticity,
        overall_video_score: (
          analysis.overallScores.serviceCommuncation +
          analysis.overallScores.authenticity +
          analysis.overallScores.professionalPresentation +
          analysis.overallScores.positionFit
        ) / 4
      })
    });

    if (!response.ok) {
      throw new Error('Failed to store video analysis');
    }
  }

  async generateVideoSummary(applicationId: number): Promise<{
    averageScores: VideoAnalysisResult['overallScores'];
    strengths: string[];
    concerns: string[];
    recommendation: 'advance' | 'review' | 'reject';
    reasoning: string;
  }> {
    // This would fetch all video analyses for the application
    // and generate a comprehensive summary
    const mockSummary = {
      averageScores: {
        serviceCommuncation: 0.85,
        authenticity: 0.78,
        professionalPresentation: 0.82,
        positionFit: 0.79
      },
      strengths: [
        'Excellent communication skills',
        'Genuine service orientation',
        'Good use of concrete examples',
        'Professional presentation'
      ],
      concerns: [
        'Could improve eye contact',
        'Slightly rushed responses'
      ],
      recommendation: 'advance' as const,
      reasoning: 'Strong overall performance with good service mindset and communication skills. Minor areas for development do not impact core competencies.'
    };

    return mockSummary;
  }
}