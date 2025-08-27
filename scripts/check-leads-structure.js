import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkLeadsTable() {
  console.log('🔍 Checking leads table structure...\n');
  
  // Get one row to see the structure
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('📋 Leads table columns:');
    console.log(Object.keys(data[0]).join(', '));
    console.log('\n📊 Sample data:');
    console.log(JSON.stringify(data[0], null, 2));
  } else {
    console.log('⚠️  No data in leads table');
    
    // Try to get column info another way
    const { data: emptySelect, error: selectError } = await supabase
      .from('leads')
      .select()
      .limit(0);
    
    if (!selectError) {
      console.log('✅ Table exists but is empty');
    }
  }
}

checkLeadsTable();