import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import api from '../lib/api'

const STATUS_BADGE = {
  NEW:            'bg-blue-50 text-blue-700',
  UNDER_REVIEW:   'bg-yellow-50 text-yellow-700',
  QUOTATION_SENT: 'bg-green-50 text-green-700',
  CLOSED:         'bg-emerald-50 text-emerald-700',
  DECLINED:       'bg-red-50 text-red-700',
}

const STATUS_LABEL = {
  NEW:            'Pending Review',
  UNDER_REVIEW:   'Under Review',
  QUOTATION_SENT: 'Quotation Sent',
  CLOSED:         'Deal Closed',
  DECLINED:       'Declined',
}

export default function CustomerRFQDetail() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [showDeclineModal, setShowDeclineModal] = useState(false)
  const [declineReason, setDeclineReason] = useState('')

  const { data: rfq, isLoading } = useQuery({
    queryKey: ['customer-rfq', id],
    queryFn: () => api.get(`/customer/rfqs/${id}`).then((r) => r.data),
  })

  const acceptMutation = useMutation({
    mutationFn: () => api.post(`/customer/rfqs/${id}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-rfq', id] })
      queryClient.invalidateQueries({ queryKey: ['customer-rfqs'] })
      setShowAcceptModal(false)
    },
  })

  const declineMutation = useMutation({
    mutationFn: () => api.post(`/customer/rfqs/${id}/decline`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-rfq', id] })
      queryClient.invalidateQueries({ queryKey: ['customer-rfqs'] })
      setShowDeclineModal(false)
    },
  })

  const downloadRFQCopy = async () => {
    try {
      const response = await api.get(`/customer/rfqs/${id}/pdf`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `${rfq?.rfq_number || id}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF download failed:', err)
    }
  }

  const downloadQuotationPDF = async () => {
    try {
      const response = await api.get(`/customer/rfqs/${id}/pdf`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `${rfq?.rfq_number || id}-quotation.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF download failed:', err)
    }
  }

  if (isLoading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
    </div>
  )
  if (!rfq) return null

  return (
    <div className="min-h-screen bg-surface py-12 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Back + header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/portal" className="p-2 hover:bg-surface-container rounded-full transition-colors text-primary">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <p className="text-xs text-outline font-mono">{rfq.rfq_number}</p>
            <h1 className="font-headline font-extrabold text-2xl text-on-surface">RFQ Details</h1>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${STATUS_BADGE[rfq.status]}`}>
              {STATUS_LABEL[rfq.status]}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={downloadRFQCopy}
                className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-base">description</span>
                RFQ Copy
              </button>
              {rfq.status === 'QUOTATION_SENT' && (
                <>
                  <button
                    onClick={downloadQuotationPDF}
                    className="flex items-center gap-2 px-4 py-2 signature-gradient text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-colors shadow-md"
                  >
                    <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                    Download Quotation
                  </button>
                  <button
                    onClick={() => setShowDeclineModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors shadow-md"
                  >
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
                    Decline
                  </button>
                  <button
                    onClick={() => setShowAcceptModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors shadow-md"
                  >
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    Accept
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Submitted</p>
              <p className="text-sm font-semibold text-on-surface">{new Date(rfq.submitted_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Products</p>
              <p className="text-sm font-semibold text-on-surface">{rfq.items?.length} items</p>
            </div>
            {rfq.requested_delivery_date && (
              <div>
                <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Delivery By</p>
                <p className="text-sm font-semibold text-on-surface">{rfq.requested_delivery_date}</p>
              </div>
            )}
            {rfq.shipping_method && (
              <div>
                <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Delivery</p>
                <p className="text-sm font-semibold text-on-surface capitalize">{rfq.shipping_method}</p>
              </div>
            )}
          </div>

          {/* Products */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-surface-container flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">medical_services</span>
              <h2 className="font-headline font-bold text-on-surface">Requested Products</h2>
            </div>
            <div className="divide-y divide-surface-container">
              {rfq.items?.map((item) => (
                <div key={item.id} className="p-5 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-on-surface">{item.product_name}</p>
                    <p className="text-xs text-outline">{item.brand} · {item.unit}</p>
                    {item.notes && <p className="text-xs text-on-surface-variant italic mt-1">"{item.notes}"</p>}
                  </div>
                  <div className="text-right">
                    {item.unit_price ? (
                      <div>
                        <p className="text-sm font-bold text-on-surface">{item.currency || 'USD'} {parseFloat(item.unit_price).toFixed(2)} / unit</p>
                        <p className="text-xs text-primary font-semibold">Total: {item.currency || 'USD'} {(parseFloat(item.unit_price) * item.quantity).toFixed(2)}</p>
                        <p className="text-[10px] text-outline uppercase">Qty: {item.quantity} {item.unit}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xl font-headline font-extrabold text-primary">{item.quantity}</p>
                        <p className="text-[10px] text-outline uppercase">{item.unit}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Grand total if prices exist */}
            {rfq.items?.some(i => i.unit_price) && (
              <div className="p-5 border-t border-surface-container bg-surface-container-low flex items-center justify-between">
                <span className="font-headline font-bold text-on-surface">Grand Total</span>
                <span className="font-headline font-extrabold text-xl text-primary">
                  {rfq.items[0]?.currency || 'USD'}{' '}
                  {rfq.items.reduce((sum, i) => sum + (parseFloat(i.unit_price || 0) * i.quantity), 0).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Message */}
          {rfq.message && (
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
              <h2 className="font-headline font-bold text-on-surface mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">chat_bubble</span>
                Special Instructions
              </h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">{rfq.message}</p>
            </div>
          )}

          {/* Attachments */}
          {rfq.attachments?.length > 0 && (
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
              <h2 className="font-headline font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">attach_file</span>
                Uploaded Documents
              </h2>
              <div className="space-y-3">
                {rfq.attachments.map((file) => (
                  <a key={file.id} href={file.file_url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl hover:bg-surface-container transition-colors group">
                    <span className="material-symbols-outlined text-primary">description</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-on-surface truncate">{file.file_name}</p>
                      <p className="text-xs text-outline">{(file.file_size / 1024).toFixed(0)} KB</p>
                    </div>
                    <span className="material-symbols-outlined text-outline group-hover:text-primary">download</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ── QUOTATION SENT: Accept or Decline ──────────────────────────── */}
          {rfq.status === 'QUOTATION_SENT' && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-green-600 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>mark_email_read</span>
                <div className="flex-1">
                  <h3 className="font-headline font-bold text-green-800 mb-1">Quotation Ready — Review & Respond</h3>
                  <p className="text-sm text-green-700 mb-4">
                    A formal quotation has been sent to your email. Download the PDF to review pricing and terms, then <strong>Accept</strong> to confirm or <strong>Decline</strong> if you are not satisfied.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={downloadQuotationPDF} className="flex items-center gap-2 px-4 py-2.5 border border-green-400 text-green-800 bg-white rounded-lg text-sm font-semibold hover:bg-green-100 transition-colors">
                      <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                      Download Quotation PDF
                    </button>
                    <button onClick={() => setShowDeclineModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors shadow-md">
                      <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
                      Decline Quotation
                    </button>
                    <button onClick={() => setShowAcceptModal(true)} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors shadow-md">
                      <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      Accept Quotation
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── CLOSED: Deal confirmed ──────────────────────────────────────── */}
          {rfq.status === 'CLOSED' && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-emerald-600 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <div>
                  <h3 className="font-headline font-bold text-emerald-800 text-lg mb-1">Deal Closed — Thank You!</h3>
                  <p className="text-sm text-emerald-700">
                    You have accepted the quotation for <strong>{rfq.rfq_number}</strong>. Our team will be in touch shortly to arrange delivery and payment.
                  </p>
                  {rfq.verification_feedback && (
                    <div className="mt-4 p-3 bg-white/50 rounded-xl border border-emerald-200 text-sm text-emerald-800 italic font-medium">
                      Admin Note: "{rfq.verification_feedback}"
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── DECLINED: Quotation declined ───────────────────────────────── */}
          {rfq.status === 'DECLINED' && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-red-500 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
                <div>
                  <h3 className="font-headline font-bold text-red-800 text-lg mb-1">Quotation Declined</h3>
                  <p className="text-sm text-red-700 mb-3">
                    You have declined the quotation for <strong>{rfq.rfq_number}</strong>. If you'd like to request a new quote, please submit a new RFQ.
                  </p>
                  {rfq.verification_feedback && (
                    <div className="mt-2 mb-4 p-3 bg-white/50 rounded-xl border border-red-200 text-sm text-red-800 italic font-medium">
                      Rejection Reason: "{rfq.verification_feedback}"
                    </div>
                  )}
                  <Link to="/portal/rfq" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors">
                    <span className="material-symbols-outlined text-base">add</span>
                    Submit New RFQ
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Quotation pending info */}
          {rfq.status !== 'QUOTATION_SENT' && rfq.status !== 'CLOSED' && rfq.status !== 'DECLINED' && (
            <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/20">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-outline text-xl">info</span>
                <div>
                  <h3 className="font-headline font-bold text-sm text-on-surface mb-1">Quotation Pending</h3>
                  <p className="text-xs text-on-surface-variant mb-3">Your formal quotation with pricing will be available here once our team sends it. You'll also receive it by email.</p>
                  
                  {rfq.verification_feedback && (
                    <div className="mt-2 p-3 bg-white rounded-xl border border-outline-variant/20 text-xs text-on-surface-variant italic font-medium">
                      Note: "{rfq.verification_feedback}"
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <Link to="/portal" className="btn-secondary flex items-center gap-2">
              <span className="material-symbols-outlined">arrow_back</span>
              Back to Dashboard
            </Link>
            <Link to="/rfq" className="btn-primary flex items-center gap-2">
              <span className="material-symbols-outlined">add</span>
              New RFQ
            </Link>
          </div>
        </div>
      </div>

      {/* ── Decline Confirmation Modal ────────────────────────────────────── */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-red-600 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
              </div>
              <div>
                <h2 className="font-headline font-extrabold text-xl text-on-surface">Decline Quotation?</h2>
                <p className="text-sm text-outline font-mono">{rfq.rfq_number}</p>
              </div>
            </div>

            <p className="text-sm text-on-surface-variant mb-5 leading-relaxed">
              Are you sure you want to decline this quotation? The admin will be notified and no further action will be taken on this RFQ. You can always submit a new RFQ.
            </p>

            {declineMutation.isError && (
              <p className="text-sm text-red-600 mb-4 bg-red-50 px-4 py-2 rounded-lg border border-red-200">
                Something went wrong. Please try again.
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeclineModal(false)}
                disabled={declineMutation.isPending}
                className="flex-1 px-4 py-3 border border-outline-variant rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => declineMutation.mutate()}
                disabled={declineMutation.isPending}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {declineMutation.isPending ? (
                  <><span className="material-symbols-outlined animate-spin text-base">progress_activity</span> Processing...</>
                ) : (
                  <><span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span> Confirm Decline</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Accept Confirmation Modal ─────────────────────────────────────── */}
      {showAcceptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-emerald-600 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>handshake</span>
              </div>
              <div>
                <h2 className="font-headline font-extrabold text-xl text-on-surface">Accept Quotation?</h2>
                <p className="text-sm text-outline">{rfq.rfq_number}</p>
              </div>
            </div>

            <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
              By accepting this quotation, you confirm that you agree to the pricing and terms provided. The RFQ will be marked as <strong className="text-emerald-700">Deal Closed</strong> and our team will proceed with your order.
            </p>

            {/* Price summary */}
            {rfq.items?.some(i => i.unit_price) && (
              <div className="bg-surface-container-low rounded-xl p-4 mb-6">
                <p className="text-xs font-bold text-outline uppercase tracking-widest mb-3">Order Summary</p>
                <div className="space-y-2">
                  {rfq.items.filter(i => i.unit_price).map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-on-surface-variant">{item.product_name} × {item.quantity}</span>
                      <span className="font-semibold text-on-surface">{item.currency || 'USD'} {(parseFloat(item.unit_price) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-outline-variant/30 pt-2 flex justify-between font-bold">
                    <span className="text-on-surface">Total</span>
                    <span className="text-primary text-base">
                      {rfq.items[0]?.currency || 'USD'}{' '}
                      {rfq.items.reduce((sum, i) => sum + (parseFloat(i.unit_price || 0) * i.quantity), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {acceptMutation.isError && (
              <p className="text-sm text-red-600 mb-4 bg-red-50 px-4 py-2 rounded-lg">
                Something went wrong. Please try again.
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowAcceptModal(false)}
                disabled={acceptMutation.isPending}
                className="flex-1 px-4 py-3 border border-outline-variant rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => acceptMutation.mutate()}
                disabled={acceptMutation.isPending}
                className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {acceptMutation.isPending ? (
                  <><span className="material-symbols-outlined animate-spin text-base">progress_activity</span> Processing...</>
                ) : (
                  <><span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Confirm Acceptance</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
