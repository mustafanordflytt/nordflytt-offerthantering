import { useCallback, useEffect, useRef } from 'react';
import { analytics } from '@/components/analytics/GoogleAnalytics';
import { fbPixel } from '@/components/analytics/FacebookPixel';
import { gtmDataLayer } from '@/components/analytics/GoogleTagManager';
import { cookieConsent } from '@/components/analytics/CookieConsent';
import { trackingHelpers } from '@/components/analytics/AnalyticsProvider';

// Custom hook for analytics tracking
export function useAnalytics() {
  // Check consent before tracking
  const canTrackAnalytics = cookieConsent.hasConsent('analytics');
  const canTrackMarketing = cookieConsent.hasConsent('marketing');

  // Track page view on mount
  useEffect(() => {
    if (canTrackAnalytics) {
      // Page view is automatically tracked by providers
      // This is for custom page view tracking if needed
    }
  }, [canTrackAnalytics]);

  // Quote tracking
  const trackQuoteGenerated = useCallback((quoteData: {
    quoteId: string;
    value: number;
    livingArea: number;
    distance: number;
    mlConfidence?: number;
    predictionMethod: 'ml' | 'enhanced' | 'hybrid';
    source: string;
  }) => {
    if (!canTrackAnalytics) return;
    
    trackingHelpers.trackQuoteGeneration(quoteData);
  }, [canTrackAnalytics]);

  // Booking tracking
  const trackBookingConfirmed = useCallback((bookingData: {
    bookingId: string;
    revenue: number;
    serviceType: string;
    mlUsed: boolean;
    predictionAccuracy?: number;
    customerType: string;
  }) => {
    if (!canTrackAnalytics) return;
    
    trackingHelpers.trackBookingConfirmation(bookingData);
  }, [canTrackAnalytics]);

  // ML prediction tracking
  const trackMLPrediction = useCallback((mlData: {
    confidence: number;
    baselineHours: number;
    mlHours: number;
    finalHours: number;
    method: string;
    timeSaved?: number;
  }) => {
    if (!canTrackAnalytics) return;
    
    trackingHelpers.trackMLPrediction(mlData);
  }, [canTrackAnalytics]);

  // Form interaction tracking
  const trackFormInteraction = useCallback((
    formName: string,
    action: 'start' | 'complete' | 'abandon' | 'field_interaction',
    metadata?: Record<string, any>
  ) => {
    if (!canTrackAnalytics) return;
    
    analytics.trackFormInteraction(formName, action, metadata?.field);
    
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'form_interaction',
        form_name: formName,
        form_action: action,
        ...metadata
      });
    }
  }, [canTrackAnalytics]);

  // Custom event tracking
  const trackEvent = useCallback((
    eventName: string,
    parameters?: Record<string, any>
  ) => {
    if (!canTrackAnalytics) return;
    
    analytics.trackEvent(eventName, parameters);
    
    if (canTrackMarketing && window.fbq) {
      fbPixel.trackCustomEvent(eventName, parameters);
    }
    
    gtmDataLayer.trackEvent(eventName, parameters);
  }, [canTrackAnalytics, canTrackMarketing]);

  // AI feature usage tracking
  const trackAIFeature = useCallback((
    featureName: string,
    success: boolean,
    metadata?: {
      responseTime?: number;
      userSatisfaction?: number;
      errorType?: string;
    }
  ) => {
    if (!canTrackAnalytics) return;
    
    analytics.trackAIUsage(featureName, success, metadata?.responseTime);
    
    gtmDataLayer.trackAIFeature({
      featureName,
      success,
      ...metadata
    });
  }, [canTrackAnalytics]);

  // Timing tracking
  const trackTiming = useCallback((
    category: string,
    variable: string,
    value: number,
    label?: string
  ) => {
    if (!canTrackAnalytics) return;
    
    analytics.trackTiming(category, variable, value, label);
  }, [canTrackAnalytics]);

  return {
    // Consent status
    canTrackAnalytics,
    canTrackMarketing,
    
    // Tracking functions
    trackQuoteGenerated,
    trackBookingConfirmed,
    trackMLPrediction,
    trackFormInteraction,
    trackEvent,
    trackAIFeature,
    trackTiming
  };
}

// Hook for tracking form progress
export function useFormTracking(formName: string) {
  const { trackFormInteraction, trackTiming } = useAnalytics();
  const startTimeRef = useRef<number>();
  const fieldInteractionsRef = useRef<Set<string>>(new Set());

  // Track form start
  const trackFormStart = useCallback(() => {
    startTimeRef.current = Date.now();
    trackFormInteraction(formName, 'start');
  }, [formName, trackFormInteraction]);

  // Track field interaction
  const trackFieldInteraction = useCallback((fieldName: string) => {
    fieldInteractionsRef.current.add(fieldName);
    trackFormInteraction(formName, 'field_interaction', { field: fieldName });
  }, [formName, trackFormInteraction]);

  // Track form completion
  const trackFormComplete = useCallback((metadata?: Record<string, any>) => {
    const timeSpent = startTimeRef.current 
      ? Math.round((Date.now() - startTimeRef.current) / 1000)
      : 0;
    
    trackFormInteraction(formName, 'complete', {
      ...metadata,
      time_spent: timeSpent,
      fields_interacted: Array.from(fieldInteractionsRef.current)
    });
    
    if (timeSpent > 0) {
      trackTiming('Form', formName, timeSpent, 'completion');
    }
  }, [formName, trackFormInteraction, trackTiming]);

  // Track form abandonment
  const trackFormAbandon = useCallback(() => {
    const timeSpent = startTimeRef.current 
      ? Math.round((Date.now() - startTimeRef.current) / 1000)
      : 0;
    
    trackFormInteraction(formName, 'abandon', {
      time_spent: timeSpent,
      fields_interacted: Array.from(fieldInteractionsRef.current)
    });
  }, [formName, trackFormInteraction]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // If form hasn't been completed, track as abandoned
      if (startTimeRef.current && fieldInteractionsRef.current.size > 0) {
        // Don't track if they just loaded and left immediately
        const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
        if (timeSpent > 5) {
          trackFormAbandon();
        }
      }
    };
  }, [trackFormAbandon]);

  return {
    trackFormStart,
    trackFieldInteraction,
    trackFormComplete,
    trackFormAbandon
  };
}

// Hook for tracking performance metrics
export function usePerformanceTracking() {
  const { trackTiming } = useAnalytics();
  
  // Track page load performance
  useEffect(() => {
    if (typeof window !== 'undefined' && window.performance) {
      const perfData = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (perfData) {
        // Track various performance metrics
        trackTiming('Performance', 'page_load', Math.round(perfData.loadEventEnd - perfData.loadEventStart));
        trackTiming('Performance', 'dom_content_loaded', Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart));
        trackTiming('Performance', 'first_paint', Math.round(perfData.responseEnd - perfData.requestStart));
      }
    }
  }, [trackTiming]);
  
  // Track API call performance
  const trackAPICall = useCallback((
    endpoint: string,
    startTime: number,
    success: boolean
  ) => {
    const duration = Date.now() - startTime;
    trackTiming('API', endpoint, duration, success ? 'success' : 'error');
  }, [trackTiming]);
  
  return {
    trackAPICall
  };
}