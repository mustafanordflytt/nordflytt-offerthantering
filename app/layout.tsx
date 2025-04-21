import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Script from "next/script"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Nordflytts Bokningsformulär",
  description: "Boka din flytt eller flyttstädning med Nordflytts",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="sv">
      <head>
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=AIzaSyChAUwFV4q2SQUbHjjw_QIK1I5I3mee8b0&libraries=marker,places,drawing&v=weekly`}
          strategy="afterInteractive"
        />
        <Script
          src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className={inter.className}>
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
      </body>
    </html>
  )
}
