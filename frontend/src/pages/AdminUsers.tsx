import { useState, useEffect } from 'react'
import { apiRequest } from '../lib/api'
import { useLightStudio } from '../contexts/LightStudioContext'

interface User {
  id: number
  email: string
  name: string | null
  company_name: string | null
  phone: string | null
  is_admin: boolean
  can_view_prices: boolean
  can_order_products: boolean
  created_at: string
  points_balance: number
  points_total: number
  order_count: number
}

export default function AdminUsers() {
  const { state } = useLightStudio()
  const { enabled } = state
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [editingPermissions, setEditingPermissions] = useState<{
    can_view_prices: boolean
    can_order_products: boolean
    is_admin: boolean
  } | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      setLoading(true)
      const data = await apiRequest('/api/admin/users')
      setUsers(data.users || [])
      setError(null)
      
      // Show warning if migration is needed
      if (data.warning) {
        setError(data.warning)
      }
    } catch (err: any) {
      const errorMsg = err?.error || 'Failed to fetch users'
      const details = err?.details ? `: ${err.details}` : ''
      setError(`${errorMsg}${details}`)
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdatePermissions(userId: number) {
    if (!editingPermissions) return

    try {
      setError(null)
      await apiRequest(`/api/admin/users/${userId}/permissions`, {
        method: 'PATCH',
        body: JSON.stringify(editingPermissions),
      })
      setEditingUserId(null)
      setEditingPermissions(null)
      fetchUsers()
    } catch (err: any) {
      const errorMsg = err?.error || 'Failed to update user permissions'
      const details = err?.details ? `: ${err.details}` : ''
      setError(`${errorMsg}${details}`)
      console.error('Error updating permissions:', err)
    }
  }

  function startEditing(user: User) {
    setEditingUserId(user.id)
    setEditingPermissions({
      can_view_prices: user.can_view_prices ?? false,
      can_order_products: user.can_order_products ?? false,
      is_admin: user.is_admin ?? false,
    })
  }

  function cancelEditing() {
    setEditingUserId(null)
    setEditingPermissions(null)
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-white">Loading users...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-white tracking-tight">User Management</h1>
          <p className="text-[#a3a3a3] font-light">Manage user accounts and permissions</p>
        </div>
      </div>

      {error && (
        <div className={`bg-[#0a0a0a] border-2 border-[#404040] p-4 mb-6 ${enabled ? 'led-strip-glow' : ''}`}>
          <p className="text-[#a3a3a3]">{error}</p>
          {error.includes('migration') && (
            <div className="mt-3 p-3 bg-[#171717] rounded border border-[#404040]">
              <p className="text-sm text-white font-medium mb-2">To fix this, run this SQL in your database:</p>
              <code className="text-xs text-[#a3a3a3] block whitespace-pre-wrap bg-[#0a0a0a] p-2 rounded">
{`ALTER TABLE users 
ADD COLUMN IF NOT EXISTS can_view_prices BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_order_products BOOLEAN DEFAULT false;

UPDATE users 
SET can_view_prices = true, can_order_products = true 
WHERE is_admin = true;`}
              </code>
            </div>
          )}
        </div>
      )}

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search users by email, name, or company..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-[#404040] bg-[#171717] text-white rounded-lg"
        />
      </div>

      <div className={`bg-[#0a0a0a] border-2 border-[#404040] ${enabled ? 'led-strip-glow' : ''}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#171717] border-b border-[#262626]">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-white">User</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-white">Company</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-white">View Prices</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-white">Order Products</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-white">Admin</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-white">Orders</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-white">Points</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-[#262626] hover:bg-[#171717]">
                  {editingUserId === user.id && editingPermissions ? (
                    <>
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{user.name || user.email}</div>
                        <div className="text-xs text-[#737373]">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 text-[#a3a3a3] text-sm">
                        {user.company_name || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={editingPermissions.can_view_prices}
                          onChange={(e) => setEditingPermissions({
                            ...editingPermissions,
                            can_view_prices: e.target.checked
                          })}
                          className="w-5 h-5"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={editingPermissions.can_order_products}
                          onChange={(e) => setEditingPermissions({
                            ...editingPermissions,
                            can_order_products: e.target.checked
                          })}
                          className="w-5 h-5"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={editingPermissions.is_admin}
                          onChange={(e) => setEditingPermissions({
                            ...editingPermissions,
                            is_admin: e.target.checked,
                            // Auto-enable other permissions when admin is enabled
                            can_view_prices: e.target.checked ? true : editingPermissions.can_view_prices,
                            can_order_products: e.target.checked ? true : editingPermissions.can_order_products,
                          })}
                          className="w-5 h-5"
                        />
                      </td>
                      <td className="px-6 py-4 text-[#a3a3a3]">{user.order_count}</td>
                      <td className="px-6 py-4 text-[#a3a3a3]">{user.points_balance}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdatePermissions(user.id)}
                            className="px-3 py-1 bg-[#404040] text-white rounded text-sm hover:bg-[#525252]"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="px-3 py-1 border border-[#404040] text-white rounded text-sm hover:bg-[#171717]"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{user.name || user.email}</div>
                        <div className="text-xs text-[#737373]">{user.email}</div>
                        {user.phone && (
                          <div className="text-xs text-[#737373]">{user.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[#a3a3a3] text-sm">
                        {user.company_name || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.can_view_prices 
                            ? 'bg-green-900 text-green-300' 
                            : 'bg-red-900 text-red-300'
                        }`}>
                          {user.can_view_prices ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.can_order_products 
                            ? 'bg-green-900 text-green-300' 
                            : 'bg-red-900 text-red-300'
                        }`}>
                          {user.can_order_products ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.is_admin 
                            ? 'bg-blue-900 text-blue-300' 
                            : 'bg-[#404040] text-[#a3a3a3]'
                        }`}>
                          {user.is_admin ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#a3a3a3]">{user.order_count}</td>
                      <td className="px-6 py-4 text-[#a3a3a3]">{user.points_balance}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => startEditing(user)}
                          className="px-3 py-1 bg-[#404040] text-white rounded text-sm hover:bg-[#525252]"
                        >
                          Edit
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length === 0 && (
        <p className="text-[#a3a3a3] text-center py-8">No users found</p>
      )}
    </div>
  )
}
