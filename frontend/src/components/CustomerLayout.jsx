import { Link, NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const SIDEBAR_NAV = [
  { to: '/portal',         icon: 'dashboard',      label: 'Dashboard',      exact: true },
  { to: '/portal/rfq',     icon: 'add_circle',     label: 'New RFQ' },
  { to: '/products',       icon: 'inventory_2',    label: 'Product Catalog' },
  { to: '/portal/compare', icon: 'compare_arrows', label: 'Compare' },
]

export default function CustomerLayout({ children }) {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen bg-surface font-body text-on-surface">
      {/* Left sidebar */}
      <aside className="hidden md:flex flex-col w-64 flex-shrink-0 sticky top-16 h-[calc(100vh-4rem)] bg-surface-container-low border-r border-outline-variant/10 py-6">
        {/* User info */}
        <div className="px-6 mb-6 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {user?.fullName?.[0] || 'C'}
          </div>
          <div className="min-w-0">
            <p className="font-headline font-bold text-primary text-sm truncate">{user?.fullName}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.companyName}</p>
          </div>
        </div>

        <div className="px-4 mb-3">
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Menu</p>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {SIDEBAR_NAV.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white text-primary font-bold shadow-sm'
                    : 'text-slate-500 hover:bg-white/60 hover:text-primary'
                }`
              }
            >
              <span className="material-symbols-outlined text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 pt-4 border-t border-outline-variant/10 mt-4">
          <button
            onClick={() => { clearAuth(); navigate('/login') }}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-error transition-colors w-full px-4 py-2"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 md:hidden bg-white/90 backdrop-blur-xl border-t border-slate-100">
        <Link to="/portal" className="flex flex-col items-center text-primary">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          <span className="text-[11px] font-semibold">Home</span>
        </Link>
        <Link to="/portal/rfq" className="flex flex-col items-center text-slate-400">
          <span className="material-symbols-outlined">request_quote</span>
          <span className="text-[11px] font-semibold">RFQ</span>
        </Link>
        <Link to="/products" className="flex flex-col items-center text-slate-400">
          <span className="material-symbols-outlined">inventory_2</span>
          <span className="text-[11px] font-semibold">Products</span>
        </Link>
        <Link to="/portal/compare" className="flex flex-col items-center text-slate-400">
          <span className="material-symbols-outlined">compare_arrows</span>
          <span className="text-[11px] font-semibold">Compare</span>
        </Link>
      </nav>
    </div>
  )
}