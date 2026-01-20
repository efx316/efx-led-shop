import { useEffect, useState } from 'react'
import { apiRequest, isAuthenticated } from '../lib/api'
import { useLocation } from 'wouter'
import { useLightStudio } from '../contexts/LightStudioContext'

interface ShopItem {
  id: number
  name: string
  description: string
  point_cost: number
  image_url: string | null
  stock_quantity: number
}

export default function PointsShop() {
  const [, setLocation] = useLocation()
  const { state } = useLightStudio()
  const { enabled } = state
  const [items, setItems] = useState<ShopItem[]>([])
  const [points, setPoints] = useState<{ current: number; total: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState<number | null>(null)

  useEffect(() => {
    if (!isAuthenticated()) {
      setLocation('/login')
      return
    }

    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [itemsData, pointsData] = await Promise.all([
        apiRequest('/api/points-shop/items'),
        apiRequest('/api/points'),
      ])
      setItems(itemsData || [])
      setPoints(pointsData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleRedeem(itemId: number) {
    if (!points || points.current < items.find(i => i.id === itemId)?.point_cost!) {
      alert('Insufficient points')
      return
    }

    if (!confirm('Are you sure you want to redeem this item?')) {
      return
    }

    setRedeeming(itemId)
    try {
      await apiRequest('/api/points-shop/redeem', {
        method: 'POST',
        body: JSON.stringify({ itemId }),
      })
      alert('Item redeemed successfully!')
      fetchData() // Refresh data
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to redeem item')
    } finally {
      setRedeeming(null)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-white">Points Shop</h1>
        {points && (
          <div className="text-right">
            <div className="text-sm text-[#a3a3a3]">Your Points</div>
            <div className="text-3xl font-bold text-[#e5e5e5]">{points.current}</div>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className={`bg-[#0a0a0a] border border-[#262626] p-8 text-center ${enabled ? 'led-strip-glow' : ''}`}>
          <p className="text-[#a3a3a3]">No items available in the shop yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const canAfford = points && points.current >= item.point_cost
            const inStock = item.stock_quantity > 0

            return (
              <div key={item.id} className={`bg-[#0a0a0a] border border-[#262626] overflow-hidden ${enabled ? 'led-strip-glow' : ''}`}>
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 text-white">{item.name}</h3>
                  {item.description && (
                    <p className="text-[#a3a3a3] mb-4">{item.description}</p>
                  )}
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-2xl font-bold text-[#e5e5e5]">
                      {item.point_cost} pts
                    </span>
                    {inStock ? (
                      <span className="text-sm text-[#d4d4d4]">In Stock</span>
                    ) : (
                      <span className="text-sm text-[#737373]">Out of Stock</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRedeem(item.id)}
                    disabled={!canAfford || !inStock || redeeming === item.id}
                    className={`w-full py-2 rounded-lg font-medium ${
                      canAfford && inStock
                        ? 'bg-[#f5f5f5] text-[#171717] hover:bg-[#e5e5e5]'
                        : 'bg-[#262626] text-[#737373] cursor-not-allowed'
                    }`}
                  >
                    {redeeming === item.id
                      ? 'Redeeming...'
                      : !canAfford
                      ? 'Insufficient Points'
                      : !inStock
                      ? 'Out of Stock'
                      : 'Redeem'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

