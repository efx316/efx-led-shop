import { Link } from 'wouter'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLightStudio } from '../contexts/LightStudioContext'

const API_URL = (import.meta.env?.VITE_API_URL as string) || 'http://localhost:3000'

interface Category {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  description?: string
  imageUrl?: string
  price?: number
  categoryIds?: string[] // Array of category IDs (as strings from API)
  attributes: {
    voltage?: string
    ledType?: string
    waterproofRating?: string
    wattPerMeter?: number
    maxRunMeters?: number
    cutIncrementMm?: number
    environment?: 'indoor' | 'outdoor' | 'both'
  }
}

export default function Products() {
  const { state } = useLightStudio()
  const { enabled } = state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all')

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/square/categories`)
      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Fetch all products
  const { data: products = [], isLoading: productsLoading, error: productsError } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/square/products`)
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000,
  })

  // Filter products by selected category (client-side)
  const filteredProducts = products.filter((product) => {
    if (selectedCategoryId === 'all') return true
    return product.categoryIds?.includes(selectedCategoryId) || false
  })

  const loading = categoriesLoading || productsLoading
  const error = categoriesError || productsError

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center">
          <div className="text-xl text-white">Loading products...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center">
          <div className="text-xl text-gray-400">
            Error: {error instanceof Error ? error.message : 'Failed to load products'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-4 text-white tracking-tight">Our Products</h1>
        <p className="text-[#a3a3a3] font-light text-lg">Browse our range of LED solutions</p>
      </div>

      {/* Category Buttons */}
      <div className="flex justify-center flex-wrap gap-2 mb-12">
        <button
          onClick={() => setSelectedCategoryId('all')}
          className={`px-6 py-2 text-sm font-medium tracking-wide transition-colors ${
            selectedCategoryId === 'all'
              ? 'bg-[#404040] text-white'
              : 'bg-[#171717] text-[#a3a3a3] hover:text-white border border-[#262626] hover:border-[#525252]'
          }`}
        >
          All Products
        </button>
        {categories.map((category) => {
          const productCount = products.filter(p => p.categoryIds?.includes(category.id)).length
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategoryId(category.id)}
              className={`px-6 py-2 text-sm font-medium tracking-wide transition-colors ${
                selectedCategoryId === category.id
                  ? 'bg-[#404040] text-white'
                  : 'bg-[#171717] text-[#a3a3a3] hover:text-white border border-[#262626] hover:border-[#525252]'
              }`}
            >
              {category.name} {productCount > 0 && `(${productCount})`}
            </button>
          )
        })}
      </div>

      {/* Products Grid */}
      <div className="mb-8 text-center">
        <p className="text-sm text-[#737373] font-light tracking-wide">
          Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
          {selectedCategoryId !== 'all' && categories.find(c => c.id === selectedCategoryId) && (
            <span> in {categories.find(c => c.id === selectedCategoryId)?.name}</span>
          )}
        </p>
      </div>
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[#a3a3a3] text-lg">No products found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
          <div
            key={product.id}
            className={`bg-[#171717] border border-[#262626] overflow-hidden hover:border-[#525252] transition-colors group ${enabled ? 'led-strip-glow' : ''}`}
          >
            {product.imageUrl && (
              <div className="aspect-square overflow-hidden bg-[#0a0a0a]">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            <div className="p-6">
              <h2 className="text-base font-medium mb-3 text-white tracking-wide">{product.name}</h2>
              {product.description && (
                <p className="text-gray-500 text-xs mb-4 line-clamp-2 font-light">
                  {product.description}
                </p>
              )}
              <div className="flex items-center justify-between pt-4 border-t border-[#262626]">
                {product.price && (
                  <p className="text-lg font-medium text-white">
                    ${product.price.toFixed(2)}
                  </p>
                )}
                <Link href="/order">
                  <button className="text-xs font-medium text-[#a3a3a3] hover:text-white uppercase tracking-wider transition-colors">
                    Configure →
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  )
}

