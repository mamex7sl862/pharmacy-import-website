import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import AdminLayout from '../components/AdminLayout'

const CATEGORIES = ['prescription', 'otc', 'medical-supplies', 'surgical', 'laboratory', 'personal-care']

const EMPTY = { name: '', genericName: '', brand: '', category: 'prescription', packageSize: '', dosageForm: '', countryOfOrigin: '', description: '', imageUrl: '', price: '', currency: 'USD', stockQuantity: 0, isActive: true, isFeatured: false }

function ProductModal({ product, onClose, onSave, isSaving }) {
  const [form, setForm] = useState(product || EMPTY)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-surface-container">
          <h2 className="font-headline font-bold text-xl text-on-surface">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-outline uppercase tracking-widest">Product Name *</label>
              <input value={form.name} onChange={set('name')} placeholder="e.g. Amoxicillin 500mg" className="input-field" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-outline uppercase tracking-widest">Generic Name</label>
              <input value={form.genericName} onChange={set('genericName')} placeholder="e.g. Amoxicillin Trihydrate" className="input-field" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-outline uppercase tracking-widest">Brand</label>
              <input value={form.brand} onChange={set('brand')} placeholder="e.g. GlaxoSmithKline" className="input-field" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-outline uppercase tracking-widest">Category *</label>
              <div className="relative">
                <select value={form.category} onChange={set('category')} className="input-field appearance-none">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-3 text-outline pointer-events-none">expand_more</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-outline uppercase tracking-widest">Package Size</label>
              <input value={form.packageSize} onChange={set('packageSize')} placeholder="e.g. Box of 100 Capsules" className="input-field" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-outline uppercase tracking-widest">Dosage Form</label>
              <input value={form.dosageForm} onChange={set('dosageForm')} placeholder="e.g. Tablet, Capsule, Injection, Syrup" className="input-field" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-outline uppercase tracking-widest">Country of Origin</label>
              <input value={form.countryOfOrigin} onChange={set('countryOfOrigin')} placeholder="e.g. Germany, India, USA" className="input-field" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-outline uppercase tracking-widest">Image URL</label>
              <input value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://images.unsplash.com/..." className="input-field" />
              {form.imageUrl && (
                <img src={form.imageUrl} alt="preview" className="mt-2 h-24 w-24 object-cover rounded-xl" onError={(e) => e.target.style.display='none'} />
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-outline uppercase tracking-widest">Unit Price</label>
              <input
                type="number" min="0" step="0.01"
                value={form.price} onChange={set('price')}
                placeholder="0.00"
                className="input-field"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-outline uppercase tracking-widest">Currency</label>
              <select value={form.currency} onChange={set('currency')} className="input-field">
                {['USD','ETB'].map((c) => <option key={c} value={c}>{c === 'USD' ? 'USD — US Dollar' : 'ETB — Ethiopian Birr'}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-outline uppercase tracking-widest">Stock Quantity</label>
              <input
                type="number" min="0" step="1"
                value={form.stockQuantity} onChange={set('stockQuantity')}
                placeholder="0"
                className="input-field"
              />
              <p className="text-[10px] text-outline">Units available in inventory. Customers cannot request more than this.</p>
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-outline uppercase tracking-widest">Description</label>
              <textarea value={form.description} onChange={set('description')} rows={3} placeholder="Short product description..." className="input-field resize-none" />
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={set('isActive')} className="rounded text-primary h-4 w-4" />
              <span className="text-sm font-medium text-on-surface">Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={set('isFeatured')} className="rounded text-primary h-4 w-4" />
              <span className="text-sm font-medium text-on-surface">Featured on Homepage</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-surface-container">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-on-surface-variant font-bold hover:bg-surface-container transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={isSaving || !form.name || !form.category}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : product ? 'Save Changes' : 'Add Product'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminProducts() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null) // null | 'new' | product object
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => api.get('/admin/products').then((r) => r.data),
  })

  const createProduct = useMutation({
    mutationFn: (data) => api.post('/admin/products', data),
    onSuccess: () => { qc.invalidateQueries(['admin-products']); setModal(null) },
  })

  const updateProduct = useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/admin/products/${id}`, data),
    onSuccess: () => { qc.invalidateQueries(['admin-products']); setModal(null) },
  })

  const deleteProduct = useMutation({
    mutationFn: (id) => api.delete(`/admin/products/${id}`),
    onSuccess: () => { qc.invalidateQueries(['admin-products']); setDeleteConfirm(null) },
  })

  const togglePublish = useMutation({
    mutationFn: (id) => api.patch(`/admin/products/${id}/publish`),
    onSuccess: () => qc.invalidateQueries(['admin-products']),
  })

  const handleSave = (form) => {
    if (modal?.id) {
      updateProduct.mutate({ id: modal.id, ...form })
    } else {
      createProduct.mutate(form)
    }
  }

  const filtered = (products || []).filter((p) => {
    const q = search.toLowerCase()
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q) || p.genericName?.toLowerCase().includes(q)
    const matchCat = !catFilter || p.category === catFilter
    return matchSearch && matchCat
  })

  return (
    <AdminLayout title="Products" subtitle="Manage your pharmaceutical product catalog.">

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, brand, generic..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-high border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="px-4 py-2.5 bg-surface-container-high border-none rounded-xl text-sm outline-none"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button
          onClick={() => setModal('new')}
          className="btn-primary flex items-center gap-2 whitespace-nowrap"
        >
          <span className="material-symbols-outlined">add</span>
          Add Product
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-6 text-sm text-on-surface-variant">
        <span>{filtered.length} products</span>
        <span>·</span>
        <span>{filtered.filter((p) => p.isActive).length} active</span>
        <span>·</span>
        <span>{filtered.filter((p) => p.isFeatured).length} featured</span>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-surface-container-lowest rounded-2xl p-4 animate-pulse">
              <div className="aspect-[4/3] rounded-xl bg-surface-container mb-4" />
              <div className="h-4 bg-surface-container rounded mb-2 w-2/3" />
              <div className="h-3 bg-surface-container rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-on-surface-variant">
          <span className="material-symbols-outlined text-5xl mb-3 block opacity-30">inventory_2</span>
          <p className="font-medium">No products found</p>
          <button onClick={() => setModal('new')} className="text-primary font-bold text-sm mt-2 hover:underline">
            Add your first product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((product) => (
            <div key={product.id} className={`bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group ${!product.isActive ? 'opacity-60' : ''}`}>
              {/* Image */}
              <div className="aspect-[4/3] bg-surface-container-low relative overflow-hidden">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-outline/30">medication</span>
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-1.5">
                  {product.isFeatured && (
                    <span className="bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Featured</span>
                  )}
                  {!product.isActive && (
                    <span className="bg-slate-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Inactive</span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-1">{product.brand}</p>
                <h3 className="font-headline font-bold text-base text-on-surface leading-tight mb-1">{product.name}</h3>
                {product.genericName && <p className="text-xs text-on-surface-variant mb-1">{product.genericName}</p>}
                <p className="text-xs text-outline mb-3">{product.packageSize}</p>
                <span className="inline-block px-2 py-0.5 bg-secondary-container text-on-secondary-container rounded-full text-[10px] font-bold uppercase mb-4">
                  {product.category}
                </span>
                {product.price && (
                  <p className="text-sm font-bold text-primary mb-2">
                    {product.currency || 'USD'} {parseFloat(product.price).toFixed(2)}
                  </p>
                )}
                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${product.stockQuantity > 10 ? 'bg-green-50 text-green-700' : product.stockQuantity > 0 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}`}>
                    {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setModal(product)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-primary/20 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    Edit
                  </button>
                  <button
                    onClick={() => togglePublish.mutate(product.id)}
                    disabled={togglePublish.isPending}
                    title={product.isActive ? 'Unpublish — hide from catalog' : 'Publish — show in catalog'}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 ${
                      product.isActive
                        ? 'border border-amber-300 text-amber-700 hover:bg-amber-500 hover:text-white hover:border-amber-500'
                        : 'border border-emerald-300 text-emerald-700 hover:bg-emerald-500 hover:text-white hover:border-emerald-500'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {product.isActive ? 'visibility_off' : 'visibility'}
                    </span>
                    {product.isActive ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(product)}
                    className="p-2 rounded-xl border border-outline-variant/30 text-outline hover:text-error hover:border-error/30 transition-all"
                    title="Delete product"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product modal */}
      {modal && (
        <ProductModal
          product={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          isSaving={createProduct.isPending || updateProduct.isPending}
        />
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
            <span className="material-symbols-outlined text-error text-4xl mb-4 block" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            <h3 className="font-headline font-bold text-xl text-on-surface mb-2">Deactivate Product?</h3>
            <p className="text-sm text-on-surface-variant mb-6">
              "{deleteConfirm.name}" will be hidden from the catalog. This can be undone by editing the product.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-outline-variant text-on-surface font-bold hover:bg-surface-container transition-colors">
                Cancel
              </button>
              <button
                onClick={() => deleteProduct.mutate(deleteConfirm.id)}
                disabled={deleteProduct.isPending}
                className="flex-1 py-2.5 rounded-xl bg-error text-white font-bold hover:opacity-90 transition-colors disabled:opacity-50"
              >
                {deleteProduct.isPending ? 'Removing...' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
