import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    const employeeId = searchParams.get('employee_id')
    const type = searchParams.get('type')
    const isVerified = searchParams.get('is_verified')
    const expiringWithin = searchParams.get('expiring_within') // days
    
    let query = supabase
      .from('employee_documents')
      .select(`
        *,
        anstallda_extended!inner(name, email, department, role)
      `)
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }
    
    if (type && type !== 'all') {
      query = query.eq('type', type)
    }
    
    if (isVerified !== null) {
      query = query.eq('is_verified', isVerified === 'true')
    }
    
    if (expiringWithin) {
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + parseInt(expiringWithin))
      query = query.lte('expiry_date', expiryDate.toISOString().split('T')[0])
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching employee documents:', error)
      return NextResponse.json({ error: 'Failed to fetch employee documents' }, { status: 500 })
    }
    
    return NextResponse.json({ documents: data })
  } catch (error) {
    console.error('Error in employee-documents GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const data = await request.json()
    
    const { error } = await supabase
      .from('employee_documents')
      .insert(data)
    
    if (error) {
      console.error('Error creating employee document:', error)
      return NextResponse.json({ error: 'Failed to create employee document' }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'Employee document created successfully' })
  } catch (error) {
    console.error('Error in employee-documents POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const data = await request.json()
    const { id, ...updateData } = data
    
    const { error } = await supabase
      .from('employee_documents')
      .update(updateData)
      .eq('id', id)
    
    if (error) {
      console.error('Error updating employee document:', error)
      return NextResponse.json({ error: 'Failed to update employee document' }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'Employee document updated successfully' })
  } catch (error) {
    console.error('Error in employee-documents PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Verify document
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient()
    const { id, action, verifiedBy } = await request.json()
    
    if (action === 'verify') {
      const { error } = await supabase
        .from('employee_documents')
        .update({
          is_verified: true,
          verified_by: verifiedBy,
          verified_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', id)
      
      if (error) {
        console.error('Error verifying document:', error)
        return NextResponse.json({ error: 'Failed to verify document' }, { status: 500 })
      }
      
      return NextResponse.json({ message: 'Document verified successfully' })
    }
    
    if (action === 'unverify') {
      const { error } = await supabase
        .from('employee_documents')
        .update({
          is_verified: false,
          verified_by: null,
          verified_date: null
        })
        .eq('id', id)
      
      if (error) {
        console.error('Error unverifying document:', error)
        return NextResponse.json({ error: 'Failed to unverify document' }, { status: 500 })
      }
      
      return NextResponse.json({ message: 'Document unverified successfully' })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in employee-documents PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('employee_documents')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting employee document:', error)
      return NextResponse.json({ error: 'Failed to delete employee document' }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'Employee document deleted successfully' })
  } catch (error) {
    console.error('Error in employee-documents DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}