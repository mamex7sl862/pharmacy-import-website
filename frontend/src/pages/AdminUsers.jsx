import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import AdminLayout from '../components/AdminLayout'

const ROLE_BADGE = {
  admin:    'bg-purple-50 text-purple-700',
  customer: 'bg-blue-50 text-blue-700',
}

export default function AdminUsers() {
  const qc = useQueryClient()
  const [search, setSearch]         = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatus]   = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [page, setPage]             = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter, statusFilter, page],
    queryFn: () => api.get('/admin/users', {
      params: { search, role: roleFilter, status: statusFilter, page, limit: 20 }
    }).then(r => r.data),
    staleTime: 0,
    keepPreviousData: true,
  })

  const toggleActive = useMutation({
    mutationFn: (id) => api.patch(`/admin/users/${id}/toggle-active`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const changeRole = useMutation({
    mutationFn: ({ id, role }) => api.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const deleteUser = useMutation({
    mutationFn: (id) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      setDeleteConfirm(null)
    },
  })

  const users  = data?.items || []
  const total  = data?.totalCount || 0
  const admins = users.filter(u => u.role === 'admin').length
  const active = users.filter(u => u.isActive).length

  return (
    <AdminLayout title="User Management" subtitle="View and manage all registered customer and admin accounts.">

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Users',    value: total,                      icon: 'people',        color: 'bg-blue-50 text-blue-600' },
          { label: 'Active',         value: users.filter(u=>u.isActive).length, icon: 'check_circle', color: 'bg-green-50 text-green-600' },
          { label: 'Inactive',       value: users.filter(u=>!u.isActive).length,icon: 'block',        color: 'bg-red-50 text-red-600' },
          { label: 'Admins',         value: admins,                     icon: 'admin_panel_settings', color: 'bg-purple-50 text-purple-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}>
                <span className="material-symbols-outlined text-lg">{s.icon}</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by name, email, or company..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none">
            <option value="">All Roles</option>
            <option value="customer">Customer</option>
            <option value="admin">Admin</option>
          </select>
          <select value={statusFilter} onChange={e => { setStatus(e.target.value); setPage(1) }}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {(search || roleFilter || statusFilter) && (
            <button onClick={() => { setSearch(''); setRoleFilter(''); setStatus(''); setPage(1) }}
              className="px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">close</span>Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">{isLoading ? 'Loading...' : `${total} users found`}</p>
        </div>

        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 bg-gray-50/50">
                <th className="text-left py-3 px-6">User</th>
                <th className="text-left py-3 px-4">Company</th>
                <th className="text-left py-3 px-4">Role</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">RFQs</th>
                <th className="text-left py-3 px-4">Joined</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="py-4 px-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400">
                    <span className="material-symbols-outlined text-4xl mb-2 block opacity-30">people</span>
                    No users found
                  </td>
                </tr>
              ) : users.map(user => (
                <tr key={user.id} className={`hover:bg-gray-50/50 transition-colors ${!user.isActive ? 'opacity-60' : ''}`}>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                        {user.fullName?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{user.fullName}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-600 text-xs">{user.companyName || '—'}</td>
                  <td className="py-4 px-4">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${ROLE_BADGE[user.role]}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => toggleActive.mutate(user.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
                        user.isActive
                          ? 'bg-green-50 text-green-700 hover:bg-green-100'
                          : 'bg-red-50 text-red-600 hover:bg-red-100'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {user.isActive ? 'check_circle' : 'cancel'}
                      </span>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="py-4 px-4">
                    <Link to={`/admin/rfqs?customerName=${encodeURIComponent(user.fullName)}`}
                      className="text-primary font-bold text-sm hover:underline">
                      {user.rfqCount}
                    </Link>
                  </td>
                  <td className="py-4 px-4 text-gray-500 text-xs">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => setDeleteConfirm(user)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors mx-auto"
                      title="Delete user"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {users.map(user => (
            <div key={user.id} className={`p-4 space-y-3 ${!user.isActive ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                    {user.fullName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{user.fullName}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    {user.companyName && <p className="text-xs text-gray-400 truncate">{user.companyName}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_BADGE[user.role]}`}>
                    {user.role}
                  </span>
                  <button onClick={() => setDeleteConfirm(user)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                <button onClick={() => toggleActive.mutate(user.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    user.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                  }`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </button>
                <span className="text-xs text-gray-500">{user.rfqCount} RFQs</span>
                <span className="text-xs text-gray-400 ml-auto">{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">Page {page} · {total} total</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50">
                Previous
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={!data?.items || data.items.length < 20}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-red-600 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>person_remove</span>
            </div>
            <h3 className="font-headline font-bold text-xl text-gray-900 mb-2">Delete User?</h3>
            <p className="text-sm text-gray-600 mb-1">
              <strong>{deleteConfirm.fullName}</strong> will be permanently removed.
            </p>
            <p className="text-xs text-gray-400 mb-6">Their RFQ history will be preserved as guest records.</p>
            {deleteUser.isError && (
              <p className="text-xs text-red-600 mb-4 bg-red-50 px-3 py-2 rounded-lg">
                {deleteUser.error?.response?.data?.error === 'CANNOT_DELETE_SELF'
                  ? 'You cannot delete your own account.'
                  : 'Failed to delete. Please try again.'}
              </p>
            )}
            <div className="flex gap-3">
              <button onClick={() => { setDeleteConfirm(null); deleteUser.reset() }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={() => deleteUser.mutate(deleteConfirm.id)} disabled={deleteUser.isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors disabled:opacity-50">
                {deleteUser.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
