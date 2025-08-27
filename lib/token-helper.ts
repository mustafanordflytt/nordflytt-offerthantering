// Token helper utilities for authentication

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token') || localStorage.getItem('crm-token');
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_token', token);
  localStorage.setItem('crm-token', token); // For backward compatibility
}

export function removeAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
  localStorage.removeItem('crm-token'); // For backward compatibility
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

// Re-export the function from auth/token-helper for backward compatibility
export { getAuthHeaders } from './auth/token-helper';