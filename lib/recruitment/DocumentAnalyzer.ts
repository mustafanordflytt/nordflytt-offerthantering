/**
 * NORDFLYTT DOCUMENT ANALYZER
 * AI-powered CV and Letter Analysis for Service-Focused Recruitment
 */

import { DocumentAnalysisResult } from './SmartApplicationProcessor';

export interface CVAnalysisDetails {
  workExperience: Array<{
    company: string;
    position: string;
    duration: string;
    responsibilities: string[];
    serviceOriented: boolean;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    year: string;
    relevant: boolean;
  }>;
  skills: Array<{
    skill: string;
    level: string;
    serviceRelevant: boolean;
  }>;
  languages: string[];
  serviceIndicators: string[];
  redFlags: string[];
}

export interface LetterAnalysisDetails {
  motivation: {
    genuine: boolean;
    score: number;
    reasons: string[];
  };
  serviceAttitude: {
    score: number;
    indicators: string[];
  };
  companyKnowledge: {
    score: number;
    details: string[];
  };
  communicationStyle: {
    clarity: number;
    professionalism: number;
    enthusiasm: number;
  };
}

export class DocumentAnalyzer {
  private serviceKeywords = [
    'kundservice', 'customer service', 'service', 'hjälpa', 'support',
    'bemöta', 'möta kunder', 'kundmöte', 'kundkontakt', 'reception',
    'värdskap', 'hospitality', 'omvårdnad', 'omsorg', 'empati',
    'problemlösning', 'konflikthantering', 'teamwork', 'samarbete'
  ];

  private redFlagKeywords = [
    'konflikter', 'uppsagd', 'fired', 'disciplinary', 'problem',
    'stress', 'burnout', 'svårighet', 'negativ', 'klagomål',
    'argument', 'disagreement', 'inte mitt fel', 'others fault'
  ];

  private physicalWorkKeywords = [
    'fysisk', 'lyft', 'bära', 'transport', 'moving', 'construction',
    'byggnads', 'lager', 'warehouse', 'manual', 'hantverk', 'montage',
    'installation', 'reparation', 'underhåll', 'maintenance'
  ];

  async analyzeCV(cvFile: File, applicationId: number): Promise<DocumentAnalysisResult> {
    console.log('📄 Analyzing CV for application:', applicationId);

    try {
      // Extract text from CV file
      const cvText = await this.extractTextFromFile(cvFile);
      
      // Store file and get path
      const filePath = await this.storeDocument(cvFile, applicationId, 'cv');

      // Perform detailed analysis
      const analysis = await this.performCVAnalysis(cvText);

      // Calculate overall score
      const score = this.calculateCVScore(analysis);

      // Store analysis results
      await this.storeDocumentAnalysis(applicationId, 'cv', filePath, analysis, score);

      return {
        type: 'cv',
        score: score,
        strengths: analysis.serviceIndicators,
        redFlags: analysis.redFlags,
        keySkills: analysis.skills.map(s => s.skill),
        experience: analysis.workExperience.map(exp => `${exp.position} at ${exp.company}`),
        education: analysis.education.map(edu => `${edu.degree} - ${edu.institution}`)
      };

    } catch (error) {
      console.error('❌ CV analysis failed:', error);
      throw new Error(`CV analysis failed: ${error.message}`);
    }
  }

  async analyzePersonalLetter(letterFile: File, applicationId: number): Promise<DocumentAnalysisResult> {
    console.log('📝 Analyzing personal letter for application:', applicationId);

    try {
      // Extract text from letter file
      const letterText = await this.extractTextFromFile(letterFile);
      
      // Store file and get path
      const filePath = await this.storeDocument(letterFile, applicationId, 'personal_letter');

      // Perform detailed analysis
      const analysis = await this.performLetterAnalysis(letterText);

      // Calculate overall score
      const score = this.calculateLetterScore(analysis);

      // Store analysis results
      await this.storeDocumentAnalysis(applicationId, 'personal_letter', filePath, analysis, score);

      return {
        type: 'personal_letter',
        score: score,
        strengths: [
          `Motivation: ${analysis.motivation.score}/10`,
          `Service attitude: ${analysis.serviceAttitude.score}/10`,
          `Company knowledge: ${analysis.companyKnowledge.score}/10`
        ],
        redFlags: analysis.motivation.genuine ? [] : ['Potentially generic letter'],
        keySkills: analysis.serviceAttitude.indicators,
        experience: [],
        education: []
      };

    } catch (error) {
      console.error('❌ Letter analysis failed:', error);
      throw new Error(`Letter analysis failed: ${error.message}`);
    }
  }

  private async extractTextFromFile(file: File): Promise<string> {
    // Simulate text extraction from PDF/DOC files
    // In production, use libraries like pdf-parse, mammoth, etc.
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        // This is simplified - in reality you'd parse PDF/DOC content
        const text = e.target?.result as string;
        resolve(text || '');
      };
      reader.readAsText(file);
    });
  }

  private async performCVAnalysis(cvText: string): Promise<CVAnalysisDetails> {
    const lowerText = cvText.toLowerCase();

    // Extract work experience (simplified pattern matching)
    const workExperience = this.extractWorkExperience(cvText);

    // Extract education
    const education = this.extractEducation(cvText);

    // Extract skills
    const skills = this.extractSkills(lowerText);

    // Extract languages
    const languages = this.extractLanguages(lowerText);

    // Identify service indicators
    const serviceIndicators = this.serviceKeywords.filter(keyword => 
      lowerText.includes(keyword.toLowerCase())
    );

    // Identify red flags
    const redFlags = this.redFlagKeywords.filter(keyword => 
      lowerText.includes(keyword.toLowerCase())
    );

    return {
      workExperience,
      education,
      skills,
      languages,
      serviceIndicators,
      redFlags
    };
  }

  private extractWorkExperience(cvText: string): CVAnalysisDetails['workExperience'] {
    // Simplified extraction - in production, use more sophisticated NLP
    const lines = cvText.split('\n');
    const experience: CVAnalysisDetails['workExperience'] = [];

    let currentExp: any = null;
    for (const line of lines) {
      // Look for company patterns
      if (line.match(/\d{4}.*-.*\d{4}/)) {
        if (currentExp) experience.push(currentExp);
        currentExp = {
          company: 'Unknown Company',
          position: 'Unknown Position',
          duration: line.trim(),
          responsibilities: [],
          serviceOriented: false
        };
      } else if (currentExp && line.trim()) {
        currentExp.responsibilities.push(line.trim());
        // Check if service-oriented
        if (this.serviceKeywords.some(keyword => 
          line.toLowerCase().includes(keyword.toLowerCase())
        )) {
          currentExp.serviceOriented = true;
        }
      }
    }

    if (currentExp) experience.push(currentExp);
    return experience;
  }

  private extractEducation(cvText: string): CVAnalysisDetails['education'] {
    // Simplified education extraction
    const lines = cvText.split('\n');
    const education: CVAnalysisDetails['education'] = [];

    for (const line of lines) {
      if (line.toLowerCase().includes('university') || 
          line.toLowerCase().includes('universitet') ||
          line.toLowerCase().includes('högskola')) {
        education.push({
          institution: line.trim(),
          degree: 'Unknown Degree',
          year: 'Unknown Year',
          relevant: line.toLowerCase().includes('business') || 
                   line.toLowerCase().includes('ekonomi') ||
                   line.toLowerCase().includes('service')
        });
      }
    }

    return education;
  }

  private extractSkills(lowerText: string): CVAnalysisDetails['skills'] {
    const skillPatterns = [
      'kundservice', 'customer service', 'communication', 'kommunikation',
      'teamwork', 'samarbete', 'problem solving', 'problemlösning',
      'microsoft office', 'excel', 'word', 'powerpoint',
      'språk', 'languages', 'engelska', 'english'
    ];

    return skillPatterns
      .filter(skill => lowerText.includes(skill))
      .map(skill => ({
        skill: skill,
        level: 'Unknown',
        serviceRelevant: this.serviceKeywords.some(serviceKeyword => 
          skill.includes(serviceKeyword)
        )
      }));
  }

  private extractLanguages(lowerText: string): string[] {
    const languages = ['svenska', 'engelska', 'english', 'french', 'franska', 
                     'spanish', 'spanska', 'german', 'tyska'];
    
    return languages.filter(lang => lowerText.includes(lang));
  }

  private async performLetterAnalysis(letterText: string): Promise<LetterAnalysisDetails> {
    const lowerText = letterText.toLowerCase();

    // Analyze motivation
    const motivation = this.analyzeMotivation(letterText);

    // Analyze service attitude
    const serviceAttitude = this.analyzeServiceAttitude(lowerText);

    // Analyze company knowledge
    const companyKnowledge = this.analyzeCompanyKnowledge(lowerText);

    // Analyze communication style
    const communicationStyle = this.analyzeCommunicationStyle(letterText);

    return {
      motivation,
      serviceAttitude,
      companyKnowledge,
      communicationStyle
    };
  }

  private analyzeMotivation(letterText: string): LetterAnalysisDetails['motivation'] {
    const personalPhrases = [
      'jag har alltid', 'min passion', 'my passion', 'drömmer om',
      'inspirerad av', 'motivated by', 'excited about'
    ];

    const genericPhrases = [
      'dear sir/madam', 'to whom it may concern', 'i am writing to apply',
      'jag skriver för att ansöka', 'interested in the position'
    ];

    const hasPersonal = personalPhrases.some(phrase => 
      letterText.toLowerCase().includes(phrase)
    );

    const hasGeneric = genericPhrases.some(phrase => 
      letterText.toLowerCase().includes(phrase)
    );

    let score = 5; // Base score
    if (hasPersonal) score += 3;
    if (hasGeneric) score -= 2;
    if (letterText.length > 300) score += 1; // Detailed letter
    if (letterText.length < 100) score -= 2; // Too short

    return {
      genuine: hasPersonal && !hasGeneric,
      score: Math.max(0, Math.min(10, score)),
      reasons: hasPersonal ? ['Personal motivation mentioned'] : ['Generic motivation']
    };
  }

  private analyzeServiceAttitude(lowerText: string): LetterAnalysisDetails['serviceAttitude'] {
    const serviceIndicators = this.serviceKeywords.filter(keyword => 
      lowerText.includes(keyword)
    );

    const customerFocusedPhrases = [
      'kundernas behov', 'customer needs', 'help others', 'hjälpa andra',
      'service excellence', 'god service', 'kundnöjdhet', 'customer satisfaction'
    ];

    const hasCustomerFocus = customerFocusedPhrases.some(phrase => 
      lowerText.includes(phrase)
    );

    let score = serviceIndicators.length * 2;
    if (hasCustomerFocus) score += 3;

    return {
      score: Math.min(10, score),
      indicators: serviceIndicators
    };
  }

  private analyzeCompanyKnowledge(lowerText: string): LetterAnalysisDetails['companyKnowledge'] {
    const nordflyttMentions = [
      'nordflytt', 'ai-driven', 'ai-fokuserad', 'innovation', 'teknologi',
      'smart moving', 'intelligent logistics', 'automated'
    ];

    const mentionedConcepts = nordflyttMentions.filter(concept => 
      lowerText.includes(concept)
    );

    return {
      score: Math.min(10, mentionedConcepts.length * 2),
      details: mentionedConcepts
    };
  }

  private analyzeCommunicationStyle(letterText: string): LetterAnalysisDetails['communicationStyle'] {
    const sentences = letterText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = letterText.split(/\s+/).filter(w => w.trim().length > 0);

    // Clarity: shorter sentences are clearer
    const avgSentenceLength = words.length / sentences.length;
    const clarity = Math.max(0, 10 - (avgSentenceLength - 15) / 5);

    // Professionalism: proper grammar, formal tone
    const professionalWords = ['hereby', 'sincerely', 'vänliga hälsningar', 
                              'respectfully', 'professional', 'experience'];
    const professionalCount = professionalWords.filter(word => 
      letterText.toLowerCase().includes(word)
    ).length;
    const professionalism = Math.min(10, professionalCount * 2);

    // Enthusiasm: positive words and energy
    const enthusiasticWords = ['excited', 'passionate', 'eager', 'motivated',
                              'entusiastisk', 'motiverad', 'intresserad'];
    const enthusiasmCount = enthusiasticWords.filter(word => 
      letterText.toLowerCase().includes(word)
    ).length;
    const enthusiasm = Math.min(10, enthusiasmCount * 2.5);

    return {
      clarity: Math.max(0, Math.min(10, clarity)),
      professionalism: Math.max(0, Math.min(10, professionalism)),
      enthusiasm: Math.max(0, Math.min(10, enthusiasm))
    };
  }

  private calculateCVScore(analysis: CVAnalysisDetails): number {
    let score = 0;

    // Work experience (40% of score)
    const serviceExperience = analysis.workExperience.filter(exp => exp.serviceOriented);
    score += (serviceExperience.length / Math.max(1, analysis.workExperience.length)) * 0.4;

    // Service indicators (30% of score)
    score += Math.min(0.3, analysis.serviceIndicators.length * 0.05);

    // Skills relevance (20% of score)
    const serviceSkills = analysis.skills.filter(skill => skill.serviceRelevant);
    score += (serviceSkills.length / Math.max(1, analysis.skills.length)) * 0.2;

    // Red flags penalty (can reduce score by up to 20%)
    score -= Math.min(0.2, analysis.redFlags.length * 0.05);

    // Education bonus (10% of score)
    const relevantEducation = analysis.education.filter(edu => edu.relevant);
    score += (relevantEducation.length / Math.max(1, analysis.education.length)) * 0.1;

    return Math.max(0, Math.min(1, score));
  }

  private calculateLetterScore(analysis: LetterAnalysisDetails): number {
    let score = 0;

    // Motivation (40% of score)
    score += (analysis.motivation.score / 10) * 0.4;

    // Service attitude (30% of score)
    score += (analysis.serviceAttitude.score / 10) * 0.3;

    // Communication style (20% of score)
    const avgCommunication = (
      analysis.communicationStyle.clarity +
      analysis.communicationStyle.professionalism +
      analysis.communicationStyle.enthusiasm
    ) / 3;
    score += (avgCommunication / 10) * 0.2;

    // Company knowledge (10% of score)
    score += (analysis.companyKnowledge.score / 10) * 0.1;

    return Math.max(0, Math.min(1, score));
  }

  private async storeDocument(file: File, applicationId: number, type: string): Promise<string> {
    // In production, upload to cloud storage (AWS S3, etc.)
    const formData = new FormData();
    formData.append('file', file);
    formData.append('applicationId', applicationId.toString());
    formData.append('type', type);

    const response = await fetch('/api/recruitment/documents/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to store document');
    }

    const result = await response.json();
    return result.filePath;
  }

  private async storeDocumentAnalysis(
    applicationId: number,
    documentType: string,
    filePath: string,
    analysis: any,
    score: number
  ): Promise<void> {
    const response = await fetch('/api/recruitment/document-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        application_id: applicationId,
        document_type: documentType,
        file_path: filePath,
        analysis_results: analysis,
        score: score,
        red_flags: documentType === 'cv' ? analysis.redFlags : [],
        strengths: documentType === 'cv' ? analysis.serviceIndicators : analysis.serviceAttitude.indicators
      })
    });

    if (!response.ok) {
      throw new Error('Failed to store document analysis');
    }
  }
}