import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getFortnoxIntegration } from '@/lib/fortnox-integration'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Kör denna endpoint via cron job kl 18:00 varje dag
export async function POST(request: NextRequest) {
  try {
    console.log('🤖 Auto-fakturering startar...')
    
    // Hämta alla oavslutade jobb för dagens datum
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const { data: unfinishedJobs, error } = await supabase
      .from('jobs')
      .select(`
        *,
        bookings (
          customer_name,
          customer_email,
          customer_phone,
          personal_number,
          from_address,
          to_address,
          services,
          booking_number
        )
      `)
      .eq('status', 'active')
      .gte('scheduled_date', today.toISOString())
      .lt('scheduled_date', tomorrow.toISOString())
    
    if (error) throw error
    
    if (!unfinishedJobs || unfinishedJobs.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Inga oavslutade jobb att fakturera' 
      })
    }
    
    console.log(`📋 Hittade ${unfinishedJobs.length} oavslutade jobb`)
    
    const results = {
      processed: 0,
      invoiced: 0,
      failed: 0,
      invoices: [] as any[]
    }
    
    // Processa varje jobb
    for (const job of unfinishedJobs) {
      try {
        results.processed++
        
        // Beräkna faktureringstid
        const hoursToInvoice = calculateInvoiceHours(job)
        
        // Skapa faktura i Fortnox
        const fortnox = getFortnoxIntegration()
        
        const invoiceData = {
          customer: {
            name: job.bookings.customer_name,
            email: job.bookings.customer_email,
            phone: job.bookings.customer_phone,
            personalNumber: job.bookings.personal_number,
            address: job.bookings.to_address,
            city: 'Stockholm',
            zipCode: '11111'
          },
          movingDate: job.scheduled_date,
          fromAddress: job.bookings.from_address,
          toAddress: job.bookings.to_address,
          services: job.bookings.services || [],
          isAutoInvoiced: true,
          autoInvoiceReason: 'Jobb ej avslutat av personal',
          estimatedHours: hoursToInvoice
        }
        
        // Skapa faktura
        const invoiceResult = await createAutoInvoice(job, invoiceData, hoursToInvoice)
        
        if (invoiceResult.success) {
          results.invoiced++
          results.invoices.push({
            jobId: job.id,
            customerName: job.bookings.customer_name,
            invoiceNumber: invoiceResult.invoiceNumber,
            amount: invoiceResult.amount,
            hours: hoursToInvoice
          })
          
          // Uppdatera jobbstatus
          await supabase
            .from('jobs')
            .update({ 
              status: 'auto_invoiced',
              auto_invoiced_at: new Date().toISOString(),
              auto_invoice_hours: hoursToInvoice,
              notes: `Auto-fakturerad ${new Date().toLocaleString('sv-SE')}. ${job.notes || ''}`
            })
            .eq('id', job.id)
          
          // Notifiera personal
          await notifyStaff(job, invoiceResult)
          
        } else {
          results.failed++
          console.error(`❌ Kunde inte fakturera jobb ${job.id}:`, invoiceResult.error)
        }
        
      } catch (jobError) {
        results.failed++
        console.error(`❌ Fel vid processsering av jobb ${job.id}:`, jobError)
      }
    }
    
    // Skicka sammanfattning till admin
    if (results.invoiced > 0) {
      await sendAdminSummary(results)
    }
    
    return NextResponse.json({
      success: true,
      summary: {
        totalJobs: unfinishedJobs.length,
        invoiced: results.invoiced,
        failed: results.failed,
        totalAmount: results.invoices.reduce((sum, inv) => sum + inv.amount, 0)
      },
      invoices: results.invoices
    })
    
  } catch (error) {
    console.error('Auto-invoice error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process auto-invoicing' 
    }, { status: 500 })
  }
}

// Beräkna hur många timmar som ska faktureras
function calculateInvoiceHours(job: any): number {
  // 1. Om vi har tidsspårning som pågått
  const timeTracking = getTimeTrackingData(job.id)
  if (timeTracking && timeTracking.totalHours > 0) {
    // Max av spårad tid eller bokad tid (för att undvika överfakturering)
    return Math.min(timeTracking.totalHours, job.estimated_hours * 1.5)
  }
  
  // 2. Om vi har GPS-data som visar när personal lämnade
  if (job.last_gps_timestamp) {
    const startTime = new Date(job.actual_start_time || job.scheduled_time)
    const endTime = new Date(job.last_gps_timestamp)
    const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
    
    if (hours > 0 && hours < 12) { // Rimlighetskontroll
      return Math.round(hours * 2) / 2 // Avrunda till närmaste halvtimme
    }
  }
  
  // 3. Använd bokad/estimerad tid som fallback
  return job.estimated_hours || 4 // Default 4 timmar om inget annat finns
}

// Hämta tidsspårningsdata från localStorage (simulerat)
function getTimeTrackingData(jobId: string): any {
  // I produktion skulle detta hämtas från databasen
  return null
}

// Skapa faktura med auto-invoice flagga
async function createAutoInvoice(job: any, invoiceData: any, hours: number): Promise<any> {
  try {
    // Här skulle Fortnox-integration ske
    // För demo returnerar vi mock-data
    
    const basePrice = hours * 400 // 400 kr/timme
    const rutDeduction = basePrice * 0.5
    const totalAmount = basePrice - rutDeduction
    
    return {
      success: true,
      invoiceNumber: `AUTO-${job.bookings.booking_number}-${Date.now()}`,
      amount: totalAmount,
      rutAmount: rutDeduction,
      hours: hours
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Notifiera personal om auto-fakturering
async function notifyStaff(job: any, invoiceResult: any): Promise<void> {
  // Skicka SMS/push-notis till ansvarig personal
  const message = `
🤖 Auto-faktura skapad!

Kund: ${job.bookings.customer_name}
Fakturerat: ${invoiceResult.hours} timmar
Belopp: ${invoiceResult.amount} kr

⚠️ Vänligen bekräfta att tiden stämmer senast imorgon kl 12:00.

Öppna appen för att justera om nödvändigt.
`
  
  // Här skulle SMS/push skickas
  console.log(`📱 Notifierar personal:`, message)
}

// Skicka sammanfattning till admin
async function sendAdminSummary(results: any): Promise<void> {
  const summary = `
📊 DAGLIG AUTO-FAKTURERING
========================
Datum: ${new Date().toLocaleDateString('sv-SE')}
Processade jobb: ${results.processed}
Fakturerade: ${results.invoiced}
Misslyckade: ${results.failed}

Fakturor skapade:
${results.invoices.map((inv: any) => 
  `- ${inv.customerName}: ${inv.hours}h = ${inv.amount} kr`
).join('\n')}

Total fakturering: ${results.invoices.reduce((sum: number, inv: any) => sum + inv.amount, 0)} kr

⚠️ Personal har 48h att justera felaktiga tider.
`
  
  // Här skulle e-post skickas till admin
  console.log(`📧 Admin-rapport:`, summary)
}