import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import AdminLayout from '../components/AdminLayout'

// Testimonials management
function TestimonialsSection() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ customerName: '', companyName: '', comment: '' })
  const [editing, setEditing] = useState(null)

  const { data: testimonials } = useQuery({
    queryKey: ['admin-testimonials'],
    queryFn: () => api.get('/admin/testimonials').then((r) => r.data),
  })

  const create = useMutation({
    mutationFn: (data) => api.post('/admin/testimonials', data),
    onSuccess: () => { qc.invalidateQueries(['admin-testimonials']); setForm({ customerName: '', companyName: '', comment: '' }) },
  })

  const update = useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/admin/testimonials/${id}`, data),
    onSuccess: () => { qc.invalidateQueries(['admin-testimonials']); setEditing(null) },
  })

  const remove = useMutation({
    mutationFn: (id) => api.delete(`/admin/testimonials/${id}`),
    onSuccess: () => qc.invalidateQueries(['admin-testimonials']),
  })

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-surface-container flex items-center gap-3">
        <span className="material-symbols-outlined text-primary">format_quote</span>
        <h2 className="font-headline font-bold text-xl text-on-surface">Testimonials</h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Add form */}
        <div className="bg-surface-container-low rounded-xl p-5">
          <h3 className="font-headline font-bold text-sm uppercase tracking-widest text-outline mb-4">Add Testimonial</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-outline uppercase tracking-widest">Customer Name *</label>
              <input value={form.customerName} onChange={set('customerName')} placeholder="Dr. Sarah Jenkins" className="input-field" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-outline uppercase tracking-widest">Company</label>
              <input value={form.companyName} onChange={set('companyName')} placeholder="St. Jude Medical" className="input-field" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-outline uppercase tracking-widest">Comment *</label>
              <textarea value={form.comment} onChange={set('comment')} rows={3} placeholder="Customer feedback..." className="input-field resize-none" />
            </div>
          </div>
          <button
            onClick={() => create.mutate(form)}
            disabled={create.isPending || !form.customerName || !form.comment}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            <span className="material-symbols-outlined">add</span>
            {create.isPending ? 'Adding...' : 'Add Testimonial'}
          </button>
        </div>

        {/* List */}
        <div className="space-y-4">
          {testimonials?.map((t) => (
            <div key={t.id} className="bg-surface-container-low rounded-xl p-5">
              {editing?.id === t.id ? (
                <div className="space-y-3">
                  <input
                    value={editing.customerName}
                    onChange={(e) => setEditing((ed) => ({ ...ed, customerName: e.target.value }))}
                    className="input-field"
                  />
                  <input
                    value={editing.companyName}
                    onChange={(e) => setEditing((ed) => ({ ...ed, companyName: e.target.value }))}
                    className="input-field"
                  />
                  <textarea
                    value={editing.comment}
                    onChange={(e) => setEditing((ed) => ({ ...ed, comment: e.target.value }))}
                    rows={3}
                    className="input-field resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => update.mutate(editing)} className="btn-primary text-sm px-4 py-2">Save</button>
                    <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl border border-outline-variant text-sm">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-headline font-bold text-on-surface">{t.customerName}</p>
                    <p className="text-xs text-on-surface-variant mb-2">{t.companyName}</p>
                    <p className="text-sm text-on-surface-variant italic">"{t.comment}"</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => setEditing(t)} className="p-2 rounded-lg hover:bg-surface-container transition-colors text-primary">
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button onClick={() => remove.mutate(t.id)} className="p-2 rounded-lg hover:bg-error-container/20 transition-colors text-error">
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {testimonials?.length === 0 && (
            <p className="text-center text-on-surface-variant py-8 text-sm">No testimonials yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminContent() {
  return (
    <AdminLayout title="Content Management" subtitle="Manage testimonials and website content.">
      <div className="space-y-8">
        <TestimonialsSection />

        {/* Placeholder for future content blocks */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-primary">web</span>
            <h2 className="font-headline font-bold text-xl text-on-surface">Website Content</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: 'home', label: 'Hero Section', desc: 'Edit homepage hero text and CTAs' },
              { icon: 'info', label: 'About Section', desc: 'Update company overview and stats' },
              { icon: 'contact_mail', label: 'Contact Info', desc: 'Update address, phone, and email' },
            ].map((item) => (
              <div key={item.label} className="bg-surface-container-low rounded-xl p-5 hover:shadow-md transition-all cursor-pointer group">
                <div className="w-10 h-10 bg-secondary-container rounded-lg flex items-center justify-center mb-3 group-hover:bg-primary transition-colors">
                  <span className="material-symbols-outlined text-primary group-hover:text-white">{item.icon}</span>
                </div>
                <h3 className="font-headline font-bold text-on-surface mb-1">{item.label}</h3>
                <p className="text-xs text-on-surface-variant">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
