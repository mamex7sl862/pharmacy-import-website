import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import AdminLayout from '../components/AdminLayout'

// ── Helpers ───────────────────────────────────────────────────────────────────
function Field({ label, children, col2 }) {
  return (
    <div className={`space-y-1.5 ${col2 ? 'md:col-span-2' : ''}`}>
      <label className="block text-xs font-bold text-outline uppercase tracking-widest">{label}</label>
      {children}
    </div>
  )
}

function ImageField({ label, value, onChange }) {
  return (
    <Field label={label}>
      <input value={value || ''} onChange={onChange} placeholder="https://images.unsplash.com/..." className="input-field text-sm" />
      {value && <img src={value} alt="preview" className="mt-2 h-20 w-32 object-cover rounded-lg border border-outline-variant/20" onError={e => e.target.style.display='none'} />}
    </Field>
  )
}

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="p-6 border-b border-surface-container flex items-center gap-3">
      <span className="material-symbols-outlined text-primary">{icon}</span>
      <div>
        <h2 className="font-headline font-bold text-xl text-on-surface">{title}</h2>
        {subtitle && <p className="text-xs text-on-surface-variant mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

// Generic save-to-DB hook
function useSectionSave(section) {
  const qc = useQueryClient()
  const [saved, setSaved] = useState(false)
  const mutation = useMutation({
    mutationFn: (data) => api.put(`/admin/site-content/${section}`, { data }),
    onSuccess: () => {
      qc.invalidateQueries(['site-content', section])
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })
  return { save: mutation.mutate, pending: mutation.isPending, saved, error: mutation.isError }
}

// Generic fetch from DB with fallback
function useSectionData(section, fallback) {
  const { data } = useQuery({
    queryKey: ['site-content', section],
    queryFn: () => api.get(`/admin/site-content/${section}`).then(r => r.data),
    retry: false,
    staleTime: 0,
  })
  const [local, setLocal] = useState(null)
  useEffect(() => { if (data !== undefined) setLocal(data) }, [data])
  const value = local ?? data ?? fallback
  return [value, setLocal]
}

function SaveBtn({ onClick, saved, pending, error }) {
  return (
    <div className="flex items-center gap-3">
      <button onClick={onClick} disabled={pending} className="btn-primary flex items-center gap-2 disabled:opacity-50">
        <span className="material-symbols-outlined text-base">{saved ? 'check' : pending ? 'progress_activity' : 'save'}</span>
        {pending ? 'Saving to DB...' : saved ? '✓ Saved to Database' : 'Save to Database'}
      </button>
      {saved && <span className="text-xs text-green-600 font-medium">Changes are now live on the website.</span>}
      {error && <span className="text-xs text-error">Save failed. Check backend connection.</span>}
    </div>
  )
}

// ── Testimonials (already DB-connected) ──────────────────────────────────────
function TestimonialsSection() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ customerName: '', companyName: '', comment: '' })
  const [editing, setEditing] = useState(null)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const { data: list = [] } = useQuery({ queryKey: ['admin-testimonials'], queryFn: () => api.get('/admin/testimonials').then(r => r.data) })
  const create = useMutation({ mutationFn: d => api.post('/admin/testimonials', d), onSuccess: () => { useQueryClient().invalidateQueries(['admin-testimonials']); setForm({ customerName: '', companyName: '', comment: '' }) } })
  const update = useMutation({ mutationFn: ({ id, ...d }) => api.put(`/admin/testimonials/${id}`, d), onSuccess: () => { useQueryClient().invalidateQueries(['admin-testimonials']); setEditing(null) } })
  const remove = useMutation({ mutationFn: id => api.delete(`/admin/testimonials/${id}`), onSuccess: () => useQueryClient().invalidateQueries(['admin-testimonials']) })

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
      <SectionHeader icon="format_quote" title="Testimonials" subtitle="Shown on Home & About pages — changes are live immediately" />
      <div className="p-6 space-y-5">
        <div className="bg-surface-container-low rounded-xl p-5">
          <p className="text-xs font-bold text-outline uppercase tracking-widest mb-4">Add New</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Field label="Customer Name *"><input value={form.customerName} onChange={set('customerName')} placeholder="Dr. Sarah Jenkins" className="input-field" /></Field>
            <Field label="Company / Role"><input value={form.companyName} onChange={set('companyName')} placeholder="Hospital Administrator, St. Jude Medical" className="input-field" /></Field>
            <Field label="Comment *" col2><textarea value={form.comment} onChange={set('comment')} rows={3} placeholder="Customer feedback..." className="input-field resize-none" /></Field>
          </div>
          <button onClick={() => create.mutate(form)} disabled={create.isPending || !form.customerName || !form.comment} className="btn-primary flex items-center gap-2 disabled:opacity-50">
            <span className="material-symbols-outlined">add</span>{create.isPending ? 'Adding...' : 'Add Testimonial'}
          </button>
        </div>
        {list.map(t => (
          <div key={t.id} className="bg-surface-container-low rounded-xl p-5">
            {editing?.id === t.id ? (
              <div className="space-y-3">
                <input value={editing.customerName} onChange={e => setEditing(ed => ({ ...ed, customerName: e.target.value }))} className="input-field" />
                <input value={editing.companyName} onChange={e => setEditing(ed => ({ ...ed, companyName: e.target.value }))} className="input-field" />
                <textarea value={editing.comment} onChange={e => setEditing(ed => ({ ...ed, comment: e.target.value }))} rows={3} className="input-field resize-none" />
                <div className="flex gap-2">
                  <button onClick={() => update.mutate(editing)} disabled={update.isPending} className="btn-primary text-sm px-4 py-2">{update.isPending ? 'Saving...' : 'Save'}</button>
                  <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl border border-outline-variant text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-bold text-sm text-on-surface">{t.customerName} <span className="font-normal text-on-surface-variant text-xs">— {t.companyName}</span></p>
                  <p className="text-sm text-on-surface-variant italic mt-1">"{t.comment}"</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(t)} className="p-2 rounded-lg hover:bg-surface-container text-primary"><span className="material-symbols-outlined text-base">edit</span></button>
                  <button onClick={() => remove.mutate(t.id)} className="p-2 rounded-lg hover:bg-error-container/20 text-error"><span className="material-symbols-outlined text-base">delete</span></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Hero Slides ───────────────────────────────────────────────────────────────
const DEFAULT_SLIDES = [
  { img: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1800&q=90', badge: 'Global Distribution Excellence', accent: 'Import Solutions', subtitle: 'Supplying medical institutions worldwide with precision-sourced medications, surgical supplies, and laboratory equipment.' },
  { img: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1800&q=90', badge: 'WHO-GMP Certified Sources', accent: 'Pharmaceutical Wholesale', subtitle: 'Every product meets rigorous international standards including WHO, FDA, and EMA guidelines.' },
  { img: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=1800&q=90', badge: 'Cold Chain Specialists', accent: 'Temperature-Controlled Logistics', subtitle: 'IoT-monitored cold chain handling for temperature-sensitive pharmaceuticals. 2–8°C compliance guaranteed.' },
  { img: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1800&q=90', badge: 'Surgical & Medical Supplies', accent: 'Sterile & Certified', subtitle: 'Precision instruments, sterile disposables, and medical consumables for operating theaters worldwide.' },
]

function HeroSlidesSection() {
  const [slides, setSlides] = useSectionData('hero_slides', DEFAULT_SLIDES)
  const { save, pending, saved, error } = useSectionSave('hero_slides')
  const upd = (i, k, v) => setSlides(s => s.map((sl, idx) => idx === i ? { ...sl, [k]: v } : sl))

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
      <SectionHeader icon="slideshow" title="Hero Slideshow" subtitle="4 rotating slides on the Home page — saved to database" />
      <div className="p-6 space-y-4">
        {(slides || DEFAULT_SLIDES).map((sl, i) => (
          <div key={i} className="bg-surface-container-low rounded-xl p-5">
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-4">Slide {i + 1}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Badge Text"><input value={sl.badge || ''} onChange={e => upd(i, 'badge', e.target.value)} className="input-field text-sm" /></Field>
              <Field label="Headline Accent (blue text)"><input value={sl.accent || ''} onChange={e => upd(i, 'accent', e.target.value)} className="input-field text-sm" /></Field>
              <Field label="Subtitle" col2><textarea value={sl.subtitle || ''} onChange={e => upd(i, 'subtitle', e.target.value)} rows={2} className="input-field resize-none text-sm" /></Field>
              <div className="md:col-span-2"><ImageField label="Background Image URL" value={sl.img} onChange={e => upd(i, 'img', e.target.value)} /></div>
            </div>
          </div>
        ))}
        <SaveBtn onClick={() => save(slides)} pending={pending} saved={saved} error={error} />
      </div>
    </div>
  )
}

// ── Company Info ──────────────────────────────────────────────────────────────
const DEFAULT_COMPANY = { name:'PharmaLink Wholesale', tagline:'Trusted Pharmaceutical Wholesale & Import Solutions', description:'PharmaLink Pro operates at the intersection of medical necessity and logistical precision.', address:'Medical Park West, Floor 14, London, UK EC1A 4HQ', phone:'+44 (0) 20 7946 0123', hours:'Mon–Fri, 9am – 6pm GMT', email:'support@pharmalinkwholesale.com', procurementEmail:'procurement@pharmalinkwholesale.com', yearsExp:'15+', countries:'50+', products:'10,000+', accuracy:'99.8%', aboutImage:'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&q=90', aboutHeading:'The Essential Bridge in Healthcare Supply Chains', missionTitle:'Our Mission', missionText:'To make pharmaceutical procurement transparent, efficient, and accessible for every healthcare institution worldwide.', visionTitle:'Our Vision', visionText:'A world where no patient goes without medicine due to supply chain failures or procurement inefficiencies.' }

function CompanyInfoSection() {
  const [d, setD] = useSectionData('company_info', DEFAULT_COMPANY)
  const { save, pending, saved, error } = useSectionSave('company_info')
  const set = k => e => setD(f => ({ ...f, [k]: e.target.value }))
  const data = d || DEFAULT_COMPANY

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
      <SectionHeader icon="business" title="Company Information" subtitle="Used across Home, About, Contact, and Services pages" />
      <div className="p-6 space-y-6">
        <div>
          <p className="text-xs font-bold text-outline uppercase tracking-widest mb-4">Brand & Identity</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Company Name"><input value={data.name||''} onChange={set('name')} className="input-field" /></Field>
            <Field label="Tagline"><input value={data.tagline||''} onChange={set('tagline')} className="input-field" /></Field>
            <Field label="Description" col2><textarea value={data.description||''} onChange={set('description')} rows={3} className="input-field resize-none" /></Field>
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-outline uppercase tracking-widest mb-4">Contact Details</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Address" col2><input value={data.address||''} onChange={set('address')} className="input-field" /></Field>
            <Field label="Phone"><input value={data.phone||''} onChange={set('phone')} className="input-field" /></Field>
            <Field label="Business Hours"><input value={data.hours||''} onChange={set('hours')} className="input-field" /></Field>
            <Field label="Support Email"><input value={data.email||''} onChange={set('email')} className="input-field" /></Field>
            <Field label="Procurement Email"><input value={data.procurementEmail||''} onChange={set('procurementEmail')} className="input-field" /></Field>
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-outline uppercase tracking-widest mb-4">Homepage Stats</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="Years Experience"><input value={data.yearsExp||''} onChange={set('yearsExp')} className="input-field" /></Field>
            <Field label="Countries Served"><input value={data.countries||''} onChange={set('countries')} className="input-field" /></Field>
            <Field label="Products Count"><input value={data.products||''} onChange={set('products')} className="input-field" /></Field>
            <Field label="Order Accuracy"><input value={data.accuracy||''} onChange={set('accuracy')} className="input-field" /></Field>
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-outline uppercase tracking-widest mb-4">About Page — Mission & Vision</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><ImageField label="About Section Image" value={data.aboutImage} onChange={set('aboutImage')} /></div>
            <Field label="About Heading" col2><input value={data.aboutHeading||''} onChange={set('aboutHeading')} className="input-field" /></Field>
            <Field label="Mission Title"><input value={data.missionTitle||''} onChange={set('missionTitle')} className="input-field" /></Field>
            <Field label="Mission Text"><textarea value={data.missionText||''} onChange={set('missionText')} rows={2} className="input-field resize-none" /></Field>
            <Field label="Vision Title"><input value={data.visionTitle||''} onChange={set('visionTitle')} className="input-field" /></Field>
            <Field label="Vision Text"><textarea value={data.visionText||''} onChange={set('visionText')} rows={2} className="input-field resize-none" /></Field>
          </div>
        </div>
        <SaveBtn onClick={() => save(data)} pending={pending} saved={saved} error={error} />
      </div>
    </div>
  )
}

// ── Why Choose Us ─────────────────────────────────────────────────────────────
const DEFAULT_WHY = [{ icon:'verified', title:'Genuine Products', desc:'Direct sourcing from certified manufacturers only.' }, { icon:'payments', title:'Competitive Pricing', desc:'Economies of scale passed directly to our clients.' }, { icon:'local_shipping', title:'Fast Delivery', desc:'Optimized air & sea freight for rapid turnaround.' }, { icon:'gavel', title:'Licensed & Certified', desc:'Strict adherence to regional health authorities.' }]

function WhyChooseUsSection() {
  const [items, setItems] = useSectionData('why_choose_us', DEFAULT_WHY)
  const { save, pending, saved, error } = useSectionSave('why_choose_us')
  const upd = (i, k, v) => setItems(s => s.map((it, idx) => idx === i ? { ...it, [k]: v } : it))
  const data = items || DEFAULT_WHY

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
      <SectionHeader icon="star" title="Why Choose Us" subtitle="4 cards on Home, Contact, and Services pages" />
      <div className="p-6 space-y-3">
        {data.map((item, i) => (
          <div key={i} className="bg-surface-container-low rounded-xl p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <Field label="Icon (Material Symbol)">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings:"'FILL' 1" }}>{item.icon}</span>
                  <input value={item.icon||''} onChange={e => upd(i, 'icon', e.target.value)} className="input-field text-sm flex-1" />
                </div>
              </Field>
              <Field label="Title"><input value={item.title||''} onChange={e => upd(i, 'title', e.target.value)} className="input-field text-sm" /></Field>
              <Field label="Description"><input value={item.desc||''} onChange={e => upd(i, 'desc', e.target.value)} className="input-field text-sm" /></Field>
            </div>
          </div>
        ))}
        <SaveBtn onClick={() => save(data)} pending={pending} saved={saved} error={error} />
      </div>
    </div>
  )
}

// ── Team ──────────────────────────────────────────────────────────────────────
const DEFAULT_TEAM = [{ name:'Dr. Helena Richardson', role:'Chief Executive Officer', bio:'20+ years in pharmaceutical supply chain.', img:'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80' }, { name:'James Okafor', role:'Head of Regulatory Affairs', bio:'Expert in international pharmaceutical compliance.', img:'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80' }, { name:'Dr. Mei Lin', role:'Director of Quality Assurance', bio:'PhD in Pharmaceutical Sciences.', img:'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80' }, { name:'Carlos Mendez', role:'VP of Global Logistics', bio:'Specialist in air and sea freight.', img:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80' }]

function TeamSection() {
  const [team, setTeam] = useSectionData('team', DEFAULT_TEAM)
  const { save, pending, saved, error } = useSectionSave('team')
  const upd = (i, k, v) => setTeam(s => s.map((m, idx) => idx === i ? { ...m, [k]: v } : m))
  const data = team || DEFAULT_TEAM

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
      <SectionHeader icon="groups" title="Leadership Team" subtitle="4 team member cards on the About page" />
      <div className="p-6 space-y-4">
        {data.map((m, i) => (
          <div key={i} className="bg-surface-container-low rounded-xl p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Full Name"><input value={m.name||''} onChange={e => upd(i, 'name', e.target.value)} className="input-field" /></Field>
              <Field label="Role / Title"><input value={m.role||''} onChange={e => upd(i, 'role', e.target.value)} className="input-field" /></Field>
              <Field label="Bio" col2><textarea value={m.bio||''} onChange={e => upd(i, 'bio', e.target.value)} rows={2} className="input-field resize-none" /></Field>
              <div className="md:col-span-2"><ImageField label="Photo URL" value={m.img} onChange={e => upd(i, 'img', e.target.value)} /></div>
            </div>
          </div>
        ))}
        <SaveBtn onClick={() => save(data)} pending={pending} saved={saved} error={error} />
      </div>
    </div>
  )
}

// ── Timeline ──────────────────────────────────────────────────────────────────
const DEFAULT_TIMELINE = [{ year:'2009', title:'Founded', desc:'PharmaLink established in London as a regional pharmaceutical wholesaler.' }, { year:'2012', title:'WHO Certification', desc:'Achieved WHO-GMP certification, opening doors to international markets.' }, { year:'2015', title:'Cold Chain Launch', desc:'Launched dedicated cold chain division with IoT temperature monitoring.' }, { year:'2018', title:'Digital Platform', desc:'Introduced the first version of our digital RFQ procurement portal.' }, { year:'2021', title:'Global Expansion', desc:'Expanded operations to 50+ countries across 6 continents.' }, { year:'2024', title:'PharmaLink Pro', desc:'Launched PharmaLink Pro — the next generation of B2B pharmaceutical procurement.' }]

function TimelineSection() {
  const [items, setItems] = useSectionData('timeline', DEFAULT_TIMELINE)
  const { save, pending, saved, error } = useSectionSave('timeline')
  const upd = (i, k, v) => setItems(s => s.map((it, idx) => idx === i ? { ...it, [k]: v } : it))
  const data = items || DEFAULT_TIMELINE

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
      <SectionHeader icon="timeline" title="Company Timeline" subtitle="6 milestone cards on the About page" />
      <div className="p-6 space-y-3">
        {data.map((item, i) => (
          <div key={i} className="bg-surface-container-low rounded-xl p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <Field label="Year"><input value={item.year||''} onChange={e => upd(i, 'year', e.target.value)} className="input-field text-sm" /></Field>
              <Field label="Title"><input value={item.title||''} onChange={e => upd(i, 'title', e.target.value)} className="input-field text-sm" /></Field>
              <div className="md:col-span-2"><Field label="Description"><input value={item.desc||''} onChange={e => upd(i, 'desc', e.target.value)} className="input-field text-sm" /></Field></div>
            </div>
          </div>
        ))}
        <SaveBtn onClick={() => save(data)} pending={pending} saved={saved} error={error} />
      </div>
    </div>
  )
}

// ── FAQ ───────────────────────────────────────────────────────────────────────
const DEFAULT_FAQ = [{ q:'How quickly do you respond to RFQs?', a:'We respond to all RFQ submissions within 4–24 business hours with a formal quotation.' }, { q:'What is the minimum order quantity?', a:'MOQ varies by product. Many items have no minimum. Contact us for specific product requirements.' }, { q:'Do you handle international shipping?', a:'Yes. We ship to 50+ countries and handle all customs documentation and freight arrangements.' }, { q:'Are your products WHO-GMP certified?', a:'All products in our catalog are sourced exclusively from WHO-GMP certified manufacturers.' }]

function FAQSection() {
  const [faqs, setFaqs] = useSectionData('faq', DEFAULT_FAQ)
  const { save, pending, saved, error } = useSectionSave('faq')
  const upd = (i, k, v) => setFaqs(s => s.map((f, idx) => idx === i ? { ...f, [k]: v } : f))
  const add = () => setFaqs(s => [...(s||[]), { q:'', a:'' }])
  const del = i => setFaqs(s => s.filter((_, idx) => idx !== i))
  const data = faqs || DEFAULT_FAQ

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
      <SectionHeader icon="help" title="FAQ" subtitle="Shown on the Contact page" />
      <div className="p-6 space-y-3">
        {data.map((faq, i) => (
          <div key={i} className="bg-surface-container-low rounded-xl p-4">
            <div className="grid grid-cols-1 gap-3">
              <Field label={`Question ${i+1}`}><input value={faq.q||''} onChange={e => upd(i, 'q', e.target.value)} className="input-field text-sm" /></Field>
              <div className="flex gap-2 items-start">
                <div className="flex-1"><Field label="Answer"><textarea value={faq.a||''} onChange={e => upd(i, 'a', e.target.value)} rows={2} className="input-field resize-none text-sm" /></Field></div>
                <button onClick={() => del(i)} className="mt-6 p-2 rounded-lg hover:bg-error-container/20 text-error flex-shrink-0"><span className="material-symbols-outlined text-base">delete</span></button>
              </div>
            </div>
          </div>
        ))}
        <div className="flex gap-3 flex-wrap">
          <button onClick={add} className="btn-secondary flex items-center gap-2 text-sm"><span className="material-symbols-outlined text-base">add</span>Add FAQ</button>
          <SaveBtn onClick={() => save(data)} pending={pending} saved={saved} error={error} />
        </div>
      </div>
    </div>
  )
}

// ── Contact Info ──────────────────────────────────────────────────────────────
const DEFAULT_CONTACT = [{ icon:'location_on', title:'Headquarters', line1:'Medical Park West, Floor 14', line2:'London, UK EC1A 4HQ' }, { icon:'call', title:'Phone Support', line1:'+44 (0) 20 7946 0123', line2:'Mon–Fri, 9am – 6pm GMT' }, { icon:'mail', title:'Email', line1:'support@pharmalinkwholesale.com', line2:'procurement@pharmalinkwholesale.com' }, { icon:'schedule', title:'Business Hours', line1:'Monday – Friday: 9am – 6pm GMT', line2:'Saturday: 10am – 2pm GMT' }]

function ContactInfoSection() {
  const [info, setInfo] = useSectionData('contact_info', DEFAULT_CONTACT)
  const { save, pending, saved, error } = useSectionSave('contact_info')
  const upd = (i, k, v) => setInfo(s => s.map((it, idx) => idx === i ? { ...it, [k]: v } : it))
  const data = info || DEFAULT_CONTACT

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
      <SectionHeader icon="contact_mail" title="Contact Information" subtitle="Shown on Home and Contact pages" />
      <div className="p-6 space-y-3">
        {data.map((item, i) => (
          <div key={i} className="bg-surface-container-low rounded-xl p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <Field label="Icon">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">{item.icon}</span>
                  <input value={item.icon||''} onChange={e => upd(i, 'icon', e.target.value)} className="input-field text-sm flex-1" />
                </div>
              </Field>
              <Field label="Title"><input value={item.title||''} onChange={e => upd(i, 'title', e.target.value)} className="input-field text-sm" /></Field>
              <Field label="Line 1"><input value={item.line1||''} onChange={e => upd(i, 'line1', e.target.value)} className="input-field text-sm" /></Field>
              <Field label="Line 2"><input value={item.line2||''} onChange={e => upd(i, 'line2', e.target.value)} className="input-field text-sm" /></Field>
            </div>
          </div>
        ))}
        <SaveBtn onClick={() => save(data)} pending={pending} saved={saved} error={error} />
      </div>
    </div>
  )
}

// ── Services ──────────────────────────────────────────────────────────────────
const DEFAULT_SERVICES = [{ icon:'local_shipping', title:'Pharmaceutical Wholesale Supply', desc:'We supply bulk pharmaceutical products directly to pharmacies, hospitals, clinics, and distributors at competitive wholesale prices.', features:['Bulk order discounts','Flexible MOQ','Dedicated account manager','Priority stock allocation'], img:'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&q=80' }, { icon:'flight', title:'International Import & Export', desc:'Licensed pharmaceutical importer with global sourcing capabilities.', features:['WHO-GMP certified sources','Full customs clearance','Import/export licensing','Multi-country sourcing'], img:'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80' }, { icon:'thermostat', title:'Cold Chain Logistics', desc:'Specialized temperature-controlled storage and distribution for biologics and vaccines.', features:['2–8°C compliance','IoT temperature monitoring','Validated cold rooms','Real-time tracking'], img:'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80' }, { icon:'request_quote', title:'RFQ & Quotation Management', desc:'Our digital RFQ platform allows healthcare institutions to submit structured quotation requests.', features:['Multi-product RFQ','Digital quotation delivery','4–24h response time','PDF quotation download'], img:'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80' }, { icon:'verified_user', title:'Regulatory & Compliance Support', desc:'Our regulatory affairs team assists clients with product registration and compliance documentation.', features:['Product registration support','Import permit assistance','WHO/FDA/EMA compliance','Certificate of Analysis'], img:'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&q=80' }, { icon:'support_agent', title:'After-Sales & Technical Support', desc:'Dedicated customer support team available for order tracking and post-delivery support.', features:['Dedicated account manager','Order tracking portal','Documentation requests','Technical product queries'], img:'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&q=80' }]

function ServicesSection() {
  const [services, setServices] = useSectionData('services', DEFAULT_SERVICES)
  const { save, pending, saved, error } = useSectionSave('services')
  const upd = (i, k, v) => setServices(s => s.map((sv, idx) => idx === i ? { ...sv, [k]: v } : sv))
  const updF = (i, fi, v) => setServices(s => s.map((sv, idx) => idx === i ? { ...sv, features: sv.features.map((f, fIdx) => fIdx === fi ? v : f) } : sv))
  const data = services || DEFAULT_SERVICES

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
      <SectionHeader icon="build" title="Services" subtitle="6 service cards on the Services page" />
      <div className="p-6 space-y-5">
        {data.map((sv, i) => (
          <div key={i} className="bg-surface-container-low rounded-xl p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Icon">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings:"'FILL' 1" }}>{sv.icon}</span>
                  <input value={sv.icon||''} onChange={e => upd(i, 'icon', e.target.value)} className="input-field text-sm flex-1" />
                </div>
              </Field>
              <Field label="Title"><input value={sv.title||''} onChange={e => upd(i, 'title', e.target.value)} className="input-field text-sm" /></Field>
              <Field label="Description" col2><textarea value={sv.desc||''} onChange={e => upd(i, 'desc', e.target.value)} rows={2} className="input-field resize-none text-sm" /></Field>
              <div className="md:col-span-2 grid grid-cols-2 gap-2">
                {(sv.features||[]).map((f, fi) => <Field key={fi} label={`Feature ${fi+1}`}><input value={f||''} onChange={e => updF(i, fi, e.target.value)} className="input-field text-sm" /></Field>)}
              </div>
              <div className="md:col-span-2"><ImageField label="Section Image" value={sv.img} onChange={e => upd(i, 'img', e.target.value)} /></div>
            </div>
          </div>
        ))}
        <SaveBtn onClick={() => save(data)} pending={pending} saved={saved} error={error} />
      </div>
    </div>
  )
}

// ── Categories ────────────────────────────────────────────────────────────────
const DEFAULT_CATS = [{ key:'prescription', label:'Prescription Medicines', count:'2,400+ SKUs', desc:'Regulated prescription drugs sourced directly from certified manufacturers.', img:'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80', features:['WHO-GMP Certified Sources','Full Batch Traceability','Regulatory Documentation','Cold Chain Available'], examples:['Amoxicillin 500mg','Atorvastatin 20mg','Metformin HCL 1000mg','Lisinopril 10mg'] }, { key:'otc', label:'OTC Medications', count:'1,800+ SKUs', desc:'High-volume over-the-counter essentials for retail pharmacy networks.', img:'https://images.unsplash.com/photo-1550572017-edd951b55104?w=800&q=80', features:['Bulk Pricing Available','Fast Turnaround','Retail-Ready Packaging','Private Label Options'], examples:['Paracetamol 500mg','Aspirin 100mg','Ibuprofen 400mg','Vitamin C 1000mg'] }, { key:'medical-supplies', label:'Medical Supplies', count:'3,200+ SKUs', desc:'Consumables and disposables for clinical environments.', img:'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=800&q=80', features:['Sterile & Non-Sterile','Single-Use Certified','Hospital Grade Quality','Bulk Discounts'], examples:['IV Infusion Sets','Surgical Gloves','Wound Dressings','Syringes & Needles'] }, { key:'surgical', label:'Surgical Products', count:'900+ SKUs', desc:'Precision instruments and sterile disposables for operating theaters.', img:'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80', features:['ISO 13485 Certified','Sterility Guaranteed','Biocompatibility Tested','Surgeon-Grade Quality'], examples:['Scalpels & Blades','Surgical Sutures','Retractors','Electrosurgical Units'] }, { key:'laboratory', label:'Laboratory Equipment', count:'1,100+ SKUs', desc:'Diagnostic devices and consumables for clinical research facilities.', img:'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&q=80', features:['CE & FDA Cleared','Calibration Certificates','Technical Support','Reagent Compatibility'], examples:['PCR Reagents','Centrifuges','Microscope Slides','Blood Glucose Meters'] }, { key:'personal-care', label:'Personal Care & Nutraceuticals', count:'600+ SKUs', desc:'Pharmaceutical-grade vitamins, supplements, and personal care products.', img:'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&q=80', features:['GMP Certified','Third-Party Tested','Allergen Declarations','Halal & Kosher Options'], examples:['Vitamin D3 1000IU','Omega-3 Fish Oil','Zinc Supplements','Probiotic Capsules'] }]

function CategoriesSection() {
  const [cats, setCats] = useSectionData('categories', DEFAULT_CATS)
  const { save, pending, saved, error } = useSectionSave('categories')
  const upd = (i, k, v) => setCats(s => s.map((c, idx) => idx === i ? { ...c, [k]: v } : c))
  const data = cats || DEFAULT_CATS

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
      <SectionHeader icon="category" title="Product Categories" subtitle="6 category sections on the Categories page" />
      <div className="p-6 space-y-4">
        {data.map((cat, i) => (
          <div key={i} className="bg-surface-container-low rounded-xl p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Category Label"><input value={cat.label||''} onChange={e => upd(i, 'label', e.target.value)} className="input-field text-sm" /></Field>
              <Field label="SKU Count"><input value={cat.count||''} onChange={e => upd(i, 'count', e.target.value)} className="input-field text-sm" /></Field>
              <Field label="Description" col2><textarea value={cat.desc||''} onChange={e => upd(i, 'desc', e.target.value)} rows={2} className="input-field resize-none text-sm" /></Field>
              <div className="md:col-span-2"><ImageField label="Category Image" value={cat.img} onChange={e => upd(i, 'img', e.target.value)} /></div>
            </div>
          </div>
        ))}
        <SaveBtn onClick={() => save(data)} pending={pending} saved={saved} error={error} />
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id:'testimonials', icon:'format_quote', label:'Testimonials',  page:'Home & About' },
  { id:'hero',         icon:'slideshow',    label:'Hero Slides',   page:'Home' },
  { id:'company',      icon:'business',     label:'Company Info',  page:'All Pages' },
  { id:'whychooseus',  icon:'star',         label:'Why Choose Us', page:'Home & Contact' },
  { id:'team',         icon:'groups',       label:'Team',          page:'About' },
  { id:'timeline',     icon:'timeline',     label:'Timeline',      page:'About' },
  { id:'faq',          icon:'help',         label:'FAQ',           page:'Contact' },
  { id:'contact',      icon:'contact_mail', label:'Contact Info',  page:'Home & Contact' },
  { id:'services',     icon:'build',        label:'Services',      page:'Services' },
  { id:'categories',   icon:'category',     label:'Categories',    page:'Categories' },
]

export default function AdminContent() {
  const [activeTab, setActiveTab] = useState('testimonials')
  const active = TABS.find(t => t.id === activeTab)

  return (
    <AdminLayout title="Content Management" subtitle="All changes save to the database and appear live on the website immediately.">
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
        <span className="material-symbols-outlined text-green-600" style={{ fontVariationSettings:"'FILL' 1" }}>check_circle</span>
        <p className="text-sm text-green-800">
          Editing: <strong>{active?.label}</strong> — appears on <strong>{active?.page}</strong>.
          Click <strong>"Save to Database"</strong> to make changes live on the website.
        </p>
      </div>
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${activeTab === tab.id ? 'bg-primary text-white shadow-md' : 'bg-surface-container-lowest text-on-surface-variant hover:bg-secondary-container hover:text-primary'}`}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab === 'testimonials' && <TestimonialsSection />}
      {activeTab === 'hero'         && <HeroSlidesSection />}
      {activeTab === 'company'      && <CompanyInfoSection />}
      {activeTab === 'whychooseus'  && <WhyChooseUsSection />}
      {activeTab === 'team'         && <TeamSection />}
      {activeTab === 'timeline'     && <TimelineSection />}
      {activeTab === 'faq'          && <FAQSection />}
      {activeTab === 'contact'      && <ContactInfoSection />}
      {activeTab === 'services'     && <ServicesSection />}
      {activeTab === 'categories'   && <CategoriesSection />}
    </AdminLayout>
  )
}
