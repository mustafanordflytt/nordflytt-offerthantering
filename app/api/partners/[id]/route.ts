import { NextRequest, NextResponse } from 'next/server'

// GET /api/partners/[id] - Get specific partner
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const partnerId = parseInt(params.id)
    
    if (isNaN(partnerId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid partner ID' },
        { status: 400 }
      )
    }
    
    console.log('🔍 Fetching partner details for ID:', partnerId)
    
    // Mock data - in real implementation, fetch from Supabase
    const mockPartner = {
      id: partnerId,
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
      onboardingStage: 'completed',
      notes: 'Topp partner med konsistent prestanda.',
      performance: {
        monthlyTarget: 25,
        achievementRate: 1.12,
        qualityScore: 8.5,
        customerSatisfaction: 4.6
      },
      createdAt: new Date('2024-06-15'),
      updatedAt: new Date('2025-01-15')
    }
    
    return NextResponse.json({
      success: true,
      data: mockPartner
    })
    
  } catch (error) {
    console.error('❌ Error fetching partner:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch partner' },
      { status: 500 }
    )
  }
}

// PUT /api/partners/[id] - Update partner
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const partnerId = parseInt(params.id)
    const body = await request.json()
    
    if (isNaN(partnerId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid partner ID' },
        { status: 400 }
      )
    }
    
    console.log('📝 Updating partner:', partnerId, 'with data:', body)
    
    // In real implementation, update in database
    const updatedPartner = {
      id: partnerId,
      ...body,
      updatedAt: new Date()
    }
    
    return NextResponse.json({
      success: true,
      data: updatedPartner,
      message: 'Partner updated successfully'
    })
    
  } catch (error) {
    console.error('❌ Error updating partner:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update partner' },
      { status: 500 }
    )
  }
}

// DELETE /api/partners/[id] - Delete partner
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const partnerId = parseInt(params.id)
    
    if (isNaN(partnerId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid partner ID' },
        { status: 400 }
      )
    }
    
    console.log('🗑️ Deleting partner:', partnerId)
    
    // In real implementation, delete from database (soft delete recommended)
    
    return NextResponse.json({
      success: true,
      message: 'Partner deleted successfully'
    })
    
  } catch (error) {
    console.error('❌ Error deleting partner:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete partner' },
      { status: 500 }
    )
  }
}