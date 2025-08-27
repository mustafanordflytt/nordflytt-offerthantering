// Main analytics implementation

import { initGA, trackPageView, trackEvent, trackConversion, setUserProperties, trackMLEvent, trackFormStart, trackFormSubmit, trackServiceSelection, trackError, trackScrollDepth, trackCampaignClick, trackRouteOptimization, trackPriceCalculation } from './google-analytics';
import { initGTM, trackGTMEvent, trackGTMPageView, trackGTMConversion, trackGTMEcommerce, setGTMUserProperties, trackGTMFormInteraction, trackGTMMLEvent, trackGTMStockholmEvent } from './google-tag-manager';
import { initFacebookPixel, trackFBEvent, trackFBConversion, trackFBLead, trackFBViewContent, trackFBAddToCart, trackFBInitiateCheckout, trackFBPurchase, trackFBCompleteRegistration, trackFBStockholmMoving, trackFBQuoteRequest, setFBUserProperties } from './facebook-pixel';
import { ANALYTICS_EVENTS, CONVERSION_VALUES } from './config';
import type { TrackingEvent, ConversionEvent, PageViewEvent, UserProperties, MLEvent } from './types';

// Initialize all analytics services
export const initAnalytics = () => {
  if (typeof window === 'undefined') return;

  // Initialize services
  initGA();
  initGTM();
  initFacebookPixel();
};

// Track page views across all platforms
export const trackPageViewAll = (path: string, title: string) => {
  const pageViewEvent: PageViewEvent = {
    path,
    title,
    referrer: document.referrer,
    search: window.location.search,
  };

  // Track in all platforms
  trackPageView(pageViewEvent);
  trackGTMPageView(path, title);
  trackFBEvent('PageView');
};

// Track events across all platforms
export const trackEventAll = (event: TrackingEvent) => {
  // Google Analytics
  trackEvent(event);
  
  // GTM
  trackGTMEvent(event.name, {
    category: event.category,
    action: event.action,
    label: event.label,
    value: event.value,
    ...event.parameters,
  });
  
  // Facebook (if applicable)
  if (event.name in ANALYTICS_EVENTS) {
    trackFBEvent(event.name, event.parameters);
  }
};

// Track conversions across all platforms
export const trackConversionAll = (conversion: ConversionEvent) => {
  // Google Analytics
  trackConversion(conversion);
  
  // GTM
  trackGTMConversion(conversion);
  
  // Facebook Pixel
  trackFBConversion(conversion);
};

// Set user properties across all platforms
export const setUserPropertiesAll = (properties: UserProperties) => {
  // Google Analytics
  setUserProperties(properties);
  
  // GTM
  setGTMUserProperties(properties);
  
  // Facebook (if email/phone provided)
  if (properties.userId) {
    setFBUserProperties({ externalId: properties.userId });
  }
};

// Track booking completion
export const trackBookingComplete = (bookingData: {
  bookingId: string;
  serviceType: string;
  totalValue: number;
  customerType: 'private' | 'business';
  location: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}) => {
  const conversion: ConversionEvent = {
    type: 'booking',
    value: bookingData.totalValue,
    currency: 'SEK',
    transactionId: bookingData.bookingId,
    items: bookingData.items,
  };

  // Track conversion
  trackConversionAll(conversion);

  // Track e-commerce data
  trackGTMEcommerce('purchase', {
    transaction_id: bookingData.bookingId,
    value: bookingData.totalValue,
    currency: 'SEK',
    items: bookingData.items,
  });

  // Track Facebook purchase
  trackFBPurchase({
    value: bookingData.totalValue,
    content_ids: [bookingData.bookingId],
    contents: bookingData.items.map(item => ({
      id: item.id,
      quantity: item.quantity,
      item_price: item.price,
    })),
    content_type: 'product',
    num_items: bookingData.items.length,
    transaction_id: bookingData.bookingId,
  });

  // Set user properties
  setUserPropertiesAll({
    customerType: bookingData.customerType,
    location: bookingData.location,
    serviceType: bookingData.serviceType,
  });
};

// Track quote request
export const trackQuoteRequest = (quoteData: {
  serviceType: string;
  estimatedValue: number;
  location: string;
  urgency?: 'normal' | 'urgent' | 'flexible';
  customerType?: 'private' | 'business';
}) => {
  const conversion: ConversionEvent = {
    type: 'quote',
    value: quoteData.estimatedValue,
    currency: 'SEK',
  };

  // Track conversion
  trackConversionAll(conversion);

  // Track initiate checkout
  trackFBInitiateCheckout({
    value: quoteData.estimatedValue,
    content_ids: [quoteData.serviceType],
    num_items: 1,
  });

  // Track custom quote event
  trackFBQuoteRequest({
    service_type: quoteData.serviceType,
    estimated_value: quoteData.estimatedValue,
    location: quoteData.location,
    urgency: quoteData.urgency || 'normal',
  });

  // Track GTM event
  trackGTMEvent('quote_request', {
    service_type: quoteData.serviceType,
    estimated_value: quoteData.estimatedValue,
    location: quoteData.location,
    urgency: quoteData.urgency,
    customer_type: quoteData.customerType,
  });
};

// Track lead generation
export const trackLeadGenerated = (leadData: {
  source: string;
  serviceInterest?: string;
  estimatedValue?: number;
  location?: string;
}) => {
  const conversion: ConversionEvent = {
    type: 'lead',
    value: leadData.estimatedValue || CONVERSION_VALUES.lead,
    currency: 'SEK',
  };

  // Track conversion
  trackConversionAll(conversion);

  // Track Facebook lead
  trackFBLead({
    value: leadData.estimatedValue || CONVERSION_VALUES.lead,
    content_name: leadData.serviceInterest || 'general',
    content_category: leadData.source,
  });

  // Track GTM event
  trackGTMEvent(ANALYTICS_EVENTS.LEAD_GENERATED, {
    lead_source: leadData.source,
    service_interest: leadData.serviceInterest,
    estimated_value: leadData.estimatedValue,
    location: leadData.location,
  });
};

// Track ML/AI events
export const trackMLEventAll = (event: MLEvent) => {
  // Google Analytics
  trackMLEvent(event);
  
  // GTM
  trackGTMMLEvent(event.algorithm, {
    action: event.action,
    accuracy: event.accuracy,
    processing_time: event.processingTime,
    input_data: event.inputData,
    output_data: event.outputData,
  });
  
  // Custom event
  trackEventAll({
    name: ANALYTICS_EVENTS.ML_PREDICTION,
    category: 'ML',
    action: event.action,
    label: event.algorithm,
    value: event.accuracy ? Math.round(event.accuracy * 100) : undefined,
    parameters: {
      processing_time: event.processingTime,
    },
  });
};

// Track Stockholm-specific events
export const trackStockholmEvent = (data: {
  eventType: string;
  area: string;
  serviceType: string;
  propertyType?: string;
  distance?: number;
  floors?: number;
  estimatedValue?: number;
}) => {
  // GTM
  trackGTMStockholmEvent(data.eventType, {
    area: data.area,
    serviceType: data.serviceType,
    propertyType: data.propertyType,
    distance: data.distance,
    floors: data.floors,
  });

  // Facebook
  if (data.estimatedValue) {
    trackFBStockholmMoving({
      area: data.area,
      service_type: data.serviceType,
      property_type: data.propertyType,
      estimated_value: data.estimatedValue,
      distance: data.distance,
    });
  }

  // Google Analytics
  trackEvent({
    name: 'stockholm_event',
    category: 'Stockholm',
    action: data.eventType,
    label: `${data.area} - ${data.serviceType}`,
    value: data.estimatedValue,
    parameters: {
      area: data.area,
      service_type: data.serviceType,
      property_type: data.propertyType,
      distance: data.distance,
      floors: data.floors,
    },
  });
};

// Track form interactions
export const trackFormInteraction = (formName: string, action: 'start' | 'submit' | 'abandon', formData?: Record<string, any>) => {
  // Google Analytics
  if (action === 'start') {
    trackFormStart(formName);
  } else if (action === 'submit') {
    trackFormSubmit(formName, formData);
  }

  // GTM
  trackGTMFormInteraction(formName, action, formData);

  // Facebook (for key forms)
  if (action === 'submit' && formName === 'booking_form') {
    trackFBEvent('SubmitApplication', { form_name: formName });
  }
};

// Track service interactions
export const trackServiceInteraction = (service: {
  type: string;
  action: string;
  price?: number;
  details?: Record<string, any>;
}) => {
  // Google Analytics
  if (service.action === 'select') {
    trackServiceSelection(service.type, service.price);
  }

  // GTM
  trackGTMEvent('service_interaction', {
    service_type: service.type,
    action: service.action,
    price: service.price,
    ...service.details,
  });

  // Facebook
  if (service.action === 'view') {
    trackFBViewContent({
      content_name: service.type,
      content_category: 'service',
      value: service.price,
    });
  } else if (service.action === 'add') {
    trackFBAddToCart({
      content_ids: [service.type],
      content_name: service.type,
      content_type: 'service',
      value: service.price || 0,
    });
  }
};

// Track route optimization events
export const trackRouteOptimizationAll = (data: {
  routeId: string;
  efficiency: number;
  distanceSaved: number;
  timeSaved: number;
  fuelSaved?: number;
  co2Reduced?: number;
}) => {
  // Google Analytics
  trackRouteOptimization({
    routeId: data.routeId,
    efficiency: data.efficiency,
    distanceSaved: data.distanceSaved,
    timeSaved: data.timeSaved,
  });

  // GTM
  trackGTMEvent(ANALYTICS_EVENTS.ROUTE_OPTIMIZATION, {
    route_id: data.routeId,
    efficiency: data.efficiency,
    distance_saved: data.distanceSaved,
    time_saved: data.timeSaved,
    fuel_saved: data.fuelSaved,
    co2_reduced: data.co2Reduced,
  });

  // Track as ML event
  trackMLEventAll({
    algorithm: 'route_optimization',
    action: 'optimization',
    accuracy: data.efficiency,
    outputData: {
      distance_saved: data.distanceSaved,
      time_saved: data.timeSaved,
      fuel_saved: data.fuelSaved,
      co2_reduced: data.co2Reduced,
    },
  });
};

// Track price calculation events
export const trackPriceCalculationAll = (data: {
  serviceType: string;
  basePrice: number;
  finalPrice: number;
  discounts: number;
  aiAdjustment: number;
  factors?: Record<string, any>;
}) => {
  // Google Analytics
  trackPriceCalculation(data);

  // GTM
  trackGTMEvent(ANALYTICS_EVENTS.PRICE_CALCULATION, {
    service_type: data.serviceType,
    base_price: data.basePrice,
    final_price: data.finalPrice,
    discounts: data.discounts,
    ai_adjustment: data.aiAdjustment,
    ...data.factors,
  });

  // Track as ML event
  trackMLEventAll({
    algorithm: 'dynamic_pricing',
    action: 'prediction',
    outputData: {
      base_price: data.basePrice,
      final_price: data.finalPrice,
      adjustment: data.aiAdjustment,
    },
  });
};

// Export all tracking functions
export {
  trackPageView,
  trackEvent,
  trackConversion,
  setUserProperties,
  trackMLEvent,
  trackFormStart,
  trackFormSubmit,
  trackServiceSelection,
  trackError,
  trackScrollDepth,
  trackCampaignClick,
  trackGTMEvent,
  trackFBEvent,
};

// Export types
export * from './types';