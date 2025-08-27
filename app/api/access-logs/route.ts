import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const vehicleId = searchParams.get('vehicle_id')
    const employeeId = searchParams.get('employee_id')
    const action = searchParams.get('action')
    const success = searchParams.get('success')
    const hours = searchParams.get('hours') // Get logs from last X hours
    
    let query = supabase
      .from('fordon_access_logs')
      .select(`
        *,
        fordon!inner(registration_number, make, model),
        anstallda_extended!inner(name, email)
      `)
      .order('timestamp', { ascending: false })
    
    // Apply filters
    if (vehicleId) {
      query = query.eq('vehicle_id', vehicleId)
    }
    
    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }
    
    if (action && action !== 'all') {
      query = query.eq('action', action)
    }
    
    if (success !== null) {
      query = query.eq('success', success === 'true')
    }
    
    if (hours) {
      const hoursAgo = new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000)
      query = query.gte('timestamp', hoursAgo.toISOString())
    }
    
    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    const { data, error, count } = await query.range(from, to)
    
    if (error) {
      console.error('Error fetching access logs:', error)
      return NextResponse.json({ error: 'Failed to fetch access logs' }, { status: 500 })
    }
    
    return NextResponse.json({
      accessLogs: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Error in access-logs GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const data = await request.json()
    
    const logData = {
      ...data,
      timestamp: new Date().toISOString()
    }
    
    const { error } = await supabase
      .from('fordon_access_logs')
      .insert(logData)
    
    if (error) {
      console.error('Error creating access log:', error)
      return NextResponse.json({ error: 'Failed to create access log' }, { status: 500 })
    }
    
    // Update usage count and last used timestamp for successful access
    if (data.success && data.action === 'unlock') {
      await supabase
        .from('fordon_access')
        .update({
          last_used: new Date().toISOString(),
          usage_count: supabase.raw('usage_count + 1')
        })
        .eq('vehicle_id', data.vehicle_id)
        .eq('employee_id', data.employee_id)
        .eq('is_active', true)
    }
    
    return NextResponse.json({ message: 'Access log created successfully' })
  } catch (error) {
    console.error('Error in access-logs POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get access statistics
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient()
    const { action } = await request.json()
    
    if (action === 'statistics') {
      const { data: stats, error } = await supabase
        .from('fordon_access_logs')
        .select(`
          action,
          success,
          timestamp,
          fordon(type),
          anstallda_extended(department)
        `)
        .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      
      if (error) {
        console.error('Error fetching access statistics:', error)
        return NextResponse.json({ error: 'Failed to fetch access statistics' }, { status: 500 })
      }
      
      // Calculate statistics
      const totalAccess = stats?.length || 0
      const successfulAccess = stats?.filter(s => s.success).length || 0
      const failedAccess = totalAccess - successfulAccess
      const accessByAction = stats?.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}
      
      return NextResponse.json({
        totalAccess,
        successfulAccess,
        failedAccess,
        successRate: totalAccess > 0 ? Math.round((successfulAccess / totalAccess) * 100) : 0,
        accessByAction
      })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in access-logs PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}