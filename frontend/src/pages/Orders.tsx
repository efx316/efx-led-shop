import { useEffect, useState } from 'react'
import { Link, useLocation } from 'wouter'
import { apiRequest, isAuthenticated } from '../lib/api'
import { useLightStudio } from '../contexts/LightStudioContext'

interface Order {
  id: number
  status: string
  total_amount: number
  custom_order_data: any
  created_at: string
}

export default function Orders() {
  const [, setLocation] = useLocation()
  const { state } = useLightStudio()
  const { enabled } = state
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated()) {
      setLocation('/login')
      return
    }

    fetchOrders()
  }, [])

  async function fetchOrders() {
    try {
      const data = await apiRequest('/api/orders')
      setOrders(data.orders || [])
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading your orders...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-white tracking-tight">My Orders</h1>

      {orders.length === 0 ? (
        <div className={`bg-[#0a0a0a] border border-[#262626] p-8 text-center ${enabled ? 'led-strip-glow' : ''}`}>
          <p className="text-[#a3a3a3] mb-4">You haven't placed any orders yet.</p>
          <Link href="/order" className="text-[#e5e5e5] hover:text-[#d4d4d4] font-medium tracking-wide">
            Start a custom order →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className={`bg-[#0a0a0a] border border-[#262626] p-6 ${enabled ? 'led-strip-glow' : ''}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">Order #{order.id}</h3>
                  <p className="text-sm text-[#a3a3a3]">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div
                  className={`px-4 py-2 font-medium text-sm tracking-wide ${
                    order.status === 'pending'
                      ? 'bg-[#262626] text-white border border-[#525252]'
                      : order.status === 'approved'
                      ? 'bg-[#404040] text-white border border-[#525252]'
                      : 'bg-[#171717] text-[#a3a3a3] border border-[#262626]'
                  }`}
                >
                  {order.status.toUpperCase()}
                </div>
              </div>

              {order.custom_order_data && (
                <div className="text-sm text-gray-400 mb-4">
                  <p><strong className="text-white">Project:</strong> {order.custom_order_data.projectName}</p>
                  <p><strong className="text-white">Status:</strong> {order.status === 'pending' ? 'Awaiting review' : 'Processing'}</p>
                </div>
              )}
              
              {order.status === 'pending' && (
                <div className="mt-4">
                  <Link
                    href={`/order/edit/${order.id}`}
                    className="inline-block px-6 py-2 bg-[#f5f5f5] text-[#171717] text-sm font-medium tracking-wide hover:bg-[#e5e5e5] transition-colors uppercase"
                  >
                    Edit Order
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

