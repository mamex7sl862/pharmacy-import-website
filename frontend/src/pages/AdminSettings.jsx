import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

function AdminSidebar() {
  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-72 bg-slate-50 flex-col py-8 z-40 pt-24">
      <div className="px-8 mb-6">
        <h2 className="font-headline font-bold text-lg text-primary">Admin Portal</h2>
        <p className="text-xs text-slate-500 uppercase tracking-wide">Pharma Distribution</p>
      </div>
      <nav className="flex flex-col space-y-1">
        {[
          { to: '/admin',          icon: 'dashboard',     label: 'Dashboard' },
          { to: '/admin/rfqs',     icon: 'request_quote', label: 'RFQ Management' },
          { to: '/admin/products', icon: 'inventory_2',   label: 'Products' },
          { to: '/admin/settings', icon: 'settings',      label: 'Content & Settings', active: true },
        ].map((item) => (
          <Link key={item.to} to={item.to} className={`flex items-center gap-4 py-3 transition-all ${item.active ? 'bg-white text-primary font-bold rounded-l-full ml-4 pl-4 shadow-sm' : 'text-slate-500 pl-8 hover:text-primary'}`}>
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-medium text-sm">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}

// ── Testimonials Tab ──────────────────────────────────────────────────────────
function TestimonialsTab() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data: testimonials, isLoading } = useQuery({
    queryKey: ['admin-testimonials'],
    queryFn: () => api.get('/admin/testimonials').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/admin/testimonials', data),
    onSuccess: () => { qc.invalidateQueries(['admin-testimonials']); setModal(null) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/admin/testimonials/${id}`, data),
    onSuccess: () => { qc.invalidateQueries(['admin-testimonials']); setModal(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/testimonials/${id}`),
    onSuccess: () => { qc.invalidateQueries(['admin-testimonials']); setDeleteTarget(null) },
  })

  const EMPTY_T = { customerName: '', companyName: '', comment: '', isActive: true, sortOrder: 0 }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-headline font-bold text-xl text-on-surface">Testimonials</h2>
          <p className="text-sm text-on-surface-variant">Manage customer testimonials shown on the homepage.</p>
        </div>
        <button onClick={() => setModal(EMPTY_T)} className="btn-primary flex items-center gap-2">
          <span className="material-symbols-outlined">add</span>
          Add Testimonial
        </button>
      </div>

      <div className="space-y-4">
        {isLoading
          ? Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-24 bg-surface-container rounded-2xl animate-pulse" />)
          : testimonials?.map((t) => (
              <div key={t.id} className="bg-white rounded-2xl p-6 shadow-sm flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center font-bold text-primary">
                      {t.customerName?.[0]}
                    </div>
                    <div>
                      <p className="font-bold text-on-surface">{t.customerName}</p>
                      <p className="text-xs text-on-surface-variant">{t.companyName}</p>
                    </div>
                    <span className={`ml-auto px-2 py-1 rounded-full text-[10px] font-bold uppercase ${t.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {t.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface-variant italic">"{t.comment}"</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setModal(t)} className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors">
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                  <button onClick={() => setDeleteTarget(t)} className="p-2 hover:bg-error-container/30 text-error rounded-lg transition-colors">
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            ))}
      </div>

      {/* Modal */}
      {modal && (
        <TestimonialModal
          testimonial={modal.id ? modal : null}
          initial={modal}
          onClose={() => setModal(null)}
          onSave={(form) => modal.id ? updateMutation.mutate(form) : createMutation.mutate(form)}
          isSaving={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
            <h2 className="font-headline font-bold text-xl mb-3">Delete Testimonial?</h2>
            <p className="text-on-surface-variant mb-6">From <strong>{deleteTarget.customerName}</strong> will be permanently removed.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteTarget(null)} className="px-6 py-2.5 border border-outline-variant rounded-xl font-semibold hover:bg-surface-container transition-all">Cancel</button>
              <button onClick={() => deleteMutation.mutate(deleteTarget.id)} disabled={deleteMutation.isPending} className="px-6 py-2.5 bg-error text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50">
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TestimonialModal({ initial, onClose, onSave, isSaving }) {
  const [form, setForm] = useState(initial)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-surface-container">
          <h2 className="font-headline font-bold text-xl">{form.id ? 'Edit Testimonial' : 'Add Testimonial'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full"><span className="material-symbols-outlined">close</span></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-outline uppercase tracking-widest">Customer Name *</label>
            <input value={form.customerName} onChange={set('customerName')} placeholder="Dr. Sarah Jenkins" className="input-field" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-outline uppercase tracking-widest">Company / Role</label>
            <input value={form.companyName} onChange={set('companyName')} placeholder="Hospital Administrator, St. Jude Medical" className="input-field" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-outline uppercase tracking-widest">Comment *</label>
            <textarea value={form.comment} onChange={set('comment')} rows={4} placeholder="Customer testimonial..." className="input-field resize-none" />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={set('isActive')} className="h-4 w-4 text-primary rounded" />
              <span className="text-sm font-medium">Show on homepage</span>
            </label>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-outline uppercase tracking-widest">Order</label>
              <input type="number" value={form.sortOrder} onChange={set('sortOrder')} className="input-field w-20 py-2 text-center" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-surface-container">
          <button onClick={onClose} className="px-6 py-2.5 text-on-surface-variant font-semibold hover:bg-surface-container rounded-xl transition-all">Cancel</button>
          <button onClick={() => onSave(form)} disabled={!form.customerName || !form.comment || isSaving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
            {isSaving ? <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span> : <span className="material-symbols-outlined">save</span>}
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Company Info Tab ──────────────────────────────────────────────────────────
function CompanyInfoTab() {
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    companyName: 'PharmaLink Wholesale',
    tagline: 'Trusted Pharmaceutical Wholesale & Import Solutions',
    description: 'Supplying medical institutions worldwide with precision-sourced medications, surgical supplies, and laboratory equipment.',
    address: 'Medical Park West, Floor 14, London, UK EC1A 4HQ',
    phone: '+44 (0) 20 7946 0123',
    email: 'support@pharmalinkwholesale.com',
    procurementEmail: 'procurement@pharmalinkwholesale.com',
    workingHours: 'Mon–Fri, 9am – 6pm GMT',
    yearsExperience: '15+',
    countriesServed: '50+',
    productsCount: '10,000+',
    orderAccuracy: '99.8%',
  })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSave = () => {
    // In a real app this would call an API endpoint
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-headline font-bold text-xl text-on-surface">Company Information</h2>
          <p className="text-sm text-on-surface-variant">Update the company details shown across the website.</p>
        </div>
        <button onClick={handleSave} className="btn-primary flex items-center gap-2">
          {saved ? <><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Saved!</> : <><span className="material-symbols-outlined">save</span> Save Changes</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branding */}
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-headline font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">business</span>
            Branding
          </h3>
          {[
            { key: 'companyName', label: 'Company Name' },
            { key: 'tagline', label: 'Hero Tagline' },
            { key: 'description', label: 'Short Description', textarea: true },
          ].map((f) => (
            <div key={f.key} className="space-y-1">
              <label className="text-xs font-bold text-outline uppercase tracking-widest">{f.label}</label>
              {f.textarea
                ? <textarea value={form[f.key]} onChange={set(f.key)} rows={3} className="input-field resize-none" />
                : <input value={form[f.key]} onChange={set(f.key)} className="input-field" />}
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-headline font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">contact_phone</span>
            Contact Details
          </h3>
          {[
            { key: 'address',          label: 'Address' },
            { key: 'phone',            label: 'Phone Number' },
            { key: 'email',            label: 'Support Email' },
            { key: 'procurementEmail', label: 'Procurement Email' },
            { key: 'workingHours',     label: 'Working Hours' },
          ].map((f) => (
            <div key={f.key} className="space-y-1">
              <label className="text-xs font-bold text-outline uppercase tracking-widest">{f.label}</label>
              <input value={form[f.key]} onChange={set(f.key)} className="input-field" />
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-2">
          <h3 className="font-headline font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">bar_chart</span>
            Homepage Stats
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: 'yearsExperience', label: 'Years of Experience' },
              { key: 'countriesServed', label: 'Countries Served' },
              { key: 'productsCount',   label: 'Products in Catalog' },
              { key: 'orderAccuracy',   label: 'Order Accuracy Rate' },
            ].map((f) => (
              <div key={f.key} className="space-y-1">
                <label className="text-xs font-bold text-outline uppercase tracking-widest">{f.label}</label>
                <input value={form[f.key]} onChange={set(f.key)} className="input-field text-center font-bold" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('company')

  const tabs = [
    { key: 'company',      icon: 'business',       label: 'Company Info' },
    { key: 'testimonials', icon: 'format_quote',    label: 'Testimonials' },
  ]

  return (
    <div className="bg-background min-h-screen">
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-lg shadow-sm h-20 flex justify-between items-center px-8">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-primary">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <h1 className="font-headline font-bold text-2xl tracking-tight text-primary">Content & Settings</h1>
            <p className="text-xs text-slate-500">Manage website content and configuration</p>
          </div>
        </div>
      </header>

      <AdminSidebar />

      <main className="md:ml-72 pt-28 pb-12 px-6 md:px-10">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-surface-container">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-6 py-3 font-headline font-bold text-sm transition-all border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'text-primary border-primary'
                  : 'text-on-surface-variant border-transparent hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'company'      && <CompanyInfoTab />}
        {activeTab === 'testimonials' && <TestimonialsTab />}
      </main>
    </div>
  )
}
