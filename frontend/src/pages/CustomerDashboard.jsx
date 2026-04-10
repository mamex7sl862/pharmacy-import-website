import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import useAuthStore from '../store/authStore'

const STATUS_BADGE = {
  NEW: 'bg-secondary-container text-on-secondary-container',
  UNDER_REVIEW: 'bg-surface-container-high text-on-surface-variant',
  QUOTATION_SENT: 'bg-secondary-container text-on-secondary-container',
  CLOSED: 'bg-surface-dim text-on-surface-variant',
}
const STATUS_DOT = { NEW: 'bg-primary', UNDER_REVIEW: 'bg-slate-400', QUOTATION_SENT: 'bg-primary', CLOSED: 'bg-slate-600' }
const STATUS_LABEL = { NEW: 'Pending', UNDER_REVIEW: 'Pending', QUOTATION_SENT: 'Quoted', CLOSED: 'Closed' }

export default function CustomerDashboard() {
  const { user, clearAuth } = useAuthStore()
  const { data, isLoading } = useQuery({
    queryKey: ['customer-rfqs'],
    queryFn: () => api.get('/customer/rfqs').then((r) => r.data),
  })

  const stats = [
    { icon: 'pending_actions', label: 'Pending RFQs', value: data?.filter((r) => ['NEW', 'UNDER_REVIEW'].includes(r.status)).length || 0, badge: 'ACTIVE', badgeColor: 'text-primary bg-primary/10' },
    { icon: 'request_quote', label: 'Quotes Received', value: data?.filter((r) => r.status === 'QUOTATION_SENT').length || 0 },
    { icon: 'verified', label: 'Total RFQs', value: data?.length || 0 },
  ]

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen">
      <header className="flex items-center justify-between px-6 py-4 w-full sticky top-0 bg-surface-container-low/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-3xl">medication</span>
          <h1 className="font-headline font-extrabold text-primary uppercase tracking-wider">PharmaDirect Wholesale</h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-slate-100 transition-colors">
            <span className="material-symbols-outlined text-slate-500">language</span>
          </button>
          <button onClick={clearAuth} className="text-sm text-outline hover:text-error transition-colors">Sign out</button>
        </div>
      </header>

      <div className="flex min-h-screen">
        <aside className="hidden md:flex flex-col h-screen w-72 fixed left-0 top-0 py-8 bg-surface-container-low z-40 border-r border-outline-variant/10 pt-24">
          <div className="px-6 mb-8 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-lg">
              {user?.fullName?.[0] || 'C'}
            </div>
            <div>
              <p className="font-headline font-bold text-primary text-sm">{user?.fullName}</p>
              <p className="text-xs text-slate-500">Verified Institution</p>
            </div>
          </div>
          <nav className="flex-1 space-y-1">
            {[
              { to: '/portal', icon: 'dashboard', label: 'Dashboard', active: true },
              { to: '/portal', icon: 'history_edu', label: 'RFQ History' },
              { to: '/products', icon: 'inventory_2', label: 'Product Catalog' },
              { to: '/compare', icon: 'analytics', label: 'Analytics' },
            ].map((item) => (
              <Link key={item.label} to={item.to} className={`flex items-center gap-4 px-6 py-3 text-sm font-medium transition-all ${item.active ? 'bg-white text-primary rounded-r-full shadow-sm' : 'text-slate-600 hover:text-primary'}`}>
                <span className="material-symbols-outlined">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 md:ml-72 p-6 md:p-10 pb-24 md:pb-10">
          <section className="mb-10">
            <h2 className="font-headline font-extrabold text-3xl md:text-4xl text-on-surface tracking-tight mb-2">
              Welcome back, {user?.companyName || user?.fullName}
            </h2>
            <p className="text-on-surface-variant opacity-80">Managing your institutional pharmaceutical procurement with clinical precision.</p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {stats.map((s) => (
              <div key={s.label} className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10">
                <div className="flex justify-between items-start mb-4">
                  <span className="p-3 bg-primary/5 rounded-lg text-primary"><span className="material-symbols-outlined">{s.icon}</span></span>
                  {s.badge && <span className={`text-xs font-bold px-2 py-1 rounded-full ${s.badgeColor}`}>{s.badge}</span>}
                </div>
                <p className="text-3xl font-headline font-bold text-on-surface">{s.value}</p>
                <p className="text-sm text-on-surface-variant font-medium">{s.label}</p>
              </div>
            ))}
          </div>

          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline font-bold text-xl text-on-surface">RFQ History</h3>
              <Link to="/rfq" className="text-primary text-sm font-semibold hover:underline">+ New RFQ</Link>
            </div>

            {isLoading ? (
              <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-surface-container rounded-xl animate-pulse" />)}</div>
            ) : data?.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-xl p-16 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-5xl mb-4 block opacity-30">description</span>
                <p className="font-medium">No RFQs yet.</p>
                <Link to="/rfq" className="text-primary font-bold text-sm mt-2 inline-block hover:underline">Submit your first RFQ</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {data.map((rfq) => (
                  <div key={rfq.id} className="bg-surface-container-lowest rounded-xl p-5 md:p-6 transition-all hover:shadow-md border border-outline-variant/5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-surface-container-low rounded-lg flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary">medication_liquid</span>
                        </div>
                        <div>
                          <h4 className="font-headline font-bold text-on-surface">{rfq.rfqNumber}</h4>
                          <p className="text-sm text-on-surface-variant">ID: #{rfq.rfqNumber} • {new Date(rfq.submittedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${STATUS_BADGE[rfq.status]}`}>
                          <span className={`w-2 h-2 rounded-full ${STATUS_DOT[rfq.status]}`}></span>
                          {STATUS_LABEL[rfq.status]}
                        </div>
                        {rfq.status === 'QUOTATION_SENT' ? (
                          <button
                            onClick={async () => {
                              try {
                                const response = await api.get(`/customer/rfqs/${rfq.id}/pdf`, { responseType: 'blob' })
                                const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
                                const a = document.createElement('a'); a.href = url; a.download = `${rfq.rfqNumber}.pdf`; a.click()
                                window.URL.revokeObjectURL(url)
                              } catch (e) { console.error(e) }
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-label text-sm font-semibold hover:bg-primary-container transition-colors shadow-sm"
                          >
                            <span className="material-symbols-outlined text-lg">download</span>
                            Download PDF
                          </button>
                        ) : (
                          <Link
                            to={`/portal/rfqs/${rfq.id}`}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant font-label text-sm font-semibold hover:bg-surface-container-low transition-colors"
                          >
                            <span className="material-symbols-outlined text-lg">visibility</span>
                            Details
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-outline-variant/10 grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Products</p>
                        <p className="text-sm font-semibold">{rfq.itemCount} items</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Status</p>
                        <p className="text-sm font-semibold capitalize">{rfq.status?.replace('_', ' ')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 md:hidden bg-white/90 backdrop-blur-xl border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <Link to="/portal" className="flex flex-col items-center text-primary scale-110">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          <span className="font-inter text-[11px] font-semibold">Home</span>
        </Link>
        <Link to="/portal" className="flex flex-col items-center text-slate-400">
          <span className="material-symbols-outlined">request_quote</span>
          <span className="font-inter text-[11px] font-semibold">RFQs</span>
        </Link>
        <Link to="/compare" className="flex flex-col items-center text-slate-400">
          <span className="material-symbols-outlined">compare_arrows</span>
          <span className="font-inter text-[11px] font-semibold">Compare</span>
        </Link>
        <Link to="/rfq" className="flex flex-col items-center text-slate-400">
          <span className="material-symbols-outlined">chat_bubble</span>
          <span className="font-inter text-[11px] font-semibold">Chat</span>
        </Link>
      </nav>

      {/* FAB */}
      <Link to="/rfq" className="fixed bottom-28 right-6 md:bottom-10 md:right-10 w-16 h-16 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform active:scale-95 z-40">
        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>add_box</span>
      </Link>
    </div>
  )
}
