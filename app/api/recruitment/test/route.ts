import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Lowisa API endpoints are accessible',
    timestamp: new Date().toISOString()
  });
}

export async function POST() {
  return NextResponse.json({
    status: 'ok',
    message: 'POST endpoint working',
    timestamp: new Date().toISOString()
  });
}