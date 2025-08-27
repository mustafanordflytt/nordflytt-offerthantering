import { NextRequest, NextResponse } from 'next/server'
import { SmartPartnerOnboarding } from '@/lib/partners/SmartPartnerOnboarding'

// GET /api/partners - Fetch all partners
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const tier = searchParams.get('tier')
    const limit = searchParams.get('limit')
    
    console.log('📋 Fetching partners with filters:', { category, status, tier, limit })
    
    // Mock data - in real implementation, fetch from Supabase
    const mockPartners = [
      {
        id: 1,
        name: 'Svensk Fastighetsförmedling Stockholm',
        orgNumber: '556188-8888',
        category: 'mäklare',
        status: 'active',
        tier: 'gold',
        contactPerson: 'Anna Carlsson',
        email: 'anna.carlsson@svenskfast.se',
        phone: '+46 8 123 45 67',
        website: 'svenskfast.se',
        address: 'Stureplan 4, 114 35 Stockholm',
        kickbackRate: 0.10,
        monthlyReferrals: 28,
        totalReferrals: 168,
        conversionRate: 0.85,
        totalRevenue: 238000,
        lastActivity: new Date('2025-01-15'),
        contractDate: new Date('2024-06-15'),
        createdAt: new Date('2024-06-15'),
        updatedAt: new Date('2025-01-15')
      },
      {
        id: 2,
        name: 'Fonus Stockholm',
        orgNumber: '556077-7777',
        category: 'begravningsbyråer',
        status: 'active',
        tier: 'platinum',
        contactPerson: 'Maria Lindqvist',
        email: 'maria.lindqvist@fonus.se',
        phone: '+46 8 345 67 89',
        website: 'fonus.se',
        address: 'Upplandsgatan 15, 113 23 Stockholm',
        kickbackRate: 0.12,
        monthlyReferrals: 15,
        totalReferrals: 92,
        conversionRate: 0.92,
        totalRevenue: 216000,
        lastActivity: new Date('2025-01-14'),
        contractDate: new Date('2024-08-01'),
        createdAt: new Date('2024-08-01'),
        updatedAt: new Date('2025-01-14')
      },
      {
        id: 3,
        name: 'Stockholmshem',
        orgNumber: '556366-6666',
        category: 'fastighetsförvaltare',
        status: 'negotiating',
        tier: 'silver',
        contactPerson: 'Lars Andersson',
        email: 'lars.andersson@stockholmshem.se',
        phone: '+46 8 456 78 90',
        website: 'stockholmshem.se',
        address: 'Hamngatan 12, 111 47 Stockholm',
        kickbackRate: 0.08,
        monthlyReferrals: 22,
        totalReferrals: 89,
        conversionRate: 0.71,
        totalRevenue: 165000,
        lastActivity: new Date('2025-01-13'),
        contractDate: new Date('2024-09-10'),
        createdAt: new Date('2024-09-10'),
        updatedAt: new Date('2025-01-13')
      }
    ]
    
    // Apply filters
    let filteredPartners = mockPartners
    
    if (category && category !== 'all') {
      filteredPartners = filteredPartners.filter(p => p.category === category)
    }
    
    if (status && status !== 'all') {
      filteredPartners = filteredPartners.filter(p => p.status === status)
    }
    
    if (tier && tier !== 'all') {
      filteredPartners = filteredPartners.filter(p => p.tier === tier)
    }
    
    // Apply limit
    if (limit && !isNaN(parseInt(limit))) {
      filteredPartners = filteredPartners.slice(0, parseInt(limit))
    }
    
    return NextResponse.json({
      success: true,
      data: filteredPartners,
      total: filteredPartners.length,
      filters: { category, status, tier, limit }
    })
    
  } catch (error) {
    console.error('❌ Error fetching partners:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch partners' },
      { status: 500 }
    )
  }
}

// POST /api/partners - Create new partner
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🆕 Creating new partner:', body.name)
    
    // Validate required fields
    if (!body.name || !body.category || !body.contactPerson || !body.email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Initialize Smart Partner Onboarding
    const onboardingEngine = new SmartPartnerOnboarding()
    
    // Create partner with AI-powered onboarding
    const newPartner = {
      id: Date.now(), // In real app, generate proper ID
      name: body.name,
      orgNumber: body.orgNumber || '',
      category: body.category,
      status: 'pending',
      tier: 'bronze',
      contactPerson: body.contactPerson,
      email: body.email,
      phone: body.phone || '',
      website: body.website || '',
      address: body.address || '',
      kickbackRate: 0.08, // Default rate
      monthlyReferrals: 0,
      totalReferrals: 0,
      conversionRate: 0,
      totalRevenue: 0,
      lastActivity: new Date(),
      contractDate: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    // Initiate AI-powered onboarding
    try {
      await onboardingEngine.initiatePartnerOnboarding(newPartner.category, {
        name: newPartner.name,
        orgNumber: newPartner.orgNumber,
        contactPerson: newPartner.contactPerson,
        email: newPartner.email,
        phone: newPartner.phone,
        size: body.size || 'medium',
        estimatedMonthlyReferrals: body.estimatedMonthlyReferrals || 10,
        marketPresence: body.marketPresence || 'moderate',
        coverage: body.coverage || ['Stockholm'],
        digitalCapabilities: body.digitalCapabilities || 'intermediate',
        exclusivity: body.exclusivity || false
      })
    } catch (onboardingError) {
      console.error('⚠️ Onboarding error (non-critical):', onboardingError)
      // Continue with partner creation even if onboarding fails
    }
    
    // In real implementation, save to database
    console.log('✅ Partner created successfully:', newPartner.name)
    
    return NextResponse.json({
      success: true,
      data: newPartner,
      message: 'Partner created successfully and onboarding initiated'
    })
    
  } catch (error) {
    console.error('❌ Error creating partner:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create partner' },
      { status: 500 }
    )
  }
}