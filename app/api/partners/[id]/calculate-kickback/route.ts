import { NextRequest, NextResponse } from 'next/server'
import { DynamicKickbackEngine } from '@/lib/partners/DynamicKickbackEngine'

// POST /api/partners/[id]/calculate-kickback - Calculate kickback for partner
export async function POST(
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
    
    const { period, agentId } = body
    
    console.log('💰 Calculating kickback for partner:', partnerId, 'period:', period, 'agentId:', agentId)
    
    const kickbackEngine = new DynamicKickbackEngine()
    
    // Calculate kickback
    const calculation = await kickbackEngine.calculateMonthlyKickback(
      partnerId,
      agentId,
      period
    )
    
    console.log('✅ Kickback calculation completed:', calculation.finalAmount)
    
    return NextResponse.json({
      success: true,
      data: calculation,
      message: 'Kickback calculated successfully'
    })
    
  } catch (error) {
    console.error('❌ Error calculating kickback:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to calculate kickback' },
      { status: 500 }
    )
  }
}