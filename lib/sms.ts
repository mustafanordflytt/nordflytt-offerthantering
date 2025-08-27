import twilio from 'twilio'

interface SMSConfig {
  to: string
  bookingId: string
  bookingRef: string
  customerName: string
}

interface OrderConfirmationSMSConfig {
  to: string
  bookingId: string
  bookingRef: string
  customerName: string
  moveDate: string
  moveTime: string
  services: string[]
  totalPrice: string
  kubikMeter: string
  confirmationUrl: string
}

export async function sendBookingSMS(config: SMSConfig) {
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )

    // Normalisera telefonnummer
    const normalizedPhone = config.to.replace(/\s+/g, '').replace(/^0/, '+46')
    
    const offerLink = `${process.env.NEXT_PUBLIC_BASE_URL}/offer/${config.bookingId}`
    
    // Engagerande SMS-innehåll med naturliga radbrytningar
    const smsContent = `Hej ${config.customerName}! 🎉

Din offert från Nordflytt är klar.

📄 Granska och godkänn den här:
👉 ${offerLink}

Godkänn och din bokning bekräftas direkt.

Vänliga hälsningar, Nordflytt 🚛💨`

    const message = await client.messages.create({
      body: smsContent,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
      to: normalizedPhone,
    })

    console.log('[SMS] SMS framgångsrikt skickat till', normalizedPhone)
    return { success: true, messageId: message.sid }
  } catch (error) {
    console.error('[SMS] Fel vid SMS-utskick:', error)
    return { success: false, error }
  }
}

export async function sendOrderConfirmationSMS(config: OrderConfirmationSMSConfig) {
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )

    // Normalisera telefonnummer
    const normalizedPhone = config.to.replace(/\s+/g, '').replace(/^0/, '+46')
    
    // Bekräftelse-SMS med alla viktiga detaljer
    const smsContent = `🎉 Din flytt är bokad!

Hej ${config.customerName}! 

✅ Bokning bekräftad
📋 Bokningsnummer: ${config.bookingRef}
📅 Datum: ${config.moveDate} kl ${config.moveTime}

📦 Bokade tjänster: ${config.services.join(", ")}
📏 Volym: ${config.kubikMeter} m³
💰 Totalpris: ${config.totalPrice} kr (efter RUT-avdrag)

🔗 Se bekräftelse och detaljer:
${config.confirmationUrl}

Din flytt är nu bekräftad. Vi kommer i tid och är redo att hjälpa dig!

Tack för att du valde Nordflytt! 🚛✨`

    const message = await client.messages.create({
      body: smsContent,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
      to: normalizedPhone,
    })

    console.log('[ORDER SMS] Order confirmation SMS framgångsrikt skickat till', normalizedPhone)
    return { success: true, messageId: message.sid }
  } catch (error) {
    console.error('[ORDER SMS] Fel vid order confirmation SMS-utskick:', error)
    return { success: false, error }
  }
}