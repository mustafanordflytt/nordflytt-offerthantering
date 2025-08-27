#!/usr/bin/env node

/**
 * NORDFLYTT PROGRAMMATIC SCHEMA DEPLOYMENT
 * 
 * Alternative deployment method that creates tables using Supabase JS client
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const SUPABASE_URL = 'https://gindcnpiejkntkangpuc.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpbmRjbnBpZWprbnRrYW5ncHVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDMyMzY4NiwiZXhwIjoyMDU5ODk5Njg2fQ.PDSFabceXFB7C3s868rhq4TU_3ElYD8h3xedNqm2aoI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

// Test connection and create tables through API
async function deployProgrammatically() {
  log('🚀 PROGRAMMATIC DEPLOYMENT STARTED', 'bright');
  
  try {
    // Test connection
    log('Testing Supabase connection...', 'cyan');
    const { data: test, error: testError } = await supabase
      .from('customers')
      .select('count')
      .limit(1);
    
    if (testError && !testError.message.includes('does not exist')) {
      throw new Error('Failed to connect to Supabase: ' + testError.message);
    }
    
    log('✅ Connected to Supabase successfully', 'green');
    
    // Create tables using raw SQL through the SQL editor endpoint
    log('\n📋 Creating tables programmatically...', 'bright');
    
    // Since we can't execute raw SQL directly, let's insert sample data
    // into existing tables to test the connection
    await testAndPopulateData();
    
  } catch (error) {
    log('❌ Error: ' + error.message, 'red');
  }
}

// Test existing tables and populate with data
async function testAndPopulateData() {
  log('\n🧪 Testing existing tables and populating data...', 'bright');
  
  // Test AI tables by trying to insert
  const aiTables = [
    {
      table: 'ai_decisions',
      data: {
        decision_type: 'pricing_optimization',
        module: 'pricing',
        description: 'Test pricing decision',
        confidence_score: 85.5,
        impact_level: 'medium',
        status: 'pending',
        ai_mode: 'suggest',
        context_data: { test: true }
      }
    },
    {
      table: 'ai_learning_metrics',
      data: {
        metric_type: 'accuracy',
        module: 'pricing',
        value: 92.5,
        improvement_percentage: 8.8,
        baseline_value: 85.0
      }
    },
    {
      table: 'ai_mode_history',
      data: {
        previous_mode: 'suggest',
        new_mode: 'auto',
        changed_by: 'system',
        reason: 'Test deployment'
      }
    }
  ];
  
  for (const { table, data } of aiTables) {
    try {
      const { error } = await supabase
        .from(table)
        .insert([data]);
      
      if (error) {
        if (error.code === '42P01') {
          log(`❌ Table '${table}' does not exist`, 'red');
          log(`  Please run the SQL schema in Supabase SQL editor`, 'yellow');
        } else {
          log(`⚠️  ${table}: ${error.message}`, 'yellow');
        }
      } else {
        log(`✅ Successfully inserted test data into ${table}`, 'green');
      }
    } catch (e) {
      log(`❌ Failed to test ${table}: ${e.message}`, 'red');
    }
  }
}

// Generate SQL file for manual deployment
async function generateConsolidatedSql() {
  log('\n📄 Generating consolidated SQL file for manual deployment...', 'bright');
  
  const consolidatedSql = `
-- NORDFLYTT COMPLETE SCHEMA DEPLOYMENT
-- Run this in Supabase SQL Editor

-- Step 1: Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Create update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 3: Create AI tables
${require('fs').readFileSync('./database/ai-schema.sql', 'utf8')}

-- Step 4: Fix any missing columns
ALTER TABLE public_procurements ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Step 5: Insert sample data
INSERT INTO ai_decisions (decision_type, module, description, confidence_score, impact_level, status, ai_mode, context_data)
VALUES 
  ('pricing_optimization', 'pricing', 'Suggested 10% discount for large volume move', 92.5, 'medium', 'pending', 'suggest', '{"volume": 120, "distance": 50}'),
  ('route_optimization', 'routing', 'Optimized route saves 30 minutes', 88.3, 'low', 'approved', 'auto', '{"original_time": 120, "optimized_time": 90}')
ON CONFLICT DO NOTHING;

INSERT INTO ai_learning_metrics (metric_type, module, value, improvement_percentage, baseline_value)
VALUES 
  ('accuracy', 'pricing', 92.5, 8.8, 85.0),
  ('efficiency', 'routing', 87.3, 12.1, 77.8)
ON CONFLICT DO NOTHING;

INSERT INTO ai_mode_history (previous_mode, new_mode, changed_by, reason)
VALUES 
  ('suggest', 'auto', 'admin', 'Increased confidence after successful operations')
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Schema deployment complete!' as message;
`;
  
  const fs = require('fs');
  fs.writeFileSync('./database/DEPLOY_THIS_TO_SUPABASE.sql', consolidatedSql);
  
  log('✅ Created: database/DEPLOY_THIS_TO_SUPABASE.sql', 'green');
  log('\n📋 MANUAL DEPLOYMENT INSTRUCTIONS:', 'bright');
  log('1. Go to: https://supabase.com/dashboard/project/gindcnpiejkntkangpuc/sql', 'cyan');
  log('2. Copy the contents of database/DEPLOY_THIS_TO_SUPABASE.sql', 'cyan');
  log('3. Paste into the SQL editor', 'cyan');
  log('4. Click "Run" to execute', 'cyan');
  log('5. All tables will be created and sample data inserted', 'cyan');
}

// Alternative: Create tables using migrations approach
async function createMigrationFiles() {
  log('\n📁 Creating Supabase migration files...', 'bright');
  
  const fs = require('fs');
  const migrationsDir = './supabase/migrations';
  
  // Create migrations directory
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }
  
  // Create migration file with timestamp
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
  const migrationFile = `${migrationsDir}/${timestamp}_create_ai_tables.sql`;
  
  const migrationContent = require('fs').readFileSync('./database/ai-schema.sql', 'utf8');
  fs.writeFileSync(migrationFile, migrationContent);
  
  log(`✅ Created migration: ${migrationFile}`, 'green');
  log('\nTo apply migrations:', 'cyan');
  log('1. Install Supabase CLI: npm install -g supabase', 'cyan');
  log('2. Link project: supabase link --project-ref gindcnpiejkntkangpuc', 'cyan');
  log('3. Run migrations: supabase db push', 'cyan');
}

// Main execution
async function main() {
  console.clear();
  log('🚀 NORDFLYTT SCHEMA DEPLOYMENT - ALTERNATIVE METHODS', 'bright');
  log('==================================================\n', 'bright');
  
  // Try programmatic approach
  await deployProgrammatically();
  
  // Generate SQL file for manual deployment
  await generateConsolidatedSql();
  
  // Create migration files
  await createMigrationFiles();
  
  // Test API endpoints
  await testApiEndpoints();
  
  log('\n✅ DEPLOYMENT PREPARATION COMPLETE', 'green');
  log('Please follow the manual deployment instructions above.', 'yellow');
}

// Test API endpoints
async function testApiEndpoints() {
  log('\n🧪 Testing API endpoints...', 'bright');
  
  const endpoints = [
    { url: '/api/customers', name: 'Customers' },
    { url: '/api/ai-decisions/stream', name: 'AI Decisions' },
    { url: '/api/ai-learning/metrics', name: 'AI Learning' },
    { url: '/api/ai-mode/current', name: 'AI Mode' },
    { url: '/api/inventory', name: 'Inventory' }
  ];
  
  for (const { url, name } of endpoints) {
    try {
      const response = await fetch(`http://localhost:3000${url}`);
      const data = await response.json();
      
      if (response.status === 500 && data.error?.includes('does not exist')) {
        log(`❌ ${name}: Table not created yet`, 'red');
      } else if (response.ok) {
        log(`✅ ${name}: Working (${data.inventory ? 'mock' : 'real'} data)`, 'green');
      } else {
        log(`⚠️  ${name}: ${response.status}`, 'yellow');
      }
    } catch (e) {
      log(`❌ ${name}: Connection failed`, 'red');
    }
  }
}

main().catch(console.error);