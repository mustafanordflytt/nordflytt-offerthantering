// Facebook Pixel implementation

import { analyticsConfig, FB_STANDARD_EVENTS, CONVERSION_VALUES } from './config';
import type { ConversionEvent, TrackingEvent, UserProperties } from './types';

declare global {
  interface Window {
    fbq: (
      track: string,
      event?: string,
      parameters?: Record<string, any>
    ) => void;
    _fbq: any;
  }
}

// Initialize Facebook Pixel
export const initFacebookPixel = () => {
  if (!analyticsConfig.facebook.enabled) return;

  // Facebook Pixel base code
  (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function() {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  // Initialize pixel
  window.fbq('init', analyticsConfig.facebook.pixelId);
  window.fbq('track', 'PageView');
};

// Track standard Facebook events
export const trackFBEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (!analyticsConfig.facebook.enabled || typeof window === 'undefined' || !window.fbq) return;

  try {
    window.fbq('track', eventName, parameters);
  } catch (error) {
    console.error('Facebook Pixel tracking error:', error);
  }
};

// Track custom Facebook events
export const trackFBCustomEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (!analyticsConfig.facebook.enabled || typeof window === 'undefined' || !window.fbq) return;

  try {
    window.fbq('trackCustom', eventName, parameters);
  } catch (error) {
    console.error('Facebook Pixel custom tracking error:', error);
  }
};

// Track page view
export const trackFBPageView = () => {
  trackFBEvent('PageView');
};

// Track conversions
export const trackFBConversion = (conversion: ConversionEvent) => {
  if (!analyticsConfig.facebook.enabled || typeof window === 'undefined' || !window.fbq) return;

  const eventName = conversion.type === 'booking' 
    ? 'Purchase'
    : conversion.type === 'quote'
    ? 'InitiateCheckout'
    : conversion.type === 'lead'
    ? 'Lead'
    : 'CompleteRegistration';

  const parameters: Record<string, any> = {
    currency: conversion.currency,
    value: conversion.value,
  };

  if (conversion.transactionId) {
    parameters.content_ids = [conversion.transactionId];
  }

  if (conversion.items && conversion.items.length > 0) {
    parameters.contents = conversion.items.map(item => ({
      id: item.id,
      quantity: item.quantity,
      item_price: item.price,
    }));
    parameters.content_type = 'product';
    parameters.num_items = conversion.items.length;
  }

  trackFBEvent(eventName, parameters);
};

// Track leads
export const trackFBLead = (leadData: {
  value?: number;
  currency?: string;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
}) => {
  trackFBEvent('Lead', {
    value: leadData.value || CONVERSION_VALUES.lead,
    currency: leadData.currency || 'SEK',
    ...leadData,
  });
};

// Track view content
export const trackFBViewContent = (contentData: {
  content_name: string;
  content_category: string;
  content_ids?: string[];
  content_type?: string;
  value?: number;
  currency?: string;
}) => {
  trackFBEvent('ViewContent', {
    ...contentData,
    currency: contentData.currency || 'SEK',
  });
};

// Track add to cart
export const trackFBAddToCart = (itemData: {
  content_ids: string[];
  content_name: string;
  content_type: string;
  value: number;
  currency?: string;
}) => {
  trackFBEvent('AddToCart', {
    ...itemData,
    currency: itemData.currency || 'SEK',
  });
};

// Track initiate checkout
export const trackFBInitiateCheckout = (checkoutData: {
  value: number;
  currency?: string;
  content_ids?: string[];
  contents?: Array<{ id: string; quantity: number }>;
  num_items?: number;
}) => {
  trackFBEvent('InitiateCheckout', {
    ...checkoutData,
    currency: checkoutData.currency || 'SEK',
  });
};

// Track purchase
export const trackFBPurchase = (purchaseData: {
  value: number;
  currency?: string;
  content_ids?: string[];
  contents?: Array<{ id: string; quantity: number; item_price: number }>;
  content_type?: string;
  num_items?: number;
  transaction_id?: string;
}) => {
  trackFBEvent('Purchase', {
    ...purchaseData,
    currency: purchaseData.currency || 'SEK',
  });
};

// Track search
export const trackFBSearch = (searchData: {
  search_string: string;
  content_category?: string;
  content_ids?: string[];
  value?: number;
  currency?: string;
}) => {
  trackFBEvent('Search', {
    ...searchData,
    currency: searchData.currency || 'SEK',
  });
};

// Track complete registration
export const trackFBCompleteRegistration = (registrationData?: {
  value?: number;
  currency?: string;
  content_name?: string;
  status?: boolean;
}) => {
  trackFBEvent('CompleteRegistration', {
    value: registrationData?.value || CONVERSION_VALUES.signup,
    currency: registrationData?.currency || 'SEK',
    ...registrationData,
  });
};

// Track custom Stockholm moving events
export const trackFBStockholmMoving = (movingData: {
  area: string;
  service_type: string;
  property_type?: string;
  estimated_value: number;
  moving_date?: string;
  distance?: number;
}) => {
  trackFBCustomEvent('StockholmMoving', {
    ...movingData,
    currency: 'SEK',
  });
};

// Track quote request
export const trackFBQuoteRequest = (quoteData: {
  service_type: string;
  estimated_value: number;
  location: string;
  urgency?: 'normal' | 'urgent' | 'flexible';
}) => {
  trackFBCustomEvent('QuoteRequest', {
    ...quoteData,
    currency: 'SEK',
  });
};

// Track marketing campaign interaction
export const trackFBCampaignInteraction = (campaignData: {
  campaign_name: string;
  campaign_type: string;
  interaction_type: string;
  value?: number;
}) => {
  trackFBCustomEvent('CampaignInteraction', {
    ...campaignData,
    currency: 'SEK',
  });
};

// Set user properties for advanced matching
export const setFBUserProperties = (userProperties: {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  externalId?: string;
}) => {
  if (!analyticsConfig.facebook.enabled || typeof window === 'undefined' || !window.fbq) return;

  // Hash sensitive data as required by Facebook
  const advancedMatching: Record<string, any> = {};
  
  if (userProperties.email) advancedMatching.em = userProperties.email.toLowerCase();
  if (userProperties.phone) advancedMatching.ph = userProperties.phone.replace(/\D/g, '');
  if (userProperties.firstName) advancedMatching.fn = userProperties.firstName.toLowerCase();
  if (userProperties.lastName) advancedMatching.ln = userProperties.lastName.toLowerCase();
  if (userProperties.city) advancedMatching.ct = userProperties.city.toLowerCase();
  if (userProperties.zipCode) advancedMatching.zp = userProperties.zipCode;
  if (userProperties.country) advancedMatching.country = userProperties.country.toLowerCase();
  if (userProperties.externalId) advancedMatching.external_id = userProperties.externalId;

  window.fbq('init', analyticsConfig.facebook.pixelId, advancedMatching);
};

// Track service-specific events
export const trackFBServiceEvent = (service: string, action: string, value?: number) => {
  const serviceEventMap: Record<string, string> = {
    moving: 'MovingService',
    cleaning: 'CleaningService',
    storage: 'StorageService',
    packing: 'PackingService',
  };

  trackFBCustomEvent(serviceEventMap[service] || 'ServiceInteraction', {
    action,
    service_type: service,
    value: value || 0,
    currency: 'SEK',
  });
};