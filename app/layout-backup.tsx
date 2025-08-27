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
        <Script
          src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className={inter.className} suppressHydrationWarning={true}>
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
                    
            <main>{children}</main>
            <Toaster 
              position="top-right"
              expand={true}
              richColors
              closeButton
            />
          </AuthProvider>
        </AnalyticsProvider>
      </body>
    </html>
  )
}