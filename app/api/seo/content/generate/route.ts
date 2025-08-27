import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// AI content generation framework - ready for OpenAI integration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      contentType = 'blog_post',
      targetKeyword,
      secondaryKeywords = [],
      tone = 'professional',
      length = 'medium',
      includeAIAdvantages = true
    } = body;

    if (!targetKeyword) {
      return NextResponse.json(
        { success: false, error: 'Target keyword required' },
        { status: 400 }
      );
    }

    // Generate content structure based on type
    const contentStructure = generateContentStructure(contentType, targetKeyword, includeAIAdvantages);

    // Prepare AI prompt (ready for OpenAI when API key is available)
    const aiPrompt = buildAIPrompt({
      contentType,
      targetKeyword,
      secondaryKeywords,
      tone,
      length,
      includeAIAdvantages,
      contentStructure
    });

    // For now, generate template content
    // In production, this would call OpenAI API
    const generatedContent = await generateTemplateContent({
      contentType,
      targetKeyword,
      contentStructure,
      includeAIAdvantages
    });

    // Save to database
    const { data, error } = await supabase
      .from('seo_ai_content')
      .insert({
        content_type: contentType,
        target_keyword: targetKeyword,
        ai_model: 'template', // Change to 'gpt-4' when using OpenAI
        prompt_template: aiPrompt,
        generated_title: generatedContent.title,
        generated_content: generatedContent.content,
        generated_meta_description: generatedContent.metaDescription,
        optimization_score: generatedContent.optimizationScore,
        human_edited: false,
        published: false
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      data: {
        ...data,
        generatedContent
      }
    });

  } catch (error) {
    console.error('Content generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}

// Generate content structure based on type
function generateContentStructure(contentType: string, keyword: string, includeAI: boolean) {
  const structures: Record<string, any> = {
    blog_post: {
      sections: [
        'Introduction',
        `What is ${keyword}?`,
        `Benefits of ${keyword}`,
        includeAI ? 'How AI Enhances the Process' : null,
        'Step-by-Step Guide',
        includeAI ? 'Why Choose Nordflytt\'s AI Solution' : null,
        'Frequently Asked Questions',
        'Conclusion'
      ].filter(Boolean),
      wordCount: 1500
    },
    landing_page: {
      sections: [
        'Hero Section',
        'Problem Statement',
        includeAI ? 'AI-Powered Solution' : 'Our Solution',
        'Key Benefits',
        includeAI ? '87% Accuracy Guarantee' : null,
        'How It Works',
        'Customer Testimonials',
        'Pricing',
        'Call to Action'
      ].filter(Boolean),
      wordCount: 800
    },
    service_page: {
      sections: [
        'Service Overview',
        'What\'s Included',
        includeAI ? 'AI Technology Advantages' : null,
        'Process Overview',
        'Pricing Structure',
        'Service Areas',
        'Why Choose Us',
        'Get Started'
      ].filter(Boolean),
      wordCount: 1000
    },
    area_page: {
      sections: [
        `${keyword} Overview`,
        'Local Market Knowledge',
        'Services Available',
        includeAI ? 'Smart Route Optimization' : null,
        'Local Pricing',
        'Customer Reviews',
        'Service Coverage',
        'Book Your Move'
      ].filter(Boolean),
      wordCount: 1200
    }
  };

  return structures[contentType] || structures.blog_post;
}

// Build AI prompt for content generation
function buildAIPrompt(params: any) {
  const {
    contentType,
    targetKeyword,
    secondaryKeywords,
    tone,
    length,
    includeAIAdvantages,
    contentStructure
  } = params;

  // Base prompt structure - ready for OpenAI
  const prompt = `
Create SEO-optimized ${contentType} content for the keyword "${targetKeyword}".

Company: Nordflytt - Sweden's first AI-powered moving company
Target Audience: People and businesses in Stockholm looking for moving services

Content Requirements:
- Primary keyword: ${targetKeyword}
- Secondary keywords: ${secondaryKeywords.join(', ')}
- Tone: ${tone}
- Length: ${length} (approximately ${contentStructure.wordCount} words)
- Sections: ${contentStructure.sections.join(', ')}

${includeAIAdvantages ? `
Key AI Advantages to Highlight:
- 87% ML accuracy vs 45% industry average
- 30-second instant quotes vs 24-72 hour competitors
- Enhanced Algorithm v2.1 with 43% efficiency improvement
- Real-time route optimization
- Automated inventory tracking
- Smart pricing based on 200+ factors
` : ''}

SEO Requirements:
- Use the primary keyword in the title, first paragraph, and naturally throughout
- Include secondary keywords where relevant
- Write compelling meta description (155 characters)
- Use headers (H2, H3) for structure
- Include internal links to relevant pages
- Add a clear call-to-action

Content should be informative, trustworthy, and conversion-focused.
`;

  return prompt;
}

// Generate template content (placeholder until OpenAI integration)
async function generateTemplateContent(params: any) {
  const { contentType, targetKeyword, contentStructure, includeAIAdvantages } = params;

  // Template content based on content type
  const templates: Record<string, any> = {
    blog_post: {
      title: `${targetKeyword} - Complete Guide for 2024 | Nordflytt`,
      metaDescription: `Discover everything about ${targetKeyword} in Stockholm. ${includeAIAdvantages ? 'AI-powered solutions with 87% accuracy.' : ''} Get instant quotes and professional service.`,
      content: `
# ${targetKeyword} - Your Complete Guide

Looking for reliable ${targetKeyword} in Stockholm? You've come to the right place. At Nordflytt, we've revolutionized the moving industry with cutting-edge technology and unmatched service quality.

## What Makes Our ${targetKeyword} Different?

${includeAIAdvantages ? `
### AI-Powered Precision
Our proprietary AI system analyzes over 200 factors to provide you with:
- **87% accuracy** in time and cost estimates (industry average: 45%)
- **Instant quotes** in just 30 seconds
- **Optimized routes** that save time and money
- **Smart scheduling** that adapts to your needs
` : `
### Professional Excellence
- Experienced and trained staff
- Full insurance coverage
- Transparent pricing
- Customer-first approach
`}

## How ${targetKeyword} Works

1. **Get Your Quote**: Enter your details and receive an instant, accurate quote
2. **Choose Your Date**: Our AI finds the optimal time slot for your move
3. **Relax**: Our professional team handles everything with precision
4. **Enjoy**: Settle into your new space stress-free

## Why Stockholm Residents Choose Nordflytt

- ⭐ 4.8/5 rating from 500+ customers
- 🚚 Modern, well-maintained vehicle fleet
- 💰 RUT deduction available (50% off labor costs)
- 📱 Real-time tracking and updates
- 🛡️ Full insurance coverage included

## Frequently Asked Questions

**How accurate are your estimates?**
${includeAIAdvantages ? 'Our AI achieves 87% accuracy, compared to the 45% industry average. This means no surprises on moving day.' : 'We provide detailed, transparent quotes with no hidden fees.'}

**What areas do you serve?**
We cover all of Stockholm, including Östermalm, Södermalm, Vasastan, and surrounding areas.

**How quickly can I get a quote?**
${includeAIAdvantages ? 'Our AI generates accurate quotes in just 30 seconds - no waiting for callbacks!' : 'Contact us for a quick quote within 24 hours.'}

## Ready to Experience Better ${targetKeyword}?

Don't settle for outdated moving services. Join thousands of satisfied customers who've discovered the Nordflytt difference.

[Get Your Instant Quote Now →]
`,
      optimizationScore: 85
    },
    landing_page: {
      title: `${targetKeyword} Stockholm - AI-Powered Moving Services | Nordflytt`,
      metaDescription: `Professional ${targetKeyword} in Stockholm. ${includeAIAdvantages ? '87% accurate quotes in 30 seconds.' : ''} RUT deduction available. Book today!`,
      content: `
# ${targetKeyword} Made Simple

## Moving Doesn't Have to Be Stressful

${includeAIAdvantages ? '### Get Your Quote in 30 Seconds - 87% Accuracy Guaranteed' : '### Professional Moving Services You Can Trust'}

[Get Instant Quote]

## Why Choose Nordflytt?

${includeAIAdvantages ? `
### 🤖 AI-Powered Efficiency
- **2,880x faster** quotes than competitors
- **87% accuracy** vs 45% industry average
- **Smart routing** saves you money
` : `
### ✅ Trusted Professionals
- Experienced team
- Full insurance
- Transparent pricing
`}

### 💰 Save with RUT
- 50% off labor costs
- We handle the paperwork
- Instant calculation

### ⭐ Customer Loved
- 4.8/5 rating
- 500+ happy moves
- 98% recommend us

## Simple 3-Step Process

1. **Quote** - Instant online pricing
2. **Book** - Choose your perfect time
3. **Move** - We handle the rest

[Start Your Move →]
`,
      optimizationScore: 90
    }
  };

  return templates[contentType] || templates.blog_post;
}

// GET /api/seo/content/generate - Get generated content history
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const published = searchParams.get('published') === 'true';
    const contentType = searchParams.get('content_type');

    let query = supabase
      .from('seo_ai_content')
      .select('*')
      .order('created_at', { ascending: false });

    if (published !== null) {
      query = query.eq('published', published);
    }

    if (contentType) {
      query = query.eq('content_type', contentType);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      data
    });

  } catch (error) {
    console.error('Get generated content error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch generated content' },
      { status: 500 }
    );
  }
}