import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import AdminLayout from '../components/AdminLayout'

const STATUS_BADGE = {
  NEW:            'bg-blue-50 text-blue-700',
  UNDER_REVIEW:   'bg-yellow-50 text-yellow-700',
  QUOTATION_SENT: 'bg-green-50 text-green-700',
  CLOSED:         'bg-slate-100 text-slate-500',
}

const STATUS_ICON = {
  NEW:            'fiber_new',
  UNDER_REVIEW:   'pending',
  QUOTATION_SENT: 'mark_email_read',
  CLOSED:         'task_alt',
}

export default function RFQDetails() {
  const { id } = useParams()
  const qc = useQueryClient()
  const [notes, setNotes] = useState(null) // null = not yet loaded
  const [notesSaved, setNotesSaved] = useState(false)
  const [quotationSent, setQuotationSent] = useState(false)

  const { data: rfq, isLoading } = useQuery({
    queryKey: ['admin-rfq', id],
    queryFn: () => api.get(`/admin/rfqs/${id}`).then((r) => r.data),
  })

  // Initialize notes when data loads
  useEffect(() => {
    if (rfq && notes === null) setNotes(rfq.internal_notes || '')
  }, [rfq])

  const updateStatus = useMutation({
    mutationFn: (status) => api.patch(`/admin/rfqs/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries(['admin-rfq', id]),
  })

  const saveNotes = useMutation({
    mutationFn: () => api.patch(`/admin/rfqs/${id}/notes`, { notes }),
    onSuccess: () => { setNotesSaved(true); setTimeout(() => setNotesSaved(false), 2000) },
  })

  const sendQuotation = useMutation({
    mutationFn: () => api.post(`/admin/rfqs/${id}/respond`),
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
    <div className="min-h-screen bg-background flex items-center justify-center">
      <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
    </div>
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
    <div className="bg-background font-body text-on-surface antialiased min-h-screen">
      {/* Top bar */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-lg shadow-sm h-20 flex justify-between items-center px-4 md:px-8">
        <div className="flex items-center gap-4">
          <Link to="/admin/rfqs" className="p-2 hover:bg-slate-100 transition-colors rounded-full text-primary">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <h1 className="font-headline font-bold text-xl tracking-tight text-primary">{rfq.rfq_number}</h1>
            <p className="text-xs text-slate-500">{companyName} · {customerName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg text-sm font-semibold text-on-surface hover:bg-slate-50 transition-colors"
          >
            <span className="material-symbols-outlined text-base">picture_as_pdf</span>
            Export PDF
          </button>
          <button
            onClick={() => sendQuotation.mutate()}
            disabled={sendQuotation.isPending || quotationSent}
            className="signature-gradient text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70"
          >
            {sendQuotation.isPending ? 'Sending...' : quotationSent ? '✓ Sent' : 'Send Quotation'}
          </button>
        </div>
      </header>

      <main className="pt-24 pb-32 px-4 max-w-5xl mx-auto space-y-6">

        {/* Status & meta */}
        <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${STATUS_BADGE[rfq.status]}`}>
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{STATUS_ICON[rfq.status]}</span>
                  {rfq.status?.replace('_', ' ')}
                </span>
                <span className="text-xs text-slate-400">
                  Submitted {new Date(rfq.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              {rfq.requested_delivery_date && (
                <p className="text-xs text-on-surface-variant">
                  <span className="font-bold">Delivery by:</span> {rfq.requested_delivery_date}
                </p>
              )}
              {rfq.shipping_method && (
                <p className="text-xs text-on-surface-variant">
                  <span className="font-bold">Shipping:</span> {rfq.shipping_method}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-outline uppercase tracking-widest">Change Status</label>
              <select
                value={rfq.status}
                onChange={(e) => updateStatus.mutate(e.target.value)}
                className="px-4 py-2 bg-surface-container-high rounded-lg text-sm font-semibold text-on-surface outline-none border-none cursor-pointer"
              >
                <option value="NEW">New</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="QUOTATION_SENT">Quotation Sent</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>
          {sendQuotation.isError && (
            <div className="mt-4 p-3 bg-error-container text-on-error-container rounded-lg text-sm">
              Failed to send quotation: {sendQuotation.error?.response?.data?.message || sendQuotation.error?.message}
            </div>
          )}
          {quotationSent && (
            <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              Quotation email sent successfully to {email}
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Products + Attachments */}
          <div className="lg:col-span-2 space-y-6">

            {/* Products */}
            <section className="bg-surface-container-low rounded-xl overflow-hidden">
              <div className="p-5 border-b border-white/20 bg-white/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">medical_services</span>
                  <h3 className="font-headline font-bold text-on-surface">Requested Products</h3>
                </div>
                <span className="text-xs text-outline">{rfq.items?.length} items</span>
              </div>
              <div className="divide-y divide-outline-variant/10">
                {rfq.items?.map((item) => (
                  <div key={item.id} className="p-5 flex items-center justify-between gap-4 hover:bg-white/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-outline text-lg">medication_liquid</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm text-on-surface">{item.product_name}</p>
                        <p className="text-xs text-outline">{item.brand} · {item.unit}</p>
                        {item.notes && <p className="text-xs text-on-surface-variant italic mt-0.5">"{item.notes}"</p>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-headline font-extrabold text-primary">{item.quantity}</p>
                      <p className="text-[10px] font-bold text-outline-variant uppercase">{item.unit}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Message */}
            {rfq.message && (
              <section className="bg-surface-container-low rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="material-symbols-outlined text-primary">chat_bubble</span>
                  <h3 className="font-headline font-bold text-on-surface">Special Instructions</h3>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed">{rfq.message}</p>
              </section>
            )}

            {/* Attachments */}
            {rfq.attachments?.length > 0 && (
              <section className="bg-surface-container-low rounded-xl overflow-hidden">
                <div className="p-5 border-b border-white/20 bg-white/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">attach_file</span>
                    <h3 className="font-headline font-bold text-on-surface">Submitted Documents</h3>
                  </div>
                  <span className="text-xs text-outline">{rfq.attachments.length} file{rfq.attachments.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="p-5 space-y-3">
                  {rfq.attachments.map((file) => {
                    const isImage = file.mime_type?.startsWith('image/')
                    const isPDF = file.mime_type === 'application/pdf'
                    const fileUrl = file.file_url.startsWith('http') ? file.file_url : `http://localhost:5000${file.file_url}`

                    return (
                      <div key={file.id} className="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/10">
                        {/* Image preview */}
                        {isImage && (
                          <div className="w-full max-h-64 overflow-hidden bg-surface-container">
                            <img
                              src={fileUrl}
                              alt={file.file_name}
                              className="w-full h-full object-contain"
                              onError={(e) => { e.target.style.display = 'none' }}
                            />
                          </div>
                        )}

                        {/* File info row */}
                        <div className="flex items-center gap-3 p-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isPDF ? 'bg-red-50 text-red-600' :
                            isImage ? 'bg-blue-50 text-blue-600' :
                            'bg-surface-container text-outline'
                          }`}>
                            <span className="material-symbols-outlined text-lg">
                              {isPDF ? 'picture_as_pdf' : isImage ? 'image' : 'description'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-on-surface truncate">{file.file_name}</p>
                            <p className="text-[10px] text-outline">
                              {(file.file_size / 1024).toFixed(0)} KB · {file.mime_type}
                            </p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            {/* View in new tab */}
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:bg-primary hover:text-white transition-all text-xs font-bold"
                            >
                              <span className="material-symbols-outlined text-sm">open_in_new</span>
                              View
                            </a>
                            {/* Download */}
                            <a
                              href={fileUrl}
                              download={file.file_name}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-all text-xs font-bold"
                            >
                              <span className="material-symbols-outlined text-sm">download</span>
                              Download
                            </a>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* No attachments message */}
            {rfq.attachments?.length === 0 && (
              <section className="bg-surface-container-low rounded-xl p-5">
                <div className="flex items-center gap-3 text-on-surface-variant">
                  <span className="material-symbols-outlined">attach_file</span>
                  <p className="text-sm">No documents submitted with this RFQ.</p>
                </div>
              </section>
            )}
          </div>

          {/* Right: Customer info + Notes */}
          <div className="space-y-6">

            {/* Customer */}
            <section className="bg-surface-container-low rounded-xl overflow-hidden">
              <div className="p-5 border-b border-white/20 bg-white/40 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">account_circle</span>
                <h3 className="font-headline font-bold text-on-surface">Customer</h3>
              </div>
              <div className="p-5 space-y-4">
                {[
                  { label: 'Name',          value: customerName },
                  { label: 'Company',       value: companyName },
                  { label: 'Business Type', value: businessType },
                  { label: 'Email',         value: email, link: `mailto:${email}` },
                  { label: 'Phone',         value: phone },
                  { label: 'Location',      value: [city, country].filter(Boolean).join(', ') },
                ].map((f) => f.value && (
                  <div key={f.label}>
                    <p className="text-[10px] font-bold uppercase tracking-tighter text-outline-variant">{f.label}</p>
                    {f.link
                      ? <a href={f.link} className="text-sm font-semibold text-primary underline underline-offset-4">{f.value}</a>
                      : <p className="text-sm font-semibold text-on-surface">{f.value}</p>
                    }
                  </div>
                ))}
              </div>
            </section>

            {/* Internal Notes */}
            <section className="bg-surface-container-low rounded-xl overflow-hidden">
              <div className="p-5 border-b border-white/20 bg-white/40 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">edit_note</span>
                <h3 className="font-headline font-bold text-on-surface">Internal Notes</h3>
              </div>
              <div className="p-5">
                <textarea
                  rows={5}
                  value={notes ?? rfq.internal_notes ?? ''}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add private notes for the fulfillment team..."
                  className="w-full bg-surface-container-lowest border-none rounded-lg text-sm text-on-surface placeholder:text-outline-variant focus:ring-1 focus:ring-primary p-4 outline-none resize-none"
                />
                <div className="flex items-center justify-between mt-3">
                  {notesSaved && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      Saved
                    </span>
                  )}
                  <button
                    onClick={() => saveNotes.mutate()}
                    disabled={saveNotes.isPending}
                    className="ml-auto text-xs font-bold text-primary uppercase tracking-wider px-4 py-2 hover:bg-primary/5 rounded-full transition-colors disabled:opacity-50"
                  >
                    {saveNotes.isPending ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Fixed footer */}
      <footer className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl border-t border-slate-200/50 flex items-center justify-center px-6 z-50">
        <div className="max-w-5xl w-full flex items-center justify-between">
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-outline uppercase tracking-widest">Workflow State</p>
            <p className="text-sm font-semibold text-on-surface">{rfq.status?.replace('_', ' ')}</p>
          </div>
          <div className="flex gap-4 w-full sm:w-auto">
            <button onClick={exportPDF} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 border border-outline-variant rounded-lg text-sm font-bold text-on-surface hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined text-base">picture_as_pdf</span>
              Export PDF
            </button>
            <button
              onClick={() => sendQuotation.mutate()}
              disabled={sendQuotation.isPending || quotationSent}
              className="flex-1 sm:flex-none signature-gradient text-white px-8 py-3 rounded-lg text-sm font-extrabold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-70"
            >
              {sendQuotation.isPending ? 'Sending...' : quotationSent ? '✓ Quotation Sent' : 'Send Quotation'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}
