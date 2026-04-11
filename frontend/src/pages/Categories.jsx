import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useRFQStore from '../store/rfqStore'

const CATEGORIES = [
  {
    key: 'prescription',
    label: 'Prescription Medicines',
    icon: 'medication',
    color: 'bg-blue-50',
    iconColor: 'text-blue-600',
    count: '2,400+ SKUs',
    desc: 'Regulated prescription drugs sourced directly from certified manufacturers. Full traceability, cold-chain handling, and regulatory documentation included.',
    features: ['WHO-GMP Certified Sources', 'Full Batch Traceability', 'Regulatory Documentation', 'Cold Chain Available'],
    img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80',
    examples: ['Amoxicillin 500mg', 'Atorvastatin 20mg', 'Metformin HCL 1000mg', 'Lisinopril 10mg'],
  },
  {
    key: 'otc',
    label: 'OTC Medications',
    icon: 'pill',
    color: 'bg-green-50',
    iconColor: 'text-green-600',
    count: '1,800+ SKUs',
    desc: 'High-volume over-the-counter essentials for retail pharmacy networks. Competitive bulk pricing with fast turnaround for high-demand products.',
    features: ['Bulk Pricing Available', 'Fast Turnaround', 'Retail-Ready Packaging', 'Private Label Options'],
    img: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=800&q=80',
    examples: ['Paracetamol 500mg', 'Aspirin 100mg', 'Ibuprofen 400mg', 'Vitamin C 1000mg'],
  },
  {
    key: 'medical-supplies',
    label: 'Medical Supplies',
    icon: 'medical_services',
    color: 'bg-purple-50',
    iconColor: 'text-purple-600',
    count: '3,200+ SKUs',
    desc: 'Consumables and disposables for clinical environments. From IV sets to wound care, we supply the full spectrum of medical consumables.',
    features: ['Sterile & Non-Sterile', 'Single-Use Certified', 'Hospital Grade Quality', 'Bulk Discounts'],
    img: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=800&q=80',
    examples: ['IV Infusion Sets', 'Surgical Gloves', 'Wound Dressings', 'Syringes & Needles'],
  },
  {
    key: 'surgical',
    label: 'Surgical Products',
    icon: 'content_cut',
    color: 'bg-red-50',
    iconColor: 'text-red-600',
    count: '900+ SKUs',
    desc: 'Precision instruments and sterile disposables for operating theaters. All surgical products meet international sterility and biocompatibility standards.',
    features: ['ISO 13485 Certified', 'Sterility Guaranteed', 'Biocompatibility Tested', 'Surgeon-Grade Quality'],
    img: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80',
    examples: ['Scalpels & Blades', 'Surgical Sutures', 'Retractors', 'Electrosurgical Units'],
  },
  {
    key: 'laboratory',
    label: 'Laboratory Equipment',
    icon: 'biotech',
    color: 'bg-amber-50',
    iconColor: 'text-amber-600',
    count: '1,100+ SKUs',
    desc: 'Diagnostic devices and consumables for clinical research and pathology labs. From reagents to analyzers, we supply the full diagnostic workflow.',
    features: ['CE & FDA Cleared', 'Calibration Certificates', 'Technical Support', 'Reagent Compatibility'],
    img: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&q=80',
    examples: ['PCR Reagents', 'Centrifuges', 'Microscope Slides', 'Blood Glucose Meters'],
  },
  {
    key: 'personal-care',
    label: 'Personal Care & Nutraceuticals',
    icon: 'nutrition',
    color: 'bg-teal-50',
    iconColor: 'text-teal-600',
    count: '600+ SKUs',
    desc: 'Pharmaceutical-grade vitamins, supplements, and personal care products. Sourced from GMP-certified nutraceutical manufacturers worldwide.',
    features: ['GMP Certified', 'Third-Party Tested', 'Allergen Declarations', 'Halal & Kosher Options'],
    img: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&q=80',
    examples: ['Vitamin D3 1000IU', 'Omega-3 Fish Oil', 'Zinc Supplements', 'Probiotic Capsules'],
  },
]

const PROCESS = [
  { icon: 'search', title: 'Browse Categories', desc: 'Explore our 10,000+ SKU catalog organized by therapeutic class.' },
  { icon: 'add_shopping_cart', title: 'Build Your RFQ', desc: 'Add products with quantities and specifications to your request.' },
  { icon: 'send', title: 'Submit Request', desc: 'Provide delivery details and submit your quotation request.' },
  { icon: 'mark_email_read', title: 'Receive Quotation', desc: 'Get a formal quotation with pricing within 4–24 hours.' },
]

export default function Categories() {
  const [activeCategory, setActiveCategory] = useState(null)
  const navigate = useNavigate()
  const { setStep } = useRFQStore()

  const handleRequestQuote = (categoryKey) => {
    navigate(`/products?category=${categoryKey}`)
  }

  return (
    <>
      {/* Hero */}
      <section className="relative bg-slate-900 py-28 px-8 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1600&q=80"
            alt="Pharmaceutical categories"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 to-slate-900" />
        </div>
        <div className="relative z-10 max-w-screen-2xl mx-auto px-8 w-full flex flex-col items-center text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/20 text-primary-fixed-dim text-xs font-bold tracking-widest uppercase mb-6 border border-primary/30">
            Product Catalog
          </span>
          <h1 className="text-white font-headline text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-[1.1]">
            Specialized Categories for<br />
            <span className="text-blue-400">Every Medical Department</span>
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            From prescription medicines to laboratory equipment — streamlined procurement for pharmacies, hospitals, clinics, and distributors worldwide.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/rfq" className="signature-gradient text-white px-8 py-4 rounded-lg font-headline font-bold hover:scale-[1.02] transition-all shadow-xl inline-flex items-center gap-2 justify-center">
              Request Quotation
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
            <Link to="/products" className="bg-white/10 border border-white/20 text-white px-8 py-4 rounded-lg font-headline font-bold hover:bg-white/20 transition-all inline-flex items-center gap-2 justify-center">
              Browse All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Quick nav chips */}
      <section className="bg-surface-container-low py-6 px-8 sticky top-16 z-30 shadow-sm">
        <div className="max-w-screen-2xl mx-auto flex gap-3 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => {
                setActiveCategory(cat.key)
                document.getElementById(cat.key)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                activeCategory === cat.key
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-surface-container-lowest text-on-surface-variant hover:bg-secondary-container hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-base">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Category sections */}
      <div className="max-w-screen-2xl mx-auto px-8">
        {CATEGORIES.map((cat, i) => (
          <section
            key={cat.key}
            id={cat.key}
            className={`py-24 ${i < CATEGORIES.length - 1 ? 'border-b border-surface-container' : ''}`}
          >
            <div className={`grid md:grid-cols-2 gap-16 items-center ${i % 2 !== 0 ? 'md:grid-flow-dense' : ''}`}>
              {/* Image */}
              <div className={`relative ${i % 2 !== 0 ? 'md:col-start-2' : ''}`}>
                <div className="rounded-2xl overflow-hidden shadow-2xl aspect-[4/3]">
                  <img
                    src={cat.img}
                    alt={cat.label}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
                {/* Floating count badge */}
                <div className="absolute -bottom-6 -right-6 bg-white px-6 py-4 rounded-2xl shadow-xl hidden lg:block">
                  <p className="font-headline font-extrabold text-2xl text-primary">{cat.count}</p>
                  <p className="text-xs text-on-surface-variant uppercase tracking-wider">Available</p>
                </div>
              </div>

              {/* Content */}
              <div className={i % 2 !== 0 ? 'md:col-start-1 md:row-start-1' : ''}>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${cat.color} mb-6`}>
                  <span className={`material-symbols-outlined ${cat.iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>{cat.icon}</span>
                  <span className={`text-xs font-bold uppercase tracking-widest ${cat.iconColor}`}>{cat.label}</span>
                </div>
                <h2 className="font-headline font-extrabold text-3xl md:text-4xl text-on-surface mb-6 leading-tight">
                  {cat.label}
                </h2>
                <p className="text-on-surface-variant text-lg leading-relaxed mb-8">{cat.desc}</p>

                {/* Features */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {cat.features.map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      <span className="text-sm font-medium text-on-surface">{f}</span>
                    </div>
                  ))}
                </div>

                {/* Example products */}
                <div className="bg-surface-container-low rounded-xl p-5 mb-8">
                  <p className="text-xs font-bold text-outline uppercase tracking-widest mb-3">Popular Products</p>
                  <div className="flex flex-wrap gap-2">
                    {cat.examples.map((ex) => (
                      <span key={ex} className="px-3 py-1.5 bg-surface-container-lowest rounded-full text-xs font-medium text-on-surface-variant">
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <button
                    onClick={() => handleRequestQuote(cat.key)}
                    className="signature-gradient text-white px-8 py-3 rounded-xl font-headline font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">request_quote</span>
                    Request Quote
                  </button>
                  <Link
                    to={`/products?category=${cat.key}`}
                    className="border border-primary/20 text-primary px-8 py-3 rounded-xl font-headline font-bold hover:bg-primary hover:text-white transition-all flex items-center gap-2"
                  >
                    Browse Products
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* How it works */}
      <section className="py-24 bg-surface-container-low px-8">
        <div className="max-w-screen-xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-primary uppercase tracking-widest mb-4 block">Simple Process</span>
            <h2 className="font-headline font-extrabold text-4xl text-on-surface">How to Order from Any Category</h2>
          </div>
          <div className="relative flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="absolute top-8 left-0 right-0 h-0.5 bg-outline-variant/30 hidden md:block mx-16" />
            {PROCESS.map((step, i) => (
              <div key={step.title} className="relative z-10 flex flex-col items-center text-center flex-1">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white mb-6 shadow-lg shadow-primary/30">
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{step.icon}</span>
                </div>
                <span className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Step {i + 1}</span>
                <h3 className="font-headline font-bold text-lg text-on-surface mb-2">{step.title}</h3>
                <p className="text-sm text-on-surface-variant max-w-[180px]">{step.desc}</p>
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
                <h2 className="font-headline font-extrabold text-4xl text-white mb-4">
                  Can't find what you need?
                </h2>
                <p className="text-blue-200 text-lg leading-relaxed">
                  Our procurement specialists can source any pharmaceutical product globally. Submit a custom RFQ and we'll find it for you.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 md:justify-end">
                <Link to="/rfq" className="bg-white text-primary px-8 py-4 rounded-xl font-headline font-bold hover:scale-[1.02] transition-all shadow-xl inline-flex items-center gap-2 justify-center">
                  Submit Custom RFQ
                  <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
                <Link to="/#contact" className="bg-white/10 border border-white/20 text-white px-8 py-4 rounded-xl font-headline font-bold hover:bg-white/20 transition-all inline-flex items-center gap-2 justify-center">
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
