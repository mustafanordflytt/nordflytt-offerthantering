import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const userAgent = request.headers.get('user-agent') || 'Unknown'
  const host = request.headers.get('host') || 'Unknown'
  
  return NextResponse.json({
    message: 'API fungerar!',
    timestamp: new Date().toISOString(),
    userAgent,
    host,
    url: request.url,
    method: request.method
  })
}