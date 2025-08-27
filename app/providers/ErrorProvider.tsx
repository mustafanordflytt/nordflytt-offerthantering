'use client'

import React, { createContext, useContext, ReactNode, useCallback, useState } from 'react'
import ErrorBoundary from '@/components/error-boundary/ErrorBoundary'
import { toast } from '@/hooks/use-toast'

interface ErrorContextType {
  reportError: (error: Error, context?: string) => void
  clearError: () => void
  hasError: boolean
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined)

export function useErrorHandler() {
  const context = useContext(ErrorContext)
  if (context === undefined) {
    throw new Error('useErrorHandler must be used within an ErrorProvider')
  }
  return context
}

interface ErrorProviderProps {
  children: ReactNode
}

export function ErrorProvider({ children }: ErrorProviderProps) {
  const [hasError, setHasError] = useState(false)

  const reportError = useCallback((error: Error, context?: string) => {
    console.error(`Error in ${context || 'unknown context'}:`, error)
    
    // Show user-friendly toast
    toast({
      title: "Ett fel uppstod",
      description: context ? `Fel i ${context}: ${error.message}` : error.message,
      variant: "destructive",
    })
    
    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error tracking service
      try {
        fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack,
            },
            context,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
          }),
        })
      } catch (logError) {
        console.error('Failed to log error:', logError)
      }
    }
    
    setHasError(true)
  }, [])

  const clearError = useCallback(() => {
    setHasError(false)
  }, [])

  const handleError = useCallback((error: Error, errorInfo: React.ErrorInfo) => {
    reportError(error, 'React Error Boundary')
  }, [reportError])

  const contextValue: ErrorContextType = {
    reportError,
    clearError,
    hasError,
  }

  return (
    <ErrorContext.Provider value={contextValue}>
      <ErrorBoundary 
        onError={handleError}
        resetOnPropsChange={true}
      >
        {children}
      </ErrorBoundary>
    </ErrorContext.Provider>
  )
}

// Custom hook for async error handling
export function useAsyncError() {
  const { reportError } = useErrorHandler()

  return useCallback((error: Error, context?: string) => {
    reportError(error, context)
  }, [reportError])
}

// Higher-order component for automatic error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: {
    fallback?: ReactNode
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  }
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}