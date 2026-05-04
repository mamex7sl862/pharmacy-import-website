import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import AdminLayout from '../components/AdminLayout'

const STATUS_BADGE = {
  NEW:               'bg-blue-50 text-blue-700',
  UNDER_REVIEW:      'bg-yellow-50 text-yellow-700',
  QUOTATION_SENT:    'bg-green-50 text-green-700',
  CLOSED:            'bg-emerald-50 text-emerald-700',
  DECLINED:          'bg-red-50 text-red-700',
  AWAITING_PAYMENT:  'bg-amber-50 text-amber-700',
  PAYMENT_SUBMITTED: 'bg-blue-50 text-blue-700',
  PAYMENT_CONFIRMED: 'bg-teal-50 text-teal-700',
  SHIPPED:           'bg-indigo-50 text-indigo-700',
  DELIVERED:         'bg-emerald-50 text-emerald-700',
}

const STATUS_LABEL = {
  NEW:               'New',
  UNDER_REVIEW:      'Under Review',
  QUOTATION_SENT:    'Quotation Sent',
  CLOSED:            'Closed',
  DECLINED:          'Declined',
  AWAITING_PAYMENT:  'Awaiting Payment',
  PAYMENT_SUBMITTED: 'Payment Review',
  PAYMENT_CONFIRMED: 'Payment Confirmed',
  SHIPPED:           'Shipped',
  DELIVERED:         'Delivered',
}

export default function RFQList() {
  const [filters, setFilters] = useState({ rfqNumber: '', customerName: '', status: '', dateFrom: '', dateTo: '', page: 1 })
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)
  const qc = useQueryClient()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-rfqs', filters],
    queryFn: () => api.get('/admin/rfqs', { params: { ...filters, limit: 20 } }).then((r) => r.data),
    keepPreviousData: true,
    refetchInterval: 20000,           // auto-refresh every 20s — new RFQs appear without reload
    refetchIntervalInBackground: true,
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/admin/rfqs/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-rfqs'] })
      qc.invalidateQueries({ queryKey: ['admin-rfqs-dash'] })
    },
  })

  const deleteRFQ = useMutation({
    mutationFn: (id) => api.delete(`/admin/rfqs/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-rfqs'] })
      qc.invalidateQueries({ queryKey: ['admin-rfqs-dash'] })
      setDeleteConfirm(null)
      setSelectedIds(s => s.filter(id => id !== deleteConfirm?.id))
    },
  })

  const bulkDeleteRFQ = useMutation({
    mutationFn: (ids) => api.post('/admin/rfqs/bulk-delete', { ids }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-rfqs'] })
      qc.invalidateQueries({ queryKey: ['admin-rfqs-dash'] })
      setBulkDeleteConfirm(false)
      setSelectedIds([])
    },
  })

  const toggleSelectAll = () => {
    if (selectedIds.length === data?.items?.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(data?.items?.map(r => r.id) || [])
    }
  }

  const toggleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value, page: 1 }))

  const STATUS_CHIPS = [
    { label: 'All',               value: '' },
    { label: 'New',               value: 'NEW' },
    { label: 'Under Review',      value: 'UNDER_REVIEW' },
    { label: 'Quotation Sent',    value: 'QUOTATION_SENT' },
    { label: 'Awaiting Payment',  value: 'AWAITING_PAYMENT' },
    { label: 'Payment Review',    value: 'PAYMENT_SUBMITTED' },
    { label: 'Confirmed',         value: 'PAYMENT_CONFIRMED' },
    { label: 'Shipped',           value: 'SHIPPED' },
    { label: 'Delivered',         value: 'DELIVERED' },
    { label: 'Closed',            value: 'CLOSED' },
    { label: 'Declined',          value: 'DECLINED' },
  ]

  return (
    <>
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

      {/* Results count & Bulk Actions */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-on-surface-variant">
          {isLoading ? 'Loading...' : `${data?.totalCount || 0} RFQs found`}
        </p>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4">
            <span className="text-sm font-bold text-primary">{selectedIds.length} selected</span>
            <button
               onClick={() => setBulkDeleteConfirm(true)}
               className="flex items-center gap-1.5 px-4 py-2 bg-error text-white rounded-xl text-xs font-bold shadow-sm hover:opacity-90 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-base">delete_sweep</span>
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* Table (Desktop) / Cards (Mobile) */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border border-surface-container">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] font-bold text-outline uppercase tracking-wider border-b border-surface-container bg-surface-container-low">
                <th className="py-4 px-6 text-center w-12">
                  <input 
                    type="checkbox" 
                    checked={data?.items?.length > 0 && selectedIds.length === data?.items?.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/20 accent-primary"
                  />
                </th>
                <th className="text-left py-4 px-2">RFQ #</th>
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
                : data?.items?.map((rfq) => (
                    <tr key={rfq.id} className={`hover:bg-surface-container-low transition-colors ${selectedIds.includes(rfq.id) ? 'bg-primary/5' : ''}`}>
                      <td className="py-4 px-6 text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(rfq.id)}
                          onChange={() => toggleSelectOne(rfq.id)}
                          className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/20 accent-primary"
                        />
                      </td>
                      <td className="py-4 px-2">
                        <Link to={`/admin/rfqs/${rfq.id}`} className="font-mono text-primary font-bold hover:underline text-xs">
                          {rfq.rfqNumber}
                        </Link>
                        {rfq.chatUnreadCount > 0 && (
                          <span className="ml-1.5 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {rfq.chatUnreadCount}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-medium text-on-surface">{rfq.customerName}</td>
                      <td className="py-4 px-4 text-on-surface-variant line-clamp-1">{rfq.companyName}</td>
                      <td className="py-4 px-4">
                        {['CLOSED', 'DECLINED', 'AWAITING_PAYMENT', 'PAYMENT_SUBMITTED',
                          'PAYMENT_CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(rfq.status) ? (
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${STATUS_BADGE[rfq.status] || 'bg-gray-100 text-gray-600'}`}>
                            {STATUS_LABEL[rfq.status] || rfq.status}
                          </span>
                        ) : (
                          <select
                            value={rfq.status}
                            onChange={(e) => {
                              if (e.target.value === 'QUOTATION_SENT') {
                                navigate(`/admin/rfqs/${rfq.id}`)
                                return
                              }
                              updateStatus.mutate({ id: rfq.id, status: e.target.value })
                            }}
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border-none outline-none cursor-pointer ${STATUS_BADGE[rfq.status]} ring-1 ring-inset ring-black/5 shadow-sm`}
                          >
                            <option value="NEW">New</option>
                            <option value="UNDER_REVIEW">Under Review</option>
                            <option value="QUOTATION_SENT">Quotation Sent →</option>
                            <option value="CLOSED">Closed</option>
                          </select>
                        )}
                      </td>
                      <td className="py-4 px-4 font-bold text-on-surface-variant">{rfq.itemCount}</td>
                      <td className="py-4 px-4 text-on-surface-variant text-xs">
                        {new Date(rfq.submittedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            to={`/admin/rfqs/${rfq.id}`}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
                            title="View Details"
                          >
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </Link>
                          <button
                            onClick={() => setDeleteConfirm(rfq)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-error hover:bg-error/10 transition-colors"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-surface-container">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 space-y-3">
                  <div className="h-4 bg-surface-container rounded w-1/3 animate-pulse" />
                  <div className="h-6 bg-surface-container rounded w-2/3 animate-pulse" />
                  <div className="h-4 bg-surface-container rounded w-full animate-pulse" />
                </div>
              ))
            : data?.items?.map((rfq) => (
                <div key={rfq.id} className={`p-4 flex flex-col gap-3 hover:bg-surface-container-low transition-colors ${selectedIds.includes(rfq.id) ? 'bg-primary/5' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                       <input 
                        type="checkbox" 
                        checked={selectedIds.includes(rfq.id)}
                        onChange={() => toggleSelectOne(rfq.id)}
                        className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/20 accent-primary mt-1"
                      />
                      <div>
                        <Link to={`/admin/rfqs/${rfq.id}`} className="font-mono text-primary font-bold hover:underline text-xs block mb-1">
                          {rfq.rfqNumber}
                        </Link>
                        {rfq.chatUnreadCount > 0 && (
                          <span className="inline-block mb-1 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {rfq.chatUnreadCount} new messages
                          </span>
                        )}
                        <h3 className="font-bold text-on-surface truncate">{rfq.customerName}</h3>
                        <p className="text-xs text-on-surface-variant font-medium mt-0.5">{rfq.companyName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${STATUS_BADGE[rfq.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABEL[rfq.status] || rfq.status}
                      </span>
                      <p className="text-[10px] text-outline font-bold mt-2">{new Date(rfq.submittedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-surface-container-high">
                    <span className="text-xs font-bold text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">inventory_2</span>
                      {rfq.itemCount} Items
                    </span>
                    <div className="flex gap-2">
                       <Link
                        to={`/admin/rfqs/${rfq.id}`}
                        className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                      >
                        <span className="material-symbols-outlined text-sm">edit_square</span>
                        Process
                      </Link>
                      <button
                        onClick={() => setDeleteConfirm(rfq)}
                        className="px-3 py-1.5 bg-error text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
        </div>

        {/* Empty State */}
        {!isLoading && data?.items?.length === 0 && (
          <div className="py-20 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-6xl mb-4 block opacity-20">inventory_2</span>
            <p className="text-lg font-bold">No RFQs found</p>
            <p className="text-sm opacity-60">Try adjusting your search or filters.</p>
          </div>
        )}

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

    {/* Delete confirmation dialog */}
    {deleteConfirm && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-error-container rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-error text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>delete_forever</span>
          </div>
          <h3 className="font-headline font-bold text-xl text-on-surface mb-2">Delete RFQ?</h3>
          <p className="text-sm text-on-surface-variant mb-2">
            This will permanently delete:
          </p>
          <p className="font-mono font-bold text-primary text-lg mb-2">{deleteConfirm.rfqNumber}</p>
          <p className="text-xs text-on-surface-variant mb-6">
            {deleteConfirm.companyName} · {deleteConfirm.customerName}
            <br />All products, attachments, and notes will be removed. This cannot be undone.
          </p>
          {deleteRFQ.isError && (
            <p className="text-xs text-error mb-4">Failed to delete. Please try again.</p>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="flex-1 py-2.5 rounded-xl border border-outline-variant text-on-surface font-bold hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteRFQ.mutate(deleteConfirm.id)}
              disabled={deleteRFQ.isPending}
              className="flex-1 py-2.5 rounded-xl bg-error text-white font-bold hover:opacity-90 transition-colors disabled:opacity-50"
            >
              {deleteRFQ.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Bulk delete confirmation */}
    {bulkDeleteConfirm && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-error-container rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-error text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>delete_sweep</span>
          </div>
          <h3 className="font-headline font-bold text-xl text-on-surface mb-2">Bulk Delete?</h3>
          <p className="text-sm text-on-surface-variant mb-6">
            You are about to delete <span className="font-bold text-error">{selectedIds.length}</span> RFQs. 
            This action cannot be undone and will remove all associated data.
          </p>
          {bulkDeleteRFQ.isError && (
            <p className="text-xs text-error mb-4">Failed to delete. Please try again.</p>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => setBulkDeleteConfirm(false)}
              className="flex-1 py-2.5 rounded-xl border border-outline-variant text-on-surface font-bold hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => bulkDeleteRFQ.mutate(selectedIds)}
              disabled={bulkDeleteRFQ.isPending}
              className="flex-1 py-2.5 rounded-xl bg-error text-white font-bold hover:opacity-90 transition-colors disabled:opacity-50"
            >
              {bulkDeleteRFQ.isPending ? 'Deleting...' : 'Delete All'}
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  )
}
