import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import useRFQStore from '../store/rfqStore'
import useAuthStore from '../store/authStore'

const NAV_LINKS = [
  { to: '/products', label: 'Products' },
  { to: '/services', label: 'Services' },
  { to: '/about',    label: 'About' },
  { to: '/contact',  label: 'Contact' },
  { to: '/track',    label: 'Track RFQ' },
]

export default function Navbar() {
  const itemCount = useRFQStore((s) => s.selectedProducts.length)
  const { user, clearAuth } = useAuthStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const profileRef = useRef(null)

  useEffect(() => { setIsMobileMenuOpen(false) }, [location.pathname])

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <nav className="sticky top-0 w-full z-50 bg-slate-50/90 backdrop-blur-xl shadow-sm">
      <div className="flex items-center justify-between px-4 md:px-8 py-4 max-w-screen-2xl mx-auto">

        {/* Logo */}
        <div className="flex items-center gap-4">
          <button className="md:hidden text-slate-700" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <span className="material-symbols-outlined text-2xl">{isMobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
          <Link to="/" className="text-xl md:text-2xl font-bold tracking-tighter text-blue-900 font-headline">
            PharmaLink<span className="hidden sm:inline"> Wholesale</span>
          </Link>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center space-x-8 font-headline text-sm font-semibold tracking-tight">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) =>
              isActive ? 'text-blue-700 border-b-2 border-blue-700 pb-1' : 'text-slate-600 hover:text-blue-900 transition-colors'
            }>{l.label}</NavLink>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* RFQ badge */}
          <Link to="/rfq" className="relative p-2 text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">description</span>
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative hidden sm:block" ref={profileRef}>
              <button onClick={() => setProfileOpen((o) => !o)} className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-2xl">account_circle</span>
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-10 w-52 bg-white rounded-xl shadow-lg border border-outline-variant/20 py-2 z-50">
                  <div className="px-4 py-2 border-b border-outline-variant/20">
                    <p className="text-xs font-bold text-on-surface truncate">{user.fullName}</p>
                    <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
                  </div>
                  <Link to={user.role === 'admin' ? '/admin' : '/portal'} onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-on-surface hover:bg-surface-container transition-colors">
                    <span className="material-symbols-outlined text-base">dashboard</span>
                    My Dashboard
                  </Link>
                  <button onClick={() => { clearAuth(); navigate('/login') }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-error/5 transition-colors">
                    <span className="material-symbols-outlined text-base">logout</span>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/rfq" className="signature-gradient text-white px-4 md:px-6 py-2 md:py-2.5 rounded-lg font-headline font-bold text-xs md:text-sm transition-all active:scale-95 shadow-md whitespace-nowrap">
                Request Quotation
              </Link>
              <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-blue-900 px-4 py-2 rounded-lg transition-colors">
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 py-4 space-y-4 shadow-lg absolute w-full left-0 top-full z-50">
          <div className="flex flex-col space-y-4 font-headline text-sm font-semibold tracking-tight">
            {NAV_LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} className={({ isActive }) =>
                isActive ? 'text-blue-700' : 'text-slate-600 hover:text-blue-900 transition-colors'
              }>{l.label}</NavLink>
            ))}
            <div className="border-t border-slate-100 pt-4">
              {user ? (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-slate-400">{user.fullName}</p>
                  <Link to={user.role === 'admin' ? '/admin' : '/portal'} className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">dashboard</span>My Dashboard
                  </Link>
                  <button onClick={() => { clearAuth(); navigate('/login') }} className="text-sm text-left text-red-500 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">logout</span>Logout
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-blue-900">Sign In</Link>
                  <Link to="/rfq" className="block text-center signature-gradient text-white px-4 py-3 rounded-lg font-headline font-bold text-sm shadow-md">
                    Request Quotation
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
