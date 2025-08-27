import { Twilio } from 'twilio'

// Initialize Twilio client
let twilioClient: Twilio | null = null

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = new Twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  )
}

export interface SmsOptions {
  to: string
  message: string
  from?: string
}

export interface SmsResult {
  success: boolean
  messageId?: string
  error?: string
  cost?: number
}

export class SmsService {
  private static defaultFrom = process.env.TWILIO_PHONE_NUMBER || '+46701234567'

  /**
   * Send SMS using Twilio
   */
  static async sendSms(options: SmsOptions): Promise<SmsResult> {
    try {
      if (!twilioClient) {
        console.warn('Twilio not configured')
        return { success: false, error: 'SMS service not configured' }
      }

      // Format phone number to international format
      const formattedPhone = this.formatPhoneNumber(options.to)
      
      if (!formattedPhone) {
        return { success: false, error: 'Invalid phone number format' }
      }

      const message = await twilioClient.messages.create({
        body: options.message,
        from: options.from || this.defaultFrom,
        to: formattedPhone
      })

      return {
        success: true,
        messageId: message.sid,
        cost: message.price ? Math.abs(parseFloat(message.price)) : undefined
      }
    } catch (error: any) {
      console.error('Twilio error:', error)
      
      let errorMessage = 'Failed to send SMS'
      if (error.code) {
        errorMessage = `Twilio error ${error.code}: ${error.message}`
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
   * Send booking confirmation SMS
   */
  static async sendBookingConfirmationSms(data: {
    customerPhone: string
    customerName: string
    bookingDate: string
    bookingId: string
  }): Promise<SmsResult> {
    const message = `Hej ${data.customerName}! Tack för din bokning hos Nordflytt. Vi bekräftar din flytt ${data.bookingDate}. Boknings-ID: ${data.bookingId}. Vi kontaktar dig snart. Mvh Nordflytt`

    return this.sendSms({
      to: data.customerPhone,
      message
    })
  }

  /**
   * Send job reminder SMS
   */
  static async sendJobReminderSms(data: {
    customerPhone: string
    customerName: string
    jobDate: string
    jobTime: string
  }): Promise<SmsResult> {
    const message = `Hej ${data.customerName}! Påminnelse: Din flytt med Nordflytt är imorgon ${data.jobDate} kl ${data.jobTime}. Vi ringer 30 min innan ankomst. Frågor? Ring 08-123456. Mvh Nordflytt`

    return this.sendSms({
      to: data.customerPhone,
      message
    })
  }

  /**
   * Send team arrival SMS
   */
  static async sendTeamArrivalSms(data: {
    customerPhone: string
    eta: number
    teamLeader?: string
  }): Promise<SmsResult> {
    const message = `Nordflytt: Vårt flyttteam är nu på väg och beräknas vara framme om ca ${data.eta} minuter. ${data.teamLeader ? `Teamledare: ${data.teamLeader}. ` : ''}Vi ses snart!`

    return this.sendSms({
      to: data.customerPhone,
      message
    })
  }

  /**
   * Send invoice reminder SMS
   */
  static async sendInvoiceReminderSms(data: {
    customerPhone: string
    customerName: string
    invoiceNumber: string
    amount: number
    dueDate: string
  }): Promise<SmsResult> {
    const message = `Hej ${data.customerName}! Påminnelse om faktura ${data.invoiceNumber} på ${data.amount} kr. Förfaller ${data.dueDate}. Betala via Swish: 123456789. Mvh Nordflytt`

    return this.sendSms({
      to: data.customerPhone,
      message
    })
  }

  /**
   * Send urgent notification SMS
   */
  static async sendUrgentNotificationSms(data: {
    customerPhone: string
    message: string
  }): Promise<SmsResult> {
    const urgentMessage = `VIKTIGT - Nordflytt: ${data.message}. Ring oss på 08-123456 om du har frågor.`

    return this.sendSms({
      to: data.customerPhone,
      message: urgentMessage
    })
  }

  /**
   * Format phone number to international format
   */
  private static formatPhoneNumber(phone: string): string | null {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '')
    
    // Swedish phone number handling
    if (cleaned.startsWith('46')) {
      // Already has country code
      return `+${cleaned}`
    } else if (cleaned.startsWith('07') || cleaned.startsWith('08')) {
      // Swedish mobile/landline number, add country code
      return `+46${cleaned.substring(1)}`
    } else if (cleaned.length === 9 && cleaned.match(/^[1-9]/)) {
      // Swedish number without leading 0, add country code and 0
      return `+460${cleaned}`
    } else if (cleaned.length === 10 && cleaned.startsWith('0')) {
      // Swedish number with leading 0, add country code
      return `+46${cleaned.substring(1)}`
    }
    
    // For other countries, assume it's already properly formatted
    if (cleaned.length > 10) {
      return `+${cleaned}`
    }
    
    return null
  }

  /**
   * Validate phone number
   */
  static validatePhoneNumber(phone: string): boolean {
    const formatted = this.formatPhoneNumber(phone)
    return formatted !== null
  }

  /**
   * Get SMS character count and parts
   */
  static getSmsInfo(message: string): {
    characterCount: number
    smsCount: number
    encoding: 'GSM' | 'Unicode'
  } {
    // Check if message contains non-GSM characters
    const gsmRegex = /^[A-Za-z0-9@£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&'()*+,\-.\/:;<=>?¡ÄÖÑÜ§¿äöñüà^{}\[~\]|€]*$/
    const isGSM = gsmRegex.test(message)
    
    const characterCount = message.length
    
    let smsCount: number
    if (isGSM) {
      smsCount = Math.ceil(characterCount / 160)
    } else {
      smsCount = Math.ceil(characterCount / 70)
    }
    
    return {
      characterCount,
      smsCount,
      encoding: isGSM ? 'GSM' : 'Unicode'
    }
  }

  /**
   * Test SMS configuration
   */
  static async testConfiguration(): Promise<SmsResult> {
    if (!twilioClient) {
      return { success: false, error: 'Twilio not configured' }
    }

    // Use a test number or admin number
    const testNumber = process.env.TWILIO_TEST_NUMBER || '+46701234567'
    
    return this.sendSms({
      to: testNumber,
      message: 'Test SMS from Nordflytt notification system.'
    })
  }

  /**
   * Get account balance (Twilio)
   */
  static async getBalance(): Promise<{ balance: number; currency: string } | null> {
    try {
      if (!twilioClient) {
        return null
      }

      const account = await twilioClient.api.accounts.get()
      
      return {
        balance: parseFloat(account.balance || '0'),
        currency: account.accountBalanceCurrency || 'USD'
      }
    } catch (error) {
      console.error('Error getting Twilio balance:', error)
      return null
    }
  }
}