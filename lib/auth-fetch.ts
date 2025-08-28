/**
 * Authenticated fetch wrapper
 * Automatically includes JWT token from localStorage
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // Get auth data from localStorage
  if (typeof window === 'undefined') {
    throw new Error('authFetch can only be used in browser environment')
  }
  
  const authData = localStorage.getItem('staff_auth')
  
  if (!authData) {
    throw new Error('Not authenticated')
  }

  try {
    const parsedAuth = JSON.parse(authData)
    
    if (!parsedAuth.token) {
      throw new Error('No auth token')
    }

    // Add Authorization header
    const headers = new Headers(options.headers || {})
    headers.set('Authorization', `Bearer ${parsedAuth.token}`)

    return fetch(url, {
      ...options,
      headers
    })

  } catch (error) {
    console.error('Auth fetch error:', error)
    // Redirect to login on auth error
    if (typeof window !== 'undefined') {
      window.location.href = '/staff/login'
    }
    throw error
  }
}

// Convenience methods
export const authApi = {
  get: (url: string, options?: RequestInit) => 
    authFetch(url, { ...options, method: 'GET' }),
  
  post: (url: string, body?: any, options?: RequestInit) => 
    authFetch(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      body: body ? JSON.stringify(body) : undefined
    }),
  
  put: (url: string, body?: any, options?: RequestInit) => 
    authFetch(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      body: body ? JSON.stringify(body) : undefined
    }),
  
  delete: (url: string, options?: RequestInit) => 
    authFetch(url, { ...options, method: 'DELETE' })
}