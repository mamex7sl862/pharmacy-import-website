import { Link } from 'react-router-dom'

const SERVICES = [
  {
    icon: 'local_shipping',
    title: 'Pharmaceutical Wholesale Supply',
    desc: 'We supply bulk pharmaceutical products directly to pharmacies, hospitals, clinics, and distributors at competitive wholesale prices. Our catalog covers 10,000+ SKUs across all therapeutic categories.',
    features: ['Bulk order discounts', 'Flexible MOQ', 'Dedicated account manager', 'Priority stock allocation'],
    img: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&q=80',
  },
  {
    icon: 'flight',
    title: 'International Import & Export',
    desc: 'Licensed pharmaceutical importer with global sourcing capabilities. We handle all regulatory documentation, customs clearance, and international freight for seamless cross-border procurement.',
    features: ['WHO-GMP certified sources', 'Full customs clearance', 'Import/export licensing', 'Multi-country sourcing'],
    img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
  },
  {
    icon: 'thermostat',
    title: 'Cold Chain Logistics',
    desc: 'Specialized temperature-controlled storage and distribution for biologics, vaccines, and temperature-sensitive pharmaceuticals. IoT-monitored throughout the entire supply chain.',
    features: ['2–8°C compliance', 'IoT temperature monitoring', 'Validated cold rooms', 'Real-time tracking'],
    img: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80',
  },
  {
    icon: 'request_quote',
    title: 'RFQ & Quotation Management',
    desc: 'Our digital RFQ platform allows healthcare institutions to submit structured quotation requests for multiple products simultaneously. Receive formal quotations within 4–24 hours.',
    features: ['Multi-product RFQ', 'Digital quotation delivery', '4–24h response time', 'PDF quotation download'],
    img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80',
  },
  {
    icon: 'verified_user',
    title: 'Regulatory & Compliance Support',
    desc: 'Our regulatory affairs team assists clients with product registration, import permits, and compliance documentation for all major international markets.',
    features: ['Product registration support', 'Import permit assistance', 'WHO/FDA/EMA compliance', 'Certificate of Analysis'],
    img: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&q=80',
  },
  {
    icon: 'support_agent',
    title: 'After-Sales & Technical Support',
    desc: 'Dedicated customer support team available for order tracking, product queries, documentation requests, and post-delivery support. Available Monday–Friday, 9am–6pm GMT.',
    features: ['Dedicated account manager', 'Order tracking portal', 'Documentation requests', 'Technical product queries'],
    img: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&q=80',
  },
]

const PROCESS = [
  { step: '01', title: 'Submit RFQ', desc: 'Use our digital RFQ wizard to specify products, quantities, and delivery requirements.' },
  { step: '02', title: 'Quotation Review', desc: 'Our team reviews your request and prepares a competitive formal quotation within 4–24 hours.' },
  { step: '03', title: 'Order Confirmation', desc: 'Approve the quotation and confirm your order. We handle all procurement and logistics.' },
  { step: '04', title: 'Delivery & Documentation', desc: 'Receive your order with full regulatory documentation, CoA, and delivery confirmation.' },
]

const STATS = [
  { value: '10,000+', label: 'Products in Catalog' },
  { value: '50+', label: 'Countries Served' },
  { value: '4–24h', label: 'Quotation Response' },
  { value: '99.8%', label: 'Order Accuracy' },
]

export default function Services() {
  return (
    <>
      {/* Hero */}
      <section className="relative bg-slate-900 py-28 px-8 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1600&q=80"
            alt="Services"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent" />
        </div>
        <div className="relative z-10 max-w-screen-2xl mx-auto px-8 w-full flex flex-col items-center text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/20 text-primary-fixed-dim text-xs font-bold tracking-widest uppercase mb-6 border border-primary/30">
            What We Offer
          </span>
          <h1 className="text-white font-headline text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-[1.1] max-w-4xl">
            End-to-End Pharmaceutical <span className="text-blue-400">Supply Services</span>
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
            From wholesale supply and international import to cold chain logistics and regulatory support — we cover every step of the pharmaceutical procurement journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/rfq" className="signature-gradient text-white px-8 py-4 rounded-lg font-headline font-bold hover:scale-[1.02] transition-all shadow-xl inline-flex items-center gap-2">
              Request a Quotation
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary py-14 px-8">
        <div className="max-w-screen-2xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-white font-headline font-extrabold text-4xl mb-2">{s.value}</p>
              <p className="text-blue-200 text-sm uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services grid */}
      <section className="py-24 px-8 max-w-screen-2xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-primary uppercase tracking-widest mb-4 block">Our Services</span>
          <h2 className="font-headline font-extrabold text-4xl text-on-surface">Everything You Need in One Partner</h2>
          <p className="text-on-surface-variant mt-4 max-w-2xl mx-auto">
            PharmaLink provides a complete suite of pharmaceutical supply chain services, designed to simplify procurement for healthcare institutions of all sizes.
          </p>
        </div>

        <div className="space-y-20">
          {SERVICES.map((svc, i) => (
            <div key={svc.title} className={`grid md:grid-cols-2 gap-16 items-center ${i % 2 !== 0 ? 'md:grid-flow-dense' : ''}`}>
              {/* Image */}
              <div className={`relative ${i % 2 !== 0 ? 'md:col-start-2' : ''}`}>
                <div className="rounded-2xl overflow-hidden shadow-2xl aspect-[4/3]">
                  <img
                    src={svc.img}
                    alt={svc.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>

              {/* Content */}
              <div className={i % 2 !== 0 ? 'md:col-start-1 md:row-start-1' : ''}>
                <div className="w-14 h-14 bg-secondary-container rounded-xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{svc.icon}</span>
                </div>
                <h3 className="font-headline font-extrabold text-3xl text-on-surface mb-4">{svc.title}</h3>
                <p className="text-on-surface-variant text-lg leading-relaxed mb-8">{svc.desc}</p>
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {svc.features.map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      <span className="text-sm font-medium text-on-surface">{f}</span>
                    </div>
                  ))}
                </div>
                <Link to="/rfq" className="signature-gradient text-white px-8 py-3 rounded-xl font-headline font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all inline-flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">request_quote</span>
                  Request This Service
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-surface-container-low px-8">
        <div className="max-w-screen-xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-primary uppercase tracking-widest mb-4 block">Simple Process</span>
            <h2 className="font-headline font-extrabold text-4xl text-on-surface">How Our Service Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {PROCESS.map((p, i) => (
              <div key={p.step} className="relative">
                {i < PROCESS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-outline-variant/30 z-0" style={{ width: 'calc(100% - 2rem)' }} />
                )}
                <div className="relative z-10 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary text-white font-headline font-extrabold text-xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/30">
                    {p.step}
                  </div>
                  <h3 className="font-headline font-bold text-lg text-on-surface mb-2">{p.title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-8">
        <div className="max-w-screen-xl mx-auto">
          <div className="bg-primary rounded-3xl p-12 md:p-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10 grid md:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="font-headline font-extrabold text-4xl text-white mb-4">Ready to get started?</h2>
                <p className="text-blue-200 text-lg leading-relaxed">
                  Submit your first RFQ today and receive a competitive quotation from our procurement specialists within 24 hours.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 md:justify-end">
                <Link to="/rfq" className="bg-white text-primary px-8 py-4 rounded-xl font-headline font-bold hover:scale-[1.02] transition-all shadow-xl inline-flex items-center gap-2 justify-center">
                  Submit RFQ Now
                  <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
                <Link to="/contact" className="bg-white/10 border border-white/20 text-white px-8 py-4 rounded-xl font-headline font-bold hover:bg-white/20 transition-all inline-flex items-center gap-2 justify-center">
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
