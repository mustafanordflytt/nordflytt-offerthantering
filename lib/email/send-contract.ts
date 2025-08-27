import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendContractEmailParams {
  to: string
  employeeName: string
  contractNumber: string
  contractPdfUrl: string
  expiryDate: Date
}

export async function sendContractEmail({
  to,
  employeeName,
  contractNumber,
  contractPdfUrl,
  expiryDate
}: SendContractEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Nordflytt HR <hr@nordflytt.se>',
      to: [to],
      subject: `Ditt anställningsavtal - ${contractNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #002A5C; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background-color: #f9f9f9; }
              .button { 
                display: inline-block; 
                padding: 12px 24px; 
                background-color: #002A5C; 
                color: white; 
                text-decoration: none; 
                border-radius: 4px; 
                margin: 20px 0;
              }
              .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
              .warning { background-color: #fff3cd; padding: 10px; border-radius: 4px; margin: 10px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Nordflytt</h1>
                <p>Ditt anställningsavtal är klart</p>
              </div>
              
              <div class="content">
                <h2>Hej ${employeeName}!</h2>
                
                <p>Välkommen till Nordflytt! Ditt anställningsavtal är nu klart för signering.</p>
                
                <p><strong>Avtalsnummer:</strong> ${contractNumber}</p>
                
                <div class="warning">
                  <p>⚠️ <strong>Viktigt:</strong> Detta avtal måste signeras senast ${expiryDate.toLocaleDateString('sv-SE')}.</p>
                </div>
                
                <p>Klicka på knappen nedan för att granska och signera ditt avtal digitalt:</p>
                
                <div style="text-align: center;">
                  <a href="${contractPdfUrl}" class="button">Granska och signera avtal</a>
                </div>
                
                <h3>Vad händer sedan?</h3>
                <ol>
                  <li>Granska avtalet noggrant</li>
                  <li>Signera digitalt med BankID</li>
                  <li>Du får en bekräftelse via e-post</li>
                  <li>HR kontaktar dig för nästa steg i onboardingen</li>
                </ol>
                
                <p>Har du frågor? Kontakta HR på <a href="mailto:hr@nordflytt.se">hr@nordflytt.se</a> eller ring 08-123 456 78.</p>
              </div>
              
              <div class="footer">
                <p>Detta är ett automatiskt meddelande från Nordflytt HR-system.</p>
                <p>Nordflytt AB | Org.nr: 556123-4567 | Stockholm</p>
              </div>
            </div>
          </body>
        </html>
      `
    })

    if (error) {
      throw error
    }

    return { success: true, data }
  } catch (error) {
    console.error('Failed to send contract email:', error)
    throw new Error('Failed to send contract email')
  }
}

// Send reminder email
export async function sendContractReminderEmail({
  to,
  employeeName,
  contractNumber,
  contractPdfUrl,
  daysLeft
}: SendContractEmailParams & { daysLeft: number }) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Nordflytt HR <hr@nordflytt.se>',
      to: [to],
      subject: `Påminnelse: Signera ditt anställningsavtal - ${daysLeft} dagar kvar`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background-color: #f9f9f9; }
              .button { 
                display: inline-block; 
                padding: 12px 24px; 
                background-color: #dc3545; 
                color: white; 
                text-decoration: none; 
                border-radius: 4px; 
                margin: 20px 0;
              }
              .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
              .urgent { background-color: #f8d7da; padding: 10px; border-radius: 4px; margin: 10px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Påminnelse från Nordflytt</h1>
                <p>Ditt avtal väntar på signering</p>
              </div>
              
              <div class="content">
                <h2>Hej ${employeeName}!</h2>
                
                <div class="urgent">
                  <p>🔔 <strong>OBS!</strong> Du har endast ${daysLeft} dagar kvar att signera ditt anställningsavtal.</p>
                </div>
                
                <p>Vi har tidigare skickat ditt anställningsavtal för signering, men vi har ännu inte mottagit din signatur.</p>
                
                <p><strong>Avtalsnummer:</strong> ${contractNumber}</p>
                
                <div style="text-align: center;">
                  <a href="${contractPdfUrl}" class="button">Signera nu</a>
                </div>
                
                <p>Om du har problem med signeringen eller har frågor om avtalet, vänligen kontakta HR omgående.</p>
                
                <p>
                  <strong>Kontakt:</strong><br>
                  E-post: <a href="mailto:hr@nordflytt.se">hr@nordflytt.se</a><br>
                  Telefon: 08-123 456 78
                </p>
              </div>
              
              <div class="footer">
                <p>Detta är en automatisk påminnelse från Nordflytt HR-system.</p>
                <p>Nordflytt AB | Org.nr: 556123-4567 | Stockholm</p>
              </div>
            </div>
          </body>
        </html>
      `
    })

    if (error) {
      throw error
    }

    return { success: true, data }
  } catch (error) {
    console.error('Failed to send reminder email:', error)
    throw new Error('Failed to send reminder email')
  }
}