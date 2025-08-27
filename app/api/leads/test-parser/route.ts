import { NextRequest, NextResponse } from 'next/server'
import { LeadParser } from '@/lib/lead-parser'

export async function POST(request: NextRequest) {
  try {
    const { leadText } = await request.json()

    if (!leadText) {
      return NextResponse.json(
        { error: 'leadText is required' },
        { status: 400 }
      )
    }

    const parser = new LeadParser()
    
    // Parse the lead
    const parsedLead = parser.parse(leadText)
    
    // Fill with defaults
    const completeLead = parser.fillWithDefaults(parsedLead)
    
    // Determine what data we found vs what we defaulted
    const foundFields = []
    const defaultedFields = []
    
    // Check each field
    const fields = [
      'customerName', 'email', 'phone',
      'fromAddress', 'toAddress', 
      'squareMeters', 'hasElevatorFrom', 'hasElevatorTo',
      'parkingDistanceFrom', 'parkingDistanceTo',
      'moveDate', 'rooms'
    ]
    
    fields.forEach(field => {
      if (parsedLead[field as keyof typeof parsedLead] !== undefined) {
        foundFields.push(field)
      } else if (completeLead[field as keyof typeof completeLead] !== undefined) {
        defaultedFields.push(field)
      }
    })
    
    // Calculate confidence score
    const confidence = foundFields.length / fields.length
    let confidenceLevel: 'high' | 'medium' | 'low' = 'low'
    if (confidence > 0.8) confidenceLevel = 'high'
    else if (confidence > 0.5) confidenceLevel = 'medium'
    
    // Detect lead source
    let detectedSource = 'unknown'
    if (leadText.includes('flyttfirma24.se')) detectedSource = 'flyttfirma24'
    else if (leadText.includes('Flytta.se')) detectedSource = 'flytta.se'
    else if (leadText.includes('Lead-ID:')) detectedSource = 'email'
    
    return NextResponse.json({
      success: true,
      detectedSource,
      confidence: confidenceLevel,
      confidenceScore: Math.round(confidence * 100),
      parsed: parsedLead,
      complete: completeLead,
      statistics: {
        totalFields: fields.length,
        foundFields: foundFields.length,
        defaultedFields: defaultedFields.length,
        found: foundFields,
        defaulted: defaultedFields
      }
    })

  } catch (error: any) {
    console.error('Parser test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to parse lead',
      details: error.message
    }, { status: 500 })
  }
}