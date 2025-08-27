import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  label?: string
}

export function LoadingSpinner({ 
  size = 'md', 
  className,
  label = 'Laddar...'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  }

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-b-2 border-gray-900',
          sizeClasses[size]
        )}
        role="status"
        aria-label={label}
      />
      {label && (
        <span className="sr-only">{label}</span>
      )}
    </div>
  )
}

// Full page loading spinner
export function PageLoadingSpinner({ message = 'Laddar...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mb-4" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )
}

// Inline loading spinner
export function InlineLoadingSpinner({ 
  className,
  label = 'Laddar...' 
}: { 
  className?: string
  label?: string 
}) {
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <LoadingSpinner size="sm" />
      <span className="text-sm text-gray-600">{label}</span>
    </div>
  )
}

// Button loading state
export function ButtonLoadingSpinner({ 
  loading,
  children,
  loadingText = 'Vänta...'
}: {
  loading?: boolean
  children: React.ReactNode
  loadingText?: string
}) {
  if (loading) {
    return (
      <div className="inline-flex items-center gap-2">
        <LoadingSpinner size="sm" />
        <span>{loadingText}</span>
      </div>
    )
  }
  
  return <>{children}</>
}

// Skeleton loader for content
export function ContentSkeleton({ 
  lines = 3,
  className 
}: { 
  lines?: number
  className?: string 
}) {
  return (
    <div className={cn('animate-pulse', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 bg-gray-200 rounded mb-2',
            i === lines - 1 && 'w-3/4'
          )}
        />
      ))}
    </div>
  )
}

// Card skeleton loader
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-white rounded-lg shadow-sm p-6 animate-pulse', className)}>
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
      <ContentSkeleton lines={3} />
    </div>
  )
}