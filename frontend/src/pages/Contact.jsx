import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSiteContent } from '../lib/useSiteContent'

const DEFAULT_CONTACT_INFO = [
  { icon: 'location_on', title: 'Headquarters',   line1: 'Medical Park West, Floor 14', line2: 'London, UK EC1A 4HQ' },
  { icon: 'call',        title: 'Phone Support',  line1: '+44 (0) 20 7946 0123',        line2: 'Mon–Fri, 9am – 6pm GMT' },
  { icon: 'mail',        title: 'Email',          line1: 'support@pharmalinkwholesale.com', line2: 'procurement@pharmalinkwholesale.com' },
  { icon: 'schedule',    title: 'Business Hours', line1: 'Monday – Friday: 9am – 6pm GMT', line2: 'Saturday: 10am – 2pm GMT' },
]

const DEFAULT_FAQS = [
  { q: 'How quickly do you respond to RFQs?',    a: 'We respond to all RFQ submissions within 4–24 business hours with a formal quotation.' },
  { q: 'What is the minimum order quantity?',     a: 'MOQ varies by product. Many items have no minimum. Contact us for specific product requirements.' },
  { q: 'Do you handle international shipping?',   a: 'Yes. We ship to 50+ countries and handle all customs documentation and freight arrangements.' },
  { q: 'Are your products WHO-GMP certified?',    a: 'All products in our catalog are sourced exclusively from WHO-GMP certified manufacturers.' },
]

const DEFAULT_WHY = [
  { icon: 'verified',       title: 'Genuine Products',    desc: 'Direct sourcing from certified manufacturers only.' },
  { icon: 'payments',       title: 'Competitive Pricing', desc: 'Economies of scale passed directly to our clients.' },
  { icon: 'local_shipping', title: 'Fast Delivery',       desc: 'Optimized air & sea freight for rapid turnaround.' },
  { icon: 'gavel',          title: 'Licensed & Certified',desc: 'Strict adherence to regional health authorities.' },
]

const DEPARTMENTS = [
  { value: 'procurement', label: 'Procurement & RFQ' },
  { value: 'logistics',   label: 'Logistics & Shipping' },
  { value: 'regulatory',  label: 'Regulatory Affairs' },
  { value: 'support',     label: 'Customer Support' },
  { value: 'other',       label: 'Other' },
]

export default function Contact() {
  const contactInfo = useSiteContent('contact_info', DEFAULT_CONTACT_INFO)
  const faqs        = useSiteContent('faq', DEFAULT_FAQS)
  const whyUs       = useSiteContent('why_choose_us', DEFAULT_WHY)
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', company: '', department: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 900))
    setSubmitted(true)
    setLoading(false)
  }

  return (
    <div className="bg-background text-on-surface font-body">

      {/* ── 1. Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[500px] flex items-center overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1800&q=85"
            alt="Contact PharmaLink"
            className="w-full h-full object-cover opacity-40"
            style={{ maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)' }}
          />
        </div>
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-transparent" />
        <div className="relative z-10 max-w-screen-2xl mx-auto px-8 w-full flex flex-col items-center text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/20 text-primary-fixed-dim text-xs font-bold tracking-widest uppercase mb-6 backdrop-blur-sm border border-primary/30">
            Get In Touch
          </span>
          <h1 className="text-white font-headline text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-[1.1] max-w-4xl">
            Let's Secure Your <span className="text-blue-400">Supply Chain</span>
          </h1>
          <p className="text-slate-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto font-body leading-relaxed">
            Our procurement experts are ready to assist with bulk orders, regular supplies, or specialized medical equipment imports.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/rfq" className="signature-gradient text-white px-10 py-4 rounded-lg font-headline font-bold text-base hover:scale-[1.02] transition-all shadow-2xl inline-flex items-center gap-2">
              Request Quotation
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
            <Link to="/products" className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-10 py-4 rounded-lg font-headline font-bold text-base hover:bg-white/20 transition-all">
              View Products
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. Contact info + Form ──────────────────────────────────────────── */}
      <section className="py-24 px-8 bg-surface-container-highest/30">
        <div className="max-w-screen-2xl mx-auto grid lg:grid-cols-2 gap-20">

          {/* Left — info */}
          <div>
            <h2 className="text-primary font-headline text-4xl font-extrabold mb-8">Contact Information</h2>
            <p className="text-on-surface-variant text-lg mb-12 leading-relaxed">
              Reach out to our team for procurement inquiries, logistics support, or regulatory assistance. We're here to help.
            </p>

            <div className="space-y-8 mb-12">
              {(contactInfo || DEFAULT_CONTACT_INFO).map((item) => (
                <div key={item.title} className="flex items-start gap-6">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md flex-shrink-0">
                    <span className="material-symbols-outlined text-primary">{item.icon}</span>
                  </div>
                  <div>
                    <h6 className="font-headline font-bold mb-1">{item.title}</h6>
                    <p className="text-sm text-on-surface-variant leading-relaxed">{item.line1}</p>
                    <p className="text-sm text-on-surface-variant leading-relaxed">{item.line2}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Map */}
            <div className="rounded-2xl overflow-hidden shadow-lg h-64 bg-surface-container-low">
              <iframe
                title="PharmaLink Office Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2482.0!2d-0.0955!3d51.5194!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48761b4e5e5e5e5e%3A0x5e5e5e5e5e5e5e5e!2sLondon%20EC1A!5e0!3m2!1sen!2suk!4v1700000000000"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="grayscale hover:grayscale-0 transition-all duration-500"
              />
            </div>
          </div>

          {/* Right — form */}
          <div className="bg-white p-10 rounded-2xl shadow-xl">
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="material-symbols-outlined text-green-600 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <h3 className="font-headline font-extrabold text-2xl text-on-surface mb-3">Message Sent!</h3>
                <p className="text-on-surface-variant mb-6 leading-relaxed">
                  Thank you for reaching out. Our team will get back to you within 1 business day.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ firstName: '', lastName: '', email: '', phone: '', company: '', department: '', message: '' }) }}
                  className="text-primary font-bold hover:underline text-sm"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-headline font-bold text-2xl text-on-surface mb-2">Send a Quick Message</h3>
                <p className="text-on-surface-variant text-sm mb-8">Fill in the form and we'll respond within 1 business day.</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-outline uppercase tracking-widest ml-1">First Name *</label>
                      <input required type="text" value={form.firstName} onChange={set('firstName')} placeholder="John" className="input-field" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-outline uppercase tracking-widest ml-1">Last Name *</label>
                      <input required type="text" value={form.lastName} onChange={set('lastName')} placeholder="Smith" className="input-field" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-outline uppercase tracking-widest ml-1">Email Address *</label>
                    <input required type="email" value={form.email} onChange={set('email')} placeholder="you@company.com" className="input-field" />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-outline uppercase tracking-widest ml-1">Phone Number</label>
                      <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+1 555 000 0000" className="input-field" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-outline uppercase tracking-widest ml-1">Company Name</label>
                      <input type="text" value={form.company} onChange={set('company')} placeholder="Metro General Health" className="input-field" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-outline uppercase tracking-widest ml-1">Department</label>
                    <div className="relative">
                      <select value={form.department} onChange={set('department')} className="input-field appearance-none">
                        <option value="">Select department...</option>
                        {DEPARTMENTS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-3 text-on-surface-variant pointer-events-none">expand_more</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-outline uppercase tracking-widest ml-1">Message *</label>
                    <textarea
                      required rows={4}
                      value={form.message} onChange={set('message')}
                      placeholder="How can we help you? Describe your procurement needs..."
                      className="input-field resize-none"
                    />
                  </div>

                  {/* Info tip — same pattern as RFQ wizard */}
                  <div className="bg-blue-50/50 p-4 rounded-xl flex items-start space-x-3 border border-blue-100/20">
                    <span className="material-symbols-outlined text-primary text-xl">info</span>
                    <p className="text-sm text-blue-900 leading-relaxed">
                      <span className="font-bold">Privacy Note:</span> Your information is protected and will only be used for official communications.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="signature-gradient text-white font-headline font-bold px-10 py-3 rounded-xl shadow-lg flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all w-full justify-center disabled:opacity-70"
                  >
                    {loading ? (
                      <><span className="material-symbols-outlined animate-spin">progress_activity</span> Sending...</>
                    ) : (
                      <><span className="material-symbols-outlined">send</span> Send Message</>
                    )}
                  </button>

                  <p className="text-xs text-on-surface-variant text-center">
                    Need a quotation?{' '}
                    <Link to="/rfq" className="text-primary font-bold hover:underline">Submit an RFQ →</Link>
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── 3. Why Choose Us band ───────────────────────────────────────────── */}
      <section className="bg-primary text-white py-20 px-8">
        <div className="max-w-screen-2xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
            {(whyUs || DEFAULT_WHY).map((item) => (
              <div key={item.title} className="text-center">
                <span className="material-symbols-outlined text-4xl mb-4 text-blue-300 block" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                <h4 className="font-headline font-bold text-lg mb-2">{item.title}</h4>
                <p className="text-blue-200 text-xs px-4">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-surface-container-low px-8">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex justify-between items-end mb-16">
            <div>
              <h2 className="text-on-surface font-headline text-3xl font-extrabold mb-4">Frequently Asked Questions</h2>
              <p className="text-on-surface-variant">Quick answers to common procurement questions.</p>
            </div>
            <Link to="/rfq" className="text-primary font-headline font-bold hover:underline">Submit an RFQ</Link>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {(faqs || DEFAULT_FAQS).map((faq) => (
              <div key={faq.q} className="bg-surface-container-lowest p-8 rounded-xl hover:shadow-xl transition-all group">
                <div className="w-10 h-10 bg-secondary-container rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                  <span className="material-symbols-outlined text-primary group-hover:text-white" style={{ fontVariationSettings: "'FILL' 1" }}>help</span>
                </div>
                <h3 className="font-headline font-bold text-lg text-on-surface mb-3">{faq.q}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Process strip ────────────────────────────────────────────────── */}
      <section className="py-24 bg-surface px-8">
        <div className="max-w-screen-xl mx-auto text-center">
          <h2 className="text-on-surface font-headline text-3xl font-extrabold mb-16">The Procurement Process</h2>
          <div className="relative flex flex-col md:flex-row justify-between items-center gap-12 md:gap-4">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-4/5 h-0.5 bg-outline-variant hidden md:block" />
            {[
              { n: 1, label: 'Browse',        desc: 'Explore our extensive verified catalog.' },
              { n: 2, label: 'Add to RFQ',    desc: 'Select quantities and specific requirements.' },
              { n: 3, label: 'Submit',         desc: 'Provide facility details and delivery preference.' },
              { n: 4, label: 'Receive Quote', desc: 'Get a formalized clinical quotation within 24h.' },
            ].map((s) => (
              <div key={s.n} className="relative z-10 flex flex-col items-center max-w-[200px]">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white font-headline font-bold text-xl mb-6 shadow-lg shadow-primary/30">{s.n}</div>
                <h5 className="font-headline font-bold mb-2">{s.label}</h5>
                <p className="text-xs text-on-surface-variant text-center">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
