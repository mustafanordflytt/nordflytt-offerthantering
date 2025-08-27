'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle } from 'lucide-react'

interface AsyncState<T> {
  status: 'idle' | 'loading' | 'success' | 'error'
  data?: T
  error?: Error
}

interface Props<T> {
  children: (state: AsyncState<T>) => ReactNode
  promise: Promise<T>
  fallback?: ReactNode
  onError?: (error: Error) => void
}

interface State<T> extends AsyncState<T> {
  hasError: boolean
}

export default class AsyncErrorBoundary<T> extends Component<Props<T>, State<T>> {
  private isMounted = false

  constructor(props: Props<T>) {
    super(props)
    this.state = {
      status: 'idle',
      hasError: false
    }
  }

  componentDidMount() {
    this.isMounted = true
    this.executePromise()
  }

  componentWillUnmount() {
    this.isMounted = false
  }

  componentDidUpdate(prevProps: Props<T>) {
    if (prevProps.promise !== this.props.promise) {
      this.executePromise()
    }
  }

  static getDerivedStateFromError<T>(error: Error): Partial<State<T>> {
    return {
      status: 'error',
      error,
      hasError: true
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AsyncErrorBoundary caught an error:', error, errorInfo)
    this.props.onError?.(error)
  }

  executePromise = async () => {
    if (!this.isMounted) return

    this.setState({ status: 'loading', hasError: false })

    try {
      const data = await this.props.promise
      
      if (this.isMounted) {
        this.setState({ 
          status: 'success', 
          data, 
          error: undefined,
          hasError: false 
        })
      }
    } catch (error) {
      if (this.isMounted) {
        this.setState({ 
          status: 'error', 
          error: error as Error,
          hasError: true 
        })
        this.props.onError?.(error as Error)
      }
    }
  }

  handleRetry = () => {
    this.executePromise()
  }

  render() {
    if (this.state.hasError && this.props.fallback) {
      return this.props.fallback
    }

    // Default error UI for async operations
    if (this.state.status === 'error') {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Ett fel uppstod
          </h3>
          <p className="text-sm text-gray-600 mb-4 max-w-sm">
            {this.state.error?.message || 'Något gick fel vid laddning av data'}
          </p>
          <Button onClick={this.handleRetry} size="sm">
            Försök igen
          </Button>
        </div>
      )
    }

    return this.props.children(this.state)
  }
}

// Hook version for functional components
export function useAsyncErrorBoundary() {
  const [state, setState] = React.useState<{ error?: Error }>({})

  const resetError = React.useCallback(() => {
    setState({})
  }, [])

  const captureError = React.useCallback((error: Error) => {
    setState({ error })
  }, [])

  React.useEffect(() => {
    if (state.error) {
      throw state.error
    }
  }, [state.error])

  return { captureError, resetError }
}

// Suspense-like component for async operations
interface AsyncComponentProps<T> {
  promise: Promise<T>
  children: (data: T) => ReactNode
  fallback?: ReactNode
  errorFallback?: (error: Error, retry: () => void) => ReactNode
}

export function AsyncComponent<T>({ 
  promise, 
  children, 
  fallback, 
  errorFallback 
}: AsyncComponentProps<T>) {
  return (
    <AsyncErrorBoundary
      promise={promise}
      fallback={fallback}
      onError={(error) => console.error('Async component error:', error)}
    >
      {(state) => {
        switch (state.status) {
          case 'loading':
            return fallback || (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Laddar...</span>
              </div>
            )

          case 'success':
            return state.data ? children(state.data) : null

          case 'error':
            return errorFallback ? (
              errorFallback(state.error!, () => window.location.reload())
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-red-800">Ett fel uppstod: {state.error?.message}</p>
              </div>
            )

          default:
            return null
        }
      }}
    </AsyncErrorBoundary>
  )
}