import { NextRequest, NextResponse } from 'next/server'
import { ReferralAttributionEngine } from '@/lib/partners/ReferralAttributionEngine'

// GET /api/referrals - Fetch all referrals
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const partnerId = searchParams.get('partnerId')
    const timeframe = searchParams.get('timeframe')
    const limit = searchParams.get('limit')
    
    console.log('📋 Fetching referrals with filters:', { status, partnerId, timeframe, limit })
    
    // Mock data - in real implementation, fetch from Supabase
    const mockReferrals = [
      {
        id: 1,
        referralCode: 'MÄK001REF',
        partnerName: 'Svensk Fastighetsförmedling Stockholm',
        partnerCategory: 'mäklare',
        partnerTier: 'gold',
        agentName: 'Anna Carlsson',
        customerName: 'Gustav Andersson',
        customerEmail: 'gustav.andersson@email.com',
        customerPhone: '+46 70 123 45 67',
        moveFrom: 'Södermalm, Stockholm',
        moveTo: 'Östermalm, Stockholm',
        moveDate: new Date('2025-02-15'),
        moveType: 'residential',
        referralSource: 'website',
        referralDate: new Date('2025-01-15'),
        firstContactDate: new Date('2025-01-15'),
        quoteSentDate: new Date('2025-01-16'),
        quoteAmount: 8500,
        estimatedValue: 8500,
        servicesIncluded: ['Flytthjälp', 'Emballage', 'Städning'],
        conversionStatus: 'quoted',
        kickbackAmount: 850,
        kickbackCalculated: true,
        paymentStatus: 'calculated',
        aiConversionProbability: 0.85,
        qualityScore: 8,
        followUpRequired: true,
        nextFollowUpDate: new Date('2025-01-18'),
        urgencyLevel: 'medium',
        tags: ['Privatflyttning', 'Stockholm']
      },
      {
        id: 2,
        referralCode: 'MÄK002REF',
        partnerName: 'Svensk Fastighetsförmedling Stockholm',
        partnerCategory: 'mäklare',
        partnerTier: 'gold',
        agentName: 'Anna Carlsson',
        customerName: 'Sarah Johnson',
        customerEmail: 'sarah.johnson@email.com',
        customerPhone: '+46 70 234 56 78',
        moveFrom: 'Gamla Stan, Stockholm',
        moveTo: 'Vasastan, Stockholm',
        moveDate: new Date('2025-02-28'),
        moveType: 'residential',
        referralSource: 'phone',
        referralDate: new Date('2025-01-12'),
        firstContactDate: new Date('2025-01-12'),
        quoteSentDate: new Date('2025-01-13'),
        quoteAmount: 12000,
        estimatedValue: 12000,
        actualValue: 12000,
        servicesIncluded: ['Flytthjälp', 'Emballage', 'Städning', 'Montering'],
        conversionStatus: 'converted',
        conversionDate: new Date('2025-01-14'),
        kickbackAmount: 1200,
        kickbackCalculated: true,
        paymentStatus: 'paid',
        paymentDate: new Date('2025-01-15'),
        customerSatisfaction: 5,
        customerFeedback: 'Fantastisk service, mycket nöjd!',
        aiConversionProbability: 0.92,
        qualityScore: 9,
        followUpRequired: false,
        urgencyLevel: 'high',
        tags: ['Privatflyttning', 'Stockholm', 'Konverterad']
      },
      {
        id: 3,
        referralCode: 'BEG001REF',
        partnerName: 'Fonus Stockholm',
        partnerCategory: 'begravningsbyråer',
        partnerTier: 'platinum',
        agentName: 'Maria Lindqvist',
        customerName: 'Familjen Svensson',
        customerEmail: 'erik.svensson@email.com',
        customerPhone: '+46 70 345 67 89',
        moveFrom: 'Bromma, Stockholm',
        moveTo: 'Dödsbo clearing',
        moveDate: new Date('2025-02-10'),
        moveType: 'dödsbo',
        referralSource: 'in_person',
        referralDate: new Date('2025-01-10'),
        firstContactDate: new Date('2025-01-11'),
        estimatedValue: 18000,
        servicesIncluded: ['Dödsbo tömning', 'Städning', 'Värdering'],
        conversionStatus: 'contacted',
        kickbackAmount: 2160,
        kickbackCalculated: false,
        paymentStatus: 'pending',
        aiConversionProbability: 0.78,
        qualityScore: 7,
        followUpRequired: true,
        nextFollowUpDate: new Date('2025-01-17'),
        urgencyLevel: 'high',
        tags: ['Dödsbo', 'Känslig', 'Stockholm']
      }
    ]
    
    // Apply filters
    let filteredReferrals = mockReferrals
    
    if (status && status !== 'all') {
      filteredReferrals = filteredReferrals.filter(r => r.conversionStatus === status)
    }
    
    if (partnerId && partnerId !== 'all') {
      filteredReferrals = filteredReferrals.filter(r => r.partnerName === partnerId)
    }
    
    if (timeframe && timeframe !== 'all') {
      const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 0
      if (days > 0) {
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        filteredReferrals = filteredReferrals.filter(r => new Date(r.referralDate) >= cutoff)
      }
    }
    
    // Apply limit
    if (limit && !isNaN(parseInt(limit))) {
      filteredReferrals = filteredReferrals.slice(0, parseInt(limit))
    }
    
    return NextResponse.json({
      success: true,
      data: filteredReferrals,
      total: filteredReferrals.length,
      filters: { status, partnerId, timeframe, limit }
    })
    
  } catch (error) {
    console.error('❌ Error fetching referrals:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch referrals' },
      { status: 500 }
    )
  }
}

// POST /api/referrals - Create new referral
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🆕 Creating new referral from partner:', body.partnerName)
    
    // Validate required fields
    if (!body.customerName || !body.customerEmail || !body.partnerName || !body.estimatedValue) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Initialize Attribution Engine
    const attributionEngine = new ReferralAttributionEngine()
    
    // Create referral tracking
    const referralData = {
      customer: {
        name: body.customerName,
        email: body.customerEmail,
        phone: body.customerPhone || '',
        move_from: body.moveFrom || '',
        move_to: body.moveTo || '',
        move_date: new Date(body.moveDate),
        move_type: body.moveType || 'residential',
        estimated_value: body.estimatedValue,
        services_needed: body.servicesIncluded || []
      },
      partner_info: {
        organization_id: body.partnerId || 1,
        agent_id: body.agentId,
        organization_name: body.partnerName,
        agent_name: body.agentName,
        category: body.partnerCategory || 'mäklare',
        referral_code: body.referralCode || `REF-${Date.now()}`
      },
      referral_source: body.referralSource || 'website',
      referral_code: body.referralCode,
      tracking_url: body.trackingUrl,
      move_details: {
        move_type: body.moveType || 'residential',
        estimated_value: body.estimatedValue,
        services_included: body.servicesIncluded || [],
        special_requirements: body.specialRequirements || [],
        urgency_level: body.urgencyLevel || 'medium',
        preferred_date: new Date(body.moveDate),
        flexible_dates: body.flexibleDates || false
      },
      timestamp: new Date()
    }
    
    // Track referral with AI attribution
    try {
      const trackedReferral = await attributionEngine.trackReferral(referralData)
      
      return NextResponse.json({
        success: true,
        data: trackedReferral,
        message: 'Referral created and tracked successfully'
      })
      
    } catch (attributionError) {
      console.error('⚠️ Attribution error (non-critical):', attributionError)
      
      // Create referral without AI attribution
      const newReferral = {
        id: Date.now(),
        referralCode: body.referralCode || `REF-${Date.now()}`,
        partnerName: body.partnerName,
        partnerCategory: body.partnerCategory || 'mäklare',
        partnerTier: body.partnerTier || 'bronze',
        agentName: body.agentName,
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        customerPhone: body.customerPhone || '',
        moveFrom: body.moveFrom || '',
        moveTo: body.moveTo || '',
        moveDate: new Date(body.moveDate),
        moveType: body.moveType || 'residential',
        referralSource: body.referralSource || 'website',
        referralDate: new Date(),
        estimatedValue: body.estimatedValue,
        servicesIncluded: body.servicesIncluded || [],
        conversionStatus: 'pending',
        kickbackAmount: Math.round(body.estimatedValue * 0.08), // 8% default
        kickbackCalculated: false,
        paymentStatus: 'pending',
        aiConversionProbability: 0.5,
        qualityScore: 5,
        followUpRequired: true,
        nextFollowUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        urgencyLevel: body.urgencyLevel || 'medium',
        tags: []
      }
      
      return NextResponse.json({
        success: true,
        data: newReferral,
        message: 'Referral created successfully'
      })
    }
    
  } catch (error) {
    console.error('❌ Error creating referral:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create referral' },
      { status: 500 }
    )
  }
}