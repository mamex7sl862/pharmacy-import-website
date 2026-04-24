import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../lib/api'

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,

      setAuth: (user, accessToken) => {
        // Clear RFQ store when a new user logs in to avoid data leaking between accounts
        try { localStorage.removeItem('rfq-draft') } catch (_) {}
        // Set auth synchronously so navigation and ProtectedRoute work immediately
        set({ user, accessToken })
        // Fetch full profile in the background for customers to enrich with companyName, phone, etc.
        // Admins don't have customer profiles, so skip the fetch to avoid unnecessary errors
        if (user.role === 'customer') {
          api.get('/customer/profile', {
            headers: { Authorization: `Bearer ${accessToken}` },
          }).then(({ data }) => {
            set((state) => ({
              user: { ...data, role: state.user?.role ?? user.role },
            }))
          }).catch(() => {
            // Profile fetch failing is non-fatal — user is already authenticated
          })
        }
      },

      updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),

      clearAuth: () => {
        try { localStorage.removeItem('rfq-draft') } catch (_) {}
        set({ user: null, accessToken: null })
      },
    }),
    { name: 'auth' }
  )
)

export default useAuthStore
