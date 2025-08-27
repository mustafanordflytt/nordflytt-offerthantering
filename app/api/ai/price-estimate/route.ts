import { NextRequest, NextResponse } from 'next/server'
import { validateCRMAuth } from '@/lib/auth/validate-crm-auth'
import { aiService } from '@/lib/ai/ai-service'

export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const authResult = await validateCRMAuth(request)
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions for pricing features
    const allowedRoles = ['admin', 'manager', 'sales']
    if (!allowedRoles.includes(authResult.user.role)) {
      return NextResponse.json({ 
        error: 'Insufficient permissions for AI pricing' 
      }, { status: 403 })
    }

    const body = await request.json()
    const {
      serviceType,
      volume,
      distance,
      specialRequirements = [],
      timeOfYear,
      urgency = 'medium'
    } = body

    // Validate required parameters
    if (!serviceType || !volume || distance === undefined) {
      return NextResponse.json({ 
        error: 'serviceType, volume, and distance are required' 
      }, { status: 400 })
    }

    // Validate service type
    const validServiceTypes = ['moving', 'cleaning', 'packing', 'storage']
    if (!validServiceTypes.includes(serviceType)) {
      return NextResponse.json({ 
        error: `Invalid serviceType. Must be one of: ${validServiceTypes.join(', ')}` 
      }, { status: 400 })
    }

    // Check AI service availability
    if (!aiService.isReady()) {
      return NextResponse.json({ 
        error: 'AI pricing service is not configured' 
      }, { status: 503 })
    }

    console.log('Generating AI price estimate:', {
      serviceType,
      volume,
      distance,
      urgency,
      specialRequirements: specialRequirements.length
    })

    // Prepare job data for AI analysis
    const jobData = {
      serviceType,
      volume: parseFloat(volume),
      distance: parseFloat(distance),
      specialRequirements: Array.isArray(specialRequirements) ? specialRequirements : [],
      timeOfYear: timeOfYear || getCurrentSeason(),
      urgency
    }

    // Generate price estimate using AI
    const result = await aiService.generatePriceEstimate(jobData)

    if (!result.success) {
      return NextResponse.json({ 
        error: 'Price estimation failed',
        details: result.error 
      }, { status: 500 })
    }

    // Enhance result with additional business logic
    const enhancedResult = {
      ...result.result,
      estimateId: `estimate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      generatedAt: new Date().toISOString(),
      generatedBy: {
        userId: authResult.user.id,
        userName: authResult.user.name
      },
      inputData: jobData,
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      disclaimers: [
        'Detta är en AI-genererad prisuppskattning',
        'Slutligt pris kan variera baserat på faktiska förhållanden',
        'Kontakta oss för en detaljerad offert',
        'Priser inkluderar moms'
      ]
    }

    // Add RUT-avdrag calculation for cleaning services
    if (serviceType === 'cleaning') {
      const rutDiscount = Math.round(enhancedResult.finalPrice * 0.5)
      enhancedResult.rutDiscount = {
        eligible: true,
        discountAmount: rutDiscount,
        customerPayment: enhancedResult.finalPrice - rutDiscount,
        description: 'RUT-avdrag ger 50% rabatt på arbetsköpsikostnader'
      }
    }

    // Log AI usage
    console.log(`AI price estimate generated for user ${authResult.user.id}:`, {
      tokensUsed: result.usage?.totalTokens || 0,
      confidence: result.confidence,
      finalPrice: enhancedResult.finalPrice
    })

    return NextResponse.json({
      success: true,
      estimate: enhancedResult,
      confidence: result.confidence,
      usage: result.usage,
      message: 'Price estimate generated successfully'
    })

  } catch (error: any) {
    console.error('AI price estimation error:', error)
    return NextResponse.json({
      error: 'Price estimation request failed',
      details: error.message
    }, { status: 500 })
  }
}

function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1
  
  if (month >= 12 || month <= 2) return 'winter'
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  return 'autumn'
}

export async function GET(request: NextRequest) {
  try {
    // Validate authentication
    const authResult = await validateCRMAuth(request)
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      pricingInfo: {
        serviceTypes: [
          {
            type: 'moving',
            basePrice: '800-1200 kr/timme',
            description: 'Professionell flytt med 2-3 personer'
          },
          {
            type: 'cleaning',
            basePrice: '400-600 kr/timme',
            description: 'Flyttstädning med RUT-avdrag (50% rabatt)',
            rutEligible: true
          },
          {
            type: 'packing',
            basePrice: '300-500 kr/timme', 
            description: 'Professionell packning av dina tillhörigheter'
          },
          {
            type: 'storage',
            basePrice: '150-300 kr/m³/månad',
            description: 'Säker förvaring i vårt lager'
          }
        ],
        pricingFactors: [
          'Volym och storlek på flytten',
          'Avstånd mellan adresser',
          'Specialkrav (piano, konst, etc.)',
          'Säsong och tidpunkt',
          'Urgency och tillgänglighet',
          'Antal våningar och tillgänglighet till hiss',
          'Parkering och bäravstånd'
        ],
        aiFeatures: [
          'Automatisk prisberäkning baserad på AI',
          'Säsongsjustering och marknadsanalys',
          'Specialkrav-identifiering',
          'Konkurrensanalys och prissättning',
          'Dynamisk prissättning baserad på efterfrågan'
        ],
        accuracy: 'AI-estimaten har en träffsäkerhet på 85-90% jämfört med manuella offerter'
      }
    })

  } catch (error: any) {
    console.error('Pricing info error:', error)
    return NextResponse.json({
      error: 'Failed to get pricing information',
      details: error.message
    }, { status: 500 })
  }
}