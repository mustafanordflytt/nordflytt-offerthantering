import { NextRequest, NextResponse } from 'next/server'

// Denna endpoint körs av Vercel Cron eller extern cron service
// Konfigureras att köra kl 18:00 varje dag
export async function GET(request: NextRequest) {
  // Verifiera att requesten kommer från cron job (säkerhet)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  
  try {
    // Anropa auto-invoice endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/jobs/auto-invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.INTERNAL_API_SECRET || 'internal-secret'
      }
    })
    
    const result = await response.json()
    
    console.log('✅ Daily auto-invoice completed:', result)
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result
    })
    
  } catch (error) {
    console.error('❌ Daily auto-invoice failed:', error)
    
    // Notifiera admin om fel
    // await notifyAdminOfCronFailure(error)
    
    return NextResponse.json({
      success: false,
      error: 'Auto-invoice cron job failed'
    }, { status: 500 })
  }
}

// Vercel Cron konfiguration
export const config = {
  // Kör kl 18:00 svensk tid varje dag
  schedule: '0 17 * * *', // UTC (svensk tid -1h)
}

// För lokal utveckling - manuell trigger
export async function POST(request: NextRequest) {
  console.log('🚀 Manuell trigger av auto-fakturering...')
  return GET(request)
}