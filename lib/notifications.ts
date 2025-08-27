// lib/notifications.ts
// Client-safe imports only - NO Node.js modules
import type { Offer } from "../types/offer";
import { generateOfferLink, generateOrderConfirmationLink } from './auth/access-tokens';

// Dynamic imports for server-only functionality
const getServerModules = async () => {
  if (typeof window === 'undefined') {
    // Only import on server side
    const { createServerSupabaseClient } = await import('./supabase')
    const { sendBookingConfirmation, sendOrderConfirmation } = await import('./email')
    const { sendBookingSMS, sendOrderConfirmationSMS } = await import('./sms')
    const sgMail = (await import('@sendgrid/mail')).default
    const twilio = (await import('twilio')).default
    
    return {
      createServerSupabaseClient,
      sendBookingConfirmation,
      sendOrderConfirmation, 
      sendBookingSMS,
      sendOrderConfirmationSMS,
      sgMail,
      twilio
    }
  }
  return null
}

// 🔧 NYTT: Funktion för att kapitalisera namn
const capitalizeFullName = (name: string): string => {
  if (!name || typeof name !== 'string') return 'Ej angivet';
  
  return name
    .trim()
    .split(' ')
    .map(word => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

// Enhanced notification interfaces for personnel app
interface NotificationData {
  type: 'booking_update' | 'schedule_change' | 'urgent_message' | 'system_alert' | 'chat_message' | 'emergency_alert'
  title: string
  message: string
  recipientId?: string
  recipientEmail?: string
  recipientPhone?: string
  metadata?: Record<string, any>
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  actionUrl?: string
}

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

interface SMSTemplate {
  message: string
}

interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  data?: Record<string, any>
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
  tag?: string
  requireInteraction?: boolean
  silent?: boolean
  vibrate?: number[]
}

// Web Push configuration for personnel app
export class WebPushManager {
  private static instance: WebPushManager
  private registration: ServiceWorkerRegistration | null = null
  private subscription: PushSubscription | null = null
  private vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

  static getInstance(): WebPushManager {
    if (!WebPushManager.instance) {
      WebPushManager.instance = new WebPushManager()
    }
    return WebPushManager.instance
  }

  // Initialize service worker and push notifications
  async initialize(): Promise<boolean> {
    try {
      // Check if service workers are supported
      if (!('serviceWorker' in navigator)) {
        console.warn('Service Workers not supported')
        return false
      }

      // Check if push notifications are supported
      if (!('PushManager' in window)) {
        console.warn('Push messaging not supported')
        return false
      }

      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered:', this.registration)

      return true
    } catch (error) {
      console.error('Failed to initialize Web Push:', error)
      return false
    }
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported')
    }

    const permission = await Notification.requestPermission()
    console.log('Notification permission:', permission)
    return permission
  }

  // Subscribe to push notifications
  async subscribe(userId: string): Promise<PushSubscription | null> {
    try {
      if (!this.registration) {
        await this.initialize()
      }

      if (!this.registration) {
        throw new Error('Service Worker not registered')
      }

      // Check if already subscribed
      this.subscription = await this.registration.pushManager.getSubscription()
      
      if (!this.subscription) {
        // Create new subscription
        this.subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
        })
      }

      // Send subscription to server
      await this.saveSubscription(userId, this.subscription)

      return this.subscription
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      return null
    }
  }

  // Send local notification
  async sendLocalNotification(payload: PushNotificationPayload): Promise<void> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported')
      return
    }

    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted')
      return
    }

    try {
      const notification = new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        badge: payload.badge || '/icons/badge-72x72.png',
        image: payload.image,
        data: payload.data,
        tag: payload.tag,
        requireInteraction: payload.requireInteraction,
        silent: payload.silent,
        vibrate: payload.vibrate || [200, 100, 200]
      })

      // Handle notification click
      notification.onclick = () => {
        notification.close()
        if (payload.data?.url) {
          window.open(payload.data.url, '_blank')
        }
      }

      // Auto-close after 5 seconds if not urgent
      if (payload.data?.priority !== 'urgent') {
        setTimeout(() => notification.close(), 5000)
      }
    } catch (error) {
      console.error('Failed to show notification:', error)
    }
  }

  // Save subscription to server
  private async saveSubscription(userId: string, subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          subscription: subscription.toJSON()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save subscription')
      }
    } catch (error) {
      console.error('Failed to save subscription:', error)
    }
  }

  // Convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }
}

// Enhanced email templates for personnel app
const enhancedEmailTemplates: Record<string, (data: any) => EmailTemplate> = {
  chat_message: (data) => ({
    subject: `Nytt meddelande från ${data.senderName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #002A5C; color: white; padding: 20px; text-align: center;">
          <h1>Nordflytt - Nytt Meddelande</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Du har fått ett nytt meddelande</h2>
          <div style="background-color: #f0f8ff; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #002A5C;">
            <strong>Från:</strong> ${data.senderName}<br>
            <strong>Rum:</strong> ${data.roomName}<br>
            <strong>Meddelande:</strong> ${data.message}
          </div>
          <p><a href="${data.chatUrl}" style="background-color: #002A5C; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Öppna Chat</a></p>
        </div>
      </div>
    `,
    text: `Nytt meddelande från ${data.senderName} i ${data.roomName}: ${data.message}\n\nÖppna chat: ${data.chatUrl}`
  }),

  emergency_alert: (data) => ({
    subject: `🚨 NÖDMEDDELANDE - ${data.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
          <h1>🚨 NÖDMEDDELANDE</h1>
        </div>
        <div style="padding: 20px; border: 3px solid #dc2626;">
          <h2 style="color: #dc2626;">${data.title}</h2>
          <div style="background-color: #fef2f2; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #dc2626;">
            <strong>Från:</strong> ${data.senderName}<br>
            <strong>Tid:</strong> ${data.timestamp}<br>
            <strong>Meddelande:</strong> ${data.message}
          </div>
          <p style="color: #dc2626; font-weight: bold;">Detta är ett nödmeddelande som kräver omedelbar uppmärksamhet.</p>
          <p><a href="${data.emergencyUrl}" style="background-color: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Öppna Nödchat</a></p>
        </div>
      </div>
    `,
    text: `🚨 NÖDMEDDELANDE\n\n${data.title}\n\nFrån: ${data.senderName}\nTid: ${data.timestamp}\nMeddelande: ${data.message}\n\nÖppna nödchat: ${data.emergencyUrl}`
  })
}

// Enhanced SMS templates for personnel app
const enhancedSmsTemplates: Record<string, (data: any) => SMSTemplate> = {
  chat_message: (data) => ({
    message: `Nordflytt: Nytt meddelande från ${data.senderName}: ${data.message.substring(0, 100)}${data.message.length > 100 ? '...' : ''}`
  }),

  emergency_alert: (data) => ({
    message: `🚨 NÖDMEDDELANDE från ${data.senderName}: ${data.message}. Ring 08-123 456 78 OMEDELBART!`
  })
}

// Staff timer reminders for field work
export interface StaffReminder {
  id: string
  type: 'photo' | 'time_tracking' | 'break' | 'checklist'
  title: string
  message: string
  triggerTime: Date
  jobId?: string
  serviceType?: string
  isActive: boolean
  hasTriggered: boolean
}

export class StaffReminderService {
  private reminders: StaffReminder[] = []
  private intervalId: NodeJS.Timeout | null = null
  private pushManager: WebPushManager

  constructor() {
    this.pushManager = WebPushManager.getInstance()
    this.loadReminders()
    this.startReminderLoop()
  }

  // Add a new reminder
  addReminder(reminder: Omit<StaffReminder, 'id' | 'hasTriggered'>): string {
    const newReminder: StaffReminder = {
      ...reminder,
      id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      hasTriggered: false
    }

    this.reminders.push(newReminder)
    this.saveReminders()
    
    console.log(`Staff reminder added: ${newReminder.title} at ${newReminder.triggerTime}`)
    return newReminder.id
  }

  // Add photo reminder
  addPhotoReminder(jobId: string, serviceType: string, phase: 'before' | 'during' | 'after', delayMinutes: number = 30): string {
    const triggerTime = new Date(Date.now() + delayMinutes * 60 * 1000)
    
    const phaseText = {
      before: 'före',
      during: 'under', 
      after: 'efter'
    }[phase]

    return this.addReminder({
      type: 'photo',
      title: `📷 Fotodokumentation krävs`,
      message: `Glöm inte att fotografera ${phaseText} ${serviceType}. Dokumentation är obligatorisk för kvalitetskontroll.`,
      triggerTime,
      jobId,
      serviceType,
      isActive: true
    })
  }

  // Add time tracking reminder
  addTimeTrackingReminder(jobId: string, action: 'start' | 'stop', delayMinutes: number = 5): string {
    const triggerTime = new Date(Date.now() + delayMinutes * 60 * 1000)
    
    const actionText = action === 'start' ? 'starta' : 'stoppa'
    
    return this.addReminder({
      type: 'time_tracking',
      title: `⏰ Tidsregistrering`,
      message: `Glöm inte att ${actionText} tidsregistreringen för uppdraget.`,
      triggerTime,
      jobId,
      isActive: true
    })
  }

  // Add break reminder
  addBreakReminder(jobId: string, workStartTime: Date): string {
    // Remind about break after 4 hours of work
    const triggerTime = new Date(workStartTime.getTime() + 4 * 60 * 60 * 1000)
    
    return this.addReminder({
      type: 'break',
      title: `☕ Dags för paus`,
      message: `Du har arbetat i 4 timmar. Dags att ta en välförtjänt paus!`,
      triggerTime,
      jobId,
      isActive: true
    })
  }

  // Remove reminder
  removeReminder(id: string): boolean {
    const index = this.reminders.findIndex(r => r.id === id)
    if (index !== -1) {
      this.reminders.splice(index, 1)
      this.saveReminders()
      return true
    }
    return false
  }

  // Check and trigger reminders
  private async checkReminders(): Promise<void> {
    const now = new Date()
    
    for (const reminder of this.reminders) {
      if (reminder.isActive && !reminder.hasTriggered && reminder.triggerTime <= now) {
        await this.triggerReminder(reminder)
      }
    }
  }

  // Trigger a specific reminder
  private async triggerReminder(reminder: StaffReminder): Promise<void> {
    reminder.hasTriggered = true
    this.saveReminders()

    const pushPayload: PushNotificationPayload = {
      title: reminder.title,
      body: reminder.message,
      icon: '/nordflytt-logo.png',
      requireInteraction: true,
      tag: reminder.type,
      data: {
        type: reminder.type,
        jobId: reminder.jobId,
        serviceType: reminder.serviceType,
        reminderId: reminder.id,
        action: reminder.type
      },
      vibrate: [200, 100, 200]
    }

    // Add specific actions based on reminder type
    if (reminder.type === 'photo') {
      pushPayload.actions = [
        { action: 'take_photo', title: 'Ta foto nu' },
        { action: 'snooze', title: 'Påminn senare (15min)' }
      ]
    } else if (reminder.type === 'time_tracking') {
      pushPayload.actions = [
        { action: 'open_time_tracking', title: 'Öppna tidsregistrering' },
        { action: 'dismiss', title: 'OK' }
      ]
    }

    await this.pushManager.sendLocalNotification(pushPayload)
    
    // Also dispatch custom event for app to handle
    window.dispatchEvent(new CustomEvent('staff-reminder-triggered', {
      detail: reminder
    }))

    console.log(`Staff reminder triggered: ${reminder.title}`)
  }

  // Start reminder checking loop
  private startReminderLoop(): void {
    // Only start the loop in browser environment
    if (typeof window === 'undefined') {
      return
    }
    
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }

    this.intervalId = setInterval(() => {
      this.checkReminders()
    }, 30000) // Check every 30 seconds
  }

  // Save/load from localStorage
  private saveReminders(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('staff_reminders', JSON.stringify(this.reminders))
    }
  }

  private loadReminders(): void {
    try {
      // Check if we're in the browser
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('staff_reminders')
        if (saved) {
          this.reminders = JSON.parse(saved).map((r: any) => ({
            ...r,
            triggerTime: new Date(r.triggerTime)
          }))
        }
      }
    } catch (error) {
      console.error('Error loading staff reminders:', error)
      this.reminders = []
    }
  }

  // Cleanup old reminders
  cleanupOldReminders(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    this.reminders = this.reminders.filter(
      r => !r.hasTriggered || r.triggerTime > oneDayAgo
    )
    this.saveReminders()
  }

  // Stop the service
  destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }
}

// Global staff reminder service instance (lazy initialization)
let _staffReminderService: StaffReminderService | null = null

export const getStaffReminderService = (): StaffReminderService => {
  if (typeof window === 'undefined') {
    // Return a mock service for server-side rendering
    return {
      addReminder: () => '',
      removeReminder: () => {},
      getRemindersByJob: () => [],
      getUpcomingReminders: () => [],
      cleanupOldReminders: () => {},
      destroy: () => {}
    } as StaffReminderService
  }
  
  if (!_staffReminderService) {
    _staffReminderService = new StaffReminderService()
  }
  return _staffReminderService
}

// For backward compatibility - create a proxy that calls the getter
export const staffReminderService = new Proxy({} as StaffReminderService, {
  get(_, prop) {
    const service = getStaffReminderService()
    return service[prop as keyof StaffReminderService]
  }
})

// Enhanced notification service for personnel app
export const personnelNotificationService = {
  // Initialize push notifications
  async initializePushNotifications(userId: string): Promise<boolean> {
    try {
      const pushManager = WebPushManager.getInstance()
      const initialized = await pushManager.initialize()
      
      if (initialized) {
        const permission = await pushManager.requestPermission()
        if (permission === 'granted') {
          await pushManager.subscribe(userId)
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Failed to initialize push notifications:', error)
      return false
    }
  },

  // Send local notification (for current tab)
  async sendLocalNotification(payload: PushNotificationPayload): Promise<void> {
    const pushManager = WebPushManager.getInstance()
    await pushManager.sendLocalNotification(payload)
  },

  // Send chat message notification
  async sendChatNotification(recipientId: string, senderName: string, roomName: string, message: string, isEmergency = false): Promise<void> {
    const notificationData: NotificationData = {
      type: isEmergency ? 'emergency_alert' : 'chat_message',
      title: isEmergency ? '🚨 Nödmeddelande' : `Nytt meddelande från ${senderName}`,
      message: message,
      recipientId,
      priority: isEmergency ? 'urgent' : 'normal',
      actionUrl: `/staff/chat`,
      metadata: {
        senderName,
        roomName,
        message,
        chatUrl: `/staff/chat`,
        timestamp: new Date().toISOString()
      }
    }

    // Send local notification
    const pushPayload: PushNotificationPayload = {
      title: notificationData.title,
      body: notificationData.message,
      icon: '/icons/icon-192x192.png',
      data: {
        type: notificationData.type,
        priority: notificationData.priority,
        url: notificationData.actionUrl,
        ...notificationData.metadata
      },
      requireInteraction: isEmergency,
      vibrate: isEmergency ? [200, 100, 200, 100, 200] : [200, 100, 200]
    }

    await this.sendLocalNotification(pushPayload)
  },

  // Send emergency alert
  async sendEmergencyAlert(recipientIds: string[], senderName: string, message: string): Promise<void> {
    const emergencyPayload: PushNotificationPayload = {
      title: '🚨 NÖDMEDDELANDE',
      body: `${senderName}: ${message}`,
      icon: '/icons/emergency-icon-192x192.png',
      data: {
        type: 'emergency_alert',
        priority: 'urgent',
        url: `/staff/emergency`,
        senderName,
        message,
        timestamp: new Date().toISOString()
      },
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200],
      tag: 'emergency'
    }

    // Send to all recipients
    await this.sendLocalNotification(emergencyPayload)
  }
}

export async function sendBookingNotifications(
  bookingId: string,
  formData: any,
  bookingReference: string
): Promise<{
  emailSent: boolean;
  smsSent: boolean;
  emailError: string | null;
  smsError: string | null;
}> {
  // Only run on server side
  if (typeof window !== 'undefined') {
    console.log('[NOTIFICATION] Skipping client-side execution')
    return { emailSent: false, smsSent: false, emailError: 'Client-side execution', smsError: 'Client-side execution' }
  }

  // Get server modules dynamically
  const serverModules = await getServerModules()
  if (!serverModules) {
    return { emailSent: false, smsSent: false, emailError: 'Server modules not available', smsError: 'Server modules not available' }
  }

  const { sendBookingConfirmation, sendBookingSMS } = serverModules

  // Random delay för att förhindra race conditions
  const delay = Math.random() * 1000 + 500; // 500-1500ms delay
  console.log(`[NOTIFICATION] Väntar ${Math.round(delay)}ms innan sending...`);
  await new Promise(resolve => setTimeout(resolve, delay));
  
  console.log(`[NOTIFICATION] Börjar process för offert ${bookingId}`);
  
  let emailSent = false;
  let smsSent = false;
  let emailError: string | null = null;
  let smsError: string | null = null;

  // Skicka email med SendGrid
  try {
    console.log(`[NOTIFICATION] Försöker skicka email till ${formData.email}`);
    
    const emailResult = await sendBookingConfirmation({
      to: formData.email,
      bookingId,
      bookingRef: bookingReference,
      customerName: capitalizeFullName(formData.name),  // 🔧 FIXAT: Kapitaliserat namn
      isPrepaid: formData.paymentMethod === 'swish_prepayment' && formData.paymentStatus === 'prepaid',
      totalPrice: formData.totalPrice,
      swishPaymentId: formData.swishPaymentId
    });
    
    emailSent = emailResult.success;
    if (!emailResult.success) {
      emailError = emailResult.error || 'Unknown email error';
    }
    
    console.log(`[NOTIFICATION] Email resultat:`, emailResult);
  } catch (error) {
    console.error(`[NOTIFICATION] Email fel:`, error);
    emailError = error instanceof Error ? error.message : 'Unknown email error';
  }

  // Skicka SMS med Twilio
  try {
    console.log(`[NOTIFICATION] Försöker skicka SMS till ${formData.phone}`);
    
    const smsResult = await sendBookingSMS({
      to: formData.phone,
      bookingId,
      bookingRef: bookingReference,
      customerName: capitalizeFullName(formData.name),  // 🔧 FIXAT: Kapitaliserat namn
      isPrepaid: formData.paymentMethod === 'swish_prepayment' && formData.paymentStatus === 'prepaid'
    });
    
    smsSent = smsResult.success;
    if (!smsResult.success) {
      smsError = smsResult.error || 'Unknown SMS error';
    }
    
    console.log(`[NOTIFICATION] SMS resultat:`, smsResult);
  } catch (error) {
    console.error(`[NOTIFICATION] SMS fel:`, error);
    smsError = error instanceof Error ? error.message : 'Unknown SMS error';
  }

  const finalResult = {
    emailSent,
    smsSent,
    emailError,
    smsError
  };

  console.log(`[NOTIFICATION] SLUTRESULTAT för offert ${bookingId}:`, finalResult);
  
  return finalResult;
}

export async function sendOrderConfirmationNotifications(
  bookingId: string,
  bookingRef: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  moveDate: string,
  moveTime: string,
  startAddress: string,
  endAddress: string,
  services: string[],
  totalPrice: string,
  kubikMeter: string
) {
  console.log(`[ORDER NOTIFICATION] Börjar process för bekräftelse ${bookingId}`);
  
  let emailSent = false;
  let smsSent = false;
  let emailError = null;
  let smsError = null;

  const confirmationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/order-confirmation/${bookingId}`;

  // Skicka bekräftelse-email med SendGrid
  try {
    console.log(`[ORDER NOTIFICATION] Försöker skicka bekräftelse-email till ${customerEmail}`);
    
    const emailResult = await sendOrderConfirmation({
      to: customerEmail,
      bookingId,
      bookingRef,
      customerName: capitalizeFullName(customerName),  // 🔧 FIXAT: Kapitaliserat namn
      moveDate,
      moveTime,
      startAddress,
      endAddress,
      services,
      totalPrice,
      kubikMeter,
      confirmationUrl
    });
    
    emailSent = emailResult.success;
    if (!emailResult.success) {
      emailError = emailResult.error || 'Unknown email error';
    }
    
    console.log(`[ORDER NOTIFICATION] Email resultat:`, emailResult);
  } catch (error) {
    console.error(`[ORDER NOTIFICATION] Email fel:`, error);
    emailError = error instanceof Error ? error.message : 'Unknown email error';
  }

  // Skicka bekräftelse-SMS med Twilio
  try {
    console.log(`[ORDER NOTIFICATION] Försöker skicka bekräftelse-SMS till ${customerPhone}`);
    
    const smsResult = await sendOrderConfirmationSMS({
      to: customerPhone,
      bookingId,
      bookingRef,
      customerName: capitalizeFullName(customerName),  // 🔧 FIXAT: Kapitaliserat namn
      moveDate,
      moveTime,
      services,
      totalPrice,
      kubikMeter,
      confirmationUrl
    });
    
    smsSent = smsResult.success;
    if (!smsResult.success) {
      smsError = smsResult.error || 'Unknown SMS error';
    }
    
    console.log(`[ORDER NOTIFICATION] SMS resultat:`, smsResult);
  } catch (error) {
    console.error(`[ORDER NOTIFICATION] SMS fel:`, error);
    smsError = error instanceof Error ? error.message : 'Unknown SMS error';
  }

  const finalResult = {
    emailSent,
    smsSent,
    emailError,
    smsError
  };

  console.log(`[ORDER NOTIFICATION] SLUTRESULTAT för bekräftelse ${bookingId}:`, finalResult);
  
  return finalResult;
}

// Server-only configuration (moved to getServerModules function)
const getConfiguredClients = async () => {
  if (typeof window !== 'undefined') return null
  
  const serverModules = await getServerModules()
  if (!serverModules) return null
  
  const { sgMail, twilio } = serverModules
  
  // Configure SendGrid for offer notifications
  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }

  // Configure Twilio for offer notifications
  const twilioClientForOffers = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;
    
  return { sgMail, twilioClientForOffers }
}

// Helper function to normalize phone numbers for Twilio (for offers)
function normalizePhoneNumberForOffers(phone: string): string {
  // Remove all non-digits and +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // If number starts with 0, assume it's Swedish and replace 0 with +46
  if (cleaned.startsWith('0')) {
    return '+46' + cleaned.substring(1);
  }
  
  // If number doesn't have country code, add +46
  if (!cleaned.startsWith('+')) {
    return '+46' + cleaned;
  }
  
  return cleaned;
}

/**
 * Sends both email and SMS notifications for an offer
 */
export async function sendOfferNotifications(offer: Offer) {
  // Verify that we have contact information
  if (!offer.email && !offer.phone) {
    console.warn("Cannot send notifications: Missing both email and phone number");
    return { emailSuccess: false, smsSuccess: false };
  }

  // Send notifications in parallel
  const [emailResult, smsResult] = await Promise.allSettled([
    offer.email ? sendEmailNotification(offer) : Promise.resolve(false),
    offer.phone ? sendSMSNotification(offer) : Promise.resolve(false)
  ]);

  return {
    emailSuccess: emailResult.status === "fulfilled" ? emailResult.value : false,
    smsSuccess: smsResult.status === "fulfilled" ? smsResult.value : false
  };
}

/**
 * Sends email notification via SendGrid
 */
async function sendEmailNotification(offer: Offer): Promise<boolean> {
  if (typeof window !== 'undefined') return false // Client-side guard
  
  const clients = await getConfiguredClients()
  if (!clients) return false
  
  const { sgMail } = clients

  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
    console.error("SendGrid configuration missing");
    return false;
  }

  if (!offer.email) {
    console.warn("Cannot send email: Email address missing");
    return false;
  }

  try {
    const emailContent = `
      Hej ${offer.customerName}!

      Din offert från Nordflytt är klar. Klicka här för att se detaljer och boka:
      ${generateOfferLink(offer.id)}

      Med vänliga hälsningar,
      Nordflytt Team
    `;

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hej ${offer.customerName}!</h2>
        <p>Din offert från Nordflytt är klar.</p>
        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/offer/${offer.id}" style="display: inline-block; background-color: #4a90e2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Visa offert</a></p>
        <p>Om länken ovan inte fungerar, kopiera denna URL till din webbläsare:</p>
        <p>${process.env.NEXT_PUBLIC_BASE_URL}/offer/${offer.id}</p>
        <p>Med vänliga hälsningar,<br>Nordflytt Team</p>
      </div>
    `;

    const msg = {
      to: offer.email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: "Din offert från Nordflytt",
      text: emailContent,
      html: htmlContent,
    };

    await sgMail.send(msg);
    console.log(`Email sent to ${offer.email}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

/**
 * Sends SMS notification via Twilio
 */
async function sendSMSNotification(offer: Offer): Promise<boolean> {
  if (typeof window !== 'undefined') return false // Client-side guard
  
  const clients = await getConfiguredClients()
  if (!clients) return false
  
  const { twilioClientForOffers } = clients

  if (!twilioClientForOffers) {
    console.error("Twilio configuration missing");
    return false;
  }

  if (!offer.phone) {
    console.warn("Cannot send SMS: Phone number missing");
    return false;
  }

  try {
    const smsContent = `Hej ${offer.customerName}! Din offert från Nordflytt är klar. Visa och boka här: ${process.env.NEXT_PUBLIC_BASE_URL}/offer/${offer.id}`;

    // Use alphanumeric sender if available, otherwise phone number
    const sender = process.env.TWILIO_ALPHA_SENDER || process.env.TWILIO_PHONE_NUMBER;
    
    if (!sender) {
      console.error("No sender configured for SMS");
      return false;
    }

    await twilioClientForOffers.messages.create({
      body: smsContent,
      from: sender,
      to: normalizePhoneNumberForOffers(offer.phone)
    });

    console.log(`SMS sent to ${offer.phone} from ${sender}`);
    return true;
  } catch (error) {
    console.error("Error sending SMS:", error);
    return false;
  }
}