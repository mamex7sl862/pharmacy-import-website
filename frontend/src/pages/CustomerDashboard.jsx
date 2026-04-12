import { Link, NavLink } from 'react-router-dom'
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
  const { user, clearAuth } = useAuthStore()
  const location = useLocation()
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

  const SIDEBAR_NAV = [
    { to: '/portal',   icon: 'dashboard',    label: 'Dashboard',      exact: true },
    { to: '/rfq',      icon: 'add_circle',   label: 'New RFQ' },
    { to: '/products', icon: 'inventory_2',  label: 'Product Catalog' },
    { to: '/compare',  icon: 'compare_arrows', label: 'Compare' },
  ]

  return (
    <div className="flex min-h-screen bg-surface font-body text-on-surface">

      {/* Left sidebar */}
      <aside className="hidden md:flex flex-col w-64 flex-shrink-0 sticky top-16 h-[calc(100vh-4rem)] bg-surface-container-low border-r border-outline-variant/10 py-6">
        {/* User info */}
        <div className="px-6 mb-6 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {user?.fullName?.[0] || 'C'}
          </div>
          <div className="min-w-0">
            <p className="font-headline font-bold text-primary text-sm truncate">{user?.fullName}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.companyName}</p>
          </div>
        </div>

        <div className="px-4 mb-3">
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Menu</p>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {SIDEBAR_NAV.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white text-primary font-bold shadow-sm'
                    : 'text-slate-500 hover:bg-white/60 hover:text-primary'
                }`
              }
            >
              <span className="material-symbols-outlined text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 pt-4 border-t border-outline-variant/10 mt-4">
          <button
            onClick={clearAuth}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-error transition-colors w-full px-4 py-2"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 md:p-10 pb-24 md:pb-10 min-w-0">

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
            <Link to="/rfq" className="btn-primary text-sm px-5 py-2 flex items-center gap-1.5">
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
              <Link to="/rfq" className="text-primary font-bold text-sm mt-2 inline-block hover:underline">
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
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 md:hidden bg-white/90 backdrop-blur-xl border-t border-slate-100">
        <Link to="/portal" className="flex flex-col items-center text-primary">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          <span className="text-[11px] font-semibold">Home</span>
        </Link>
        <Link to="/rfq" className="flex flex-col items-center text-slate-400">
          <span className="material-symbols-outlined">request_quote</span>
          <span className="text-[11px] font-semibold">RFQ</span>
        </Link>
        <Link to="/products" className="flex flex-col items-center text-slate-400">
          <span className="material-symbols-outlined">inventory_2</span>
          <span className="text-[11px] font-semibold">Products</span>
        </Link>
        <Link to="/compare" className="flex flex-col items-center text-slate-400">
          <span className="material-symbols-outlined">compare_arrows</span>
          <span className="text-[11px] font-semibold">Compare</span>
        </Link>
      </nav>
    </div>
  )
}
