import { toast } from 'sonner'

interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffFactor?: number
  retryCondition?: (error: any) => boolean
  onRetry?: (attempt: number, error: any) => void
}

interface ApiOptions extends RequestInit {
  timeout?: number
  retry?: RetryOptions | boolean
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: (error) => {
    // Retry on network errors or 5xx status codes
    if (!error.response) return true
    return error.response.status >= 500 && error.response.status < 600
  }
}

class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: Response,
    public data?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Sleep function for delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Calculate delay with exponential backoff
const calculateDelay = (
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffFactor: number
): number => {
  const delay = initialDelay * Math.pow(backoffFactor, attempt - 1)
  return Math.min(delay, maxDelay)
}

// Fetch with timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number }
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

// Main API client with retry logic
export async function apiClient<T = any>(
  url: string,
  options: ApiOptions = {}
): Promise<T> {
  const {
    retry = true,
    timeout = 30000,
    ...fetchOptions
  } = options

  // Merge retry options
  const retryOptions = retry === true
    ? DEFAULT_RETRY_OPTIONS
    : retry === false
    ? { maxRetries: 0 }
    : { ...DEFAULT_RETRY_OPTIONS, ...retry }

  let lastError: any
  
  for (let attempt = 1; attempt <= (retryOptions.maxRetries || 0) + 1; attempt++) {
    try {
      const response = await fetchWithTimeout(url, {
        ...fetchOptions,
        timeout
      })

      // Handle non-OK responses
      if (!response.ok) {
        const error = new ApiError(
          `API request failed: ${response.statusText}`,
          response.status,
          response
        )

        // Try to parse error response
        try {
          error.data = await response.json()
        } catch {
          // Ignore JSON parse errors
        }

        throw error
      }

      // Parse successful response
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        return await response.json()
      }
      
      return response as any
    } catch (error: any) {
      lastError = error

      // Check if we should retry
      const shouldRetry = attempt <= (retryOptions.maxRetries || 0) &&
        (retryOptions.retryCondition?.(error) ?? true)

      if (!shouldRetry) {
        throw error
      }

      // Calculate delay
      const delay = calculateDelay(
        attempt,
        retryOptions.initialDelay || 1000,
        retryOptions.maxDelay || 10000,
        retryOptions.backoffFactor || 2
      )

      // Call onRetry callback
      retryOptions.onRetry?.(attempt, error)

      // Log retry in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Retrying API request (attempt ${attempt}/${retryOptions.maxRetries}):`, url)
      }

      // Wait before retrying
      await sleep(delay)
    }
  }

  throw lastError
}

// Convenience methods
export const api = {
  get: <T = any>(url: string, options?: ApiOptions) =>
    apiClient<T>(url, { ...options, method: 'GET' }),

  post: <T = any>(url: string, data?: any, options?: ApiOptions) =>
    apiClient<T>(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      body: data ? JSON.stringify(data) : undefined
    }),

  put: <T = any>(url: string, data?: any, options?: ApiOptions) =>
    apiClient<T>(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      body: data ? JSON.stringify(data) : undefined
    }),

  patch: <T = any>(url: string, data?: any, options?: ApiOptions) =>
    apiClient<T>(url, {
      ...options,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      body: data ? JSON.stringify(data) : undefined
    }),

  delete: <T = any>(url: string, options?: ApiOptions) =>
    apiClient<T>(url, { ...options, method: 'DELETE' })
}

// Helper function to handle API errors in UI
export function handleApiError(error: any): string {
  if (error.name === 'AbortError') {
    return 'Begäran tog för lång tid'
  }

  if (error instanceof ApiError) {
    if (error.status === 404) {
      return 'Resursen hittades inte'
    }
    if (error.status === 401) {
      return 'Du måste logga in'
    }
    if (error.status === 403) {
      return 'Du har inte behörighet'
    }
    if (error.status === 429) {
      return 'För många förfrågningar, försök igen senare'
    }
    if (error.status && error.status >= 500) {
      return 'Serverfel, försök igen senare'
    }
    
    // Check for error message in response data
    if (error.data?.message) {
      return error.data.message
    }
    if (error.data?.error) {
      return error.data.error
    }
  }

  if (error.message) {
    return error.message
  }

  return 'Ett oväntat fel uppstod'
}

// React hook for API calls with loading state
import { useState, useCallback } from 'react'

export function useApi<T = any>() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<T | null>(null)

  const execute = useCallback(async (
    url: string,
    options?: ApiOptions
  ): Promise<T | null> => {
    setLoading(true)
    setError(null)

    try {
      const result = await apiClient<T>(url, options)
      setData(result)
      return result
    } catch (err: any) {
      setError(err)
      const errorMessage = handleApiError(err)
      toast.error(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    data,
    loading,
    error,
    execute
  }
}

// Example usage:
/*
// Basic usage
const data = await api.get('/api/users')

// With retry options
const data = await api.post('/api/bookings', bookingData, {
  retry: {
    maxRetries: 5,
    onRetry: (attempt, error) => {
      console.log(`Retry attempt ${attempt}:`, error)
    }
  }
})

// With custom retry condition
const data = await api.get('/api/external-service', {
  retry: {
    retryCondition: (error) => {
      // Only retry on specific errors
      return error.status === 503 || !error.response
    }
  }
})

// Using the hook
function MyComponent() {
  const { data, loading, error, execute } = useApi<User[]>()
  
  useEffect(() => {
    execute('/api/users')
  }, [])
  
  if (loading) return <Spinner />
  if (error) return <Error message={handleApiError(error)} />
  if (!data) return null
  
  return <UserList users={data} />
}
*/