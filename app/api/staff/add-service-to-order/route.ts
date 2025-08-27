import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { jobId, services, staffName, staffId } = await request.json()

    if (!jobId || !services || services.length === 0) {
      return NextResponse.json(
        { error: 'Job ID and services are required' },
        { status: 400 }
      )
    }

    // 1. Hämta jobbet för att få grundpris
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, original_price')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      console.error('Job fetch error:', jobError)
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // 2. Förbered tjänster för insättning
    const servicesToInsert = services.map((service: any) => ({
      job_id: jobId,
      service_id: service.id,
      service_name: service.name,
      service_category: service.category || getCategoryFromId(service.id),
      quantity: service.quantity || 1,
      unit: service.unit || null,
      unit_price: service.price,
      total_price: service.price * (service.quantity || 1),
      rut_eligible: service.rutEligible !== false, // Default true
      added_by: staffName || 'Staff',
      photo_url: service.photoUrl || null,
      notes: service.notes || null,
      metadata: {
        staff_id: staffId,
        original_request: service
      }
    }))

    // 3. Sätt in alla tjänster
    const { data: insertedServices, error: insertError } = await supabase
      .from('job_additional_services')
      .insert(servicesToInsert)
      .select()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to add services' },
        { status: 500 }
      )
    }

    // 4. Hämta uppdaterad total (trigger har redan uppdaterat jobs-tabellen)
    const { data: updatedJob, error: updateError } = await supabase
      .from('jobs')
      .select('final_price, added_services_total')
      .eq('id', jobId)
      .single()

    if (updateError) {
      console.error('Update fetch error:', updateError)
    }

    // 5. Skicka notifikationer till kund
    const totalAddedCost = servicesToInsert.reduce((sum: number, service: any) => 
      sum + service.total_price, 0
    )

    // För nu, skippa notifikationer eftersom vi inte har customer info
    // Detta kan implementeras senare när vi har en bättre struktur
    console.log('Additional services added:', {
      jobId,
      totalAddedCost,
      finalPrice: updatedJob?.final_price
    })

    // 6. Returnera uppdaterad data
    return NextResponse.json({
      success: true,
      jobId,
      services: insertedServices,
      totalAddedCost,
      newTotalPrice: updatedJob?.final_price || 0,
      message: 'Tjänster tillagda och kund notifierad'
    })

  } catch (error) {
    console.error('Error adding services:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Hjälpfunktion för att bestämma kategori från service ID
function getCategoryFromId(serviceId: string): string {
  const categoryMap: Record<string, string> = {
    'tunga-lyft': 'tunga-lyft',
    'proffspackning': 'packning',
    'specialemballering': 'packning',
    'återvinningsvända': 'återvinning',
    'möbelbortforsling': 'återvinning',
    'extra-städ': 'städ',
    'extra-parkering-avstand': 'platsforhallanden',
    'extra-volym': 'volymjustering',
    'flyttkartonger': 'material',
    'packtejp': 'material',
    'plastpåsar': 'material'
  }
  
  for (const [key, category] of Object.entries(categoryMap)) {
    if (serviceId.includes(key)) return category
  }
  
  return 'övrigt'
}

// Hjälpfunktion för SMS (använder befintlig implementation)
async function sendSMS(phone: string, message: string) {
  try {
    const response = await fetch('/api/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: phone, message })
    })
    return response.ok
  } catch (error) {
    console.error('SMS error:', error)
    return false
  }
}

// Hjälpfunktion för Email (använder befintlig implementation)
async function sendEmail(to: string, subject: string, html: string) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html })
    })
    return response.ok
  } catch (error) {
    console.error('Email error:', error)
    return false
  }
}

// Email-mall för tillagda tjänster
// Email-mall behålls för framtida användning
function generateServiceAddedEmail(
  customerName: string,
  serviceType: string,
  services: any[],
  totalAddedCost: number,
  newTotalPrice: number
): string {
  const servicesList = services.map(s => 
    `<li>${s.name} ${s.quantity > 1 ? `x${s.quantity}` : ''}: ${s.price * s.quantity} kr</li>`
  ).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #002A5C; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .services { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .total { font-size: 1.2em; font-weight: bold; color: #002A5C; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Tilläggstjänster - Nordflytt</h1>
        </div>
        <div class="content">
          <p>Hej ${customerName},</p>
          
          <p>Vi har lagt till följande extra tjänster till din ${serviceType}:</p>
          
          <div class="services">
            <h3>Tillagda tjänster:</h3>
            <ul>${servicesList}</ul>
            <p><strong>Totalt tillägg: ${totalAddedCost} kr</strong></p>
          </div>
          
          <p class="total">Ny totalkostnad: ${newTotalPrice} kr</p>
          
          <p>Observera att RUT-avdrag appliceras på slutfakturan där det är tillämpligt.</p>
          
          <p>Har du frågor? Kontakta oss gärna!</p>
          
          <p>Med vänlig hälsning,<br>
          Nordflytt Team<br>
          Tel: 08-123 456 78<br>
          E-post: info@nordflytt.se</p>
        </div>
      </div>
    </body>
    </html>
  `
}