import { useState, useEffect } from 'react'
import { apiRequest } from '../lib/api'
import { useLightStudio } from '../contexts/LightStudioContext'

interface Category {
  id: number
  display_name: string
  square_category_id: string | null
  product_count?: number
}

interface Product {
  id: string
  name: string
  imageUrl?: string
  categoryIds?: string[] // Square category IDs
  categoryNames?: string[] // Square category names
  dbCategoryIds: number[] // Database category IDs
}

export default function AdminProductCategories() {
  const { state } = useLightStudio()
  const { enabled } = state
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchCategories()
    fetchProducts()
  }, [])

  async function fetchCategories() {
    try {
      const data = await apiRequest('/api/admin/categories?includeInactive=true')
      setCategories(data.categories || [])
      if (data.categories && data.categories.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(data.categories[0].id)
      }
    } catch (err: any) {
      setError(err?.error || 'Failed to fetch categories')
    }
  }

  async function fetchProducts() {
    try {
      setLoading(true)
      const data = await apiRequest('/api/admin/products')
      setProducts(data.products || [])
    } catch (err: any) {
      setError(err?.error || 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  async function handleAssignProducts() {
    if (!selectedCategoryId || selectedProductIds.size === 0) return

    try {
      await apiRequest('/api/admin/products/bulk-assign', {
        method: 'POST',
        body: JSON.stringify({
          productIds: Array.from(selectedProductIds),
          categoryId: selectedCategoryId,
        }),
      })
      setSelectedProductIds(new Set())
      fetchProducts()
      fetchCategories()
    } catch (err: any) {
      setError(err?.error || 'Failed to assign products')
    }
  }

  async function handleRemoveProduct(productId: string) {
    if (!selectedCategoryId) return

    try {
      await apiRequest(`/api/admin/products/${productId}/categories/${selectedCategoryId}`, {
        method: 'DELETE',
      })
      fetchProducts()
      fetchCategories()
    } catch (err: any) {
      setError(err?.error || 'Failed to remove product')
    }
  }

  const selectedCategory = categories.find(c => c.id === selectedCategoryId)
  
  // Filter products by Square category
  // Try multiple matching strategies: by Square category ID first, then by name
  const productsFilteredBySquareCategory = selectedCategory
    ? products.filter(p => {
        // Strategy 1: Match by Square category ID if available
        if (selectedCategory.square_category_id && p.categoryIds && p.categoryIds.length > 0) {
          const normalizeId = (id: string) => id.replace(/^#+/, '').trim()
          const normalizedCategoryId = normalizeId(selectedCategory.square_category_id)
          
          const hasMatchingId = p.categoryIds.some(catId => {
            if (!catId || typeof catId !== 'string') return false
            const normalizedProductCatId = normalizeId(catId)
            return normalizedProductCatId === normalizedCategoryId || 
                   catId === selectedCategory.square_category_id ||
                   normalizeId(catId) === normalizeId(selectedCategory.square_category_id)
          })
          
          if (hasMatchingId) return true
        }
        
        // Strategy 2: Match by category name (fallback)
        if (selectedCategory.display_name && p.categoryNames && p.categoryNames.length > 0) {
          const categoryName = selectedCategory.display_name.trim().toLowerCase()
          return p.categoryNames.some(catName => {
            if (!catName || typeof catName !== 'string') return false
            return catName.trim().toLowerCase() === categoryName
          })
        }
        
        // Strategy 3: If category has no Square ID and no name match, show all products
        // (This handles custom categories that weren't synced from Square)
        if (!selectedCategory.square_category_id) {
          return true
        }
        
        return false
      })
    : products // If no category selected, show all products
  
  // Then filter by search term
  const filteredProducts = productsFilteredBySquareCategory.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Products already assigned to this database category
  const productsInCategory = filteredProducts.filter(p =>
    selectedCategoryId ? p.dbCategoryIds.includes(selectedCategoryId) : false
  )
  // Products not yet assigned to this database category
  const productsNotInCategory = filteredProducts.filter(p =>
    selectedCategoryId ? !p.dbCategoryIds.includes(selectedCategoryId) : false
  )

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-2 text-white tracking-tight">Product Category Assignment</h1>
      <p className="text-[#a3a3a3] font-light mb-8">Assign products to categories</p>

      {error && (
        <div className={`bg-[#0a0a0a] border-2 border-[#404040] p-4 mb-6 ${enabled ? 'led-strip-glow' : ''}`}>
          <p className="text-[#a3a3a3]">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Category List */}
        <div className={`bg-[#0a0a0a] border-2 border-[#404040] p-6 ${enabled ? 'led-strip-glow' : ''}`}>
          <h2 className="text-xl font-bold mb-4 text-white">Categories</h2>
          <div className="space-y-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategoryId(category.id)
                  setSelectedProductIds(new Set())
                }}
                className={`w-full text-left px-4 py-2 rounded transition-colors ${
                  selectedCategoryId === category.id
                    ? 'bg-[#404040] text-white'
                    : 'bg-[#171717] text-[#a3a3a3] hover:bg-[#262626]'
                }`}
              >
                <div className="font-medium">{category.display_name}</div>
                <div className="text-xs text-[#737373]">{category.product_count || 0} products</div>
              </button>
            ))}
          </div>
        </div>

        {/* Product Assignment */}
        <div className="lg:col-span-3">
          {selectedCategory ? (
            <div className={`bg-[#0a0a0a] border-2 border-[#404040] p-6 ${enabled ? 'led-strip-glow' : ''}`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">
                  Products in "{selectedCategory.display_name}"
                </h2>
                {selectedProductIds.size > 0 && (
                  <button
                    onClick={handleAssignProducts}
                    className="px-4 py-2 bg-[#f5f5f5] text-[#171717] rounded-lg hover:bg-[#e5e5e5]"
                  >
                    Assign {selectedProductIds.size} Product{selectedProductIds.size > 1 ? 's' : ''}
                  </button>
                )}
              </div>

              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 mb-4 border border-[#404040] bg-[#171717] text-white rounded-lg"
              />

              <div className="space-y-4">
                {/* Products NOT in category */}
                {productsNotInCategory.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-[#a3a3a3] mb-2">
                      Available Products ({productsNotInCategory.length})
                    </h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {productsNotInCategory.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center gap-3 p-3 bg-[#171717] border border-[#262626] rounded"
                        >
                          <input
                            type="checkbox"
                            checked={selectedProductIds.has(product.id)}
                            onChange={(e) => {
                              const newSet = new Set(selectedProductIds)
                              if (e.target.checked) {
                                newSet.add(product.id)
                              } else {
                                newSet.delete(product.id)
                              }
                              setSelectedProductIds(newSet)
                            }}
                            className="w-5 h-5"
                          />
                          {product.imageUrl && (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <span className="flex-1 text-white text-sm">{product.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Products IN category */}
                {productsInCategory.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-[#a3a3a3] mb-2">
                      Assigned Products ({productsInCategory.length})
                    </h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {productsInCategory.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center gap-3 p-3 bg-[#171717] border border-[#262626] rounded"
                        >
                          {product.imageUrl && (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <span className="flex-1 text-white text-sm">{product.name}</span>
                          <button
                            onClick={() => handleRemoveProduct(product.id)}
                            className="px-3 py-1 bg-red-900 text-red-300 rounded text-sm hover:bg-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {filteredProducts.length === 0 && (
                  <p className="text-[#a3a3a3] text-center py-8">No products found</p>
                )}
              </div>
            </div>
          ) : (
            <div className={`bg-[#0a0a0a] border-2 border-[#404040] p-6 ${enabled ? 'led-strip-glow' : ''}`}>
              <p className="text-[#a3a3a3]">Please select a category to manage products</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
