const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Log API URL to help debug (both dev and production)
console.log('[API Config] API_URL:', API_URL)
console.log('[API Config] VITE_API_URL env:', import.meta.env.VITE_API_URL || 'NOT SET')
console.log('[API Config] Environment:', import.meta.env.MODE)

// Warn if using localhost in production (Railway deployment issue)
if (import.meta.env.MODE === 'production' && API_URL.includes('localhost')) {
  console.error('⚠️ [CRITICAL] Frontend is using localhost in production!')
  console.error('⚠️ This means VITE_API_URL was not set when the frontend was built.')
  console.error('⚠️ Solution: Set VITE_API_URL in Railway frontend service variables, then redeploy.')
}

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token')
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const url = `${API_URL}${endpoint}`
  
  // Log request in development
  if (import.meta.env.DEV) {
    console.log('API Request:', url)
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    const errorObj = new Error(error.error || 'Request failed') as any
    errorObj.error = error.error || 'Request failed'
    errorObj.details = error.details
    throw errorObj
  }

  return response.json()
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('token')
}

export function getCurrentUser() {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
}

