# 📊 Real Analytics Implementation Guide for Nordflytt

## Overview

This guide will help you set up real analytics tracking to replace the mock AI-Marknadsföring system with actual performance data.

## 🚀 Quick Start (15 minutes)

### Step 1: Set Up Google Analytics 4

1. **Create GA4 Property**:
   - Go to [Google Analytics](https://analytics.google.com/)
   - Click Admin (gear icon) → Create Property
   - Name: "Nordflytt - Production"
   - Select Sweden, SEK currency
   - Business info: Professional Services, 11-100 employees

2. **Get Measurement ID**:
   - In property settings → Data Streams → Web
   - Click "Add stream" → Enter your domain
   - Copy the Measurement ID (G-XXXXXXXXXX)

3. **Configure Enhanced Measurement**:
   - Enable all toggles:
     - Page views ✓
     - Scrolls ✓
     - Outbound clicks ✓
     - Site search ✓
     - Form interactions ✓
     - File downloads ✓

### Step 2: Set Up Google Tag Manager

1. **Create GTM Container**:
   - Go to [Google Tag Manager](https://tagmanager.google.com/)
   - Create Account: "Nordflytt"
   - Container name: "nordflytt.se"
   - Target platform: Web
   - Copy Container ID (GTM-XXXXXXX)

2. **Essential Tags to Create**:
   ```
   Tag 1: GA4 Configuration
   - Tag Type: Google Analytics: GA4 Configuration
   - Measurement ID: {{Your GA4 ID}}
   - Trigger: All Pages

   Tag 2: GA4 Event - Form Submit
   - Tag Type: Google Analytics: GA4 Event
   - Event Name: generate_lead
   - Trigger: Form Submission

   Tag 3: Conversion - Booking Complete
   - Tag Type: Google Analytics: GA4 Event
   - Event Name: purchase
   - Trigger: Custom Event (booking_complete)
   ```

### Step 3: Set Up Facebook Pixel

1. **Create Pixel**:
   - Go to [Facebook Events Manager](https://business.facebook.com/events_manager/)
   - Connect Data Sources → Web → Get Started
   - Name: "Nordflytt Pixel"
   - Enter website URL
   - Copy Pixel ID

2. **Configure Events**:
   - Set up Conversions API for iOS 14.5+
   - Verify domain in Business Settings
   - Create custom conversions for:
     - Quote Request (URL contains /quote-success)
     - Booking Complete (URL contains /booking-success)

### Step 4: Update Environment Variables

```bash
# Copy example file
cp .env.analytics.example .env.local

# Edit with your actual IDs
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-YOUR_ACTUAL_ID
NEXT_PUBLIC_GTM_CONTAINER_ID=GTM-YOUR_ID
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=YOUR_PIXEL_ID
```

### Step 5: Deploy and Verify

1. **Deploy to staging/production**
2. **Verify in real-time**:
   - GA4: Realtime → Overview (should show your visit)
   - GTM: Preview mode to test tags
   - Facebook: Test Events tool

## 📈 Enhanced E-commerce Setup

### Track ML-Enhanced Quotes

```javascript
// When quote is generated with ML prediction
window.gtag('event', 'generate_lead', {
  currency: 'SEK',
  value: 15000, // Estimated booking value
  items: [{
    item_id: 'quote_12345',
    item_name: 'ML Enhanced Moving Quote',
    item_category: 'moving_quote',
    item_variant: 'ml_prediction',
    price: 15000,
    quantity: 1,
    // Custom parameters
    ml_confidence: 0.87,
    prediction_method: 'hybrid',
    living_area: 80,
    distance_km: 26.8
  }]
});
```

### Track Booking Conversions

```javascript
// When booking is confirmed
window.gtag('event', 'purchase', {
  transaction_id: 'NF-23857BDE',
  value: 18500,
  currency: 'SEK',
  items: [{
    item_id: 'moving_service',
    item_name: 'Stockholm Local Move',
    item_category: 'moving',
    price: 18500,
    quantity: 1
  }],
  // Enhanced data
  ml_prediction_used: true,
  prediction_accuracy: 0.92,
  customer_type: 'private'
});
```

## 🎯 Goal & Conversion Setup

### Google Analytics 4 Goals

1. **Micro Conversions**:
   - Quote form start: 100 SEK value
   - Quote form complete: 500 SEK value
   - Contact form submit: 300 SEK value

2. **Macro Conversions**:
   - Booking confirmed: Actual booking value
   - Phone call (>30 seconds): 1000 SEK value

### Facebook Conversions

```javascript
// Standard events with custom parameters
fbq('track', 'Lead', {
  value: 500,
  currency: 'SEK',
  content_name: 'Moving Quote',
  content_category: 'ML Enhanced',
  // Custom data
  living_area: 80,
  distance: 26.8,
  ml_prediction: true
});
```

## 📱 Cross-Device Tracking

### User ID Implementation

```javascript
// After user provides email/phone
gtag('config', 'G-XXXXXXXXXX', {
  user_id: 'hashed_user_email_or_phone'
});

// Also set for Facebook
fbq('init', 'PIXEL_ID', {
  external_id: 'hashed_user_email_or_phone'
});
```

## 🔍 SEO & Search Console Setup

### 1. Verify Domain Ownership

```html
<!-- Add to <head> in layout.tsx -->
<meta name="google-site-verification" content="your-verification-code" />
```

### 2. Submit Sitemap

```xml
<!-- Create public/sitemap.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://nordflytt.se/</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://nordflytt.se/flyttstadning</loc>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://nordflytt.se/priser</loc>
    <priority>0.9</priority>
  </url>
</urlset>
```

### 3. Monitor Performance

- Track keyword rankings
- Monitor Core Web Vitals
- Check mobile usability
- Review crawl errors

## 📊 Custom Dashboard Integration

### Replace Mock Data with Real API

```javascript
// lib/analytics/google-analytics-api.ts
import { google } from 'googleapis';

export async function getRealTimeData() {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_ANALYTICS_CREDENTIALS),
    scopes: ['https://www.googleapis.com/auth/analytics.readonly']
  });

  const analytics = google.analyticsreporting({
    version: 'v4',
    auth
  });

  const response = await analytics.reports.batchGet({
    requestBody: {
      reportRequests: [{
        viewId: process.env.GOOGLE_ANALYTICS_VIEW_ID,
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        metrics: [
          { expression: 'ga:sessions' },
          { expression: 'ga:users' },
          { expression: 'ga:goalConversionRateAll' }
        ],
        dimensions: [{ name: 'ga:source' }]
      }]
    }
  });

  return response.data;
}
```

## 🎨 Marketing Campaign Tracking

### UTM Parameters

```javascript
// Standard format for all campaigns
const campaignUrl = new URL('https://nordflytt.se');
campaignUrl.searchParams.set('utm_source', 'google');
campaignUrl.searchParams.set('utm_medium', 'cpc');
campaignUrl.searchParams.set('utm_campaign', 'stockholm_moving_ml');
campaignUrl.searchParams.set('utm_content', 'ml_prediction_ad');
```

### QR Code Tracking (for postcards)

```javascript
// Generate trackable QR codes
const qrUrl = 'https://nordflytt.se/?utm_source=postcard&utm_medium=direct_mail&utm_campaign=hemnet_q1_2024';
```

## 📧 Email Marketing Integration

### Mailchimp Setup

```javascript
// Track email campaigns in GA4
const emailLink = 'https://nordflytt.se/?utm_source=mailchimp&utm_medium=email&utm_campaign=ml_launch';
```

### Automated Flows

1. **Quote Abandonment**:
   - Trigger: Quote started but not completed
   - Email 1: After 2 hours - "Need help with your quote?"
   - Email 2: After 24 hours - "10% discount waiting"

2. **Post-Booking**:
   - Immediate: Booking confirmation
   - 3 days before: Moving checklist
   - 1 day after: Review request

## 🚨 Privacy & GDPR Compliance

### Cookie Consent Implementation

The system already includes GDPR-compliant cookie consent:
- Granular consent options
- Consent mode integration
- Preference center
- Automatic script blocking until consent

### Data Retention

Configure in GA4:
- User data: 14 months
- Event data: 2 months
- No advertising features for EU users

## 📈 Performance Monitoring

### Core Web Vitals Tracking

```javascript
// Track Web Vitals in GA4
import { getCLS, getFID, getLCP } from 'web-vitals';

getCLS(metric => {
  gtag('event', 'web_vitals', {
    event_category: 'Web Vitals',
    name: metric.name,
    value: Math.round(metric.value * 1000),
    event_label: metric.id,
    non_interaction: true
  });
});
```

## 🎯 Success Metrics

### Week 1 Goals
- ✓ All tracking codes installed
- ✓ Basic conversion tracking working
- ✓ Real-time data visible

### Month 1 Goals
- 100+ conversions tracked
- 5%+ conversion rate
- 500+ SEK average CPA

### Month 3 Goals
- Full attribution model
- ML prediction impact measured
- ROI dashboard operational

## 🆘 Troubleshooting

### Common Issues

1. **No data showing**:
   - Check browser console for errors
   - Verify IDs are correct
   - Use GA4 DebugView
   - Check ad blockers

2. **Conversions not tracking**:
   - Verify GTM triggers
   - Check event parameters
   - Use Facebook Pixel Helper
   - Test in Preview mode

3. **Cookie consent issues**:
   - Clear browser cookies
   - Test in incognito
   - Check consent logic

## 📞 Support Resources

- [GA4 Help Center](https://support.google.com/analytics)
- [GTM Documentation](https://support.google.com/tagmanager)
- [Facebook Business Help](https://www.facebook.com/business/help)
- [Search Console Help](https://support.google.com/webmasters)

## ✅ Implementation Checklist

- [ ] GA4 property created and configured
- [ ] GTM container set up with basic tags
- [ ] Facebook Pixel installed and verified
- [ ] Environment variables updated
- [ ] Cookie consent tested
- [ ] Enhanced e-commerce tracking configured
- [ ] Goals and conversions set up
- [ ] Search Console verified
- [ ] Email tracking configured
- [ ] Dashboard showing real data
- [ ] Team trained on analytics

Once completed, you'll have real data flowing instead of mock data, enabling data-driven decisions for your AI-enhanced moving company!