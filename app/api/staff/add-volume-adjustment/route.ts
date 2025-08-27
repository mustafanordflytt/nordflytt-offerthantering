import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      orderId, 
      originalVolym, 
      faktiskVolym, 
      extraVolym, 
      extraKostnad, 
      pricePerM3 
    } = body

    // Validate business logic
    if (extraVolym <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ingen extra volym att lägga till',
          message: 'Extra volym måste vara större än 0'
        },
        { status: 400 }
      )
    }

    if (faktiskVolym <= originalVolym) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Faktisk volym inte större än bokat',
          message: 'Mindre volym än bokat ger ingen rabatt då resurser redan är allokerade.'
        },
        { status: 400 }
      )
    }

    // Verify calculation
    const calculatedExtra = faktiskVolym - originalVolym
    const calculatedCost = calculatedExtra * pricePerM3

    if (Math.abs(extraVolym - calculatedExtra) > 0.01 || Math.abs(extraKostnad - calculatedCost) > 0.01) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Beräkningsfel',
          message: 'Prisberäkningen stämmer inte överens'
        },
        { status: 400 }
      )
    }

    // Log the volume adjustment for demo purposes
    console.log('Volume adjustment received:', {
      orderId,
      originalVolym: `${originalVolym} m³`,
      faktiskVolym: `${faktiskVolym} m³`,
      extraVolym: `${extraVolym} m³`,
      extraKostnad: `${extraKostnad} kr`,
      pricePerM3: `${pricePerM3} kr/m³`
    })

    // In a real implementation, this would:
    // 1. Update the order in the database
    // 2. Recalculate total order cost
    // 3. Send notification to customer about volume increase
    // 4. Update billing information
    // 5. Log the change for auditing

    // Simulate API processing
    await new Promise(resolve => setTimeout(resolve, 800))

    // Mock successful response
    const response = {
      success: true,
      orderId,
      data: {
        originalVolume: originalVolym,
        actualVolume: faktiskVolym,
        extraVolume: extraVolym,
        extraCost: extraKostnad,
        pricePerM3,
        customerNotified: true,
        billingUpdated: true,
        timestamp: new Date().toISOString()
      },
      message: `Extra volym tillagd: ${extraVolym} m³ = +${extraKostnad.toLocaleString()} kr. Kunden har meddelats automatiskt.`
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('Error processing volume adjustment:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process volume adjustment',
        message: 'Ett fel uppstod vid hantering av volymjustering. Försök igen.'
      },
      { status: 500 }
    )
  }
}