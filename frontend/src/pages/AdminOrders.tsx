import { useEffect, useState } from 'react'
import { apiRequest } from '../lib/api'
import { useLightStudio } from '../contexts/LightStudioContext'

interface Order {
  id: number
  user_id: number
  status: string
  total_amount: number
  custom_order_data: any
  created_at: string
  user_name: string
  email: string
}

export default function AdminOrders() {
  const { state } = useLightStudio()
  const { enabled } = state
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'picked_up'>('pending')

  useEffect(() => {
    fetchOrders()
  }, [filter])

  async function fetchOrders() {
    try {
      setLoading(true)
      const endpoint = filter === 'all' ? '/api/admin/orders' : `/api/admin/orders?status=${filter}`
      const data = await apiRequest(endpoint)
      const fetchedOrders = data.orders || []
      setOrders(fetchedOrders)
      return fetchedOrders
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      return []
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(orderId: number, status: 'approved' | 'rejected' | 'picked_up') {
    let updateSuccess = false
    
    try {
      console.log(`Updating order ${orderId} to status: ${status}`)
      const response = await apiRequest(`/api/admin/orders/${orderId}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      
      // Check if response indicates success
      if (response && (response.success || response.order || response.message)) {
        console.log('Order status updated successfully:', response)
        updateSuccess = true
      }
    } catch (error: any) {
      console.error('Error updating order:', error)
      console.error('Error details:', {
        error: error?.error,
        message: error?.message,
        status: error?.status,
        response: error?.response
      })
      
      // Don't show error immediately - refresh first to see if order was actually updated
      updateSuccess = false
    }
    
    // Always refresh to get the latest order status
    // This handles cases where the backend updated but response had issues
    try {
      const refreshedOrders = await fetchOrders()
      
      // Check if the order was actually updated using the refreshed orders
      const updatedOrder = refreshedOrders.find((o: Order) => o.id === orderId)
      if (updatedOrder && updatedOrder.status === status) {
        // Order was updated successfully - no error to show
        console.log('Order was updated successfully')
        return
      }
      
      // If we get here and updateSuccess is false, show error
      if (!updateSuccess) {
        const errorMessage = 'Failed to update order status. Please refresh the page to check the current status.'
        alert(errorMessage)
      }
    } catch (refreshError) {
      console.error('Failed to refresh orders:', refreshError)
      if (!updateSuccess) {
        alert('Failed to update order status and refresh the list. Please refresh the page manually.')
      }
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading orders...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-white">Order Review</h1>

      {/* Filter Buttons */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setFilter('pending')}
          className={`px-6 py-2 rounded-lg font-medium ${
            filter === 'pending'
              ? 'bg-[#404040] text-white'
              : 'bg-[#262626] text-[#a3a3a3] hover:text-white hover:bg-[#404040] border border-[#404040]'
          }`}
        >
          Pending ({orders.filter(o => o.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-6 py-2 rounded-lg font-medium ${
            filter === 'approved'
              ? 'bg-gray-700 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 border border-gray-700'
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setFilter('picked_up')}
          className={`px-6 py-2 rounded-lg font-medium ${
            filter === 'picked_up'
              ? 'bg-gray-700 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 border border-gray-700'
          }`}
        >
          Picked Up
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-6 py-2 rounded-lg font-medium ${
            filter === 'all'
              ? 'bg-gray-700 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 border border-gray-700'
          }`}
        >
          All Orders
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className={`bg-[#0a0a0a] border border-[#262626] p-8 text-center text-[#a3a3a3] ${enabled ? 'led-strip-glow' : ''}`}>
            No {filter === 'all' ? '' : filter} orders found
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              enabled={enabled}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </div>
    </div>
  )
}

function OrderCard({
  order,
  enabled,
  onStatusChange,
}: {
  order: Order
  enabled: boolean
  onStatusChange: (id: number, status: 'approved' | 'rejected' | 'picked_up') => void
}) {
  const customData = order.custom_order_data || {}

  return (
    <div className={`bg-[#0a0a0a] border border-[#262626] p-6 ${enabled ? 'led-strip-glow' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-white">Order #{order.id}</h3>
          <p className="text-sm text-[#a3a3a3]">
            Customer: {order.user_name || order.email}
          </p>
          <p className="text-sm text-[#a3a3a3]">
            Date: {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>
        <div
          className={`px-4 py-2 rounded-lg font-medium ${
            order.status === 'pending'
              ? 'bg-[#262626] text-[#e5e5e5] border border-[#404040]'
              : order.status === 'approved'
              ? 'bg-[#404040] text-[#f5f5f5] border border-[#525252]'
              : order.status === 'picked_up'
              ? 'bg-green-900 text-green-100 border border-green-700'
              : 'bg-[#171717] text-[#a3a3a3] border border-[#262626]'
          }`}
        >
          {order.status === 'picked_up' ? 'PICKED UP' : order.status.toUpperCase()}
        </div>
      </div>

      {customData.environment && (
        <div className="bg-[#171717] border border-[#262626] rounded-lg p-4 mb-4">
          <h4 className="font-semibold mb-2 text-white">Custom LED Order Details</h4>
          <div className="grid md:grid-cols-2 gap-2 text-sm">
            <p className="text-[#d4d4d4]"><strong className="text-[#e5e5e5]">Environment:</strong> {customData.environment}</p>
            <p className="text-[#d4d4d4]"><strong className="text-[#e5e5e5]">Color Type:</strong> {customData.colorType}</p>
            <p className="text-[#d4d4d4]"><strong className="text-[#e5e5e5]">LED Type:</strong> {customData.ledType}</p>
            <p className="text-[#d4d4d4]"><strong className="text-[#e5e5e5]">Length:</strong> {customData.length}m</p>
            <p className="text-[#d4d4d4]"><strong className="text-[#e5e5e5]">Tail Wire:</strong> {customData.tailWireLength}m</p>
            <p className="text-[#d4d4d4]"><strong className="text-[#e5e5e5]">Project:</strong> {customData.projectName}</p>
            <p className="text-[#d4d4d4]"><strong className="text-[#e5e5e5]">Company:</strong> {customData.company || 'N/A'}</p>
            <p className="text-[#d4d4d4]"><strong className="text-[#e5e5e5]">Customer:</strong> {customData.customerName}</p>
            <p className="text-[#d4d4d4]"><strong className="text-[#e5e5e5]">Mobile:</strong> {customData.mobile}</p>
          </div>
          <div className="mt-3">
            <p className="text-gray-200"><strong>Additional Items:</strong></p>
            <ul className="list-disc list-inside text-sm text-[#d4d4d4]">
              {customData.includeDriver && <li>Driver: {customData.recommendedDriver}</li>}
              {customData.includeProfile && <li>Profile</li>}
              {customData.includeEndCaps && <li>End Caps</li>}
            </ul>
          </div>
          {customData.notes && (
            <div className="mt-3">
              <p className="text-gray-200"><strong>Notes:</strong></p>
              <p className="text-sm text-[#d4d4d4]">{customData.notes}</p>
            </div>
          )}
        </div>
      )}

      {order.status === 'pending' && (
        <div className="flex space-x-4">
          <button
            onClick={() => onStatusChange(order.id, 'approved')}
            className="px-6 py-2 bg-[#f5f5f5] text-[#171717] rounded-lg hover:bg-[#e5e5e5] font-medium"
          >
            Approve Order
          </button>
          <button
            onClick={() => onStatusChange(order.id, 'rejected')}
            className="px-6 py-2 bg-[#262626] text-[#e5e5e5] rounded-lg hover:bg-[#404040] border border-[#404040] font-medium"
          >
            Reject Order
          </button>
        </div>
      )}
      {order.status === 'approved' && (
        <div className="flex space-x-4">
          <button
            onClick={() => onStatusChange(order.id, 'picked_up')}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            Mark as Picked Up
          </button>
        </div>
      )}
      {order.status === 'picked_up' && (
        <div className="flex space-x-4">
          <button
            onClick={() => onStatusChange(order.id, 'approved')}
            className="px-6 py-2 bg-[#404040] text-white rounded-lg hover:bg-[#525252] font-medium border border-[#525252]"
          >
            Revert to Approved
          </button>
        </div>
      )}
    </div>
  )
}

