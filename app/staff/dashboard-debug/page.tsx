'use client'

import { Component, ReactNode } from 'react'
import dynamic from 'next/dynamic'

// Error boundary to catch errors
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: any }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error }
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Dashboard Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
          <h1>Dashboard Error</h1>
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '10px', 
            borderRadius: '5px',
            overflow: 'auto' 
          }}>
            {this.state.error?.toString()}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
          <button 
            onClick={() => window.location.href = '/staff'}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Go to Login
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// Load dashboard dynamically with no SSR
const StaffDashboard = dynamic(
  () => import('../dashboard/page'),
  { 
    ssr: false,
    loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>Loading dashboard...</div>
  }
)

export default function DebugDashboard() {
  return (
    <ErrorBoundary>
      <StaffDashboard />
    </ErrorBoundary>
  )
}