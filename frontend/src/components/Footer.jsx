import { Link } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function Footer() {
  const { user } = useAuthStore()

  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-10">

          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 signature-gradient rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>medication</span>
              </div>
              <span className="font-bold text-white text-lg">PharmaLink Pro</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              Trusted pharmaceutical wholesale supplier serving healthcare institutions worldwide since 2009.
            </p>
            <div className="flex gap-2">
              {[
                { icon: 'language', label: 'Website' },
                { icon: 'mail',     label: 'Email' },
                { icon: 'call',     label: 'Phone' },
              ].map(({ icon, label }) => (
                <button key={icon} title={label} className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-primary transition-colors flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm text-gray-400 hover:text-white">{icon}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Company</p>
            <div className="space-y-2.5">
              {[
                { to: '/',          label: 'Home' },
                { to: '/about',     label: 'About Us' },
                { to: '/services',  label: 'Services' },
                { to: '/contact',   label: 'Contact' },
              ].map(l => (
                <Link key={l.to} to={l.to} className="block text-sm text-gray-500 hover:text-white transition-colors">{l.label}</Link>
              ))}
            </div>
          </div>

          {/* Products */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Products</p>
            <div className="space-y-2.5">
              {[
                { to: '/products',                          label: 'All Products' },
                { to: '/products?category=prescription',    label: 'Prescription' },
                { to: '/products?category=otc',             label: 'OTC Medicines' },
                { to: '/products?category=medical-supplies',label: 'Medical Supplies' },
                { to: '/categories',                        label: 'All Categories' },
              ].map(l => (
                <Link key={l.to} to={l.to} className="block text-sm text-gray-500 hover:text-white transition-colors">{l.label}</Link>
              ))}
            </div>
          </div>

          {/* Account & Legal */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Account</p>
            <div className="space-y-2.5">
              {[
                { to: user?.role === 'admin' ? '/admin' : '/portal', label: 'Dashboard' },
                { to: '/portal/rfq',  label: 'Request Quote' },
                { to: '/track',       label: 'Track RFQ' },
                ...(!user ? [{ to: '/register', label: 'Create Account' }, { to: '/login', label: 'Sign In' }] : []),
              ].map(l => (
                <Link key={l.to} to={l.to} className="block text-sm text-gray-500 hover:text-white transition-colors">{l.label}</Link>
              ))}
            </div>
          </div>
        </div>

        {/* Certifications strip */}
        <div className="border-t border-gray-800 pt-8 mb-6">
          <div className="flex flex-wrap gap-2 sm:gap-4 items-center">
            <span className="text-[10px] sm:text-xs text-gray-600 uppercase tracking-widest font-semibold">Certified:</span>
            {['WHO-GMP', 'FDA Registered', 'ISO 9001', 'GDP Compliant', 'IATA Certified'].map(cert => (
              <span key={cert} className="px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-400 font-medium">{cert}</span>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} PharmaLink Wholesale. All rights reserved.
          </p>
          <div className="flex gap-4">
            {[
              { to: '/privacy', label: 'Privacy Policy' },
              { to: '/terms',   label: 'Terms of Sale' },
            ].map(l => (
              <Link key={l.to} to={l.to} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">{l.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
