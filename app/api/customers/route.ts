import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase'
import { authenticate } from '@/lib/security/auth-middleware'
import { rateLimit, rateLimiters } from '@/lib/security/rate-limit'
import { validateRequest, schemas } from '@/lib/security/validation'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// Customer creation schema
const createCustomerSchema = z.object({
  name: z.string().min(2).max(100),
  email: schemas.email.optional(),
  phone: schemas.phone.optional(),
  customer_type: z.enum(['private', 'business']).default('private'),
  address: z.string().max(200).optional(),
  postal_code: z.string().regex(/^\d{5}$/).optional(),
  city: z.string().max(100).optional(),
  company_name: z.string().max(100).optional(),
  personal_number: schemas.personalNumber.optional(),
  notes: z.string().max(500).optional()
})

// GET /api/customers - List all customers
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitRes = await rateLimit(request, rateLimiters.normal)
    if (rateLimitRes) return rateLimitRes
    
    // Authentication required
    const user = await authenticate(request, {
      methods: ['jwt', 'supabase'],
      roles: ['admin', 'manager', 'staff']
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const supabase = createServerSupabaseClient()

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';

    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Add search if provided
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error('Error fetching customers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch customers' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data || [],
      count: count || 0,
      limit,
      offset
    });

  } catch (error) {
    logger.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/customers - Create new customer
export async function POST(request: NextRequest) {
  try {
    // Rate limiting - stricter for mutations
    const rateLimitRes = await rateLimit(request, rateLimiters.strict)
    if (rateLimitRes) return rateLimitRes
    
    // Authentication required - only staff can create customers
    const user = await authenticate(request, {
      methods: ['jwt', 'supabase'],
      roles: ['admin', 'manager', 'staff']
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Validate request body
    const body = await validateRequest(request, createCustomerSchema)
    
    logger.info('Creating new customer:', { 
      userId: user.id,
      customerName: body.name 
    })
    
    const supabase = createServerSupabaseClient()

    // Check if customer with email already exists
    if (body.email) {
      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('email', body.email)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'Customer with this email already exists' },
          { status: 409 }
        );
      }
    }

    // Create customer - only include fields that exist in the table
    const customerData: any = {
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      customer_type: body.customer_type || 'private',
      created_by: user.id
    };

    // Store address info in notes field as JSON if provided
    const addressInfo: any = {};
    if (body.address) addressInfo.address = body.address;
    if (body.postal_code) addressInfo.postal_code = body.postal_code;
    if (body.city) addressInfo.city = body.city;
    if (body.company_name) addressInfo.company_name = body.company_name;
    
    // Don't store personal number in plain text - hash it
    if (body.personal_number) {
      const crypto = await import('crypto')
      addressInfo.personal_number_hash = crypto
        .createHash('sha256')
        .update(body.personal_number + process.env.HASH_SALT)
        .digest('hex')
    }
    
    if (Object.keys(addressInfo).length > 0 || body.notes) {
      customerData.notes = JSON.stringify({
        ...addressInfo,
        notes: body.notes
      });
    }

    const { data, error } = await supabase
      .from('customers')
      .insert([customerData])
      .select()
      .single();

    if (error) {
      logger.error('Error creating customer:', error);
      return NextResponse.json(
        { error: 'Failed to create customer' },
        { status: 500 }
      );
    }
    
    // Create audit log
    await supabase
      .from('audit_logs')
      .insert({
        resource_type: 'customer',
        resource_id: data.id,
        action: 'create',
        user_id: user.id,
        details: { name: body.name }
      })
    
    logger.info('Customer created successfully:', { 
      customerId: data.id,
      customerName: data.name 
    })

    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    logger.error('Create customer error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}