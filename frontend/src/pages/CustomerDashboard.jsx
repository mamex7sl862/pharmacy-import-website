import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { useState } from 'react'
import api from '../lib/api'
import useAuthStore from '../store/authStore'

const STATUS_BADGE = {
  NEW:            'bg-blue-50 text-blue-700',
  UNDER_REVIEW:   'bg-yellow-50 text-yellow-700',
  QUOTATION_SENT: 'bg-green-50 text-green-700',
  CLOSED:         'bg-emerald-50 text-emerald-700',
}
const STATUS_DOT   = { NEW: 'bg-blue-500', UNDER_REVIEW: 'bg-yellow-500', QUOTATION_SENT: 'bg-green-500', CLOSED: 'bg-emerald-500' }
const STATUS_LABEL = { NEW: 'Pending', UNDER_REVIEW: 'Under Review', QUOTATION_SENT: 'Quoted', CLOSED: 'Closed' }

export default function CustomerDashboard() {
  const { user } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const newRfq = location.state?.newRfq
  const [acceptingRfq, setAcceptingRfq] = useState(null) // holds the rfq being accepted

  const { data, isLoading } = useQuery({
    queryKey: ['customer-rfqs'],
    queryFn: () => api.get('/customer/rfqs').then((r) => r.data),
  })

  const acceptMutation = useMutation({
    mutationFn: (rfqId) => api.post(`/customer/rfqs/${rfqId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-rfqs'] })
      setAcceptingRfq(null)
    },
  })

  const downloadPDF = async (rfq) => {
    try {
      const res = await api.get(`/customer/rfqs/${rfq.id}/pdf`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `${rfq.rfqNumber}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (e) { console.error(e) }
  }

  const stats = [
    { icon: 'pending_actions', label: 'Pending RFQs',    value: data?.filter((r) => ['NEW', 'UNDER_REVIEW'].includes(r.status)).length || 0, badge: 'ACTIVE', badgeColor: 'text-primary bg-primary/10' },
    { icon: 'request_quote',   label: 'Quotes Received', value: data?.filter((r) => r.status === 'QUOTATION_SENT').length || 0 },
    { icon: 'verified',        label: 'Total RFQs',      value: data?.length || 0 },
  ]

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6 min-w-0 max-w-6xl mx-auto">
      {/* RFQ submitted success banner */}
      {newRfq && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <span className="material-symbols-outlined text-green-600 text-xl flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <div className="flex-1">
            <p className="font-semibold text-green-800 mb-1">RFQ Submitted Successfully!</p>
            <p className="text-sm text-green-700">
              Your request <span className="font-mono font-medium">{newRfq}</span> has been received. Our team will respond within 4–24 hours.
            </p>
          </div>
          <Link to="/track" className="flex-shrink-0 text-xs font-medium text-green-700 border border-green-300 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors">
            Track RFQ
          </Link>
        </div>
      )}

      {/* Welcome */}
      <section className="mb-8">
        <h1 className="font-headline font-bold text-2xl text-on-surface tracking-tight mb-1">
          Welcome back, {user?.companyName || user?.fullName}
        </h1>
        <p className="text-sm text-on-surface-variant">Managing your pharmaceutical procurement with clinical precision.</p>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-lg">{s.icon}</span>
              </div>
              {s.badge && <span className={`text-xs font-medium px-2 py-1 rounded-full ${s.badgeColor}`}>{s.badge}</span>}
            </div>
            <p className="text-2xl font-semibold text-gray-900 mb-1">{s.value}</p>
            <p className="text-sm text-gray-600">{s.label}</p>
          </div>
        ))}
      </div>

      {/* RFQ History */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg text-gray-900">Recent RFQs</h2>
          <Link to="/portal/rfq" className="text-sm font-medium text-primary hover:text-primary-container transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-base">add</span>
            New RFQ
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : data?.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-2xl text-gray-400">description</span>
            </div>
            <p className="text-gray-900 font-medium mb-1">No RFQs yet</p>
            <p className="text-sm text-gray-600 mb-4">Start by submitting your first request for quotation</p>
            <Link to="/portal/rfq" className="btn-primary text-sm px-4 py-2">
              Create RFQ
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {data.slice(0, 5).map((rfq) => (
              <div key={rfq.id} className={`bg-white rounded-lg p-4 hover:shadow-md transition-all border group ${rfq.status === 'QUOTATION_SENT' ? 'border-green-200 bg-green-50/30' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${rfq.status === 'QUOTATION_SENT' ? 'bg-green-100' : 'bg-primary/10'}`}>
                      <span className={`material-symbols-outlined text-lg ${rfq.status === 'QUOTATION_SENT' ? 'text-green-600' : 'text-primary'}`}>
                        {rfq.status === 'QUOTATION_SENT' ? 'mark_email_read' : 'medication_liquid'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-gray-900">{rfq.rfqNumber}</h3>
                      <p className="text-sm text-gray-600">
                        {rfq.itemCount} products · {new Date(rfq.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[rfq.status]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[rfq.status]}`} />
                      {STATUS_LABEL[rfq.status]}
                    </span>

                    {rfq.status === 'QUOTATION_SENT' ? (
                      <>
                        {/* Download PDF */}
                        <button
                          onClick={() => downloadPDF(rfq)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-container transition-colors"
                          title="Download Quotation PDF"
                        >
                          <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                          PDF
                        </button>
                        {/* Accept Quotation */}
                        <button
                          onClick={() => setAcceptingRfq(rfq)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                          title="Accept this quotation"
                        >
                          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          Accept
                        </button>
                      </>
                    ) : (
                      <Link
                        to={`/portal/rfqs/${rfq.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        View
                      </Link>
                    )}
                  </div>
                </div>

                {/* Quoted action hint */}
                {rfq.status === 'QUOTATION_SENT' && (
                  <div className="mt-3 pt-3 border-t border-green-200 flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-600 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                    <p className="text-xs text-green-700 font-medium">
                      Your quotation is ready. Download the PDF to review pricing, then click <strong>Accept</strong> to confirm your order.
                    </p>
                  </div>
                )}
              </div>
            ))}
            
            {data.length > 5 && (
              <div className="text-center pt-4">
                <Link to="/portal/rfqs" className="text-sm font-medium text-primary hover:text-primary-container transition-colors">
                  View all RFQs ({data.length})
                </Link>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Accept Confirmation Modal ───────────────────────────────────────── */}
      {acceptingRfq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-emerald-600 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>handshake</span>
              </div>
              <div>
                <h2 className="font-headline font-extrabold text-xl text-gray-900">Accept Quotation?</h2>
                <p className="text-sm text-gray-500 font-mono">{acceptingRfq.rfqNumber}</p>
              </div>
            </div>

            {/* Body */}
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              By accepting, you confirm that you have reviewed the quotation PDF and agree to the pricing and terms. Your order status will change to <strong className="text-emerald-700">Closed</strong> and our team will proceed with delivery.
            </p>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <span className="material-symbols-outlined text-emerald-600 text-lg flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
              <p className="text-sm text-emerald-800 font-medium">
                After acceptance, our logistics team will contact you to arrange delivery and payment.
              </p>
            </div>

            {acceptMutation.isError && (
              <p className="text-sm text-red-600 mb-4 bg-red-50 px-4 py-2 rounded-lg border border-red-200">
                Something went wrong. Please try again.
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => { setAcceptingRfq(null); acceptMutation.reset() }}
                disabled={acceptMutation.isPending}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => acceptMutation.mutate(acceptingRfq.id)}
                disabled={acceptMutation.isPending}
                className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {acceptMutation.isPending ? (
                  <><span className="material-symbols-outlined animate-spin text-base">progress_activity</span> Processing...</>
                ) : (
                  <><span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Confirm & Accept</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
