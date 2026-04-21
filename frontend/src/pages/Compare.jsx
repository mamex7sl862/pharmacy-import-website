import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import useRFQStore from '../store/rfqStore'

const COMPARE_FIELDS = [
  { key: 'genericName', label: 'Strength / Generic' },
  { key: 'packageSize', label: 'Pack Size' },
  { key: 'brand', label: 'Manufacturer' },
  { key: 'category', label: 'Category' },
  { key: 'description', label: 'Description' },
]

export default function Compare() {
  const [selectedIds, setSelectedIds] = useState([])
  const { addProduct, selectedProducts } = useRFQStore()

  const { data: allProducts } = useQuery({
    queryKey: ['products-compare-list'],
    queryFn: () => api.get('/products', { params: { page: 1, limit: 50 } }).then((r) => r.data),
  })

  const { data: compareProducts } = useQuery({
    queryKey: ['products-compare', selectedIds],
    queryFn: () => Promise.all(selectedIds.map((id) => api.get(`/products/${id}`).then((r) => r.data))),
    enabled: selectedIds.length > 0,
  })

  const addToCompare = (id) => {
    if (selectedIds.length >= 3 || selectedIds.includes(id)) return
    setSelectedIds((prev) => [...prev, id])
  }
  const removeFromCompare = (id) => setSelectedIds((prev) => prev.filter((i) => i !== id))
  const rfqCount = selectedProducts.length

  return (
    <div className="p-6 md:p-10 pb-24 md:pb-10 min-w-0">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-headline font-bold text-3xl tracking-tight text-on-surface mb-1">Comparative Analysis</h1>
          <p className="text-on-surface-variant text-sm">
            Compare up to 3 products side by side.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-low text-primary font-semibold rounded-xl hover:bg-surface-container-high transition-all self-start">
          <span className="material-symbols-outlined text-lg">share</span>
          Export PDF
        </button>
      </div>

      {/* Product selector */}
      {allProducts?.items?.length > 0 && (
        <div className="mb-8 p-5 bg-surface-container-low rounded-2xl">
          <p className="text-xs font-bold text-outline uppercase tracking-widest mb-3">
            Select up to 3 products to compare
            <span className="ml-2 text-primary normal-case font-normal">({selectedIds.length}/3 selected)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {allProducts.items.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCompare(p.id)}
                disabled={selectedIds.length >= 3 && !selectedIds.includes(p.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedIds.includes(p.id)
                    ? 'bg-primary text-white'
                    : 'bg-surface-container text-on-surface-variant hover:bg-secondary-container hover:text-primary disabled:opacity-40'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Comparison table */}
      {compareProducts && compareProducts.length > 0 ? (
        <div className="bg-surface-container-low rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-surface-container-low z-20 min-w-[180px] p-5 text-left border-r border-outline-variant/10">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">Parameters</span>
                  </th>
                  {compareProducts.map((p) => (
                    <th key={p.id} className="min-w-[220px] p-5 bg-surface-container-lowest border-l border-outline-variant/10">
                      <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 mb-3 rounded-xl overflow-hidden bg-surface-container-high flex items-center justify-center">
                          {p.imageUrl
                            ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                            : <span className="material-symbols-outlined text-2xl text-outline/30">medication</span>}
                        </div>
                        <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container rounded-full text-[10px] font-bold uppercase mb-1 capitalize">{p.category}</span>
                        <h2 className="font-headline font-bold text-base text-primary mb-0.5">{p.name}</h2>
                        <p className="text-xs text-on-surface-variant">{p.brand}</p>
                        <button onClick={() => removeFromCompare(p.id)} className="mt-2 text-outline hover:text-error transition-colors">
                          <span className="material-symbols-outlined text-base">close</span>
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-sm">
                {COMPARE_FIELDS.map((field) => (
                  <tr key={field.key}>
                    <td className="sticky left-0 bg-surface-container-low p-4 font-bold text-on-surface border-r border-outline-variant/10">{field.label}</td>
                    {compareProducts.map((p) => (
                      <td key={p.id} className="p-4 text-center bg-surface-container-lowest border-l border-outline-variant/10">{p[field.key] || '—'}</td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="sticky left-0 bg-surface-container-low p-5 border-r border-outline-variant/10" />
                  {compareProducts.map((p) => (
                    <td key={p.id} className="p-5 bg-surface-container-lowest border-l border-outline-variant/10">
                      <button
                        onClick={() => addProduct(p)}
                        className="w-full py-2.5 signature-gradient text-white font-bold rounded-xl shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 text-sm"
                      >
                        Add to RFQ
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-on-surface-variant">
          <span className="material-symbols-outlined text-6xl mb-4 block opacity-30">compare</span>
          <p className="font-medium text-lg">Select products above to compare</p>
          <p className="text-sm mt-1">Choose up to 3 products from the list above.</p>
        </div>
      )}

      {/* Info cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { icon: 'verified', bg: 'bg-primary-fixed', color: 'text-primary', title: 'Verified Sources', desc: 'All manufacturers are WHO-GMP certified.' },
          { icon: 'speed', bg: 'bg-tertiary-fixed', color: 'text-tertiary', title: 'Real-time Stock', desc: 'Inventory synced every 15 minutes.' },
          { icon: 'local_shipping', bg: 'bg-secondary-fixed', color: 'text-secondary', title: 'Cold Chain Ready', desc: 'IoT-monitored temperature-sensitive logistics.' },
        ].map((item) => (
          <div key={item.title} className="p-4 rounded-2xl bg-surface-container-lowest shadow-sm flex items-start gap-3">
            <div className={`p-2.5 ${item.bg} rounded-xl`}>
              <span className={`material-symbols-outlined ${item.color}`}>{item.icon}</span>
            </div>
            <div>
              <h4 className="font-bold text-on-surface text-sm">{item.title}</h4>
              <p className="text-xs text-on-surface-variant mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Floating RFQ bar */}
      {rfqCount > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl z-50">
          <div className="bg-white/80 backdrop-blur-xl border border-white/40 p-4 px-6 rounded-2xl shadow-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-lg">description</span>
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">{rfqCount} Items in RFQ Basket</p>
                <p className="text-[11px] text-on-surface-variant">Pending Quote</p>
              </div>
            </div>
            <Link to="/portal/rfq" className="bg-primary text-white px-5 py-2 rounded-xl font-bold text-sm shadow-lg hover:scale-105 active:scale-95 transition-all">
              Finalize RFQ
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
