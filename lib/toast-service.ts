import { toast as sonnerToast } from 'sonner'
import { CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react'

export interface ToastOptions {
  duration?: number
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  action?: {
    label: string
    onClick: () => void
  }
}

class ToastService {
  // Success toast med grön ikon
  success(message: string, options?: ToastOptions) {
    return sonnerToast.success(message, {
      duration: options?.duration || 4000,
      position: options?.position || 'bottom-right',
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
      action: options?.action,
      className: 'bg-white border border-green-200',
    })
  }

  // Error toast med röd ikon
  error(message: string, options?: ToastOptions) {
    return sonnerToast.error(message, {
      duration: options?.duration || 6000,
      position: options?.position || 'bottom-right',
      icon: <XCircle className="h-5 w-5 text-red-600" />,
      action: options?.action,
      className: 'bg-white border border-red-200',
    })
  }

  // Warning toast med orange ikon
  warning(message: string, options?: ToastOptions) {
    return sonnerToast(message, {
      duration: options?.duration || 5000,
      position: options?.position || 'bottom-right',
      icon: <AlertTriangle className="h-5 w-5 text-orange-600" />,
      action: options?.action,
      className: 'bg-white border border-orange-200',
    })
  }

  // Info toast med blå ikon
  info(message: string, options?: ToastOptions) {
    return sonnerToast(message, {
      duration: options?.duration || 4000,
      position: options?.position || 'bottom-right',
      icon: <Info className="h-5 w-5 text-blue-600" />,
      action: options?.action,
      className: 'bg-white border border-blue-200',
    })
  }

  // Loading toast som kan uppdateras
  loading(message: string, options?: ToastOptions) {
    return sonnerToast(message, {
      duration: Infinity,
      position: options?.position || 'bottom-right',
      icon: <Loader2 className="h-5 w-5 animate-spin text-[#002A5C]" />,
      className: 'bg-white border border-gray-200',
    })
  }

  // Promise-baserad toast för async operations
  async promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    },
    options?: ToastOptions
  ): Promise<T> {
    return sonnerToast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
      position: options?.position || 'bottom-right',
    })
  }

  // Dismiss en specifik toast
  dismiss(toastId?: string | number) {
    sonnerToast.dismiss(toastId)
  }

  // Custom toast för special cases
  custom(jsx: React.ReactNode, options?: ToastOptions) {
    return sonnerToast.custom(jsx, {
      duration: options?.duration || 4000,
      position: options?.position || 'bottom-right',
    })
  }

  // API response handler
  handleApiResponse(response: { success: boolean; message?: string }) {
    if (response.success) {
      this.success(response.message || 'Operation lyckades')
    } else {
      this.error(response.message || 'Ett fel uppstod')
    }
  }

  // Form validation errors
  showValidationErrors(errors: Record<string, string[]>) {
    const errorCount = Object.keys(errors).length
    const firstError = Object.values(errors)[0]?.[0]
    
    if (errorCount === 1 && firstError) {
      this.error(firstError)
    } else if (errorCount > 1) {
      this.error(`${errorCount} valideringsfel hittades`, {
        action: {
          label: 'Visa alla',
          onClick: () => {
            Object.entries(errors).forEach(([field, messages]) => {
              messages.forEach(message => {
                this.error(`${field}: ${message}`)
              })
            })
          }
        }
      })
    }
  }

  // Network error handler
  handleNetworkError(error: any) {
    if (!navigator.onLine) {
      this.error('Ingen internetanslutning', {
        action: {
          label: 'Försök igen',
          onClick: () => window.location.reload()
        }
      })
    } else if (error.code === 'NETWORK_ERROR') {
      this.error('Nätverksfel. Kontrollera din anslutning.')
    } else {
      this.error('Ett oväntat fel uppstod')
    }
  }
}

// Export singleton instance
export const toast = new ToastService()

// Export types for TypeScript
export type { ToastOptions }