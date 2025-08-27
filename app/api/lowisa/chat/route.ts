import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { recruitmentML } from '@/lib/ml/recruitment-ml';
import { CandidateMLData } from '@/types/recruitment';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

interface InformationStatus {
  korkort: boolean | string;
  arbetserfarenhet: boolean | string;
  tillganglighet: boolean | string;
  svenska: boolean | string;
  isComplete: boolean;
  completionRate: number;
}

interface ConversationContext {
  candidateName: string;
  position: string;
  informationStatus: InformationStatus;
  conversationHistory: any[];
}

// In-memory storage for demo (use Supabase in production)
const conversationStore: { [key: number]: any } = {};

// Track conversation metrics for ML
const conversationMetrics: { [key: number]: any } = {};

export async function POST(request: Request) {
  try {
    const { candidateId, message, context } = await request.json();
    const { candidateName, position, informationStatus, conversationHistory } = context as ConversationContext;
    
    // Check if OpenAI is configured
    const isOpenAIConfigured = !!process.env.OPENAI_API_KEY;

    // Build conversation history for OpenAI
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `Du är Lowisa, en varm och professionell rekryteringsassistent på Nordflytt. 
        
DIN UPPGIFT:
- Samla in kompletterande information från kandidater på ett vänligt och effektivt sätt
- Fokusera på de 4 kritiska områdena: körkort, arbetserfarenhet, tillgänglighet, svenska
- Ställ MAX 1-2 frågor åt gången för att inte övervälda kandidaten
- Var uppmuntrande och förklara varför informationen behövs

KANDIDATINFORMATION:
- Namn: ${candidateName}
- Sökt position: ${position}

NUVARANDE STATUS:
- Körkort: ${informationStatus.korkort ? '✅ Komplett' : '❌ Behövs'}
- Arbetserfarenhet: ${informationStatus.arbetserfarenhet ? '✅ Komplett' : '❌ Behövs'}
- Tillgänglighet: ${informationStatus.tillganglighet ? '✅ Komplett' : '❌ Behövs'}
- Svenska: ${informationStatus.svenska ? '✅ Komplett' : '❌ Behövs'}

KONVERSATIONSREGLER:
1. Om körkort saknas, fråga: "Har du körkort? Vilken typ? (B, C, CE, annat)"
2. Om arbetserfarenhet saknas, fråga: "Kan du berätta om dina tidigare jobb inom flytt, städ, lager/logistik, restaurang eller bygg?"
3. Om tillgänglighet saknas, fråga: "Vilka dagar och tider kan du jobba? När kan du börja?"
4. Om svenska saknas, fråga: "Hur bekväm är du med svenska i jobbsituationer? (1-5 skala)"

När all information är komplett, avsluta med:
"Tack för dina svar! 😊 Nästa steg i vår rekryteringsprocess är att du fyller i vårt formulär här: https://syn7dh9e02w.typeform.com/to/pUeKubsb"

VIKTIGT: Analysera kandidatens svar och uppdatera informationsstatus automatiskt.`
      }
    ];

    // Add conversation history
    conversationHistory.forEach((msg: any) => {
      messages.push({
        role: msg.sender === 'lowisa' ? 'assistant' : 'user',
        content: msg.content
      });
    });

    // Add current message
    messages.push({
      role: 'user',
      content: message
    });

    // Get AI response
    let aiResponse: string;
    
    if (isOpenAIConfigured) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages,
          temperature: 0.7,
          max_tokens: 500
        });
        aiResponse = completion.choices[0].message.content || '';
      } catch (openAIError) {
        console.log('OpenAI API error, using mock response:', openAIError);
        aiResponse = generateMockResponse(message, informationStatus);
      }
    } else {
      // Use mock response when OpenAI is not configured
      aiResponse = generateMockResponse(message, informationStatus);
    }

    // Analyze response to update information status
    const updatedStatus = analyzeConversation(message, informationStatus);

    // Save conversation to storage
    const messageTimestamp = new Date();
    if (!conversationStore[candidateId]) {
      conversationStore[candidateId] = {
        messages: [],
        informationStatus: updatedStatus
      };
      conversationMetrics[candidateId] = {
        startTime: messageTimestamp,
        lastMessageTime: null,
        totalMessages: 0,
        totalResponseTime: 0,
        totalMessageLength: 0,
        sentimentScores: []
      };
    }

    // Track response time
    const metrics = conversationMetrics[candidateId];
    if (metrics.lastMessageTime) {
      const responseTime = (messageTimestamp.getTime() - metrics.lastMessageTime.getTime()) / 1000; // seconds
      metrics.totalResponseTime += responseTime;
    }
    metrics.lastMessageTime = messageTimestamp;
    metrics.totalMessages += 1;
    metrics.totalMessageLength += message.length;

    // Analyze sentiment
    const sentiment = analyzeSentiment(message);
    metrics.sentimentScores.push(sentiment);

    conversationStore[candidateId].messages.push(
      { sender: 'candidate', content: message, timestamp: messageTimestamp },
      { sender: 'lowisa', content: aiResponse, timestamp: new Date() }
    );
    conversationStore[candidateId].informationStatus = updatedStatus;

    // In production, save to Supabase
    // await saveConversationToDatabase(candidateId, message, aiResponse, updatedStatus);

    // If information is complete, generate ML prediction
    let mlPrediction = null;
    if (updatedStatus.isComplete) {
      try {
        const conversationData = calculateConversationMetrics(candidateId);
        const mlData: CandidateMLData = {
          candidateId,
          applicationId: candidateId, // In production, get from database
          timestamp: new Date(),
          geographicLocation: extractLocation(conversationStore[candidateId].messages),
          yearsOfExperience: extractExperience(message, updatedStatus.arbetserfarenhet),
          skills: {
            technical: extractSkills(updatedStatus.arbetserfarenhet),
            soft: [],
            languages: extractLanguages(updatedStatus.svenska)
          },
          conversationMetrics: conversationData
        };
        
        const prediction = await recruitmentML.predict(mlData);
        mlPrediction = {
          successProbability: prediction.predictions.successProbability,
          recommendedPosition: prediction.predictions.optimalPlacement.position,
          riskFactors: prediction.predictions.riskFactors.length
        };
      } catch (error) {
        console.error('ML prediction error:', error);
      }
    }

    return NextResponse.json({
      response: aiResponse,
      informationStatus: updatedStatus,
      mlPrediction
    });

  } catch (error) {
    console.error('Lowisa chat error:', error);
    
    // Fallback response if OpenAI fails
    // Mock a basic information status if we don't have one
    const fallbackStatus: InformationStatus = {
      korkort: false,
      arbetserfarenhet: false,
      tillganglighet: false,
      svenska: false,
      isComplete: false,
      completionRate: 0
    };
    
    return NextResponse.json({
      response: 'Ursäkta, jag hade ett tekniskt problem. Kan du upprepa ditt svar?',
      informationStatus: fallbackStatus,
      mlPrediction: null
    });
  }
}

function analyzeConversation(message: string, currentStatus: InformationStatus): InformationStatus {
  const updatedStatus = { ...currentStatus };
  const lowerMessage = message.toLowerCase();

  // Check for driving license information
  if (!updatedStatus.korkort && (
    lowerMessage.includes('körkort') ||
    lowerMessage.includes('b-kort') ||
    lowerMessage.includes('c-kort') ||
    lowerMessage.includes('ce-kort') ||
    lowerMessage.match(/\b[bcd]e?\b/i)
  )) {
    // Extract license type
    const licenseMatch = lowerMessage.match(/\b([bcd]e?)\b/i);
    if (licenseMatch) {
      updatedStatus.korkort = licenseMatch[1].toUpperCase();
    } else if (lowerMessage.includes('ja')) {
      updatedStatus.korkort = 'B'; // Default to B if just "yes"
    } else if (lowerMessage.includes('nej') || lowerMessage.includes('inte')) {
      updatedStatus.korkort = 'Inget';
    }
  }

  // Check for work experience
  if (!updatedStatus.arbetserfarenhet && (
    lowerMessage.includes('jobb') ||
    lowerMessage.includes('arbeta') ||
    lowerMessage.includes('flytt') ||
    lowerMessage.includes('städ') ||
    lowerMessage.includes('lager') ||
    lowerMessage.includes('restaurang') ||
    lowerMessage.includes('bygg') ||
    lowerMessage.includes('år') ||
    lowerMessage.includes('månad')
  )) {
    updatedStatus.arbetserfarenhet = message.substring(0, 200); // Store summary
  }

  // Check for availability
  if (!updatedStatus.tillganglighet && (
    lowerMessage.includes('måndag') ||
    lowerMessage.includes('tisdag') ||
    lowerMessage.includes('onsdag') ||
    lowerMessage.includes('torsdag') ||
    lowerMessage.includes('fredag') ||
    lowerMessage.includes('helg') ||
    lowerMessage.includes('kan börja') ||
    lowerMessage.includes('tillgänglig') ||
    lowerMessage.includes('dagar') ||
    lowerMessage.includes('tider') ||
    lowerMessage.includes('pass')
  )) {
    updatedStatus.tillganglighet = message.substring(0, 200); // Store summary
  }

  // Check for Swedish language skills
  if (!updatedStatus.svenska && (
    lowerMessage.match(/\b[1-5]\b/) ||
    lowerMessage.includes('flytande') ||
    lowerMessage.includes('bra') ||
    lowerMessage.includes('grundläggande') ||
    lowerMessage.includes('svenska') ||
    lowerMessage.includes('språk')
  )) {
    const levelMatch = lowerMessage.match(/\b([1-5])\b/);
    if (levelMatch) {
      updatedStatus.svenska = `Nivå ${levelMatch[1]}/5`;
    } else if (lowerMessage.includes('flytande')) {
      updatedStatus.svenska = 'Nivå 5/5 - Flytande';
    } else if (lowerMessage.includes('mycket bra')) {
      updatedStatus.svenska = 'Nivå 4/5 - Mycket bra';
    } else if (lowerMessage.includes('bra')) {
      updatedStatus.svenska = 'Nivå 3/5 - Bra';
    } else if (lowerMessage.includes('grundläggande')) {
      updatedStatus.svenska = 'Nivå 2/5 - Grundläggande';
    }
  }

  // Calculate completion
  const fields = ['korkort', 'arbetserfarenhet', 'tillganglighet', 'svenska'];
  const completedFields = fields.filter(field => updatedStatus[field as keyof InformationStatus]);
  updatedStatus.completionRate = (completedFields.length / fields.length) * 100;
  updatedStatus.isComplete = completedFields.length === fields.length;

  return updatedStatus;
}

// Helper functions for ML integration
function analyzeSentiment(message: string): number {
  const positiveWords = ['bra', 'gärna', 'ja', 'absolut', 'perfekt', 'utmärkt', 'glad', 'intresserad'];
  const negativeWords = ['nej', 'inte', 'problem', 'svårt', 'osäker', 'kanske'];
  
  const lowerMessage = message.toLowerCase();
  let score = 0;
  
  positiveWords.forEach(word => {
    if (lowerMessage.includes(word)) score += 0.2;
  });
  
  negativeWords.forEach(word => {
    if (lowerMessage.includes(word)) score -= 0.2;
  });
  
  return Math.max(-1, Math.min(1, score));
}

function calculateConversationMetrics(candidateId: number) {
  const metrics = conversationMetrics[candidateId];
  if (!metrics) return getDefaultMetrics();
  
  const avgResponseTime = metrics.totalMessages > 0 
    ? metrics.totalResponseTime / metrics.totalMessages 
    : 30;
    
  const avgMessageLength = metrics.totalMessages > 0
    ? metrics.totalMessageLength / metrics.totalMessages
    : 50;
    
  const avgSentiment = metrics.sentimentScores.length > 0
    ? metrics.sentimentScores.reduce((a: number, b: number) => a + b, 0) / metrics.sentimentScores.length
    : 0.5;
  
  // Calculate engagement based on response speed and message length
  const engagementLevel = calculateEngagement(avgResponseTime, avgMessageLength);
  
  return {
    responseTime: avgResponseTime,
    messageLength: avgMessageLength,
    sentimentScore: avgSentiment,
    engagementLevel,
    clarityScore: 0.8, // Could analyze grammar/spelling
    professionalismScore: 0.85 // Could analyze tone
  };
}

function getDefaultMetrics() {
  return {
    responseTime: 30,
    messageLength: 50,
    sentimentScore: 0.5,
    engagementLevel: 0.7,
    clarityScore: 0.8,
    professionalismScore: 0.85
  };
}

function calculateEngagement(responseTime: number, messageLength: number): number {
  // Faster responses and longer messages indicate higher engagement
  const responseScore = Math.max(0, 1 - (responseTime / 120)); // Normalize to 0-1
  const lengthScore = Math.min(1, messageLength / 100); // Normalize to 0-1
  
  return (responseScore + lengthScore) / 2;
}

function extractLocation(messages: any[]): string {
  const locations = ['Stockholm', 'Göteborg', 'Malmö', 'Uppsala', 'Linköping'];
  
  for (const msg of messages) {
    const content = msg.content.toLowerCase();
    for (const location of locations) {
      if (content.includes(location.toLowerCase())) {
        return location;
      }
    }
  }
  
  return 'Stockholm'; // Default
}

function extractExperience(message: string, experienceText: string | boolean): number {
  if (typeof experienceText !== 'string') return 0;
  
  const yearMatches = experienceText.match(/(\d+)\s*(år|years?)/gi);
  if (yearMatches) {
    const years = parseInt(yearMatches[0]);
    return isNaN(years) ? 0 : years;
  }
  
  const monthMatches = experienceText.match(/(\d+)\s*(månad|months?)/gi);
  if (monthMatches) {
    const months = parseInt(monthMatches[0]);
    return isNaN(months) ? 0 : months / 12;
  }
  
  return 0;
}

function extractSkills(experienceText: string | boolean): string[] {
  if (typeof experienceText !== 'string') return [];
  
  const skills: string[] = [];
  const skillKeywords = [
    { keyword: 'flytt', skill: 'flytt' },
    { keyword: 'städ', skill: 'städning' },
    { keyword: 'lager', skill: 'lagerarbete' },
    { keyword: 'logistik', skill: 'logistik' },
    { keyword: 'restaurang', skill: 'restaurangarbete' },
    { keyword: 'bygg', skill: 'byggarbete' },
    { keyword: 'truck', skill: 'truckkörning' },
    { keyword: 'pack', skill: 'packning' }
  ];
  
  const lowerText = experienceText.toLowerCase();
  skillKeywords.forEach(({ keyword, skill }) => {
    if (lowerText.includes(keyword)) {
      skills.push(skill);
    }
  });
  
  return skills;
}

function extractLanguages(svenskaText: string | boolean): any[] {
  const languages = [];
  
  if (typeof svenskaText === 'string') {
    const levelMatch = svenskaText.match(/(\d)/);
    const level = levelMatch ? parseInt(levelMatch[1]) : 3;
    
    let proficiency: 'native' | 'fluent' | 'conversational' | 'basic' = 'conversational';
    if (level >= 5) proficiency = 'fluent';
    else if (level >= 4) proficiency = 'conversational';
    else if (level >= 2) proficiency = 'basic';
    
    languages.push({
      language: 'svenska',
      proficiency
    });
  }
  
  return languages;
}

// Generate mock response based on missing information
function generateMockResponse(message: string, status: InformationStatus): string {
  // Check what information we're missing
  if (!status.korkort) {
    return "Hej! Tack för ditt intresse för tjänsten. För att kunna matcha dig med rätt uppdrag behöver jag veta - har du körkort? Om ja, vilken typ (B, C, CE)?";
  }
  
  if (!status.arbetserfarenhet) {
    return "Utmärkt! Kan du berätta lite om din tidigare arbetserfarenhet? Har du jobbat inom flytt, städ, lager/logistik, restaurang eller bygg tidigare?";
  }
  
  if (!status.tillganglighet) {
    return "Tack för informationen! När skulle du kunna börja jobba och vilka dagar/tider passar dig bäst?";
  }
  
  if (!status.svenska) {
    return "Nästan klart! Hur bekväm känner du dig med svenska i jobbsituationer? Vänligen betygsätt från 1-5 där 5 är flytande.";
  }
  
  // All information collected
  return "Tack för dina svar! 😊 Nästa steg i vår rekryteringsprocess är att du fyller i vårt formulär här: https://syn7dh9e02w.typeform.com/to/pUeKubsb";
}

// Get conversation history
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const candidateId = searchParams.get('candidateId');

  if (!candidateId) {
    return NextResponse.json({ error: 'Candidate ID required' }, { status: 400 });
  }

  const conversation = conversationStore[parseInt(candidateId)] || {
    messages: [],
    informationStatus: {
      korkort: false,
      arbetserfarenhet: false,
      tillganglighet: false,
      svenska: false,
      isComplete: false,
      completionRate: 0
    }
  };

  return NextResponse.json(conversation);
}