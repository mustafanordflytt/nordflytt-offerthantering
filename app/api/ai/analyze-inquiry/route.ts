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

    // Check if user has AI permissions (admin, manager, or sales)
    const allowedRoles = ['admin', 'manager', 'sales']
    if (!allowedRoles.includes(authResult.user.role)) {
      return NextResponse.json({ 
        error: 'Insufficient permissions for AI features' 
      }, { status: 403 })
    }

    const body = await request.json()
    const { inquiry, metadata = {} } = body

    if (!inquiry || typeof inquiry !== 'string') {
      return NextResponse.json({ 
        error: 'Valid inquiry text is required' 
      }, { status: 400 })
    }

    // Check AI service availability
    if (!aiService.isReady()) {
      return NextResponse.json({ 
        error: 'AI service is not configured' 
      }, { status: 503 })
    }

    console.log('Analyzing customer inquiry:', inquiry.substring(0, 100) + '...')

    // Analyze the inquiry
    const result = await aiService.analyzeCustomerInquiry(inquiry)

    if (!result.success) {
      return NextResponse.json({ 
        error: 'Analysis failed',
        details: result.error 
      }, { status: 500 })
    }

    // Log AI usage for monitoring
    console.log(`AI analysis completed for user ${authResult.user.id}:`, {
      tokensUsed: result.usage?.totalTokens || 0,
      confidence: result.confidence,
      serviceType: result.result?.serviceType
    })

    // Enhance result with business logic
    const enhancedResult = {
      ...result.result,
      analysisId: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      analyzedAt: new Date().toISOString(),
      analyzedBy: {
        userId: authResult.user.id,
        userName: authResult.user.name
      },
      metadata: {
        ...metadata,
        originalInquiry: inquiry,
        processingTime: Date.now(),
        aiModel: 'gpt-4o-mini'
      }
    }

    return NextResponse.json({
      success: true,
      analysis: enhancedResult,
      confidence: result.confidence,
      usage: result.usage,
      message: 'Inquiry analysis completed successfully'
    })

  } catch (error: any) {
    console.error('AI inquiry analysis error:', error)
    return NextResponse.json({
      error: 'Analysis request failed',
      details: error.message
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Validate authentication
    const authResult = await validateCRMAuth(request)
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get AI service status
    const healthStatus = await aiService.getHealthStatus()

    return NextResponse.json({
      success: true,
      aiService: {
        configured: aiService.isReady(),
        status: healthStatus.status,
        message: healthStatus.message,
        lastCheck: healthStatus.lastCheck
      },
      features: [
        'Customer inquiry analysis',
        'Service type detection', 
        'Volume estimation',
        'Special requirements extraction',
        'Urgency assessment',
        'Price recommendations'
      ],
      supportedLanguages: ['Swedish', 'English'],
      models: ['GPT-4o-mini']
    })

  } catch (error: any) {
    console.error('AI service status error:', error)
    return NextResponse.json({
      error: 'Failed to get AI service status',
      details: error.message
    }, { status: 500 })
  }
}