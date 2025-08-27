import { NextRequest, NextResponse } from 'next/server'
import { sendVehicleCodeEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { 
      employeeId, 
      employeeName, 
      employeeEmail, 
      vehicleCode, 
      expiryDate 
    } = await request.json()

    if (!employeeId || !employeeName || !employeeEmail || !vehicleCode) {
      return NextResponse.json(
        { error: 'Saknar obligatoriska fält: employeeId, employeeName, employeeEmail, vehicleCode' },
        { status: 400 }
      )
    }

    // Skicka email med fordonskod
    await sendVehicleCodeEmail({
      to: employeeEmail,
      employeeName,
      vehicleCode,
      expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000) // 6 månader
    })

    console.log(`✅ Fordonskod email skickat till ${employeeEmail} för ${employeeName}`)

    return NextResponse.json({
      success: true,
      message: 'Fordonskod skickad via email',
      sentTo: employeeEmail
    })

  } catch (error) {
    console.error('Error sending vehicle code email:', error)
    return NextResponse.json(
      { error: 'Kunde inte skicka fordonskod via email' },
      { status: 500 }
    )
  }
}