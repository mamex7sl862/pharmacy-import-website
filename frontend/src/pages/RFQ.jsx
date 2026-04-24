import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import useRFQStore from '../store/rfqStore'
import useAuthStore from '../store/authStore'

const customerSchema = z.object({
  fullName:     z.string().min(2, 'Required'),
  companyName:  z.string().min(2, 'Required'),
  businessType: z.string().min(1, 'Required'),
  email:        z.string().email('Valid email required'),
  phone:        z.string().min(5, 'Required'),
  country:      z.string().min(2, 'Required'),
  city:         z.string().min(2, 'Required'),
})

const STEPS = ['Contact', 'Products', 'Logistics', 'Review']

// ── Compact progress bar ──────────────────────────────────────────────────────
function Stepper({ step }) {
  return (
    <div>
      {/* Step circles + connector line */}
      <div className="relative flex items-center justify-between">
        {/* Background connector */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-surface-container-high mx-5" />
        {/* Filled connector */}
        <div
          className="absolute left-5 top-1/2 -translate-y-1/2 h-px bg-primary transition-all duration-500"
          style={{ width: `calc(${((step - 1) / (STEPS.length - 1)) * 100}% - 2.5rem)` }}
        />
        {STEPS.map((label, i) => {
          const done    = i + 1 < step
          const current = i + 1 === step
          return (
            <div key={label} className="relative flex flex-col items-center gap-1.5 z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                done    ? 'bg-primary text-white shadow-sm' :
                current ? 'bg-primary text-white ring-4 ring-primary/20 shadow-md' :
                          'bg-surface-container-high text-outline'
              }`}>
                {done
                  ? <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1, 'wght' 600" }}>check</span>
                  : i + 1
                }
              </div>
              <span className={`text-[10px] font-semibold tracking-wide transition-colors ${
                current ? 'text-primary' : done ? 'text-primary/60' : 'text-outline'
              }`}>{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Step 1: Contact Info ──────────────────────────────────────────────────────
function Step1({ onNext }) {
  const { customerInfo, setCustomerInfo } = useRFQStore()
  const { user } = useAuthStore()
  const defaults = {
    fullName:     customerInfo.fullName     || user?.fullName     || '',
    companyName:  customerInfo.companyName  || user?.companyName  || '',
    businessType: customerInfo.businessType || user?.businessType || '',
    email:        customerInfo.email        || user?.email        || '',
    phone:        customerInfo.phone        || user?.phone        || '',
    country:      customerInfo.country      || user?.country      || '',
    city:         customerInfo.city         || user?.city         || '',
  }
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(customerSchema), defaultValues: defaults })
  const onSubmit = (data) => { setCustomerInfo(data); onNext(data) }
  const onError  = (errs) => {
    const key = Object.keys(errs)[0]
    const el  = document.querySelector(`[name="${key}"]`)
    if (el) { el.focus(); el.scrollIntoView({ block: 'center' }) }
  }

  const fields = [
    { name: 'fullName',    label: 'Full Name',     placeholder: 'Dr. Julian Pierce',      type: 'text' },
    { name: 'companyName', label: 'Company',        placeholder: 'Metro General Health',   type: 'text' },
    { name: 'email',       label: 'Email',          placeholder: 'you@company.com',        type: 'email' },
    { name: 'phone',       label: 'Phone',          placeholder: '+1 555 000 0000',        type: 'tel' },
    { name: 'country',     label: 'Country',        placeholder: 'United States',          type: 'text' },
    { name: 'city',        label: 'City',           placeholder: 'New York',               type: 'text' },
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="h-full">
      <p className="text-xs text-on-surface-variant mb-4">All fields marked <span className="text-error">*</span> are required.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
        {fields.map((f) => (
          <div key={f.name}>
            <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-1">{f.label} <span className="text-error">*</span></label>
            <input {...register(f.name)} type={f.type} placeholder={f.placeholder}
              className={`w-full bg-surface-container-high rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all ${errors[f.name] ? 'ring-2 ring-error/50' : ''}`} />
            {errors[f.name] && <p className="text-[10px] text-error mt-1">{errors[f.name].message}</p>}
          </div>
        ))}
        <div>
          <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Business Type <span className="text-error">*</span></label>
          <div className="relative">
            <select {...register('businessType')} className={`w-full bg-surface-container-high rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 appearance-none transition-all ${errors.businessType ? 'ring-2 ring-error/50' : ''}`}>
              <option value="">Select...</option>
              <option value="pharmacy">Retail Pharmacy</option>
              <option value="hospital">Hospital</option>
              <option value="clinic">Clinic</option>
              <option value="distributor">Distributor</option>
              <option value="other">Other</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-sm">expand_more</span>
          </div>
          {errors.businessType && <p className="text-[10px] text-error mt-1">{errors.businessType.message}</p>}
        </div>
      </div>
    </form>
  )
}

// ── Step 2: Product Selection ─────────────────────────────────────────────────
function Step2({ onNext, onBack }) {
  const { selectedProducts, addProduct, updateProduct, removeProduct } = useRFQStore()
  const [search, setSearch] = useState('')
  const [showErr, setShowErr] = useState(false)

  const STATIC = [
    { id: 's1',  name: 'Amoxicillin 500mg',       brand: 'GlaxoSmithKline',  packageSize: 'Box/100 Caps', stockQuantity: 200 },
    { id: 's2',  name: 'Atorvastatin 20mg',        brand: 'Pfizer',           packageSize: 'Pack/30 Tabs', stockQuantity: 150 },
    { id: 's3',  name: 'Lantus SoloStar',           brand: 'Sanofi',           packageSize: '5×3ml Pens', stockQuantity: 50 },
    { id: 's4',  name: 'Aspirin 100mg',             brand: 'Bayer',            packageSize: 'Box/100 Tabs', stockQuantity: 500 },
    { id: 's5',  name: 'Nexium 40mg',               brand: 'AstraZeneca',      packageSize: 'Box/28 Caps', stockQuantity: 75 },
    { id: 's6',  name: 'Metformin 1000mg',          brand: 'Bayer Healthcare', packageSize: 'Box/60 Tabs', stockQuantity: 300 },
    { id: 's7',  name: 'Paracetamol 500mg',         brand: 'Generic Pharma',   packageSize: 'Box/100 Tabs', stockQuantity: 1000 },
    { id: 's8',  name: 'Vitamin D3 1000IU',         brand: 'NutraCare',        packageSize: '90 Softgels', stockQuantity: 25 },
    { id: 's9',  name: 'N95 Respirator Mask',       brand: 'MedShield',        packageSize: 'Box/20', stockQuantity: 0 },
    { id: 's10', name: 'Surgical Gloves L',         brand: 'Ansell',           packageSize: 'Box/100 Pairs', stockQuantity: 100 },
    { id: 's11', name: 'Disposable Syringe 5ml',    brand: 'BD Medical',       packageSize: 'Box/100', stockQuantity: 80 },
    { id: 's12', name: 'Entresto 97/103mg',         brand: 'Novartis',         packageSize: 'Box/56 Tabs', stockQuantity: 15 },
  ]

  const { data } = useQuery({
    queryKey: ['rfq-search', search],
    queryFn: () => api.get('/products', { params: { text: search, page: 1, limit: 20 } }).then(r => r.data),
    keepPreviousData: true, retry: 1,
  })

  const catalog = data?.items?.length > 0
    ? data.items
    : STATIC.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase()))

  const handleNext = () => {
    if (!selectedProducts.length) { setShowErr(true); return }
    setShowErr(false); onNext()
  }

  return (
    <div className="h-full flex flex-col">
      {showErr && <p className="text-xs text-error mb-3 flex items-center gap-1"><span className="material-symbols-outlined text-sm">error</span>Add at least one product.</p>}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Catalog */}
        <div className="flex flex-col min-h-0">
          <div className="relative mb-3">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
              className="w-full bg-surface-container-high rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
          </div>
          <div className="flex-1 overflow-y-auto border border-surface-container rounded-lg">
            {catalog.map(p => {
              const added = selectedProducts.some(s => s.productId === p.id)
              // inStock = true/false from API (hides actual numbers for security)
              // For static fallback items, check stockQuantity > 50
              const inStock = p.inStock !== undefined
                ? p.inStock
                : Math.max(0, (p.stockQuantity || p.stock_quantity || 0) - 50) > 0
              const outOfStock = !inStock
              return (
                <div key={p.id} className={`flex items-center justify-between px-4 py-3 border-b border-surface-container last:border-0 hover:bg-surface-container-low transition-colors ${outOfStock ? 'opacity-50' : ''}`}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-on-surface truncate">{p.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-outline truncate">{p.brand}</p>
                      {outOfStock ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600">Unavailable</span>
                      ) : (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700">In Stock</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => !added && !outOfStock && addProduct({ ...p, stockQuantity: 999 })} disabled={added || outOfStock}
                    className={`ml-3 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      outOfStock ? 'bg-surface-container text-outline cursor-not-allowed' :
                      added ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                    }`}>
                    <span className="material-symbols-outlined text-sm">{outOfStock ? 'block' : added ? 'check' : 'add'}</span>
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Selected */}
        <div className="flex flex-col min-h-0">
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-3">Selected ({selectedProducts.length})</p>
          {selectedProducts.length === 0 ? (
            <div className="flex-1 flex items-center justify-center border-2 border-dashed border-surface-container rounded-lg">
              <p className="text-sm text-outline text-center px-4">Search and add products from the left</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto border border-surface-container rounded-lg">
              {selectedProducts.map(item => (
                <div key={item.productId} className="px-4 py-3 border-b border-surface-container last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-on-surface truncate flex-1">{item.productName}</p>
                    <button onClick={() => removeProduct(item.productId)} className="text-error ml-2 flex-shrink-0">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" min="1" value={item.quantity}
                      onChange={e => {
                        const val = parseInt(e.target.value) || 1
                        
                        // Check stock validation against available (reserve-adjusted) quantity
                        const hasStock = item.stockQuantity && item.stockQuantity > 0
                        const exceedsStock = hasStock && val > item.stockQuantity
                        
                        // Update both quantity and stock error in one call
                        updateProduct(item.productId, { 
                          quantity: val, 
                          stockError: exceedsStock 
                        })
                      }}
                      className="w-16 bg-surface-container-high rounded px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                    <select value={item.unit} onChange={e => updateProduct(item.productId, { unit: e.target.value })}
                      className="bg-surface-container-high rounded px-2 py-1.5 text-sm outline-none flex-1 focus:ring-2 focus:ring-primary/50 transition-all">
                      <option>units</option><option>boxes</option><option>packs</option><option>vials</option><option>bottles</option>
                    </select>
                  </div>
                  {item.stockError && (
                    <div className="mt-2">
                      <p className="text-[10px] text-error flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">error</span>
                        Requested quantity exceeds available stock. Please reduce your order.
                      </p>
                    </div>
                  )}
                  <textarea
                    value={item.notes || ''}
                    onChange={e => updateProduct(item.productId, { notes: e.target.value })}
                    placeholder="Optional note (e.g. preferred strength, packaging)..."
                    maxLength={500}
                    rows={2}
                    className="mt-2 w-full bg-surface-container-high rounded px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all text-on-surface placeholder:text-outline"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Step 3: Logistics ─────────────────────────────────────────────────────────
function Step3({ onNext, onBack }) {
  const { additionalInfo, setAdditionalInfo, selectedProducts, customerInfo } = useRFQStore()
  const [files, setFiles] = useState([])
  const [errors, setErrors] = useState({})
  
  // Check if main component set upload error
  useEffect(() => {
    if (useRFQStore.getState()._uploadError) {
      setErrors(e => ({ ...e, files: 'Please upload at least one document before proceeding' }))
      useRFQStore.getState()._uploadError = false
    }
  }, [additionalInfo._uploadErrorTs])

  const validate = () => {
    const e = {}
    if (!additionalInfo.requestedDeliveryDate) e.date = 'Required'
    if (!additionalInfo.shippingMethod)        e.ship = 'Required'
    if (files.length === 0)                    e.files = 'Please upload at least one document before proceeding'
    return e
  }
  const handleNext = () => {
    const e = validate(); setErrors(e)
    if (Object.keys(e).length) {
      const el = document.getElementById(Object.keys(e)[0] === 'date' ? 'step3-date' : 'step3-ship')
      el?.focus()
      return
    }
    onNext()
  }

  const handleFiles = (ev) => {
    const valid = Array.from(ev.target.files).filter(f => f.size <= 10 * 1024 * 1024)
    const updated = [...files, ...valid].slice(0, 5)
    setFiles(updated)
    setAdditionalInfo({ attachmentNames: updated.map(f => f.name) })
    useRFQStore.getState()._pendingFiles = updated
    // Clear file error when a file is added
    if (updated.length > 0) {
      setErrors(e => ({ ...e, files: '' }))
    }
  }
  const removeFile = (i) => {
    const updated = files.filter((_, idx) => idx !== i)
    setFiles(updated)
    setAdditionalInfo({ attachmentNames: updated.map(f => f.name) })
    useRFQStore.getState()._pendingFiles = updated
  }
  useRFQStore.getState()._pendingFiles = files

  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Left column */}
        <div className="space-y-4">
          {/* Delivery date */}
          <div>
            <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Delivery Date <span className="text-error">*</span></label>
            <input id="step3-date" type="date" value={additionalInfo.requestedDeliveryDate}
              onChange={e => { setAdditionalInfo({ requestedDeliveryDate: e.target.value }); setErrors(p => ({ ...p, date: '' })) }}
              className={`w-full bg-surface-container-high rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all ${errors.date ? 'ring-2 ring-error/50' : ''}`} />
            {errors.date && <p className="text-[10px] text-error mt-1">{errors.date}</p>}
          </div>
          {/* Delivery */}
          <div>
            <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Delivery Method <span className="text-error">*</span></label>
            <div className="relative">
              <select id="step3-ship" value={additionalInfo.shippingMethod}
                onChange={e => { setAdditionalInfo({ shippingMethod: e.target.value }); setErrors(p => ({ ...p, ship: '' })) }}
                className={`w-full bg-surface-container-high rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 appearance-none transition-all ${errors.ship ? 'ring-2 ring-error/50' : ''}`}>
                <option value="">Select...</option>
                <option value="city">City Delivery (Same Day)</option>
                <option value="standard">Standard (3–5 days)</option>
                <option value="air">Express Air</option>
                <option value="sea">Sea Freight</option>
                <option value="land">Cold Chain</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-sm">expand_more</span>
            </div>
            {errors.ship && <p className="text-[10px] text-error mt-1">{errors.ship}</p>}
          </div>
          {/* Notes */}
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Special Instructions <span className="text-outline font-normal">(optional)</span></label>
            <textarea rows={4} value={additionalInfo.message}
              onChange={e => setAdditionalInfo({ message: e.target.value })}
              placeholder="Storage requirements, delivery preferences..."
              className="w-full bg-surface-container-high rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all" />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-primary rounded-xl p-4 text-white">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3">Summary</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-white/70">Customer</span><span className="font-bold truncate ml-2">{customerInfo.companyName || customerInfo.fullName || '—'}</span></div>
              <div className="flex justify-between"><span className="text-white/70">Products</span><span className="font-bold">{selectedProducts.length} items</span></div>
            </div>
          </div>
          {/* Documents */}
          <div id="step3-upload">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-outline uppercase tracking-widest">
                Documents <span className="text-error">*</span>
              </label>
              {files.length > 0 && <span className="text-[10px] text-primary font-bold">{files.length}/5</span>}
            </div>
            {errors.files && (
              <p className="text-[10px] text-error mb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">error</span>
                {errors.files}
              </p>
            )}
            {files.length > 0 && (
              <div className="mb-3 space-y-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs font-semibold text-green-900 truncate flex-1">{f.name}</p>
                    <button type="button" onClick={() => removeFile(i)} className="text-error ml-2 flex-shrink-0">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
            {files.length < 5 && (
              <label className={`border-2 border-dashed rounded-lg cursor-pointer flex items-center gap-2 transition-all ${
                errors.files ? 'border-error/50 bg-red-50/30' :
                files.length > 0 ? 'border-primary/30 bg-primary/5 px-3 py-2.5' : 'border-outline-variant bg-surface-container-low/40 px-4 py-4 flex-col text-center'
              }`}>
                {files.length > 0 ? (
                  <><span className="material-symbols-outlined text-primary text-base">add_circle</span><p className="text-sm font-bold text-primary">Add more · {5 - files.length} left</p></>
                ) : (
                  <><span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_upload</span><p className="text-sm font-bold text-on-surface">Drop or click to upload</p><p className="text-xs text-outline">PDF, JPG, PNG · max 10MB · Required</p></>
                )}
                <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(ev) => { handleFiles(ev); setErrors(p => ({ ...p, files: '' })) }} />
              </label>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Step 4: Review & Submit ───────────────────────────────────────────────────
function Step4({ onBack, onSubmit, isLoading, isError, errorMessage }) {
  const { customerInfo, selectedProducts, additionalInfo } = useRFQStore()
  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Left: customer + logistics */}
        <div className="space-y-4 overflow-y-auto lg:pr-2">
          <div className="bg-surface-container-low rounded-xl p-4">
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-3">Customer</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
              {[
                ['Name',     customerInfo.fullName],
                ['Company',  customerInfo.companyName],
                ['Email',    customerInfo.email],
                ['Phone',    customerInfo.phone],
                ['Country',  customerInfo.country],
                ['City',     customerInfo.city],
              ].filter(([,v]) => v).map(([l, v]) => (
                <div key={l}>
                  <p className="text-[9px] font-bold text-outline uppercase">{l}</p>
                  <p className="text-sm font-semibold text-on-surface truncate">{v}</p>
                </div>
              ))}
            </div>
          </div>
          {(additionalInfo.requestedDeliveryDate || additionalInfo.shippingMethod) && (
            <div className="bg-surface-container-low rounded-xl p-4">
              <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-3">Logistics</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {additionalInfo.requestedDeliveryDate && (
                  <div><p className="text-[9px] font-bold text-outline uppercase">Delivery</p><p className="text-sm font-semibold text-on-surface">{additionalInfo.requestedDeliveryDate}</p></div>
                )}
                {additionalInfo.shippingMethod && (
                  <div><p className="text-[9px] font-bold text-outline uppercase">Method</p><p className="text-sm font-semibold text-on-surface capitalize">{additionalInfo.shippingMethod}</p></div>
                )}
              </div>
            </div>
          )}
          {additionalInfo.message && (
            <div className="bg-surface-container-low rounded-xl p-4">
              <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Instructions</p>
              <p className="text-sm text-on-surface-variant">{additionalInfo.message}</p>
            </div>
          )}
        </div>

        {/* Right: products + submit */}
        <div className="flex flex-col min-h-0">
          <div className="bg-surface-container-low rounded-xl p-4 flex-1 overflow-y-auto mb-4">
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-3">Products ({selectedProducts.length})</p>
            <div className="space-y-2">
              {selectedProducts.map(item => (
                <div key={item.productId} className="py-1.5 border-b border-surface-container last:border-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-on-surface truncate flex-1">{item.productName}</p>
                    <span className="text-sm font-bold text-primary ml-3 flex-shrink-0">{item.quantity} {item.unit}</span>
                  </div>
                  {item.notes && (
                    <p className="text-xs text-on-surface-variant italic mt-0.5 truncate">"{item.notes}"</p>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-primary rounded-xl p-4 text-white">
            <p className="text-sm font-bold mb-1">Ready to submit?</p>
            <p className="text-xs text-white/70 mb-4">Your RFQ will be reviewed and quoted within 4–24 hours.</p>
            {isError && (
              <div className="bg-white/10 rounded-lg p-3 mb-4 text-xs">
                <p className="font-bold">Submission failed</p>
                <p className="opacity-80">{errorMessage || 'Check backend connection.'}</p>
              </div>
            )}
            <button onClick={onSubmit} disabled={isLoading}
              className="w-full bg-white text-primary font-bold py-3 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-white/90 active:scale-95 transition-all disabled:opacity-60 mb-3">
              {isLoading ? 'Submitting...' : 'Submit RFQ'} <span className="material-symbols-outlined text-base">send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main RFQ Page ─────────────────────────────────────────────────────────────
export default function RFQ() {
  const navigate = useNavigate()
  const { user, updateUser, clearAuth } = useAuthStore()
  const { currentStep, setStep, customerInfo, setCustomerInfo, selectedProducts, additionalInfo, resetRFQ } = useRFQStore()
  const [profileOpen, setProfileOpen] = useState(false)
  const hasProfile = !!(user?.companyName && user?.phone && user?.businessType)

  useEffect(() => {
    if (user) {
      setCustomerInfo({
        fullName: user.fullName || '', companyName: user.companyName || '',
        businessType: user.businessType || '', email: user.email || '',
        phone: user.phone || '', country: user.country || '', city: user.city || '',
      })
      if (hasProfile && currentStep === 1) setStep(2)
    }
  }, [user?.id])

  const goTo = (step) => { setStep(step); window.scrollTo(0, 0) }

  // Auth gate
  if (!user) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
          </div>
          <h1 className="font-headline font-extrabold text-2xl text-on-surface mb-2">Account Required</h1>
          <p className="text-on-surface-variant text-sm mb-6">Sign in or create an account to submit an RFQ and track your quotations.</p>
          <div className="flex gap-3">
            <Link to="/register?redirect=/rfq" className="flex-1 signature-gradient text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 shadow-md">
              <span className="material-symbols-outlined text-base">person_add</span> Register
            </Link>
            <Link to="/login?redirect=/rfq" className="flex-1 border-2 border-primary text-primary py-3 rounded-xl font-bold text-sm hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-base">login</span> Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const submitMutation = useMutation({
    mutationFn: async (payload) => {
      const files = useRFQStore.getState()._pendingFiles || []
      const clean = { ...payload, products: payload.products.map(({ isService, stockQuantity, stockError, ...r }) => r) }
      if (files.length > 0) {
        const fd = new FormData()
        fd.append('customerInfo', JSON.stringify(clean.customerInfo))
        fd.append('products', JSON.stringify(clean.products))
        fd.append('additionalInfo', JSON.stringify(clean.additionalInfo))
        files.forEach(f => fd.append('attachments', f))
        return api.post('/rfq', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
      }
      return api.post('/rfq', clean).then(r => r.data)
    },
    onSuccess: (data) => {
      useRFQStore.getState()._pendingFiles = []
      resetRFQ()
      navigate(`/rfq/success/${data.rfqNumber}`)
    },
  })

  const stepTitles = ['Customer Information', 'Product Selection', 'Logistics & Documents', 'Review & Submit']

  // Navigation handlers
  const handleNext = () => {
    if (currentStep === 1) {
      // Trigger form submission for step 1
      const form = document.querySelector('form')
      if (form) {
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
        form.dispatchEvent(submitEvent)
      }
    } else if (currentStep === 2) {
      // Check if products are selected
      if (!selectedProducts.length) {
        // Show error in step 2
        const step2Component = document.querySelector('[data-step="2"]')
        if (step2Component) {
          const errorElement = step2Component.querySelector('.error-message')
          if (errorElement) errorElement.style.display = 'block'
        }
        return
      }
      goTo(3)
    } else if (currentStep === 3) {
      // Validate step 3 fields including file upload
      const pendingFiles = useRFQStore.getState()._pendingFiles || []
      if (!additionalInfo.requestedDeliveryDate) {
        document.getElementById('step3-date')?.focus()
        return
      }
      if (!additionalInfo.shippingMethod) {
        document.getElementById('step3-ship')?.focus()
        return
      }
      if (pendingFiles.length === 0) {
        const uploadArea = document.getElementById('step3-upload')
        if (uploadArea) uploadArea.scrollIntoView({ behavior: 'smooth', block: 'center' })
        useRFQStore.getState()._uploadError = true
        setAdditionalInfo({ _uploadErrorTs: Date.now() })
        return
      }
      goTo(4)
    } else if (currentStep === 4) {
      // Submit the form
      submitMutation.mutate({ customerInfo, products: selectedProducts, additionalInfo })
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      goTo(currentStep - 1)
    }
  }

  const canGoNext = () => {
    if (currentStep === 1) return true // Form validation handles this
    if (currentStep === 2) return selectedProducts.length > 0
    if (currentStep === 3) {
      const pendingFiles = useRFQStore.getState()._pendingFiles || []
      return !!(additionalInfo.requestedDeliveryDate && additionalInfo.shippingMethod && pendingFiles.length > 0)
    }
    if (currentStep === 4) return true
    return false
  }

  return (
    <div className="bg-surface min-h-screen">
      <Helmet>
        <title>Request for Quotation — PharmaLink Pro</title>
        <meta name="description" content="Submit a request for quotation for pharmaceutical products. Receive a formal quotation within 4–24 hours." />
        <link rel="canonical" href="https://pharmalinkwholesale.com/rfq" />
      </Helmet>
      <div className="flex justify-center px-4 py-8">
        <div className="w-full max-w-5xl flex flex-col gap-6">

          {/* Page title + stepper */}
          <div>
            {/* Compact header row */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-0.5">Request for Quotation</p>
                <h1 className="font-headline text-2xl font-semibold text-on-surface leading-tight">{stepTitles[currentStep - 1]}</h1>
              </div>
              <div className="flex items-center gap-2 bg-surface-container px-3 py-1.5 rounded-full">
                <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">{currentStep}</span>
                <span className="text-xs text-on-surface-variant font-medium">of {STEPS.length} steps</span>
              </div>
            </div>
            <Stepper step={currentStep} />
          </div>

          {/* Step card */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-lg p-4 sm:p-8">
            {currentStep === 1 && (
              <Step1 onNext={async (data) => {
                try { const { data: u } = await api.put('/customer/profile', data); updateUser(u) } catch (_) {}
                goTo(2)
              }} />
            )}
            {currentStep === 2 && <Step2 onNext={() => goTo(3)} onBack={() => goTo(hasProfile ? 2 : 1)} />}
            {currentStep === 3 && <Step3 onNext={() => goTo(4)} onBack={() => goTo(2)} />}
            {currentStep === 4 && (
              <Step4
                onBack={() => goTo(3)}
                onSubmit={() => submitMutation.mutate({ customerInfo, products: selectedProducts, additionalInfo })}
                isLoading={submitMutation.isPending}
                isError={submitMutation.isError}
                errorMessage={submitMutation.error?.response?.data?.message || submitMutation.error?.message}
              />
            )}
          </div>

          {/* Navigation row — inline, not fixed */}
          <div className="flex items-center justify-between gap-4 pb-10">

            {/* Back button */}
            {currentStep > 1 ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant bg-surface-container hover:bg-surface-container-high hover:text-on-surface transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'wght' 300" }}>chevron_left</span>
                Back
              </button>
            ) : (
              <div className="w-24" />
            )}

            {/* Step dots */}
            <div className="flex items-center gap-2">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    i + 1 === currentStep
                      ? 'w-6 h-2 bg-primary'
                      : i + 1 < currentStep
                      ? 'w-2 h-2 bg-primary/40'
                      : 'w-2 h-2 bg-surface-container-high'
                  }`}
                />
              ))}
            </div>

            {/* Continue / Submit button */}
            <button
              onClick={handleNext}
              disabled={!canGoNext() || submitMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed signature-gradient text-white shadow-sm hover:opacity-90"
            >
              {currentStep === 4 ? (
                submitMutation.isPending ? (
                  <><span className="material-symbols-outlined text-[18px] animate-spin">sync</span> Submitting</>
                ) : (
                  <>Submit RFQ <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span></>
                )
              ) : (
                <>Continue <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'wght' 300" }}>chevron_right</span></>
              )}
            </button>

          </div>
        </div>
      </div>
    </div>
  )
}
