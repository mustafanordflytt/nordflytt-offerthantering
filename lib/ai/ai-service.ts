import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export interface AIAnalysisResult {
  success: boolean
  result?: any
  confidence?: number
  error?: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export class AIService {
  private static instance: AIService
  private isConfigured: boolean

  constructor() {
    this.isConfigured = !!process.env.OPENAI_API_KEY
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService()
    }
    return AIService.instance
  }

  /**
   * Analyze customer inquiry to determine service type and requirements
   */
  async analyzeCustomerInquiry(inquiry: string): Promise<AIAnalysisResult> {
    if (!this.isConfigured) {
      return { success: false, error: 'AI service not configured' }
    }

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Du är en AI-assistent för Nordflytt, ett flyttföretag i Stockholm. 
            Analysera kundens förfrågan och identifiera:
            1. Typ av tjänst (moving/cleaning/packing/storage)
            2. Uppskattad volym (i m³)
            3. Speciella krav
            4. Urgency level (low/medium/high)
            5. Rekommenderad prissättning (ungefärlig)
            
            Svara ENDAST i JSON-format med följande struktur:
            {
              "serviceType": "moving|cleaning|packing|storage",
              "estimatedVolume": number,
              "specialRequirements": ["req1", "req2"],
              "urgency": "low|medium|high",
              "recommendedPrice": number,
              "confidence": number,
              "summary": "kort sammanfattning"
            }`
          },
          {
            role: 'user',
            content: inquiry
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response content')
      }

      const result = JSON.parse(content)
      
      return {
        success: true,
        result,
        confidence: result.confidence || 0.8,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0
        }
      }

    } catch (error: any) {
      console.error('AI analysis error:', error)
      return {
        success: false,
        error: error.message || 'Analysis failed'
      }
    }
  }

  /**
   * Generate price estimate based on job parameters
   */
  async generatePriceEstimate(jobData: {
    serviceType: string
    volume: number
    distance: number
    specialRequirements: string[]
    timeOfYear: string
    urgency: string
  }): Promise<AIAnalysisResult> {
    if (!this.isConfigured) {
      return { success: false, error: 'AI service not configured' }
    }

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Du är en AI-prissättningsexpert för Nordflytt. 
            Baserat på följande faktorer, beräkna en rättvis prisuppskattning:
            
            Grundpriser (SEK):
            - Flytt: 800-1200 kr/timme (2-3 personer)
            - Städning: 400-600 kr/timme
            - Packning: 300-500 kr/timme
            - Förvaring: 150-300 kr/m³/månad
            
            Faktorer som påverkar pris:
            - Volym (större = mer effektivt per m³)
            - Avstånd (över 50km = extra avgift)
            - Specialkrav (+10-50% markup)
            - Säsong (sommar = +20%, vinter = -10%)
            - Urgency (hög = +30%)
            
            Svara i JSON-format:
            {
              "basePrice": number,
              "adjustments": [{"factor": "string", "amount": number, "percentage": number}],
              "finalPrice": number,
              "confidence": number,
              "breakdown": "detaljerad förklaring"
            }`
          },
          {
            role: 'user',
            content: JSON.stringify(jobData)
          }
        ],
        temperature: 0.2,
        max_tokens: 600
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response content')
      }

      const result = JSON.parse(content)
      
      return {
        success: true,
        result,
        confidence: result.confidence || 0.85,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0
        }
      }

    } catch (error: any) {
      console.error('Price estimation error:', error)
      return {
        success: false,
        error: error.message || 'Price estimation failed'
      }
    }
  }

  /**
   * Optimize team assignment based on job requirements and staff availability
   */
  async optimizeTeamAssignment(jobData: any, availableStaff: any[]): Promise<AIAnalysisResult> {
    if (!this.isConfigured) {
      return { success: false, error: 'AI service not configured' }
    }

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Du är en AI-schemaläggningsexpert för Nordflytt. 
            Analysera jobbet och tillgänglig personal för att föreslå den optimala teamsammansättningen.
            
            Beakta:
            - Personalens specialistkunskaper
            - Arbetsbörda och tillgänglighet
            - Geografisk närhet
            - Teamkemi och tidigare resultat
            - Joblets komplexitet och krav
            
            Svara i JSON-format:
            {
              "recommendedTeam": [
                {
                  "staffId": "string",
                  "name": "string", 
                  "role": "team_leader|member",
                  "reason": "varför denna person är vald"
                }
              ],
              "alternativeTeams": [samma struktur],
              "estimatedDuration": number,
              "confidence": number,
              "reasoning": "detaljerad motivering"
            }`
          },
          {
            role: 'user',
            content: JSON.stringify({ job: jobData, staff: availableStaff })
          }
        ],
        temperature: 0.3,
        max_tokens: 800
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response content')
      }

      const result = JSON.parse(content)
      
      return {
        success: true,
        result,
        confidence: result.confidence || 0.75,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0
        }
      }

    } catch (error: any) {
      console.error('Team optimization error:', error)
      return {
        success: false,
        error: error.message || 'Team optimization failed'
      }
    }
  }

  /**
   * Generate customer service response suggestions
   */
  async generateCustomerResponse(inquiry: string, context?: any): Promise<AIAnalysisResult> {
    if (!this.isConfigured) {
      return { success: false, error: 'AI service not configured' }
    }

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Du är en professionell kundtjänstrepresentant för Nordflytt. 
            Svara på svenska med en vänlig, professionell ton. 
            Ge konkreta lösningar och följ upp med nästa steg.
            
            Företagsinformation:
            - Nordflytt - flyttfirma i Stockholm
            - Tjänster: Flytt, städning, packning, förvaring
            - Arbetstid: Mån-Fre 08:00-17:00, Lör 09:00-15:00
            - Gratis offert inom 24h
            - RUT-avdrag på städning (50% rabatt)
            
            Svara i JSON-format:
            {
              "response": "fullständigt svar till kunden",
              "tone": "professional|friendly|urgent",
              "nextSteps": ["steg 1", "steg 2"],
              "priority": "low|medium|high",
              "category": "inquiry|complaint|booking|other"
            }`
          },
          {
            role: 'user',
            content: `Kundens fråga: ${inquiry}${context ? `\n\nKontext: ${JSON.stringify(context)}` : ''}`
          }
        ],
        temperature: 0.4,
        max_tokens: 600
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response content')
      }

      const result = JSON.parse(content)
      
      return {
        success: true,
        result,
        confidence: 0.9,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0
        }
      }

    } catch (error: any) {
      console.error('Customer response generation error:', error)
      return {
        success: false,
        error: error.message || 'Response generation failed'
      }
    }
  }

  /**
   * Analyze job completion quality and generate insights
   */
  async analyzeJobQuality(jobData: {
    duration: number
    estimatedDuration: number
    customerRating?: number
    customerFeedback?: string
    teamPerformance: any
    photosCount: number
    issuesReported: string[]
  }): Promise<AIAnalysisResult> {
    if (!this.isConfigured) {
      return { success: false, error: 'AI service not configured' }
    }

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Du är en AI-kvalitetsanalyst för Nordflytt. 
            Analysera jobbutförandet och ge konstruktiv feedback.
            
            Bedömningskriterier:
            - Tidseffektivitet (faktisk vs estimerad tid)
            - Kundnöjdhet (betyg och kommentarer)
            - Teamprestation
            - Dokumentation (foton)
            - Problem och lösningar
            
            Svara i JSON-format:
            {
              "overallScore": number, // 1-10
              "timeEfficiency": number, // 1-10
              "customerSatisfaction": number, // 1-10
              "teamPerformance": number, // 1-10
              "documentation": number, // 1-10
              "strengths": ["styrka 1", "styrka 2"],
              "areasForImprovement": ["förbättringsområde 1"],
              "recommendations": ["rekommendation 1"],
              "insights": "djupare analys och lärdomar"
            }`
          },
          {
            role: 'user',
            content: JSON.stringify(jobData)
          }
        ],
        temperature: 0.2,
        max_tokens: 700
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response content')
      }

      const result = JSON.parse(content)
      
      return {
        success: true,
        result,
        confidence: 0.85,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0
        }
      }

    } catch (error: any) {
      console.error('Job quality analysis error:', error)
      return {
        success: false,
        error: error.message || 'Quality analysis failed'
      }
    }
  }

  /**
   * Check if AI service is properly configured
   */
  isReady(): boolean {
    return this.isConfigured
  }

  /**
   * Get AI service health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    message: string
    lastCheck: string
  }> {
    if (!this.isConfigured) {
      return {
        status: 'unhealthy',
        message: 'OpenAI API key not configured',
        lastCheck: new Date().toISOString()
      }
    }

    try {
      // Simple test call
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 1
      })

      return {
        status: 'healthy',
        message: 'AI service operational',
        lastCheck: new Date().toISOString()
      }

    } catch (error: any) {
      return {
        status: 'unhealthy',
        message: error.message || 'AI service unavailable',
        lastCheck: new Date().toISOString()
      }
    }
  }
}

export const aiService = AIService.getInstance()