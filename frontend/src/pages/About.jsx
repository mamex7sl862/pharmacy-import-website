import { Link } from 'react-router-dom'

// ─── Data ────────────────────────────────────────────────────────────────────

const STATS = [
  { value: '15+', label: 'Years of Experience' },
  { value: '50+', label: 'Countries Served' },
  { value: '10,000+', label: 'Products in Catalog' },
  { value: '99.8%', label: 'Order Accuracy Rate' },
]

const VALUES = [
  { icon: 'verified_user',  title: 'Regulatory Compliance', desc: 'Every product meets WHO, FDA, and EMA guidelines with full traceability from manufacturer to delivery.' },
  { icon: 'thermostat',     title: 'Cold Chain Integrity',  desc: 'IoT-monitored cold chain logistics ensuring 2–8°C compliance for temperature-sensitive pharmaceuticals.' },
  { icon: 'handshake',      title: 'Trusted Partnerships',  desc: 'We work exclusively with certified manufacturers and licensed distributors, built on transparency.' },
  { icon: 'speed',          title: 'Operational Efficiency',desc: 'Our digital RFQ platform reduces procurement cycle time by up to 60%.' },
]

const TEAM = [
  { name: 'Dr. Helena Richardson', role: 'Chief Executive Officer',      bio: '20+ years in pharmaceutical supply chain. Former VP at Novartis Global Distribution.', img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80' },
  { name: 'James Okafor',          role: 'Head of Regulatory Affairs',   bio: 'Expert in international pharmaceutical compliance. Certified by WHO and EMA frameworks.',  img: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80' },
  { name: 'Dr. Mei Lin',           role: 'Director of Quality Assurance',bio: 'PhD in Pharmaceutical Sciences. Oversees all product verification and cold chain protocols.', img: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80' },
  { name: 'Carlos Mendez',         role: 'VP of Global Logistics',       bio: 'Specialist in air and sea freight for temperature-sensitive cargo across 50+ countries.',   img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80' },
]

const CERTIFICATIONS = [
  { icon: 'verified',           label: 'WHO-GMP Certified',  sub: 'Good Manufacturing Practice' },
  { icon: 'gavel',              label: 'FDA Registered',      sub: 'US Food & Drug Administration' },
  { icon: 'shield',             label: 'EMA Compliant',       sub: 'European Medicines Agency' },
  { icon: 'workspace_premium',  label: 'ISO 9001:2015',       sub: 'Quality Management System' },
  { icon: 'local_shipping',     label: 'IATA Certified',      sub: 'Air Freight Dangerous Goods' },
  { icon: 'thermostat',         label: 'GDP Compliant',       sub: 'Good Distribution Practice' },
]

const MILESTONES = [
  { year: '2009', title: 'Founded',           desc: 'PharmaLink established in London as a regional pharmaceutical wholesaler.' },
  { year: '2012', title: 'WHO Certification', desc: 'Achieved WHO-GMP certification, opening doors to international markets.' },
  { year: '2015', title: 'Cold Chain Launch', desc: 'Launched dedicated cold chain division with IoT temperature monitoring.' },
  { year: '2018', title: 'Digital Platform',  desc: 'Introduced the first version of our digital RFQ procurement portal.' },
  { year: '2021', title: 'Global Expansion',  desc: 'Expanded operations to 50+ countries across 6 continents.' },
  { year: '2024', title: 'PharmaLink Pro',    desc: 'Launched PharmaLink Pro — the next generation of B2B pharmaceutical procurement.' },
]

// ─── Page ────────────────────────────────────────────────────────────────────

export default function About() {
  return (
    <div className="bg-background text-on-surface font-body">

      {/* ── 1. Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[600px] flex items-center overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1800&q=85"
            alt="Pharmaceutical facility"
            className="w-full h-full object-cover opacity-40"
            style={{ maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)' }}
          />
        </div>
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-transparent" />
        <div className="relative z-10 max-w-screen-2xl mx-auto px-8 w-full flex flex-col items-center text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/20 text-primary-fixed-dim text-xs font-bold tracking-widest uppercase mb-6 backdrop-blur-sm border border-primary/30">
            Our Story
          </span>
          <h1 className="text-white font-headline text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-[1.1] max-w-4xl">
            The Essential Bridge in Healthcare Supply Chains
          </h1>
          <p className="text-slate-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto font-body leading-relaxed">
            Since 2009, PharmaLink has connected medical institutions worldwide with precision-sourced pharmaceuticals, surgical supplies, and laboratory equipment.
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

      {/* ── 2. Stats band ───────────────────────────────────────────────────── */}
      <section className="bg-primary text-white py-16 px-8">
        <div className="max-w-screen-2xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-12">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-headline font-extrabold text-4xl md:text-5xl mb-2">{s.value}</p>
              <p className="text-blue-200 text-xs uppercase tracking-wider font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. Mission & Vision ─────────────────────────────────────────────── */}
      <section className="py-24 px-8 max-w-screen-2xl mx-auto">
        <div className="grid md:grid-cols-2 gap-20 items-center">
          {/* Image */}
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl aspect-[3/4]">
              <img
                src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&q=90"
                alt="Doctor in white coat with stethoscope"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="absolute -bottom-10 -right-10 bg-white p-8 rounded-2xl shadow-xl border border-slate-100 hidden lg:block max-w-xs">
              <p className="text-primary font-headline font-extrabold text-4xl mb-1">15+</p>
              <p className="text-on-surface-variant font-label text-sm uppercase tracking-wider">Years of Regulatory Excellence</p>
            </div>
          </div>

          {/* Text */}
          <div>
            <h2 className="text-primary font-headline text-4xl font-extrabold mb-8">
              Precision-Sourced. Compliance-First. Globally Delivered.
            </h2>
            <div className="space-y-6 text-on-surface-variant text-lg leading-relaxed">
              <p>
                PharmaLink Pro operates at the intersection of medical necessity and logistical precision. As a licensed global wholesaler, we remove the complexities of international pharmaceutical procurement.
              </p>
              <p>
                Our commitment to <strong className="text-on-surface">Regulatory Compliance</strong> ensures that every SKU in our catalog meets rigorous international standards, including WHO, FDA, and EMA guidelines. We prioritize clinical integrity from origin to delivery.
              </p>
            </div>

            {/* Mission / Vision */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { icon: 'flag',       title: 'Our Mission', text: 'To make pharmaceutical procurement transparent, efficient, and accessible for every healthcare institution worldwide.' },
                { icon: 'visibility', title: 'Our Vision',  text: 'A world where no patient goes without medicine due to supply chain failures or procurement inefficiencies.' },
              ].map((item) => (
                <div key={item.title} className="bg-surface-container-low p-6 rounded-2xl">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                  </div>
                  <h3 className="font-headline font-bold text-on-surface mb-2">{item.title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>

            {/* Badges */}
            <div className="mt-10 grid grid-cols-2 gap-6">
              {[
                { icon: 'verified_user', title: 'Fully Licensed',  sub: 'Global Export Permits' },
                { icon: 'thermostat',    title: 'Cold Chain',       sub: 'Temperature Controlled' },
              ].map((b) => (
                <div key={b.title} className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>{b.icon}</span>
                  <div>
                    <p className="font-headline font-bold text-on-surface">{b.title}</p>
                    <p className="text-xs text-on-surface-variant">{b.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Core Values ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-surface-container-low px-8">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex justify-between items-end mb-16">
            <div>
              <h2 className="text-on-surface font-headline text-3xl font-extrabold mb-4">Our Core Values</h2>
              <p className="text-on-surface-variant">The principles that guide every decision we make.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v) => (
              <div key={v.title} className="bg-surface-container-lowest p-8 rounded-xl hover:shadow-xl transition-all group">
                <div className="w-14 h-14 bg-secondary-container rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                  <span className="material-symbols-outlined text-primary group-hover:text-white" style={{ fontVariationSettings: "'FILL' 1" }}>{v.icon}</span>
                </div>
                <h3 className="font-headline font-bold text-xl mb-3">{v.title}</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Timeline ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-8 max-w-screen-2xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-on-surface font-headline text-3xl font-extrabold mb-4">15 Years of Growth</h2>
          <p className="text-on-surface-variant">Key milestones in our journey to becoming a global pharmaceutical leader.</p>
        </div>
        <div className="relative">
          {/* Center line */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-outline-variant/30 hidden md:block" />
          <div className="space-y-10">
            {MILESTONES.map((m, i) => (
              <div key={m.year} className={`relative flex flex-col md:flex-row items-center gap-8 ${i % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
                <div className={`flex-1 ${i % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                  <div className={`bg-surface-container-lowest p-8 rounded-2xl shadow-sm inline-block max-w-md ${i % 2 === 0 ? 'ml-auto' : 'mr-auto'}`}>
                    <span className="text-xs font-bold text-primary uppercase tracking-widest mb-2 block">{m.year}</span>
                    <h3 className="font-headline font-bold text-xl text-on-surface mb-2">{m.title}</h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed">{m.desc}</p>
                  </div>
                </div>
                {/* Dot */}
                <div className="hidden md:flex w-12 h-12 rounded-full bg-primary text-white items-center justify-center font-headline font-bold text-sm flex-shrink-0 shadow-lg shadow-primary/30 z-10">
                  {m.year.slice(2)}
                </div>
                <div className="flex-1" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Team ─────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-surface-container-low px-8">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex justify-between items-end mb-16">
            <div>
              <h2 className="text-on-surface font-headline text-3xl font-extrabold mb-4">Leadership Team</h2>
              <p className="text-on-surface-variant">The people behind PharmaLink's global operations.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {TEAM.map((member) => (
              <div key={member.name} className="bg-surface-container-lowest rounded-xl overflow-hidden group hover:shadow-xl transition-all">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={member.img}
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-headline font-bold text-lg text-on-surface mb-1">{member.name}</h3>
                  <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3">{member.role}</p>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. Certifications ───────────────────────────────────────────────── */}
      <section className="py-24 px-8 max-w-screen-2xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-on-surface font-headline text-3xl font-extrabold mb-4">Certifications &amp; Accreditations</h2>
          <p className="text-on-surface-variant max-w-xl mx-auto">Every product we distribute is backed by internationally recognized certifications and rigorous quality controls.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {CERTIFICATIONS.map((cert) => (
            <div key={cert.label} className="bg-surface-container-lowest p-6 rounded-xl text-center hover:shadow-xl transition-all group">
              <div className="w-14 h-14 bg-secondary-container rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-primary transition-colors">
                <span className="material-symbols-outlined text-primary group-hover:text-white" style={{ fontVariationSettings: "'FILL' 1" }}>{cert.icon}</span>
              </div>
              <p className="font-headline font-bold text-sm text-on-surface mb-1">{cert.label}</p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{cert.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 8. Testimonials ─────────────────────────────────────────────────── */}
      <section className="py-24 px-8 max-w-screen-2xl mx-auto overflow-hidden">
        <h2 className="text-center text-on-surface font-headline text-3xl font-extrabold mb-16">Trusted by Healthcare Leaders</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {[
            { name: 'Dr. Sarah Jenkins', company: 'Hospital Administrator, St. Jude Medical', comment: "The reliability of PharmaLink's cold chain logistics has been transformative for our oncology department. We never have to worry about the integrity of our temperature-sensitive imports.", img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&q=80' },
            { name: 'Mark Thompson',     company: 'Owner, City Health Pharmacies',            comment: "Procuring rare medications used to be a nightmare of paperwork. PharmaLink's RFQ portal simplifies the entire process, letting me focus on patient care rather than logistics.",    img: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&q=80' },
          ].map((t) => (
            <div key={t.name} className="bg-surface-container-low p-10 rounded-2xl relative">
              <span className="material-symbols-outlined text-primary/20 text-6xl absolute top-6 right-8">format_quote</span>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden">
                  <img src={t.img} alt={t.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-headline font-bold text-on-surface">{t.name}</p>
                  <p className="text-xs text-on-surface-variant">{t.company}</p>
                </div>
              </div>
              <p className="text-on-surface font-body italic leading-relaxed">"{t.comment}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 9. CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-24 px-8 bg-surface-container-highest/30">
        <div className="max-w-screen-2xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <h2 className="text-primary font-headline text-4xl font-extrabold mb-6">Ready to Partner with PharmaLink?</h2>
            <p className="text-on-surface-variant text-lg mb-8 leading-relaxed">
              Join thousands of healthcare institutions that trust PharmaLink for their pharmaceutical procurement needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/rfq" className="signature-gradient text-white px-10 py-4 rounded-lg font-headline font-bold text-base hover:scale-[1.02] transition-all shadow-2xl inline-flex items-center gap-2 justify-center">
                Request a Quotation
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
              <Link to="/contact" className="bg-white/10 border border-outline-variant text-on-surface px-10 py-4 rounded-lg font-headline font-bold text-base hover:bg-surface-container transition-all inline-flex items-center gap-2 justify-center">
                Contact Us
              </Link>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&q=80"
                alt="Laboratory"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
