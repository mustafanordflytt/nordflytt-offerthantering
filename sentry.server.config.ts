import * as Sentry from "@sentry/nextjs"

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    
    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
    
    // Release
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
    
    // Environment
    environment: process.env.NODE_ENV,
    
    // Integrations
    integrations: [
      // Profiling
      Sentry.nodeProfilingIntegration(),
    ],
    
    // Performance Monitoring
    tracePropagationTargets: [
      "localhost",
      /^https:\/\/yourserver\.io\/api/,
      /^https:\/\/(www\.)?nordflytt\.se/,
    ],
    
    // Session tracking
    autoSessionTracking: true,
    
    // Filtering
    beforeSend(event, hint) {
      // Filter out known issues
      if (event.exception) {
        const error = hint.originalException
        
        // Ignore expected 404s
        if (
          error &&
          typeof error === "object" &&
          "statusCode" in error &&
          error.statusCode === 404
        ) {
          return null
        }
      }
      
      return event
    },
    
    // User tracking
    initialScope: {
      tags: { component: "server" },
    },
  })
}