'use client'

import React, { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, AlertTriangle, Bug, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  showReload?: boolean
  showHomeButton?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  errorId: string
}

class CRMErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `crm_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
      errorId: `crm_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    })

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 CRM Error Boundary Caught Error')
      console.error('Error:', error)
      console.error('Component Stack:', errorInfo.componentStack)
      console.groupEnd()
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Send error to logging service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo)
    }
  }

  private async reportError(error: Error, errorInfo: React.ErrorInfo) {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack
          },
          context: 'CRM Error Boundary',
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          componentStack: errorInfo.componentStack,
          additionalInfo: {
            errorId: this.state.errorId,
            module: 'CRM'
          }
        })
      })
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    })
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default CRM error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Bug className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Något gick fel i CRM-systemet
              </CardTitle>
              <CardDescription>
                Ett oväntat fel uppstod. Vi har automatiskt rapporterat problemet.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="font-mono text-xs">
                    <strong>{this.state.error.name}:</strong> {this.state.error.message}
                  </AlertDescription>
                </Alert>
              )}

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">
                  <strong>Fel-ID:</strong> <code className="text-xs">{this.state.errorId}</code>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Referera till detta ID när du kontaktar support
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <Button
                  onClick={this.handleRetry}
                  className="w-full bg-[#002A5C] hover:bg-[#001a42]"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Försök igen
                </Button>

                {this.props.showReload !== false && (
                  <Button
                    onClick={this.handleReload}
                    variant="outline"
                    className="w-full"
                  >
                    Ladda om sidan
                  </Button>
                )}

                {this.props.showHomeButton !== false && (
                  <CRMHomeButton />
                )}
              </div>

              <div className="text-center text-sm text-gray-500">
                <p>
                  Om problemet kvarstår, kontakta systemadministratör eller
                  <br />
                  <a 
                    href="mailto:support@nordflytt.se" 
                    className="text-[#002A5C] hover:underline"
                  >
                    support@nordflytt.se
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Wrapper component for router access
function CRMHomeButton() {
  const router = useRouter()
  
  return (
    <Button
      onClick={() => router.push('/crm/dashboard')}
      variant="ghost"
      className="w-full"
    >
      <Home className="w-4 h-4 mr-2" />
      Tillbaka till CRM Dashboard
    </Button>
  )
}

// Main export with better TypeScript support
export default function CRMErrorBoundary(props: Props) {
  return <CRMErrorBoundaryClass {...props} />
}

// Specialized error boundaries for different CRM sections
export function CustomerErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <CRMErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Customer module error:', error)
      }}
    >
      {children}
    </CRMErrorBoundary>
  )
}

export function DashboardErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <CRMErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Dashboard module error:', error)
      }}
      fallback={
        <div className="p-6 text-center">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Dashboard kunde inte laddas</CardTitle>
              <CardDescription>
                Det uppstod ett problem med att ladda dashboard-data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => window.location.reload()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Ladda om
              </Button>
            </CardContent>
          </Card>
        </div>
      }
    >
      {children}
    </CRMErrorBoundary>
  )
}

export function JobsErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <CRMErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Jobs module error:', error)
      }}
    >
      {children}
    </CRMErrorBoundary>
  )
}

export function LeadsErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <CRMErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Leads module error:', error)
      }}
    >
      {children}
    </CRMErrorBoundary>
  )
}

// Hook for programmatic error reporting
export function useCRMErrorReporting() {
  const reportError = async (error: Error, context: string, additionalInfo?: Record<string, any>) => {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack
          },
          context: `CRM ${context}`,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          additionalInfo: {
            ...additionalInfo,
            module: 'CRM',
            reportedProgrammatically: true
          }
        })
      })
    } catch (reportingError) {
      console.error('Failed to report CRM error:', reportingError)
    }
  }

  return { reportError }
}