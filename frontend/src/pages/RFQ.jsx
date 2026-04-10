import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import useRFQStore from '../store/rfqStore'

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
    <div className="mb-10">
      <div className="flex justify-between items-end mb-4">
        <div>
          <span className="text-sm font-bold text-primary flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">{step}</span>
            Step {step}: {STEP_LABELS[step - 1]}
          </span>
        </div>
        <span className="text-sm font-medium text-on-surface-variant">{Math.round(pct)}% Complete</span>
      </div>
      <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
        <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
      </div>
      <div className="grid grid-cols-4 mt-3 text-[11px] font-bold text-outline uppercase tracking-wider">
        {STEP_LABELS.map((l, i) => (
          <div key={l} className={`${i === 0 ? 'text-left' : i === 3 ? 'text-right' : 'text-center'} ${i + 1 <= step ? 'text-primary' : ''}`}>{l}</div>
        ))}
      </div>
    </div>
  )
}

function Step1({ onNext }) {
  const { customerInfo, setCustomerInfo } = useRFQStore()
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: customerInfo,
  })
  const onSubmit = (data) => { setCustomerInfo(data); onNext() }

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-10 shadow-sm">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-on-surface mb-2 font-headline">Primary Point of Contact</h2>
        <p className="text-sm text-on-surface-variant">Provide the administrative details for the purchasing entity.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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
              <label className="block text-xs font-bold text-outline uppercase tracking-widest ml-1">{f.label}</label>
              <input {...register(f.name)} type={f.type} placeholder={f.placeholder} className="input-field" />
              {errors[f.name] && <p className="text-xs text-error ml-1">{errors[f.name].message}</p>}
            </div>
          ))}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-outline uppercase tracking-widest ml-1">Business Type</label>
            <div className="relative">
              <select {...register('businessType')} className="input-field appearance-none">
                <option value="">Select type...</option>
                <option value="pharmacy">Retail Pharmacy Chain</option>
                <option value="hospital">Public Hospital</option>
                <option value="clinic">Private Clinic</option>
                <option value="distributor">Wholesale Distributor</option>
                <option value="other">Government Agency</option>
              </select>
              <span className="material-symbols-outlined absolute right-4 top-3 text-on-surface-variant pointer-events-none">expand_more</span>
            </div>
            {errors.businessType && <p className="text-xs text-error ml-1">{errors.businessType.message}</p>}
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
                          <div className="text-xs text-on-surface-variant italic">{item.brand}</div>
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
            onClick={onNext}
            disabled={selectedProducts.length === 0}
            className="flex items-center gap-2 px-8 py-3 rounded-xl signature-gradient text-white font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all disabled:opacity-50"
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
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
      <div className="md:col-span-8 space-y-8">
        {/* Logistics */}
        <div className="bg-surface-container-lowest rounded-2xl p-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 font-headline">
            <span className="material-symbols-outlined text-primary">local_shipping</span>
            Logistics &amp; Delivery
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-on-surface-variant ml-1">Preferred Delivery Date</label>
              <div className="relative">
                <input type="date" value={additionalInfo.requestedDeliveryDate} onChange={(e) => setAdditionalInfo({ requestedDeliveryDate: e.target.value })} className="input-field appearance-none" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline pointer-events-none">calendar_today</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-on-surface-variant ml-1">Shipping Method</label>
              <div className="relative">
                <select value={additionalInfo.shippingMethod} onChange={(e) => setAdditionalInfo({ shippingMethod: e.target.value })} className="input-field appearance-none">
                  <option value="">Standard (3-5 Business Days)</option>
                  <option value="air">Express (Next Day)</option>
                  <option value="sea">Sea Freight</option>
                  <option value="land">Cold Chain (Temperature Regulated)</option>
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline pointer-events-none">expand_more</span>
              </div>
            </div>
          </div>
        </div>

          <div className="bg-surface-container-lowest rounded-2xl p-8">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2 font-headline">
            <span className="material-symbols-outlined text-primary">description</span>
            Verification Documents
          </h2>
          <p className="text-sm text-outline mb-6">Upload any required prescriptions, clinic licenses, or specialized handling certifications.</p>
          <label className="border-2 border-dashed border-outline-variant rounded-2xl p-10 flex flex-col items-center justify-center text-center bg-surface-container-low/30 hover:bg-surface-container-low transition-colors cursor-pointer group">
            <div className="w-16 h-16 bg-primary-fixed rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_upload</span>
            </div>
            <div className="font-bold text-on-surface">Drop files here or click to upload</div>
            <div className="text-xs text-outline mt-1">PDF, JPG, PNG (Max 10MB · up to 5 files)</div>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.xlsx"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          {/* Uploaded files list */}
          {files.length > 0 && (
            <div className="mt-6 space-y-3">
              {files.map((file, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-surface-container rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">
                      {file.type === 'application/pdf' ? 'picture_as_pdf' : 'image'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-on-surface">{file.name}</p>
                      <p className="text-xs text-outline">{(file.size / 1024).toFixed(0)} KB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="text-error hover:bg-error-container/20 p-1.5 rounded-full transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-surface-container-lowest rounded-2xl p-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 font-headline">
            <span className="material-symbols-outlined text-primary">chat_bubble</span>
            Special Instructions
          </h2>
          <div className="space-y-2">
            <label className="text-sm font-bold text-on-surface-variant ml-1">Message / Notes</label>
            <textarea
              rows={4}
              value={additionalInfo.message}
              onChange={(e) => setAdditionalInfo({ message: e.target.value })}
              placeholder="Enter any specific storage requirements or delivery window preferences..."
              className="input-field resize-none"
            />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="md:col-span-4">
        <div className="sticky top-24 space-y-6">
          <div className="bg-primary rounded-3xl p-6 text-on-primary shadow-xl shadow-primary/30">
            <h3 className="text-lg font-bold mb-4">Request Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-start border-b border-on-primary/10 pb-3">
                <span className="text-xs font-medium opacity-80">Customer</span>
                <span className="text-sm font-bold text-right">{customerInfo.companyName || '—'}</span>
              </div>
              <div className="flex justify-between items-start border-b border-on-primary/10 pb-3">
                <span className="text-xs font-medium opacity-80">Products</span>
                <span className="text-sm font-bold">{selectedProducts.length} items</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-xs font-medium opacity-80">Status</span>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-on-tertiary-container rounded-full"></span>
                  <span className="text-xs font-bold text-on-primary-container">Drafting</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-high/50 rounded-2xl p-6 border border-outline-variant/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary text-lg">verified_user</span>
              <span className="text-sm font-bold">Quality Assured</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">All clinical orders are verified by our pharmaceutical logistics team to ensure compliant cold-chain protocols and license validity.</p>
          </div>
        </div>
      </div>

      <div className="md:col-span-12 mt-4 flex items-center justify-between py-6 border-t border-surface-container-high">
        <button onClick={onBack} className="px-8 py-3 rounded-xl border border-outline text-on-surface-variant font-bold flex items-center gap-2 hover:bg-surface-container-low transition-all">
          <span className="material-symbols-outlined text-lg">arrow_back</span> Back
        </button>
        <div className="flex items-center gap-4">
          <span className="hidden md:block text-xs font-bold text-outline">One step remaining</span>
          <button onClick={onNext} className="px-10 py-3 rounded-xl signature-gradient text-white font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
            Next Step <span className="material-symbols-outlined text-lg">arrow_forward</span>
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
  const { currentStep, setStep, customerInfo, selectedProducts, additionalInfo, resetRFQ } = useRFQStore()

  const submitMutation = useMutation({
    mutationFn: async (payload) => {
      const files = useRFQStore.getState()._pendingFiles || []

      if (files.length > 0) {
        // Send as multipart/form-data when files are attached
        const formData = new FormData()
        formData.append('customerInfo', JSON.stringify(payload.customerInfo))
        formData.append('products', JSON.stringify(payload.products))
        formData.append('additionalInfo', JSON.stringify(payload.additionalInfo))
        files.forEach((file) => formData.append('attachments', file))
        return api.post('/rfq', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }).then((r) => r.data)
      }

      // No files — send as JSON
      return api.post('/rfq', payload).then((r) => r.data)
    },
    onSuccess: (data) => {
      useRFQStore.getState()._pendingFiles = []
      // Navigate FIRST, then reset — prevents blank re-render before navigation
      navigate(`/rfq/success/${data.rfqNumber}`)
      setTimeout(() => resetRFQ(), 100)
    },
  })

  const handleFinalSubmit = () => {
    submitMutation.mutate({ customerInfo, products: selectedProducts, additionalInfo })
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Top nav for RFQ wizard */}
      <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md h-16 flex justify-between items-center px-8">
        <Link to="/" className="text-xl font-bold tracking-tight text-primary font-headline">PharmaLink Pro</Link>
        <div className="hidden md:flex items-center space-x-8">
          <Link to="/products" className="text-on-surface-variant hover:text-primary transition-colors font-medium">Products</Link>
          <Link to="/compare" className="text-on-surface-variant hover:text-primary transition-colors font-medium">Compare</Link>
          <Link to="/portal" className="text-primary border-b-2 border-primary pb-1 font-medium">RFQ History</Link>
        </div>
        <div className="flex items-center space-x-4">
          <span className="material-symbols-outlined text-on-surface-variant cursor-pointer">notifications</span>
          <span className="material-symbols-outlined text-on-surface-variant cursor-pointer">account_circle</span>
        </div>
      </nav>

      <main className="pt-24 pb-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <h1 className="text-4xl font-extrabold text-on-surface font-headline tracking-tight mb-2">Request for Quotation</h1>
            <p className="text-on-surface-variant max-w-lg">
              {currentStep === 1 && 'Step 1: Customer Information. Provide the administrative details for the purchasing entity.'}
              {currentStep === 2 && 'Step 2: Product Selection. Search and add clinical products to your quotation request.'}
              {currentStep === 3 && 'Step 3: Additional Details. Provide logistics and verification documents.'}
              {currentStep === 4 && 'Step 4: Review & Submit. Validate your request before sending.'}
            </p>
          </div>

          <Stepper step={currentStep} />

          {currentStep === 1 && <Step1 onNext={() => setStep(2)} />}
          {currentStep === 2 && <Step2 onNext={() => setStep(3)} onBack={() => setStep(1)} />}
          {currentStep === 3 && <Step3 onNext={() => setStep(4)} onBack={() => setStep(2)} />}
          {currentStep === 4 && <Step4 onBack={() => setStep(3)} onSubmit={handleFinalSubmit} isLoading={submitMutation.isPending} isError={submitMutation.isError} errorMessage={submitMutation.error?.response?.data?.message || submitMutation.error?.message} />}
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
            <button onClick={() => setStep(3)} className="bg-primary text-white w-12 h-12 rounded-xl flex items-center justify-center shadow-lg hover:rotate-12 transition-transform">
              <span className="material-symbols-outlined">assignment_turned_in</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
