import { useState } from 'react'
import { useLocation, Link } from 'wouter'
import { apiRequest } from '../lib/api'
import { useLightStudio } from '../contexts/LightStudioContext'

export default function Login() {
  const { state } = useLightStudio()
  const { enabled } = state
  const [, setLocation] = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Get redirect parameter from URL
  const params = new URLSearchParams(window.location.search)
  const redirect = params.get('redirect') || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      // Store token and user data
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      // Redirect to the intended page or home
      setLocation(redirect)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-6 py-20 max-w-md">
      <div className={`bg-[#0a0a0a] border border-[#262626] p-12 ${enabled ? 'led-strip-glow' : ''}`}>
        <h1 className="text-4xl font-bold mb-8 tracking-tight text-white">Login</h1>
        {error && (
          <div className="bg-[#171717] border border-[#525252] text-white px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-medium mb-2 tracking-wide text-[#a3a3a3] uppercase">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-[#404040] bg-[#0a0a0a] text-white focus:border-[#737373] focus:outline-none text-sm"
              placeholder="your@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-2 tracking-wide text-[#a3a3a3] uppercase">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-[#404040] bg-[#0a0a0a] text-white focus:border-[#737373] focus:outline-none text-sm"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#f5f5f5] text-[#171717] py-3 text-sm font-medium tracking-wide hover:bg-[#e5e5e5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="mt-8 text-center text-xs text-[#a3a3a3] font-light">
          Don't have an account?{' '}
          <Link href="/register" className="text-white hover:text-[#a3a3a3] font-medium underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  )
}
