'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Full page loading spinner
export function PageLoader({ message = "Laddar..." }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </div>
  )
}

// Section loading spinner
export function SectionLoader({ 
  className,
  message = "Laddar..." 
}: { 
  className?: string
  message?: string 
}) {
  return (
    <div className={cn(
      "flex items-center justify-center p-8",
      className
    )}>
      <div className="text-center space-y-4">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto" />
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </div>
  )
}

// Inline loading spinner
export function InlineLoader({ 
  size = "sm",
  className 
}: { 
  size?: "xs" | "sm" | "md" | "lg"
  className?: string 
}) {
  const sizeClasses = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  }

  return (
    <Loader2 
      className={cn(
        "animate-spin text-blue-600",
        sizeClasses[size],
        className
      )} 
    />
  )
}

// Button loading state
export function ButtonLoader({ 
  loading,
  children,
  loadingText = "Laddar..."
}: {
  loading: boolean
  children: React.ReactNode
  loadingText?: string
}) {
  if (!loading) return <>{children}</>
  
  return (
    <span className="flex items-center justify-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      {loadingText}
    </span>
  )
}

// Job card skeleton
export function JobCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border shadow-sm p-6 animate-pulse">
      <div className="space-y-4">
        {/* Status badge skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
          <div className="h-4 w-20 bg-gray-200 rounded"></div>
        </div>
        
        {/* Title skeleton */}
        <div className="h-6 w-3/4 bg-gray-200 rounded"></div>
        
        {/* Details skeleton */}
        <div className="space-y-2">
          <div className="h-4 w-full bg-gray-200 rounded"></div>
          <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
          <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
        </div>
        
        {/* Button skeleton */}
        <div className="h-10 w-full bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  )
}

// Job list skeleton
export function JobListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <JobCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Stats card skeleton
export function StatsCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border p-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
        <div className="h-8 w-1/3 bg-gray-200 rounded"></div>
      </div>
    </div>
  )
}

// Table skeleton
export function TableSkeleton({ 
  rows = 5, 
  columns = 4 
}: { 
  rows?: number
  columns?: number 
}) {
  return (
    <div className="overflow-hidden rounded-lg border animate-pulse">
      {/* Header */}
      <div className="bg-gray-50 border-b">
        <div className="flex p-4 gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded flex-1"></div>
          ))}
        </div>
      </div>
      
      {/* Body */}
      <div className="bg-white">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex p-4 gap-4 border-b last:border-0">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div 
                key={colIndex} 
                className="h-4 bg-gray-200 rounded flex-1"
                style={{
                  width: `${Math.random() * 40 + 60}%`
                }}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// Form skeleton
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-1/4 bg-gray-200 rounded"></div>
          <div className="h-10 w-full bg-gray-200 rounded-md"></div>
        </div>
      ))}
      <div className="h-10 w-full bg-gray-200 rounded-md mt-6"></div>
    </div>
  )
}

// Loading overlay
export function LoadingOverlay({ 
  visible,
  message = "Bearbetar..." 
}: { 
  visible: boolean
  message?: string 
}) {
  if (!visible) return null
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-lg space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </div>
  )
}