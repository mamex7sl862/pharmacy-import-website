import { Link } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import useRFQStore from '../store/rfqStore'

// Hero slides — each with its own image, label, headline accent, and subtitle
const HERO_SLIDES = [
  {
    img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1800&q=85',
    badge: 'Global Distribution Excellence',
    accent: 'Import Solutions',
    subtitle: 'Supplying medical institutions worldwide with precision-sourced medications, surgical supplies, and laboratory equipment through a certified cold-chain network.',
  },
  {
    img: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=1800&q=85',
    badge: 'WHO-GMP Certified Sources',
    accent: 'Pharmaceutical Wholesale',
    subtitle: 'Every product in our catalog meets rigorous international standards including WHO, FDA, and EMA guidelines — from origin to delivery.',
  },
  {
    img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1800&q=85',
    badge: 'Cold Chain Specialists',
    accent: 'Temperature-Controlled Logistics',
    subtitle: 'IoT-monitored cold chain handling for temperature-sensitive pharmaceuticals. 2–8°C compliance guaranteed throughout the entire supply chain.',
  },
  {
    img: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1800&q=85',
    badge: 'Surgical & Medical Supplies',
    accent: 'Sterile & Certified',
    subtitle: 'Precision instruments, sterile disposables, and medical consumables for operating theaters and clinical environments worldwide.',
  },
]

function HeroSlideshow() {
  const [current, setCurrent] = useState(0)
  const [prev, setPrev] = useState(null)
  const [transitioning, setTransitioning] = useState(false)

  const goTo = useCallback((index) => {
    if (transitioning || index === current) return
    setPrev(current)
    setTransitioning(true)
    setCurrent(index)
    setTimeout(() => {
      setPrev(null)
      setTransitioning(false)
    }, 800)
  }, [current, transitioning])

  const next = useCallback(() => goTo((current + 1) % HERO_SLIDES.length), [current, goTo])
  const goBack = useCallback(() => goTo((current - 1 + HERO_SLIDES.length) % HERO_SLIDES.length), [current, goTo])

  // Auto-advance every 5 seconds
  useEffect(() => {
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next])

  const slide = HERO_SLIDES[current]

  return (
    <section className="relative min-h-[870px] flex items-center overflow-hidden bg-slate-900">
      {/* Background images — crossfade */}
      {HERO_SLIDES.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 z-0 transition-opacity duration-[800ms] ease-in-out"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <img
            src={s.img}
            alt=""
            className="w-full h-full object-cover"
            style={{ opacity: 0.38 }}
          />
        </div>
      ))}

      {/* Persistent dark overlay */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-br from-slate-900/90 via-blue-950/70 to-slate-900/85" />

      {/* Content */}
      <div className="relative z-10 max-w-screen-2xl mx-auto px-8 w-full">
        <div className="max-w-3xl">
          <span
            key={`badge-${current}`}
            className="inline-block px-4 py-1.5 rounded-full bg-primary/20 text-primary-fixed-dim text-xs font-bold tracking-widest uppercase mb-6 backdrop-blur-sm border border-primary/30 animate-fade-in"
          >
            {slide.badge}
          </span>
          <h1
            key={`h1-${current}`}
            className="text-white font-headline text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] animate-fade-in"
          >
            Trusted Pharmaceutical Wholesale &amp;{' '}
            <span className="text-blue-400">{slide.accent}</span>
          </h1>
          <p
            key={`p-${current}`}
            className="text-slate-300 text-lg md:text-xl mb-12 max-w-xl font-body leading-relaxed animate-fade-in"
          >
            {slide.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/rfq" className="signature-gradient text-white px-10 py-5 rounded-lg font-headline font-bold text-lg hover:scale-[1.02] transition-all shadow-2xl">
              Request Quotation
            </Link>
            <Link to="/products" className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-10 py-5 rounded-lg font-headline font-bold text-lg hover:bg-white/20 transition-all">
              View Products
            </Link>
          </div>
        </div>
      </div>

      {/* Slide controls — bottom left */}
      <div className="absolute bottom-10 left-8 z-10 flex items-center gap-4">
        {/* Prev / Next arrows */}
        <button
          onClick={goBack}
          className="w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-all backdrop-blur-sm"
          aria-label="Previous slide"
        >
          <span className="material-symbols-outlined text-lg">chevron_left</span>
        </button>
        <button
          onClick={next}
          className="w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-all backdrop-blur-sm"
          aria-label="Next slide"
        >
          <span className="material-symbols-outlined text-lg">chevron_right</span>
        </button>

        {/* Dot indicators */}
        <div className="flex items-center gap-2 ml-2">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`transition-all duration-300 rounded-full ${
                i === current
                  ? 'w-8 h-2 bg-white'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 h-0.5 bg-white/10">
        <div
          key={current}
          className="h-full bg-primary"
          style={{
            animation: 'slideProgress 5s linear forwards',
          }}
        />
      </div>
    </section>
  )
}

const CATEGORIES = [
  { key: 'otc', label: 'OTC Medications', icon: 'pill', desc: 'High-volume over-the-counter essentials for retail pharmacy networks.' },
  { key: 'surgical', label: 'Surgical Supplies', icon: 'content_cut', desc: 'Precision instruments and sterile disposables for operating theaters.' },
  { key: 'laboratory', label: 'Lab Equipment', icon: 'biotech', desc: 'Diagnostic devices and consumables for clinical research facilities.' },
  { key: 'personal-care', label: 'Nutraceuticals', icon: 'nutrition', desc: 'Pharmaceutical grade vitamins and supplements for holistic care.' },
]

const WHY_US = [
  { icon: 'verified', title: 'Genuine Products', desc: 'Direct sourcing from certified manufacturers only.' },
  { icon: 'payments', title: 'Competitive Pricing', desc: 'Economies of scale passed directly to our clients.' },
  { icon: 'local_shipping', title: 'Fast Delivery', desc: 'Optimized air & sea freight for rapid turnaround.' },
  { icon: 'gavel', title: 'Licensed & Compliant', desc: 'Strict adherence to regional health authorities.' },
]

const STEPS = [
  { n: 1, label: 'Browse', desc: 'Explore our extensive verified catalog.' },
  { n: 2, label: 'Add to RFQ', desc: 'Select quantities and specific requirements.' },
  { n: 3, label: 'Submit', desc: 'Provide facility details and delivery preference.' },
  { n: 4, label: 'Receive Quote', desc: 'Get a formalized clinical quotation within 24h.' },
]

const PLACEHOLDER_PRODUCTS = [
  { id: 'p1', name: 'Amoxicillin 500mg', cat: 'Antibiotics', sub: 'Pack of 100 Capsules • Pharmacia Ltd', imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80' },
  { id: 'p2', name: 'Dettol Antiseptic', cat: 'Antiseptics', sub: '500ml Bottle • RB Health', imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&q=80' },
  { id: 'p3', name: 'Precision Scalpel', cat: 'Surgical', sub: 'No. 11 Stainless • MedBlade', imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&q=80' },
  { id: 'p4', name: 'Vitamin C 1000mg', cat: 'Vitamins', sub: '90 Effervescent Tabs • NutraCare', imageUrl: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=400&q=80' },
]

const TESTIMONIALS_FALLBACK = [
  { id: 1, customerName: 'Dr. Sarah Jenkins', companyName: 'Hospital Administrator, St. Jude Medical', comment: "The reliability of PharmaLink's cold chain logistics has been transformative for our oncology department. We never have to worry about the integrity of our temperature-sensitive imports.", avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&q=80' },
  { id: 2, customerName: 'Mark Thompson', companyName: 'Owner, City Health Pharmacies', comment: "Procuring rare medications used to be a nightmare of paperwork. PharmaLink's RFQ portal simplifies the entire process, letting me focus on patient care rather than logistics.", avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&q=80' },
]

function FeaturedCard({ product }) {
  const { addProduct, selectedProducts } = useRFQStore()
  const isAdded = selectedProducts.some((p) => p.productId === product.id)
  return (
    <div className="bg-surface-container-lowest rounded-xl overflow-hidden group">
      <div className="aspect-square bg-surface-container overflow-hidden">
        {product.imageUrl
          ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-6xl text-outline/20">medication</span></div>}
      </div>
      <div className="p-6">
        <p className="text-[10px] uppercase tracking-tighter text-on-surface-variant font-bold mb-1">{product.category || product.cat}</p>
        <h3 className="font-headline font-bold text-lg mb-1">{product.name}</h3>
        <p className="text-xs text-on-surface-variant mb-4">{product.packageSize || product.sub}</p>
        <button
          onClick={() => !isAdded && addProduct(product)}
          className={`w-full py-2 border-2 font-headline font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${isAdded ? 'border-secondary-container bg-secondary-container text-on-secondary-container' : 'border-primary text-primary hover:bg-primary hover:text-white'}`}
        >
          <span className="material-symbols-outlined text-sm">{isAdded ? 'check' : 'add_shopping_cart'}</span>
          {isAdded ? 'Added' : 'Add to RFQ'}
        </button>
      </div>
    </div>
  )
}

export default function Home() {
  const { data: featured } = useQuery({ queryKey: ['featured-products'], queryFn: () => api.get('/products/featured').then((r) => r.data) })
  const { data: testimonials } = useQuery({ queryKey: ['testimonials'], queryFn: () => api.get('/content/testimonials').then((r) => r.data) })
  const displayProducts = featured?.length > 0 ? featured.slice(0, 4) : PLACEHOLDER_PRODUCTS
  const displayTestimonials = testimonials?.length > 0 ? testimonials.slice(0, 2) : TESTIMONIALS_FALLBACK

  return (
    <>
      {/* 1. Hero — dynamic slideshow */}
      <HeroSlideshow />

      {/* 2. About */}
      <section className="py-24 px-8 max-w-screen-2xl mx-auto">
        <div className="grid md:grid-cols-2 gap-20 items-center">
          <div className="relative">
            <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80"
                alt="Pharmacist inspecting medicine"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-10 -right-10 bg-white p-8 rounded-2xl shadow-xl border border-slate-100 hidden lg:block max-w-xs">
              <p className="text-primary font-headline font-extrabold text-4xl mb-1">15+</p>
              <p className="text-on-surface-variant font-label text-sm uppercase tracking-wider">Years of Regulatory Excellence</p>
            </div>
          </div>
          <div>
            <h2 className="text-primary font-headline text-4xl font-extrabold mb-8">The Essential Bridge in Healthcare Supply Chains</h2>
            <div className="space-y-6 text-on-surface-variant text-lg leading-relaxed">
              <p>PharmaLink Pro operates at the intersection of medical necessity and logistical precision. As a licensed global wholesaler, we remove the complexities of international pharmaceutical procurement.</p>
              <p>Our commitment to <strong className="text-on-surface">Regulatory Compliance</strong> ensures that every SKU in our catalog meets rigorous international standards, including WHO, FDA, and EMA guidelines. We prioritize clinical integrity from origin to delivery.</p>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-8">
              {[{ icon: 'verified_user', title: 'Fully Licensed', sub: 'Global Export Permits' }, { icon: 'thermostat', title: 'Cold Chain', sub: 'Temperature Controlled' }].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                  <div>
                    <p className="font-headline font-bold text-on-surface">{item.title}</p>
                    <p className="text-xs text-on-surface-variant">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Categories */}
      <section className="py-24 bg-surface-container-low px-8">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex justify-between items-end mb-16">
            <div>
              <h2 className="text-on-surface font-headline text-3xl font-extrabold mb-4">Explore Specialized Categories</h2>
              <p className="text-on-surface-variant">Streamlined procurement for every medical department.</p>
            </div>
            <Link to="/products" className="text-primary font-headline font-bold hover:underline">View All Categories</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CATEGORIES.map((cat) => (
              <div key={cat.key} className="bg-surface-container-lowest p-8 rounded-xl hover:shadow-xl transition-all group">
                <div className="w-14 h-14 bg-secondary-container rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                  <span className="material-symbols-outlined text-primary group-hover:text-white">{cat.icon}</span>
                </div>
                <h3 className="font-headline font-bold text-xl mb-3">{cat.label}</h3>
                <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">{cat.desc}</p>
                <Link to="/rfq" className="text-primary font-headline font-bold text-sm flex items-center gap-2">
                  Request Quote <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Why Choose Us */}
      <section className="bg-primary text-white py-20 px-8">
        <div className="max-w-screen-2xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
            {WHY_US.map((item) => (
              <div key={item.title} className="text-center">
                <span className="material-symbols-outlined text-4xl mb-4 text-blue-300 block" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                <h4 className="font-headline font-bold text-lg mb-2">{item.title}</h4>
                <p className="text-blue-200 text-xs px-4">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Featured Products */}
      <section className="py-24 px-8 max-w-screen-2xl mx-auto">
        <div className="flex justify-between items-center mb-16">
          <h2 className="text-on-surface font-headline text-3xl font-extrabold">Ready-to-Ship Inventory</h2>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {displayProducts.map((p) => <FeaturedCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* 6. How It Works */}
      <section className="py-24 bg-surface px-8">
        <div className="max-w-screen-xl mx-auto text-center">
          <h2 className="text-on-surface font-headline text-3xl font-extrabold mb-16">The Procurement Process</h2>
          <div className="relative flex flex-col md:flex-row justify-between items-center gap-12 md:gap-4">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-4/5 h-0.5 bg-outline-variant hidden md:block" />
            {STEPS.map((s) => (
              <div key={s.n} className="relative z-10 flex flex-col items-center max-w-[200px]">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white font-headline font-bold text-xl mb-6 shadow-lg shadow-primary/30">{s.n}</div>
                <h5 className="font-headline font-bold mb-2">{s.label}</h5>
                <p className="text-xs text-on-surface-variant">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Testimonials */}
      <section className="py-24 px-8 max-w-screen-2xl mx-auto overflow-hidden">
        <h2 className="text-center text-on-surface font-headline text-3xl font-extrabold mb-16">Trusted by Healthcare Leaders</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {displayTestimonials.map((t) => (
            <div key={t.id} className="bg-surface-container-low p-10 rounded-2xl relative">
              <span className="material-symbols-outlined text-primary/20 text-6xl absolute top-6 right-8">format_quote</span>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center">
                  {t.avatar
                    ? <img src={t.avatar} alt={t.customerName} className="w-full h-full object-cover" />
                    : <span className="material-symbols-outlined text-slate-400">person</span>}
                </div>
                <div>
                  <p className="font-headline font-bold text-on-surface">{t.customerName}</p>
                  <p className="text-xs text-on-surface-variant">{t.companyName}</p>
                </div>
              </div>
              <p className="text-on-surface font-body italic leading-relaxed">"{t.comment}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* 8. Contact */}
      <section id="contact" className="py-24 px-8 bg-surface-container-highest/30">
        <div className="max-w-screen-2xl mx-auto grid lg:grid-cols-2 gap-20">
          <div>
            <h2 className="text-primary font-headline text-4xl font-extrabold mb-8">Let's Secure Your Supply Chain</h2>
            <p className="text-on-surface-variant text-lg mb-12">Our procurement experts are ready to assist with bulk orders, regular supplies, or specialized medical equipment imports.</p>
            <div className="space-y-8">
              {[
                { icon: 'location_on', title: 'Headquarters', lines: ['Medical Park West, Floor 14', 'London, UK EC1A 4HQ'] },
                { icon: 'call', title: 'Phone Support', lines: ['+44 (0) 20 7946 0123', 'Available Mon-Fri, 9am - 6pm GMT'] },
                { icon: 'mail', title: 'Email Support', lines: ['support@pharmalinkwholesale.com', 'procurement@pharmalinkwholesale.com'] },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-6">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md flex-shrink-0">
                    <span className="material-symbols-outlined text-primary">{item.icon}</span>
                  </div>
                  <div>
                    <h6 className="font-headline font-bold mb-1">{item.title}</h6>
                    {item.lines.map((l) => <p key={l} className="text-sm text-on-surface-variant">{l}</p>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-10 rounded-2xl shadow-xl">
            <h3 className="font-headline font-bold text-2xl mb-6">Send a Quick Message</h3>
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-outline uppercase tracking-widest">First Name</label>
                  <input type="text" placeholder="John" className="input-field" />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-outline uppercase tracking-widest">Last Name</label>
                  <input type="text" placeholder="Smith" className="input-field" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-outline uppercase tracking-widest">Email</label>
                <input type="email" placeholder="you@company.com" className="input-field" />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-outline uppercase tracking-widest">Message</label>
                <textarea rows={4} placeholder="How can we help?" className="input-field resize-none" />
              </div>
              <button type="submit" className="btn-primary w-full justify-center">Send Message</button>
            </form>
          </div>
        </div>
      </section>
    </>
  )
}
