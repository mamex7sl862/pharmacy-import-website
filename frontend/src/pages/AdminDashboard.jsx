import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import AdminLayout from '../components/AdminLayout'

const STATUS_BADGE = {
  NEW:            'bg-blue-50 text-blue-700',
  UNDER_REVIEW:   'bg-yellow-50 text-yellow-700',
  QUOTATION_SENT: 'bg-green-50 text-green-700',
  CLOSED:         'bg-slate-100 text-slate-500',
}

// ── Donut Chart (pure SVG) ────────────────────────────────────────────────────
function DonutChart({ segments, size = 140 }) {
  const r = 50
  const cx = 60
  const cy = 60
  const circumference = 2 * Math.PI * r
  const total = segments.reduce((s, seg) => s + seg.value, 0)

  let cumulativeOffset = 0
  const paths = segments.map((seg) => {
    const pct = total ? seg.value / total : 0
    const dash = pct * circumference
    const gap = circumference - dash
    const currentOffset = cumulativeOffset
    cumulativeOffset += dash
    return (
      <circle
        key={seg.label}
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={seg.color}
        strokeWidth="18"
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={-currentOffset}
        strokeLinecap="butt"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
    )
  })

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f5" strokeWidth="18" />
      {paths}
    </svg>
  )
}

// ── Bar Chart ─────────────────────────────────────────────────────────────────
function BarChart({ data, height = 160 }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group min-w-0">
          {/* Value tooltip on hover */}
          <span className="text-[10px] font-bold text-on-surface opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {d.value}
          </span>
          <div
            className={`w-full rounded-t-md transition-all duration-500 ${d.color}`}
            style={{ height: `${(d.value / max) * (height - 32)}px`, minHeight: d.value > 0 ? '4px' : '0' }}
          />
          {/* Label — truncated, full text on title hover */}
          <span
            title={d.label}
            className="text-[9px] font-semibold text-outline uppercase tracking-wide text-center leading-tight w-full truncate px-0.5"
          >
            {d.label}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, trend, trendLabel }) {
  return (
    <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <span className="material-symbols-outlined text-lg">{icon}</span>
        </div>
        {trend !== undefined && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-3xl font-headline font-extrabold text-on-surface">{value}</p>
      <p className="text-xs text-on-surface-variant mt-0.5">{label}</p>
      {trendLabel && <p className="text-[10px] text-outline mt-1">{trendLabel}</p>}
    </div>
  )
}

export default function AdminDashboard() {
  const { data: rfqData } = useQuery({
    queryKey: ['admin-rfqs-dash'],
    queryFn: () => api.get('/admin/rfqs', { params: { page: 1, limit: 100 } }).then((r) => r.data),
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  })

  const { data: productData } = useQuery({
    queryKey: ['admin-products-count'],
    queryFn: () => api.get('/admin/products').then((r) => r.data),
  })

  const { data: testimonialData } = useQuery({
    queryKey: ['admin-testimonials'],
    queryFn: () => api.get('/admin/testimonials').then((r) => r.data),
  })

  // Pending payment proofs — polled every 30s so the dashboard stays fresh
  const { data: pendingPaymentsData } = useQuery({
    queryKey: ['admin-pending-payments-dash'],
    queryFn: () => api.get('/admin/rfqs', { params: { status: 'PAYMENT_SUBMITTED', limit: 5 } }).then((r) => r.data),
    refetchInterval: 30000,
  })

  const items = rfqData?.items || []
  const total = rfqData?.totalCount || 0
  const newCount    = items.filter((r) => r.status === 'NEW').length
  const reviewCount = items.filter((r) => r.status === 'UNDER_REVIEW').length
  const sentCount   = items.filter((r) => r.status === 'QUOTATION_SENT').length
  const closedCount = items.filter((r) => r.status === 'CLOSED').length
  const productCount = productData?.length || 0
  const activeProducts = productData?.filter((p) => p.isActive).length || 0
  const testimonialCount = testimonialData?.length || 0

  const pendingPayments = pendingPaymentsData?.items || []
  const pendingPaymentCount = pendingPaymentsData?.totalCount || 0

  // Group RFQs by day for the last 7 days
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return {
      label: d.toLocaleDateString('en', { weekday: 'short' }),
      date: d.toDateString(),
      value: 0,
      color: i === 6 ? 'bg-primary' : 'bg-primary/30 hover:bg-primary/50',
    }
  })
  items.forEach((rfq) => {
    const d = new Date(rfq.submittedAt).toDateString()
    const slot = last7.find((s) => s.date === d)
    if (slot) slot.value++
  })

  // Category breakdown of products
  const catCounts = {}
  ;(productData || []).forEach((p) => { catCounts[p.category] = (catCounts[p.category] || 0) + 1 })
  const catData = Object.entries(catCounts).map(([cat, count]) => ({
    label: cat.replace('-', ' ').replace('personal care', 'wellness'),
    value: count,
    color: { prescription: 'bg-blue-400', otc: 'bg-green-400', 'medical-supplies': 'bg-purple-400', surgical: 'bg-red-400', laboratory: 'bg-amber-400', 'personal-care': 'bg-teal-400' }[cat] || 'bg-slate-400',
  }))

  const donutSegments = [
    { label: 'New',            value: newCount,    color: '#3b82f6' },
    { label: 'Under Review',   value: reviewCount, color: '#f59e0b' },
    { label: 'Quotation Sent', value: sentCount,   color: '#22c55e' },
    { label: 'Closed',         value: closedCount, color: '#94a3b8' },
  ].filter((s) => s.value > 0)

  const recent = items.slice(0, 6)

  return (
    <AdminLayout title="Dashboard" subtitle="Real-time overview of RFQ activity, products, and platform health.">

      {/* ── Needs Attention Banner ─────────────────────────────────────────── */}
      {pendingPaymentCount > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 overflow-hidden shadow-sm">
          {/* Header row */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-amber-500">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
              </span>
              <p className="font-bold text-white text-sm">
                {pendingPaymentCount === 1
                  ? '1 payment proof is waiting for your approval'
                  : `${pendingPaymentCount} payment proofs are waiting for your approval`}
              </p>
            </div>
            <Link
              to="/admin/rfqs?status=PAYMENT_SUBMITTED"
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 bg-white text-amber-700 rounded-lg text-xs font-bold hover:bg-amber-50 transition-colors shadow-sm"
            >
              Review All
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          {/* Payment rows */}
          <div className="divide-y divide-amber-100">
            {pendingPayments.slice(0, 3).map((rfq) => (
              <Link
                key={rfq.id}
                to={`/admin/rfqs/${rfq.id}`}
                className="flex items-center gap-4 px-5 py-3 hover:bg-amber-100/60 transition-colors group"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 font-bold text-sm flex-shrink-0">
                  {(rfq.customerName || rfq.guestName || '?').charAt(0).toUpperCase()}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-900 truncate">
                    {rfq.customerName || rfq.guestName || 'Customer'}
                    <span className="ml-2 font-mono text-xs text-amber-600">{rfq.rfqNumber}</span>
                  </p>
                  <p className="text-xs text-amber-600">{rfq.itemCount} items · submitted {new Date(rfq.submittedAt).toLocaleDateString()}</p>
                </div>
                {/* CTA */}
                <span className="flex-shrink-0 flex items-center gap-1 text-xs font-bold text-amber-700 group-hover:text-amber-900 transition-colors">
                  <span className="material-symbols-outlined text-sm">payments</span>
                  Review Proof
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </span>
              </Link>
            ))}
            {pendingPaymentCount > 3 && (
              <div className="px-5 py-2.5 text-center">
                <Link to="/admin/rfqs?status=PAYMENT_SUBMITTED" className="text-xs font-bold text-amber-700 hover:underline">
                  + {pendingPaymentCount - 3} more pending — view all
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── KPI Stats ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-4 mb-8">
        <StatCard icon="description"    label="Total RFQs"       value={total}               color="bg-blue-50 text-blue-600"     />
        <StatCard icon="fiber_new"      label="New"              value={newCount}            color="bg-blue-50 text-blue-600"     />
        <StatCard icon="pending_actions"label="Under Review"     value={reviewCount}         color="bg-amber-50 text-amber-600"   />
        <StatCard icon="mark_email_read"label="Quotation Sent"   value={sentCount}           color="bg-green-50 text-green-600"   />
        <StatCard icon="task_alt"       label="Closed"           value={closedCount}         color="bg-slate-50 text-slate-500"   />
        <div className={`bg-surface-container-lowest p-5 rounded-xl shadow-sm hover:shadow-md transition-all ${pendingPaymentCount > 0 ? 'ring-2 ring-amber-400' : ''}`}>
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600 relative">
              <span className="material-symbols-outlined text-lg">payments</span>
              {pendingPaymentCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-[9px] font-black text-white">{pendingPaymentCount}</span>
                </span>
              )}
            </div>
            {pendingPaymentCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 animate-pulse">
                Action
              </span>
            )}
          </div>
          <p className="text-3xl font-headline font-extrabold text-on-surface">{pendingPaymentCount}</p>
          <p className="text-xs text-on-surface-variant mt-0.5">Awaiting Payment Review</p>
          {pendingPaymentCount > 0 && (
            <Link to="/admin/rfqs?status=PAYMENT_SUBMITTED" className="mt-2 text-[10px] font-bold text-amber-600 hover:underline flex items-center gap-0.5">
              Review now <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </Link>
          )}
        </div>
        <StatCard icon="inventory_2"    label="Products"         value={activeProducts}      color="bg-purple-50 text-purple-600" />
        <StatCard icon="format_quote"   label="Testimonials"     value={testimonialCount}    color="bg-teal-50 text-teal-600"     />
      </div>

      {/* ── Charts row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">

        {/* Bar chart — RFQ volume last 7 days */}
        <div className="lg:col-span-5 bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-headline font-bold text-lg text-on-surface">RFQ Volume</h2>
              <p className="text-xs text-on-surface-variant">Last 7 days</p>
            </div>
            <span className="text-2xl font-headline font-extrabold text-primary">{total}</span>
          </div>
          <BarChart data={last7} height={160} />
        </div>

        {/* Donut chart — status distribution */}
        <div className="lg:col-span-4 bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
          <h2 className="font-headline font-bold text-lg text-on-surface mb-5">Status Distribution</h2>
          {total > 0 ? (
            <div className="flex flex-col items-center gap-5">
              {/* Donut centred */}
              <div className="relative flex-shrink-0">
                <DonutChart segments={donutSegments} size={130} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-headline font-extrabold text-on-surface leading-none">{total}</p>
                    <p className="text-[9px] text-outline uppercase tracking-wider mt-0.5">Total</p>
                  </div>
                </div>
              </div>
              {/* Legend — 2-column grid so labels never overflow */}
              <div className="w-full grid grid-cols-2 gap-x-4 gap-y-2.5">
                {[
                  { label: 'New',            value: newCount,    color: 'bg-blue-500',  pct: total ? Math.round(newCount/total*100) : 0 },
                  { label: 'Under Review',   value: reviewCount, color: 'bg-amber-500', pct: total ? Math.round(reviewCount/total*100) : 0 },
                  { label: 'Sent',           value: sentCount,   color: 'bg-green-500', pct: total ? Math.round(sentCount/total*100) : 0 },
                  { label: 'Closed',         value: closedCount, color: 'bg-slate-400', pct: total ? Math.round(closedCount/total*100) : 0 },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-2 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.color}`} />
                    <span className="text-xs text-on-surface-variant truncate flex-1">{s.label}</span>
                    <span className="text-xs font-bold text-on-surface flex-shrink-0">{s.value}</span>
                    <span className="text-[10px] text-outline flex-shrink-0">({s.pct}%)</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-on-surface-variant gap-2">
              <span className="material-symbols-outlined text-4xl opacity-20">donut_large</span>
              <p className="text-sm">No RFQs yet</p>
            </div>
          )}
        </div>

        {/* Bar chart — products by category */}
        <div className="lg:col-span-3 bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="font-headline font-bold text-lg text-on-surface">By Category</h2>
            <p className="text-xs text-on-surface-variant">{activeProducts} active products</p>
          </div>
          {catData.length > 0
            ? <BarChart data={catData} height={160} />
            : <div className="flex items-center justify-center h-32 text-on-surface-variant text-sm">No products yet</div>
          }
        </div>
      </div>

      {/* ── Bottom row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Recent RFQs */}
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-surface-container flex items-center justify-between">
            <h2 className="font-headline font-bold text-xl text-on-surface">Recent RFQs</h2>
            <Link to="/admin/rfqs" className="text-primary text-sm font-bold hover:underline flex items-center gap-1">
              View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] font-bold text-outline uppercase tracking-wider border-b border-surface-container bg-surface-container-low/50">
                  <th className="text-left py-3 px-6">RFQ #</th>
                  <th className="text-left py-3 px-4">Customer</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Items</th>
                  <th className="text-left py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {recent.length > 0 ? recent.map((rfq) => (
                  <tr key={rfq.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3.5 px-6">
                      <Link to={`/admin/rfqs/${rfq.id}`} className="font-mono text-primary font-bold hover:underline text-xs">
                        {rfq.rfqNumber}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-on-surface text-xs">{rfq.customerName}</p>
                      <p className="text-[10px] text-on-surface-variant">{rfq.companyName}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_BADGE[rfq.status]}`}>
                        {rfq.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-on-surface-variant text-xs">{rfq.itemCount} items</td>
                    <td className="py-3.5 px-4 text-on-surface-variant text-xs">
                      {new Date(rfq.submittedAt).toLocaleDateString()}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-4xl mb-2 block opacity-30">description</span>
                      No RFQs yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right panel */}
        <div className="lg:col-span-4 space-y-5">

          {/* Conversion funnel */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
            <h3 className="font-headline font-bold text-base text-on-surface mb-4">Conversion Funnel</h3>
            <div className="space-y-3">
              {[
                { label: 'Submitted',       value: total,      color: 'bg-blue-500',  icon: 'inbox' },
                { label: 'Under Review',    value: reviewCount + sentCount + closedCount, color: 'bg-amber-500', icon: 'manage_search' },
                { label: 'Quoted',          value: sentCount + closedCount, color: 'bg-green-500', icon: 'request_quote' },
                { label: 'Closed',          value: closedCount, color: 'bg-slate-400', icon: 'task_alt' },
              ].map((s, i, arr) => {
                const pct = arr[0].value ? Math.round((s.value / arr[0].value) * 100) : 0
                const width = `${100 - i * 15}%`
                return (
                  <div key={s.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="flex items-center gap-1.5 text-on-surface-variant">
                        <span className="material-symbols-outlined text-sm">{s.icon}</span>
                        {s.label}
                      </span>
                      <span className="font-bold text-on-surface">{s.value} <span className="text-outline font-normal">({pct}%)</span></span>
                    </div>
                    <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                      <div className={`h-full ${s.color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm">
            <h3 className="font-headline font-bold text-base text-on-surface mb-3">Quick Actions</h3>
            <div className="space-y-1">
              {[
                { to: '/admin/rfqs',                          icon: 'request_quote', label: 'All RFQs',              badge: total,               badgeColor: 'bg-primary' },
                { to: '/admin/rfqs?status=PAYMENT_SUBMITTED', icon: 'payments',      label: 'Pending Payments',      badge: pendingPaymentCount, badgeColor: pendingPaymentCount > 0 ? 'bg-red-500' : 'bg-gray-400', urgent: pendingPaymentCount > 0 },
                { to: '/admin/products',                      icon: 'inventory_2',   label: 'Products',              badge: activeProducts,      badgeColor: 'bg-purple-500' },
                { to: '/admin/content',                       icon: 'edit_note',     label: 'Content',               badge: testimonialCount,    badgeColor: 'bg-teal-500' },
              ].map((item) => (
                <Link key={item.to} to={item.to}
                  className={`flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-container-low transition-colors group ${item.urgent ? 'bg-amber-50 hover:bg-amber-100' : ''}`}>
                  <div className="flex items-center gap-2.5">
                    <span className={`material-symbols-outlined text-base ${item.urgent ? 'text-amber-600' : 'text-primary'}`}>{item.icon}</span>
                    <span className={`text-sm font-medium transition-colors ${item.urgent ? 'text-amber-800 font-bold' : 'text-on-surface group-hover:text-primary'}`}>{item.label}</span>
                    {item.urgent && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${item.badgeColor}`}>{item.badge}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Platform health */}
          <div className="bg-primary rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-white/70">monitor_heart</span>
              <h3 className="font-headline font-bold text-base">Platform Health</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Database',  status: 'Online',   ok: true },
                { label: 'API',       status: 'Running',  ok: true },
                { label: 'Email',     status: 'Dev Mode', ok: true },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-xs text-white/70">{s.label}</span>
                  <span className="flex items-center gap-1 text-xs font-bold text-green-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
