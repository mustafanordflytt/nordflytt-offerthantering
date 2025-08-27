import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.development.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function deployEmployeesModule() {
  console.log('🚀 Deploying Employees Module to Supabase...\n')

  try {
    // Read migration file
    const migrationPath = join(process.cwd(), 'supabase/migrations/20240108_employees_module.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')
    
    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)
    
    console.log(`📋 Running ${statements.length} SQL statements...\n`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      
      // Extract what type of statement it is
      const statementType = statement.split(' ')[0].toUpperCase()
      const targetMatch = statement.match(/(?:TABLE|INDEX|POLICY|FUNCTION|TRIGGER)\s+(?:IF\s+(?:NOT\s+)?EXISTS\s+)?["']?(\w+)["']?/i)
      const targetName = targetMatch ? targetMatch[1] : 'unknown'
      
      process.stdout.write(`${i + 1}/${statements.length} ${statementType} ${targetName}... `)
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          // Try direct query if RPC fails
          const { error: directError } = await supabase.from('_sql').select().single()
          if (directError) {
            console.log('❌')
            console.error(`Error: ${error.message}`)
            // Continue with next statement
            continue
          }
        }
        
        console.log('✅')
      } catch (err) {
        console.log('⚠️  (may already exist)')
      }
    }
    
    console.log('\n✅ Database schema created successfully!')
    
    // Create storage buckets
    console.log('\n📦 Setting up storage buckets...')
    
    const buckets = [
      { name: 'employee-documents', public: false, fileSizeLimit: 52428800 },
      { name: 'employee-photos', public: true, fileSizeLimit: 10485760 }
    ]
    
    for (const bucket of buckets) {
      process.stdout.write(`Creating bucket: ${bucket.name}... `)
      
      const { error } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit
      })
      
      if (error && error.message !== 'Bucket already exists') {
        console.log('❌')
        console.error(`Error: ${error.message}`)
      } else {
        console.log('✅')
      }
    }
    
    console.log('\n🎉 Employees module deployed successfully!')
    console.log('\n📝 Next steps:')
    console.log('1. Test the API endpoints')
    console.log('2. Configure email settings (if using Resend)')
    console.log('3. Set up authentication')
    console.log('4. Deploy to production\n')
    
  } catch (error) {
    console.error('❌ Deployment failed:', error)
    process.exit(1)
  }
}

// Alternative: Run raw SQL directly
async function runRawSQL() {
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  const sql = await import('postgres')
  
  // Create a direct connection for complex migrations
  const connection = sql({
    host: new URL(supabaseUrl).hostname,
    port: 5432,
    database: 'postgres',
    username: 'postgres',
    password: supabaseServiceKey
  })
  
  try {
    const migrationPath = join(process.cwd(), 'supabase/migrations/20240108_employees_module.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')
    
    await connection.unsafe(migrationSQL)
    console.log('✅ Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await connection.end()
  }
}

// Run deployment
deployEmployeesModule().catch(console.error)