import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deploySchema() {
  try {
    console.log('🚀 Starting schema deployment...\n');
    
    // Read the schema file
    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
    const schemaContent = await fs.readFile(schemaPath, 'utf-8');
    
    // Split into individual statements (careful with semicolons in strings)
    const statements = schemaContent
      .split(/;\s*$/gm)
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim() + ';');
    
    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const shortStatement = statement.substring(0, 50).replace(/\n/g, ' ');
      
      // Skip comments and empty statements
      if (statement.trim().startsWith('--') || statement.trim().length === 0) {
        continue;
      }
      
      process.stdout.write(`[${i + 1}/${statements.length}] ${shortStatement}... `);
      
      try {
        // Use raw SQL execution
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement
        }).catch(async (rpcError) => {
          // If RPC doesn't exist, try direct query
          const { error: directError } = await supabase
            .from('_sql_placeholder')
            .select()
            .limit(0)
            .then(() => ({ error: new Error('Direct SQL not supported') }));
          
          return { error: directError || rpcError };
        });
        
        if (error) {
          if (error.message?.includes('already exists') || 
              error.message?.includes('duplicate')) {
            console.log('⚠️  Already exists (skipped)');
            skipCount++;
          } else {
            console.log(`❌ Error: ${error.message}`);
            errorCount++;
          }
        } else {
          console.log('✅ Success');
          successCount++;
        }
      } catch (err) {
        console.log(`❌ Error: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log('\n📊 Deployment Summary:');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`⚠️  Skipped: ${skipCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📋 Total: ${statements.length}`);
    
    // Verify tables again
    console.log('\n🔍 Verifying business tables...');
    const businessTables = ['customers', 'leads', 'jobs', 'staff', 'quotes', 'job_assignments', 'communications'];
    
    for (const tableName of businessTables) {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ Table '${tableName}' - Not found`);
      } else {
        console.log(`✅ Table '${tableName}' - Found (${count || 0} records)`);
      }
    }
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Alternative: Manual deployment instructions
console.log('⚠️  Note: Direct SQL execution may require using Supabase Dashboard.');
console.log('📝 Alternative deployment method:');
console.log('1. Go to https://supabase.com/dashboard');
console.log('2. Select your project (gindcnpiejkntkangpuc)');
console.log('3. Navigate to SQL Editor');
console.log('4. Copy content from /database/schema.sql');
console.log('5. Paste and execute in SQL Editor\n');

// Instead, let's check what's missing and create missing tables individually
async function deployMissingTables() {
  console.log('🔧 Checking and creating missing tables...\n');
  
  // Check which tables are missing
  const requiredTables = {
    'job_assignments': `
      CREATE TABLE IF NOT EXISTS job_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        job_id UUID NOT NULL,
        staff_id UUID NOT NULL,
        role VARCHAR(50) DEFAULT 'assistant',
        status VARCHAR(50) DEFAULT 'assigned',
        assigned_at TIMESTAMP DEFAULT NOW(),
        accepted_at TIMESTAMP,
        completed_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `,
    'communications': `
      CREATE TABLE IF NOT EXISTS communications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID,
        lead_id UUID,
        job_id UUID,
        type VARCHAR(50) NOT NULL,
        channel VARCHAR(50) NOT NULL,
        direction VARCHAR(20) NOT NULL,
        subject VARCHAR(255),
        content TEXT,
        status VARCHAR(50) DEFAULT 'sent',
        metadata JSONB DEFAULT '{}',
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `,
    'system_settings': `
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(255) PRIMARY KEY,
        value JSONB NOT NULL,
        description TEXT,
        updated_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `
  };
  
  for (const [tableName, createStatement] of Object.entries(requiredTables)) {
    // Check if table exists
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`📝 Creating table '${tableName}'...`);
      
      // Since we can't execute raw SQL directly, we'll need to use Supabase Dashboard
      console.log(`⚠️  Table '${tableName}' needs to be created manually in Supabase Dashboard`);
      console.log(`SQL:\n${createStatement}\n`);
    } else {
      console.log(`✅ Table '${tableName}' already exists (${count || 0} records)`);
    }
  }
}

deployMissingTables();