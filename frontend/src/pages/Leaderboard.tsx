import { useEffect, useState } from 'react'
import { apiRequest } from '../lib/api'
import { useLightStudio } from '../contexts/LightStudioContext'

interface LeaderboardEntry {
  user_id: number
  email: string
  company_name: string | null
  total_accumulated: number
  rank: number
}

export default function Leaderboard() {
  const { state } = useLightStudio()
  const { enabled } = state
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null)

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  async function fetchLeaderboard() {
    try {
      const data = await apiRequest('/api/leaderboard?limit=100')
      setEntries(data || [])

      // Get current user's rank
      try {
        const userData = await apiRequest('/api/user')
        if (userData.points) {
          const rank = data.findIndex(
            (e: LeaderboardEntry) => e.user_id === userData.id
          )
          setCurrentUserRank(rank >= 0 ? rank + 1 : null)
        }
      } catch (error) {
        // User not logged in or error
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading leaderboard...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-white">Points Leaderboard</h1>
      <p className="text-[#a3a3a3] mb-6">
        Rankings based on total accumulated points (not current balance)
      </p>

      {currentUserRank && (
        <div className={`bg-[#171717] border-2 border-[#404040] rounded-lg p-4 mb-6 ${enabled ? 'led-strip-glow' : ''}`}>
          <p className="text-[#e5e5e5] font-medium">
            Your Rank: #{currentUserRank} with {entries[currentUserRank - 1]?.total_accumulated || 0} total points
          </p>
        </div>
      )}

      {entries.length === 0 ? (
        <div className={`bg-[#0a0a0a] border border-[#262626] p-8 text-center ${enabled ? 'led-strip-glow' : ''}`}>
          <p className="text-[#a3a3a3]">No entries yet. Be the first to earn points!</p>
        </div>
      ) : (
        <div className={`bg-[#0a0a0a] border border-[#262626] overflow-hidden ${enabled ? 'led-strip-glow' : ''}`}>
          <table className="w-full">
            <thead className="bg-[#171717]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase">Company</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[#a3a3a3] uppercase">Total Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]">
              {entries.map((entry) => (
                <tr key={entry.user_id} className="hover:bg-[#171717]">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-lg font-semibold text-white">#{entry.rank}</span>
                    {entry.rank === 1 && <span className="ml-2">🥇</span>}
                    {entry.rank === 2 && <span className="ml-2">🥈</span>}
                    {entry.rank === 3 && <span className="ml-2">🥉</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-[#e5e5e5]">{entry.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-[#a3a3a3]">{entry.company_name || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-lg font-semibold text-[#e5e5e5]">
                      {entry.total_accumulated.toLocaleString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

