import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = supabaseUrl && supabaseServiceKey ? 
  createClient(supabaseUrl, supabaseServiceKey) : null;

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      // Return mock data if Supabase not configured
      return NextResponse.json({
        inventory: [
          {
            id: 'inv-1',
            item_code: 'BOX-001',
            name: 'Flyttkartonger Standard',
            description: 'Standard moving boxes 60x40x40cm',
            category: 'moving_supplies',
            unit: 'st',
            current_stock: 150,
            minimum_stock: 50,
            maximum_stock: 1000,
            unit_cost: 79.00,
            supplier_id: null,
            location: 'Lager A',
            status: 'active',
            item_type: 'consumable',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'inv-2',
            item_code: 'STRAP-001',
            name: 'Spännband 5m',
            description: 'Heavy duty straps 5 meters',
            category: 'equipment',
            unit: 'st',
            current_stock: 25,
            minimum_stock: 10,
            maximum_stock: 100,
            unit_cost: 299.00,
            supplier_id: null,
            location: 'Fordon',
            status: 'active',
            item_type: 'tool',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ],
        total_items: 2,
        low_stock_items: 0,
        total_value: 19325
      });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const location = searchParams.get('location');
    
    let query = supabase
      .from('inventory_items')
      .select('*')
      .order('name');
    
    if (category) query = query.eq('category', category);
    if (status) query = query.eq('status', status);
    if (location) query = query.eq('location', location);
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
    
    // Calculate aggregates
    const total_value = (data || []).reduce((sum, item) => 
      sum + (item.current_stock * item.unit_cost), 0
    );
    
    const low_stock_items = (data || []).filter(item => 
      item.current_stock <= item.minimum_stock
    ).length;
    
    return NextResponse.json({
      inventory: data || [],
      total_items: data?.length || 0,
      low_stock_items,
      total_value
    });
    
  } catch (error: any) {
    console.error('Inventory fetch error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch inventory',
      inventory: [],
      total_items: 0,
      low_stock_items: 0,
      total_value: 0
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!supabase) {
      return NextResponse.json({
        id: 'mock-' + Date.now(),
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    // Validate required fields
    const { category, name, sku, quantity, unit, min_quantity, location, price } = body;
    
    if (!name || !sku || quantity === undefined || !unit || !location || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Determine status based on quantity
    const status = quantity > min_quantity ? 'in_stock' : 
                  quantity > 0 ? 'low_stock' : 'out_of_stock';
    
    const { data, error } = await supabase
      .from('inventory_items')
      .insert([{
        category,
        name,
        sku,
        quantity,
        unit,
        min_quantity,
        location,
        price,
        status,
        last_restock: quantity > 0 ? new Date().toISOString() : null
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating inventory item:', error);
      throw error;
    }
    
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error('Inventory creation error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create inventory item' 
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Inventory item ID required' },
        { status: 400 }
      );
    }
    
    const updates = await request.json();
    
    if (!supabase) {
      return NextResponse.json({
        id,
        ...updates,
        updated_at: new Date().toISOString()
      });
    }
    
    // If quantity is being updated, update status accordingly
    if (updates.quantity !== undefined) {
      const { data: currentItem } = await supabase
        .from('inventory_items')
        .select('min_quantity')
        .eq('id', id)
        .single();
      
      if (currentItem) {
        updates.status = updates.quantity > currentItem.min_quantity ? 'in_stock' : 
                        updates.quantity > 0 ? 'low_stock' : 'out_of_stock';
        
        if (updates.quantity > 0) {
          updates.last_restock = new Date().toISOString();
        }
      }
    }
    
    const { data, error } = await supabase
      .from('inventory_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
    
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error('Inventory update error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to update inventory item' 
    }, { status: 500 });
  }
}