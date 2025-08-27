import { NextRequest, NextResponse } from 'next/server'

interface AddServiceRequest {
  jobId: string
  services: Array<{
    id: string
    name: string
    price: number
    quantity: number
    totalPrice: number
    category: string
    unit?: string
    description: string
  }>
}

export async function POST(request: NextRequest) {
  try {
    const body: AddServiceRequest = await request.json()
    const { jobId, services } = body

    // Validate request
    if (!jobId || !services || services.length === 0) {
      return NextResponse.json(
        { error: 'Saknar jobId eller tjänster' },
        { status: 400 }
      )
    }

    // Calculate total price
    const totalAddedPrice = services.reduce((sum, service) => sum + service.totalPrice, 0)

    // TODO: Replace with real database operations
    // For now, we'll simulate the API response
    
    // 1. Update job/order in database with new services
    const updatedOrder = {
      jobId,
      addedServices: services,
      totalAddedPrice,
      updatedAt: new Date().toISOString()
    }

    // 2. Update job total price
    const originalPrice = 15000 // Mock original price
    const newTotalPrice = originalPrice + totalAddedPrice

    // 3. Log the change in audit trail
    const auditLog = {
      jobId,
      action: 'service_added',
      addedBy: 'staff', // In real app, get from auth token
      services: services.map(s => ({ 
        name: s.name, 
        quantity: s.quantity, 
        price: s.totalPrice 
      })),
      timestamp: new Date().toISOString()
    }

    // 4. Prepare customer notification data
    const customerNotification = {
      jobId,
      customerPhone: '+46 72 368 39 67', // Mock - get from job data
      customerEmail: 'customer@example.com', // Mock - get from job data
      services: services,
      totalAdded: totalAddedPrice,
      newTotalPrice: newTotalPrice,
      message: `Tilläggtjänster har lagts till på ditt uppdrag: ${services.map(s => `${s.name} (${s.quantity}x)`).join(', ')}. Tillagt belopp: ${totalAddedPrice.toLocaleString('sv-SE')} kr. Nytt totalpris: ${newTotalPrice.toLocaleString('sv-SE')} kr.`
    }

    // 5. Send customer notification (SMS + Email)
    // TODO: Integrate with notification service
    await sendCustomerNotification(customerNotification)

    // 6. Update CRM system
    // TODO: Integrate with CRM API
    await updateCRMOrder(jobId, services, totalAddedPrice)

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        jobId,
        addedServices: services,
        totalAddedPrice,
        newTotalPrice,
        auditLog,
        customerNotified: true
      }
    })

  } catch (error) {
    console.error('Error adding services to order:', error)
    return NextResponse.json(
      { 
        error: 'Kunde inte lägga till tjänster',
        details: error instanceof Error ? error.message : 'Okänt fel'
      },
      { status: 500 }
    )
  }
}

// Mock function to simulate customer notification
async function sendCustomerNotification(notification: any) {
  // TODO: Replace with real SMS/email service
  console.log('Sending customer notification:', notification)
  
  // Simulate SMS sending
  const smsPayload = {
    to: notification.customerPhone,
    message: notification.message
  }
  
  // Simulate email sending
  const emailPayload = {
    to: notification.customerEmail,
    subject: 'Uppdaterat uppdrag - Nordflytt',
    html: `
      <h2>Ditt uppdrag har uppdaterats</h2>
      <p>Följande tillvalstjänster har lagts till:</p>
      <ul>
        ${notification.services.map((service: any) => 
          `<li>${service.name} - ${service.quantity}x - ${service.totalPrice.toLocaleString('sv-SE')} kr</li>`
        ).join('')}
      </ul>
      <p><strong>Tillagt belopp: ${notification.totalAdded.toLocaleString('sv-SE')} kr</strong></p>
      <p><strong>Nytt totalpris: ${notification.newTotalPrice.toLocaleString('sv-SE')} kr</strong></p>
      <p>Med vänliga hälsningar,<br>Nordflytt Team</p>
    `
  }

  // In real implementation, you would call your SMS and email services here
  await Promise.resolve() // Simulate async operation
}

// Mock function to simulate CRM update
async function updateCRMOrder(jobId: string, services: any[], totalAddedPrice: number) {
  // TODO: Replace with real CRM API integration
  console.log('Updating CRM order:', {
    jobId,
    services,
    totalAddedPrice
  })
  
  await Promise.resolve() // Simulate async operation
}