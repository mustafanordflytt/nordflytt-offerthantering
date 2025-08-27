import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/seo/technical-audit - Get technical SEO audit results
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const pageUrl = searchParams.get('page_url');

    let query = supabase
      .from('seo_technical_audits')
      .select('*')
      .order('impact_score', { ascending: false });

    if (category) {
      query = query.eq('issue_category', category);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (pageUrl) {
      query = query.eq('page_url', pageUrl);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calculate audit summary
    const summary = calculateAuditSummary(data || []);

    return NextResponse.json({ 
      success: true, 
      data,
      summary
    });

  } catch (error) {
    console.error('Technical audit API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch audit data' },
      { status: 500 }
    );
  }
}

// Calculate audit summary metrics
function calculateAuditSummary(data: any[]) {
  const summary = {
    totalIssues: data.length,
    criticalIssues: data.filter(i => i.issue_category === 'critical').length,
    errors: data.filter(i => i.issue_category === 'error').length,
    warnings: data.filter(i => i.issue_category === 'warning').length,
    notices: data.filter(i => i.issue_category === 'notice').length,
    fixedIssues: data.filter(i => i.status === 'fixed').length,
    openIssues: data.filter(i => i.status === 'open').length,
    seoScore: calculateSEOScore(data),
    estimatedFixTime: data
      .filter(i => i.status === 'open')
      .reduce((sum, i) => sum + (i.estimated_fix_time || 0), 0),
    topIssues: data
      .filter(i => i.status === 'open')
      .sort((a, b) => b.impact_score - a.impact_score)
      .slice(0, 5),
    issuesByType: {} as Record<string, number>
  };

  // Group issues by type
  const issueTypes = [...new Set(data.map(i => i.issue_type))];
  issueTypes.forEach(type => {
    summary.issuesByType[type] = data.filter(i => i.issue_type === type).length;
  });

  return summary;
}

// Calculate overall SEO score
function calculateSEOScore(issues: any[]): number {
  let score = 100;

  issues.forEach(issue => {
    if (issue.status !== 'fixed') {
      switch (issue.issue_category) {
        case 'critical':
          score -= 10;
          break;
        case 'error':
          score -= 5;
          break;
        case 'warning':
          score -= 2;
          break;
        case 'notice':
          score -= 0.5;
          break;
      }
    }
  });

  return Math.max(0, Math.min(100, score));
}

// POST /api/seo/technical-audit - Run technical SEO audit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pageUrls = [], fullSiteAudit = false } = body;

    // Prepare pages to audit
    let pagesToAudit: string[] = [];

    if (fullSiteAudit) {
      // Get all pages from content table
      const { data: pages } = await supabase
        .from('seo_content')
        .select('page_url');
      
      pagesToAudit = pages?.map(p => p.page_url) || [];
    } else if (pageUrls.length > 0) {
      pagesToAudit = pageUrls;
    } else {
      // Default critical pages
      pagesToAudit = [
        '/',
        '/form',
        '/priser',
        '/tjanster/privatflytt',
        '/tjanster/kontorsflytt',
        '/tjanster/flyttstadning'
      ];
    }

    // Run audit checks
    const auditResults = await runTechnicalAudit(pagesToAudit);

    // Save results to database
    if (auditResults.length > 0) {
      const { error } = await supabase
        .from('seo_technical_audits')
        .insert(auditResults);

      if (error) throw error;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Audited ${pagesToAudit.length} pages`,
      pagesAudited: pagesToAudit.length,
      issuesFound: auditResults.length,
      results: auditResults
    });

  } catch (error) {
    console.error('Technical audit POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to run audit' },
      { status: 500 }
    );
  }
}

// Run technical SEO audit
async function runTechnicalAudit(pageUrls: string[]): Promise<any[]> {
  const issues: any[] = [];
  const baseUrl = 'https://nordflytt.se';

  for (const pageUrl of pageUrls) {
    // These checks would normally be done by crawling the actual pages
    // For now, we'll check for common issues based on patterns

    // Check for missing meta descriptions
    if (!await checkMetaDescription(pageUrl)) {
      issues.push({
        page_url: pageUrl,
        issue_type: 'missing_meta_description',
        issue_category: 'error',
        issue_description: 'Page is missing meta description tag',
        impact_score: 70,
        ai_recommendation: 'Add a unique, compelling meta description between 150-160 characters that includes target keywords.',
        fix_complexity: 'easy',
        estimated_fix_time: 10,
        status: 'open'
      });
    }

    // Check for title tag issues
    if (!await checkTitleTag(pageUrl)) {
      issues.push({
        page_url: pageUrl,
        issue_type: 'title_tag_issue',
        issue_category: 'error',
        issue_description: 'Title tag missing or not optimized',
        impact_score: 80,
        ai_recommendation: 'Create unique title tag under 60 characters with primary keyword near the beginning.',
        fix_complexity: 'easy',
        estimated_fix_time: 10,
        status: 'open'
      });
    }

    // Check for missing H1
    if (!await checkH1Tag(pageUrl)) {
      issues.push({
        page_url: pageUrl,
        issue_type: 'missing_h1',
        issue_category: 'error',
        issue_description: 'Page is missing H1 tag',
        impact_score: 60,
        ai_recommendation: 'Add exactly one H1 tag that includes the target keyword and clearly describes the page content.',
        fix_complexity: 'easy',
        estimated_fix_time: 5,
        status: 'open'
      });
    }

    // Check for AI-specific optimizations
    if (await shouldHaveAIContent(pageUrl) && !await checkAIOptimization(pageUrl)) {
      issues.push({
        page_url: pageUrl,
        issue_type: 'missing_ai_optimization',
        issue_category: 'warning',
        issue_description: 'Page could benefit from AI/ML keyword optimization',
        impact_score: 50,
        ai_recommendation: 'Add content highlighting Nordflytt\'s AI advantages: 87% accuracy, 30-second quotes, ML-powered optimization.',
        fix_complexity: 'medium',
        estimated_fix_time: 30,
        status: 'open'
      });
    }

    // Check for schema markup
    if (!await checkSchemaMarkup(pageUrl)) {
      issues.push({
        page_url: pageUrl,
        issue_type: 'missing_schema',
        issue_category: 'warning',
        issue_description: 'Page is missing structured data (schema.org)',
        impact_score: 40,
        ai_recommendation: 'Add appropriate schema markup: LocalBusiness for service pages, Article for blog posts, FAQPage for FAQ sections.',
        fix_complexity: 'medium',
        estimated_fix_time: 20,
        status: 'open'
      });
    }

    // Check page speed (mock check)
    const speedScore = await checkPageSpeed(pageUrl);
    if (speedScore < 90) {
      issues.push({
        page_url: pageUrl,
        issue_type: 'slow_page_speed',
        issue_category: speedScore < 50 ? 'critical' : 'warning',
        issue_description: `Page speed score is ${speedScore}/100`,
        impact_score: speedScore < 50 ? 90 : 60,
        ai_recommendation: 'Optimize images, enable browser caching, minify CSS/JS, and consider lazy loading for below-fold content.',
        fix_complexity: 'hard',
        estimated_fix_time: 60,
        status: 'open'
      });
    }

    // Check mobile friendliness
    if (!await checkMobileFriendly(pageUrl)) {
      issues.push({
        page_url: pageUrl,
        issue_type: 'mobile_issues',
        issue_category: 'critical',
        issue_description: 'Page has mobile usability issues',
        impact_score: 85,
        ai_recommendation: 'Ensure responsive design, readable text without zooming, and touch-friendly buttons (min 44px).',
        fix_complexity: 'medium',
        estimated_fix_time: 45,
        status: 'open'
      });
    }

    // Check for SSL
    if (!pageUrl.startsWith('https')) {
      issues.push({
        page_url: pageUrl,
        issue_type: 'missing_ssl',
        issue_category: 'critical',
        issue_description: 'Page is not served over HTTPS',
        impact_score: 100,
        ai_recommendation: 'Enable SSL certificate and redirect all HTTP traffic to HTTPS.',
        fix_complexity: 'medium',
        estimated_fix_time: 30,
        status: 'open'
      });
    }
  }

  return issues;
}

// Mock check functions (in production, these would actually crawl/analyze pages)
async function checkMetaDescription(url: string): Promise<boolean> {
  // In production, would check actual page
  return !url.includes('test');
}

async function checkTitleTag(url: string): Promise<boolean> {
  // In production, would check actual page
  return !url.includes('old');
}

async function checkH1Tag(url: string): Promise<boolean> {
  // In production, would check actual page
  return true;
}

async function shouldHaveAIContent(url: string): Promise<boolean> {
  // Pages that should mention AI advantages
  return url === '/' || url.includes('tjanster') || url === '/priser';
}

async function checkAIOptimization(url: string): Promise<boolean> {
  // In production, would check for AI keywords in content
  return false;
}

async function checkSchemaMarkup(url: string): Promise<boolean> {
  // In production, would check for structured data
  return url === '/';
}

async function checkPageSpeed(url: string): Promise<number> {
  // In production, would use PageSpeed Insights API
  return Math.floor(Math.random() * 40) + 60; // Mock score 60-100
}

async function checkMobileFriendly(url: string): Promise<boolean> {
  // In production, would check mobile usability
  return true;
}

// PATCH /api/seo/technical-audit - Update issue status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, fixed_date } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'ID and status required' },
        { status: 400 }
      );
    }

    const updateData: any = { status };
    if (status === 'fixed') {
      updateData.fixed_date = fixed_date || new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('seo_technical_audits')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      data
    });

  } catch (error) {
    console.error('Technical audit PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update audit issue' },
      { status: 500 }
    );
  }
}