import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hqdptkeumsjuthaoszxi.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxZHB0a2V1bXNqdXRoYW9zenhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0MDQxNDgsImV4cCI6MjA1MDk4MDE0OH0.d_L_3i1SkQJkJCe1WI93q9sRHLSNYkmsVq5AgBG1BMW';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyBatmanBooking() {
  console.log("🦇 BATMAN BOOKING VERIFICATION TEST\n");
  console.log("=".repeat(60));
  
  try {
    // 1. Check customers table for Batman
    console.log("\n📊 Checking customers table...");
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .ilike('name', '%batman%');
    
    if (customersError) {
      console.error("❌ Error fetching customers:", customersError);
    } else {
      console.log(`Found ${customers?.length || 0} Batman customers:`);
      customers?.forEach(c => {
        console.log(`  - ID: ${c.id}, Name: ${c.name}, Email: ${c.email}`);
      });
    }
    
    // 2. Check bookings table
    console.log("\n📊 Checking bookings table...");
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .or('customer_email.ilike.%batman%,metadata->>customerName.ilike.%batman%,details->>name.ilike.%batman%');
    
    if (bookingsError) {
      console.error("❌ Error fetching bookings:", bookingsError);
    } else {
      console.log(`Found ${bookings?.length || 0} Batman bookings:`);
      bookings?.forEach(b => {
        console.log(`  - ID: ${b.id}, Email: ${b.customer_email}, Details:`, 
          b.details?.name || b.metadata?.customerName || 'No name in details');
      });
    }
    
    // 3. Check leads table
    console.log("\n📊 Checking leads table...");
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .ilike('name', '%batman%');
    
    if (leadsError) {
      console.error("❌ Error fetching leads:", leadsError);
    } else {
      console.log(`Found ${leads?.length || 0} Batman leads:`);
      leads?.forEach(l => {
        console.log(`  - ID: ${l.id}, Name: ${l.name}, Status: ${l.status}`);
      });
    }
    
    // 4. Check jobs table
    console.log("\n📊 Checking jobs table...");
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .ilike('customer_name', '%batman%');
    
    if (jobsError) {
      console.error("❌ Error fetching jobs:", jobsError);
    } else {
      console.log(`Found ${jobs?.length || 0} Batman jobs:`);
      jobs?.forEach(j => {
        console.log(`  - ID: ${j.id}, Customer: ${j.customer_name}, Date: ${j.scheduled_date}`);
      });
    }
    
    // 5. Now create a new Batman booking via API
    console.log("\n🦇 Creating NEW Batman booking via API...");
    const response = await fetch("http://localhost:3000/api/submit-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Bruce Wayne (Batman)",
        email: "batman@gotham.com",
        phone: "070-BATMAN-1",
        customerType: "private",
        serviceType: "moving",
        serviceTypes: ["moving", "packing", "cleaning"],
        moveDate: "2025-08-10",
        moveTime: "22:00",
        startAddress: "Wayne Manor, Gotham",
        endAddress: "Batcave, Gotham Underground",
        totalPrice: 24890,
        startLivingArea: "500",
        endLivingArea: "1000",
        notes: "Handle with care - secret identity items"
      })
    });
    
    const result = await response.json();
    console.log("\nAPI Response:", result);
    
    if (result.success) {
      console.log("✅ Booking created successfully!");
      console.log("  - Booking ID:", result.bookingId);
      console.log("  - Customer ID:", result.customerId);
      
      // Wait a moment for database to settle
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 6. Verify it was saved
      console.log("\n🔍 Verifying booking was saved...");
      const { data: newBooking } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', result.bookingId)
        .single();
      
      if (newBooking) {
        console.log("✅ Booking found in database!");
        console.log("  - Status:", newBooking.status);
        console.log("  - Customer Email:", newBooking.customer_email);
        console.log("  - Details:", newBooking.details?.name || 'No name in details');
      } else {
        console.log("❌ Booking NOT found in database!");
      }
      
      // 7. Check if customer was created
      const { data: newCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', result.customerId)
        .single();
      
      if (newCustomer) {
        console.log("✅ Customer found in database!");
        console.log("  - Name:", newCustomer.name);
        console.log("  - Email:", newCustomer.email);
      } else {
        console.log("❌ Customer NOT found in database!");
      }
    } else {
      console.error("❌ Booking creation failed:", result.error);
    }
    
    // 8. Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 SUMMARY");
    console.log("=".repeat(60));
    console.log("If Batman bookings are being created but not showing in CRM:");
    console.log("1. ❌ The /api/crm/bookings endpoint is returning mock data");
    console.log("2. ❌ The /api/crm/customers endpoint might be caching");
    console.log("3. ❌ The frontend might not be refreshing after creation");
    
  } catch (error) {
    console.error("Test error:", error);
  }
}

verifyBatmanBooking();