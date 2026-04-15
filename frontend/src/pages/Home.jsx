import { Link } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import useRFQStore from '../store/rfqStore'
import { useSiteContent } from '../lib/useSiteContent'

// Fallback data used when DB is not seeded yet
const DEFAULT_SLIDES = [
  { img: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1800&q=90', badge: 'Global Distribution Excellence', accent: 'Import Solutions', subtitle: 'Supplying quality medicines and medical products to pharmacies, hospitals, and clinics.' },
  { img: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1800&q=90', badge: 'WHO-GMP Certified Sources', accent: 'Import Solutions', subtitle: 'Supplying quality medicines and medical products to pharmacies, hospitals, and clinics.' },
  { img: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=1800&q=90', badge: 'Cold Chain Specialists', accent: 'Import Solutions', subtitle: 'Supplying quality medicines and medical products to pharmacies, hospitals, and clinics.' },
  { img: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1800&q=90', badge: 'Surgical & Medical Supplies', accent: 'Import Solutions', subtitle: 'Supplying quality medicines and medical products to pharmacies, hospitals, and clinics.' },
]

const DEFAULT_WHY = [
  { icon: 'verified',       title: 'Genuine Imported Products',    desc: 'Direct sourcing from certified manufacturers only.' },
  { icon: 'payments',       title: 'Competitive Wholesale Pricing', desc: 'Economies of scale passed directly to our clients.' },
  { icon: 'local_shipping', title: 'Fast Delivery',       desc: 'Optimized air & sea freight for rapid turnaround.' },
  { icon: 'gavel',          title: 'Licensed & Certified',desc: 'Strict adherence to regional health authorities.' },
  { icon: 'groups',         title: 'Experienced Team',    desc: 'Dedicated professionals ensuring seamless pharmaceutical procurement.' },
]

const DEFAULT_COMPANY = { yearsExp: '15+', countries: '50+', aboutImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&q=90', aboutHeading: 'The Essential Bridge in Healthcare Supply Chains', address: 'Medical Park West, Floor 14, London, UK EC1A 4HQ', phone: '+44 (0) 20 7946 0123', email: 'support@pharmalinkwholesale.com', procurementEmail: 'procurement@pharmalinkwholesale.com' }

function HeroSlideshow({ slides }) {
  const HERO_SLIDES = slides || DEFAULT_SLIDES
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
            style={{ opacity: 0.55 }}
          />
        </div>
      ))}

      {/* Persistent dark overlay — lighter so images show through */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-slate-900/75 via-slate-900/60 to-slate-900/80" />

      {/* Content — centered */}
      <div className="relative z-10 max-w-screen-2xl mx-auto px-4 md:px-8 w-full flex flex-col items-center text-center">
        <span
          key={`badge-${current}`}
          className="inline-block px-4 py-1.5 rounded-full bg-primary/20 text-primary-fixed-dim text-xs font-bold tracking-widest uppercase mb-6 backdrop-blur-sm border border-primary/30 animate-fade-in"
        >
          {slide.badge}
        </span>
        <h1
          key={`h1-${current}`}
          className="text-white font-headline text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] animate-fade-in max-w-4xl"
        >
          Trusted Pharmaceutical Wholesale &amp;{' '}
          <span className="text-blue-400">{slide.accent}</span>
        </h1>
        <p
          key={`p-${current}`}
          className="text-slate-300 text-lg md:text-xl mb-12 max-w-2xl font-body leading-relaxed animate-fade-in"
        >
          {slide.subtitle}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/rfq" className="signature-gradient text-white px-10 py-5 rounded-lg font-headline font-bold text-lg hover:scale-[1.02] transition-all shadow-2xl">
            Request Quotation
          </Link>
          <Link to="/products" className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-10 py-5 rounded-lg font-headline font-bold text-lg hover:bg-white/20 transition-all">
            Browse Products
          </Link>
        </div>
      </div>

      {/* Slide controls — minimal bottom center */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
        {/* Prev arrow — small, subtle */}
        <button
          onClick={goBack}
          className="w-7 h-7 rounded-full bg-white/15 text-white/70 flex items-center justify-center hover:bg-white/30 hover:text-white transition-all"
          aria-label="Previous slide"
        >
          <span className="material-symbols-outlined text-sm">chevron_left</span>
        </button>

        {/* Dot indicators — slim pills */}
        <div className="flex items-center gap-1.5">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`transition-all duration-300 ease-out rounded-full ${
                i === current
                  ? 'w-6 h-1.5 bg-white'
                  : 'w-1.5 h-1.5 bg-white/35 hover:bg-white/60'
              }`}
            />
          ))}
        </div>

        {/* Next arrow */}
        <button
          onClick={next}
          className="w-7 h-7 rounded-full bg-white/15 text-white/70 flex items-center justify-center hover:bg-white/30 hover:text-white transition-all"
          aria-label="Next slide"
        >
          <span className="material-symbols-outlined text-sm">chevron_right</span>
        </button>
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
  { key: 'prescription', label: 'Prescription Medicines', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80', desc: 'Regulated pharmaceuticals sourced from WHO-GMP certified manufacturers.' },
  { key: 'otc', label: 'OTC Medicines', image: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=400&q=80', desc: 'High-volume over-the-counter essentials for retail pharmacy networks.' },
  { key: 'supplies', label: 'Medical Supplies', image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400&q=80', desc: 'Essential consumables and equipment for hospitals and clinics.' },
  { key: 'surgical', label: 'Surgical Products', image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&q=80', desc: 'Precision instruments and sterile disposables for operating theaters.' },
  { key: 'laboratory', label: 'Laboratory Equipment', image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&q=80', desc: 'Diagnostic devices and consumables for clinical research facilities.' },
  { key: 'personal-care', label: 'Personal Care Products', image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&q=80', desc: 'Hygiene and personal care items for healthcare and daily use.' },
]

const WHY_US = [
  { icon: 'verified', title: 'Genuine Imported Products', desc: 'Direct sourcing from certified manufacturers only.' },
  { icon: 'payments', title: 'Competitive Wholesale Pricing', desc: 'Economies of scale passed directly to our clients.' },
  { icon: 'local_shipping', title: 'Fast Delivery', desc: 'Optimized air & sea freight for rapid turnaround.' },
  { icon: 'gavel', title: 'Licensed & Certified', desc: 'Strict adherence to regional health authorities.' },
  { icon: 'groups', title: 'Experienced Team', desc: 'Dedicated professionals ensuring seamless pharmaceutical procurement.' },
]

const STEPS = [
  { n: 1, label: 'Browse Products', desc: 'Explore our extensive verified catalog.' },
  { n: 2, label: 'Add Products to RFQ', desc: 'Select quantities and specific requirements.' },
  { n: 3, label: 'Submit RFQ', desc: 'Provide facility details and delivery preference.' },
  { n: 4, label: 'Receive Quotation', desc: 'Get a formalized clinical quotation within 24h.' },
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
        <h3 className="font-headline font-bold text-lg mb-1 leading-tight">{product.name}</h3>
        <p className="text-[11px] font-bold text-primary mb-2">{product.brand || product.sub?.split('•')[1]?.trim() || 'Generic'}</p>
        <p className="text-xs text-on-surface-variant mb-4">{product.description || product.sub?.split('•')[0]?.trim() || 'Standard packaging'}</p>
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
  const HERO_SLIDES = useSiteContent('hero_slides', DEFAULT_SLIDES)
  const WHY_US = useSiteContent('why_choose_us', DEFAULT_WHY)
  const company = useSiteContent('company_info', DEFAULT_COMPANY)
  const contactInfo = useSiteContent('contact_info', [
    { icon: 'location_on', title: 'Headquarters',   line1: 'Medical Park West, Floor 14', line2: 'London, UK EC1A 4HQ' },
    { icon: 'call',        title: 'Phone Support',  line1: '+44 (0) 20 7946 0123',        line2: 'Mon–Fri, 9am – 6pm GMT' },
    { icon: 'mail',        title: 'Email',          line1: 'support@pharmalinkwholesale.com', line2: 'procurement@pharmalinkwholesale.com' },
  ])
  const { data: featured } = useQuery({ queryKey: ['featured-products'], queryFn: () => api.get('/products/featured').then((r) => r.data) })
  const { data: testimonials } = useQuery({ queryKey: ['testimonials'], queryFn: () => api.get('/content/testimonials').then((r) => r.data) })
  const displayProducts = featured?.length > 0 ? featured.slice(0, 4) : PLACEHOLDER_PRODUCTS
  const displayTestimonials = testimonials?.length > 0 ? testimonials.slice(0, 2) : TESTIMONIALS_FALLBACK

  return (
    <>
      {/* 1. Hero — dynamic slideshow */}
      <HeroSlideshow slides={HERO_SLIDES} />

      {/* 2. About */}
      <section className="py-16 md:py-24 px-4 md:px-8 max-w-screen-2xl mx-auto">
        <div className="grid md:grid-cols-2 gap-10 md:gap-20 items-center">
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl aspect-[3/4]">
              <img
                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&q=90"
                alt="Doctor in white coat"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="absolute -bottom-10 -right-10 bg-white p-8 rounded-2xl shadow-xl border border-slate-100 hidden lg:block max-w-xs">
              <p className="text-primary font-headline font-extrabold text-4xl mb-1">15+</p>
              <p className="text-on-surface-variant font-label text-sm uppercase tracking-wider">Years of Regulatory Excellence</p>
            </div>
          </div>
          <div>
            <h2 className="text-primary font-headline text-4xl font-extrabold mb-8">The Essential Bridge in Healthcare Supply Chains</h2>
            <div className="space-y-4 text-on-surface-variant text-lg leading-relaxed">
              <p>PharmaLink Pro operates at the intersection of medical necessity and logistical precision. As a licensed global wholesaler, we remove the complexities of international pharmaceutical procurement.</p>
              <div className="bg-surface p-6 rounded-xl border border-surface-container shadow-sm space-y-4">
                <div>
                  <h3 className="text-primary font-headline font-bold text-xl flex items-center gap-2"><span className="material-symbols-outlined">flag</span> Mission</h3>
                  <p className="text-base text-on-surface-variant mt-1">To supply quality medicines and medical products to pharmacies, hospitals, and clinics worldwide with unmatched reliability and care.</p>
                </div>
                <div>
                  <h3 className="text-primary font-headline font-bold text-xl flex items-center gap-2"><span className="material-symbols-outlined">visibility</span> Vision</h3>
                  <p className="text-base text-on-surface-variant mt-1">To be the essential global bridge in healthcare supply chains, ensuring every patient has access to life-saving treatments regardless of geography.</p>
                </div>
              </div>
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
      <section className="py-16 md:py-24 bg-surface-container-low px-4 md:px-8">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex justify-between items-end mb-16">
            <div>
              <h2 className="text-on-surface font-headline text-3xl font-extrabold mb-4">Explore Specialized Categories</h2>
              <p className="text-on-surface-variant">Streamlined procurement for every medical department.</p>
            </div>
            <Link to="/products" className="text-primary font-headline font-bold hover:underline">View All Categories</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CATEGORIES.map((cat) => (
              <div key={cat.key} className="bg-surface-container-lowest rounded-xl hover:shadow-xl transition-all group overflow-hidden flex flex-col">
                <div className="h-48 w-full overflow-hidden bg-slate-200">
                  <img src={cat.image} alt={cat.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-6 flex-grow flex flex-col">
                  <h3 className="font-headline font-bold text-xl mb-3">{cat.label}</h3>
                  <p className="text-on-surface-variant text-sm mb-6 leading-relaxed flex-grow">{cat.desc}</p>
                  <Link to="/rfq" className="text-primary font-headline font-bold text-sm flex items-center gap-2">
                    Request Quote <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Why Choose Us */}
      <section className="bg-primary text-white py-16 md:py-20 px-4 md:px-8">
        <div className="max-w-screen-2xl mx-auto">
          <h2 className="text-center font-headline text-3xl md:text-4xl font-extrabold mb-12 md:mb-16">Why Choose Us</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-6">
            {(WHY_US || DEFAULT_WHY).map((item, i) => (
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
      <section className="py-16 md:py-24 px-4 md:px-8 max-w-screen-2xl mx-auto">
        <div className="flex justify-between items-center mb-8 md:mb-16">
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
      <section className="py-16 md:py-24 bg-surface px-4 md:px-8">
        <div className="max-w-screen-xl mx-auto text-center">
          <h2 className="text-on-surface font-headline text-2xl md:text-3xl font-extrabold mb-12 md:mb-16">Our Process</h2>
          <div className="relative flex flex-col md:flex-row justify-between items-center gap-12 md:gap-4">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-4/5 h-0.5 bg-outline-variant hidden md:block" />
            {STEPS.map((s, i) => (
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
      <section className="py-16 md:py-24 px-4 md:px-8 max-w-screen-2xl mx-auto overflow-hidden">
        <h2 className="text-center text-on-surface font-headline text-2xl md:text-3xl font-extrabold mb-12 md:mb-16">Trusted by Healthcare Leaders</h2>
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
      <section id="contact" className="py-16 md:py-24 px-4 md:px-8 bg-surface-container-highest/30">
        <div className="max-w-screen-2xl mx-auto grid lg:grid-cols-2 gap-12 md:gap-20">
          <div>
            <h2 className="text-primary font-headline text-4xl font-extrabold mb-8">Let's Secure Your Supply Chain</h2>
            <p className="text-on-surface-variant text-lg mb-12">Our procurement experts are ready to assist with bulk orders, regular supplies, or specialized medical equipment imports.</p>
            <div className="space-y-8">
              {(contactInfo || []).map((item) => (
                <div key={item.title} className="flex items-start gap-6">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md flex-shrink-0">
                    <span className="material-symbols-outlined text-primary">{item.icon}</span>
                  </div>
                  <div>
                    <h6 className="font-headline font-bold mb-1">{item.title}</h6>
                    <p className="text-sm text-on-surface-variant">{item.line1}</p>
                    <p className="text-sm text-on-surface-variant">{item.line2}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Map Placeholder */}
            <div className="mt-12 rounded-xl overflow-hidden shadow-md h-64 border border-outline-variant bg-slate-200">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.819917806043!2d36.81989441475396!3d-1.281801599066062!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f10d65b79eef9%3A0xe744e8d89e5a1b!2sNairobi%2C%20Kenya!5e0!3m2!1sen!2sus!4v1683100000000!5m2!1sen!2sus" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen="" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Company Location"
              />
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
