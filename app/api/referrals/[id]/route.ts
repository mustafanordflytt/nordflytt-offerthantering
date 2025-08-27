import { NextRequest, NextResponse } from 'next/server'

// GET /api/referrals/[id] - Get specific referral
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const referralId = parseInt(params.id)
    
    if (isNaN(referralId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid referral ID' },
        { status: 400 }
      )
    }
    
    console.log('🔍 Fetching referral details for ID:', referralId)
    
    // Mock data - in real implementation, fetch from Supabase
    const mockReferral = {
      id: referralId,
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
      tags: ['Privatflyttning', 'Stockholm'],
      notes: 'Kunden verkade mycket intresserad av premium service.',
      createdAt: new Date('2025-01-15'),
      updatedAt: new Date('2025-01-16')
    }
    
    return NextResponse.json({
      success: true,
      data: mockReferral
    })
    
  } catch (error) {
    console.error('❌ Error fetching referral:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch referral' },
      { status: 500 }
    )
  }
}

// PUT /api/referrals/[id] - Update referral
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const referralId = parseInt(params.id)
    const body = await request.json()
    
    if (isNaN(referralId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid referral ID' },
        { status: 400 }
      )
    }
    
    console.log('📝 Updating referral:', referralId, 'with data:', body)
    
    // Handle status changes
    if (body.conversionStatus) {
      const statusUpdate = {
        conversionStatus: body.conversionStatus,
        ...(body.conversionStatus === 'converted' && { 
          conversionDate: new Date(),
          actualValue: body.actualValue || body.estimatedValue
        }),
        ...(body.conversionStatus === 'lost' && { 
          lossReason: body.lossReason 
        })
      }
      
      console.log('📊 Status update:', statusUpdate)
    }
    
    // In real implementation, update in database
    const updatedReferral = {
      id: referralId,
      ...body,
      updatedAt: new Date()
    }
    
    return NextResponse.json({
      success: true,
      data: updatedReferral,
      message: 'Referral updated successfully'
    })
    
  } catch (error) {
    console.error('❌ Error updating referral:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update referral' },
      { status: 500 }
    )
  }
}

// DELETE /api/referrals/[id] - Delete referral
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const referralId = parseInt(params.id)
    
    if (isNaN(referralId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid referral ID' },
        { status: 400 }
      )
    }
    
    console.log('🗑️ Deleting referral:', referralId)
    
    // In real implementation, delete from database (soft delete recommended)
    
    return NextResponse.json({
      success: true,
      message: 'Referral deleted successfully'
    })
    
  } catch (error) {
    console.error('❌ Error deleting referral:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete referral' },
      { status: 500 }
    )
  }
}