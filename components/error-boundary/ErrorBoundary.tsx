'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  resetOnPropsChange?: boolean
  resetKeys?: Array<string | number>
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  errorId: string
}

export default class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: NodeJS.Timeout | null = null

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      errorId: ''
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Update state with error details
    this.setState({
      error,
      errorInfo,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    })

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught an Error')
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.error('Component Stack:', errorInfo.componentStack)
      console.groupEnd()
    }

    // Call custom error handler
    this.props.onError?.(error, errorInfo)

    // Log to external error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo)
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetOnPropsChange, resetKeys } = this.props
    
    // Reset error state when props change (if enabled)
    if (resetOnPropsChange && prevProps.children !== this.props.children) {
      if (this.state.hasError) {
        this.resetError()
      }
    }

    // Reset error state when specific keys change
    if (resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some((key, index) => 
        prevProps.resetKeys?.[index] !== key
      )
      
      if (hasResetKeyChanged && this.state.hasError) {
        this.resetError()
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // In production, integrate with error tracking service
    // Example: Sentry, LogRocket, Bugsnag, etc.
    try {
      const errorData = {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        errorInfo: {
          componentStack: errorInfo.componentStack,
        },
        context: {
          url: typeof window !== 'undefined' ? window.location.href : 'unknown',
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
          timestamp: new Date().toISOString(),
          errorId: this.state.errorId,
        }
      }

      // Example API call (replace with your error tracking service)
      fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData),
      }).catch(err => {
        console.error('Failed to log error to service:', err)
      })
    } catch (err) {
      console.error('Error logging to service:', err)
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: ''
    })
  }

  handleRetry = () => {
    this.resetError()
  }

  handleRefresh = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/staff/dashboard'
    }
  }

  reportError = () => {
    const { error, errorInfo, errorId } = this.state
    
    if (error) {
      const errorReport = {
        id: errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }
      
      // Create email body
      const emailBody = encodeURIComponent(`
Fel-ID: ${errorId}
Tidpunkt: ${errorReport.timestamp}
URL: ${errorReport.url}

Felmeddelande: ${error.message}

Stack Trace:
${error.stack}

Component Stack:
${errorInfo?.componentStack}

Browser: ${navigator.userAgent}
      `)
      
      const mailtoLink = `mailto:support@nordflytt.se?subject=Fel i Staff App - ${errorId}&body=${emailBody}`
      window.open(mailtoLink, '_blank')
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { error, errorId } = this.state
      const isNetworkError = error?.message?.includes('fetch') || error?.message?.includes('network')
      const isDevelopment = process.env.NODE_ENV === 'development'

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-xl text-red-800">
                {isNetworkError ? 'Anslutningsfel' : 'Ett fel uppstod'}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {isNetworkError 
                  ? 'Det gick inte att ansluta till servern. Kontrollera din internetanslutning.'
                  : 'Något gick fel i appen. Vi arbetar på att lösa problemet.'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {isDevelopment && error && (
                <div className="bg-gray-100 p-3 rounded-md text-xs font-mono">
                  <p className="font-semibold text-red-600 mb-1">Development Error:</p>
                  <p className="text-gray-800">{error.message}</p>
                </div>
              )}
              
              <div className="text-xs text-gray-500 text-center">
                Fel-ID: {errorId}
              </div>
              
              <div className="flex flex-col space-y-2">
                <Button 
                  onClick={this.handleRetry} 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Försök igen
                </Button>
                
                <div className="flex space-x-2">
                  <Button 
                    onClick={this.handleGoHome} 
                    variant="outline"
                    className="flex-1"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Hem
                  </Button>
                  
                  <Button 
                    onClick={this.handleRefresh} 
                    variant="outline"
                    className="flex-1"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Ladda om
                  </Button>
                </div>
                
                <Button 
                  onClick={this.reportError}
                  variant="ghost" 
                  size="sm"
                  className="text-gray-600"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  Rapportera fel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}