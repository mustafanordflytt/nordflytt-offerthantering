import sgMail from '@sendgrid/mail'

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
  attachments?: Array<{
    filename: string
    content: string
    type: string
    disposition: string
  }>
}

export interface SendResult {
  success: boolean
  messageId?: string
  error?: string
}

export class EmailService {
  private static defaultFrom = process.env.SENDGRID_FROM_EMAIL || 'noreply@nordflytt.se'
  private static defaultReplyTo = process.env.SENDGRID_REPLY_TO || 'info@nordflytt.se'

  /**
   * Send email using SendGrid
   */
  static async sendEmail(options: EmailOptions): Promise<SendResult> {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        console.warn('SendGrid API key not configured')
        return { success: false, error: 'Email service not configured' }
      }

      const msg = {
        to: options.to,
        from: options.from || this.defaultFrom,
        replyTo: options.replyTo || this.defaultReplyTo,
        subject: options.subject,
        html: options.html,
        text: options.text || this.htmlToText(options.html),
        attachments: options.attachments
      }

      const [response] = await sgMail.send(msg)
      
      return {
        success: true,
        messageId: response.headers['x-message-id'] as string
      }
    } catch (error: any) {
      console.error('SendGrid error:', error)
      
      let errorMessage = 'Failed to send email'
      if (error.response?.body?.errors) {
        errorMessage = error.response.body.errors.map((e: any) => e.message).join(', ')
      } else if (error.message) {
        errorMessage = error.message
      }

      return {
        success: false,
        error: errorMessage
      }
    }
  }

  /**
   * Send booking confirmation email
   */
  static async sendBookingConfirmation(data: {
    customerEmail: string
    customerName: string
    bookingDate: string
    fromAddress: string
    toAddress: string
    serviceType: string
    estimatedTime: string
    bookingId: string
  }): Promise<SendResult> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background-color: #002A5C; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .booking-details { background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-left: 4px solid #002A5C; }
          .footer { text-align: center; padding: 20px; color: #666; border-top: 1px solid #eee; }
          .button { display: inline-block; padding: 12px 24px; background-color: #002A5C; color: white; text-decoration: none; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Bokningsbekräftelse - Nordflytt</h1>
        </div>
        
        <div class="content">
          <h2>Tack för din bokning, ${data.customerName}!</h2>
          
          <p>Vi bekräftar härmed din flyttbokning. Här är detaljerna:</p>
          
          <div class="booking-details">
            <h3>Bokningsdetaljer</h3>
            <p><strong>Boknings-ID:</strong> ${data.bookingId}</p>
            <p><strong>Datum:</strong> ${data.bookingDate}</p>
            <p><strong>Från:</strong> ${data.fromAddress}</p>
            <p><strong>Till:</strong> ${data.toAddress}</p>
            <p><strong>Tjänst:</strong> ${data.serviceType}</p>
            <p><strong>Uppskattad tid:</strong> ${data.estimatedTime}</p>
          </div>
          
          <h3>Nästa steg</h3>
          <ul>
            <li>Vi kommer att kontakta dig inom 24 timmar för att bekräfta alla detaljer</li>
            <li>Du kommer att få en påminnelse dagen innan flytten</li>
            <li>Vårt team ringer 30 minuter innan ankomst</li>
          </ul>
          
          <p>Har du frågor? Tveka inte att kontakta oss på telefon <strong>08-123 456 78</strong> eller via email.</p>
        </div>
        
        <div class="footer">
          <p>Med vänlig hälsning,<br><strong>Nordflytt AB</strong></p>
          <p>Telefon: 08-123 456 78 | Email: info@nordflytt.se</p>
        </div>
      </body>
      </html>
    `

    return this.sendEmail({
      to: data.customerEmail,
      subject: `Bekräftelse på din flyttbokning - ${data.bookingDate}`,
      html
    })
  }

  /**
   * Send invoice email
   */
  static async sendInvoiceEmail(data: {
    customerEmail: string
    customerName: string
    invoiceNumber: string
    amount: number
    dueDate: string
    invoiceUrl?: string
  }): Promise<SendResult> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background-color: #002A5C; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .invoice-details { background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-left: 4px solid #002A5C; }
          .footer { text-align: center; padding: 20px; color: #666; border-top: 1px solid #eee; }
          .amount { font-size: 24px; font-weight: bold; color: #002A5C; }
          .button { display: inline-block; padding: 12px 24px; background-color: #002A5C; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Faktura från Nordflytt</h1>
        </div>
        
        <div class="content">
          <h2>Hej ${data.customerName}!</h2>
          
          <p>Din faktura för vår flyttjänst är nu klar.</p>
          
          <div class="invoice-details">
            <h3>Fakturadetaljer</h3>
            <p><strong>Fakturanummer:</strong> ${data.invoiceNumber}</p>
            <p><strong>Belopp:</strong> <span class="amount">${data.amount.toLocaleString('sv-SE')} kr</span></p>
            <p><strong>Förfallodatum:</strong> ${data.dueDate}</p>
          </div>
          
          ${data.invoiceUrl ? `
            <p>Du kan visa och betala din faktura här:</p>
            <a href="${data.invoiceUrl}" class="button">Visa faktura</a>
          ` : ''}
          
          <h3>Betalningsalternativ</h3>
          <ul>
            <li><strong>Bankgiro:</strong> 123-4567</li>
            <li><strong>Plusgiro:</strong> 12 34 56-7</li>
            <li><strong>Swish:</strong> 123 456 78 90</li>
          </ul>
          
          <p><em>Ange fakturanummer ${data.invoiceNumber} som referens vid betalning.</em></p>
          
          <p>Tack för att du valde Nordflytt!</p>
        </div>
        
        <div class="footer">
          <p>Med vänlig hälsning,<br><strong>Nordflytt AB</strong></p>
          <p>Telefon: 08-123 456 78 | Email: info@nordflytt.se</p>
          <p>Org.nr: 556123-4567 | F-skatt</p>
        </div>
      </body>
      </html>
    `

    return this.sendEmail({
      to: data.customerEmail,
      subject: `Faktura ${data.invoiceNumber} från Nordflytt`,
      html
    })
  }

  /**
   * Send job reminder email
   */
  static async sendJobReminderEmail(data: {
    customerEmail: string
    customerName: string
    jobDate: string
    jobTime: string
    teamLeader?: string
    specialInstructions?: string
  }): Promise<SendResult> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background-color: #002A5C; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .reminder-box { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .checklist { background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-left: 4px solid #28a745; }
          .footer { text-align: center; padding: 20px; color: #666; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Påminnelse: Din flytt imorgon</h1>
        </div>
        
        <div class="content">
          <h2>Hej ${data.customerName}!</h2>
          
          <div class="reminder-box">
            <h3>🚚 Din flytt är imorgon!</h3>
            <p><strong>Datum:</strong> ${data.jobDate}</p>
            <p><strong>Tid:</strong> ${data.jobTime}</p>
            ${data.teamLeader ? `<p><strong>Teamledare:</strong> ${data.teamLeader}</p>` : ''}
          </div>
          
          <div class="checklist">
            <h3>Viktigt att komma ihåg</h3>
            <ul>
              <li>✅ Se till att allt är packat och klart</li>
              <li>✅ Märk ömtåliga lådor tydligt</li>
              <li>✅ Ha nycklar till både gamla och nya bostaden tillgängliga</li>
              <li>✅ Informera grannarna om flyttdagen</li>
              <li>✅ Se till att parkeringsplatser är lediga</li>
              <li>✅ Håll mobiltelefonen påslagen</li>
            </ul>
          </div>
          
          ${data.specialInstructions ? `
            <div style="background-color: #e3f2fd; padding: 15px; margin: 20px 0; border-left: 4px solid #2196f3;">
              <h3>Särskilda instruktioner</h3>
              <p>${data.specialInstructions}</p>
            </div>
          ` : ''}
          
          <h3>På flyttdagen</h3>
          <ul>
            <li>Vårt team ringer 30 minuter innan ankomst</li>
            <li>Ha legitimation redo för signering av dokument</li>
            <li>Vi tar hand om emballage och packning om avtalat</li>
          </ul>
          
          <p><strong>Behöver du ändra något?</strong> Ring oss så snart som möjligt på <strong>08-123 456 78</strong>.</p>
        </div>
        
        <div class="footer">
          <p>Vi ses imorgon!<br><strong>Nordflytt AB</strong></p>
          <p>Akut: 08-123 456 78 | Email: info@nordflytt.se</p>
        </div>
      </body>
      </html>
    `

    return this.sendEmail({
      to: data.customerEmail,
      subject: `Påminnelse: Flytt imorgon ${data.jobDate}`,
      html
    })
  }

  /**
   * Convert HTML to basic text
   */
  private static htmlToText(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim()
  }

  /**
   * Test email configuration
   */
  static async testConfiguration(): Promise<SendResult> {
    if (!process.env.SENDGRID_API_KEY) {
      return { success: false, error: 'SendGrid API key not configured' }
    }

    return this.sendEmail({
      to: process.env.SENDGRID_FROM_EMAIL || 'test@nordflytt.se',
      subject: 'Test Email Configuration',
      html: '<p>This is a test email to verify SendGrid configuration.</p>'
    })
  }
}