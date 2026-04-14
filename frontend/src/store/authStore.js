import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../lib/api'

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,

      setAuth: async (user, accessToken) => {
        // Clear RFQ store when a new user logs in to avoid data leaking between accounts
        try { localStorage.removeItem('rfq-draft') } catch (_) {}
        // Set basic auth first so api calls work
        set({ user, accessToken })
        // Fetch full profile (includes companyName, phone, etc.)
        try {
          const { data } = await api.get('/customer/profile', {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
          set({ user: { ...user, ...data } })
        } catch (_) {}
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
