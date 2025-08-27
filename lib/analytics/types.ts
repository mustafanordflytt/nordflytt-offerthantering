// Analytics types and interfaces

export interface AnalyticsConfig {
  ga4: {
    measurementId: string;
    enabled: boolean;
  };
  gtm: {
    containerId: string;
    enabled: boolean;
  };
  facebook: {
    pixelId: string;
    enabled: boolean;
  };
  cookieConsent: {
    enabled: boolean;
    cookieName: string;
    cookieExpiry: number; // days
  };
}

export interface TrackingEvent {
  name: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  parameters?: Record<string, any>;
}

export interface ConversionEvent {
  type: 'booking' | 'quote' | 'lead' | 'signup';
  value: number;
  currency: string;
  transactionId?: string;
  items?: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}

export interface UserProperties {
  userId?: string;
  customerType?: 'private' | 'business';
  location?: string;
  serviceType?: string;
  leadSource?: string;
  campaignId?: string;
}

export interface PageViewEvent {
  path: string;
  title: string;
  referrer?: string;
  search?: string;
}

export interface MLEvent {
  algorithm: string;
  action: 'prediction' | 'optimization' | 'recommendation';
  accuracy?: number;
  inputData?: Record<string, any>;
  outputData?: Record<string, any>;
  processingTime?: number;
}

export interface CookieConsent {
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  timestamp: number;
}

export interface AnalyticsData {
  sessions: number;
  pageViews: number;
  uniqueVisitors: number;
  bounceRate: number;
  avgSessionDuration: number;
  conversionRate: number;
  revenue: number;
  leads: number;
  topPages: Array<{
    path: string;
    views: number;
    avgTimeOnPage: number;
  }>;
  topSources: Array<{
    source: string;
    medium: string;
    visitors: number;
    conversions: number;
  }>;
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  locationBreakdown: Array<{
    city: string;
    visitors: number;
    conversions: number;
  }>;
}

export interface RealTimeAnalytics {
  activeUsers: number;
  pageViewsPerMinute: number;
  activePages: Array<{
    path: string;
    users: number;
  }>;
  traffic: Array<{
    timestamp: number;
    users: number;
    events: number;
  }>;
  recentEvents: Array<{
    timestamp: number;
    type: string;
    user: string;
    details: Record<string, any>;
  }>;
}

export interface CampaignPerformance {
  campaignId: string;
  name: string;
  source: string;
  medium: string;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  conversionRate: number;
  cost: number;
  revenue: number;
  roi: number;
  cpa: number;
}

export interface SEOMetrics {
  organicTraffic: number;
  organicConversions: number;
  topKeywords: Array<{
    keyword: string;
    impressions: number;
    clicks: number;
    position: number;
    ctr: number;
  }>;
  topLandingPages: Array<{
    path: string;
    impressions: number;
    clicks: number;
    position: number;
  }>;
  coreWebVitals: {
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
  };
}