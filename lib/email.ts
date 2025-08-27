// lib/email.ts - Desktop-kompatibel Email med Rosa Länk-box
import sgMail from '@sendgrid/mail';

// Konfigurera SendGrid direkt vid import
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('[EMAIL] SendGrid API key loaded successfully');
} else {
  console.error('[EMAIL] SENDGRID_API_KEY is missing from environment variables!');
}

interface EmailConfig {
  to: string
  bookingId: string
  bookingRef: string
  customerName: string
}

interface OrderConfirmationConfig {
  to: string
  bookingId: string
  bookingRef: string
  customerName: string
  moveDate: string
  moveTime: string
  startAddress: string
  endAddress: string
  services: string[]
  totalPrice: string
  kubikMeter: string
  confirmationUrl: string
}

interface ContractEmailConfig {
  to: string
  employeeName: string
  contractType: string
  hourlyRate: string
  signingUrl: string
  expiryDays: number
}

export async function sendBookingConfirmation({
  to,
  bookingId,
  bookingRef,
  customerName
}: EmailConfig) {
  try {
    // Kontrollera att API-nyckel finns
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY is not configured');
    }

    // Generate confirmation token (in production, use a secure token)
    const confirmationToken = Buffer.from(`${bookingId}:${Date.now()}`).toString('base64');
    const offerLink = `${process.env.NEXT_PUBLIC_BASE_URL}/offer/${bookingId}`;
    const confirmationLink = `${process.env.NEXT_PUBLIC_BASE_URL}/api/confirm-booking?id=${bookingId}&token=${confirmationToken}`;

    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'hej@nordflytt.se',
      subject: `🏠 Din offert är klar (${bookingRef})`,
      text: `
Hej ${customerName}! 👋

Tack för din bokningsförfrågan till Nordflytt!

✅ Din offert är nu klar och väntar på dig
📋 Referensnummer: ${bookingRef}

👀 Se din offert: ${offerLink}
✅ Acceptera direkt: ${confirmationLink}

Vad händer nu?
1. Klicka på länken för att se din offert
2. Granska alla detaljer noggrant  
3. Godkänn och din flytt bokas direkt

Har du frågor? Vi hjälper gärna!
📞 Ring oss: 010-555 1289
📧 Email: hej@nordflytt.se

Med vänliga hälsningar,
Teamet på Nordflytt 📦
      `,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Din offert från Nordflytt</title>
          <!--[if mso]>
          <noscript>
            <xml>
              <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
            </xml>
          </noscript>
          <![endif]-->
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: white; margin: 0 auto;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #0086c9; padding: 30px 20px; text-align: center;">
                      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">📦 Nordflytt</h1>
                      <p style="color: #bfdbfe; margin: 10px 0 0 0; font-size: 16px;">Din professionella flyttpartner</p>
                    </td>
                  </tr>

                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 30px 20px;">
                      
                      <!-- Greeting -->
                      <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                        Hej ${customerName}! 👋
                      </h2>
                      
                      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                        Tack för din bokningsförfrågan till Nordflytt! Vi har tagit fram ett personligt offertförslag till dig.
                      </p>

                      <!-- Status Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ecfdf5; border: 2px solid #10b981; margin: 25px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td>
                                  <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 18px;">✅ Din offert är klar!</h3>
                                  <p style="color: #047857; margin: 0; font-size: 14px;">
                                    📋 <strong>Referensnummer:</strong> ${bookingRef}
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- Rosa Link Box för Desktop -->
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fce7f3; border: 2px solid #ff5888; margin: 20px 0;">
                        <tr>
                          <td style="padding: 20px; text-align: center;">
                            <p style="color: #831843; font-weight: bold; margin: 0 0 10px 0;">🔗 Klicka här för att se din offert:</p>
                            <a href="${offerLink}" style="color: #0086c9; font-weight: bold; text-decoration: underline; word-break: break-all; font-size: 14px;">${offerLink}</a>
                          </td>
                        </tr>
                      </table>

                      <!-- CTA Buttons -->
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="padding: 30px 0 15px 0;">
                            <!--[if mso]>
                            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${offerLink}" style="height:50px;v-text-anchor:middle;width:300px;" arcsize="16%" strokecolor="#0086c9" fillcolor="#0086c9">
                              <w:anchorlock/>
                              <center style="color:#ffffff;font-family:Arial, sans-serif;font-size:16px;font-weight:bold;">👀 Se din offert</center>
                            </v:roundrect>
                            <![endif]-->
                            <!--[if !mso]><!-->
                            <a href="${offerLink}" style="display: inline-block; background-color: #0086c9; color: white; text-decoration: none; padding: 15px 30px; font-weight: bold; font-size: 16px; border-radius: 8px;">👀 Se din offert</a>
                            <!--<![endif]-->
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="padding: 0 0 30px 0;">
                            <!--[if mso]>
                            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${confirmationLink}" style="height:50px;v-text-anchor:middle;width:300px;" arcsize="16%" strokecolor="#ff5888" fillcolor="#ff5888">
                              <w:anchorlock/>
                              <center style="color:#ffffff;font-family:Arial, sans-serif;font-size:16px;font-weight:bold;">✅ Acceptera och boka direkt</center>
                            </v:roundrect>
                            <![endif]-->
                            <!--[if !mso]><!-->
                            <a href="${confirmationLink}" style="display: inline-block; background-color: #ff5888; color: white; text-decoration: none; padding: 15px 30px; font-weight: bold; font-size: 16px; border-radius: 8px;">✅ Acceptera och boka direkt</a>
                            <!--<![endif]-->
                          </td>
                        </tr>
                      </table>

                      <!-- Steps -->
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; margin: 25px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">📋 Så här går du vidare:</h3>
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td style="padding: 6px 0;">
                                  <span style="color: #0086c9; font-weight: bold;">1.</span>
                                  <span style="color: #4b5563; margin-left: 8px;">Klicka på knappen eller länken för att se din offert</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 6px 0;">
                                  <span style="color: #0086c9; font-weight: bold;">2.</span>
                                  <span style="color: #4b5563; margin-left: 8px;">Granska alla detaljer noggrant</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 6px 0;">
                                  <span style="color: #0086c9; font-weight: bold;">3.</span>
                                  <span style="color: #4b5563; margin-left: 8px;">Godkänn och din bokning bekräftas direkt</span>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- Contact Info -->
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top: 1px solid #e5e7eb; margin-top: 30px;">
                        <tr>
                          <td style="padding-top: 20px;">
                            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">❓ Har du frågor? Vi hjälper gärna!</h3>
                            <p style="color: #6b7280; font-size: 14px; margin: 8px 0;">📞 <strong>Ring oss:</strong> 010-555 1289</p>
                            <p style="color: #6b7280; font-size: 14px; margin: 8px 0;">📧 <strong>Email:</strong> hej@nordflytt.se</p>
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 12px; margin: 0;">
                        Med vänliga hälsningar,<br>
                        <strong>Teamet på Nordflytt</strong> 📦
                      </p>
                      <p style="color: #9ca3af; font-size: 11px; margin: 10px 0 0 0;">
                        Detta är ett automatiskt meddelande. Vänligen svara inte på detta mail.
                      </p>
                      <p style="color: #9ca3af; font-size: 11px; margin: 5px 0 0 0;">
                        © 2025 Nordflytt. Alla rättigheter förbehållna.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    };

    console.log('[EMAIL] Attempting to send email to:', to);
    const result = await sgMail.send(msg);
    console.log('[EMAIL] E-post framgångsrikt skickad till', to);
    console.log('[EMAIL] SendGrid response status:', result[0]?.statusCode);
        
    return {
      success: true,
      messageId: result[0]?.headers['x-message-id'] || 'unknown'
    };
  } catch (error) {
    console.error('[EMAIL] Fel vid e-postutskick:', error);
        
    // Mer detaljerad felhantering
    if (error && typeof error === 'object' && 'response' in error) {
      const sgError = error as any;
      console.error('[EMAIL] SendGrid error details:', {
        statusCode: sgError.response?.status,
        body: sgError.response?.body
      });
    }
        
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email error'
    };
  }
}

export async function sendOrderConfirmation({
  to,
  bookingId,
  bookingRef,
  customerName,
  moveDate,
  moveTime,
  startAddress,
  endAddress,
  services,
  totalPrice,
  kubikMeter,
  confirmationUrl
}: OrderConfirmationConfig) {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY is not configured');
    }

    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'hej@nordflytt.se',
      subject: `🎉 Bokningsbekräftelse - Din flytt är bekräftad! (${bookingRef})`,
      text: `
Hej ${customerName}! 🎉

Tack för din bokning! Vi bekräftar att din flytt nu är bokad.

✅ Bokningsnummer: ${bookingRef}
📅 Datum & Tid: ${moveDate} kl ${moveTime}
📦 Bokade tjänster: ${services.join(", ")}
📍 Från: ${startAddress}
📍 Till: ${endAddress}
📏 Volym: ${kubikMeter} m³
💰 Totalpris: ${totalPrice} kr (efter RUT-avdrag)

🔗 Se bekräftelse: ${confirmationUrl}

Din flytt är nu bekräftad. Vi kommer i tid och är redo att hjälpa dig!

Frågor? Kontakta oss:
📞 Ring: 010-555 1289
📧 Email: hej@nordflytt.se

Med vänliga hälsningar,
Teamet på Nordflytt 📦
      `,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bokningsbekräftelse från Nordflytt</title>
          <!--[if mso]>
          <noscript>
            <xml>
              <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
            </xml>
          </noscript>
          <![endif]-->
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: white; margin: 0 auto;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #0086c9; padding: 30px 20px; text-align: center;">
                      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🎉 Nordflytt</h1>
                      <p style="color: #bfdbfe; margin: 10px 0 0 0; font-size: 16px;">Din flytt är bekräftad!</p>
                    </td>
                  </tr>

                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 30px 20px;">
                      
                      <!-- Greeting -->
                      <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                        Hej ${customerName}! 🎉
                      </h2>
                      
                      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                        Tack för din bokning! Vi bekräftar att din flytt nu är bokad och vi ser fram emot att hjälpa dig.
                      </p>

                      <!-- Booking Details Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ecfdf5; border: 2px solid #10b981; margin: 25px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td>
                                  <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 18px;">✅ Bokningsbekräftelse</h3>
                                  
                                  <p style="color: #047857; font-size: 14px; margin: 8px 0;">
                                    <strong>📋 Bokningsnummer:</strong> ${bookingRef}
                                  </p>
                                  <p style="color: #047857; font-size: 14px; margin: 8px 0;">
                                    <strong>📅 Datum & Tid:</strong> ${moveDate} kl ${moveTime}
                                  </p>
                                  <p style="color: #047857; font-size: 14px; margin: 8px 0;">
                                    <strong>📦 Bokade tjänster:</strong> ${services.join(", ")}
                                  </p>
                                  <p style="color: #047857; font-size: 14px; margin: 8px 0;">
                                    <strong>📍 Från:</strong> ${startAddress}
                                  </p>
                                  <p style="color: #047857; font-size: 14px; margin: 8px 0;">
                                    <strong>📍 Till:</strong> ${endAddress}
                                  </p>
                                  <p style="color: #047857; font-size: 14px; margin: 8px 0;">
                                    <strong>📏 Volym:</strong> ${kubikMeter} m³
                                  </p>
                                  <p style="color: #047857; font-size: 14px; margin: 8px 0;">
                                    <strong>💰 Totalpris:</strong> ${totalPrice} kr <span style="font-size: 12px; color: #059669;">(efter RUT-avdrag)</span>
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- Rosa Link Box för Desktop -->
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fce7f3; border: 2px solid #ff5888; margin: 20px 0;">
                        <tr>
                          <td style="padding: 20px; text-align: center;">
                            <p style="color: #831843; font-weight: bold; margin: 0 0 10px 0;">📋 Se din bokningsbekräftelse:</p>
                            <a href="${confirmationUrl}" style="color: #0086c9; font-weight: bold; text-decoration: underline; word-break: break-all; font-size: 14px;">${confirmationUrl}</a>
                          </td>
                        </tr>
                      </table>

                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="padding: 30px 0;">
                            <!--[if mso]>
                            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${confirmationUrl}" style="height:50px;v-text-anchor:middle;width:300px;" arcsize="16%" strokecolor="#ff5888" fillcolor="#ff5888">
                              <w:anchorlock/>
                              <center style="color:#ffffff;font-family:Arial, sans-serif;font-size:16px;font-weight:bold;">📋 Se din bokningsbekräftelse</center>
                            </v:roundrect>
                            <![endif]-->
                            <!--[if !mso]><!-->
                            <a href="${confirmationUrl}" style="display: inline-block; background-color: #ff5888; color: white; text-decoration: none; padding: 15px 30px; font-weight: bold; font-size: 16px; border-radius: 8px;">📋 Se din bokningsbekräftelse</a>
                            <!--<![endif]-->
                          </td>
                        </tr>
                      </table>

                      <!-- What happens next -->
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; margin: 25px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">📋 Vad händer nu?</h3>
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td style="padding: 6px 0;">
                                  <span style="color: #0086c9; font-weight: bold;">1.</span>
                                  <span style="color: #4b5563; margin-left: 8px;">Din flytt är nu bekräftad. Vi kommer i tid och är redo att hjälpa dig!</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 6px 0;">
                                  <span style="color: #0086c9; font-weight: bold;">2.</span>
                                  <span style="color: #4b5563; margin-left: 8px;">Vårt team kommer till din adress vid överenskommen tid</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 6px 0;">
                                  <span style="color: #0086c9; font-weight: bold;">3.</span>
                                  <span style="color: #4b5563; margin-left: 8px;">Vi sköter hela flytten smidigt och professionellt</span>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- Contact Info -->
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top: 1px solid #e5e7eb; margin-top: 30px;">
                        <tr>
                          <td style="padding-top: 20px;">
                            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">❓ Frågor eller ändringar?</h3>
                            <p style="color: #6b7280; font-size: 14px; margin: 8px 0;">📞 <strong>Ring oss:</strong> 010-555 1289</p>
                            <p style="color: #6b7280; font-size: 14px; margin: 8px 0;">📧 <strong>Email:</strong> hej@nordflytt.se</p>
                            <p style="color: #6b7280; font-size: 14px; margin: 8px 0;">📋 <strong>Referera till:</strong> Bokningsnummer ${bookingRef}</p>
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 12px; margin: 0;">
                        Tack för att du valde Nordflytt!<br>
                        <strong>Vi ses på flyttdagen</strong> 🚛✨
                      </p>
                      <p style="color: #9ca3af; font-size: 11px; margin: 10px 0 0 0;">
                        © 2025 Nordflytt. Alla rättigheter förbehållna.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    };

    console.log('[ORDER EMAIL] Attempting to send order confirmation email to:', to);
    const result = await sgMail.send(msg);
    console.log('[ORDER EMAIL] Order confirmation email sent successfully to', to);
    console.log('[ORDER EMAIL] SendGrid response status:', result[0]?.statusCode);
        
    return {
      success: true,
      messageId: result[0]?.headers['x-message-id'] || 'unknown'
    };
  } catch (error) {
    console.error('[ORDER EMAIL] Error sending order confirmation email:', error);
        
    if (error && typeof error === 'object' && 'response' in error) {
      const sgError = error as any;
      console.error('[ORDER EMAIL] SendGrid error details:', {
        statusCode: sgError.response?.status,
        body: sgError.response?.body
      });
    }
        
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email error'
    };
  }
}

export async function sendAssetDocumentEmail({
  to,
  employeeName,
  documentId,
  signingUrl,
  totalItems,
  totalCost
}: {
  to: string
  employeeName: string
  documentId: string
  signingUrl: string
  totalItems: number
  totalCost: string
}) {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY is not configured');
    }

    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'hej@nordflytt.se',
      subject: `📦 Signera tillgångsförteckning - ${employeeName}`,
      text: `
Hej ${employeeName}! 👋

Du har tilldelats nya tillgångar från Nordflytt. 
Vänligen signera tillgångsförteckningen för att bekräfta mottagandet.

📋 Dokumentdetaljer:
- Dokument-ID: ${documentId}
- Antal tillgångar: ${totalItems} st
- Totalt värde: ${totalCost}

🔗 Signera här: ${signingUrl}

⚠️ Viktigt att komma ihåg:
• Kontrollera att alla listade tillgångar stämmer
• Du ansvarar för tillgångarna tills återlämning
• Rapportera skador eller förluster omedelbart
• Tillgångarna ska återlämnas vid anställningens slut

Frågor? Kontakta din chef eller HR-avdelningen.

Med vänliga hälsningar,
Nordflytt 📦
      `,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Tillgångsförteckning från Nordflytt</title>
          <!--[if mso]>
          <noscript>
            <xml>
              <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
            </xml>
          </noscript>
          <![endif]-->
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: white; margin: 0 auto;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #002A5C; padding: 30px 20px; text-align: center;">
                      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">📦 Nordflytt</h1>
                      <p style="color: #bfdbfe; margin: 10px 0 0 0; font-size: 16px;">Tillgångsförteckning för signering</p>
                    </td>
                  </tr>

                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 30px 20px;">
                      
                      <!-- Greeting -->
                      <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                        Hej ${employeeName}! 👋
                      </h2>
                      
                      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                        Du har tilldelats nya tillgångar från Nordflytt. Vänligen granska och signera tillgångsförteckningen för att bekräfta att du har mottagit alla artiklar.
                      </p>

                      <!-- Document Details Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ecfdf5; border: 2px solid #10b981; margin: 25px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td>
                                  <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 18px;">📋 Dokumentdetaljer</h3>
                                  <p style="color: #047857; margin: 0; font-size: 14px;">
                                    📝 <strong>Dokument-ID:</strong> ${documentId}
                                  </p>
                                  <p style="color: #047857; margin: 8px 0 0 0; font-size: 14px;">
                                    📦 <strong>Antal tillgångar:</strong> ${totalItems} st
                                  </p>
                                  <p style="color: #047857; margin: 8px 0 0 0; font-size: 14px;">
                                    💰 <strong>Totalt värde:</strong> ${totalCost}
                                  </p>
                                  <p style="color: #047857; margin: 8px 0 0 0; font-size: 14px;">
                                    👤 <strong>Mottagare:</strong> ${employeeName}
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- Rosa Link Box för Desktop -->
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fce7f3; border: 2px solid #ff5888; margin: 20px 0;">
                        <tr>
                          <td style="padding: 20px; text-align: center;">
                            <p style="color: #831843; font-weight: bold; margin: 0 0 10px 0;">✍️ Signera tillgångsförteckning:</p>
                            <a href="${signingUrl}" style="color: #0086c9; font-weight: bold; text-decoration: underline; word-break: break-all; font-size: 14px;">${signingUrl}</a>
                          </td>
                        </tr>
                      </table>

                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="padding: 30px 0;">
                            <!--[if mso]>
                            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${signingUrl}" style="height:50px;v-text-anchor:middle;width:300px;" arcsize="16%" strokecolor="#ff5888" fillcolor="#ff5888">
                              <w:anchorlock/>
                              <center style="color:#ffffff;font-family:Arial, sans-serif;font-size:16px;font-weight:bold;">✍️ Signera Tillgångsförteckning</center>
                            </v:roundrect>
                            <![endif]-->
                            <!--[if !mso]><!-->
                            <a href="${signingUrl}" style="display: inline-block; background-color: #ff5888; color: white; text-decoration: none; padding: 15px 30px; font-weight: bold; font-size: 16px; border-radius: 8px;">✍️ Signera Tillgångsförteckning</a>
                            <!--<![endif]-->
                          </td>
                        </tr>
                      </table>

                      <!-- Important Notice -->
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fef2f2; border: 2px solid #f59e0b; margin: 25px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <h3 style="color: #dc2626; margin: 0 0 10px 0; font-size: 16px;">⚠️ Viktigt att komma ihåg</h3>
                            <ul style="color: #991b1b; margin: 0; font-size: 14px; padding-left: 20px;">
                              <li>Kontrollera att alla listade tillgångar stämmer</li>
                              <li>Du ansvarar för alla tillgångar tills de återlämnas</li>
                              <li>Rapportera skador eller förluster omedelbart</li>
                              <li>Tillgångarna ska återlämnas vid anställningens slut</li>
                            </ul>
                          </td>
                        </tr>
                      </table>

                      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                        Om du har några frågor, kontakta din chef eller HR-avdelningen.
                      </p>

                      <!-- Contact Info -->
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top: 1px solid #e5e7eb; margin-top: 30px;">
                        <tr>
                          <td style="padding-top: 20px;">
                            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">❓ Frågor om tillgångarna?</h3>
                            <p style="color: #6b7280; font-size: 14px; margin: 8px 0;">📞 <strong>Ring:</strong> 010-555 1289</p>
                            <p style="color: #6b7280; font-size: 14px; margin: 8px 0;">📧 <strong>Email:</strong> hej@nordflytt.se</p>
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 12px; margin: 0;">
                        Med vänliga hälsningar,<br>
                        <strong>Nordflytt Administration</strong> 📦
                      </p>
                      <p style="color: #9ca3af; font-size: 11px; margin: 10px 0 0 0;">
                        Detta är ett automatiskt meddelande. Svara inte på detta mail.
                      </p>
                      <p style="color: #9ca3af; font-size: 11px; margin: 5px 0 0 0;">
                        © 2025 Nordflytt. Alla rättigheter förbehållna.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    };

    console.log('[ASSET EMAIL] Attempting to send asset document email to:', to);
    const result = await sgMail.send(msg);
    console.log('[ASSET EMAIL] Asset document email sent successfully to', to);
    console.log('[ASSET EMAIL] SendGrid response status:', result[0]?.statusCode);
        
    return {
      success: true,
      messageId: result[0]?.headers['x-message-id'] || 'unknown'
    };
  } catch (error) {
    console.error('[ASSET EMAIL] Error sending asset document email:', error);
        
    if (error && typeof error === 'object' && 'response' in error) {
      const sgError = error as any;
      console.error('[ASSET EMAIL] SendGrid error details:', {
        statusCode: sgError.response?.status,
        body: sgError.response?.body
      });
    }
        
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown asset email error'
    };
  }
}

export async function sendContractEmail({
  to,
  employeeName,
  contractType,
  hourlyRate,
  signingUrl,
  expiryDays
}: ContractEmailConfig) {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY is not configured');
    }

    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'hej@nordflytt.se',
      subject: `📋 Anställningsavtal Nordflytt - Signering krävs`,
      text: `
Hej ${employeeName}! 👋

Välkommen till Nordflytt-teamet!

📋 Ditt anställningsavtal för ${contractType} (${hourlyRate} kr/h) väntar på signering.

🔗 Signera ditt avtal här: ${signingUrl}

⏰ Viktigt: Avtalet måste signeras inom ${expiryDays} dagar.

Efter signering kommer du få tillgång till:
• Arbetskläder och utrustning
• Systemåtkomst och inloggning
• Säkerhetsutbildning
• Fordonsbehörighet (om tillämpligt)

Frågor? Kontakta HR:
📞 Ring: 010-555 1289
📧 Email: hr@nordflytt.se

Med vänliga hälsningar,
Nordflytt HR-avdelningen 📦
      `,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Anställningsavtal från Nordflytt</title>
          <!--[if mso]>
          <noscript>
            <xml>
              <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
            </xml>
          </noscript>
          <![endif]-->
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: white; margin: 0 auto;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #0086c9; padding: 30px 20px; text-align: center;">
                      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">📋 Nordflytt</h1>
                      <p style="color: #bfdbfe; margin: 10px 0 0 0; font-size: 16px;">Anställningsavtal väntar</p>
                    </td>
                  </tr>

                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 30px 20px;">
                      
                      <!-- Greeting -->
                      <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                        Hej ${employeeName}! 👋
                      </h2>
                      
                      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                        Välkommen till Nordflytt-teamet! Vi är glada att ha dig ombord.
                      </p>

                      <!-- Contract Details Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fef3c7; border: 2px solid #f59e0b; margin: 25px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td>
                                  <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px;">📋 Ditt anställningsavtal väntar</h3>
                                  <p style="color: #a16207; margin: 0; font-size: 14px;">
                                    📝 <strong>Position:</strong> ${contractType}
                                  </p>
                                  <p style="color: #a16207; margin: 8px 0 0 0; font-size: 14px;">
                                    💰 <strong>Timlön:</strong> ${hourlyRate} kr/h
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- Rosa Link Box för Desktop -->
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fce7f3; border: 2px solid #ff5888; margin: 20px 0;">
                        <tr>
                          <td style="padding: 20px; text-align: center;">
                            <p style="color: #831843; font-weight: bold; margin: 0 0 10px 0;">🔗 Signera ditt avtal här:</p>
                            <a href="${signingUrl}" style="color: #0086c9; font-weight: bold; text-decoration: underline; word-break: break-all; font-size: 14px;">${signingUrl}</a>
                          </td>
                        </tr>
                      </table>

                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="padding: 30px 0;">
                            <!--[if mso]>
                            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${signingUrl}" style="height:50px;v-text-anchor:middle;width:300px;" arcsize="16%" strokecolor="#ff5888" fillcolor="#ff5888">
                              <w:anchorlock/>
                              <center style="color:#ffffff;font-family:Arial, sans-serif;font-size:16px;font-weight:bold;">📋 Signera anställningsavtal</center>
                            </v:roundrect>
                            <![endif]-->
                            <!--[if !mso]><!-->
                            <a href="${signingUrl}" style="display: inline-block; background-color: #ff5888; color: white; text-decoration: none; padding: 15px 30px; font-weight: bold; font-size: 16px; border-radius: 8px;">📋 Signera anställningsavtal</a>
                            <!--<![endif]-->
                          </td>
                        </tr>
                      </table>

                      <!-- Important Notice -->
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fef2f2; border: 2px solid #ef4444; margin: 25px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <h3 style="color: #dc2626; margin: 0 0 10px 0; font-size: 16px;">⏰ Viktigt!</h3>
                            <p style="color: #991b1b; margin: 0; font-size: 14px;">
                              Avtalet måste signeras inom <strong>${expiryDays} dagar</strong> för att din anställning ska träda i kraft.
                            </p>
                          </td>
                        </tr>
                      </table>

                      <!-- Next Steps -->
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; margin: 25px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">🎯 Efter signering får du tillgång till:</h3>
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td style="padding: 6px 0;">
                                  <span style="color: #0086c9; font-weight: bold;">👕</span>
                                  <span style="color: #4b5563; margin-left: 8px;">Arbetskläder och utrustning</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 6px 0;">
                                  <span style="color: #0086c9; font-weight: bold;">💻</span>
                                  <span style="color: #4b5563; margin-left: 8px;">Systemåtkomst och inloggning</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 6px 0;">
                                  <span style="color: #0086c9; font-weight: bold;">🛡️</span>
                                  <span style="color: #4b5563; margin-left: 8px;">Säkerhetsutbildning</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 6px 0;">
                                  <span style="color: #0086c9; font-weight: bold;">🚛</span>
                                  <span style="color: #4b5563; margin-left: 8px;">Fordonsbehörighet (om tillämpligt)</span>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- Contact Info -->
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top: 1px solid #e5e7eb; margin-top: 30px;">
                        <tr>
                          <td style="padding-top: 20px;">
                            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">❓ Frågor om ditt avtal?</h3>
                            <p style="color: #6b7280; font-size: 14px; margin: 8px 0;">📞 <strong>Ring HR:</strong> 010-555 1289</p>
                            <p style="color: #6b7280; font-size: 14px; margin: 8px 0;">📧 <strong>Email:</strong> hr@nordflytt.se</p>
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 12px; margin: 0;">
                        Välkommen till teamet!<br>
                        <strong>Nordflytt HR-avdelningen</strong> 📦
                      </p>
                      <p style="color: #9ca3af; font-size: 11px; margin: 10px 0 0 0;">
                        Detta är ett automatiskt meddelande. Svara inte på detta mail.
                      </p>
                      <p style="color: #9ca3af; font-size: 11px; margin: 5px 0 0 0;">
                        © 2025 Nordflytt. Alla rättigheter förbehållna.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    };

    console.log('[CONTRACT EMAIL] Attempting to send contract email to:', to);
    const result = await sgMail.send(msg);
    console.log('[CONTRACT EMAIL] Contract email sent successfully to', to);
    console.log('[CONTRACT EMAIL] SendGrid response status:', result[0]?.statusCode);
        
    return {
      success: true,
      messageId: result[0]?.headers['x-message-id'] || 'unknown'
    };
  } catch (error) {
    console.error('[CONTRACT EMAIL] Error sending contract email:', error);
        
    if (error && typeof error === 'object' && 'response' in error) {
      const sgError = error as any;
      console.error('[CONTRACT EMAIL] SendGrid error details:', {
        statusCode: sgError.response?.status,
        body: sgError.response?.body
      });
    }
        
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown contract email error'
    };
  }
}

export async function sendVehicleCodeEmail({
  to,
  employeeName,
  vehicleCode,
  expiryDate
}: {
  to: string
  employeeName: string
  vehicleCode: string
  expiryDate: Date
}) {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY is not configured');
    }

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('sv-SE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'hej@nordflytt.se',
      subject: `KONFIDENTIELLT: KeyGarage 787 Fordonskod - ${employeeName}`,
      text: `
Hej ${employeeName}!

Din personliga 6-siffriga kod för KeyGarage 787 kodlås:

🔑 KOD: ${vehicleCode}
📅 Giltig till: ${formatDate(expiryDate)}

📍 VAR HITTAR DU LÅSBOXEN?
Kodlåset sitter vid VÄNSTER BAKDÄCK på lastbilen, vid skärmen.

🔑 SÅ HÄR ANVÄNDER DU DET:
1. Gå till lastbilen, hitta kodlåset vid vänster bakdäck
2. Slå in din 6-siffriga kod: ${vehicleCode}
3. Låsboxen öppnar sig automatiskt
4. Ta fordonsnycklarna från boxen
5. Stäng låsboxen (låser sig automatiskt)

⚠️ VIKTIGT - STRIKT KONFIDENTIELL
• Dela ALDRIG denna kod med andra personer
• All användning loggas i ABUS KeyGarage 787 systemet
• Du har fullt personligt ansvar för skador vid din kodanvändning
• Otillåten delning leder till omedelbar uppsägning

⏰ ÅTKOMSTTIDER: 06:00 - 23:00 dagligen

📞 Support: hej@nordflytt.se

Med vänliga hälsningar,
Nordflytt AB 🚗

RADERA DETTA MEDDELANDE efter säker anteckning av koden.
      `,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            .code-box {
              background: #ffffff;
              border: 3px solid #22c55e;
              padding: 25px;
              text-align: center;
              margin: 25px 0;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .warning-box {
              background: #fee2e2;
              border-left: 5px solid #dc2626;
              padding: 20px;
              margin: 20px 0;
            }
            .location-box {
              background: #dbeafe;
              border: 2px solid #3b82f6;
              padding: 20px;
              margin: 20px 0;
              border-radius: 8px;
            }
          </style>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          
          <div style="background: #1e40af; color: white; padding: 25px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🚗 KeyGarage 787 Fordonskod</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Nordflytt AB - Fordonsåtkomst</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
            
            <h2 style="color: #334155;">Hej ${employeeName}!</h2>
            
            <p>Din personliga 6-siffriga kod för KeyGarage 787 kodlås:</p>
            
            <div class="code-box">
              <h2 style="color: #22c55e; font-size: 42px; font-family: monospace; margin: 0; letter-spacing: 3px;">
                ${vehicleCode}
              </h2>
              <p style="margin: 15px 0 5px 0; color: #666; font-size: 16px;">Din personliga 6-siffriga kod</p>
              <p style="margin: 0; color: #888; font-size: 14px;">Giltig till: ${formatDate(expiryDate)}</p>
            </div>
            
            <div class="location-box">
              <h3 style="color: #1e40af; margin-top: 0;">📍 VAR HITTAR DU LÅSBOXEN?</h3>
              <div style="text-align: center; margin: 15px 0;">
                <div style="background: #ffffff; border: 1px solid #ccc; border-radius: 8px; padding: 15px; display: inline-block; max-width: 300px;">
                  <div style="font-size: 20px; margin-bottom: 10px;">🚛</div>
                  <div style="border: 2px solid #dc2626; padding: 8px; border-radius: 4px; background: #fee2e2; margin: 10px;">
                    <strong style="color: #dc2626;">📦 LÅSBOX HÄR</strong>
                  </div>
                  <p style="margin: 5px 0; font-size: 14px; color: #666;">Vänster bakdäck</p>
                  <p style="margin: 0; font-size: 12px; color: #888;">Vid skärmen på lastbilen</p>
                </div>
              </div>
              <p style="text-align: center; margin: 10px 0 0 0; color: #1e40af;">
                <strong>Leta efter kodlåset vid vänster bakdäck, vid skärmen!</strong>
              </p>
            </div>
            
            <div class="warning-box">
              <h3 style="color: #dc2626; margin-top: 0; font-size: 18px;">🔒 SEKRETESS & ANSVAR</h3>
              <ul style="color: #7f1d1d; padding-left: 20px; line-height: 1.6;">
                <li><strong>STRIKT KONFIDENTIELL</strong> - Dela ALDRIG med andra personer</li>
                <li><strong>All användning loggas</strong> i ABUS KeyGarage 787 systemet</li>
                <li><strong>Fullt personligt ansvar</strong> för skador vid din kodanvändning</li>
                <li><strong>Otillåten delning</strong> leder till omedelbar uppsägning</li>
              </ul>
            </div>
            
            <h3 style="color: #334155;">🔑 ENKEL ANVÄNDNING - Så här gör du:</h3>
            <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin: 20px 0;">
              
              <h4 style="color: #0369a1; margin-top: 0;">📥 HÄMTA NYCKEL:</h4>
              <ol style="line-height: 1.8; color: #475569;">
                <li>Gå till lastbilen och hitta kodlåset vid <strong>vänster bakdäck (vid skärmen)</strong></li>
                <li>Slå in din 6-siffriga kod: <strong style="font-family: monospace; background: #e0f2fe; padding: 2px 6px; border-radius: 4px;">${vehicleCode}</strong></li>
                <li>Låsboxen öppnar sig automatiskt</li>
                <li>Ta fordonsnycklarna från boxen</li>
                <li>Stäng låsboxen (låser sig automatiskt)</li>
              </ol>
              
              <h4 style="color: #0369a1; margin-top: 20px;">📤 ÅTERLÄMNA NYCKEL:</h4>
              <ol style="line-height: 1.8; color: #475569;">
                <li>Gå tillbaka till kodlåset vid vänster bakdäck</li>
                <li>Slå in samma kod igen: <strong style="font-family: monospace; background: #e0f2fe; padding: 2px 6px; border-radius: 4px;">${vehicleCode}</strong></li>
                <li>Låsboxen öppnar sig automatiskt</li>
                <li>Lägg tillbaka nycklarna i boxen</li>
                <li>Stäng låsboxen ordentligt</li>
                <li><strong>VIKTIGT:</strong> Dubbelkolla att låsboxen är låst!</li>
              </ol>
            </div>
            
            <h3 style="color: #334155;">📱 Dagliga Rutiner</h3>
            <ul style="line-height: 1.6; color: #475569;">
              <li>Fotografera instrumentbräda vid hämtning (tid, mil, bränsle)</li>
              <li>Dokumentera fordonets skick</li>
              <li>Tanka fullt om bränsle under 50%</li>
              <li>Fotografera alla kvitton i Staff App</li>
              <li>Dokumentera återlämning med foto</li>
            </ul>
            
            <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0;">
              <h4 style="color: #1e40af; margin-top: 0;">⏰ Åtkomsttider & Giltighet</h4>
              <p style="margin: 5px 0;"><strong>Daglig åtkomst:</strong> 06:00 - 23:00</p>
              <p style="margin: 5px 0;"><strong>Giltig till:</strong> ${formatDate(expiryDate)}</p>
              <p style="margin: 5px 0;"><strong>Förnyelse:</strong> Automatisk påminnelse till admin</p>
            </div>
            
            <div style="background: #f0f9ff; border: 1px solid #0ea5e9; padding: 20px; margin: 25px 0; border-radius: 8px;">
              <h4 style="color: #0369a1; margin-top: 0;">📞 Support & Kontakt</h4>
              <p style="margin-bottom: 0;">Vid tekniska problem med kodlåset eller andra frågor:</p>
              <p style="margin: 5px 0; font-weight: bold;">Email: hej@nordflytt.se</p>
            </div>
            
          </div>
          
          <div style="text-align: center; padding: 25px; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0;">Nordflytt AB - Östermalmstorg 1, 114 42 Stockholm</p>
            <p style="margin: 5px 0 0 0;">KONFIDENTIELLT: Radera efter säker anteckning</p>
          </div>
          
        </body>
        </html>
      `
    };

    console.log('[VEHICLE EMAIL] Attempting to send vehicle code email to:', to);
    const result = await sgMail.send(msg);
    console.log('[VEHICLE EMAIL] Vehicle code email sent successfully to', to);
    console.log('[VEHICLE EMAIL] SendGrid response status:', result[0]?.statusCode);
        
    return {
      success: true,
      messageId: result[0]?.headers['x-message-id'] || 'unknown'
    };
  } catch (error) {
    console.error('[VEHICLE EMAIL] Error sending vehicle code email:', error);
        
    if (error && typeof error === 'object' && 'response' in error) {
      const sgError = error as any;
      console.error('[VEHICLE EMAIL] SendGrid error details:', {
        statusCode: sgError.response?.status,
        body: sgError.response?.body
      });
    }
        
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown vehicle email error'
    };
  }
}