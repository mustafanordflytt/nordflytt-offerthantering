import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://nordflytt.se';
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Different robots.txt for production vs development
  const robotsContent = isProduction ? `# Nordflytt Robots.txt
# Generated: ${new Date().toISOString().split('T')[0]}
# Purpose: Guide search engines to crawl our site efficiently

# Allow all search engines
User-agent: *
Allow: /

# Block admin and API routes
Disallow: /api/
Disallow: /admin/
Disallow: /crm/
Disallow: /staff/
Disallow: /_next/
Disallow: /test-*

# Block duplicate content
Disallow: /*?*sort=
Disallow: /*?*filter=
Disallow: /*?*page=

# Specifically allow important pages
Allow: /
Allow: /form
Allow: /offer/*
Allow: /tjanster/*
Allow: /omraden/*
Allow: /priser
Allow: /om-oss
Allow: /kontakt
Allow: /ai-flyttplanering
Allow: /smart-prissattning

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/sitemap-omraden.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Special rules for aggressive bots
User-agent: AhrefsBot
Crawl-delay: 10

User-agent: SemrushBot
Crawl-delay: 10

User-agent: MJ12bot
Disallow: /

User-agent: DotBot
Crawl-delay: 10` : `# Development Environment
User-agent: *
Disallow: /`;

  return new NextResponse(robotsContent, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}