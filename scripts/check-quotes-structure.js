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

async function checkQuotesTable() {
  console.log('🔍 Checking quotes table structure...\n');
  
  // Get one row to see the structure
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('📋 Quotes table columns:');
    console.log(Object.keys(data[0]).join(', '));
    console.log('\n📊 Sample data:');
    console.log(JSON.stringify(data[0], null, 2));
  } else {
    console.log('⚠️  No data in quotes table');
  }
}

checkQuotesTable();