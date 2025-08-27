#!/usr/bin/env node

/**
 * Setup CRM Database Script
 * Verifies and sets up the complete CRM database schema
 */

import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkConnection() {
  console.log('🔄 Testing Supabase connection...');
  try {
    // Try to get schema information instead
    const { data, error } = await supabase.rpc('version');
    
    if (error && error.message.includes('could not find function "version"')) {
      // Function doesn't exist, try a different approach
      const { error: testError } = await supabase.from('information_schema.tables').select('table_name').limit(1);
      if (testError && !testError.message.includes('permission denied')) {
        throw testError;
      }
    } else if (error) {
      throw error;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.log('⚠️ Standard connection test failed, trying alternative...');
    
    // Alternative: Try to access any existing table
    try {
      const { error: altError } = await supabase.from('bookings').select('id').limit(1);
      if (altError && !altError.message.includes('relation') && !altError.message.includes('does not exist')) {
        throw altError;
      }
      console.log('✅ Supabase connection working (alternative test)');
      return true;
    } catch (altError) {
      console.error('❌ Supabase connection failed:', altError.message);
      return false;
    }
  }
}

async function checkTable(tableName, requiredColumns = []) {
  try {
    const { data, error } = await supabase.from(tableName).select('*').limit(1);
    
    if (error) {
      console.log(`❌ Table '${tableName}' does not exist or is not accessible`);
      return false;
    }
    
    if (requiredColumns.length > 0) {
      // Check if we can select specific columns to verify they exist
      const { error: columnError } = await supabase
        .from(tableName)
        .select(requiredColumns.join(','))
        .limit(1);
        
      if (columnError) {
        console.log(`⚠️ Table '${tableName}' missing required columns: ${requiredColumns.join(', ')}`);
        return false;
      }
    }
    
    console.log(`✅ Table '${tableName}' exists and accessible`);
    return true;
  } catch (error) {
    console.log(`❌ Error checking table '${tableName}':`, error.message);
    return false;
  }
}

async function checkCRMUsers() {
  console.log('🔄 Checking CRM users table...');
  
  const exists = await checkTable('crm_users', ['id', 'email', 'name', 'role']);
  if (!exists) {
    return false;
  }
  
  // Check if we have any users
  try {
    const { data: users, error } = await supabase
      .from('crm_users')
      .select('id, email, role')
      .limit(5);
      
    if (error) {
      console.log('❌ Cannot query CRM users:', error.message);
      return false;
    }
    
    console.log(`📊 Found ${users.length} CRM users`);
    if (users.length > 0) {
      console.log('   Sample users:');
      users.forEach(user => {
        console.log(`   - ${user.email} (${user.role})`);
      });
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error querying CRM users:', error.message);
    return false;
  }
}

async function checkCoreData() {
  console.log('🔄 Checking core CRM data tables...');
  
  const tables = [
    { name: 'customers', columns: ['id', 'name', 'email', 'status'] },
    { name: 'leads', columns: ['id', 'name', 'email', 'status'] },
    { name: 'jobs', columns: ['id', 'customer_id', 'status', 'job_number'] },
    { name: 'crm_activities', columns: ['id', 'user_id', 'activity_type'] }
  ];
  
  let allTablesExist = true;
  
  for (const table of tables) {
    const exists = await checkTable(table.name, table.columns);
    if (!exists) {
      allTablesExist = false;
    }
  }
  
  return allTablesExist;
}

async function getCRMStats() {
  console.log('📊 Getting CRM statistics...');
  
  try {
    const [customersResult, leadsResult, jobsResult, activitiesResult] = await Promise.all([
      supabase.from('customers').select('id').eq('status', 'active'),
      supabase.from('leads').select('id').in('status', ['new', 'contacted', 'qualified', 'proposal']),
      supabase.from('jobs').select('id, status, total_price'),
      supabase.from('crm_activities').select('id').limit(10)
    ]);
    
    const customers = customersResult.data || [];
    const leads = leadsResult.data || [];
    const jobs = jobsResult.data || [];
    const activities = activitiesResult.data || [];
    
    console.log('   Current CRM Data:');
    console.log(`   📧 Customers: ${customers.length} active`);
    console.log(`   🎯 Leads: ${leads.length} in pipeline`);
    console.log(`   💼 Jobs: ${jobs.length} total`);
    
    if (jobs.length > 0) {
      const activeJobs = jobs.filter(job => ['scheduled', 'in_progress'].includes(job.status));
      const completedJobs = jobs.filter(job => job.status === 'completed');
      const totalRevenue = completedJobs.reduce((sum, job) => sum + (job.total_price || 0), 0);
      
      console.log(`   📋 Active jobs: ${activeJobs.length}`);
      console.log(`   ✅ Completed jobs: ${completedJobs.length}`);
      console.log(`   💰 Total revenue: ${totalRevenue.toLocaleString('sv-SE')} kr`);
    }
    
    console.log(`   📝 Activities logged: ${activities.length > 9 ? '10+' : activities.length}`);
    
    return true;
  } catch (error) {
    console.log('❌ Error getting CRM stats:', error.message);
    return false;
  }
}

async function testAuthSystem() {
  console.log('🔐 Testing CRM authentication system...');
  
  try {
    // Check if we have the check_user_permission function
    const { data, error } = await supabase.rpc('check_user_permission', {
      user_id: '00000000-0000-0000-0000-000000000001',
      permission: 'customers:read'
    });
    
    if (error) {
      console.log('⚠️ Permission function not working:', error.message);
      return false;
    }
    
    console.log('✅ Permission system working');
    return true;
  } catch (error) {
    console.log('⚠️ Auth system test failed:', error.message);
    return false;
  }
}

async function runDatabaseSetup() {
  console.log('🚀 Starting CRM Database Setup\n');
  
  // Step 1: Check connection
  const connected = await checkConnection();
  if (!connected) {
    console.log('\n❌ Setup failed: Cannot connect to Supabase');
    process.exit(1);
  }
  
  console.log('');
  
  // Step 2: Check CRM users
  const crmUsersOk = await checkCRMUsers();
  console.log('');
  
  // Step 3: Check core data tables
  const coreDataOk = await checkCoreData();
  console.log('');
  
  // Step 4: Get statistics
  const statsOk = await getCRMStats();
  console.log('');
  
  // Step 5: Test auth system
  const authOk = await testAuthSystem();
  console.log('');
  
  // Summary
  console.log('📋 CRM Database Setup Summary');
  console.log('================================');
  console.log(`Database Connection: ${connected ? '✅' : '❌'}`);
  console.log(`CRM Users Table: ${crmUsersOk ? '✅' : '❌'}`);
  console.log(`Core Data Tables: ${coreDataOk ? '✅' : '❌'}`);
  console.log(`Statistics Available: ${statsOk ? '✅' : '❌'}`);
  console.log(`Authentication System: ${authOk ? '✅' : '❌'}`);
  
  const allSystemsOk = connected && crmUsersOk && coreDataOk && statsOk && authOk;
  
  if (allSystemsOk) {
    console.log('\n🎉 CRM Database is ready for production!');
    console.log('\nNext steps:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Navigate to /crm/login');
    console.log('3. Login with: admin@nordflytt.se / admin123');
    console.log('4. Test the CRM dashboard and functionality');
    process.exit(0);
  } else {
    console.log('\n⚠️ CRM Database setup incomplete');
    console.log('\nRequired actions:');
    
    if (!crmUsersOk) {
      console.log('- Run migration: 20250108000001_create_crm_users.sql');
    }
    if (!coreDataOk) {
      console.log('- Run migration: 20250108000002_complete_crm_integration.sql');
    }
    
    console.log('\nTo run migrations:');
    console.log('1. Copy SQL content from supabase/migrations/');
    console.log('2. Execute in Supabase SQL Editor');
    console.log('3. Run this script again to verify');
    
    process.exit(1);
  }
}

// Run the setup
runDatabaseSetup().catch((error) => {
  console.error('❌ Setup script failed:', error);
  process.exit(1);
});