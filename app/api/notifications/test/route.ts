import { NextRequest, NextResponse } from 'next/server'
import { validateCRMAuth } from '@/lib/auth/validate-crm-auth'
import { EmailService } from '@/lib/notifications/email-service'
import { SmsService } from '@/lib/notifications/sms-service'
import { NotificationService } from '@/lib/notifications/notification-service'

export async function POST(request: NextRequest) {
  try {
    // Validate CRM authentication
    const authResult = await validateCRMAuth(request)
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can test notifications
    if (!authResult.permissions.includes('admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { testType, testEmail, testPhone } = body

    let result: any = { success: false }

    switch (testType) {
      case 'email_config':
        console.log('Testing email configuration...')
        result = await EmailService.testConfiguration()
        break

      case 'sms_config':
        console.log('Testing SMS configuration...')
        result = await SmsService.testConfiguration()
        break

      case 'booking_confirmation_email':
        if (!testEmail) {
          return NextResponse.json({ error: 'Test email required' }, { status: 400 })
        }
        console.log(`Sending test booking confirmation to ${testEmail}`)
        result = await EmailService.sendBookingConfirmation({
          customerEmail: testEmail,
          customerName: 'Test Kund',
          bookingDate: '15 januari 2025',
          fromAddress: 'Stockholms centrum, Drottninggatan 1',
          toAddress: 'Göteborg centrum, Avenyn 10',
          serviceType: 'Privatflytt',
          estimatedTime: '6-8 timmar',
          bookingId: 'TEST001'
        })
        break

      case 'booking_confirmation_sms':
        if (!testPhone) {
          return NextResponse.json({ error: 'Test phone required' }, { status: 400 })
        }
        console.log(`Sending test booking confirmation SMS to ${testPhone}`)
        result = await SmsService.sendBookingConfirmationSms({
          customerPhone: testPhone,
          customerName: 'Test Kund',
          bookingDate: '15 januari 2025',
          bookingId: 'TEST001'
        })
        break

      case 'invoice_email':
        if (!testEmail) {
          return NextResponse.json({ error: 'Test email required' }, { status: 400 })
        }
        console.log(`Sending test invoice email to ${testEmail}`)
        result = await EmailService.sendInvoiceEmail({
          customerEmail: testEmail,
          customerName: 'Test Kund',
          invoiceNumber: 'FAK-2025-001',
          amount: 12500,
          dueDate: '30 januari 2025'
        })
        break

      case 'job_reminder_email':
        if (!testEmail) {
          return NextResponse.json({ error: 'Test email required' }, { status: 400 })
        }
        console.log(`Sending test job reminder email to ${testEmail}`)
        result = await EmailService.sendJobReminderEmail({
          customerEmail: testEmail,
          customerName: 'Test Kund',
          jobDate: 'imorgon 15 januari',
          jobTime: '09:00',
          teamLeader: 'Magnus Andersson',
          specialInstructions: 'Extra försiktighet med pianot i vardagsrummet'
        })
        break

      case 'job_reminder_sms':
        if (!testPhone) {
          return NextResponse.json({ error: 'Test phone required' }, { status: 400 })
        }
        console.log(`Sending test job reminder SMS to ${testPhone}`)
        result = await SmsService.sendJobReminderSms({
          customerPhone: testPhone,
          customerName: 'Test Kund',
          jobDate: '15 jan',
          jobTime: '09:00'
        })
        break

      case 'team_arrival_sms':
        if (!testPhone) {
          return NextResponse.json({ error: 'Test phone required' }, { status: 400 })
        }
        console.log(`Sending test team arrival SMS to ${testPhone}`)
        result = await SmsService.sendTeamArrivalSms({
          customerPhone: testPhone,
          eta: 15,
          teamLeader: 'Magnus'
        })
        break

      case 'queue_test':
        console.log('Testing notification queue...')
        const queueId = await NotificationService.sendNotification({
          type: 'email',
          recipientType: 'employee',
          recipientId: authResult.user.id,
          templateKey: 'booking_confirmation',
          variables: {
            customerName: 'Test Queue Customer',
            bookingDate: '15 januari 2025',
            fromAddress: 'Stockholm',
            toAddress: 'Göteborg',
            serviceType: 'Test Flytt',
            estimatedTime: '4 timmar'
          },
          priority: 1
        })
        
        result = {
          success: !!queueId,
          queueId,
          message: 'Notification queued for processing'
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid test type' }, { status: 400 })
    }

    return NextResponse.json({
      success: result.success,
      testType,
      result: {
        messageId: result.messageId,
        cost: result.cost,
        error: result.error,
        queueId: result.queueId
      },
      message: result.success 
        ? `Test ${testType} completed successfully` 
        : `Test ${testType} failed: ${result.error}`,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Notification test error:', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error.message
    }, { status: 500 })
  }
}