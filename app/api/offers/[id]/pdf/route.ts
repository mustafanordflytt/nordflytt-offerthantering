import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // For now, return a simple error message
    // In production, this would generate a real PDF
    return NextResponse.json(
      { 
        error: 'PDF generation not implemented yet',
        message: 'PDF-generering kommer snart!'
      },
      { status: 501 }
    )
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}