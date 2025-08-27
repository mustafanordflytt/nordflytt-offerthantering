// Smart UX Triggers för automatiska påminnelser och notifications
import { personnelNotificationService } from './notifications'

export interface TriggerCondition {
  id: string
  type: 'location_arrival' | 'time_delay' | 'missing_documentation' | 'overtime_detected' | 'break_reminder' | 'job_completion'
  jobId: string
  isActive: boolean
  triggerTime?: Date
  condition: any
  hasTriggered: boolean
  priority: 'low' | 'medium' | 'high' | 'critical'
}

export interface SmartTrigger {
  id: string
  name: string
  description: string
  conditions: TriggerCondition[]
  action: (context: any) => Promise<void>
  isEnabled: boolean
}

export class SmartTriggerService {
  private static instance: SmartTriggerService
  private triggers: Map<string, SmartTrigger> = new Map()
  private intervalId: NodeJS.Timeout | null = null
  private isRunning = false

  static getInstance(): SmartTriggerService {
    if (!SmartTriggerService.instance) {
      SmartTriggerService.instance = new SmartTriggerService()
    }
    return SmartTriggerService.instance
  }

  constructor() {
    this.initializeDefaultTriggers()
  }

  // Initialize default smart triggers based on UX analysis
  private initializeDefaultTriggers() {
    // 1. Location Arrival Trigger
    this.addTrigger({
      id: 'location_arrival',
      name: 'Platsankomst',
      description: 'Automatisk notifiering när personal kommer fram till jobbet',
      conditions: [],
      isEnabled: true,
      action: async (context) => {
        await this.handleLocationArrival(context)
      }
    })

    // 2. Time Warning Trigger  
    this.addTrigger({
      id: 'time_warnings',
      name: 'Tidsvarningar',
      description: 'Automatiska påminnelser vid försening och övertid',
      conditions: [],
      isEnabled: true,
      action: async (context) => {
        await this.handleTimeWarnings(context)
      }
    })

    // 3. Documentation Reminder Trigger
    this.addTrigger({
      id: 'documentation_reminder',
      name: 'Dokumentationspåminnelse',
      description: 'Påminnelser om saknad fotodokumentation',
      conditions: [],
      isEnabled: true,
      action: async (context) => {
        await this.handleDocumentationReminder(context)
      }
    })

    // 4. Job Completion Trigger
    this.addTrigger({
      id: 'job_completion',
      name: 'Jobbavslutning',
      description: 'Checklista och påminnelser vid jobbavslutning',
      conditions: [],
      isEnabled: true,
      action: async (context) => {
        await this.handleJobCompletion(context)
      }
    })

    // 5. Break and Wellbeing Trigger
    this.addTrigger({
      id: 'wellbeing_reminder',
      name: 'Välmående-påminnelser',
      description: 'Paus- och välmående-påminnelser under långa arbetspass',
      conditions: [],
      isEnabled: true,
      action: async (context) => {
        await this.handleWellbeingReminder(context)
      }
    })
  }

  // Add trigger to the system
  addTrigger(trigger: SmartTrigger) {
    this.triggers.set(trigger.id, trigger)
  }

  // Start monitoring all triggers
  startMonitoring() {
    if (this.isRunning) return

    this.isRunning = true
    this.intervalId = setInterval(() => {
      this.checkAllTriggers()
    }, 30000) // Check every 30 seconds

    console.log('🤖 Smart Trigger Service started')
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log('🤖 Smart Trigger Service stopped')
  }

  // Check all active triggers
  private async checkAllTriggers() {
    for (const [id, trigger] of this.triggers) {
      if (trigger.isEnabled) {
        await this.evaluateTrigger(trigger)
      }
    }
  }

  // Evaluate individual trigger
  private async evaluateTrigger(trigger: SmartTrigger) {
    // Get current context from localStorage and app state
    const context = this.getCurrentContext()
    
    // Check if trigger conditions are met
    const shouldTrigger = await this.shouldTriggerActivate(trigger, context)
    
    if (shouldTrigger) {
      try {
        await trigger.action(context)
        console.log(`🎯 Triggered: ${trigger.name}`)
      } catch (error) {
        console.error(`❌ Trigger error for ${trigger.name}:`, error)
      }
    }
  }

  // Determine if trigger should activate
  private async shouldTriggerActivate(trigger: SmartTrigger, context: any): Promise<boolean> {
    switch (trigger.id) {
      case 'location_arrival':
        return this.checkLocationArrival(context)
      case 'time_warnings':
        return this.checkTimeWarnings(context)
      case 'documentation_reminder':
        return this.checkDocumentationStatus(context)
      case 'job_completion':
        return this.checkJobCompletion(context)
      case 'wellbeing_reminder':
        return this.checkWellbeingStatus(context)
      default:
        return false
    }
  }

  // Get current app context
  private getCurrentContext() {
    try {
      const staffAuth = JSON.parse(localStorage.getItem('staff_auth') || '{}')
      const timeEntries = JSON.parse(localStorage.getItem('time_entries') || '[]')
      const photos = JSON.parse(localStorage.getItem('staff_photos') || '[]')
      const triggers = JSON.parse(localStorage.getItem('triggered_notifications') || '[]')
      
      return {
        staff: staffAuth,
        timeEntries,
        photos,
        triggeredNotifications: triggers,
        currentTime: new Date()
      }
    } catch (error) {
      console.error('Error getting context:', error)
      return {}
    }
  }

  // 1. Location Arrival Logic
  private checkLocationArrival(context: any): boolean {
    // Check if staff just arrived at location (GPS-based)
    if (!context.timeEntries?.length) return false

    const activeEntry = context.timeEntries.find((entry: any) => entry.status === 'started')
    if (!activeEntry) return false

    const startTime = new Date(activeEntry.startTime)
    const timeSinceStart = (context.currentTime.getTime() - startTime.getTime()) / (1000 * 60)

    // Trigger within first 5 minutes of starting work
    const withinArrivalWindow = timeSinceStart <= 5 && timeSinceStart >= 0
    const notAlreadyTriggered = !this.hasBeenTriggered('location_arrival', activeEntry.jobId)

    return withinArrivalWindow && notAlreadyTriggered
  }

  // 2. Time Warnings Logic
  private checkTimeWarnings(context: any): boolean {
    if (!context.timeEntries?.length) return false

    const activeEntry = context.timeEntries.find((entry: any) => entry.status === 'started')
    if (!activeEntry) return false

    const startTime = new Date(activeEntry.startTime)
    const workedMinutes = (context.currentTime.getTime() - startTime.getTime()) / (1000 * 60)

    // Check for various time-based warnings
    const timeWarnings = [
      { minutes: 240, type: 'break_reminder' }, // 4 hours
      { minutes: 480, type: 'long_shift' },     // 8 hours
      { minutes: 600, type: 'overtime_alert' }  // 10 hours
    ]

    for (const warning of timeWarnings) {
      if (workedMinutes >= warning.minutes && 
          workedMinutes <= warning.minutes + 5 && // 5-minute window
          !this.hasBeenTriggered(`time_${warning.type}`, activeEntry.jobId)) {
        return true
      }
    }

    return false
  }

  // 3. Documentation Status Logic
  private checkDocumentationStatus(context: any): boolean {
    if (!context.timeEntries?.length) return false

    const activeEntry = context.timeEntries.find((entry: any) => entry.status === 'started')
    if (!activeEntry) return false

    const startTime = new Date(activeEntry.startTime)
    const workedMinutes = (context.currentTime.getTime() - startTime.getTime()) / (1000 * 60)

    // Check if worked for 60+ minutes without photos
    if (workedMinutes >= 60) {
      const jobPhotos = context.photos?.filter((photo: any) => 
        photo.serviceType === activeEntry.serviceType
      ) || []

      const hasPhotos = jobPhotos.length > 0
      const notAlreadyTriggered = !this.hasBeenTriggered('documentation_missing', activeEntry.jobId)

      return !hasPhotos && notAlreadyTriggered
    }

    return false
  }

  // 4. Job Completion Logic
  private checkJobCompletion(context: any): boolean {
    // Check if job was recently completed
    const recentCompletions = context.timeEntries?.filter((entry: any) => {
      if (entry.status !== 'completed') return false
      
      const endTime = new Date(entry.endTime)
      const timeSinceEnd = (context.currentTime.getTime() - endTime.getTime()) / (1000 * 60)
      
      return timeSinceEnd <= 5 // Within 5 minutes of completion
    }) || []

    return recentCompletions.some((entry: any) => 
      !this.hasBeenTriggered('job_completed', entry.jobId)
    )
  }

  // 5. Wellbeing Status Logic
  private checkWellbeingStatus(context: any): boolean {
    if (!context.timeEntries?.length) return false

    const activeEntry = context.timeEntries.find((entry: any) => entry.status === 'started')
    if (!activeEntry) return false

    const startTime = new Date(activeEntry.startTime)
    const workedMinutes = (context.currentTime.getTime() - startTime.getTime()) / (1000 * 60)

    // Wellbeing check every 2 hours
    const wellbeingIntervals = [120, 300, 420] // 2h, 5h, 7h
    
    for (const interval of wellbeingIntervals) {
      if (workedMinutes >= interval && 
          workedMinutes <= interval + 5 &&
          !this.hasBeenTriggered(`wellbeing_${interval}`, activeEntry.jobId)) {
        return true
      }
    }

    return false
  }

  // Check if notification has been triggered
  private hasBeenTriggered(type: string, jobId: string): boolean {
    try {
      const triggered = JSON.parse(localStorage.getItem('triggered_notifications') || '[]')
      return triggered.some((t: any) => t.type === type && t.jobId === jobId)
    } catch {
      return false
    }
  }

  // Mark notification as triggered
  private markAsTriggered(type: string, jobId: string) {
    try {
      const triggered = JSON.parse(localStorage.getItem('triggered_notifications') || '[]')
      triggered.push({
        type,
        jobId,
        timestamp: new Date().toISOString()
      })
      localStorage.setItem('triggered_notifications', JSON.stringify(triggered))
    } catch (error) {
      console.error('Error marking trigger:', error)
    }
  }

  // TRIGGER ACTION HANDLERS

  private async handleLocationArrival(context: any) {
    const activeEntry = context.timeEntries.find((entry: any) => entry.status === 'started')
    if (!activeEntry) return

    await personnelNotificationService.sendLocalNotification({
      title: '📍 Välkommen till uppdraget!',
      body: 'Du har anlänt till arbetslokalen. Glöm inte att ta "före"-bilder för dokumentation.',
      icon: '/nordflytt-logo.png',
      data: {
        type: 'location_arrival',
        jobId: activeEntry.jobId,
        action: 'open_camera'
      },
      tag: 'location_arrival',
      actions: [
        { action: 'take_photo', title: 'Ta före-foto' },
        { action: 'dismiss', title: 'OK' }
      ]
    })

    this.markAsTriggered('location_arrival', activeEntry.jobId)
  }

  private async handleTimeWarnings(context: any) {
    const activeEntry = context.timeEntries.find((entry: any) => entry.status === 'started')
    if (!activeEntry) return

    const startTime = new Date(activeEntry.startTime)
    const workedMinutes = (context.currentTime.getTime() - startTime.getTime()) / (1000 * 60)

    let notificationData
    if (workedMinutes >= 240 && workedMinutes <= 245) {
      // 4-hour break reminder
      notificationData = {
        title: '☕ Dags för paus!',
        body: 'Du har arbetat i 4 timmar. Ta en välförtjänt paus för att hålla energin uppe.',
        triggerType: 'break_reminder'
      }
    } else if (workedMinutes >= 480 && workedMinutes <= 485) {
      // 8-hour long shift warning
      notificationData = {
        title: '⚠️ Långt arbetspass',
        body: 'Du har arbetat i 8 timmar. Överväg att ta en längre paus eller planera avslutning.',
        triggerType: 'long_shift'
      }
    } else if (workedMinutes >= 600 && workedMinutes <= 605) {
      // 10-hour overtime alert
      notificationData = {
        title: '🚨 Övertid påbörjad',
        body: 'Du har arbetat över 10 timmar. Glöm inte att rapportera övertid och orsak.',
        triggerType: 'overtime_alert'
      }
    }

    if (notificationData) {
      await personnelNotificationService.sendLocalNotification({
        title: notificationData.title,
        body: notificationData.body,
        icon: '/nordflytt-logo.png',
        data: {
          type: 'time_warning',
          jobId: activeEntry.jobId,
          triggerType: notificationData.triggerType
        },
        tag: 'time_warning',
        requireInteraction: notificationData.triggerType === 'overtime_alert',
        actions: [
          { action: 'view_hours', title: 'Visa timmar' },
          { action: 'dismiss', title: 'OK' }
        ]
      })

      this.markAsTriggered(`time_${notificationData.triggerType}`, activeEntry.jobId)
    }
  }

  private async handleDocumentationReminder(context: any) {
    const activeEntry = context.timeEntries.find((entry: any) => entry.status === 'started')
    if (!activeEntry) return

    await personnelNotificationService.sendLocalNotification({
      title: '📸 Saknad dokumentation',
      body: 'Du har arbetat i över en timme utan att ta bilder. Dokumentation är obligatorisk för kvalitetssäkring.',
      icon: '/nordflytt-logo.png',
      data: {
        type: 'documentation_reminder',
        jobId: activeEntry.jobId,
        serviceType: activeEntry.serviceType
      },
      tag: 'documentation',
      requireInteraction: true,
      actions: [
        { action: 'take_photo', title: 'Ta foto nu' },
        { action: 'remind_later', title: 'Påminn senare' }
      ]
    })

    this.markAsTriggered('documentation_missing', activeEntry.jobId)
  }

  private async handleJobCompletion(context: any) {
    const recentCompletion = context.timeEntries?.find((entry: any) => {
      if (entry.status !== 'completed') return false
      const endTime = new Date(entry.endTime)
      const timeSinceEnd = (context.currentTime.getTime() - endTime.getTime()) / (1000 * 60)
      return timeSinceEnd <= 5 && !this.hasBeenTriggered('job_completed', entry.jobId)
    })

    if (!recentCompletion) return

    await personnelNotificationService.sendLocalNotification({
      title: '✅ Bra jobbat!',
      body: 'Uppdraget är klart. Glöm inte att ta "efter"-bilder och kontrollera att allt är dokumenterat.',
      icon: '/nordflytt-logo.png',
      data: {
        type: 'job_completion',
        jobId: recentCompletion.jobId,
        serviceType: recentCompletion.serviceType
      },
      tag: 'job_completion',
      actions: [
        { action: 'take_after_photo', title: 'Ta efter-foto' },
        { action: 'view_summary', title: 'Visa sammanfattning' }
      ]
    })

    this.markAsTriggered('job_completed', recentCompletion.jobId)
  }

  private async handleWellbeingReminder(context: any) {
    const activeEntry = context.timeEntries.find((entry: any) => entry.status === 'started')
    if (!activeEntry) return

    const startTime = new Date(activeEntry.startTime)
    const workedMinutes = (context.currentTime.getTime() - startTime.getTime()) / (1000 * 60)

    let message = ''
    let triggerType = ''
    
    if (workedMinutes >= 120 && workedMinutes <= 125) {
      message = 'Du har arbetat i 2 timmar. Kom ihåg att hålla dig hydrerad och ta korta pauser.'
      triggerType = 'wellbeing_120'
    } else if (workedMinutes >= 300 && workedMinutes <= 305) {
      message = 'Du har arbetat i 5 timmar. Överväg att ta lunch eller en längre paus.'
      triggerType = 'wellbeing_300'
    } else if (workedMinutes >= 420 && workedMinutes <= 425) {
      message = 'Du har arbetat i 7 timmar. Håll koll på din energinivå och planera för avslutning.'
      triggerType = 'wellbeing_420'
    }

    if (message && triggerType) {
      await personnelNotificationService.sendLocalNotification({
        title: '💪 Hälsopåminnelse',
        body: message,
        icon: '/nordflytt-logo.png',
        data: {
          type: 'wellbeing_reminder',
          jobId: activeEntry.jobId,
          triggerType
        },
        tag: 'wellbeing'
      })

      this.markAsTriggered(triggerType, activeEntry.jobId)
    }
  }

  // Public method to manually trigger specific notifications
  async triggerManualNotification(type: string, context: any) {
    const trigger = this.triggers.get(type)
    if (trigger && trigger.isEnabled) {
      await trigger.action(context)
    }
  }

  // Get trigger statistics
  getTriggerStats() {
    try {
      const triggered = JSON.parse(localStorage.getItem('triggered_notifications') || '[]')
      const stats = triggered.reduce((acc: any, t: any) => {
        acc[t.type] = (acc[t.type] || 0) + 1
        return acc
      }, {})
      
      return {
        totalTriggered: triggered.length,
        byType: stats,
        lastTriggered: triggered[triggered.length - 1]?.timestamp
      }
    } catch {
      return { totalTriggered: 0, byType: {}, lastTriggered: null }
    }
  }
}

// Export singleton instance
export const smartTriggerService = SmartTriggerService.getInstance()