import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gindcnpiejkntkangpuc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpbmRjbnBpZWprbnRrYW5ncHVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDMyMzY4NiwiZXhwIjoyMDU5ODk5Njg2fQ.F9KYqVlv5pB-_0YD8JkJdyCKpf_Tp8OVzWt5a3KQFSk'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createCRMUsersTable() {
  console.log('🔨 Creating CRM users table...\n')
  
  try {
    // Create the crm_users table
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS crm_users (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          email TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'employee', 'readonly')),
          department TEXT,
          avatar TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          last_login_at TIMESTAMP WITH TIME ZONE
        );
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_crm_users_email ON crm_users(email);
        CREATE INDEX IF NOT EXISTS idx_crm_users_role ON crm_users(role);
        CREATE INDEX IF NOT EXISTS idx_crm_users_is_active ON crm_users(is_active);
        
        -- Enable RLS
        ALTER TABLE crm_users ENABLE ROW LEVEL SECURITY;
        
        -- Policy for users to read their own data
        CREATE POLICY "Users can read own data" ON crm_users
          FOR SELECT
          USING (auth.uid() = id);
        
        -- Policy for admins to read all data
        CREATE POLICY "Admins can read all data" ON crm_users
          FOR SELECT
          USING (
            EXISTS (
              SELECT 1 FROM crm_users
              WHERE id = auth.uid() AND role = 'admin'
            )
          );
        
        -- Policy for managers to read their department
        CREATE POLICY "Managers can read department data" ON crm_users
          FOR SELECT
          USING (
            EXISTS (
              SELECT 1 FROM crm_users u1
              WHERE u1.id = auth.uid() AND u1.role = 'manager'
              AND (u1.department = crm_users.department OR crm_users.role = 'employee')
            )
          );
        
        -- Policy for admins to update all data
        CREATE POLICY "Admins can update all data" ON crm_users
          FOR UPDATE
          USING (
            EXISTS (
              SELECT 1 FROM crm_users
              WHERE id = auth.uid() AND role = 'admin'
            )
          );
      `
    })
    
    if (createError) {
      console.error('❌ Error creating table:', createError)
      return
    }
    
    console.log('✅ Table created successfully')
    
    // Now add Mustafa to the crm_users table
    console.log('\n2. Adding Mustafa to crm_users...')
    
    const { error: insertError } = await supabase
      .from('crm_users')
      .insert({
        id: '6a8589db-f55a-4e97-bd46-1dfb8b725909',
        email: 'mustafa@nordflytt.se',
        name: 'Mustafa Abdulkarim',
        role: 'admin',
        department: 'IT',
        is_active: true
      })
    
    if (insertError) {
      console.error('❌ Error adding user:', insertError)
      // Try to update if already exists
      const { error: updateError } = await supabase
        .from('crm_users')
        .update({
          name: 'Mustafa Abdulkarim',
          role: 'admin',
          department: 'IT',
          is_active: true
        })
        .eq('id', '6a8589db-f55a-4e97-bd46-1dfb8b725909')
      
      if (updateError) {
        console.error('❌ Error updating user:', updateError)
      } else {
        console.log('✅ User updated successfully')
      }
    } else {
      console.log('✅ User added successfully')
    }
    
    // Add other default users if they exist in auth
    const defaultUsers = [
      { email: 'admin@nordflytt.se', name: 'Admin Användare', role: 'admin', department: 'Management' },
      { email: 'manager@nordflytt.se', name: 'Manager Användare', role: 'manager', department: 'Operations' },
      { email: 'employee@nordflytt.se', name: 'Anställd Användare', role: 'employee', department: 'Field' }
    ]
    
    for (const user of defaultUsers) {
      console.log(`\nChecking ${user.email}...`)
      
      // Get user ID from auth
      const { data: authUsers } = await supabase.auth.admin.listUsers()
      const authUser = authUsers?.users.find(u => u.email === user.email)
      
      if (authUser) {
        const { error } = await supabase
          .from('crm_users')
          .upsert({
            id: authUser.id,
            email: user.email,
            name: user.name,
            role: user.role,
            department: user.department,
            is_active: true
          }, {
            onConflict: 'id'
          })
        
        if (error) {
          console.log(`   ⚠️  Could not add ${user.email}:`, error.message)
        } else {
          console.log(`   ✅ ${user.email} added/updated`)
        }
      } else {
        console.log(`   ⚠️  ${user.email} not found in auth`)
      }
    }
    
    // Verify the data
    console.log('\n3. Verifying crm_users data...')
    const { data: allUsers, error: fetchError } = await supabase
      .from('crm_users')
      .select('*')
      .order('created_at', { ascending: true })
    
    if (fetchError) {
      console.error('❌ Error fetching users:', fetchError)
    } else {
      console.log(`\n✅ Found ${allUsers.length} users in crm_users:`)
      allUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.role}) - ${user.name}`)
      })
    }
    
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

createCRMUsersTable()