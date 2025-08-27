import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    
    let query = supabase
      .from('legal_templates')
      .select('*')
      .order('usage_count', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: templates, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ templates });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch legal templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      category,
      language,
      content,
      variables
    } = body;

    const { data: template, error } = await supabase
      .from('legal_templates')
      .insert({
        name,
        category,
        language: language || 'sv',
        content,
        variables,
        usage_count: 0,
        success_rate: 0,
        created_by: 'User',
        status: 'draft',
        last_used: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Error creating legal template:', error);
    return NextResponse.json(
      { error: 'Failed to create legal template' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    const { data: template, error } = await supabase
      .from('legal_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Error updating legal template:', error);
    return NextResponse.json(
      { error: 'Failed to update legal template' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Archive instead of delete
    const { error } = await supabase
      .from('legal_templates')
      .update({ status: 'archived' })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Template archived successfully'
    });
  } catch (error) {
    console.error('Error archiving legal template:', error);
    return NextResponse.json(
      { error: 'Failed to archive legal template' },
      { status: 500 }
    );
  }
}