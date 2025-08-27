// Progressive migration from localStorage to database
import { supabase } from '@/lib/database/supabase-client'

export interface MigrationResult {
  success: boolean
  migratedItems: number
  errors: string[]
  needsRestart?: boolean
}

// Migration utilities
export class StorageMigration {
  private static readonly MIGRATION_KEY = 'storage_migration_status'
  
  static getMigrationStatus(): {
    version: number
    lastMigration: string
    completedMigrations: string[]
  } {
    const stored = localStorage.getItem(this.MIGRATION_KEY)
    return stored ? JSON.parse(stored) : {
      version: 0,
      lastMigration: '',
      completedMigrations: []
    }
  }
  
  static setMigrationStatus(status: any) {
    localStorage.setItem(this.MIGRATION_KEY, JSON.stringify({
      ...status,
      lastMigration: new Date().toISOString()
    }))
  }
  
  static async migrateTimeTracking(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      migratedItems: 0,
      errors: []
    }
    
    try {
      // Get time tracking data from localStorage
      const timeData = localStorage.getItem('time_tracking_data')
      if (!timeData) {
        result.success = true
        return result
      }
      
      const timeEntries = JSON.parse(timeData)
      let migrated = 0
      
      for (const entry of timeEntries) {
        try {
          const { error } = await supabase
            .from('staff_timereports')
            .insert({
              employee_id: entry.staffId || 'unknown',
              employee_name: entry.staffName || 'Unknown Staff',
              job_id: entry.jobId,
              booking_number: entry.bookingNumber || entry.jobId,
              customer_name: entry.customerName || 'Unknown Customer',
              service_type: entry.serviceType || 'Moving Service',
              start_time: entry.startTime,
              end_time: entry.endTime,
              duration_minutes: entry.duration,
              overtime_minutes: entry.overtime || 0,
              start_gps: entry.startGPS || {},
              end_gps: entry.endGPS || {},
              status: entry.status || 'completed'
            })
          
          if (!error) {
            migrated++
          } else {
            result.errors.push(`Time entry ${entry.jobId}: ${error.message}`)
          }
        } catch (err) {
          result.errors.push(`Time entry ${entry.jobId}: ${(err as Error).message}`)
        }
      }
      
      if (migrated > 0) {
        // Backup original data
        localStorage.setItem('time_tracking_data_backup', timeData)
        // Clear original data after successful migration
        localStorage.removeItem('time_tracking_data')
      }
      
      result.migratedItems = migrated
      result.success = result.errors.length === 0
      
      return result
    } catch (error) {
      result.errors.push(`Migration failed: ${(error as Error).message}`)
      return result
    }
  }
  
  static async migrateJobUpdates(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      migratedItems: 0,
      errors: []
    }
    
    try {
      // Get job updates from localStorage
      const jobUpdatesData = localStorage.getItem('job_updates')
      if (!jobUpdatesData) {
        result.success = true
        return result
      }
      
      const jobUpdates = JSON.parse(jobUpdatesData)
      let migrated = 0
      
      for (const [jobId, updateData] of Object.entries(jobUpdates)) {
        try {
          const update = updateData as any
          
          // Update job in database
          const { error } = await supabase
            .from('jobs')
            .update({
              additional_services: update.services || [],
              photos: update.photos || [],
              updated_at: new Date().toISOString()
            })
            .eq('id', jobId)
          
          if (!error) {
            migrated++
          } else {
            result.errors.push(`Job ${jobId}: ${error.message}`)
          }
        } catch (err) {
          result.errors.push(`Job ${jobId}: ${(err as Error).message}`)
        }
      }
      
      if (migrated > 0) {
        // Backup original data
        localStorage.setItem('job_updates_backup', jobUpdatesData)
        // Clear original data after successful migration
        localStorage.removeItem('job_updates')
      }
      
      result.migratedItems = migrated
      result.success = result.errors.length === 0
      
      return result
    } catch (error) {
      result.errors.push(`Migration failed: ${(error as Error).message}`)
      return result
    }
  }
  
  static async migrateAuthData(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      migratedItems: 0,
      errors: []
    }
    
    // Auth data migration is handled by the new JWT system
    // We just need to verify the new auth is working
    try {
      const authData = localStorage.getItem('staff_auth')
      if (authData) {
        const auth = JSON.parse(authData)
        if (!auth.token) {
          // Old auth format, needs new login
          result.needsRestart = true
          result.errors.push('Authentication format changed, please log in again')
        }
      }
    } catch (error) {
      result.errors.push(`Auth migration check failed: ${(error as Error).message}`)
    }
    
    return result
  }
  
  static async runAllMigrations(): Promise<{
    overallSuccess: boolean
    results: Record<string, MigrationResult>
    needsRestart: boolean
  }> {
    const status = this.getMigrationStatus()
    const results: Record<string, MigrationResult> = {}
    let overallSuccess = true
    let needsRestart = false
    
    console.log('Starting data migration from localStorage to database...')
    
    // Run migrations
    if (!status.completedMigrations.includes('timeTracking')) {
      console.log('Migrating time tracking data...')
      results.timeTracking = await this.migrateTimeTracking()
      if (results.timeTracking.success) {
        status.completedMigrations.push('timeTracking')
      } else {
        overallSuccess = false
      }
    }
    
    if (!status.completedMigrations.includes('jobUpdates')) {
      console.log('Migrating job updates...')
      results.jobUpdates = await this.migrateJobUpdates()
      if (results.jobUpdates.success) {
        status.completedMigrations.push('jobUpdates')
      } else {
        overallSuccess = false
      }
    }
    
    if (!status.completedMigrations.includes('authData')) {
      console.log('Checking auth data...')
      results.authData = await this.migrateAuthData()
      if (results.authData.success) {
        status.completedMigrations.push('authData')
      } else {
        overallSuccess = false
      }
      if (results.authData.needsRestart) {
        needsRestart = true
      }
    }
    
    // Update migration status
    status.version = 1
    this.setMigrationStatus(status)
    
    console.log('Migration complete:', {
      success: overallSuccess,
      migratedItems: Object.values(results).reduce((sum, r) => sum + r.migratedItems, 0),
      totalErrors: Object.values(results).reduce((sum, r) => sum + r.errors.length, 0)
    })
    
    return {
      overallSuccess,
      results,
      needsRestart
    }
  }
  
  // Clean up old localStorage data after successful migration
  static cleanup() {
    const keysToRemove = [
      'mock_jobs',
      'staff_cached_jobs_old',
      'job_status_cache',
      'service_cache',
      'photo_cache'
    ]
    
    keysToRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key)
      }
    })
  }
}