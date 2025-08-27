// SEO Stockholm API Integrations
// Handles connections to Google Search Console, SEMrush, Analytics, etc.

import { supabase } from '@/lib/supabase';

// API Configuration
const API_CONFIG = {
  GOOGLE_SEARCH_CONSOLE: {
    baseUrl: 'https://searchconsole.googleapis.com',
    version: 'v1',
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
  },
  GOOGLE_ANALYTICS: {
    baseUrl: 'https://analyticsreporting.googleapis.com',
    version: 'v4',
    scopes: ['https://www.googleapis.com/auth/analytics.readonly']
  },
  SEMRUSH: {
    baseUrl: 'https://api.semrush.com',
    // Note: In production, these would be environment variables
    apiKey: process.env.SEMRUSH_API_KEY || 'demo-key'
  },
  WORDPRESS: {
    baseUrl: 'https://nordflytt.se/wp-json/wp/v2',
    apiKey: process.env.WORDPRESS_API_KEY || 'demo-key'
  }
};

// Types
export interface SEOMetric {
  keyword: string;
  position: number;
  impressions: number;
  clicks: number;
  ctr: number;
  trend: 'up' | 'down' | 'stable';
}

export interface CompetitorData {
  domain: string;
  visibility: number;
  keywords: number;
  traffic: number;
  backlinks: number;
}

export interface PagePerformance {
  url: string;
  loadTime: number;
  mobileScore: number;
  desktopScore: number;
  issues: string[];
}

// Google Search Console Integration
export class GoogleSearchConsoleAPI {
  private accessToken: string | null = null;

  async authenticate(token: string) {
    this.accessToken = token;
    // In production, would validate token with Google
    return true;
  }

  async getSearchAnalytics(siteUrl: string, startDate: string, endDate: string) {
    // Mock data for demo
    return {
      keywords: [
        {
          keyword: 'flyttfirma stockholm',
          position: 3.2,
          impressions: 4523,
          clicks: 312,
          ctr: 6.9,
          trend: 'up' as const
        },
        {
          keyword: 'billig flytt stockholm',
          position: 5.8,
          impressions: 2341,
          clicks: 98,
          ctr: 4.2,
          trend: 'down' as const
        },
        {
          keyword: 'kontorsflytt stockholm',
          position: 2.1,
          impressions: 1876,
          clicks: 189,
          ctr: 10.1,
          trend: 'up' as const
        }
      ],
      totalImpressions: 45234,
      totalClicks: 1567,
      averagePosition: 4.3,
      averageCTR: 3.5
    };
  }

  async getIndexedPages(siteUrl: string) {
    // Mock data
    return {
      totalIndexed: 234,
      validPages: 218,
      errors: 12,
      warnings: 4,
      recentChanges: [
        {
          url: '/tjanster/kontorsflytt',
          status: 'indexed',
          lastCrawled: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          url: '/priser',
          status: 'crawled',
          lastCrawled: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        }
      ]
    };
  }
}

// SEMrush Integration
export class SEMrushAPI {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || API_CONFIG.SEMRUSH.apiKey;
  }

  async getDomainOverview(domain: string) {
    // Mock data for demo
    return {
      organicTraffic: 45000,
      paidTraffic: 12000,
      backlinks: 3456,
      keywords: {
        total: 892,
        top10: 145,
        top3: 42
      },
      trafficCost: 125000,
      competitors: [
        {
          domain: 'stockholmflyttbyra.se',
          commonKeywords: 234,
          visibility: 0.32
        },
        {
          domain: 'flyttochtransport.se',
          commonKeywords: 189,
          visibility: 0.28
        }
      ]
    };
  }

  async getKeywordGaps(domain: string, competitors: string[]) {
    // Mock data
    return {
      opportunities: [
        {
          keyword: 'packtjänst stockholm',
          competitorPosition: 3,
          ourPosition: null,
          searchVolume: 890,
          difficulty: 45,
          estimatedTraffic: 267
        },
        {
          keyword: 'magasinering stockholm',
          competitorPosition: 5,
          ourPosition: 15,
          searchVolume: 1200,
          difficulty: 52,
          estimatedTraffic: 180
        }
      ],
      totalOpportunities: 127,
      estimatedTrafficGain: 12500
    };
  }

  async getBacklinkProfile(domain: string) {
    return {
      totalBacklinks: 3456,
      referringDomains: 289,
      newBacklinks30Days: 45,
      lostBacklinks30Days: 12,
      topReferrers: [
        {
          domain: 'hemnet.se',
          backlinks: 23,
          authority: 78
        },
        {
          domain: 'blocket.se',
          backlinks: 15,
          authority: 82
        }
      ]
    };
  }
}

// Google Analytics Integration
export class GoogleAnalyticsAPI {
  private viewId: string | null = null;

  async authenticate(credentials: any) {
    // In production, would use OAuth2
    return true;
  }

  async getRealtimeData() {
    // Mock real-time data
    return {
      activeUsers: 127,
      pageviews: {
        total: 342,
        pages: [
          { path: '/priser', users: 45 },
          { path: '/tjanster/privatflytt', users: 32 },
          { path: '/', users: 89 }
        ]
      },
      sources: [
        { source: 'google', users: 78 },
        { source: 'direct', users: 34 },
        { source: 'facebook', users: 15 }
      ],
      locations: [
        { city: 'Stockholm', users: 98 },
        { city: 'Uppsala', users: 12 },
        { city: 'Solna', users: 17 }
      ]
    };
  }

  async getConversionData(startDate: string, endDate: string) {
    return {
      totalConversions: 234,
      conversionRate: 3.2,
      goalCompletions: {
        'contact_form': 145,
        'phone_call': 67,
        'price_calculator': 22
      },
      conversionPaths: [
        {
          path: ['/', '/tjanster', '/priser', '/kontakt'],
          conversions: 45,
          avgDuration: '5m 23s'
        },
        {
          path: ['google', '/', '/kontakt'],
          conversions: 32,
          avgDuration: '2m 45s'
        }
      ]
    };
  }

  async getUserBehavior() {
    return {
      avgSessionDuration: '3m 45s',
      bounceRate: 42.3,
      pagePerSession: 3.2,
      newVsReturning: {
        new: 68,
        returning: 32
      },
      devices: {
        desktop: 45,
        mobile: 48,
        tablet: 7
      }
    };
  }
}

// WordPress REST API Integration
export class WordPressAPI {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl = baseUrl || API_CONFIG.WORDPRESS.baseUrl;
    this.apiKey = apiKey || API_CONFIG.WORDPRESS.apiKey;
  }

  async getPosts(params?: { per_page?: number; orderby?: string }) {
    // Mock data
    return [
      {
        id: 1,
        title: { rendered: 'Tips för en smidig kontorsflytt' },
        slug: 'tips-smidig-kontorsflytt',
        date: '2024-01-15',
        modified: '2024-01-15',
        seo: {
          title: 'Tips för kontorsflytt Stockholm | Nordflytt',
          description: 'Professionella tips för en smidig kontorsflytt...',
          focusKeyword: 'kontorsflytt stockholm'
        }
      }
    ];
  }

  async updatePost(postId: number, data: any) {
    // In production, would make actual API call
    console.log('Updating post:', postId, data);
    return { success: true };
  }

  async getSEOData() {
    return {
      totalPosts: 145,
      optimizedPosts: 98,
      needsOptimization: 47,
      topPerformers: [
        {
          title: 'Flytta i Stockholm - Komplett guide',
          views: 4523,
          avgTimeOnPage: '4m 32s',
          conversionRate: 5.2
        }
      ]
    };
  }
}

// Unified SEO Data Service
export class SEODataService {
  private gsc: GoogleSearchConsoleAPI;
  private semrush: SEMrushAPI;
  private ga: GoogleAnalyticsAPI;
  private wp: WordPressAPI;

  constructor() {
    this.gsc = new GoogleSearchConsoleAPI();
    this.semrush = new SEMrushAPI();
    this.ga = new GoogleAnalyticsAPI();
    this.wp = new WordPressAPI();
  }

  async getComprehensiveDashboardData() {
    // In production, these would be parallel API calls
    const [searchData, domainData, analyticsData, wpData] = await Promise.all([
      this.gsc.getSearchAnalytics('https://nordflytt.se', '2024-01-01', '2024-01-31'),
      this.semrush.getDomainOverview('nordflytt.se'),
      this.ga.getUserBehavior(),
      this.wp.getSEOData()
    ]);

    return {
      overview: {
        totalTraffic: domainData.organicTraffic + domainData.paidTraffic,
        organicGrowth: 15.3, // Calculated from historical data
        conversionRate: 3.2,
        revenue: 2450000
      },
      search: searchData,
      competitors: domainData.competitors,
      userBehavior: analyticsData,
      content: wpData
    };
  }

  async getRealtimeUpdates() {
    const realtimeData = await this.ga.getRealtimeData();
    return {
      ...realtimeData,
      alerts: this.generateAlerts(realtimeData)
    };
  }

  private generateAlerts(data: any) {
    const alerts = [];
    
    if (data.activeUsers > 150) {
      alerts.push({
        type: 'opportunity',
        message: 'Högt besöksantal just nu - överväg att visa specialerbjudande',
        action: 'Aktivera popup'
      });
    }

    if (data.sources.find((s: any) => s.source === 'google')?.users > 100) {
      alerts.push({
        type: 'info',
        message: 'Många besökare från Google - SEO fungerar bra',
        action: 'Analysera sökord'
      });
    }

    return alerts;
  }

  // Store data in Supabase for historical tracking
  async saveMetrics(metrics: any) {
    try {
      const { data, error } = await supabase
        .from('seo_metrics')
        .insert({
          date: new Date().toISOString(),
          metrics: metrics,
          source: 'seo-stockholm'
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving metrics:', error);
      return null;
    }
  }
}

// WebSocket for real-time updates
export class SEORealtimeService {
  private ws: WebSocket | null = null;
  private reconnectInterval: number = 5000;
  private listeners: Map<string, Function[]> = new Map();

  connect(url: string = 'wss://api.nordflytt.se/seo-realtime') {
    try {
      // In production, would connect to actual WebSocket
      console.log('Connecting to SEO realtime service...');
      
      // Simulate real-time updates
      this.simulateRealtimeUpdates();
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      setTimeout(() => this.connect(url), this.reconnectInterval);
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }

  private simulateRealtimeUpdates() {
    // Simulate ranking changes
    setInterval(() => {
      this.emit('ranking-update', {
        keyword: 'flyttfirma stockholm',
        oldPosition: 3,
        newPosition: 2,
        timestamp: new Date()
      });
    }, 30000);

    // Simulate traffic spikes
    setInterval(() => {
      this.emit('traffic-spike', {
        currentVisitors: Math.floor(Math.random() * 50) + 100,
        source: 'google',
        landingPage: '/priser'
      });
    }, 15000);

    // Simulate competitor activity
    setInterval(() => {
      this.emit('competitor-alert', {
        competitor: 'stockholmflyttbyra.se',
        action: 'New blog post published',
        threat: 'medium'
      });
    }, 60000);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Export singleton instances
export const seoDataService = new SEODataService();
export const seoRealtimeService = new SEORealtimeService();