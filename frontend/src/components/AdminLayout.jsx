import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const NAV = [
  { to: '/admin',          icon: 'dashboard',     label: 'Dashboard' },
  { to: '/admin/rfqs',     icon: 'request_quote', label: 'RFQ Management' },
  { to: '/admin/products', icon: 'inventory_2',   label: 'Products' },
  { to: '/admin/content',  icon: 'edit_note',     label: 'Content' },
]

export default function AdminLayout({ children, title, subtitle }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()

  const active = NAV.find((n) =>
    n.to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(n.to)
  )?.label || 'Dashboard'

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      {/* Top bar */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-lg shadow-sm flex justify-between items-center px-8 h-20">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="font-headline font-extrabold text-primary text-2xl tracking-tight">
            PharmaLink Admin
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-on-surface-variant hidden md:block">
            {user?.fullName || 'Admin'}
          </span>
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
            {user?.fullName?.[0] || 'A'}
          </div>
          <button
            onClick={() => { clearAuth(); navigate('/login') }}
            className="text-sm text-outline hover:text-error transition-colors ml-2"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="flex pt-20 min-h-screen">
        {/* Sidebar */}
        <aside className="hidden lg:flex fixed left-0 top-20 h-[calc(100vh-5rem)] w-64 bg-slate-50 flex-col py-6 z-40">
          <div className="px-6 mb-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Admin Portal</p>
          </div>
          <nav className="flex-1 space-y-1 px-3">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active === item.label
                    ? 'bg-white text-primary font-bold shadow-sm'
                    : 'text-slate-500 hover:bg-white/60 hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="px-6 pt-4 border-t border-slate-200">
            <Link to="/" className="flex items-center gap-2 text-xs text-slate-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-base">open_in_new</span>
              View Website
            </Link>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 lg:ml-64 p-6 md:p-10">
          {(title || subtitle) && (
            <div className="mb-8">
              {title && <h1 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight">{title}</h1>}
              {subtitle && <p className="text-on-surface-variant mt-1">{subtitle}</p>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}
