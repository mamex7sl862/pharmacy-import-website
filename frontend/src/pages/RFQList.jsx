import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import AdminLayout from '../components/AdminLayout'

const STATUS_BADGE = {
  NEW:            'bg-blue-50 text-blue-700',
  UNDER_REVIEW:   'bg-yellow-50 text-yellow-700',
  QUOTATION_SENT: 'bg-green-50 text-green-700',
  CLOSED:         'bg-slate-100 text-slate-500',
}

export default function RFQList() {
  const [filters, setFilters] = useState({ rfqNumber: '', customerName: '', status: '', dateFrom: '', dateTo: '', page: 1 })
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-rfqs', filters],
    queryFn: () => api.get('/admin/rfqs', { params: { ...filters, limit: 20 } }).then((r) => r.data),
    keepPreviousData: true,
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/admin/rfqs/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries(['admin-rfqs']),
  })

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value, page: 1 }))

  const STATUS_CHIPS = [
    { label: 'All', value: '' },
    { label: 'New', value: 'NEW' },
    { label: 'Under Review', value: 'UNDER_REVIEW' },
    { label: 'Quotation Sent', value: 'QUOTATION_SENT' },
    { label: 'Closed', value: 'CLOSED' },
  ]

  return (
    <AdminLayout title="RFQ Management" subtitle="Review, respond to, and manage all quotation requests.">

      {/* Filters */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
            <input
              type="text"
              placeholder="RFQ number..."
              value={filters.rfqNumber}
              onChange={set('rfqNumber')}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-container-high border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">person</span>
            <input
              type="text"
              placeholder="Customer name..."
              value={filters.customerName}
              onChange={set('customerName')}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-container-high border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={set('dateFrom')}
            className="w-full px-4 py-2.5 bg-surface-container-high border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="From date"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={set('dateTo')}
            className="w-full px-4 py-2.5 bg-surface-container-high border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="To date"
          />
        </div>

        {/* Status chips */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_CHIPS.map((chip) => (
            <button
              key={chip.value}
              onClick={() => setFilters((f) => ({ ...f, status: chip.value, page: 1 }))}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                filters.status === chip.value
                  ? 'bg-primary text-white'
                  : 'bg-surface-container text-on-surface-variant hover:bg-secondary-container hover:text-primary'
              }`}
            >
              {chip.label}
              {chip.value && data?.items && (
                <span className="ml-1.5 opacity-70">
                  ({data.items.filter((r) => r.status === chip.value).length})
                </span>
              )}
            </button>
          ))}
          {(filters.rfqNumber || filters.customerName || filters.status || filters.dateFrom || filters.dateTo) && (
            <button
              onClick={() => setFilters({ rfqNumber: '', customerName: '', status: '', dateFrom: '', dateTo: '', page: 1 })}
              className="px-4 py-1.5 rounded-full text-xs font-bold text-error hover:bg-error-container/20 transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">close</span>
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-on-surface-variant">
          {isLoading ? 'Loading...' : `${data?.totalCount || 0} RFQs found`}
        </p>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] font-bold text-outline uppercase tracking-wider border-b border-surface-container bg-surface-container-low">
                <th className="text-left py-4 px-6">RFQ #</th>
                <th className="text-left py-4 px-4">Customer</th>
                <th className="text-left py-4 px-4">Company</th>
                <th className="text-left py-4 px-4">Status</th>
                <th className="text-left py-4 px-4">Items</th>
                <th className="text-left py-4 px-4">Submitted</th>
                <th className="py-4 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="py-4 px-4">
                          <div className="h-4 bg-surface-container rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : data?.items?.length === 0
                ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-5xl mb-3 block opacity-30">search_off</span>
                      <p className="font-medium">No RFQs match your filters</p>
                    </td>
                  </tr>
                )
                : data?.items?.map((rfq) => (
                    <tr key={rfq.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-4 px-6">
                        <Link to={`/admin/rfqs/${rfq.id}`} className="font-mono text-primary font-bold hover:underline text-xs">
                          {rfq.rfqNumber}
                        </Link>
                      </td>
                      <td className="py-4 px-4 font-medium text-on-surface">{rfq.customerName}</td>
                      <td className="py-4 px-4 text-on-surface-variant">{rfq.companyName}</td>
                      <td className="py-4 px-4">
                        <select
                          value={rfq.status}
                          onChange={(e) => updateStatus.mutate({ id: rfq.id, status: e.target.value })}
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border-none outline-none cursor-pointer ${STATUS_BADGE[rfq.status]}`}
                        >
                          <option value="NEW">New</option>
                          <option value="UNDER_REVIEW">Under Review</option>
                          <option value="QUOTATION_SENT">Quotation Sent</option>
                          <option value="CLOSED">Closed</option>
                        </select>
                      </td>
                      <td className="py-4 px-4 text-on-surface-variant">{rfq.itemCount}</td>
                      <td className="py-4 px-4 text-on-surface-variant text-xs">
                        {new Date(rfq.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Link
                          to={`/admin/rfqs/${rfq.id}`}
                          className="inline-flex items-center gap-1 text-primary hover:underline text-xs font-bold"
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.totalCount > 20 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-surface-container">
            <p className="text-xs text-on-surface-variant">
              Page {filters.page} · {data.totalCount} total
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                disabled={filters.page === 1}
                className="px-4 py-2 rounded-lg border border-outline-variant text-sm disabled:opacity-40 hover:bg-surface-container transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                disabled={!data?.items || data.items.length < 20}
                className="px-4 py-2 rounded-lg border border-outline-variant text-sm disabled:opacity-40 hover:bg-surface-container transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
