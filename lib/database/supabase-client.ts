// Enhanced Supabase client with proper typing and error handling
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Public client (for client-side operations)
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
)

// Admin client (for server-side operations with elevated permissions)
export const supabaseAdmin: SupabaseClient<Database> = supabaseServiceKey 
  ? createClient<Database>(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: {
          schema: 'public'
        }
      }
    )
  : supabase

// Database operation helpers
export class DatabaseError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export async function withErrorHandling<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  errorContext: string
): Promise<T> {
  try {
    const { data, error } = await operation()
    
    if (error) {
      console.error(`Database error in ${errorContext}:`, error)
      throw new DatabaseError(`${errorContext}: ${error.message}`, error)
    }
    
    if (!data) {
      throw new DatabaseError(`${errorContext}: No data returned`)
    }
    
    return data
  } catch (err) {
    if (err instanceof DatabaseError) {
      throw err
    }
    console.error(`Unexpected error in ${errorContext}:`, err)
    throw new DatabaseError(`${errorContext}: Unexpected error`, err)
  }
}

// Connection test function
export async function testConnection(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('employees')
      .select('id')
      .limit(1)
    
    return !error
  } catch (error) {
    console.error('Database connection test failed:', error)
    return false
  }
}

// Schema validation function
export async function validateSchema(): Promise<{
  valid: boolean
  missingTables: string[]
  errors: string[]
}> {
  const requiredTables = [
    'employees',
    'jobs',
    'customers',
    'bookings',
    'staff_timereports',
    'staff_refresh_tokens'
  ]
  
  const missingTables: string[] = []
  const errors: string[] = []
  
  for (const table of requiredTables) {
    try {
      const { error } = await supabaseAdmin
        .from(table as any)
        .select('*')
        .limit(0)
      
      if (error) {
        if (error.message.includes('does not exist')) {
          missingTables.push(table)
        } else {
          errors.push(`${table}: ${error.message}`)
        }
      }
    } catch (err) {
      errors.push(`${table}: ${(err as Error).message}`)
    }
  }
  
  return {
    valid: missingTables.length === 0 && errors.length === 0,
    missingTables,
    errors
  }
}