'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react'

interface Props {
  children: ReactNode
  fallbackComponent?: React.ComponentType<{ error: Error; retry: () => void }>
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  resetOnPropsChange?: boolean
}

interface State {
  hasError: boolean
  error?: Error
  isNetworkError: boolean
  retryCount: number
}

export default class ApiErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      isNetworkError: false,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): State {
    const isNetworkError = error.message?.includes('fetch') || 
                          error.message?.includes('network') ||
                          error.message?.includes('Failed to fetch') ||
                          error.name === 'TypeError'

    return {
      hasError: true,
      error,
      isNetworkError,
      retryCount: 0
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('API Error Boundary caught an error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.resetOnPropsChange && 
        prevProps.children !== this.props.children && 
        this.state.hasError) {
      this.resetError()
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: undefined,
      isNetworkError: false,
      retryCount: 0
    })
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      retryCount: prevState.retryCount + 1
    }))
  }

  render() {
    if (this.state.hasError) {
      const { error, isNetworkError, retryCount } = this.state

      // Use custom fallback component if provided
      if (this.props.fallbackComponent) {
        const FallbackComponent = this.props.fallbackComponent
        return <FallbackComponent error={error!} retry={this.handleRetry} />
      }

      // Default API error UI
      return (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-3">
              {isNetworkError ? (
                <WifiOff className="w-5 h-5 text-orange-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              )}
              <div>
                <CardTitle className="text-lg text-orange-800">
                  {isNetworkError ? 'Anslutningsproblem' : 'API-fel'}
                </CardTitle>
                <CardDescription className="text-orange-700">
                  {isNetworkError 
                    ? 'Kunde inte ansluta till servern'
                    : 'Ett fel uppstod vid kommunikation med servern'
                  }
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="space-y-3">
              {error && (
                <div className="text-sm text-orange-700 bg-orange-100 p-2 rounded">
                  {error.message}
                </div>
              )}
              
              {retryCount > 0 && (
                <div className="text-xs text-orange-600">
                  Försök {retryCount + 1}
                </div>
              )}
              
              <Button 
                onClick={this.handleRetry}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Försök igen
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

// Specialized network error boundary for API calls
export class NetworkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      isNetworkError: false,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // Only catch network-related errors
    const isNetworkError = error.message?.includes('fetch') || 
                          error.message?.includes('network') ||
                          error.message?.includes('Failed to fetch') ||
                          error.name === 'TypeError' ||
                          error.message?.includes('500') ||
                          error.message?.includes('502') ||
                          error.message?.includes('503') ||
                          error.message?.includes('504')

    if (!isNetworkError) {
      // Re-throw the error if it's not network-related
      throw error
    }

    return {
      hasError: true,
      error,
      isNetworkError: true,
      retryCount: 0
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Network Error Boundary caught an error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: undefined,
      isNetworkError: false,
      retryCount: 0
    })
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      retryCount: prevState.retryCount + 1
    }))
  }

  render() {
    if (this.state.hasError && this.state.isNetworkError) {
      const { retryCount } = this.state

      return (
        <div className="flex items-center justify-center p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <WifiOff className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-800">
                Anslutningsfel
              </p>
              <p className="text-xs text-red-600">
                Kontrollera din internetanslutning
                {retryCount > 0 && ` (Försök ${retryCount + 1})`}
              </p>
            </div>
            <Button
              onClick={this.handleRetry}
              size="sm"
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}