import { useState, useEffect } from 'react'
import { apiRequest } from '../lib/api'
import { useLightStudio } from '../contexts/LightStudioContext'

interface Category {
  id: number
  square_category_id: string | null
  name: string
  display_name: string
  description: string | null
  is_active: boolean
  display_order: number
  product_count?: number
}

export default function AdminCategories() {
  const { state } = useLightStudio()
  const { enabled } = state
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [diagnosticData, setDiagnosticData] = useState<any>(null)
  const [loadingDiagnostic, setLoadingDiagnostic] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    is_active: true,
    display_order: 0,
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    try {
      setLoading(true)
      const data = await apiRequest('/api/admin/categories?includeInactive=true')
      setCategories(data.categories || [])
      setError(null)
    } catch (err: any) {
      setError(err?.error || 'Failed to fetch categories')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    try {
      await apiRequest('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify(formData),
      })
      setShowCreateForm(false)
      setFormData({ name: '', display_name: '', description: '', is_active: true, display_order: 0 })
      fetchCategories()
    } catch (err: any) {
      setError(err?.error || 'Failed to create category')
    }
  }

  async function handleUpdate(category: Category) {
    try {
      await apiRequest(`/api/admin/categories/${category.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: category.name,
          display_name: category.display_name,
          description: category.description,
          is_active: category.is_active,
          display_order: category.display_order,
        }),
      })
      setEditingCategory(null)
      fetchCategories()
    } catch (err: any) {
      setError(err?.error || 'Failed to update category')
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this category? This will also remove all product assignments.')) {
      return
    }
    try {
      await apiRequest(`/api/admin/categories/${id}`, {
        method: 'DELETE',
      })
      fetchCategories()
    } catch (err: any) {
      setError(err?.error || 'Failed to delete category')
    }
  }

  async function handleSync() {
    try {
      setSyncing(true)
      const result = await apiRequest('/api/admin/categories/sync', {
        method: 'POST',
      })
      alert(`Sync complete! Created: ${result.created}, Updated: ${result.updated}`)
      fetchCategories()
    } catch (err: any) {
      setError(err?.error || 'Failed to sync categories')
    } finally {
      setSyncing(false)
    }
  }

  async function handleDiagnostic() {
    try {
      setLoadingDiagnostic(true)
      setError(null)
      const data = await apiRequest('/api/square/categories/diagnostic')
      console.log('Diagnostic data received:', data)
      setDiagnosticData(data)
    } catch (err: any) {
      console.error('Diagnostic error:', err)
      setError(err?.error || err?.message || 'Failed to run diagnostic')
      setDiagnosticData(null)
    } finally {
      setLoadingDiagnostic(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-white">Loading categories...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-white tracking-tight">Category Management</h1>
          <p className="text-[#a3a3a3] font-light">Manage product categories and their display settings</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDiagnostic}
            disabled={loadingDiagnostic}
            className="px-4 py-2 bg-[#525252] text-white rounded-lg hover:bg-[#404040] disabled:opacity-50"
          >
            {loadingDiagnostic ? 'Loading...' : 'Run Diagnostic'}
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 bg-[#404040] text-white rounded-lg hover:bg-[#525252] disabled:opacity-50"
          >
            {syncing ? 'Syncing...' : 'Sync from Square'}
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-[#f5f5f5] text-[#171717] rounded-lg hover:bg-[#e5e5e5]"
          >
            + Create Category
          </button>
        </div>
      </div>

      {error && (
        <div className={`bg-[#0a0a0a] border-2 border-[#404040] p-4 mb-6 ${enabled ? 'led-strip-glow' : ''}`}>
          <p className="text-[#a3a3a3]">{error}</p>
        </div>
      )}

      {diagnosticData && (
        <div className={`bg-[#0a0a0a] border-2 border-[#404040] p-6 mb-6 ${enabled ? 'led-strip-glow' : ''}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Square Category Diagnostic</h2>
            <button
              onClick={() => setDiagnosticData(null)}
              className="px-3 py-1 border border-[#404040] text-white rounded text-sm hover:bg-[#171717]"
            >
              Close
            </button>
          </div>
          
          {/* Always show raw data first for debugging */}
          <details className="mb-4" open>
            <summary className="text-[#a3a3a3] text-sm cursor-pointer hover:text-white font-medium mb-2">View Raw JSON Data</summary>
            <pre className="mt-2 p-3 bg-[#171717] border border-[#262626] rounded text-xs text-[#a3a3a3] overflow-auto max-h-96 font-mono">
              {JSON.stringify(diagnosticData, null, 2)}
            </pre>
          </details>

          {/* Structured view */}
          <div className="space-y-4 text-sm mt-4">
            <div>
              <h3 className="font-semibold text-white mb-2">Square Categories</h3>
              <p className="text-[#a3a3a3]">
                Total: {String(diagnosticData.squareCategories?.total ?? diagnosticData.summary?.squareCategoryCount ?? 'N/A')}
              </p>
              {diagnosticData.squareCategories?.categories && Array.isArray(diagnosticData.squareCategories.categories) && diagnosticData.squareCategories.categories.length > 0 ? (
                <div className="mt-2 max-h-40 overflow-y-auto border border-[#262626] rounded p-2">
                  {diagnosticData.squareCategories.categories.map((cat: any, idx: number) => {
                    // Ensure we're rendering strings, not objects
                    const catName = typeof cat === 'object' && cat !== null ? (cat.name || cat.id || 'Unnamed') : String(cat || 'Unnamed');
                    const catId = typeof cat === 'object' && cat !== null ? (cat.id || 'N/A') : 'N/A';
                    return (
                      <div key={cat?.id || cat?.name || idx} className="text-[#a3a3a3] text-xs py-1">
                        {catName} (ID: {catId})
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[#737373] text-xs mt-2">No categories found in Square</p>
              )}
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-2">Products</h3>
              <p className="text-[#a3a3a3]">
                Total: {(() => {
                  const total = diagnosticData.products?.total;
                  if (total !== undefined && total !== null) return total;
                  const withCats = diagnosticData.summary?.productsWithCategories ?? 0;
                  const withoutCats = diagnosticData.summary?.productsWithoutCategories ?? 0;
                  const calculated = withCats + withoutCats;
                  return calculated > 0 ? calculated : 'N/A';
                })()}
              </p>
              <p className="text-[#a3a3a3]">
                With Categories: {String(diagnosticData.products?.withCategories ?? diagnosticData.summary?.productsWithCategories ?? 'N/A')}
              </p>
              <p className="text-[#a3a3a3]">
                Without Categories: {String(diagnosticData.products?.withoutCategories ?? diagnosticData.summary?.productsWithoutCategories ?? 'N/A')}
              </p>
            </div>
            
            {diagnosticData.categoryIdsFromProducts && Array.isArray(diagnosticData.categoryIdsFromProducts) && diagnosticData.categoryIdsFromProducts.length > 0 ? (
              <div>
                <h3 className="font-semibold text-white mb-2">Category IDs Found in Products</h3>
                <div className="mt-2 max-h-40 overflow-y-auto border border-[#262626] rounded p-2">
                  {diagnosticData.categoryIdsFromProducts.map((id: string, index: number) => (
                    <div key={id || `cat-${index}`} className="text-[#a3a3a3] text-xs py-1 font-mono">
                      {String(id)}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            
            {diagnosticData.sampleProducts && Array.isArray(diagnosticData.sampleProducts) && diagnosticData.sampleProducts.length > 0 ? (
              <div>
                <h3 className="font-semibold text-white mb-2">Sample Products with Categories</h3>
                <div className="mt-2 max-h-40 overflow-y-auto border border-[#262626] rounded p-2">
                  {diagnosticData.sampleProducts.map((product: any, idx: number) => (
                    <div key={product?.id || `prod-${idx}`} className="text-[#a3a3a3] text-xs py-1">
                      <span className="font-medium">{product?.name || 'Unnamed Product'}</span>
                      {' - '}
                      <span>Categories: {product?.categoryIds && Array.isArray(product.categoryIds) ? product.categoryIds.join(', ') : 'None'}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            
            {diagnosticData.summary && (
              <div className="mt-4 pt-4 border-t border-[#262626]">
                <h3 className="font-semibold text-white mb-2">Summary</h3>
                <div className="text-[#a3a3a3] text-xs space-y-1">
                  <p>Square Categories: {String(diagnosticData.summary.squareCategoryCount ?? 'N/A')}</p>
                  <p>Unique Category IDs in Products: {String(diagnosticData.summary.uniqueCategoryIdsInProducts ?? 'N/A')}</p>
                  <p>Products with Categories: {String(diagnosticData.summary.productsWithCategories ?? 'N/A')}</p>
                  <p>Products without Categories: {String(diagnosticData.summary.productsWithoutCategories ?? 'N/A')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showCreateForm && (
        <div className={`bg-[#0a0a0a] border-2 border-[#404040] p-6 mb-6 ${enabled ? 'led-strip-glow' : ''}`}>
          <h2 className="text-xl font-bold mb-4 text-white">Create New Category</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-[#404040] bg-[#171717] text-white rounded-lg"
                placeholder="Category name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Display Name</label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                className="w-full px-4 py-2 border border-[#404040] bg-[#171717] text-white rounded-lg"
                placeholder="Display name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Display Order</label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-[#404040] bg-[#171717] text-white rounded-lg"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-5 h-5"
              />
              <label className="text-white">Active (visible on frontend)</label>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-[#f5f5f5] text-[#171717] rounded-lg hover:bg-[#e5e5e5]"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false)
                  setFormData({ name: '', display_name: '', description: '', is_active: true, display_order: 0 })
                }}
                className="px-4 py-2 border border-[#404040] text-white rounded-lg hover:bg-[#171717]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`bg-[#0a0a0a] border-2 border-[#404040] ${enabled ? 'led-strip-glow' : ''}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#171717] border-b border-[#262626]">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-white">Display Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-white">Square ID</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-white">Products</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-white">Order</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-white">Active</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-b border-[#262626] hover:bg-[#171717]">
                  {editingCategory?.id === category.id ? (
                    <>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editingCategory.display_name}
                          onChange={(e) => setEditingCategory({ ...editingCategory, display_name: e.target.value })}
                          className="w-full px-2 py-1 border border-[#404040] bg-[#0a0a0a] text-white rounded"
                        />
                      </td>
                      <td className="px-6 py-4 text-[#a3a3a3] text-sm">
                        {category.square_category_id || 'Custom'}
                      </td>
                      <td className="px-6 py-4 text-[#a3a3a3]">{category.product_count || 0}</td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={editingCategory.display_order}
                          onChange={(e) => setEditingCategory({ ...editingCategory, display_order: parseInt(e.target.value) || 0 })}
                          className="w-20 px-2 py-1 border border-[#404040] bg-[#0a0a0a] text-white rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={editingCategory.is_active}
                          onChange={(e) => setEditingCategory({ ...editingCategory, is_active: e.target.checked })}
                          className="w-5 h-5"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdate(editingCategory)}
                            className="px-3 py-1 bg-[#404040] text-white rounded text-sm hover:bg-[#525252]"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingCategory(null)}
                            className="px-3 py-1 border border-[#404040] text-white rounded text-sm hover:bg-[#171717]"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 text-white">{category.display_name}</td>
                      <td className="px-6 py-4 text-[#a3a3a3] text-sm">
                        {category.square_category_id || 'Custom'}
                      </td>
                      <td className="px-6 py-4 text-[#a3a3a3]">{category.product_count || 0}</td>
                      <td className="px-6 py-4 text-[#a3a3a3]">{category.display_order}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs ${category.is_active ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                          {category.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingCategory({ ...category })}
                            className="px-3 py-1 bg-[#404040] text-white rounded text-sm hover:bg-[#525252]"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
                            className="px-3 py-1 bg-red-900 text-red-300 rounded text-sm hover:bg-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
