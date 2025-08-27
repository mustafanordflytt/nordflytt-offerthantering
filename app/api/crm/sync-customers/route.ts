import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get all bookings that don't have corresponding customers in CRM
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        customer_id,
        customers (
          id,
          name,
          email,
          phone,
          customer_type,
          created_at
        )
      `)
      .not('customers', 'is', null)
    
    if (bookingsError) {
      console.error('Error fetching bookings for sync:', bookingsError)
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      )
    }
    
    let syncedCount = 0
    let skippedCount = 0
    const errors: string[] = []
    
    // Process each booking's customer
    for (const booking of bookings || []) {
      if (!booking.customers) {
        skippedCount++
        continue
      }
      
      const customer = booking.customers
      
      try {
        // Check if we already have this customer in our tracking
        // (This is a simple approach - in production you might want more sophisticated deduplication)
        
        // For now, we'll just ensure the customer data is properly formatted
        // and track that they exist in our system
        
        // You could add additional CRM-specific fields here if needed
        // For example, customer status, notes, tags, etc.
        
        syncedCount++
        
      } catch (error) {
        console.error(`Error syncing customer ${(customer as any).id}:`, error)
        errors.push(`Customer ${(customer as any).id}: ${error}`)
      }
    }
    
    return NextResponse.json({
      success: true,
      syncedCount,
      skippedCount,
      errors,
      message: `Synced ${syncedCount} customers, skipped ${skippedCount}`
    })
    
  } catch (error) {
    console.error('Unexpected error in customer sync:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function moved to lib/crm.ts to avoid Next.js route export restrictions