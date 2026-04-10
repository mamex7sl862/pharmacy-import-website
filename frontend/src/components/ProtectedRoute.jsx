import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const DEV_BYPASS = import.meta.env.DEV

export default function ProtectedRoute({ children, role }) {
  const { user, setAuth } = useAuthStore()
  const [devReady, setDevReady] = useState(!DEV_BYPASS || !!user)

  useEffect(() => {
    if (!DEV_BYPASS || user) { setDevReady(true); return }

    fetch('/api/auth/dev-login', { method: 'POST' })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.accessToken) setAuth(data.user, data.accessToken)
        setDevReady(true)
      })
      .catch(() => setDevReady(true))
  }, [])

  // Wait for dev auto-login before rendering
  if (DEV_BYPASS && !devReady) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    )
  }

  if (DEV_BYPASS) return children

  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />

  return children
}
