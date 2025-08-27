import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { NotificationService } from '@/lib/notifications/notification-service'
import { EmailService } from '@/lib/notifications/email-service'
import { SmsService } from '@/lib/notifications/sms-service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// This endpoint should be called by a cron job or background worker
// Authentication is bypassed for cron jobs - use a secret token instead
export async function POST(request: NextRequest) {
  try {
    // Check for cron secret
    const cronSecret = request.headers.get('Authorization')
    if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Processing notification queue...')

    // Get pending notifications
    const pendingNotifications = await NotificationService.getPendingNotifications(50)
    
    if (pendingNotifications.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'No pending notifications'
      })
    }

    let processed = 0
    let failed = 0

    for (const notification of pendingNotifications) {
      try {
        // Mark as processing
        await supabase
          .from('notification_queue')
          .update({ status: 'processing' })
          .eq('id', notification.id)

        let result: any = { success: false }

        if (notification.notification_type === 'email') {
          result = await processEmailNotification(notification)
        } else if (notification.notification_type === 'sms') {
          result = await processSmsNotification(notification)
        }

        if (result.success) {
          // Mark as sent
          await NotificationService.markAsSent(
            notification.id,
            result.messageId || '',
            result
          )
          
          // Log successful send
          await supabase.from('notification_log').insert({
            queue_id: notification.id,
            notification_type: notification.notification_type,
            recipient_email: notification.recipient_email,
            recipient_phone: notification.recipient_phone,
            subject: notification.subject,
            content: notification.content,
            status: 'sent',
            sent_at: new Date().toISOString(),
            provider: result.provider || 'unknown',
            provider_message_id: result.messageId,
            provider_cost: result.cost || null
          })
          
          processed++
          console.log(`Sent ${notification.notification_type} to ${notification.recipient_email || notification.recipient_phone}`)
        } else {
          // Mark as failed
          await NotificationService.markAsFailed(
            notification.id,
            result.error || 'Unknown error'
          )
          failed++
          console.error(`Failed to send ${notification.notification_type}: ${result.error}`)
        }

      } catch (error: any) {
        console.error(`Error processing notification ${notification.id}:`, error)
        
        // Mark as failed
        await NotificationService.markAsFailed(
          notification.id,
          error.message || 'Processing error'
        )
        failed++
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log(`Notification processing complete: ${processed} sent, ${failed} failed`)

    return NextResponse.json({
      success: true,
      processed,
      failed,
      total: pendingNotifications.length
    })

  } catch (error: any) {
    console.error('Notification processing error:', error)
    return NextResponse.json({
      error: 'Failed to process notifications',
      details: error.message
    }, { status: 500 })
  }
}

async function processEmailNotification(notification: any) {
  try {
    if (!notification.recipient_email) {
      throw new Error('No recipient email')
    }

    const result = await EmailService.sendEmail({
      to: notification.recipient_email,
      subject: notification.subject || 'Notification',
      html: notification.content,
      from: process.env.SENDGRID_FROM_EMAIL
    })

    return {
      ...result,
      provider: 'sendgrid'
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

async function processSmsNotification(notification: any) {
  try {
    if (!notification.recipient_phone) {
      throw new Error('No recipient phone')
    }

    const result = await SmsService.sendSms({
      to: notification.recipient_phone,
      message: notification.content
    })

    return {
      ...result,
      provider: 'twilio'
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

// GET endpoint for manual processing (with auth)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    const apiKey = process.env.NOTIFICATION_API_KEY
    
    if (!authHeader || !apiKey || authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get queue stats
    const { data: stats } = await supabase
      .from('notification_queue')
      .select('status')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    const statusCounts = (stats || []).reduce((acc: any, item: any) => {
      acc[item.status] = (acc[item.status] || 0) + 1
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      stats: statusCounts,
      message: 'Queue statistics retrieved'
    })

  } catch (error: any) {
    console.error('Queue stats error:', error)
    return NextResponse.json({
      error: 'Failed to get queue stats',
      details: error.message
    }, { status: 500 })
  }
}