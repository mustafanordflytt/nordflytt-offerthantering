'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingContextType {
  isLoading: boolean
  loadingMessage: string | null
  showLoading: (message?: string) => void
  hideLoading: () => void
  withLoading: <T>(promise: Promise<T>, message?: string) => Promise<T>
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export const useLoading = () => {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider')
  }
  return context
}

interface LoadingProviderProps {
  children: ReactNode
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null)
  const [loadingCount, setLoadingCount] = useState(0)

  const showLoading = useCallback((message?: string) => {
    setLoadingCount(prev => prev + 1)
    setIsLoading(true)
    if (message) {
      setLoadingMessage(message)
    }
  }, [])

  const hideLoading = useCallback(() => {
    setLoadingCount(prev => {
      const newCount = Math.max(0, prev - 1)
      if (newCount === 0) {
        setIsLoading(false)
        setLoadingMessage(null)
      }
      return newCount
    })
  }, [])

  const withLoading = useCallback(async <T,>(
    promise: Promise<T>,
    message?: string
  ): Promise<T> => {
    showLoading(message)
    try {
      const result = await promise
      return result
    } finally {
      hideLoading()
    }
  }, [showLoading, hideLoading])

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        loadingMessage,
        showLoading,
        hideLoading,
        withLoading
      }}
    >
      {children}
      {isLoading && <GlobalLoadingIndicator message={loadingMessage} />}
    </LoadingContext.Provider>
  )
}

interface GlobalLoadingIndicatorProps {
  message?: string | null
}

const GlobalLoadingIndicator: React.FC<GlobalLoadingIndicatorProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl p-6 flex flex-col items-center space-y-3 max-w-sm">
        <Loader2 className="h-10 w-10 animate-spin text-[#002A5C]" />
        <p className="text-sm font-medium text-gray-700">
          {message || 'Laddar...'}
        </p>
      </div>
    </div>
  )
}

// Hook för att använda loading state i komponenter
export const useAsyncAction = () => {
  const { withLoading } = useLoading()
  
  const execute = useCallback(async <T,>(
    action: () => Promise<T>,
    options?: {
      loadingMessage?: string
      errorMessage?: string
      successMessage?: string
      onError?: (error: Error) => void
      onSuccess?: (result: T) => void
    }
  ): Promise<T | undefined> => {
    try {
      const result = await withLoading(
        action(),
        options?.loadingMessage
      )
      
      if (options?.onSuccess) {
        options.onSuccess(result)
      }
      
      if (options?.successMessage) {
        // Här kan vi lägga till toast notification senare
        console.log('Success:', options.successMessage)
      }
      
      return result
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Ett fel uppstod')
      
      if (options?.onError) {
        options.onError(err)
      } else {
        console.error('Async action error:', err)
        // Här kan vi lägga till toast notification senare
      }
      
      return undefined
    }
  }, [withLoading])
  
  return { execute }
}