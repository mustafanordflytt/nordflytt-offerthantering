// Analytics configuration

import { AnalyticsConfig } from './types';

export const analyticsConfig: AnalyticsConfig = {
  ga4: {
    measurementId: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || '',
    enabled: !!process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID,
  },
  gtm: {
    containerId: process.env.NEXT_PUBLIC_GTM_CONTAINER_ID || '',
    enabled: !!process.env.NEXT_PUBLIC_GTM_CONTAINER_ID,
  },
  facebook: {
    pixelId: process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || '',
    enabled: !!process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID,
  },
  cookieConsent: {
    enabled: true,
    cookieName: 'nordflytt-cookie-consent',
    cookieExpiry: 365, // 1 year
  },
};

// Analytics events configuration
export const ANALYTICS_EVENTS = {
  // Page views
  PAGE_VIEW: 'page_view',
  
  // User engagement
  SCROLL: 'scroll',
  CLICK: 'click',
  FORM_START: 'form_start',
  FORM_SUBMIT: 'form_submit',
  
  // Conversions
  LEAD_GENERATED: 'generate_lead',
  QUOTE_REQUESTED: 'quote_request',
  BOOKING_COMPLETED: 'purchase',
  SIGNUP: 'sign_up',
  
  // Service specific
  SERVICE_SELECTED: 'select_item',
  ADD_TO_CART: 'add_to_cart',
  BEGIN_CHECKOUT: 'begin_checkout',
  
  // ML/AI events
  ML_PREDICTION: 'ml_prediction',
  ML_OPTIMIZATION: 'ml_optimization',
  AI_RECOMMENDATION: 'ai_recommendation',
  ROUTE_OPTIMIZATION: 'route_optimization',
  PRICE_CALCULATION: 'price_calculation',
  
  // Marketing specific
  CAMPAIGN_CLICK: 'campaign_click',
  AD_IMPRESSION: 'ad_impression',
  EMAIL_OPENED: 'email_opened',
  SMS_CLICKED: 'sms_clicked',
  
  // SEO specific
  ORGANIC_SEARCH: 'organic_search',
  LOCAL_SEARCH: 'local_search',
  
  // Errors
  ERROR: 'exception',
} as const;

// Default user properties
export const DEFAULT_USER_PROPERTIES = {
  platform: 'web',
  brand: 'nordflytt',
  market: 'stockholm',
  language: 'sv',
};

// Conversion value configuration (in SEK)
export const CONVERSION_VALUES = {
  lead: 500,
  quote: 1000,
  booking: {
    moving: 15000,
    cleaning: 5000,
    storage: 3000,
    packing: 2000,
  },
  signup: 250,
};

// Custom dimensions for GA4
export const CUSTOM_DIMENSIONS = {
  customer_type: 'dimension1',
  service_type: 'dimension2',
  lead_source: 'dimension3',
  campaign_name: 'dimension4',
  stockholm_area: 'dimension5',
  property_type: 'dimension6',
  moving_distance: 'dimension7',
  ai_score: 'dimension8',
  booking_id: 'dimension9',
  staff_id: 'dimension10',
};

// Custom metrics for GA4
export const CUSTOM_METRICS = {
  quote_value: 'metric1',
  booking_value: 'metric2',
  ai_confidence: 'metric3',
  route_efficiency: 'metric4',
  customer_satisfaction: 'metric5',
};

// Facebook Pixel standard events mapping
export const FB_STANDARD_EVENTS = {
  [ANALYTICS_EVENTS.PAGE_VIEW]: 'PageView',
  [ANALYTICS_EVENTS.LEAD_GENERATED]: 'Lead',
  [ANALYTICS_EVENTS.QUOTE_REQUESTED]: 'InitiateCheckout',
  [ANALYTICS_EVENTS.BOOKING_COMPLETED]: 'Purchase',
  [ANALYTICS_EVENTS.SIGNUP]: 'CompleteRegistration',
  [ANALYTICS_EVENTS.SERVICE_SELECTED]: 'ViewContent',
  [ANALYTICS_EVENTS.ADD_TO_CART]: 'AddToCart',
  [ANALYTICS_EVENTS.BEGIN_CHECKOUT]: 'InitiateCheckout',
} as const;

// GTM data layer event names
export const GTM_EVENTS = {
  ...ANALYTICS_EVENTS,
  COOKIE_CONSENT_GIVEN: 'cookie_consent_given',
  COOKIE_CONSENT_UPDATED: 'cookie_consent_updated',
} as const;