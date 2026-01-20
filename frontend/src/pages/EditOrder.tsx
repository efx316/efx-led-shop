import { useEffect, useState } from 'react'
import { Link, useLocation, useRoute } from 'wouter'
import { apiRequest, isAuthenticated } from '../lib/api'
import LEDOrderFlow from '../components/LEDOrderFlow'
import { useLightStudio } from '../contexts/LightStudioContext'

export default function EditOrder() {
  const { state } = useLightStudio()
  const { enabled } = state
  const [, params] = useRoute('/order/edit/:id')
  const [, setLocation] = useLocation()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const orderId = params?.id ? parseInt(params.id) : null

  useEffect(() => {
    if (!isAuthenticated()) {
      setLocation('/login?redirect=/orders')
      return
    }

    if (!orderId) {
      setError('Invalid order ID')
      setLoading(false)
      return
    }

    fetchOrder()
  }, [orderId])

  async function fetchOrder() {
    try {
      const data = await apiRequest(`/api/orders/${orderId}`)
      const orderData = data.order

      if (orderData.status !== 'pending') {
        setError('Only pending orders can be edited')
        setLoading(false)
        return
      }

      if (!orderData.custom_order_data) {
        setError('This order cannot be edited')
        setLoading(false)
        return
      }

      setOrder(orderData)
    } catch (err: any) {
      setError(err?.error || 'Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-white">Loading order...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className={`bg-[#0a0a0a] border-2 border-[#404040] p-6 ${enabled ? 'led-strip-glow' : ''}`}>
          <h2 className="text-xl font-bold text-white mb-2">Error</h2>
          <p className="text-[#a3a3a3] mb-4">{error}</p>
          <Link href="/orders" className="text-[#e5e5e5] hover:text-[#d4d4d4] font-medium tracking-wide">
            ← Back to Orders
          </Link>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-white">Order not found</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-2 text-white tracking-tight">Edit Order #{order.id}</h1>
      <p className="text-[#a3a3a3] mb-8 font-light">
        Update your custom LED order configuration
      </p>
      <LEDOrderFlow
        initialConfig={order.custom_order_data}
        orderId={order.id}
        isEditing={true}
      />
    </div>
  )
}

