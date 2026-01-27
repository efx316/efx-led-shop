import { useState, useEffect } from 'react'
import { apiRequest } from '../lib/api'
import { useLightStudio } from '../contexts/LightStudioContext'

interface ShopItem {
  id: number
  name: string
  description: string | null
  point_cost: number
  image_url: string | null
  stock_quantity: number
  active: boolean
  created_at: string
  updated_at: string
}

export default function AdminPointsShop() {
  const { state } = useLightStudio()
  const { enabled } = state
  const [items, setItems] = useState<ShopItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState<ShopItem | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    point_cost: '',
    stock_quantity: '0',
    active: true,
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    try {
      setLoading(true)
      const data = await apiRequest('/api/admin/points-shop/items')
      setItems(data.items || [])
      setError(null)
    } catch (err: any) {
      const errorMsg = err?.error || 'Failed to fetch items'
      setError(errorMsg)
      console.error('Failed to fetch items:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      point_cost: '',
      stock_quantity: '0',
      active: true,
    })
    setImageFile(null)
    setImagePreview(null)
    setEditingItem(null)
    setShowAddForm(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setUploading(true)
    setError(null)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('point_cost', formData.point_cost)
      formDataToSend.append('stock_quantity', formData.stock_quantity)
      formDataToSend.append('active', formData.active.toString())

      // Image is required for new items, optional for updates
      if (imageFile) {
        formDataToSend.append('image', imageFile)
      } else if (!editingItem) {
        setError('Please select a product image')
        setUploading(false)
        return
      }

      const url = editingItem
        ? `/api/admin/points-shop/items/${editingItem.id}`
        : '/api/admin/points-shop/items'

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${url}`, {
        method: editingItem ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formDataToSend,
      })

      if (!response.ok) {
        const errorData = await response.json()
        let errorMessage = errorData.error || 'Failed to save item'
        if (errorData.details) {
          errorMessage += `: ${Array.isArray(errorData.details) ? errorData.details.join(', ') : errorData.details}`
        }
        if (errorData.hint) {
          errorMessage += ` (${errorData.hint})`
        }
        throw new Error(errorMessage)
      }

      await fetchItems()
      resetForm()
    } catch (err: any) {
      setError(err.message || 'Failed to save item')
      console.error('Failed to save item:', err)
    } finally {
      setUploading(false)
    }
  }

  function startEdit(item: ShopItem) {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description || '',
      point_cost: item.point_cost.toString(),
      stock_quantity: item.stock_quantity.toString(),
      active: item.active,
    })
    setImagePreview(item.image_url)
    setImageFile(null)
    setShowAddForm(true)
  }

  async function handleDelete(itemId: number) {
    if (!confirm('Are you sure you want to delete this item? It will be hidden from the shop.')) {
      return
    }

    try {
      await apiRequest(`/api/admin/points-shop/items/${itemId}`, {
        method: 'DELETE',
      })
      await fetchItems()
    } catch (err: any) {
      setError(err?.error || 'Failed to delete item')
      console.error('Failed to delete item:', err)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="text-center text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-white tracking-tight">Points Shop Management</h1>
          <p className="text-[#a3a3a3] font-light">Manage items available in the points shop</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowAddForm(true)
          }}
          className="bg-[#f5f5f5] text-[#171717] px-6 py-3 font-medium hover:bg-[#e5e5e5] transition-colors"
        >
          + Add Item
        </button>
      </div>

      {error && (
        <div className="bg-[#171717] border border-[#525252] text-white px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      {showAddForm && (
        <div className={`bg-[#0a0a0a] border border-[#262626] p-8 mb-8 ${enabled ? 'led-strip-glow' : ''}`}>
          <h2 className="text-2xl font-bold mb-6 text-white">
            {editingItem ? 'Edit Item' : 'Add New Item'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium mb-2 tracking-wide text-[#a3a3a3] uppercase">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-[#404040] bg-[#0a0a0a] text-white focus:border-[#737373] focus:outline-none text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-2 tracking-wide text-[#a3a3a3] uppercase">
                  Point Cost *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.point_cost}
                  onChange={(e) => setFormData({ ...formData, point_cost: e.target.value })}
                  className="w-full px-4 py-3 border border-[#404040] bg-[#0a0a0a] text-white focus:border-[#737373] focus:outline-none text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-2 tracking-wide text-[#a3a3a3] uppercase">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-[#404040] bg-[#0a0a0a] text-white focus:border-[#737373] focus:outline-none text-sm"
                rows={3}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium mb-2 tracking-wide text-[#a3a3a3] uppercase">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  className="w-full px-4 py-3 border border-[#404040] bg-[#0a0a0a] text-white focus:border-[#737373] focus:outline-none text-sm"
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-[#a3a3a3]">Active (visible in shop)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-2 tracking-wide text-[#a3a3a3] uppercase">
                Product Photo {!editingItem && '*'}
              </label>
              {imagePreview && (
                <div className="mb-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-48 h-48 object-cover border border-[#404040]"
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                required={!editingItem}
                className="w-full px-4 py-3 border border-[#404040] bg-[#0a0a0a] text-white focus:border-[#737373] focus:outline-none text-sm"
              />
              {editingItem && !imageFile && (
                <p className="text-xs text-[#737373] mt-2">
                  Leave empty to keep current image
                </p>
              )}
              {!editingItem && (
                <p className="text-xs text-[#737373] mt-2">
                  Image is required for new items
                </p>
              )}
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={uploading}
                className="bg-[#f5f5f5] text-[#171717] px-6 py-3 font-medium hover:bg-[#e5e5e5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-[#262626] text-white px-6 py-3 font-medium hover:bg-[#404040] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className={`bg-[#0a0a0a] border border-[#262626] overflow-hidden ${enabled ? 'led-strip-glow' : ''} ${
              !item.active ? 'opacity-60' : ''
            }`}
          >
            {item.image_url && (
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold text-white">{item.name}</h3>
                {!item.active && (
                  <span className="text-xs text-[#737373] bg-[#262626] px-2 py-1">Inactive</span>
                )}
              </div>
              {item.description && (
                <p className="text-[#a3a3a3] mb-4 text-sm">{item.description}</p>
              )}
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-bold text-[#e5e5e5]">
                  {item.point_cost} pts
                </span>
                <span className="text-sm text-[#a3a3a3]">
                  Stock: {item.stock_quantity}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(item)}
                  className="flex-1 bg-[#262626] text-white px-4 py-2 text-sm font-medium hover:bg-[#404040] transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="flex-1 bg-[#171717] text-[#737373] px-4 py-2 text-sm font-medium hover:bg-[#262626] hover:text-white transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && !showAddForm && (
        <div className={`bg-[#0a0a0a] border border-[#262626] p-8 text-center ${enabled ? 'led-strip-glow' : ''}`}>
          <p className="text-[#a3a3a3]">No items yet. Click "Add Item" to create your first shop item.</p>
        </div>
      )}
    </div>
  )
}
