import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateCRMAuth } from '@/lib/auth/validate-crm-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    // Validate CRM authentication
    const authResult = await validateCRMAuth(request);
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (!authResult.permissions.includes('customers:read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');
    const page = searchParams.get('page') || '1';

    // Build query - removed offers since it doesn't have a relationship
    let query = supabase
      .from('customers')
      .select(`
        *,
        bookings(count),
        jobs(count)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (type && type !== 'all') {
      query = query.eq('customer_type', type);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // Apply pagination
    if (limit) {
      const limitNum = parseInt(limit);
      const pageNum = parseInt(page);
      const offset = (pageNum - 1) * limitNum;
      query = query.range(offset, offset + limitNum - 1);
    }

    const { data: customers, error: customersError } = await query;
    
    if (customersError) {
      console.error('Database error:', customersError);
      throw customersError;
    }
    
    // Get aggregated statistics for each customer
    const customersWithStats = await Promise.all((customers || []).map(async (customer) => {
      // Get last activity
      const { data: lastActivity } = await supabase
        .from('bookings')
        .select('created_at')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Calculate total value from offers
      const { data: offers } = await supabase
        .from('offers')
        .select('total_price')
        .eq('customer_id', customer.id)
        .eq('status', 'accepted');

      const totalValue = offers?.reduce((sum, offer) => sum + (offer.total_price || 0), 0) || 0;

      // Transform to match frontend expectations
      return {
        id: customer.id.toString(),
        name: customer.name || 'Unknown',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        customerType: customer.customer_type || 'private',
        organizationNumber: customer.organization_number || null,
        notes: customer.notes || '',
        tags: customer.tags || [],
        createdAt: new Date(customer.created_at),
        updatedAt: new Date(customer.updated_at || customer.created_at),
        bookingCount: customer.bookings?.[0]?.count || 0,
        jobCount: customer.jobs?.[0]?.count || 0,
        offerCount: customer.offers?.[0]?.count || 0,
        totalValue,
        lastActivity: lastActivity?.created_at ? new Date(lastActivity.created_at) : null,
        status: customer.status || 'active',
        metadata: customer.metadata || {}
      };
    }));

    // Calculate statistics
    const stats = {
      totalCustomers: customersWithStats.length,
      activeCustomers: customersWithStats.filter(c => c.status === 'active').length,
      privateCustomers: customersWithStats.filter(c => c.customerType === 'private').length,
      businessCustomers: customersWithStats.filter(c => c.customerType === 'business').length,
      totalRevenue: customersWithStats.reduce((sum, c) => sum + c.totalValue, 0),
      avgCustomerValue: customersWithStats.length > 0 
        ? Math.round(customersWithStats.reduce((sum, c) => sum + c.totalValue, 0) / customersWithStats.length)
        : 0
    };
    
    return NextResponse.json({
      success: true,
      customers: customersWithStats,
      stats,
      page: parseInt(page),
      limit: limit ? parseInt(limit) : null
    });
  } catch (error: any) {
    console.error('Customers API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch customers',
      details: error.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate CRM authentication
    const authResult = await validateCRMAuth(request);
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (!authResult.permissions.includes('customers:write')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    const { name, email, phone } = body;
    
    if (!name || (!email && !phone)) {
      return NextResponse.json(
        { error: 'Name and either email or phone are required' },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    // Check if customer already exists
    if (email) {
      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('email', email)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'Customer with this email already exists' },
          { status: 400 }
        );
      }
    }

    // Create new customer
    const { data: newCustomer, error } = await supabase
      .from('customers')
      .insert({
        name: name,
        email: email || null,
        phone: phone || null,
        address: body.address || null,
        customer_type: body.customerType || 'private',
        organization_number: body.organizationNumber || null,
        notes: body.notes || null,
        tags: body.tags || [],
        status: body.status || 'active',
        metadata: body.metadata || {},
        created_by: authResult.user.id,
        updated_by: authResult.user.id
      })
      .select()
      .single();
    
    if (error) {
      console.error('Database error:', error);
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Customer already exists' },
          { status: 400 }
        );
      }
      throw error;
    }

    // Transform response
    const transformedCustomer = {
      id: newCustomer.id.toString(),
      name: newCustomer.name,
      email: newCustomer.email || '',
      phone: newCustomer.phone || '',
      address: newCustomer.address || '',
      customerType: newCustomer.customer_type,
      organizationNumber: newCustomer.organization_number || null,
      notes: newCustomer.notes || '',
      tags: newCustomer.tags || [],
      createdAt: new Date(newCustomer.created_at),
      updatedAt: new Date(newCustomer.updated_at || newCustomer.created_at),
      bookingCount: 0,
      jobCount: 0,
      offerCount: 0,
      totalValue: 0,
      lastActivity: null,
      status: newCustomer.status,
      metadata: newCustomer.metadata || {}
    };
    
    return NextResponse.json({
      success: true,
      customer: transformedCustomer,
      message: 'Customer created successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Customer creation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create customer',
      details: error.message
    }, { status: 500 });
  }
}