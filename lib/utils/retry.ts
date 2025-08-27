import { toast } from "sonner"

export interface RetryOptions {
  maxAttempts?: number
  baseDelay?: number
  maxDelay?: number
  shouldRetry?: (error: any) => boolean
  onRetry?: (error: any, attempt: number) => void
}

export interface RetryError extends Error {
  attempts: number
  lastError: any
}

export async function retryFetch<T>(
  operation: () => Promise<T>,
  {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 5000,
    shouldRetry = () => true,
    onRetry
  }: RetryOptions = {}
): Promise<T> {
  let lastError: any
  let attempt = 1

  while (attempt <= maxAttempts) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      if (attempt === maxAttempts || !shouldRetry(error)) {
        const retryError = new Error(
          `Operation failed after ${attempt} attempts`
        ) as RetryError
        retryError.attempts = attempt
        retryError.lastError = lastError
        throw retryError
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay)
      
      // Notify user about retry
      toast.info(`Försöker igen (${attempt}/${maxAttempts})`, {
        description: "Ett tillfälligt problem uppstod. Vi försöker igen automatiskt.",
      })

      if (onRetry) {
        onRetry(error, attempt)
      }

      await new Promise(resolve => setTimeout(resolve, delay))
      attempt++
    }
  }

  // This should never happen due to the throw above
  throw new Error("Unexpected retry loop exit")
}

// Specialiserad version för Google Maps API
export async function retryGoogleMapsOperation<T>(
  operation: () => Promise<T>,
  options: Omit<RetryOptions, "shouldRetry"> = {}
): Promise<T> {
  return retryFetch(operation, {
    ...options,
    shouldRetry: (error) => {
      // Specifika Google Maps API fel som vi vill försöka igen på
      const retryableErrors = [
        "OVER_QUERY_LIMIT",
        "TIMEOUT",
        "UNKNOWN_ERROR"
      ]
      
      if (error?.code && retryableErrors.includes(error.code)) {
        return true
      }
      
      return false
    },
    onRetry: (error, attempt) => {
      console.warn(`Google Maps operation failed (attempt ${attempt}):`, error)
    }
  })
} 