// =====================================================
// GOOGLE SEARCH CONSOLE API INTEGRATION
// Production-ready integration for real SEO data
// =====================================================

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { supabase } from '@/lib/supabase';

// Configuration
const GSC_CONFIG = {
  clientId: process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET || '',
  redirectUri: process.env.GOOGLE_SEARCH_CONSOLE_REDIRECT_URI || 'https://nordflytt.se/api/auth/google/callback',
  refreshToken: process.env.GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN || '',
  siteUrl: 'https://nordflytt.se/',
  scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
};

// Types
export interface SearchAnalyticsQuery {
  startDate: string;
  endDate: string;
  dimensions?: ('date' | 'query' | 'page' | 'country' | 'device')[];
  dimensionFilterGroups?: any[];
  rowLimit?: number;
  startRow?: number;
  searchType?: 'web' | 'image' | 'video';
  aggregationType?: 'byPage' | 'byProperty' | 'auto';
}

export interface SearchAnalyticsRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface PagePerformance {
  url: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  queries: QueryPerformance[];
}

export interface QueryPerformance {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SiteInspectionResult {
  inspectionResult: {
    indexStatusResult: {
      verdict: string;
      robotsTxtState: string;
      indexingState: string;
      lastCrawlTime: string;
      pageFetchState: string;
      googleCanonical: string;
      userCanonical: string;
    };
    mobileUsabilityResult: {
      verdict: string;
      issues: any[];
    };
    richResultsResult: {
      verdict: string;
      detectedItems: any[];
    };
  };
}

// Google Search Console API Client
export class GoogleSearchConsoleAPI {
  private oauth2Client: OAuth2Client;
  private searchconsole: any;
  private isInitialized: boolean = false;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      GSC_CONFIG.clientId,
      GSC_CONFIG.clientSecret,
      GSC_CONFIG.redirectUri
    );

    // Set refresh token if available
    if (GSC_CONFIG.refreshToken) {
      this.oauth2Client.setCredentials({
        refresh_token: GSC_CONFIG.refreshToken
      });
    }
  }

  // Initialize the API client
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Get access token from refresh token
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.oauth2Client.setCredentials(credentials);

      // Initialize Search Console API
      this.searchconsole = google.searchconsole({
        version: 'v1',
        auth: this.oauth2Client
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Google Search Console API:', error);
      throw new Error('Google Search Console initialization failed');
    }
  }

  // Get authorization URL for initial setup
  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: GSC_CONFIG.scopes,
      prompt: 'consent'
    });
  }

  // Exchange authorization code for tokens
  async getTokensFromCode(code: string): Promise<any> {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    return tokens;
  }

  // Fetch search analytics data
  async getSearchAnalytics(query: SearchAnalyticsQuery): Promise<SearchAnalyticsRow[]> {
    await this.initialize();

    try {
      const response = await this.searchconsole.searchanalytics.query({
        siteUrl: GSC_CONFIG.siteUrl,
        requestBody: query
      });

      // Save to database
      if (response.data.rows) {
        await this.saveSearchAnalyticsData(response.data.rows, query);
      }

      return response.data.rows || [];
    } catch (error) {
      console.error('Search Analytics API error:', error);
      throw error;
    }
  }

  // Get keyword performance data
  async getKeywordPerformance(startDate: string, endDate: string): Promise<QueryPerformance[]> {
    const query: SearchAnalyticsQuery = {
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit: 1000,
      searchType: 'web'
    };

    const rows = await this.getSearchAnalytics(query);

    return rows.map(row => ({
      query: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position
    }));
  }

  // Get page performance data
  async getPagePerformance(startDate: string, endDate: string): Promise<PagePerformance[]> {
    const query: SearchAnalyticsQuery = {
      startDate,
      endDate,
      dimensions: ['page'],
      rowLimit: 1000,
      searchType: 'web'
    };

    const rows = await this.getSearchAnalytics(query);

    // Get queries for each page
    const pagePerformance: PagePerformance[] = [];

    for (const row of rows) {
      const pageUrl = row.keys[0];
      
      // Get queries for this specific page
      const pageQueryData = await this.getQueriesForPage(pageUrl, startDate, endDate);

      pagePerformance.push({
        url: pageUrl,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
        queries: pageQueryData
      });
    }

    return pagePerformance;
  }

  // Get queries for a specific page
  async getQueriesForPage(pageUrl: string, startDate: string, endDate: string): Promise<QueryPerformance[]> {
    const query: SearchAnalyticsQuery = {
      startDate,
      endDate,
      dimensions: ['query'],
      dimensionFilterGroups: [{
        filters: [{
          dimension: 'page',
          expression: pageUrl,
          operator: 'equals'
        }]
      }],
      rowLimit: 100,
      searchType: 'web'
    };

    const rows = await this.getSearchAnalytics(query);

    return rows.map(row => ({
      query: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position
    }));
  }

  // Get AI-focused keyword performance
  async getAIKeywordPerformance(startDate: string, endDate: string): Promise<QueryPerformance[]> {
    const aiKeywords = [
      'ai', 'artificial intelligence', 'machine learning', 'ml', 
      'smart', 'automated', 'automatic', 'instant', 
      '87%', 'accuracy', 'algorithm'
    ];

    const query: SearchAnalyticsQuery = {
      startDate,
      endDate,
      dimensions: ['query'],
      dimensionFilterGroups: [{
        groupType: 'and',
        filters: aiKeywords.map(keyword => ({
          dimension: 'query',
          expression: keyword,
          operator: 'contains'
        }))
      }],
      rowLimit: 500,
      searchType: 'web'
    };

    const rows = await this.getSearchAnalytics(query);

    return rows.map(row => ({
      query: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position
    }));
  }

  // Get mobile vs desktop performance
  async getDevicePerformance(startDate: string, endDate: string): Promise<any> {
    const query: SearchAnalyticsQuery = {
      startDate,
      endDate,
      dimensions: ['device'],
      searchType: 'web'
    };

    const rows = await this.getSearchAnalytics(query);

    return rows.reduce((acc, row) => {
      const device = row.keys[0];
      acc[device] = {
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position
      };
      return acc;
    }, {} as any);
  }

  // Get local SEO performance (Stockholm areas)
  async getLocalSEOPerformance(startDate: string, endDate: string): Promise<any> {
    const stockholmAreas = [
      'östermalm', 'södermalm', 'vasastan', 'kungsholmen',
      'bromma', 'täby', 'nacka', 'solna', 'lidingö', 'danderyd'
    ];

    const results: any = {};

    for (const area of stockholmAreas) {
      const query: SearchAnalyticsQuery = {
        startDate,
        endDate,
        dimensions: ['query'],
        dimensionFilterGroups: [{
          filters: [{
            dimension: 'query',
            expression: area,
            operator: 'contains'
          }]
        }],
        rowLimit: 50,
        searchType: 'web'
      };

      const rows = await this.getSearchAnalytics(query);
      
      results[area] = {
        totalClicks: rows.reduce((sum, row) => sum + row.clicks, 0),
        totalImpressions: rows.reduce((sum, row) => sum + row.impressions, 0),
        averagePosition: rows.length > 0 
          ? rows.reduce((sum, row) => sum + row.position, 0) / rows.length 
          : 0,
        topQueries: rows.slice(0, 5)
      };
    }

    return results;
  }

  // Inspect URL for indexing status
  async inspectUrl(url: string): Promise<SiteInspectionResult> {
    await this.initialize();

    try {
      const response = await this.searchconsole.urlInspection.index.inspect({
        requestBody: {
          inspectionUrl: url,
          siteUrl: GSC_CONFIG.siteUrl
        }
      });

      return response.data;
    } catch (error) {
      console.error('URL Inspection API error:', error);
      throw error;
    }
  }

  // Get sitemap status
  async getSitemaps(): Promise<any> {
    await this.initialize();

    try {
      const response = await this.searchconsole.sitemaps.list({
        siteUrl: GSC_CONFIG.siteUrl
      });

      return response.data.sitemap || [];
    } catch (error) {
      console.error('Sitemaps API error:', error);
      throw error;
    }
  }

  // Save search analytics data to database
  private async saveSearchAnalyticsData(rows: SearchAnalyticsRow[], query: SearchAnalyticsQuery): Promise<void> {
    try {
      const dataToInsert = rows.map(row => {
        const baseData = {
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
          date: query.startDate // Use startDate as the reference date
        };

        // Map dimensions to database columns
        if (query.dimensions) {
          query.dimensions.forEach((dimension, index) => {
            switch (dimension) {
              case 'query':
                baseData['query'] = row.keys[index];
                break;
              case 'page':
                baseData['url'] = row.keys[index];
                break;
              case 'country':
                baseData['country'] = row.keys[index];
                break;
              case 'device':
                baseData['device'] = row.keys[index];
                break;
            }
          });
        }

        return baseData;
      });

      // Batch insert to database
      const { error } = await supabase
        .from('seo_search_console')
        .upsert(dataToInsert, {
          onConflict: 'date,url,query,country,device'
        });

      if (error) {
        console.error('Error saving Search Console data:', error);
      }
    } catch (error) {
      console.error('Failed to save Search Console data:', error);
    }
  }

  // Get performance comparison (current vs previous period)
  async getPerformanceComparison(days: number = 30): Promise<any> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const prevEndDate = new Date(startDate);
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - days);

    // Format dates
    const format = (date: Date) => date.toISOString().split('T')[0];

    // Get current period data
    const currentData = await this.getSearchAnalytics({
      startDate: format(startDate),
      endDate: format(endDate),
      searchType: 'web'
    });

    // Get previous period data
    const previousData = await this.getSearchAnalytics({
      startDate: format(prevStartDate),
      endDate: format(prevEndDate),
      searchType: 'web'
    });

    // Calculate totals
    const calculateTotals = (data: SearchAnalyticsRow[]) => ({
      clicks: data.reduce((sum, row) => sum + row.clicks, 0),
      impressions: data.reduce((sum, row) => sum + row.impressions, 0),
      avgCtr: data.length > 0 ? data.reduce((sum, row) => sum + row.ctr, 0) / data.length : 0,
      avgPosition: data.length > 0 ? data.reduce((sum, row) => sum + row.position, 0) / data.length : 0
    });

    const current = calculateTotals(currentData);
    const previous = calculateTotals(previousData);

    // Calculate changes
    return {
      current,
      previous,
      changes: {
        clicks: {
          value: current.clicks - previous.clicks,
          percentage: previous.clicks > 0 ? ((current.clicks - previous.clicks) / previous.clicks) * 100 : 0
        },
        impressions: {
          value: current.impressions - previous.impressions,
          percentage: previous.impressions > 0 ? ((current.impressions - previous.impressions) / previous.impressions) * 100 : 0
        },
        ctr: {
          value: current.avgCtr - previous.avgCtr,
          percentage: previous.avgCtr > 0 ? ((current.avgCtr - previous.avgCtr) / previous.avgCtr) * 100 : 0
        },
        position: {
          value: current.avgPosition - previous.avgPosition,
          percentage: previous.avgPosition > 0 ? ((current.avgPosition - previous.avgPosition) / previous.avgPosition) * 100 : 0
        }
      }
    };
  }
}

// Export singleton instance
export const googleSearchConsole = new GoogleSearchConsoleAPI();