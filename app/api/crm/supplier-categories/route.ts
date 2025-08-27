import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateCRMAuth } from '@/lib/auth/validate-crm-auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // Validate CRM authentication
    const authResult = await validateCRMAuth(request)
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all supplier categories
    const { data: categories, error } = await supabase
      .from('supplier_categories')
      .select('*')
      .eq('is_active', true)
      .order('category_name', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      throw new Error('Failed to fetch supplier categories')
    }

    // Transform categories
    const transformedCategories = (categories || []).map(category => ({
      id: category.id,
      name: category.category_name,
      description: category.description,
      isActive: category.is_active,
      createdAt: category.created_at
    }))

    return NextResponse.json({
      categories: transformedCategories
    })

  } catch (error: any) {
    console.error('Supplier categories API error:', error)
    return NextResponse.json({
      error: 'Failed to fetch supplier categories',
      details: error.message
    }, { status: 500 })
  }
}