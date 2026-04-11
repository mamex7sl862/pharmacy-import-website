import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 bg-slate-100">
      <div className="max-w-screen-2xl mx-auto px-8 py-10 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="md:col-span-1">
          <span className="font-headline font-bold text-primary tracking-tighter text-2xl block mb-3">PharmaLink</span>
          <p className="text-xs text-slate-500 leading-relaxed">
            Trusted pharmaceutical wholesale &amp; import solutions for healthcare institutions worldwide.
          </p>
        </div>

        {/* Navigation */}
        <div>
          <p className="font-headline font-bold text-xs uppercase tracking-widest text-slate-400 mb-4">Navigation</p>
          <div className="space-y-2">
            {[
              { to: '/', label: 'Home' },
              { to: '/about', label: 'About Us' },
              { to: '/products', label: 'Products' },
              { to: '/services', label: 'Services' },
              { to: '/contact', label: 'Contact Us' },
            ].map((l) => (
              <Link key={l.to} to={l.to} className="block text-sm text-slate-500 hover:text-primary transition-colors">{l.label}</Link>
            ))}
          </div>
        </div>

        {/* Services */}
        <div>
          <p className="font-headline font-bold text-xs uppercase tracking-widest text-slate-400 mb-4">Services</p>
          <div className="space-y-2">
            {[
              { to: '/rfq', label: 'RFQ Generator' },
              { to: '/compare', label: 'Product Comparison' },
              { to: '/portal', label: 'Customer Portal' },
              { to: '/register', label: 'Create Account' },
            ].map((l) => (
              <Link key={l.label} to={l.to} className="block text-sm text-slate-500 hover:text-primary transition-colors">{l.label}</Link>
            ))}
          </div>
        </div>

        {/* Legal */}
        <div>
          <p className="font-headline font-bold text-xs uppercase tracking-widest text-slate-400 mb-4">Legal</p>
          <div className="space-y-2">
            {['Terms of Sale', 'Regulatory Compliance', 'MSDS Database', 'Privacy Policy'].map((l) => (
              <Link key={l} to="#" className="block text-sm text-slate-500 hover:text-primary transition-colors">{l}</Link>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 px-8 py-4 max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
        <span className="font-headline font-bold text-slate-400 tracking-tighter">PharmaLink</span>
        <p className="font-label text-[10px] uppercase tracking-widest text-slate-400">
          © {new Date().getFullYear()} PharmaLink Wholesale Precision Systems
        </p>
      </div>
    </footer>
  )
}
