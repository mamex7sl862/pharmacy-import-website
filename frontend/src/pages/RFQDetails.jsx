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
  
  // Feedback Modal State
  const [feedbackModal, setFeedbackModal] = useState({ 
    open: false, 
    type: '', // 'legitimacy' | 'status'
    targetValue: null,
    resolve: null 
  })
  const [feedbackText, setFeedbackText] = useState('')

  const requestFeedback = (type, targetValue) => {
    return new Promise((resolve) => {
      setFeedbackText('')
      setFeedbackModal({ open: true, type, targetValue, resolve })
    })
  }

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
        // Pre-fill with saved unit_price first, then fall back to catalog price
        // item.unitPrice comes from COALESCE(ri.unit_price, p.price, p2.price) in the backend
        const prefilledPrice = (item.unitPrice !== null && item.unitPrice !== undefined && item.unitPrice !== '')
          ? String(parseFloat(item.unitPrice).toFixed(2))
          : ''
        prices[item.id] = {
          unitPrice: prefilledPrice,
          currency: item.currency || 'USD',
        }
      })
      setItemPrices(prices)
      if (rfq.items?.[0]?.currency) setCurrency(rfq.items[0].currency)
    }
  }, [rfq])

  const [priceError, setPriceError] = useState('')

  const updateStatus = useMutation({
    mutationFn: ({ status, verificationFeedback }) => api.patch(`/admin/rfqs/${id}/status`, { status, verificationFeedback }),
    onSuccess: () => qc.invalidateQueries(['admin-rfq', id]),
  })

  const handleStatusChange = async (status) => {
    if (status === 'QUOTATION_SENT') {
      const allPriced = rfq?.items?.every((item) => itemPrices[item.id]?.unitPrice)
      if (!allPriced) {
        setPriceError('Please fill in unit prices for all items.')
        return
      }
    }
    
    let verificationFeedback = null
    if (status === 'CLOSED' || status === 'DECLINED') {
      verificationFeedback = await requestFeedback('status', status)
      if (verificationFeedback === null) return // cancelled
    }

    setPriceError('')
    updateStatus.mutate({ status, verificationFeedback })
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

  const updateLegitimacy = useMutation({
    mutationFn: ({ isLegitimate, verificationFeedback }) => api.patch(`/admin/rfqs/${id}/legitimacy`, { isLegitimate, verificationFeedback }),
    onSuccess: () => qc.invalidateQueries(['admin-rfq', id]),
  })

  const handleLegitimacyChange = async (isLegitimate) => {
    console.log('[RFQDetails] Button Clicked - Legitimacy:', isLegitimate);
    try {
      let verificationFeedback = null
      
      // Only request feedback for rejections/fraud (isLegitimate === false)
      // Legitimate marking (true) or resetting (null) skip the modal
      if (isLegitimate === false) {
        console.log('[RFQDetails] Opening Feedback Modal for Rejection...');
        verificationFeedback = await requestFeedback('legitimacy', isLegitimate)
        console.log('[RFQDetails] Modal Resolved with Feedback:', verificationFeedback);
        if (verificationFeedback === null) {
          console.log('[RFQDetails] Action Cancelled by User');
          return
        }
      }
      
      console.log('[RFQDetails] Mutating Legitimacy State...');
      updateLegitimacy.mutate({ isLegitimate, verificationFeedback })
    } catch (err) {
      console.error('[RFQDetails] Legitimacy Change Error:', err);
    }
  }

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

  const isLocked = rfq.status === 'CLOSED' || rfq.status === 'DECLINED'

  return (
    <AdminLayout>
      <div className="mx-auto px-4 sm:px-6 lg:px-8 space-y-4 pb-20 md:pb-6">
        
        {/* Header - Simplified & Responsive */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <Link to="/admin/rfqs" className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
                <span className="material-symbols-outlined text-gray-600">arrow_back</span>
              </Link>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">{rfq.rfq_number}</h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${STATUS_BADGE[rfq.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {rfq.status?.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1 truncate">{companyName} • {customerName}</p>
              </div>
            </div>
            
            {/* Actions Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
              {isLocked ? (
                <div className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
                  rfq.status === 'CLOSED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                } flex items-center gap-2`}>
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {rfq.status === 'CLOSED' ? 'verified' : 'cancel'}
                  </span>
                  {rfq.status === 'CLOSED' ? 'Deal Closed' : 'Declined'}
                </div>
              ) : (
                <div className="flex flex-1 md:flex-none items-center gap-2">
                  <select
                    value={rfq.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="flex-1 md:flex-none px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary bg-white transition-all outline-none"
                  >
                    <option value="NEW">New</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="QUOTATION_SENT">Quotation Sent</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              )}
              
              <button onClick={exportPDF} title="Download PDF" className="p-2 md:px-4 md:py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 bg-white text-gray-700">
                <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                <span className="hidden md:inline">PDF</span>
              </button>
              
              {!isLocked && (
                <button
                   onClick={() => {
                    if (rfq.isLegitimate !== true) {
                      setPriceError('You must verify the legal documents first.')
                      return
                    }
                    const allPriced = rfq?.items?.every((item) => itemPrices[item.id]?.unitPrice)
                    if (!allPriced) {
                      const missing = rfq.items.filter((item) => !itemPrices[item.id]?.unitPrice).length
                      setPriceError(`Please fill in unit prices for all items. ${missing} item${missing !== 1 ? 's' : ''} still need${missing === 1 ? 's' : ''} a price.`)
                      window.scrollTo({ top: 300, behavior: 'smooth' })
                      return
                    }
                    setPriceError('')
                    sendQuotation.mutate()
                  }}
                  disabled={sendQuotation.isPending || quotationSent || rfq.isLegitimate !== true}
                  className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${
                    rfq.isLegitimate === true ? 'bg-primary text-white shadow-primary/20 hover:bg-primary/90' : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">send</span>
                  {sendQuotation.isPending ? 'Sending...' : quotationSent ? '✓ Sent' : 'Send Quote'}
                </button>
              )}
            </div>
          </div>

          {/* Messages/Banners */}
          <div className="mt-4 space-y-2">
            {isLocked && (
              <div className={`p-4 rounded-xl text-sm flex items-center gap-3 ${
                rfq.status === 'CLOSED'
                  ? 'bg-emerald-50 border border-emerald-100 text-emerald-800'
                  : 'bg-red-50 border border-red-100 text-red-800'
              }`}>
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {rfq.status === 'CLOSED' ? 'lock' : 'do_not_disturb_on'}
                </span>
                <p className="font-medium">
                  {rfq.status === 'CLOSED'
                    ? 'This RFQ has been accepted by the customer and is now closed.'
                    : 'This quotation was declined by the customer.'}
                </p>
              </div>
            )}

            {priceError && (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800 flex items-center gap-3 animate-pulse">
                <span className="material-symbols-outlined text-xl">error</span>
                <p className="font-semibold">{priceError}</p>
              </div>
            )}
            
            {quotationSent && (
              <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-sm text-green-800 flex items-center gap-3">
                <span className="material-symbols-outlined text-xl">check_circle</span>
                <p className="font-medium">Quotation successfully sent to <strong>{email}</strong></p>
              </div>
            )}
            {rfq.isLegitimate === null && !isLocked && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-sm text-primary flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-xl animate-pulse">fact_check</span>
                  <div>
                    <p className="font-bold">Awaiting Verification</p>
                    <p className="text-xs opacity-80">This RFQ needs business legitimacy check before prices can be sent.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Buttons moved to lower section for clarity */}
                </div>
              </div>
            )}

            {rfq.isLegitimate !== null && rfq.status !== 'CLOSED' && (
              <div className={`p-4 border rounded-xl text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                rfq.isLegitimate === true ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-xl">
                    {rfq.isLegitimate === true ? 'verified' : 'block'}
                  </span>
                  <div>
                    <p className="font-bold">{rfq.isLegitimate === true ? 'Business Verified' : 'Business Rejected'}</p>
                    <p className="text-xs opacity-80">You can proceed with pricing or change your decision.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content - Products List */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Legal Document Review — always visible */}
            <div className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
              rfq.isLegitimate === true ? 'border-emerald-200' :
              rfq.isLegitimate === false ? 'border-red-200' : 'border-primary/20'
            }`}>
              <div className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                rfq.isLegitimate === true ? 'bg-emerald-50' :
                rfq.isLegitimate === false ? 'bg-red-50' : 'bg-primary/5'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    rfq.isLegitimate === true ? 'bg-emerald-100 text-emerald-600' :
                    rfq.isLegitimate === false ? 'bg-red-100 text-red-600' : 'bg-primary/10 text-primary'
                  }`}>
                    <span className="material-symbols-outlined">
                      {rfq.isLegitimate === true ? 'verified' : rfq.isLegitimate === false ? 'block' : 'gavel'}
                    </span>
                  </div>
                  <div>
                    <h2 className={`text-sm font-bold ${
                      rfq.isLegitimate === true ? 'text-emerald-900' :
                      rfq.isLegitimate === false ? 'text-red-900' : 'text-primary'
                    }`}>
                      {rfq.isLegitimate === true ? 'Business Verified' :
                       rfq.isLegitimate === false ? 'Business Rejected' : 'Verify Business Identity'}
                    </h2>
                    <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">Legal Document Review</p>
                  </div>
                </div>
                
                {rfq.verificationFeedback && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-600 italic">
                    <p className="font-bold text-[10px] text-gray-400 uppercase tracking-widest mb-1 not-italic">Previous Feedback:</p>
                    "{rfq.verificationFeedback}"
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {(rfq.legalDocumentUrl || rfq.legal_document_url) ? (
                    <a
                      href={
                        (rfq.legalDocumentUrl || rfq.legal_document_url)?.startsWith('http')
                          ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/proxy-document?url=${encodeURIComponent(rfq.legalDocumentUrl || rfq.legal_document_url)}`
                          : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${rfq.legalDocumentUrl || rfq.legal_document_url}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                      Review Document
                    </a>
                  ) : (
                    <span className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-gray-400 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">attachment_off</span>
                      No document uploaded
                    </span>
                  )}
                  {(rfq.legalDocumentUrl || rfq.legal_document_url) && rfq.isLegitimate === null && !isLocked && (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleLegitimacyChange(false)} 
                        className="px-4 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg font-bold text-xs hover:bg-red-50 transition-all flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                        Mark Fraudulent
                      </button>
                      <button 
                        onClick={() => handleLegitimacyChange(true)} 
                        className="px-4 py-1.5 bg-primary text-white rounded-lg font-bold text-xs hover:bg-primary/90 transition-all flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">check</span>
                        Mark Legitimate
                      </button>
                    </div>
                  )}
                  {rfq.isLegitimate !== null && rfq.status !== 'CLOSED' && (
                    <button
                      onClick={() => handleLegitimacyChange(null)}
                      className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-400 hover:text-primary hover:border-primary/30 transition-all flex items-center gap-1.5 shadow-sm group"
                      title="Change your verification decision"
                    >
                      <span className="material-symbols-outlined text-sm transition-transform group-hover:-translate-x-0.5">arrow_back</span>
                      Change Decision
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/30">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-gray-900 tracking-tight">Line Items ({rfq.items?.length})</h2>
                  {rfq.items?.some((item) => !itemPrices[item.id]?.unitPrice) ? (
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">Missing Prices</span>
                  ) : (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider flex items-center gap-1">Complete</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Currency:</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-bold bg-white text-gray-700"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="ETB">ETB (Br)</option>
                  </select>
                </div>
              </div>
              
              <div className="divide-y divide-gray-100">
                {rfq.items?.map((item) => (
                  <div key={item.id} className="p-5 hover:bg-gray-50/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">
                            {item.product_name[0]}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 leading-tight mb-1">{item.product_name}</h3>
                            <p className="text-sm text-gray-500 font-medium">{item.brand}</p>
                            {item.notes && (
                              <div className="mt-2 text-xs text-gray-500 italic bg-gray-50 px-3 py-2 rounded-lg border-l-4 border-gray-200">
                                "{item.notes}"
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-end sm:items-center justify-between sm:justify-end gap-x-8 gap-y-4">
                        <div className="text-left sm:text-center">
                          <p className="text-2xl font-black text-gray-900 leading-none">{item.quantity}</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter mt-1">{item.unit}</p>
                        </div>
                        
                        <div className="w-full sm:w-auto">
                          <label className="block sm:hidden text-[10px] font-bold text-gray-400 uppercase mb-1">Unit Price ({currency})</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">{currency}</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={itemPrices[item.id]?.unitPrice || ''}
                              onChange={(e) => {
                                setItemPrices((p) => ({ ...p, [item.id]: { unitPrice: e.target.value, currency } }))
                                if (priceError) setPriceError('')
                              }}
                              className={`w-full sm:w-32 pl-12 pr-4 py-2.5 border rounded-xl text-sm font-bold text-right focus:ring-2 transition-all outline-none ${
                                priceError && !itemPrices[item.id]?.unitPrice
                                  ? 'border-red-300 bg-red-50 focus:ring-red-300'
                                  : 'border-gray-200 focus:ring-primary/20 focus:border-primary'
                              }`}
                            />
                          </div>
                          {!itemPrices[item.id]?.unitPrice && (
                            <p className="text-[10px] text-amber-600 font-bold mt-1 text-right">Required</p>
                          )}
                        </div>
                        
                        {itemPrices[item.id]?.unitPrice && (
                          <div className="text-right min-w-[100px] pt-4 sm:pt-0 border-t sm:border-0 border-dashed border-gray-200 w-full sm:w-auto">
                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Total Amount</p>
                            <p className="text-base font-black text-primary">
                              {currency} {(parseFloat(itemPrices[item.id].unitPrice) * item.quantity).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Grand Total Footer */}
              {Object.keys(itemPrices).length > 0 && (
                <div className="p-6 bg-primary/5 border-t border-primary/10 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg">payments</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Valuation</p>
                      <h3 className="text-lg font-bold text-gray-900">Quotation Summary</h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-primary">
                      {currency} {rfq.items?.reduce((sum, item) => {
                        const p = parseFloat(itemPrices[item.id]?.unitPrice || 0)
                        return sum + p * item.quantity
                      }, 0).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{Object.keys(itemPrices).length} Items Included</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Quote Notes Drawer */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 underline decoration-primary/30 decoration-4 underline-offset-4">
                  <span className="material-symbols-outlined text-primary text-lg">feedback</span>
                  Message to Customer
                </h2>
              </div>
              <div className="p-5">
                <textarea
                  rows={4}
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  placeholder="Tell the customer about the quote, valid dates, or special conditions..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all resize-none outline-none font-medium text-gray-700"
                />
              </div>
            </div>

            {/* Special Instructions (Read-only) */}
            {rfq.message && (
              <div className="bg-amber-50/50 rounded-xl shadow-sm border border-amber-100 p-5">
                <h2 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">info</span>
                  Customer's Instructions
                </h2>
                <p className="text-sm text-gray-700 leading-relaxed font-medium italic">"{rfq.message}"</p>
              </div>
            )}

            {/* Attachments Section */}
            {rfq.attachments?.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">attach_file</span>
                    Supporting Documents ({rfq.attachments.length})
                  </h2>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {rfq.attachments.map((file) => {
                    const isPDF = file.mime_type === 'application/pdf'
                    const isImage = file.mime_type?.startsWith('image/')
                    const fileUrlStr = file.file_url || file.fileUrl
                    const fileUrl = fileUrlStr?.startsWith('http') 
                      ? fileUrlStr 
                      : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${fileUrlStr}`

                    return (
                      <div key={file.id} className="group p-3 rounded-xl border border-gray-200 hover:border-primary/30 hover:bg-primary/5 transition-all flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isPDF ? 'bg-red-50 text-red-600' :
                            isImage ? 'bg-blue-50 text-blue-600' :
                            'bg-gray-50 text-gray-600'
                          }`}>
                            <span className="material-symbols-outlined text-xl">
                              {isPDF ? 'picture_as_pdf' : isImage ? 'image' : 'description'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate group-hover:text-primary transition-colors">{file.file_name}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">{(file.file_size / 1024).toFixed(0)} KB</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 border-t border-gray-100 pt-3">
                          <a
                            href={
                              fileUrl.startsWith('http')
                                ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/proxy-document?url=${encodeURIComponent(fileUrl)}`
                                : fileUrl
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-[10px] font-black text-gray-600 uppercase flex items-center justify-center gap-1 transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                            View
                          </a>
                          <a
                            href={
                              fileUrl.startsWith('http')
                                ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/proxy-document?url=${encodeURIComponent(fileUrl)}`
                                : fileUrl
                            }
                            download={file.file_name}
                            className="flex-1 py-1.5 bg-primary text-white hover:bg-primary/90 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1 transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">download</span>
                            Get File
                          </a>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            
            {/* Customer Snapshot */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-100 p-5 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary font-black text-2xl">
                  {customerName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate leading-tight">{customerName}</h3>
                  <p className="text-xs text-gray-500 font-medium truncate uppercase tracking-tighter">{businessType}</p>
                </div>
              </div>
              <div className="p-5 space-y-4">
                {[
                  { label: 'Organization', value: companyName, icon: 'factory' },
                  { label: 'Email Address', value: email, link: `mailto:${email}`, icon: 'alternate_email' },
                  { label: 'Phone', value: phone, icon: 'phone_iphone' },
                  { label: 'Address', value: [city, country].filter(Boolean).join(', '), icon: 'map' },
                ].map((f) => f.value && (
                  <div key={f.label} className="flex items-start gap-4 group">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/5 transition-colors">
                      <span className="material-symbols-outlined text-gray-400 text-lg group-hover:text-primary">{f.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">{f.label}</p>
                      {f.link ? (
                        <a href={f.link} className="text-sm font-bold text-primary hover:underline truncate block">{f.value}</a>
                      ) : (
                        <p className="text-sm font-bold text-gray-700 truncate">{f.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RFQ Meta Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Technical Specs</h3>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-gray-400 text-lg">event</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Submitted</p>
                    <p className="text-xs font-bold text-gray-700">{new Date(rfq.submitted_at).toLocaleDateString()}</p>
                  </div>
                </div>
                {rfq.requested_delivery_date && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 text-amber-500">
                      <span className="material-symbols-outlined text-lg">timer</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Deadline</p>
                      <p className="text-xs font-bold text-gray-700">{rfq.requested_delivery_date}</p>
                    </div>
                  </div>
                )}
                {rfq.shipping_method && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 text-blue-500">
                      <span className="material-symbols-outlined text-lg">package_2</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Logistics</p>
                      <p className="text-xs font-bold text-gray-700 capitalize">{rfq.shipping_method}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Private Notes */}
            <div className="bg-slate-900 rounded-xl shadow-lg p-5 text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Internal Log</h3>
                {notesSaved && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">SAVED</span>}
              </div>
              <textarea
                rows={3}
                value={notes ?? rfq.internal_notes ?? ''}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Private notes for staff only..."
                className="w-full bg-slate-800 border-0 rounded-lg text-xs p-3 text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-primary transition-all resize-none outline-none mb-3"
              />
              <button
                onClick={() => saveNotes.mutate()}
                disabled={saveNotes.isPending}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-[10px] font-black uppercase tracking-tighter rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
              >
                {saveNotes.isPending ? 'Propagating...' : 'Commit Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {feedbackModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-fade-in-up">
            <h3 className="font-headline font-bold text-xl text-on-surface mb-2">
              {feedbackModal.type === 'legitimacy' 
                ? (feedbackModal.targetValue ? 'Approve License' : 'Reject Business License')
                : (feedbackModal.targetValue === 'CLOSED' ? 'Close RFQ' : 'Decline RFQ')}
            </h3>
            <p className="text-sm text-on-surface-variant mb-6">
              Please provide a reason or feedback for this decision. This will be visible to the customer. 
              {(feedbackModal.targetValue === false || feedbackModal.targetValue === 'DECLINED') && <span className="text-red-500 font-bold ml-1">(Required)</span>}
            </p>
            
            <textarea
              autoFocus
              rows={4}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder={
                feedbackModal.targetValue === false || feedbackModal.targetValue === 'DECLINED'
                  ? "Describe the issue or fraud concern (REQUIRED to proceed)..." 
                  : "Add an optional note for the customer..."
              }
              className="w-full p-4 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none mb-6"
            />

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setFeedbackModal({ ...feedbackModal, open: false })
                  feedbackModal.resolve(null)
                }}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setFeedbackModal({ ...feedbackModal, open: false })
                  feedbackModal.resolve(feedbackText)
                }}
                disabled={(feedbackModal.targetValue === false || feedbackModal.targetValue === 'DECLINED') && !feedbackText.trim()}
                className={`flex-1 py-3 rounded-xl text-white font-bold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ${
                  feedbackModal.targetValue === false || feedbackModal.targetValue === 'DECLINED' ? 'bg-red-500' : 'bg-primary'
                }`}
              >
                Confirm Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}