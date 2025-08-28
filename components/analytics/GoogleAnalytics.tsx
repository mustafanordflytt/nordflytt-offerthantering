'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

interface GoogleAnalyticsProps {
  measurementId: string;
}

function GoogleAnalyticsInner({ measurementId }: GoogleAnalyticsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track page views
  useEffect(() => {
    if (pathname && window.gtag) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
      
      window.gtag('config', measurementId, {
        page_path: url,
        // Custom dimensions for Nordflytt
        custom_map: {
          dimension1: 'ml_enabled',
          dimension2: 'algorithm_version',
          dimension3: 'booking_type'
        }
      });
    }
  }, [pathname, searchParams, measurementId]);

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', '${measurementId}', {
            send_page_view: false,
            // Enhanced measurement
            enhanced_measurement: {
              scroll: true,
              outbound_clicks: true,
              site_search: true,
              video_engagement: true,
              file_downloads: true
            }
          });

          // Custom Nordflytt events
          gtag('event', 'nordflytt_loaded', {
            ml_system_status: 'active',
            enhanced_algorithm_version: 'v2.1',
            platform: 'web'
          });
        `}
      </Script>
    </>
  );
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  return (
    <Suspense fallback={null}>
      <GoogleAnalyticsInner measurementId={measurementId} />
    </Suspense>
  );
}

// Analytics helper functions
export const analytics = {
  // Track custom events
  trackEvent: (eventName: string, parameters?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, parameters);
    }
  },

  // Track conversions
  trackConversion: (conversionType: string, value?: number, transactionId?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'conversion', {
        send_to: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
        value: value || 0,
        currency: 'SEK',
        transaction_id: transactionId,
        conversion_type: conversionType
      });
    }
  },

  // Track ML predictions
  trackMLPrediction: (data: {
    predictionType: string;
    confidence: number;
    baseline: number;
    mlPrediction: number;
    finalEstimate: number;
    method: string;
  }) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'ml_prediction', {
        event_category: 'AI_System',
        event_label: data.predictionType,
        value: Math.round(data.confidence * 100),
        ml_confidence: data.confidence,
        baseline_hours: data.baseline,
        ml_hours: data.mlPrediction,
        final_hours: data.finalEstimate,
        prediction_method: data.method,
        algorithm_version: 'enhanced_v2.1'
      });
    }
  },

  // Track quote generation
  trackQuoteGenerated: (quoteData: {
    quoteId: string;
    estimatedValue: number;
    livingArea: number;
    distance: number;
    mlEnhanced: boolean;
    source: string;
  }) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'generate_lead', {
        currency: 'SEK',
        value: quoteData.estimatedValue,
        quote_id: quoteData.quoteId,
        living_area: quoteData.livingArea,
        distance_km: quoteData.distance,
        ml_enhanced: quoteData.mlEnhanced,
        lead_source: quoteData.source
      });

      // Also track as custom event for detailed analysis
      window.gtag('event', 'quote_generated', {
        event_category: 'Engagement',
        event_label: quoteData.mlEnhanced ? 'ML_Enhanced' : 'Standard',
        value: quoteData.estimatedValue,
        custom_parameters: quoteData
      });
    }
  },

  // Track booking confirmation
  trackBookingConfirmed: (bookingData: {
    bookingId: string;
    revenue: number;
    serviceType: string;
    mlUsed: boolean;
    customerType: string;
  }) => {
    if (typeof window !== 'undefined' && window.gtag) {
      // Enhanced ecommerce purchase event
      window.gtag('event', 'purchase', {
        transaction_id: bookingData.bookingId,
        value: bookingData.revenue,
        currency: 'SEK',
        items: [{
          item_id: bookingData.serviceType,
          item_name: `Moving Service - ${bookingData.serviceType}`,
          price: bookingData.revenue,
          quantity: 1,
          item_category: 'moving_services',
          item_variant: bookingData.mlUsed ? 'ml_enhanced' : 'standard'
        }],
        ml_prediction_used: bookingData.mlUsed,
        customer_type: bookingData.customerType
      });
    }
  },

  // Track form interactions
  trackFormInteraction: (formName: string, action: string, field?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'form_interaction', {
        event_category: 'Form',
        event_label: formName,
        event_action: action,
        form_field: field
      });
    }
  },

  // Track AI system usage
  trackAIUsage: (feature: string, success: boolean, responseTime?: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'ai_feature_used', {
        event_category: 'AI_System',
        event_label: feature,
        value: success ? 1 : 0,
        response_time_ms: responseTime,
        ai_feature: feature,
        success: success
      });
    }
  },

  // Track marketing campaign performance
  trackCampaignClick: (campaign: string, medium: string, source: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'campaign_click', {
        campaign_name: campaign,
        campaign_medium: medium,
        campaign_source: source,
        event_category: 'Marketing'
      });
    }
  },

  // Set user properties
  setUserProperties: (properties: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('set', 'user_properties', properties);
    }
  },

  // Track timing (e.g., page load, API response)
  trackTiming: (category: string, variable: string, value: number, label?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'timing_complete', {
        name: variable,
        value: value,
        event_category: category,
        event_label: label
      });
    }
  }
};