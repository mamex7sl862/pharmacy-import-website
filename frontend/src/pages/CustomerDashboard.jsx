import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import api from '../lib/api'
import useAuthStore from '../store/authStore'

const STATUS_BADGE = {
  NEW:            'bg-blue-50 text-blue-700',
  UNDER_REVIEW:   'bg-yellow-50 text-yellow-700',
  QUOTATION_SENT: 'bg-green-50 text-green-700',
  CLOSED:         'bg-slate-100 text-slate-500',
}
const STATUS_DOT   = { NEW: 'bg-blue-500', UNDER_REVIEW: 'bg-yellow-500', QUOTATION_SENT: 'bg-green-500', CLOSED: 'bg-slate-400' }
const STATUS_LABEL = { NEW: 'Pending', UNDER_REVIEW: 'Under Review', QUOTATION_SENT: 'Quoted', CLOSED: 'Closed' }

export default function CustomerDashboard() {
  const { user } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const newRfq = location.state?.newRfq // RFQ number passed after submission
  const { data, isLoading } = useQuery({
    queryKey: ['customer-rfqs'],
    queryFn: () => api.get('/customer/rfqs').then((r) => r.data),
  })

  const stats = [
    { icon: 'pending_actions', label: 'Pending RFQs',    value: data?.filter((r) => ['NEW', 'UNDER_REVIEW'].includes(r.status)).length || 0, badge: 'ACTIVE', badgeColor: 'text-primary bg-primary/10' },
    { icon: 'request_quote',   label: 'Quotes Received', value: data?.filter((r) => r.status === 'QUOTATION_SENT').length || 0 },
    { icon: 'verified',        label: 'Total RFQs',      value: data?.length || 0 },
  ]

  return (
    <div className="p-6 md:p-10 pb-24 md:pb-10 min-w-0">
      {/* RFQ submitted success banner */}
      {newRfq && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-8 flex items-start gap-4">
          <span className="material-symbols-outlined text-green-600 text-2xl flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <div className="flex-1">
            <p className="font-headline font-bold text-green-800 mb-1">RFQ Submitted Successfully!</p>
            <p className="text-sm text-green-700">
              Your request <span className="font-mono font-bold">{newRfq}</span> has been received. Our team will respond within 4–24 hours.
            </p>
          </div>
          <Link to="/track" className="flex-shrink-0 text-xs font-bold text-green-700 border border-green-300 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors">
            Track RFQ
          </Link>
        </div>
      )}

      {/* Welcome */}
      <section className="mb-10">
        <h1 className="font-headline font-extrabold text-3xl md:text-4xl text-on-surface tracking-tight mb-2">
          Welcome back, {user?.companyName || user?.fullName}
        </h1>
        <p className="text-on-surface-variant">Managing your pharmaceutical procurement with clinical precision.</p>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10">
            <div className="flex justify-between items-start mb-4">
              <span className="p-3 bg-primary/5 rounded-lg text-primary">
                <span className="material-symbols-outlined">{s.icon}</span>
              </span>
              {s.badge && <span className={`text-xs font-bold px-2 py-1 rounded-full ${s.badgeColor}`}>{s.badge}</span>}
            </div>
            <p className="text-3xl font-headline font-bold text-on-surface">{s.value}</p>
            <p className="text-sm text-on-surface-variant font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* RFQ History */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline font-bold text-xl text-on-surface">RFQ History</h2>
          <Link to="/portal/rfq" className="btn-primary text-sm px-5 py-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">add</span>
            New RFQ
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-surface-container rounded-xl animate-pulse" />
            ))}
          </div>
        ) : data?.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl p-16 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-4 block opacity-30">description</span>
            <p className="font-medium">No RFQs yet.</p>
            <Link to="/portal/rfq" className="text-primary font-bold text-sm mt-2 inline-block hover:underline">
              Submit your first RFQ
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((rfq) => (
              <div key={rfq.id} className="bg-surface-container-lowest rounded-xl p-5 md:p-6 hover:shadow-md transition-all border border-outline-variant/5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-secondary-container rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-primary">medication_liquid</span>
                    </div>
                    <div>
                      <h3 className="font-headline font-bold text-on-surface">{rfq.rfqNumber}</h3>
                      <p className="text-sm text-on-surface-variant">
                        {rfq.itemCount} products · {new Date(rfq.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${STATUS_BADGE[rfq.status]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[rfq.status]}`} />
                      {STATUS_LABEL[rfq.status]}
                    </span>

                    {rfq.status === 'QUOTATION_SENT' ? (
                      <button
                        onClick={async () => {
                          try {
                            const res = await api.get(`/customer/rfqs/${rfq.id}/pdf`, { responseType: 'blob' })
                            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
                            const a = document.createElement('a'); a.href = url; a.download = `${rfq.rfqNumber}.pdf`; a.click()
                            window.URL.revokeObjectURL(url)
                          } catch (e) { console.error(e) }
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-container transition-colors shadow-sm"
                      >
                        <span className="material-symbols-outlined text-base">download</span>
                        Download PDF
                      </button>
                    ) : (
                      <Link
                        to={`/portal/rfqs/${rfq.id}`}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant text-sm font-semibold hover:bg-surface-container-low transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">visibility</span>
                        Details
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
