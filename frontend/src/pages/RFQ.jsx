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
  fullName: z.string().min(2, 'Full name is required'),
  companyName: z.string().min(2, 'Company name is required'),
  businessType: z.string().min(1, 'Business type is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(5, 'Phone number is required'),
  country: z.string().min(2, 'Country is required'),
  city: z.string().min(2, 'City is required'),
})

const STEP_LABELS = ['Contact', 'Product Details', 'Logistics', 'Review']

function Stepper({ step }) {
  const pct = (step / 4) * 100
  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold text-primary flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[9px] font-bold">{step}</span>
          Step {step}: {STEP_LABELS[step - 1]}
        </span>
        <span className="text-xs font-semibold text-on-surface-variant">{Math.round(pct)}% Complete</span>
      </div>
      <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
        <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
      </div>
      <div className="grid grid-cols-4 mt-1.5 text-[10px] font-bold text-outline uppercase tracking-wider">
        {STEP_LABELS.map((l, i) => (
          <div key={l} className={`${i === 0 ? 'text-left' : i === 3 ? 'text-right' : 'text-center'} ${i + 1 <= step ? 'text-primary' : ''}`}>{l}</div>
        ))}
      </div>
    </div>
  )
}

function Step1({ onNext }) {
  const { customerInfo, setCustomerInfo } = useRFQStore()
  const { user } = useAuthStore()

  // Pre-fill from logged-in user account
  const defaults = {
    fullName:     customerInfo.fullName     || user?.fullName     || '',
    companyName:  customerInfo.companyName  || user?.companyName  || '',
    businessType: customerInfo.businessType || user?.businessType || '',
    email:        customerInfo.email        || user?.email        || '',
    phone:        customerInfo.phone        || user?.phone        || '',
    country:      customerInfo.country      || user?.country      || '',
    city:         customerInfo.city         || user?.city         || '',
  }

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: defaults,
  })
  const onSubmit = (data) => { setCustomerInfo(data); onNext(data) }

  // Scroll to first error field when validation fails
  const onError = (errs) => {
    const firstKey = Object.keys(errs)[0]
    if (firstKey) {
      const el = document.querySelector(`[name="${firstKey}"]`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.focus()
      }
    }
  }

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-10 shadow-sm">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-on-surface mb-2 font-headline">Primary Point of Contact</h2>
        <p className="text-sm text-on-surface-variant">Provide the administrative details for the purchasing entity.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { name: 'fullName', label: 'Full Name', placeholder: 'e.g. Dr. Julian Pierce', type: 'text' },
            { name: 'companyName', label: 'Company Name', placeholder: 'e.g. Metro General Health', type: 'text' },
            { name: 'email', label: 'Email Address', placeholder: 'j.pierce@metrohealth.org', type: 'email' },
            { name: 'phone', label: 'Phone Number', placeholder: '+1 (555) 000-0000', type: 'tel' },
            { name: 'country', label: 'Country', placeholder: 'e.g. United States', type: 'text' },
            { name: 'city', label: 'City', placeholder: 'e.g. New York', type: 'text' },
          ].map((f) => (
            <div key={f.name} className="space-y-2">
              <label className="block text-xs font-bold text-outline uppercase tracking-widest ml-1">{f.label} <span className="text-error">*</span></label>
              <input
                {...register(f.name)}
                type={f.type}
                placeholder={f.placeholder}
                className={`input-field ${errors[f.name] ? 'ring-2 ring-error border-error' : ''}`}
              />
              {errors[f.name] && (
                <p className="text-xs text-error ml-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {errors[f.name].message}
                </p>
              )}
            </div>
          ))}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-outline uppercase tracking-widest ml-1">Business Type <span className="text-error">*</span></label>
            <div className="relative">
              <select {...register('businessType')} className={`input-field appearance-none ${errors.businessType ? 'ring-2 ring-error border-error' : ''}`}>
                <option value="">Select type...</option>
                <option value="pharmacy">Retail Pharmacy Chain</option>
                <option value="hospital">Public Hospital</option>
                <option value="clinic">Private Clinic</option>
                <option value="distributor">Wholesale Distributor</option>
                <option value="other">Government Agency</option>
              </select>
              <span className="material-symbols-outlined absolute right-4 top-3 text-on-surface-variant pointer-events-none">expand_more</span>
            </div>
            {errors.businessType && (
              <p className="text-xs text-error ml-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {errors.businessType.message}
              </p>
            )}
          </div>
        </div>
        <div className="bg-blue-50/50 p-4 rounded-xl flex items-start space-x-3 border border-blue-100/20">
          <span className="material-symbols-outlined text-primary text-xl">info</span>
          <p className="text-sm text-blue-900 leading-relaxed">
            <span className="font-bold">Privacy Note:</span> Your data is protected under HIPAA compliance standards. Information provided here will only be used for order processing and official communications.
          </p>
        </div>
        <div className="flex items-center justify-between">
          <Link to="/" className="px-8 py-3 text-on-surface-variant font-bold hover:bg-surface-container-low rounded-xl transition-all">Cancel</Link>
          <button type="submit" className="signature-gradient text-white font-bold px-10 py-3 rounded-xl shadow-lg flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all">
            Next Step <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </form>
    </div>
  )
}

function Step2({ onNext, onBack }) {
  const { selectedProducts, addProduct, updateProduct, removeProduct } = useRFQStore()
  const [search, setSearch] = useState('')
  const [showError, setShowError] = useState(false)

  const handleNext = () => {
    if (selectedProducts.length === 0) {
      setShowError(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setShowError(false)
    onNext()
  }

  // Static fallback products — shown when backend is offline
  const STATIC_PRODUCTS = [
    { id: 's1',  name: 'Amoxicillin 500mg',    brand: 'GlaxoSmithKline', packageSize: 'Box of 100 Capsules' },
    { id: 's2',  name: 'Atorvastatin 20mg',     brand: 'Pfizer Inc.',     packageSize: 'Pack of 30 Tablets' },
    { id: 's3',  name: 'Lantus SoloStar',        brand: 'Sanofi S.A.',     packageSize: '5 × 3ml Pens' },
    { id: 's4',  name: 'Aspirin Protect 100mg',  brand: 'Bayer AG',        packageSize: 'Box of 100 Tablets' },
    { id: 's5',  name: 'Nexium 40mg',            brand: 'AstraZeneca',     packageSize: 'Box of 28 Tabs' },
    { id: 's6',  name: 'Metformin HCL 1000mg',   brand: 'Bayer Healthcare',packageSize: 'Box of 60 Tablets' },
    { id: 's7',  name: 'Lisinopril 10mg',         brand: 'Pfizer Inc.',     packageSize: 'Bottle of 30 Tabs' },
    { id: 's8',  name: 'Paracetamol 500mg',       brand: 'Generic Pharma', packageSize: 'Box of 100 Tablets' },
    { id: 's9',  name: 'Vitamin D3 1000IU',       brand: 'NutraCare',       packageSize: '90 Softgel Capsules' },
    { id: 's10', name: 'N95 Respirator Mask',     brand: 'MedShield',       packageSize: 'Box of 20 Masks' },
    { id: 's11', name: 'Surgical Gloves L',       brand: 'Ansell',          packageSize: 'Box of 100 Pairs' },
    { id: 's12', name: 'Entresto 97/103mg',       brand: 'Novartis AG',     packageSize: 'Box of 56 Tablets' },
  ]

  const { data } = useQuery({
    queryKey: ['rfq-product-search', search],
    queryFn: () => api.get('/products', { params: { text: search, page: 1, limit: 20 } }).then((r) => r.data),
    keepPreviousData: true,
    retry: 1,
  })

  // Use DB products if available, otherwise filter static list
  const displayProducts = data?.items?.length > 0
    ? data.items
    : STATIC_PRODUCTS.filter((p) =>
        !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase())
      )

  return (
    <div>
      {/* Error banner */}
      {showError && (
        <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-xl flex items-center gap-3 border border-error/20">
          <span className="material-symbols-outlined text-error text-xl flex-shrink-0">error</span>
          <p className="text-sm font-semibold">Please add at least one product to your RFQ before proceeding.</p>
        </div>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left: Search */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          <div className="bg-surface-container-low p-6 rounded-2xl">
            <h2 className="text-lg font-bold font-headline mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">search</span>
              Find Products
            </h2>
            <div className="relative group">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-surface-container-high border-0 rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all outline-none"
                placeholder="Search by name, brand or SKU..."
              />
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 group-focus-within:text-primary">search</span>
            </div>
          </div>
          <div className="bg-surface-container-low rounded-2xl overflow-hidden">
            <div className="p-4 bg-surface-container-high flex justify-between items-center">
              <span className="font-bold font-headline text-sm uppercase tracking-wider text-on-surface-variant">Available Inventory</span>
              <span className="text-xs text-on-surface-variant/70">{data?.totalCount || displayProducts.length} items found</span>
            </div>
            <div className="overflow-y-auto max-h-[500px]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-low sticky top-0">
                  <tr className="border-b border-outline-variant/20">
                    <th className="px-4 py-3 text-xs font-bold text-on-surface-variant">Product Name</th>
                    <th className="px-4 py-3 text-xs font-bold text-on-surface-variant text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-surface-container-lowest transition-colors border-t border-outline-variant/10 group">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-on-surface">{p.name}</div>
                        <div className="text-xs text-on-surface-variant">{p.brand} | {p.packageSize}</div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => addProduct(p)}
                          disabled={selectedProducts.some((s) => s.productId === p.id)}
                          className="bg-primary/5 hover:bg-primary hover:text-white text-primary rounded-lg p-2 transition-all flex items-center justify-center ml-auto disabled:opacity-40"
                        >
                          <span className="material-symbols-outlined text-lg">{selectedProducts.some((s) => s.productId === p.id) ? 'check' : 'add'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: RFQ Draft Table */}
        <div className="xl:col-span-7">
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 overflow-hidden">
            <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center bg-white/50 backdrop-blur">
              <h2 className="text-lg font-bold font-headline flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container">shopping_cart</span>
                RFQ Draft Selection
              </h2>
              <div className="text-xs font-bold text-on-surface-variant uppercase">{selectedProducts.length} Items Selected</div>
            </div>
            {selectedProducts.length === 0 ? (
              <div className="p-16 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-5xl mb-4 block opacity-30">inventory_2</span>
                <p className="font-medium">No products added yet.</p>
                <p className="text-sm mt-1">Search and add products from the catalog on the left.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-low">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-on-surface-variant">Product &amp; Brand</th>
                      <th className="px-6 py-4 text-xs font-bold text-on-surface-variant w-32">Quantity</th>
                      <th className="px-6 py-4 text-xs font-bold text-on-surface-variant">Unit</th>
                      <th className="px-6 py-4 text-xs font-bold text-on-surface-variant">Note</th>
                      <th className="px-6 py-4 text-xs font-bold text-on-surface-variant text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {selectedProducts.map((item) => (
                      <tr key={item.productId}>
                        <td className="px-6 py-6">
                          <div className="font-bold text-primary">{item.productName}</div>
                          <div className="text-xs text-on-surface-variant italic">
                            {item.isService ? (
                              <span className="inline-flex items-center gap-1 text-primary/70">
                                <span className="material-symbols-outlined text-xs">build</span>
                                Service
                              </span>
                            ) : item.brand}
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <input
                            type="number" min="1" value={item.quantity}
                            onChange={(e) => updateProduct(item.productId, { quantity: parseInt(e.target.value) || 1 })}
                            className="w-24 bg-surface-container-low border-0 rounded-lg py-2 px-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                          />
                        </td>
                        <td className="px-6 py-6">
                          <select
                            value={item.unit}
                            onChange={(e) => updateProduct(item.productId, { unit: e.target.value })}
                            className="bg-transparent border-0 text-sm focus:ring-0 p-0 text-on-surface-variant font-medium outline-none"
                          >
                            <option>units</option>
                            <option>boxes</option>
                            <option>packs</option>
                            <option>vials</option>
                            <option>bottles</option>
                            <option>service</option>
                            <option>shipment</option>
                          </select>
                        </td>
                        <td className="px-6 py-6">
                          <input
                            type="text" value={item.notes}
                            onChange={(e) => updateProduct(item.productId, { notes: e.target.value })}
                            placeholder="Special requirements..."
                            className="w-full bg-transparent border-0 border-b border-outline-variant/30 text-xs py-1 focus:ring-0 focus:border-primary outline-none"
                          />
                        </td>
                        <td className="px-6 py-6 text-center">
                          <button onClick={() => removeProduct(item.productId)} className="text-error hover:bg-error-container/20 p-2 rounded-full transition-all">
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="p-6 bg-surface-container-low/50 flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-primary">info</span>
              <p className="text-xs italic">Prices will be calculated by suppliers after RFQ submission.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-outline-variant/30 flex justify-between items-center">
        <button onClick={onBack} className="flex items-center gap-2 px-6 py-3 rounded-xl text-primary font-bold hover:bg-primary/10 transition-all active:scale-95">
          <span className="material-symbols-outlined">arrow_back</span> Back
        </button>
        <div className="flex items-center gap-4">
          <button className="hidden md:block px-6 py-3 rounded-xl text-on-surface-variant font-semibold hover:bg-surface-container-high transition-all">Save as Draft</button>
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-8 py-3 rounded-xl signature-gradient text-white font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all"
          >
            Next Step <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function Step3({ onNext, onBack }) {
  const { additionalInfo, setAdditionalInfo, selectedProducts, customerInfo } = useRFQStore()
  const [files, setFiles] = useState([])
  const [errors, setErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!additionalInfo.requestedDeliveryDate) errs.deliveryDate = 'Preferred delivery date is required'
    if (!additionalInfo.shippingMethod)        errs.shippingMethod = 'Please select a shipping method'
    return errs
  }

  const handleNext = () => {
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      // Scroll to first error
      const firstErrKey = Object.keys(errs)[0]
      const el = document.getElementById(`step3-${firstErrKey}`)
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus() }
      return
    }
    onNext()
  }

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files)
    const valid = selected.filter((f) => f.size <= 10 * 1024 * 1024)
    setFiles((prev) => {
      const combined = [...prev, ...valid]
      return combined.slice(0, 5) // max 5 files
    })
    // Store file names in additionalInfo for review step display
    setAdditionalInfo({ attachmentNames: [...files, ...valid].slice(0, 5).map((f) => f.name) })
  }

  const removeFile = (index) => {
    const updated = files.filter((_, i) => i !== index)
    setFiles(updated)
    setAdditionalInfo({ attachmentNames: updated.map((f) => f.name) })
  }

  // Expose files to parent via store for submission
  useRFQStore.getState()._pendingFiles = files
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left: Logistics + Documents + Notes */}
      <div className="lg:col-span-2 space-y-3">
        {/* Logistics */}
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm">
          <h2 className="text-xs font-bold text-on-surface mb-3 flex items-center gap-2 uppercase tracking-widest">
            <span className="material-symbols-outlined text-primary text-base">local_shipping</span>
            Logistics &amp; Delivery
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-outline uppercase tracking-widest">Delivery Date <span className="text-error">*</span></label>
              <input
                id="step3-deliveryDate"
                type="date"
                value={additionalInfo.requestedDeliveryDate}
                onChange={(e) => { setAdditionalInfo({ requestedDeliveryDate: e.target.value }); setErrors(p => ({ ...p, deliveryDate: '' })) }}
                className={`input-field py-2 text-sm ${errors.deliveryDate ? 'ring-2 ring-error border-error' : ''}`}
              />
              {errors.deliveryDate && <p className="text-xs text-error flex items-center gap-1"><span className="material-symbols-outlined text-sm">error</span>{errors.deliveryDate}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-outline uppercase tracking-widest">Shipping Method <span className="text-error">*</span></label>
              <div className="relative">
                <select
                  id="step3-shippingMethod"
                  value={additionalInfo.shippingMethod}
                  onChange={(e) => { setAdditionalInfo({ shippingMethod: e.target.value }); setErrors(p => ({ ...p, shippingMethod: '' })) }}
                  className={`input-field py-2 text-sm appearance-none ${errors.shippingMethod ? 'ring-2 ring-error border-error' : ''}`}
                >
                  <option value="">Select method...</option>
                  <option value="standard">Standard (3-5 Business Days)</option>
                  <option value="air">Express Air Freight</option>
                  <option value="sea">Sea Freight</option>
                  <option value="land">Cold Chain (Temperature Regulated)</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-base">expand_more</span>
              </div>
              {errors.shippingMethod && <p className="text-xs text-error flex items-center gap-1"><span className="material-symbols-outlined text-sm">error</span>{errors.shippingMethod}</p>}
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-on-surface flex items-center gap-2 uppercase tracking-widest">
              <span className="material-symbols-outlined text-primary text-base">attach_file</span>
              Documents <span className="text-[10px] font-normal text-outline normal-case tracking-normal">(optional)</span>
            </h2>
            {files.length > 0 && (
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{files.length}/5 files</span>
            )}
          </div>
          {files.length > 0 && (
            <div className="mb-2 space-y-1.5">
              {files.map((file, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-green-600 text-base flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {file.type === 'application/pdf' ? 'picture_as_pdf' : 'image'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-green-900 truncate">{file.name}</p>
                      <p className="text-[10px] text-green-600">{(file.size / 1024).toFixed(0)} KB</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => removeFile(i)} className="text-error hover:bg-error/10 p-1 rounded-full ml-2 flex-shrink-0">
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                </div>
              ))}
            </div>
          )}
          {files.length < 5 ? (
            <label className={`border-2 border-dashed rounded-xl cursor-pointer transition-all group flex items-center gap-3 ${
              files.length > 0
                ? 'border-primary/30 bg-primary/5 hover:bg-primary/10 px-4 py-2.5'
                : 'border-outline-variant bg-surface-container-low/40 hover:bg-surface-container-low px-4 py-4 flex-col text-center'
            }`}>
              {files.length > 0 ? (
                <>
                  <span className="material-symbols-outlined text-primary text-xl group-hover:scale-110 transition-transform">add_circle</span>
                  <div>
                    <p className="text-sm font-bold text-primary">Add more files</p>
                    <p className="text-[10px] text-on-surface-variant">{5 - files.length} slot{5 - files.length !== 1 ? 's' : ''} left · PDF, JPG, PNG, max 10MB</p>
                  </div>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-primary text-2xl mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_upload</span>
                  <p className="text-sm font-bold text-on-surface">Drop files or click to upload</p>
                  <p className="text-xs text-outline">PDF, JPG, PNG · Max 10MB · Up to 5 files</p>
                </>
              )}
              <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.xlsx" className="hidden" onChange={handleFileChange} />
            </label>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              <span className="material-symbols-outlined text-amber-600 text-base">info</span>
              Maximum 5 files reached. Remove one to add another.
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm">
          <h2 className="text-xs font-bold text-on-surface mb-2 flex items-center gap-2 uppercase tracking-widest">
            <span className="material-symbols-outlined text-primary text-base">chat_bubble</span>
            Special Instructions <span className="text-[10px] font-normal text-outline normal-case tracking-normal">(optional)</span>
          </h2>
          <textarea
            rows={3}
            value={additionalInfo.message}
            onChange={(e) => setAdditionalInfo({ message: e.target.value })}
            placeholder="Storage requirements, delivery preferences, special handling notes..."
            className="input-field resize-none text-sm py-2"
          />
        </div>
      </div>

      {/* Right: Summary + Actions */}
      <div className="space-y-3">
        <div className="bg-primary rounded-xl p-4 text-white shadow-lg shadow-primary/30">
          <h3 className="text-xs font-bold mb-3 uppercase tracking-widest">Request Summary</h3>
          <div className="space-y-2">
            {[
              { label: 'Customer', value: customerInfo.companyName || customerInfo.fullName || '—' },
              { label: 'Products', value: `${selectedProducts.length} item${selectedProducts.length !== 1 ? 's' : ''}` },
              { label: 'Status', value: 'Drafting' },
            ].map((r) => (
              <div key={r.label} className="flex justify-between items-center border-b border-white/10 pb-2 last:border-0 last:pb-0">
                <span className="text-xs text-white/70">{r.label}</span>
                <span className="text-sm font-bold">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/20 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-base">verified_user</span>
            <span className="text-sm font-bold text-on-surface">Quality Assured</span>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">All orders are verified by our pharmaceutical logistics team for cold-chain compliance and license validity.</p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleNext}
            className="w-full py-3 rounded-xl signature-gradient text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-95 transition-all"
          >
            Next Step <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
          <button
            onClick={onBack}
            className="w-full py-2.5 rounded-xl border border-outline-variant text-on-surface-variant font-semibold text-sm flex items-center justify-center gap-2 hover:bg-surface-container-low transition-all"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span> Back
          </button>
        </div>
      </div>
    </div>
  )
}

function Step4({ onBack, onSubmit, isLoading, isError, errorMessage }) {
  const { customerInfo, selectedProducts, additionalInfo } = useRFQStore()
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8 space-y-8">
        {/* Customer Details */}
        <section className="bg-surface-container-low rounded-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">account_balance</span>
              <h2 className="text-xl font-bold text-on-surface font-headline">Customer Details</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
            {[
              { label: 'Organization', value: customerInfo.companyName },
              { label: 'Business Type', value: customerInfo.businessType },
              { label: 'Procurement Officer', value: customerInfo.fullName },
              { label: 'Contact Email', value: customerInfo.email },
              { label: 'Phone', value: customerInfo.phone },
              { label: 'Location', value: `${customerInfo.city}, ${customerInfo.country}` },
            ].map((f) => f.value && (
              <div key={f.label}>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">{f.label}</p>
                <p className="text-lg font-medium text-on-surface">{f.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Products */}
        <section className="bg-surface-container-low rounded-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">medical_services</span>
              <h2 className="text-xl font-bold text-on-surface font-headline">Requested Inventory</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-on-surface-variant border-b border-outline-variant/20">
                  <th className="py-4 font-semibold text-sm uppercase tracking-wider">Product Description</th>
                  <th className="py-4 font-semibold text-sm uppercase tracking-wider text-right px-4">Brand</th>
                  <th className="py-4 font-semibold text-sm uppercase tracking-wider text-right">Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {selectedProducts.map((item) => (
                  <tr key={item.productId}>
                    <td className="py-5 font-bold text-on-surface">{item.productName}</td>
                    <td className="py-5 text-right px-4">
                      <span className="inline-block px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold">{item.brand}</span>
                    </td>
                    <td className="py-5 text-right font-mono font-bold text-on-surface">{item.quantity} {item.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Logistics */}
        {(additionalInfo.requestedDeliveryDate || additionalInfo.shippingMethod) && (
          <section className="bg-surface-container-low rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary">local_shipping</span>
              <h2 className="text-xl font-bold text-on-surface font-headline">Logistics &amp; Handling</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {additionalInfo.requestedDeliveryDate && (
                <div className="bg-surface-container-lowest p-6 rounded-lg">
                  <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-2">Delivery Date</h3>
                  <p className="font-bold text-on-surface">{additionalInfo.requestedDeliveryDate}</p>
                </div>
              )}
              {additionalInfo.shippingMethod && (
                <div className="bg-surface-container-lowest p-6 rounded-lg">
                  <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-2">Shipping Method</h3>
                  <p className="font-bold text-on-surface capitalize">{additionalInfo.shippingMethod}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Attachments */}
        {additionalInfo.attachmentNames?.length > 0 && (
          <section className="bg-surface-container-low rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary">attach_file</span>
              <h2 className="text-xl font-bold text-on-surface font-headline">Attachments ({additionalInfo.attachmentNames.length})</h2>
            </div>
            <div className="space-y-3">
              {additionalInfo.attachmentNames.map((name, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-surface-container-lowest rounded-xl">
                  <span className="material-symbols-outlined text-primary">description</span>
                  <span className="text-sm font-medium text-on-surface">{name}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Message */}
        {additionalInfo.message && (
          <section className="bg-surface-container-low rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-primary">chat_bubble</span>
              <h2 className="text-xl font-bold text-on-surface font-headline">Special Instructions</h2>
            </div>
            <p className="text-on-surface-variant leading-relaxed">{additionalInfo.message}</p>
          </section>
        )}
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-primary p-8 rounded-2xl text-on-primary shadow-xl shadow-primary/20 sticky top-24">
          <h3 className="text-2xl font-bold mb-4 font-headline">Request Quotation</h3>
          <p className="text-on-primary-container text-sm leading-relaxed mb-8">
            By submitting this RFQ, your request will be routed to our specialized clinical ops team for competitive pricing and availability verification.
          </p>
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-on-primary-container">verified_user</span>
              <span className="text-xs font-medium">Compliance-checked procurement</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-on-primary-container">timer</span>
              <span className="text-xs font-medium">Estimated quote response: <span className="font-bold">4 Hours</span></span>
            </div>
          </div>
          {isError && (
            <div className="bg-error/20 text-white p-4 rounded-lg mb-4 text-sm space-y-1">
              <p className="font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                Submission failed
              </p>
              <p className="opacity-80 text-xs">
                {errorMessage || 'Could not reach the server. Make sure the backend is running.'}
              </p>
            </div>
          )}
          <button
            onClick={onSubmit}
            disabled={isLoading}
            className="w-full signature-gradient text-on-primary py-4 rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 mb-4 disabled:opacity-70"
          >
            {isLoading ? 'Submitting...' : 'Submit RFQ'} <span className="material-symbols-outlined">send</span>
          </button>
          <button onClick={onBack} className="w-full bg-white/10 hover:bg-white/20 text-on-primary py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Step 3
          </button>
        </div>
      </div>
    </div>
  )
}

export default function RFQ() {
  const navigate = useNavigate()
  const { user, updateUser, clearAuth } = useAuthStore()
  const { currentStep, setStep, customerInfo, setCustomerInfo, selectedProducts, additionalInfo, resetRFQ } = useRFQStore()
  const [profileOpen, setProfileOpen] = useState(false)

  // Determine if user has already filled their profile (returning user)
  const hasProfile = !!(user?.companyName && user?.phone && user?.businessType)

  // On mount: if returning user, pre-fill customerInfo and skip step 1
  useEffect(() => {
    if (user) {
      setCustomerInfo({
        fullName:     user.fullName     || '',
        companyName:  user.companyName  || '',
        businessType: user.businessType || '',
        email:        user.email        || '',
        phone:        user.phone        || '',
        country:      user.country      || '',
        city:         user.city         || '',
      })
      if (hasProfile && currentStep === 1) setStep(2)
    }
  }, [user?.id])

  // ── Auth gate — must be logged in to submit RFQ ───────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
          </div>
          <h1 className="font-headline font-extrabold text-3xl text-on-surface mb-3">
            Account Required
          </h1>
          <p className="text-on-surface-variant text-lg mb-8 leading-relaxed">
            You need to create an account or log in before submitting a Request for Quotation. This allows you to track your RFQ status and receive quotations.
          </p>

          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm mb-8 text-left space-y-3">
            {[
              { icon: 'track_changes', text: 'Track your RFQ status in real time' },
              { icon: 'mark_email_read', text: 'Receive quotations directly to your account' },
              { icon: 'history',       text: 'View all your past RFQ submissions' },
              { icon: 'picture_as_pdf',text: 'Download quotation PDFs anytime' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                <span className="text-sm text-on-surface">{item.text}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to={`/register?redirect=/rfq`}
              className="flex-1 signature-gradient text-white py-3.5 rounded-xl font-headline font-bold text-base shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">person_add</span>
              Create Account
            </Link>
            <Link
              to={`/login?redirect=/rfq`}
              className="flex-1 border-2 border-primary text-primary py-3.5 rounded-xl font-headline font-bold text-base hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">login</span>
              Sign In
            </Link>
          </div>

          <p className="text-xs text-on-surface-variant mt-6">
            Want to check an existing RFQ?{' '}
            <Link to="/track" className="text-primary font-bold hover:underline">Track your RFQ →</Link>
          </p>
        </div>
      </div>
    )
  }
  // ─────────────────────────────────────────────────────────────────────────

  const submitMutation = useMutation({
    mutationFn: async (payload) => {
      const files = useRFQStore.getState()._pendingFiles || []
      // Strip frontend-only fields before sending
      const cleanPayload = {
        ...payload,
        products: payload.products.map(({ isService, ...rest }) => rest),
      }

      if (files.length > 0) {
        const formData = new FormData()
        formData.append('customerInfo', JSON.stringify(cleanPayload.customerInfo))
        formData.append('products', JSON.stringify(cleanPayload.products))
        formData.append('additionalInfo', JSON.stringify(cleanPayload.additionalInfo))
        files.forEach((file) => formData.append('attachments', file))
        return api.post('/rfq', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }).then((r) => r.data)
      }

      return api.post('/rfq', cleanPayload).then((r) => r.data)
    },
    onSuccess: (data) => {
      useRFQStore.getState()._pendingFiles = []
      resetRFQ()
      // Redirect to customer portal so they can track their RFQ
      navigate('/portal', { state: { newRfq: data.rfqNumber } })
    },
  })

  const handleFinalSubmit = () => {
    submitMutation.mutate({ customerInfo, products: selectedProducts, additionalInfo })
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Top nav for RFQ wizard */}
      <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md h-16 flex justify-between items-center px-8">
        <div className="flex items-center gap-4">
          <Link
            to="/portal"
            className="flex items-center gap-1.5 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Link>
          <span className="text-outline-variant/40 hidden sm:inline">|</span>
          <Link to="/" className="text-xl font-bold tracking-tight text-primary font-headline hidden sm:block">PharmaLink Pro</Link>
        </div>
        <div className="flex items-center space-x-4">
          <span className="material-symbols-outlined text-on-surface-variant cursor-pointer">notifications</span>
          <div className="relative">
            <span
              className="material-symbols-outlined text-on-surface-variant cursor-pointer select-none"
              onClick={() => setProfileOpen((o) => !o)}
            >account_circle</span>
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 top-8 w-48 bg-white rounded-xl shadow-lg border border-outline-variant/20 py-2 z-50">
                  <div className="px-4 py-2 border-b border-outline-variant/20">
                    <p className="text-xs font-bold text-on-surface truncate">{user?.fullName}</p>
                    <p className="text-xs text-on-surface-variant truncate">{user?.email}</p>
                  </div>
                  <Link to="/portal" onClick={() => setProfileOpen(false)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-on-surface hover:bg-surface-container transition-colors">
                    <span className="material-symbols-outlined text-base">dashboard</span>
                    My Dashboard
                  </Link>
                  <button
                    onClick={() => { clearAuth(); navigate('/login') }}
                    className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error/5 transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">logout</span>
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-20 pb-6 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-on-surface font-headline tracking-tight">Request for Quotation</h1>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {currentStep === 1 && 'Step 1 — Customer Information'}
                {currentStep === 2 && 'Step 2 — Product Selection'}
                {currentStep === 3 && 'Step 3 — Logistics & Documents'}
                {currentStep === 4 && 'Step 4 — Review & Submit'}
              </p>
            </div>
          </div>

          <Stepper step={currentStep} />

          {currentStep === 1 && <Step1 onNext={async (data) => {
            // Save profile info to backend so future RFQs skip this step
            try {
              const { data: updated } = await api.put('/customer/profile', data)
              updateUser(updated)
            } catch (_) {}
            setStep(2)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }} />}
          {currentStep === 2 && <Step2
            onNext={() => { setStep(3); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            onBack={() => { hasProfile ? setStep(2) : setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
          />}
          {currentStep === 3 && <Step3
            onNext={() => { setStep(4); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            onBack={() => { setStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
          />}
          {currentStep === 4 && <Step4
            onBack={() => { setStep(3); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            onSubmit={handleFinalSubmit}
            isLoading={submitMutation.isPending}
            isError={submitMutation.isError}
            errorMessage={submitMutation.error?.response?.data?.message || submitMutation.error?.message}
          />}
        </div>
      </main>

      {/* Floating RFQ summary */}
      {currentStep === 2 && selectedProducts.length > 0 && (
        <div className="fixed bottom-6 right-6 lg:right-12 z-40">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl p-4 rounded-2xl flex items-center gap-6 pr-2">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/60 font-bold">In Request</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-primary font-headline">{String(selectedProducts.length).padStart(2, '0')}</span>
                <span className="text-xs font-semibold text-on-surface-variant">Products</span>
              </div>
            </div>
            <div className="h-8 w-[1px] bg-outline-variant/30"></div>
            <button onClick={() => { setStep(3); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="bg-primary text-white w-12 h-12 rounded-xl flex items-center justify-center shadow-lg hover:rotate-12 transition-transform">
              <span className="material-symbols-outlined">assignment_turned_in</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
