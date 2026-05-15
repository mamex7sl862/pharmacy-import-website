import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import AdminLayout from '../components/AdminLayout'
import useAuthStore from '../store/authStore'

// ── Account Settings Tab ──────────────────────────────────────────────────────
function AccountTab() {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  const [emailForm, setEmailForm] = useState({ newEmail: '', password: '' })
  const [passForm,  setPassForm]  = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [emailMsg,  setEmailMsg]  = useState(null)
  const [passMsg,   setPassMsg]   = useState(null)
  const [emailLoading, setEmailLoading] = useState(false)
  const [passLoading,  setPassLoading]  = useState(false)

  const handleEmailChange = async (e) => {
    e.preventDefault()
    if (!emailForm.newEmail || !emailForm.password) return
    setEmailLoading(true); setEmailMsg(null)
    try {
      const res = await api.patch('/admin/account/email', emailForm)
      // Backend returns a new token — update auth store so we stay logged in
      if (res.data.accessToken) {
        setAuth(res.data.user, res.data.accessToken)
      }
      setEmailMsg({ type: 'success', text: `Email updated to ${emailForm.newEmail}` })
      setEmailForm({ newEmail: '', password: '' })
    } catch (err) {
      const code = err?.response?.data?.error
      setEmailMsg({ type: 'error', text:
        code === 'WRONG_PASSWORD' ? 'Current password is incorrect.' :
        code === 'EMAIL_EXISTS'   ? 'That email is already in use.' :
        'Failed to update email. Please try again.'
      })
    } finally { setEmailLoading(false) }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassMsg({ type: 'error', text: 'New passwords do not match.' }); return
    }
    if (passForm.newPassword.length < 8) {
      setPassMsg({ type: 'error', text: 'Password must be at least 8 characters.' }); return
    }
    setPassLoading(true); setPassMsg(null)
    try {
      await api.patch('/admin/account/password', {
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword,
      })
      setPassMsg({ type: 'success', text: 'Password updated successfully.' })
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      const code = err?.response?.data?.error
      setPassMsg({ type: 'error', text:
        code === 'WRONG_PASSWORD' ? 'Current password is incorrect.' :
        'Failed to update password. Please try again.'
      })
    } finally { setPassLoading(false) }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-headline font-bold text-xl text-on-surface">Account Settings</h2>
        <p className="text-sm text-on-surface-variant">Update your admin login credentials.</p>
      </div>

      {/* Change Email */}
      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-headline font-bold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">alternate_email</span>
          Change Email Address
        </h3>
        <form onSubmit={handleEmailChange} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-outline uppercase tracking-widest">New Email Address</label>
            <input type="email" value={emailForm.newEmail}
              onChange={e => setEmailForm(f => ({ ...f, newEmail: e.target.value }))}
              placeholder="new@email.com" className="input-field" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-outline uppercase tracking-widest">Current Password (to confirm)</label>
            <input type="password" value={emailForm.password}
              onChange={e => setEmailForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Enter your current password" className="input-field" required />
          </div>
          {emailMsg && (
            <p className={`text-sm px-4 py-2 rounded-lg ${emailMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {emailMsg.text}
            </p>
          )}
          <button type="submit" disabled={emailLoading}
            className="btn-primary flex items-center gap-2 disabled:opacity-50">
            {emailLoading
              ? <><span className="material-symbols-outlined animate-spin text-base">progress_activity</span>Updating...</>
              : 'Update Email'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-headline font-bold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">lock</span>
          Change Password
        </h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-outline uppercase tracking-widest">Current Password</label>
            <input type="password" value={passForm.currentPassword}
              onChange={e => setPassForm(f => ({ ...f, currentPassword: e.target.value }))}
              placeholder="Enter current password" className="input-field" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-outline uppercase tracking-widest">New Password</label>
            <input type="password" value={passForm.newPassword}
              onChange={e => setPassForm(f => ({ ...f, newPassword: e.target.value }))}
              placeholder="Min. 8 characters" className="input-field" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-outline uppercase tracking-widest">Confirm New Password</label>
            <input type="password" value={passForm.confirmPassword}
              onChange={e => setPassForm(f => ({ ...f, confirmPassword: e.target.value }))}
              placeholder="Repeat new password" className="input-field" required />
          </div>
          {passMsg && (
            <p className={`text-sm px-4 py-2 rounded-lg ${passMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {passMsg.text}
            </p>
          )}
          <button type="submit" disabled={passLoading}
            className="btn-primary flex items-center gap-2 disabled:opacity-50">
            {passLoading
              ? <><span className="material-symbols-outlined animate-spin text-base">progress_activity</span>Updating...</>
              : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-testimonials'] }); setModal(null) },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/admin/testimonials/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-testimonials'] }); setModal(null) },
  })
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/testimonials/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-testimonials'] }); setDeleteTarget(null) },
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
          <span className="material-symbols-outlined">add</span>Add Testimonial
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
      {modal && (
        <TestimonialModal
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
              <button onClick={() => deleteMutation.mutate(deleteTarget.id)} disabled={deleteMutation.isPending}
                className="px-6 py-2.5 bg-error text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50">
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
            <input value={form.companyName} onChange={set('companyName')} placeholder="Hospital Administrator" className="input-field" />
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
          <button onClick={() => onSave(form)} disabled={!form.customerName || !form.comment || isSaving}
            className="btn-primary flex items-center gap-2 disabled:opacity-50">
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
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-headline font-bold text-xl text-on-surface">Company Information</h2>
          <p className="text-sm text-on-surface-variant">Update the company details shown across the website.</p>
        </div>
        <button onClick={handleSave} className="btn-primary flex items-center gap-2">
          {saved ? <><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>Saved!</> : <><span className="material-symbols-outlined">save</span>Save Changes</>}
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-headline font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">business</span>Branding
          </h3>
          {[
            { key: 'companyName', label: 'Company Name' },
            { key: 'tagline',     label: 'Hero Tagline' },
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
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-headline font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">contact_phone</span>Contact Details
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
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-2">
          <h3 className="font-headline font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">bar_chart</span>Homepage Stats
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
  const [activeTab, setActiveTab] = useState('account')

  const tabs = [
    { key: 'account',      icon: 'manage_accounts', label: 'Account' },
    { key: 'company',      icon: 'business',        label: 'Company Info' },
    { key: 'testimonials', icon: 'format_quote',    label: 'Testimonials' },
  ]

  return (
    <AdminLayout title="Settings" subtitle="Manage your account credentials and website content.">
      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 font-bold text-sm transition-all border-b-2 -mb-px whitespace-nowrap ${
              activeTab === tab.key
                ? 'text-primary border-primary'
                : 'text-gray-500 border-transparent hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'account'      && <AccountTab />}
      {activeTab === 'company'      && <CompanyInfoTab />}
      {activeTab === 'testimonials' && <TestimonialsTab />}
    </AdminLayout>
  )
}
