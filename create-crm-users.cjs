const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gindcnpiejkntkangpuc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpbmRjbnBpZWprbnRrYW5ncHVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDMyMzY4NiwiZXhwIjoyMDU5ODk5Njg2fQ.PDSFabceXFB7C3s868rhq4TU_3ElYD8h3xedNqm2aoI';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createCRMUsersTable() {
  console.log('🔨 Creating CRM users table and auth users...\n');
  
  try {
    // Create table using raw SQL
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS crm_users (
          id UUID PRIMARY KEY REFERENCES auth.users(id),
          email TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'employee', 'readonly')),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Create index on email for faster lookups
        CREATE INDEX IF NOT EXISTS idx_crm_users_email ON crm_users(email);
        
        -- Enable RLS
        ALTER TABLE crm_users ENABLE ROW LEVEL SECURITY;
        
        -- Create policy for users to read their own data
        CREATE POLICY IF NOT EXISTS "Users can read own data" ON crm_users
          FOR SELECT USING (auth.uid() = id);
          
        -- Create policy for admins to read all data
        CREATE POLICY IF NOT EXISTS "Admins can read all data" ON crm_users
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM crm_users 
              WHERE id = auth.uid() AND role = 'admin'
            )
          );
      `
    });
    
    if (createTableError) {
      console.log('Note: Table might already exist or exec_sql not available');
      console.log('Trying alternative approach...\n');
    }
    
    // Create test users
    const testUsers = [
      {
        email: 'admin@nordflytt.se',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin'
      },
      {
        email: 'manager@nordflytt.se', 
        password: 'manager123',
        name: 'Manager User',
        role: 'manager'
      },
      {
        email: 'employee@nordflytt.se',
        password: 'employee123', 
        name: 'Employee User',
        role: 'employee'
      }
    ];
    
    for (const user of testUsers) {
      console.log(`Creating user: ${user.email}`);
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true
      });
      
      if (authError) {
        if (authError.message.includes('already been registered')) {
          console.log(`  ⚠️  User ${user.email} already exists in auth`);
          
          // Get existing user
          const { data: { users } } = await supabase.auth.admin.listUsers();
          const existingUser = users.find(u => u.email === user.email);
          
          if (existingUser) {
            // Try to insert/update CRM user record
            const { error: upsertError } = await supabase
              .from('crm_users')
              .upsert({
                id: existingUser.id,
                email: user.email,
                name: user.name,
                role: user.role,
                is_active: true
              }, {
                onConflict: 'id'
              });
              
            if (upsertError) {
              console.log(`  ❌ Failed to upsert CRM user: ${upsertError.message}`);
            } else {
              console.log(`  ✅ CRM user record updated`);
            }
          }
        } else {
          console.log(`  ❌ Failed to create auth user: ${authError.message}`);
        }
        continue;
      }
      
      if (authData.user) {
        // Create CRM user record
        const { error: crmError } = await supabase
          .from('crm_users')
          .insert({
            id: authData.user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            is_active: true
          });
          
        if (crmError) {
          console.log(`  ❌ Failed to create CRM user: ${crmError.message}`);
        } else {
          console.log(`  ✅ User created successfully`);
        }
      }
    }
    
    console.log('\n📊 Verifying setup...');
    
    // Check auth users
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
    console.log(`\nAuth users: ${authUsers.length}`);
    authUsers.forEach(u => console.log(`  - ${u.email}`));
    
    // Check CRM users table
    const { data: crmUsers, error: fetchError } = await supabase
      .from('crm_users')
      .select('*');
      
    if (fetchError) {
      console.log(`\n❌ Cannot fetch from crm_users: ${fetchError.message}`);
      console.log('\nYou may need to create the table manually in Supabase dashboard');
    } else {
      console.log(`\nCRM users: ${crmUsers?.length || 0}`);
      crmUsers?.forEach(u => console.log(`  - ${u.email} (${u.role})`));
    }
    
  } catch (error) {
    console.error('Setup error:', error);
  }
}

createCRMUsersTable();