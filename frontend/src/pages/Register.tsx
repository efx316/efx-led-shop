import { useState } from 'react'
import { useLocation, Link } from 'wouter'
import { apiRequest } from '../lib/api'
import { useLightStudio } from '../contexts/LightStudioContext'

export default function Register() {
  try {
    console.log('🔵 Register component rendering')
    const { state } = useLightStudio()
    const { enabled } = state
    const [, setLocation] = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [phone, setPhone] = useState('')
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
      const data = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ 
          email, 
          password,
          name: name || undefined,
          company_name: companyName || undefined,
          phone: phone || undefined,
        }),
      })

      // Store token and user data
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      // Redirect to the intended page or home
      setLocation(redirect)
    } catch (err: any) {
      const errorMessage = err?.error || err?.message || 'Registration failed'
      const errorDetails = err?.details ? ` Details: ${JSON.stringify(err.details)}` : ''
      setError(`${errorMessage}${errorDetails}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-6 py-20 max-w-md">
      <div className={`bg-[#0a0a0a] border border-[#262626] p-12 ${enabled ? 'led-strip-glow' : ''}`}>
        <h1 className="text-4xl font-bold mb-8 tracking-tight text-white">Register</h1>
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
              minLength={8}
              required
            />
            <p className="mt-1 text-xs text-[#737373]">Must be at least 8 characters</p>
          </div>
          <div>
            <label className="block text-xs font-medium mb-2 tracking-wide text-[#a3a3a3] uppercase">Name (Optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-[#404040] bg-[#0a0a0a] text-white focus:border-[#737373] focus:outline-none text-sm"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-2 tracking-wide text-[#a3a3a3] uppercase">Company Name (Optional)</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-3 border border-[#404040] bg-[#0a0a0a] text-white focus:border-[#737373] focus:outline-none text-sm"
              placeholder="Company name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-2 tracking-wide text-[#a3a3a3] uppercase">Phone (Optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 border border-[#404040] bg-[#0a0a0a] text-white focus:border-[#737373] focus:outline-none text-sm"
              placeholder="Phone number"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#f5f5f5] text-[#171717] py-3 text-sm font-medium tracking-wide hover:bg-[#e5e5e5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="mt-8 text-center text-xs text-[#a3a3a3] font-light">
          Already have an account?{' '}
          <Link href="/login" className="text-white hover:text-[#a3a3a3] font-medium underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  )
  } catch (error) {
    console.error('❌ Register component error:', error)
    return (
      <div className="container mx-auto px-6 py-20 max-w-md">
        <div className="bg-red-900 border border-red-700 p-12">
          <h1 className="text-2xl font-bold mb-4 text-white">Error Loading Register</h1>
          <pre className="text-white text-sm">{String(error)}</pre>
        </div>
      </div>
    )
  }
}
