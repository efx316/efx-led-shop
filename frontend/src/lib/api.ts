const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token')
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
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

