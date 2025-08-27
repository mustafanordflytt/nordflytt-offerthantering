import ReactGA from 'react-ga4'

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''

export const initGA = () => {
  if (GA_MEASUREMENT_ID && typeof window !== 'undefined') {
    ReactGA.initialize(GA_MEASUREMENT_ID, {
      gaOptions: {
        anonymizeIp: true,
        cookieFlags: 'SameSite=None;Secure',
      },
    })
  }
}

// Page views
export const logPageView = (url: string) => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.send({ hitType: "pageview", page: url })
  }
}

// Events
export const logEvent = (category: string, action: string, label?: string, value?: number) => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.event({
      category,
      action,
      label,
      value,
    })
  }
}

// E-commerce events
export const logPurchase = (transactionId: string, value: number, currency: string = 'SEK') => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.event('purchase', {
      transaction_id: transactionId,
      value: value,
      currency: currency,
    })
  }
}

// Form events
export const logFormStart = (formName: string) => {
  logEvent('Form', 'form_start', formName)
}

export const logFormStep = (formName: string, step: number) => {
  logEvent('Form', 'form_step', formName, step)
}

export const logFormComplete = (formName: string) => {
  logEvent('Form', 'form_complete', formName)
}

export const logFormError = (formName: string, errorType: string) => {
  logEvent('Form', 'form_error', `${formName}_${errorType}`)
}

// Booking events
export const logBookingStart = () => {
  logEvent('Booking', 'booking_start')
}

export const logBookingStep = (step: string) => {
  logEvent('Booking', 'booking_step', step)
}

export const logBookingComplete = (bookingId: string, value: number) => {
  logEvent('Booking', 'booking_complete', bookingId, value)
  logPurchase(bookingId, value)
}

// Service selection events
export const logServiceSelected = (serviceName: string, price: number) => {
  logEvent('Service', 'service_selected', serviceName, price)
}

export const logServiceRemoved = (serviceName: string, price: number) => {
  logEvent('Service', 'service_removed', serviceName, price)
}

// User engagement
export const logEngagement = (action: string, label?: string) => {
  logEvent('Engagement', action, label)
}

// Error tracking
export const logError = (errorType: string, errorMessage: string) => {
  logEvent('Error', errorType, errorMessage)
}

// Performance tracking
export const logTiming = (category: string, variable: string, value: number) => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.event('timing_complete', {
      name: variable,
      value: value,
      event_category: category,
    })
  }
}