import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware, AuthenticatedRequest } from '@/lib/auth/middleware'

export async function POST(request: NextRequest) {
  return authMiddleware(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json()
    const { jobId, services, volymjustering, photos, timestamp } = body

    // Log the update for demo purposes
    console.log('Order update received:', {
      jobId,
      services: services?.length || 0,
      volymjustering,
      photos: photos?.length || 0,
      timestamp,
      updatedBy: req.user?.name || 'Unknown',
      userId: req.user?.userId
    })

    // In a real implementation, this would:
    // 1. Update the order in the database
    // 2. Send notification to customer
    // 3. Update billing information
    // 4. Store photos in cloud storage
    // 5. Generate PDF documentation

    // Simulate API processing
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Mock response
    const response = {
      success: true,
      orderId: jobId,
      data: {
        updatedServices: services || [],
        volumeAdjustment: volymjustering,
        photosStored: photos?.length || 0,
        customerNotified: true,
        totalAddedCost: services?.reduce((sum: number, service: any) => sum + service.totalPrice, 0) || 0
      },
      message: 'Beställningen har uppdaterats och kunden har meddelats automatiskt.'
    }

    return NextResponse.json(response, { status: 200 })

    } catch (error) {
      console.error('Error updating order:', error)
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to update order',
          message: 'Ett fel uppstod vid uppdatering av beställningen. Försök igen.'
        },
        { status: 500 }
      )
    }
  })
}