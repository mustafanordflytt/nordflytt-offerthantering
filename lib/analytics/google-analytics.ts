// Google Analytics 4 implementation

import { analyticsConfig, ANALYTICS_EVENTS, CUSTOM_DIMENSIONS, CUSTOM_METRICS } from './config';
import type { TrackingEvent, ConversionEvent, PageViewEvent, UserProperties, MLEvent } from './types';

declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string,
      config?: Record<string, any>
    ) => void;
    dataLayer: Array<any>;
  }
}

// Initialize Google Analytics
export const initGA = () => {
  if (!analyticsConfig.ga4.enabled) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', analyticsConfig.ga4.measurementId, {
    send_page_view: false, // We'll handle page views manually for better control
  });
};

// Track page views
export const trackPageView = (event: PageViewEvent) => {
  if (!analyticsConfig.ga4.enabled || typeof window === 'undefined') return;

  window.gtag('event', ANALYTICS_EVENTS.PAGE_VIEW, {
    page_path: event.path,
    page_title: event.title,
    page_referrer: event.referrer,
    page_search: event.search,
  });
};

// Track custom events
export const trackEvent = (event: TrackingEvent) => {
  if (!analyticsConfig.ga4.enabled || typeof window === 'undefined') return;

  window.gtag('event', event.name, {
    event_category: event.category,
    event_action: event.action,
    event_label: event.label,
    value: event.value,
    ...event.parameters,
  });
};

// Track conversions
export const trackConversion = (conversion: ConversionEvent) => {
  if (!analyticsConfig.ga4.enabled || typeof window === 'undefined') return;

  const eventName = conversion.type === 'booking' 
    ? ANALYTICS_EVENTS.BOOKING_COMPLETED
    : conversion.type === 'quote'
    ? ANALYTICS_EVENTS.QUOTE_REQUESTED
    : conversion.type === 'lead'
    ? ANALYTICS_EVENTS.LEAD_GENERATED
    : ANALYTICS_EVENTS.SIGNUP;

  window.gtag('event', eventName, {
    currency: conversion.currency,
    value: conversion.value,
    transaction_id: conversion.transactionId,
    items: conversion.items,
  });
};

// Set user properties
export const setUserProperties = (properties: UserProperties) => {
  if (!analyticsConfig.ga4.enabled || typeof window === 'undefined') return;

  const mappedProperties: Record<string, any> = {};

  if (properties.userId) {
    window.gtag('config', analyticsConfig.ga4.measurementId, {
      user_id: properties.userId,
    });
  }

  if (properties.customerType) {
    mappedProperties[CUSTOM_DIMENSIONS.customer_type] = properties.customerType;
  }
  if (properties.location) {
    mappedProperties[CUSTOM_DIMENSIONS.stockholm_area] = properties.location;
  }
  if (properties.serviceType) {
    mappedProperties[CUSTOM_DIMENSIONS.service_type] = properties.serviceType;
  }
  if (properties.leadSource) {
    mappedProperties[CUSTOM_DIMENSIONS.lead_source] = properties.leadSource;
  }
  if (properties.campaignId) {
    mappedProperties[CUSTOM_DIMENSIONS.campaign_name] = properties.campaignId;
  }

  window.gtag('set', 'user_properties', mappedProperties);
};

// Track ML/AI events
export const trackMLEvent = (event: MLEvent) => {
  if (!analyticsConfig.ga4.enabled || typeof window === 'undefined') return;

  const eventName = event.action === 'prediction'
    ? ANALYTICS_EVENTS.ML_PREDICTION
    : event.action === 'optimization'
    ? ANALYTICS_EVENTS.ML_OPTIMIZATION
    : ANALYTICS_EVENTS.AI_RECOMMENDATION;

  window.gtag('event', eventName, {
    algorithm: event.algorithm,
    [CUSTOM_METRICS.ai_confidence]: event.accuracy,
    processing_time: event.processingTime,
    input_data: JSON.stringify(event.inputData || {}),
    output_data: JSON.stringify(event.outputData || {}),
  });
};

// Track form interactions
export const trackFormStart = (formName: string) => {
  trackEvent({
    name: ANALYTICS_EVENTS.FORM_START,
    category: 'Form',
    action: 'Start',
    label: formName,
  });
};

export const trackFormSubmit = (formName: string, formData?: Record<string, any>) => {
  trackEvent({
    name: ANALYTICS_EVENTS.FORM_SUBMIT,
    category: 'Form',
    action: 'Submit',
    label: formName,
    parameters: formData,
  });
};

// Track service selection
export const trackServiceSelection = (serviceType: string, price?: number) => {
  window.gtag('event', ANALYTICS_EVENTS.SERVICE_SELECTED, {
    content_type: 'service',
    content_id: serviceType,
    value: price,
    currency: 'SEK',
  });
};

// Track errors
export const trackError = (description: string, fatal: boolean = false) => {
  window.gtag('event', ANALYTICS_EVENTS.ERROR, {
    description,
    fatal,
  });
};

// Track scroll depth
export const trackScrollDepth = (percentage: number) => {
  trackEvent({
    name: ANALYTICS_EVENTS.SCROLL,
    category: 'Engagement',
    action: 'Scroll',
    label: `${percentage}%`,
    value: percentage,
  });
};

// Track campaign interactions
export const trackCampaignClick = (campaignName: string, source: string, medium: string) => {
  trackEvent({
    name: ANALYTICS_EVENTS.CAMPAIGN_CLICK,
    category: 'Campaign',
    action: 'Click',
    label: campaignName,
    parameters: {
      campaign_source: source,
      campaign_medium: medium,
      campaign_name: campaignName,
    },
  });
};

// Enhanced e-commerce tracking
export const trackEcommerceEvent = (eventType: string, data: any) => {
  if (!analyticsConfig.ga4.enabled || typeof window === 'undefined') return;

  window.gtag('event', eventType, {
    currency: 'SEK',
    ...data,
  });
};

// Track route optimization
export const trackRouteOptimization = (data: {
  routeId: string;
  efficiency: number;
  distanceSaved: number;
  timeSaved: number;
}) => {
  window.gtag('event', ANALYTICS_EVENTS.ROUTE_OPTIMIZATION, {
    route_id: data.routeId,
    [CUSTOM_METRICS.route_efficiency]: data.efficiency,
    distance_saved: data.distanceSaved,
    time_saved: data.timeSaved,
  });
};

// Track price calculation
export const trackPriceCalculation = (data: {
  serviceType: string;
  basePrice: number;
  finalPrice: number;
  discounts: number;
  aiAdjustment: number;
}) => {
  window.gtag('event', ANALYTICS_EVENTS.PRICE_CALCULATION, {
    service_type: data.serviceType,
    base_price: data.basePrice,
    final_price: data.finalPrice,
    discounts: data.discounts,
    ai_adjustment: data.aiAdjustment,
    [CUSTOM_METRICS.quote_value]: data.finalPrice,
  });
};