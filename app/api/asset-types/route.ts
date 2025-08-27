import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    const category = searchParams.get('category')
    const isActive = searchParams.get('is_active')
    
    let query = supabase
      .from('asset_types')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true })
    
    // Apply filters
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }
    
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching asset types:', error)
      return NextResponse.json({ error: 'Failed to fetch asset types' }, { status: 500 })
    }
    
    return NextResponse.json({ assetTypes: data })
  } catch (error) {
    console.error('Error in asset-types GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const data = await request.json()
    
    const { error } = await supabase
      .from('asset_types')
      .insert(data)
    
    if (error) {
      console.error('Error creating asset type:', error)
      return NextResponse.json({ error: 'Failed to create asset type' }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'Asset type created successfully' })
  } catch (error) {
    console.error('Error in asset-types POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const data = await request.json()
    const { id, ...updateData } = data
    
    const { error } = await supabase
      .from('asset_types')
      .update(updateData)
      .eq('id', id)
    
    if (error) {
      console.error('Error updating asset type:', error)
      return NextResponse.json({ error: 'Failed to update asset type' }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'Asset type updated successfully' })
  } catch (error) {
    console.error('Error in asset-types PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}