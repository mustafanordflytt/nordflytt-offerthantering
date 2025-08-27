import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.development.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function runSQL() {
  console.log('Running OTP table creation SQL...')

  try {
    // Create OTP codes table
    const { error: createError } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS public.otp_codes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          phone TEXT NOT NULL,
          code TEXT NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          used BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          employee_id UUID REFERENCES public.employees(id)
        );
        
        -- Index for OTP lookups
        CREATE INDEX IF NOT EXISTS idx_otp_codes_phone_code ON public.otp_codes(phone, code);
        CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON public.otp_codes(expires_at);
      `
    })

    if (createError) {
      console.log('Note: exec_sql might not be available. Creating table directly...')
      
      // Try inserting a test record to see if table exists
      const testOTP = {
        phone: '+46700000000',
        code: '000000',
        expires_at: new Date(Date.now() - 1000).toISOString(), // Already expired
        used: true,
        employee_id: null
      }
      
      const { error: insertError } = await supabase
        .from('otp_codes')
        .insert([testOTP])
      
      if (insertError) {
        console.error('Table does not exist:', insertError.message)
        console.log('\nPlease run the SQL from sql/add-auth-fields-to-employees.sql in Supabase dashboard')
      } else {
        console.log('✅ OTP table exists!')
        
        // Clean up test record
        await supabase
          .from('otp_codes')
          .delete()
          .eq('phone', '+46700000000')
      }
    } else {
      console.log('✅ SQL executed successfully!')
    }

  } catch (error) {
    console.error('Error:', error)
  }
}

runSQL()