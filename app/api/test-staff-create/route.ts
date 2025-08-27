import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Test Supabase initialization
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('Test Staff Create - Environment:', {
      hasUrl: !!supabaseUrl,
      urlPrefix: supabaseUrl?.substring(0, 30),
      hasKey: !!supabaseKey,
      keyPrefix: supabaseKey?.substring(0, 10),
      nodeEnv: process.env.NODE_ENV
    })
    
    // Try to create Supabase client
    let supabase = null
    let initError = null
    
    try {
      if (supabaseUrl && supabaseKey) {
        supabase = createClient(supabaseUrl, supabaseKey)
        console.log('Supabase client created successfully')
      } else {
        initError = 'Missing Supabase credentials'
      }
    } catch (error) {
      initError = error.message
      console.error('Supabase initialization error:', error)
    }
    
    // Test creating a staff member
    const body = await request.json()
    console.log('Request body:', body)
    
    // If no Supabase, use demo mode
    if (!supabase || initError) {
      console.log('Using demo mode due to:', initError)
      
      const newStaff = {
        id: `staff-test-${Date.now()}`,
        name: body.name || 'Test Person',
        email: body.email || 'test@nordflytt.se',
        phone: body.phone || '+46 70 000 00 00',
        role: body.role || 'mover',
        department: body.department || 'Flyttteam',
        status: 'available',
        hireDate: new Date().toISOString(),
        skills: body.skills || [],
        currentJobs: 0,
        totalJobsCompleted: 0,
        rating: 0.0
      }
      
      return NextResponse.json({
        success: true,
        mode: 'demo',
        staff: newStaff,
        debug: {
          initError,
          hasSupabase: false
        }
      })
    }
    
    // Try to insert with Supabase
    console.log('Attempting Supabase insert...')
    
    try {
      const { data, error } = await supabase
        .from('staff')
        .insert({
          first_name: body.name?.split(' ')[0] || 'Test',
          last_name: body.name?.split(' ')[1] || 'Person',
          email: body.email,
          phone: body.phone,
          role: body.role,
          department: body.department,
          employment_status: 'active',
          hire_date: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) {
        console.error('Supabase insert error:', error)
        throw error
      }
      
      return NextResponse.json({
        success: true,
        mode: 'supabase',
        staff: data,
        debug: {
          hasSupabase: true
        }
      })
    } catch (error) {
      console.error('Database operation error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        debug: {
          hasSupabase: true,
          dbError: true
        }
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Unexpected error in test-staff-create:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}