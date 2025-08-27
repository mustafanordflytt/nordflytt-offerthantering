import { NextRequest, NextResponse } from 'next/server'
import { DynamicKickbackEngine } from '@/lib/partners/DynamicKickbackEngine'

// GET /api/kickbacks - Fetch all kickback payments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const partnerId = searchParams.get('partnerId')
    const period = searchParams.get('period')
    const limit = searchParams.get('limit')
    
    console.log('📋 Fetching kickback payments with filters:', { status, partnerId, period, limit })
    
    // Mock data - in real implementation, fetch from Supabase
    const mockPayments = [
      {
        id: 1,
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
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-15')
      },
      {
        id: 2,
        partnerId: 2,
        partnerName: 'Fonus Stockholm',
        partnerCategory: 'begravningsbyråer',
        partnerTier: 'platinum',
        paymentPeriod: 'Januari 2025',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-01-31'),
        referralsIncluded: 15,
        baseKickbackAmount: 25920,
        volumeBonus: 0,
        qualityBonus: 778,
        tierBonus: 3370,
        performanceBonus: 518,
        specialPromotionBonus: 7500,
        totalGrossAmount: 38086,
        taxDeduction: 11426,
        adminFee: 762,
        netPaymentAmount: 25898,
        paymentMethod: 'bank_transfer',
        paymentReference: 'KICKBACK-2-ORG-20250115',
        paymentStatus: 'processing',
        invoiceRequired: true,
        invoiceSent: true,
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-15')
      },
      {
        id: 3,
        partnerId: 4,
        partnerName: 'Handelsbanken Private Banking',
        partnerCategory: 'bankRådgivare',
        partnerTier: 'silver',
        paymentPeriod: 'Januari 2025',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-01-31'),
        referralsIncluded: 18,
        baseKickbackAmount: 7776,
        volumeBonus: 0,
        qualityBonus: 233,
        tierBonus: 778,
        performanceBonus: 156,
        specialPromotionBonus: 0,
        totalGrossAmount: 8943,
        taxDeduction: 2683,
        adminFee: 179,
        netPaymentAmount: 6081,
        paymentMethod: 'bank_transfer',
        paymentReference: 'KICKBACK-4-ORG-20250115',
        paymentStatus: 'paid',
        paymentDate: new Date('2025-01-15'),
        paymentConfirmation: 'TXN-2025011500123',
        invoiceRequired: false,
        invoiceSent: false,
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-15')
      }
    ]
    
    // Apply filters
    let filteredPayments = mockPayments
    
    if (status && status !== 'all') {
      filteredPayments = filteredPayments.filter(p => p.paymentStatus === status)
    }
    
    if (partnerId && partnerId !== 'all') {
      filteredPayments = filteredPayments.filter(p => p.partnerId === parseInt(partnerId))
    }
    
    if (period && period !== 'all') {
      if (period === 'current') {
        const currentMonth = new Date().getMonth()
        const currentYear = new Date().getFullYear()
        filteredPayments = filteredPayments.filter(p => 
          p.periodStart.getMonth() === currentMonth && 
          p.periodStart.getFullYear() === currentYear
        )
      } else if (period === 'previous') {
        const previousMonth = new Date()
        previousMonth.setMonth(previousMonth.getMonth() - 1)
        filteredPayments = filteredPayments.filter(p => 
          p.periodStart.getMonth() === previousMonth.getMonth() && 
          p.periodStart.getFullYear() === previousMonth.getFullYear()
        )
      }
    }
    
    // Apply limit
    if (limit && !isNaN(parseInt(limit))) {
      filteredPayments = filteredPayments.slice(0, parseInt(limit))
    }
    
    return NextResponse.json({
      success: true,
      data: filteredPayments,
      total: filteredPayments.length,
      filters: { status, partnerId, period, limit }
    })
    
  } catch (error) {
    console.error('❌ Error fetching kickback payments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch kickback payments' },
      { status: 500 }
    )
  }
}

// POST /api/kickbacks - Calculate kickbacks for all partners
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { period, partnerIds } = body
    
    console.log('💰 Calculating kickbacks for period:', period, 'partners:', partnerIds)
    
    const kickbackEngine = new DynamicKickbackEngine()
    const calculations = []
    
    // Calculate for specific partners or all partners
    const partnersToCalculate = partnerIds || [1, 2, 3, 4, 5] // Mock partner IDs
    
    for (const partnerId of partnersToCalculate) {
      try {
        const calculation = await kickbackEngine.calculateMonthlyKickback(partnerId, undefined, period)
        calculations.push(calculation)
      } catch (error) {
        console.error(`❌ Error calculating kickback for partner ${partnerId}:`, error)
      }
    }
    
    console.log('✅ Kickback calculations completed for', calculations.length, 'partners')
    
    return NextResponse.json({
      success: true,
      data: calculations,
      message: `Kickbacks calculated for ${calculations.length} partners`
    })
    
  } catch (error) {
    console.error('❌ Error calculating kickbacks:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to calculate kickbacks' },
      { status: 500 }
    )
  }
}