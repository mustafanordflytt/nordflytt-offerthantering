import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

interface ErrorLog {
  error: {
    name: string
    message: string
    stack?: string
  }
  context?: string
  timestamp: string
  url: string
  userAgent: string
  userId?: string
  sessionId?: string
  additionalInfo?: Record<string, any>
}

// In production, you would integrate with services like:
// - Sentry
// - LogRocket  
// - Bugsnag
// - DataDog
// - Custom logging service

export async function POST(request: NextRequest) {
  try {
    const errorLog: ErrorLog = await request.json()
    
    // Get additional request info
    const headersList = await headers()
    const forwardedFor = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')
    const clientIp = forwardedFor?.split(',')[0] || realIp || 'unknown'
    
    // Enhance error log with server-side info
    const enhancedLog = {
      ...errorLog,
      server: {
        timestamp: new Date().toISOString(),
        ip: clientIp,
        headers: Object.fromEntries(headersList.entries()),
      },
      environment: process.env.NODE_ENV,
      version: process.env.APP_VERSION || 'unknown',
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Client Error Report')
      console.error('Error:', errorLog.error)
      console.log('Context:', errorLog.context)
      console.log('URL:', errorLog.url)
      console.log('User Agent:', errorLog.userAgent)
      console.log('Timestamp:', errorLog.timestamp)
      if (errorLog.error.stack) {
        console.log('Stack Trace:', errorLog.error.stack)
      }
      console.groupEnd()
    }
    
    // In production, send to external logging service
    if (process.env.NODE_ENV === 'production') {
      await logToExternalService(enhancedLog)
    }
    
    // Store in database for analysis (optional)
    await storeErrorInDatabase(enhancedLog)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Error logged successfully',
      errorId: generateErrorId(errorLog)
    })
    
  } catch (error) {
    console.error('Failed to log error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to log error' 
      },
      { status: 500 }
    )
  }
}

async function logToExternalService(errorLog: any) {
  // Example integrations:
  
  // Sentry
  if (process.env.SENTRY_DSN) {
    try {
      // In a real app, you'd use @sentry/node here
      console.log('Would send to Sentry:', errorLog.error.message)
    } catch (error) {
      console.error('Failed to send to Sentry:', error)
    }
  }
  
  // LogRocket
  if (process.env.LOGROCKET_APP_ID) {
    try {
      // In a real app, you'd use LogRocket's server SDK
      console.log('Would send to LogRocket:', errorLog.error.message)
    } catch (error) {
      console.error('Failed to send to LogRocket:', error)
    }
  }
  
  // Custom webhook
  if (process.env.ERROR_WEBHOOK_URL) {
    try {
      await fetch(process.env.ERROR_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorLog)
      })
    } catch (error) {
      console.error('Failed to send to webhook:', error)
    }
  }
}

async function storeErrorInDatabase(errorLog: any) {
  // Store in Supabase for analysis
  try {
    const { createClient } = await import('@supabase/supabase-js')
    
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
      
      await supabase.from('error_logs').insert({
        error_name: errorLog.error.name,
        error_message: errorLog.error.message,
        error_stack: errorLog.error.stack,
        context: errorLog.context,
        url: errorLog.url,
        user_agent: errorLog.userAgent,
        client_ip: errorLog.server.ip,
        timestamp: errorLog.timestamp,
        environment: errorLog.environment,
        version: errorLog.version,
        additional_info: errorLog.additionalInfo
      })
    }
  } catch (error) {
    console.error('Failed to store error in database:', error)
  }
}

function generateErrorId(errorLog: ErrorLog): string {
  const timestamp = Date.now()
  const hash = errorLog.error.message
    .split('')
    .reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) & 0xffffffff, 0)
    .toString(16)
  
  return `err_${timestamp}_${Math.abs(hash)}`
}

// GET endpoint to retrieve error statistics (for admin dashboard)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')
    const limit = parseInt(searchParams.get('limit') || '100')
    
    // In production, fetch from your error tracking service
    // This is a mock response
    const mockStats = {
      totalErrors: 42,
      period: `Last ${days} days`,
      topErrors: [
        {
          message: "Cannot read property 'map' of undefined",
          count: 15,
          lastOccurred: new Date(Date.now() - 1000 * 60 * 30).toISOString()
        },
        {
          message: "Network request failed",
          count: 12,
          lastOccurred: new Date(Date.now() - 1000 * 60 * 15).toISOString()
        },
        {
          message: "TypeError: Failed to fetch",
          count: 8,
          lastOccurred: new Date(Date.now() - 1000 * 60 * 5).toISOString()
        }
      ],
      errorsByType: {
        'TypeError': 20,
        'ReferenceError': 10,
        'NetworkError': 12
      }
    }
    
    return NextResponse.json({
      success: true,
      data: mockStats
    })
    
  } catch (error) {
    console.error('Failed to get error stats:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to get error statistics' },
      { status: 500 }
    )
  }
}