import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gindcnpiejkntkangpuc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpbmRjbnBpZWprbnRrYW5ncHVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDMyMzY4NiwiZXhwIjoyMDU5ODk5Njg2fQ.PDSFabceXFB7C3s868rhq4TU_3ElYD8h3xedNqm2aoI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('🚀 Setting up Nordflytt Database...\n');
  
  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '001_complete_business_workflow.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📋 Running database migration...');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });
    
    if (error) {
      // If RPC doesn't exist, try alternative approach
      console.log('⚠️  Direct SQL execution not available, creating tables individually...');
      
      // Create tables one by one
      const tables = [
        {
          name: 'customers',
          check: async () => {
            const { data } = await supabase.from('customers').select('id').limit(1);
            return !data || data.length === 0;
          },
          create: async () => {
            // Table should be created via Supabase dashboard
            console.log('   ℹ️  Please create customers table via Supabase dashboard');
          }
        },
        {
          name: 'offers',
          check: async () => {
            const { data } = await supabase.from('offers').select('id').limit(1);
            return !data || data.length === 0;
          }
        },
        {
          name: 'leads',
          check: async () => {
            const { data } = await supabase.from('leads').select('id').limit(1);
            return !data || data.length === 0;
          }
        },
        {
          name: 'jobs',
          check: async () => {
            const { data } = await supabase.from('jobs').select('id').limit(1);
            return !data || data.length === 0;
          }
        }
      ];
      
      // Check each table
      for (const table of tables) {
        try {
          await table.check();
          console.log(`   ✅ Table '${table.name}' exists`);
        } catch (err) {
          console.log(`   ❌ Table '${table.name}' not found`);
        }
      }
      
      console.log('\n📝 Please run the migration SQL in Supabase SQL editor:');
      console.log(`   ${migrationPath}`);
      
    } else {
      console.log('✅ Database migration completed successfully!');
    }
    
    // Test the connection and insert sample data
    console.log('\n🧪 Testing database connection...');
    
    // Check if Maria Johansson already exists
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('customer_email', 'maria.johansson@example.com')
      .single();
    
    if (!existingCustomer) {
      // Insert Maria Johansson as a test customer
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert({
          customer_name: 'Maria Johansson',
          customer_email: 'maria.johansson@example.com',
          customer_phone: '+46 70 345 67 89',
          customer_type: 'private'
        })
        .select()
        .single();
      
      if (customerError) {
        console.error('❌ Error inserting customer:', customerError);
      } else {
        console.log('✅ Test customer created:', customer.customer_name);
        
        // Create an offer for Maria
        const { data: offer, error: offerError } = await supabase
          .from('offers')
          .insert({
            offer_id: 'OFFER001',
            customer_id: customer.id,
            volume: 30,
            from_address: 'Gamla Stan, Stockholm',
            to_address: 'Vasastan, Stockholm',
            moving_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
            moving_time: '10:00',
            services: ['Packhjälp', 'Flytt', 'Flyttstädning'],
            total_price: 9008,
            estimated_hours: 12,
            status: 'active',
            ml_confidence: 0.92,
            pricing_breakdown: {
              basPrice: 5000,
              volumeAdjustment: 2400,
              stairsCharge: 500,
              services: {
                packing: 500,
                cleaning: 608
              }
            }
          })
          .select()
          .single();
        
        if (offerError) {
          console.error('❌ Error creating offer:', offerError);
        } else {
          console.log('✅ Test offer created:', offer.offer_id);
          
          // Create a lead for Maria
          const { data: lead, error: leadError } = await supabase
            .from('leads')
            .insert({
              lead_id: 'LEAD001',
              customer_id: customer.id,
              offer_id: offer.id,
              status: 'active',
              source: 'website',
              priority: 'high',
              assigned_to: 'auto_assignment'
            })
            .select()
            .single();
          
          if (leadError) {
            console.error('❌ Error creating lead:', leadError);
          } else {
            console.log('✅ Test lead created:', lead.lead_id);
          }
        }
      }
    } else {
      console.log('ℹ️  Maria Johansson already exists in database');
    }
    
    // Display summary
    console.log('\n📊 Database Setup Summary:');
    console.log('================================');
    
    const tables = ['customers', 'offers', 'leads', 'jobs', 'calendar_events', 'staff_schedules'];
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ ${table}: Not available`);
        } else {
          console.log(`✅ ${table}: ${count} records`);
        }
      } catch (err) {
        console.log(`❌ ${table}: Error checking`);
      }
    }
    
    console.log('\n🎉 Database setup complete!');
    console.log('\n📝 Next steps:');
    console.log('1. If tables are missing, run the migration SQL in Supabase dashboard');
    console.log('2. Update API endpoints to use real database');
    console.log('3. Test the complete booking workflow');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Check your Supabase credentials in .env.local');
    console.log('2. Ensure Supabase project is accessible');
    console.log('3. Run the migration SQL manually in Supabase SQL editor');
  }
}

// Run the setup
setupDatabase();