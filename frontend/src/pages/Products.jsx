import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import api from '../lib/api'
import useRFQStore from '../store/rfqStore'

const STATIC_PRODUCTS = [
  { id: 's1',  name: 'Amoxicillin 500mg',        genericName: 'Amoxicillin Trihydrate',  brand: 'GlaxoSmithKline',  category: 'prescription',     packageSize: 'Box / 100 Caps',       imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=75' },
  { id: 's2',  name: 'Aspirin 100mg',             genericName: 'Acetylsalicylic Acid',   brand: 'Bayer AG',         category: 'prescription',     packageSize: 'Box / 100 Tabs',       imageUrl: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=400&q=75' },
  { id: 's3',  name: 'Lantus SoloStar',           genericName: 'Insulin Glargine',       brand: 'Sanofi S.A.',      category: 'prescription',     packageSize: '5 × 3ml Pens',         imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&q=75' },
  { id: 's4',  name: 'Metformin HCL 1000mg',      genericName: 'Metformin Hydrochloride',brand: 'Bayer Healthcare', category: 'prescription',     packageSize: 'Box / 60 Tabs',        imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&q=75' },
  { id: 's5',  name: 'Nexium 40mg',               genericName: 'Esomeprazole Magnesium', brand: 'AstraZeneca',      category: 'prescription',     packageSize: 'Box / 28 Caps',        imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&q=75' },
  { id: 's6',  name: 'Antiseptic Solution 500ml', genericName: 'Chloroxylenol 4.8%',     brand: 'RB Health',        category: 'otc',              packageSize: '500ml Bottle',         imageUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&q=75' },
  { id: 's7',  name: 'Vitamin C 1000mg',          genericName: 'Ascorbic Acid',          brand: 'NutraCare',        category: 'otc',              packageSize: '90 Effervescent Tabs', imageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&q=75' },
  { id: 's8',  name: 'Paracetamol 500mg',         genericName: 'Acetaminophen',          brand: 'Generic Pharma',   category: 'otc',              packageSize: 'Box / 100 Tabs',       imageUrl: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=400&q=75' },
  { id: 's9',  name: 'N95 Respirator Mask',       genericName: 'Filtering Facepiece',    brand: 'MedShield',        category: 'medical-supplies', packageSize: 'Box / 20 Masks',       imageUrl: 'https://images.unsplash.com/photo-1584634731339-252c581abfc5?w=400&q=75' },
  { id: 's10', name: 'Nitrile Gloves M',          genericName: 'Powder-Free Nitrile',    brand: 'Ansell',           category: 'medical-supplies', packageSize: 'Box / 100 Gloves',     imageUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&q=75' },
  { id: 's11', name: 'Disposable Syringe 5ml',    genericName: 'Sterile Luer-Lock',      brand: 'BD Medical',       category: 'medical-supplies', packageSize: 'Box / 100 Syringes',   imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&q=75' },
  { id: 's12', name: 'Surgical Scalpel No.22',    genericName: 'Stainless Steel Blade',  brand: 'Swann-Morton',     category: 'surgical',         packageSize: 'Box / 100 Blades',     imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&q=75' },
  { id: 's13', name: 'Absorbable Suture 2-0',     genericName: 'Polyglycolic Acid',      brand: 'Ethicon',          category: 'surgical',         packageSize: 'Box / 12 Sutures',     imageUrl: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&q=75' },
  { id: 's14', name: 'Blood Glucose Meter',       genericName: 'Portable Glucometer',    brand: 'Roche Diagnostics',category: 'laboratory',       packageSize: '1 Device + 50 Strips', imageUrl: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&q=75' },
  { id: 's15', name: 'PCR Test Kit',              genericName: 'RT-PCR Diagnostic Kit',  brand: 'Roche Diagnostics',category: 'laboratory',       packageSize: 'Box / 96 Tests',       imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&q=75' },
  { id: 's16', name: 'Urine Dipstick 10 Panel',   genericName: 'Multi-Parameter Strip',  brand: 'Siemens',          category: 'laboratory',       packageSize: 'Bottle / 100 Strips',  imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=75' },
  { id: 's17', name: 'Vitamin D3 1000IU',         genericName: 'Cholecalciferol',        brand: 'NutraCare',        category: 'personal-care',    packageSize: '90 Softgels',          imageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&q=75' },
  { id: 's18', name: 'Omega-3 Fish Oil 1000mg',   genericName: 'EPA/DHA Omega-3',        brand: 'Nordic Naturals',  category: 'personal-care',    packageSize: '90 Softgels',          imageUrl: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=400&q=75' },
  { id: 's19', name: 'Multivitamin Complete',     genericName: 'Multi-Vitamin/Mineral',  brand: 'Centrum',          category: 'personal-care',    packageSize: 'Box / 60 Tabs',        imageUrl: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=400&q=75' },
]

const CATEGORY_CONFIG = {
  'prescription':     { icon: 'medication',      pill: 'bg-blue-50 text-blue-600',    dot: 'bg-blue-400',    label: 'Rx' },
  'otc':              { icon: 'pill',             pill: 'bg-green-50 text-green-600',  dot: 'bg-green-400',   label: 'OTC' },
  'medical-supplies': { icon: 'medical_services', pill: 'bg-violet-50 text-violet-600',dot: 'bg-violet-400',  label: 'Medical' },
  'surgical':         { icon: 'content_cut',      pill: 'bg-red-50 text-red-600',      dot: 'bg-red-400',     label: 'Surgical' },
  'laboratory':       { icon: 'biotech',          pill: 'bg-amber-50 text-amber-600',  dot: 'bg-amber-400',   label: 'Lab' },
  'personal-care':    { icon: 'nutrition',        pill: 'bg-teal-50 text-teal-600',    dot: 'bg-teal-400',    label: 'Wellness' },
}

const CATEGORIES = [
  { key: '',                 label: 'All Products',    icon: 'apps' },
  { key: 'prescription',     label: 'Prescription',    icon: 'medication' },
  { key: 'otc',              label: 'OTC',             icon: 'pill' },
  { key: 'medical-supplies', label: 'Medical Supplies',icon: 'medical_services' },
  { key: 'surgical',         label: 'Surgical',        icon: 'content_cut' },
  { key: 'laboratory',       label: 'Laboratory',      icon: 'biotech' },
  { key: 'personal-care',    label: 'Personal Care',   icon: 'nutrition' },
]

const MANUFACTURERS = ['GlaxoSmithKline', 'Pfizer Inc.', 'Sanofi S.A.', 'Novartis AG']

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2200); return () => clearTimeout(t) }, [onDone])
  return (
    <div className="fixed top-20 right-6 z-[100] bg-gray-900 text-white px-4 py-3 rounded-xl flex items-center gap-3 shadow-2xl animate-fade-in">
      <span className="material-symbols-outlined text-green-400 text-lg">check_circle</span>
      <div>
        <p className="text-sm font-semibold">Added to RFQ</p>
        <p className="text-xs text-gray-400 truncate max-w-[180px]">{message}</p>
      </div>
    </div>
  )
}

// ── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({ product, isAdded, onAdd }) {
  const [imgError, setImgError] = useState(false)
  const outOfStock = product.stockStatus === 'unavailable' || product.inStock === false
  const cfg        = CATEGORY_CONFIG[product.category] || CATEGORY_CONFIG['prescription']

  return (
    <div className={`bg-white rounded-xl border border-gray-100 hover:border-primary/25 hover:shadow-md transition-all duration-200 group flex flex-col overflow-hidden ${outOfStock ? 'opacity-60' : ''}`}>

      {/* Image — compact fixed height */}
      <div className="relative h-36 bg-gray-50 flex-shrink-0 overflow-hidden">
        {product.imageUrl && !imgError ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <span className="material-symbols-outlined text-5xl text-gray-200" style={{ fontVariationSettings: "'FILL' 1" }}>
              {cfg.icon}
            </span>
          </div>
        )}
        {/* Category pill */}
        <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-sm ${cfg.pill}`}>
          {cfg.label}
        </span>
        {/* Stock indicator */}
        {outOfStock && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600">
            Out of Stock
          </span>
        )}
        {!outOfStock && product.stockStatus === 'limited' && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
            Limited Stock
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1">
        {/* Brand */}
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider truncate mb-0.5">{product.brand}</p>

        {/* Name */}
        <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 mb-1">{product.name}</h3>

        {/* Generic name */}
        {product.genericName && (
          <p className="text-xs text-gray-500 truncate mb-2">{product.genericName}</p>
        )}

        {/* Pack size + price */}
        <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1 min-w-0">
            <span className="material-symbols-outlined text-gray-400 text-sm flex-shrink-0">inventory_2</span>
            <span className="text-xs text-gray-500 truncate">{product.packageSize}</span>
          </div>
          {product.price && (
            <span className="text-xs font-bold text-primary ml-2 flex-shrink-0">
              {product.currency || 'USD'} {parseFloat(product.price).toFixed(2)}
            </span>
          )}
        </div>

        {/* Add to RFQ button */}
        <button
          onClick={() => !isAdded && !outOfStock && onAdd(product)}
          disabled={isAdded || outOfStock}
          className={`mt-3 w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
            outOfStock
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : isAdded
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-primary/5 text-primary border border-primary/20 hover:bg-primary hover:text-white hover:border-primary'
          }`}
        >
          <span className="material-symbols-outlined text-sm">
            {outOfStock ? 'block' : isAdded ? 'check' : 'add_shopping_cart'}
          </span>
          {outOfStock ? 'Unavailable' : isAdded ? 'Added to RFQ' : 'Add to RFQ'}
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch]             = useState('')
  const [toast, setToast]               = useState(null)
  const [selectedManufacturers, setSelectedManufacturers] = useState([])
  const [allCatsOpen, setAllCatsOpen]   = useState(false)
  const category = searchParams.get('category') || ''
  const { addProduct, selectedProducts } = useRFQStore()

  // Auto-open the dropdown when a sub-category is active
  useEffect(() => {
    if (category) setAllCatsOpen(true)
  }, [category])

  const toggleManufacturer = (m) =>
    setSelectedManufacturers(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])

  const { data, isLoading } = useQuery({
    queryKey: ['products', search, category],
    queryFn: () => api.get('/products', { params: { text: search, category, page: 1, limit: 24 } }).then(r => r.data),
    keepPreviousData: true,
    staleTime: 0,
    retry: 1,
  })

  const handleAdd = (product) => { addProduct(product); setToast(product.name) }

  const rawProducts = data?.items?.length > 0 ? data.items : STATIC_PRODUCTS
  const products = (data?.items?.length > 0
    ? rawProducts
    : rawProducts.filter(p => {
        const matchCat    = !category || p.category === category
        const q           = search.toLowerCase()
        const matchSearch = !q || p.name.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q) || p.genericName?.toLowerCase().includes(q)
        return matchCat && matchSearch
      })
  ).filter(p => selectedManufacturers.length === 0 || selectedManufacturers.some(m => p.brand?.toLowerCase().includes(m.toLowerCase())))

  return (
    <div className="bg-gray-50 min-h-screen font-body text-on-surface">
      <Helmet>
        <title>Product Catalog — PharmaLink Pro Pharmaceutical Wholesale</title>
        <meta name="description" content="Browse 10,000+ pharmaceutical products including prescription medicines, OTC drugs, medical supplies, surgical products, and laboratory equipment." />
        <link rel="canonical" href="https://pharmalinkwholesale.com/products" />
        <meta property="og:title" content="Product Catalog — PharmaLink Pro" />
        <meta property="og:description" content="Browse our certified range of international pharmaceutical products. Add to RFQ and receive a formal quotation within 24 hours." />
        <meta property="og:url" content="https://pharmalinkwholesale.com/products" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1200&q=85" />
        {products.length > 0 && (
          <script type="application/ld+json">{JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "PharmaLink Pro Product Catalog",
            "numberOfItems": products.length,
            "itemListElement": products.slice(0, 10).map((p, i) => ({
              "@type": "ListItem",
              "position": i + 1,
              "item": {
                "@type": "Product",
                "name": p.name,
                "brand": { "@type": "Brand", "name": p.brand },
                "category": p.category,
              }
            }))
          })}</script>
        )}
      </Helmet>
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {/* Page header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Product Catalog</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {products.length} product{products.length !== 1 ? 's' : ''} available
            </p>
          </div>
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products, brands..."
              className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 flex gap-6">

        {/* ── Sidebar ── */}
        <aside className="hidden lg:flex flex-col w-52 flex-shrink-0 self-start sticky top-20">

          {/* Categories */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Category</p>
            </div>
            <nav className="p-2">
              {CATEGORIES.map(cat => (
                cat.key === '' ? (
                  // "All Products" — toggles a dropdown of sub-categories
                  <div key="all">
                    <button
                      onClick={() => {
                        if (category) {
                          // If a category is active, clear it and close dropdown
                          setSearchParams({})
                          setAllCatsOpen(false)
                        } else {
                          // Toggle dropdown
                          setAllCatsOpen(o => !o)
                        }
                      }}
                      className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                        !category
                          ? 'bg-primary text-white font-semibold'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-base">{cat.icon}</span>
                        <span className="truncate">{cat.label}</span>
                      </div>
                      <span className={`material-symbols-outlined text-sm transition-transform duration-200 ${allCatsOpen ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                    </button>
                    {/* Sub-category dropdown */}
                    {allCatsOpen && (
                      <div className="mt-1 ml-2 border-l-2 border-primary/20 pl-2 space-y-0.5">
                        {CATEGORIES.filter(c => c.key !== '').map(sub => (
                          <button
                            key={sub.key}
                            onClick={() => {
                              setSearchParams({ category: sub.key })
                              setAllCatsOpen(false)
                            }}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                              category === sub.key
                                ? 'bg-primary/10 text-primary font-semibold'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm">{sub.icon}</span>
                            <span className="truncate">{sub.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null
              ))}
            </nav>
          </div>

          {/* Manufacturer filter */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Manufacturer</p>
              {selectedManufacturers.length > 0 && (
                <button onClick={() => setSelectedManufacturers([])} className="text-xs text-red-500 hover:text-red-700 font-medium">
                  Clear
                </button>
              )}
            </div>
            <div className="p-3 space-y-1">
              {MANUFACTURERS.map(m => (
                <label key={m} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 group">
                  <input
                    type="checkbox"
                    checked={selectedManufacturers.includes(m)}
                    onChange={() => toggleManufacturer(m)}
                    className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                  />
                  <span className={`text-xs transition-colors truncate ${selectedManufacturers.includes(m) ? 'text-primary font-semibold' : 'text-gray-600 group-hover:text-primary'}`}>
                    {m}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Product Grid ── */}
        <section className="flex-1 min-w-0">

          {/* Mobile category pills */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4 lg:hidden no-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setSearchParams(cat.key ? { category: cat.key } : {})}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  category === cat.key
                    ? 'bg-primary text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Active filter chip */}
          {(category || selectedManufacturers.length > 0) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {category && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                  {CATEGORIES.find(c => c.key === category)?.label}
                  <button onClick={() => setSearchParams({})} className="hover:text-primary/60">
                    <span className="material-symbols-outlined text-xs">close</span>
                  </button>
                </span>
              )}
              {selectedManufacturers.map(m => (
                <span key={m} className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                  {m}
                  <button onClick={() => toggleManufacturer(m)} className="hover:text-gray-500">
                    <span className="material-symbols-outlined text-xs">close</span>
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Skeleton */}
          {isLoading && !data ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
                  <div className="h-36 bg-gray-100" />
                  <div className="p-3 space-y-2">
                    <div className="h-2.5 bg-gray-100 rounded w-1/3" />
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <span className="material-symbols-outlined text-5xl mb-3 block opacity-30">search_off</span>
              <p className="font-medium text-gray-600">No products found</p>
              <p className="text-sm mt-1">Try a different search term or category.</p>
              <button
                onClick={() => { setSearch(''); setSearchParams({}) }}
                className="mt-4 text-sm text-primary font-medium hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isAdded={selectedProducts.some(p => p.productId === product.id)}
                  onAdd={handleAdd}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Sticky RFQ bar */}
      {selectedProducts.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-xl">
          <div className="bg-white border border-gray-200 rounded-2xl px-5 py-3 flex items-center justify-between shadow-xl shadow-gray-200/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-lg">description</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {selectedProducts.length} item{selectedProducts.length !== 1 ? 's' : ''} in RFQ
                </p>
                <p className="text-xs text-gray-500">Ready to request quote</p>
              </div>
            </div>
            <Link
              to="/portal/rfq"
              className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
            >
              Review RFQ →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
