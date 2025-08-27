// Analytics Polyfill - Temporary fix for missing analytics functions
// This prevents console errors when analytics functions are called but not defined

(function() {
  'use strict';
  
  // Define missing analytics functions to prevent errors
  const analyticsStubs = [
    'sendToAnalyticsGoogleAnalytics',
    'sendToAnalyticsGTM',
    'sendToAnalyticsHotjar',
    'sendToAnalyticsPlausible',
    'sendToAnalyticsMixpanel',
    'sendToAnalyticsGA',
    'sendToAnalyticsFacebook'
  ];
  
  // Create stub functions that do nothing
  analyticsStubs.forEach(function(funcName) {
    if (typeof window[funcName] === 'undefined') {
      window[funcName] = function() {
        // Silently ignore calls to these functions
        if (window.location.hostname === 'localhost') {
          console.debug('[Analytics Polyfill] Stub called:', funcName, arguments);
        }
      };
    }
  });
  
  // Also create a generic sendToAnalytics function if needed
  if (typeof window.sendToAnalytics === 'undefined') {
    window.sendToAnalytics = function(metric) {
      // This is handled by web-vitals.ts, so we can ignore here
      if (window.location.hostname === 'localhost') {
        console.debug('[Analytics Polyfill] Generic sendToAnalytics called:', metric);
      }
    };
  }
})();