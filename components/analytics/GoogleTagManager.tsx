'use client';

import Script from 'next/script';

interface GoogleTagManagerProps {
  gtmId: string;
}

export function GoogleTagManager({ gtmId }: GoogleTagManagerProps) {
  return (
    <>
      {/* Google Tag Manager Script */}
      <Script id="google-tag-manager" strategy="afterInteractive">
        {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${gtmId}');
        `}
      </Script>
    </>
  );
}

export function GoogleTagManagerNoScript({ gtmId }: GoogleTagManagerProps) {
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  );
}

// GTM Data Layer helper functions
export const gtmDataLayer = {
  // Push event to data layer
  push: (data: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push(data);
    }
  },

  // Track custom event
  trackEvent: (eventName: string, eventData?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: eventName,
        ...eventData
      });
    }
  },

  // Track ML enhanced quote
  trackMLQuote: (quoteData: {
    quoteId: string;
    value: number;
    mlConfidence: number;
    enhancedAlgorithmUsed: boolean;
    predictionMethod: string;
    livingArea: number;
    distance: number;
  }) => {
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: 'ml_quote_generated',
        ecommerce: {
          currency: 'SEK',
          value: quoteData.value,
          items: [{
            item_id: quoteData.quoteId,
            item_name: 'Moving Quote - ML Enhanced',
            price: quoteData.value,
            item_category: 'quotes',
            item_variant: quoteData.predictionMethod,
            quantity: 1
          }]
        },
        ml_confidence: quoteData.mlConfidence,
        enhanced_algorithm: quoteData.enhancedAlgorithmUsed,
        prediction_method: quoteData.predictionMethod,
        quote_details: {
          living_area: quoteData.livingArea,
          distance_km: quoteData.distance
        }
      });
    }
  },

  // Track booking conversion
  trackBookingConversion: (bookingData: {
    bookingId: string;
    revenue: number;
    serviceType: string;
    mlPredictionUsed: boolean;
    predictionAccuracy?: number;
    customerType: string;
    movingDate: string;
  }) => {
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: 'booking_confirmed',
        ecommerce: {
          transaction_id: bookingData.bookingId,
          value: bookingData.revenue,
          currency: 'SEK',
          items: [{
            item_id: bookingData.serviceType,
            item_name: `Moving Service - ${bookingData.serviceType}`,
            price: bookingData.revenue,
            quantity: 1,
            item_category: 'moving_services',
            item_variant: bookingData.mlPredictionUsed ? 'ml_enhanced' : 'standard'
          }]
        },
        booking_details: {
          ml_prediction_used: bookingData.mlPredictionUsed,
          prediction_accuracy: bookingData.predictionAccuracy,
          customer_type: bookingData.customerType,
          moving_date: bookingData.movingDate
        }
      });
    }
  },

  // Track form interactions
  trackFormStep: (formData: {
    formName: string;
    step: number;
    stepName: string;
    fieldsCompleted?: string[];
    mlSuggestionsShown?: boolean;
  }) => {
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: 'form_step_completed',
        form_name: formData.formName,
        form_step: formData.step,
        step_name: formData.stepName,
        fields_completed: formData.fieldsCompleted,
        ml_suggestions_shown: formData.mlSuggestionsShown
      });
    }
  },

  // Track AI feature usage
  trackAIFeature: (featureData: {
    featureName: string;
    success: boolean;
    responseTimeMs?: number;
    userSatisfaction?: number;
    errorType?: string;
  }) => {
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: 'ai_feature_interaction',
        ai_feature: featureData.featureName,
        interaction_success: featureData.success,
        response_time_ms: featureData.responseTimeMs,
        user_satisfaction: featureData.userSatisfaction,
        error_type: featureData.errorType
      });
    }
  },

  // Set user properties
  setUserProperties: (properties: {
    userId?: string;
    customerType?: string;
    totalBookings?: number;
    preferredService?: string;
    mlOptIn?: boolean;
  }) => {
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        user_id: properties.userId,
        user_properties: {
          customer_type: properties.customerType,
          total_bookings: properties.totalBookings,
          preferred_service: properties.preferredService,
          ml_opt_in: properties.mlOptIn
        }
      });
    }
  },

  // Track page timing
  trackPageTiming: (timingData: {
    pageName: string;
    loadTime: number;
    mlPredictionTime?: number;
    apiResponseTime?: number;
  }) => {
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: 'page_timing',
        page_name: timingData.pageName,
        timing: {
          page_load_time: timingData.loadTime,
          ml_prediction_time: timingData.mlPredictionTime,
          api_response_time: timingData.apiResponseTime
        }
      });
    }
  },

  // Track enhanced ecommerce events
  trackEcommerce: (eventType: string, data: any) => {
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({ ecommerce: null }); // Clear previous ecommerce data
      window.dataLayer.push({
        event: eventType,
        ecommerce: data
      });
    }
  }
};