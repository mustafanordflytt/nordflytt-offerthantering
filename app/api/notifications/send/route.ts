import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateCRMAuth } from '@/lib/auth/validate-crm-auth'
import { NotificationService } from '@/lib/notifications/notification-service'
import { EmailService } from '@/lib/notifications/email-service'
import { SmsService } from '@/lib/notifications/sms-service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    // Validate CRM authentication
    const authResult = await validateCRMAuth(request)
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!authResult.permissions.includes('notifications:send')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      type, 
      recipientType, 
      recipientId, 
      templateKey, 
      variables, 
      priority, 
      scheduledFor,
      directSend 
    } = body

    // Validate required fields
    if (!type || !recipientType || !recipientId) {
      return NextResponse.json(
        { error: 'Type, recipient type and recipient ID are required' },
        { status: 400 }
      )
    }

    if (directSend) {
      // Send immediately without queuing
      let result
      
      if (type === 'email') {
        // Get recipient email
        const recipient = await getRecipientInfo(recipientType, recipientId)
        if (!recipient?.email) {
          return NextResponse.json(
            { error: 'Recipient email not found' },
            { status: 404 }
          )
        }

        // Send based on template key
        switch (templateKey) {
          case 'booking_confirmation':
            result = await EmailService.sendBookingConfirmation({
              customerEmail: recipient.email,
              customerName: variables.customerName,
              bookingDate: variables.bookingDate,
              fromAddress: variables.fromAddress,
              toAddress: variables.toAddress,
              serviceType: variables.serviceType,
              estimatedTime: variables.estimatedTime,
              bookingId: variables.bookingId
            })
            break
            
          case 'invoice_created':
            result = await EmailService.sendInvoiceEmail({
              customerEmail: recipient.email,
              customerName: variables.customerName,
              invoiceNumber: variables.invoiceNumber,
              amount: variables.amount,
              dueDate: variables.dueDate,
              invoiceUrl: variables.invoiceUrl
            })
            break
            
          case 'job_reminder':
            result = await EmailService.sendJobReminderEmail({
              customerEmail: recipient.email,
              customerName: variables.customerName,
              jobDate: variables.jobDate,
              jobTime: variables.jobTime,
              teamLeader: variables.teamLeader,
              specialInstructions: variables.specialInstructions
            })
            break
            
          default:
            return NextResponse.json(
              { error: 'Unknown email template' },
              { status: 400 }
            )
        }
      } else if (type === 'sms') {
        // Get recipient phone
        const recipient = await getRecipientInfo(recipientType, recipientId)
        if (!recipient?.phone) {
          return NextResponse.json(
            { error: 'Recipient phone not found' },
            { status: 404 }
          )
        }

        // Send based on template key
        switch (templateKey) {
          case 'booking_confirmation_sms':
            result = await SmsService.sendBookingConfirmationSms({
              customerPhone: recipient.phone,
              customerName: variables.customerName,
              bookingDate: variables.bookingDate,
              bookingId: variables.bookingId
            })
            break
            
          case 'job_reminder_sms':
            result = await SmsService.sendJobReminderSms({
              customerPhone: recipient.phone,
              customerName: variables.customerName,
              jobDate: variables.jobDate,
              jobTime: variables.jobTime
            })
            break
            
          case 'team_arrival_sms':
            result = await SmsService.sendTeamArrivalSms({
              customerPhone: recipient.phone,
              eta: variables.eta,
              teamLeader: variables.teamLeader
            })
            break
            
          default:
            return NextResponse.json(
              { error: 'Unknown SMS template' },
              { status: 400 }
            )
        }
      } else {
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: result?.success || false,
        messageId: result?.messageId,
        error: result?.error
      })
      
    } else {
      // Queue notification
      const queueId = await NotificationService.sendNotification({
        type,
        recipientType,
        recipientId,
        templateKey,
        variables,
        priority,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined
      })

      if (!queueId) {
        return NextResponse.json(
          { error: 'Failed to queue notification' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        queueId,
        message: 'Notification queued successfully'
      })
    }

  } catch (error: any) {
    console.error('Send notification error:', error)
    return NextResponse.json({
      error: 'Failed to send notification',
      details: error.message
    }, { status: 500 })
  }
}

async function getRecipientInfo(recipientType: string, recipientId: string) {
  if (recipientType === 'customer') {
    const { data } = await supabase
      .from('crm_customers')
      .select('email, phone, company_name, contact_name')
      .eq('customer_id', recipientId)
      .single()
    
    return data ? {
      email: data.email,
      phone: data.phone,
      name: data.company_name || data.contact_name
    } : null
  } else if (recipientType === 'employee') {
    const { data } = await supabase
      .from('crm_users')
      .select('email, phone, name')
      .eq('id', recipientId)
      .single()
    
    return data
  }
  
  return null
}