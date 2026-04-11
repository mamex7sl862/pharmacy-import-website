import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const active = NAV.find((n) =>
    n.to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(n.to)
  )?.label || 'Dashboard'

  // Close sidebar on navigation on mobile
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [location.pathname])

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      {/* Top bar */}
      <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-lg shadow-sm flex justify-between items-center px-4 md:px-8 h-20">
        <div className="flex items-center gap-3 md:gap-4">
          <button 
            className="lg:hidden text-slate-600 hover:text-primary transition-colors"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
          <Link to="/admin" className="font-headline font-extrabold text-primary text-xl md:text-2xl tracking-tight">
            PharmaLink<span className="hidden sm:inline"> Admin</span>
          </Link>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <span className="text-sm text-on-surface-variant hidden md:block">
            {user?.fullName || 'Admin'}
          </span>
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
            {user?.fullName?.[0] || 'A'}
          </div>
          <button
            onClick={() => { clearAuth(); navigate('/login') }}
            className="text-sm text-outline hover:text-error transition-colors ml-1 md:ml-2"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="flex pt-20 min-h-screen">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`fixed lg:left-0 top-20 h-[calc(100vh-5rem)] w-64 bg-slate-50 flex flex-col py-6 z-40 transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          <div className="px-6 mb-6 flex justify-between items-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Admin Portal</p>
            <button className="lg:hidden text-slate-400" onClick={() => setIsSidebarOpen(false)}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-3 overflow-y-auto">
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
          <div className="px-6 pt-4 border-t border-slate-200 mt-auto">
            <Link to="/" className="flex items-center gap-2 text-xs text-slate-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-base">open_in_new</span>
              View Website
            </Link>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 lg:ml-64 p-4 md:p-10 max-w-full overflow-x-hidden">
          {(title || subtitle) && (
            <div className="mb-6 md:mb-8">
              {title && <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-on-surface tracking-tight">{title}</h1>}
              {subtitle && <p className="text-sm md:text-base text-on-surface-variant mt-1">{subtitle}</p>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}
