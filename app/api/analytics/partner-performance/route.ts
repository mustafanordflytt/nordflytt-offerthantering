import { NextRequest, NextResponse } from 'next/server'

// GET /api/analytics/partner-performance - Get partner performance analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '30d'
    const category = searchParams.get('category')
    const partnerId = searchParams.get('partnerId')
    
    console.log('📊 Fetching partner performance analytics:', { timeframe, category, partnerId })
    
    // Mock analytics data - in real implementation, calculate from database
    const analytics = {
      overview: {
        totalPartners: 47,
        activePartners: 42,
        totalReferrals: 156,
        conversionRate: 0.78,
        totalRevenue: 1247500,
        totalKickbacks: 124750,
        avgKickbackPerPartner: 2970,
        topPerformingCategory: 'mäklare'
      },
      
      partnerPerformance: [
        {
          id: 1,
          name: 'Svensk Fastighetsförmedling Stockholm',
          category: 'mäklare',
          tier: 'gold',
          referrals: 28,
          conversions: 24,
          conversionRate: 0.857,
          revenue: 238000,
          kickbacks: 23800,
          qualityScore: 8.5,
          customerSatisfaction: 4.6,
          growth: 0.12
        },
        {
          id: 2,
          name: 'Fonus Stockholm',
          category: 'begravningsbyråer',
          tier: 'platinum',
          referrals: 15,
          conversions: 14,
          conversionRate: 0.933,
          revenue: 216000,
          kickbacks: 25920,
          qualityScore: 9.2,
          customerSatisfaction: 4.8,
          growth: 0.08
        },
        {
          id: 3,
          name: 'Stockholmshem',
          category: 'fastighetsförvaltare',
          tier: 'silver',
          referrals: 22,
          conversions: 16,
          conversionRate: 0.727,
          revenue: 165000,
          kickbacks: 13200,
          qualityScore: 7.8,
          customerSatisfaction: 4.2,
          growth: 0.05
        }
      ],
      
      categoryPerformance: [
        {
          category: 'mäklare',
          partners: 18,
          totalReferrals: 85,
          avgConversionRate: 0.847,
          totalRevenue: 672500,
          totalKickbacks: 67250,
          avgKickbackRate: 0.10,
          marketPotential: 50000000
        },
        {
          category: 'begravningsbyråer',
          partners: 6,
          totalReferrals: 32,
          avgConversionRate: 0.906,
          totalRevenue: 384000,
          totalKickbacks: 46080,
          avgKickbackRate: 0.12,
          marketPotential: 15000000
        },
        {
          category: 'fastighetsförvaltare',
          partners: 12,
          totalReferrals: 56,
          avgConversionRate: 0.714,
          totalRevenue: 420000,
          totalKickbacks: 33600,
          avgKickbackRate: 0.08,
          marketPotential: 30000000
        }
      ],
      
      timeSeriesData: [
        { period: '2024-09', referrals: 98, conversions: 74, revenue: 888000 },
        { period: '2024-10', referrals: 112, conversions: 89, revenue: 1067000 },
        { period: '2024-11', referrals: 134, conversions: 101, revenue: 1212000 },
        { period: '2024-12', referrals: 147, conversions: 118, revenue: 1416000 },
        { period: '2025-01', referrals: 156, conversions: 122, revenue: 1464000 }
      ],
      
      tierDistribution: {
        bronze: { count: 15, percentage: 31.9 },
        silver: { count: 18, percentage: 38.3 },
        gold: { count: 10, percentage: 21.3 },
        platinum: { count: 4, percentage: 8.5 }
      },
      
      kickbackDistribution: {
        totalPaid: 89750,
        totalPending: 34000,
        avgMonthlyPayout: 28583,
        largestPayout: 28941,
        smallestPayout: 6081
      },
      
      qualityMetrics: {
        avgQualityScore: 8.1,
        avgCustomerSatisfaction: 4.4,
        avgResponseTime: 18.5, // hours
        avgConversionTime: 4.2, // days
        supportTickets: 12,
        complaints: 3
      }
    }
    
    // Apply filters
    let filteredAnalytics = analytics
    
    if (category && category !== 'all') {
      filteredAnalytics.partnerPerformance = filteredAnalytics.partnerPerformance.filter(p => p.category === category)
      filteredAnalytics.categoryPerformance = filteredAnalytics.categoryPerformance.filter(c => c.category === category)
    }
    
    if (partnerId && partnerId !== 'all') {
      filteredAnalytics.partnerPerformance = filteredAnalytics.partnerPerformance.filter(p => p.id === parseInt(partnerId))
    }
    
    return NextResponse.json({
      success: true,
      data: filteredAnalytics,
      timeframe,
      filters: { category, partnerId }
    })
    
  } catch (error) {
    console.error('❌ Error fetching partner performance analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch partner performance analytics' },
      { status: 500 }
    )
  }
}