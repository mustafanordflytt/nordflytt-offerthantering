// =====================================================
// WORDPRESS INTEGRATION FOR SEO CONTENT PUBLISHING
// Production-ready WordPress REST API integration
// =====================================================

import { supabase } from '@/lib/supabase';

// Configuration
const WP_CONFIG = {
  baseUrl: process.env.WORDPRESS_URL || 'https://blog.nordflytt.se',
  username: process.env.WORDPRESS_USERNAME || '',
  applicationPassword: process.env.WORDPRESS_APPLICATION_PASSWORD || '',
  apiBase: '/wp-json/wp/v2'
};

// Types
export interface WordPressPost {
  id?: number;
  title: string;
  content: string;
  excerpt?: string;
  status: 'publish' | 'draft' | 'pending' | 'private';
  categories?: number[];
  tags?: number[];
  featured_media?: number;
  meta?: Record<string, any>;
  slug?: string;
  date?: string;
  modified?: string;
  link?: string;
  yoast_meta?: {
    yoast_wpseo_title?: string;
    yoast_wpseo_metadesc?: string;
    yoast_wpseo_focuskw?: string;
    yoast_wpseo_linkdex?: number;
  };
}

export interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  count: number;
}

export interface WordPressTag {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface WordPressMedia {
  id: number;
  date: string;
  guid: { rendered: string };
  link: string;
  title: { rendered: string };
  media_details: {
    width: number;
    height: number;
    file: string;
    sizes: Record<string, any>;
  };
}

export interface SEOContent {
  title: string;
  content: string;
  metaDescription: string;
  focusKeyword: string;
  slug: string;
  category: string;
  tags: string[];
  aiGenerated: boolean;
  optimizationScore: number;
}

// WordPress API Client
export class WordPressAPI {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor() {
    this.baseUrl = `${WP_CONFIG.baseUrl}${WP_CONFIG.apiBase}`;
    
    // Basic auth with application password
    const credentials = Buffer.from(
      `${WP_CONFIG.username}:${WP_CONFIG.applicationPassword}`
    ).toString('base64');

    this.headers = {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json'
    };
  }

  // Check if WordPress is configured and accessible
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/posts?per_page=1`, {
        headers: this.headers
      });
      
      return response.ok;
    } catch (error) {
      console.error('WordPress connection check failed:', error);
      return false;
    }
  }

  // Get all posts
  async getPosts(params?: {
    per_page?: number;
    page?: number;
    status?: string;
    categories?: number[];
    tags?: number[];
    search?: string;
    orderby?: string;
    order?: 'asc' | 'desc';
  }): Promise<WordPressPost[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            if (Array.isArray(value)) {
              queryParams.append(key, value.join(','));
            } else {
              queryParams.append(key, value.toString());
            }
          }
        });
      }

      const response = await fetch(`${this.baseUrl}/posts?${queryParams}`, {
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching WordPress posts:', error);
      throw error;
    }
  }

  // Get single post
  async getPost(id: number): Promise<WordPressPost> {
    try {
      const response = await fetch(`${this.baseUrl}/posts/${id}`, {
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch post: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching WordPress post:', error);
      throw error;
    }
  }

  // Create new post
  async createPost(post: Partial<WordPressPost>): Promise<WordPressPost> {
    try {
      const response = await fetch(`${this.baseUrl}/posts`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          status: post.status || 'draft',
          categories: post.categories || [],
          tags: post.tags || [],
          featured_media: post.featured_media,
          meta: post.meta || {},
          slug: post.slug
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create post: ${error}`);
      }

      const createdPost = await response.json();

      // Save to database for tracking
      await this.savePostToDatabase(createdPost);

      return createdPost;
    } catch (error) {
      console.error('Error creating WordPress post:', error);
      throw error;
    }
  }

  // Update existing post
  async updatePost(id: number, updates: Partial<WordPressPost>): Promise<WordPressPost> {
    try {
      const response = await fetch(`${this.baseUrl}/posts/${id}`, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`Failed to update post: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating WordPress post:', error);
      throw error;
    }
  }

  // Delete post
  async deletePost(id: number, force: boolean = false): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/posts/${id}?force=${force}`, {
        method: 'DELETE',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`Failed to delete post: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting WordPress post:', error);
      throw error;
    }
  }

  // Get categories
  async getCategories(): Promise<WordPressCategory[]> {
    try {
      const response = await fetch(`${this.baseUrl}/categories?per_page=100`, {
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  // Create category
  async createCategory(name: string, description?: string): Promise<WordPressCategory> {
    try {
      const response = await fetch(`${this.baseUrl}/categories`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          name,
          description,
          slug: this.generateSlug(name)
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create category: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  // Get tags
  async getTags(): Promise<WordPressTag[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tags?per_page=100`, {
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tags: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching tags:', error);
      throw error;
    }
  }

  // Create tag
  async createTag(name: string): Promise<WordPressTag> {
    try {
      const response = await fetch(`${this.baseUrl}/tags`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          name,
          slug: this.generateSlug(name)
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create tag: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating tag:', error);
      throw error;
    }
  }

  // Upload media
  async uploadMedia(file: File, title?: string): Promise<WordPressMedia> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (title) {
        formData.append('title', title);
      }

      const response = await fetch(`${this.baseUrl}/media`, {
        method: 'POST',
        headers: {
          'Authorization': this.headers.Authorization as string
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Failed to upload media: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading media:', error);
      throw error;
    }
  }

  // Publish SEO-optimized content
  async publishSEOContent(content: SEOContent): Promise<WordPressPost> {
    try {
      // Find or create category
      const categories = await this.getCategories();
      let categoryId = categories.find(c => c.slug === this.generateSlug(content.category))?.id;
      
      if (!categoryId) {
        const newCategory = await this.createCategory(content.category);
        categoryId = newCategory.id;
      }

      // Find or create tags
      const existingTags = await this.getTags();
      const tagIds: number[] = [];
      
      for (const tagName of content.tags) {
        let tag = existingTags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
        if (!tag) {
          tag = await this.createTag(tagName);
        }
        tagIds.push(tag.id);
      }

      // Prepare post data
      const postData: Partial<WordPressPost> = {
        title: content.title,
        content: this.enhanceContentWithSchema(content),
        excerpt: content.metaDescription,
        status: 'draft', // Always start as draft for review
        categories: [categoryId],
        tags: tagIds,
        slug: content.slug || this.generateSlug(content.title),
        meta: {
          _yoast_wpseo_title: content.title,
          _yoast_wpseo_metadesc: content.metaDescription,
          _yoast_wpseo_focuskw: content.focusKeyword,
          _nordflytt_ai_generated: content.aiGenerated,
          _nordflytt_optimization_score: content.optimizationScore
        }
      };

      // Create the post
      const createdPost = await this.createPost(postData);

      return createdPost;
    } catch (error) {
      console.error('Error publishing SEO content:', error);
      throw error;
    }
  }

  // Enhance content with schema markup
  private enhanceContentWithSchema(content: SEOContent): string {
    // Add schema markup for better SEO
    const schemaScript = `
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "${content.title}",
  "description": "${content.metaDescription}",
  "author": {
    "@type": "Organization",
    "name": "Nordflytt"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Nordflytt",
    "logo": {
      "@type": "ImageObject",
      "url": "https://nordflytt.se/nordflytt-logo.png"
    }
  },
  "datePublished": "${new Date().toISOString()}",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://blog.nordflytt.se/${content.slug}"
  }
}
</script>
`;

    // Add internal links to main site
    const internalLinks = `
<div class="internal-links">
  <h3>Relaterade tjänster</h3>
  <ul>
    <li><a href="https://nordflytt.se/form">Få instant flyttpris (30 sekunder)</a></li>
    <li><a href="https://nordflytt.se/tjanster/privatflytt">Privatflytt med AI-optimering</a></li>
    <li><a href="https://nordflytt.se/tjanster/kontorsflytt">Kontorsflytt Stockholm</a></li>
  </ul>
</div>
`;

    // Add CTA section
    const ctaSection = `
<div class="cta-section" style="background: #f0f7ff; padding: 20px; border-radius: 8px; margin: 30px 0;">
  <h3>🤖 Upplev Sveriges första AI-drivna flyttfirma</h3>
  <p><strong>87% noggrannhet</strong> i våra tidsestimeringar (branschsnitt: 45%)</p>
  <p><strong>30 sekunder</strong> till fast pris (konkurrenter: 24-72 timmar)</p>
  <a href="https://nordflytt.se/form" class="cta-button" style="display: inline-block; background: #002A5C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 10px;">Få Ditt Pris Nu →</a>
</div>
`;

    return `
${content.content}

${ctaSection}

${internalLinks}

${schemaScript}
`;
  }

  // Generate SEO-friendly slug
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[åä]/g, 'a')
      .replace(/ö/g, 'o')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }

  // Save post data to Supabase for tracking
  private async savePostToDatabase(post: WordPressPost): Promise<void> {
    try {
      await supabase
        .from('seo_content')
        .insert({
          page_url: post.link,
          page_type: 'blog',
          target_keyword: post.yoast_meta?.yoast_wpseo_focuskw || '',
          title: post.title,
          meta_description: post.yoast_meta?.yoast_wpseo_metadesc || post.excerpt,
          ai_optimized: post.meta?._nordflytt_ai_generated || false,
          optimization_score: post.meta?._nordflytt_optimization_score || 0,
          created_at: post.date,
          updated_at: post.modified
        });
    } catch (error) {
      console.error('Error saving post to database:', error);
    }
  }

  // Bulk publish content
  async bulkPublishContent(contents: SEOContent[]): Promise<WordPressPost[]> {
    const results: WordPressPost[] = [];

    for (const content of contents) {
      try {
        const post = await this.publishSEOContent(content);
        results.push(post);
        
        // Delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to publish "${content.title}":`, error);
      }
    }

    return results;
  }

  // Get SEO performance data from WordPress
  async getSEOPerformance(): Promise<any> {
    try {
      // This would integrate with Yoast SEO or similar plugin API
      // For now, return structure ready for real data
      return {
        totalPosts: 0,
        optimizedPosts: 0,
        averageScore: 0,
        topPerformers: [],
        needsImprovement: []
      };
    } catch (error) {
      console.error('Error fetching SEO performance:', error);
      return null;
    }
  }
}

// Export singleton instance
export const wordPressAPI = new WordPressAPI();