import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const employeeId = searchParams.get('employee_id')
    
    let query = supabase
      .from('personal_tillgangar')
      .select(`
        *,
        anstallda_extended!inner(name, email, department, role),
        asset_types(name, description, supplier)
      `)
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (search) {
      query = query.or(`anstallda_extended.name.ilike.%${search}%,type.ilike.%${search}%`)
    }
    
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }
    
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    
    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }
    
    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    const { data, error, count } = await query.range(from, to)
    
    if (error) {
      console.error('Error fetching assets:', error)
      return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 })
    }
    
    return NextResponse.json({
      assets: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Error in assets GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const data = await request.json()
    
    // Get asset type details for cost and supplier
    const { data: assetType } = await supabase
      .from('asset_types')
      .select('standard_cost, supplier, warranty_months')
      .eq('id', data.type)
      .single()
    
    if (assetType) {
      data.cost = assetType.standard_cost
      data.supplier = assetType.supplier
      
      // Calculate warranty until date
      if (assetType.warranty_months > 0) {
        const warrantyDate = new Date()
        warrantyDate.setMonth(warrantyDate.getMonth() + assetType.warranty_months)
        data.warranty_until = warrantyDate.toISOString().split('T')[0]
      }
    }
    
    const { error } = await supabase
      .from('personal_tillgangar')
      .insert(data)
    
    if (error) {
      console.error('Error creating asset:', error)
      return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'Asset created successfully' })
  } catch (error) {
    console.error('Error in assets POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const data = await request.json()
    const { id, ...updateData } = data
    
    const { error } = await supabase
      .from('personal_tillgangar')
      .update(updateData)
      .eq('id', id)
    
    if (error) {
      console.error('Error updating asset:', error)
      return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'Asset updated successfully' })
  } catch (error) {
    console.error('Error in assets PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update asset status (return, mark as lost, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient()
    const { id, action } = await request.json()
    
    let updateData: any = {}
    
    switch (action) {
      case 'return':
        updateData = {
          status: 'returnerat',
          return_date: new Date().toISOString().split('T')[0]
        }
        break
      case 'mark_lost':
        updateData = {
          status: 'forlorat',
          return_date: new Date().toISOString().split('T')[0]
        }
        break
      case 'mark_damaged':
        updateData = {
          status: 'skadat',
          condition: 'dåligt'
        }
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('personal_tillgangar')
      .update(updateData)
      .eq('id', id)
    
    if (error) {
      console.error('Error updating asset status:', error)
      return NextResponse.json({ error: 'Failed to update asset status' }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'Asset status updated successfully' })
  } catch (error) {
    console.error('Error in assets PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}