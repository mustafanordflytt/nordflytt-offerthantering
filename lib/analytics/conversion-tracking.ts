import { logEvent, logPurchase } from './ga4'
import * as Sentry from '@sentry/nextjs'

// Conversion funnel stages
export enum ConversionStage {
  LANDING_PAGE = 'landing_page',
  FORM_START = 'form_start',
  CUSTOMER_INFO = 'customer_info',
  MOVE_DETAILS = 'move_details',
  SERVICE_SELECTION = 'service_selection',
  SUMMARY = 'summary',
  CREDIT_CHECK = 'credit_check',
  PAYMENT_METHOD = 'payment_method',
  BOOKING_COMPLETE = 'booking_complete',
}

// Track conversion funnel
export function trackConversionStep(stage: ConversionStage, metadata?: Record<string, any>) {
  // Log to GA4
  logEvent('Conversion', `funnel_${stage}`, undefined, metadata?.value)
  
  // Log to Sentry
  if (typeof window !== 'undefined' && window.Sentry) {
    Sentry.addBreadcrumb({
      category: 'conversion',
      message: `User reached ${stage}`,
      level: 'info',
      data: metadata,
    })
  }
  
  // Send to dataLayer for GTM
  if (typeof window !== 'undefined' && (window as any).dataLayer) {
    (window as any).dataLayer.push({
      event: 'conversion_step',
      conversion_stage: stage,
      ...metadata,
    })
  }
}

// Track form abandonment
export function trackFormAbandonment(stage: ConversionStage, reason?: string) {
  logEvent('Conversion', 'form_abandoned', `${stage}_${reason || 'unknown'}`)
  
  if (typeof window !== 'undefined' && window.Sentry) {
    Sentry.captureMessage(`Form abandoned at ${stage}`, 'info', {
      tags: {
        conversion_stage: stage,
        abandonment_reason: reason || 'unknown',
      },
    })
  }
}

// Track booking conversion
export function trackBookingConversion(bookingData: {
  bookingId: string
  totalPrice: number
  customerType: 'private' | 'business'
  serviceType: string
  moveSize: string
  additionalServices: string[]
}) {
  const { bookingId, totalPrice, customerType, serviceType, moveSize, additionalServices } = bookingData
  
  // Track purchase event
  logPurchase(bookingId, totalPrice)
  
  // Track detailed conversion
  logEvent('Conversion', 'booking_completed', serviceType, totalPrice)
  
  // Send enhanced ecommerce data to GA4
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'purchase', {
      transaction_id: bookingId,
      value: totalPrice,
      currency: 'SEK',
      items: [
        {
          item_id: serviceType,
          item_name: `${serviceType} - ${moveSize}`,
          category: 'Moving Service',
          quantity: 1,
          price: totalPrice - additionalServices.length * 500, // Base price
        },
        ...additionalServices.map((service, index) => ({
          item_id: `additional_${index}`,
          item_name: service,
          category: 'Additional Service',
          quantity: 1,
          price: 500, // Estimated price per additional service
        })),
      ],
      customer_type: customerType,
    })
  }
  
  // Track in Sentry
  if (typeof window !== 'undefined' && window.Sentry) {
    Sentry.setContext('booking', {
      id: bookingId,
      value: totalPrice,
      customerType,
      serviceType,
      moveSize,
    })
    
    Sentry.captureMessage('Booking completed successfully', 'info')
  }
}

// Track quote request
export function trackQuoteRequest(quoteData: {
  customerType: 'private' | 'business'
  moveType: string
  moveSize: string
  estimatedPrice: number
}) {
  logEvent('Conversion', 'quote_requested', quoteData.moveType, quoteData.estimatedPrice)
  
  if (typeof window !== 'undefined' && (window as any).dataLayer) {
    (window as any).dataLayer.push({
      event: 'generate_lead',
      currency: 'SEK',
      value: quoteData.estimatedPrice,
      customer_type: quoteData.customerType,
      move_type: quoteData.moveType,
      move_size: quoteData.moveSize,
    })
  }
}

// Track credit check results
export function trackCreditCheck(result: 'approved' | 'rejected' | 'manual_review') {
  logEvent('Conversion', 'credit_check_result', result)
  
  if (result === 'rejected') {
    trackFormAbandonment(ConversionStage.CREDIT_CHECK, 'credit_rejected')
  }
}

// Track payment method selection
export function trackPaymentMethod(method: string) {
  logEvent('Conversion', 'payment_method_selected', method)
}

// Track user engagement
export function trackEngagement(action: string, label?: string, value?: number) {
  logEvent('Engagement', action, label, value)
}

// Track search interactions
export function trackSearch(searchType: string, searchQuery: string, resultsCount?: number) {
  logEvent('Search', searchType, searchQuery, resultsCount)
}

// Track errors that impact conversion
export function trackConversionError(errorType: string, errorMessage: string, stage: ConversionStage) {
  logEvent('Error', `conversion_error_${errorType}`, `${stage}: ${errorMessage}`)
  
  if (typeof window !== 'undefined' && window.Sentry) {
    Sentry.captureException(new Error(`Conversion Error: ${errorMessage}`), {
      tags: {
        error_type: errorType,
        conversion_stage: stage,
      },
    })
  }
}

// Calculate and track conversion rate
export function calculateConversionRate(stage: ConversionStage, sessionCount: number) {
  const conversionRate = (sessionCount / 100) * 100 // Placeholder calculation
  logEvent('Metrics', 'conversion_rate', stage, conversionRate)
}

// Track A/B test variations
export function trackABTest(testName: string, variation: string) {
  logEvent('AB_Test', testName, variation)
  
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'experiment_impression', {
      experiment_id: testName,
      variant_id: variation,
    })
  }
}