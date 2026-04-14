import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import useRFQStore from '../store/rfqStore'

// Static fallback — only products with genuinely relevant images
const STATIC_PRODUCTS = [
  { id: 's1',  name: 'Amoxicillin 500mg',       genericName: 'Amoxicillin Trihydrate',    brand: 'GlaxoSmithKline',  category: 'prescription',    packageSize: 'Box of 100 Capsules',        imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80' },
  { id: 's2',  name: 'Aspirin 100mg',            genericName: 'Acetylsalicylic Acid',      brand: 'Bayer AG',         category: 'prescription',    packageSize: 'Box of 100 Tablets',         imageUrl: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=600&q=80' },
  { id: 's3',  name: 'Lantus SoloStar',          genericName: 'Insulin Glargine',          brand: 'Sanofi S.A.',      category: 'prescription',    packageSize: '5 × 3ml Prefilled Pens',     imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80' },
  { id: 's4',  name: 'Metformin HCL 1000mg',     genericName: 'Metformin Hydrochloride',   brand: 'Bayer Healthcare', category: 'prescription',    packageSize: 'Box of 60 Tablets',          imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=80' },
  { id: 's5',  name: 'Nexium 40mg',              genericName: 'Esomeprazole Magnesium',    brand: 'AstraZeneca',      category: 'prescription',    packageSize: 'Box of 28 Capsules',         imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80' },
  { id: 's6',  name: 'Antiseptic Solution 500ml',genericName: 'Chloroxylenol 4.8%',        brand: 'RB Health',        category: 'otc',             packageSize: '500ml Bottle',               imageUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&q=80' },
  { id: 's7',  name: 'Vitamin C 1000mg',         genericName: 'Ascorbic Acid',             brand: 'NutraCare',        category: 'otc',             packageSize: '90 Effervescent Tablets',    imageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&q=80' },
  { id: 's8',  name: 'Paracetamol 500mg',        genericName: 'Acetaminophen',             brand: 'Generic Pharma',   category: 'otc',             packageSize: 'Box of 100 Tablets',         imageUrl: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&q=80' },
  { id: 's9',  name: 'N95 Respirator Mask',      genericName: 'Filtering Facepiece',       brand: 'MedShield',        category: 'medical-supplies',packageSize: 'Box of 20 Masks',            imageUrl: 'https://images.unsplash.com/photo-1584634731339-252c581abfc5?w=600&q=80' },
  { id: 's10', name: 'Nitrile Examination Gloves M', genericName: 'Powder-Free Nitrile',   brand: 'Ansell',           category: 'medical-supplies',packageSize: 'Box of 100 Gloves',          imageUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&q=80' },
  { id: 's11', name: 'Disposable Syringe 5ml',   genericName: 'Sterile Luer-Lock Syringe', brand: 'BD Medical',       category: 'medical-supplies',packageSize: 'Box of 100 Syringes',        imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80' },
  { id: 's12', name: 'Surgical Scalpel No.22',   genericName: 'Stainless Steel Blade',     brand: 'Swann-Morton',     category: 'surgical',        packageSize: 'Box of 100 Blades',          imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80' },
  { id: 's13', name: 'Absorbable Suture 2-0',    genericName: 'Polyglycolic Acid Suture',  brand: 'Ethicon',          category: 'surgical',        packageSize: 'Box of 12 Sutures',          imageUrl: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=600&q=80' },
  { id: 's14', name: 'Blood Glucose Meter',      genericName: 'Portable Glucometer',       brand: 'Roche Diagnostics',category: 'laboratory',      packageSize: '1 Device + 50 Test Strips',  imageUrl: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=600&q=80' },
  { id: 's15', name: 'PCR Test Kit',             genericName: 'RT-PCR Diagnostic Kit',     brand: 'Roche Diagnostics',category: 'laboratory',      packageSize: 'Box of 96 Tests',            imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80' },
  { id: 's16', name: 'Urine Dipstick 10 Panel',  genericName: 'Multi-Parameter Strip',     brand: 'Siemens',          category: 'laboratory',      packageSize: 'Bottle of 100 Strips',       imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80' },
  { id: 's17', name: 'Vitamin D3 1000IU',        genericName: 'Cholecalciferol',           brand: 'NutraCare',        category: 'personal-care',   packageSize: '90 Softgel Capsules',        imageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&q=80' },
  { id: 's18', name: 'Omega-3 Fish Oil 1000mg',  genericName: 'EPA/DHA Omega-3',           brand: 'Nordic Naturals',  category: 'personal-care',   packageSize: '90 Softgel Capsules',        imageUrl: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=600&q=80' },
  { id: 's19', name: 'Multivitamin Complete',    genericName: 'Multi-Vitamin/Mineral',     brand: 'Centrum',          category: 'personal-care',   packageSize: 'Box of 60 Tablets',          imageUrl: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&q=80' },
]

const CATEGORY_CONFIG = {
  'prescription':    { icon: 'medication',       color: 'bg-blue-50',   iconColor: 'text-blue-400',   label: 'Rx' },
  'otc':             { icon: 'pill',              color: 'bg-green-50',  iconColor: 'text-green-400',  label: 'OTC' },
  'medical-supplies':{ icon: 'medical_services',  color: 'bg-purple-50', iconColor: 'text-purple-400', label: 'Medical' },
  'surgical':        { icon: 'content_cut',       color: 'bg-red-50',    iconColor: 'text-red-400',    label: 'Surgical' },
  'laboratory':      { icon: 'biotech',           color: 'bg-amber-50',  iconColor: 'text-amber-400',  label: 'Lab' },
  'personal-care':   { icon: 'nutrition',         color: 'bg-teal-50',   iconColor: 'text-teal-400',   label: 'Wellness' },
}
const CATEGORIES = [
  { key: '',               label: 'All Products',       icon: 'apps' },
  { key: 'prescription',   label: 'Prescription',       icon: 'medication' },
  { key: 'otc',            label: 'OTC',                icon: 'pill' },
  { key: 'medical-supplies', label: 'Medical Supplies', icon: 'medical_services' },
  { key: 'surgical',       label: 'Surgical',           icon: 'content_cut' },
  { key: 'laboratory',     label: 'Laboratory',         icon: 'biotech' },
  { key: 'personal-care',  label: 'Personal Care',      icon: 'nutrition' },
]

const MANUFACTURERS = ['GlaxoSmithKline', 'Pfizer Inc.', 'Sanofi S.A.', 'Novartis AG']

function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div className="fixed top-20 right-8 z-[100] bg-on-background text-white p-4 rounded-xl flex items-center gap-4 shadow-2xl pointer-events-none animate-fade-in">
      <span className="material-symbols-outlined text-green-400">check_circle</span>
      <div className="pr-8">
        <p className="text-sm font-bold">Added to RFQ</p>
        <p className="text-xs opacity-80">{message}</p>
      </div>
    </div>
  )
}

function ProductCard({ product, isAdded, onAdd }) {
  const [imgError, setImgError] = useState(false)

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,63,135,0.08)] group border border-transparent hover:border-primary/10">
      {/* Image */}
      <div className="aspect-[4/3] rounded-xl overflow-hidden mb-6 bg-surface-container-low relative">
        {product.imageUrl && !imgError ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
          />
        ) : (
          // Category-specific styled placeholder — looks professional without a real image
          (() => {
            const cfg = CATEGORY_CONFIG[product.category] || CATEGORY_CONFIG['prescription']
            return (
              <div className={`w-full h-full flex flex-col items-center justify-center gap-3 ${cfg.color}`}>
                <span className={`material-symbols-outlined text-5xl ${cfg.iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                  {cfg.icon}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${cfg.iconColor} opacity-60`}>
                  {cfg.label}
                </span>
              </div>
            )
          })()
        )}
        <span className="absolute top-4 right-4 bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
          In Stock
        </span>
      </div>

      {/* Info */}
      <div className="space-y-1 mb-6">
        <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest font-headline">{product.brand}</p>
        <h3 className="font-headline font-bold text-xl text-on-surface leading-tight">{product.name}</h3>
        {product.genericName && (
          <p className="text-sm text-on-surface-variant">
            Generic: <span className="font-medium">{product.genericName}</span>
          </p>
        )}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-container">
          <span className="material-symbols-outlined text-sm text-on-surface-variant">inventory_2</span>
          <span className="text-xs text-on-surface-variant">{product.packageSize}</span>
        </div>
      </div>

      {/* Action */}
      <button
        onClick={() => !isAdded && onAdd(product)}
        disabled={isAdded}
        className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
          isAdded
            ? 'bg-secondary-container text-on-secondary-container cursor-default'
            : 'border border-primary/20 text-primary hover:bg-primary hover:text-on-primary'
        }`}
      >
        <span className="material-symbols-outlined text-lg">{isAdded ? 'check' : 'add_shopping_cart'}</span>
        {isAdded ? 'Added to RFQ' : 'Add to RFQ'}
      </button>
    </div>
  )
}

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)
  const [selectedManufacturers, setSelectedManufacturers] = useState([])
  const category = searchParams.get('category') || ''
  const { addProduct, selectedProducts } = useRFQStore()

  const toggleManufacturer = (m) => {
    setSelectedManufacturers((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    )
  }

  const { data, isLoading } = useQuery({
    queryKey: ['products', search, category],
    queryFn: () => api.get('/products', { params: { text: search, category, page: 1, limit: 24 } }).then((r) => r.data),
    keepPreviousData: true,
    retry: 1,
  })

  const handleAdd = (product) => {
    addProduct(product)
    setToast(product.name)
  }

  // Use DB products if available, otherwise fall back to static list
  const rawProducts = data?.items?.length > 0 ? data.items : STATIC_PRODUCTS

  // Client-side filter for static products (DB already filters server-side)
  const products = (data?.items?.length > 0 ? rawProducts : rawProducts.filter((p) => {
    const matchCat = !category || p.category === category
    const q = search.toLowerCase()
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q) || p.genericName?.toLowerCase().includes(q)
    return matchCat && matchSearch
  })).filter((p) => {
    if (selectedManufacturers.length === 0) return true
    return selectedManufacturers.some((m) => p.brand?.toLowerCase().includes(m.toLowerCase()))
  })

  return (
    <div className="bg-surface font-body text-on-surface">
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      <main className="pt-8 pb-32 px-8 max-w-[1600px] mx-auto flex gap-12">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 flex-shrink-0">
          <div className="mb-8">
            <h2 className="font-headline font-extrabold text-2xl tracking-tight text-primary">Categories</h2>
            <p className="text-on-surface-variant text-sm mt-1">Filter by Therapeutic Class</p>
          </div>
          <div className="space-y-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSearchParams(cat.key ? { category: cat.key } : {})}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm transition-all text-left ${
                  category === cat.key
                    ? 'bg-blue-50 text-primary font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
          <div className="mt-8">
            <h3 className="font-headline font-bold text-sm uppercase tracking-widest text-on-surface-variant/70 mb-4">Manufacturer</h3>
            <div className="space-y-3">
              {MANUFACTURERS.map((m) => (
                <label key={m} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedManufacturers.includes(m)}
                    onChange={() => toggleManufacturer(m)}
                    className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                  />
                  <span className={`text-sm transition-colors ${selectedManufacturers.includes(m) ? 'text-primary font-bold' : 'text-on-surface group-hover:text-primary'}`}>{m}</span>
                </label>
              ))}
            </div>
            {selectedManufacturers.length > 0 && (
              <button
                onClick={() => setSelectedManufacturers([])}
                className="mt-4 text-xs text-error hover:underline font-medium"
              >
                Clear filter
              </button>
            )}
          </div>
        </aside>

        {/* Main */}
        <section className="flex-grow">
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="font-headline font-extrabold text-5xl tracking-tighter text-on-surface mb-2">Our Products</h1>
              <p className="text-on-surface-variant max-w-md">
                Access our verified global inventory of pharmaceutical grade active ingredients and formulated medications.
              </p>
            </div>
            <div className="relative w-full md:w-96 group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by SKU, Generic or Brand..."
                className="w-full bg-surface-container-high border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all outline-none placeholder:text-on-surface-variant/60"
              />
            </div>
          </div>

          {/* Skeleton */}
          {isLoading && !data ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-surface-container-lowest rounded-2xl p-6 animate-pulse">
                  <div className="aspect-[4/3] rounded-xl bg-surface-container mb-6" />
                  <div className="h-3 bg-surface-container rounded mb-2 w-1/3" />
                  <div className="h-5 bg-surface-container rounded mb-2 w-2/3" />
                  <div className="h-3 bg-surface-container rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isAdded={selectedProducts.some((p) => p.productId === product.id)}
                  onAdd={handleAdd}
                />
              ))}
              {products.length === 0 && (
                <div className="col-span-3 text-center py-24 text-on-surface-variant">
                  <span className="material-symbols-outlined text-6xl mb-4 block opacity-30">search_off</span>
                  <p className="font-medium text-lg">No products found</p>
                  <p className="text-sm mt-1">Try a different search term or category.</p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Sticky RFQ bar */}
      {selectedProducts.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-2xl bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl py-4 px-6 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">description</span>
            </div>
            <div>
              <p className="font-headline font-bold text-on-surface">RFQ Summary</p>
              <p className="text-xs text-on-surface-variant font-medium">
                {selectedProducts.length} item{selectedProducts.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest leading-none">Est. Priority</p>
              <p className="text-sm font-bold text-primary uppercase">Urgent</p>
            </div>
            <Link
              to="/rfq"
              className="bg-primary text-on-primary px-8 py-3 rounded-xl font-headline font-bold text-sm shadow-md shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              Review Quote
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
