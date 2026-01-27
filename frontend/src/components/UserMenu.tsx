import { useState, useEffect } from 'react'
import { Link, useLocation } from 'wouter'
import { isAuthenticated, getCurrentUser, apiRequest } from '../lib/api'

export default function UserMenu() {
  const [, setLocation] = useLocation()
  const [user, setUser] = useState<any>(null)
  const [points, setPoints] = useState<{ current: number; total: number } | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (isAuthenticated()) {
      const currentUser = getCurrentUser()
      setUser(currentUser)
      // Set admin status from localStorage immediately (in case it's already there)
      setIsAdmin(currentUser?.is_admin || false)
      // Then fetch fresh data from API to ensure we have the latest admin status
      fetchUserData().catch(err => {
        console.error('Failed to fetch user data:', err)
        // If API fails, keep using localStorage admin status
        setIsAdmin(currentUser?.is_admin || false)
      })
    }
  }, [])

  async function fetchUserData() {
    try {
      const data = await apiRequest('/api/user')
      if (data) {
        console.log('User data fetched:', data)
        setUser(data)
        setIsAdmin(data.is_admin || false)
        if (data.points) {
          setPoints(data.points)
        }
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error)
      // If API fails, keep using localStorage user data
      const currentUser = getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
      }
    }
  }

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setLocation('/')
    window.location.reload()
  }

  if (!isAuthenticated()) {
    return (
      <Link href="/login" className="text-[#d4d4d4] hover:text-white font-medium text-sm tracking-wide transition-colors">
        Login
      </Link>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center space-x-2 px-3 py-2 hover:bg-[#171717] transition-colors"
      >
        <div className="text-right">
          <div className="text-sm font-medium text-white">
            {user?.name || user?.email?.split('@')[0] || 'User'}
          </div>
          {points && (
            <div className="text-xs text-[#a3a3a3]">
              {points.current} points
            </div>
          )}
        </div>
        <svg className="w-5 h-5 text-[#a3a3a3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-[#0a0a0a] py-2 z-20 border border-[#262626] shadow-lg">
            {points && (
              <div className="px-4 py-3 border-b border-[#262626]">
                <div className="text-xs text-[#a3a3a3] font-light tracking-wide">Points</div>
                <div className="text-sm font-medium text-white">{points.current} / {points.total} total</div>
              </div>
            )}
            <Link
              href="/points-shop"
              className="block px-4 py-3 text-sm text-white hover:bg-[#171717] transition-colors tracking-wide"
              onClick={() => setShowMenu(false)}
            >
              Points Shop
            </Link>
            <Link
              href="/leaderboard"
              className="block px-4 py-3 text-sm text-white hover:bg-[#171717] transition-colors tracking-wide"
              onClick={() => setShowMenu(false)}
            >
              Leaderboard
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="block px-4 py-3 text-sm text-white hover:bg-[#171717] border-t border-[#262626] transition-colors tracking-wide"
                onClick={() => setShowMenu(false)}
              >
                Admin Panel
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-3 text-sm text-white hover:bg-[#171717] border-t border-[#262626] transition-colors tracking-wide"
            >
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  )
}

