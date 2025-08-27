# 📊 Monitoring & Analytics Setup Guide

This guide covers the complete monitoring setup for the Nordflytt booking system, including error tracking, performance monitoring, and analytics.

## 🚀 Quick Start

### 1. Environment Variables

Add these to your `.env.local`:

```bash
# Sentry (Error Tracking)
NEXT_PUBLIC_SENTRY_DSN=https://YOUR_KEY@sentry.io/PROJECT_ID
SENTRY_ORG=your-organization
SENTRY_PROJECT=nordflytt-booking
SENTRY_AUTH_TOKEN=your-auth-token

# Google Analytics 4
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Optional: Custom Monitoring
NEXT_PUBLIC_MONITORING_ENDPOINT=https://your-api.com/metrics
```

### 2. Install Dependencies

```bash
npm install --legacy-peer-deps
```

## 🔧 Detailed Setup

### Sentry Configuration

1. **Create a Sentry Account**
   - Go to [sentry.io](https://sentry.io)
   - Create a new project (choose Next.js)
   - Copy the DSN from project settings

2. **Generate Auth Token**
   - Go to Settings → Auth Tokens
   - Create a token with `project:releases` scope
   - Add to `.env.local`

3. **Configuration Files**
   - `sentry.client.config.ts` - Client-side error tracking
   - `sentry.server.config.ts` - Server-side error tracking
   - `sentry.edge.config.ts` - Edge runtime error tracking

### Google Analytics 4

1. **Create GA4 Property**
   - Go to [analytics.google.com](https://analytics.google.com)
   - Create new property for nordflytt.se
   - Copy Measurement ID (G-XXXXXXXXXX)

2. **Configure Events**
   Already configured events:
   - Page views
   - Form steps
   - Booking completions
   - Service selections
   - Error tracking

### Web Vitals Monitoring

Automatically tracks:
- **LCP** (Largest Contentful Paint) - Loading performance
- **FID** (First Input Delay) - Interactivity
- **CLS** (Cumulative Layout Shift) - Visual stability
- **FCP** (First Contentful Paint) - Initial render
- **TTFB** (Time to First Byte) - Server response
- **INP** (Interaction to Next Paint) - Responsiveness

## 📈 Conversion Tracking

### Funnel Stages

```typescript
enum ConversionStage {
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
```

### Implementation Example

```typescript
import { trackConversionStep, trackBookingConversion } from '@/lib/analytics/conversion-tracking'

// Track step completion
trackConversionStep(ConversionStage.CUSTOMER_INFO, {
  customer_type: 'private',
  has_contact_info: true
})

// Track booking completion
trackBookingConversion({
  bookingId: 'NF2024001',
  totalPrice: 15000,
  customerType: 'private',
  serviceType: 'moving',
  moveSize: 'medium',
  additionalServices: ['packing', 'cleaning']
})
```

## 🎯 Custom Events

### Form Events
```typescript
import { logFormStart, logFormStep, logFormComplete } from '@/lib/analytics/ga4'

logFormStart('booking_form')
logFormStep('booking_form', 2)
logFormComplete('booking_form')
```

### Service Events
```typescript
import { logServiceSelected, logServiceRemoved } from '@/lib/analytics/ga4'

logServiceSelected('Packning', 2500)
logServiceRemoved('Städning', 1500)
```

### Error Events
```typescript
import { logError } from '@/lib/analytics/ga4'

logError('api_error', 'Failed to load pricing')
```

## 📊 Monitoring Dashboard

Access the monitoring dashboard at `/admin/monitoring`

Features:
- Real-time user activity
- Core Web Vitals tracking
- Conversion funnel visualization
- Error monitoring
- API performance metrics

## 🔍 Debugging

### Enable Debug Mode

```typescript
// In sentry.client.config.ts
Sentry.init({
  debug: true, // Enable console logging
  // ... other config
})
```

### Test Error Tracking

```typescript
// Trigger a test error
Sentry.captureException(new Error('Test error from monitoring setup'))
```

### Test Analytics

```typescript
// Open browser console
window.gtag('event', 'test_event', {
  event_category: 'test',
  event_label: 'monitoring_setup'
})
```

## 📱 Performance Monitoring

### Custom Performance Marks

```typescript
import { markPerformance, measurePerformance } from '@/lib/analytics/web-vitals'

// Start timing
markPerformance('booking_form_start')

// ... do some work ...

// Measure
measurePerformance('booking_form_duration', 'booking_form_start')
```

### Long Task Monitoring

Automatically tracks JavaScript tasks that block the main thread for >50ms.

## 🛡️ Privacy & GDPR

### Cookie Consent

Analytics only track after user consent:
- Analytics cookies (GA4, performance)
- Marketing cookies (Facebook Pixel, etc.)

### Data Anonymization

- IP addresses are anonymized
- Personal data is never sent to analytics
- Sensitive form fields are masked in error reports

## 📋 Checklist

- [ ] Sentry account created and DSN added
- [ ] GA4 property created and ID added
- [ ] Environment variables configured
- [ ] Test error sent to Sentry
- [ ] Test event sent to GA4
- [ ] Monitoring dashboard accessible
- [ ] Web Vitals being tracked
- [ ] Conversion funnel configured

## 🚨 Alerting

### Sentry Alerts

Configure in Sentry dashboard:
- Error rate spikes
- New error types
- Performance degradation
- Specific error messages

### Custom Alerts

```typescript
// Example: Alert on high error rate
if (errorRate > 5) {
  Sentry.captureMessage('High error rate detected', 'warning')
}
```

## 📚 Resources

- [Sentry Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [GA4 Docs](https://developers.google.com/analytics/devguides/collection/ga4)
- [Web Vitals](https://web.dev/vitals/)
- [Next.js Analytics](https://nextjs.org/analytics)

---

**Need help?** Check the monitoring dashboard at `/admin/monitoring` or contact the development team.