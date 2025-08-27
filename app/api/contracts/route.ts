import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const contractType = searchParams.get('contract_type')
    const employeeId = searchParams.get('employee_id')
    
    let query = supabase
      .from('personal_avtal')
      .select(`
        *,
        anstallda_extended!inner(name, email, department, role)
      `)
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (search) {
      query = query.or(`anstallda_extended.name.ilike.%${search}%,anstallda_extended.email.ilike.%${search}%`)
    }
    
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    
    if (contractType && contractType !== 'all') {
      query = query.eq('contract_type', contractType)
    }
    
    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }
    
    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    const { data, error, count } = await query.range(from, to)
    
    if (error) {
      console.error('Error fetching contracts:', error)
      return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 })
    }
    
    return NextResponse.json({
      contracts: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Error in contracts GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const data = await request.json()
    
    const { error } = await supabase
      .from('personal_avtal')
      .insert(data)
    
    if (error) {
      console.error('Error creating contract:', error)
      return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'Contract created successfully' })
  } catch (error) {
    console.error('Error in contracts POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const data = await request.json()
    const { id, ...updateData } = data
    
    const { error } = await supabase
      .from('personal_avtal')
      .update(updateData)
      .eq('id', id)
    
    if (error) {
      console.error('Error updating contract:', error)
      return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 })
    }
    
    // If contract is signed, update employee contract status
    if (updateData.status === 'signed') {
      await supabase
        .from('anstallda_extended')
        .update({
          contract_status: 'signed',
          contract_signed_date: updateData.signed_date
        })
        .eq('id', updateData.employee_id)
    }
    
    return NextResponse.json({ message: 'Contract updated successfully' })
  } catch (error) {
    console.error('Error in contracts PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Send contract for signing
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient()
    const { id, action } = await request.json()
    
    let updateData: any = {}
    
    switch (action) {
      case 'send':
        updateData = {
          status: 'sent',
          sent_date: new Date().toISOString().split('T')[0]
        }
        break
      case 'sign':
        updateData = {
          status: 'signed',
          signed_date: new Date().toISOString().split('T')[0]
        }
        break
      case 'reject':
        updateData = {
          status: 'rejected'
        }
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('personal_avtal')
      .update(updateData)
      .eq('id', id)
    
    if (error) {
      console.error('Error updating contract status:', error)
      return NextResponse.json({ error: 'Failed to update contract status' }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'Contract status updated successfully' })
  } catch (error) {
    console.error('Error in contracts PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}