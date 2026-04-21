import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import AdminLayout from '../components/AdminLayout'

const STATUS_BADGE = {
  NEW:            'bg-blue-50 text-blue-700 border-blue-200',
  UNDER_REVIEW:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  QUOTATION_SENT: 'bg-green-50 text-green-700 border-green-200',
  CLOSED:         'bg-gray-100 text-gray-600 border-gray-200',
}

export default function RFQDetails() {
  const { id } = useParams()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [notes, setNotes] = useState(null)
  const [notesSaved, setNotesSaved] = useState(false)
  const [quotationSent, setQuotationSent] = useState(false)
  const [itemPrices, setItemPrices] = useState({})
  const [quoteNotes, setQuoteNotes] = useState('')
  const [currency, setCurrency] = useState('USD')

  const { data: rfq, isLoading } = useQuery({
    queryKey: ['admin-rfq', id],
    queryFn: () => api.get(`/admin/rfqs/${id}`).then((r) => r.data),
  })

  // Initialize notes and prices when data loads
  useEffect(() => {
    if (rfq && notes === null) {
      setNotes(rfq.internal_notes || '')
      setQuoteNotes(rfq.quote_notes || '')
      const prices = {}
      rfq.items?.forEach((item) => {
        prices[item.id] = {
          unitPrice: item.unitPrice ?? '',
          currency: item.currency || 'USD',
        }
      })
      setItemPrices(prices)
      if (rfq.items?.[0]?.currency) setCurrency(rfq.items[0].currency)
    }
  }, [rfq])

  const [priceError, setPriceError] = useState('')

  const updateStatus = useMutation({
    mutationFn: (status) => api.patch(`/admin/rfqs/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries(['admin-rfq', id]),
  })

  const handleStatusChange = (status) => {
    if (status === 'QUOTATION_SENT') {
      const allPriced = rfq?.items?.every((item) => itemPrices[item.id]?.unitPrice)
      if (!allPriced) {
        setPriceError('Please fill in unit prices for all items.')
        return
      }
    }
    setPriceError('')
    updateStatus.mutate(status)
  }

  const saveNotes = useMutation({
    mutationFn: () => api.patch(`/admin/rfqs/${id}/notes`, { notes }),
    onSuccess: () => { setNotesSaved(true); setTimeout(() => setNotesSaved(false), 2000) },
  })

  const sendQuotation = useMutation({
    mutationFn: () => api.post(`/admin/rfqs/${id}/respond`, {
      quoteNotes,
      itemPrices: Object.fromEntries(
        Object.entries(itemPrices).map(([k, v]) => [k, { ...v, currency }])
      ),
    }),
    onSuccess: () => {
      setQuotationSent(true)
      qc.invalidateQueries(['admin-rfq', id])
    },
  })

  // PDF download with auth token
  const exportPDF = async () => {
    try {
      const response = await api.get(`/admin/rfqs/${id}/pdf`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `${rfq?.rfq_number || id}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF export failed:', err)
    }
  }

  if (isLoading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    </AdminLayout>
  )
  if (!rfq) return null

  const customerName  = rfq.customerName  || rfq.guest_full_name
  const companyName   = rfq.companyName   || rfq.guest_company
  const email         = rfq.email         || rfq.guest_email
  const phone         = rfq.phone         || rfq.guest_phone
  const city          = rfq.city          || rfq.guest_city
  const country       = rfq.country       || rfq.guest_country
  const businessType  = rfq.businessType  || rfq.guest_business_type

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 space-y-4">
        
        {/* Header - Compact */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/admin/rfqs" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-gray-600">arrow_back</span>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{rfq.rfq_number}</h1>
                <p className="text-sm text-gray-600">{companyName} • {customerName}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_BADGE[rfq.status]}`}>
                {rfq.status?.replace('_', ' ')}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <select
                value={rfq.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="NEW">New</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="QUOTATION_SENT">Quotation Sent</option>
                <option value="CLOSED">Closed</option>
              </select>
              
              <button onClick={exportPDF} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                PDF
              </button>
              
              <button
                onClick={() => {
                  const allPriced = rfq?.items?.every((item) => itemPrices[item.id]?.unitPrice)
                  if (!allPriced) {
                    setPriceError('Please fill in unit prices for all items.')
                    return
                  }
                  setPriceError('')
                  sendQuotation.mutate()
                }}
                disabled={sendQuotation.isPending || quotationSent}
                className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {sendQuotation.isPending ? 'Sending...' : quotationSent ? '✓ Sent' : 'Send Quote'}
              </button>
            </div>
          </div>
          
          {/* Error/Success Messages */}
          {priceError && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">warning</span>
              {priceError}
            </div>
          )}
          {quotationSent && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Quotation sent successfully to {email}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content - Products */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Products ({rfq.items?.length})</h2>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm font-medium"
                >
                  {['USD','EUR','GBP','AED','SAR'].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              
              <div className="divide-y divide-gray-100">
                {rfq.items?.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.product_name}</h3>
                        <p className="text-sm text-gray-600">{item.brand}</p>
                        {item.notes && <p className="text-sm text-gray-500 italic mt-1">"{item.notes}"</p>}
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-lg font-bold text-primary">{item.quantity}</p>
                          <p className="text-xs text-gray-500 uppercase">{item.unit}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{currency}</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={itemPrices[item.id]?.unitPrice || ''}
                            onChange={(e) => setItemPrices((p) => ({ ...p, [item.id]: { unitPrice: e.target.value, currency } }))}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-primary focus:border-primary"
                          />
                        </div>
                        
                        {itemPrices[item.id]?.unitPrice && (
                          <div className="text-right min-w-[80px]">
                            <p className="text-sm font-semibold text-gray-900">
                              {currency} {(parseFloat(itemPrices[item.id].unitPrice) * item.quantity).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">Total</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Grand Total */}
              {Object.keys(itemPrices).length > 0 && (
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Grand Total</span>
                  <span className="text-xl font-bold text-primary">
                    {currency} {rfq.items?.reduce((sum, item) => {
                      const p = parseFloat(itemPrices[item.id]?.unitPrice || 0)
                      return sum + p * item.quantity
                    }, 0).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
            
            {/* Quote Notes */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Quotation Notes</h2>
              </div>
              <div className="p-4">
                <textarea
                  rows={3}
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  placeholder="Add notes to include in the quotation PDF..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                />
              </div>
            </div>

            {/* Special Instructions */}
            {rfq.message && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Special Instructions</h2>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-700 leading-relaxed">{rfq.message}</p>
                </div>
              </div>
            )}

            {/* Attachments */}
            {rfq.attachments?.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Attachments ({rfq.attachments.length})</h2>
                </div>
                <div className="p-4 space-y-2">
                  {rfq.attachments.map((file) => {
                    const isPDF = file.mime_type === 'application/pdf'
                    const isImage = file.mime_type?.startsWith('image/')
                    const fileUrl = file.file_url.startsWith('http') ? file.file_url : `http://localhost:5000${file.file_url}`

                    return (
                      <div key={file.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg border border-gray-100">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isPDF ? 'bg-red-50 text-red-600' :
                          isImage ? 'bg-blue-50 text-blue-600' :
                          'bg-gray-50 text-gray-600'
                        }`}>
                          <span className="material-symbols-outlined text-lg">
                            {isPDF ? 'picture_as_pdf' : isImage ? 'image' : 'description'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{file.file_name}</p>
                          <p className="text-xs text-gray-500">{(file.file_size / 1024).toFixed(0)} KB • {file.mime_type}</p>
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                            View
                          </a>
                          <a
                            href={fileUrl}
                            download={file.file_name}
                            className="px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">download</span>
                            Download
                          </a>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            
            {/* Customer Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">person</span>
                  Customer
                </h2>
              </div>
              <div className="p-3 space-y-3">
                {[
                  { label: 'Name', value: customerName, icon: 'badge' },
                  { label: 'Company', value: companyName, icon: 'business' },
                  { label: 'Email', value: email, link: `mailto:${email}`, icon: 'mail' },
                  { label: 'Phone', value: phone, icon: 'call' },
                  { label: 'Location', value: [city, country].filter(Boolean).join(', '), icon: 'location_on' },
                  { label: 'Business Type', value: businessType, icon: 'category' },
                ].map((f) => f.value && (
                  <div key={f.label} className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-gray-400 text-base">{f.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 font-medium">{f.label}</p>
                      {f.link ? (
                        <a href={f.link} className="text-sm font-medium text-primary hover:underline truncate block">{f.value}</a>
                      ) : (
                        <p className="text-sm font-medium text-gray-900 truncate">{f.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">receipt_long</span>
                  Order Details
                </h2>
              </div>
              <div className="p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-gray-400 text-base">schedule</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-medium">Submitted</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(rfq.submitted_at).toLocaleDateString('en-GB', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                {rfq.requested_delivery_date && (
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-gray-400 text-base">event</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 font-medium">Delivery Date</p>
                      <p className="text-sm font-medium text-gray-900">{rfq.requested_delivery_date}</p>
                    </div>
                  </div>
                )}
                {rfq.shipping_method && (
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-gray-400 text-base">local_shipping</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 font-medium">Delivery Method</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">{rfq.shipping_method}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Internal Notes */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">edit_note</span>
                  Internal Notes
                </h2>
              </div>
              <div className="p-3">
                <textarea
                  rows={3}
                  value={notes ?? rfq.internal_notes ?? ''}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add private notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  {notesSaved && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">check_circle</span>
                      Saved
                    </span>
                  )}
                  <button
                    onClick={() => saveNotes.mutate()}
                    disabled={saveNotes.isPending}
                    className="ml-auto px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 rounded transition-colors disabled:opacity-50"
                  >
                    {saveNotes.isPending ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}