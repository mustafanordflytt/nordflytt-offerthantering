import { NextRequest, NextResponse } from 'next/server'

// GET /api/kickbacks/[id] - Get specific kickback payment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const kickbackId = parseInt(params.id)
    
    if (isNaN(kickbackId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid kickback ID' },
        { status: 400 }
      )
    }
    
    console.log('🔍 Fetching kickback payment details for ID:', kickbackId)
    
    // Mock data - in real implementation, fetch from Supabase
    const mockKickback = {
      id: kickbackId,
      partnerId: 1,
      partnerName: 'Svensk Fastighetsförmedling Stockholm',
      partnerCategory: 'mäklare',
      partnerTier: 'gold',
      paymentPeriod: 'Januari 2025',
      periodStart: new Date('2025-01-01'),
      periodEnd: new Date('2025-01-31'),
      referralsIncluded: 28,
      baseKickbackAmount: 23800,
      volumeBonus: 1190,
      qualityBonus: 714,
      tierBonus: 2380,
      performanceBonus: 476,
      specialPromotionBonus: 14000,
      totalGrossAmount: 42560,
      taxDeduction: 12768,
      adminFee: 851,
      netPaymentAmount: 28941,
      paymentMethod: 'bank_transfer',
      paymentReference: 'KICKBACK-1-ORG-20250115',
      paymentStatus: 'approved',
      invoiceRequired: true,
      invoiceSent: false,
      bankAccount: {
        accountNumber: '1234567890',
        bankName: 'Handelsbanken',
        accountHolder: 'Svensk Fastighetsförmedling Stockholm AB'
      },
      calculationDetails: {
        baseRate: 0.10,
        volumeThreshold: 20,
        qualityThreshold: 4.2,
        tierMultiplier: 1.2,
        bonusBreakdown: {
          volume: { achieved: 28, threshold: 20, rate: 0.05 },
          quality: { achieved: 4.6, threshold: 4.2, rate: 0.03 },
          tier: { tier: 'gold', multiplier: 1.2 },
          performance: { rate: 0.85, target: 0.75, bonus: 0.02 }
        }
      },
      createdAt: new Date('2025-01-15'),
      updatedAt: new Date('2025-01-15')
    }
    
    return NextResponse.json({
      success: true,
      data: mockKickback
    })
    
  } catch (error) {
    console.error('❌ Error fetching kickback payment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch kickback payment' },
      { status: 500 }
    )
  }
}

// PUT /api/kickbacks/[id] - Update kickback payment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const kickbackId = parseInt(params.id)
    const body = await request.json()
    
    if (isNaN(kickbackId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid kickback ID' },
        { status: 400 }
      )
    }
    
    console.log('📝 Updating kickback payment:', kickbackId, 'with data:', body)
    
    // Handle status changes
    if (body.paymentStatus) {
      const statusUpdate = {
        paymentStatus: body.paymentStatus,
        ...(body.paymentStatus === 'approved' && { 
          approvedAt: new Date(),
          approvedBy: body.approvedBy || 'system'
        }),
        ...(body.paymentStatus === 'processing' && { 
          processedAt: new Date() 
        }),
        ...(body.paymentStatus === 'paid' && { 
          paymentDate: new Date(),
          paymentConfirmation: body.paymentConfirmation || `TXN-${Date.now()}`
        }),
        ...(body.paymentStatus === 'failed' && { 
          failureReason: body.failureReason 
        })
      }
      
      console.log('📊 Status update:', statusUpdate)
    }
    
    // In real implementation, update in database
    const updatedKickback = {
      id: kickbackId,
      ...body,
      updatedAt: new Date()
    }
    
    return NextResponse.json({
      success: true,
      data: updatedKickback,
      message: 'Kickback payment updated successfully'
    })
    
  } catch (error) {
    console.error('❌ Error updating kickback payment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update kickback payment' },
      { status: 500 }
    )
  }
}