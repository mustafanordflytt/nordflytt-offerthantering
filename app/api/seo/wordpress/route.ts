import { NextRequest, NextResponse } from 'next/server';
import { wordPressAPI } from '@/lib/seo/wordpress-integration';

// GET /api/seo/wordpress - Check WordPress connection and get posts
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    // Check connection status
    if (action === 'status') {
      const isConnected = await wordPressAPI.checkConnection();
      
      return NextResponse.json({
        success: true,
        connected: isConnected,
        configured: !!(process.env.WORDPRESS_URL && process.env.WORDPRESS_USERNAME),
        message: isConnected 
          ? 'WordPress is connected and ready' 
          : 'WordPress connection failed. Check credentials.'
      });
    }

    // Get posts
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');
    const status = searchParams.get('status') || 'any';

    const posts = await wordPressAPI.getPosts({
      page,
      per_page: perPage,
      status
    });

    return NextResponse.json({
      success: true,
      data: posts
    });

  } catch (error) {
    console.error('WordPress API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch WordPress data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/seo/wordpress - Create or publish content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    if (!action || !data) {
      return NextResponse.json(
        { success: false, error: 'Action and data required' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'publish':
        // Publish SEO content
        result = await wordPressAPI.publishSEOContent(data);
        break;

      case 'create_post':
        // Create regular post
        result = await wordPressAPI.createPost(data);
        break;

      case 'bulk_publish':
        // Bulk publish multiple contents
        result = await wordPressAPI.bulkPublishContent(data);
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('WordPress POST error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to publish content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/seo/wordpress - Update existing content
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, updates } = body;

    if (!id || !updates) {
      return NextResponse.json(
        { success: false, error: 'Post ID and updates required' },
        { status: 400 }
      );
    }

    const result = await wordPressAPI.updatePost(id, updates);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('WordPress PUT error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/seo/wordpress - Delete content
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const force = searchParams.get('force') === 'true';

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Post ID required' },
        { status: 400 }
      );
    }

    await wordPressAPI.deletePost(parseInt(id), force);

    return NextResponse.json({
      success: true,
      message: `Post ${id} deleted`
    });

  } catch (error) {
    console.error('WordPress DELETE error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}