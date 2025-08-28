'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}

interface FacebookPixelProps {
  pixelId: string;
}

function FacebookPixelInner({ pixelId }: FacebookPixelProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track page views
  useEffect(() => {
    if (pathname && window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, [pathname, searchParams]);

  return (
    <>
      <Script id="facebook-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
          
          // Custom Nordflytt parameters
          fbq('trackCustom', 'NordflyttLoaded', {
            platform: 'web',
            ml_enabled: true,
            algorithm_version: 'v2.1'
          });
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}

export function FacebookPixel({ pixelId }: FacebookPixelProps) {
  return (
    <Suspense fallback={null}>
      <FacebookPixelInner pixelId={pixelId} />
    </Suspense>
  );
}

// Facebook Pixel helper functions
export const fbPixel = {
  // Track standard events
  trackEvent: (eventName: string, parameters?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', eventName, parameters);
    }
  },

  // Track custom events
  trackCustomEvent: (eventName: string, parameters?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', eventName, parameters);
    }
  },

  // Track lead generation
  trackLead: (value: number, leadData: {
    content_name: string;
    content_category: string;
    living_area?: number;
    distance?: number;
    ml_enhanced?: boolean;
  }) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Lead', {
        value: value,
        currency: 'SEK',
        ...leadData
      });
    }
  },

  // Track quote view
  trackViewContent: (quoteData: {
    content_ids: string[];
    content_type: string;
    value: number;
    content_name: string;
    ml_prediction?: number;
  }) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'ViewContent', {
        ...quoteData,
        currency: 'SEK'
      });
    }
  },

  // Track booking initiation
  trackInitiateCheckout: (bookingData: {
    value: number;
    num_items: number;
    content_ids: string[];
    content_category: string;
    ml_enhanced: boolean;
  }) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        ...bookingData,
        currency: 'SEK'
      });
    }
  },

  // Track completed purchase
  trackPurchase: (purchaseData: {
    value: number;
    content_ids: string[];
    content_type: string;
    num_items: number;
    booking_id: string;
    ml_prediction_used: boolean;
    prediction_accuracy?: number;
  }) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Purchase', {
        ...purchaseData,
        currency: 'SEK'
      });
    }
  },

  // Track search
  trackSearch: (searchData: {
    search_string: string;
    content_category: string;
    content_ids?: string[];
  }) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Search', searchData);
    }
  },

  // Track ML prediction events
  trackMLPrediction: (mlData: {
    prediction_type: string;
    confidence: number;
    baseline_hours: number;
    ml_hours: number;
    value: number;
  }) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', 'MLPredictionGenerated', {
        ...mlData,
        currency: 'SEK'
      });
    }
  },

  // Track contact form submission
  trackContact: (contactData: {
    content_name: string;
    content_category: string;
    value?: number;
  }) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Contact', contactData);
    }
  },

  // Track schedule (booking date selection)
  trackSchedule: (scheduleData: {
    value: number;
    content_name: string;
    content_ids: string[];
    predicted_date?: string;
  }) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Schedule', {
        ...scheduleData,
        currency: 'SEK'
      });
    }
  },

  // Track custom conversions for Nordflytt
  trackNordflyttConversion: (type: string, data: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', `Nordflytt_${type}`, {
        ...data,
        timestamp: new Date().toISOString(),
        ml_system_active: true
      });
    }
  }
};