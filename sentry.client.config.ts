import * as Sentry from "@sentry/nextjs"

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    
    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
    
    // Replay
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    
    // Release
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
    
    // Environment
    environment: process.env.NODE_ENV,
    
    // Integrations
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: false,
      }),
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
        
        // Ignore hydration errors in development
        if (
          process.env.NODE_ENV === "development" &&
          error &&
          typeof error === "object" &&
          "message" in error &&
          typeof error.message === "string" &&
          error.message.includes("Hydration")
        ) {
          return null
        }
        
        // Ignore network errors
        if (
          error &&
          typeof error === "object" &&
          "message" in error &&
          typeof error.message === "string" &&
          (error.message.includes("NetworkError") ||
            error.message.includes("Failed to fetch"))
        ) {
          return null
        }
      }
      
      return event
    },
    
    // User tracking
    initialScope: {
      tags: { component: "client" },
    },
  })
}