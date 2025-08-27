'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo)
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to Sentry or similar
      // Sentry.captureException(error, { extra: errorInfo })
    }

    this.setState({ errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      const isDevelopment = process.env.NODE_ENV === 'development'

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-center text-2xl">Något gick fel</CardTitle>
              <CardDescription className="text-center">
                Vi beklagar, men något oväntat har hänt. Försök igen eller kontakta support om problemet kvarstår.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {isDevelopment && this.state.error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTitle className="font-mono text-sm">
                    {this.state.error.name}
                  </AlertTitle>
                  <AlertDescription className="font-mono text-xs mt-2">
                    {this.state.error.message}
                  </AlertDescription>
                  {this.state.errorInfo && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-xs font-semibold">
                        Stack trace
                      </summary>
                      <pre className="mt-2 text-xs overflow-x-auto whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </Alert>
              )}

              <div className="space-y-2">
                <Button 
                  onClick={this.handleReset} 
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Försök igen
                </Button>
                
                <Button 
                  onClick={this.handleReload} 
                  variant="outline"
                  className="w-full"
                >
                  Ladda om sidan
                </Button>
                
                <Button 
                  onClick={this.handleHome} 
                  variant="ghost"
                  className="w-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Tillbaka till startsidan
                </Button>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-2 text-sm text-gray-600">
              <p>Behöver du hjälp?</p>
              <div className="flex flex-col items-center space-y-1">
                <a href="tel:010-555-12-89" className="text-blue-600 hover:underline">
                  010-555 12 89
                </a>
                <a href="mailto:support@nordflytt.se" className="text-blue-600 hover:underline">
                  support@nordflytt.se
                </a>
              </div>
            </CardFooter>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook version for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error handled:', error, errorInfo)
    }
    
    // In production, send to error tracking
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to Sentry
    }
  }
}

// Simple error fallback component
export function ErrorFallback({ 
  error, 
  resetError 
}: { 
  error?: Error
  resetError?: () => void 
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
      <h2 className="text-xl font-semibold mb-2">Något gick fel</h2>
      <p className="text-gray-600 text-center mb-4 max-w-md">
        Ett oväntat fel uppstod. Försök igen eller kontakta support.
      </p>
      {resetError && (
        <Button onClick={resetError} variant="default">
          <RefreshCw className="w-4 h-4 mr-2" />
          Försök igen
        </Button>
      )}
    </div>
  )
}

// Async error boundary for Suspense
export function AsyncErrorBoundary({ 
  children,
  fallback
}: { 
  children: ReactNode
  fallback?: ReactNode
}) {
  return (
    <ErrorBoundary fallback={fallback}>
      {children}
    </ErrorBoundary>
  )
}