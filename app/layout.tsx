import "./globals.css"
import "./staff/modals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Script from "next/script"
import { Toaster } from "sonner"
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration"
import AnalyticsProvider from "@/components/AnalyticsProvider"
import SchemaMarkup from "@/components/seo/SchemaMarkup"
import { pageMetadata } from "@/components/seo/SEOMetadata"
import { AuthProvider } from "@/components/auth/AuthProvider"
import { ErrorBoundary } from "@/components/ErrorBoundary"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = pageMetadata.home

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="sv">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#002A5C" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Nordflytt" />
        <link rel="apple-touch-icon" href="/nordflytt-logo.png" />
        <Script
          src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js"
          strategy="beforeInteractive"
        />
        <Script
          src="/analytics-polyfill.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className={inter.className} suppressHydrationWarning={true}>
        <Script
          src="/viewport-height.js"
          strategy="afterInteractive"
        />
        <ErrorBoundary>
          <SchemaMarkup type="Organization" />
          <AnalyticsProvider>
            <AuthProvider>
              <ServiceWorkerRegistration />
              <header className="flex justify-between items-center px-6 py-3 h-16">
                <div className="flex items-center h-full">
                  <img 
                    src="/nordflytt-logo.svg"
                    alt="Nordflytt" 
                    className="h-8 w-auto my-auto"
                  />
                </div>
              </header>
                      
              <main>
                <ErrorBoundary>
                  {children}
                </ErrorBoundary>
              </main>
            <Toaster 
              position="top-right"
              expand={true}
              richColors
              closeButton
            />
            <Script
              id="google-maps"
              src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&v=weekly&loading=async`}
              strategy="beforeInteractive"
            />
            </AuthProvider>
          </AnalyticsProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}