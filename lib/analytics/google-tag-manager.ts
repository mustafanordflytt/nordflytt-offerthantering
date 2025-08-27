// Google Tag Manager implementation

import { analyticsConfig, GTM_EVENTS } from './config';
import type { TrackingEvent, ConversionEvent, UserProperties, CookieConsent } from './types';

// Initialize GTM
export const initGTM = () => {
  if (!analyticsConfig.gtm.enabled) return;

  // Push initial dataLayer values
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'gtm.start': new Date().getTime(),
    event: 'gtm.js',
  });
};

// Push event to dataLayer
export const pushToDataLayer = (data: Record<string, any>) => {
  if (!analyticsConfig.gtm.enabled || typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(data);
};

// Track GTM event
export const trackGTMEvent = (eventName: string, eventData: Record<string, any> = {}) => {
  pushToDataLayer({
    event: eventName,
    ...eventData,
  });
};

// Track page view in GTM
export const trackGTMPageView = (path: string, title: string) => {
  pushToDataLayer({
    event: 'virtualPageView',
    pageUrl: path,
    pageTitle: title,
  });
};

// Track conversion in GTM
export const trackGTMConversion = (conversion: ConversionEvent) => {
  const eventData: Record<string, any> = {
    event: 'conversion',
    conversionType: conversion.type,
    conversionValue: conversion.value,
    conversionCurrency: conversion.currency,
  };

  if (conversion.transactionId) {
    eventData.transactionId = conversion.transactionId;
  }

  if (conversion.items) {
    eventData.items = conversion.items;
  }

  pushToDataLayer(eventData);
};

// Track enhanced e-commerce events
export const trackGTMEcommerce = (action: string, data: Record<string, any>) => {
  pushToDataLayer({
    event: 'ecommerce',
    ecommerce: {
      [action]: data,
    },
  });
};

// Track user properties in GTM
export const setGTMUserProperties = (properties: UserProperties) => {
  const dataLayerProperties: Record<string, any> = {
    event: 'setUserProperties',
  };

  if (properties.userId) dataLayerProperties.userId = properties.userId;
  if (properties.customerType) dataLayerProperties.customerType = properties.customerType;
  if (properties.location) dataLayerProperties.userLocation = properties.location;
  if (properties.serviceType) dataLayerProperties.serviceType = properties.serviceType;
  if (properties.leadSource) dataLayerProperties.leadSource = properties.leadSource;
  if (properties.campaignId) dataLayerProperties.campaignId = properties.campaignId;

  pushToDataLayer(dataLayerProperties);
};

// Track cookie consent
export const trackGTMCookieConsent = (consent: CookieConsent) => {
  pushToDataLayer({
    event: GTM_EVENTS.COOKIE_CONSENT_GIVEN,
    cookieConsent: {
      analytics: consent.analytics,
      marketing: consent.marketing,
      functional: consent.functional,
      timestamp: consent.timestamp,
    },
  });
};

// Track form interactions
export const trackGTMFormInteraction = (formName: string, action: 'start' | 'submit' | 'abandon', formData?: Record<string, any>) => {
  pushToDataLayer({
    event: 'formInteraction',
    formName,
    formAction: action,
    formData: formData || {},
  });
};

// Track custom dimensions
export const setGTMCustomDimensions = (dimensions: Record<string, any>) => {
  pushToDataLayer({
    event: 'setCustomDimensions',
    customDimensions: dimensions,
  });
};

// Track ML/AI events
export const trackGTMMLEvent = (eventType: string, data: Record<string, any>) => {
  pushToDataLayer({
    event: 'mlEvent',
    mlEventType: eventType,
    mlData: data,
  });
};

// Track errors
export const trackGTMError = (error: {
  message: string;
  stack?: string;
  type: string;
  fatal: boolean;
}) => {
  pushToDataLayer({
    event: 'errorTracking',
    errorMessage: error.message,
    errorStack: error.stack,
    errorType: error.type,
    errorFatal: error.fatal,
  });
};

// Track timing events
export const trackGTMTiming = (category: string, variable: string, time: number, label?: string) => {
  pushToDataLayer({
    event: 'timing',
    timingCategory: category,
    timingVariable: variable,
    timingTime: time,
    timingLabel: label,
  });
};

// Track social interactions
export const trackGTMSocial = (network: string, action: string, target: string) => {
  pushToDataLayer({
    event: 'socialInteraction',
    socialNetwork: network,
    socialAction: action,
    socialTarget: target,
  });
};

// Track video interactions
export const trackGTMVideo = (action: 'play' | 'pause' | 'complete', videoTitle: string, currentTime: number) => {
  pushToDataLayer({
    event: 'videoInteraction',
    videoAction: action,
    videoTitle,
    videoCurrentTime: currentTime,
  });
};

// Track scroll depth
export const trackGTMScrollDepth = (percentage: number) => {
  pushToDataLayer({
    event: 'scrollDepth',
    scrollPercentage: percentage,
  });
};

// Track Stockholm-specific events
export const trackGTMStockholmEvent = (eventType: string, data: {
  area: string;
  serviceType: string;
  propertyType?: string;
  distance?: number;
  floors?: number;
}) => {
  pushToDataLayer({
    event: 'stockholmEvent',
    stockholmEventType: eventType,
    stockholmArea: data.area,
    serviceType: data.serviceType,
    propertyType: data.propertyType,
    movingDistance: data.distance,
    numberOfFloors: data.floors,
  });
};

// Clear dataLayer (useful for SPAs)
export const clearDataLayer = () => {
  if (typeof window === 'undefined') return;
  
  window.dataLayer = window.dataLayer || [];
  // Keep only GTM required data
  window.dataLayer = window.dataLayer.filter((item: any) => 
    item.event === 'gtm.js' || item.event === 'gtm.dom' || item.event === 'gtm.load'
  );
};