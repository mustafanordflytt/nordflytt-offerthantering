import { NextRequest, NextResponse } from 'next/server'
import { parseLeadFromEmail } from '@/lib/lead-parser'
import { sendEmail } from '@/lib/email'
import { getAuthHeaders } from '@/lib/auth/token-helper'

// SendGrid Inbound Parse webhook format
interface InboundEmail {
  to: string
  from: string
  subject: string
  text?: string
  html?: string
  attachments?: number
  envelope?: {
    to: string[]
    from: string
  }
}

// OpenAI integration för intelligent parsing
async function analyzeEmailContent(email: InboundEmail) {
  const prompt = `
Analysera följande email och avgör om det är en flyttförfrågan. 
Extrahera följande information om möjligt:
- Namn
- Telefonnummer
- Email
- Från-adress
- Till-adress
- Flyttdatum
- Antal rum/storlek
- Speciella önskemål

Email:
Från: ${email.from}
Ämne: ${email.subject}
Innehåll: ${email.text || email.html}

Svara i JSON-format. Om det inte är en flyttförfrågan, returnera { isMovingRequest: false }
`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'Du är en expert på att analysera email och extrahera information om flyttförfrågningar. Svara alltid i JSON-format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      })
    })

    if (!response.ok) {
      throw new Error('OpenAI API error')
    }

    const data = await response.json()
    return JSON.parse(data.choices[0].message.content)
  } catch (error) {
    console.error('Error analyzing email:', error)
    
    // Fallback: enkel regex-baserad analys
    const isMovingKeywords = /flytt|move|bärhjälp|packning|transport/i
    const isMovingRequest = isMovingKeywords.test(email.subject + ' ' + (email.text || ''))
    
    return {
      isMovingRequest,
      name: email.from.match(/^([^<]+)/)?.[1]?.trim(),
      email: email.from.match(/<(.+)>/)?.[1] || email.from,
      phone: (email.text || '').match(/(?:\+46|0)[\s-]?\d{2,3}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/)?.[0],
      notes: email.text || email.html || ''
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verifiera webhook (om SendGrid webhook verification är aktiverat)
    const signature = request.headers.get('x-twilio-email-event-webhook-signature')
    // TODO: Implementera webhook verification om nödvändigt

    const email: InboundEmail = await request.json()
    
    console.log('📧 Received email webhook:', {
      from: email.from,
      subject: email.subject,
      to: email.to
    })

    // Analysera email-innehållet
    const analysis = await analyzeEmailContent(email)
    
    if (!analysis.isMovingRequest) {
      console.log('❌ Not a moving request, ignoring')
      return NextResponse.json({ 
        success: true, 
        processed: false,
        reason: 'Not a moving request'
      })
    }

    // Extrahera email från from-fältet
    const fromEmail = email.from.match(/<(.+)>/)?.[1] || email.from
    const fromName = email.from.match(/^([^<]+)/)?.[1]?.trim() || 'Email Lead'

    // Skapa lead via CRM API
    const leadData = {
      name: analysis.name || fromName,
      email: analysis.email || fromEmail,
      phone: analysis.phone || '',
      source: 'email' as const,
      status: 'new' as const,
      priority: 'high' as const, // Email-leads är ofta högt motiverade
      estimatedValue: 0, // Kan uppdateras senare
      notes: `📧 Email-förfrågan från ${fromEmail}\n\nÄmne: ${email.subject}\n\n${analysis.notes || email.text || email.html || ''}`,
      metadata: {
        emailSubject: email.subject,
        emailFrom: email.from,
        fromAddress: analysis.fromAddress,
        toAddress: analysis.toAddress,
        moveDate: analysis.moveDate,
        roomCount: analysis.roomCount,
        ...analysis
      }
    }

    // Anropa leads API
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const leadResponse = await fetch(`${baseUrl}/api/crm/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders() // Använd system-token för intern kommunikation
      },
      body: JSON.stringify(leadData)
    })

    if (!leadResponse.ok) {
      throw new Error(`Failed to create lead: ${leadResponse.statusText}`)
    }

    const createdLead = await leadResponse.json()
    console.log('✅ Lead created:', createdLead.lead.id)

    // Skicka automatiskt svar till kunden
    try {
      await sendEmail({
        to: fromEmail,
        subject: 'Tack för din flyttförfrågan - Nordflytt',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #002A5C;">Tack för din förfrågan!</h2>
            
            <p>Hej ${analysis.name || 'där'}!</p>
            
            <p>Vi har mottagit din flyttförfrågan och en av våra säljare kommer att kontakta dig inom kort.</p>
            
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Vad händer nu?</h3>
              <ol>
                <li>En säljare granskar din förfrågan</li>
                <li>Vi kontaktar dig för att bekräfta detaljer</li>
                <li>Du får en skräddarsydd offert</li>
              </ol>
            </div>
            
            <p>Om du vill komplettera med mer information kan du göra det via vårt formulär:</p>
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/form" style="display: inline-block; background: #002A5C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Komplettera information</a>
            
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              Med vänliga hälsningar,<br>
              Nordflytt-teamet<br>
              📞 08-123 456 78<br>
              ✉️ info@nordflytt.se
            </p>
          </div>
        `,
        text: `
Tack för din förfrågan!

Hej ${analysis.name || 'där'}!

Vi har mottagit din flyttförfrågan och en av våra säljare kommer att kontakta dig inom kort.

Vad händer nu?
1. En säljare granskar din förfrågan
2. Vi kontaktar dig för att bekräfta detaljer  
3. Du får en skräddarsydd offert

Om du vill komplettera med mer information kan du göra det via vårt formulär:
${process.env.NEXT_PUBLIC_BASE_URL}/form

Med vänliga hälsningar,
Nordflytt-teamet
📞 08-123 456 78
✉️ info@nordflytt.se
        `
      })
      console.log('✅ Auto-reply sent')
    } catch (emailError) {
      console.error('Failed to send auto-reply:', emailError)
      // Fortsätt även om auto-reply misslyckas
    }

    return NextResponse.json({
      success: true,
      processed: true,
      leadId: createdLead.lead.id,
      message: 'Email processed and lead created'
    })

  } catch (error) {
    console.error('❌ Error processing email webhook:', error)
    
    // Logga felet men returnera 200 OK för att undvika att SendGrid försöker igen
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 200 })
  }
}