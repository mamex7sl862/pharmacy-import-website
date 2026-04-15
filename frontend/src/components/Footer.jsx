import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useAuthStore from '../store/authStore'

export default function Footer() {
  const { user } = useAuthStore()
  const { t, i18n } = useTranslation()
  const isAm = i18n.language === 'am'

  const NAV_LINKS = [
    { to: '/',         label: isAm ? 'መነሻ'       : 'Home' },
    { to: '/about',    label: t('nav.about') },
    { to: '/products', label: t('nav.products') },
    { to: '/services', label: t('nav.services') },
    { to: '/contact',  label: t('nav.contact') },
  ]

  const SERVICE_LINKS = [
    { to: '/rfq',     label: t('footer.rfq_generator') },
    { to: '/compare', label: t('footer.comparison') },
    { to: user?.role === 'admin' ? '/admin' : '/portal', label: t('nav.dashboard') },
    ...(!user ? [{ to: '/register', label: t('footer.create_account') }] : []),
  ]

  const LEGAL_LINKS = isAm
    ? ['የሽያጭ ውሎች', 'የቁጥጥር ተገዥነት', 'MSDS ዳታቤዝ', 'የግላዊነት ፖሊሲ']
    : ['Terms of Sale', 'Regulatory Compliance', 'MSDS Database', 'Privacy Policy']

  return (
    <footer className="w-full border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="max-w-screen-2xl mx-auto px-8 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">

        {/* Brand */}
        <div className="md:col-span-1">
          <span className="font-headline font-bold text-white tracking-tighter text-2xl block mb-3">PharmaLink</span>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">{t('footer.tagline')}</p>
          <div className="flex gap-3">
            {['language', 'mail', 'call'].map((icon) => (
              <div key={icon} className="w-9 h-9 rounded-full bg-slate-700 hover:bg-primary transition-colors flex items-center justify-center cursor-pointer">
                <span className="material-symbols-outlined text-sm text-slate-300">{ icon }</span>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div>
          <p className="font-headline font-bold text-xs uppercase tracking-widest text-slate-500 mb-5">{t('footer.navigation')}</p>
          <div className="space-y-3">
            {NAV_LINKS.map((l) => (
              <Link key={l.to} to={l.to} className="block text-sm text-slate-400 hover:text-white transition-colors">{l.label}</Link>
            ))}
          </div>
        </div>

        {/* Services */}
        <div>
          <p className="font-headline font-bold text-xs uppercase tracking-widest text-slate-500 mb-5">{t('footer.services')}</p>
          <div className="space-y-3">
            {SERVICE_LINKS.map((l) => (
              <Link key={l.to} to={l.to} className="block text-sm text-slate-400 hover:text-white transition-colors">{l.label}</Link>
            ))}
          </div>
        </div>

        {/* Legal */}
        <div>
          <p className="font-headline font-bold text-xs uppercase tracking-widest text-slate-500 mb-5">{isAm ? 'ህጋዊ' : 'Legal'}</p>
          <div className="space-y-3">
            {LEGAL_LINKS.map((l) => (
              <Link key={l} to="#" className="block text-sm text-slate-400 hover:text-white transition-colors">{l}</Link>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-700 px-8 py-5 max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
        <span className="font-headline font-bold text-slate-500 tracking-tighter">PharmaLink Wholesale</span>
        <p className="text-[11px] uppercase tracking-widest text-slate-600">
          © {new Date().getFullYear()} PharmaLink Wholesale Precision Systems. {isAm ? 'መብቱ በህግ የተጠበቀ ነው።' : 'All rights reserved.'}
        </p>
      </div>
    </footer>
  )
}
