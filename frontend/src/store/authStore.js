import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,

      setAuth: (user, accessToken) => {
        // Clear RFQ store when a new user logs in to avoid data leaking between accounts
        try { localStorage.removeItem('rfq-draft') } catch (_) {}
        set({ user, accessToken })
      },
      clearAuth: () => {
        try { localStorage.removeItem('rfq-draft') } catch (_) {}
        set({ user: null, accessToken: null })
      },
    }),
    { name: 'auth' }
  )
)

export default useAuthStore
