import { NextResponse } from 'next/server';

// Dynamic sitemap generator
// This API endpoint can be used to generate sitemaps dynamically from database content

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://nordflytt.se';
  
  // Static pages that should always be in sitemap
  const staticPages = [
    { url: '/', priority: 1.0, changefreq: 'weekly' },
    { url: '/form', priority: 0.9, changefreq: 'monthly' },
    { url: '/priser', priority: 0.8, changefreq: 'weekly' },
    { url: '/om-oss', priority: 0.6, changefreq: 'monthly' },
    { url: '/kontakt', priority: 0.7, changefreq: 'monthly' },
  ];

  // Service pages
  const servicePages = [
    { url: '/tjanster/privatflytt', priority: 0.8 },
    { url: '/tjanster/kontorsflytt', priority: 0.8 },
    { url: '/tjanster/flyttstadning', priority: 0.8 },
    { url: '/tjanster/magasinering', priority: 0.7 },
    { url: '/tjanster/packning', priority: 0.7 },
  ];

  // AI feature pages (high priority for SEO)
  const aiPages = [
    { url: '/ai-flyttplanering', priority: 0.8 },
    { url: '/smart-prissattning', priority: 0.7 },
  ];

  // Area pages for local SEO
  const areaPages = [
    { url: '/omraden/stockholm', priority: 0.9 },
    { url: '/omraden/stockholm/ostermalm', priority: 0.8 },
    { url: '/omraden/stockholm/vasastan', priority: 0.8 },
    { url: '/omraden/stockholm/sodermalm', priority: 0.8 },
    { url: '/omraden/bromma', priority: 0.7 },
    { url: '/omraden/taby', priority: 0.7 },
    { url: '/omraden/nacka', priority: 0.7 },
  ];

  // Combine all pages
  const allPages = [...staticPages, ...servicePages, ...aiPages, ...areaPages];

  // Generate XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq || 'monthly'}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}