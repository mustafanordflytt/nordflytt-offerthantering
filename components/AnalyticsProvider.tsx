'use client';

import React, { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { initAnalytics, trackPageViewAll } from '@/lib/analytics';
import { analyticsConfig } from '@/lib/analytics/config';
import CookieConsent, { useCookieConsent } from './CookieConsent';
import { initGA, logPageView } from '@/lib/analytics/ga4';
import { initWebVitals, reportNavigationTiming, monitorLongTasks } from '@/lib/analytics/web-vitals';
import * as Sentry from '@sentry/nextjs';

function AnalyticsProviderInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const cookieConsent = useCookieConsent();

  // Initialize analytics on mount
  useEffect(() => {
    if (cookieConsent?.analytics) {
      initAnalytics();
      initGA();
    }
    
    // Initialize performance monitoring (doesn't require consent)
    try {
      initWebVitals();
      reportNavigationTiming();
      monitorLongTasks();
    } catch (error) {
      console.warn('[Analytics] Failed to initialize performance monitoring:', error);
    }
    
    // Initialize Sentry user context
    if (typeof window !== 'undefined' && window.Sentry) {
      Sentry.setContext('consent', {
        analytics: cookieConsent?.analytics || false,
        marketing: cookieConsent?.marketing || false,
      });
    }
  }, [cookieConsent]);

  // Track page views on route change
  useEffect(() => {
    if (cookieConsent?.analytics) {
      const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
      trackPageViewAll(url, document.title);
      logPageView(url);
    }
    
    // Add Sentry breadcrumb for navigation
    if (typeof window !== 'undefined' && window.Sentry) {
      Sentry.addBreadcrumb({
        category: 'navigation',
        message: `Navigated to ${pathname}`,
        level: 'info',
        data: {
          pathname,
          search: searchParams.toString(),
        },
      });
    }
  }, [pathname, searchParams, cookieConsent]);

  return (
    <>
      {/* Google Analytics 4 */}
      {analyticsConfig.ga4.enabled && cookieConsent?.analytics && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${analyticsConfig.ga4.measurementId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${analyticsConfig.ga4.measurementId}', {
                page_path: window.location.pathname,
              });
            `}
          </Script>
        </>
      )}

      {/* Google Tag Manager */}
      {analyticsConfig.gtm.enabled && (
        <>
          <Script id="google-tag-manager" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${analyticsConfig.gtm.containerId}');
            `}
          </Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${analyticsConfig.gtm.containerId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        </>
      )}

      {/* Facebook Pixel */}
      {analyticsConfig.facebook.enabled && cookieConsent?.marketing && (
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
            fbq('init', '${analyticsConfig.facebook.pixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {/* Cookie Consent Banner */}
      <CookieConsent />

      {children}
    </>
  );
}

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<>{children}</>}>
      <AnalyticsProviderInner>{children}</AnalyticsProviderInner>
    </Suspense>
  );
}