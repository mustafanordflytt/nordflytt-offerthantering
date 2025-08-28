'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

interface SearchParamsWrapperProps {
  children: (searchParams: URLSearchParams) => React.ReactNode
  fallback?: React.ReactNode
}

function SearchParamsComponent({ children }: { children: (searchParams: URLSearchParams) => React.ReactNode }) {
  const searchParams = useSearchParams()
  return <>{children(searchParams)}</>
}

export function SearchParamsWrapper({ children, fallback = null }: SearchParamsWrapperProps) {
  return (
    <Suspense fallback={fallback}>
      <SearchParamsComponent>{children}</SearchParamsComponent>
    </Suspense>
  )
}