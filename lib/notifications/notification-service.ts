import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export interface NotificationOptions {
  type: 'email' | 'sms'
  recipientType: 'customer' | 'employee' | 'admin'
  recipientId: string
  templateKey: string
  variables: Record<string, any>
  priority?: number
  scheduledFor?: Date
}

export interface NotificationPreferences {
  emailEnabled: boolean
  emailBookingConfirmations: boolean
  emailInvoiceReminders: boolean
  emailJobUpdates: boolean
  emailMarketing: boolean
  smsEnabled: boolean
  smsBookingConfirmations: boolean
  smsJobReminders: boolean
  smsUrgentUpdates: boolean
  smsMarketing: boolean
}

export class NotificationService {
  /**
   * Send a notification using a template
   */
  static async sendNotification(options: NotificationOptions): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('send_notification', {
        p_type: options.type,
        p_recipient_type: options.recipientType,
        p_recipient_id: options.recipientId,
        p_template_key: options.templateKey,
        p_variables: options.variables,
        p_priority: options.priority || 5,
        p_scheduled_for: options.scheduledFor?.toISOString() || null
      })

      if (error) {
        console.error('Send notification error:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Notification error:', error)
      return null
    }
  }

  /**
   * Send booking confirmation
   */
  static async sendBookingConfirmation(booking: {
    customerId: string
    customerName: string
    bookingDate: string
    fromAddress: string
    toAddress: string
    serviceType: string
    estimatedTime: string
  }) {
    // Send email
    await this.sendNotification({
      type: 'email',
      recipientType: 'customer',
      recipientId: booking.customerId,
      templateKey: 'booking_confirmation',
      variables: {
        customerName: booking.customerName,
        bookingDate: booking.bookingDate,
        fromAddress: booking.fromAddress,
        toAddress: booking.toAddress,
        serviceType: booking.serviceType,
        estimatedTime: booking.estimatedTime
      },
      priority: 1
    })

    // Send SMS
    await this.sendNotification({
      type: 'sms',
      recipientType: 'customer',
      recipientId: booking.customerId,
      templateKey: 'booking_confirmation_sms',
      variables: {
        bookingDate: booking.bookingDate
      },
      priority: 1
    })
  }

  /**
   * Send invoice notification
   */
  static async sendInvoiceNotification(invoice: {
    customerId: string
    customerName: string
    invoiceNumber: string
    amount: number
    dueDate: string
  }) {
    await this.sendNotification({
      type: 'email',
      recipientType: 'customer',
      recipientId: invoice.customerId,
      templateKey: 'invoice_created',
      variables: {
        customerName: invoice.customerName,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount.toString(),
        dueDate: invoice.dueDate
      },
      priority: 3
    })
  }

  /**
   * Send job reminder
   */
  static async sendJobReminder(job: {
    customerId: string
    customerName: string
    jobDate: string
    jobTime: string
  }) {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(18, 0, 0, 0) // Send at 6 PM the day before

    // Email reminder
    await this.sendNotification({
      type: 'email',
      recipientType: 'customer',
      recipientId: job.customerId,
      templateKey: 'job_reminder',
      variables: {
        customerName: job.customerName,
        jobDate: job.jobDate,
        jobTime: job.jobTime
      },
      priority: 2,
      scheduledFor: tomorrow
    })

    // SMS reminder
    await this.sendNotification({
      type: 'sms',
      recipientType: 'customer',
      recipientId: job.customerId,
      templateKey: 'job_reminder_sms',
      variables: {
        jobDate: job.jobDate,
        jobTime: job.jobTime
      },
      priority: 2,
      scheduledFor: tomorrow
    })
  }

  /**
   * Send team arrival notification
   */
  static async sendTeamArrivalNotification(job: {
    customerId: string
    eta: number // minutes
  }) {
    await this.sendNotification({
      type: 'sms',
      recipientType: 'customer',
      recipientId: job.customerId,
      templateKey: 'team_arrival_sms',
      variables: {
        eta: job.eta.toString()
      },
      priority: 1
    })
  }

  /**
   * Get notification preferences
   */
  static async getPreferences(
    entityType: 'customer' | 'employee',
    entityId: string
  ): Promise<NotificationPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .single()

      if (error && error.code !== 'PGRST116') { // Not found is ok
        console.error('Get preferences error:', error)
        return null
      }

      // Return default preferences if not found
      if (!data) {
        return {
          emailEnabled: true,
          emailBookingConfirmations: true,
          emailInvoiceReminders: true,
          emailJobUpdates: true,
          emailMarketing: false,
          smsEnabled: true,
          smsBookingConfirmations: true,
          smsJobReminders: true,
          smsUrgentUpdates: true,
          smsMarketing: false
        }
      }

      return {
        emailEnabled: data.email_enabled,
        emailBookingConfirmations: data.email_booking_confirmations,
        emailInvoiceReminders: data.email_invoice_reminders,
        emailJobUpdates: data.email_job_updates,
        emailMarketing: data.email_marketing,
        smsEnabled: data.sms_enabled,
        smsBookingConfirmations: data.sms_booking_confirmations,
        smsJobReminders: data.sms_job_reminders,
        smsUrgentUpdates: data.sms_urgent_updates,
        smsMarketing: data.sms_marketing
      }
    } catch (error) {
      console.error('Preferences error:', error)
      return null
    }
  }

  /**
   * Update notification preferences
   */
  static async updatePreferences(
    entityType: 'customer' | 'employee',
    entityId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<boolean> {
    try {
      const updates: any = {}
      
      if (preferences.emailEnabled !== undefined) updates.email_enabled = preferences.emailEnabled
      if (preferences.emailBookingConfirmations !== undefined) updates.email_booking_confirmations = preferences.emailBookingConfirmations
      if (preferences.emailInvoiceReminders !== undefined) updates.email_invoice_reminders = preferences.emailInvoiceReminders
      if (preferences.emailJobUpdates !== undefined) updates.email_job_updates = preferences.emailJobUpdates
      if (preferences.emailMarketing !== undefined) updates.email_marketing = preferences.emailMarketing
      if (preferences.smsEnabled !== undefined) updates.sms_enabled = preferences.smsEnabled
      if (preferences.smsBookingConfirmations !== undefined) updates.sms_booking_confirmations = preferences.smsBookingConfirmations
      if (preferences.smsJobReminders !== undefined) updates.sms_job_reminders = preferences.smsJobReminders
      if (preferences.smsUrgentUpdates !== undefined) updates.sms_urgent_updates = preferences.smsUrgentUpdates
      if (preferences.smsMarketing !== undefined) updates.sms_marketing = preferences.smsMarketing

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          entity_type: entityType,
          entity_id: entityId,
          ...updates,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'entity_type,entity_id'
        })

      if (error) {
        console.error('Update preferences error:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Preferences update error:', error)
      return false
    }
  }

  /**
   * Get notification history
   */
  static async getNotificationHistory(
    recipientType: string,
    recipientId: string,
    limit: number = 50
  ) {
    try {
      const { data, error } = await supabase
        .from('notification_log')
        .select('*')
        .eq('recipient_type', recipientType)
        .eq('recipient_id', recipientId)
        .order('sent_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Get history error:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('History error:', error)
      return []
    }
  }

  /**
   * Get pending notifications
   */
  static async getPendingNotifications(limit: number = 100) {
    try {
      const { data, error } = await supabase
        .from('notification_queue')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_for', new Date().toISOString())
        .order('priority', { ascending: true })
        .order('scheduled_for', { ascending: true })
        .limit(limit)

      if (error) {
        console.error('Get pending error:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Pending error:', error)
      return []
    }
  }

  /**
   * Mark notification as sent
   */
  static async markAsSent(
    queueId: string,
    providerId: string,
    providerResponse: any
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notification_queue')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          provider_message_id: providerId,
          provider_response: providerResponse
        })
        .eq('id', queueId)

      if (error) {
        console.error('Mark sent error:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Mark sent error:', error)
      return false
    }
  }

  /**
   * Mark notification as failed
   */
  static async markAsFailed(
    queueId: string,
    errorMessage: string
  ): Promise<boolean> {
    try {
      const { data: queue } = await supabase
        .from('notification_queue')
        .select('attempts, max_attempts')
        .eq('id', queueId)
        .single()

      const attempts = (queue?.attempts || 0) + 1
      const status = attempts >= (queue?.max_attempts || 3) ? 'failed' : 'pending'

      const { error } = await supabase
        .from('notification_queue')
        .update({
          status,
          attempts,
          error_message: errorMessage,
          failed_at: status === 'failed' ? new Date().toISOString() : null
        })
        .eq('id', queueId)

      if (error) {
        console.error('Mark failed error:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Mark failed error:', error)
      return false
    }
  }
}