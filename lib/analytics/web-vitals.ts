import { onCLS, onFCP, onINP, onLCP, onTTFB, Metric } from 'web-vitals'
import * as Sentry from '@sentry/nextjs'
import { logTiming } from './ga4'

// Thresholds based on Google's recommendations
const WEB_VITALS_THRESHOLDS = {
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  INP: { good: 200, needsImprovement: 500 },
  LCP: { good: 2500, needsImprovement: 4000 },
  TTFB: { good: 800, needsImprovement: 1800 },
}

type MetricRating = 'good' | 'needs-improvement' | 'poor'

function getRating(metric: Metric): MetricRating {
  const thresholds = WEB_VITALS_THRESHOLDS[metric.name as keyof typeof WEB_VITALS_THRESHOLDS]
  if (!thresholds) return 'poor'
  
  if (metric.value <= thresholds.good) return 'good'
  if (metric.value <= thresholds.needsImprovement) return 'needs-improvement'
  return 'poor'
}

function sendToAnalytics(metric: Metric) {
  let rating: MetricRating = 'poor'
  
  try {
    // Validate metric value
    if (typeof metric.value !== 'number' || isNaN(metric.value)) {
      console.warn('[Web Vitals] Invalid metric value:', metric)
      return
    }
    
    rating = getRating(metric)
    
    // Log to Google Analytics with error handling
    try {
      logTiming('Web Vitals', metric.name, Math.round(metric.value))
    } catch (error) {
      console.warn('[Web Vitals] Failed to log to GA:', error)
    }
    
    // Log to Sentry with additional context
    if (typeof window !== 'undefined' && window.Sentry) {
      try {
        Sentry.addBreadcrumb({
          category: 'web-vitals',
          message: `${metric.name}: ${metric.value}`,
          level: rating === 'poor' ? 'warning' : 'info',
          data: {
            id: metric.id,
            value: metric.value,
            rating,
            delta: metric.delta,
            navigationType: metric.navigationType,
          },
        })
        
        // Report poor performance as an issue
        if (rating === 'poor') {
          Sentry.captureMessage(`Poor ${metric.name} performance: ${metric.value}`, 'warning')
        }
      } catch (error) {
        console.warn('[Web Vitals] Failed to log to Sentry:', error)
      }
    }
  } catch (error) {
    console.warn('[Web Vitals] Error in sendToAnalytics:', error)
  }
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', {
      metric: metric.name,
      value: metric.value,
      rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
    })
  }
  
  // Send to custom monitoring endpoint
  if (process.env.NEXT_PUBLIC_MONITORING_ENDPOINT) {
    fetch(process.env.NEXT_PUBLIC_MONITORING_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: metric.name,
        value: metric.value,
        rating,
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {
      // Silently fail - don't impact user experience
    })
  }
}

// Initialize Web Vitals monitoring
export function initWebVitals() {
  if (typeof window === 'undefined') return
  
  try {
    // Core Web Vitals
    onCLS(sendToAnalytics)
    onFCP(sendToAnalytics)
    onLCP(sendToAnalytics)
    
    // Other metrics
    // onFID is deprecated, use onINP instead
    onINP(sendToAnalytics)
    onTTFB(sendToAnalytics)
  } catch (error) {
    console.warn('[Web Vitals] Failed to initialize monitoring:', error)
  }
}

// Custom performance marks
export function markPerformance(markName: string) {
  if (typeof window !== 'undefined' && 'performance' in window) {
    performance.mark(markName)
  }
}

// Measure between marks
export function measurePerformance(measureName: string, startMark: string, endMark?: string) {
  if (typeof window !== 'undefined' && 'performance' in window) {
    try {
      if (endMark) {
        performance.measure(measureName, startMark, endMark)
      } else {
        performance.measure(measureName, startMark)
      }
      
      const measure = performance.getEntriesByName(measureName, 'measure')[0]
      if (measure) {
        logTiming('Custom Performance', measureName, Math.round(measure.duration))
      }
    } catch (e) {
      // Ignore errors from invalid marks
    }
  }
}

// Report navigation timing
export function reportNavigationTiming() {
  if (typeof window === 'undefined' || !('performance' in window)) return
  
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
  if (!navigation) return
  
  const timingData = {
    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
    tcp: navigation.connectEnd - navigation.connectStart,
    request: navigation.responseStart - navigation.requestStart,
    response: navigation.responseEnd - navigation.responseStart,
    dom: navigation.domComplete - navigation.responseEnd,
    total: navigation.loadEventEnd - navigation.fetchStart,
  }
  
  Object.entries(timingData).forEach(([key, value]) => {
    if (value > 0) {
      logTiming('Navigation Timing', key, Math.round(value))
    }
  })
}

// Monitor long tasks
export function monitorLongTasks() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return
  
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          // Log long tasks over 50ms
          Sentry.addBreadcrumb({
            category: 'performance',
            message: `Long task detected: ${Math.round(entry.duration)}ms`,
            level: entry.duration > 200 ? 'warning' : 'info',
            data: {
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name,
            },
          })
        }
      }
    })
    
    observer.observe({ entryTypes: ['longtask'] })
  } catch (e) {
    // Not all browsers support long task monitoring
  }
}