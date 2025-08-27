'use client';

import { GoogleAnalytics } from './GoogleAnalytics';
import { FacebookPixel } from './FacebookPixel';
import { GoogleTagManager, GoogleTagManagerNoScript } from './GoogleTagManager';
import { CookieConsent } from './CookieConsent';
import { useEffect } from 'react';

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

// Get analytics IDs from environment variables
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  useEffect(() => {
    // Initialize consent mode (before loading any tracking scripts)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'default', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        functionality_storage: 'denied',
        personalization_storage: 'denied',
        wait_for_update: 500
      });

      // Set up Nordflytt-specific parameters
      window.gtag('set', {
        'custom_map.dimension1': 'ml_enabled',
        'custom_map.dimension2': 'algorithm_version',
        'custom_map.dimension3': 'booking_type',
        'custom_map.dimension4': 'customer_segment',
        'custom_map.dimension5': 'prediction_method'
      });
    }
  }, []);

  return (
    <>
      {/* Cookie Consent - Must be first */}
      <CookieConsent />
      
      {/* Google Tag Manager */}
      {GTM_ID && <GoogleTagManager gtmId={GTM_ID} />}
      
      {/* Google Analytics 4 */}
      {GA_MEASUREMENT_ID && <GoogleAnalytics measurementId={GA_MEASUREMENT_ID} />}
      
      {/* Facebook Pixel */}
      {FB_PIXEL_ID && <FacebookPixel pixelId={FB_PIXEL_ID} />}
      
      {children}
    </>
  );
}

export function AnalyticsNoScript() {
  return (
    <>
      {GTM_ID && <GoogleTagManagerNoScript gtmId={GTM_ID} />}
    </>
  );
}

// Centralized tracking functions that use all analytics platforms
export const trackingHelpers = {
  // Track page view (handled automatically by providers)
  trackPageView: (pagePath: string, pageTitle?: string) => {
    // GA4 and FB Pixel handle this automatically via their providers
    // This is for manual tracking if needed
    if (typeof window !== 'undefined') {
      // GTM custom page view
      window.dataLayer?.push({
        event: 'page_view',
        page_path: pagePath,
        page_title: pageTitle
      });
    }
  },

  // Track ML-enhanced quote generation
  trackQuoteGeneration: (data: {
    quoteId: string;
    value: number;
    livingArea: number;
    distance: number;
    mlConfidence?: number;
    predictionMethod: 'ml' | 'enhanced' | 'hybrid';
    source: string;
  }) => {
    // Google Analytics
    if (window.gtag) {
      window.gtag('event', 'generate_lead', {
        currency: 'SEK',
        value: data.value,
        ml_enhanced: data.predictionMethod !== 'enhanced',
        ml_confidence: data.mlConfidence,
        custom_parameters: data
      });
    }

    // Facebook Pixel
    if (window.fbq) {
      window.fbq('track', 'Lead', {
        value: data.value,
        currency: 'SEK',
        content_name: 'Moving Quote',
        content_category: data.predictionMethod,
        ml_confidence: data.mlConfidence
      });
    }

    // GTM Data Layer
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'quote_generated',
        quote_data: data,
        ecommerce: {
          currency: 'SEK',
          value: data.value,
          items: [{
            item_id: data.quoteId,
            item_name: 'Moving Quote',
            price: data.value,
            item_category: 'quotes',
            item_variant: data.predictionMethod
          }]
        }
      });
    }
  },

  // Track booking confirmation
  trackBookingConfirmation: (data: {
    bookingId: string;
    revenue: number;
    serviceType: string;
    mlUsed: boolean;
    predictionAccuracy?: number;
    customerType: string;
  }) => {
    // Google Analytics - Enhanced Ecommerce
    if (window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: data.bookingId,
        value: data.revenue,
        currency: 'SEK',
        items: [{
          item_id: data.serviceType,
          item_name: `Moving Service - ${data.serviceType}`,
          price: data.revenue,
          quantity: 1,
          item_category: 'moving_services'
        }],
        ml_prediction_used: data.mlUsed,
        prediction_accuracy: data.predictionAccuracy
      });
    }

    // Facebook Pixel - Purchase
    if (window.fbq) {
      window.fbq('track', 'Purchase', {
        value: data.revenue,
        currency: 'SEK',
        content_ids: [data.bookingId],
        content_type: 'product',
        ml_enhanced: data.mlUsed
      });
    }

    // GTM Data Layer
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'booking_confirmed',
        booking_data: data,
        ecommerce: {
          purchase: {
            transaction_id: data.bookingId,
            value: data.revenue,
            currency: 'SEK',
            items: [{
              item_id: data.serviceType,
              item_name: `Moving Service - ${data.serviceType}`,
              price: data.revenue,
              quantity: 1
            }]
          }
        }
      });
    }
  },

  // Track ML prediction usage
  trackMLPrediction: (data: {
    confidence: number;
    baselineHours: number;
    mlHours: number;
    finalHours: number;
    method: string;
    timeSaved?: number;
  }) => {
    // Track across all platforms
    if (window.gtag) {
      window.gtag('event', 'ml_prediction_used', {
        event_category: 'AI_System',
        event_label: data.method,
        value: Math.round(data.confidence * 100),
        ml_time_saved_hours: data.timeSaved
      });
    }

    if (window.fbq) {
      window.fbq('trackCustom', 'MLPredictionGenerated', {
        confidence: data.confidence,
        method: data.method,
        time_saved: data.timeSaved
      });
    }

    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'ml_prediction',
        ml_data: data
      });
    }
  },

  // Track form abandonment
  trackFormAbandonment: (data: {
    formName: string;
    step: number;
    fieldsCompleted: number;
    totalFields: number;
    timeSpent: number;
  }) => {
    // Universal tracking
    const eventData = {
      event: 'form_abandonment',
      form_name: data.formName,
      abandonment_step: data.step,
      completion_percentage: Math.round((data.fieldsCompleted / data.totalFields) * 100),
      time_spent_seconds: data.timeSpent
    };

    if (window.gtag) {
      window.gtag('event', 'form_abandonment', eventData);
    }

    if (window.fbq) {
      window.fbq('trackCustom', 'FormAbandonment', eventData);
    }

    if (window.dataLayer) {
      window.dataLayer.push(eventData);
    }
  }
};