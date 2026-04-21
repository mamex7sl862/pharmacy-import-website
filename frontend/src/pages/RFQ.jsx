import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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
    <div className="mb-3">
      <div className="flex justify-between text-[10px] font-bold text-outline uppercase tracking-widest mb-1">
        {STEPS.map((l, i) => (
          <span key={l} className={i + 1 <= step ? 'text-primary' : ''}>{l}</span>
        ))}
      </div>
      <div className="h-1 w-full bg-surface-container rounded-full overflow-hidden">
        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(step / 4) * 100}%` }} />
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
    <form onSubmit={handleSubmit(onSubmit, onError)} className="flex flex-col h-full">
      <p className="text-xs text-on-surface-variant mb-3">All fields marked <span className="text-error">*</span> are required.</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 flex-1">
        {fields.map((f) => (
          <div key={f.name}>
            <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-0.5">{f.label} <span className="text-error">*</span></label>
            <input {...register(f.name)} type={f.type} placeholder={f.placeholder}
              className={`w-full bg-surface-container-high rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary ${errors[f.name] ? 'ring-1 ring-error' : ''}`} />
            {errors[f.name] && <p className="text-[10px] text-error mt-0.5">{errors[f.name].message}</p>}
          </div>
        ))}
        <div>
          <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-0.5">Business Type <span className="text-error">*</span></label>
          <div className="relative">
            <select {...register('businessType')} className={`w-full bg-surface-container-high rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary appearance-none ${errors.businessType ? 'ring-1 ring-error' : ''}`}>
              <option value="">Select...</option>
              <option value="pharmacy">Retail Pharmacy</option>
              <option value="hospital">Hospital</option>
              <option value="clinic">Clinic</option>
              <option value="distributor">Distributor</option>
              <option value="other">Other</option>
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-sm">expand_more</span>
          </div>
          {errors.businessType && <p className="text-[10px] text-error mt-0.5">{errors.businessType.message}</p>}
        </div>
      </div>
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-surface-container">
        <Link to="/portal" className="text-xs text-on-surface-variant hover:text-primary font-semibold flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">arrow_back</span> Dashboard
        </Link>
        <button type="submit" className="signature-gradient text-white font-bold px-6 py-2 rounded-lg text-sm flex items-center gap-1.5 shadow-md hover:opacity-90 active:scale-95 transition-all">
          Next <span className="material-symbols-outlined text-base">arrow_forward</span>
        </button>
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
    { id: 's1',  name: 'Amoxicillin 500mg',       brand: 'GlaxoSmithKline',  packageSize: 'Box/100 Caps' },
    { id: 's2',  name: 'Atorvastatin 20mg',        brand: 'Pfizer',           packageSize: 'Pack/30 Tabs' },
    { id: 's3',  name: 'Lantus SoloStar',           brand: 'Sanofi',           packageSize: '5×3ml Pens' },
    { id: 's4',  name: 'Aspirin 100mg',             brand: 'Bayer',            packageSize: 'Box/100 Tabs' },
    { id: 's5',  name: 'Nexium 40mg',               brand: 'AstraZeneca',      packageSize: 'Box/28 Caps' },
    { id: 's6',  name: 'Metformin 1000mg',          brand: 'Bayer Healthcare', packageSize: 'Box/60 Tabs' },
    { id: 's7',  name: 'Paracetamol 500mg',         brand: 'Generic Pharma',   packageSize: 'Box/100 Tabs' },
    { id: 's8',  name: 'Vitamin D3 1000IU',         brand: 'NutraCare',        packageSize: '90 Softgels' },
    { id: 's9',  name: 'N95 Respirator Mask',       brand: 'MedShield',        packageSize: 'Box/20' },
    { id: 's10', name: 'Surgical Gloves L',         brand: 'Ansell',           packageSize: 'Box/100 Pairs' },
    { id: 's11', name: 'Disposable Syringe 5ml',    brand: 'BD Medical',       packageSize: 'Box/100' },
    { id: 's12', name: 'Entresto 97/103mg',         brand: 'Novartis',         packageSize: 'Box/56 Tabs' },
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
    <div className="flex flex-col h-full">
      {showErr && <p className="text-xs text-error mb-2 flex items-center gap-1"><span className="material-symbols-outlined text-sm">error</span>Add at least one product.</p>}
      <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
        {/* Catalog */}
        <div className="flex flex-col min-h-0">
          <div className="relative mb-2">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
              className="w-full bg-surface-container-high rounded-lg pl-8 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="flex-1 overflow-y-auto border border-surface-container rounded-lg">
            {catalog.map(p => {
              const added = selectedProducts.some(s => s.productId === p.id)
              const stock = p.stockQuantity || p.stock_quantity || 0
              const outOfStock = stock === 0
              return (
                <div key={p.id} className={`flex items-center justify-between px-3 py-2 border-b border-surface-container last:border-0 hover:bg-surface-container-low ${outOfStock ? 'opacity-50' : ''}`}>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-on-surface truncate">{p.name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-outline truncate">{p.brand}</p>
                      {stock > 0 && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${stock <= 10 ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                          {stock} units left
                        </span>
                      )}
                      {outOfStock && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600">Out of stock</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => !added && !outOfStock && addProduct({ ...p, stockQuantity: stock })} disabled={added || outOfStock}
                    className={`ml-2 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
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
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Selected ({selectedProducts.length})</p>
          {selectedProducts.length === 0 ? (
            <div className="flex-1 flex items-center justify-center border-2 border-dashed border-surface-container rounded-lg">
              <p className="text-xs text-outline text-center px-4">Search and add products from the left</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto border border-surface-container rounded-lg">
              {selectedProducts.map(item => (
                <div key={item.productId} className="px-3 py-2 border-b border-surface-container last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-on-surface truncate flex-1">{item.productName}</p>
                    <button onClick={() => removeProduct(item.productId)} className="text-error ml-1 flex-shrink-0">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" min="1" value={item.quantity}
                      onChange={e => {
                        const val = parseInt(e.target.value) || 1
                        const max = item.stockQuantity != null ? item.stockQuantity : 9999
                        updateProduct(item.productId, { quantity: Math.min(val, max) })
                      }}
                      className="w-14 bg-surface-container-high rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary" />
                    <select value={item.unit} onChange={e => updateProduct(item.productId, { unit: e.target.value })}
                      className="bg-surface-container-high rounded px-2 py-1 text-xs outline-none flex-1">
                      <option>units</option><option>boxes</option><option>packs</option><option>vials</option><option>bottles</option>
                    </select>
                  </div>
                  {item.stockQuantity > 0 && (
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[10px] text-outline">Max available: <span className="font-bold text-on-surface">{item.stockQuantity}</span></p>
                      {item.quantity >= item.stockQuantity && (
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">At limit</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center mt-3 pt-3 border-t border-surface-container">
        <button onClick={onBack} className="text-xs text-on-surface-variant hover:text-primary font-semibold flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">arrow_back</span> Back
        </button>
        <button onClick={handleNext} className="signature-gradient text-white font-bold px-6 py-2 rounded-lg text-sm flex items-center gap-1.5 shadow-md hover:opacity-90 active:scale-95 transition-all">
          Next <span className="material-symbols-outlined text-base">arrow_forward</span>
        </button>
      </div>
    </div>
  )
}

// ── Step 3: Logistics ─────────────────────────────────────────────────────────
function Step3({ onNext, onBack }) {
  const { additionalInfo, setAdditionalInfo, selectedProducts, customerInfo } = useRFQStore()
  const [files, setFiles] = useState([])
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!additionalInfo.requestedDeliveryDate) e.date = 'Required'
    if (!additionalInfo.shippingMethod)        e.ship = 'Required'
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
    setFiles(prev => [...prev, ...valid].slice(0, 5))
    setAdditionalInfo({ attachmentNames: [...files, ...valid].slice(0, 5).map(f => f.name) })
  }
  const removeFile = (i) => {
    const updated = files.filter((_, idx) => idx !== i)
    setFiles(updated)
    setAdditionalInfo({ attachmentNames: updated.map(f => f.name) })
  }
  useRFQStore.getState()._pendingFiles = files

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-2 gap-3 flex-1">
        {/* Left column */}
        <div className="space-y-3">
          {/* Delivery date */}
          <div>
            <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-0.5">Delivery Date <span className="text-error">*</span></label>
            <input id="step3-date" type="date" value={additionalInfo.requestedDeliveryDate}
              onChange={e => { setAdditionalInfo({ requestedDeliveryDate: e.target.value }); setErrors(p => ({ ...p, date: '' })) }}
              className={`w-full bg-surface-container-high rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary ${errors.date ? 'ring-1 ring-error' : ''}`} />
            {errors.date && <p className="text-[10px] text-error mt-0.5">{errors.date}</p>}
          </div>
          {/* Delivery */}
          <div>
            <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-0.5">Delivery Method <span className="text-error">*</span></label>
            <div className="relative">
              <select id="step3-ship" value={additionalInfo.shippingMethod}
                onChange={e => { setAdditionalInfo({ shippingMethod: e.target.value }); setErrors(p => ({ ...p, ship: '' })) }}
                className={`w-full bg-surface-container-high rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary appearance-none ${errors.ship ? 'ring-1 ring-error' : ''}`}>
                <option value="">Select...</option>
                <option value="city">City Delivery (Same Day)</option>
                <option value="standard">Standard (3–5 days)</option>
                <option value="air">Express Air</option>
                <option value="sea">Sea Freight</option>
                <option value="land">Cold Chain</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-sm">expand_more</span>
            </div>
            {errors.ship && <p className="text-[10px] text-error mt-0.5">{errors.ship}</p>}
          </div>
          {/* Notes */}
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-0.5">Special Instructions <span className="text-outline font-normal">(optional)</span></label>
            <textarea rows={3} value={additionalInfo.message}
              onChange={e => setAdditionalInfo({ message: e.target.value })}
              placeholder="Storage requirements, delivery preferences..."
              className="w-full bg-surface-container-high rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-3">
          {/* Summary */}
          <div className="bg-primary rounded-xl p-4 text-white">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2">Summary</p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-white/70">Customer</span><span className="font-bold truncate ml-2">{customerInfo.companyName || customerInfo.fullName || '—'}</span></div>
              <div className="flex justify-between"><span className="text-white/70">Products</span><span className="font-bold">{selectedProducts.length} items</span></div>
            </div>
          </div>
          {/* Documents */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold text-outline uppercase tracking-widest">Documents <span className="font-normal">(optional)</span></label>
              {files.length > 0 && <span className="text-[10px] text-primary font-bold">{files.length}/5</span>}
            </div>
            {files.length > 0 && (
              <div className="mb-2 space-y-1">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between px-2 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-[10px] font-semibold text-green-900 truncate flex-1">{f.name}</p>
                    <button type="button" onClick={() => removeFile(i)} className="text-error ml-1 flex-shrink-0">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
            {files.length < 5 && (
              <label className={`border-2 border-dashed rounded-lg cursor-pointer flex items-center gap-2 transition-all ${files.length > 0 ? 'border-primary/30 bg-primary/5 px-3 py-2' : 'border-outline-variant bg-surface-container-low/40 px-3 py-3 flex-col text-center'}`}>
                {files.length > 0 ? (
                  <><span className="material-symbols-outlined text-primary text-base">add_circle</span><p className="text-xs font-bold text-primary">Add more · {5 - files.length} left</p></>
                ) : (
                  <><span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_upload</span><p className="text-xs font-bold text-on-surface">Drop or click to upload</p><p className="text-[10px] text-outline">PDF, JPG, PNG · max 10MB</p></>
                )}
                <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFiles} />
              </label>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-3 pt-3 border-t border-surface-container">
        <button onClick={onBack} className="text-xs text-on-surface-variant hover:text-primary font-semibold flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">arrow_back</span> Back
        </button>
        <button onClick={handleNext} className="signature-gradient text-white font-bold px-6 py-2 rounded-lg text-sm flex items-center gap-1.5 shadow-md hover:opacity-90 active:scale-95 transition-all">
          Next <span className="material-symbols-outlined text-base">arrow_forward</span>
        </button>
      </div>
    </div>
  )
}

// ── Step 4: Review & Submit ───────────────────────────────────────────────────
function Step4({ onBack, onSubmit, isLoading, isError, errorMessage }) {
  const { customerInfo, selectedProducts, additionalInfo } = useRFQStore()
  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
        {/* Left: customer + logistics */}
        <div className="space-y-3 overflow-y-auto pr-1">
          <div className="bg-surface-container-low rounded-xl p-3">
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Customer</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
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
                  <p className="text-xs font-semibold text-on-surface truncate">{v}</p>
                </div>
              ))}
            </div>
          </div>
          {(additionalInfo.requestedDeliveryDate || additionalInfo.shippingMethod) && (
            <div className="bg-surface-container-low rounded-xl p-3">
              <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Logistics</p>
              <div className="grid grid-cols-2 gap-3">
                {additionalInfo.requestedDeliveryDate && (
                  <div><p className="text-[9px] font-bold text-outline uppercase">Delivery</p><p className="text-xs font-semibold text-on-surface">{additionalInfo.requestedDeliveryDate}</p></div>
                )}
                {additionalInfo.shippingMethod && (
                  <div><p className="text-[9px] font-bold text-outline uppercase">Delivery</p><p className="text-xs font-semibold text-on-surface capitalize">{additionalInfo.shippingMethod}</p></div>
                )}
              </div>
            </div>
          )}
          {additionalInfo.message && (
            <div className="bg-surface-container-low rounded-xl p-3">
              <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Instructions</p>
              <p className="text-xs text-on-surface-variant">{additionalInfo.message}</p>
            </div>
          )}
        </div>

        {/* Right: products + submit */}
        <div className="flex flex-col min-h-0">
          <div className="bg-surface-container-low rounded-xl p-3 flex-1 overflow-y-auto mb-3">
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Products ({selectedProducts.length})</p>
            <div className="space-y-1.5">
              {selectedProducts.map(item => (
                <div key={item.productId} className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-on-surface truncate flex-1">{item.productName}</p>
                  <span className="text-xs font-bold text-primary ml-2 flex-shrink-0">{item.quantity} {item.unit}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-primary rounded-xl p-4 text-white">
            <p className="text-xs font-bold mb-1">Ready to submit?</p>
            <p className="text-[10px] text-white/70 mb-3">Your RFQ will be reviewed and quoted within 4–24 hours.</p>
            {isError && (
              <div className="bg-white/10 rounded-lg p-2 mb-3 text-[10px]">
                <p className="font-bold">Submission failed</p>
                <p className="opacity-80">{errorMessage || 'Check backend connection.'}</p>
              </div>
            )}
            <button onClick={onSubmit} disabled={isLoading}
              className="w-full bg-white text-primary font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-white/90 active:scale-95 transition-all disabled:opacity-60 mb-2">
              {isLoading ? 'Submitting...' : 'Submit RFQ'} <span className="material-symbols-outlined text-base">send</span>
            </button>
            <button onClick={onBack} className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-sm">arrow_back</span> Back
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
      const clean = { ...payload, products: payload.products.map(({ isService, stockQuantity, ...r }) => r) }
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
      navigate('/portal', { state: { newRfq: data.rfqNumber } })
    },
  })

  const stepTitles = ['Customer Information', 'Product Selection', 'Logistics & Documents', 'Review & Submit']

  return (
    <div className="h-screen overflow-hidden bg-surface flex flex-col">
      {/* ── Navbar ── */}
      <nav className="flex-shrink-0 h-14 bg-white/90 backdrop-blur-md border-b border-surface-container flex items-center justify-between px-4 md:px-8 z-50">
        <div className="flex items-center gap-3">
          <Link to="/portal" className="flex items-center gap-1 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <span className="text-outline-variant/40">|</span>
          <span className="font-headline font-bold text-primary text-base">Request for Quotation</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setProfileOpen(o => !o)} className="text-on-surface-variant hover:text-primary">
            <span className="material-symbols-outlined text-2xl">account_circle</span>
          </button>
          {profileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
              <div className="absolute right-4 top-14 w-44 bg-white rounded-xl shadow-lg border border-outline-variant/20 py-2 z-50">
                <div className="px-3 py-2 border-b border-outline-variant/20">
                  <p className="text-xs font-bold text-on-surface truncate">{user?.fullName}</p>
                  <p className="text-[10px] text-on-surface-variant truncate">{user?.email}</p>
                </div>
                <Link to="/portal" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-on-surface hover:bg-surface-container">
                  <span className="material-symbols-outlined text-base">dashboard</span> Dashboard
                </Link>
                <button onClick={() => { clearAuth(); navigate('/login') }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error/5">
                  <span className="material-symbols-outlined text-base">logout</span> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </nav>

      {/* ── Content area — fills remaining height ── */}
      <div className="flex-1 overflow-hidden flex items-start justify-center px-4 py-3">
        <div className="w-full max-w-4xl h-full flex flex-col">

          {/* Page title + stepper */}
          <div className="flex-shrink-0 mb-3">
            <Stepper step={currentStep} />
          </div>

          {/* Step card — fixed height, content scrolls inside, buttons always at bottom */}
          <div className="flex-1 bg-surface-container-lowest rounded-xl shadow-sm p-4 min-h-0 overflow-hidden flex flex-col">
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
        </div>
      </div>
    </div>
  )
}
