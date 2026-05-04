import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast, { Toaster } from 'react-hot-toast'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../lib/api'
import useAuthStore from '../store/authStore'

export default function AdminNotificationListener() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const qc = useQueryClient()

  const lastStateRef = useRef({
    chatMsgAt: {},
    latestRfqId: null,
    latestPaymentId: null,
  })

  // Invalidate all admin data so lists/dashboard refresh immediately
  const invalidateAdminData = () => {
    qc.invalidateQueries({ queryKey: ['admin-rfqs'] })
    qc.invalidateQueries({ queryKey: ['admin-rfqs-dash'] })
    qc.invalidateQueries({ queryKey: ['admin-pending-payments-dash'] })
    qc.invalidateQueries({ queryKey: ['admin-new-rfqs-count'] })
  }

  // ── Poll: unread chat messages ────────────────────────────────────────────
  const { data: sessions = [] } = useQuery({
    queryKey: ['admin-chat-notifications'],
    queryFn: () => api.get('/chat/admin/sessions').then(r => r.data),
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    enabled: !!user && user.role === 'admin',
  })

  // ── Poll: new RFQs ────────────────────────────────────────────────────────
  const { data: rfqStats } = useQuery({
    queryKey: ['admin-rfq-notifications'],
    queryFn: () => api.get('/admin/rfqs?status=NEW&limit=1').then(r => ({
      count: r.data.totalCount || 0,
      latest: r.data.items?.[0] || null,
    })),
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
    enabled: !!user && user.role === 'admin',
  })

  // ── Poll: payment proofs submitted ────────────────────────────────────────
  const { data: paymentStats } = useQuery({
    queryKey: ['admin-payment-notifications'],
    queryFn: () => api.get('/admin/rfqs?status=PAYMENT_SUBMITTED&limit=1').then(r => ({
      count: r.data.totalCount || 0,
      latest: r.data.items?.[0] || null,
    })),
    refetchInterval: 8000,
    refetchIntervalInBackground: true,
    enabled: !!user && user.role === 'admin',
  })

  // ── Chat notifications ────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessions.length) return
    sessions.forEach(s => {
      const prevAt = lastStateRef.current.chatMsgAt[s.id]
      const currAt = new Date(s.last_msg_at).getTime()
      if (prevAt && currAt > prevAt && s.unreadCount > 0) {
        if (location.pathname !== '/admin/chat') {
          toast.custom((t) => (
            <div
              className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex items-start ring-1 ring-black/5 p-4 gap-3 cursor-pointer hover:bg-gray-50 transition-colors`}
              onClick={() => { toast.dismiss(t.id); navigate('/admin/chat') }}
            >
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                {(s.customerFull || s.guest_name || 'G').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">💬 New message from {s.customerFull || s.guest_name}</p>
                <p className="mt-0.5 text-sm text-gray-500 truncate italic">"{s.lastMessage}"</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); toast.dismiss(t.id) }}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          ), { duration: 6000, position: 'top-right' })
        }
      }
      lastStateRef.current.chatMsgAt[s.id] = currAt
    })
  }, [sessions, location.pathname, navigate])

  // ── New RFQ notifications ─────────────────────────────────────────────────
  useEffect(() => {
    if (!rfqStats) return

    const prevId = lastStateRef.current.latestRfqId
    const currId = rfqStats.latest?.id ?? null

    // First load — seed ref and refresh data, no toast
    if (prevId === null) {
      lastStateRef.current.latestRfqId = currId
      invalidateAdminData()
      return
    }

    if (currId && currId !== prevId) {
      lastStateRef.current.latestRfqId = currId
      invalidateAdminData()

      if (!location.pathname.startsWith('/admin/rfqs')) {
        toast.custom((t) => (
          <div
            className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex items-start ring-1 ring-black/5 p-4 gap-3 cursor-pointer hover:bg-gray-50 transition-colors`}
            onClick={() => { toast.dismiss(t.id); navigate('/admin/rfqs') }}
          >
            <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center text-white flex-shrink-0">
              <span className="material-symbols-outlined text-sm">request_quote</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900">📋 New RFQ received</p>
              <p className="mt-0.5 text-sm text-gray-500">
                From {rfqStats.latest.customerName || 'Customer'} · {rfqStats.latest.itemCount} items
              </p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); toast.dismiss(t.id) }}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        ), { duration: 8000, position: 'top-right' })
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfqStats, location.pathname, navigate])

  // ── Payment proof notifications ───────────────────────────────────────────
  useEffect(() => {
    if (!paymentStats) return

    const prevId = lastStateRef.current.latestPaymentId
    const currId = paymentStats.latest?.id ?? null

    // First load — seed ref and refresh data, no toast
    if (prevId === null) {
      lastStateRef.current.latestPaymentId = currId
      invalidateAdminData()
      return
    }

    if (currId && currId !== prevId) {
      lastStateRef.current.latestPaymentId = currId
      invalidateAdminData()

      const isViewingRfq = location.pathname === `/admin/rfqs/${paymentStats.latest?.id}`
      if (!isViewingRfq) {
        toast.custom((t) => (
          <div
            className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex items-start ring-1 ring-black/5 p-4 gap-3 cursor-pointer hover:bg-gray-50 transition-colors`}
            onClick={() => {
              toast.dismiss(t.id)
              navigate(paymentStats.latest?.id ? `/admin/rfqs/${paymentStats.latest.id}` : '/admin/rfqs')
            }}
          >
            <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center text-white flex-shrink-0">
              <span className="material-symbols-outlined text-sm">payments</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900">💳 Payment proof submitted</p>
              <p className="mt-0.5 text-sm text-gray-500">
                {paymentStats.latest.customerName || 'Customer'} · {paymentStats.latest.rfqNumber} · awaiting approval
              </p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); toast.dismiss(t.id) }}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        ), { duration: 10000, position: 'top-right' })
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentStats, location.pathname, navigate])

  return <Toaster />
}
