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

const BORDER_COLOR = {
  NEW:            'border-l-blue-500',
  UNDER_REVIEW:   'border-l-yellow-500',
  QUOTATION_SENT: 'border-l-green-500',
  CLOSED:         'border-l-slate-300',
}

export default function AdminDashboard() {
  const { data: rfqData } = useQuery({
    queryKey: ['admin-rfqs-dash'],
    queryFn: () => api.get('/admin/rfqs', { params: { page: 1, limit: 50 } }).then((r) => r.data),
  })

  const { data: productData } = useQuery({
    queryKey: ['admin-products-count'],
    queryFn: () => api.get('/admin/products').then((r) => r.data),
  })

  const items = rfqData?.items || []
  const total = rfqData?.totalCount || 0
  const newCount = items.filter((r) => r.status === 'NEW').length
  const pendingCount = items.filter((r) => r.status === 'UNDER_REVIEW').length
  const sentCount = items.filter((r) => r.status === 'QUOTATION_SENT').length
  const closedCount = items.filter((r) => r.status === 'CLOSED').length
  const productCount = productData?.length || 0

  const stats = [
    { icon: 'description',    label: 'Total RFQs',        value: total,        color: 'bg-blue-50 text-blue-600',   bar: 'bg-primary',    barW: '100%' },
    { icon: 'fiber_new',      label: 'New',               value: newCount,     color: 'bg-blue-50 text-blue-600',   bar: 'bg-blue-500',   barW: `${total ? (newCount/total)*100 : 0}%` },
    { icon: 'pending_actions',label: 'Under Review',      value: pendingCount, color: 'bg-amber-50 text-amber-600', bar: 'bg-amber-500',  barW: `${total ? (pendingCount/total)*100 : 0}%` },
    { icon: 'mark_email_read',label: 'Quotations Sent',   value: sentCount,    color: 'bg-green-50 text-green-600', bar: 'bg-green-500',  barW: `${total ? (sentCount/total)*100 : 0}%` },
    { icon: 'task_alt',       label: 'Closed',            value: closedCount,  color: 'bg-slate-50 text-slate-500', bar: 'bg-slate-400',  barW: `${total ? (closedCount/total)*100 : 0}%` },
    { icon: 'inventory_2',    label: 'Products',          value: productCount, color: 'bg-purple-50 text-purple-600', bar: 'bg-purple-500', barW: '60%' },
  ]

  const recent = items.slice(0, 5)

  return (
    <AdminLayout title="Dashboard" subtitle="Overview of RFQ activity and platform status.">

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="bg-surface-container-lowest p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
              <span className="material-symbols-outlined text-lg">{s.icon}</span>
            </div>
            <p className="text-2xl font-headline font-extrabold text-on-surface">{s.value}</p>
            <p className="text-xs text-on-surface-variant mt-0.5">{s.label}</p>
            <div className="mt-3 h-1 w-full bg-surface-container-high rounded-full overflow-hidden">
              <div className={`h-full ${s.bar} rounded-full transition-all`} style={{ width: s.barW }} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Recent RFQs table */}
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-surface-container flex items-center justify-between">
            <h2 className="font-headline font-bold text-xl text-on-surface">Recent RFQs</h2>
            <Link to="/admin/rfqs" className="text-primary text-sm font-bold hover:underline">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] font-bold text-outline uppercase tracking-wider border-b border-surface-container">
                  <th className="text-left py-3 px-6">RFQ #</th>
                  <th className="text-left py-3 px-4">Customer</th>
                  <th className="text-left py-3 px-4">Company</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Items</th>
                  <th className="text-left py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {recent.length > 0 ? recent.map((rfq) => (
                  <tr key={rfq.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-4 px-6">
                      <Link to={`/admin/rfqs/${rfq.id}`} className="font-mono text-primary font-bold hover:underline text-xs">
                        {rfq.rfqNumber}
                      </Link>
                    </td>
                    <td className="py-4 px-4 font-medium text-on-surface">{rfq.customerName}</td>
                    <td className="py-4 px-4 text-on-surface-variant">{rfq.companyName}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${STATUS_BADGE[rfq.status]}`}>
                        {rfq.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-on-surface-variant">{rfq.itemCount}</td>
                    <td className="py-4 px-4 text-on-surface-variant text-xs">
                      {new Date(rfq.submittedAt).toLocaleDateString()}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-on-surface-variant">
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
        <div className="lg:col-span-4 space-y-6">

          {/* Status breakdown */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
            <h3 className="font-headline font-bold text-lg text-on-surface mb-5">Status Breakdown</h3>
            <div className="space-y-4">
              {[
                { label: 'New',            count: newCount,     color: 'bg-blue-500',   pct: total ? (newCount/total)*100 : 0 },
                { label: 'Under Review',   count: pendingCount, color: 'bg-amber-500',  pct: total ? (pendingCount/total)*100 : 0 },
                { label: 'Quotation Sent', count: sentCount,    color: 'bg-green-500',  pct: total ? (sentCount/total)*100 : 0 },
                { label: 'Closed',         count: closedCount,  color: 'bg-slate-400',  pct: total ? (closedCount/total)*100 : 0 },
              ].map((s) => (
                <div key={s.label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-on-surface">{s.label}</span>
                    <span className="font-bold text-on-surface">{s.count}</span>
                  </div>
                  <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                    <div className={`h-full ${s.color} rounded-full transition-all duration-500`} style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
            <h3 className="font-headline font-bold text-lg text-on-surface mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { to: '/admin/rfqs?status=NEW',    icon: 'fiber_new',      label: 'Review New RFQs',    badge: newCount,     badgeColor: 'bg-blue-500' },
                { to: '/admin/rfqs',               icon: 'request_quote',  label: 'All RFQs',           badge: total,        badgeColor: 'bg-primary' },
                { to: '/admin/products',           icon: 'inventory_2',    label: 'Manage Products',    badge: productCount, badgeColor: 'bg-purple-500' },
                { to: '/admin/products/new',       icon: 'add_circle',     label: 'Add New Product',    badge: null },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-lg">{item.icon}</span>
                    <span className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors">{item.label}</span>
                  </div>
                  {item.badge !== null && (
                    <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Info card */}
          <div className="bg-primary rounded-2xl p-6 text-white">
            <span className="material-symbols-outlined text-white/50 mb-3 block">tips_and_updates</span>
            <h4 className="font-headline font-bold text-lg mb-2">Admin Tips</h4>
            <ul className="text-white/80 text-sm space-y-2">
              <li className="flex items-start gap-2"><span className="material-symbols-outlined text-sm mt-0.5">arrow_right</span>Review new RFQs within 4 hours</li>
              <li className="flex items-start gap-2"><span className="material-symbols-outlined text-sm mt-0.5">arrow_right</span>Export PDF before sending quotation</li>
              <li className="flex items-start gap-2"><span className="material-symbols-outlined text-sm mt-0.5">arrow_right</span>Add internal notes for team context</li>
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
